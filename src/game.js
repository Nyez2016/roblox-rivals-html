(function (global) {
  const THREE = global.THREE;
  const {
    Arena,
    MAPS,
    WEAPONS,
    createWeaponMesh,
    WEAPON_SKINS,
    RIVAL_SKINS,
    KILL_EFFECTS,
    updateAnimatedWeaponSkin,
    RivalBot,
    TargetDummy,
    DIFFICULTIES,
    SoundEngine,
  } = global.Rivals;

  const WINS_TO_VICTORY = 5;
  const TDM_SCORE_LIMIT = 25;
  const ROUND_DURATION = 90;
  const TDM_DURATION = 180;
  const STORAGE_KEY = 'rivals_html_prefs_v3';
  const PAINT_COLORS = [0xff5ef7, 0x2de2ff, 0x38ef7d, 0xffd447, 0xff5a36, 0xa855f7];

  const GRAVITY_MODES = {
    auto: { id: 'auto', label: 'AUTO', scale: null, jumpBoost: 1.0 },
    normal: { id: 'normal', label: '1.0x', scale: 1.0, jumpBoost: 1.0 },
    low: { id: 'low', label: 'LOW-G', scale: 0.38, jumpBoost: 1.06 },
    antigrav: { id: 'antigrav', label: 'ZERO-G', scale: 0.22, jumpBoost: 1.2 },
  };

  class RivalsGame {
    constructor() {
      this.container = document.getElementById('game-container');
      this.sound = new SoundEngine();

      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.container.appendChild(this.renderer.domElement);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(82, window.innerWidth / window.innerHeight, 0.08, 260);
      this.scene.add(this.camera);

      this.settings = { sensitivity: 1.0, fov: 82, autoShoot: false };
      this.loadoutChoice = {
        primary: 'ar',
        secondary: 'revolver',
        melee: 'katana',
        utility: 'grenade',
        map: 'arena',
        gravity: 'auto',
        mode: 'classic',
        difficulty: 'pro',
        weaponSkin: 'default',
        rivalSkin: 'classic',
        killEffect: 'classic',
      };
      this._loadPreferences();

      this.arena = new Arena(this.scene, this.loadoutChoice.map);
      this.bot = new RivalBot(this.scene, this.arena);
      this.bot.applySkin(this.loadoutChoice.rivalSkin);
      this.enemies = [this.bot];
      this.extraEnemies = [];
      this.allies = [];
      this.playerRespawnTimer = 0;
      this.escapedRange = false;
      this.activeMatchMode = 'classic';
      this.activeMatchMap = 'arena';

      this.viewmodelRoot = new THREE.Group();
      this.camera.add(this.viewmodelRoot);
      this.weaponMesh = null;
      this.muzzleFlash = this._createMuzzleFlash();
      this.viewmodelRoot.add(this.muzzleFlash);

      this.matchActive = false;
      this.isPaused = true;
      this.wasPointerLocked = false;
      this.roundState = 'menu';
      this.playerScore = 0;
      this.botScore = 0;
      this.roundNumber = 1;
      this.roundTimer = ROUND_DURATION;
      this.stateTimer = 0;
      this.countdownLastSec = 4;

      this.stats = { kills: 0, headshots: 0, damageDealt: 0 };

      this.player = {
        pos: new THREE.Vector3(0, 0, 29),
        vel: new THREE.Vector3(),
        yaw: 0,
        pitch: 0,
        hp: 100,
        maxHp: 100,
        alive: true,
        onGround: true,
        coyoteTimer: 0,
        eyeHeight: 1.62,
        slideTimer: 0,
        slideCooldown: 0,
        slideDir: new THREE.Vector3(),
        dashCooldown: 0,
        lungeCooldown: 0,
        padCooldown: 0,
      };

      this.slots = [];
      this.activeSlot = 0;
      this.fireCooldown = 0;
      this.burstQueue = 0;
      this.burstDelay = 0;
      this.isReloading = false;
      this.reloadTimer = 0;
      this.isMouseDown = false;
      this.isAds = false;

      this.recoilPitch = 0;
      this.recoilKick = 0;
      this.slashAnim = 0;
      this.bobPhase = 0;
      this.muzzleFlashTimer = 0;
      this.hitmarkerTimer = 0;
      this.damageFlash = 0;
      this.blindFlash = 0;

      this.tracers = [];
      this.particles = [];
      this.projectiles = [];
      this.firePools = [];
      this.smokeClouds = [];
      this.killFXList = [];

      this.keys = {};
      this.raycaster = new THREE.Raycaster();
      this.clock = new THREE.Clock();

      this._cacheUI();
      this._syncMenuFromState();
      this._bindEvents();
      this._renderScorePips();
      this._animate();
    }

    _loadPreferences() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (saved.primary && WEAPONS[saved.primary]) this.loadoutChoice.primary = saved.primary;
        if (saved.secondary && WEAPONS[saved.secondary]) this.loadoutChoice.secondary = saved.secondary;
        if (saved.melee && WEAPONS[saved.melee]) this.loadoutChoice.melee = saved.melee;
        if (saved.utility && WEAPONS[saved.utility]) this.loadoutChoice.utility = saved.utility;
        if (saved.map && MAPS[saved.map]) this.loadoutChoice.map = saved.map;
        if (saved.gravity && GRAVITY_MODES[saved.gravity]) this.loadoutChoice.gravity = saved.gravity;
        if (['classic', 'assassin', 'sniper', 'randomizer', 'practice', 'range', 'twovtwo', 'tdm'].includes(saved.mode)) {
          this.loadoutChoice.mode = saved.mode;
        }
        if (saved.difficulty && DIFFICULTIES[saved.difficulty]) this.loadoutChoice.difficulty = saved.difficulty;
        if (saved.weaponSkin && WEAPON_SKINS[saved.weaponSkin]) this.loadoutChoice.weaponSkin = saved.weaponSkin;
        if (saved.rivalSkin && RIVAL_SKINS[saved.rivalSkin]) this.loadoutChoice.rivalSkin = saved.rivalSkin;
        if (saved.killEffect && KILL_EFFECTS[saved.killEffect]) this.loadoutChoice.killEffect = saved.killEffect;
        if (typeof saved.sensitivity === 'number') this.settings.sensitivity = saved.sensitivity;
        if (typeof saved.fov === 'number') this.settings.fov = saved.fov;
        if (typeof saved.autoShoot === 'boolean') this.settings.autoShoot = saved.autoShoot;
      } catch {
        // Ignore storage failures
      }
    }

    _savePreferences() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...this.loadoutChoice,
            sensitivity: this.settings.sensitivity,
            fov: this.settings.fov,
            autoShoot: this.settings.autoShoot,
          })
        );
      } catch {
        // Ignore storage failures
      }
    }

    _getActiveGravityScale() {
      const mode = GRAVITY_MODES[this.loadoutChoice.gravity] || GRAVITY_MODES.auto;
      if (mode.scale !== null) return mode.scale;
      return this.arena.getDefaultGravityScale();
    }

    _cacheUI() {
      this.ui = {
        hud: document.getElementById('hud'),
        menu: document.getElementById('menu-overlay'),
        matchEnd: document.getElementById('match-end-overlay'),
        playBtn: document.getElementById('play-btn'),
        rangeQuickBtn: document.getElementById('range-quick-btn'),
        restartBtn: document.getElementById('restart-btn'),
        exitMenuBtn: document.getElementById('exit-menu-btn'),
        rematchBtn: document.getElementById('rematch-btn'),
        loadoutBtn: document.getElementById('loadout-btn'),
        playerScore: document.getElementById('player-score'),
        botScore: document.getElementById('bot-score'),
        playerPips: document.getElementById('player-pips'),
        botPips: document.getElementById('bot-pips'),
        playerTeamName: document.getElementById('player-team-name'),
        botName: document.getElementById('bot-name'),
        mapBadge: document.getElementById('map-badge'),
        gravBadge: document.getElementById('grav-badge'),
        autoShootBadge: document.getElementById('autoshoot-badge'),
        roundLabel: document.getElementById('round-label'),
        roundTimer: document.getElementById('round-timer'),
        hpValue: document.getElementById('hp-value'),
        hpFill: document.getElementById('hp-bar-fill'),
        slideFill: document.getElementById('slide-cd-fill'),
        dashFill: document.getElementById('dash-cd-fill'),
        weaponName: document.getElementById('weapon-name-hud'),
        ammoCurrent: document.getElementById('ammo-current'),
        ammoReserve: document.getElementById('ammo-reserve'),
        reloadInd: document.getElementById('reload-indicator'),
        crosshair: document.getElementById('crosshair'),
        hitmarker: document.getElementById('hitmarker'),
        scopeOverlay: document.getElementById('scope-overlay'),
        damageVignette: document.getElementById('damage-vignette'),
        slideLines: document.getElementById('slide-lines'),
        flashOverlay: document.getElementById('flash-overlay'),
        centerBanner: document.getElementById('center-banner'),
        bannerTitle: document.getElementById('banner-title'),
        bannerSub: document.getElementById('banner-sub'),
        killFeed: document.getElementById('kill-feed'),
        damageNumbers: document.getElementById('damage-numbers'),
        endBadge: document.getElementById('end-badge'),
        endScore: document.getElementById('end-score'),
        endStats: document.getElementById('end-stats'),
        hotbarSlots: Array.from(document.querySelectorAll('.hotbar-slot')),
        slotNames: [
          document.getElementById('slot-0-name'),
          document.getElementById('slot-1-name'),
          document.getElementById('slot-2-name'),
          document.getElementById('slot-3-name'),
        ],
        sensSlider: document.getElementById('sens-slider'),
        sensVal: document.getElementById('sens-val'),
        fovSlider: document.getElementById('fov-slider'),
        fovVal: document.getElementById('fov-val'),
        soundToggle: document.getElementById('sound-toggle'),
        autoShootToggle: document.getElementById('autoshoot-toggle'),
      };
    }

    _syncMenuFromState() {
      const syncGroup = (category, attr, val) => {
        const group = document.querySelector(`[data-category="${category}"]`);
        if (!group) return;
        group.querySelectorAll('.choice-btn').forEach((btn) => {
          btn.classList.toggle('active', btn.dataset[attr] === val);
        });
      };
      syncGroup('primary', 'weapon', this.loadoutChoice.primary);
      syncGroup('secondary', 'weapon', this.loadoutChoice.secondary);
      syncGroup('melee', 'weapon', this.loadoutChoice.melee);
      syncGroup('utility', 'weapon', this.loadoutChoice.utility);
      syncGroup('map', 'map', this.loadoutChoice.map);
      syncGroup('gravity', 'grav', this.loadoutChoice.gravity);
      syncGroup('mode', 'mode', this.loadoutChoice.mode);
      syncGroup('difficulty', 'diff', this.loadoutChoice.difficulty);
      syncGroup('weaponSkin', 'skin', this.loadoutChoice.weaponSkin);
      syncGroup('rivalSkin', 'rskin', this.loadoutChoice.rivalSkin);
      syncGroup('killEffect', 'kfx', this.loadoutChoice.killEffect);

      this.ui.sensSlider.value = String(this.settings.sensitivity);
      this.ui.sensVal.textContent = this.settings.sensitivity.toFixed(1);
      this.ui.fovSlider.value = String(this.settings.fov);
      this.ui.fovVal.textContent = String(this.settings.fov);
      if (this.ui.autoShootToggle) this.ui.autoShootToggle.checked = this.settings.autoShoot;
      this._updateAutoShootBadge();
    }

    _createMuzzleFlash() {
      const geo = new THREE.OctahedronGeometry(0.08, 0);
      const mat = new THREE.MeshBasicMaterial({ color: 0xfff3a0, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      return mesh;
    }

    _bindEvents() {
      window.addEventListener('resize', () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      });

      document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.tab;
          document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
          document.querySelectorAll('.tab-panel').forEach((p) => {
            p.classList.toggle('hidden', p.id !== `tab-${target}`);
          });
        });
      });

      document.querySelectorAll('[data-category]').forEach((group) => {
        const cat = group.dataset.category;
        group.querySelectorAll('.choice-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            group.querySelectorAll('.choice-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');

            if (cat === 'primary') this.loadoutChoice.primary = btn.dataset.weapon;
            if (cat === 'secondary') this.loadoutChoice.secondary = btn.dataset.weapon;
            if (cat === 'melee') this.loadoutChoice.melee = btn.dataset.weapon;
            if (cat === 'utility') this.loadoutChoice.utility = btn.dataset.weapon;
            if (cat === 'gravity') this.loadoutChoice.gravity = btn.dataset.grav;
            if (cat === 'mode') {
              this.loadoutChoice.mode = btn.dataset.mode;
              if (btn.dataset.mode === 'range') {
                this.loadoutChoice.map = 'shootingrange';
                this._syncMenuFromState();
                if (!this.matchActive) {
                  this.arena.loadMap('shootingrange');
                  this.bot.refreshWaypoints();
                }
              }
            }
            if (cat === 'difficulty') this.loadoutChoice.difficulty = btn.dataset.diff;
            if (cat === 'killEffect') this.loadoutChoice.killEffect = btn.dataset.kfx;

            if (cat === 'map') {
              this.loadoutChoice.map = btn.dataset.map;
              if (!this.matchActive) {
                this.arena.loadMap(this.loadoutChoice.map);
                this.bot.refreshWaypoints();
              }
            }

            if (cat === 'weaponSkin') {
              this.loadoutChoice.weaponSkin = btn.dataset.skin;
              if (this.matchActive && this.slots.length > 0) {
                this.switchWeapon(this.activeSlot, true);
              }
            }

            if (cat === 'rivalSkin') {
              this.loadoutChoice.rivalSkin = btn.dataset.rskin;
              this.bot.applySkin(this.loadoutChoice.rivalSkin);
              for (const ex of this.extraEnemies) {
                if (!ex.isDummy && ex.applySkin) ex.applySkin(this.loadoutChoice.rivalSkin);
              }
            }

            this._savePreferences();
          });
        });
      });

      this.ui.sensSlider.addEventListener('input', (e) => {
        this.settings.sensitivity = parseFloat(e.target.value);
        this.ui.sensVal.textContent = this.settings.sensitivity.toFixed(1);
        this._savePreferences();
      });
      this.ui.fovSlider.addEventListener('input', (e) => {
        this.settings.fov = parseInt(e.target.value, 10);
        this.ui.fovVal.textContent = String(this.settings.fov);
        this._savePreferences();
      });
      this.ui.soundToggle.addEventListener('change', (e) => {
        this.sound.enabled = e.target.checked;
      });
      if (this.ui.autoShootToggle) {
        this.ui.autoShootToggle.addEventListener('change', (e) => {
          this.settings.autoShoot = e.target.checked;
          this._updateAutoShootBadge();
          this._savePreferences();
        });
      }

      this.ui.playBtn.addEventListener('click', () => {
        this.sound.unlock();
        if (
          !this.matchActive ||
          this.loadoutChoice.mode !== this.activeMatchMode ||
          this.loadoutChoice.map !== this.activeMatchMap
        ) {
          this.startNewMatch();
        } else {
          this.isPaused = false;
          this.ui.menu.classList.add('hidden');
          this.ui.hud.classList.remove('hidden');
          if (this.loadoutChoice.mode === 'range') {
            this._buildLoadoutSlots();
          }
          this._updateGravityBadge();
          this._requestPointerLock();
        }
      });

      if (this.ui.exitMenuBtn) {
        this.ui.exitMenuBtn.addEventListener('click', () => {
          this._exitToMainMenu();
        });
      }

      if (this.ui.rangeQuickBtn) {
        this.ui.rangeQuickBtn.addEventListener('click', () => {
          this.sound.unlock();
          this.loadoutChoice.mode = 'range';
          this.loadoutChoice.map = 'shootingrange';
          this._syncMenuFromState();
          this._savePreferences();
          this.startNewMatch();
        });
      }

      this.ui.restartBtn.addEventListener('click', () => {
        this.sound.unlock();
        this.startNewMatch();
      });

      this.ui.rematchBtn.addEventListener('click', () => {
        this.sound.unlock();
        this.ui.matchEnd.classList.add('hidden');
        this.startNewMatch();
      });

      this.ui.loadoutBtn.addEventListener('click', () => {
        this.ui.matchEnd.classList.add('hidden');
        this.matchActive = false;
        this.isPaused = true;
        this.ui.playBtn.textContent = 'ENTER ARENA';
        this.ui.restartBtn.classList.add('hidden');
        this.ui.menu.classList.remove('hidden');
      });

      document.addEventListener('pointerlockchange', () => {
        const locked = document.pointerLockElement === this.renderer.domElement;
        if (locked) {
          this.wasPointerLocked = true;
        } else if (this.wasPointerLocked && this.matchActive && this.roundState !== 'match_over') {
          this.wasPointerLocked = false;
          this._openPauseMenu();
        }
      });

      window.addEventListener('keydown', (e) => {
        const code = e.code;
        if (code === 'Escape' && this.matchActive && !this.isPaused && this.roundState !== 'match_over') {
          this._openPauseMenu();
          return;
        }
        if (['Space', 'Tab'].includes(code) && !this.isPaused) {
          e.preventDefault();
        }
        this.keys[code] = true;

        if (this.isPaused || !this.matchActive) return;
        if (code === 'Digit1') this.switchWeapon(0);
        if (code === 'Digit2') this.switchWeapon(1);
        if (code === 'Digit3') this.switchWeapon(2);
        if (code === 'Digit4') this.switchWeapon(3);
        if (code === 'KeyR') this.startReload();
        if (code === 'KeyF') {
          this.settings.autoShoot = !this.settings.autoShoot;
          if (this.ui.autoShootToggle) this.ui.autoShootToggle.checked = this.settings.autoShoot;
          this._updateAutoShootBadge();
          this._savePreferences();
          this._pushKillFeed(`AUTO SHOOT: ${this.settings.autoShoot ? 'ON' : 'OFF'}`);
        }
        if (code === 'KeyE' || code === 'KeyQ') this._tryDash();
        if (code === 'ShiftLeft' || code === 'KeyC') this._trySlide();
      });

      window.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
      });

      window.addEventListener('mousemove', (e) => {
        if (this.isPaused || !this.matchActive) return;
        const locked = document.pointerLockElement === this.renderer.domElement;
        if (!locked && e.buttons === 0) return;
        const mult = this.isAds && this._currentWeapon().scoped ? 0.35 : this.isAds ? 0.68 : 1.0;
        const sens = 0.0021 * this.settings.sensitivity * mult;
        this.player.yaw -= e.movementX * sens;
        this.player.pitch -= e.movementY * sens;
        this.player.pitch = Math.max(-Math.PI / 2 + 0.04, Math.min(Math.PI / 2 - 0.04, this.player.pitch));
      });

      window.addEventListener('mousedown', (e) => {
        if (this.isPaused || !this.matchActive) return;
        if (document.pointerLockElement !== this.renderer.domElement) {
          this._requestPointerLock();
        }
        if (e.button === 0) {
          this.isMouseDown = true;
          this._tryFire(true);
        } else if (e.button === 2) {
          if (this._currentWeapon().slotType === 'melee') {
            this._tryMeleeLunge();
          } else {
            this.isAds = true;
          }
        }
      });

      window.addEventListener('mouseup', (e) => {
        if (e.button === 0) this.isMouseDown = false;
        if (e.button === 2) this.isAds = false;
      });

      window.addEventListener('contextmenu', (e) => e.preventDefault());

      window.addEventListener('wheel', (e) => {
        if (this.isPaused || !this.matchActive) return;
        const dir = e.deltaY > 0 ? 1 : -1;
        const next = (this.activeSlot + dir + this.slots.length) % this.slots.length;
        this.switchWeapon(next);
      });
    }

    _openPauseMenu() {
      this.isPaused = true;
      this.isMouseDown = false;
      this.isAds = false;
      this.ui.playBtn.textContent = 'RESUME';
      this.ui.restartBtn.classList.remove('hidden');
      if (this.ui.exitMenuBtn) this.ui.exitMenuBtn.classList.remove('hidden');
      this.ui.menu.classList.remove('hidden');
    }

    _exitToMainMenu() {
      this.matchActive = false;
      this.isPaused = true;
      this.roundState = 'menu';
      this.isMouseDown = false;
      this.isAds = false;
      if (document.pointerLockElement) document.exitPointerLock();
      this._clearRoundEntities();
      this._clearExtraEnemies();
      this.ui.hud.classList.add('hidden');
      this.ui.centerBanner.classList.add('hidden');
      this.ui.matchEnd.classList.add('hidden');
      this.ui.playBtn.textContent = 'ENTER ARENA';
      this.ui.restartBtn.classList.add('hidden');
      if (this.ui.exitMenuBtn) this.ui.exitMenuBtn.classList.add('hidden');
      this.ui.menu.classList.remove('hidden');
    }

    _requestPointerLock() {
      try {
        if (this.renderer.domElement.requestPointerLock) {
          const res = this.renderer.domElement.requestPointerLock();
          if (res && typeof res.catch === 'function') res.catch(() => {});
        }
      } catch {
        // Ignore pointer lock rejection
      }
    }

    _updateGravityBadge() {
      const g = this._getActiveGravityScale();
      if (g < 0.9) {
        this.ui.gravBadge.textContent = g <= 0.25 ? 'ZERO-G' : `${g.toFixed(2)}G`;
        this.ui.gravBadge.classList.remove('hidden');
      } else {
        this.ui.gravBadge.classList.add('hidden');
      }
    }

    _updateAutoShootBadge() {
      if (this.ui.autoShootBadge) {
        this.ui.autoShootBadge.classList.toggle('hidden', !this.settings.autoShoot);
      }
      if (!this.settings.autoShoot && this.ui.crosshair) {
        this.ui.crosshair.classList.remove('locked');
      }
    }

    _updateAutoShoot() {
      if (!this.settings.autoShoot || this.roundState !== 'playing' || !this.player.alive) {
        this.ui.crosshair.classList.remove('locked');
        return;
      }

      const w = this._currentWeapon();
      // Do not auto-throw utility grenades/smoke
      if (w.slotType === 'utility') {
        this.ui.crosshair.classList.remove('locked');
        return;
      }

      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      this.raycaster.set(this.camera.position, dir);
      this.raycaster.far = w.range;

      const botHits = this.raycaster.intersectObjects(this._getAllEnemyHitMeshes(), false);
      if (botHits.length === 0) {
        this.ui.crosshair.classList.remove('locked');
        return;
      }

      const mapHits = this.raycaster.intersectObjects(this.arena.meshes, false);
      const mapDist = mapHits.length > 0 ? mapHits[0].distance : w.range;

      if (botHits[0].distance < mapDist) {
        this.ui.crosshair.classList.add('locked');
        this._tryFire(true);
      } else {
        this.ui.crosshair.classList.remove('locked');
      }
    }

    startNewMatch() {
      this.matchActive = true;
      this.isPaused = false;
      this.activeMatchMode = this.loadoutChoice.mode;
      this.activeMatchMap = this.loadoutChoice.map;
      this.escapedRange = false;
      this.playerScore = 0;
      this.botScore = 0;
      this.roundNumber = 1;
      this.stats = { kills: 0, headshots: 0, damageDealt: 0 };

      if (this.arena.mapId !== this.loadoutChoice.map) {
        this.arena.loadMap(this.loadoutChoice.map);
      }

      this.ui.menu.classList.add('hidden');
      this.ui.matchEnd.classList.add('hidden');
      this.ui.hud.classList.remove('hidden');
      if (this.ui.playerTeamName) {
        this.ui.playerTeamName.textContent =
          this.loadoutChoice.mode === 'tdm'
            ? 'BLUE TEAM'
            : this.loadoutChoice.mode === 'twovtwo'
            ? 'BLUE (2v2)'
            : 'YOU';
      }
      this.ui.botName.textContent =
        this.loadoutChoice.mode === 'range'
          ? 'DUMMIES'
          : this.loadoutChoice.mode === 'practice'
          ? 'PRACTICE NPCs'
          : this.loadoutChoice.mode === 'tdm'
          ? 'RED TEAM'
          : this.loadoutChoice.mode === 'twovtwo'
          ? 'RED (2v2)'
          : DIFFICULTIES[this.loadoutChoice.difficulty].name;
      this.ui.mapBadge.textContent = MAPS[this.arena.mapId].name;
      this.ui.killFeed.innerHTML = '';

      this._startRound();
      this._requestPointerLock();
    }

    _clearExtraEnemies() {
      for (const ex of this.extraEnemies) {
        if (ex.dispose) ex.dispose();
      }
      this.extraEnemies = [];
      for (const al of this.allies) {
        if (al.dispose) al.dispose();
      }
      this.allies = [];
    }

    _getAllEnemyHitMeshes() {
      const meshes = [];
      for (const enemy of this.enemies) {
        const list = enemy.getHitMeshes();
        for (let i = 0; i < list.length; i++) meshes.push(list[i]);
      }
      return meshes;
    }

    _getAliveEnemyCount() {
      let n = 0;
      for (const e of this.enemies) if (e.alive) n++;
      return n;
    }

    _getAliveAllyCount() {
      let n = 0;
      for (const a of this.allies) if (a.alive) n++;
      return n;
    }

    _setupEnemiesForRound(spawns) {
      this._clearExtraEnemies();

      if (this.loadoutChoice.mode === 'range') {
        this.bot.alive = false;
        this.bot.setVisible(false);

        const configs =
          this.arena.mapId === 'shootingrange'
            ? [
                { pos: new THREE.Vector3(-8, 0, 10), label: 'CLOSE DUMMY' },
                { pos: new THREE.Vector3(8, 0, 8), label: 'CQC DUMMY' },
                { pos: new THREE.Vector3(0, 0, -2), moveAxis: 'x', moveRange: 7.5, moveSpeed: 1.6, phase: 0, label: 'STRAFE DUMMY' },
                { pos: new THREE.Vector3(-12, 0, -14), moveAxis: 'x', moveRange: 5.5, moveSpeed: 2.2, phase: 1.4, label: 'FAST DUMMY' },
                { pos: new THREE.Vector3(12, 0, -16), label: 'MID-LONG DUMMY' },
                { pos: new THREE.Vector3(0, 3.4, -28), moveAxis: 'x', moveRange: 10, moveSpeed: 1.4, phase: 2.6, label: 'SNIPER GALLERY' },
                // Secret Outside Golden Boss Dummy on the outer parkour tower!
                { pos: new THREE.Vector3(0, 12.6, -56), hp: 500, moveAxis: 'x', moveRange: 4.5, moveSpeed: 1.8, phase: 0, label: 'SECRET BOSS DUMMY' },
              ]
            : this.arena.getWaypoints().slice(0, 6).map((wp, idx) => ({
                pos: wp.clone(),
                moveAxis: idx % 2 === 1 ? 'x' : null,
                moveRange: idx % 2 === 1 ? 4.5 : 0,
                moveSpeed: 1.8,
                phase: idx * 1.1,
                label: `DUMMY #${idx + 1}`,
              }));

        this.extraEnemies = configs.map((cfg) => new TargetDummy(this.scene, cfg));
        this.enemies = [...this.extraEnemies];
      } else if (this.loadoutChoice.mode === 'practice') {
        const wps = this.arena.getWaypoints();
        const s0 = spawns.bot.clone();
        const s1 = (wps[1] || spawns.bot).clone();
        const s2 = (wps[2] || spawns.bot).clone();
        s1.x = Math.min(20, Math.max(-20, s1.x - 4));
        s2.x = Math.min(20, Math.max(-20, s2.x + 4));

        this.bot.team = 'red';
        this.bot.name = 'PRACTICE NPC';
        this.bot.passive = true;
        this.bot.reset(s0, this.loadoutChoice.difficulty, this.loadoutChoice.rivalSkin);

        const npc2 = new RivalBot(this.scene, this.arena);
        npc2.team = 'red';
        npc2.name = 'PRACTICE NPC';
        npc2.passive = true;
        npc2.reset(s1, this.loadoutChoice.difficulty, this.loadoutChoice.rivalSkin);

        const npc3 = new RivalBot(this.scene, this.arena);
        npc3.team = 'red';
        npc3.name = 'PRACTICE NPC';
        npc3.passive = true;
        npc3.reset(s2, this.loadoutChoice.difficulty, this.loadoutChoice.rivalSkin);

        this.extraEnemies = [npc2, npc3];
        this.enemies = [this.bot, npc2, npc3];
      } else if (this.loadoutChoice.mode === 'twovtwo') {
        // 2v2: YOU + 1 Blue Ally vs 2 Red Rivals
        const allySpawn = spawns.player.clone();
        allySpawn.x -= 3.6;
        const ally1 = new RivalBot(this.scene, this.arena);
        ally1.team = 'blue';
        ally1.name = 'ALLY';
        ally1.passive = false;
        ally1.reset(allySpawn, this.loadoutChoice.difficulty, 'ally');
        this.allies = [ally1];

        const r1Spawn = spawns.bot.clone();
        r1Spawn.x -= 3.5;
        this.bot.team = 'red';
        this.bot.name = 'RIVAL 1';
        this.bot.passive = false;
        this.bot.reset(r1Spawn, this.loadoutChoice.difficulty, this.loadoutChoice.rivalSkin);

        const r2Spawn = spawns.bot.clone();
        r2Spawn.x += 3.5;
        const red2 = new RivalBot(this.scene, this.arena);
        red2.team = 'red';
        red2.name = 'RIVAL 2';
        red2.passive = false;
        red2.reset(r2Spawn, this.loadoutChoice.difficulty, this.loadoutChoice.rivalSkin);

        this.extraEnemies = [red2];
        this.enemies = [this.bot, red2];
      } else if (this.loadoutChoice.mode === 'tdm') {
        // 3v3 Team Deathmatch: YOU + 2 Blue Allies vs 3 Red Rivals (First to 25!)
        const a1Pos = spawns.player.clone();
        a1Pos.x -= 4.2;
        const a2Pos = spawns.player.clone();
        a2Pos.x += 4.2;

        const ally1 = new RivalBot(this.scene, this.arena);
        ally1.team = 'blue';
        ally1.name = 'BLUE ALLY 1';
        ally1.passive = false;
        ally1.reset(a1Pos, this.loadoutChoice.difficulty, 'ally');

        const ally2 = new RivalBot(this.scene, this.arena);
        ally2.team = 'blue';
        ally2.name = 'BLUE ALLY 2';
        ally2.passive = false;
        ally2.reset(a2Pos, this.loadoutChoice.difficulty, 'ally');
        this.allies = [ally1, ally2];

        const r1Pos = spawns.bot.clone();
        r1Pos.x -= 4.5;
        const r2Pos = spawns.bot.clone();
        const r3Pos = spawns.bot.clone();
        r3Pos.x += 4.5;

        this.bot.team = 'red';
        this.bot.name = 'RED RIVAL 1';
        this.bot.passive = false;
        this.bot.reset(r1Pos, this.loadoutChoice.difficulty, this.loadoutChoice.rivalSkin);

        const red2 = new RivalBot(this.scene, this.arena);
        red2.team = 'red';
        red2.name = 'RED RIVAL 2';
        red2.passive = false;
        red2.reset(r2Pos, this.loadoutChoice.difficulty, this.loadoutChoice.rivalSkin);

        const red3 = new RivalBot(this.scene, this.arena);
        red3.team = 'red';
        red3.name = 'RED RIVAL 3';
        red3.passive = false;
        red3.reset(r3Pos, this.loadoutChoice.difficulty, this.loadoutChoice.rivalSkin);

        this.extraEnemies = [red2, red3];
        this.enemies = [this.bot, red2, red3];
      } else {
        this.bot.team = 'red';
        this.bot.name = 'RIVAL';
        this.bot.passive = false;
        const botSpawn = spawns.bot.clone();
        botSpawn.x += (Math.random() - 0.5) * 4;
        this.bot.reset(botSpawn, this.loadoutChoice.difficulty, this.loadoutChoice.rivalSkin);
        this.enemies = [this.bot];
      }
    }

    _pickRandomBySlot(slotType) {
      const list = Object.values(WEAPONS).filter((w) => w.slotType === slotType);
      return list[Math.floor(Math.random() * list.length)].id;
    }

    _buildLoadoutSlots() {
      let ids;
      if (this.loadoutChoice.mode === 'assassin') {
        ids = ['crossbow', 'kunai', 'hiddenblade', 'smoke'];
      } else if (this.loadoutChoice.mode === 'sniper') {
        ids = ['sniper', 'revolver', 'katana', 'flashbang'];
      } else if (this.loadoutChoice.mode === 'randomizer') {
        ids = [
          this._pickRandomBySlot('primary'),
          this._pickRandomBySlot('secondary'),
          this._pickRandomBySlot('melee'),
          this._pickRandomBySlot('utility'),
        ];
      } else {
        ids = [
          this.loadoutChoice.primary,
          this.loadoutChoice.secondary,
          this.loadoutChoice.melee,
          this.loadoutChoice.utility,
        ];
      }

      this.slots = ids.map((id) => {
        const def = WEAPONS[id] || WEAPONS.ar;
        return {
          def,
          ammo: def.magSize,
          reserve: def.reserveMax,
        };
      });
      this.slots.forEach((slot, i) => {
        if (this.ui.slotNames[i]) {
          this.ui.slotNames[i].textContent = slot.def.name;
        }
      });
      this.switchWeapon(0, true);
    }

    _clearRoundEntities() {
      for (const pr of this.projectiles) this.scene.remove(pr.mesh);
      this.projectiles = [];
      for (const fp of this.firePools) {
        this.scene.remove(fp.mesh);
        fp.mesh.geometry.dispose();
        fp.mesh.material.dispose();
      }
      this.firePools = [];
      for (const sm of this.smokeClouds) {
        this.scene.remove(sm.group);
      }
      this.smokeClouds = [];
      for (const fx of this.killFXList) {
        this.scene.remove(fx.obj);
      }
      this.killFXList = [];
    }

    _startRound() {
      if (this.arena.mapId !== this.loadoutChoice.map) {
        this.arena.loadMap(this.loadoutChoice.map);
        this.ui.mapBadge.textContent = MAPS[this.arena.mapId].name;
      }

      this.roundState = 'countdown';
      this.stateTimer = 2.6;
      this.countdownLastSec = 4;
      this.roundTimer = this.loadoutChoice.mode === 'tdm' ? TDM_DURATION : ROUND_DURATION;
      this.playerRespawnTimer = 0;
      this.isReloading = false;
      this.isAds = false;
      this.burstQueue = 0;
      this.blindFlash = 0;
      this.ui.flashOverlay.style.opacity = '0';

      this._clearRoundEntities();
      this._updateGravityBadge();

      const spawns = this.arena.getSpawns();
      this.player.pos.copy(spawns.player);
      this.player.pos.x += (Math.random() - 0.5) * 4;
      this.player.vel.set(0, 0, 0);
      this.player.yaw = 0;
      this.player.pitch = 0;
      this.player.hp = this.player.maxHp;
      this.player.alive = true;
      this.player.slideTimer = 0;
      this.player.slideCooldown = 0;
      this.player.dashCooldown = 0;
      this.player.lungeCooldown = 0;
      this.player.padCooldown = 0;

      this._setupEnemiesForRound(spawns);
      this._buildLoadoutSlots();
      this._renderScorePips();
      this._updateHUD();

      if (this.loadoutChoice.mode === 'range') {
        this.roundState = 'playing';
        this._showBanner('SHOOTING RANGE', 'TEST ALL WEAPONS & SKINS · ESC TO SWAP', false);
        setTimeout(() => {
          if (this.roundState === 'playing' && this.loadoutChoice.mode === 'range') {
            this.ui.centerBanner.classList.add('hidden');
          }
        }, 1600);
        return;
      }

      const modeTag =
        this.loadoutChoice.mode === 'assassin'
          ? 'ANCIENT ASSASSIN'
          : this.loadoutChoice.mode === 'sniper'
          ? 'SNIPER ONLY'
          : this.loadoutChoice.mode === 'randomizer'
          ? 'RANDOMIZER'
          : this.loadoutChoice.mode === 'practice'
          ? 'PRACTICE ROUND (3 MOVING NPCs)'
          : this.loadoutChoice.mode === 'twovtwo'
          ? '2v2 TEAM DUEL'
          : this.loadoutChoice.mode === 'tdm'
          ? '3v3 TEAM DEATHMATCH · FIRST TO 25'
          : MAPS[this.arena.mapId].name;
      const titleTag = this.loadoutChoice.mode === 'tdm' ? 'TEAM DEATHMATCH' : `ROUND ${this.roundNumber}`;
      this._showBanner(titleTag, `${modeTag} — FIGHT IN 3...`, false);
    }

    _respawnPlayerTDM() {
      const spawns = this.arena.getSpawns();
      this.player.pos.copy(spawns.player);
      this.player.pos.x += (Math.random() - 0.5) * 5;
      this.player.vel.set(0, 0, 0);
      this.player.yaw = 0;
      this.player.pitch = 0;
      this.player.hp = this.player.maxHp;
      this.player.alive = true;
      this.isReloading = false;
      this._buildLoadoutSlots();
      this.ui.centerBanner.classList.add('hidden');
      this._updateHUD();
    }

    _currentSlot() {
      return this.slots[this.activeSlot];
    }

    _currentWeapon() {
      return this.slots[this.activeSlot]?.def || WEAPONS.ar;
    }

    _getTracerColor(weaponDef) {
      if (weaponDef.paintSplat) {
        return PAINT_COLORS[Math.floor(Math.random() * PAINT_COLORS.length)];
      }
      const skin = WEAPON_SKINS[this.loadoutChoice.weaponSkin];
      if (skin && skin.animated) {
        const c = new THREE.Color();
        c.setHSL((performance.now() * 0.0004) % 1, 1.0, 0.58);
        return c.getHex();
      }
      if (skin && skin.tracerColor) return skin.tracerColor;
      return weaponDef.tracerColor;
    }

    switchWeapon(index, force = false) {
      if (!this.slots[index]) return;
      if (!force && index === this.activeSlot) return;

      this.activeSlot = index;
      this.isReloading = false;
      this.isAds = false;
      this.burstQueue = 0;
      this.fireCooldown = 0.14;

      if (this.weaponMesh) {
        this.viewmodelRoot.remove(this.weaponMesh);
      }
      this.weaponMesh = createWeaponMesh(this._currentWeapon().id, this.loadoutChoice.weaponSkin);
      this.viewmodelRoot.add(this.weaponMesh);

      this.ui.hotbarSlots.forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
      this._updateHUD();
    }

    startReload() {
      const slot = this._currentSlot();
      if (!slot || this.isReloading) return;
      if (slot.def.reloadTime <= 0 || slot.ammo >= slot.def.magSize || slot.reserve <= 0) return;

      this.isReloading = true;
      this.isAds = false;
      this.reloadTimer = slot.def.reloadTime;
      this.sound.playReload();
      this._updateHUD();
    }

    _trySlide() {
      if (this.roundState !== 'playing' || !this.player.alive) return;
      if (this.player.slideCooldown > 0 || !this.player.onGround) return;

      const dir = this._getMoveInputDir();
      if (dir.lengthSq() < 0.01) {
        dir.set(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
      }
      dir.normalize();
      this.player.slideDir.copy(dir);
      this.player.slideTimer = 0.42;
      this.player.slideCooldown = 1.6;
      this.player.vel.x = dir.x * 16.5;
      this.player.vel.z = dir.z * 16.5;
      this.sound.playSlide();
    }

    _tryDash() {
      if (this.roundState !== 'playing' || !this.player.alive) return;
      if (this.player.dashCooldown > 0) return;

      const dir = this._getMoveInputDir();
      if (dir.lengthSq() < 0.01) {
        dir.set(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
      }
      dir.normalize();
      const g = this._getActiveGravityScale();
      this.player.vel.x = dir.x * 19.5;
      this.player.vel.z = dir.z * 19.5;
      this.player.vel.y = Math.max(this.player.vel.y, g < 0.6 ? 3.2 : 4.2);
      this.player.onGround = false;
      this.player.dashCooldown = 3.2;
      this.sound.playDash();
    }

    _tryMeleeLunge() {
      if (this.roundState !== 'playing' || !this.player.alive) return;
      if (this.player.lungeCooldown > 0) return;

      const w = this._currentWeapon();
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      this.player.vel.x = forward.x * (w.lungePower || 18.5);
      this.player.vel.z = forward.z * (w.lungePower || 18.5);
      this.player.vel.y = Math.max(w.lungeLift || 4.5, forward.y * 8 + 3.2);
      this.player.onGround = false;
      this.player.lungeCooldown = 2.2;
      this.sound.playDash();
      this._performMeleeSlash(true);
    }

    _getMoveInputDir() {
      const forward = new THREE.Vector3(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
      const right = new THREE.Vector3(Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw));
      const dir = new THREE.Vector3();
      if (this.keys['KeyW']) dir.add(forward);
      if (this.keys['KeyS']) dir.sub(forward);
      if (this.keys['KeyD']) dir.add(right);
      if (this.keys['KeyA']) dir.sub(right);
      return dir;
    }

    _tryFire(isInitialClick) {
      if (this.roundState !== 'playing' || !this.player.alive) return;
      if (this.isReloading || this.fireCooldown > 0) return;

      const slot = this._currentSlot();
      const w = slot.def;
      if (!isInitialClick && !w.auto) return;

      if (w.slotType === 'melee') {
        this.fireCooldown = 1 / w.fireRate;
        this._performMeleeSlash(false);
        return;
      }

      if (w.slotType === 'utility') {
        if (slot.ammo <= 0) return;
        if (this.loadoutChoice.mode !== 'range') slot.ammo -= 1;
        this.fireCooldown = 1 / w.fireRate;
        this._throwUtility(w);
        this._updateHUD();
        return;
      }

      if (slot.ammo <= 0) {
        this.startReload();
        return;
      }

      if (w.burstCount > 1) {
        this.burstQueue = Math.min(w.burstCount, slot.ammo) - 1;
        this.burstDelay = w.burstInterval;
      }
      this.fireCooldown = 1 / w.fireRate;
      this._fireBullet();
    }

    _fireBullet() {
      const slot = this._currentSlot();
      const w = slot.def;
      if (slot.ammo <= 0) return;

      slot.ammo -= 1;
      this.sound.playShoot(w.id);

      this.recoilPitch = Math.min(0.14, this.recoilPitch + w.recoil);
      this.recoilKick = Math.min(0.16, this.recoilKick + w.recoil * 1.6 + 0.03);
      if (!w.silent) this.muzzleFlashTimer = 0.045;
      this.ui.crosshair.classList.add('spread');
      setTimeout(() => this.ui.crosshair.classList.remove('spread'), 90);

      const spread = this.isAds ? w.adsSpread : w.spread;
      const origin = this.camera.position.clone();
      const pellets = w.pellets || 1;
      const tracerCol = this._getTracerColor(w);

      const muzzleWorld = new THREE.Vector3();
      if (this.weaponMesh && this.weaponMesh.userData.muzzle) {
        muzzleWorld.copy(this.weaponMesh.userData.muzzle);
        this.weaponMesh.localToWorld(muzzleWorld);
      } else {
        const f = new THREE.Vector3();
        this.camera.getWorldDirection(f);
        muzzleWorld.copy(origin).addScaledVector(f, 0.5);
      }

      const hitSummary = new Map();
      const enemyMeshes = this._getAllEnemyHitMeshes();

      for (let p = 0; p < pellets; p++) {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.x += (Math.random() - 0.5) * spread * 2;
        dir.y += (Math.random() - 0.5) * spread * 2;
        dir.normalize().applyQuaternion(this.camera.quaternion);

        this.raycaster.set(origin, dir);
        this.raycaster.far = w.range;

        const mapHits = this.raycaster.intersectObjects(this.arena.meshes, false);
        const botHits = this.raycaster.intersectObjects(enemyMeshes, false);

        const mapDist = mapHits.length > 0 ? mapHits[0].distance : w.range;
        let endPoint = origin.clone().addScaledVector(dir, mapDist);

        if (botHits.length > 0 && botHits[0].distance < mapDist) {
          const hit = botHits[0];
          endPoint = hit.point.clone();
          const enemy = hit.object.userData.enemyRef || this.bot;
          const isHeadshot = hit.object.userData.hitbox === 'head';
          const dmg = isHeadshot ? w.headDamage : w.damage;
          const prev = hitSummary.get(enemy) || { dmg: 0, hs: false, point: endPoint };
          prev.dmg += dmg;
          if (isHeadshot) prev.hs = true;
          prev.point = endPoint;
          hitSummary.set(enemy, prev);
        } else if (mapHits.length > 0) {
          const impactCol = w.paintSplat ? tracerCol : 0xdbe7ff;
          this._spawnParticles(mapHits[0].point, impactCol, w.paintSplat ? 10 : pellets > 1 ? 2 : 5);
        }

        this._spawnTracer(muzzleWorld, endPoint, tracerCol);
      }

      for (const [enemy, info] of hitSummary.entries()) {
        this._onPlayerHitEnemy(enemy, info.dmg, info.hs, info.point, w.name);
      }

      if (slot.ammo === 0 && slot.reserve > 0) {
        this.startReload();
      }
      this._updateHUD();
    }

    _performMeleeSlash(isLunge) {
      const w = this._currentWeapon();
      this.slashAnim = 1.0;
      this.sound.playShoot(w.id);

      const origin = this.camera.position.clone();
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      const reach = isLunge ? w.range + 1.6 : w.range;

      let bestEnemy = null;
      let bestDist = Infinity;
      let bestToBot = null;

      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const botCenter = enemy.getCenterWorldPos();
        const toBot = new THREE.Vector3().subVectors(botCenter, origin);
        const dist = toBot.length();
        const dot = forward.dot(toBot.clone().normalize());
        if (dist <= reach && dot > 0.42 && dist < bestDist) {
          bestDist = dist;
          bestEnemy = enemy;
          bestToBot = toBot;
        }
      }

      if (bestEnemy && bestToBot) {
        const attackFlat = new THREE.Vector3(bestToBot.x, 0, bestToBot.z).normalize();
        const botFacing = bestEnemy.getForwardVector();
        const isBackstab = Boolean(w.backstabDamage && attackFlat.dot(botFacing) > 0.32);

        const dmg = isBackstab
          ? w.backstabDamage
          : isLunge
          ? w.lungeDamage || w.damage + 15
          : w.damage;
        const label = isBackstab ? `${w.name} BACKSTAB` : isLunge ? `${w.name} LUNGE` : w.name;
        this._onPlayerHitEnemy(bestEnemy, dmg, isBackstab || isLunge, bestEnemy.getCenterWorldPos(), label);
      }
    }

    _throwUtility(weaponDef) {
      this.sound.playShoot(weaponDef.id);
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);

      const start = this.camera.position.clone().addScaledVector(dir, 0.7);
      const vel = dir.multiplyScalar(weaponDef.utilityType === 'molotov' ? 23 : 22);
      vel.y += 5.2;

      const colorMap = { frag: 0xff5a36, molotov: 0xf97316, flash: 0xe0f2fe, smoke: 0x94a3b8 };
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.16, 1),
        new THREE.MeshStandardMaterial({
          color: colorMap[weaponDef.utilityType] || 0xff5a36,
          emissive: colorMap[weaponDef.utilityType] || 0xff3e20,
          emissiveIntensity: 0.75,
          roughness: 0.35,
        })
      );
      mesh.position.copy(start);
      this.scene.add(mesh);

      this.projectiles.push({
        type: weaponDef.utilityType,
        mesh,
        pos: start,
        vel,
        fuse: weaponDef.utilityType === 'flash' ? 1.35 : weaponDef.utilityType === 'molotov' ? 3.5 : 1.85,
      });
    }

    _explodeFrag(pos) {
      this.sound.playExplosion();
      this._spawnParticles(pos, 0xff7b29, 26, 12);
      this._spawnParticles(pos, 0xffe45e, 14, 8);

      const blastRadius = 8.5;
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const botPos = enemy.getCenterWorldPos();
        const d = pos.distanceTo(botPos);
        if (d < blastRadius) {
          const dmg = Math.round(92 * (1 - d / blastRadius));
          if (dmg > 4) this._onPlayerHitEnemy(enemy, dmg, false, botPos, 'FRAG GRENADE');
        }
      }

      if (this.player.alive) {
        const pCenter = new THREE.Vector3(this.player.pos.x, this.player.pos.y + 1.0, this.player.pos.z);
        const d = pos.distanceTo(pCenter);
        if (d < blastRadius) {
          const factor = 1 - d / blastRadius;
          const push = new THREE.Vector3().subVectors(pCenter, pos).normalize();
          this.player.vel.addScaledVector(push, 14 * factor);
          this.player.vel.y += 6 * factor;
          this.player.onGround = false;
          this._damagePlayer(Math.round(45 * factor), 'OWN GRENADE');
        }
      }
    }

    _spawnMolotovPool(pos) {
      this.sound.playMolotovShatter();
      this._spawnParticles(pos, 0xff6b1a, 22, 8);

      const radius = 4.6;
      const rawFloor = this.arena.getFloorHeight(pos.x, pos.z, pos.y + 0.5, 0.2);
      const floorY = rawFloor > -Infinity ? rawFloor : pos.y;
      const geo = new THREE.CylinderGeometry(radius, radius, 0.14, 24);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xff5a1f,
        transparent: true,
        opacity: 0.58,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, floorY + 0.08, pos.z);
      this.scene.add(mesh);

      this.firePools.push({
        mesh,
        pos: new THREE.Vector3(pos.x, floorY, pos.z),
        radius,
        life: 5.5,
        tickTimer: 0,
      });
    }

    _spawnSmokeCloud(pos) {
      this.sound.playSmokePop();
      const rawFloor = this.arena.getFloorHeight(pos.x, pos.z, pos.y + 0.5, 0.2);
      const floorY = rawFloor > -Infinity ? rawFloor : pos.y;
      const center = new THREE.Vector3(pos.x, floorY + 1.9, pos.z);
      const group = new THREE.Group();
      const puffs = [];
      for (let i = 0; i < 9; i++) {
        const r = 1.8 + Math.random() * 1.4;
        const mat = new THREE.MeshStandardMaterial({
          color: 0xcbd5e1,
          roughness: 1.0,
          transparent: true,
          opacity: 0.72,
          depthWrite: false,
        });
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), mat);
        const a = (i / 9) * Math.PI * 2;
        const rad = i === 0 ? 0 : 1.6 + Math.random() * 1.8;
        puff.position.set(Math.cos(a) * rad, (Math.random() - 0.3) * 1.6, Math.sin(a) * rad);
        group.add(puff);
        puffs.push(puff);
      }
      group.position.copy(center);
      this.scene.add(group);
      this._pushKillFeed('SMOKE SCREEN DEPLOYED (7s)');

      this.smokeClouds.push({
        group,
        puffs,
        pos: center,
        radius: 5.2,
        life: 7.0,
      });
    }

    _detonateFlashbang(pos) {
      this.sound.playFlashbang();
      this._spawnParticles(pos, 0xffffff, 24, 11);

      const radius = 14;
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const d = pos.distanceTo(enemy.getHeadWorldPos());
        if (d < radius) {
          enemy.blind(2.8);
          this._pushKillFeed(`${enemy.isDummy ? 'DUMMY' : 'TARGET'} FLASHBANGED (2.8s)!`);
          this._onPlayerHitEnemy(enemy, 10, false, enemy.getHeadWorldPos(), 'FLASHBANG');
        }
      }

      if (this.player.alive) {
        const pEye = this.camera.position;
        const d = pos.distanceTo(pEye);
        if (d < radius) {
          const toFlash = new THREE.Vector3().subVectors(pos, pEye).normalize();
          const look = new THREE.Vector3();
          this.camera.getWorldDirection(look);
          const facing = Math.max(0.25, look.dot(toFlash));
          this.blindFlash = Math.max(this.blindFlash, 1.35 * facing * (1 - d / (radius * 1.2)));
        }
      }
    }

    _triggerKillEffect(pos, targetEnemy) {
      const fxType = this.loadoutChoice.killEffect || 'classic';
      if (fxType === 'classic') return;

      if (fxType === 'lightning') {
        this.sound.playThunder();
        const bolt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.55, 42, 8),
          new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.95 })
        );
        bolt.position.set(pos.x, pos.y + 20, pos.z);
        this.scene.add(bolt);
        this.killFXList.push({ type: 'lightning', obj: bolt, life: 0.55, maxLife: 0.55 });
        this._spawnParticles(pos, 0xfde047, 28, 12);
      } else if (fxType === 'sakura') {
        this._spawnParticles(pos, 0xff5da2, 24, 8);
        this._spawnParticles(pos, 0xfbcfe8, 20, 6);
      } else if (fxType === 'blackhole') {
        if (targetEnemy) targetEnemy.setVisible(false);
        const hole = new THREE.Group();
        const core = new THREE.Mesh(
          new THREE.SphereGeometry(1.15, 16, 14),
          new THREE.MeshBasicMaterial({ color: 0x05020d })
        );
        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(1.75, 0.14, 10, 26),
          new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.9 })
        );
        hole.add(core, halo);
        hole.position.copy(pos);
        this.scene.add(hole);
        this.killFXList.push({ type: 'blackhole', obj: hole, life: 1.5, maxLife: 1.5 });
        this._spawnParticles(pos, 0xc084fc, 22, 6);
      } else if (fxType === 'pixel') {
        if (targetEnemy) targetEnemy.setVisible(false);
        this._spawnParticles(pos, 0xff3e5e, 14, 10);
        this._spawnParticles(pos, 0xfbbf24, 14, 11);
        this._spawnParticles(pos, 0x2de2ff, 12, 9);
      }
    }

    _onPlayerHitEnemy(enemy, damage, isHeadshot, worldPoint, weaponLabel) {
      const res = enemy.takeDamage(damage, isHeadshot);
      this.stats.damageDealt += damage;
      if (isHeadshot) this.stats.headshots += 1;

      this.sound.playHit(isHeadshot);
      this._triggerHitmarker(isHeadshot);
      this._spawnFloatingDamage(worldPoint, damage, isHeadshot);
      this._spawnParticles(worldPoint, isHeadshot ? 0xffd447 : 0xff3e5e, isHeadshot ? 14 : 8);

      if (res.killed) {
        this.stats.kills += 1;
        this.sound.playKill();
        this._triggerKillEffect(enemy.getCenterWorldPos(), enemy);
        const targetLabel = enemy.isDummy ? (enemy.label || 'DUMMY') : this.loadoutChoice.mode === 'practice' ? 'PRACTICE NPC' : 'RIVAL';
        this._pushKillFeed(`YOU [${weaponLabel}${isHeadshot ? ' *' : ''}] ${targetLabel}`);

        if (this.loadoutChoice.mode === 'range') {
          this.playerScore = this.stats.kills;
          this.botScore = this.stats.headshots;
          this._renderScorePips();
          return;
        }

        if (this.loadoutChoice.mode === 'tdm') {
          this.playerScore += 1;
          enemy.respawnTimer = 2.4;
          this._renderScorePips();
          if (this.playerScore >= TDM_SCORE_LIMIT) {
            this._finishMatch();
          }
          return;
        }

        const remaining = this._getAliveEnemyCount();
        if (remaining > 0) {
          this._pushKillFeed(`${remaining} TARGET${remaining > 1 ? 'S' : ''} REMAINING`);
        } else {
          const msg =
            this.loadoutChoice.mode === 'practice'
              ? 'ALL PRACTICE TARGETS CLEARED!'
              : this.loadoutChoice.mode === 'twovtwo'
              ? 'RED TEAM ELIMINATED!'
              : isHeadshot
              ? 'CRITICAL ELIMINATION!'
              : 'RIVAL ELIMINATED!';
          this._endRound(true, msg);
        }
      }
    }

    _onBotShoot(shooter, origin, dir, damage) {
      if (this.roundState !== 'playing') return;
      this.sound.playShoot('ar');

      this.raycaster.set(origin, dir);
      this.raycaster.far = 140;
      const mapHits = this.raycaster.intersectObjects(this.arena.meshes, false);
      const mapDist = mapHits.length > 0 ? mapHits[0].distance : 140;

      // Determine candidate targets (opposing team)
      const candidates = [];
      if (shooter.team === 'red') {
        if (this.player.alive) {
          candidates.push({
            isPlayer: true,
            center: new THREE.Vector3(this.player.pos.x, this.player.pos.y + 1.05, this.player.pos.z),
          });
        }
        for (const ally of this.allies) {
          if (ally.alive) candidates.push({ isPlayer: false, bot: ally, center: ally.getCenterWorldPos() });
        }
      } else {
        for (const enemy of this.enemies) {
          if (enemy.alive) candidates.push({ isPlayer: false, bot: enemy, center: enemy.getCenterWorldPos() });
        }
      }

      let bestHit = null;
      let bestDist = mapDist;
      let endPoint = origin.clone().addScaledVector(dir, mapDist);

      for (const c of candidates) {
        const toTarget = new THREE.Vector3().subVectors(c.center, origin);
        const proj = toTarget.dot(dir);
        if (proj > 0 && proj < bestDist) {
          const closest = origin.clone().addScaledVector(dir, proj);
          const horizDist = Math.hypot(closest.x - c.center.x, closest.z - c.center.z);
          const vertDist = Math.abs(closest.y - c.center.y);
          if (horizDist < 0.56 && vertDist < 0.98) {
            bestDist = proj;
            bestHit = c;
            endPoint = closest;
          }
        }
      }

      const rSkin = RIVAL_SKINS[this.loadoutChoice.rivalSkin] || RIVAL_SKINS.classic;
      const tracerColor = shooter.team === 'blue' ? 0x2de2ff : rSkin.accentColor;
      this._spawnTracer(origin, endPoint, tracerColor);

      if (!bestHit) return;

      if (bestHit.isPlayer) {
        this._damagePlayer(damage, shooter.name || 'RIVAL');
      } else {
        const targetBot = bestHit.bot;
        const res = targetBot.takeDamage(damage, false);
        this._spawnParticles(endPoint, targetBot.team === 'blue' ? 0x2de2ff : 0xff3e5e, 5);
        if (res.killed) {
          this._onBotEliminatedByBot(shooter, targetBot);
        }
      }
    }

    _onBotEliminatedByBot(shooter, victim) {
      this._pushKillFeed(`${shooter.name} ELIMINATED ${victim.name}`);
      if (this.loadoutChoice.mode === 'tdm') {
        if (victim.team === 'red') this.playerScore += 1;
        else this.botScore += 1;
        victim.respawnTimer = 2.4;
        this._renderScorePips();
        if (this.playerScore >= TDM_SCORE_LIMIT || this.botScore >= TDM_SCORE_LIMIT) {
          this._finishMatch();
        }
        return;
      }

      if (victim.team === 'red' && this._getAliveEnemyCount() === 0) {
        this._endRound(true, 'ALLY CLUTCHED THE ROUND!');
      } else if (victim.team === 'blue' && !this.player.alive && this._getAliveAllyCount() === 0) {
        this._endRound(false, 'BLUE TEAM ELIMINATED');
      }
    }

    _handlePlayerDeath(source) {
      this.player.alive = false;
      this._pushKillFeed(`${source} ELIMINATED YOU`);

      if (this.loadoutChoice.mode === 'tdm') {
        this.botScore += 1;
        this._renderScorePips();
        if (this.botScore >= TDM_SCORE_LIMIT) {
          this._finishMatch();
        } else {
          this.playerRespawnTimer = 2.2;
          this._showBanner('ELIMINATED', 'RESPAWNING IN 2s...', true);
        }
        return;
      }

      if (this.loadoutChoice.mode === 'twovtwo' && this._getAliveAllyCount() > 0) {
        this._showBanner('ELIMINATED', 'SPECTATING BLUE ALLY...', true);
        return;
      }

      this._endRound(false, source === 'SKY VOID' ? 'FELL INTO THE SKY VOID' : 'YOU WERE ELIMINATED');
    }

    _damagePlayer(amount, source) {
      if (!this.player.alive || this.roundState !== 'playing') return;
      this.player.hp = Math.max(0, this.player.hp - amount);
      this.damageFlash = 0.32;
      this.sound.playHurt();
      this._updateHUD();

      if (this.player.hp <= 0) {
        this._handlePlayerDeath(source);
      }
    }

    _endRound(playerWon, subtitle) {
      if (this.roundState !== 'playing') return;
      this.roundState = 'round_over';
      this.stateTimer = 2.6;
      this.isAds = false;
      this.isMouseDown = false;

      if (playerWon) this.playerScore += 1;
      else this.botScore += 1;

      this.sound.playRoundEnd(playerWon);
      this._renderScorePips();
      this._showBanner(playerWon ? 'ROUND WON' : 'ROUND LOST', subtitle, !playerWon);
    }

    _finishMatch() {
      this.roundState = 'match_over';
      this.matchActive = false;
      this.isPaused = true;
      if (document.pointerLockElement) document.exitPointerLock();

      const won =
        this.loadoutChoice.mode === 'tdm'
          ? this.playerScore >= this.botScore
          : this.playerScore >= WINS_TO_VICTORY;
      this.ui.hud.classList.add('hidden');
      this.ui.centerBanner.classList.add('hidden');
      this.ui.matchEnd.classList.remove('hidden');

      this.ui.endBadge.textContent = won ? 'VICTORY' : 'DEFEAT';
      this.ui.endBadge.classList.toggle('defeat', !won);
      this.ui.endScore.textContent = `${this.playerScore} — ${this.botScore}`;
      this.ui.endStats.innerHTML =
        `Map: <b>${MAPS[this.arena.mapId].name}</b> &nbsp;·&nbsp; Wrap: <b>${WEAPON_SKINS[this.loadoutChoice.weaponSkin].name}</b><br>` +
        `Eliminations: <b>${this.stats.kills}</b> &nbsp;·&nbsp; Crits/HS: <b>${this.stats.headshots}</b> &nbsp;·&nbsp; Damage: <b>${this.stats.damageDealt}</b>`;
    }

    _showBanner(title, sub, isDanger = false) {
      this.ui.bannerTitle.textContent = title;
      this.ui.bannerSub.textContent = sub;
      this.ui.centerBanner.classList.toggle('danger', isDanger);
      this.ui.centerBanner.classList.remove('hidden');
    }

    _triggerHitmarker(isHeadshot) {
      this.hitmarkerTimer = 0.16;
      this.ui.hitmarker.classList.add('show');
      this.ui.hitmarker.classList.toggle('headshot', isHeadshot);
    }

    _pushKillFeed(text) {
      const el = document.createElement('div');
      el.className = 'feed-item';
      el.textContent = text;
      this.ui.killFeed.appendChild(el);
      setTimeout(() => el.remove(), 4200);
    }

    _spawnFloatingDamage(worldPos, dmg, isHeadshot) {
      const projected = worldPos.clone().project(this.camera);
      if (projected.z > 1) return;
      const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;

      const el = document.createElement('div');
      el.className = 'dmg-num' + (isHeadshot ? ' headshot' : '');
      el.textContent = isHeadshot ? `${dmg}!` : `${dmg}`;
      el.style.left = `${x + (Math.random() - 0.5) * 20}px`;
      el.style.top = `${y - 10}px`;
      this.ui.damageNumbers.appendChild(el);
      setTimeout(() => el.remove(), 650);
    }

    _spawnTracer(start, end, colorHex) {
      const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
      const mat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 });
      const line = new THREE.Line(geo, mat);
      this.scene.add(line);
      this.tracers.push({ line, life: 0.085, maxLife: 0.085 });
    }

    _spawnParticles(pos, colorHex, count = 8, speed = 6) {
      const geo = new THREE.BoxGeometry(0.11, 0.11, 0.11);
      for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 1 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        this.scene.add(mesh);
        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * speed * 2,
          Math.random() * speed * 1.3 + 1,
          (Math.random() - 0.5) * speed * 2
        );
        this.particles.push({ mesh, vel, life: 0.35 + Math.random() * 0.25, maxLife: 0.6 });
      }
    }

    _renderScorePips() {
      this.ui.playerScore.textContent = String(this.playerScore);
      this.ui.botScore.textContent = String(this.botScore);
      this.ui.roundLabel.textContent =
        this.loadoutChoice.mode === 'range'
          ? 'FREE PLAY'
          : this.loadoutChoice.mode === 'tdm'
          ? `TDM · TO ${TDM_SCORE_LIMIT}`
          : this.loadoutChoice.mode === 'twovtwo'
          ? `2v2 · RD ${this.roundNumber}`
          : this.loadoutChoice.mode === 'practice'
          ? `PRACTICE ${this.roundNumber}`
          : `ROUND ${this.roundNumber}`;

      const makePips = (count) => {
        let html = '';
        for (let i = 0; i < WINS_TO_VICTORY; i++) {
          html += `<span class="pip${i < count ? ' filled' : ''}"></span>`;
        }
        return html;
      };
      const pPips =
        this.loadoutChoice.mode === 'tdm'
          ? Math.floor(this.playerScore / 5)
          : this.loadoutChoice.mode === 'range'
          ? Math.min(5, this.playerScore)
          : this.playerScore;
      const bPips =
        this.loadoutChoice.mode === 'tdm'
          ? Math.floor(this.botScore / 5)
          : this.loadoutChoice.mode === 'range'
          ? 0
          : this.botScore;
      this.ui.playerPips.innerHTML = makePips(pPips);
      this.ui.botPips.innerHTML = makePips(bPips);
    }

    _updateHUD() {
      const hpPct = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
      this.ui.hpValue.textContent = String(Math.ceil(this.player.hp));
      this.ui.hpFill.style.width = `${hpPct}%`;
      this.ui.hpFill.style.background =
        hpPct > 35 ? 'linear-gradient(90deg, #1fd1a5, #38ef7d)' : 'linear-gradient(90deg, #ff3e5e, #ff9f1c)';

      const slidePct = Math.max(0, 1 - this.player.slideCooldown / 1.6) * 100;
      const dashPct = Math.max(0, 1 - this.player.dashCooldown / 3.2) * 100;
      this.ui.slideFill.style.width = `${slidePct}%`;
      this.ui.dashFill.style.width = `${dashPct}%`;

      const slot = this._currentSlot();
      if (slot) {
        this.ui.weaponName.textContent = slot.def.name;
        if (slot.def.slotType === 'melee') {
          this.ui.ammoCurrent.textContent = '∞';
          this.ui.ammoReserve.textContent = '∞';
        } else {
          this.ui.ammoCurrent.textContent = String(slot.ammo);
          this.ui.ammoReserve.textContent = String(slot.reserve);
        }
        this.ui.reloadInd.classList.toggle('hidden', !this.isReloading);
      }

      if (this.loadoutChoice.mode === 'range') {
        this.ui.roundTimer.textContent = 'RANGE';
      } else {
        const mins = Math.floor(Math.max(0, this.roundTimer) / 60);
        const secs = Math.floor(Math.max(0, this.roundTimer) % 60);
        this.ui.roundTimer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      }
    }

    _updatePlayer(dt) {
      const p = this.player;
      p.slideCooldown = Math.max(0, p.slideCooldown - dt);
      p.dashCooldown = Math.max(0, p.dashCooldown - dt);
      p.lungeCooldown = Math.max(0, p.lungeCooldown - dt);
      p.padCooldown = Math.max(0, p.padCooldown - dt);

      const gravScale = this._getActiveGravityScale();
      const gravMode = GRAVITY_MODES[this.loadoutChoice.gravity] || GRAVITY_MODES.auto;
      const canMove = this.roundState === 'playing' && p.alive;
      const w = this._currentWeapon();
      const modeSpeedBonus = this.loadoutChoice.mode === 'assassin' ? 1.12 : 1.0;
      const baseSpeed = 9.4 * w.moveMult * modeSpeedBonus * (this.isAds ? 0.68 : 1.0);

      if (canMove) {
        if (p.slideTimer > 0) {
          p.slideTimer = Math.max(0, p.slideTimer - dt);
          const slideSpeed = 14.5 * (0.55 + 0.45 * (p.slideTimer / 0.42));
          p.vel.x = p.slideDir.x * slideSpeed;
          p.vel.z = p.slideDir.z * slideSpeed;
        } else {
          const input = this._getMoveInputDir();
          if (input.lengthSq() > 0.001) input.normalize();
          const accel = p.onGround ? 14 : gravScale < 0.6 ? 8.2 : 5.5;
          p.vel.x = THREE.MathUtils.lerp(p.vel.x, input.x * baseSpeed, Math.min(1, dt * accel));
          p.vel.z = THREE.MathUtils.lerp(p.vel.z, input.z * baseSpeed, Math.min(1, dt * accel));
        }

        if (p.onGround) p.coyoteTimer = 0.11;
        else p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);

        if (this.keys['Space'] && p.coyoteTimer > 0) {
          p.vel.y = 8.9 * gravMode.jumpBoost;
          p.onGround = false;
          p.coyoteTimer = 0;
          p.slideTimer = 0;
          this.sound.playJump();
        }
      } else {
        p.vel.x *= Math.max(0, 1 - dt * 10);
        p.vel.z *= Math.max(0, 1 - dt * 10);
      }

      // Apply gravity (scaled for Space Low-G / Anti-Grav modes!)
      p.vel.y -= 23 * gravScale * dt;
      p.pos.x += p.vel.x * dt;
      p.pos.z += p.vel.z * dt;
      p.pos.y += p.vel.y * dt;

      this.arena.resolveHorizontal(p.pos, 0.45, p.slideTimer > 0 ? 1.15 : 1.8);

      const floorY = this.arena.getFloorHeight(p.pos.x, p.pos.z, p.pos.y, 0.42);
      if (floorY > -Infinity && p.pos.y <= floorY) {
        p.pos.y = floorY;
        p.vel.y = 0;
        p.onGround = true;
      } else {
        p.onGround = false;
      }

      // Open-air void ring-out check for Sky Islands, Cloud Spire & Construction!
      if (!this.arena.hasFloor && p.pos.y < this.arena.voidY && p.alive && this.roundState === 'playing') {
        p.hp = 0;
        this.sound.playHurt();
        this._updateHUD();
        this._handlePlayerDeath('SKY VOID');
      }

      // Shooting Range Escape Easter Egg!
      if (
        this.arena.mapId === 'shootingrange' &&
        !this.escapedRange &&
        this.roundState === 'playing' &&
        (Math.abs(p.pos.x) > 29.5 || p.pos.z < -37.5 || p.pos.z > 37.5)
      ) {
        this.escapedRange = true;
        this.sound.playRoundEnd(true);
        this._pushKillFeed('ESCAPED THE SHOOTING RANGE!');
        this._showBanner('YOU ESCAPED!', 'EXPLORE OUTSIDE & FIND THE GOLDEN BOSS DUMMY', false);
        setTimeout(() => {
          if (this.roundState === 'playing') this.ui.centerBanner.classList.add('hidden');
        }, 2600);
      }

      // Anti-Gravity Jump Pads / Qi Wind Pads / Water Geysers!
      if (canMove && p.padCooldown <= 0) {
        const launch = this.arena.checkJumpPad(p.pos);
        if (launch > 0) {
          p.vel.y = launch * (gravScale < 0.6 ? 0.85 : 1.08);
          p.onGround = false;
          p.padCooldown = 0.85;
          this.sound.playJumpPad();
        }
      }

      const ceilY = this.arena.checkCeiling(p.pos, 0.42, 1.8);
      if (p.pos.y + 1.8 > ceilY && p.vel.y > 0) {
        p.pos.y = ceilY - 1.8;
        p.vel.y = 0;
      }

      const targetEye = !p.alive ? 0.45 : p.slideTimer > 0 ? 0.96 : 1.62;
      p.eyeHeight = THREE.MathUtils.lerp(p.eyeHeight, targetEye, Math.min(1, dt * 15));

      this.recoilPitch = THREE.MathUtils.lerp(this.recoilPitch, 0, Math.min(1, dt * 12));
      this.recoilKick = THREE.MathUtils.lerp(this.recoilKick, 0, Math.min(1, dt * 14));

      if (!p.alive && this.loadoutChoice.mode === 'twovtwo' && this._getAliveAllyCount() > 0) {
        // Spectate living Blue Ally in 2v2!
        const liveAlly = this.allies.find((a) => a.alive);
        if (liveAlly) {
          this.camera.position.lerp(
            new THREE.Vector3(liveAlly.pos.x, liveAlly.pos.y + 5.2, liveAlly.pos.z + 7.5),
            Math.min(1, dt * 6)
          );
          this.camera.lookAt(liveAlly.pos.x, liveAlly.pos.y + 1.4, liveAlly.pos.z);
        }
      } else {
        this.camera.position.set(p.pos.x, p.pos.y + p.eyeHeight, p.pos.z);
        const euler = new THREE.Euler(p.pitch + this.recoilPitch, p.yaw, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(euler);
      }

      const targetFov = this.isAds
        ? w.adsFov
        : p.slideTimer > 0
        ? this.settings.fov + 9
        : this.settings.fov;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, Math.min(1, dt * 14));
      this.camera.updateProjectionMatrix();

      const scoped = this.isAds && w.scoped && this.roundState === 'playing';
      this.ui.scopeOverlay.classList.toggle('hidden', !scoped);
      this.ui.crosshair.classList.toggle('hidden', scoped);
      if (this.weaponMesh) this.weaponMesh.visible = !scoped;
      this.ui.slideLines.style.opacity = p.slideTimer > 0 ? '1' : '0';
    }

    _updateWeaponAndViewmodel(dt) {
      this.fireCooldown = Math.max(0, this.fireCooldown - dt);

      if (this.burstQueue > 0) {
        this.burstDelay -= dt;
        if (this.burstDelay <= 0) {
          this.burstQueue -= 1;
          this.burstDelay = this._currentWeapon().burstInterval || 0.065;
          this._fireBullet();
        }
      }

      if (this.isMouseDown && this.roundState === 'playing') {
        this._tryFire(false);
      }
      this._updateAutoShoot();

      if (this.isReloading) {
        this.reloadTimer -= dt;
        if (this.reloadTimer <= 0) {
          const slot = this._currentSlot();
          if (this.loadoutChoice.mode === 'range') {
            slot.ammo = slot.def.magSize;
            slot.reserve = slot.def.reserveMax;
          } else {
            const needed = slot.def.magSize - slot.ammo;
            const take = Math.min(needed, slot.reserve);
            slot.ammo += take;
            slot.reserve -= take;
          }
          this.isReloading = false;
          this._updateHUD();
        }
      }

      if (this.weaponMesh) {
        updateAnimatedWeaponSkin(this.weaponMesh, performance.now() * 0.001);
        if (this.weaponMesh.userData.spinGroup && this.isMouseDown && this.roundState === 'playing') {
          this.weaponMesh.userData.spinGroup.rotation.z += dt * 22;
        }

        const speed = Math.hypot(this.player.vel.x, this.player.vel.z);
        if (speed > 0.8 && this.player.onGround) {
          this.bobPhase += dt * speed * 1.15;
        }
        const bobX = Math.cos(this.bobPhase) * 0.012;
        const bobY = Math.abs(Math.sin(this.bobPhase)) * 0.014;

        const basePos = this.isAds
          ? new THREE.Vector3(0, -0.175, -0.34)
          : new THREE.Vector3(0.28, -0.24, -0.46);

        this.viewmodelRoot.position.lerp(
          new THREE.Vector3(basePos.x + bobX, basePos.y - bobY, basePos.z + this.recoilKick),
          Math.min(1, dt * 18)
        );

        let rotX = this.isReloading ? -0.55 : this.recoilKick * 1.1;
        let rotY = 0;
        if (this.slashAnim > 0) {
          this.slashAnim = Math.max(0, this.slashAnim - dt * 5.2);
          const swing = Math.sin(this.slashAnim * Math.PI);
          rotX -= swing * 1.1;
          rotY += swing * 1.3;
        }
        this.viewmodelRoot.rotation.set(rotX, rotY, this.player.slideTimer > 0 ? -0.18 : 0);

        if (this.muzzleFlashTimer > 0) {
          this.muzzleFlashTimer -= dt;
          this.muzzleFlash.visible = true;
          if (this.weaponMesh.userData.muzzle) {
            this.muzzleFlash.position.copy(this.weaponMesh.userData.muzzle);
          }
          this.muzzleFlash.rotation.z += dt * 25;
        } else {
          this.muzzleFlash.visible = false;
        }
      }
    }

    _updateEffects(dt) {
      if (this.hitmarkerTimer > 0) {
        this.hitmarkerTimer -= dt;
        if (this.hitmarkerTimer <= 0) {
          this.ui.hitmarker.classList.remove('show', 'headshot');
        }
      }

      if (this.damageFlash > 0) {
        this.damageFlash = Math.max(0, this.damageFlash - dt);
        this.ui.damageVignette.style.opacity = String(Math.min(1, this.damageFlash * 3));
      } else {
        this.ui.damageVignette.style.opacity = '0';
      }

      if (this.blindFlash > 0) {
        this.blindFlash = Math.max(0, this.blindFlash - dt * 0.85);
        this.ui.flashOverlay.style.opacity = String(Math.min(0.95, this.blindFlash));
      } else {
        this.ui.flashOverlay.style.opacity = '0';
      }

      // Tracers
      for (let i = this.tracers.length - 1; i >= 0; i--) {
        const t = this.tracers[i];
        t.life -= dt;
        if (t.life <= 0) {
          this.scene.remove(t.line);
          t.line.geometry.dispose();
          t.line.material.dispose();
          this.tracers.splice(i, 1);
        } else {
          t.line.material.opacity = t.life / t.maxLife;
        }
      }

      // Particles
      const pGrav = 18 * Math.max(0.3, this._getActiveGravityScale());
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.life -= dt;
        if (pt.life <= 0) {
          this.scene.remove(pt.mesh);
          pt.mesh.material.dispose();
          this.particles.splice(i, 1);
        } else {
          pt.vel.y -= pGrav * dt;
          pt.mesh.position.addScaledVector(pt.vel, dt);
          pt.mesh.material.opacity = Math.max(0, pt.life / pt.maxLife);
        }
      }

      // Kill Effects (Lightning / Black Hole)
      for (let i = this.killFXList.length - 1; i >= 0; i--) {
        const fx = this.killFXList[i];
        fx.life -= dt;
        if (fx.life <= 0) {
          this.scene.remove(fx.obj);
          this.killFXList.splice(i, 1);
        } else if (fx.type === 'lightning') {
          fx.obj.material.opacity = fx.life / fx.maxLife;
        } else if (fx.type === 'blackhole') {
          fx.obj.rotation.y += dt * 4.5;
          fx.obj.rotation.x += dt * 2.5;
          const s = fx.life < 0.4 ? fx.life / 0.4 : 1.0;
          fx.obj.scale.setScalar(s);
        }
      }

      // Thrown Utility Projectiles (Frag, Molotov, Flashbang, Smoke)
      const projGrav = 20 * Math.max(0.35, this._getActiveGravityScale());
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i];
        pr.fuse -= dt;
        pr.vel.y -= projGrav * dt;
        pr.pos.addScaledVector(pr.vel, dt);

        const hit = this.arena.isPointInsideSolid(pr.pos.x, pr.pos.y, pr.pos.z, 0.16);
        if (hit.hit) {
          if (pr.type === 'molotov') {
            this.scene.remove(pr.mesh);
            this.projectiles.splice(i, 1);
            this._spawnMolotovPool(pr.pos);
            continue;
          }
          if (pr.type === 'smoke') {
            this.scene.remove(pr.mesh);
            this.projectiles.splice(i, 1);
            this._spawnSmokeCloud(pr.pos);
            continue;
          }
          pr.pos.addScaledVector(hit.normal, 0.16);
          const dot = pr.vel.dot(hit.normal);
          if (dot < 0) {
            pr.vel.addScaledVector(hit.normal, -1.62 * dot);
            pr.vel.multiplyScalar(0.72);
            if (pr.vel.length() > 2.2) this.sound.playBounce();
          }
        }

        pr.mesh.position.copy(pr.pos);
        pr.mesh.rotation.x += dt * 7;
        pr.mesh.rotation.y += dt * 5;

        if (pr.fuse <= 0 || pr.pos.y < -25) {
          this.scene.remove(pr.mesh);
          this.projectiles.splice(i, 1);
          if (pr.pos.y < -25) continue;
          if (pr.type === 'flash') this._detonateFlashbang(pr.pos);
          else if (pr.type === 'molotov') this._spawnMolotovPool(pr.pos);
          else if (pr.type === 'smoke') this._spawnSmokeCloud(pr.pos);
          else this._explodeFrag(pr.pos);
        }
      }

      // Smoke Clouds
      for (let i = this.smokeClouds.length - 1; i >= 0; i--) {
        const sm = this.smokeClouds[i];
        sm.life -= dt;
        sm.group.rotation.y += dt * 0.25;
        const alpha = Math.min(0.75, sm.life * 0.4);
        for (const puff of sm.puffs) puff.material.opacity = Math.max(0, alpha);
        if (sm.life <= 0) {
          this.scene.remove(sm.group);
          this.smokeClouds.splice(i, 1);
        }
      }

      // Molotov Fire Pools
      for (let i = this.firePools.length - 1; i >= 0; i--) {
        const fp = this.firePools[i];
        fp.life -= dt;
        fp.tickTimer -= dt;

        if (Math.random() < dt * 18) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * fp.radius * 0.9;
          const flamePos = new THREE.Vector3(fp.pos.x + Math.cos(a) * r, fp.pos.y + 0.25, fp.pos.z + Math.sin(a) * r);
          this._spawnParticles(flamePos, Math.random() < 0.5 ? 0xff6b1a : 0xffd447, 1, 2.2);
        }

        if (fp.tickTimer <= 0 && this.roundState === 'playing') {
          fp.tickTimer = 0.42;
          for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            const dBot = Math.hypot(enemy.pos.x - fp.pos.x, enemy.pos.z - fp.pos.z);
            if (dBot < fp.radius && Math.abs(enemy.pos.y - fp.pos.y) < 1.8) {
              this._onPlayerHitEnemy(enemy, 14, false, enemy.getCenterWorldPos(), 'MOLOTOV');
            }
          }
          if (this.player.alive && this.loadoutChoice.mode !== 'range') {
            const dP = Math.hypot(this.player.pos.x - fp.pos.x, this.player.pos.z - fp.pos.z);
            if (dP < fp.radius && Math.abs(this.player.pos.y - fp.pos.y) < 1.8) {
              this._damagePlayer(8, 'MOLOTOV FIRE');
            }
          }
        }

        fp.mesh.material.opacity = Math.min(0.6, fp.life * 0.4);
        if (fp.life <= 0) {
          this.scene.remove(fp.mesh);
          fp.mesh.geometry.dispose();
          fp.mesh.material.dispose();
          this.firePools.splice(i, 1);
        }
      }
    }

    _updateRoundState(dt) {
      if (this.roundState === 'countdown') {
        this.stateTimer -= dt;
        const sec = Math.ceil(this.stateTimer);
        if (sec !== this.countdownLastSec && sec > 0) {
          this.countdownLastSec = sec;
          this.sound.playBeep(false);
          this._showBanner(`ROUND ${this.roundNumber}`, `FIGHT IN ${sec}...`, false);
        }
        if (this.stateTimer <= 0) {
          this.roundState = 'playing';
          this.sound.playBeep(true);
          this._showBanner('FIGHT!', 'ELIMINATE YOUR RIVAL', false);
          setTimeout(() => {
            if (this.roundState === 'playing') this.ui.centerBanner.classList.add('hidden');
          }, 700);
        }
      } else if (this.roundState === 'playing') {
        if (this.loadoutChoice.mode === 'range') return;
        this.roundTimer -= dt;
        if (this.roundTimer <= 0) {
          this.roundTimer = 0;
          if (this.loadoutChoice.mode === 'tdm') {
            this._finishMatch();
          } else {
            const playerWinsTimeout = this.loadoutChoice.mode === 'practice' ? false : this.player.hp >= this.bot.hp;
            this._endRound(playerWinsTimeout, 'TIME EXPIRED');
          }
        }
      } else if (this.roundState === 'round_over') {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          if (this.playerScore >= WINS_TO_VICTORY || this.botScore >= WINS_TO_VICTORY) {
            this._finishMatch();
          } else {
            this.roundNumber += 1;
            this._startRound();
          }
        }
      }
    }

    _animate() {
      requestAnimationFrame(() => this._animate());
      const dt = Math.min(0.05, this.clock.getDelta());

      if (this.roundState === 'menu' || this.roundState === 'match_over') {
        const t = performance.now() * 0.00022;
        this.camera.position.set(Math.sin(t) * 26, 13.5, Math.cos(t) * 28);
        this.camera.lookAt(0, 2.5, 0);
        this.renderer.render(this.scene, this.camera);
        return;
      }

      const paused = this.isPaused && this.roundState !== 'match_over';
      if (!paused) {
        this._updateRoundState(dt);
        this._updatePlayer(dt);
        this._updateWeaponAndViewmodel(dt);

        // TDM Respawn Timers (Player, Allies & Red Enemies)
        if (this.loadoutChoice.mode === 'tdm' && this.roundState === 'playing') {
          if (!this.player.alive && this.playerRespawnTimer > 0) {
            this.playerRespawnTimer -= dt;
            if (this.playerRespawnTimer <= 0) this._respawnPlayerTDM();
          }
          for (const b of [...this.allies, ...this.enemies]) {
            if (!b.alive && b.respawnTimer > 0) {
              b.respawnTimer -= dt;
              if (b.respawnTimer <= 0) {
                const sp = b.spawnHome.clone();
                sp.x += (Math.random() - 0.5) * 4;
                b.reset(sp, this.loadoutChoice.difficulty, b.team === 'blue' ? 'ally' : this.loadoutChoice.rivalSkin);
              }
            }
          }
        }

        const grav = this._getActiveGravityScale();
        const blueTargets = [
          { pos: this.player.pos, alive: this.player.alive },
          ...this.allies.map((a) => ({ pos: a.pos, alive: a.alive })),
        ];
        const redTargets = this.enemies.map((e) => ({ pos: e.pos, alive: e.alive }));

        for (const enemy of this.enemies) {
          enemy.update(
            dt,
            blueTargets,
            this.roundState === 'playing',
            (shooter, origin, dir, dmg) => this._onBotShoot(shooter, origin, dir, dmg),
            grav,
            this.smokeClouds,
            (fallen) => {
              if (this.roundState !== 'playing') return;
              this.stats.kills += 1;
              this.sound.playKill();
              this._pushKillFeed(`${fallen.name || 'TARGET'} FELL INTO THE SKY VOID!`);
              if (this.loadoutChoice.mode === 'tdm') {
                this.playerScore += 1;
                fallen.respawnTimer = 2.4;
                this._renderScorePips();
                if (this.playerScore >= TDM_SCORE_LIMIT) this._finishMatch();
              } else if (this._getAliveEnemyCount() === 0 && this.loadoutChoice.mode !== 'range') {
                this._endRound(true, 'SKY VOID RING-OUT!');
              }
            }
          );
        }

        for (const ally of this.allies) {
          ally.update(
            dt,
            redTargets,
            this.roundState === 'playing',
            (shooter, origin, dir, dmg) => this._onBotShoot(shooter, origin, dir, dmg),
            grav,
            this.smokeClouds,
            (fallen) => {
              if (this.roundState !== 'playing') return;
              this._pushKillFeed(`${fallen.name} FELL INTO THE SKY VOID!`);
              if (this.loadoutChoice.mode === 'tdm') {
                this.botScore += 1;
                fallen.respawnTimer = 2.4;
                this._renderScorePips();
                if (this.botScore >= TDM_SCORE_LIMIT) this._finishMatch();
              } else if (!this.player.alive && this._getAliveAllyCount() === 0) {
                this._endRound(false, 'BLUE TEAM ELIMINATED');
              }
            }
          );
        }

        this._updateEffects(dt);
        this._updateHUD();
      }

      this.renderer.render(this.scene, this.camera);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (typeof window.THREE === 'undefined') {
      alert('Failed to load Three.js CDN. Please check your internet connection and refresh.');
      return;
    }
    new RivalsGame();
  });
})(window);
