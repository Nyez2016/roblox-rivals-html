import * as THREE from 'three';

export const DIFFICULTIES = {
  rookie: {
    name: 'RIVAL (ROOKIE)',
    speed: 6.4,
    reaction: 0.42,
    fireInterval: 0.34,
    spread: 0.11,
    damage: 10,
    strafeFreq: 1.5,
  },
  pro: {
    name: 'RIVAL (PRO)',
    speed: 8.1,
    reaction: 0.24,
    fireInterval: 0.21,
    spread: 0.058,
    damage: 14,
    strafeFreq: 0.95,
  },
  nemesis: {
    name: 'RIVAL (NEMESIS)',
    speed: 9.4,
    reaction: 0.13,
    fireInterval: 0.15,
    spread: 0.032,
    damage: 18,
    strafeFreq: 0.65,
  },
};

export class RivalBot {
  constructor(scene, arena) {
    this.scene = scene;
    this.arena = arena;
    this.raycaster = new THREE.Raycaster();

    this.maxHp = 100;
    this.hp = 100;
    this.alive = true;

    this.pos = new THREE.Vector3(0, 0, -28);
    this.vel = new THREE.Vector3();
    this.yaw = 0;

    this.difficulty = DIFFICULTIES.pro;
    this.waypoints = arena.getWaypoints();
    this.currentTarget = this.waypoints[0].clone();

    this.strafeDir = 1;
    this.strafeTimer = 1.0;
    this.fireTimer = 0.5;
    this.sightTimer = 0;
    this.jumpCooldown = 0;
    this.hurtFlash = 0;
    this.walkPhase = 0;
    this.deathFall = 0;

    this.hitMeshes = [];
    this._buildAvatar();
  }

  _buildAvatar() {
    this.group = new THREE.Group();

    const matSkin = new THREE.MeshStandardMaterial({ color: 0xf7cf86, roughness: 0.6 });
    const matTorso = new THREE.MeshStandardMaterial({ color: 0xe63956, roughness: 0.5, metalness: 0.1 });
    const matLegs = new THREE.MeshStandardMaterial({ color: 0x1e2638, roughness: 0.7 });
    const matAccent = new THREE.MeshStandardMaterial({
      color: 0xff3e5e,
      emissive: 0xff3e5e,
      emissiveIntensity: 0.7,
    });
    this.bodyMaterials = [matSkin, matTorso, matLegs];

    // Classic blocky Roblox character proportions (~1.9m tall)
    // Legs
    this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 0.34), matLegs);
    this.leftLeg.position.set(-0.19, 0.36, 0);
    this.leftLeg.castShadow = true;
    this.leftLeg.userData.hitbox = 'body';

    this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 0.34), matLegs);
    this.rightLeg.position.set(0.19, 0.36, 0);
    this.rightLeg.castShadow = true;
    this.rightLeg.userData.hitbox = 'body';

    // Torso
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.76, 0.4), matTorso);
    this.torso.position.set(0, 1.1, 0);
    this.torso.castShadow = true;
    this.torso.userData.hitbox = 'body';

    // Glowing Rival chest visor stripe
    const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.14, 0.42), matAccent);
    chestStripe.position.set(0, 1.18, 0);
    chestStripe.userData.hitbox = 'body';

    // Arms
    this.leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.72, 0.3), matSkin);
    this.leftArm.position.set(-0.54, 1.08, 0);
    this.leftArm.castShadow = true;
    this.leftArm.userData.hitbox = 'body';

    this.rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.72, 0.3), matSkin);
    this.rightArm.position.set(0.54, 1.16, 0.2);
    this.rightArm.rotation.x = -Math.PI * 0.45;
    this.rightArm.castShadow = true;
    this.rightArm.userData.hitbox = 'body';

    // Bot Rifle attached to right arm
    this.gunMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.14, 0.72),
      new THREE.MeshStandardMaterial({ color: 0x1a2030, metalness: 0.5, roughness: 0.35 })
    );
    this.gunMesh.position.set(0.54, 1.18, 0.55);
    this.gunMesh.castShadow = true;

    const gunGlow = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.5), matAccent);
    gunGlow.position.set(0.54, 1.22, 0.58);

    // Blocky Roblox Head (Headshot Hitbox!)
    this.headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.52, 0.54), matSkin);
    this.headMesh.position.set(0, 1.76, 0);
    this.headMesh.castShadow = true;
    this.headMesh.userData.hitbox = 'head';

    // Cool red cyber-visor on face (+Z is forward)
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.08), matAccent);
    visor.position.set(0, 1.8, 0.27);
    visor.userData.hitbox = 'head';

    this.group.add(
      this.leftLeg,
      this.rightLeg,
      this.torso,
      chestStripe,
      this.leftArm,
      this.rightArm,
      this.gunMesh,
      gunGlow,
      this.headMesh,
      visor
    );

    this.hitMeshes = [
      this.headMesh,
      visor,
      this.torso,
      chestStripe,
      this.leftLeg,
      this.rightLeg,
      this.leftArm,
      this.rightArm,
    ];

    // Floating overhead Health Bar Sprite
    this._buildHealthBar();

    this.scene.add(this.group);
  }

  _buildHealthBar() {
    this.hpCanvas = document.createElement('canvas');
    this.hpCanvas.width = 128;
    this.hpCanvas.height = 24;
    this.hpCtx = this.hpCanvas.getContext('2d');
    this.hpTex = new THREE.CanvasTexture(this.hpCanvas);

    const spriteMat = new THREE.SpriteMaterial({ map: this.hpTex, depthTest: false });
    this.hpSprite = new THREE.Sprite(spriteMat);
    this.hpSprite.scale.set(1.35, 0.26, 1);
    this.hpSprite.position.set(0, 2.42, 0);
    this.group.add(this.hpSprite);
    this._redrawHealthBar();
  }

  _redrawHealthBar() {
    const ctx = this.hpCtx;
    const w = this.hpCanvas.width;
    const h = this.hpCanvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(10, 14, 24, 0.8)';
    ctx.fillRect(0, 0, w, h);

    const pct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = pct > 0.35 ? '#ff3e5e' : '#ff9f1c';
    ctx.fillRect(4, 4, Math.round((w - 8) * pct), h - 8);

    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    this.hpTex.needsUpdate = true;
  }

  reset(spawnPos, difficultyKey = 'pro') {
    this.difficulty = DIFFICULTIES[difficultyKey] || DIFFICULTIES.pro;
    this.hp = this.maxHp;
    this.alive = true;
    this.pos.copy(spawnPos);
    this.vel.set(0, 0, 0);
    this.yaw = 0;
    this.deathFall = 0;
    this.hurtFlash = 0;
    this.sightTimer = 0;
    this.fireTimer = 0.45;
    this.group.rotation.set(0, 0, 0);
    this.group.position.copy(this.pos);
    this.hpSprite.visible = true;
    this._pickNewWaypoint();
    this._redrawHealthBar();
  }

  getHitMeshes() {
    return this.alive ? this.hitMeshes : [];
  }

  getCenterWorldPos() {
    return new THREE.Vector3(this.pos.x, this.pos.y + 1.15, this.pos.z);
  }

  getHeadWorldPos() {
    return new THREE.Vector3(this.pos.x, this.pos.y + 1.76, this.pos.z);
  }

  takeDamage(amount, isHeadshot = false) {
    if (!this.alive) return { killed: false, hp: 0 };
    this.hp = Math.max(0, this.hp - Math.round(amount));
    this.hurtFlash = 0.14;
    this._redrawHealthBar();

    if (this.hp <= 0) {
      this.alive = false;
      this.hpSprite.visible = false;
      return { killed: true, hp: 0, isHeadshot };
    }
    return { killed: false, hp: this.hp, isHeadshot };
  }

  _pickNewWaypoint() {
    const idx = Math.floor(Math.random() * this.waypoints.length);
    this.currentTarget.copy(this.waypoints[idx]);
  }

  _hasLineOfSight(playerEyePos) {
    const origin = new THREE.Vector3(this.pos.x, this.pos.y + 1.55, this.pos.z);
    const dir = new THREE.Vector3().subVectors(playerEyePos, origin);
    const dist = dir.length();
    if (dist < 0.1) return true;
    dir.normalize();

    this.raycaster.set(origin, dir);
    this.raycaster.far = dist - 0.35;
    const hits = this.raycaster.intersectObjects(this.arena.meshes, false);
    return hits.length === 0;
  }

  update(dt, playerPos, playerAlive, canFight, onBotShoot) {
    // Hurt flash decay
    if (this.hurtFlash > 0) {
      this.hurtFlash = Math.max(0, this.hurtFlash - dt);
      const emissiveVal = this.hurtFlash > 0 ? 0.5 : 0;
      this.torso.material.emissive.setHex(emissiveVal > 0 ? 0xffffff : 0x000000);
      this.torso.material.emissiveIntensity = emissiveVal;
    }

    // Ragdoll fall on death
    if (!this.alive) {
      this.deathFall = Math.min(Math.PI / 2, this.deathFall + dt * 5.2);
      this.group.rotation.x = -this.deathFall;
      this.group.position.set(this.pos.x, this.pos.y + 0.25, this.pos.z);
      return;
    }

    if (!canFight) {
      // Idle face player during countdown
      const dx = playerPos.x - this.pos.x;
      const dz = playerPos.z - this.pos.z;
      this.yaw = Math.atan2(dx, dz);
      this.group.position.copy(this.pos);
      this.group.rotation.set(0, this.yaw, 0);
      return;
    }

    const playerEye = new THREE.Vector3(playerPos.x, playerPos.y + 1.55, playerPos.z);
    const toPlayer = new THREE.Vector3(playerPos.x - this.pos.x, 0, playerPos.z - this.pos.z);
    const distToPlayer = toPlayer.length();
    const canSee = playerAlive && this._hasLineOfSight(playerEye);

    // Strafe & jump timers
    this.strafeTimer -= dt;
    if (this.strafeTimer <= 0) {
      this.strafeDir = Math.random() < 0.5 ? -1 : 1;
      this.strafeTimer = this.difficulty.strafeFreq * (0.65 + Math.random() * 0.7);
    }
    this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);

    // Desired movement vector
    const moveDir = new THREE.Vector3();
    if (canSee) {
      const forward = toPlayer.clone().normalize();
      const right = new THREE.Vector3(-forward.z, 0, forward.x);

      // Keep competitive engagement distance (10-18m)
      if (distToPlayer > 17) moveDir.addScaledVector(forward, 0.75);
      else if (distToPlayer < 8.5) moveDir.addScaledVector(forward, -0.7);

      // Strafe dodging
      moveDir.addScaledVector(right, this.strafeDir * 0.9);

      // Occasional jump-peek during gunfights
      if (this.jumpCooldown <= 0 && Math.random() < dt * 0.65 && this.onGround) {
        this.vel.y = 8.4;
        this.onGround = false;
        this.jumpCooldown = 2.0;
      }
    } else {
      // Navigate toward waypoint or flank toward player
      const toWp = new THREE.Vector3(
        this.currentTarget.x - this.pos.x,
        0,
        this.currentTarget.z - this.pos.z
      );
      if (toWp.length() < 2.2) {
        // Alternate between pursuing player's half and random high-ground waypoint
        if (Math.random() < 0.5) {
          this.currentTarget.set(
            playerPos.x + (Math.random() - 0.5) * 14,
            0,
            playerPos.z + (Math.random() - 0.5) * 14
          );
        } else {
          this._pickNewWaypoint();
        }
      } else {
        moveDir.copy(toWp.normalize());
      }
    }

    if (moveDir.lengthSq() > 0.001) {
      moveDir.normalize();
      this.vel.x = THREE.MathUtils.lerp(this.vel.x, moveDir.x * this.difficulty.speed, Math.min(1, dt * 8));
      this.vel.z = THREE.MathUtils.lerp(this.vel.z, moveDir.z * this.difficulty.speed, Math.min(1, dt * 8));
    } else {
      this.vel.x *= Math.max(0, 1 - dt * 8);
      this.vel.z *= Math.max(0, 1 - dt * 8);
    }

    // Gravity + Floor/Ramp collision
    this.vel.y -= 23 * dt;
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    this.pos.y += this.vel.y * dt;

    this.arena.resolveHorizontal(this.pos, 0.48, 1.9);
    const floorY = this.arena.getFloorHeight(this.pos.x, this.pos.z, this.pos.y, 0.45);
    if (this.pos.y <= floorY) {
      this.pos.y = floorY;
      this.vel.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Smoothly turn to face player if visible, else movement direction
    let targetYaw = this.yaw;
    if (canSee) {
      targetYaw = Math.atan2(playerPos.x - this.pos.x, playerPos.z - this.pos.z);
    } else if (Math.hypot(this.vel.x, this.vel.z) > 0.5) {
      targetYaw = Math.atan2(this.vel.x, this.vel.z);
    }
    let deltaYaw = targetYaw - this.yaw;
    while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
    while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
    this.yaw += deltaYaw * Math.min(1, dt * 11);

    // Shooting logic
    if (canSee) {
      this.sightTimer += dt;
      this.fireTimer -= dt;
      if (this.sightTimer >= this.difficulty.reaction && this.fireTimer <= 0) {
        this.fireTimer = this.difficulty.fireInterval * (0.85 + Math.random() * 0.35);
        const muzzleWorld = new THREE.Vector3(0.54, 1.25, 0.9)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)
          .add(this.pos);
        const aimDir = new THREE.Vector3().subVectors(playerEye, muzzleWorld).normalize();
        // Add difficulty-scaled aim inaccuracy
        aimDir.x += (Math.random() - 0.5) * this.difficulty.spread * 2;
        aimDir.y += (Math.random() - 0.5) * this.difficulty.spread * 1.6;
        aimDir.z += (Math.random() - 0.5) * this.difficulty.spread * 2;
        aimDir.normalize();
        onBotShoot(muzzleWorld, aimDir, this.difficulty.damage);
      }
    } else {
      this.sightTimer = Math.max(0, this.sightTimer - dt * 1.5);
    }

    // Limb walk cycle animation
    const horizSpeed = Math.hypot(this.vel.x, this.vel.z);
    if (horizSpeed > 0.6 && this.onGround) {
      this.walkPhase += dt * horizSpeed * 1.55;
      this.leftLeg.rotation.x = Math.sin(this.walkPhase) * 0.65;
      this.rightLeg.rotation.x = -Math.sin(this.walkPhase) * 0.65;
      this.leftArm.rotation.x = -Math.sin(this.walkPhase) * 0.45;
    } else {
      this.leftLeg.rotation.x *= 0.85;
      this.rightLeg.rotation.x *= 0.85;
      this.leftArm.rotation.x *= 0.85;
    }

    this.group.position.copy(this.pos);
    this.group.rotation.set(0, this.yaw, 0);
  }
}
