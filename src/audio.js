(function (global) {
  const Rivals = (global.Rivals = global.Rivals || {});

  class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.noiseBuffer = null;
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.noiseBuffer = this._createNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  _createNoiseBuffer() {
    const length = this.ctx.sampleRate * 1.0;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  _ready() {
    if (!this.enabled) return false;
    if (!this.ctx) this.unlock();
    return Boolean(this.ctx && this.ctx.state !== 'closed');
  }

  _noise(duration, filterFreq, gainPeak, filterType = 'bandpass', startDelay = 0) {
    if (!this._ready() || !this.noiseBuffer) return;
    const now = this.ctx.currentTime + startDelay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainPeak, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
    src.stop(now + duration);
  }

  _tone(type, fStart, fEnd, duration, gainPeak, startDelay = 0) {
    if (!this._ready()) return;
    const now = this.ctx.currentTime + startDelay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(fStart, now);
    if (fEnd !== fStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), now + duration);
    }
    gain.gain.setValueAtTime(gainPeak, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playShoot(weaponId) {
    if (!this._ready()) return;
    switch (weaponId) {
      case 'sniper':
        this._noise(0.28, 900, 0.42, 'lowpass');
        this._tone('sawtooth', 190, 42, 0.24, 0.32);
        this._tone('triangle', 760, 120, 0.08, 0.16);
        break;
      case 'shotgun':
      case 'shorty':
        this._noise(0.24, 720, 0.46, 'lowpass');
        this._tone('sawtooth', 165, 36, 0.22, 0.34);
        break;
      case 'paintball':
        this._noise(0.08, 1900, 0.14, 'bandpass');
        this._tone('sine', 420, 140, 0.09, 0.22);
        break;
      case 'minigun':
        this._noise(0.055, 1900, 0.18, 'bandpass');
        this._tone('sawtooth', 290, 110, 0.05, 0.14);
        break;
      case 'revolver':
        this._noise(0.18, 1200, 0.34, 'bandpass');
        this._tone('sawtooth', 260, 58, 0.16, 0.26);
        break;
      case 'handgun':
        this._noise(0.1, 1800, 0.22, 'bandpass');
        this._tone('triangle', 360, 110, 0.09, 0.18);
        break;
      case 'uzi':
        this._noise(0.065, 2200, 0.16, 'highpass');
        this._tone('square', 340, 120, 0.055, 0.12);
        break;
      case 'burst':
        this._noise(0.09, 1700, 0.22, 'bandpass');
        this._tone('triangle', 310, 95, 0.08, 0.18);
        break;
      case 'katana':
      case 'scythe':
        this._noise(0.15, 2400, 0.22, 'bandpass');
        this._tone('sine', 520, 180, 0.13, 0.14);
        break;
      case 'axe':
        this._noise(0.18, 1100, 0.28, 'lowpass');
        this._tone('sawtooth', 240, 85, 0.16, 0.18);
        break;
      case 'grenade':
      case 'molotov':
      case 'flashbang':
        this._noise(0.1, 1400, 0.14, 'bandpass');
        this._tone('sine', 240, 420, 0.09, 0.09);
        break;
      default: // ar
        this._noise(0.11, 1600, 0.24, 'bandpass');
        this._tone('sawtooth', 240, 75, 0.09, 0.18);
        break;
    }
  }

  playHit(isHeadshot = false) {
    if (!this._ready()) return;
    if (isHeadshot) {
      this._tone('sine', 1650, 2150, 0.09, 0.22);
      this._tone('triangle', 2480, 1900, 0.14, 0.18, 0.025);
    } else {
      this._tone('triangle', 920, 420, 0.055, 0.14);
    }
  }

  playKill() {
    if (!this._ready()) return;
    this._tone('sine', 587, 880, 0.12, 0.18, 0);
    this._tone('sine', 880, 1175, 0.18, 0.2, 0.08);
  }

  playReload() {
    if (!this._ready()) return;
    this._tone('square', 420, 320, 0.05, 0.08, 0);
    this._tone('square', 640, 820, 0.06, 0.09, 0.2);
  }

  playJump() {
    if (!this._ready()) return;
    this._tone('sine', 180, 340, 0.09, 0.08);
  }

  playSlide() {
    if (!this._ready()) return;
    this._noise(0.24, 1100, 0.16, 'bandpass');
    this._tone('sine', 220, 110, 0.18, 0.07);
  }

  playDash() {
    if (!this._ready()) return;
    this._noise(0.16, 2600, 0.2, 'highpass');
    this._tone('sine', 300, 760, 0.14, 0.14);
  }

  playBounce() {
    if (!this._ready()) return;
    this._tone('triangle', 320, 160, 0.06, 0.12);
  }

  playExplosion() {
    if (!this._ready()) return;
    this._noise(0.55, 360, 0.55, 'lowpass');
    this._tone('sawtooth', 120, 28, 0.45, 0.35);
  }

  playMolotovShatter() {
    if (!this._ready()) return;
    this._noise(0.16, 3600, 0.3, 'highpass');
    this._noise(0.55, 600, 0.24, 'bandpass', 0.05);
    this._tone('triangle', 1200, 380, 0.12, 0.16);
  }

  playFlashbang() {
    if (!this._ready()) return;
    this._noise(0.14, 2400, 0.42, 'highpass');
    this._tone('sine', 3100, 2800, 0.65, 0.14);
  }

  playHurt() {
    if (!this._ready()) return;
    this._tone('sawtooth', 150, 70, 0.12, 0.16);
  }

  playBeep(high = false) {
    if (!this._ready()) return;
    this._tone('sine', high ? 880 : 520, high ? 880 : 520, high ? 0.2 : 0.1, 0.15);
  }

  playRoundEnd(won) {
    if (!this._ready()) return;
    if (won) {
      this._tone('triangle', 523, 523, 0.12, 0.18, 0);
      this._tone('triangle', 659, 659, 0.12, 0.18, 0.12);
      this._tone('triangle', 784, 1046, 0.28, 0.22, 0.24);
    } else {
      this._tone('sawtooth', 340, 260, 0.16, 0.14, 0);
      this._tone('sawtooth', 240, 150, 0.28, 0.16, 0.16);
    }
  }
}

  Rivals.SoundEngine = SoundEngine;
})(window);
