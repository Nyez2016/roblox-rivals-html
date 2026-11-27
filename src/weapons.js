(function (global) {
  const Rivals = (global.Rivals = global.Rivals || {});
  const THREE = global.THREE;
  const { applyWeaponSkin } = Rivals;

  const STARTER_WEAPONS = ['ar', 'handgun', 'fists', 'grenade'];

  const WEAPONS = {
    // =========================================================
    // PRIMARIES (13) — Ordered by Key Cost (Starter -> Mythic)
    // =========================================================
    ar: {
      id: 'ar',
      name: 'ASSAULT RIFLE',
      slotType: 'primary',
      cost: 0,
      tier: 'Starter',
      desc: 'Reliable all-range automatic rifle with controllable recoil and crisp headshot multipliers.',
      tip: 'Great all-rounder — ADS on mid-range peeks for tight laser accuracy.',
      damage: 18,
      headDamage: 32,
      fireRate: 9.2,
      auto: true,
      burstCount: 1,
      pellets: 1,
      magSize: 25,
      reserveMax: 125,
      reloadTime: 1.45,
      spread: 0.015,
      adsSpread: 0.004,
      adsFov: 60,
      scoped: false,
      recoil: 0.022,
      range: 140,
      moveMult: 1.0,
      tracerColor: 0x38e8ff,
    },
    burst: {
      id: 'burst',
      name: 'BURST RIFLE',
      slotType: 'primary',
      cost: 25,
      tier: 'Standard',
      desc: 'Precision 3-round burst rifle engineered for high-accuracy mid-to-long range duels.',
      tip: 'Aim at upper chest so the 3rd burst round kicks straight into the head.',
      damage: 17,
      headDamage: 30,
      fireRate: 2.3,
      auto: false,
      burstCount: 3,
      burstInterval: 0.065,
      pellets: 1,
      magSize: 24,
      reserveMax: 120,
      reloadTime: 1.5,
      spread: 0.012,
      adsSpread: 0.003,
      adsFov: 56,
      scoped: false,
      recoil: 0.018,
      range: 150,
      moveMult: 0.98,
      tracerColor: 0x7effb2,
    },
    shotgun: {
      id: 'shotgun',
      name: 'SHOTGUN',
      slotType: 'primary',
      cost: 35,
      tier: 'Standard',
      desc: 'Devastating 12-gauge pump-action firing 8 heavy pellets per blast for close-quarters dominance.',
      tip: 'Combine with Slide Boost or Dash to close distance and one-pump rivals.',
      damage: 14,
      headDamage: 22,
      fireRate: 1.15,
      auto: false,
      burstCount: 1,
      pellets: 8,
      magSize: 6,
      reserveMax: 36,
      reloadTime: 1.85,
      spread: 0.068,
      adsSpread: 0.046,
      adsFov: 68,
      scoped: false,
      recoil: 0.075,
      range: 42,
      moveMult: 1.02,
      tracerColor: 0xff9f43,
    },
    bow: {
      id: 'bow',
      name: 'BOW',
      slotType: 'primary',
      cost: 40,
      tier: 'Standard',
      desc: 'Silent high-velocity recurve bow with lethal headshot damage and agile movement speed.',
      tip: 'Double-jump peek from high ground for silent one-shot headshots.',
      damage: 65,
      headDamage: 135,
      fireRate: 1.15,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 10,
      reserveMax: 40,
      reloadTime: 1.2,
      spread: 0.015,
      adsSpread: 0.001,
      adsFov: 48,
      scoped: false,
      recoil: 0.032,
      range: 185,
      moveMult: 1.08,
      tracerColor: 0x5ceeff,
      silent: true,
    },
    rpg: {
      id: 'rpg',
      name: 'RPG',
      slotType: 'primary',
      cost: 55,
      tier: 'Pro',
      desc: 'Shoulder-fired explosive rocket launcher with massive blast radius and classic rocket-jumping.',
      tip: 'Fire at your feet while jumping to launch sky-high, or splash enemies behind cover.',
      damage: 90,
      headDamage: 110,
      explosiveRadius: 7.2,
      fireRate: 0.65,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 1,
      reserveMax: 12,
      reloadTime: 1.65,
      spread: 0.008,
      adsSpread: 0.002,
      adsFov: 64,
      scoped: false,
      recoil: 0.09,
      range: 180,
      moveMult: 0.9,
      beamRadius: 0.06,
      tracerColor: 0xff6b1a,
    },
    crossbow: {
      id: 'crossbow',
      name: 'CROSSBOW',
      slotType: 'primary',
      cost: 65,
      tier: 'Pro',
      desc: 'Silent repeating crossbow with razor-tight accuracy and nearly zero recoil.',
      tip: 'Pair with Smoke Bomb to shred rivals silently from cover.',
      damage: 28,
      headDamage: 56,
      fireRate: 4.8,
      auto: true,
      burstCount: 1,
      pellets: 1,
      magSize: 15,
      reserveMax: 75,
      reloadTime: 1.35,
      spread: 0.008,
      adsSpread: 0.0015,
      adsFov: 56,
      scoped: false,
      recoil: 0.01,
      range: 155,
      moveMult: 1.06,
      tracerColor: 0x34d399,
      silent: true,
    },
    gunblade: {
      id: 'gunblade',
      name: 'GUNBLADE',
      slotType: 'primary',
      cost: 80,
      tier: 'Pro',
      desc: 'Hybrid rifle-saber combining high mobility with heavy semi-auto kinetic slugs.',
      tip: 'High movement speed makes strafe-duels effortless while dealing 32/64 HS.',
      damage: 32,
      headDamage: 64,
      fireRate: 3.8,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 12,
      reserveMax: 60,
      reloadTime: 1.35,
      spread: 0.01,
      adsSpread: 0.002,
      adsFov: 58,
      scoped: false,
      recoil: 0.03,
      range: 135,
      moveMult: 1.12,
      tracerColor: 0xf472b6,
    },
    grenadelauncher: {
      id: 'grenadelauncher',
      name: 'GRENADE LAUNCHER',
      slotType: 'primary',
      cost: 90,
      tier: 'Pro',
      desc: 'Rotary 6-round drum launcher firing bouncing explosive shells with 6.5m blast splash & blast-jumping!',
      tip: 'Bank shells off walls to flush hiding rivals or blast-jump onto high perches.',
      damage: 74,
      headDamage: 92,
      launchGrenade: true,
      explosiveRadius: 6.5,
      fireRate: 1.45,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 6,
      reserveMax: 24,
      reloadTime: 1.9,
      spread: 0.014,
      adsSpread: 0.005,
      adsFov: 66,
      scoped: false,
      recoil: 0.068,
      range: 130,
      moveMult: 0.94,
      tracerColor: 0xff7b29,
    },
    sniper: {
      id: 'sniper',
      name: 'SNIPER',
      slotType: 'primary',
      cost: 95,
      tier: 'Pro',
      desc: 'Bolt-action .50-cal marksman rifle capable of instant 1-shot headshots. Requires Scope (RMB) to fire.',
      tip: 'Hold Right-Click to scope in before firing — hip-fire safety lock prevents unscoped shots!',
      damage: 75,
      headDamage: 150,
      scopedOnly: true,
      fireRate: 0.85,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 5,
      reserveMax: 25,
      reloadTime: 2.0,
      spread: 0.045,
      adsSpread: 0.0004,
      adsFov: 26,
      scoped: true,
      recoil: 0.08,
      range: 240,
      moveMult: 0.92,
      tracerColor: 0xffd447,
    },
    paintball: {
      id: 'paintball',
      name: 'PAINTBALL GUN',
      slotType: 'primary',
      cost: 120,
      tier: 'Exotic',
      desc: 'High-impact Rivals classic firing rapid neon paint globes that deal massive body & head damage.',
      tip: 'Incredible TTK at mid-range — melts rivals in 3–4 colorful splats.',
      damage: 25,
      headDamage: 44,
      fireRate: 5.8,
      auto: true,
      burstCount: 1,
      pellets: 1,
      magSize: 18,
      reserveMax: 90,
      reloadTime: 1.4,
      spread: 0.016,
      adsSpread: 0.006,
      adsFov: 64,
      scoped: false,
      recoil: 0.022,
      range: 135,
      moveMult: 1.05,
      tracerColor: 0xff5ef7,
      paintSplat: true,
    },
    wildcat: {
      id: 'wildcat',
      name: 'WILDCAT',
      slotType: 'primary',
      cost: 135,
      tier: 'Exotic',
      desc: 'Hyper-agile bullpup assault SMG with blazing 13.0 RPS fire rate and ferocious sprint mobility.',
      tip: 'Slide-peek corners and melt rivals up close with relentless fire rate.',
      damage: 14,
      headDamage: 25,
      fireRate: 13.0,
      auto: true,
      burstCount: 1,
      pellets: 1,
      magSize: 34,
      reserveMax: 170,
      reloadTime: 1.3,
      spread: 0.02,
      adsSpread: 0.008,
      adsFov: 64,
      scoped: false,
      recoil: 0.014,
      range: 115,
      moveMult: 1.1,
      tracerColor: 0xf97316,
    },
    flamethrower: {
      id: 'flamethrower',
      name: 'FLAMETHROWER',
      slotType: 'primary',
      cost: 150,
      tier: 'Exotic',
      desc: 'Close-range inferno projector unleashing a continuous stream of scorching flames.',
      tip: 'Rush with Double Jump + Slide to roast rivals at close quarters.',
      damage: 11,
      headDamage: 15,
      fireRate: 15.0,
      auto: true,
      burstCount: 1,
      pellets: 2,
      magSize: 50,
      reserveMax: 150,
      reloadTime: 1.85,
      spread: 0.075,
      adsSpread: 0.055,
      adsFov: 74,
      scoped: false,
      recoil: 0.006,
      range: 19,
      moveMult: 1.04,
      flameStream: true,
      beamRadius: 0.07,
      tracerColor: 0xff6b1a,
    },
    energyrifle: {
      id: 'energyrifle',
      name: 'ENERGY RIFLE',
      slotType: 'primary',
      cost: 180,
      tier: 'Exotic',
      desc: 'Futuristic zero-recoil laser rifle with pinpoint beams and blazing fire rate.',
      tip: 'Zero recoil lets you track airborne enemies effortlessly across sky maps.',
      damage: 17,
      headDamage: 31,
      fireRate: 11.2,
      auto: true,
      burstCount: 1,
      pellets: 1,
      magSize: 32,
      reserveMax: 160,
      reloadTime: 1.35,
      spread: 0.005,
      adsSpread: 0.001,
      adsFov: 58,
      scoped: false,
      recoil: 0.005,
      range: 175,
      moveMult: 1.02,
      beamRadius: 0.032,
      tracerColor: 0x00f5ff,
    },
    permafrost: {
      id: 'permafrost',
      name: 'PERMAFROST',
      slotType: 'primary',
      cost: 200,
      tier: 'Exotic',
      desc: 'Cryogenic ice-shard cannon whose headshots freeze rivals solid in ice for 1.4 seconds!',
      tip: 'Land a headshot to freeze a dodging rival, then finish them effortlessly.',
      damage: 24,
      headDamage: 46,
      cryoFreeze: true,
      fireRate: 5.4,
      auto: true,
      burstCount: 1,
      pellets: 1,
      magSize: 20,
      reserveMax: 100,
      reloadTime: 1.45,
      spread: 0.009,
      adsSpread: 0.002,
      adsFov: 56,
      scoped: false,
      recoil: 0.015,
      range: 165,
      moveMult: 1.02,
      beamRadius: 0.034,
      tracerColor: 0x7dd3fc,
    },
    minigun: {
      id: 'minigun',
      name: 'MINIGUN',
      slotType: 'primary',
      cost: 220,
      tier: 'Mythic',
      desc: '6-barrel rotary bullet hose with a 60-round drum and unstoppable 16.5 RPS suppression.',
      tip: 'Hold high ground or jump-pad peek while shredding entire teams in 2v2 & TDM.',
      damage: 13,
      headDamage: 22,
      fireRate: 16.5,
      auto: true,
      burstCount: 1,
      pellets: 1,
      magSize: 60,
      reserveMax: 240,
      reloadTime: 2.35,
      spread: 0.034,
      adsSpread: 0.02,
      adsFov: 66,
      scoped: false,
      recoil: 0.012,
      range: 120,
      moveMult: 0.85,
      tracerColor: 0xffc83d,
    },
    distortion: {
      id: 'distortion',
      name: 'DISTORTION',
      slotType: 'primary',
      cost: 250,
      tier: 'Mythic',
      desc: 'Reality-warping quantum vortex rifle firing gravity pulses that pull nearby enemies into the blast!',
      tip: 'Fire near ledges or clumps of bots to yank them into a deadly vortex splash.',
      damage: 44,
      headDamage: 74,
      vortexRadius: 6.5,
      explosiveRadius: 6.2,
      fireRate: 2.4,
      auto: true,
      burstCount: 1,
      pellets: 1,
      magSize: 10,
      reserveMax: 50,
      reloadTime: 1.65,
      spread: 0.009,
      adsSpread: 0.002,
      adsFov: 56,
      scoped: false,
      recoil: 0.032,
      range: 170,
      moveMult: 0.98,
      beamRadius: 0.044,
      tracerColor: 0xd946ef,
    },
    railgun: {
      id: 'railgun',
      name: 'PHASE RAILGUN',
      slotType: 'primary',
      cost: 275,
      tier: 'Mythic',
      desc: 'Experimental electromagnetic railgun whose hyper-velocity plasma beam pierces straight through solid walls!',
      tip: 'Punish rivals hiding behind cover with lethal WALLBANG shots & multi-target collaterals.',
      damage: 55,
      headDamage: 110,
      wallDamage: 42,
      wallHeadDamage: 84,
      pierceWalls: true,
      beamRadius: 0.048,
      fireRate: 0.95,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 4,
      reserveMax: 24,
      reloadTime: 1.8,
      spread: 0.012,
      adsSpread: 0.0008,
      adsFov: 44,
      scoped: false,
      recoil: 0.068,
      range: 220,
      moveMult: 0.94,
      tracerColor: 0x00f5ff,
    },

    // =========================================================
    // SECONDARIES (10)
    // =========================================================
    handgun: {
      id: 'handgun',
      name: 'HANDGUN',
      slotType: 'secondary',
      cost: 0,
      tier: 'Starter',
      desc: 'Crisp tactical starter pistol with fast draw speed, high mobility, and clean headshot accuracy.',
      tip: 'Swap to Handgun to finish low-HP enemies instead of reloading mid-fight.',
      damage: 22,
      headDamage: 44,
      fireRate: 5.8,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 12,
      reserveMax: 72,
      reloadTime: 1.1,
      spread: 0.01,
      adsSpread: 0.002,
      adsFov: 66,
      scoped: false,
      recoil: 0.025,
      range: 115,
      moveMult: 1.1,
      tracerColor: 0x7dd3fc,
    },
    uzi: {
      id: 'uzi',
      name: 'UZI',
      slotType: 'secondary',
      cost: 20,
      tier: 'Standard',
      desc: 'Blistering rapid-fire pocket SMG built for aggressive close-quarters spraying.',
      tip: 'Pair with Sniper so you always have a fast close-range backup.',
      damage: 11,
      headDamage: 19,
      fireRate: 14.5,
      auto: true,
      burstCount: 1,
      pellets: 1,
      magSize: 30,
      reserveMax: 150,
      reloadTime: 1.25,
      spread: 0.032,
      adsSpread: 0.015,
      adsFov: 68,
      scoped: false,
      recoil: 0.015,
      range: 85,
      moveMult: 1.08,
      tracerColor: 0xff5ef7,
    },
    flaregun: {
      id: 'flaregun',
      name: 'FLARE GUN',
      slotType: 'secondary',
      cost: 30,
      tier: 'Standard',
      desc: 'Fires incandescent thermal flares that explode into burning fire zones on impact!',
      tip: 'Shoot flares at chokepoints or ramps to flush enemies out of cover.',
      damage: 42,
      headDamage: 68,
      spawnFirePool: true,
      fireRate: 1.2,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 2,
      reserveMax: 12,
      reloadTime: 1.5,
      spread: 0.015,
      adsSpread: 0.005,
      adsFov: 68,
      scoped: false,
      recoil: 0.05,
      range: 120,
      moveMult: 1.08,
      beamRadius: 0.04,
      tracerColor: 0xff5a1f,
    },
    shorty: {
      id: 'shorty',
      name: 'SHORTY',
      slotType: 'secondary',
      cost: 35,
      tier: 'Standard',
      desc: 'Sawed-off double-barrel pocket shotgun unleashing 6 pellets per trigger pull.',
      tip: 'Deadly point-blank finisher right after a Scythe Jump or Slide.',
      damage: 14,
      headDamage: 22,
      fireRate: 2.2,
      auto: false,
      burstCount: 1,
      pellets: 6,
      magSize: 2,
      reserveMax: 18,
      reloadTime: 1.35,
      spread: 0.088,
      adsSpread: 0.068,
      adsFov: 72,
      scoped: false,
      recoil: 0.07,
      range: 28,
      moveMult: 1.1,
      tracerColor: 0xff7b29,
    },
    revolver: {
      id: 'revolver',
      name: 'REVOLVER',
      slotType: 'secondary',
      cost: 45,
      tier: 'Pro',
      desc: 'High-caliber 6-shot hand cannon rewarding sharp aim with 72-damage headshots.',
      tip: 'Two headshots or a Sniper body + Revolver tap drops any rival instantly.',
      damage: 36,
      headDamage: 72,
      fireRate: 2.4,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 6,
      reserveMax: 42,
      reloadTime: 1.35,
      spread: 0.012,
      adsSpread: 0.0025,
      adsFov: 64,
      scoped: false,
      recoil: 0.055,
      range: 120,
      moveMult: 1.05,
      tracerColor: 0xffb347,
    },
    kunai: {
      id: 'kunai',
      name: 'DAGGERS',
      slotType: 'secondary',
      cost: 55,
      tier: 'Pro',
      desc: 'Silent twin throwing daggers with blazing sprint mobility and lethal 78-damage headshots.',
      tip: 'Fastest secondary movement speed — great for stealth flanks.',
      damage: 34,
      headDamage: 78,
      fireRate: 3.4,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 8,
      reserveMax: 48,
      reloadTime: 1.0,
      spread: 0.008,
      adsSpread: 0.0018,
      adsFov: 66,
      scoped: false,
      recoil: 0.014,
      range: 105,
      moveMult: 1.15,
      tracerColor: 0xf43f5e,
      silent: true,
    },
    spray: {
      id: 'spray',
      name: 'SPRAY',
      slotType: 'secondary',
      cost: 70,
      tier: 'Pro',
      desc: 'Tactical 3-round burst machine pistol with crisp accuracy and fast reloads.',
      tip: 'Shreds close-to-mid targets in just two bursts.',
      damage: 14,
      headDamage: 25,
      fireRate: 3.2,
      auto: false,
      burstCount: 3,
      burstInterval: 0.055,
      pellets: 1,
      magSize: 27,
      reserveMax: 108,
      reloadTime: 1.2,
      spread: 0.018,
      adsSpread: 0.008,
      adsFov: 66,
      scoped: false,
      recoil: 0.014,
      range: 95,
      moveMult: 1.08,
      tracerColor: 0x38ef7d,
    },
    slingshot: {
      id: 'slingshot',
      name: 'SLINGSHOT',
      slotType: 'secondary',
      cost: 110,
      tier: 'Exotic',
      desc: 'Rapid-fire Rivals classic slingshot firing high-velocity kinetic pellets at lightning speed.',
      tip: 'Hold LMB while jumping & strafing for relentless pressure.',
      damage: 18,
      headDamage: 34,
      fireRate: 8.5,
      auto: true,
      burstCount: 1,
      pellets: 1,
      magSize: 22,
      reserveMax: 110,
      reloadTime: 1.15,
      spread: 0.02,
      adsSpread: 0.008,
      adsFov: 68,
      scoped: false,
      recoil: 0.01,
      range: 110,
      moveMult: 1.14,
      tracerColor: 0xfacc15,
    },
    warper: {
      id: 'warper',
      name: 'WARPER',
      slotType: 'secondary',
      cost: 145,
      tier: 'Exotic',
      desc: 'Dimensional sidearm firing razor-accurate phase bolts — hits grant a brief quantum speed surge!',
      tip: 'Chain hits while double-jumping to out-strafe every opponent.',
      damage: 30,
      headDamage: 58,
      warpBoost: true,
      fireRate: 4.5,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 10,
      reserveMax: 60,
      reloadTime: 1.2,
      spread: 0.008,
      adsSpread: 0.0015,
      adsFov: 62,
      scoped: false,
      recoil: 0.02,
      range: 140,
      moveMult: 1.14,
      beamRadius: 0.032,
      tracerColor: 0xa855f7,
    },
    exogun: {
      id: 'exogun',
      name: 'EXOGUN',
      slotType: 'secondary',
      cost: 165,
      tier: 'Exotic',
      desc: 'Alien plasma blaster firing explosive splash bolts that damage enemies even around corners!',
      tip: 'Shoot the ground near dodging rivals for guaranteed splash damage.',
      damage: 34,
      headDamage: 54,
      explosiveRadius: 4.5,
      fireRate: 3.6,
      auto: true,
      burstCount: 1,
      pellets: 1,
      magSize: 8,
      reserveMax: 48,
      reloadTime: 1.3,
      spread: 0.01,
      adsSpread: 0.002,
      adsFov: 64,
      scoped: false,
      recoil: 0.024,
      range: 135,
      moveMult: 1.08,
      beamRadius: 0.038,
      tracerColor: 0xc084fc,
    },
    energypistols: {
      id: 'energypistols',
      name: 'ENERGY PISTOLS',
      slotType: 'secondary',
      cost: 210,
      tier: 'Mythic',
      desc: 'Dual rapid-fire plasma pistols with pinpoint accuracy, 12.5 RPS, and zero recoil.',
      tip: 'Melts rivals like a primary weapon while keeping secondary sprint speed!',
      damage: 14,
      headDamage: 26,
      fireRate: 12.5,
      auto: true,
      burstCount: 1,
      pellets: 1,
      magSize: 34,
      reserveMax: 170,
      reloadTime: 1.2,
      spread: 0.008,
      adsSpread: 0.002,
      adsFov: 66,
      scoped: false,
      recoil: 0.005,
      range: 130,
      moveMult: 1.14,
      beamRadius: 0.028,
      tracerColor: 0x00f5ff,
    },

    // =========================================================
    // MELEES (8)
    // =========================================================
    fists: {
      id: 'fists',
      name: 'FISTS',
      slotType: 'melee',
      cost: 0,
      tier: 'Starter',
      desc: 'Starter melee — rapid boxing punches with fast sprint speed and an uppercut RMB lunge.',
      tip: 'Pull out Fists whenever rotating across maps for +16% speed boost!',
      damage: 30,
      lungeDamage: 46,
      fireRate: 3.4,
      auto: true,
      burstCount: 1,
      pellets: 1,
      magSize: Infinity,
      reserveMax: Infinity,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 3.4,
      lungePower: 16.5,
      lungeLift: 5.0,
      moveMult: 1.16,
      tracerColor: 0x38bdf8,
    },
    knife: {
      id: 'knife',
      name: 'KNIFE',
      slotType: 'melee',
      cost: 25,
      tier: 'Standard',
      desc: 'Classic Rivals assassin blade — fastest sprint speed (+24%) and instant 105-damage Backstabs!',
      tip: 'Use Smoke or Double Jump over a rival to land a lethal backstab.',
      damage: 42,
      lungeDamage: 58,
      backstabDamage: 105,
      fireRate: 3.6,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: Infinity,
      reserveMax: Infinity,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 3.9,
      lungePower: 22.0,
      lungeLift: 4.0,
      moveMult: 1.24,
      tracerColor: 0xf43f5e,
    },
    chainsaw: {
      id: 'chainsaw',
      name: 'CHAINSAW',
      slotType: 'melee',
      cost: 45,
      tier: 'Pro',
      desc: 'Roaring motorized chainsaw that continuously shreds close targets and surges forward on RMB.',
      tip: 'Hold LMB in CQC to saw through enemies at 6 hits/sec.',
      damage: 24,
      lungeDamage: 52,
      fireRate: 6.0,
      auto: true,
      burstCount: 1,
      pellets: 1,
      magSize: Infinity,
      reserveMax: Infinity,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 3.9,
      lungePower: 21.0,
      lungeLift: 3.6,
      moveMult: 1.12,
      tracerColor: 0xff6b1a,
    },
    riotshield: {
      id: 'riotshield',
      name: 'RIOT SHIELD',
      slotType: 'melee',
      cost: 55,
      tier: 'Pro',
      desc: 'Heavy polycarbonate ballistic shield — hold RMB to guard and block 80% of incoming gunfire!',
      tip: 'Hold RMB while pushing across open bridges, then bash or swap to Shotgun.',
      damage: 38,
      lungeDamage: 54,
      shieldBlock: true,
      fireRate: 2.0,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: Infinity,
      reserveMax: Infinity,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 76,
      scoped: false,
      recoil: 0,
      range: 3.6,
      lungePower: 14.0,
      lungeLift: 3.5,
      moveMult: 1.04,
      tracerColor: 0x38bdf8,
    },
    katana: {
      id: 'katana',
      name: 'KATANA',
      slotType: 'melee',
      cost: 60,
      tier: 'Pro',
      desc: 'Balanced neon samurai blade with fast horizontal slashes and crisp RMB dash-lunge.',
      tip: 'Great mobility & reliable 2-hit melee finishes.',
      damage: 46,
      lungeDamage: 64,
      fireRate: 2.4,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: Infinity,
      reserveMax: Infinity,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 4.2,
      lungePower: 19.0,
      lungeLift: 4.8,
      moveMult: 1.18,
      tracerColor: 0x2de2ff,
    },
    spear: {
      id: 'spear',
      name: 'SPEAR',
      slotType: 'melee',
      cost: 70,
      tier: 'Pro',
      desc: 'Ultra-long 5.8m polearm that pokes rivals safely beyond normal melee range with a fierce RMB charge!',
      tip: 'Out-reach Katana & Knife users easily with superior 5.8m range.',
      damage: 54,
      lungeDamage: 82,
      fireRate: 1.85,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: Infinity,
      reserveMax: Infinity,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 5.8,
      lungePower: 23.0,
      lungeLift: 4.6,
      moveMult: 1.15,
      tracerColor: 0xfde047,
    },
    axe: {
      id: 'axe',
      name: 'BATTLE AXE',
      slotType: 'melee',
      cost: 75,
      tier: 'Pro',
      desc: 'Massive twin-bladed war axe dealing devastating 72-damage cleaves and 95-damage lunges.',
      tip: 'Land one chip shot then RMB cleave to finish almost any enemy.',
      damage: 72,
      lungeDamage: 95,
      fireRate: 1.3,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: Infinity,
      reserveMax: Infinity,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 4.5,
      lungePower: 16.0,
      lungeLift: 5.4,
      moveMult: 1.1,
      tracerColor: 0xff5a36,
    },
    xiuchun: {
      id: 'xiuchun',
      name: 'IMPERIAL SABER',
      slotType: 'melee',
      cost: 85,
      tier: 'Pro',
      desc: 'Curved masterwork saber with wide reach, +20% speed, and 95-damage Backstabs.',
      tip: 'Blends Katana speed with Assassin backstab burst.',
      damage: 58,
      lungeDamage: 78,
      backstabDamage: 95,
      fireRate: 1.95,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: Infinity,
      reserveMax: Infinity,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 4.6,
      lungePower: 20.0,
      lungeLift: 5.0,
      moveMult: 1.2,
      tracerColor: 0xfbbf24,
    },
    maul: {
      id: 'maul',
      name: 'MAUL',
      slotType: 'melee',
      cost: 95,
      tier: 'Exotic',
      desc: 'Colossal titanium warhammer — crushes foes for 85 dmg and unleashes an RMB shockwave slam!',
      tip: 'Double-jump over rivals and RMB slam down for massive AoE crush damage.',
      damage: 85,
      lungeDamage: 100,
      slamRadius: 5.4,
      fireRate: 1.15,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: Infinity,
      reserveMax: Infinity,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 4.6,
      lungePower: 15.0,
      lungeLift: 7.2,
      moveMult: 1.06,
      tracerColor: 0xf97316,
    },
    scythe: {
      id: 'scythe',
      name: 'SCYTHE',
      slotType: 'melee',
      cost: 110,
      tier: 'Exotic',
      desc: 'Iconic Rivals mobility reaper — aim up and press RMB for a sky-high Scythe Jump!',
      tip: 'Use Scythe Jump to soar onto Construction Crane, towers, and sky islands.',
      damage: 54,
      lungeDamage: 72,
      fireRate: 1.75,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: Infinity,
      reserveMax: Infinity,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 5.0,
      lungePower: 22.0,
      lungeLift: 13.5,
      lungeCooldown: 1.7,
      scytheJump: true,
      moveMult: 1.16,
      tracerColor: 0xc084fc,
    },
    trowel: {
      id: 'trowel',
      name: 'TROWEL',
      slotType: 'melee',
      cost: 140,
      tier: 'Exotic',
      desc: 'Classic Roblox builder tool! Press RMB to instantly build a solid brick cover wall in front of you!',
      tip: 'Build instant cover when caught in the open or stack walls to climb higher.',
      damage: 38,
      lungeDamage: 48,
      buildWall: true,
      fireRate: 2.2,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: Infinity,
      reserveMax: Infinity,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 3.8,
      lungePower: 10,
      lungeLift: 3,
      moveMult: 1.15,
      tracerColor: 0xf97316,
    },

    // =========================================================
    // UTILITIES (8)
    // =========================================================
    grenade: {
      id: 'grenade',
      name: 'GRENADE',
      slotType: 'utility',
      utilityType: 'frag',
      cost: 0,
      tier: 'Starter',
      desc: 'Starter bouncing frag explosive (92 AoE) — also launches you sky-high for Grenade Jumps!',
      tip: 'Throw at your feet and jump to launch onto rooftops or the Construction Crane.',
      damage: 92,
      fireRate: 1.0,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 2,
      reserveMax: 0,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 24,
      moveMult: 1.08,
      tracerColor: 0xff5a36,
    },
    smoke: {
      id: 'smoke',
      name: 'SMOKE GRENADE',
      slotType: 'utility',
      utilityType: 'smoke',
      cost: 20,
      tier: 'Standard',
      desc: 'Deploys a dense 7-second 3D smoke screen that completely blocks Rival Bot line-of-sight.',
      tip: 'Essential for safe rotations, Sniper repositions, and Knife backstabs.',
      damage: 0,
      fireRate: 1.1,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 2,
      reserveMax: 0,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 24,
      moveMult: 1.14,
      tracerColor: 0x94a3b8,
    },
    flashbang: {
      id: 'flashbang',
      name: 'FLASHBANG',
      slotType: 'utility',
      utilityType: 'flash',
      cost: 25,
      tier: 'Standard',
      desc: 'Detonates with a blinding flash that stuns and disorients Rivals for 2.8 seconds.',
      tip: 'Bounce around cover before pushing in with Shotgun or Knife.',
      damage: 10,
      fireRate: 1.1,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 2,
      reserveMax: 0,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 24,
      moveMult: 1.1,
      tracerColor: 0xf8fafc,
    },
    molotov: {
      id: 'molotov',
      name: 'MOLOTOV',
      slotType: 'utility',
      utilityType: 'molotov',
      cost: 35,
      tier: 'Standard',
      desc: 'Shatters on impact into a blazing 5.5-second fire pool dealing rapid burn damage.',
      tip: 'Deny bridges, platforms, and crane landings with flames.',
      damage: 26,
      fireRate: 1.0,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 2,
      reserveMax: 0,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 22,
      moveMult: 1.08,
      tracerColor: 0xff7b29,
    },
    jumppad: {
      id: 'jumppad',
      name: 'JUMP PAD',
      slotType: 'utility',
      utilityType: 'jumppad',
      cost: 40,
      tier: 'Standard',
      desc: 'Deploy a portable neon Launch Pad at your feet to vault onto any rooftop or crane!',
      tip: 'Drop a Jump Pad anywhere to seize instant aerial Sniper angles.',
      damage: 0,
      fireRate: 1.0,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 2,
      reserveMax: 0,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 0,
      moveMult: 1.12,
      tracerColor: 0xa855f7,
    },
    satchel: {
      id: 'satchel',
      name: 'SATCHEL',
      slotType: 'utility',
      utilityType: 'satchel',
      cost: 50,
      tier: 'Pro',
      desc: 'High-powered demolition charge with a huge 105-damage blast and mega vertical satchel-jump boost!',
      tip: 'Supercharged blast impulse launches you across entire maps.',
      damage: 105,
      fireRate: 1.0,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 2,
      reserveMax: 0,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 22,
      moveMult: 1.08,
      tracerColor: 0xfacc15,
    },
    subspace: {
      id: 'subspace',
      name: 'SUBSPACE TRIPMINE',
      slotType: 'utility',
      utilityType: 'subspace',
      cost: 65,
      tier: 'Pro',
      desc: 'Classic Roblox stealth proximity mine! Arms invisible on the floor and erupts for 110 magenta blast damage!',
      tip: 'Plant near ramps, ladders, or bridges to ambush rushing rivals.',
      damage: 110,
      fireRate: 1.0,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 2,
      reserveMax: 0,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 18,
      moveMult: 1.1,
      tracerColor: 0xff2ad4,
    },
    freeze: {
      id: 'freeze',
      name: 'FREEZE RAY',
      slotType: 'utility',
      utilityType: 'freeze',
      cost: 75,
      tier: 'Pro',
      desc: 'Fires an instant cryogenic beam that freezes your rival solid for 2.2 seconds!',
      tip: 'Freeze a moving rival, then swap to Sniper or Knife for a guaranteed highlight kill.',
      damage: 18,
      fireRate: 0.9,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 2,
      reserveMax: 0,
      reloadTime: 0,
      spread: 0.004,
      adsSpread: 0.001,
      adsFov: 74,
      scoped: false,
      recoil: 0.01,
      range: 120,
      moveMult: 1.1,
      tracerColor: 0x38bdf8,
    },
    warhorn: {
      id: 'warhorn',
      name: 'WAR HORN',
      slotType: 'utility',
      utilityType: 'warhorn',
      cost: 85,
      tier: 'Pro',
      desc: 'Blow the battle horn for an instant 5-second +38% Speed Boost & +25% Fire Rate surge!',
      tip: 'Trigger right as the round begins to seize high ground first.',
      damage: 0,
      fireRate: 0.8,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 2,
      reserveMax: 0,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 0,
      moveMult: 1.12,
      tracerColor: 0xfbbf24,
    },
    grappler: {
      id: 'grappler',
      name: 'GRAPPLER',
      slotType: 'utility',
      utilityType: 'grappler',
      cost: 95,
      tier: 'Pro',
      desc: 'High-tension grappling hook — aim at any wall, roof, or crane up to 75m and zip straight to it!',
      tip: 'Use Grappler to recover from sky-void falls or slingshot over enemy heads.',
      damage: 0,
      fireRate: 1.2,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 3,
      reserveMax: 0,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 75,
      moveMult: 1.15,
      tracerColor: 0x2de2ff,
    },
    warpstone: {
      id: 'warpstone',
      name: 'WARPSTONE',
      slotType: 'utility',
      utilityType: 'warpstone',
      cost: 115,
      tier: 'Exotic',
      desc: 'Mystic teleport crystal — blink instantaneously up to 42m straight to where you aim!',
      tip: 'Teleport behind a rival for an instant Knife backstab or escape lethal danger.',
      damage: 0,
      fireRate: 0.9,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 2,
      reserveMax: 0,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 42,
      moveMult: 1.14,
      tracerColor: 0xc084fc,
    },
    medkit: {
      id: 'medkit',
      name: 'MEDKIT',
      slotType: 'utility',
      utilityType: 'medkit',
      cost: 125,
      tier: 'Exotic',
      desc: 'Tactical trauma kit that instantly restores +50 HP in the middle of a heated duel!',
      tip: 'Duck behind cover (or a Trowel wall!) to heal back to full HP.',
      damage: 0,
      fireRate: 0.8,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 2,
      reserveMax: 0,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 0,
      moveMult: 1.1,
      tracerColor: 0x38ef7d,
    },
    holodome: {
      id: 'holodome',
      name: 'HOLODOME',
      slotType: 'utility',
      utilityType: 'holodome',
      cost: 145,
      tier: 'Exotic',
      desc: 'Projects a glowing 6-second 3D Energy Shield Dome around you that blocks incoming enemy fire!',
      tip: 'Drop Holodome when low HP to safely reload or heal right in the middle of the arena.',
      damage: 0,
      fireRate: 0.7,
      auto: false,
      burstCount: 1,
      pellets: 1,
      magSize: 1,
      reserveMax: 0,
      reloadTime: 0,
      spread: 0,
      adsSpread: 0,
      adsFov: 82,
      scoped: false,
      recoil: 0,
      range: 0,
      moveMult: 1.1,
      tracerColor: 0x00f5ff,
    },
  };

  function box(w, h, d, color, role = 'body', metalness = 0.25, roughness = 0.45, emissive = 0x000000) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness,
      emissive,
      emissiveIntensity: emissive ? 0.65 : 0,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.partRole = role;
    return mesh;
  }

  function cyl(rt, rb, h, segs, color, role = 'secondary', metalness = 0.55, roughness = 0.3, emissive = 0x000000) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(rt, rb, h, segs),
      new THREE.MeshStandardMaterial({
        color,
        metalness,
        roughness,
        emissive,
        emissiveIntensity: emissive ? 0.75 : 0,
      })
    );
    mesh.userData.partRole = role;
    return mesh;
  }

  function createWeaponMesh(weaponId, skinId = 'default') {
    const group = new THREE.Group();

    if (weaponId === 'ar' || weaponId === 'burst' || weaponId === 'energyrifle') {
      const accent = weaponId === 'ar' ? 0x2de2ff : weaponId === 'energyrifle' ? 0x00f5ff : 0x38ef7d;
      const bodyCol = weaponId === 'energyrifle' ? 0xe2e8f0 : 0x242c3c;
      const body = box(0.11, 0.14, 0.56, bodyCol, 'body', 0.45, 0.35);
      const barrel = box(0.05, 0.05, 0.36, 0x161b26, 'secondary', 0.6, 0.3);
      barrel.position.set(0, 0.02, -0.39);
      const stripe = box(0.116, 0.036, 0.44, accent, 'accent', 0.2, 0.25, accent);
      stripe.position.set(0, 0.03, -0.04);
      const mag = box(0.06, 0.2, 0.09, 0x191f2c, 'secondary');
      mag.position.set(0, -0.15, -0.05);
      mag.rotation.x = 0.22;
      const sight = box(0.05, 0.055, 0.1, 0x181f2c, 'secondary');
      sight.position.set(0, 0.095, 0.05);
      const reticle = box(0.022, 0.022, 0.022, accent, 'accent', 0, 0.2, accent);
      reticle.position.set(0, 0.1, 0.05);
      group.add(body, barrel, stripe, mag, sight, reticle);
      group.userData.magPart = mag;
      group.userData.magHome = mag.position.clone();
      group.userData.muzzle = new THREE.Vector3(0, 0.02, -0.58);
    } else if (weaponId === 'gunblade') {
      const body = box(0.095, 0.12, 0.5, 0x2a2438, 'body', 0.5, 0.35);
      const blade = box(0.022, 0.06, 0.52, 0xe2e8f0, 'body', 0.85, 0.15);
      blade.position.set(0, -0.04, -0.45);
      const edge = box(0.028, 0.018, 0.5, 0xf472b6, 'accent', 0.2, 0.2, 0xf472b6);
      edge.position.set(0, -0.068, -0.45);
      const barrel = cyl(0.028, 0.028, 0.38, 8, 0x181e2c, 'secondary', 0.7, 0.25);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, -0.36);
      const mag = box(0.055, 0.16, 0.08, 0x1e2436, 'secondary');
      mag.position.set(0, -0.12, 0.04);
      group.add(body, blade, edge, barrel, mag);
      group.userData.magPart = mag;
      group.userData.magHome = mag.position.clone();
      group.userData.muzzle = new THREE.Vector3(0, 0.04, -0.6);
    } else if (weaponId === 'rpg') {
      const tube = cyl(0.075, 0.075, 1.05, 12, 0x3f4e3c, 'body', 0.35, 0.5);
      tube.rotation.x = Math.PI / 2;
      tube.position.set(0, 0.04, -0.18);
      const warhead = new THREE.Mesh(
        new THREE.ConeGeometry(0.11, 0.32, 10),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.4, roughness: 0.4 })
      );
      warhead.userData.partRole = 'accent';
      warhead.rotation.x = -Math.PI / 2;
      warhead.position.set(0, 0.04, -0.82);
      const grip = box(0.06, 0.16, 0.08, 0x1e293b, 'secondary');
      grip.position.set(0, -0.09, 0.02);
      const sight = box(0.05, 0.09, 0.05, 0xfacc15, 'accent');
      sight.position.set(-0.08, 0.08, -0.25);
      group.add(tube, warhead, grip, sight);
      group.userData.magPart = warhead;
      group.userData.magHome = warhead.position.clone();
      group.userData.muzzle = new THREE.Vector3(0, 0.04, -0.98);
    } else if (weaponId === 'flamethrower') {
      const tank = cyl(0.095, 0.095, 0.42, 12, 0xdc2626, 'body', 0.4, 0.35);
      tank.rotation.x = Math.PI / 2;
      tank.position.set(0, -0.05, -0.05);
      const nozzle = cyl(0.036, 0.048, 0.54, 10, 0x1e293b, 'secondary', 0.75, 0.28);
      nozzle.rotation.x = Math.PI / 2;
      nozzle.position.set(0, 0.03, -0.46);
      const pilot = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.05, 0),
        new THREE.MeshStandardMaterial({ color: 0xff9f1c, emissive: 0xff4500, emissiveIntensity: 1.0 })
      );
      pilot.userData.partRole = 'accent';
      pilot.position.set(0, 0.05, -0.76);
      group.add(tank, nozzle, pilot);
      group.userData.magPart = tank;
      group.userData.magHome = tank.position.clone();
      group.userData.muzzle = new THREE.Vector3(0, 0.03, -0.78);
    } else if (weaponId === 'sniper') {
      const body = box(0.1, 0.13, 0.66, 0x2a3140, 'body', 0.35, 0.45);
      const barrel = box(0.045, 0.045, 0.62, 0x141923, 'secondary', 0.7, 0.25);
      barrel.position.set(0, 0.025, -0.55);
      const accent = box(0.106, 0.03, 0.5, 0xffd447, 'accent', 0.2, 0.3, 0xffd447);
      accent.position.set(0, 0.02, -0.05);
      const mag = box(0.065, 0.15, 0.11, 0x161b26, 'secondary');
      mag.position.set(0, -0.12, -0.04);
      const scope = cyl(0.04, 0.045, 0.34, 12, 0x111622, 'secondary', 0.6, 0.3);
      scope.rotation.x = Math.PI / 2;
      scope.position.set(0, 0.125, -0.04);
      const lens = cyl(0.032, 0.032, 0.02, 12, 0x2de2ff, 'accent', 0.2, 0.2, 0x2de2ff);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0, 0.125, -0.21);
      group.add(body, barrel, accent, mag, scope, lens);
      group.userData.magPart = mag;
      group.userData.magHome = mag.position.clone();
      group.userData.muzzle = new THREE.Vector3(0, 0.025, -0.88);
    } else if (weaponId === 'railgun') {
      const chassis = box(0.13, 0.14, 0.56, 0x1e293b, 'body', 0.65, 0.25);
      const topRail = box(0.042, 0.036, 0.68, 0x0f172a, 'secondary', 0.8, 0.2);
      topRail.position.set(0, 0.055, -0.46);
      const botRail = box(0.042, 0.036, 0.68, 0x0f172a, 'secondary', 0.8, 0.2);
      botRail.position.set(0, -0.025, -0.46);
      const plasmaCore = box(0.028, 0.032, 0.62, 0x00f5ff, 'accent', 0.1, 0.1, 0x00f5ff);
      plasmaCore.position.set(0, 0.015, -0.44);
      const coil1 = box(0.14, 0.05, 0.05, 0xd946ef, 'accent', 0.3, 0.2, 0xd946ef);
      coil1.position.set(0, 0.015, -0.28);
      const coil2 = box(0.13, 0.05, 0.05, 0x00f5ff, 'accent', 0.3, 0.2, 0x00f5ff);
      coil2.position.set(0, 0.015, -0.52);
      const cell = box(0.075, 0.14, 0.12, 0x00f5ff, 'accent', 0.3, 0.2, 0x00f5ff);
      cell.position.set(0, -0.12, -0.05);
      group.add(chassis, topRail, botRail, plasmaCore, coil1, coil2, cell);
      group.userData.magPart = cell;
      group.userData.magHome = cell.position.clone();
      group.userData.muzzle = new THREE.Vector3(0, 0.015, -0.82);
    } else if (weaponId === 'crossbow') {
      const stock = box(0.1, 0.1, 0.58, 0x6b3e26, 'body', 0.2, 0.6);
      const hopper = box(0.085, 0.11, 0.28, 0x472818, 'secondary', 0.25, 0.55);
      hopper.position.set(0, 0.1, -0.02);
      const trim = box(0.095, 0.026, 0.34, 0x10b981, 'accent', 0.3, 0.2, 0x10b981);
      trim.position.set(0, 0.06, -0.1);
      const limbL = box(0.32, 0.032, 0.055, 0xd99b26, 'body', 0.6, 0.3);
      limbL.position.set(-0.18, 0.01, -0.24);
      limbL.rotation.y = 0.24;
      const limbR = box(0.32, 0.032, 0.055, 0xd99b26, 'body', 0.6, 0.3);
      limbR.position.set(0.18, 0.01, -0.24);
      limbR.rotation.y = -0.24;
      const string = box(0.62, 0.01, 0.01, 0xe2e8f0, 'accent', 0.1, 0.3, 0x34d399);
      string.position.set(0, 0.01, -0.16);
      const bolt = box(0.02, 0.02, 0.42, 0x34d399, 'accent', 0.4, 0.2, 0x10b981);
      bolt.position.set(0, 0.06, -0.35);
      group.add(stock, hopper, trim, limbL, limbR, string, bolt);
      group.userData.magPart = hopper;
      group.userData.magHome = hopper.position.clone();
      group.userData.muzzle = new THREE.Vector3(0, 0.05, -0.58);
    } else if (weaponId === 'bow') {
      const riser = box(0.05, 0.24, 0.06, 0x1e3a5f, 'body', 0.5, 0.35);
      const upper = box(0.038, 0.42, 0.04, 0x38bdf8, 'body', 0.4, 0.3);
      upper.position.set(0, 0.29, 0.07);
      upper.rotation.x = 0.35;
      const lower = box(0.038, 0.42, 0.04, 0x38bdf8, 'body', 0.4, 0.3);
      lower.position.set(0, -0.29, 0.07);
      lower.rotation.x = -0.35;
      const string = box(0.01, 0.92, 0.01, 0xe0f2fe, 'accent', 0.1, 0.2, 0x5ceeff);
      string.position.set(0, 0, 0.16);
      const arrow = box(0.02, 0.02, 0.72, 0x5ceeff, 'accent', 0.3, 0.2, 0x2de2ff);
      arrow.position.set(0.03, 0.02, -0.18);
      group.add(riser, upper, lower, string, arrow);
      group.rotation.z = 0.22;
      group.userData.muzzle = new THREE.Vector3(0, 0.02, -0.58);
    } else if (weaponId === 'shotgun') {
      const body = box(0.11, 0.13, 0.48, 0x333c4f, 'body', 0.4, 0.4);
      const barrel = cyl(0.034, 0.034, 0.54, 10, 0x1b202c, 'secondary', 0.7, 0.28);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, -0.44);
      const tube = cyl(0.028, 0.028, 0.46, 10, 0x272f40, 'secondary', 0.5, 0.35);
      tube.rotation.x = Math.PI / 2;
      tube.position.set(0, -0.025, -0.4);
      const pump = box(0.095, 0.075, 0.22, 0xd97736, 'accent', 0.2, 0.6);
      pump.position.set(0, -0.035, -0.36);
      const stock = box(0.085, 0.12, 0.26, 0x7c4a2d, 'secondary', 0.1, 0.75);
      stock.position.set(0, -0.04, 0.32);
      group.add(body, barrel, tube, pump, stock);
      group.userData.muzzle = new THREE.Vector3(0, 0.04, -0.74);
    } else if (weaponId === 'paintball') {
      const body = box(0.11, 0.13, 0.44, 0x2e374d, 'body', 0.3, 0.4);
      const barrel = cyl(0.032, 0.032, 0.38, 10, 0xe879f9, 'accent', 0.2, 0.3, 0xd946ef);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.36);
      const hopper = new THREE.Mesh(
        new THREE.SphereGeometry(0.105, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xff5ef7, roughness: 0.25, metalness: 0.1, emissive: 0xd946ef, emissiveIntensity: 0.45 })
      );
      hopper.userData.partRole = 'accent';
      hopper.scale.set(0.85, 0.9, 1.35);
      hopper.position.set(0, 0.15, -0.04);
      const tank = cyl(0.045, 0.045, 0.26, 10, 0x161b26, 'secondary', 0.6, 0.3);
      tank.rotation.x = Math.PI / 2;
      tank.position.set(0, -0.08, 0.25);
      group.add(body, barrel, hopper, tank);
      group.userData.magPart = hopper;
      group.userData.magHome = hopper.position.clone();
      group.userData.muzzle = new THREE.Vector3(0, 0.02, -0.58);
    } else if (weaponId === 'minigun') {
      const housing = cyl(0.12, 0.12, 0.4, 12, 0x262f42, 'body', 0.55, 0.35);
      housing.rotation.x = Math.PI / 2;
      housing.position.set(0, -0.02, 0.04);
      const drum = cyl(0.11, 0.11, 0.22, 12, 0x19202e, 'secondary', 0.5, 0.4);
      drum.position.set(0.11, -0.14, 0.05);
      const handle = box(0.18, 0.035, 0.04, 0xffc83d, 'accent', 0.4, 0.3, 0xffb703);
      handle.position.set(0, 0.13, 0.04);
      const barrelCluster = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const b = cyl(0.02, 0.02, 0.68, 8, 0x181e2b, 'secondary', 0.8, 0.25);
        b.rotation.x = Math.PI / 2;
        b.position.set(Math.cos(a) * 0.068, Math.sin(a) * 0.068 - 0.02, -0.46);
        barrelCluster.add(b);
      }
      const clamp = cyl(0.1, 0.1, 0.05, 12, 0xffc83d, 'accent', 0.5, 0.3, 0xffb703);
      clamp.rotation.x = Math.PI / 2;
      clamp.position.set(0, -0.02, -0.64);
      barrelCluster.add(clamp);
      group.add(housing, drum, handle, barrelCluster);
      group.userData.magPart = drum;
      group.userData.magHome = drum.position.clone();
      group.userData.spinGroup = barrelCluster;
      group.userData.muzzle = new THREE.Vector3(0, -0.02, -0.82);
    } else if (weaponId === 'revolver') {
      const frame = box(0.075, 0.11, 0.28, 0x3b4458, 'body', 0.6, 0.35);
      const barrel = box(0.055, 0.065, 0.28, 0xc9d4e8, 'accent', 0.8, 0.25);
      barrel.position.set(0, 0.025, -0.22);
      const cylinder = cyl(0.052, 0.052, 0.1, 10, 0x202736, 'secondary', 0.7, 0.3);
      cylinder.rotation.x = Math.PI / 2;
      cylinder.position.set(0, 0.01, -0.03);
      const grip = box(0.065, 0.17, 0.08, 0x6e4429, 'secondary', 0.1, 0.8);
      grip.position.set(0, -0.11, 0.1);
      grip.rotation.x = -0.35;
      group.add(frame, barrel, cylinder, grip);
      group.userData.cylinderPart = cylinder;
      group.userData.muzzle = new THREE.Vector3(0, 0.025, -0.38);
    } else if (weaponId === 'flaregun') {
      const body = box(0.085, 0.1, 0.26, 0xdc2626, 'body', 0.3, 0.45);
      const barrel = cyl(0.044, 0.044, 0.28, 10, 0xf97316, 'accent', 0.4, 0.3, 0xff5a1f);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.03, -0.2);
      const grip = box(0.065, 0.16, 0.08, 0x1e293b, 'secondary');
      grip.position.set(0, -0.1, 0.09);
      grip.rotation.x = -0.3;
      group.add(body, barrel, grip);
      group.userData.muzzle = new THREE.Vector3(0, 0.03, -0.36);
    } else if (weaponId === 'slingshot') {
      const handle = cyl(0.028, 0.03, 0.2, 8, 0x854d0e, 'body', 0.1, 0.75);
      handle.position.set(0, -0.1, -0.05);
      const forkL = box(0.035, 0.22, 0.035, 0xa16207, 'body', 0.1, 0.7);
      forkL.position.set(-0.08, 0.05, -0.06);
      forkL.rotation.z = 0.42;
      const forkR = box(0.035, 0.22, 0.035, 0xa16207, 'body', 0.1, 0.7);
      forkR.position.set(0.08, 0.05, -0.06);
      forkR.rotation.z = -0.42;
      const band = box(0.24, 0.022, 0.022, 0xfacc15, 'accent', 0.2, 0.4, 0xeab308);
      band.position.set(0, 0.13, -0.03);
      group.add(handle, forkL, forkR, band);
      group.userData.muzzle = new THREE.Vector3(0, 0.13, -0.15);
    } else if (weaponId === 'exogun') {
      const hull = box(0.1, 0.12, 0.36, 0x3b0764, 'body', 0.65, 0.25);
      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.065, 1),
        new THREE.MeshStandardMaterial({ color: 0xc084fc, emissive: 0xa855f7, emissiveIntensity: 1.0 })
      );
      orb.userData.partRole = 'accent';
      orb.position.set(0, 0.04, -0.24);
      const grip = box(0.06, 0.15, 0.08, 0x1e1b4b, 'secondary');
      grip.position.set(0, -0.1, 0.08);
      grip.rotation.x = -0.3;
      group.add(hull, orb, grip);
      group.userData.muzzle = new THREE.Vector3(0, 0.04, -0.32);
    } else if (weaponId === 'energypistols') {
      for (const sx of [-0.48, 0.02]) {
        const slide = box(0.068, 0.08, 0.32, 0xe2e8f0, 'body', 0.6, 0.25);
        slide.position.set(sx, 0.02, -0.08);
        const core = box(0.074, 0.024, 0.26, 0x00f5ff, 'accent', 0.2, 0.2, 0x00f5ff);
        core.position.set(sx, 0.03, -0.09);
        const grip = box(0.056, 0.15, 0.07, 0x1e293b, 'secondary');
        grip.position.set(sx, -0.09, 0.04);
        grip.rotation.x = -0.28;
        group.add(slide, core, grip);
      }
      group.userData.muzzle = new THREE.Vector3(0, 0.02, -0.28);
    } else if (weaponId === 'kunai') {
      for (const offset of [-0.08, 0, 0.08]) {
        const blade = new THREE.Mesh(
          new THREE.ConeGeometry(0.035, 0.3, 4),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.18 })
        );
        blade.userData.partRole = 'body';
        blade.rotation.x = -Math.PI / 2;
        blade.position.set(offset, 0, -0.22);
        const grip = cyl(0.015, 0.015, 0.14, 8, 0xb91c1c, 'accent', 0.2, 0.5, 0xf43f5e);
        grip.rotation.x = Math.PI / 2;
        grip.position.set(offset, 0, -0.01);
        group.add(blade, grip);
      }
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.4);
    } else if (weaponId === 'uzi' || weaponId === 'spray') {
      const accentCol = weaponId === 'spray' ? 0x38ef7d : 0xff5ef7;
      const body = box(0.09, 0.12, 0.32, 0x1e2230, 'body', 0.45, 0.4);
      const accent = box(0.096, 0.025, 0.26, accentCol, 'accent', 0.2, 0.3, accentCol);
      accent.position.set(0, 0.03, 0);
      const barrel = box(0.04, 0.04, 0.14, 0x10131c, 'secondary', 0.6, 0.3);
      barrel.position.set(0, 0.015, -0.21);
      const mag = box(0.05, 0.24, 0.065, 0x161a24, 'secondary');
      mag.position.set(0, -0.17, 0.03);
      group.add(body, accent, barrel, mag);
      group.userData.magPart = mag;
      group.userData.magHome = mag.position.clone();
      group.userData.muzzle = new THREE.Vector3(0, 0.015, -0.3);
    } else if (weaponId === 'handgun') {
      const slide = box(0.068, 0.075, 0.34, 0x2a3347, 'body', 0.55, 0.32);
      slide.position.set(0, 0.03, -0.06);
      const stripe = box(0.072, 0.018, 0.24, 0x38bdf8, 'accent', 0.2, 0.3, 0x38bdf8);
      stripe.position.set(0, 0.04, -0.06);
      const frame = box(0.06, 0.05, 0.26, 0x161c29, 'secondary', 0.4, 0.5);
      frame.position.set(0, -0.02, -0.03);
      const grip = box(0.058, 0.16, 0.075, 0x141924, 'secondary', 0.2, 0.7);
      grip.position.set(0, -0.1, 0.07);
      grip.rotation.x = -0.28;
      group.add(slide, stripe, frame, grip);
      group.userData.magPart = grip;
      group.userData.magHome = grip.position.clone();
      group.userData.muzzle = new THREE.Vector3(0, 0.03, -0.26);
    } else if (weaponId === 'shorty') {
      const body = box(0.11, 0.1, 0.24, 0x343d4f, 'body', 0.5, 0.38);
      const b1 = cyl(0.03, 0.03, 0.32, 10, 0x1b212e, 'secondary', 0.75, 0.25);
      b1.rotation.x = Math.PI / 2;
      b1.position.set(-0.032, 0.03, -0.24);
      const b2 = cyl(0.03, 0.03, 0.32, 10, 0x1b212e, 'secondary', 0.75, 0.25);
      b2.rotation.x = Math.PI / 2;
      b2.position.set(0.032, 0.03, -0.24);
      const band = box(0.125, 0.04, 0.05, 0xff7b29, 'accent', 0.3, 0.3, 0xff5a1f);
      band.position.set(0, 0.03, -0.28);
      const grip = box(0.08, 0.15, 0.1, 0x734427, 'secondary', 0.1, 0.8);
      grip.position.set(0, -0.09, 0.12);
      grip.rotation.x = -0.45;
      group.add(body, b1, b2, band, grip);
      group.userData.muzzle = new THREE.Vector3(0, 0.03, -0.42);
    } else if (weaponId === 'fists') {
      // Starter Dual Tactical Boxing Fists!
      for (const sx of [-0.46, 0.02]) {
        const fist = box(0.14, 0.13, 0.16, 0xf7cf86, 'body', 0.1, 0.65);
        fist.position.set(sx, -0.04, -0.14);
        const wrap = box(0.148, 0.06, 0.12, 0x2de2ff, 'accent', 0.2, 0.4, 0x0284c7);
        wrap.position.set(sx, -0.04, -0.15);
        group.add(fist, wrap);
      }
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.35);
    } else if (weaponId === 'chainsaw') {
      const motor = box(0.18, 0.18, 0.34, 0xdc2626, 'body', 0.4, 0.4);
      const bar = box(0.04, 0.11, 0.62, 0x94a3b8, 'secondary', 0.8, 0.25);
      bar.position.set(0, 0, -0.46);
      const teeth = box(0.05, 0.13, 0.58, 0xff9f1c, 'accent', 0.5, 0.3, 0xff6b1a);
      teeth.position.set(0, 0, -0.46);
      const handle = box(0.22, 0.035, 0.04, 0x1e293b, 'secondary');
      handle.position.set(0, 0.12, -0.06);
      group.add(motor, bar, teeth, handle);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.78);
    } else if (weaponId === 'trowel') {
      const handle = cyl(0.026, 0.028, 0.2, 8, 0x7c4a2d, 'secondary', 0.1, 0.75);
      handle.rotation.x = Math.PI / 2;
      handle.position.set(0, -0.04, 0.08);
      const neck = box(0.03, 0.03, 0.14, 0x475569, 'secondary');
      neck.position.set(0, -0.04, -0.08);
      const spade = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.32, 4),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 })
      );
      spade.userData.partRole = 'body';
      spade.scale.set(1.0, 1.0, 0.2);
      spade.rotation.x = -Math.PI / 2;
      spade.position.set(0, -0.04, -0.28);
      const trim = box(0.16, 0.025, 0.05, 0xf97316, 'accent', 0.3, 0.3, 0xf97316);
      trim.position.set(0, -0.04, -0.16);
      group.add(handle, neck, spade, trim);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.45);
    } else if (weaponId === 'katana') {
      const hilt = box(0.045, 0.045, 0.24, 0x1d2333, 'secondary', 0.2, 0.7);
      hilt.position.set(0, -0.05, 0.14);
      const guard = box(0.11, 0.11, 0.025, 0xffd447, 'accent', 0.7, 0.3);
      guard.position.set(0, -0.05, 0.02);
      const blade = box(0.022, 0.052, 0.88, 0xe8f5ff, 'body', 0.85, 0.15);
      blade.position.set(0, -0.04, -0.43);
      const edge = box(0.026, 0.014, 0.86, 0x2de2ff, 'accent', 0.2, 0.2, 0x2de2ff);
      edge.position.set(0, -0.064, -0.43);
      group.add(hilt, guard, blade, edge);
      group.rotation.set(0.28, 0.25, -0.32);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.8);
    } else if (weaponId === 'knife') {
      for (const sx of [-0.46, 0.02]) {
        const hilt = box(0.04, 0.04, 0.18, 0x18181b, 'secondary', 0.3, 0.6);
        hilt.position.set(sx, -0.04, 0.06);
        const blade = box(0.02, 0.055, 0.44, 0x27272a, 'body', 0.85, 0.2);
        blade.position.set(sx, -0.04, -0.25);
        const rune = box(0.024, 0.016, 0.4, 0xf43f5e, 'accent', 0.2, 0.2, 0xf43f5e);
        rune.position.set(sx, -0.04, -0.25);
        group.add(hilt, blade, rune);
      }
      group.rotation.set(0.18, 0.12, 0);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.5);
    } else if (weaponId === 'xiuchun') {
      const hilt = box(0.048, 0.048, 0.26, 0x7f1d1d, 'secondary', 0.2, 0.6);
      hilt.position.set(0, -0.05, 0.14);
      const guard = cyl(0.07, 0.07, 0.026, 8, 0xf59e0b, 'accent', 0.85, 0.2, 0xd97706);
      guard.rotation.x = Math.PI / 2;
      guard.position.set(0, -0.05, 0.01);
      const blade = box(0.024, 0.068, 0.92, 0xe2e8f0, 'body', 0.9, 0.14);
      blade.position.set(0, -0.035, -0.45);
      const goldSpine = box(0.028, 0.018, 0.88, 0xfbbf24, 'accent', 0.6, 0.2, 0xf59e0b);
      goldSpine.position.set(0, -0.002, -0.44);
      group.add(hilt, guard, blade, goldSpine);
      group.rotation.set(0.26, 0.22, -0.26);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.85);
    } else if (weaponId === 'scythe') {
      const shaft = cyl(0.024, 0.026, 1.15, 10, 0x1a1e2e, 'secondary', 0.5, 0.4);
      shaft.rotation.x = Math.PI / 2;
      shaft.position.set(0, -0.05, -0.25);
      const collar = box(0.08, 0.08, 0.1, 0xc084fc, 'accent', 0.4, 0.3, 0xa855f7);
      collar.position.set(0, -0.05, -0.78);
      const blade1 = box(0.42, 0.032, 0.14, 0xd8b4fe, 'body', 0.75, 0.2);
      blade1.position.set(-0.2, -0.05, -0.75);
      blade1.rotation.y = 0.28;
      const blade2 = box(0.32, 0.028, 0.09, 0xc084fc, 'accent', 0.4, 0.2, 0xa855f7);
      blade2.position.set(-0.44, -0.05, -0.6);
      blade2.rotation.y = 0.95;
      group.add(shaft, collar, blade1, blade2);
      group.rotation.set(0.22, 0.22, -0.18);
      group.userData.muzzle = new THREE.Vector3(-0.2, 0, -0.85);
    } else if (weaponId === 'axe') {
      const handle = cyl(0.028, 0.032, 0.95, 10, 0x5c3a21, 'secondary', 0.2, 0.7);
      handle.rotation.x = Math.PI / 2;
      handle.position.set(0, -0.05, -0.2);
      const head = box(0.24, 0.34, 0.16, 0x3b4459, 'body', 0.75, 0.25);
      head.position.set(0, -0.05, -0.62);
      const edgeL = box(0.04, 0.38, 0.18, 0xff5a36, 'accent', 0.3, 0.2, 0xff4500);
      edgeL.position.set(-0.13, -0.05, -0.62);
      const edgeR = box(0.04, 0.38, 0.18, 0xff5a36, 'accent', 0.3, 0.2, 0xff4500);
      edgeR.position.set(0.13, -0.05, -0.62);
      group.add(handle, head, edgeL, edgeR);
      group.rotation.set(0.26, 0.22, -0.25);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.75);
    } else if (weaponId === 'grenade') {
      const body = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.1, 1),
        new THREE.MeshStandardMaterial({ color: 0x3b4d3b, roughness: 0.55, metalness: 0.25 })
      );
      body.userData.partRole = 'body';
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.095, 0.015, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xff5a36, emissive: 0xff5a36, emissiveIntensity: 0.7 })
      );
      band.userData.partRole = 'accent';
      band.rotation.x = Math.PI / 2;
      const cap = box(0.05, 0.06, 0.05, 0x222733, 'secondary', 0.6, 0.3);
      cap.position.set(0, 0.11, 0);
      group.add(body, band, cap);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.2);
    } else if (weaponId === 'satchel') {
      const pack = box(0.22, 0.16, 0.1, 0x4b5563, 'body', 0.3, 0.6);
      const charge = box(0.14, 0.08, 0.12, 0xfacc15, 'accent', 0.3, 0.3, 0xeab308);
      const led = box(0.04, 0.04, 0.13, 0xef4444, 'accent', 0, 0.2, 0xef4444);
      group.add(pack, charge, led);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.2);
    } else if (weaponId === 'freeze') {
      const body = box(0.09, 0.11, 0.38, 0xdbeafe, 'body', 0.45, 0.25);
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.07, 0),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.9 })
      );
      crystal.userData.partRole = 'accent';
      crystal.position.set(0, 0.02, -0.24);
      group.add(body, crystal);
      group.userData.muzzle = new THREE.Vector3(0, 0.02, -0.32);
    } else if (weaponId === 'warhorn') {
      const horn = new THREE.Mesh(
        new THREE.ConeGeometry(0.1, 0.38, 12),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.75, roughness: 0.25 })
      );
      horn.userData.partRole = 'body';
      horn.rotation.x = Math.PI / 2;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.095, 0.018, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 0.6 })
      );
      ring.userData.partRole = 'accent';
      ring.position.set(0, 0, -0.18);
      group.add(horn, ring);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.25);
    } else if (weaponId === 'medkit') {
      const kit = box(0.24, 0.18, 0.12, 0xf8fafc, 'body', 0.2, 0.35);
      const crossH = box(0.12, 0.04, 0.13, 0x22c55e, 'accent', 0.1, 0.3, 0x22c55e);
      const crossV = box(0.04, 0.12, 0.13, 0x22c55e, 'accent', 0.1, 0.3, 0x22c55e);
      group.add(kit, crossH, crossV);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.2);
    } else if (weaponId === 'molotov') {
      const bottle = cyl(0.045, 0.075, 0.24, 10, 0xb45309, 'body', 0.15, 0.22);
      const neck = cyl(0.025, 0.04, 0.1, 10, 0xd97706, 'secondary', 0.15, 0.25);
      neck.position.set(0, 0.16, 0);
      const flame = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.055, 0),
        new THREE.MeshStandardMaterial({ color: 0xff9f1c, emissive: 0xff4500, emissiveIntensity: 1.0 })
      );
      flame.userData.partRole = 'accent';
      flame.position.set(0, 0.24, 0);
      group.add(bottle, neck, flame);
      group.userData.muzzle = new THREE.Vector3(0, 0.2, -0.2);
    } else if (weaponId === 'flashbang') {
      const body = cyl(0.055, 0.055, 0.22, 12, 0xdbeafe, 'body', 0.5, 0.3);
      const ring = cyl(0.06, 0.06, 0.04, 12, 0x38bdf8, 'accent', 0.3, 0.2, 0x38bdf8);
      const cap = box(0.05, 0.05, 0.05, 0x1e293b, 'secondary', 0.6, 0.3);
      cap.position.set(0, 0.13, 0);
      group.add(body, ring, cap);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.2);
    } else if (weaponId === 'smoke') {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.4 })
      );
      orb.userData.partRole = 'body';
      const seal = new THREE.Mesh(
        new THREE.TorusGeometry(0.096, 0.015, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, emissive: 0x38bdf8, emissiveIntensity: 0.6 })
      );
      seal.userData.partRole = 'accent';
      seal.rotation.x = Math.PI / 2;
      group.add(orb, seal);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.2);
    } else if (weaponId === 'grenadelauncher') {
      const frame = box(0.11, 0.12, 0.42, 0x262f40, 'body', 0.5, 0.35);
      const drum = cyl(0.1, 0.1, 0.16, 12, 0x1b2230, 'secondary', 0.65, 0.3);
      drum.rotation.x = Math.PI / 2;
      drum.position.set(0, -0.02, -0.08);
      const barrel = cyl(0.055, 0.055, 0.36, 12, 0x334155, 'secondary', 0.7, 0.25);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.03, -0.34);
      const ring = cyl(0.062, 0.062, 0.04, 12, 0xff7b29, 'accent', 0.3, 0.2, 0xff5a1f);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.03, -0.46);
      group.add(frame, drum, barrel, ring);
      group.userData.cylinderPart = drum;
      group.userData.muzzle = new THREE.Vector3(0, 0.03, -0.54);
    } else if (weaponId === 'wildcat') {
      const body = box(0.1, 0.13, 0.46, 0x1e2433, 'body', 0.5, 0.35);
      const stripe = box(0.106, 0.034, 0.38, 0xf97316, 'accent', 0.2, 0.25, 0xea580c);
      stripe.position.set(0, 0.025, -0.02);
      const barrel = cyl(0.026, 0.026, 0.28, 8, 0x111827, 'secondary', 0.75, 0.25);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.34);
      const mag = box(0.055, 0.19, 0.08, 0x161b26, 'secondary');
      mag.position.set(0, -0.14, 0.14);
      group.add(body, stripe, barrel, mag);
      group.userData.magPart = mag;
      group.userData.magHome = mag.position.clone();
      group.userData.muzzle = new THREE.Vector3(0, 0.02, -0.5);
    } else if (weaponId === 'permafrost') {
      const body = box(0.11, 0.14, 0.54, 0xdbeafe, 'body', 0.45, 0.22);
      const crystal = new THREE.Mesh(
        new THREE.ConeGeometry(0.075, 0.36, 6),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.9, roughness: 0.15 })
      );
      crystal.userData.partRole = 'accent';
      crystal.rotation.x = -Math.PI / 2;
      crystal.position.set(0, 0.02, -0.44);
      const core = box(0.06, 0.16, 0.1, 0x7dd3fc, 'accent', 0.2, 0.2, 0x38bdf8);
      core.position.set(0, -0.13, -0.04);
      group.add(body, crystal, core);
      group.userData.magPart = core;
      group.userData.magHome = core.position.clone();
      group.userData.muzzle = new THREE.Vector3(0, 0.02, -0.64);
    } else if (weaponId === 'distortion') {
      const hull = box(0.12, 0.14, 0.52, 0x1e1b4b, 'body', 0.65, 0.25);
      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.09, 0.018, 8, 18),
        new THREE.MeshStandardMaterial({ color: 0xd946ef, emissive: 0xc026d3, emissiveIntensity: 1.0 })
      );
      ring1.userData.partRole = 'accent';
      ring1.position.set(0, 0.02, -0.34);
      const ring2 = ring1.clone();
      ring2.scale.setScalar(0.72);
      ring2.position.set(0, 0.02, -0.52);
      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.055, 1),
        new THREE.MeshStandardMaterial({ color: 0x2de2ff, emissive: 0x00f5ff, emissiveIntensity: 1.0 })
      );
      orb.userData.partRole = 'accent';
      orb.position.set(0, 0.02, -0.42);
      group.add(hull, ring1, ring2, orb);
      group.userData.spinGroup = ring1;
      group.userData.muzzle = new THREE.Vector3(0, 0.02, -0.62);
    } else if (weaponId === 'warper') {
      const slide = box(0.075, 0.09, 0.34, 0x2e1065, 'body', 0.6, 0.25);
      slide.position.set(0, 0.03, -0.06);
      const glow = box(0.08, 0.024, 0.28, 0xc084fc, 'accent', 0.2, 0.2, 0xa855f7);
      glow.position.set(0, 0.04, -0.08);
      const grip = box(0.058, 0.16, 0.075, 0x1e1b4b, 'secondary');
      grip.position.set(0, -0.1, 0.07);
      grip.rotation.x = -0.3;
      group.add(slide, glow, grip);
      group.userData.muzzle = new THREE.Vector3(0, 0.03, -0.28);
    } else if (weaponId === 'riotshield') {
      const plate = box(0.46, 0.62, 0.045, 0x1e293b, 'body', 0.6, 0.35);
      plate.position.set(-0.08, 0.02, -0.18);
      const glass = box(0.32, 0.16, 0.055, 0x38bdf8, 'accent', 0.1, 0.1, 0x0284c7);
      glass.material.transparent = true;
      glass.material.opacity = 0.55;
      glass.position.set(-0.08, 0.14, -0.18);
      const trim = box(0.48, 0.04, 0.055, 0x2de2ff, 'accent', 0.3, 0.2, 0x2de2ff);
      trim.position.set(-0.08, -0.27, -0.18);
      group.add(plate, glass, trim);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.32);
    } else if (weaponId === 'spear') {
      const shaft = cyl(0.022, 0.024, 1.35, 10, 0x5c3a21, 'secondary', 0.2, 0.65);
      shaft.rotation.x = Math.PI / 2;
      shaft.position.set(0, -0.04, -0.32);
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.34, 4),
        new THREE.MeshStandardMaterial({ color: 0xfde047, metalness: 0.85, roughness: 0.18, emissive: 0xd97706, emissiveIntensity: 0.35 })
      );
      tip.userData.partRole = 'accent';
      tip.rotation.x = -Math.PI / 2;
      tip.position.set(0, -0.04, -1.14);
      group.add(shaft, tip);
      group.rotation.set(0.14, 0.12, -0.1);
      group.userData.muzzle = new THREE.Vector3(0, -0.04, -1.25);
    } else if (weaponId === 'maul') {
      const shaft = cyl(0.03, 0.034, 1.05, 10, 0x334155, 'secondary', 0.55, 0.4);
      shaft.rotation.x = Math.PI / 2;
      shaft.position.set(0, -0.05, -0.22);
      const head = box(0.36, 0.22, 0.22, 0x475569, 'body', 0.78, 0.25);
      head.position.set(0, -0.05, -0.74);
      const capL = box(0.04, 0.24, 0.24, 0xf97316, 'accent', 0.4, 0.25, 0xea580c);
      capL.position.set(-0.19, -0.05, -0.74);
      const capR = capL.clone();
      capR.position.x = 0.19;
      group.add(shaft, head, capL, capR);
      group.rotation.set(0.24, 0.2, -0.22);
      group.userData.muzzle = new THREE.Vector3(0, -0.05, -0.86);
    } else if (weaponId === 'jumppad') {
      const disk = cyl(0.15, 0.17, 0.04, 16, 0x1e293b, 'body', 0.5, 0.35);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.13, 0.02, 8, 18),
        new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xa855f7, emissiveIntensity: 0.9 })
      );
      ring.userData.partRole = 'accent';
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.025;
      group.add(disk, ring);
      group.rotation.x = 0.45;
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.2);
    } else if (weaponId === 'subspace') {
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.095, 0),
        new THREE.MeshStandardMaterial({ color: 0xff2ad4, emissive: 0xd946ef, emissiveIntensity: 1.0 })
      );
      core.userData.partRole = 'accent';
      const cage = box(0.17, 0.17, 0.17, 0x1e293b, 'body', 0.6, 0.35);
      cage.material.wireframe = true;
      group.add(core, cage);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.2);
    } else if (weaponId === 'grappler') {
      const body = box(0.085, 0.11, 0.32, 0x1e293b, 'body', 0.55, 0.35);
      const spool = cyl(0.045, 0.045, 0.1, 10, 0x2de2ff, 'accent', 0.3, 0.25, 0x0ea5e9);
      spool.rotation.z = Math.PI / 2;
      spool.position.set(0, 0.04, -0.06);
      const hook = new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.18, 4),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
      );
      hook.userData.partRole = 'accent';
      hook.rotation.x = -Math.PI / 2;
      hook.position.set(0, 0.02, -0.26);
      group.add(body, spool, hook);
      group.userData.muzzle = new THREE.Vector3(0, 0.02, -0.35);
    } else if (weaponId === 'warpstone') {
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.11, 0),
        new THREE.MeshStandardMaterial({ color: 0xc084fc, emissive: 0x9333ea, emissiveIntensity: 1.0, roughness: 0.15 })
      );
      gem.userData.partRole = 'accent';
      gem.scale.set(0.8, 1.35, 0.8);
      group.add(gem);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.2);
    } else if (weaponId === 'holodome') {
      const base = cyl(0.09, 0.11, 0.08, 12, 0x1e293b, 'body', 0.6, 0.3);
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0x00f5ff, emissive: 0x00f5ff, emissiveIntensity: 0.8, transparent: true, opacity: 0.5 })
      );
      dome.userData.partRole = 'accent';
      dome.position.y = 0.05;
      group.add(base, dome);
      group.userData.muzzle = new THREE.Vector3(0, 0, -0.2);
    }

    applyWeaponSkin(group, skinId);
    return group;
  }

  function createFirstPersonArms() {
    const arms = new THREE.Group();
    const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x182234, roughness: 0.55, metalness: 0.25 });
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65, metalness: 0.15 });
    const cuffMat = new THREE.MeshStandardMaterial({
      color: 0x2de2ff,
      emissive: 0x2de2ff,
      emissiveIntensity: 0.8,
      roughness: 0.3,
    });

    const rForearm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.38), sleeveMat);
    rForearm.position.set(0.05, -0.14, 0.28);
    rForearm.rotation.set(0.18, -0.1, 0);

    const rCuff = new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.118, 0.04), cuffMat);
    rCuff.position.set(0.04, -0.11, 0.12);

    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.095, 0.12), gloveMat);
    rHand.position.set(0.02, -0.09, 0.06);

    const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.085, 0.14), gloveMat);
    lHand.position.set(-0.08, -0.09, -0.15);
    lHand.rotation.y = 0.25;

    const lCuff = new THREE.Mesh(new THREE.BoxGeometry(0.098, 0.092, 0.035), cuffMat);
    lCuff.position.set(-0.11, -0.1, -0.07);
    lCuff.rotation.y = 0.25;

    arms.add(rForearm, rCuff, rHand, lHand, lCuff);
    arms.userData.leftGroup = [lHand, lCuff];
    arms.userData.leftHomes = [lHand.position.clone(), lCuff.position.clone()];
    return arms;
  }

  function createPlayerAvatar() {
    const root = new THREE.Group();
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    const matSkin = new THREE.MeshStandardMaterial({ color: 0xf7cf86, roughness: 0.55 });
    const matTorso = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.42, metalness: 0.25 });
    const matLegs = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65 });
    const matAccent = new THREE.MeshStandardMaterial({
      color: 0x2de2ff,
      emissive: 0x2de2ff,
      emissiveIntensity: 0.9,
    });

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 0.34), matLegs);
    leftLeg.position.set(-0.19, 0.36, 0);
    leftLeg.castShadow = true;

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 0.34), matLegs);
    rightLeg.position.set(0.19, 0.36, 0);
    rightLeg.castShadow = true;

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.76, 0.4), matTorso);
    torso.position.set(0, 1.1, 0);
    torso.castShadow = true;

    const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.14, 0.42), matAccent);
    chestStripe.position.set(0, 1.18, 0);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.72, 0.3), matSkin);
    leftArm.position.set(-0.54, 1.12, 0);
    leftArm.castShadow = true;

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.72, 0.3), matSkin);
    rightArm.position.set(0.54, 1.12, 0);
    rightArm.castShadow = true;

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.52, 0.54), matSkin);
    head.position.set(0, 1.76, 0);
    head.castShadow = true;

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.08), matAccent);
    visor.position.set(0, 1.8, 0.27);

    const flexBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 1.1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x2de2ff, emissive: 0x2de2ff, emissiveIntensity: 1.0 })
    );
    flexBlade.position.set(0.54, 1.85, 0.18);
    flexBlade.visible = false;

    bodyGroup.add(leftLeg, rightLeg, torso, chestStripe, leftArm, rightArm, head, visor, flexBlade);
    root.userData = { bodyGroup, leftLeg, rightLeg, torso, leftArm, rightArm, head, visor, flexBlade };
    root.visible = false;
    return root;
  }

  Rivals.STARTER_WEAPONS = STARTER_WEAPONS;
  Rivals.WEAPONS = WEAPONS;
  Rivals.createWeaponMesh = createWeaponMesh;
  Rivals.createFirstPersonArms = createFirstPersonArms;
  Rivals.createPlayerAvatar = createPlayerAvatar;
})(window);
