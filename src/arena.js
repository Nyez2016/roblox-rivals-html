import * as THREE from 'three';

function createStudTexture(baseHex, studHex, gridSize = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = gridSize;
  canvas.height = gridSize;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, gridSize, gridSize);

  // Subtle tile border
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, gridSize - 2, gridSize - 2);

  // Classic Roblox stud highlight + shadow
  const r = gridSize * 0.24;
  const cx = gridSize / 2;
  const cy = gridSize / 2;

  ctx.beginPath();
  ctx.arc(cx + 2, cy + 2, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = studHex;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.32, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class Arena {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.ramps = [];
    this.meshes = [];

    this.bounds = { minX: -27, maxX: 27, minZ: -35, maxZ: 35 };

    this._setupSkyAndLights();
    this._buildArena();
  }

  _setupSkyAndLights() {
    this.scene.background = new THREE.Color(0x8bc6ff);
    this.scene.fog = new THREE.Fog(0x98ceff, 48, 125);

    const hemi = new THREE.HemisphereLight(0xdff2ff, 0x4b5568, 0.95);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff7e6, 1.35);
    sun.position.set(28, 46, 22);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 5;
    sun.shadow.camera.far = 130;
    const d = 46;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    // Decorative sun disc & blocky Roblox clouds
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });
    const cloudPositions = [
      [-30, 32, -25, 14, 3, 7],
      [25, 36, -10, 18, 3.5, 9],
      [-15, 34, 28, 15, 3, 8],
      [32, 30, 22, 12, 2.5, 7],
    ];
    for (const [x, y, z, w, h, dep] of cloudPositions) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(w, h, dep), cloudMat);
      c.position.set(x, y, z);
      this.scene.add(c);
    }
  }

  _addBox(x, y, z, w, h, d, options = {}) {
    const {
      color = 0xd6dde8,
      studColor = null,
      roughness = 0.65,
      metalness = 0.1,
      emissive = 0x000000,
      solid = true,
      castShadow = true,
      receiveShadow = true,
      repeatScale = 0.5,
    } = options;

    let mat;
    if (studColor) {
      const tex = createStudTexture(
        '#' + new THREE.Color(color).getHexString(),
        '#' + new THREE.Color(studColor).getHexString()
      );
      tex.repeat.set(Math.max(1, Math.round(w * repeatScale)), Math.max(1, Math.round(d * repeatScale)));
      mat = new THREE.MeshStandardMaterial({ map: tex, roughness, metalness });
    } else {
      mat = new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
        emissive,
        emissiveIntensity: emissive ? 0.85 : 0,
      });
    }

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    this.scene.add(mesh);
    this.meshes.push(mesh);

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

  _addRamp(xCenter, zCenter, width, length, yStart, yEnd, axis, dir, color = 0x45536b) {
    // Visual sloped wedge built out of stepped prism mesh
    const height = Math.abs(yEnd - yStart);
    const slopeLen = Math.hypot(length, height);
    const angle = Math.atan2(height, length);

    const tex = createStudTexture('#52617a', '#637591');
    tex.repeat.set(Math.max(1, Math.round(width * 0.5)), Math.max(1, Math.round(slopeLen * 0.5)));
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65, metalness: 0.1 });

    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(
        axis === 'z' ? width : slopeLen,
        0.35,
        axis === 'z' ? slopeLen : width
      ),
      mat
    );
    slab.position.set(xCenter, (yStart + yEnd) / 2 - 0.16, zCenter);
    if (axis === 'z') {
      slab.rotation.x = dir > 0 ? -angle : angle;
    } else {
      slab.rotation.z = dir > 0 ? angle : -angle;
    }
    slab.castShadow = true;
    slab.receiveShadow = true;
    this.scene.add(slab);
    this.meshes.push(slab);

    // Side neon edge trim
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x2de2ff,
      emissive: 0x2de2ff,
      emissiveIntensity: 0.6,
    });
    for (const side of [-1, 1]) {
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(
          axis === 'z' ? 0.14 : slopeLen,
          0.16,
          axis === 'z' ? slopeLen : 0.14
        ),
        trimMat
      );
      trim.position.set(
        xCenter + (axis === 'z' ? side * (width / 2 - 0.08) : 0),
        (yStart + yEnd) / 2 + 0.04,
        zCenter + (axis === 'x' ? side * (width / 2 - 0.08) : 0)
      );
      if (axis === 'z') {
        trim.rotation.x = dir > 0 ? -angle : angle;
      } else {
        trim.rotation.z = dir > 0 ? angle : -angle;
      }
      this.scene.add(trim);
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

  _buildArena() {
    // 1. Main Arena Floor (Stud-textured light slate)
    const floorTex = createStudTexture('#cfd7e6', '#dde5f2');
    floorTex.repeat.set(28, 36);
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(56, 1, 72),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.72, metalness: 0.05 })
    );
    floor.position.set(0, -0.5, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.meshes.push(floor);

    // Center court lane stripes (Blue vs Red Rivals aesthetic)
    this._addBox(0, 0.02, 0, 54, 0.04, 0.45, { color: 0xffffff, emissive: 0xffffff, solid: false, castShadow: false });
    this._addBox(0, 0.02, 22, 54, 0.04, 0.35, { color: 0x2de2ff, emissive: 0x2de2ff, solid: false, castShadow: false });
    this._addBox(0, 0.02, -22, 54, 0.04, 0.35, { color: 0xff3e5e, emissive: 0xff3e5e, solid: false, castShadow: false });

    // 2. Perimeter Arena Walls
    const wallH = 11;
    this._addBox(0, wallH / 2, -36, 58, wallH, 2, { color: 0x243044, studColor: 0x2d3b52 });
    this._addBox(0, wallH / 2, 36, 58, wallH, 2, { color: 0x243044, studColor: 0x2d3b52 });
    this._addBox(-28, wallH / 2, 0, 2, wallH, 72, { color: 0x2a364c, studColor: 0x34435d });
    this._addBox(28, wallH / 2, 0, 2, wallH, 72, { color: 0x2a364c, studColor: 0x34435d });

    // Glowing arena wall accents (Player Cyan side vs Rival Red side)
    this._addBox(0, 6.5, 34.9, 52, 0.35, 0.2, { color: 0x2de2ff, emissive: 0x2de2ff, solid: false });
    this._addBox(0, 6.5, -34.9, 52, 0.35, 0.2, { color: 0xff3e5e, emissive: 0xff3e5e, solid: false });
    this._addBox(-26.9, 6.5, 0, 0.2, 0.35, 68, { color: 0x5ea3ff, emissive: 0x3b82f6, solid: false });
    this._addBox(26.9, 6.5, 0, 0.2, 0.35, 68, { color: 0x5ea3ff, emissive: 0x3b82f6, solid: false });

    // 3. Center Elevated Bridge / Platform (Classic Rivals Arena centerpiece)
    const bridgeY = 3.6;
    this._addBox(0, bridgeY - 0.3, 0, 14, 0.6, 8, { color: 0x3e4c63, studColor: 0x4b5b76 });
    // Center bridge waist-high cover blocks
    this._addBox(-3.5, bridgeY + 0.65, 0, 2.2, 1.3, 1.1, { color: 0xffb830, studColor: 0xffca5c });
    this._addBox(3.5, bridgeY + 0.65, 0, 2.2, 1.3, 1.1, { color: 0xffb830, studColor: 0xffca5c });

    // Bridge support pillars
    this._addBox(-6, bridgeY / 2 - 0.3, -3.2, 1.4, bridgeY - 0.6, 1.4, { color: 0x263144 });
    this._addBox(6, bridgeY / 2 - 0.3, -3.2, 1.4, bridgeY - 0.6, 1.4, { color: 0x263144 });
    this._addBox(-6, bridgeY / 2 - 0.3, 3.2, 1.4, bridgeY - 0.6, 1.4, { color: 0x263144 });
    this._addBox(6, bridgeY / 2 - 0.3, 3.2, 1.4, bridgeY - 0.6, 1.4, { color: 0x263144 });

    // Two wide ramps climbing to the center bridge from Left (-X) and Right (+X)
    this._addRamp(-11.5, 0, 6.2, 9.0, 0, bridgeY, 'x', 1);
    this._addRamp(11.5, 0, 6.2, 9.0, 0, bridgeY, 'x', -1);

    // 4. Symmetrical Side High-Ground Sniper Platforms + Ramps
    for (const side of [-1, 1]) {
      const zSign = side; // +1 Player side, -1 Bot side
      const teamAccent = zSign > 0 ? 0x2de2ff : 0xff3e5e;
      const wallTint = zSign > 0 ? 0x2e4a69 : 0x633344;
      const wallStud = zSign > 0 ? 0x395c82 : 0x7a3f54;

      // Spawn barrier cover right ahead of spawn
      this._addBox(0, 1.5, zSign * 21, 7.5, 3.0, 1.4, { color: wallTint, studColor: wallStud });
      this._addBox(0, 3.1, zSign * 21, 7.6, 0.2, 1.5, { color: teamAccent, emissive: teamAccent, solid: false });

      // Mid-lane angled/offset tall pillars for peeking
      this._addBox(-11, 2.4, zSign * 13, 3.2, 4.8, 3.2, { color: 0x425069, studColor: 0x51627f });
      this._addBox(11, 2.4, zSign * 13, 3.2, 4.8, 3.2, { color: 0x425069, studColor: 0x51627f });

      // Jumpable wooden/orange Roblox crates near mid-lanes
      this._addBox(-5.5, 0.9, zSign * 11, 2.2, 1.8, 2.2, { color: 0xd98a3c, studColor: 0xe69e53 });
      this._addBox(5.5, 0.9, zSign * 11, 2.2, 1.8, 2.2, { color: 0xd98a3c, studColor: 0xe69e53 });

      // Flank corridor cover walls
      this._addBox(-20, 1.75, zSign * 18, 4.5, 3.5, 1.6, { color: 0x3d4b63, studColor: 0x4d5e7a });
      this._addBox(20, 1.75, zSign * 18, 4.5, 3.5, 1.6, { color: 0x3d4b63, studColor: 0x4d5e7a });

      // Back corner elevated sniper perches
      const perchY = 2.8;
      this._addBox(-21, perchY / 2, zSign * 29, 9, perchY, 8, { color: 0x39475e, studColor: 0x465773 });
      this._addRamp(-13, zSign * 29, 4.6, 7.2, 0, perchY, 'x', -1);

      this._addBox(21, perchY / 2, zSign * 29, 9, perchY, 8, { color: 0x39475e, studColor: 0x465773 });
      this._addRamp(13, zSign * 29, 4.6, 7.2, 0, perchY, 'x', 1);
    }

    // Center under-bridge cover crate
    this._addBox(0, 0.85, 0, 2.6, 1.7, 2.6, { color: 0xd98a3c, studColor: 0xe69e53 });
  }

  getFloorHeight(x, z, feetY, radius = 0.45) {
    let highest = 0;

    // Check top surfaces of solid AABB boxes
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

    // Check smooth ramps
    for (const r of this.ramps) {
      if (
        x + radius * 0.6 > r.minX &&
        x - radius * 0.6 < r.maxX &&
        z + radius * 0.6 > r.minZ &&
        z - radius * 0.6 < r.maxZ
      ) {
        let t = 0;
        if (r.axis === 'x') {
          t = (x - r.minX) / (r.maxX - r.minX);
        } else {
          t = (z - r.minZ) / (r.maxZ - r.minZ);
        }
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
    // Keep within arena bounds
    pos.x = Math.max(this.bounds.minX + radius, Math.min(this.bounds.maxX - radius, pos.x));
    pos.z = Math.max(this.bounds.minZ + radius, Math.min(this.bounds.maxZ - radius, pos.z));

    for (const c of this.colliders) {
      // Skip boxes clearly below feet (steppable/standing on) or above head
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
    if (y < radius) return { hit: true, normal: new THREE.Vector3(0, 1, 0) };
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
        else if (m === dz2) normal.set(0, 0, 1);
        return { hit: true, normal };
      }
    }
    return { hit: false, normal: null };
  }

  getWaypoints() {
    return [
      new THREE.Vector3(0, 3.6, 0),       // Center bridge
      new THREE.Vector3(-16, 0, 0),       // Left ramp entry
      new THREE.Vector3(16, 0, 0),        // Right ramp entry
      new THREE.Vector3(-8, 0, -16),      // North-left lane
      new THREE.Vector3(8, 0, -16),       // North-right lane
      new THREE.Vector3(-8, 0, 16),       // South-left lane
      new THREE.Vector3(8, 0, 16),        // South-right lane
      new THREE.Vector3(-21, 2.8, -29),   // North-left perch
      new THREE.Vector3(21, 2.8, -29),    // North-right perch
      new THREE.Vector3(-18, 0, -8),      // Left flank mid
      new THREE.Vector3(18, 0, -8),       // Right flank mid
      new THREE.Vector3(-18, 0, 8),       // Left flank south
      new THREE.Vector3(18, 0, 8),        // Right flank south
    ];
  }
}
