(function (global) {
  const Rivals = (global.Rivals = global.Rivals || {});
  const THREE = global.THREE;

  function setTextureSRGB(tex) {
    if ('SRGBColorSpace' in THREE) tex.colorSpace = THREE.SRGBColorSpace;
    else if ('sRGBEncoding' in THREE) tex.encoding = THREE.sRGBEncoding;
  }

  function createGalaxyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 128, 128);
    grad.addColorStop(0, '#140b2e');
    grad.addColorStop(0.5, '#3b1578');
    grad.addColorStop(1, '#0e1d4a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    for (let i = 0; i < 6; i++) {
      const x = (i * 37) % 128;
      const y = (i * 53) % 128;
      const rg = ctx.createRadialGradient(x, y, 2, x, y, 36);
      rg.addColorStop(0, i % 2 === 0 ? 'rgba(217,70,239,0.55)' : 'rgba(56,189,248,0.45)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, 128, 128);
    }

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 48; i++) {
      const x = (i * 29 + 11) % 126;
      const y = (i * 47 + 7) % 126;
      const r = i % 5 === 0 ? 1.8 : 0.9;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    setTextureSRGB(tex);
    return tex;
  }

  function createSakuraTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 128, 128);
    grad.addColorStop(0, '#fff1f5');
    grad.addColorStop(1, '#fbcfe8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = '#f43f8e';
    for (let i = 0; i < 18; i++) {
      const x = (i * 31 + 9) % 120;
      const y = (i * 43 + 15) % 120;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((i * 0.7) % Math.PI);
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    setTextureSRGB(tex);
    return tex;
  }

  function createPorcelainTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 128, 128);

    // Classic blue-and-white porcelain cloud & floral waves
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 3;
    for (let y = 16; y < 128; y += 32) {
      ctx.beginPath();
      for (let x = 0; x <= 128; x += 16) {
        ctx.arc(x, y, 8, Math.PI, 0, x % 32 === 0);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#2563eb';
    for (let i = 0; i < 10; i++) {
      const x = (i * 39 + 14) % 116;
      const y = (i * 27 + 12) % 116;
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    setTextureSRGB(tex);
    return tex;
  }

  let cachedGalaxyTex = null;
  let cachedSakuraTex = null;
  let cachedPorcelainTex = null;

  const WEAPON_SKINS = {
    default: {
      id: 'default',
      name: 'Standard',
      useDefault: true,
      tracerColor: null,
    },
    cyber: {
      id: 'cyber',
      name: 'Cyber Neon',
      bodyColor: 0x10172a,
      secondaryColor: 0x090d18,
      accentColor: 0x00f5ff,
      metalness: 0.65,
      roughness: 0.28,
      tracerColor: 0x00f5ff,
    },
    gold: {
      id: 'gold',
      name: '24K Gold',
      bodyColor: 0xf5b922,
      secondaryColor: 0x1f2430,
      accentColor: 0xffe875,
      metalness: 0.9,
      roughness: 0.18,
      tracerColor: 0xffd447,
    },
    sakura: {
      id: 'sakura',
      name: 'Sakura',
      bodyColor: 0xffffff,
      secondaryColor: 0x3b1d2e,
      accentColor: 0xff5da2,
      metalness: 0.25,
      roughness: 0.35,
      pattern: 'sakura',
      tracerColor: 0xff6bb5,
    },
    porcelain: {
      id: 'porcelain',
      name: 'Blue Porcelain',
      bodyColor: 0xffffff,
      secondaryColor: 0x1e3a8a,
      accentColor: 0x38bdf8,
      metalness: 0.3,
      roughness: 0.2,
      pattern: 'porcelain',
      tracerColor: 0x60a5fa,
    },
    jadedragon: {
      id: 'jadedragon',
      name: 'Jade Dragon',
      bodyColor: 0x14241e,
      secondaryColor: 0x0a0f0d,
      accentColor: 0x10b981,
      metalness: 0.72,
      roughness: 0.24,
      tracerColor: 0x34d399,
    },
    starlight: {
      id: 'starlight',
      name: 'Starlight Orbital',
      bodyColor: 0xe2e8f0,
      secondaryColor: 0x1e293b,
      accentColor: 0xf59e0b,
      metalness: 0.55,
      roughness: 0.22,
      tracerColor: 0x38bdf8,
    },
    crimson: {
      id: 'crimson',
      name: 'Crimson Dragon',
      bodyColor: 0x991b1b,
      secondaryColor: 0x1c1215,
      accentColor: 0xff5a1f,
      metalness: 0.6,
      roughness: 0.3,
      tracerColor: 0xff4d29,
    },
    galaxy: {
      id: 'galaxy',
      name: 'Cosmic Galaxy',
      bodyColor: 0xffffff,
      secondaryColor: 0x140b2e,
      accentColor: 0xc084fc,
      metalness: 0.45,
      roughness: 0.32,
      pattern: 'galaxy',
      tracerColor: 0xc084fc,
    },
    emerald: {
      id: 'emerald',
      name: 'Toxic Emerald',
      bodyColor: 0x0f3b2e,
      secondaryColor: 0x12181f,
      accentColor: 0x38ef7d,
      metalness: 0.55,
      roughness: 0.3,
      tracerColor: 0x38ef7d,
    },
    prism: {
      id: 'prism',
      name: 'Rainbow Prism',
      bodyColor: 0x2de2ff,
      secondaryColor: 0x1b2234,
      accentColor: 0xff5ef7,
      metalness: 0.8,
      roughness: 0.16,
      animated: true,
      tracerColor: 0x2de2ff,
    },
  };

  const RIVAL_SKINS = {
    classic: {
      id: 'classic',
      name: 'Red Rival',
      skinColor: 0xf7cf86,
      torsoColor: 0xe63956,
      legsColor: 0x1e2638,
      accentColor: 0xff3e5e,
      metalness: 0.15,
      accessory: 'none',
    },
    assassin: {
      id: 'assassin',
      name: 'Imperial Assassin',
      skinColor: 0x27232c,
      torsoColor: 0x7f1d1d,
      legsColor: 0x11131a,
      accentColor: 0xfbbf24,
      metalness: 0.4,
      accessory: 'bambooHat',
    },
    astronaut: {
      id: 'astronaut',
      name: 'Space Astronaut',
      skinColor: 0xf1f5f9,
      torsoColor: 0xe2e8f0,
      legsColor: 0xcbd5e1,
      accentColor: 0xf59e0b,
      metalness: 0.55,
      accessory: 'jetpack',
    },
    shadow: {
      id: 'shadow',
      name: 'Shadow Ninja',
      skinColor: 0x242838,
      torsoColor: 0x131622,
      legsColor: 0x0b0e17,
      accentColor: 0xc084fc,
      metalness: 0.35,
      accessory: 'none',
    },
    golden: {
      id: 'golden',
      name: 'Golden Champ',
      skinColor: 0xfde047,
      torsoColor: 0xd99b0e,
      legsColor: 0x1f2533,
      accentColor: 0xfff08a,
      metalness: 0.85,
      accessory: 'none',
    },
    frost: {
      id: 'frost',
      name: 'Frost Knight',
      skinColor: 0xdbf4ff,
      torsoColor: 0x228be6,
      legsColor: 0x1b3a5c,
      accentColor: 0x5ceeff,
      metalness: 0.45,
      accessory: 'none',
    },
  };

  const KILL_EFFECTS = {
    classic: { id: 'classic', name: 'Classic' },
    lightning: { id: 'lightning', name: 'Golden Thunder' },
    sakura: { id: 'sakura', name: 'Sakura Burst' },
    blackhole: { id: 'blackhole', name: 'Void Black Hole' },
    pixel: { id: 'pixel', name: 'Voxel Shatter' },
  };

  function getSkinTexture(pattern) {
    if (pattern === 'galaxy') {
      if (!cachedGalaxyTex) cachedGalaxyTex = createGalaxyTexture();
      return cachedGalaxyTex;
    }
    if (pattern === 'sakura') {
      if (!cachedSakuraTex) cachedSakuraTex = createSakuraTexture();
      return cachedSakuraTex;
    }
    if (pattern === 'porcelain') {
      if (!cachedPorcelainTex) cachedPorcelainTex = createPorcelainTexture();
      return cachedPorcelainTex;
    }
    return null;
  }

  function applyWeaponSkin(group, skinId) {
    const skin = WEAPON_SKINS[skinId] || WEAPON_SKINS.default;
    group.userData.skinId = skin.id;
    group.userData.animatedMaterials = [];

    if (skin.useDefault) return;

    const patternTex = skin.pattern ? getSkinTexture(skin.pattern) : null;

    group.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const role = child.userData.partRole || 'body';

      const mat = child.material.clone();
      if (role === 'body') {
        mat.color.setHex(skin.bodyColor);
        mat.metalness = skin.metalness;
        mat.roughness = skin.roughness;
        if (patternTex) mat.map = patternTex;
        if (skin.animated) group.userData.animatedMaterials.push({ mat, role: 'body' });
      } else if (role === 'secondary') {
        mat.color.setHex(skin.secondaryColor);
        mat.metalness = Math.min(0.85, skin.metalness + 0.1);
        mat.roughness = Math.max(0.2, skin.roughness);
      } else if (role === 'accent') {
        mat.color.setHex(skin.accentColor);
        mat.emissive.setHex(skin.accentColor);
        mat.emissiveIntensity = 0.85;
        if (skin.animated) group.userData.animatedMaterials.push({ mat, role: 'accent' });
      }
      mat.needsUpdate = true;
      child.material = mat;
    });
  }

  function updateAnimatedWeaponSkin(group, timeSec) {
    const anims = group?.userData?.animatedMaterials;
    if (!anims || anims.length === 0) return;
    const hue = (timeSec * 0.25) % 1;
    const accentHue = (hue + 0.35) % 1;
    for (const item of anims) {
      if (item.role === 'body') {
        item.mat.color.setHSL(hue, 0.85, 0.55);
      } else if (item.role === 'accent') {
        item.mat.color.setHSL(accentHue, 1.0, 0.6);
        item.mat.emissive.setHSL(accentHue, 1.0, 0.55);
      }
    }
  }

  Rivals.WEAPON_SKINS = WEAPON_SKINS;
  Rivals.RIVAL_SKINS = RIVAL_SKINS;
  Rivals.KILL_EFFECTS = KILL_EFFECTS;
  Rivals.applyWeaponSkin = applyWeaponSkin;
  Rivals.updateAnimatedWeaponSkin = updateAnimatedWeaponSkin;
})(window);
