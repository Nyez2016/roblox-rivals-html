(function (global) {
  const Rivals = (global.Rivals = global.Rivals || {});
  const THREE = global.THREE;

  const MAPS = {
    lobby: {
      id: 'lobby',
      name: 'RIVALS LOBBY',
      subtitle: 'Walkable 3D Hub Plaza · Duel Pads, Parkour Obby & Lobby Bots',
      gravityScale: 1.0,
      hasFloor: true,
    },
    arena: {
      id: 'arena',
      name: 'ARENA',
      subtitle: 'Classic symmetrical bridge & sniper perches',
      gravityScale: 1.0,
      hasFloor: true,
    },
    shootingrange: {
      id: 'shootingrange',
      name: 'SHOOTING RANGE',
      subtitle: 'Tactical firing bays, distance lanes & test dummy targets',
      gravityScale: 1.0,
      hasFloor: true,
    },
    skyislands: {
      id: 'skyislands',
      name: 'SKY ISLANDS',
      subtitle: 'Floating islands high above the clouds with void ring-outs',
      gravityScale: 0.72,
      hasFloor: false,
    },
    cloudspire: {
      id: 'cloudspire',
      name: 'CLOUD SPIRE',
      subtitle: 'Multi-tier airborne sky citadel with jump pads & glass bridges',
      gravityScale: 0.65,
      hasFloor: false,
    },
    orbital: {
      id: 'orbital',
      name: 'ORBITAL ZERO-G',
      subtitle: 'Deep space station with 0.36x low gravity & 4 launch pads',
      gravityScale: 0.36,
      hasFloor: true,
    },
    jade: {
      id: 'jade',
      name: 'JADE COURTYARD',
      subtitle: 'Eastern palace with pagoda rooftops, lotus pond & lanterns',
      gravityScale: 1.0,
      hasFloor: true,
    },
    station: {
      id: 'station',
      name: 'NEON STATION',
      subtitle: 'Night subway platforms & climbable central metro train',
      gravityScale: 1.0,
      hasFloor: true,
    },
    construction: {
      id: 'construction',
      name: 'CONSTRUCTION',
      subtitle: 'High-altitude skyscraper scaffolding & cranes floating in the air',
      gravityScale: 0.85,
      hasFloor: false,
    },
    splash: {
      id: 'splash',
      name: 'SPLASH PARK',
      subtitle: 'Tropical pool deck, water slides & geyser launch pads',
      gravityScale: 1.0,
      hasFloor: true,
    },
  };

  let cachedStudBump = null;

  function getStudBumpTexture() {
    if (cachedStudBump) return cachedStudBump;
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#707070';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    const cx = size / 2;
    const cy = size / 2;
    const grad = ctx.createRadialGradient(cx, cy, size * 0.06, cx, cy, size * 0.27);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.75, '#e8e8e8');
    grad.addColorStop(1, '#555555');
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.27, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    cachedStudBump = tex;
    return tex;
  }

  function createStudTexture(baseHex, studHex, gridSize = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = gridSize;
    canvas.height = gridSize;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, gridSize, gridSize);

    // Subtle matte plastic bevel & micro-grain
    const bgGrad = ctx.createLinearGradient(0, 0, gridSize, gridSize);
    bgGrad.addColorStop(0, 'rgba(255,255,255,0.07)');
    bgGrad.addColorStop(1, 'rgba(0,0,0,0.08)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, gridSize, gridSize);

    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, gridSize - 4, gridSize - 4);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, gridSize - 2, gridSize - 2);

    const r = gridSize * 0.24;
    const cx = gridSize / 2;
    const cy = gridSize / 2;

    // Soft drop shadow under stud
    ctx.beginPath();
    ctx.arc(cx + 3, cy + 4, r * 1.03, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.24)';
    ctx.fill();

    // Raised stud body with subtle gradient
    const studGrad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
    studGrad.addColorStop(0, studHex);
    studGrad.addColorStop(1, baseHex);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = studGrad;
    ctx.fill();

    // Crisp rim highlight
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top specular crescent
    ctx.beginPath();
    ctx.arc(cx - r * 0.24, cy - r * 0.24, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.26)';
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    if ('SRGBColorSpace' in THREE) tex.colorSpace = THREE.SRGBColorSpace;
    else if ('sRGBEncoding' in THREE) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createSkyDomeTexture(topHex, midHex, bottomHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, topHex);
    grad.addColorStop(0.52, midHex);
    grad.addColorStop(1, bottomHex);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 256);
    const tex = new THREE.CanvasTexture(canvas);
    if ('SRGBColorSpace' in THREE) tex.colorSpace = THREE.SRGBColorSpace;
    else if ('sRGBEncoding' in THREE) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  class Arena {
    constructor(scene, initialMapId = 'arena') {
      this.scene = scene;
      this.mapGroup = new THREE.Group();
      this.scene.add(this.mapGroup);

      this.colliders = [];
      this.ramps = [];
      this.jumpPads = [];
      this.ladders = [];
      this.tempWalls = [];
      this.tempJumpPads = [];
      this.lobbyPads = [];
      this.lobbyKeyCrate = null;
      this.animatedProps = [];
      this.trainHazard = null;
      this.meshes = [];
      this.waypoints = [];
      this.hasFloor = true;
      this.voidY = -14;
      this.spawns = {
        player: new THREE.Vector3(0, 0, 29),
        bot: new THREE.Vector3(0, 0, -29),
      };
      this.bounds = { minX: -27, maxX: 27, minZ: -35, maxZ: 35 };
      this.mapId = initialMapId;

      this.loadMap(initialMapId);
    }

    getDefaultGravityScale() {
      return MAPS[this.mapId]?.gravityScale ?? 1.0;
    }

    loadMap(mapId) {
      this.mapId = MAPS[mapId] ? mapId : 'arena';
      this.hasFloor = MAPS[this.mapId].hasFloor !== false;

      while (this.mapGroup.children.length > 0) {
        const child = this.mapGroup.children[0];
        this.mapGroup.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      }

      this.colliders = [];
      this.ramps = [];
      this.jumpPads = [];
      this.ladders = [];
      this.tempWalls = [];
      this.tempJumpPads = [];
      this.lobbyPads = [];
      this.lobbyKeyCrate = null;
      this.animatedProps = [];
      this.trainHazard = null;
      this.meshes = [];
      this.bounds = { minX: -27, maxX: 27, minZ: -35, maxZ: 35 };
      this.spawns = {
        player: new THREE.Vector3(0, 0, 29),
        bot: new THREE.Vector3(0, 0, -29),
      };

      if (this.mapId === 'lobby') {
        this._buildLobbyMap();
      } else if (this.mapId === 'shootingrange') {
        this._buildShootingRangeMap();
      } else if (this.mapId === 'skyislands') {
        this._buildSkyIslandsMap();
      } else if (this.mapId === 'cloudspire') {
        this._buildCloudSpireMap();
      } else if (this.mapId === 'orbital') {
        this._buildOrbitalMap();
      } else if (this.mapId === 'jade') {
        this._buildJadeCourtyardMap();
      } else if (this.mapId === 'station') {
        this._buildStationMap();
      } else if (this.mapId === 'construction') {
        this._buildConstructionMap();
      } else if (this.mapId === 'splash') {
        this._buildSplashMap();
      } else {
        this._buildClassicArenaMap();
      }
    }

    _setLighting({
      skyHex,
      fogHex,
      hemiSky,
      hemiGround,
      hemiInt,
      sunHex,
      sunInt,
      sunPos,
      clouds = true,
      lowerClouds = false,
      stars = false,
    }) {
      this.scene.background = new THREE.Color(skyHex);
      this.scene.fog = new THREE.Fog(fogHex, 58, 175);

      // Rich Procedural Gradient Sky Dome!
      const baseColor = new THREE.Color(skyHex);
      const topColor = baseColor.clone().multiplyScalar(stars ? 0.35 : 0.62);
      const midColor = baseColor.clone();
      const botColor = new THREE.Color(fogHex).lerp(new THREE.Color(stars ? 0x1e1b4b : 0xffffff), stars ? 0.35 : 0.28);
      const skyTex = createSkyDomeTexture(
        '#' + topColor.getHexString(),
        '#' + midColor.getHexString(),
        '#' + botColor.getHexString()
      );
      const skyDome = new THREE.Mesh(
        new THREE.SphereGeometry(195, 24, 16),
        new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })
      );
      this.mapGroup.add(skyDome);

      // Glowing Sun or Moon Disc aligned with light direction!
      const sunDir = new THREE.Vector3(sunPos[0], sunPos[1], sunPos[2]).normalize();
      const sunDisc = new THREE.Mesh(
        new THREE.SphereGeometry(stars ? 5.5 : 7.5, 16, 12),
        new THREE.MeshBasicMaterial({ color: stars ? 0xdbeafe : 0xfffbeb, fog: false })
      );
      sunDisc.position.copy(sunDir.multiplyScalar(155));
      const sunHalo = new THREE.Mesh(
        new THREE.SphereGeometry(stars ? 9.5 : 13.5, 16, 12),
        new THREE.MeshBasicMaterial({ color: sunHex, transparent: true, opacity: 0.24, fog: false })
      );
      sunHalo.position.copy(sunDisc.position);
      this.mapGroup.add(sunDisc, sunHalo);

      const hemi = new THREE.HemisphereLight(hemiSky, hemiGround, hemiInt);
      this.mapGroup.add(hemi);

      const sun = new THREE.DirectionalLight(sunHex, sunInt);
      sun.position.set(sunPos[0], sunPos[1], sunPos[2]);
      sun.castShadow = true;
      sun.shadow.mapSize.width = 2048;
      sun.shadow.mapSize.height = 2048;
      sun.shadow.camera.near = 5;
      sun.shadow.camera.far = 155;
      const d = 56;
      sun.shadow.camera.left = -d;
      sun.shadow.camera.right = d;
      sun.shadow.camera.top = d;
      sun.shadow.camera.bottom = -d;
      sun.shadow.bias = -0.00045;
      this.mapGroup.add(sun);

      // Opposite cool Rim Light so avatars, cover & weapons pop in 3D!
      const rim = new THREE.DirectionalLight(stars ? 0xa855f7 : 0x93c5fd, stars ? 0.55 : 0.42);
      rim.position.set(-sunPos[0], sunPos[1] * 0.6, -sunPos[2]);
      this.mapGroup.add(rim);

      if (clouds) {
        const cloudMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.95,
          metalness: 0,
          transparent: true,
          opacity: 0.85,
        });
        const cloudPositions = [
          [-32, 34, -26, 15, 3, 8],
          [26, 38, -10, 18, 3.5, 9],
          [-16, 36, 28, 16, 3, 8],
          [34, 32, 22, 13, 2.5, 7],
        ];
        for (const [x, y, z, w, h, dep] of cloudPositions) {
          const c = new THREE.Mesh(new THREE.BoxGeometry(w, h, dep), cloudMat);
          c.position.set(x, y, z);
          this.mapGroup.add(c);
          this.animatedProps.push({ type: 'drift', mesh: c, speed: 0.65 + Math.random() * 0.4 });
        }
      }

      if (lowerClouds) {
        // Sea of soft blocky Roblox clouds far BELOW the floating sky maps!
        const seaMat = new THREE.MeshBasicMaterial({ color: 0xf0f9ff, transparent: true, opacity: 0.65 });
        const lowClusters = [
          [-38, -15, -34, 28, 4, 22],
          [34, -17, -28, 32, 5, 24],
          [0, -19, 0, 44, 4, 36],
          [-34, -16, 32, 30, 4.5, 24],
          [36, -15, 30, 26, 4, 22],
          [-55, -10, 0, 24, 5, 40],
          [55, -11, 4, 24, 5, 42],
          [0, -12, -58, 44, 5, 22],
          [0, -12, 58, 44, 5, 22],
        ];
        for (const [x, y, z, w, h, dep] of lowClusters) {
          const c = new THREE.Mesh(new THREE.BoxGeometry(w, h, dep), seaMat);
          c.position.set(x, y, z);
          this.mapGroup.add(c);
        }
      }

      if (stars) {
        const starPositions = [];
        for (let i = 0; i < 420; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI * 0.48;
          const r = 85 + Math.random() * 35;
          starPositions.push(
            Math.sin(phi) * Math.cos(theta) * r,
            Math.cos(phi) * r + 6,
            Math.sin(phi) * Math.sin(theta) * r
          );
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xe0f2fe, size: 0.9, sizeAttenuation: true });
        this.mapGroup.add(new THREE.Points(starGeo, starMat));

        const planet = new THREE.Mesh(
          new THREE.SphereGeometry(11, 20, 16),
          new THREE.MeshStandardMaterial({ color: 0x6366f1, emissive: 0x312e81, roughness: 0.7 })
        );
        planet.position.set(-42, 38, -56);
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(17, 1.3, 8, 36),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 })
        );
        ring.rotation.set(1.2, 0.35, 0);
        ring.position.copy(planet.position);
        this.mapGroup.add(planet, ring);
      }
    }

    _addBox(x, y, z, w, h, d, options = {}) {
      const {
        color = 0xd6dde8,
        studColor = null,
        roughness = 0.65,
        metalness = 0.1,
        emissive = 0x000000,
        emissiveIntensity = 0.85,
        solid = true,
        castShadow = true,
        receiveShadow = true,
        repeatScale = 0.5,
        opacity = 1,
      } = options;

      let mat;
      if (studColor) {
        const tex = createStudTexture(
          '#' + new THREE.Color(color).getHexString(),
          '#' + new THREE.Color(studColor).getHexString()
        );
        const rx = Math.max(1, Math.round(w * repeatScale));
        const rz = Math.max(1, Math.round(d * repeatScale));
        tex.repeat.set(rx, rz);
        const bump = getStudBumpTexture().clone();
        bump.needsUpdate = true;
        bump.repeat.set(rx, rz);
        mat = new THREE.MeshStandardMaterial({
          map: tex,
          bumpMap: bump,
          bumpScale: 0.045,
          roughness: Math.min(0.62, roughness),
          metalness,
          transparent: opacity < 1,
          opacity,
        });
      } else {
        mat = new THREE.MeshStandardMaterial({
          color,
          roughness,
          metalness,
          emissive,
          emissiveIntensity: emissive ? emissiveIntensity : 0,
          transparent: opacity < 1,
          opacity,
        });
      }

      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      this.mapGroup.add(mesh);
      if (solid || options.shootable) this.meshes.push(mesh);

      if (solid) {
        this.colliders.push({
          minX: x - w / 2,
          maxX: x + w / 2,
          minY: y - h / 2,
          maxY: y + h / 2,
          minZ: z - d / 2,
          maxZ: z + d / 2,
        });
      }
      return mesh;
    }

    _addFloatingIsland(x, topY, z, w, d, grassColor = 0x22c55e, grassStud = 0x4ade80, rockColor = 0x785a46) {
      // Grassy stud top deck + tapering rocky underside floating in mid-air!
      this._addBox(x, topY - 0.5, z, w, 1.0, d, { color: grassColor, studColor: grassStud });
      this._addBox(x, topY - 1.9, z, w * 0.78, 1.8, d * 0.78, { color: rockColor, solid: false });
      this._addBox(x, topY - 3.4, z, w * 0.45, 1.4, d * 0.45, { color: 0x5c4536, solid: false });
    }

    _addJumpPad(x, y, z, radius = 2.0, launchVel = 15.5, colorHex = 0xa855f7) {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 1.12, 0.25, 18),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 })
      );
      base.position.set(x, y + 0.12, z);
      const glowRing = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.8, 0.12, 8, 22),
        new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 1.0 })
      );
      glowRing.rotation.x = Math.PI / 2;
      glowRing.position.set(x, y + 0.28, z);
      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, 0.08, 16),
        new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.45 })
      );
      core.position.set(x, y + 0.26, z);
      const floatRing = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.62, 0.06, 8, 22),
        new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85 })
      );
      floatRing.rotation.x = Math.PI / 2;
      floatRing.position.set(x, y + 0.65, z);
      this.mapGroup.add(base, glowRing, core, floatRing);
      this.animatedProps.push({ type: 'padRing', mesh: floatRing, baseY: y + 0.35, phase: Math.random() * 6.28 });

      this.jumpPads.push({ x, y, z, radius, launchVel });
    }

    _addLadder(x, z, yBottom, yTop, facingAxis = 'x', radius = 1.25) {
      const h = yTop - yBottom;
      const railMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.75, roughness: 0.28 });
      const rungMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xeab308,
        emissiveIntensity: 0.45,
        metalness: 0.5,
        roughness: 0.3,
      });

      // 2 vertical steel rails
      for (const side of [-0.42, 0.42]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, h, 0.1), railMat);
        if (facingAxis === 'x') rail.position.set(x, yBottom + h / 2, z + side);
        else rail.position.set(x + side, yBottom + h / 2, z);
        rail.castShadow = true;
        this.mapGroup.add(rail);
      }

      // Evenly spaced horizontal climbable rungs
      const steps = Math.max(4, Math.floor(h / 0.62));
      for (let i = 0; i <= steps; i++) {
        const ry = yBottom + 0.35 + (i / steps) * (h - 0.55);
        const rung = new THREE.Mesh(
          new THREE.BoxGeometry(facingAxis === 'x' ? 0.1 : 0.92, 0.085, facingAxis === 'x' ? 0.92 : 0.1),
          rungMat
        );
        rung.position.set(x, ry, z);
        this.mapGroup.add(rung);
      }

      this.ladders.push({ x, z, yBottom, yTop, radius });
    }

    getLadderAt(pos) {
      for (const lad of this.ladders) {
        const d = Math.hypot(pos.x - lad.x, pos.z - lad.z);
        if (d <= lad.radius && pos.y >= lad.yBottom - 0.4 && pos.y <= lad.yTop + 0.35) {
          return lad;
        }
      }
      return null;
    }

    update(dt, timeSec, onTrainEvent = null) {
      this.updateTempWalls(dt);
      for (const prop of this.animatedProps) {
        if (prop.type === 'padRing') {
          const cycle = ((timeSec * 1.4 + prop.phase) % 1.0);
          prop.mesh.position.y = prop.baseY + cycle * 1.35;
          prop.mesh.scale.setScalar(1.0 - cycle * 0.25);
          prop.mesh.material.opacity = (1.0 - cycle) * 0.85;
        } else if (prop.type === 'drift') {
          prop.mesh.position.x += prop.speed * dt;
          if (prop.mesh.position.x > 64) prop.mesh.position.x = -64;
        } else if (prop.type === 'spinFloat') {
          prop.mesh.rotation.y += dt * prop.speed;
          prop.mesh.position.y = prop.baseY + Math.sin(timeSec * 2.4 + prop.phase) * 0.35;
        }
      }

      // Live Speeding Express Train in Neon Station!
      if (this.trainHazard) {
        const th = this.trainHazard;
        if (th.state === 'idle') {
          th.timer -= dt;
          if (th.timer <= 0) {
            th.state = 'warning';
            th.timer = 1.85;
            th.laneIndex = th.laneIndex === 0 ? 1 : 0; // Alternate West (-7.4) & East (+7.4) tracks
            th.laneX = th.laneIndex === 0 ? -7.4 : 7.4;
            th.dirZ = th.laneIndex === 0 ? 1 : -1;
            th.z = th.dirZ > 0 ? -54 : 54;
            if (onTrainEvent) onTrainEvent('warning', th.laneIndex === 0 ? 'WEST TRACK' : 'EAST TRACK');
          }
        } else if (th.state === 'warning') {
          th.timer -= dt;
          const blink = Math.floor(timeSec * 12) % 2 === 0;
          const lights = th.laneIndex === 0 ? th.westLights : th.eastLights;
          for (const l of lights) l.material.emissiveIntensity = blink ? 1.8 : 0.1;
          if (th.timer <= 0) {
            th.state = 'passing';
            th.group.visible = true;
            th.group.position.set(th.laneX, 0, th.z);
            th.group.rotation.y = th.dirZ > 0 ? 0 : Math.PI;
            if (onTrainEvent) onTrainEvent('pass', th.laneIndex === 0 ? 'WEST TRACK' : 'EAST TRACK');
          }
        } else if (th.state === 'passing') {
          th.z += th.dirZ * th.speed * dt;
          th.group.position.set(th.laneX, 0, th.z);
          const lights = th.laneIndex === 0 ? th.westLights : th.eastLights;
          for (const l of lights) l.material.emissiveIntensity = 1.6;

          if ((th.dirZ > 0 && th.z > 56) || (th.dirZ < 0 && th.z < -56)) {
            th.state = 'idle';
            th.timer = 6.5 + Math.random() * 2.5;
            th.group.visible = false;
            for (const l of [...th.westLights, ...th.eastLights]) l.material.emissiveIntensity = 0.15;
          }
        }
      }
    }

    checkTrainHit(pos, radius = 0.45, height = 1.8) {
      const th = this.trainHazard;
      if (!th || th.state !== 'passing') return false;
      const halfW = 2.05;
      const halfL = 13.0;
      const trainH = 3.7;
      return (
        Math.abs(pos.x - th.laneX) < halfW + radius &&
        Math.abs(pos.z - th.z) < halfL + radius &&
        pos.y < trainH &&
        pos.y + height > 0.1
      );
    }

    _addRamp(xCenter, zCenter, width, length, yStart, yEnd, axis, dir, opts = {}) {
      const baseHex = opts.baseHex || '#52617a';
      const studHex = opts.studHex || '#637591';
      const trimHex = opts.trimColor !== undefined ? opts.trimColor : 0x2de2ff;

      const height = Math.abs(yEnd - yStart);
      const slopeLen = Math.hypot(length, height);
      const angle = Math.atan2(height, length);

      const tex = createStudTexture(baseHex, studHex);
      tex.repeat.set(Math.max(1, Math.round(width * 0.5)), Math.max(1, Math.round(slopeLen * 0.5)));
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65, metalness: 0.1 });

      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(axis === 'z' ? width : slopeLen, 0.35, axis === 'z' ? slopeLen : width),
        mat
      );
      slab.position.set(xCenter, (yStart + yEnd) / 2 - 0.16, zCenter);
      if (axis === 'z') slab.rotation.x = dir > 0 ? -angle : angle;
      else slab.rotation.z = dir > 0 ? angle : -angle;
      slab.castShadow = true;
      slab.receiveShadow = true;
      this.mapGroup.add(slab);
      this.meshes.push(slab);

      if (trimHex) {
        const trimMat = new THREE.MeshStandardMaterial({
          color: trimHex,
          emissive: trimHex,
          emissiveIntensity: 0.65,
        });
        for (const side of [-1, 1]) {
          const trim = new THREE.Mesh(
            new THREE.BoxGeometry(axis === 'z' ? 0.14 : slopeLen, 0.16, axis === 'z' ? slopeLen : 0.14),
            trimMat
          );
          trim.position.set(
            xCenter + (axis === 'z' ? side * (width / 2 - 0.08) : 0),
            (yStart + yEnd) / 2 + 0.04,
            zCenter + (axis === 'x' ? side * (width / 2 - 0.08) : 0)
          );
          if (axis === 'z') trim.rotation.x = dir > 0 ? -angle : angle;
          else trim.rotation.z = dir > 0 ? angle : -angle;
          this.mapGroup.add(trim);
        }
      }

      this.ramps.push({
        minX: xCenter - (axis === 'z' ? width / 2 : length / 2),
        maxX: xCenter + (axis === 'z' ? width / 2 : length / 2),
        minZ: zCenter - (axis === 'z' ? length / 2 : width / 2),
        maxZ: zCenter + (axis === 'z' ? length / 2 : width / 2),
        yStart,
        yEnd,
        axis,
        dir,
      });
    }

    _addPerimeter(wallH, wallColor, wallStud, accentP, accentB, accentSide) {
      this._addBox(0, wallH / 2, -36, 58, wallH, 2, { color: wallColor, studColor: wallStud });
      this._addBox(0, wallH / 2, 36, 58, wallH, 2, { color: wallColor, studColor: wallStud });
      this._addBox(-28, wallH / 2, 0, 2, wallH, 72, { color: wallColor, studColor: wallStud });
      this._addBox(28, wallH / 2, 0, 2, wallH, 72, { color: wallColor, studColor: wallStud });

      this._addBox(0, Math.min(6.5, wallH - 1.5), 34.9, 52, 0.35, 0.2, { color: accentP, emissive: accentP, solid: false });
      this._addBox(0, Math.min(6.5, wallH - 1.5), -34.9, 52, 0.35, 0.2, { color: accentB, emissive: accentB, solid: false });
      this._addBox(-26.9, Math.min(6.5, wallH - 1.5), 0, 0.2, 0.35, 68, { color: accentSide, emissive: accentSide, solid: false });
      this._addBox(26.9, Math.min(6.5, wallH - 1.5), 0, 0.2, 0.35, 68, { color: accentSide, emissive: accentSide, solid: false });
    }

    _createHoloSign(title, subtitle, colorHex) {
      const canvas = document.createElement('canvas');
      canvas.width = 360;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(10, 16, 30, 0.86)';
      ctx.fillRect(8, 8, 344, 104);
      const colStr = '#' + new THREE.Color(colorHex).getHexString();
      ctx.strokeStyle = colStr;
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 344, 104);

      ctx.font = '900 34px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = colStr;
      ctx.fillText(title, 180, 56);

      ctx.font = 'bold 21px Segoe UI, sans-serif';
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText(subtitle, 180, 92);

      const tex = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
      sprite.scale.set(5.6, 1.85, 1);
      return sprite;
    }

    _addLobbyPad(x, z, id, title, subtitle, mode, colorHex) {
      const radius = 3.2;
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius + 0.25, 0.24, 24),
        new THREE.MeshStandardMaterial({ color: 0x162033, metalness: 0.55, roughness: 0.35 })
      );
      base.position.set(x, 0.12, z);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.88, 0.14, 8, 28),
        new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 1.1 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.28, z);

      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.78, radius * 0.78, 0.06, 24),
        new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.34 })
      );
      disc.position.set(x, 0.24, z);

      const floatRing = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.72, 0.06, 8, 28),
        new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85 })
      );
      floatRing.rotation.x = Math.PI / 2;
      floatRing.position.set(x, 0.55, z);
      this.animatedProps.push({ type: 'padRing', mesh: floatRing, baseY: 0.35, phase: Math.random() * 6.28 });

      const sign = this._createHoloSign(title, subtitle, colorHex);
      sign.position.set(x, 3.6, z);

      this.mapGroup.add(base, ring, disc, floatRing, sign);
      this.lobbyPads.push({ id, title, subtitle, mode, x, z, radius, colorHex });
    }

    getLobbyPadAt(pos) {
      for (const pad of this.lobbyPads) {
        const d = Math.hypot(pos.x - pad.x, pos.z - pad.z);
        if (d <= pad.radius && pos.y < 2.2) return pad;
      }
      return null;
    }

    // =========================================================
    // HUB MAP: 3D WALKABLE ROBLOX RIVALS LOBBY!
    // =========================================================
    _buildLobbyMap() {
      this._setLighting({
        skyHex: 0x67b8ff,
        fogHex: 0xaad8ff,
        hemiSky: 0xeff8ff,
        hemiGround: 0x475569,
        hemiInt: 1.05,
        sunHex: 0xfff8e6,
        sunInt: 1.4,
        sunPos: [32, 54, 24],
        clouds: true,
      });

      this.bounds = { minX: -32, maxX: 32, minZ: -32, maxZ: 32 };
      this.spawns = {
        player: new THREE.Vector3(0, 0, 7),
        bot: new THREE.Vector3(0, 0, -14),
      };

      // Bright Roblox Rivals Hub Plaza Floor
      this._addBox(0, -0.5, 0, 68, 1.0, 68, {
        color: 0xdbe5f3,
        studColor: 0xeef4fc,
        solid: false,
        shootable: true,
        castShadow: false,
      });

      // Decorative Rivals Cross-Lane Glow Strips
      this._addBox(0, 0.02, -4, 62, 0.04, 0.55, { color: 0x2de2ff, emissive: 0x2de2ff, solid: false, castShadow: false });
      this._addBox(0, 0.02, 10, 62, 0.04, 0.55, { color: 0xff3e5e, emissive: 0xff3e5e, solid: false, castShadow: false });
      this._addBox(0, 0.02, 0, 0.55, 0.04, 62, { color: 0xfbbf24, emissive: 0xfbbf24, solid: false, castShadow: false });

      // Sleek Perimeter Walls & Glowing Skyline Arches
      for (const zSign of [-1, 1]) {
        const accent = zSign > 0 ? 0x2de2ff : 0xff3e5e;
        this._addBox(0, 3.2, zSign * 33, 68, 6.4, 1.6, { color: 0x1e293b, studColor: 0x334155 });
        this._addBox(0, 6.5, zSign * 33, 68, 0.35, 1.8, { color: accent, emissive: accent, solid: false });
      }
      for (const xSign of [-1, 1]) {
        this._addBox(xSign * 33, 3.2, 0, 1.6, 6.4, 68, { color: 0x1e293b, studColor: 0x334155 });
        this._addBox(xSign * 33, 6.5, 0, 1.8, 0.35, 68, { color: 0x38bdf8, emissive: 0x38bdf8, solid: false });
      }

      // Centerpiece Rivals Monument Pedestal + Floating Golden Crown Crystal!
      this._addBox(0, 0.5, 0, 5.2, 1.0, 5.2, { color: 0x1e293b, studColor: 0x334155 });
      this._addBox(0, 1.2, 0, 3.6, 0.5, 3.6, { color: 0x0f172a, studColor: 0x1e293b });
      const monumentGem = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.15, 0),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.85, metalness: 0.7, roughness: 0.2 })
      );
      monumentGem.position.set(0, 3.2, 0);
      this.mapGroup.add(monumentGem);
      this.animatedProps.push({ type: 'spinFloat', mesh: monumentGem, baseY: 3.2, speed: 1.5, phase: 0 });

      const hubBanner = this._createHoloSign('ROBLOX RIVALS HUB', 'STEP ON A DUEL PAD TO PLAY!', 0x2de2ff);
      hubBanner.scale.set(7.6, 2.3, 1);
      hubBanner.position.set(0, 5.9, 0);
      this.mapGroup.add(hubBanner);

      // === 6 INTERACTIVE WALK-ON MATCHMAKING & SHOP PADS ===
      this._addLobbyPad(-12, -12, 'duel1v1', '1v1 DUEL', 'CLASSIC RIVALS · FIRST TO 5', 'classic', 0x2de2ff);
      this._addLobbyPad(0, -15, 'duel2v2', '2v2 DUELS', 'YOU + ALLY VS 2 BOTS', 'twovtwo', 0x3b82f6);
      this._addLobbyPad(12, -12, 'tdm3v3', '3v3 TDM', 'TEAM DEATHMATCH · TO 25', 'tdm', 0xff5a36);
      this._addLobbyPad(-16, 3, 'ffabots', 'BOT FFA (5 BOTS)', 'FREE-FOR-ALL · FIRST TO 15', 'ffa', 0xd946ef);
      this._addLobbyPad(16, 3, 'range', 'SHOOTING RANGE', 'TEST ALL 52 WEAPONS', 'range', 0xfbbf24);
      this._addLobbyPad(0, 16, 'armory', 'ARMORY & SHOP', 'UNLOCK WEAPONS · MAPS · SKINS', 'shop', 0x38ef7d);

      // Bonus Free Key Crate in the Lobby!
      const crateMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 1.7, 1.7),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.75, metalness: 0.5, roughness: 0.25 })
      );
      crateMesh.position.set(-16, 1.6, 16);
      const crateSign = this._createHoloSign('+25 FREE KEYS', 'WALK INTO CRATE TO CLAIM!', 0xfde047);
      crateSign.position.set(-16, 3.8, 16);
      this.mapGroup.add(crateMesh, crateSign);
      this.animatedProps.push({ type: 'spinFloat', mesh: crateMesh, baseY: 1.6, speed: 1.8, phase: 1.2 });
      this.lobbyKeyCrate = { pos: new THREE.Vector3(-16, 0, 16), mesh: crateMesh, sign: crateSign, claimed: false };

      // Lobby Parkour Obby & VIP Sky Balcony (North-East & North-West)!
      this._addJumpPad(24, 0, -22, 2.0, 14.2, 0xa855f7);
      this._addJumpPad(-24, 0, -22, 2.0, 14.2, 0x2de2ff);
      this._addBox(24, 4.2, -10, 6.5, 0.8, 6.5, { color: 0x38bdf8, studColor: 0x7dd3fc });
      this._addBox(24, 7.6, -2, 6.5, 0.8, 6.5, { color: 0xa855f7, studColor: 0xc084fc });
      this._addBox(16, 10.6, -24, 14, 0.9, 7, { color: 0xfbbf24, studColor: 0xfde047 });
      this._addBox(-16, 10.6, -24, 14, 0.9, 7, { color: 0xf43f5e, studColor: 0xfb7185 });
      this._addBox(0, 12.2, -26, 16, 0.9, 7.5, { color: 0xf8fafc, studColor: 0xffffff });
      this._addLadder(0, -22.2, 0, 12.4, 'z', 1.3);

      // Decorative Trees & Distant Skyline Towers
      for (const [tx, tz] of [[-26, 12], [26, 12], [-26, 24], [26, 24], [-26, -6], [26, -6]]) {
        this._addBox(tx, 2.0, tz, 1.1, 4.0, 1.1, { color: 0x784c2b });
        this._addBox(tx, 4.9, tz, 4.0, 2.6, 4.0, { color: 0x16a34a, studColor: 0x22c55e, solid: false });
      }
      for (const [sx, sz, sh] of [[-55, -52, 42], [55, -52, 48], [-58, 22, 34], [58, 26, 38], [0, -64, 52]]) {
        this._addBox(sx, sh / 2 - 4, sz, 14, sh, 14, { color: 0x1e293b, solid: false, castShadow: false });
        this._addBox(sx, sh - 3.5, sz, 14.5, 0.5, 14.5, { color: 0x2de2ff, emissive: 0x2de2ff, solid: false });
      }

      this.waypoints = [
        new THREE.Vector3(-12, 0, -12),
        new THREE.Vector3(0, 0, -15),
        new THREE.Vector3(12, 0, -12),
        new THREE.Vector3(-16, 0, 3),
        new THREE.Vector3(16, 0, 3),
        new THREE.Vector3(0, 0, 16),
        new THREE.Vector3(-9, 0, 7),
        new THREE.Vector3(9, 0, 7),
        new THREE.Vector3(-8, 0, -4),
        new THREE.Vector3(8, 0, -4),
        new THREE.Vector3(0, 0, 23),
      ];
    }

    // =========================================================
    // MAP 0: SHOOTING RANGE (Tactical Target Bays & Dummy Lanes)
    // =========================================================
    _buildShootingRangeMap() {
      this._setLighting({
        skyHex: 0x7ec8ff,
        fogHex: 0xa5dbff,
        hemiSky: 0xebf8ff,
        hemiGround: 0x475569,
        hemiInt: 1.02,
        sunHex: 0xfff8e6,
        sunInt: 1.35,
        sunPos: [26, 48, 28],
        clouds: true,
      });

      this.bounds = { minX: -72, maxX: 72, minZ: -82, maxZ: 72 };
      this.spawns = {
        player: new THREE.Vector3(0, 0, 26),
        bot: new THREE.Vector3(0, 0, -16),
      };

      // Outside lush Roblox grass world surrounding the Shooting Range (escapable!)
      this._addBox(0, -0.58, -4, 152, 1, 160, {
        color: 0x22c55e,
        studColor: 0x4ade80,
        solid: false,
        shootable: true,
        castShadow: false,
      });

      // Clean concrete range floor inside the compound
      this._addBox(0, -0.5, 0, 56, 1, 72, {
        color: 0xd1dae6,
        studColor: 0xdfe7f2,
        solid: false,
        shootable: true,
        castShadow: false,
      });

      // Glowing range distance lines (10m, 25m, 40m from firing bay)
      this._addBox(0, 0.02, 16, 52, 0.04, 0.45, { color: 0x2de2ff, emissive: 0x2de2ff, solid: false, castShadow: false });
      this._addBox(0, 0.02, 2, 52, 0.04, 0.35, { color: 0xfbbf24, emissive: 0xfbbf24, solid: false, castShadow: false });
      this._addBox(0, 0.02, -14, 52, 0.04, 0.35, { color: 0xff3e5e, emissive: 0xff3e5e, solid: false, castShadow: false });
      this._addBox(0, 0.02, -26, 52, 0.04, 0.4, { color: 0xa855f7, emissive: 0xa855f7, solid: false, castShadow: false });

      // Perimeter walls WITH a breached open escape doorway on the East wall (+X) & climbable wall tops!
      const wallH = 11;
      this._addBox(0, wallH / 2, -36, 58, wallH, 2, { color: 0x243044, studColor: 0x303f59 });
      this._addBox(0, wallH / 2, 36, 58, wallH, 2, { color: 0x243044, studColor: 0x303f59 });
      this._addBox(-28, wallH / 2, 0, 2, wallH, 72, { color: 0x243044, studColor: 0x303f59 });
      // Split East wall leaving a wide glowing ESCAPE BREACH at Z = [-18, -10]
      this._addBox(28, wallH / 2, -27, 2, wallH, 18, { color: 0x243044, studColor: 0x303f59 });
      this._addBox(28, wallH / 2, 13, 2, wallH, 46, { color: 0x243044, studColor: 0x303f59 });
      this._addBox(28, 8.2, -14, 2, 5.6, 8, { color: 0x243044, studColor: 0x303f59 });
      // Glowing green EXIT portal frame around the escape opening!
      this._addBox(27.2, 5.4, -14, 0.4, 0.35, 8.4, { color: 0x38ef7d, emissive: 0x38ef7d, solid: false });
      this._addBox(27.2, 2.7, -18.0, 0.4, 5.4, 0.35, { color: 0x38ef7d, emissive: 0x38ef7d, solid: false });
      this._addBox(27.2, 2.7, -10.0, 0.4, 5.4, 0.35, { color: 0x38ef7d, emissive: 0x38ef7d, solid: false });

      // Glowing wall accent strips
      this._addBox(0, 6.5, 34.9, 52, 0.35, 0.2, { color: 0x2de2ff, emissive: 0x2de2ff, solid: false });
      this._addBox(0, 6.5, -34.9, 52, 0.35, 0.2, { color: 0xfbbf24, emissive: 0xfbbf24, solid: false });
      this._addBox(-26.9, 6.5, 0, 0.2, 0.35, 68, { color: 0x38bdf8, emissive: 0x38bdf8, solid: false });

      // Firing line booths (waist-high weapon benches with open center walkout!)
      this._addBox(-11, 0.7, 21, 9, 1.4, 1.2, { color: 0x334155, studColor: 0x475569 });
      this._addBox(11, 0.7, 21, 9, 1.4, 1.2, { color: 0x334155, studColor: 0x475569 });
      this._addBox(-15.5, 1.7, 22.8, 0.7, 3.4, 4.4, { color: 0x1e293b });
      this._addBox(15.5, 1.7, 22.8, 0.7, 3.4, 4.4, { color: 0x1e293b });

      // Side Elevated Sniper Balcony (Left) with ramp + SUPER Roof-Escape Jump Pad!
      const balcY = 3.8;
      this._addBox(-21, balcY / 2, 10, 10, balcY, 14, { color: 0x3b4961, studColor: 0x4c5d7a });
      this._addRamp(-21, 21.5, 5.2, 9.0, 0, balcY, 'z', -1, { baseHex: '#475569', studHex: '#64748b', trimColor: 0x2de2ff });
      this._addJumpPad(-14, 0, 18, 1.8, 12.6, 0x2de2ff);
      // Launch right over the 11m Shooting Range perimeter wall from the balcony!
      this._addJumpPad(-22, balcY, 6, 2.0, 19.5, 0x38ef7d);
      // Tall 3-Story Sniper Watchtower perched on the West Balcony (Y = 8.4)!
      const watchY = 8.4;
      this._addBox(-23, watchY - 0.3, 14, 6.2, 0.6, 6.2, { color: 0x334155, studColor: 0x475569 });
      this._addBox(-23, watchY + 0.65, 11.2, 5.8, 1.3, 0.5, { color: 0x2de2ff, emissive: 0x0284c7, emissiveIntensity: 0.45 });
      this._addLadder(-20.0, 14, balcY, watchY + 0.2, 'x', 1.25);

      // Far Elevated Target Gallery Platform (North back wall at Y = 3.4)
      const backY = 3.4;
      this._addBox(0, backY / 2, -29, 34, backY, 8, { color: 0x334155, studColor: 0x475569 });
      this._addBox(0, backY + 0.05, -25.1, 34, 0.16, 0.25, { color: 0xfbbf24, emissive: 0xfbbf24, solid: false });
      this._addRamp(-21, -29, 5.0, 8.0, 0, backY, 'x', 1, { baseHex: '#475569', studHex: '#64748b', trimColor: 0xfbbf24 });
      this._addRamp(21, -29, 5.0, 8.0, 0, backY, 'x', -1, { baseHex: '#475569', studHex: '#64748b', trimColor: 0xfbbf24 });

      // Tactical CQC cover walls on right side for peek / shotgun / melee drills
      this._addBox(14, 1.6, 6, 3.6, 3.2, 1.4, { color: 0xd98a3c, studColor: 0xe69e53 });
      this._addBox(19, 1.6, -4, 3.6, 3.2, 1.4, { color: 0xd98a3c, studColor: 0xe69e53 });
      this._addBox(-7, 1.1, -6, 3.4, 2.2, 1.4, { color: 0x475569, studColor: 0x64748b });
      this._addBox(6, 1.1, -14, 3.4, 2.2, 1.4, { color: 0x475569, studColor: 0x64748b });

      // Decorative bullseye backboards on North wall
      for (const tx of [-12, 0, 12]) {
        this._addBox(tx, 7.2, -34.7, 4.4, 4.4, 0.25, { color: 0xffffff, solid: false });
        this._addBox(tx, 7.2, -34.55, 2.8, 2.8, 0.2, { color: 0xff3e5e, emissive: 0xff3e5e, emissiveIntensity: 0.45, solid: false });
        this._addBox(tx, 7.2, -34.4, 1.2, 1.2, 0.2, { color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.65, solid: false });
      }

      // === OUTSIDE ESCAPE WORLD (Beyond the Shooting Range Walls!) ===
      // Outside blocky Roblox trees & hills
      for (const [tx, tz] of [[44, -22], [54, 4], [46, 26], [-44, -18], [-48, 22], [0, -56], [-26, -58], [26, -58]]) {
        this._addBox(tx, 2.4, tz, 1.4, 4.8, 1.4, { color: 0x784c2b });
        this._addBox(tx, 5.8, tz, 5.0, 3.2, 5.0, { color: 0x15803d, studColor: 0x22c55e });
      }

      // Outside Sky Parkour Obby leading to the Secret Golden Boss Dummy Tower!
      this._addBox(42, 1.5, -14, 7, 3.0, 7, { color: 0x38bdf8, studColor: 0x7dd3fc });
      this._addRamp(35, -14, 4.4, 7.0, 0, 3.0, 'x', 1, { baseHex: '#38bdf8', studHex: '#7dd3fc', trimColor: 0x38ef7d });
      this._addBox(52, 4.5, -24, 7, 1.0, 7, { color: 0xa855f7, studColor: 0xc084fc });
      this._addBox(44, 7.5, -36, 7, 1.0, 7, { color: 0xfbbf24, studColor: 0xfde047 });
      this._addBox(30, 10.5, -48, 8, 1.0, 8, { color: 0xf43f5e, studColor: 0xfb7185 });
      // Secret Golden Boss Tower platform behind the North wall!
      this._addBox(0, 12.0, -56, 16, 1.2, 14, { color: 0xf59e0b, studColor: 0xfde047 });
      this._addBox(0, 11.2, -56, 16.4, 0.35, 14.4, { color: 0x2de2ff, emissive: 0x2de2ff, solid: false });
      // Jump Pads outside to soar onto the Golden Tower or back over the wall into the Range!
      this._addJumpPad(42, 3.0, -14, 2.0, 16.5, 0xa855f7);
      this._addJumpPad(0, 0, -45, 2.2, 22.0, 0xfbbf24);
      this._addJumpPad(-38, 0, 6, 2.2, 21.0, 0x38ef7d);

      this.waypoints = [
        new THREE.Vector3(-12, 0, 6),
        new THREE.Vector3(0, 0, 2),
        new THREE.Vector3(12, 0, -2),
        new THREE.Vector3(-10, 0, -14),
        new THREE.Vector3(10, 0, -14),
        new THREE.Vector3(0, backY, -28),
        new THREE.Vector3(-12, backY, -28),
        new THREE.Vector3(12, backY, -28),
      ];
    }

    // =========================================================
    // MAP 1: SKY ISLANDS (Floating Open-Air Islands Above Clouds!)
    // =========================================================
    _buildSkyIslandsMap() {
      this._setLighting({
        skyHex: 0x60c5ff,
        fogHex: 0x99dcff,
        hemiSky: 0xe8f8ff,
        hemiGround: 0x7dd3fc,
        hemiInt: 1.05,
        sunHex: 0xfff8dc,
        sunInt: 1.4,
        sunPos: [34, 52, 24],
        clouds: true,
        lowerClouds: true,
      });

      this.bounds = { minX: -40, maxX: 40, minZ: -44, maxZ: 44 };
      this.spawns = {
        player: new THREE.Vector3(0, 2.0, 24),
        bot: new THREE.Vector3(0, 2.0, -24),
      };

      // North & South Spawn Islands (floating at Y = 2.0)
      for (const zSign of [-1, 1]) {
        const accent = zSign > 0 ? 0x2de2ff : 0xff3e5e;
        this._addFloatingIsland(0, 2.0, zSign * 24, 15, 13);
        // Spawn stone cover wall & glowing sky beacon
        this._addBox(0, 3.4, zSign * 19.2, 5.8, 2.8, 1.2, { color: 0xe2e8f0, studColor: 0xf1f5f9 });
        this._addBox(0, 4.9, zSign * 19.2, 6.0, 0.2, 1.3, { color: accent, emissive: accent, solid: false });
        // Blocky Roblox trees on spawn islands
        this._addBox(-5.5, 3.6, zSign * 26.5, 1.0, 3.2, 1.0, { color: 0x784c2b });
        this._addBox(-5.5, 5.8, zSign * 26.5, 3.6, 2.2, 3.6, { color: 0x16a34a, studColor: 0x22c55e, solid: false });
        this._addBox(5.5, 3.6, zSign * 26.5, 1.0, 3.2, 1.0, { color: 0x784c2b });
        this._addBox(5.5, 5.8, zSign * 26.5, 3.6, 2.2, 3.6, { color: 0x16a34a, studColor: 0x22c55e, solid: false });
        // Jump pads launching toward side islands!
        this._addJumpPad(-5.2, 2.0, zSign * 21, 1.7, 13.5, 0x38bdf8);
        this._addJumpPad(5.2, 2.0, zSign * 21, 1.7, 13.5, 0x38bdf8);
      }

      // High Central Floating Sky Temple Island (Y = 4.6)
      this._addFloatingIsland(0, 4.6, 0, 15, 15, 0x38bdf8, 0x7dd3fc, 0x475569);
      // Marble Sky Temple Pillars + Golden Cap
      for (const [px, pz] of [[-5.2, -5.2], [5.2, -5.2], [-5.2, 5.2], [5.2, 5.2]]) {
        this._addBox(px, 6.8, pz, 1.3, 4.4, 1.3, { color: 0xf1f5f9, studColor: 0xffffff });
      }
      this._addBox(0, 9.2, 0, 13, 0.7, 13, { color: 0xfbbf24, studColor: 0xfde047 });
      // Center waist cover block
      this._addBox(0, 5.4, 0, 3.2, 1.6, 3.2, { color: 0xe2e8f0, studColor: 0xf8fafc });
      // Towering Upper Cloud Citadel Peak (Y = 13.4!) reachable by ladder, Double Jump, or Launch Pads!
      this._addLadder(0, 6.4, 4.6, 9.8, 'z', 1.2);
      this._addFloatingIsland(0, 13.4, 0, 8.5, 8.5, 0xfbbf24, 0xfde047, 0x64748b);
      this._addJumpPad(0, 9.55, -4.5, 1.6, 12.0, 0x38bdf8);
      this._addJumpPad(0, 9.55, 4.5, 1.6, 12.0, 0x38bdf8);

      // Sweeping Floating Sky Bridges connecting Spawn Islands to Center Island
      this._addRamp(0, 12.5, 5.2, 10.5, 2.0, 4.6, 'z', -1, { baseHex: '#d97706', studHex: '#f59e0b', trimColor: 0x2de2ff });
      this._addRamp(0, -12.5, 5.2, 10.5, 2.0, 4.6, 'z', 1, { baseHex: '#d97706', studHex: '#f59e0b', trimColor: 0xff3e5e });

      // 2 Elevated Side Sniper Islands (Y = 6.2) with floating bridges to Center!
      for (const xSign of [-1, 1]) {
        this._addFloatingIsland(xSign * 21, 6.2, 0, 11, 13);
        this._addBox(xSign * 18.5, 7.6, 0, 1.2, 2.8, 5.2, { color: 0xe2e8f0, studColor: 0xf1f5f9 });
        this._addRamp(xSign * 11.5, 0, 4.4, 8.2, 4.6, 6.2, 'x', xSign, { baseHex: '#94a3b8', studHex: '#cbd5e1', trimColor: 0xfde047 });
        // Wind launch pad on side islands up to the central temple roof!
        this._addJumpPad(xSign * 21, 6.2, 4.2, 1.7, 12.8, 0xa855f7);
        this._addJumpPad(xSign * 21, 6.2, -4.2, 1.7, 12.8, 0xa855f7);
      }

      this.waypoints = [
        new THREE.Vector3(0, 4.6, 0),
        new THREE.Vector3(-4, 4.6, 4),
        new THREE.Vector3(4, 4.6, -4),
        new THREE.Vector3(0, 2.0, 23),
        new THREE.Vector3(0, 2.0, -23),
        new THREE.Vector3(-21, 6.2, 0),
        new THREE.Vector3(21, 6.2, 0),
      ];
    }

    // =========================================================
    // MAP 2: CLOUD SPIRE (Multi-Tier Airborne Sky Citadel!)
    // =========================================================
    _buildCloudSpireMap() {
      this._setLighting({
        skyHex: 0x3b82f6,
        fogHex: 0x93c5fd,
        hemiSky: 0xf0f9ff,
        hemiGround: 0x60a5fa,
        hemiInt: 1.08,
        sunHex: 0xfffbeb,
        sunInt: 1.38,
        sunPos: [-28, 56, 20],
        clouds: true,
        lowerClouds: true,
      });

      this.bounds = { minX: -40, maxX: 40, minZ: -44, maxZ: 44 };
      this.spawns = {
        player: new THREE.Vector3(0, 4.0, 23),
        bot: new THREE.Vector3(0, 4.0, -23),
      };

      // Lower Floating Sky Deck (Y = 4.0)
      this._addBox(0, 3.5, 0, 22, 1.0, 56, { color: 0xe2e8f0, studColor: 0xf8fafc });
      this._addBox(0, 2.8, 0, 22.4, 0.35, 56.4, { color: 0x2de2ff, emissive: 0x2de2ff, solid: false });

      // Side Open-Air Wing Platforms (Y = 8.4)
      for (const xSign of [-1, 1]) {
        this._addBox(xSign * 22, 7.9, 0, 12, 1.0, 28, { color: 0x1e293b, studColor: 0x334155 });
        this._addBox(xSign * 22, 7.2, 0, 12.4, 0.3, 28.4, { color: 0xa855f7, emissive: 0xa855f7, solid: false });
        // Glass Energy Bridges from main deck up to side wings!
        this._addRamp(xSign * 13.5, 8, 4.6, 5.8, 4.0, 8.4, 'x', xSign, { baseHex: '#38bdf8', studHex: '#7dd3fc', trimColor: 0x2de2ff });
        this._addRamp(xSign * 13.5, -8, 4.6, 5.8, 4.0, 8.4, 'x', xSign, { baseHex: '#38bdf8', studHex: '#7dd3fc', trimColor: 0x2de2ff });
        // Cover walls on side wings
        this._addBox(xSign * 19, 9.6, 0, 1.2, 2.4, 6.0, { color: 0x475569, studColor: 0x64748b });
      }

      // Towering Upper Sky Crown Platform (Y = 12.6!)
      this._addBox(0, 12.1, 0, 16, 1.0, 16, { color: 0xf8fafc, studColor: 0xffffff });
      this._addBox(0, 11.4, 0, 16.4, 0.35, 16.4, { color: 0xfbbf24, emissive: 0xfbbf24, solid: false });
      this._addBox(-4.5, 13.6, 0, 1.6, 2.0, 4.8, { color: 0x38bdf8, studColor: 0x7dd3fc });
      this._addBox(4.5, 13.6, 0, 1.6, 2.0, 4.8, { color: 0x38bdf8, studColor: 0x7dd3fc });
      // Stratosphere Needle Peak (Y = 18.2!) soaring above the Sky Crown!
      this._addBox(0, 17.8, 0, 9.5, 0.8, 9.5, { color: 0x0f172a, studColor: 0x1e293b });
      this._addBox(0, 17.2, 0, 9.8, 0.25, 9.8, { color: 0x2de2ff, emissive: 0x2de2ff, solid: false });
      this._addJumpPad(0, 12.6, 5.6, 1.7, 13.4, 0x2de2ff);
      this._addJumpPad(0, 12.6, -5.6, 1.7, 13.4, 0xff3e5e);

      // Launch pads shooting players straight up to the Sky Crown (Y=12.6) & Side Wings (Y=8.4)!
      this._addJumpPad(0, 4.0, 13, 2.1, 15.6, 0x2de2ff);
      this._addJumpPad(0, 4.0, -13, 2.1, 15.6, 0xff3e5e);
      this._addJumpPad(-22, 8.4, 0, 1.9, 13.2, 0xfbbf24);
      this._addJumpPad(22, 8.4, 0, 1.9, 13.2, 0xfbbf24);

      // Main Deck Cover Blocks
      for (const zSign of [-1, 1]) {
        const accent = zSign > 0 ? 0x2de2ff : 0xff3e5e;
        this._addBox(0, 5.4, zSign * 18.5, 7.2, 2.8, 1.3, { color: 0x334155, studColor: 0x475569 });
        this._addBox(0, 6.9, zSign * 18.5, 7.4, 0.2, 1.4, { color: accent, emissive: accent, solid: false });
        this._addBox(-6.5, 5.1, zSign * 7, 2.6, 2.2, 2.6, { color: 0x38bdf8, studColor: 0x7dd3fc });
        this._addBox(6.5, 5.1, zSign * 7, 2.6, 2.2, 2.6, { color: 0x38bdf8, studColor: 0x7dd3fc });
      }

      // Decorative Floating Sky Monoliths in the distance
      for (const [mx, my, mz] of [[-36, 10, -28], [36, 12, -26], [-36, 11, 28], [36, 9, 26]]) {
        this._addBox(mx, my, mz, 4.5, 16, 4.5, { color: 0x1e293b, solid: false });
        this._addBox(mx, my + 8.5, mz, 4.8, 0.5, 4.8, { color: 0x2de2ff, emissive: 0x2de2ff, solid: false });
      }

      this.waypoints = [
        new THREE.Vector3(0, 12.6, 0),
        new THREE.Vector3(0, 4.0, 0),
        new THREE.Vector3(0, 4.0, 13),
        new THREE.Vector3(0, 4.0, -13),
        new THREE.Vector3(-22, 8.4, 0),
        new THREE.Vector3(22, 8.4, 0),
        new THREE.Vector3(-6, 4.0, 20),
        new THREE.Vector3(6, 4.0, -20),
      ];
    }

    // =========================================================
    // MAP 3: CLASSIC ARENA
    // =========================================================
    _buildClassicArenaMap() {
      this._setLighting({
        skyHex: 0x8bc6ff,
        fogHex: 0x98ceff,
        hemiSky: 0xdff2ff,
        hemiGround: 0x4b5568,
        hemiInt: 0.95,
        sunHex: 0xfff7e6,
        sunInt: 1.35,
        sunPos: [28, 46, 22],
        clouds: true,
      });

      this._addBox(0, -0.5, 0, 56, 1, 72, {
        color: 0xcfd7e6,
        studColor: 0xdde5f2,
        solid: false,
        shootable: true,
        castShadow: false,
      });

      this._addBox(0, 0.02, 0, 54, 0.04, 0.45, { color: 0xffffff, emissive: 0xffffff, solid: false, castShadow: false });
      this._addBox(0, 0.02, 22, 54, 0.04, 0.35, { color: 0x2de2ff, emissive: 0x2de2ff, solid: false, castShadow: false });
      this._addBox(0, 0.02, -22, 54, 0.04, 0.35, { color: 0xff3e5e, emissive: 0xff3e5e, solid: false, castShadow: false });

      this._addPerimeter(11, 0x243044, 0x2d3b52, 0x2de2ff, 0xff3e5e, 0x3b82f6);

      const bridgeY = 3.6;
      this._addBox(0, bridgeY - 0.3, 0, 14, 0.6, 8, { color: 0x3e4c63, studColor: 0x4b5b76 });
      this._addBox(-3.5, bridgeY + 0.65, 0, 2.2, 1.3, 1.1, { color: 0xffb830, studColor: 0xffca5c });
      this._addBox(3.5, bridgeY + 0.65, 0, 2.2, 1.3, 1.1, { color: 0xffb830, studColor: 0xffca5c });

      for (const [px, pz] of [[-6, -3.2], [6, -3.2], [-6, 3.2], [6, 3.2]]) {
        this._addBox(px, bridgeY / 2 - 0.3, pz, 1.4, bridgeY - 0.6, 1.4, { color: 0x263144 });
      }

      this._addRamp(-11.5, 0, 6.2, 9.0, 0, bridgeY, 'x', 1);
      this._addRamp(11.5, 0, 6.2, 9.0, 0, bridgeY, 'x', -1);

      // 2nd-Story High Sky Arch Overpass (Y = 8.2!) above the center bridge!
      const highY = 8.2;
      this._addBox(0, highY - 0.3, 0, 22, 0.6, 4.6, { color: 0x2a374f, studColor: 0x3b4d6d });
      this._addBox(0, highY - 0.65, 0, 22.4, 0.2, 4.8, { color: 0x2de2ff, emissive: 0x2de2ff, solid: false });
      this._addBox(-5.5, highY + 0.65, 0, 1.8, 1.3, 1.2, { color: 0x2de2ff, studColor: 0x7dd3fc });
      this._addBox(5.5, highY + 0.65, 0, 1.8, 1.3, 1.2, { color: 0xff3e5e, studColor: 0xfb7185 });
      this._addJumpPad(-18, 0, 0, 1.9, 14.8, 0x2de2ff);
      this._addJumpPad(18, 0, 0, 1.9, 14.8, 0x2de2ff);
      this._addLadder(-6.5, 0, bridgeY, highY + 0.2, 'x', 1.2);
      this._addLadder(6.5, 0, bridgeY, highY + 0.2, 'x', 1.2);

      for (const zSign of [-1, 1]) {
        const teamAccent = zSign > 0 ? 0x2de2ff : 0xff3e5e;
        const wallTint = zSign > 0 ? 0x2e4a69 : 0x633344;
        const wallStud = zSign > 0 ? 0x395c82 : 0x7a3f54;

        this._addBox(0, 1.5, zSign * 21, 7.5, 3.0, 1.4, { color: wallTint, studColor: wallStud });
        this._addBox(0, 3.1, zSign * 21, 7.6, 0.2, 1.5, { color: teamAccent, emissive: teamAccent, solid: false });

        this._addBox(-11, 2.4, zSign * 13, 3.2, 4.8, 3.2, { color: 0x425069, studColor: 0x51627f });
        this._addBox(11, 2.4, zSign * 13, 3.2, 4.8, 3.2, { color: 0x425069, studColor: 0x51627f });

        this._addBox(-5.5, 0.9, zSign * 11, 2.2, 1.8, 2.2, { color: 0xd98a3c, studColor: 0xe69e53 });
        this._addBox(5.5, 0.9, zSign * 11, 2.2, 1.8, 2.2, { color: 0xd98a3c, studColor: 0xe69e53 });

        this._addBox(-20, 1.75, zSign * 18, 4.5, 3.5, 1.6, { color: 0x3d4b63, studColor: 0x4d5e7a });
        this._addBox(20, 1.75, zSign * 18, 4.5, 3.5, 1.6, { color: 0x3d4b63, studColor: 0x4d5e7a });

        const perchY = 2.8;
        this._addBox(-21, perchY / 2, zSign * 29, 9, perchY, 8, { color: 0x39475e, studColor: 0x465773 });
        this._addRamp(-13, zSign * 29, 4.6, 7.2, 0, perchY, 'x', -1);

        this._addBox(21, perchY / 2, zSign * 29, 9, perchY, 8, { color: 0x39475e, studColor: 0x465773 });
        this._addRamp(13, zSign * 29, 4.6, 7.2, 0, perchY, 'x', 1);
      }

      this._addBox(0, 0.85, 0, 2.6, 1.7, 2.6, { color: 0xd98a3c, studColor: 0xe69e53 });

      this.waypoints = [
        new THREE.Vector3(0, 3.6, 0),
        new THREE.Vector3(-16, 0, 0),
        new THREE.Vector3(16, 0, 0),
        new THREE.Vector3(-8, 0, -16),
        new THREE.Vector3(8, 0, -16),
        new THREE.Vector3(-8, 0, 16),
        new THREE.Vector3(8, 0, 16),
        new THREE.Vector3(-21, 2.8, -29),
        new THREE.Vector3(21, 2.8, -29),
      ];
    }

    // =========================================================
    // MAP 4: ORBITAL ZERO-G (Space Anti-Gravity Station)
    // =========================================================
    _buildOrbitalMap() {
      this._setLighting({
        skyHex: 0x050816,
        fogHex: 0x070c21,
        hemiSky: 0x93c5fd,
        hemiGround: 0x1e1b4b,
        hemiInt: 0.85,
        sunHex: 0xe0f2fe,
        sunInt: 1.25,
        sunPos: [30, 48, 25],
        clouds: false,
        stars: true,
      });

      this._addBox(0, -0.5, 0, 56, 1, 72, {
        color: 0x1e293b,
        studColor: 0x334155,
        metalness: 0.4,
        roughness: 0.5,
        solid: false,
        shootable: true,
        castShadow: false,
      });

      this._addPerimeter(6.5, 0x172033, 0x24324d, 0x38bdf8, 0xf43f5e, 0xa855f7);
      this._addBox(0, 10, -35.5, 56, 7, 0.2, { color: 0xa855f7, emissive: 0xa855f7, emissiveIntensity: 0.25, opacity: 0.14, solid: false });
      this._addBox(0, 10, 35.5, 56, 7, 0.2, { color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.25, opacity: 0.14, solid: false });

      const coreY = 6.2;
      this._addBox(0, coreY - 0.35, 0, 13, 0.7, 13, { color: 0x334155, studColor: 0x475569, metalness: 0.5 });
      this._addBox(0, coreY - 0.75, 0, 13.4, 0.22, 13.4, { color: 0x38bdf8, emissive: 0x38bdf8, solid: false });
      this._addBox(0, coreY + 1.1, 0, 2.2, 2.2, 2.2, { color: 0x1e1b4b, studColor: 0x4338ca });
      this._addBox(0, coreY + 2.35, 0, 2.3, 0.25, 2.3, { color: 0xc084fc, emissive: 0xc084fc, solid: false });

      // High Orbit Command Deck (Y = 12.0!) floating high above the Zero-G core!
      const orbitY = 12.0;
      this._addBox(0, orbitY - 0.35, 0, 11, 0.7, 11, { color: 0x1e293b, studColor: 0x334155, metalness: 0.6 });
      this._addBox(0, orbitY - 0.75, 0, 11.4, 0.22, 11.4, { color: 0xc084fc, emissive: 0xc084fc, solid: false });
      this._addJumpPad(-5.2, coreY, 0, 1.6, 11.2, 0xc084fc);
      this._addJumpPad(5.2, coreY, 0, 1.6, 11.2, 0xc084fc);

      const padY = 4.6;
      for (const [ax, az] of [[-17, -14], [17, -14], [-17, 14], [17, 14]]) {
        this._addBox(ax, padY - 0.4, az, 9.5, 0.8, 9.5, { color: 0x475569, studColor: 0x64748b });
        this._addBox(ax, padY - 0.85, az, 9.8, 0.2, 9.8, { color: 0xa855f7, emissive: 0xa855f7, solid: false });
        this._addBox(ax, padY + 0.85, az > 0 ? az - 3.8 : az + 3.8, 4.2, 1.7, 0.6, {
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.45,
          opacity: 0.78,
        });
      }

      this._addJumpPad(-17, 0, 0, 2.2, 13.5, 0xa855f7);
      this._addJumpPad(17, 0, 0, 2.2, 13.5, 0xa855f7);
      this._addJumpPad(0, 0, 15, 2.2, 14.2, 0x38bdf8);
      this._addJumpPad(0, 0, -15, 2.2, 14.2, 0xf43f5e);

      for (const zSign of [-1, 1]) {
        this._addBox(0, 1.4, zSign * 23, 8.0, 2.8, 1.4, { color: 0x334155, studColor: 0x475569 });
        this._addBox(-9.5, 1.2, zSign * 10, 3.0, 2.4, 3.0, { color: 0x4338ca, studColor: 0x6366f1 });
        this._addBox(9.5, 1.2, zSign * 10, 3.0, 2.4, 3.0, { color: 0x4338ca, studColor: 0x6366f1 });
      }

      this.waypoints = [
        new THREE.Vector3(0, coreY, 0),
        new THREE.Vector3(-17, padY, -14),
        new THREE.Vector3(17, padY, -14),
        new THREE.Vector3(-17, padY, 14),
        new THREE.Vector3(17, padY, 14),
        new THREE.Vector3(-17, 0, 0),
        new THREE.Vector3(17, 0, 0),
        new THREE.Vector3(0, 0, 15),
        new THREE.Vector3(0, 0, -15),
      ];
    }

    // =========================================================
    // MAP 5: JADE COURTYARD (Eastern Palace & Pagodas)
    // =========================================================
    _buildJadeCourtyardMap() {
      this._setLighting({
        skyHex: 0xff8a65,
        fogHex: 0xf4a27e,
        hemiSky: 0xffe8c2,
        hemiGround: 0x3d241b,
        hemiInt: 0.96,
        sunHex: 0xffd580,
        sunInt: 1.4,
        sunPos: [-32, 36, -24],
        clouds: true,
      });

      this._addBox(0, -0.5, 0, 56, 1, 72, {
        color: 0xb7c0b8,
        studColor: 0xcad3cb,
        solid: false,
        shootable: true,
        castShadow: false,
      });

      this._addBox(0, 0.03, 0, 26, 0.06, 22, {
        color: 0x0d9488,
        emissive: 0x14b8a6,
        emissiveIntensity: 0.22,
        solid: false,
        castShadow: false,
      });
      for (const [lx, lz] of [[-8, -6], [8, -6], [-9, 6], [9, 6], [-4, -8], [5, 8]]) {
        this._addBox(lx, 0.08, lz, 2.2, 0.08, 2.2, { color: 0x15803d, solid: false, castShadow: false });
        this._addBox(lx, 0.22, lz, 0.7, 0.28, 0.7, { color: 0xf472b6, emissive: 0xf43f5e, emissiveIntensity: 0.4, solid: false, castShadow: false });
      }

      this._addPerimeter(10.5, 0x7f1d1d, 0x991b1b, 0xfbbf24, 0xfbbf24, 0xf59e0b);

      const bridgeY = 2.6;
      this._addBox(0, bridgeY - 0.25, 0, 7.6, 0.5, 11, { color: 0xe2e8f0, studColor: 0xf1f5f9 });
      this._addBox(-3.6, bridgeY + 0.55, 0, 0.35, 1.1, 11, { color: 0xb91c1c });
      this._addBox(3.6, bridgeY + 0.55, 0, 0.35, 1.1, 11, { color: 0xb91c1c });
      this._addRamp(0, 9.2, 7.2, 7.5, 0, bridgeY, 'z', -1, { baseHex: '#cbd5e1', studHex: '#e2e8f0', trimColor: 0xb91c1c });
      this._addRamp(0, -9.2, 7.2, 7.5, 0, bridgeY, 'z', 1, { baseHex: '#cbd5e1', studHex: '#e2e8f0', trimColor: 0xb91c1c });

      const deckY = 3.8;
      for (const xSign of [-1, 1]) {
        const px = xSign * 20;
        this._addBox(px, deckY / 2, 0, 10, deckY, 16, { color: 0x64748b, studColor: 0x7c8ca3 });
        for (const [dx, dz] of [[-4, -6.5], [4, -6.5], [-4, 6.5], [4, 6.5]]) {
          this._addBox(px + dx, deckY + 2.3, dz, 0.9, 4.6, 0.9, { color: 0xb91c1c });
        }
        this._addBox(px, deckY + 4.9, 0, 12.2, 0.7, 18.2, { color: 0xd97706, studColor: 0xf59e0b });
        this._addBox(px, deckY + 5.7, 0, 8.6, 0.9, 13.4, { color: 0xf59e0b, studColor: 0xfbbf24 });
        for (const lz of [-6.5, 0, 6.5]) {
          this._addBox(px - xSign * 4.9, deckY + 3.6, lz, 0.7, 0.95, 0.7, {
            color: 0xff2a2a,
            emissive: 0xff3b1f,
            emissiveIntensity: 1.0,
            solid: false,
          });
        }
        this._addRamp(px, 12.2, 5.5, 8.4, 0, deckY, 'z', -1, { baseHex: '#991b1b', studHex: '#b91c1c', trimColor: 0xfbbf24 });
        this._addRamp(px, -12.2, 5.5, 8.4, 0, deckY, 'z', 1, { baseHex: '#991b1b', studHex: '#b91c1c', trimColor: 0xfbbf24 });
        // Climbable Ladder right up onto the Golden Pagoda Rooftop + 3rd Tier Spire (Y = 12.6)!
        this._addLadder(px - xSign * 5.1, 0, deckY, deckY + 5.6, 'x', 1.25);
        this._addBox(px, deckY + 8.6, 0, 5.6, 0.7, 7.6, { color: 0xf59e0b, studColor: 0xfde047 });
        this._addJumpPad(px, deckY + 5.25, 4.2, 1.5, 11.2, 0xfbbf24);
      }

      this._addJumpPad(-12.5, 0, 0, 1.9, 14.2, 0x34d399);
      this._addJumpPad(12.5, 0, 0, 1.9, 14.2, 0x34d399);

      for (const zSign of [-1, 1]) {
        this._addBox(-5.2, 2.8, zSign * 22, 1.3, 5.6, 1.3, { color: 0xb91c1c });
        this._addBox(5.2, 2.8, zSign * 22, 1.3, 5.6, 1.3, { color: 0xb91c1c });
        this._addBox(0, 5.8, zSign * 22, 13.5, 1.0, 1.8, { color: 0xd97706, studColor: 0xf59e0b });
        this._addBox(0, 1.35, zSign * 22, 5.2, 2.7, 1.1, { color: 0x7f1d1d, studColor: 0x991b1b });

        for (const bx of [-10, 10]) {
          this._addBox(bx, 2.1, zSign * 16, 2.4, 4.2, 2.4, { color: 0x15803d, studColor: 0x22c55e });
        }
        this._addBox(-17, 1.4, zSign * 24, 3.6, 2.8, 2.4, { color: 0x64748b, studColor: 0x94a3b8 });
        this._addBox(17, 1.4, zSign * 24, 3.6, 2.8, 2.4, { color: 0x64748b, studColor: 0x94a3b8 });
      }

      this.waypoints = [
        new THREE.Vector3(0, bridgeY, 0),
        new THREE.Vector3(-20, deckY, 0),
        new THREE.Vector3(20, deckY, 0),
        new THREE.Vector3(-20, deckY + 5.25, 0),
        new THREE.Vector3(20, deckY + 5.25, 0),
        new THREE.Vector3(-12.5, 0, 0),
        new THREE.Vector3(12.5, 0, 0),
        new THREE.Vector3(-9, 0, -21),
        new THREE.Vector3(9, 0, -21),
        new THREE.Vector3(-9, 0, 21),
        new THREE.Vector3(9, 0, 21),
      ];
    }

    // =========================================================
    // MAP 6: NEON STATION
    // =========================================================
    _buildStationMap() {
      this._setLighting({
        skyHex: 0x0b1024,
        fogHex: 0x101733,
        hemiSky: 0x7dd3fc,
        hemiGround: 0x1e1b4b,
        hemiInt: 0.78,
        sunHex: 0xd8b4fe,
        sunInt: 1.05,
        sunPos: [-22, 42, 18],
        clouds: false,
      });

      this._addBox(0, -0.5, 0, 56, 1, 72, {
        color: 0x1d2438,
        studColor: 0x26304a,
        solid: false,
        shootable: true,
        castShadow: false,
      });

      // Glowing Express Rail Tracks on West (-7.4) & East (+7.4) lanes!
      const westLights = [];
      const eastLights = [];
      for (const [laneX, arr] of [[-7.4, westLights], [7.4, eastLights]]) {
        this._addBox(laneX - 1.35, 0.04, 0, 0.24, 0.08, 68, { color: 0x00f5ff, emissive: 0x00f5ff, solid: false, castShadow: false });
        this._addBox(laneX + 1.35, 0.04, 0, 0.24, 0.08, 68, { color: 0x00f5ff, emissive: 0x00f5ff, solid: false, castShadow: false });
        // Warning danger strips that flash red when Express Train is incoming!
        for (const wz of [-24, -12, 0, 12, 24]) {
          const warn = this._addBox(laneX, 0.05, wz, 2.5, 0.06, 0.9, {
            color: 0xff2a4b,
            emissive: 0xff2a4b,
            emissiveIntensity: 0.15,
            solid: false,
            castShadow: false,
          });
          arr.push(warn);
        }
        // Dark Tunnel Arches on North & South Walls where the train enters/exits
        this._addBox(laneX, 2.2, -34.8, 4.8, 4.4, 0.5, { color: 0x05070e, solid: false });
        this._addBox(laneX, 2.2, 34.8, 4.8, 4.4, 0.5, { color: 0x05070e, solid: false });
      }

      // Build the Live Speeding Neon Express Train!
      const trainGroup = new THREE.Group();
      const tBody = new THREE.Mesh(
        new THREE.BoxGeometry(4.1, 3.6, 26),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.25 })
      );
      tBody.position.set(0, 1.85, 0);
      tBody.castShadow = true;
      const tStripe = new THREE.Mesh(
        new THREE.BoxGeometry(4.22, 0.45, 25.4),
        new THREE.MeshStandardMaterial({ color: 0xff2a55, emissive: 0xff2a55, emissiveIntensity: 1.2 })
      );
      tStripe.position.set(0, 2.2, 0);
      const tWindows = new THREE.Mesh(
        new THREE.BoxGeometry(4.18, 0.95, 22),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.95 })
      );
      tWindows.position.set(0, 2.85, 0);
      const tHeadlight = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 0.75, 0.3),
        new THREE.MeshBasicMaterial({ color: 0xfff8c5 })
      );
      tHeadlight.position.set(0, 1.15, 13.05);
      const tLight = new THREE.PointLight(0xff3e5e, 3.5, 18);
      tLight.position.set(0, 2.2, 13.5);
      trainGroup.add(tBody, tStripe, tWindows, tHeadlight, tLight);
      trainGroup.visible = false;
      this.mapGroup.add(trainGroup);

      this.trainHazard = {
        group: trainGroup,
        westLights,
        eastLights,
        state: 'idle',
        timer: 4.5,
        laneIndex: 0,
        laneX: -7.4,
        dirZ: 1,
        z: -54,
        speed: 54,
      };

      this._addPerimeter(13, 0x151b2e, 0x1d2640, 0x00f5ff, 0xf43f5e, 0xc084fc);

      for (const z of [-24, -8, 8, 24]) {
        this._addBox(0, 12.2, z, 54, 0.65, 1.1, { color: 0x1c233b, solid: false });
        this._addBox(0, 11.75, z, 42, 0.22, 0.35, {
          color: z % 16 === 0 ? 0x00f5ff : 0xd946ef,
          emissive: z % 16 === 0 ? 0x00f5ff : 0xd946ef,
          solid: false,
        });
      }

      const platY = 2.4;
      this._addBox(-19.5, platY / 2, 0, 15, platY, 54, { color: 0x2b344d, studColor: 0x364261 });
      this._addBox(19.5, platY / 2, 0, 15, platY, 54, { color: 0x2b344d, studColor: 0x364261 });
      this._addBox(-12.2, platY + 0.03, 0, 0.45, 0.06, 54, { color: 0xfacc15, emissive: 0xfacc15, solid: false });
      this._addBox(12.2, platY + 0.03, 0, 0.45, 0.06, 54, { color: 0xfacc15, emissive: 0xfacc15, solid: false });

      for (const zSign of [-1, 1]) {
        this._addRamp(-19.5, zSign * 30.2, 7.0, 6.4, 0, platY, 'z', -zSign, { baseHex: '#2c3652', studHex: '#3b486b', trimColor: 0x00f5ff });
        this._addRamp(19.5, zSign * 30.2, 7.0, 6.4, 0, platY, 'z', -zSign, { baseHex: '#2c3652', studHex: '#3b486b', trimColor: 0xd946ef });
      }

      for (const xSign of [-1, 1]) {
        for (const z of [-14, 0, 14]) {
          this._addBox(xSign * 18.5, platY + 1.6, z, 2.8, 3.2, 2.8, { color: 0x1e2942, studColor: 0x2a3859 });
          this._addBox(xSign * 18.5, platY + 3.25, z, 2.9, 0.18, 2.9, {
            color: xSign > 0 ? 0xd946ef : 0x00f5ff,
            emissive: xSign > 0 ? 0xd946ef : 0x00f5ff,
            solid: false,
          });
        }
      }

      const trainH = 3.4;
      this._addBox(0, trainH / 2, 0, 5.8, trainH, 20, { color: 0x334155, studColor: 0x475569 });
      this._addBox(2.96, 2.1, 0, 0.1, 1.0, 16, { color: 0x38bdf8, emissive: 0x38bdf8, solid: false });
      this._addBox(-2.96, 2.1, 0, 0.1, 1.0, 16, { color: 0x38bdf8, emissive: 0x38bdf8, solid: false });
      this._addBox(0, 1.0, 10.05, 4.4, 0.5, 0.15, { color: 0x2de2ff, emissive: 0x2de2ff, solid: false });
      this._addBox(0, 1.0, -10.05, 4.4, 0.5, 0.15, { color: 0xff3e5e, emissive: 0xff3e5e, solid: false });
      this._addRamp(0, 14.5, 4.8, 9.0, 0, trainH, 'z', -1, { baseHex: '#334155', studHex: '#475569', trimColor: 0x2de2ff });
      this._addRamp(0, -14.5, 4.8, 9.0, 0, trainH, 'z', 1, { baseHex: '#334155', studHex: '#475569', trimColor: 0xff3e5e });

      // Upper Neon Skywalk Concourse (Y = 7.6!) spanning high above BOTH Express Train tracks!
      const skywalkY = 7.6;
      this._addBox(0, skywalkY - 0.3, 0, 38, 0.6, 5.2, { color: 0x1e293b, studColor: 0x334155 });
      this._addBox(0, skywalkY - 0.65, 0, 38.4, 0.2, 5.4, { color: 0x00f5ff, emissive: 0x00f5ff, solid: false });
      this._addBox(-5.5, skywalkY + 0.65, 0, 1.8, 1.3, 1.4, { color: 0xd946ef, studColor: 0xe879f9 });
      this._addBox(5.5, skywalkY + 0.65, 0, 1.8, 1.3, 1.4, { color: 0x00f5ff, studColor: 0x7dd3fc });
      this._addJumpPad(-16, platY, 0, 1.8, 13.0, 0x00f5ff);
      this._addJumpPad(16, platY, 0, 1.8, 13.0, 0xd946ef);
      this._addLadder(-18.5, 3.0, platY, skywalkY + 0.2, 'z', 1.2);
      this._addLadder(18.5, -3.0, platY, skywalkY + 0.2, 'z', 1.2);

      for (const zSign of [-1, 1]) {
        // Keep Express Tracks at X = ±7.4 completely clear; place spawn cover in center!
        this._addBox(0, 1.4, zSign * 23, 6.2, 2.8, 1.4, { color: 0x2c3652, studColor: 0x3b486b });
      }

      this.waypoints = [
        new THREE.Vector3(0, trainH, 0),
        new THREE.Vector3(-19, platY, 0),
        new THREE.Vector3(19, platY, 0),
        new THREE.Vector3(-19, platY, -18),
        new THREE.Vector3(19, platY, -18),
        new THREE.Vector3(-19, platY, 18),
        new THREE.Vector3(19, platY, 18),
        new THREE.Vector3(-7, 0, 0),
        new THREE.Vector3(7, 0, 0),
      ];
    }

    // =========================================================
    // MAP 7: CONSTRUCTION (High-Altitude Airborne Skyscraper!)
    // =========================================================
    _buildConstructionMap() {
      this._setLighting({
        skyHex: 0xff9254,
        fogHex: 0xf9ab7d,
        hemiSky: 0xffe8c2,
        hemiGround: 0x7c4a2d,
        hemiInt: 0.98,
        sunHex: 0xffd48a,
        sunInt: 1.42,
        sunPos: [-35, 36, -25],
        clouds: true,
        lowerClouds: true,
      });

      this.bounds = { minX: -40, maxX: 40, minZ: -44, maxZ: 44 };
      this.spawns = {
        player: new THREE.Vector3(0, 4.0, 22),
        bot: new THREE.Vector3(0, 4.0, -22),
      };

      // Distant city skyscraper silhouettes far BELOW in the sunset haze!
      for (const [bx, bz, bw, bd, bh] of [
        [-42, -32, 12, 12, 24],
        [44, -26, 14, 12, 28],
        [-46, 26, 14, 14, 22],
        [42, 30, 12, 14, 26],
        [0, -54, 18, 12, 24],
        [0, 54, 18, 12, 24],
      ]) {
        this._addBox(bx, -26 + bh / 2, bz, bw, bh, bd, { color: 0x475569, solid: false, castShadow: false });
      }

      // Main Floating Concrete Skyscraper Floor Deck (Y = 4.0)
      this._addBox(0, 3.4, 0, 26, 1.2, 54, { color: 0x9aa3b0, studColor: 0xaab4c2 });
      // Yellow/black hazard safety trim along open sky edges
      this._addBox(-13.1, 3.85, 0, 0.35, 0.35, 54.2, { color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.5, solid: false });
      this._addBox(13.1, 3.85, 0, 0.35, 0.35, 54.2, { color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.5, solid: false });
      // Under-deck steel support girders suspended in open air
      this._addBox(0, 2.2, -16, 24, 1.2, 1.4, { color: 0x334155, solid: false });
      this._addBox(0, 2.2, 0, 24, 1.2, 1.4, { color: 0x334155, solid: false });
      this._addBox(0, 2.2, 16, 24, 1.2, 1.4, { color: 0x334155, solid: false });

      // Towering Hollow Climbable Yellow Construction Crane WITH A LADDER INSIDE!
      const craneY = 15.6;
      const mastX = -11.2;
      const mastZ = 0;
      const mastBase = 4.0;
      const mastTop = craneY + 0.7; // 16.3
      const mastH = mastTop - mastBase;

      // 4 Yellow Steel Lattice Corner Columns forming a hollow walkable tower shaft!
      for (const [dx, dz] of [[-1.35, -1.35], [1.35, -1.35], [-1.35, 1.35], [1.35, 1.35]]) {
        this._addBox(mastX + dx, mastBase + mastH / 2, mastZ + dz, 0.42, mastH, 0.42, {
          color: 0xeab308,
          studColor: 0xfacc15,
        });
      }
      // Horizontal steel cross-braces on North, South, and West sides (East side stays open so you walk right in!)
      for (let by = mastBase + 2.4; by < mastTop - 0.6; by += 2.6) {
        this._addBox(mastX, by, mastZ - 1.35, 2.7, 0.24, 0.24, { color: 0xca8a04, solid: false });
        this._addBox(mastX, by, mastZ + 1.35, 2.7, 0.24, 0.24, { color: 0xca8a04, solid: false });
        this._addBox(mastX - 1.35, by, mastZ, 0.24, 0.24, 2.7, { color: 0xca8a04, solid: false });
      }
      // Glowing green entrance frame at the bottom of the Crane Tower so the ladder is easy to spot!
      this._addBox(mastX + 1.35, mastBase + 2.6, mastZ, 0.24, 0.24, 2.7, { color: 0x38ef7d, emissive: 0x38ef7d, solid: false });

      // Climbable Steel Ladder INSIDE the hollow Crane Mast (Y = 4.0 -> 16.5)!
      this._addLadder(mastX - 0.88, mastZ, mastBase, mastTop + 0.25, 'x', 1.45);

      // Walkable Main Crane Boom split cleanly around the open ladder hatch at X = [-12.5, -10.0]!
      // West boom section: X = -27 to -12.5 (width 14.5, center -19.75)
      this._addBox(-19.75, craneY, 0, 14.5, 1.4, 3.8, { color: 0xeab308, studColor: 0xfacc15 });
      // East boom section: X = -10.0 to +27 (width 37.0, center +8.5)
      this._addBox(8.5, craneY, 0, 37.0, 1.4, 3.8, { color: 0xeab308, studColor: 0xfacc15 });
      // Side rim walkways framing the ladder hatch so you can walk around the shaft without falling in!
      this._addBox(mastX, craneY, -1.65, 2.8, 1.4, 0.7, { color: 0xeab308, studColor: 0xfacc15 });
      this._addBox(mastX, craneY, 1.65, 2.8, 1.4, 0.7, { color: 0xeab308, studColor: 0xfacc15 });

      // Crane Operator Cabin perched right beside the ladder top at X = -18!
      this._addBox(-18, craneY + 2.2, 0, 4.2, 3.0, 4.0, { color: 0xd97706, studColor: 0xf59e0b });
      this._addBox(-15.85, craneY + 2.3, 0, 0.15, 1.6, 2.8, { color: 0x38bdf8, emissive: 0x38bdf8, solid: false });
      // Upper Crane Jib Overlook (Y = 20.8!) reachable via ladder on the Operator Cabin!
      this._addLadder(-15.7, 0, craneY + 0.7, craneY + 4.1, 'x', 1.2);
      this._addBox(-18, craneY + 5.2, 0, 6.2, 0.7, 5.2, { color: 0xfacc15, studColor: 0xfde047 });
      // Counterweight block & glowing red crane beacon
      this._addBox(-26, craneY + 1.1, 0, 4.4, 2.4, 4.2, { color: 0x475569, studColor: 0x64748b });
      this._addBox(26, craneY + 1.0, 0, 1.2, 1.2, 1.2, { color: 0xff3e5e, emissive: 0xff3e5e, solid: false });
      // Upper decorative secondary crane struts for hanging wing cables
      this._addBox(0, 25, -10, 52, 1.2, 1.4, { color: 0xca8a04, solid: false });
      this._addBox(0, 25, 10, 52, 1.2, 1.4, { color: 0xca8a04, solid: false });

      // Central Elevated Steel Scaffolding Tower (Y = 8.8!)
      const towerY = 8.8;
      this._addBox(0, towerY - 0.3, 0, 12, 0.6, 12, { color: 0xd97706, studColor: 0xf59e0b });
      for (const [px, pz] of [[-5.4, -5.4], [5.4, -5.4], [-5.4, 5.4], [5.4, 5.4]]) {
        this._addBox(px, 4.0 + (towerY - 4.6) / 2, pz, 0.9, towerY - 4.6, 0.9, { color: 0xca8a04 });
      }
      this._addBox(0, towerY + 0.65, -5.4, 5.5, 1.3, 0.7, { color: 0x475569 });
      this._addBox(0, towerY + 0.65, 5.4, 5.5, 1.3, 0.7, { color: 0x475569 });

      // Ramps climbing to Central Scaffolding Tower
      this._addRamp(0, 10.2, 5.0, 8.8, 4.0, towerY, 'z', -1, { baseHex: '#b45309', studHex: '#d97706', trimColor: 0xfacc15 });
      this._addRamp(0, -10.2, 5.0, 8.8, 4.0, towerY, 'z', 1, { baseHex: '#b45309', studHex: '#d97706', trimColor: 0xfacc15 });

      // 2 Suspended Airborne Side Steel Platforms hanging from crane cables (Y = 7.4!)
      const wingY = 7.4;
      for (const xSign of [-1, 1]) {
        const wx = xSign * 22;
        this._addBox(wx, wingY - 0.4, 0, 11, 0.8, 22, { color: 0x475569, studColor: 0x64748b });
        // Vertical steel crane cables going up to crane booms
        this._addBox(wx, 16, -10, 0.25, 18, 0.25, { color: 0x1e293b, solid: false });
        this._addBox(wx, 16, 10, 0.25, 18, 0.25, { color: 0x1e293b, solid: false });
        // Shipping container perched on each airborne steel wing!
        this._addBox(wx + xSign * 1.4, wingY + 1.5, 0, 4.6, 3.0, 10, {
          color: xSign > 0 ? 0x1d4ed8 : 0xb91c1c,
          studColor: xSign > 0 ? 0x2563eb : 0xdc2626,
        });
        // Steel I-beam skywalks connecting main deck to side wings!
        this._addRamp(xSign * 14.5, 6.5, 4.2, 5.4, 4.0, wingY, 'x', xSign, { baseHex: '#b45309', studHex: '#d97706', trimColor: 0xfacc15 });
        this._addRamp(xSign * 14.5, -6.5, 4.2, 5.4, 4.0, wingY, 'x', xSign, { baseHex: '#b45309', studHex: '#d97706', trimColor: 0xfacc15 });
      }

      // Construction Hoist Jump Pads launching straight onto the Scaffolding Tower!
      this._addJumpPad(-9.5, 4.0, 6.2, 1.9, 13.8, 0xfacc15);
      this._addJumpPad(9.5, 4.0, -6.2, 1.9, 13.8, 0xfacc15);

      // Concrete Jersey Barriers & Cinderblock Stacks on Main Deck
      for (const zSign of [-1, 1]) {
        const accent = zSign > 0 ? 0x2de2ff : 0xff3e5e;
        this._addBox(0, 5.3, zSign * 17.5, 8.0, 2.6, 1.5, { color: 0x64748b, studColor: 0x78879c });
        this._addBox(0, 6.7, zSign * 17.5, 8.2, 0.2, 1.6, { color: accent, emissive: accent, solid: false });
        this._addBox(-8.2, 5.2, zSign * 12, 2.8, 2.4, 2.8, { color: 0xd97706, studColor: 0xf59e0b });
        this._addBox(8.2, 5.2, zSign * 12, 2.8, 2.4, 2.8, { color: 0xd97706, studColor: 0xf59e0b });
      }

      this.waypoints = [
        new THREE.Vector3(0, towerY, 0),
        new THREE.Vector3(-21, wingY, 0),
        new THREE.Vector3(21, wingY, 0),
        new THREE.Vector3(-9.5, 4.0, 0),
        new THREE.Vector3(9.5, 4.0, 0),
        new THREE.Vector3(0, 4.0, 15),
        new THREE.Vector3(0, 4.0, -15),
        new THREE.Vector3(-7, 4.0, 20),
        new THREE.Vector3(7, 4.0, -20),
      ];
    }

    // =========================================================
    // MAP 8: SPLASH PARK
    // =========================================================
    _buildSplashMap() {
      this._setLighting({
        skyHex: 0x56d8ff,
        fogHex: 0x7ce8ff,
        hemiSky: 0xe0fbff,
        hemiGround: 0x38bdf8,
        hemiInt: 1.05,
        sunHex: 0xfffbe6,
        sunInt: 1.38,
        sunPos: [30, 50, 16],
        clouds: true,
      });

      this._addBox(0, -0.5, 0, 56, 1, 72, {
        color: 0xf3e5ab,
        studColor: 0xfaefc0,
        solid: false,
        shootable: true,
        castShadow: false,
      });

      this._addBox(0, 0.03, 0, 30, 0.06, 36, {
        color: 0x06b6d4,
        emissive: 0x22d3ee,
        emissiveIntensity: 0.35,
        solid: false,
        castShadow: false,
      });
      this._addBox(-5, 0.05, 0, 0.25, 0.05, 34, { color: 0xffffff, solid: false, castShadow: false });
      this._addBox(5, 0.05, 0, 0.25, 0.05, 34, { color: 0xffffff, solid: false, castShadow: false });

      this._addPerimeter(10, 0x0ea5e9, 0x38bdf8, 0x34d399, 0xfb7185, 0xfde047);

      const islandY = 1.4;
      this._addBox(0, islandY / 2, 0, 10, islandY, 10, { color: 0xfbbf24, studColor: 0xfcd34d });
      this._addBox(0, islandY + 2.2, 0, 0.6, 4.4, 0.6, { color: 0xffffff });
      this._addBox(0, islandY + 4.5, 0, 7.5, 0.5, 7.5, { color: 0xf43f5e, studColor: 0xfb7185 });
      this._addRamp(0, 7.4, 4.5, 4.8, 0, islandY, 'z', -1, { baseHex: '#34d399', studHex: '#6ee7b7', trimColor: 0xfde047 });
      this._addRamp(0, -7.4, 4.5, 4.8, 0, islandY, 'z', 1, { baseHex: '#34d399', studHex: '#6ee7b7', trimColor: 0xfde047 });

      // Towering High-Dive Sky Platform (Y = 9.6!) right above the center umbrella!
      this._addLadder(0, 3.6, islandY, 6.5, 'z', 1.2);
      this._addBox(0, 9.6, 0, 7.0, 0.6, 12.0, { color: 0x38bdf8, studColor: 0x7dd3fc });
      this._addJumpPad(0, islandY + 4.75, 0, 1.7, 13.0, 0xfde047);

      this._addJumpPad(-11, 0, 0, 1.9, 13.8, 0x22d3ee);
      this._addJumpPad(11, 0, 0, 1.9, 13.8, 0x22d3ee);

      const slideY = 4.2;
      for (const xSign of [-1, 1]) {
        const col = xSign > 0 ? 0xf43f5e : 0x8b5cf6;
        const stud = xSign > 0 ? 0xfb7185 : 0xa78bfa;
        this._addBox(xSign * 21, slideY / 2, 0, 8, slideY, 10, { color: col, studColor: stud });
        this._addRamp(xSign * 21, 10.5, 5.2, 11.0, 0, slideY, 'z', -1, {
          baseHex: xSign > 0 ? '#fb7185' : '#a78bfa',
          studHex: '#ffffff',
          trimColor: 0x38bdf8,
        });
        this._addRamp(xSign * 21, -10.5, 5.2, 11.0, 0, slideY, 'z', 1, {
          baseHex: xSign > 0 ? '#fb7185' : '#a78bfa',
          studHex: '#ffffff',
          trimColor: 0x38bdf8,
        });
      }

      for (const zSign of [-1, 1]) {
        this._addBox(0, 1.4, zSign * 22, 8.0, 2.8, 1.5, { color: 0x10b981, studColor: 0x34d399 });
        this._addBox(-10, 1.1, zSign * 14, 3.2, 2.2, 3.2, { color: 0xfb7185, studColor: 0xfda4af });
        this._addBox(10, 1.1, zSign * 14, 3.2, 2.2, 3.2, { color: 0x38bdf8, studColor: 0x7dd3fc });
        this._addBox(-19, 1.6, zSign * 24, 5.5, 3.2, 3.2, { color: 0xf59e0b, studColor: 0xfbbf24 });
        this._addBox(19, 1.6, zSign * 24, 5.5, 3.2, 3.2, { color: 0xf59e0b, studColor: 0xfbbf24 });
      }

      this.waypoints = [
        new THREE.Vector3(0, islandY, 0),
        new THREE.Vector3(-21, slideY, 0),
        new THREE.Vector3(21, slideY, 0),
        new THREE.Vector3(-11, 0, 0),
        new THREE.Vector3(11, 0, 0),
        new THREE.Vector3(-10, 0, -20),
        new THREE.Vector3(10, 0, -20),
        new THREE.Vector3(-10, 0, 20),
        new THREE.Vector3(10, 0, 20),
      ];
    }

    addTemporaryWall(x, y, z, yaw, life = 12.0) {
      // Trowel-built solid Roblox brick wall!
      const alignX = Math.abs(Math.sin(yaw)) < 0.707;
      const w = alignX ? 4.4 : 1.0;
      const d = alignX ? 1.0 : 4.4;
      const h = 3.2;
      const cy = y + h / 2;
      const mesh = this._addBox(x, cy, z, w, h, d, {
        color: 0xd97706,
        studColor: 0xf59e0b,
        solid: true,
      });
      const collider = this.colliders[this.colliders.length - 1];
      this.tempWalls.push({ mesh, collider, life });
      return mesh;
    }

    addTempJumpPad(x, y, z, launchVel = 16.5, life = 18.0) {
      const radius = 1.95;
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 1.1, 0.24, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 })
      );
      base.position.set(x, y + 0.12, z);
      const glow = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.8, 0.12, 8, 22),
        new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xa855f7, emissiveIntensity: 1.0 })
      );
      glow.rotation.x = Math.PI / 2;
      glow.position.set(x, y + 0.28, z);
      group.add(base, glow);
      this.mapGroup.add(group);
      const padObj = { x, y, z, radius, launchVel };
      this.jumpPads.push(padObj);
      this.tempJumpPads.push({ group, padObj, life });
      return group;
    }

    updateTempWalls(dt) {
      for (let i = this.tempWalls.length - 1; i >= 0; i--) {
        const tw = this.tempWalls[i];
        tw.life -= dt;
        if (tw.life <= 0) {
          this.mapGroup.remove(tw.mesh);
          const mi = this.meshes.indexOf(tw.mesh);
          if (mi >= 0) this.meshes.splice(mi, 1);
          const ci = this.colliders.indexOf(tw.collider);
          if (ci >= 0) this.colliders.splice(ci, 1);
          tw.mesh.geometry.dispose();
          tw.mesh.material.dispose();
          this.tempWalls.splice(i, 1);
        }
      }
      for (let i = this.tempJumpPads.length - 1; i >= 0; i--) {
        const tp = this.tempJumpPads[i];
        tp.life -= dt;
        if (tp.life <= 0) {
          this.mapGroup.remove(tp.group);
          const pi = this.jumpPads.indexOf(tp.padObj);
          if (pi >= 0) this.jumpPads.splice(pi, 1);
          this.tempJumpPads.splice(i, 1);
        }
      }
    }

    checkJumpPad(pos) {
      for (const pad of this.jumpPads) {
        const d = Math.hypot(pos.x - pad.x, pos.z - pad.z);
        if (d < pad.radius && Math.abs(pos.y - pad.y) < 0.85) {
          return pad.launchVel;
        }
      }
      return 0;
    }

    getSpawns() {
      return {
        player: this.spawns.player.clone(),
        bot: this.spawns.bot.clone(),
      };
    }

    getWaypoints() {
      return this.waypoints;
    }

    getFloorHeight(x, z, feetY, radius = 0.45) {
      let highest = this.hasFloor ? 0 : -Infinity;

      for (const c of this.colliders) {
        if (
          x + radius > c.minX &&
          x - radius < c.maxX &&
          z + radius > c.minZ &&
          z - radius < c.maxZ
        ) {
          if (c.maxY <= feetY + 0.72 && c.maxY > highest) {
            highest = c.maxY;
          }
        }
      }

      for (const r of this.ramps) {
        if (
          x + radius * 0.6 > r.minX &&
          x - radius * 0.6 < r.maxX &&
          z + radius * 0.6 > r.minZ &&
          z - radius * 0.6 < r.maxZ
        ) {
          let t = 0;
          if (r.axis === 'x') t = (x - r.minX) / (r.maxX - r.minX);
          else t = (z - r.minZ) / (r.maxZ - r.minZ);
          t = Math.max(0, Math.min(1, t));
          if (r.dir < 0) t = 1 - t;
          const rampY = r.yStart + t * (r.yEnd - r.yStart);
          if (rampY <= feetY + 0.95 && rampY > highest) {
            highest = rampY;
          }
        }
      }

      return highest;
    }

    resolveHorizontal(pos, radius = 0.48, height = 1.8) {
      pos.x = Math.max(this.bounds.minX + radius, Math.min(this.bounds.maxX - radius, pos.x));
      pos.z = Math.max(this.bounds.minZ + radius, Math.min(this.bounds.maxZ - radius, pos.z));

      for (const c of this.colliders) {
        if (c.maxY <= pos.y + 0.48 || c.minY >= pos.y + height - 0.05) continue;

        if (
          pos.x + radius > c.minX &&
          pos.x - radius < c.maxX &&
          pos.z + radius > c.minZ &&
          pos.z - radius < c.maxZ
        ) {
          const pushLeft = pos.x + radius - c.minX;
          const pushRight = c.maxX - (pos.x - radius);
          const pushFront = pos.z + radius - c.minZ;
          const pushBack = c.maxZ - (pos.z - radius);

          const minPush = Math.min(pushLeft, pushRight, pushFront, pushBack);
          if (minPush === pushLeft) pos.x -= pushLeft;
          else if (minPush === pushRight) pos.x += pushRight;
          else if (minPush === pushFront) pos.z -= pushFront;
          else pos.z += pushBack;
        }
      }
    }

    checkCeiling(pos, radius = 0.45, height = 1.8) {
      let lowestCeil = Infinity;
      for (const c of this.colliders) {
        if (
          pos.x + radius > c.minX &&
          pos.x - radius < c.maxX &&
          pos.z + radius > c.minZ &&
          pos.z - radius < c.maxZ
        ) {
          if (c.minY >= pos.y + height * 0.5 && c.minY < lowestCeil) {
            lowestCeil = c.minY;
          }
        }
      }
      return lowestCeil;
    }

    isPointInsideSolid(x, y, z, radius = 0.15) {
      if (this.hasFloor && y < radius) return { hit: true, normal: new THREE.Vector3(0, 1, 0) };
      if (x < this.bounds.minX + radius) return { hit: true, normal: new THREE.Vector3(1, 0, 0) };
      if (x > this.bounds.maxX - radius) return { hit: true, normal: new THREE.Vector3(-1, 0, 0) };
      if (z < this.bounds.minZ + radius) return { hit: true, normal: new THREE.Vector3(0, 0, 1) };
      if (z > this.bounds.maxZ - radius) return { hit: true, normal: new THREE.Vector3(0, 0, -1) };

      for (const c of this.colliders) {
        if (
          x + radius > c.minX &&
          x - radius < c.maxX &&
          y + radius > c.minY &&
          y - radius < c.maxY &&
          z + radius > c.minZ &&
          z - radius < c.maxZ
        ) {
          const dx1 = Math.abs(x - c.minX);
          const dx2 = Math.abs(c.maxX - x);
          const dy1 = Math.abs(y - c.minY);
          const dy2 = Math.abs(c.maxY - y);
          const dz1 = Math.abs(z - c.minZ);
          const dz2 = Math.abs(c.maxZ - z);
          const m = Math.min(dx1, dx2, dy1, dy2, dz1, dz2);
          const normal = new THREE.Vector3(0, 1, 0);
          if (m === dx1) normal.set(-1, 0, 0);
          else if (m === dx2) normal.set(1, 0, 0);
          else if (m === dy1) normal.set(0, -1, 0);
          else if (m === dy2) normal.set(0, 1, 0);
          else if (m === dz1) normal.set(0, 0, -1);
          else normal.set(0, 0, 1);
          return { hit: true, normal };
        }
      }
      return { hit: false, normal: null };
    }
  }

  Rivals.MAPS = MAPS;
  Rivals.Arena = Arena;
})(window);
