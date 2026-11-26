(function (global) {
  const Rivals = (global.Rivals = global.Rivals || {});
  const THREE = global.THREE;
  const { applyWeaponSkin } = Rivals;

  const WEAPONS = {
  // === PRIMARIES ===
  ar: {
    id: 'ar',
    name: 'ASSAULT RIFLE',
    slotType: 'primary',
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
  sniper: {
    id: 'sniper',
    name: 'SNIPER',
    slotType: 'primary',
    damage: 75,
    headDamage: 150,
    fireRate: 0.85,
    auto: false,
    burstCount: 1,
    pellets: 1,
    magSize: 5,
    reserveMax: 25,
    reloadTime: 2.0,
    spread: 0.045,
    adsSpread: 0.0005,
    adsFov: 26,
    scoped: true,
    recoil: 0.08,
    range: 220,
    moveMult: 0.92,
    tracerColor: 0xffd447,
  },
  burst: {
    id: 'burst',
    name: 'BURST RIFLE',
    slotType: 'primary',
    damage: 16,
    headDamage: 28,
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
  paintball: {
    id: 'paintball',
    name: 'PAINTBALL GUN',
    slotType: 'primary',
    damage: 24,
    headDamage: 40,
    fireRate: 5.5,
    auto: true,
    burstCount: 1,
    pellets: 1,
    magSize: 18,
    reserveMax: 90,
    reloadTime: 1.4,
    spread: 0.018,
    adsSpread: 0.007,
    adsFov: 64,
    scoped: false,
    recoil: 0.024,
    range: 130,
    moveMult: 1.04,
    tracerColor: 0xff5ef7,
    paintSplat: true,
  },
  minigun: {
    id: 'minigun',
    name: 'MINIGUN',
    slotType: 'primary',
    damage: 12,
    headDamage: 20,
    fireRate: 16.5,
    auto: true,
    burstCount: 1,
    pellets: 1,
    magSize: 60,
    reserveMax: 240,
    reloadTime: 2.35,
    spread: 0.036,
    adsSpread: 0.022,
    adsFov: 66,
    scoped: false,
    recoil: 0.013,
    range: 115,
    moveMult: 0.84,
    tracerColor: 0xffc83d,
  },

  // === SECONDARIES ===
  revolver: {
    id: 'revolver',
    name: 'REVOLVER',
    slotType: 'secondary',
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
  uzi: {
    id: 'uzi',
    name: 'UZI',
    slotType: 'secondary',
    damage: 11,
    headDamage: 18,
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
  handgun: {
    id: 'handgun',
    name: 'HANDGUN',
    slotType: 'secondary',
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
  shorty: {
    id: 'shorty',
    name: 'SHORTY',
    slotType: 'secondary',
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

  // === MELEE ===
  katana: {
    id: 'katana',
    name: 'KATANA',
    slotType: 'melee',
    damage: 45,
    lungeDamage: 60,
    fireRate: 2.3,
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
    range: 4.1,
    lungePower: 18.5,
    lungeLift: 4.5,
    moveMult: 1.18,
    tracerColor: 0x2de2ff,
  },
  scythe: {
    id: 'scythe',
    name: 'SCYTHE',
    slotType: 'melee',
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
    lungePower: 20.5,
    lungeLift: 7.2,
    moveMult: 1.16,
    tracerColor: 0xc084fc,
  },
  axe: {
    id: 'axe',
    name: 'BATTLE AXE',
    slotType: 'melee',
    damage: 72,
    lungeDamage: 95,
    fireRate: 1.25,
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
    range: 4.4,
    lungePower: 15.5,
    lungeLift: 5.2,
    moveMult: 1.1,
    tracerColor: 0xff5a36,
  },

  // === UTILITIES ===
  grenade: {
    id: 'grenade',
    name: 'FRAG GRENADE',
    slotType: 'utility',
    utilityType: 'frag',
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
  molotov: {
    id: 'molotov',
    name: 'MOLOTOV',
    slotType: 'utility',
    utilityType: 'molotov',
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
  flashbang: {
    id: 'flashbang',
    name: 'FLASHBANG',
    slotType: 'utility',
    utilityType: 'flash',
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

  if (weaponId === 'ar' || weaponId === 'burst') {
    const accent = weaponId === 'ar' ? 0x2de2ff : 0x38ef7d;
    const body = box(0.11, 0.14, 0.56, 0x242c3c, 'body', 0.4, 0.4);
    const barrel = box(0.05, 0.05, 0.34, 0x161b26, 'secondary', 0.6, 0.3);
    barrel.position.set(0, 0.02, -0.38);
    const stripe = box(0.116, 0.032, 0.42, accent, 'accent', 0.2, 0.3, accent);
    stripe.position.set(0, 0.03, -0.04);
    const mag = box(0.06, 0.2, 0.09, 0x191f2c, 'secondary');
    mag.position.set(0, -0.15, -0.05);
    mag.rotation.x = 0.22;
    const sight = box(0.05, 0.055, 0.1, 0x181f2c, 'secondary');
    sight.position.set(0, 0.095, 0.05);
    const reticle = box(0.02, 0.02, 0.02, accent, 'accent', 0, 0.2, accent);
    reticle.position.set(0, 0.1, 0.05);
    group.add(body, barrel, stripe, mag, sight, reticle);
    group.userData.muzzle = new THREE.Vector3(0, 0.02, -0.58);
  } else if (weaponId === 'sniper') {
    const body = box(0.1, 0.13, 0.66, 0x2a3140, 'body', 0.35, 0.45);
    const barrel = box(0.045, 0.045, 0.62, 0x141923, 'secondary', 0.7, 0.25);
    barrel.position.set(0, 0.025, -0.55);
    const accent = box(0.106, 0.03, 0.5, 0xffd447, 'accent', 0.2, 0.3, 0xffd447);
    accent.position.set(0, 0.02, -0.05);
    const scope = cyl(0.04, 0.045, 0.34, 12, 0x111622, 'secondary', 0.6, 0.3);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.125, -0.04);
    const lens = cyl(0.032, 0.032, 0.02, 12, 0x2de2ff, 'accent', 0.2, 0.2, 0x2de2ff);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 0.125, -0.21);
    group.add(body, barrel, accent, scope, lens);
    group.userData.muzzle = new THREE.Vector3(0, 0.025, -0.88);
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
    // Iconic top paintball hopper
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
    group.userData.muzzle = new THREE.Vector3(0, 0.02, -0.58);
  } else if (weaponId === 'minigun') {
    const housing = cyl(0.12, 0.12, 0.4, 12, 0x262f42, 'body', 0.55, 0.35);
    housing.rotation.x = Math.PI / 2;
    housing.position.set(0, -0.02, 0.04);
    const drum = cyl(0.11, 0.11, 0.22, 12, 0x19202e, 'secondary', 0.5, 0.4);
    drum.position.set(0.11, -0.14, 0.05);
    const handle = box(0.18, 0.035, 0.04, 0xffc83d, 'accent', 0.4, 0.3, 0xffb703);
    handle.position.set(0, 0.13, 0.04);
    // 6 rotary barrels
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
    group.userData.muzzle = new THREE.Vector3(0, 0.025, -0.38);
  } else if (weaponId === 'uzi') {
    const body = box(0.09, 0.12, 0.32, 0x1e2230, 'body', 0.45, 0.4);
    const accent = box(0.096, 0.025, 0.26, 0xff5ef7, 'accent', 0.2, 0.3, 0xff5ef7);
    accent.position.set(0, 0.03, 0);
    const barrel = box(0.04, 0.04, 0.14, 0x10131c, 'secondary', 0.6, 0.3);
    barrel.position.set(0, 0.015, -0.21);
    const mag = box(0.05, 0.24, 0.065, 0x161a24, 'secondary');
    mag.position.set(0, -0.17, 0.03);
    group.add(body, accent, barrel, mag);
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
  }

  applyWeaponSkin(group, skinId);
  return group;
}

  Rivals.WEAPONS = WEAPONS;
  Rivals.createWeaponMesh = createWeaponMesh;
})(window);
