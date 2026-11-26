(function (global) {
  const Rivals = (global.Rivals = global.Rivals || {});
  const THREE = global.THREE;
  const { RIVAL_SKINS } = Rivals;

  const DIFFICULTIES = {
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

  class RivalBot {
    constructor(scene, arena) {
      this.scene = scene;
      this.arena = arena;
      this.raycaster = new THREE.Raycaster();

      this.maxHp = 100;
      this.hp = 100;
      this.alive = true;
      this.onGround = true;

      this.pos = new THREE.Vector3(0, 0, -28);
      this.vel = new THREE.Vector3();
      this.yaw = 0;

      this.difficulty = DIFFICULTIES.pro;
      this.skinId = 'classic';
      this.team = 'red'; // 'red' | 'blue'
      this.name = 'RIVAL';
      this.passive = false;
      this.isDummy = false;
      this.respawnTimer = 0;
      this.spawnHome = new THREE.Vector3(0, 0, -28);
      this.waypoints = arena.getWaypoints();
      this.currentTarget = this.waypoints[0]?.clone() || new THREE.Vector3();

      this.strafeDir = 1;
      this.strafeTimer = 1.0;
      this.fireTimer = 0.5;
      this.sightTimer = 0;
      this.jumpCooldown = 0;
      this.padCooldown = 0;
      this.hurtFlash = 0;
      this.blindTimer = 0;
      this.walkPhase = 0;
      this.deathFall = 0;

      this.hitMeshes = [];
      this._buildAvatar();
    }

    _buildAvatar() {
      this.group = new THREE.Group();

      this.matSkin = new THREE.MeshStandardMaterial({ color: 0xf7cf86, roughness: 0.6 });
      this.matTorso = new THREE.MeshStandardMaterial({ color: 0xe63956, roughness: 0.5, metalness: 0.15 });
      this.matLegs = new THREE.MeshStandardMaterial({ color: 0x1e2638, roughness: 0.7 });
      this.matAccent = new THREE.MeshStandardMaterial({
        color: 0xff3e5e,
        emissive: 0xff3e5e,
        emissiveIntensity: 0.75,
      });

      this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 0.34), this.matLegs);
      this.leftLeg.position.set(-0.19, 0.36, 0);
      this.leftLeg.castShadow = true;
      this.leftLeg.userData.hitbox = 'body';

      this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 0.34), this.matLegs);
      this.rightLeg.position.set(0.19, 0.36, 0);
      this.rightLeg.castShadow = true;
      this.rightLeg.userData.hitbox = 'body';

      this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.76, 0.4), this.matTorso);
      this.torso.position.set(0, 1.1, 0);
      this.torso.castShadow = true;
      this.torso.userData.hitbox = 'body';

      const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.14, 0.42), this.matAccent);
      chestStripe.position.set(0, 1.18, 0);
      chestStripe.userData.hitbox = 'body';

      this.leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.72, 0.3), this.matSkin);
      this.leftArm.position.set(-0.54, 1.08, 0);
      this.leftArm.castShadow = true;
      this.leftArm.userData.hitbox = 'body';

      this.rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.72, 0.3), this.matSkin);
      this.rightArm.position.set(0.54, 1.16, 0.2);
      this.rightArm.rotation.x = -Math.PI * 0.45;
      this.rightArm.castShadow = true;
      this.rightArm.userData.hitbox = 'body';

      this.gunMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.14, 0.72),
        new THREE.MeshStandardMaterial({ color: 0x1a2030, metalness: 0.5, roughness: 0.35 })
      );
      this.gunMesh.position.set(0.54, 1.18, 0.55);
      this.gunMesh.castShadow = true;

      const gunGlow = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.5), this.matAccent);
      gunGlow.position.set(0.54, 1.22, 0.58);

      this.headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.52, 0.54), this.matSkin);
      this.headMesh.position.set(0, 1.76, 0);
      this.headMesh.castShadow = true;
      this.headMesh.userData.hitbox = 'head';

      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.08), this.matAccent);
      visor.position.set(0, 1.8, 0.27);
      visor.userData.hitbox = 'head';

      // Accessory 1: Eastern Assassin Conical Bamboo Hat
      this.bambooHat = new THREE.Group();
      const hatCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.74, 0.32, 12),
        new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.55, metalness: 0.25 })
      );
      hatCone.position.set(0, 2.12, 0);
      const hatTrim = new THREE.Mesh(
        new THREE.TorusGeometry(0.72, 0.035, 6, 16),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.5 })
      );
      hatTrim.rotation.x = Math.PI / 2;
      hatTrim.position.set(0, 1.98, 0);
      this.bambooHat.add(hatCone, hatTrim);
      this.bambooHat.visible = false;

      // Accessory 2: Space Astronaut Jetpack
      this.jetpack = new THREE.Group();
      const pack = new THREE.Mesh(
        new THREE.BoxGeometry(0.54, 0.62, 0.26),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.4, roughness: 0.3 })
      );
      pack.position.set(0, 1.15, -0.32);
      const thrusterL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 0.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.9 })
      );
      thrusterL.position.set(-0.15, 0.8, -0.32);
      const thrusterR = thrusterL.clone();
      thrusterR.position.x = 0.15;
      this.jetpack.add(pack, thrusterL, thrusterR);
      this.jetpack.visible = false;

      // Flashbang stunned ring above head
      this.stunRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.04, 8, 18),
        new THREE.MeshBasicMaterial({ color: 0xfff3a0 })
      );
      this.stunRing.rotation.x = Math.PI / 2;
      this.stunRing.position.set(0, 2.28, 0);
      this.stunRing.visible = false;

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
        visor,
        this.bambooHat,
        this.jetpack,
        this.stunRing
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
      for (const m of this.hitMeshes) m.userData.enemyRef = this;

      this._buildHealthBar();
      this.scene.add(this.group);
    }

    dispose() {
      this.scene.remove(this.group);
    }

    applySkin(skinId) {
      if (this.team === 'blue') {
        this.skinId = 'ally';
        this.matSkin.color.setHex(0xf7cf86);
        this.matTorso.color.setHex(0x0284c7);
        this.matTorso.metalness = 0.25;
        this.matLegs.color.setHex(0x0f172a);
        this.matAccent.color.setHex(0x2de2ff);
        this.matAccent.emissive.setHex(0x2de2ff);
        this.bambooHat.visible = false;
        this.jetpack.visible = false;
        this._redrawHealthBar();
        return;
      }

      const skin = RIVAL_SKINS[skinId] || RIVAL_SKINS.classic;
      this.skinId = skin.id;
      this.matSkin.color.setHex(skin.skinColor);
      this.matTorso.color.setHex(skin.torsoColor);
      this.matTorso.metalness = skin.metalness;
      this.matLegs.color.setHex(skin.legsColor);
      this.matAccent.color.setHex(skin.accentColor);
      this.matAccent.emissive.setHex(skin.accentColor);

      this.bambooHat.visible = skin.accessory === 'bambooHat';
      this.jetpack.visible = skin.accessory === 'jetpack';
      this._redrawHealthBar();
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
      this.hpSprite.position.set(0, 2.58, 0);
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
      ctx.fillStyle =
        this.blindTimer > 0
          ? '#fde047'
          : this.team === 'blue'
          ? '#2de2ff'
          : pct > 0.35
          ? '#ff3e5e'
          : '#ff9f1c';
      ctx.fillRect(4, 4, Math.round((w - 8) * pct), h - 8);

      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, w - 2, h - 2);

      this.hpTex.needsUpdate = true;
    }

    refreshWaypoints() {
      this.waypoints = this.arena.getWaypoints();
      this._pickNewWaypoint();
    }

    blind(duration = 2.8) {
      this.blindTimer = Math.max(this.blindTimer, duration);
      this._redrawHealthBar();
    }

    setVisible(vis) {
      this.group.visible = vis;
    }

    getForwardVector() {
      return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
    }

    reset(spawnPos, difficultyKey = 'pro', skinId = 'classic') {
      this.difficulty = DIFFICULTIES[difficultyKey] || DIFFICULTIES.pro;
      this.spawnHome.copy(spawnPos);
      this.applySkin(skinId);
      this.waypoints = this.arena.getWaypoints();

      this.hp = this.maxHp;
      this.alive = true;
      this.onGround = true;
      this.pos.copy(spawnPos);
      this.vel.set(0, 0, 0);
      this.yaw = this.team === 'blue' ? Math.PI : 0;
      this.deathFall = 0;
      this.hurtFlash = 0;
      this.blindTimer = 0;
      this.sightTimer = 0;
      this.fireTimer = 0.45;
      this.padCooldown = 0;
      this.respawnTimer = 0;
      this.group.visible = true;
      this.group.rotation.set(0, this.yaw, 0);
      this.group.position.copy(this.pos);
      this.hpSprite.visible = true;
      this.stunRing.visible = false;
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
        this.stunRing.visible = false;
        return { killed: true, hp: 0, isHeadshot };
      }
      return { killed: false, hp: this.hp, isHeadshot };
    }

    _pickNewWaypoint() {
      if (!this.waypoints || this.waypoints.length === 0) return;
      const idx = Math.floor(Math.random() * this.waypoints.length);
      this.currentTarget.copy(this.waypoints[idx]);
    }

    _hasLineOfSight(playerEyePos, smokeClouds = []) {
      const origin = new THREE.Vector3(this.pos.x, this.pos.y + 1.55, this.pos.z);
      const dir = new THREE.Vector3().subVectors(playerEyePos, origin);
      const dist = dir.length();
      if (dist < 0.1) return true;
      dir.normalize();

      // Check smoke clouds blocking sight!
      for (const sm of smokeClouds) {
        const toSmoke = new THREE.Vector3().subVectors(sm.pos, origin);
        const proj = toSmoke.dot(dir);
        if (proj >= -sm.radius && proj <= dist + sm.radius) {
          const clamped = Math.max(0, Math.min(dist, proj));
          const closest = origin.clone().addScaledVector(dir, clamped);
          if (closest.distanceTo(sm.pos) < sm.radius * 0.92) {
            return false;
          }
        }
      }

      this.raycaster.set(origin, dir);
      this.raycaster.far = dist - 0.35;
      const hits = this.raycaster.intersectObjects(this.arena.meshes, false);
      return hits.length === 0;
    }

    _selectTarget(targets, smokeClouds) {
      let best = null;
      let bestScore = Infinity;
      let bestCanSee = false;

      for (const t of targets) {
        if (!t || !t.alive) continue;
        const eye = new THREE.Vector3(t.pos.x, t.pos.y + 1.55, t.pos.z);
        const dist = this.pos.distanceTo(t.pos);
        const see = this.blindTimer <= 0 && this._hasLineOfSight(eye, smokeClouds);
        const score = see ? dist : dist + 80;
        if (score < bestScore) {
          bestScore = score;
          best = t;
          bestCanSee = see;
        }
      }
      return { target: best, canSee: bestCanSee };
    }

    update(dt, targetList, canFight, onBotShoot, gravityScale = 1.0, smokeClouds = [], onBotVoidFall = null) {
      if (this.hurtFlash > 0) {
        this.hurtFlash = Math.max(0, this.hurtFlash - dt);
        const emissiveVal = this.hurtFlash > 0 ? 0.5 : 0;
        this.matTorso.emissive.setHex(emissiveVal > 0 ? 0xffffff : 0x000000);
        this.matTorso.emissiveIntensity = emissiveVal;
      }

      if (!this.alive) {
        this.deathFall = Math.min(Math.PI / 2, this.deathFall + dt * 5.2);
        this.group.rotation.x = -this.deathFall;
        this.group.position.set(this.pos.x, this.pos.y + 0.25, this.pos.z);
        return;
      }

      if (this.blindTimer > 0) {
        this.blindTimer = Math.max(0, this.blindTimer - dt);
        this.stunRing.visible = true;
        this.stunRing.rotation.z += dt * 8;
        if (this.blindTimer === 0) {
          this.stunRing.visible = false;
          this._redrawHealthBar();
        }
      }

      const targets = Array.isArray(targetList) ? targetList : [targetList];
      const { target, canSee } = this._selectTarget(targets, smokeClouds);

      if (!canFight || !target) {
        if (target) {
          this.yaw = Math.atan2(target.pos.x - this.pos.x, target.pos.z - this.pos.z);
        }
        this.group.position.copy(this.pos);
        this.group.rotation.set(0, this.yaw, 0);
        return;
      }

      const isBlinded = this.blindTimer > 0;
      const targetPos = target.pos;
      const targetEye = new THREE.Vector3(targetPos.x, targetPos.y + 1.55, targetPos.z);
      const toTarget = new THREE.Vector3(targetPos.x - this.pos.x, 0, targetPos.z - this.pos.z);
      const distToTarget = toTarget.length();

      this.strafeTimer -= dt;
      if (this.strafeTimer <= 0) {
        this.strafeDir = Math.random() < 0.5 ? -1 : 1;
        this.strafeTimer = this.difficulty.strafeFreq * (0.65 + Math.random() * 0.7);
      }
      this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
      this.padCooldown = Math.max(0, this.padCooldown - dt);

      const moveDir = new THREE.Vector3();
      if (isBlinded) {
        moveDir.set(Math.sin(performance.now() * 0.004), 0, Math.cos(performance.now() * 0.004));
      } else if (canSee) {
        const forward = toTarget.clone().normalize();
        const right = new THREE.Vector3(-forward.z, 0, forward.x);
        if (distToTarget > 17) moveDir.addScaledVector(forward, 0.75);
        else if (distToTarget < 8.5) moveDir.addScaledVector(forward, -0.7);
        moveDir.addScaledVector(right, this.strafeDir * 0.9);

        if (this.jumpCooldown <= 0 && Math.random() < dt * (gravityScale < 0.6 ? 1.1 : 0.65) && this.onGround) {
          this.vel.y = gravityScale < 0.6 ? 7.8 : 8.4;
          this.onGround = false;
          this.jumpCooldown = 2.0;
        }
      } else {
        const toWp = new THREE.Vector3(this.currentTarget.x - this.pos.x, 0, this.currentTarget.z - this.pos.z);
        if (toWp.length() < 2.2) {
          if (Math.random() < 0.45 && this.arena.hasFloor) {
            this.currentTarget.set(
              targetPos.x + (Math.random() - 0.5) * 14,
              0,
              targetPos.z + (Math.random() - 0.5) * 14
            );
          } else {
            this._pickNewWaypoint();
          }
        } else {
          moveDir.copy(toWp.normalize());
        }
      }

      const moveSpeed = isBlinded ? this.difficulty.speed * 0.35 : this.difficulty.speed;
      if (moveDir.lengthSq() > 0.001) {
        moveDir.normalize();
        this.vel.x = THREE.MathUtils.lerp(this.vel.x, moveDir.x * moveSpeed, Math.min(1, dt * 8));
        this.vel.z = THREE.MathUtils.lerp(this.vel.z, moveDir.z * moveSpeed, Math.min(1, dt * 8));
      } else {
        this.vel.x *= Math.max(0, 1 - dt * 8);
        this.vel.z *= Math.max(0, 1 - dt * 8);
      }

      if (!this.arena.hasFloor && this.onGround) {
        const probeX = this.pos.x + this.vel.x * 0.28;
        const probeZ = this.pos.z + this.vel.z * 0.28;
        const probeFloor = this.arena.getFloorHeight(probeX, probeZ, this.pos.y + 0.3, 0.25);
        if (probeFloor === -Infinity) {
          this.strafeDir = -this.strafeDir;
          this.vel.x *= -0.5;
          this.vel.z *= -0.5;
          this._pickNewWaypoint();
        }
      }

      this.vel.y -= 23 * gravityScale * dt;
      this.pos.x += this.vel.x * dt;
      this.pos.z += this.vel.z * dt;
      this.pos.y += this.vel.y * dt;

      this.arena.resolveHorizontal(this.pos, 0.48, 1.9);
      const floorY = this.arena.getFloorHeight(this.pos.x, this.pos.z, this.pos.y, 0.45);
      if (floorY > -Infinity && this.pos.y <= floorY) {
        this.pos.y = floorY;
        this.vel.y = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }

      if (!this.arena.hasFloor && this.pos.y < this.arena.voidY) {
        this.alive = false;
        this.hp = 0;
        this.hpSprite.visible = false;
        this.stunRing.visible = false;
        if (typeof onBotVoidFall === 'function') onBotVoidFall(this);
        return;
      }

      if (this.padCooldown <= 0) {
        const launch = this.arena.checkJumpPad(this.pos);
        if (launch > 0) {
          this.vel.y = launch * (gravityScale < 0.6 ? 0.85 : 1.05);
          this.onGround = false;
          this.padCooldown = 1.0;
        }
      }

      let targetYaw = this.yaw;
      if (isBlinded) {
        targetYaw = this.yaw + dt * 4.5;
      } else if (canSee) {
        targetYaw = Math.atan2(targetPos.x - this.pos.x, targetPos.z - this.pos.z);
      } else if (Math.hypot(this.vel.x, this.vel.z) > 0.5) {
        targetYaw = Math.atan2(this.vel.x, this.vel.z);
      }
      let deltaYaw = targetYaw - this.yaw;
      while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
      while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
      this.yaw += deltaYaw * Math.min(1, dt * 11);

      if (canSee && !this.passive) {
        this.sightTimer += dt;
        this.fireTimer -= dt;
        if (this.sightTimer >= this.difficulty.reaction && this.fireTimer <= 0) {
          this.fireTimer = this.difficulty.fireInterval * (0.85 + Math.random() * 0.35);
          const muzzleWorld = new THREE.Vector3(0.54, 1.25, 0.9)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)
            .add(this.pos);
          const aimDir = new THREE.Vector3().subVectors(targetEye, muzzleWorld).normalize();
          aimDir.x += (Math.random() - 0.5) * this.difficulty.spread * 2;
          aimDir.y += (Math.random() - 0.5) * this.difficulty.spread * 1.6;
          aimDir.z += (Math.random() - 0.5) * this.difficulty.spread * 2;
          aimDir.normalize();
          onBotShoot(this, muzzleWorld, aimDir, this.difficulty.damage);
        }
      } else {
        this.sightTimer = Math.max(0, this.sightTimer - dt * 1.5);
      }

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

  // =========================================================
  // SHOOTING RANGE TEST DUMMY (Static / Strafing / Auto-Respawn)
  // =========================================================
  class TargetDummy {
    constructor(scene, config) {
      this.scene = scene;
      this.isDummy = true;
      this.passive = true;
      this.maxHp = config.hp || 100;
      this.hp = this.maxHp;
      this.alive = true;

      this.homePos = config.pos.clone();
      this.pos = config.pos.clone();
      this.moveAxis = config.moveAxis || null; // 'x' | 'z' | null
      this.moveRange = config.moveRange || 0;
      this.moveSpeed = config.moveSpeed || 0;
      this.phase = config.phase || 0;
      this.label = config.label || 'DUMMY';

      this.respawnTimer = 0;
      this.hurtFlash = 0;
      this.blindTimer = 0;
      this.deathFall = 0;
      this.yaw = 0;
      this.hitMeshes = [];

      this._buildDummy();
    }

    _buildDummy() {
      this.group = new THREE.Group();

      // Classic crash-test / Roblox training dummy aesthetic (yellow + slate + red bullseye)
      this.matYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.55 });
      this.matDark = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65 });
      this.matTarget = new THREE.MeshStandardMaterial({
        color: 0xff3e5e,
        emissive: 0xff3e5e,
        emissiveIntensity: 0.35,
      });

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.52, 0.14, 12), this.matDark);
      base.position.set(0, 0.07, 0);

      const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.66, 0.32), this.matDark);
      leftLeg.position.set(-0.18, 0.44, 0);
      leftLeg.castShadow = true;
      leftLeg.userData.hitbox = 'body';

      const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.66, 0.32), this.matDark);
      rightLeg.position.set(0.18, 0.44, 0);
      rightLeg.castShadow = true;
      rightLeg.userData.hitbox = 'body';

      this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.78, 0.4), this.matYellow);
      this.torso.position.set(0, 1.16, 0);
      this.torso.castShadow = true;
      this.torso.userData.hitbox = 'body';

      // Target bullseye emblem on chest
      const ringOuter = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.43), this.matTarget);
      ringOuter.position.set(0, 1.18, 0);
      ringOuter.userData.hitbox = 'body';

      const ringInner = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.22, 0.45),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
      );
      ringInner.position.set(0, 1.18, 0);
      ringInner.userData.hitbox = 'body';

      const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.7, 0.28), this.matYellow);
      leftArm.position.set(-0.54, 1.14, 0);
      leftArm.castShadow = true;
      leftArm.userData.hitbox = 'body';

      const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.7, 0.28), this.matYellow);
      rightArm.position.set(0.54, 1.14, 0);
      rightArm.castShadow = true;
      rightArm.userData.hitbox = 'body';

      this.headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.54, 0.54), this.matYellow);
      this.headMesh.position.set(0, 1.82, 0);
      this.headMesh.castShadow = true;
      this.headMesh.userData.hitbox = 'head';

      // Headshot bullseye dot on forehead
      const faceDot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.57), this.matTarget);
      faceDot.position.set(0, 1.84, 0);
      faceDot.userData.hitbox = 'head';

      this.group.add(base, leftLeg, rightLeg, this.torso, ringOuter, ringInner, leftArm, rightArm, this.headMesh, faceDot);

      this.hitMeshes = [this.headMesh, faceDot, this.torso, ringOuter, ringInner, leftLeg, rightLeg, leftArm, rightArm];
      for (const m of this.hitMeshes) m.userData.enemyRef = this;

      // Overhead HP Bar
      this.hpCanvas = document.createElement('canvas');
      this.hpCanvas.width = 128;
      this.hpCanvas.height = 24;
      this.hpCtx = this.hpCanvas.getContext('2d');
      this.hpTex = new THREE.CanvasTexture(this.hpCanvas);
      this.hpSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.hpTex, depthTest: false }));
      this.hpSprite.scale.set(1.3, 0.25, 1);
      this.hpSprite.position.set(0, 2.45, 0);
      this.group.add(this.hpSprite);
      this._redrawHealthBar();

      this.group.position.copy(this.pos);
      this.scene.add(this.group);
    }

    _redrawHealthBar() {
      const ctx = this.hpCtx;
      const w = this.hpCanvas.width;
      const h = this.hpCanvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(10, 14, 24, 0.8)';
      ctx.fillRect(0, 0, w, h);
      const pct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = pct > 0.35 ? '#facc15' : '#ff3e5e';
      ctx.fillRect(4, 4, Math.round((w - 8) * pct), h - 8);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, w - 2, h - 2);
      this.hpTex.needsUpdate = true;
    }

    getHitMeshes() {
      return this.alive ? this.hitMeshes : [];
    }

    getCenterWorldPos() {
      return new THREE.Vector3(this.pos.x, this.pos.y + 1.18, this.pos.z);
    }

    getHeadWorldPos() {
      return new THREE.Vector3(this.pos.x, this.pos.y + 1.82, this.pos.z);
    }

    getForwardVector() {
      return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
    }

    setVisible(vis) {
      this.group.visible = vis;
    }

    blind(sec = 2.0) {
      this.blindTimer = Math.max(this.blindTimer, sec);
    }

    takeDamage(amount, isHeadshot = false) {
      if (!this.alive) return { killed: false, hp: 0 };
      this.hp = Math.max(0, this.hp - Math.round(amount));
      this.hurtFlash = 0.14;
      this._redrawHealthBar();
      if (this.hp <= 0) {
        this.alive = false;
        this.hpSprite.visible = false;
        this.respawnTimer = 1.65;
        return { killed: true, hp: 0, isHeadshot };
      }
      return { killed: false, hp: this.hp, isHeadshot };
    }

    respawn() {
      this.hp = this.maxHp;
      this.alive = true;
      this.deathFall = 0;
      this.hurtFlash = 0;
      this.group.visible = true;
      this.group.rotation.x = 0;
      this.hpSprite.visible = true;
      this._redrawHealthBar();
    }

    update(dt, targetList) {
      const target = Array.isArray(targetList) ? targetList[0] : targetList;
      const playerPos = target?.pos || target || this.pos;
      if (this.hurtFlash > 0) {
        this.hurtFlash = Math.max(0, this.hurtFlash - dt);
        this.matYellow.emissive.setHex(this.hurtFlash > 0 ? 0xffffff : 0x000000);
        this.matYellow.emissiveIntensity = this.hurtFlash > 0 ? 0.5 : 0;
      }

      if (!this.alive) {
        this.deathFall = Math.min(Math.PI / 2, this.deathFall + dt * 6.5);
        this.group.rotation.x = -this.deathFall;
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) {
          this.respawn();
        }
        return;
      }

      if (this.blindTimer > 0) this.blindTimer = Math.max(0, this.blindTimer - dt);

      if (this.moveAxis && this.moveRange > 0 && this.blindTimer <= 0) {
        this.phase += dt * this.moveSpeed;
        const offset = Math.sin(this.phase) * this.moveRange;
        this.pos.copy(this.homePos);
        if (this.moveAxis === 'x') this.pos.x += offset;
        if (this.moveAxis === 'z') this.pos.z += offset;
      }

      // Face player smoothly
      const dx = playerPos.x - this.pos.x;
      const dz = playerPos.z - this.pos.z;
      this.yaw = Math.atan2(dx, dz);
      this.group.position.copy(this.pos);
      this.group.rotation.set(0, this.yaw, 0);
    }

    dispose() {
      this.scene.remove(this.group);
    }
  }

  Rivals.DIFFICULTIES = DIFFICULTIES;
  Rivals.RivalBot = RivalBot;
  Rivals.TargetDummy = TargetDummy;
})(window);
