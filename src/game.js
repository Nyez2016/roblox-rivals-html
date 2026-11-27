(function (global) {
  const THREE = global.THREE;
  const {
    Arena,
    MAPS,
    WEAPONS,
    STARTER_WEAPONS,
    getWeaponIconSVG,
    createWeaponMesh,
    createFirstPersonArms,
    createPlayerAvatar,
    WEAPON_SKINS,
    RIVAL_SKINS,
    KILL_EFFECTS,
    updateAnimatedWeaponSkin,
    RivalBot,
    TargetDummy,
    LobbyBot,
    BOT_PROFILES,
    DIFFICULTIES,
    SoundEngine,
  } = global.Rivals;

  const WINS_TO_VICTORY = 5;
  const TDM_SCORE_LIMIT = 25;
  const FFA_SCORE_LIMIT = 15;
  const ROUND_DURATION = 90;
  const TDM_DURATION = 180;
  const STORAGE_KEY = 'rivals_html_prefs_v4';
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
      if ('ACESFilmicToneMapping' in THREE) {
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.12;
      }
      if ('sRGBEncoding' in THREE) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }
      this.container.appendChild(this.renderer.domElement);

      this.scene = new THREE.Scene();
      this.scene.environment = this._createEnvironmentMap();
      this.camera = new THREE.PerspectiveCamera(82, window.innerWidth / window.innerHeight, 0.08, 320);
      this.scene.add(this.camera);

      this.settings = { sensitivity: 1.0, fov: 82, autoShoot: false, highGraphics: true };
      this.keysCurrency = 40;
      this.winStreak = 0;
      this.unlockedWeapons = new Set(STARTER_WEAPONS || ['ar', 'handgun', 'fists', 'grenade']);
      this.previewWeaponId = 'ar';
      this.loadoutChoice = {
        primary: 'ar',
        secondary: 'handgun',
        melee: 'fists',
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

      this.arena = new Arena(this.scene, 'lobby');
      this.bot = new RivalBot(this.scene, this.arena);
      this.bot.applySkin(this.loadoutChoice.rivalSkin);
      this.bot.setVisible(false);
      this.enemies = [this.bot];
      this.extraEnemies = [];
      this.allies = [];
      this.lobbyBots = [];
      this.inLobby = false;
      this.activeLobbyPad = null;
      this.lobbyPadTimer = 0;
      this.lobbyPadLastSec = 3;
      this.lobbyCrateClaimed = false;
      this.playerRespawnTimer = 0;
      this.escapedRange = false;
      this.activeMatchMode = 'classic';
      this.activeMatchMap = 'arena';
      this.killStreak = 0;
      this.firstBloodDone = false;
      this.isShielding = false;
      this.pickerOpen = false;
      this.pickerSlot = 'primary';
      this.pickerIsRange = false;
      this.rangeLoadout = {
        primary: 'ar',
        secondary: 'handgun',
        melee: 'fists',
        utility: 'grenade',
      };

      this.viewmodelRoot = new THREE.Group();
      this.camera.add(this.viewmodelRoot);
      this.weaponMesh = null;
      this.fpArms = createFirstPersonArms();
      this.fpArms.visible = false;
      this.viewmodelRoot.add(this.fpArms);
      this.playerAvatar = createPlayerAvatar();
      this.scene.add(this.playerAvatar);
      this.muzzleFlash = this._createMuzzleFlash();
      this.viewmodelRoot.add(this.muzzleFlash);
      this.muzzleLight = new THREE.PointLight(0xffe082, 0, 7.5);
      this.viewmodelRoot.add(this.muzzleLight);

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
        jumpsLeft: 2,
        spaceWasDown: false,
        footstepTimer: 0,
        warhornTimer: 0,
        warpBoostTimer: 0,
        eyeHeight: 1.62,
        slideTimer: 0,
        slideCooldown: 0,
        slideDir: new THREE.Vector3(),
        dashCooldown: 0,
        lungeCooldown: 0,
        padCooldown: 0,
        ladderStepTimer: 0,
      };

      this.slots = [];
      this.activeSlot = 0;
      this.fireCooldown = 0;
      this.scopeHintTimer = 0;
      this.burstQueue = 0;
      this.burstDelay = 0;
      this.isReloading = false;
      this.reloadTimer = 0;
      this.reloadDuration = 1.4;
      this.reloadStage = 0;
      this.inspectTimer = 0;
      this.inspectDuration = 2.0;
      this.activeEmote = null;
      this.emoteTime = 0;
      this.emoteWheelOpen = false;
      this.roundEndTitle = '';
      this.roundEndSub = '';
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
      this.shockwaves = [];
      this.projectiles = [];
      this.firePools = [];
      this.smokeClouds = [];
      this.mines = [];
      this.holodomes = [];
      this.killFXList = [];

      this.keys = {};
      this.raycaster = new THREE.Raycaster();
      this.clock = new THREE.Clock();

      this._cacheUI();
      this._syncMenuFromState();
      this._bindEvents();
      this._renderScorePips();
      this.enterLobby(false);
      this._animate();
    }

    _loadPreferences() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (typeof saved.keysCurrency === 'number' && Number.isFinite(saved.keysCurrency)) {
          this.keysCurrency = Math.max(0, Math.floor(saved.keysCurrency));
        }
        if (typeof saved.winStreak === 'number' && Number.isFinite(saved.winStreak)) {
          this.winStreak = Math.max(0, Math.floor(saved.winStreak));
        }
        if (Array.isArray(saved.unlockedWeapons)) {
          this.unlockedWeapons = new Set([...(STARTER_WEAPONS || ['ar', 'handgun', 'fists', 'grenade']), ...saved.unlockedWeapons]);
        }
        if (saved.primary && WEAPONS[saved.primary] && this.unlockedWeapons.has(saved.primary)) {
          this.loadoutChoice.primary = saved.primary;
        }
        if (saved.secondary && WEAPONS[saved.secondary] && this.unlockedWeapons.has(saved.secondary)) {
          this.loadoutChoice.secondary = saved.secondary;
        }
        if (saved.melee && WEAPONS[saved.melee] && this.unlockedWeapons.has(saved.melee)) {
          this.loadoutChoice.melee = saved.melee;
        }
        if (saved.utility && WEAPONS[saved.utility] && this.unlockedWeapons.has(saved.utility)) {
          this.loadoutChoice.utility = saved.utility;
        }
        if (saved.map && MAPS[saved.map] && saved.map !== 'lobby') this.loadoutChoice.map = saved.map;
        if (saved.gravity && GRAVITY_MODES[saved.gravity]) this.loadoutChoice.gravity = saved.gravity;
        if (['classic', 'assassin', 'sniper', 'randomizer', 'practice', 'range', 'twovtwo', 'tdm', 'ffa'].includes(saved.mode)) {
          this.loadoutChoice.mode = saved.mode;
        }
        if (saved.difficulty && DIFFICULTIES[saved.difficulty]) this.loadoutChoice.difficulty = saved.difficulty;
        if (saved.weaponSkin && WEAPON_SKINS[saved.weaponSkin]) this.loadoutChoice.weaponSkin = saved.weaponSkin;
        if (saved.rivalSkin && RIVAL_SKINS[saved.rivalSkin]) this.loadoutChoice.rivalSkin = saved.rivalSkin;
        if (saved.killEffect && KILL_EFFECTS[saved.killEffect]) this.loadoutChoice.killEffect = saved.killEffect;
        if (typeof saved.sensitivity === 'number') this.settings.sensitivity = saved.sensitivity;
        if (typeof saved.fov === 'number') this.settings.fov = saved.fov;
        if (typeof saved.autoShoot === 'boolean') this.settings.autoShoot = saved.autoShoot;
        if (typeof saved.highGraphics === 'boolean') this.settings.highGraphics = saved.highGraphics;
      } catch {
        // Ignore storage failures
      }
    }

    _createEnvironmentMap() {
      // Procedural studio/sky equirectangular reflection texture for glossy PBR weapons & skins!
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0, '#60a5fa');
      grad.addColorStop(0.35, '#e0f2fe');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(0.55, '#475569');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);

      // Bright specular studio reflection panels
      ctx.fillStyle = 'rgba(255, 250, 230, 0.9)';
      ctx.fillRect(42, 16, 48, 22);
      ctx.fillStyle = 'rgba(45, 226, 255, 0.75)';
      ctx.fillRect(156, 24, 52, 18);

      const tex = new THREE.CanvasTexture(canvas);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      if ('SRGBColorSpace' in THREE) tex.colorSpace = THREE.SRGBColorSpace;
      else if ('sRGBEncoding' in THREE) tex.encoding = THREE.sRGBEncoding;
      return tex;
    }

    _applyGraphicsSettings() {
      const high = this.settings.highGraphics !== false;
      this.renderer.setPixelRatio(high ? Math.min(window.devicePixelRatio, 2) : 1);
      this.renderer.shadowMap.enabled = high;
      this.renderer.shadowMap.needsUpdate = true;
    }

    _savePreferences() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...this.loadoutChoice,
            keysCurrency: this.keysCurrency,
            winStreak: this.winStreak,
            unlockedWeapons: Array.from(this.unlockedWeapons),
            sensitivity: this.settings.sensitivity,
            fov: this.settings.fov,
            autoShoot: this.settings.autoShoot,
            highGraphics: this.settings.highGraphics,
          })
        );
      } catch {
        // Ignore storage failures
      }
    }

    _awardKeys(amount, reason) {
      if (!amount || amount <= 0) return;
      this.keysCurrency += amount;
      if (this.ui && this.ui.keysCount) {
        this.ui.keysCount.textContent = String(this.keysCurrency);
      }
      if (this.ui && this.ui.lobbyKeysVal) {
        this.ui.lobbyKeysVal.textContent = String(this.keysCurrency);
      }
      this._savePreferences();
      if (this.matchActive || this.inLobby) {
        this._pushKillFeed(`+${amount} KEYS (${reason})`);
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
        scoreboard: document.getElementById('scoreboard'),
        lobbyHudBar: document.getElementById('lobby-hud-bar'),
        lobbyClickHint: document.getElementById('lobby-click-hint'),
        rangeHudHint: document.getElementById('range-hud-hint'),
        lobbyStreakVal: document.getElementById('lobby-streak-val'),
        lobbyKeysVal: document.getElementById('lobby-keys-val'),
        pickerOverlay: document.getElementById('loadout-picker-overlay'),
        pickerCard: document.getElementById('picker-card'),
        pickerEyebrow: document.getElementById('picker-eyebrow'),
        pickerTitle: document.getElementById('picker-title'),
        pickerTimer: document.getElementById('picker-timer'),
        pickerReadyBtn: document.getElementById('picker-ready-btn'),
        pickerWeaponGrid: document.getElementById('picker-weapon-grid'),
        pickerSlots: {
          primary: document.getElementById('picker-slot-primary'),
          secondary: document.getElementById('picker-slot-secondary'),
          melee: document.getElementById('picker-slot-melee'),
          utility: document.getElementById('picker-slot-utility'),
        },
        menu: document.getElementById('menu-overlay'),
        matchEnd: document.getElementById('match-end-overlay'),
        lobbyBtn: document.getElementById('lobby-btn'),
        endLobbyBtn: document.getElementById('end-lobby-btn'),
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
        warhornBadge: document.getElementById('warhorn-badge'),
        shieldBadge: document.getElementById('shield-badge'),
        scopeHint: document.getElementById('scope-hint'),
        keysCount: document.getElementById('keys-count'),
        streakCount: document.getElementById('streak-count'),
        profIcon: document.getElementById('prof-icon'),
        profTier: document.getElementById('prof-tier'),
        profName: document.getElementById('prof-name'),
        profActionBtn: document.getElementById('prof-action-btn'),
        profDesc: document.getElementById('prof-desc'),
        profTip: document.getElementById('prof-tip'),
        profDmgTxt: document.getElementById('prof-dmg-txt'),
        profDmgBar: document.getElementById('prof-dmg-bar'),
        profRofTxt: document.getElementById('prof-rof-txt'),
        profRofBar: document.getElementById('prof-rof-bar'),
        profRngTxt: document.getElementById('prof-rng-txt'),
        profRngBar: document.getElementById('prof-rng-bar'),
        profMobTxt: document.getElementById('prof-mob-txt'),
        profMobBar: document.getElementById('prof-mob-bar'),
        gridPrimary: document.getElementById('grid-primary'),
        gridSecondary: document.getElementById('grid-secondary'),
        gridMelee: document.getElementById('grid-melee'),
        gridUtility: document.getElementById('grid-utility'),
        roundLabel: document.getElementById('round-label'),
        roundTimer: document.getElementById('round-timer'),
        hpValue: document.getElementById('hp-value'),
        hpFill: document.getElementById('hp-bar-fill'),
        djumpFill: document.getElementById('djump-cd-fill'),
        slideFill: document.getElementById('slide-cd-fill'),
        dashFill: document.getElementById('dash-cd-fill'),
        weaponName: document.getElementById('weapon-name-hud'),
        ammoCurrent: document.getElementById('ammo-current'),
        ammoReserve: document.getElementById('ammo-reserve'),
        reloadInd: document.getElementById('reload-indicator'),
        reloadBarWrap: document.getElementById('reload-bar-wrap'),
        reloadBarFill: document.getElementById('reload-bar-fill'),
        emoteBar: document.getElementById('emote-bar'),
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
        graphicsToggle: document.getElementById('graphics-toggle'),
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
      syncGroup('map', 'map', this.loadoutChoice.map);
      syncGroup('gravity', 'grav', this.loadoutChoice.gravity);
      syncGroup('mode', 'mode', this.loadoutChoice.mode);
      syncGroup('difficulty', 'diff', this.loadoutChoice.difficulty);
      syncGroup('weaponSkin', 'skin', this.loadoutChoice.weaponSkin);
      syncGroup('rivalSkin', 'rskin', this.loadoutChoice.rivalSkin);
      syncGroup('killEffect', 'kfx', this.loadoutChoice.killEffect);

      this._renderArmory();
      this._showWeaponProfile(this.previewWeaponId || this.loadoutChoice.primary);

      this.ui.sensSlider.value = String(this.settings.sensitivity);
      this.ui.sensVal.textContent = this.settings.sensitivity.toFixed(1);
      this.ui.fovSlider.value = String(this.settings.fov);
      this.ui.fovVal.textContent = String(this.settings.fov);
      if (this.ui.autoShootToggle) this.ui.autoShootToggle.checked = this.settings.autoShoot;
      if (this.ui.graphicsToggle) this.ui.graphicsToggle.checked = this.settings.highGraphics !== false;
      this._applyGraphicsSettings();
      this._updateAutoShootBadge();
    }

    _getWeaponShortTag(w) {
      if (w.pierceWalls) return 'Pierces Walls';
      if (w.scopedOnly) return 'Scope-Only 150 HS';
      if (w.launchGrenade) return 'Bouncing Shells';
      if (w.cryoFreeze) return 'HS Freezes 1.4s';
      if (w.vortexRadius) return 'Vortex Pull Blast';
      if (w.warpBoost) return 'Hit Speed Surge';
      if (w.explosiveRadius) return `Blast ${w.damage} AoE`;
      if (w.flameStream) return 'Flame Stream';
      if (w.spawnFirePool) return 'Fire Pool';
      if (w.shieldBlock) return 'RMB -80% Guard';
      if (w.slamRadius) return 'RMB Shock Slam';
      if (w.scytheJump) return 'RMB Scythe Jump';
      if (w.buildWall) return 'RMB Build Wall';
      if (w.backstabDamage) return `${w.backstabDamage} Backstab`;
      if (w.utilityType === 'jumppad') return 'Deploy Jump Pad';
      if (w.utilityType === 'subspace') return '110 Stealth Mine';
      if (w.utilityType === 'grappler') return '75m Grapple Hook';
      if (w.utilityType === 'warpstone') return '42m Teleport';
      if (w.utilityType === 'holodome') return '6s Shield Dome';
      if (w.utilityType === 'freeze') return 'Freeze 2.2s';
      if (w.utilityType === 'warhorn') return '+38% Speed/ROF';
      if (w.utilityType === 'medkit') return 'Heal +50 HP';
      if (w.utilityType === 'satchel') return '105 AoE / Jump';
      if (w.utilityType === 'smoke') return 'Blocks AI Vision';
      if (w.utilityType === 'flash') return 'Blinds 2.8s';
      if (w.utilityType === 'molotov') return 'Burn Zone';
      if (w.utilityType === 'frag') return '92 AoE / Jump';
      if (w.pellets > 1) return `${w.pellets}x${w.damage} Pellets`;
      if (w.slotType === 'melee') return `${w.damage} / ${w.lungeDamage} Lunge`;
      return `${w.damage} / ${w.headDamage || w.damage} HS`;
    }

    _renderArmory() {
      if (this.ui.keysCount) {
        this.ui.keysCount.textContent = String(this.keysCurrency);
      }
      if (this.ui.lobbyKeysVal) {
        this.ui.lobbyKeysVal.textContent = String(this.keysCurrency);
      }
      if (this.ui.streakCount) {
        this.ui.streakCount.textContent = String(this.winStreak);
      }
      if (this.ui.lobbyStreakVal) {
        this.ui.lobbyStreakVal.textContent = String(this.winStreak);
      }

      const grids = {
        primary: this.ui.gridPrimary,
        secondary: this.ui.gridSecondary,
        melee: this.ui.gridMelee,
        utility: this.ui.gridUtility,
      };

      for (const slotKey of Object.keys(grids)) {
        const container = grids[slotKey];
        if (!container) continue;
        container.innerHTML = '';

        const list = Object.values(WEAPONS).filter((w) => w.slotType === slotKey);
        for (const w of list) {
          const unlocked = this.unlockedWeapons.has(w.id) || (w.cost || 0) <= 0;
          const equipped = this.loadoutChoice[slotKey] === w.id;
          const previewing = this.previewWeaponId === w.id;

          const btn = document.createElement('button');
          btn.className = 'choice-btn weapon-card-btn';
          if (equipped) btn.classList.add('active');
          if (!unlocked) btn.classList.add('locked-weapon');
          if (previewing) btn.classList.add('previewing');
          btn.dataset.weapon = w.id;

          const iconWrap = document.createElement('div');
          iconWrap.innerHTML = getWeaponIconSVG(w.id);

          const strong = document.createElement('strong');
          strong.textContent = w.name;
          const sub = document.createElement('span');
          if (!unlocked) {
            sub.className = 'key-tag';
            sub.textContent = `LOCKED · ${w.cost} KEYS`;
          } else {
            sub.textContent = this._getWeaponShortTag(w);
          }

          btn.appendChild(iconWrap);
          btn.appendChild(strong);
          btn.appendChild(sub);

          btn.addEventListener('mouseenter', () => {
            this._showWeaponProfile(w.id);
          });

          btn.addEventListener('click', () => {
            this.previewWeaponId = w.id;
            if (unlocked) {
              this.loadoutChoice[slotKey] = w.id;
              this._savePreferences();
              if (this.matchActive && this.loadoutChoice.mode === 'range') {
                this._buildLoadoutSlots();
              }
            }
            this._renderArmory();
            this._showWeaponProfile(w.id);
          });

          container.appendChild(btn);
        }
      }
    }

    _showWeaponProfile(weaponId) {
      const w = WEAPONS[weaponId] || WEAPONS.ar;
      this.previewWeaponId = w.id;
      const unlocked = this.unlockedWeapons.has(w.id) || (w.cost || 0) <= 0;
      const equipped = this.loadoutChoice[w.slotType] === w.id;

      if (this.ui.profIcon) {
        this.ui.profIcon.innerHTML = getWeaponIconSVG(w.id);
      }
      if (this.ui.profTier) {
        const tier = (w.tier || 'Starter').toLowerCase();
        this.ui.profTier.textContent = `${(w.tier || 'Starter').toUpperCase()} · ${w.slotType.toUpperCase()}`;
        this.ui.profTier.className = `profile-tier tier-${tier}`;
      }
      if (this.ui.profName) this.ui.profName.textContent = w.name;
      if (this.ui.profDesc) this.ui.profDesc.textContent = w.desc || '';
      if (this.ui.profTip) this.ui.profTip.textContent = w.tip ? `Tip: ${w.tip}` : '';

      const dmgVal = w.pellets > 1 ? w.damage * w.pellets : w.backstabDamage || w.headDamage || w.damage || 0;
      const dmgPct = Math.min(100, Math.max(8, Math.round((dmgVal / 150) * 100)));
      const dmgTxt =
        w.slotType === 'utility'
          ? w.damage > 0
            ? `${w.damage} DMG`
            : w.utilityType === 'medkit'
            ? '+50 HP'
            : 'TACTICAL'
          : w.slotType === 'melee'
          ? w.backstabDamage
            ? `${w.damage} / ${w.backstabDamage} BS`
            : `${w.damage} / ${w.lungeDamage} LNG`
          : w.pellets > 1
          ? `${w.pellets}x${w.damage}`
          : `${w.damage} / ${w.headDamage || w.damage} HS`;

      const rof = w.fireRate || 1;
      const rofPct = Math.min(100, Math.max(8, Math.round((rof / 16.5) * 100)));
      const rofTxt = `${rof.toFixed(1)} /s`;

      const rng = w.range || 0;
      const rngPct = Math.min(100, Math.max(8, Math.round((rng / 240) * 100)));
      const rngTxt = rng > 0 ? `${rng}m` : 'SELF';

      const mob = Math.round((w.moveMult || 1) * 100);
      const mobPct = Math.min(100, Math.max(20, Math.round(((mob - 75) / 50) * 100)));

      if (this.ui.profDmgTxt) this.ui.profDmgTxt.textContent = dmgTxt;
      if (this.ui.profDmgBar) this.ui.profDmgBar.style.width = `${dmgPct}%`;
      if (this.ui.profRofTxt) this.ui.profRofTxt.textContent = rofTxt;
      if (this.ui.profRofBar) this.ui.profRofBar.style.width = `${rofPct}%`;
      if (this.ui.profRngTxt) this.ui.profRngTxt.textContent = rngTxt;
      if (this.ui.profRngBar) this.ui.profRngBar.style.width = `${rngPct}%`;
      if (this.ui.profMobTxt) this.ui.profMobTxt.textContent = `${mob}%`;
      if (this.ui.profMobBar) this.ui.profMobBar.style.width = `${mobPct}%`;

      const btn = this.ui.profActionBtn;
      if (btn) {
        btn.className = 'profile-unlock-btn';
        if (equipped) {
          btn.textContent = 'EQUIPPED';
          btn.classList.add('equipped');
        } else if (unlocked) {
          btn.textContent = 'EQUIP';
          btn.classList.add('equip');
        } else if (this.keysCurrency >= (w.cost || 0)) {
          btn.textContent = `UNLOCK (${w.cost} KEYS)`;
          btn.classList.add('buy');
        } else {
          btn.textContent = `NEED ${w.cost} KEYS`;
          btn.classList.add('locked-poor');
        }
      }
    }

    _handleProfileAction() {
      const w = WEAPONS[this.previewWeaponId];
      if (!w) return;
      const unlocked = this.unlockedWeapons.has(w.id) || (w.cost || 0) <= 0;
      if (unlocked) {
        this.loadoutChoice[w.slotType] = w.id;
        this._savePreferences();
        if (this.matchActive && this.loadoutChoice.mode === 'range') {
          this._buildLoadoutSlots();
        }
        this._renderArmory();
        this._showWeaponProfile(w.id);
        return;
      }

      const cost = w.cost || 0;
      if (this.keysCurrency < cost) {
        this.sound.playDryClick();
        return;
      }

      this.sound.unlock();
      this.keysCurrency -= cost;
      this.unlockedWeapons.add(w.id);
      this.loadoutChoice[w.slotType] = w.id;
      this.sound.playUnlock();
      this._savePreferences();
      if (this.matchActive && this.loadoutChoice.mode === 'range') {
        this._buildLoadoutSlots();
      }
      this._renderArmory();
      this._showWeaponProfile(w.id);
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

      if (this.ui.profActionBtn) {
        this.ui.profActionBtn.addEventListener('click', () => this._handleProfileAction());
      }

      if (this.ui.pickerReadyBtn) {
        this.ui.pickerReadyBtn.addEventListener('click', () => {
          this.sound.unlock();
          this._closeLoadoutPicker(true);
        });
      }

      for (const slotKey of ['primary', 'secondary', 'melee', 'utility']) {
        const sBtn = this.ui.pickerSlots[slotKey];
        if (sBtn) {
          sBtn.addEventListener('click', () => {
            this.pickerSlot = slotKey;
            this._renderPickerSlots();
            this._renderPickerGrid();
          });
        }
      }

      document.querySelectorAll('[data-category]').forEach((group) => {
        const cat = group.dataset.category;
        if (['primary', 'secondary', 'melee', 'utility'].includes(cat)) return;
        group.querySelectorAll('.choice-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            group.querySelectorAll('.choice-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');

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
                this._clearLobbyBots();
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
      if (this.ui.graphicsToggle) {
        this.ui.graphicsToggle.addEventListener('change', (e) => {
          this.settings.highGraphics = e.target.checked;
          this._applyGraphicsSettings();
          this._savePreferences();
        });
      }

      if (this.ui.lobbyBtn) {
        this.ui.lobbyBtn.addEventListener('click', () => {
          this.sound.unlock();
          this.enterLobby();
        });
      }

      if (this.ui.endLobbyBtn) {
        this.ui.endLobbyBtn.addEventListener('click', () => {
          this.sound.unlock();
          this.ui.matchEnd.classList.add('hidden');
          this.enterLobby();
        });
      }

      this.ui.playBtn.addEventListener('click', () => {
        this.sound.unlock();
        if (this.inLobby) {
          this.isPaused = false;
          this.ui.menu.classList.add('hidden');
          this.ui.hud.classList.remove('hidden');
          this._buildLoadoutSlots();
          this._requestPointerLock();
          return;
        }
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
          this.sound.unlock();
          this.enterLobby();
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
        this._renderArmory();
        this._showWeaponProfile(this.previewWeaponId || this.loadoutChoice.primary);
        this.ui.menu.classList.remove('hidden');
      });

      document.addEventListener('pointerlockchange', () => {
        const locked = document.pointerLockElement === this.renderer.domElement;
        if (locked) {
          this.wasPointerLocked = true;
          if (this.ui.lobbyClickHint) this.ui.lobbyClickHint.classList.add('hidden');
        } else if (this.pickerOpen) {
          this.wasPointerLocked = false;
        } else if (this.wasPointerLocked && (this.matchActive || this.inLobby) && this.roundState !== 'match_over') {
          this.wasPointerLocked = false;
          this._openPauseMenu();
        }
      });

      window.addEventListener('keydown', (e) => {
        const code = e.code;
        if (this.pickerOpen) {
          if (code === 'Digit1') { this.pickerSlot = 'primary'; this._renderPickerSlots(); this._renderPickerGrid(); return; }
          if (code === 'Digit2') { this.pickerSlot = 'secondary'; this._renderPickerSlots(); this._renderPickerGrid(); return; }
          if (code === 'Digit3') { this.pickerSlot = 'melee'; this._renderPickerSlots(); this._renderPickerGrid(); return; }
          if (code === 'Digit4') { this.pickerSlot = 'utility'; this._renderPickerSlots(); this._renderPickerGrid(); return; }
          if (code === 'Enter') { this._closeLoadoutPicker(true); return; }
          if (code === 'Tab' && this.pickerIsRange) { e.preventDefault(); this._closeLoadoutPicker(true); return; }
          if (code === 'Escape') {
            this._closeLoadoutPicker(false);
            this._openPauseMenu();
            return;
          }
          return;
        }

        if (code === 'Escape' && (this.matchActive || this.inLobby) && !this.isPaused && this.roundState !== 'match_over') {
          this._openPauseMenu();
          return;
        }
        if (code === 'Tab' && !this.isPaused) {
          if (this.inLobby) {
            e.preventDefault();
            if (document.pointerLockElement) document.exitPointerLock();
            this._openPauseMenu();
            return;
          }
          if (this.loadoutChoice.mode === 'range' && this.matchActive) {
            e.preventDefault();
            this._openLoadoutPicker(true);
            return;
          }
        }
        if (['Space', 'Tab'].includes(code) && !this.isPaused) {
          e.preventDefault();
        }
        this.keys[code] = true;

        if (this.isPaused || !this.matchActive) return;

        // Emote Picker bar (press B to open/close, then 1-5 to pick!)
        if (code === 'KeyB') {
          this.emoteWheelOpen = !this.emoteWheelOpen;
          if (this.ui.emoteBar) this.ui.emoteBar.classList.toggle('hidden', !this.emoteWheelOpen);
          return;
        }
        if (this.emoteWheelOpen) {
          const mapKeys = { Digit1: 'griddy', Digit2: 'takeL', Digit3: 'backflip', Digit4: 'swordspin', Digit5: 'wave' };
          if (mapKeys[code]) {
            this._startEmote(mapKeys[code]);
            return;
          }
        }

        // Instant Rivals Emote hotkeys (Z / X / V) & Weapon Inspect (G / I)!
        if (code === 'KeyZ') { this._startEmote('griddy'); return; }
        if (code === 'KeyX') { this._startEmote('takeL'); return; }
        if (code === 'KeyV') { this._startEmote('backflip'); return; }
        if (code === 'KeyG' || code === 'KeyI') { this._startInspect(); return; }

        // Moving cancels an active emote cleanly
        if (this.activeEmote && ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(code)) {
          this._stopEmote();
        }

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
        if (this.isPaused || this.pickerOpen || (!this.matchActive && !this.inLobby)) return;
        this.sound.unlock();
        if (document.pointerLockElement !== this.renderer.domElement) {
          this._requestPointerLock();
          if (this.ui.lobbyClickHint) this.ui.lobbyClickHint.classList.add('hidden');
          if (this.inLobby) return;
        }
        if (this.activeEmote) this._stopEmote();
        if (e.button === 0) {
          this.isMouseDown = true;
          this._tryFire(true);
        } else if (e.button === 2) {
          this.inspectTimer = 0;
          const cw = this._currentWeapon();
          if (cw.shieldBlock) {
            this.isShielding = true;
          } else if (cw.slotType === 'melee') {
            this._tryMeleeLunge();
          } else {
            this.isAds = true;
          }
        }
      });

      window.addEventListener('mouseup', (e) => {
        if (e.button === 0) this.isMouseDown = false;
        if (e.button === 2) {
          this.isAds = false;
          this.isShielding = false;
        }
      });

      window.addEventListener('contextmenu', (e) => e.preventDefault());

      window.addEventListener('wheel', (e) => {
        if (this.isPaused || !this.matchActive) return;
        const dir = e.deltaY > 0 ? 1 : -1;
        const next = (this.activeSlot + dir + this.slots.length) % this.slots.length;
        this.switchWeapon(next);
      });
    }

    _spawnLobbyBots() {
      this._clearLobbyBots();
      if (this.arena.mapId !== 'lobby') return;
      const spots = [
        new THREE.Vector3(-12, 0, -10),
        new THREE.Vector3(0, 0, -13),
        new THREE.Vector3(12, 0, -10),
        new THREE.Vector3(-14, 0, 3),
        new THREE.Vector3(14, 0, 3),
        new THREE.Vector3(-8, 0, 12),
        new THREE.Vector3(9, 0, 11),
        new THREE.Vector3(0, 0, -4),
      ];
      for (let i = 0; i < 8; i++) {
        const prof = BOT_PROFILES[i % BOT_PROFILES.length];
        this.lobbyBots.push(new LobbyBot(this.scene, this.arena, prof, spots[i]));
      }
    }

    _clearLobbyBots() {
      for (const lb of this.lobbyBots) {
        if (lb.dispose) lb.dispose();
      }
      this.lobbyBots = [];
    }

    enterLobby(requestLock = true) {
      this._closeLoadoutPicker(false);
      this.inLobby = true;
      this.matchActive = true;
      this.isPaused = false;
      this.roundState = 'lobby';
      this.activeLobbyPad = null;
      this.lobbyPadTimer = 0;
      this.isReloading = false;
      this.isAds = false;
      this.isShielding = false;
      this.inspectTimer = 0;
      this._stopEmote();
      this._clearRoundEntities();
      this._clearExtraEnemies();

      this.bot.alive = false;
      this.bot.setVisible(false);
      this.enemies = [];

      if (this.arena.mapId !== 'lobby') {
        this.arena.loadMap('lobby');
      }
      if (this.lobbyCrateClaimed && this.arena.lobbyKeyCrate) {
        this.arena.lobbyKeyCrate.mesh.visible = false;
        this.arena.lobbyKeyCrate.sign.visible = false;
      }
      this._spawnLobbyBots();

      this.player.pos.set(0, 0, 7);
      this.player.vel.set(0, 0, 0);
      this.player.yaw = 0;
      this.player.pitch = 0;
      this.player.hp = this.player.maxHp;
      this.player.alive = true;
      this.player.jumpsLeft = 2;
      this.player.warhornTimer = 0;
      this.player.warpBoostTimer = 0;
      this.player.slideTimer = 0;

      this._buildLoadoutSlots();
      this.ui.menu.classList.add('hidden');
      this.ui.matchEnd.classList.add('hidden');
      this.ui.centerBanner.classList.add('hidden');
      this.ui.hud.classList.remove('hidden');
      if (this.ui.scoreboard) this.ui.scoreboard.classList.add('hidden');
      if (this.ui.rangeHudHint) this.ui.rangeHudHint.classList.add('hidden');
      if (this.ui.lobbyHudBar) this.ui.lobbyHudBar.classList.remove('hidden');
      if (this.ui.lobbyClickHint) this.ui.lobbyClickHint.classList.toggle('hidden', requestLock);
      if (this.ui.lobbyStreakVal) this.ui.lobbyStreakVal.textContent = String(this.winStreak);
      if (this.ui.lobbyKeysVal) this.ui.lobbyKeysVal.textContent = String(this.keysCurrency);
      this.ui.killFeed.innerHTML = '';
      this._pushKillFeed('WELCOME TO ROBLOX RIVALS HUB! WALK INTO EAST WALL FOR SHOOTING RANGE!');
      this._updateHUD();
      if (requestLock) this._requestPointerLock();
    }

    _openLoadoutPicker(isRange = false) {
      this.pickerOpen = true;
      this.pickerIsRange = isRange;
      this.pickerSlot = 'primary';
      this.isMouseDown = false;
      this.isAds = false;
      this.isShielding = false;
      this.wasPointerLocked = false;
      if (document.pointerLockElement) document.exitPointerLock();

      if (this.ui.pickerOverlay) this.ui.pickerOverlay.classList.remove('hidden');
      if (this.ui.pickerCard) this.ui.pickerCard.classList.remove('danger-live');
      if (isRange) {
        if (this.ui.pickerEyebrow) this.ui.pickerEyebrow.textContent = 'SHOOTING RANGE · ALL 52 WEAPONS FREE';
        if (this.ui.pickerTitle) this.ui.pickerTitle.textContent = 'PICK ANY WEAPON TO TEST';
        if (this.ui.pickerTimer) {
          this.ui.pickerTimer.textContent = 'ALL 52 FREE';
          this.ui.pickerTimer.classList.remove('urgent');
        }
        if (this.ui.pickerReadyBtn) this.ui.pickerReadyBtn.textContent = 'EQUIP & SHOOT!';
      } else {
        if (this.ui.pickerEyebrow) this.ui.pickerEyebrow.textContent = 'PRE-ROUND LOADOUT (5 SECONDS!)';
        if (this.ui.pickerTitle) this.ui.pickerTitle.textContent = 'PICK YOUR LOADOUT FAST!';
        if (this.ui.pickerReadyBtn) this.ui.pickerReadyBtn.textContent = 'READY / FIGHT!';
        this._updatePickerTimerUI();
      }
      this._renderPickerSlots();
      this._renderPickerGrid();
    }

    _closeLoadoutPicker(lockPointer = true) {
      if (!this.pickerOpen) return;
      this.pickerOpen = false;
      if (this.ui.pickerOverlay) this.ui.pickerOverlay.classList.add('hidden');
      if (this.ui.pickerCard) this.ui.pickerCard.classList.remove('danger-live');
      this._buildLoadoutSlots();
      if (lockPointer && !this.isPaused) {
        this._requestPointerLock();
      }
    }

    _renderPickerSlots() {
      const source = this.pickerIsRange ? this.rangeLoadout : this.loadoutChoice;
      for (const slotKey of ['primary', 'secondary', 'melee', 'utility']) {
        const el = this.ui.pickerSlots[slotKey];
        if (!el) continue;
        const w = WEAPONS[source[slotKey]] || WEAPONS.ar;
        el.classList.toggle('active', this.pickerSlot === slotKey);
        const iconEl = el.querySelector('.pslot-icon');
        const nameEl = el.querySelector('.pslot-name');
        if (iconEl) iconEl.innerHTML = getWeaponIconSVG(w.id);
        if (nameEl) nameEl.textContent = w.name;
      }
    }

    _renderPickerGrid() {
      const grid = this.ui.pickerWeaponGrid;
      if (!grid) return;
      grid.innerHTML = '';
      const source = this.pickerIsRange ? this.rangeLoadout : this.loadoutChoice;
      const list = Object.values(WEAPONS).filter((w) => w.slotType === this.pickerSlot);

      for (const w of list) {
        const available = this.pickerIsRange || this.unlockedWeapons.has(w.id) || (w.cost || 0) <= 0;
        const isSelected = source[this.pickerSlot] === w.id;
        const btn = document.createElement('button');
        btn.className = 'picker-wep-btn';
        if (isSelected) btn.classList.add('selected');
        if (!available) btn.classList.add('locked');

        btn.innerHTML = `${getWeaponIconSVG(w.id)}<strong>${w.name}</strong><span>${
          available ? this._getWeaponShortTag(w) : `LOCKED · ${w.cost} KEYS`
        }</span>`;

        btn.addEventListener('click', () => {
          if (!available) {
            this.sound.playDryClick();
            return;
          }
          source[this.pickerSlot] = w.id;
          if (!this.pickerIsRange) {
            this._savePreferences();
          }
          this._buildLoadoutSlots();
          this._renderPickerSlots();
          this._renderPickerGrid();
        });
        grid.appendChild(btn);
      }
    }

    _updatePickerTimerUI() {
      if (!this.pickerOpen || this.pickerIsRange) return;
      if (this.roundState === 'countdown') {
        const t = Math.max(0, this.stateTimer);
        if (this.ui.pickerTimer) {
          this.ui.pickerTimer.textContent = `${t.toFixed(1)}s`;
          this.ui.pickerTimer.classList.toggle('urgent', t <= 2.0);
        }
        if (this.ui.pickerCard) this.ui.pickerCard.classList.remove('danger-live');
      } else if (this.roundState === 'playing') {
        // 5 SECONDS RAN OUT! Round started WITHOUT you — Rival is attacking!
        if (this.ui.pickerCard) this.ui.pickerCard.classList.add('danger-live');
        if (this.ui.pickerTimer) {
          this.ui.pickerTimer.textContent = 'LIVE! FIGHT!';
          this.ui.pickerTimer.classList.add('urgent');
        }
        if (this.ui.pickerEyebrow) this.ui.pickerEyebrow.textContent = 'TIME UP! ROUND STARTED WITHOUT YOU!';
        if (this.ui.pickerTitle) this.ui.pickerTitle.textContent = 'RIVAL IS ATTACKING — CLICK READY NOW!';
      }
    }

    _updateLobby(dt) {
      for (const lb of this.lobbyBots) {
        lb.update(dt, this.player.pos);
      }

      // Bonus Lobby Key Crate pickup!
      const crate = this.arena.lobbyKeyCrate;
      if (crate && !this.lobbyCrateClaimed) {
        const dCrate = Math.hypot(this.player.pos.x - crate.pos.x, this.player.pos.z - crate.pos.z);
        if (dCrate < 2.6 && this.player.pos.y < 3.0) {
          this.lobbyCrateClaimed = true;
          crate.mesh.visible = false;
          crate.sign.visible = false;
          this.sound.playUnlock();
          this._spawnParticles(crate.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), 0xfbbf24, 24, 9);
          this._awardKeys(25, 'LOBBY BONUS CRATE');
          this._showBanner('+25 FREE KEYS!', 'VISIT ARMORY & SHOP TO UNLOCK WEAPONS', false);
          setTimeout(() => {
            if (this.inLobby && !this.activeLobbyPad) this.ui.centerBanner.classList.add('hidden');
          }, 2000);
        }
      }

      // Walk-on Matchmaking Pads & East Wall Shooting Range Doorway!
      const pad = this.arena.getLobbyPadAt(this.player.pos);
      if (pad) {
        if (pad.mode === 'shop') {
          if (this.activeLobbyPad?.id !== 'armory') {
            this.activeLobbyPad = pad;
            if (document.pointerLockElement) document.exitPointerLock();
            this._openPauseMenu();
          }
          return;
        }
        if (pad.instant) {
          // Walk straight through the East Wall Shooting Range doorway!
          this.loadoutChoice.mode = pad.mode;
          this.loadoutChoice.map = 'shootingrange';
          this._syncMenuFromState();
          this.startNewMatch();
          return;
        }
        if (this.activeLobbyPad?.id !== pad.id) {
          this.activeLobbyPad = pad;
          this.lobbyPadTimer = 1.8;
          this.lobbyPadLastSec = 3;
          this.sound.playBeep(false);
        }
        this.lobbyPadTimer -= dt;
        const sec = Math.max(1, Math.ceil(this.lobbyPadTimer));
        if (sec !== this.lobbyPadLastSec) {
          this.lobbyPadLastSec = sec;
          this.sound.playBeep(false);
        }
        const challenger = BOT_PROFILES[Math.floor(Math.abs(pad.x + pad.z)) % BOT_PROFILES.length].name;
        this._showBanner(`QUEUE: ${pad.title}`, `MATCHING WITH ${challenger} · ${sec}... (STEP OFF TO CANCEL)`, false);

        if (this.lobbyPadTimer <= 0) {
          this.loadoutChoice.mode = pad.mode;
          if (pad.mode === 'range') {
            this.loadoutChoice.map = 'shootingrange';
          } else if (this.loadoutChoice.map === 'shootingrange' || this.loadoutChoice.map === 'lobby') {
            this.loadoutChoice.map = 'arena';
          }
          this._syncMenuFromState();
          this._savePreferences();
          this.startNewMatch();
        }
      } else if (this.activeLobbyPad) {
        this.activeLobbyPad = null;
        this.lobbyPadTimer = 0;
        this.ui.centerBanner.classList.add('hidden');
      }
    }

    _openPauseMenu() {
      this.isPaused = true;
      this.isMouseDown = false;
      this.isAds = false;
      this.isShielding = false;
      this.ui.playBtn.textContent = this.inLobby ? 'RESUME LOBBY' : 'RESUME MATCH';
      this.ui.restartBtn.classList.toggle('hidden', this.inLobby);
      if (this.ui.exitMenuBtn) this.ui.exitMenuBtn.classList.toggle('hidden', this.inLobby);
      this._renderArmory();
      this._showWeaponProfile(this.previewWeaponId || this.loadoutChoice.primary);
      this.ui.menu.classList.remove('hidden');
    }

    _exitToMainMenu() {
      this.matchActive = false;
      this.isPaused = true;
      this.roundState = 'menu';
      this.isMouseDown = false;
      this.isAds = false;
      if (document.pointerLockElement) document.exitPointerLock();
      this._stopEmote();
      this._resetReloadParts();
      this._clearRoundEntities();
      this._clearExtraEnemies();
      this.ui.hud.classList.add('hidden');
      this.ui.centerBanner.classList.add('hidden');
      this.ui.matchEnd.classList.add('hidden');
      this.ui.playBtn.textContent = 'ENTER ARENA';
      this.ui.restartBtn.classList.add('hidden');
      if (this.ui.exitMenuBtn) this.ui.exitMenuBtn.classList.add('hidden');
      this._renderArmory();
      this._showWeaponProfile(this.previewWeaponId || this.loadoutChoice.primary);
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
      // Do not auto-throw utility grenades/smoke, and respect Sniper scope-only lock!
      if (w.slotType === 'utility' || (w.scopedOnly && !this.isAds)) {
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
      this.inLobby = false;
      this._clearLobbyBots();
      this.activeLobbyPad = null;
      this.matchActive = true;
      this.isPaused = false;
      if (this.loadoutChoice.map === 'lobby' || !MAPS[this.loadoutChoice.map]) {
        this.loadoutChoice.map = 'arena';
      }
      this.activeMatchMode = this.loadoutChoice.mode;
      this.activeMatchMap = this.loadoutChoice.map;
      this.escapedRange = false;
      this.playerScore = 0;
      this.botScore = 0;
      this.roundNumber = 1;
      this.killStreak = 0;
      this.firstBloodDone = false;
      this.stats = { kills: 0, headshots: 0, damageDealt: 0 };

      if (this.arena.mapId !== this.loadoutChoice.map) {
        this.arena.loadMap(this.loadoutChoice.map);
      }

      this.ui.menu.classList.add('hidden');
      this.ui.matchEnd.classList.add('hidden');
      this.ui.hud.classList.remove('hidden');
      if (this.ui.lobbyHudBar) this.ui.lobbyHudBar.classList.add('hidden');
      if (this.ui.lobbyClickHint) this.ui.lobbyClickHint.classList.add('hidden');
      if (this.ui.scoreboard) this.ui.scoreboard.classList.remove('hidden');
      if (this.ui.playerTeamName) {
        this.ui.playerTeamName.textContent =
          this.loadoutChoice.mode === 'tdm'
            ? 'BLUE TEAM'
            : this.loadoutChoice.mode === 'twovtwo'
            ? 'BLUE (2v2)'
            : this.loadoutChoice.mode === 'ffa'
            ? 'YOU (FFA)'
            : 'YOU';
      }
      const rivalProfile = BOT_PROFILES[Math.floor(Math.random() * BOT_PROFILES.length)];
      this.currentRivalProfile = rivalProfile;
      this.ui.botName.textContent =
        this.loadoutChoice.mode === 'range'
          ? 'DUMMIES'
          : this.loadoutChoice.mode === 'practice'
          ? 'PRACTICE NPCs'
          : this.loadoutChoice.mode === 'tdm'
          ? 'RED TEAM'
          : this.loadoutChoice.mode === 'twovtwo'
          ? 'RED (2v2)'
          : this.loadoutChoice.mode === 'ffa'
          ? 'TOP BOT'
          : rivalProfile.name;
      this.ui.mapBadge.textContent = MAPS[this.arena.mapId].name;
      this.ui.killFeed.innerHTML = '';

      this._startRound();
      if (!this.pickerOpen) this._requestPointerLock();
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
        const allySpawn = spawns.player.clone();
        allySpawn.x -= 3.6;
        const ally1 = new RivalBot(this.scene, this.arena);
        ally1.team = 'blue';
        ally1.name = 'ALLY';
        ally1.passive = false;
        ally1.reset(allySpawn, this.loadoutChoice.difficulty, 'ally', 'twovtwo');
        this.allies = [ally1];

        const r1Spawn = spawns.bot.clone();
        r1Spawn.x -= 3.5;
        this.bot.team = 'red';
        this.bot.name = 'RIVAL 1';
        this.bot.passive = false;
        this.bot.reset(r1Spawn, this.loadoutChoice.difficulty, this.loadoutChoice.rivalSkin, 'twovtwo');

        const r2Spawn = spawns.bot.clone();
        r2Spawn.x += 3.5;
        const red2 = new RivalBot(this.scene, this.arena);
        red2.team = 'red';
        red2.name = 'RIVAL 2';
        red2.passive = false;
        red2.reset(r2Spawn, this.loadoutChoice.difficulty, this.loadoutChoice.rivalSkin, 'twovtwo');

        this.extraEnemies = [red2];
        this.enemies = [this.bot, red2];
      } else if (this.loadoutChoice.mode === 'tdm') {
        const a1Pos = spawns.player.clone();
        a1Pos.x -= 4.2;
        const a2Pos = spawns.player.clone();
        a2Pos.x += 4.2;

        const ally1 = new RivalBot(this.scene, this.arena);
        ally1.team = 'blue';
        ally1.name = 'BLUE ALLY 1';
        ally1.passive = false;
        ally1.reset(a1Pos, this.loadoutChoice.difficulty, 'ally', 'tdm');

        const ally2 = new RivalBot(this.scene, this.arena);
        ally2.team = 'blue';
        ally2.name = 'BLUE ALLY 2';
        ally2.passive = false;
        ally2.reset(a2Pos, this.loadoutChoice.difficulty, 'ally', 'tdm');
        this.allies = [ally1, ally2];

        const r1Pos = spawns.bot.clone();
        r1Pos.x -= 4.5;
        const r2Pos = spawns.bot.clone();
        const r3Pos = spawns.bot.clone();
        r3Pos.x += 4.5;

        this.bot.team = 'red';
        this.bot.name = 'RED RIVAL 1';
        this.bot.passive = false;
        this.bot.reset(r1Pos, this.loadoutChoice.difficulty, this.loadoutChoice.rivalSkin, 'tdm');

        const red2 = new RivalBot(this.scene, this.arena);
        red2.team = 'red';
        red2.name = 'RED RIVAL 2';
        red2.passive = false;
        red2.reset(r2Pos, this.loadoutChoice.difficulty, this.loadoutChoice.rivalSkin, 'tdm');

        const red3 = new RivalBot(this.scene, this.arena);
        red3.team = 'red';
        red3.name = 'RED RIVAL 3';
        red3.passive = false;
        red3.reset(r3Pos, this.loadoutChoice.difficulty, this.loadoutChoice.rivalSkin, 'tdm');

        this.extraEnemies = [red2, red3];
        this.enemies = [this.bot, red2, red3];
      } else if (this.loadoutChoice.mode === 'ffa') {
        // 5-Bot Free-For-All! Bots fight YOU and EACH OTHER!
        const wps = this.arena.getWaypoints();
        const getSpawn = (idx) => {
          const base = wps[idx % wps.length] || spawns.bot;
          return new THREE.Vector3(base.x + (Math.random() - 0.5) * 3, base.y, base.z + (Math.random() - 0.5) * 3);
        };

        const p0 = BOT_PROFILES[0];
        this.bot.team = 'ffa';
        this.bot.name = p0.name;
        this.bot.ffaScore = 0;
        this.bot.passive = false;
        this.bot.reset(getSpawn(0), this.loadoutChoice.difficulty, p0.skin, 'ffa');

        const others = [];
        for (let i = 1; i < 5; i++) {
          const prof = BOT_PROFILES[i % BOT_PROFILES.length];
          const b = new RivalBot(this.scene, this.arena);
          b.team = 'ffa';
          b.name = prof.name;
          b.ffaScore = 0;
          b.passive = false;
          b.reset(getSpawn(i), this.loadoutChoice.difficulty, prof.skin, 'ffa');
          others.push(b);
        }
        this.extraEnemies = others;
        this.enemies = [this.bot, ...others];
      } else {
        const prof = this.currentRivalProfile || BOT_PROFILES[0];
        this.bot.team = 'red';
        this.bot.name = prof.name;
        this.bot.passive = false;
        const botSpawn = spawns.bot.clone();
        botSpawn.x += (Math.random() - 0.5) * 4;
        this.bot.reset(botSpawn, this.loadoutChoice.difficulty, this.loadoutChoice.rivalSkin, this.loadoutChoice.mode);
        this.enemies = [this.bot];
      }
    }

    _pickRandomBySlot(slotType) {
      const list = Object.values(WEAPONS).filter((w) => w.slotType === slotType);
      return list[Math.floor(Math.random() * list.length)].id;
    }

    _buildLoadoutSlots() {
      let ids;
      if (this.loadoutChoice.mode === 'range' && !this.inLobby) {
        ids = [
          this.rangeLoadout.primary,
          this.rangeLoadout.secondary,
          this.rangeLoadout.melee,
          this.rangeLoadout.utility,
        ];
      } else if (this.loadoutChoice.mode === 'assassin') {
        ids = ['crossbow', 'kunai', 'knife', 'smoke'];
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
      for (const m of this.mines) {
        this.scene.remove(m.mesh);
      }
      this.mines = [];
      for (const hd of this.holodomes) {
        this.scene.remove(hd.mesh);
      }
      this.holodomes = [];
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
      this.roundTimer = this.loadoutChoice.mode === 'tdm' || this.loadoutChoice.mode === 'ffa' ? TDM_DURATION : ROUND_DURATION;
      this.playerRespawnTimer = 0;
      this.isReloading = false;
      this.isAds = false;
      this.isShielding = false;
      this.firstBloodDone = false;
      this.killStreak = 0;
      this.inspectTimer = 0;
      this._stopEmote();
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
      this.player.jumpsLeft = 2;
      this.player.warhornTimer = 0;
      this.scopeHintTimer = 0;
      if (this.ui.scopeHint) this.ui.scopeHint.classList.add('hidden');
      if (this.ui.warhornBadge) this.ui.warhornBadge.classList.add('hidden');
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
        if (this.ui.rangeHudHint) this.ui.rangeHudHint.classList.remove('hidden');
        this.ui.centerBanner.classList.add('hidden');
        this._openLoadoutPicker(true);
        return;
      }

      if (this.ui.rangeHudHint) this.ui.rangeHudHint.classList.add('hidden');

      const use5SecPicker = ['classic', 'twovtwo', 'tdm', 'ffa', 'practice'].includes(this.loadoutChoice.mode);
      if (use5SecPicker) {
        this.stateTimer = 5.0;
        this.countdownLastSec = 6;
        this.ui.centerBanner.classList.add('hidden');
        this._openLoadoutPicker(false);
        return;
      }

      const modeTag =
        this.loadoutChoice.mode === 'assassin'
          ? 'ANCIENT ASSASSIN'
          : this.loadoutChoice.mode === 'sniper'
          ? 'SNIPER ONLY'
          : this.loadoutChoice.mode === 'randomizer'
          ? 'RANDOMIZER'
          : MAPS[this.arena.mapId].name;
      this._showBanner(`ROUND ${this.roundNumber}`, `${modeTag} — FIGHT IN 3...`, false);
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
      this.player.jumpsLeft = 2;
      this.player.warhornTimer = 0;
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

    _canPlayerAct() {
      if (this.pickerOpen) return false;
      return (this.roundState === 'playing' || this.roundState === 'round_over' || this.roundState === 'lobby') && this.player.alive;
    }

    _startInspect() {
      if (!this._canPlayerAct() || this.isReloading || this.isAds) return;
      if (this.activeEmote) this._stopEmote();
      this.inspectTimer = this.inspectDuration;
      this.sound.playInspect(this._currentWeapon().slotType === 'melee');
    }

    _startEmote(emoteId) {
      if (!this._canPlayerAct()) return;
      this.activeEmote = emoteId;
      this.emoteTime = 0;
      this.inspectTimer = 0;
      this.isAds = false;
      this.emoteWheelOpen = false;
      if (this.ui.emoteBar) this.ui.emoteBar.classList.add('hidden');
      if (this.playerAvatar) {
        this.playerAvatar.visible = true;
        this.playerAvatar.userData.flexBlade.visible = emoteId === 'swordspin';
      }
      this.sound.playEmote(emoteId);
      const names = { griddy: 'GRIDDY', takeL: 'TAKE THE L', backflip: 'BACKFLIP', swordspin: 'BLADE FLEX', wave: 'GG WAVE' };
      this._pushKillFeed(`EMOTE: ${names[emoteId] || emoteId.toUpperCase()}`);
    }

    _stopEmote() {
      this.activeEmote = null;
      this.emoteTime = 0;
      this.emoteWheelOpen = false;
      if (this.ui.emoteBar) this.ui.emoteBar.classList.add('hidden');
      if (this.playerAvatar) {
        this.playerAvatar.visible = false;
        const u = this.playerAvatar.userData;
        if (u && u.bodyGroup) {
          u.bodyGroup.position.set(0, 0, 0);
          u.bodyGroup.rotation.set(0, 0, 0);
        }
      }
    }

    _resetReloadParts() {
      if (this.weaponMesh && this.weaponMesh.userData.magPart && this.weaponMesh.userData.magHome) {
        this.weaponMesh.userData.magPart.position.copy(this.weaponMesh.userData.magHome);
        this.weaponMesh.userData.magPart.rotation.z = 0;
      }
      if (this.fpArms && this.fpArms.userData.leftGroup) {
        const lg = this.fpArms.userData.leftGroup;
        const homes = this.fpArms.userData.leftHomes;
        for (let i = 0; i < lg.length; i++) lg[i].position.copy(homes[i]);
      }
      if (this.ui.reloadBarWrap) this.ui.reloadBarWrap.classList.add('hidden');
    }

    switchWeapon(index, force = false) {
      if (!this.slots[index]) return;
      if (!force && index === this.activeSlot) return;

      this._resetReloadParts();
      this.activeSlot = index;
      this.isReloading = false;
      this.isAds = false;
      this.isShielding = false;
      this.inspectTimer = 0;
      this._stopEmote();
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

      if (this.activeEmote) this._stopEmote();
      this.inspectTimer = 0;
      this.isReloading = true;
      this.isAds = false;
      this.reloadDuration = slot.def.reloadTime;
      this.reloadTimer = slot.def.reloadTime;
      this.reloadStage = 0;
      this.sound.playReload();

      const dropPos = this.camera.position.clone().add(new THREE.Vector3(0, -0.35, 0));
      this._spawnParticles(dropPos, 0x1e293b, 2, 2.0);
      if (this.ui.reloadBarWrap) this.ui.reloadBarWrap.classList.remove('hidden');
      this._updateHUD();
    }

    _trySlide() {
      if (!this._canPlayerAct()) return;
      if (this.player.slideCooldown > 0 || !this.player.onGround) return;
      if (this.activeEmote) this._stopEmote();

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
      if (!this._canPlayerAct()) return;
      if (this.player.dashCooldown > 0) return;
      if (this.activeEmote) this._stopEmote();

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
      if (!this._canPlayerAct()) return;
      if (this.player.lungeCooldown > 0) return;

      const w = this._currentWeapon();
      if (w.buildWall) {
        const horizFwd = new THREE.Vector3(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
        const wx = this.player.pos.x + horizFwd.x * 3.4;
        const wz = this.player.pos.z + horizFwd.z * 3.4;
        const rawFloor = this.arena.getFloorHeight(wx, wz, this.player.pos.y + 0.6, 0.25);
        const wy = rawFloor > -Infinity ? rawFloor : this.player.pos.y;
        this.arena.addTemporaryWall(wx, wy, wz, this.player.yaw, 12.0);
        this.player.lungeCooldown = 1.6;
        this.slashAnim = 0.8;
        this.sound.playShoot('trowel');
        this._spawnParticles(new THREE.Vector3(wx, wy + 1.5, wz), 0xf59e0b, 14, 6);
        this._pushKillFeed('TROWEL WALL BUILT (12s)');
        return;
      }

      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);

      if (w.slamRadius) {
        this.player.vel.x = forward.x * (w.lungePower || 15.0);
        this.player.vel.z = forward.z * (w.lungePower || 15.0);
        this.player.vel.y = Math.max(w.lungeLift || 7.2, forward.y * 10 + 4.5);
        this.player.onGround = false;
        this.player.lungeCooldown = 2.1;
        this.slashAnim = 1.0;
        this.sound.playExplosion();
        const slamCenter = this.player.pos.clone().addScaledVector(new THREE.Vector3(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw)), 2.2);
        this._spawnShockwave(slamCenter, 0xf97316, w.slamRadius, 0.34);
        this._spawnParticles(slamCenter, 0xf97316, 18, 9);
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const d = slamCenter.distanceTo(enemy.getCenterWorldPos());
          if (d <= w.slamRadius) {
            if (enemy.vel) enemy.vel.y = Math.max(enemy.vel.y || 0, 9.0);
            this._onPlayerHitEnemy(enemy, w.lungeDamage || 100, true, enemy.getCenterWorldPos(), 'MAUL SHOCK SLAM');
          }
        }
        return;
      }

      if (w.scytheJump) {
        this.player.vel.x = forward.x * (w.lungePower || 22.0);
        this.player.vel.z = forward.z * (w.lungePower || 22.0);
        this.player.vel.y = Math.max(w.lungeLift || 13.5, forward.y * 19.5 + 9.2);
        this._spawnShockwave(this.player.pos, 0xc084fc, 3.2, 0.28);
      } else {
        this.player.vel.x = forward.x * (w.lungePower || 18.5);
        this.player.vel.z = forward.z * (w.lungePower || 18.5);
        this.player.vel.y = Math.max(w.lungeLift || 4.5, forward.y * 8 + 3.2);
      }

      this.player.onGround = false;
      this.player.lungeCooldown = w.lungeCooldown || 2.2;
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
      if (!this._canPlayerAct()) return;
      if (this.isReloading || this.fireCooldown > 0) return;
      this.inspectTimer = 0;

      const slot = this._currentSlot();
      const w = slot.def;
      if (!isInitialClick && !w.auto) return;

      // Sniper Scope-Only Safety Lock!
      if (w.scopedOnly && !this.isAds) {
        if (isInitialClick) {
          this.sound.playDryClick();
          this.scopeHintTimer = 1.1;
          if (this.ui.scopeHint) this.ui.scopeHint.classList.remove('hidden');
        }
        return;
      }

      const rofMult = this.player.warhornTimer > 0 ? 1.25 : 1.0;

      if (w.slotType === 'melee') {
        this.fireCooldown = 1 / (w.fireRate * rofMult);
        this._performMeleeSlash(false);
        return;
      }

      if (w.slotType === 'utility') {
        if (slot.ammo <= 0) return;
        if (this.loadoutChoice.mode !== 'range') slot.ammo -= 1;
        this.fireCooldown = 1 / (w.fireRate * rofMult);
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
      this.fireCooldown = 1 / (w.fireRate * rofMult);
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

      // GRENADE LAUNCHER: Fires fast bouncing explosive shells!
      if (w.launchGrenade) {
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        const start = origin.clone().addScaledVector(dir, 0.75);
        const vel = dir.multiplyScalar(32);
        vel.y += 4.2;
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 10, 8),
          new THREE.MeshStandardMaterial({ color: 0xff7b29, emissive: 0xff4500, emissiveIntensity: 0.9, roughness: 0.3 })
        );
        mesh.position.copy(start);
        this.scene.add(mesh);
        this.projectiles.push({ type: 'gl_shell', mesh, pos: start, vel, fuse: 0.95, weaponDef: w });
        if (slot.ammo === 0 && slot.reserve > 0) this.startReload();
        this._updateHUD();
        return;
      }

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
        let endPoint = origin.clone().addScaledVector(dir, w.pierceWalls ? w.range : mapDist);

        if (w.pierceWalls) {
          // PHASE RAILGUN: Pierces straight through walls & cover (and can collateral-hit multiple targets)!
          if (mapHits.length > 0) {
            this._spawnParticles(mapHits[0].point, tracerCol, 10, 8);
          }
          const seenEnemies = new Set();
          for (const hit of botHits) {
            const enemy = hit.object.userData.enemyRef || this.bot;
            if (seenEnemies.has(enemy)) continue;
            seenEnemies.add(enemy);
            const isHeadshot = hit.object.userData.hitbox === 'head';
            const throughWall = hit.distance > mapDist;
            const dmg = throughWall
              ? isHeadshot
                ? w.wallHeadDamage || w.headDamage
                : w.wallDamage || w.damage
              : isHeadshot
              ? w.headDamage
              : w.damage;
            const prev = hitSummary.get(enemy) || { dmg: 0, hs: false, wallbang: false, point: hit.point.clone() };
            prev.dmg += dmg;
            if (isHeadshot) prev.hs = true;
            if (throughWall) prev.wallbang = true;
            prev.point = hit.point.clone();
            hitSummary.set(enemy, prev);
          }
        } else if (botHits.length > 0 && botHits[0].distance < mapDist) {
          const hit = botHits[0];
          endPoint = hit.point.clone();
          const enemy = hit.object.userData.enemyRef || this.bot;
          const isHeadshot = hit.object.userData.hitbox === 'head';
          const dmg = isHeadshot ? w.headDamage : w.damage;
          const prev = hitSummary.get(enemy) || { dmg: 0, hs: false, wallbang: false, point: endPoint };
          prev.dmg += dmg;
          if (isHeadshot) prev.hs = true;
          prev.point = endPoint;
          hitSummary.set(enemy, prev);
        } else if (mapHits.length > 0) {
          const impactCol = w.paintSplat ? tracerCol : 0xdbe7ff;
          this._spawnParticles(mapHits[0].point, impactCol, w.paintSplat ? 10 : pellets > 1 ? 2 : 5);
        }

        this._spawnTracer(muzzleWorld, endPoint, tracerCol, w.beamRadius || 0.02);

        if (w.flameStream) {
          const midPt = muzzleWorld.clone().lerp(endPoint, 0.45);
          this._spawnParticles(midPt, Math.random() < 0.5 ? 0xff6b1a : 0xffd447, 3, 4.5);
        }
        if (w.spawnFirePool) {
          this._spawnMolotovPool(endPoint);
        }
        if (w.vortexRadius) {
          this._spawnShockwave(endPoint, 0xd946ef, w.vortexRadius, 0.36);
          for (const enemy of this.enemies) {
            if (!enemy.alive || enemy.isDummy) continue;
            const d = enemy.pos.distanceTo(endPoint);
            if (d < w.vortexRadius && d > 0.6) {
              enemy.pos.lerp(new THREE.Vector3(endPoint.x, enemy.pos.y, endPoint.z), 0.42);
              if (enemy.vel) enemy.vel.y = Math.max(enemy.vel.y || 0, 5.5);
            }
          }
        }
        if (w.explosiveRadius) {
          this._explodeSplash(endPoint, w, hitSummary);
        }
      }

      for (const [enemy, info] of hitSummary.entries()) {
        if (w.cryoFreeze && info.hs && enemy.freeze) {
          enemy.freeze(1.4);
          this._pushKillFeed('PERMAFROST HEADSHOT FREEZE!');
        }
        if (w.warpBoost) {
          this.player.warpBoostTimer = 2.2;
        }
        const label = info.wallbang ? `${w.name} WALLBANG` : w.name;
        this._onPlayerHitEnemy(enemy, info.dmg, info.hs, info.point, label);
      }

      if (slot.ammo === 0 && slot.reserve > 0) {
        this.startReload();
      }
      this._updateHUD();
    }

    _explodeSplash(pos, weaponDef, directHits) {
      const r = weaponDef.explosiveRadius || 5.0;
      const isRpg = weaponDef.id === 'rpg';
      this.sound.playExplosion();
      this._spawnShockwave(pos, weaponDef.tracerColor || 0xff6b1a, r, 0.3);
      this._spawnParticles(pos, weaponDef.tracerColor || 0xff6b1a, isRpg ? 24 : 12, isRpg ? 11 : 7);

      for (const enemy of this.enemies) {
        if (!enemy.alive || (directHits && directHits.has(enemy))) continue;
        const ePos = enemy.getCenterWorldPos();
        const d = pos.distanceTo(ePos);
        if (d < r) {
          const splashDmg = Math.round(weaponDef.damage * 0.85 * (1 - d / r));
          if (splashDmg > 4) {
            this._onPlayerHitEnemy(enemy, splashDmg, false, ePos, `${weaponDef.name} BLAST`);
          }
        }
      }

      // RPG Rocket Jump impulse!
      if (isRpg && this.player.alive) {
        const pCenter = new THREE.Vector3(this.player.pos.x, this.player.pos.y + 1.0, this.player.pos.z);
        const jumpRadius = r + 2.2;
        const d = pos.distanceTo(pCenter);
        if (d < jumpRadius) {
          const factor = Math.max(0.28, 1 - d / jumpRadius);
          const push = new THREE.Vector3().subVectors(pCenter, pos);
          push.y = Math.max(0.6, push.y);
          push.normalize();
          this.player.vel.x += push.x * 16.5 * factor;
          this.player.vel.z += push.z * 16.5 * factor;
          this.player.vel.y = Math.max(this.player.vel.y, 16.5 * factor + 8.5);
          this.player.onGround = false;
          if (this.loadoutChoice.mode !== 'range') {
            this._damagePlayer(Math.round(14 * factor), 'OWN RPG');
          }
        }
      }
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

      if (weaponDef.utilityType === 'jumppad') {
        const px = this.player.pos.x;
        const pz = this.player.pos.z;
        const rawFloor = this.arena.getFloorHeight(px, pz, this.player.pos.y + 0.5, 0.25);
        const py = rawFloor > -Infinity ? rawFloor : this.player.pos.y;
        this.arena.addTempJumpPad(px, py, pz, 16.5, 20.0);
        this._spawnShockwave(new THREE.Vector3(px, py, pz), 0xa855f7, 4.2, 0.3);
        this._pushKillFeed('PORTABLE JUMP PAD DEPLOYED!');
        return;
      }

      if (weaponDef.utilityType === 'grappler') {
        const origin = this.camera.position.clone();
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        const range = weaponDef.range || 75;
        this.raycaster.set(origin, dir);
        this.raycaster.far = range;
        const hits = this.raycaster.intersectObjects(this.arena.meshes, false);
        const anchor = hits.length > 0 ? hits[0].point.clone() : origin.clone().addScaledVector(dir, 36);
        const pull = new THREE.Vector3().subVectors(anchor, this.player.pos).normalize();
        this.player.vel.x = pull.x * 29.0;
        this.player.vel.z = pull.z * 29.0;
        this.player.vel.y = Math.max(9.5, pull.y * 26.0 + 5.0);
        this.player.onGround = false;
        this.player.jumpsLeft = 1;
        this._spawnTracer(origin.clone().addScaledVector(dir, 0.5), anchor, 0x2de2ff, 0.045);
        this._spawnParticles(anchor, 0x2de2ff, 12, 6);
        this._pushKillFeed('GRAPPLER LAUNCH!');
        return;
      }

      if (weaponDef.utilityType === 'warpstone') {
        const origin = this.camera.position.clone();
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        const range = weaponDef.range || 42;
        this.raycaster.set(origin, dir);
        this.raycaster.far = range;
        const hits = this.raycaster.intersectObjects(this.arena.meshes, false);
        const dist = hits.length > 0 ? Math.max(1.5, hits[0].distance - 1.2) : 26;
        const dest = origin.clone().addScaledVector(dir, dist);
        this._spawnShockwave(this.player.pos, 0xc084fc, 4.0, 0.3);
        this.player.pos.set(dest.x, Math.max(0, dest.y - 1.1), dest.z);
        this.arena.resolveHorizontal(this.player.pos, 0.48, 1.8);
        this.player.vel.set(0, Math.max(2.5, this.player.vel.y), 0);
        this.player.onGround = false;
        this.player.jumpsLeft = 1;
        this._spawnShockwave(this.player.pos, 0xc084fc, 4.8, 0.32);
        this._spawnParticles(this.player.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xc084fc, 18, 7);
        this._pushKillFeed('WARPSTONE TELEPORT!');
        return;
      }

      if (weaponDef.utilityType === 'holodome') {
        const radius = 4.2;
        const center = this.player.pos.clone().add(new THREE.Vector3(0, 1.2, 0));
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 22, 16),
          new THREE.MeshStandardMaterial({
            color: 0x00f5ff,
            emissive: 0x0284c7,
            emissiveIntensity: 0.65,
            transparent: true,
            opacity: 0.24,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        mesh.position.copy(center);
        this.scene.add(mesh);
        this.holodomes.push({ mesh, pos: center, radius, life: 6.0 });
        this._spawnShockwave(this.player.pos, 0x00f5ff, radius, 0.35);
        this._pushKillFeed('HOLODOME SHIELD DEPLOYED (6s)!');
        return;
      }

      if (weaponDef.utilityType === 'warhorn') {
        this.player.warhornTimer = 5.0;
        if (this.ui.warhornBadge) this.ui.warhornBadge.classList.remove('hidden');
        this._spawnShockwave(this.player.pos, 0xfbbf24, 5.8, 0.36);
        this._spawnParticles(this.player.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), 0xfbbf24, 14, 6);
        this._pushKillFeed('WAR HORN: +38% SPEED & +25% FIRE RATE (5s)!');
        return;
      }

      if (weaponDef.utilityType === 'medkit') {
        const before = this.player.hp;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50);
        const healed = Math.round(this.player.hp - before);
        this._spawnParticles(this.player.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x38ef7d, 18, 5);
        this._pushKillFeed(healed > 0 ? `MEDKIT: +${healed} HP RESTORED!` : 'MEDKIT USED (FULL HP)');
        this._updateHUD();
        return;
      }

      if (weaponDef.utilityType === 'freeze') {
        const origin = this.camera.position.clone();
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        const range = weaponDef.range || 120;
        this.raycaster.set(origin, dir);
        this.raycaster.far = range;

        const mapHits = this.raycaster.intersectObjects(this.arena.meshes, false);
        const botHits = this.raycaster.intersectObjects(this._getAllEnemyHitMeshes(), false);
        const mapDist = mapHits.length > 0 ? mapHits[0].distance : range;
        let endPoint = origin.clone().addScaledVector(dir, mapDist);

        if (botHits.length > 0 && botHits[0].distance < mapDist) {
          endPoint = botHits[0].point.clone();
          const enemy = botHits[0].object.userData.enemyRef || this.bot;
          if (enemy.freeze) enemy.freeze(2.2);
          this._spawnParticles(endPoint, 0xbae6fd, 18, 7);
          this._pushKillFeed(`${enemy.isDummy ? 'DUMMY' : enemy.name || 'TARGET'} FROZEN SOLID (2.2s)!`);
          this._onPlayerHitEnemy(enemy, weaponDef.damage || 18, false, endPoint, 'FREEZE RAY');
        } else {
          this._spawnParticles(endPoint, 0x7dd3fc, 10, 5);
        }

        const muzzleWorld = origin.clone().addScaledVector(dir, 0.55);
        this._spawnTracer(muzzleWorld, endPoint, 0x38bdf8, 0.055);
        return;
      }

      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);

      const start = this.camera.position.clone().addScaledVector(dir, 0.7);
      const vel = dir.multiplyScalar(weaponDef.utilityType === 'molotov' ? 23 : 22);
      vel.y += 5.2;

      const colorMap = { frag: 0xff5a36, satchel: 0xfacc15, subspace: 0xff2ad4, molotov: 0xf97316, flash: 0xe0f2fe, smoke: 0x94a3b8 };
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
        fuse:
          weaponDef.utilityType === 'flash'
            ? 1.35
            : weaponDef.utilityType === 'molotov'
            ? 3.5
            : weaponDef.utilityType === 'satchel'
            ? 1.25
            : 1.45,
      });
    }

    _explodeFrag(pos, isSatchel = false) {
      this.sound.playExplosion();
      const blastRadius = isSatchel ? 9.5 : 8.5;
      const maxDmg = isSatchel ? 105 : 92;
      const label = isSatchel ? 'SATCHEL CHARGE' : 'FRAG GRENADE';
      this._spawnShockwave(pos, isSatchel ? 0xfacc15 : 0xff7b29, blastRadius, 0.36);
      this._spawnParticles(pos, isSatchel ? 0xfacc15 : 0xff7b29, 28, 12);
      this._spawnParticles(pos, 0xffe45e, 16, 8);

      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const botPos = enemy.getCenterWorldPos();
        const d = pos.distanceTo(botPos);
        if (d < blastRadius) {
          const dmg = Math.round(maxDmg * (1 - d / blastRadius));
          if (dmg > 4) this._onPlayerHitEnemy(enemy, dmg, false, botPos, label);
        }
      }

      if (this.player.alive) {
        const pCenter = new THREE.Vector3(this.player.pos.x, this.player.pos.y + 1.0, this.player.pos.z);
        const jumpRadius = isSatchel ? 10.5 : 9.5;
        const d = pos.distanceTo(pCenter);
        if (d < jumpRadius) {
          // Supercharged Grenade / Satchel Jump! Launches you sky-high with light self-chip!
          const factor = Math.max(0.25, 1 - d / jumpRadius);
          const push = new THREE.Vector3().subVectors(pCenter, pos);
          push.y = Math.max(0.55, push.y);
          push.normalize();
          this.player.vel.x += push.x * (isSatchel ? 18.0 : 15.5) * factor;
          this.player.vel.z += push.z * (isSatchel ? 18.0 : 15.5) * factor;
          this.player.vel.y = Math.max(this.player.vel.y, (isSatchel ? 18.5 : 15.5) * factor + (isSatchel ? 9.5 : 8.5));
          this.player.onGround = false;
          if (this.loadoutChoice.mode !== 'range') {
            this._damagePlayer(Math.round((isSatchel ? 14 : 16) * factor), isSatchel ? 'OWN SATCHEL' : 'OWN GRENADE');
          }
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
      this._spawnShockwave(pos, 0xffffff, 10.0, 0.28);
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
        const targetLabel = enemy.isDummy ? (enemy.label || 'DUMMY') : enemy.name || 'RIVAL';
        this._pushKillFeed(`YOU [${weaponLabel}${isHeadshot ? ' *' : ''}] ${targetLabel}`);

        if (this.loadoutChoice.mode === 'range') {
          this.playerScore = this.stats.kills;
          this.botScore = this.stats.headshots;
          this._renderScorePips();
          if (enemy.label === 'SECRET BOSS DUMMY') {
            this._awardKeys(20, 'BOSS DUMMY');
          } else {
            this._awardKeys(1, 'TARGET HIT');
          }
          return;
        }

        if (!this.firstBloodDone) {
          this.firstBloodDone = true;
          this._awardKeys(3, 'FIRST BLOOD');
        }
        this.killStreak += 1;
        if (this.killStreak === 2) this._pushKillFeed('DOUBLE KILL!');
        else if (this.killStreak === 3) this._pushKillFeed('TRIPLE KILL!');
        else if (this.killStreak >= 4) this._pushKillFeed(`UNSTOPPABLE (${this.killStreak} KILLSTREAK)!`);

        const isBonusKill = isHeadshot || weaponLabel.includes('WALLBANG') || weaponLabel.includes('BACKSTAB');
        this._awardKeys(isBonusKill ? 6 : 4, isBonusKill ? 'CRIT ELIM' : 'ELIMINATION');

        if (this.loadoutChoice.mode === 'tdm' || this.loadoutChoice.mode === 'ffa') {
          this.playerScore += 1;
          enemy.respawnTimer = 2.4;
          this._renderScorePips();
          const limit = this.loadoutChoice.mode === 'ffa' ? FFA_SCORE_LIMIT : TDM_SCORE_LIMIT;
          if (this.playerScore >= limit) {
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

    _onBotShoot(shooter, origin, dir, damage, weaponDef = WEAPONS.ar) {
      if (this.roundState !== 'playing') return;
      const w = weaponDef || WEAPONS.ar;
      this.sound.playShoot(w.id);

      const candidates = [];
      if (shooter.team === 'ffa') {
        if (this.player.alive) {
          candidates.push({
            isPlayer: true,
            center: new THREE.Vector3(this.player.pos.x, this.player.pos.y + 1.05, this.player.pos.z),
          });
        }
        for (const other of this.enemies) {
          if (other !== shooter && other.alive) {
            candidates.push({ isPlayer: false, bot: other, center: other.getCenterWorldPos() });
          }
        }
      } else if (shooter.team === 'red') {
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

      // Close-range melee swing for bots using Katana / Scythe / Daggers
      if (w.slotType === 'melee') {
        for (const c of candidates) {
          if (origin.distanceTo(c.center) <= (w.range || 4.2)) {
            if (c.isPlayer) {
              this._damagePlayer(damage, `${shooter.name} [${w.name}]`);
            } else {
              const res = c.bot.takeDamage(damage, false);
              this._spawnParticles(c.center, c.bot.team === 'blue' ? 0x2de2ff : 0xff3e5e, 7);
              if (res.killed) this._onBotEliminatedByBot(shooter, c.bot, w.name);
            }
            break;
          }
        }
        return;
      }

      const pellets = Math.min(5, w.pellets || 1);
      const rSkin = RIVAL_SKINS[this.loadoutChoice.rivalSkin] || RIVAL_SKINS.classic;
      const tracerColor = w.pierceWalls ? 0x00f5ff : shooter.team === 'blue' ? 0x2de2ff : rSkin.accentColor;

      for (let p = 0; p < pellets; p++) {
        const shotDir = dir.clone();
        if (pellets > 1) {
          shotDir.x += (Math.random() - 0.5) * 0.14;
          shotDir.y += (Math.random() - 0.5) * 0.11;
          shotDir.z += (Math.random() - 0.5) * 0.14;
          shotDir.normalize();
        }

        this.raycaster.set(origin, shotDir);
        this.raycaster.far = Math.min(160, w.range || 140);
        const mapHits = this.raycaster.intersectObjects(this.arena.meshes, false);
        const mapDist = mapHits.length > 0 ? mapHits[0].distance : this.raycaster.far;

        let bestHit = null;
        let bestDist = w.pierceWalls ? this.raycaster.far : mapDist;
        let endPoint = origin.clone().addScaledVector(shotDir, bestDist);

        for (const c of candidates) {
          const toTarget = new THREE.Vector3().subVectors(c.center, origin);
          const proj = toTarget.dot(shotDir);
          if (proj > 0 && proj < bestDist) {
            const closest = origin.clone().addScaledVector(shotDir, proj);
            const horizDist = Math.hypot(closest.x - c.center.x, closest.z - c.center.z);
            const vertDist = Math.abs(closest.y - c.center.y);
            if (horizDist < 0.56 && vertDist < 0.98) {
              bestDist = proj;
              bestHit = c;
              endPoint = closest;
            }
          }
        }

        this._spawnTracer(origin, endPoint, tracerColor, w.beamRadius || 0.02);

        if (bestHit) {
          // Check Holodome 3D Energy Shield Dome protection!
          let domeBlocked = false;
          for (const hd of this.holodomes) {
            const shooterOut = origin.distanceTo(hd.pos) > hd.radius;
            const targetIn = bestHit.center.distanceTo(hd.pos) < hd.radius;
            if (shooterOut && targetIn) {
              domeBlocked = true;
              this._spawnParticles(endPoint, 0x00f5ff, 8, 5);
              break;
            }
          }
          if (domeBlocked) continue;

          const perPelletDmg = pellets > 1 ? Math.max(4, Math.round(damage * 0.65)) : damage;
          if (bestHit.isPlayer) {
            this._damagePlayer(perPelletDmg, `${shooter.name} [${w.name}]`);
          } else {
            const targetBot = bestHit.bot;
            const res = targetBot.takeDamage(perPelletDmg, false);
            this._spawnParticles(endPoint, targetBot.team === 'blue' ? 0x2de2ff : 0xff3e5e, 5);
            if (res.killed) {
              this._onBotEliminatedByBot(shooter, targetBot, w.name);
            }
          }
        }
      }
    }

    _onBotEliminatedByBot(shooter, victim, weaponName = 'RIFLE') {
      this._pushKillFeed(`${shooter.name} [${weaponName}] ${victim.name}`);
      if (this.loadoutChoice.mode === 'ffa') {
        shooter.ffaScore = (shooter.ffaScore || 0) + 1;
        this.botScore = Math.max(this.botScore, shooter.ffaScore);
        victim.respawnTimer = 2.4;
        this._renderScorePips();
        if (this.botScore >= FFA_SCORE_LIMIT) {
          this._finishMatch();
        }
        return;
      }
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
      if (this.pickerOpen) this._closeLoadoutPicker(false);
      this.player.alive = false;
      this.killStreak = 0;
      this._pushKillFeed(`${source} ELIMINATED YOU`);

      if (this.loadoutChoice.mode === 'tdm' || this.loadoutChoice.mode === 'ffa') {
        if (this.loadoutChoice.mode === 'tdm') {
          this.botScore += 1;
        } else {
          this.botScore = Math.min(FFA_SCORE_LIMIT, this.botScore + 1);
        }
        this._renderScorePips();
        const limit = this.loadoutChoice.mode === 'ffa' ? FFA_SCORE_LIMIT : TDM_SCORE_LIMIT;
        if (this.botScore >= limit) {
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

      const msg =
        source === 'SKY VOID'
          ? 'FELL INTO THE SKY VOID'
          : source === 'EXPRESS TRAIN'
          ? 'SQUASHED BY THE EXPRESS TRAIN!'
          : 'YOU WERE ELIMINATED';
      this._endRound(false, msg);
    }

    _damagePlayer(amount, source) {
      if (!this.player.alive || this.roundState !== 'playing') return;
      let finalDmg = amount;
      if (this.isShielding && this._currentWeapon().shieldBlock) {
        finalDmg = Math.max(1, Math.round(amount * 0.2));
        this.sound.playBounce();
      }
      this.player.hp = Math.max(0, this.player.hp - finalDmg);
      this.damageFlash = 0.32;
      this.sound.playHurt();
      this._updateHUD();

      if (this.player.hp <= 0) {
        this._handlePlayerDeath(source);
      }
    }

    _endRound(playerWon, subtitle) {
      if (this.roundState !== 'playing') return;
      if (this.pickerOpen) this._closeLoadoutPicker(false);
      this.roundState = 'round_over';
      this.stateTimer = 3.0;
      this.roundEndTitle = playerWon ? 'ROUND WON' : 'ROUND LOST';
      this.roundEndSub = subtitle;

      if (playerWon) {
        this.playerScore += 1;
        this._awardKeys(12, 'ROUND WIN');
      } else {
        this.botScore += 1;
      }

      this.sound.playRoundEnd(playerWon);
      this._renderScorePips();
      this._showBanner(this.roundEndTitle, `${subtitle} · RESETTING IN 3...`, !playerWon);
    }

    _finishMatch() {
      if (this.pickerOpen) this._closeLoadoutPicker(false);
      this.roundState = 'match_over';
      this.matchActive = false;
      this.isPaused = true;
      if (document.pointerLockElement) document.exitPointerLock();

      const won =
        this.loadoutChoice.mode === 'tdm' || this.loadoutChoice.mode === 'ffa'
          ? this.playerScore >= this.botScore
          : this.playerScore >= WINS_TO_VICTORY;
      if (won) {
        this.winStreak += 1;
        const baseWinKeys = this.loadoutChoice.mode === 'ffa' ? 45 : 40;
        const streakBonus = Math.min(50, this.winStreak * 5);
        this._awardKeys(baseWinKeys + streakBonus, `VICTORY + STREAK ${this.winStreak}`);
      } else {
        this.winStreak = 0;
        this._savePreferences();
      }
      if (this.ui.streakCount) this.ui.streakCount.textContent = String(this.winStreak);
      if (this.ui.lobbyStreakVal) this.ui.lobbyStreakVal.textContent = String(this.winStreak);

      this.ui.hud.classList.add('hidden');
      this.ui.centerBanner.classList.add('hidden');
      this.ui.matchEnd.classList.remove('hidden');

      this.ui.endBadge.textContent = won ? 'VICTORY' : 'DEFEAT';
      this.ui.endBadge.classList.toggle('defeat', !won);
      this.ui.endScore.textContent = `${this.playerScore} — ${this.botScore}`;
      this.ui.endStats.innerHTML =
        `Map: <b>${MAPS[this.arena.mapId].name}</b> &nbsp;·&nbsp; Win Streak: <b>${this.winStreak}</b> &nbsp;·&nbsp; Keys: <b>${this.keysCurrency}</b><br>` +
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

    _spawnTracer(start, end, colorHex, radius = 0.02) {
      const delta = new THREE.Vector3().subVectors(end, start);
      const len = delta.length();
      if (len < 0.05) return;
      const geo = new THREE.CylinderGeometry(radius, radius, len, 5, 1, true);
      const mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.92,
      });
      const beam = new THREE.Mesh(geo, mat);
      beam.position.copy(start).addScaledVector(delta, 0.5);
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
      this.scene.add(beam);
      const life = radius > 0.03 ? 0.24 : 0.095;
      this.tracers.push({ line: beam, life, maxLife: life });
    }

    _spawnShockwave(pos, colorHex, maxRadius = 7.5, duration = 0.35) {
      const geo = new THREE.TorusGeometry(1.0, 0.09, 8, 28);
      const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(pos.x, pos.y + 0.35, pos.z);
      ring.scale.setScalar(0.35);
      this.scene.add(ring);
      this.shockwaves.push({ mesh: ring, maxRadius, life: duration, maxLife: duration });
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
          : this.loadoutChoice.mode === 'ffa'
          ? `FFA BOTS · TO ${FFA_SCORE_LIMIT}`
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
          : this.loadoutChoice.mode === 'ffa'
          ? Math.floor(this.playerScore / 3)
          : this.loadoutChoice.mode === 'range'
          ? Math.min(5, this.playerScore)
          : this.playerScore;
      const bPips =
        this.loadoutChoice.mode === 'tdm'
          ? Math.floor(this.botScore / 5)
          : this.loadoutChoice.mode === 'ffa'
          ? Math.floor(this.botScore / 3)
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
      if (this.ui.djumpFill) {
        this.ui.djumpFill.style.width = this.player.jumpsLeft > 0 ? '100%' : '0%';
      }
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
      p.warhornTimer = Math.max(0, p.warhornTimer - dt);
      p.warpBoostTimer = Math.max(0, (p.warpBoostTimer || 0) - dt);
      if (this.ui.warhornBadge) {
        this.ui.warhornBadge.classList.toggle('hidden', p.warhornTimer <= 0);
      }
      if (this.ui.shieldBadge) {
        this.ui.shieldBadge.classList.toggle('hidden', !(this.isShielding && this._currentWeapon().shieldBlock));
      }

      const gravScale = this._getActiveGravityScale();
      const gravMode = GRAVITY_MODES[this.loadoutChoice.gravity] || GRAVITY_MODES.auto;
      const canMove = this._canPlayerAct() && !this.activeEmote;
      const w = this._currentWeapon();
      const modeSpeedBonus = this.loadoutChoice.mode === 'assassin' ? 1.12 : 1.0;
      const hornSpeedBonus = p.warhornTimer > 0 ? 1.38 : 1.0;
      const warpBonus = p.warpBoostTimer > 0 ? 1.26 : 1.0;
      const shieldSlow = this.isShielding && w.shieldBlock ? 0.68 : 1.0;
      const baseSpeed = 9.4 * w.moveMult * modeSpeedBonus * hornSpeedBonus * warpBonus * shieldSlow * (this.isAds ? 0.68 : 1.0);
      const activeLadder = canMove ? this.arena.getLadderAt(p.pos) : null;
      const spacePressed = Boolean(this.keys['Space']) && !p.spaceWasDown;
      p.spaceWasDown = Boolean(this.keys['Space']);

      if (canMove && activeLadder) {
        // Smooth Ladder Climbing! Hold W / Space to climb up, S to climb down
        const input = this._getMoveInputDir();
        if (input.lengthSq() > 0.001) input.normalize();
        p.vel.x = THREE.MathUtils.lerp(p.vel.x, input.x * 4.5, Math.min(1, dt * 12));
        p.vel.z = THREE.MathUtils.lerp(p.vel.z, input.z * 4.5, Math.min(1, dt * 12));

        let climbSpeed = 0;
        if (this.keys['Space']) {
          climbSpeed = 9.0;
        } else if (this.keys['KeyW']) {
          climbSpeed = p.pitch < -0.55 ? -7.0 : 8.5;
        } else if (this.keys['KeyS']) {
          climbSpeed = -7.5;
        }

        p.vel.y = climbSpeed;
        p.slideTimer = 0;
        p.onGround = true;
        p.coyoteTimer = 0.12;
        p.jumpsLeft = 2;

        if (Math.abs(climbSpeed) > 1.0) {
          p.ladderStepTimer -= dt;
          if (p.ladderStepTimer <= 0) {
            p.ladderStepTimer = 0.22;
            this.sound.playLadderStep();
          }
        }

        p.pos.x += p.vel.x * dt;
        p.pos.z += p.vel.z * dt;
        p.pos.y += p.vel.y * dt;

        // Clean gentle hop onto the platform when reaching the top of the ladder!
        if (p.pos.y >= activeLadder.yTop - 0.15 && climbSpeed > 0) {
          p.pos.y = activeLadder.yTop + 0.05;
          p.pos.x += 1.05;
          p.vel.y = 3.2;
        }
      } else {
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

          if (p.onGround) {
            p.coyoteTimer = 0.11;
            p.jumpsLeft = 2;
          } else {
            p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
          }

          if (spacePressed) {
            if (p.coyoteTimer > 0) {
              p.vel.y = 8.9 * gravMode.jumpBoost;
              p.onGround = false;
              p.coyoteTimer = 0;
              p.jumpsLeft = 1;
              p.slideTimer = 0;
              this.sound.playJump();
            } else if (p.jumpsLeft > 0) {
              // Mid-Air Double Jump!
              p.vel.y = 8.7 * gravMode.jumpBoost;
              p.onGround = false;
              p.jumpsLeft = 0;
              p.slideTimer = 0;
              this.sound.playDoubleJump();
              this._spawnShockwave(p.pos, 0x2de2ff, 2.2, 0.22);
            }
          }

          // Realistic ground footsteps
          const hSpeed = Math.hypot(p.vel.x, p.vel.z);
          if (p.onGround && p.slideTimer <= 0 && hSpeed > 2.2) {
            p.footstepTimer -= dt;
            if (p.footstepTimer <= 0) {
              p.footstepTimer = Math.max(0.22, 0.36 - hSpeed * 0.008);
              this.sound.playFootstep();
            }
          } else {
            p.footstepTimer = 0.08;
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
      }

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
          p.jumpsLeft = 1;
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

      if (this.activeEmote && p.alive && this.playerAvatar) {
        // 3rd-Person Rivals Emote Animation & Orbit Camera!
        this.emoteTime += dt;
        const t = this.emoteTime;
        const u = this.playerAvatar.userData;
        this.playerAvatar.position.copy(p.pos);
        this.playerAvatar.rotation.set(0, p.yaw + Math.PI, 0);

        // Reset limbs before applying emote pose
        u.bodyGroup.position.set(0, 0, 0);
        u.bodyGroup.rotation.set(0, 0, 0);
        u.leftLeg.rotation.set(0, 0, 0);
        u.rightLeg.rotation.set(0, 0, 0);
        u.leftArm.rotation.set(0, 0, 0);
        u.rightArm.rotation.set(0, 0, 0);
        u.head.rotation.set(0, 0, 0);

        if (this.activeEmote === 'griddy') {
          const beat = t * 9.5;
          u.bodyGroup.position.y = Math.abs(Math.sin(beat)) * 0.24;
          u.bodyGroup.rotation.z = Math.sin(beat) * 0.14;
          u.leftLeg.rotation.x = Math.sin(beat) * 0.75;
          u.rightLeg.rotation.x = -Math.sin(beat) * 0.75;
          u.leftArm.rotation.x = -Math.sin(beat) * 1.15 - 0.5;
          u.rightArm.rotation.x = Math.sin(beat) * 1.15 - 0.5;
          u.head.rotation.y = Math.sin(beat * 0.5) * 0.35;
        } else if (this.activeEmote === 'takeL') {
          const hop = t * 10.5;
          u.bodyGroup.position.y = Math.abs(Math.sin(hop)) * 0.32;
          u.bodyGroup.rotation.z = Math.sin(hop) * 0.12;
          u.leftLeg.rotation.x = Math.max(0, Math.sin(hop)) * 0.95;
          u.rightLeg.rotation.x = Math.max(0, -Math.sin(hop)) * 0.95;
          u.rightArm.rotation.set(-2.55, 0, -0.3);
          u.leftArm.rotation.set(0.4, 0, 0.75);
        } else if (this.activeEmote === 'backflip') {
          const cycle = (t * 1.15) % 1.0;
          if (cycle < 0.72) {
            const pFlip = cycle / 0.72;
            u.bodyGroup.position.y = Math.sin(pFlip * Math.PI) * 2.15;
            u.bodyGroup.rotation.x = -pFlip * Math.PI * 2;
            u.leftArm.rotation.x = -2.2;
            u.rightArm.rotation.x = -2.2;
          } else {
            u.bodyGroup.position.y = 0;
            u.bodyGroup.rotation.x = 0;
          }
        } else if (this.activeEmote === 'swordspin') {
          u.bodyGroup.position.y = Math.abs(Math.sin(t * 4)) * 0.14;
          u.rightArm.rotation.set(-2.9, 0, 0);
          u.flexBlade.rotation.z = t * 16;
          u.leftArm.rotation.z = 0.6;
          if (Math.random() < dt * 14) {
            this._spawnParticles(new THREE.Vector3(p.pos.x, p.pos.y + 2.2, p.pos.z), 0x2de2ff, 1, 3.5);
          }
        } else if (this.activeEmote === 'wave') {
          u.bodyGroup.position.y = Math.abs(Math.sin(t * 5.5)) * 0.18;
          u.rightArm.rotation.set(0, 0, -2.55 + Math.sin(t * 14) * 0.45);
          u.leftArm.rotation.z = 0.25;
        }

        // Smooth 3rd-person orbit camera in front of the player avatar
        const camAngle = p.yaw + Math.sin(t * 0.55) * 0.45;
        const camOffset = new THREE.Vector3(Math.sin(camAngle) * 4.2, 2.35, Math.cos(camAngle) * 4.2);
        this.camera.position.lerp(p.pos.clone().add(camOffset), Math.min(1, dt * 10));
        this.camera.lookAt(p.pos.x, p.pos.y + 1.35, p.pos.z);
      } else if (!p.alive && this.loadoutChoice.mode === 'twovtwo' && this._getAliveAllyCount() > 0) {
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

      const scoped = this.isAds && w.scoped && this._canPlayerAct() && !this.activeEmote;
      const hideFP = scoped || Boolean(this.activeEmote) || !p.alive;
      this.ui.scopeOverlay.classList.toggle('hidden', !scoped);
      this.ui.crosshair.classList.toggle('hidden', scoped || Boolean(this.activeEmote));
      if (this.weaponMesh) this.weaponMesh.visible = !hideFP;
      if (this.fpArms) this.fpArms.visible = !hideFP;
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

      if (this.isMouseDown && this._canPlayerAct()) {
        this._tryFire(false);
      }
      this._updateAutoShoot();

      if (this.isReloading) {
        this.reloadTimer -= dt;
        const progress = Math.max(0, Math.min(1, 1 - this.reloadTimer / Math.max(0.1, this.reloadDuration)));
        if (this.ui.reloadBarFill) this.ui.reloadBarFill.style.width = `${Math.round(progress * 100)}%`;

        // Trigger staged reload audio cues!
        if (this.reloadStage === 0 && progress >= 0.34) {
          this.reloadStage = 1;
          this.sound.playReloadMagIn();
        } else if (this.reloadStage === 1 && progress >= 0.72) {
          this.reloadStage = 2;
          this.sound.playReloadRack();
        }

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
          this._resetReloadParts();
          this._updateHUD();
        }
      }

      if (this.inspectTimer > 0) {
        this.inspectTimer = Math.max(0, this.inspectTimer - dt);
      }

      if (this.weaponMesh) {
        updateAnimatedWeaponSkin(this.weaponMesh, performance.now() * 0.001);
        if (this.weaponMesh.userData.spinGroup && ((this.isMouseDown && this._canPlayerAct()) || this.inspectTimer > 0)) {
          this.weaponMesh.userData.spinGroup.rotation.z += dt * 22;
        }

        const speed = Math.hypot(this.player.vel.x, this.player.vel.z);
        if (speed > 0.8 && this.player.onGround) {
          this.bobPhase += dt * speed * 1.15;
        }
        const bobX = Math.cos(this.bobPhase) * 0.012;
        const bobY = Math.abs(Math.sin(this.bobPhase)) * 0.014;

        let basePos =
          this.isShielding && this._currentWeapon().shieldBlock
            ? new THREE.Vector3(0.06, -0.1, -0.32)
            : this.isAds
            ? new THREE.Vector3(0, -0.175, -0.34)
            : new THREE.Vector3(0.28, -0.24, -0.46);

        let rotX = this.recoilKick * 1.1;
        let rotY = 0;
        let rotZ = this.player.slideTimer > 0 ? -0.18 : 0;

        // === REAL MULTI-STAGE RELOAD ANIMATION ===
        if (this.isReloading) {
          const p = Math.max(0, Math.min(1, 1 - this.reloadTimer / Math.max(0.1, this.reloadDuration)));
          const mag = this.weaponMesh.userData.magPart;
          const magHome = this.weaponMesh.userData.magHome;
          const cyl = this.weaponMesh.userData.cylinderPart;
          const lg = this.fpArms?.userData?.leftGroup;
          const lHomes = this.fpArms?.userData?.leftHomes;

          if (p < 0.34) {
            // Stage 1: Tilt gun & eject empty magazine
            const t1 = p / 0.34;
            rotX -= Math.sin(t1 * Math.PI * 0.5) * 0.35;
            rotZ += Math.sin(t1 * Math.PI * 0.5) * 0.62;
            basePos.y -= t1 * 0.04;
            if (mag && magHome) {
              mag.position.set(magHome.x, magHome.y - t1 * 0.34, magHome.z);
              mag.rotation.z = t1 * 0.4;
            }
            if (cyl) cyl.rotation.z += dt * 14;
          } else if (p < 0.72) {
            // Stage 2: Left hand slams fresh magazine up into gun!
            const t2 = (p - 0.34) / 0.38;
            const slam = t2 > 0.82 ? Math.sin(((t2 - 0.82) / 0.18) * Math.PI) * 0.06 : 0;
            rotX -= 0.35 - slam * 2.0;
            rotZ += 0.62 * (1 - t2 * 0.35);
            basePos.y += slam;
            if (mag && magHome) {
              mag.position.set(magHome.x, magHome.y - (1 - t2) * 0.32, magHome.z);
              mag.rotation.z = (1 - t2) * 0.2;
            }
            if (lg && lHomes) {
              for (let i = 0; i < lg.length; i++) {
                lg[i].position.set(lHomes[i].x + 0.06, lHomes[i].y - (1 - t2) * 0.24, lHomes[i].z + 0.08);
              }
            }
          } else {
            // Stage 3: Bolt / slide rack & snap back to ready!
            const t3 = (p - 0.72) / 0.28;
            const rack = Math.sin(t3 * Math.PI);
            rotX -= (1 - t3) * 0.22 - rack * 0.18;
            rotZ += (1 - t3) * 0.4;
            basePos.z += rack * 0.065;
            if (mag && magHome) {
              mag.position.copy(magHome);
              mag.rotation.z = 0;
            }
            if (cyl) cyl.rotation.z += dt * 18;
            if (lg && lHomes) {
              for (let i = 0; i < lg.length; i++) {
                lg[i].position.set(lHomes[i].x, lHomes[i].y + rack * 0.06, lHomes[i].z + rack * 0.14);
              }
            }
          }
        } else if (this.inspectTimer > 0) {
          // === RIVALS WEAPON INSPECT FLOURISH ===
          const p = 1 - this.inspectTimer / this.inspectDuration;
          const ease = Math.sin(p * Math.PI);
          const isMelee = this._currentWeapon().slotType === 'melee';
          if (isMelee) {
            basePos = new THREE.Vector3(0.16, -0.14, -0.4);
            rotX -= p * Math.PI * 4;
            rotZ += ease * 0.55;
          } else {
            basePos = new THREE.Vector3(0.08, -0.15, -0.35);
            rotY = Math.sin(p * Math.PI * 2) * 0.92;
            rotZ = ease * 0.58;
            rotX = ease * 0.16;
            if (this.weaponMesh.userData.cylinderPart) {
              this.weaponMesh.userData.cylinderPart.rotation.z += dt * 20;
            }
          }
        }

        this.viewmodelRoot.position.lerp(
          new THREE.Vector3(basePos.x + bobX, basePos.y - bobY, basePos.z + this.recoilKick),
          Math.min(1, dt * 18)
        );

        if (this.slashAnim > 0) {
          this.slashAnim = Math.max(0, this.slashAnim - dt * 5.2);
          const swing = Math.sin(this.slashAnim * Math.PI);
          rotX -= swing * 1.1;
          rotY += swing * 1.3;
        }
        this.viewmodelRoot.rotation.set(rotX, rotY, rotZ);

        if (this.muzzleFlashTimer > 0) {
          this.muzzleFlashTimer -= dt;
          this.muzzleFlash.visible = true;
          if (this.weaponMesh.userData.muzzle) {
            this.muzzleFlash.position.copy(this.weaponMesh.userData.muzzle);
            this.muzzleLight.position.copy(this.weaponMesh.userData.muzzle);
          }
          this.muzzleFlash.rotation.z += dt * 25;
          this.muzzleLight.intensity = this.settings.highGraphics ? 3.2 : 0;
        } else {
          this.muzzleFlash.visible = false;
          this.muzzleLight.intensity = 0;
        }
      }
    }

    _updateEffects(dt) {
      if (this.scopeHintTimer > 0) {
        this.scopeHintTimer = Math.max(0, this.scopeHintTimer - dt);
        if (this.scopeHintTimer <= 0 || this.isAds) {
          this.scopeHintTimer = 0;
          if (this.ui.scopeHint) this.ui.scopeHint.classList.add('hidden');
        }
      }

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

      // Shockwave Rings
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.life -= dt;
        if (sw.life <= 0) {
          this.scene.remove(sw.mesh);
          sw.mesh.geometry.dispose();
          sw.mesh.material.dispose();
          this.shockwaves.splice(i, 1);
        } else {
          const progress = 1 - sw.life / sw.maxLife;
          sw.mesh.scale.setScalar(0.35 + progress * sw.maxRadius);
          sw.mesh.material.opacity = (1 - progress) * 0.9;
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
          if (pr.type === 'subspace') {
            this.scene.remove(pr.mesh);
            this.projectiles.splice(i, 1);
            const rawF = this.arena.getFloorHeight(pr.pos.x, pr.pos.z, pr.pos.y + 0.5, 0.2);
            const my = rawF > -Infinity ? rawF + 0.16 : pr.pos.y;
            const mineMesh = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.26, 0),
              new THREE.MeshStandardMaterial({
                color: 0xff2ad4,
                emissive: 0xd946ef,
                emissiveIntensity: 0.9,
                transparent: true,
                opacity: 0.28,
              })
            );
            mineMesh.position.set(pr.pos.x, my, pr.pos.z);
            this.scene.add(mineMesh);
            this.mines.push({ mesh: mineMesh, pos: mineMesh.position.clone(), armTimer: 0.45, life: 22.0 });
            this._pushKillFeed('SUBSPACE TRIPMINE ARMED!');
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

        // Grenade Launcher shell explodes on direct enemy proximity!
        if (pr.type === 'gl_shell') {
          let hitEnemy = false;
          for (const enemy of this.enemies) {
            if (enemy.alive && pr.pos.distanceTo(enemy.getCenterWorldPos()) < 1.35) {
              hitEnemy = true;
              break;
            }
          }
          if (hitEnemy) {
            this.scene.remove(pr.mesh);
            this.projectiles.splice(i, 1);
            this._explodeSplash(pr.pos, pr.weaponDef || WEAPONS.grenadelauncher, null);
            continue;
          }
        }

        pr.mesh.position.copy(pr.pos);
        pr.mesh.rotation.x += dt * 7;
        pr.mesh.rotation.y += dt * 5;

        if (pr.fuse <= 0 || pr.pos.y < -25) {
          this.scene.remove(pr.mesh);
          this.projectiles.splice(i, 1);
          if (pr.pos.y < -25) continue;
          if (pr.type === 'gl_shell') this._explodeSplash(pr.pos, pr.weaponDef || WEAPONS.grenadelauncher, null);
          else if (pr.type === 'flash') this._detonateFlashbang(pr.pos);
          else if (pr.type === 'molotov') this._spawnMolotovPool(pr.pos);
          else if (pr.type === 'smoke') this._spawnSmokeCloud(pr.pos);
          else if (pr.type === 'satchel') this._explodeFrag(pr.pos, true);
          else this._explodeFrag(pr.pos, false);
        }
      }

      // Armed Subspace Tripmines!
      for (let i = this.mines.length - 1; i >= 0; i--) {
        const m = this.mines[i];
        m.life -= dt;
        m.armTimer = Math.max(0, m.armTimer - dt);
        m.mesh.rotation.y += dt * 2.5;
        let triggered = false;
        if (m.armTimer <= 0 && this.roundState === 'playing') {
          for (const enemy of this.enemies) {
            if (enemy.alive && enemy.pos.distanceTo(m.pos) < 3.6) {
              triggered = true;
              break;
            }
          }
        }
        if (triggered || m.life <= 0) {
          this.scene.remove(m.mesh);
          m.mesh.geometry.dispose();
          m.mesh.material.dispose();
          this.mines.splice(i, 1);
          if (triggered) {
            this.sound.playExplosion();
            this._spawnShockwave(m.pos, 0xff2ad4, 9.0, 0.38);
            this._spawnParticles(m.pos, 0xff2ad4, 30, 12);
            for (const enemy of this.enemies) {
              if (!enemy.alive) continue;
              const d = enemy.getCenterWorldPos().distanceTo(m.pos);
              if (d < 8.5) {
                const dmg = Math.round(110 * (1 - d / 8.5));
                if (dmg > 6) this._onPlayerHitEnemy(enemy, dmg, false, enemy.getCenterWorldPos(), 'SUBSPACE TRIPMINE');
              }
            }
          }
        }
      }

      // 3D Holodome Energy Shield Domes!
      for (let i = this.holodomes.length - 1; i >= 0; i--) {
        const hd = this.holodomes[i];
        hd.life -= dt;
        hd.mesh.rotation.y += dt * 0.6;
        hd.mesh.material.opacity = Math.min(0.26, hd.life * 0.14);
        if (hd.life <= 0) {
          this.scene.remove(hd.mesh);
          hd.mesh.geometry.dispose();
          hd.mesh.material.dispose();
          this.holodomes.splice(i, 1);
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
          if (!this.pickerOpen) {
            this._showBanner(`ROUND ${this.roundNumber}`, `FIGHT IN ${sec}...`, false);
          }
        }
        this._updatePickerTimerUI();
        if (this.stateTimer <= 0) {
          this.roundState = 'playing';
          this.sound.playBeep(true);
          if (this.pickerOpen) {
            // 5 seconds expired! Round starts WITHOUT closing the picker so player can be killed while still picking!
            this._updatePickerTimerUI();
            this._pushKillFeed('ROUND STARTED! RIVAL IS COMING FOR YOU!');
          } else {
            this._showBanner('FIGHT!', 'ELIMINATE YOUR RIVAL', false);
            setTimeout(() => {
              if (this.roundState === 'playing') this.ui.centerBanner.classList.add('hidden');
            }, 700);
          }
        }
      } else if (this.roundState === 'playing') {
        if (this.pickerOpen && !this.pickerIsRange) this._updatePickerTimerUI();
        if (this.loadoutChoice.mode === 'range') return;
        this.roundTimer -= dt;
        if (this.roundTimer <= 0) {
          this.roundTimer = 0;
          if (this.loadoutChoice.mode === 'tdm' || this.loadoutChoice.mode === 'ffa') {
            this._finishMatch();
          } else {
            const playerWinsTimeout = this.loadoutChoice.mode === 'practice' ? false : this.player.hp >= this.bot.hp;
            this._endRound(playerWinsTimeout, 'TIME EXPIRED');
          }
        }
      } else if (this.roundState === 'round_over') {
        this.stateTimer -= dt;
        const secLeft = Math.max(1, Math.ceil(this.stateTimer));
        this.ui.bannerSub.textContent = `${this.roundEndSub} · RESETTING IN ${secLeft}...`;
        if (this.stateTimer <= 0) {
          this._stopEmote();
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
      const nowSec = performance.now() * 0.001;
      const isPlaying = this.roundState === 'playing' && !this.isPaused;
      this.arena.update(dt, nowSec, (evtType, laneLabel) => {
        if (!isPlaying) return;
        if (evtType === 'warning') {
          this.sound.playTrainHorn();
          this._pushKillFeed(`EXPRESS TRAIN INCOMING (${laneLabel})!`);
        } else if (evtType === 'pass') {
          this.sound.playTrainWhoosh();
        }
      });

      if (this.roundState === 'menu' || this.roundState === 'match_over') {
        if (this.fpArms) this.fpArms.visible = false;
        if (this.weaponMesh) this.weaponMesh.visible = false;
        for (const lb of this.lobbyBots) lb.update(dt, null);
        const t = performance.now() * 0.00022;
        this.camera.position.set(Math.sin(t) * 26, 13.5, Math.cos(t) * 28);
        this.camera.lookAt(0, 2.5, 0);
        this.renderer.render(this.scene, this.camera);
        return;
      }

      const paused = this.isPaused && this.roundState !== 'match_over';
      if (!paused) {
        if (this.inLobby) {
          this._updatePlayer(dt);
          this._updateWeaponAndViewmodel(dt);
          this._updateLobby(dt);
          this._updateEffects(dt);
          this._updateHUD();
          this.renderer.render(this.scene, this.camera);
          return;
        }

        this._updateRoundState(dt);
        this._updatePlayer(dt);
        this._updateWeaponAndViewmodel(dt);

        // TDM & FFA Respawn Timers (Player, Allies & Enemies)
        if ((this.loadoutChoice.mode === 'tdm' || this.loadoutChoice.mode === 'ffa') && this.roundState === 'playing') {
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
                const skinUse = b.team === 'blue' ? 'ally' : b.team === 'ffa' ? b.skinId : this.loadoutChoice.rivalSkin;
                b.reset(sp, this.loadoutChoice.difficulty, skinUse, this.loadoutChoice.mode);
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
          const targetsForBot =
            this.loadoutChoice.mode === 'ffa'
              ? [
                  { pos: this.player.pos, alive: this.player.alive },
                  ...this.enemies.filter((o) => o !== enemy).map((o) => ({ pos: o.pos, alive: o.alive })),
                ]
              : blueTargets;
          enemy.update(
            dt,
            targetsForBot,
            this.roundState === 'playing',
            (shooter, origin, dir, dmg, wDef) => this._onBotShoot(shooter, origin, dir, dmg, wDef),
            grav,
            this.smokeClouds,
            (fallen) => {
              if (this.roundState !== 'playing') return;
              this.stats.kills += 1;
              this.sound.playKill();
              this._pushKillFeed(`${fallen.name || 'TARGET'} FELL INTO THE SKY VOID!`);
              if (this.loadoutChoice.mode === 'tdm' || this.loadoutChoice.mode === 'ffa') {
                this.playerScore += 1;
                fallen.respawnTimer = 2.4;
                this._renderScorePips();
                const lim = this.loadoutChoice.mode === 'ffa' ? FFA_SCORE_LIMIT : TDM_SCORE_LIMIT;
                if (this.playerScore >= lim) this._finishMatch();
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
            (shooter, origin, dir, dmg, wDef) => this._onBotShoot(shooter, origin, dir, dmg, wDef),
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

        // Check Neon Station Express Train Squash Hazard!
        if (this.roundState === 'playing' && this.arena.trainHazard) {
          if (this.player.alive && this.arena.checkTrainHit(this.player.pos, 0.45, 1.8)) {
            this.player.hp = 0;
            this.sound.playExplosion();
            this._spawnShockwave(this.player.pos, 0xff2a55, 6.0, 0.3);
            this._spawnParticles(this.player.pos, 0xff2a55, 22, 12);
            this._updateHUD();
            this._handlePlayerDeath('EXPRESS TRAIN');
          }
          for (const enemy of this.enemies) {
            if (enemy.alive && !enemy.isDummy && this.arena.checkTrainHit(enemy.pos, 0.48, 1.9)) {
              enemy.takeDamage(999, false);
              this.sound.playExplosion();
              this._spawnShockwave(enemy.pos, 0xff2a55, 5.5, 0.3);
              this._spawnParticles(enemy.getCenterWorldPos(), 0xff2a55, 22, 12);
              this._pushKillFeed(`${enemy.name || 'RIVAL'} SQUASHED BY EXPRESS TRAIN!`);
              if (this.loadoutChoice.mode === 'tdm') {
                this.playerScore += 1;
                enemy.respawnTimer = 2.4;
                this._renderScorePips();
                if (this.playerScore >= TDM_SCORE_LIMIT) this._finishMatch();
              } else if (this._getAliveEnemyCount() === 0 && this.loadoutChoice.mode !== 'range') {
                this._endRound(true, 'RIVAL SQUASHED BY EXPRESS TRAIN!');
              }
            }
          }
          for (const ally of this.allies) {
            if (ally.alive && this.arena.checkTrainHit(ally.pos, 0.48, 1.9)) {
              ally.takeDamage(999, false);
              this.sound.playExplosion();
              this._spawnShockwave(ally.pos, 0x2de2ff, 5.5, 0.3);
              this._spawnParticles(ally.getCenterWorldPos(), 0x2de2ff, 20, 12);
              this._pushKillFeed(`${ally.name} SQUASHED BY EXPRESS TRAIN!`);
              if (this.loadoutChoice.mode === 'tdm') {
                this.botScore += 1;
                ally.respawnTimer = 2.4;
                this._renderScorePips();
                if (this.botScore >= TDM_SCORE_LIMIT) this._finishMatch();
              } else if (!this.player.alive && this._getAliveAllyCount() === 0) {
                this._endRound(false, 'BLUE TEAM ELIMINATED');
              }
            }
          }
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
