(function (global) {
  const Rivals = (global.Rivals = global.Rivals || {});

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.noiseBuffer = null;
      this.masterGain = null;
      this.reverbNode = null;
      this.reverbGain = null;
    }

    unlock() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.noiseBuffer = this._createNoiseBuffer();

        // Master bus with dynamics compressor + subtle arena slapback reverb for punchy realistic gunshots!
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.knee.value = 12;
        comp.ratio.value = 6;
        comp.attack.value = 0.002;
        comp.release.value = 0.14;
        comp.connect(this.ctx.destination);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.92;
        this.masterGain.connect(comp);

        this.reverbNode = this.ctx.createConvolver();
        this.reverbNode.buffer = this._createImpulseResponse(0.42, 3.2);
        this.reverbGain = this.ctx.createGain();
        this.reverbGain.gain.value = 0.22;
        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.masterGain);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    _createNoiseBuffer() {
      const length = this.ctx.sampleRate * 1.2;
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      return buffer;
    }

    _createImpulseResponse(duration, decay) {
      const rate = this.ctx.sampleRate;
      const len = Math.floor(rate * duration);
      const buf = this.ctx.createBuffer(2, len, rate);
      for (let ch = 0; ch < 2; ch++) {
        const data = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) {
          const env = Math.pow(1 - i / len, decay);
          data[i] = (Math.random() * 2 - 1) * env;
        }
      }
      return buf;
    }

    _ready() {
      if (!this.enabled) return false;
      if (!this.ctx) this.unlock();
      return Boolean(this.ctx && this.ctx.state !== 'closed' && this.masterGain);
    }

    _connectOut(node, wet = 0.25) {
      node.connect(this.masterGain);
      if (wet > 0 && this.reverbNode) {
        const send = this.ctx.createGain();
        send.gain.value = wet;
        node.connect(send);
        send.connect(this.reverbNode);
      }
    }

    _noise(duration, filterFreq, gainPeak, filterType = 'bandpass', startDelay = 0, wet = 0.25, q = 1.2) {
      if (!this._ready() || !this.noiseBuffer) return;
      const now = this.ctx.currentTime + startDelay;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(filterFreq, now);
      filter.Q.value = q;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gainPeak, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

      src.connect(filter);
      filter.connect(gain);
      this._connectOut(gain, wet);
      src.start(now, Math.random() * 0.2, duration + 0.02);
    }

    _tone(type, fStart, fEnd, duration, gainPeak, startDelay = 0, wet = 0.15) {
      if (!this._ready()) return;
      const now = this.ctx.currentTime + startDelay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(fStart, now);
      if (fEnd !== fStart) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), now + duration);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gainPeak, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

      osc.connect(gain);
      this._connectOut(gain, wet);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    _shellClink(delay = 0.26) {
      // Subtle realistic brass shell casing bouncing on floor
      const f = 3200 + Math.random() * 900;
      this._tone('sine', f, f * 0.92, 0.045, 0.028, delay, 0.2);
      this._tone('sine', f * 1.15, f * 1.05, 0.035, 0.018, delay + 0.09, 0.15);
    }

    playShoot(weaponId) {
      if (!this._ready()) return;
      switch (weaponId) {
        case 'sniper':
          // Heavy .50-cal boom + supersonic crack + bolt cycle
          this._noise(0.36, 750, 0.55, 'lowpass', 0, 0.55);
          this._noise(0.09, 3600, 0.36, 'highpass', 0, 0.4);
          this._tone('sawtooth', 165, 34, 0.28, 0.42, 0, 0.45);
          this._tone('sine', 110, 28, 0.32, 0.35, 0, 0.35);
          this._noise(0.05, 2900, 0.09, 'bandpass', 0.42, 0.1);
          this._tone('square', 680, 920, 0.05, 0.05, 0.48, 0.05);
          this._shellClink(0.55);
          break;
        case 'railgun':
          this._tone('sawtooth', 1600, 120, 0.34, 0.28, 0, 0.5);
          this._tone('sine', 240, 42, 0.38, 0.38, 0, 0.45);
          this._noise(0.28, 2800, 0.34, 'bandpass', 0, 0.45);
          break;
        case 'rpg':
          // Rocket ignition thump + propellant roar
          this._noise(0.45, 520, 0.52, 'lowpass', 0, 0.45);
          this._noise(0.38, 1600, 0.26, 'bandpass', 0.02, 0.35);
          this._tone('sawtooth', 140, 45, 0.3, 0.34, 0, 0.3);
          break;
        case 'shotgun':
        case 'shorty':
          // Massive 12-gauge blast + pump rack!
          this._noise(0.28, 680, 0.58, 'lowpass', 0, 0.48);
          this._noise(0.1, 2800, 0.34, 'bandpass', 0, 0.35);
          this._tone('sawtooth', 145, 32, 0.22, 0.42, 0, 0.35);
          if (weaponId === 'shotgun') {
            this._noise(0.055, 2400, 0.12, 'bandpass', 0.28, 0.1);
            this._noise(0.06, 3000, 0.14, 'bandpass', 0.38, 0.1);
          }
          this._shellClink(0.42);
          break;
        case 'flamethrower':
          this._noise(0.14, 720, 0.28, 'bandpass', 0, 0.15, 0.7);
          this._noise(0.12, 1800, 0.14, 'highpass', 0, 0.1);
          break;
        case 'energyrifle':
        case 'energypistols':
        case 'exogun':
          this._tone('sawtooth', 980, 220, 0.11, 0.19, 0, 0.3);
          this._tone('sine', 1500, 380, 0.08, 0.14, 0, 0.25);
          this._noise(0.06, 3400, 0.12, 'highpass', 0, 0.2);
          break;
        case 'flaregun':
          this._noise(0.22, 1200, 0.32, 'bandpass', 0, 0.35);
          this._tone('triangle', 320, 95, 0.16, 0.24, 0, 0.25);
          break;
        case 'slingshot':
          this._tone('triangle', 260, 520, 0.08, 0.18, 0, 0.12);
          this._noise(0.05, 1900, 0.08, 'bandpass', 0, 0.08);
          break;
        case 'crossbow':
          this._tone('triangle', 540, 195, 0.09, 0.18, 0, 0.15);
          this._noise(0.06, 3200, 0.1, 'highpass', 0, 0.12);
          break;
        case 'bow':
          this._tone('triangle', 390, 115, 0.2, 0.24, 0, 0.2);
          this._noise(0.11, 2600, 0.13, 'bandpass', 0, 0.18);
          break;
        case 'daggers':
        case 'kunai':
          this._noise(0.09, 4400, 0.17, 'highpass', 0, 0.15);
          this._tone('sine', 1280, 520, 0.08, 0.11, 0, 0.12);
          break;
        case 'paintball':
          this._noise(0.08, 1900, 0.15, 'bandpass', 0, 0.15);
          this._tone('sine', 420, 130, 0.09, 0.24, 0, 0.12);
          break;
        case 'minigun':
          this._noise(0.06, 1750, 0.24, 'bandpass', 0, 0.22);
          this._tone('sawtooth', 230, 75, 0.055, 0.18, 0, 0.18);
          break;
        case 'revolver':
          this._noise(0.22, 1100, 0.44, 'bandpass', 0, 0.42);
          this._noise(0.07, 3600, 0.24, 'highpass', 0, 0.3);
          this._tone('sawtooth', 230, 48, 0.18, 0.34, 0, 0.35);
          break;
        case 'handgun':
          this._noise(0.12, 1750, 0.28, 'bandpass', 0, 0.28);
          this._noise(0.04, 4200, 0.16, 'highpass', 0, 0.2);
          this._tone('triangle', 310, 88, 0.1, 0.22, 0, 0.22);
          this._shellClink(0.22);
          break;
        case 'uzi':
        case 'spray':
          this._noise(0.075, 2200, 0.22, 'bandpass', 0, 0.22);
          this._tone('square', 300, 95, 0.06, 0.14, 0, 0.16);
          break;
        case 'burst':
        case 'gunblade':
          this._noise(0.11, 1600, 0.28, 'bandpass', 0, 0.3);
          this._noise(0.04, 4000, 0.18, 'highpass', 0, 0.25);
          this._tone('sawtooth', 250, 72, 0.09, 0.22, 0, 0.22);
          break;
        case 'fists':
          this._noise(0.11, 900, 0.22, 'bandpass', 0, 0.1);
          this._tone('sine', 190, 75, 0.09, 0.2, 0, 0.08);
          break;
        case 'chainsaw':
          this._tone('sawtooth', 145, 220, 0.14, 0.22, 0, 0.15);
          this._noise(0.14, 1400, 0.2, 'bandpass', 0, 0.12);
          break;
        case 'trowel':
          this._noise(0.12, 1400, 0.2, 'bandpass', 0, 0.12);
          this._tone('triangle', 320, 180, 0.09, 0.16, 0, 0.1);
          break;
        case 'katana':
        case 'scythe':
        case 'xiuchun':
        case 'knife':
          this._noise(0.14, 3000, 0.22, 'bandpass', 0, 0.15);
          this._tone('sine', 680, 210, 0.13, 0.14, 0, 0.12);
          break;
        case 'axe':
          this._noise(0.18, 1000, 0.3, 'lowpass', 0, 0.18);
          this._tone('sawtooth', 230, 80, 0.16, 0.2, 0, 0.15);
          break;
        case 'warhorn':
          // Deep heroic war horn brass blast!
          this._tone('sawtooth', 196, 194, 0.65, 0.26, 0, 0.45);
          this._tone('sawtooth', 293.6, 291, 0.65, 0.2, 0, 0.45);
          break;
        case 'medkit':
          this._noise(0.35, 2600, 0.16, 'bandpass', 0, 0.15);
          this._tone('sine', 520, 880, 0.28, 0.14, 0.05, 0.2);
          break;
        case 'freeze':
          this._noise(0.22, 4600, 0.22, 'highpass', 0, 0.3);
          this._tone('sine', 1800, 2600, 0.22, 0.16, 0, 0.3);
          break;
        case 'grenade':
        case 'satchel':
        case 'molotov':
        case 'flashbang':
        case 'smoke':
          this._noise(0.1, 1400, 0.15, 'bandpass', 0, 0.1);
          this._tone('sine', 240, 420, 0.09, 0.09, 0, 0.08);
          break;
        default: // realistic AR crack + punch + shell clink
          this._noise(0.13, 1450, 0.32, 'bandpass', 0, 0.34);
          this._noise(0.045, 4200, 0.22, 'highpass', 0, 0.28);
          this._tone('sawtooth', 220, 62, 0.1, 0.25, 0, 0.25);
          this._shellClink(0.24);
          break;
      }
    }

    playDryClick() {
      if (!this._ready()) return;
      this._tone('square', 920, 620, 0.035, 0.1, 0, 0.05);
    }

    playFootstep() {
      if (!this._ready()) return;
      this._noise(0.045, 520 + Math.random() * 220, 0.055, 'lowpass', 0, 0.06);
    }

    playDoubleJump() {
      if (!this._ready()) return;
      this._noise(0.14, 2400, 0.16, 'bandpass', 0, 0.15);
      this._tone('sine', 320, 740, 0.14, 0.12, 0, 0.15);
    }

    playUnlock() {
      if (!this._ready()) return;
      this._tone('triangle', 523, 523, 0.1, 0.18, 0, 0.25);
      this._tone('triangle', 659, 659, 0.1, 0.18, 0.09, 0.25);
      this._tone('triangle', 784, 784, 0.12, 0.18, 0.18, 0.25);
      this._tone('triangle', 1046, 1175, 0.28, 0.22, 0.28, 0.35);
    }

    playHit(isHeadshot = false) {
      if (!this._ready()) return;
      if (isHeadshot) {
        this._tone('sine', 1650, 2150, 0.09, 0.24, 0, 0.18);
        this._tone('triangle', 2480, 1900, 0.14, 0.2, 0.025, 0.18);
      } else {
        this._tone('triangle', 920, 420, 0.055, 0.15, 0, 0.08);
      }
    }

    playKill() {
      if (!this._ready()) return;
      this._tone('sine', 587, 880, 0.12, 0.2, 0, 0.25);
      this._tone('sine', 880, 1175, 0.18, 0.22, 0.08, 0.3);
    }

    playThunder() {
      if (!this._ready()) return;
      this._noise(0.65, 480, 0.52, 'lowpass', 0, 0.55);
      this._tone('sawtooth', 260, 40, 0.38, 0.3, 0, 0.45);
    }

    playJumpPad() {
      if (!this._ready()) return;
      this._tone('sine', 220, 980, 0.28, 0.2, 0, 0.22);
      this._noise(0.22, 2200, 0.14, 'bandpass', 0, 0.18);
    }

    playTrainHorn() {
      if (!this._ready()) return;
      this._tone('sawtooth', 185, 180, 0.55, 0.2, 0, 0.45);
      this._tone('sawtooth', 233, 228, 0.55, 0.18, 0, 0.45);
      this._tone('sawtooth', 185, 178, 0.45, 0.18, 0.62, 0.45);
      this._tone('sawtooth', 233, 226, 0.45, 0.16, 0.62, 0.45);
    }

    playTrainWhoosh() {
      if (!this._ready()) return;
      this._noise(0.85, 420, 0.44, 'bandpass', 0, 0.4);
      this._tone('sawtooth', 130, 52, 0.75, 0.24, 0, 0.35);
    }

    playSmokePop() {
      if (!this._ready()) return;
      this._noise(0.55, 900, 0.28, 'bandpass', 0, 0.25);
      this._tone('sine', 240, 90, 0.15, 0.12, 0, 0.15);
    }

    playReload() {
      if (!this._ready()) return;
      this._tone('square', 360, 220, 0.055, 0.12, 0, 0.1);
      this._noise(0.05, 1800, 0.09, 'highpass', 0.02, 0.1);
    }

    playReloadMagIn() {
      if (!this._ready()) return;
      this._tone('triangle', 260, 520, 0.065, 0.16, 0, 0.12);
      this._noise(0.06, 1200, 0.14, 'bandpass', 0.01, 0.12);
    }

    playReloadRack() {
      if (!this._ready()) return;
      this._noise(0.05, 2800, 0.14, 'highpass', 0, 0.12);
      this._tone('square', 580, 740, 0.05, 0.1, 0, 0.1);
      this._noise(0.06, 3200, 0.16, 'highpass', 0.09, 0.12);
      this._tone('square', 740, 920, 0.06, 0.11, 0.09, 0.1);
    }

    playInspect(isMelee = false) {
      if (!this._ready()) return;
      if (isMelee) {
        this._noise(0.14, 4200, 0.16, 'highpass', 0, 0.18);
        this._tone('sine', 1200, 2100, 0.16, 0.1, 0.03, 0.18);
      } else {
        this._tone('triangle', 420, 620, 0.07, 0.09, 0, 0.12);
        this._noise(0.06, 2400, 0.08, 'bandpass', 0.04, 0.1);
      }
    }

    playEmote(emoteId) {
      if (!this._ready()) return;
      if (emoteId === 'backflip') {
        this._noise(0.22, 2000, 0.16, 'bandpass', 0, 0.15);
        this._tone('sine', 280, 720, 0.24, 0.14, 0, 0.18);
      } else if (emoteId === 'takeL') {
        this._tone('square', 440, 440, 0.09, 0.1, 0, 0.15);
        this._tone('square', 523, 523, 0.09, 0.1, 0.14, 0.15);
        this._tone('square', 392, 392, 0.12, 0.1, 0.28, 0.15);
      } else if (emoteId === 'griddy') {
        this._tone('triangle', 220, 180, 0.08, 0.15, 0, 0.15);
        this._tone('triangle', 260, 220, 0.08, 0.15, 0.16, 0.15);
        this._tone('triangle', 330, 280, 0.1, 0.15, 0.32, 0.15);
      } else {
        this._tone('sine', 523, 784, 0.15, 0.14, 0, 0.2);
        this._tone('sine', 659, 987, 0.18, 0.14, 0.1, 0.2);
      }
    }

    playJump() {
      if (!this._ready()) return;
      this._tone('sine', 180, 340, 0.09, 0.09, 0, 0.08);
    }

    playLadderStep() {
      if (!this._ready()) return;
      this._tone('triangle', 480, 320, 0.045, 0.09, 0, 0.08);
    }

    playSlide() {
      if (!this._ready()) return;
      this._noise(0.24, 1100, 0.18, 'bandpass', 0, 0.12);
      this._tone('sine', 220, 110, 0.18, 0.08, 0, 0.08);
    }

    playDash() {
      if (!this._ready()) return;
      this._noise(0.16, 2600, 0.22, 'highpass', 0, 0.18);
      this._tone('sine', 300, 760, 0.14, 0.15, 0, 0.18);
    }

    playBounce() {
      if (!this._ready()) return;
      this._tone('triangle', 320, 160, 0.06, 0.14, 0, 0.15);
    }

    playExplosion() {
      if (!this._ready()) return;
      this._noise(0.62, 340, 0.62, 'lowpass', 0, 0.55);
      this._noise(0.24, 1800, 0.32, 'bandpass', 0, 0.4);
      this._tone('sawtooth', 120, 24, 0.48, 0.42, 0, 0.45);
    }

    playMolotovShatter() {
      if (!this._ready()) return;
      this._noise(0.16, 3800, 0.34, 'highpass', 0, 0.28);
      this._noise(0.55, 600, 0.26, 'bandpass', 0.05, 0.25);
      this._tone('triangle', 1200, 380, 0.12, 0.18, 0, 0.2);
    }

    playFlashbang() {
      if (!this._ready()) return;
      this._noise(0.14, 2400, 0.45, 'highpass', 0, 0.4);
      this._tone('sine', 3100, 2800, 0.65, 0.15, 0, 0.3);
    }

    playHurt() {
      if (!this._ready()) return;
      this._tone('sawtooth', 150, 70, 0.12, 0.18, 0, 0.1);
    }

    playBeep(high = false) {
      if (!this._ready()) return;
      this._tone('sine', high ? 880 : 520, high ? 880 : 520, high ? 0.2 : 0.1, 0.15, 0, 0.18);
    }

    playRoundEnd(won) {
      if (!this._ready()) return;
      if (won) {
        this._tone('triangle', 523, 523, 0.12, 0.18, 0, 0.3);
        this._tone('triangle', 659, 659, 0.12, 0.18, 0.12, 0.3);
        this._tone('triangle', 784, 1046, 0.28, 0.22, 0.24, 0.35);
      } else {
        this._tone('sawtooth', 340, 260, 0.16, 0.15, 0, 0.25);
        this._tone('sawtooth', 240, 150, 0.28, 0.16, 0.16, 0.25);
      }
    }
  }

  Rivals.SoundEngine = SoundEngine;
})(window);
