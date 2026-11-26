import * as THREE from 'three';

export const WEAPONS = {
  ar: {
    id: 'ar',
    name: 'ASSAULT RIFLE',
    slotType: 'primary',
    damage: 18,
    headDamage: 32,
    fireRate: 9.2,
    auto: true,
    burstCount: 1,
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
  revolver: {
    id: 'revolver',
    name: 'REVOLVER',
    slotType: 'secondary',
    damage: 36,
    headDamage: 72,
    fireRate: 2.4,
    auto: false,
    burstCount: 1,
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
  katana: {
    id: 'katana',
    name: 'KATANA',
    slotType: 'melee',
    damage: 45,
    headDamage: 65,
    fireRate: 2.3,
    auto: false,
    burstCount: 1,
    magSize: Infinity,
    reserveMax: Infinity,
    reloadTime: 0,
    spread: 0,
    adsSpread: 0,
    adsFov: 82,
    scoped: false,
    recoil: 0,
    range: 4.1,
    moveMult: 1.18,
    tracerColor: 0x2de2ff,
  },
  grenade: {
    id: 'grenade',
    name: 'FRAG GRENADE',
    slotType: 'utility',
    damage: 85,
    headDamage: 85,
    fireRate: 1.0,
    auto: false,
    burstCount: 1,
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
};

function box(w, h, d, color, metalness = 0.25, roughness = 0.45, emissive = 0x000000) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
    emissive,
    emissiveIntensity: emissive ? 0.65 : 0,
  });
  return new THREE.Mesh(geo, mat);
}

export function createWeaponMesh(weaponId) {
  const group = new THREE.Group();

  if (weaponId === 'ar' || weaponId === 'burst') {
    const accent = weaponId === 'ar' ? 0x2de2ff : 0x38ef7d;
    const body = box(0.11, 0.14, 0.56, 0x242c3c, 0.4, 0.4);
    const barrel = box(0.05, 0.05, 0.34, 0x161b26, 0.6, 0.3);
    barrel.position.set(0, 0.02, -0.38);
    const stripe = box(0.116, 0.032, 0.42, accent, 0.2, 0.3, accent);
    stripe.position.set(0, 0.03, -0.04);
    const mag = box(0.06, 0.2, 0.09, 0x191f2c);
    mag.position.set(0, -0.15, -0.05);
    mag.rotation.x = 0.22;
    const sight = box(0.05, 0.055, 0.1, 0x181f2c);
    sight.position.set(0, 0.095, 0.05);
    const reticle = box(0.02, 0.02, 0.02, accent, 0, 0.2, accent);
    reticle.position.set(0, 0.1, 0.05);
    group.add(body, barrel, stripe, mag, sight, reticle);
    group.userData.muzzle = new THREE.Vector3(0, 0.02, -0.58);
  } else if (weaponId === 'sniper') {
    const body = box(0.1, 0.13, 0.66, 0x2a3140, 0.35, 0.45);
    const barrel = box(0.045, 0.045, 0.62, 0x141923, 0.7, 0.25);
    barrel.position.set(0, 0.025, -0.55);
    const accent = box(0.106, 0.03, 0.5, 0xffd447, 0.2, 0.3, 0xffd447);
    accent.position.set(0, 0.02, -0.05);
    const scope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.045, 0.34, 12),
      new THREE.MeshStandardMaterial({ color: 0x111622, metalness: 0.6, roughness: 0.3 })
    );
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.125, -0.04);
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.02, 12),
      new THREE.MeshStandardMaterial({ color: 0x2de2ff, emissive: 0x2de2ff, emissiveIntensity: 0.8 })
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 0.125, -0.21);
    group.add(body, barrel, accent, scope, lens);
    group.userData.muzzle = new THREE.Vector3(0, 0.025, -0.88);
  } else if (weaponId === 'revolver') {
    const frame = box(0.075, 0.11, 0.28, 0x3b4458, 0.6, 0.35);
    const barrel = box(0.055, 0.065, 0.28, 0xc9d4e8, 0.8, 0.25);
    barrel.position.set(0, 0.025, -0.22);
    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.1, 10),
      new THREE.MeshStandardMaterial({ color: 0x202736, metalness: 0.7, roughness: 0.3 })
    );
    cylinder.rotation.x = Math.PI / 2;
    cylinder.position.set(0, 0.01, -0.03);
    const grip = box(0.065, 0.17, 0.08, 0x6e4429, 0.1, 0.8);
    grip.position.set(0, -0.11, 0.1);
    grip.rotation.x = -0.35;
    group.add(frame, barrel, cylinder, grip);
    group.userData.muzzle = new THREE.Vector3(0, 0.025, -0.38);
  } else if (weaponId === 'uzi') {
    const body = box(0.09, 0.12, 0.32, 0x1e2230, 0.45, 0.4);
    const accent = box(0.096, 0.025, 0.26, 0xff5ef7, 0.2, 0.3, 0xff5ef7);
    accent.position.set(0, 0.03, 0);
    const barrel = box(0.04, 0.04, 0.14, 0x10131c, 0.6, 0.3);
    barrel.position.set(0, 0.015, -0.21);
    const mag = box(0.05, 0.24, 0.065, 0x161a24);
    mag.position.set(0, -0.17, 0.03);
    group.add(body, accent, barrel, mag);
    group.userData.muzzle = new THREE.Vector3(0, 0.015, -0.3);
  } else if (weaponId === 'katana') {
    const hilt = box(0.045, 0.045, 0.24, 0x1d2333, 0.2, 0.7);
    hilt.position.set(0, -0.05, 0.14);
    const guard = box(0.11, 0.11, 0.025, 0xffd447, 0.7, 0.3);
    guard.position.set(0, -0.05, 0.02);
    const blade = box(0.022, 0.052, 0.88, 0xe8f5ff, 0.85, 0.15);
    blade.position.set(0, -0.04, -0.43);
    const edge = box(0.026, 0.014, 0.86, 0x2de2ff, 0.2, 0.2, 0x2de2ff);
    edge.position.set(0, -0.064, -0.43);
    group.add(hilt, guard, blade, edge);
    group.rotation.set(0.28, 0.25, -0.32);
    group.userData.muzzle = new THREE.Vector3(0, 0, -0.8);
  } else if (weaponId === 'grenade') {
    const body = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.1, 1),
      new THREE.MeshStandardMaterial({ color: 0x3b4d3b, roughness: 0.55, metalness: 0.25 })
    );
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.095, 0.015, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xff5a36, emissive: 0xff5a36, emissiveIntensity: 0.7 })
    );
    band.rotation.x = Math.PI / 2;
    const cap = box(0.05, 0.06, 0.05, 0x222733, 0.6, 0.3);
    cap.position.set(0, 0.11, 0);
    group.add(body, band, cap);
    group.userData.muzzle = new THREE.Vector3(0, 0, -0.2);
  }

  return group;
}
