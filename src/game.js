(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const menu = document.getElementById('menu');
  const settingsPanel = document.getElementById('settings');
  const hud = document.getElementById('hud');
  const mobileControls = document.getElementById('mobileControls');
  const hotbarEl = document.getElementById('hotbar');
  const toastEl = document.getElementById('toast');
  const fpsLabel = document.getElementById('fpsLabel');
  const posLabel = document.getElementById('posLabel');
  const biomeLabel = document.getElementById('biomeLabel');

  const startBtn = document.getElementById('startBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const resetBtn = document.getElementById('resetBtn');
  const backBtn = document.getElementById('backBtn');
  const sensSlider = document.getElementById('sensSlider');
  const fovSlider = document.getElementById('fovSlider');
  const distanceSlider = document.getElementById('distanceSlider');
  const autosaveCheck = document.getElementById('autosaveCheck');
  const fancySkyCheck = document.getElementById('fancySkyCheck');
  const sensValue = document.getElementById('sensValue');
  const fovValue = document.getElementById('fovValue');
  const distanceValue = document.getElementById('distanceValue');

  const isTouch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  const WORLD_W = 64;
  const WORLD_D = 64;
  const WORLD_H = 22;
  const WATER_LEVEL = 5;
  const EYE_HEIGHT = 1.72;
  const PLAYER_RADIUS = 0.32;
  const SAVE_KEY = 'voxelcraft-web-save-v1';
  const SETTINGS_KEY = 'voxelcraft-web-settings-v1';

  const texturePath = name => `assets/textures/${name}`;
  const blocks = {
    1: { id: 1, name: 'Grass', solid: true, transparent: false, icon: texturePath('grass_top.png'), mats: { top: 'grassTop', bottom: 'dirt', side: 'grassSide' } },
    2: { id: 2, name: 'Dirt', solid: true, transparent: false, icon: texturePath('dirt.png'), mats: { all: 'dirt' } },
    3: { id: 3, name: 'Stone', solid: true, transparent: false, icon: texturePath('stone.png'), mats: { all: 'stone' } },
    4: { id: 4, name: 'Sand', solid: true, transparent: false, icon: texturePath('sand.png'), mats: { all: 'sand' } },
    5: { id: 5, name: 'Cobble', solid: true, transparent: false, icon: texturePath('cobblestone.png'), mats: { all: 'cobble' } },
    6: { id: 6, name: 'Log', solid: true, transparent: false, icon: texturePath('oak_log_top.png'), mats: { top: 'logTop', bottom: 'logTop', side: 'logSide' } },
    7: { id: 7, name: 'Planks', solid: true, transparent: false, icon: texturePath('oak_planks.png'), mats: { all: 'planks' } },
    8: { id: 8, name: 'Glass', solid: true, transparent: true, icon: texturePath('glass.png'), mats: { all: 'glass' } },
    9: { id: 9, name: 'Leaves', solid: true, transparent: true, icon: texturePath('oak_leaves.png'), mats: { all: 'leaves' } },
    10: { id: 10, name: 'Water', solid: false, transparent: true, icon: texturePath('water.png'), mats: { all: 'water' } }
  };
  const hotbar = [1, 2, 3, 4, 5, 6, 7, 8];
  let selectedHotbarIndex = 0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x96dfff);
  scene.fog = new THREE.Fog(0x96dfff, 30, 90);

  const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 180);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const sun = new THREE.DirectionalLight(0xffffff, 2.25);
  sun.position.set(-20, 45, 28);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -70;
  sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70;
  sun.shadow.camera.bottom = -70;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 130;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xcbefff, 0x44552f, 1.4));

  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  const clouds = new THREE.Group();
  scene.add(clouds);

  const outlineGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
  const outlineEdges = new THREE.EdgesGeometry(outlineGeo);
  const outline = new THREE.LineSegments(outlineEdges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
  outline.visible = false;
  scene.add(outline);

  const loader = new THREE.TextureLoader();
  const materials = {};

  function loadTexture(file) {
    const tex = loader.load(texturePath(file), () => renderOnce());
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestMipmapNearestFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function createMaterials() {
    materials.grassTop = new THREE.MeshLambertMaterial({ map: loadTexture('grass_top.png') });
    materials.grassSide = new THREE.MeshLambertMaterial({ map: loadTexture('grass_side.png') });
    materials.dirt = new THREE.MeshLambertMaterial({ map: loadTexture('dirt.png') });
    materials.stone = new THREE.MeshLambertMaterial({ map: loadTexture('stone.png') });
    materials.sand = new THREE.MeshLambertMaterial({ map: loadTexture('sand.png') });
    materials.cobble = new THREE.MeshLambertMaterial({ map: loadTexture('cobblestone.png') });
    materials.logSide = new THREE.MeshLambertMaterial({ map: loadTexture('oak_log_side.png') });
    materials.logTop = new THREE.MeshLambertMaterial({ map: loadTexture('oak_log_top.png') });
    materials.planks = new THREE.MeshLambertMaterial({ map: loadTexture('oak_planks.png') });
    materials.glass = new THREE.MeshLambertMaterial({ map: loadTexture('glass.png'), transparent: true, opacity: 0.55, alphaTest: 0.05 });
    materials.leaves = new THREE.MeshLambertMaterial({ map: loadTexture('oak_leaves.png'), transparent: true, opacity: 0.88, alphaTest: 0.18 });
    materials.water = new THREE.MeshLambertMaterial({ map: loadTexture('water.png'), transparent: true, opacity: 0.62, depthWrite: false });
  }
  createMaterials();

  const world = new Map();
  let worldDirty = false;
  let lastAutosave = 0;
  let meshCount = 0;

  const player = {
    x: WORLD_W / 2,
    y: 15,
    z: WORLD_D / 2,
    yaw: -Math.PI / 4,
    pitch: -0.18,
    vy: 0,
    onGround: false
  };

  const settings = {
    sensitivity: 1,
    fov: 75,
    renderDistance: 65,
    autosave: true,
    fancySky: true
  };

  const keys = new Set();
  const pressMap = new Map();
  let gameRunning = false;
  let paused = true;
  let lastTime = performance.now();
  let fpsFrames = 0;
  let fpsLast = performance.now();
  let currentTarget = null;
  let loopStarted = false;
  let activeLookPointer = null;
  let lastTouchLook = null;

  const faceDefs = [
    { name: 'right', dir: [1, 0, 0], corners: [[1,0,0], [1,1,0], [1,1,1], [1,0,1]], normal: [1,0,0] },
    { name: 'left', dir: [-1, 0, 0], corners: [[0,0,1], [0,1,1], [0,1,0], [0,0,0]], normal: [-1,0,0] },
    { name: 'top', dir: [0, 1, 0], corners: [[0,1,1], [1,1,1], [1,1,0], [0,1,0]], normal: [0,1,0] },
    { name: 'bottom', dir: [0, -1, 0], corners: [[0,0,0], [1,0,0], [1,0,1], [0,0,1]], normal: [0,-1,0] },
    { name: 'front', dir: [0, 0, 1], corners: [[1,0,1], [1,1,1], [0,1,1], [0,0,1]], normal: [0,0,1] },
    { name: 'back', dir: [0, 0, -1], corners: [[0,0,0], [0,1,0], [1,1,0], [1,0,0]], normal: [0,0,-1] }
  ];

  function keyOf(x, y, z) { return `${x},${y},${z}`; }
  function parseKey(k) { return k.split(',').map(Number); }
  function inWorld(x, y, z) { return x >= 0 && x < WORLD_W && z >= 0 && z < WORLD_D && y >= 0 && y < WORLD_H; }
  function getBlock(x, y, z) { return world.get(keyOf(x, y, z)) || 0; }
  function setBlock(x, y, z, type) {
    if (!inWorld(x, y, z)) return false;
    const k = keyOf(x, y, z);
    if (type === 0) world.delete(k);
    else world.set(k, type);
    worldDirty = true;
    return true;
  }
  function isSolidType(type) { return type && blocks[type] && blocks[type].solid; }
  function isRenderableType(type) { return type && blocks[type]; }
  function shouldShowFace(type, nx, ny, nz) {
    if (!inWorld(nx, ny, nz)) return true;
    const neighbor = getBlock(nx, ny, nz);
    if (!neighbor) return true;
    if (type === 10 && neighbor === 10) return false;
    if (blocks[neighbor].transparent && neighbor !== type) return true;
    return false;
  }

  function hash2(x, z, seed = 0) {
    const n = Math.sin(x * 127.1 + z * 311.7 + seed * 74.7) * 43758.5453123;
    return n - Math.floor(n);
  }
  function smoothNoise(x, z, scale, seed) {
    const fx = x / scale;
    const fz = z / scale;
    const x0 = Math.floor(fx);
    const z0 = Math.floor(fz);
    const x1 = x0 + 1;
    const z1 = z0 + 1;
    const sx = smoothstep(fx - x0);
    const sz = smoothstep(fz - z0);
    const n00 = hash2(x0, z0, seed);
    const n10 = hash2(x1, z0, seed);
    const n01 = hash2(x0, z1, seed);
    const n11 = hash2(x1, z1, seed);
    return lerp(lerp(n00, n10, sx), lerp(n01, n11, sx), sz);
  }
  function terrainHeight(x, z) {
    const h = 4 + smoothNoise(x, z, 9, 1) * 4.5 + smoothNoise(x, z, 19, 2) * 5.2 + smoothNoise(x, z, 35, 3) * 3.4;
    return Math.max(3, Math.min(WORLD_H - 5, Math.floor(h)));
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(t) { return t * t * (3 - 2 * t); }

  function generateWorld() {
    world.clear();
    for (let x = 0; x < WORLD_W; x++) {
      for (let z = 0; z < WORLD_D; z++) {
        const h = terrainHeight(x, z);
        const beach = h <= WATER_LEVEL + 1;
        for (let y = 0; y <= h; y++) {
          let type = 3;
          if (y === h) type = beach ? 4 : 1;
          else if (y >= h - 2) type = beach ? 4 : 2;
          else type = 3;
          setBlock(x, y, z, type);
        }
        if (h < WATER_LEVEL) {
          for (let y = h + 1; y <= WATER_LEVEL; y++) setBlock(x, y, z, 10);
        }
      }
    }
    addTrees();
    worldDirty = false;
  }

  function addTrees() {
    for (let x = 3; x < WORLD_W - 3; x++) {
      for (let z = 3; z < WORLD_D - 3; z++) {
        const h = terrainHeight(x, z);
        const top = getBlock(x, h, z);
        if (top !== 1) continue;
        if (hash2(x, z, 8) > 0.975) {
          const trunkH = 4 + Math.floor(hash2(x, z, 10) * 2);
          for (let y = h + 1; y <= h + trunkH; y++) setBlock(x, y, z, 6);
          const crownY = h + trunkH;
          for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
              for (let dy = -1; dy <= 2; dy++) {
                const dist = Math.abs(dx) + Math.abs(dz) + Math.max(0, dy - 1);
                if (dist > 4) continue;
                if (hash2(x + dx, z + dz, crownY + dy) < 0.08) continue;
                const bx = x + dx, by = crownY + dy, bz = z + dz;
                if (inWorld(bx, by, bz) && !getBlock(bx, by, bz)) setBlock(bx, by, bz, 9);
              }
            }
          }
        }
      }
    }
  }

  function materialForFace(blockType, faceName) {
    const mats = blocks[blockType].mats;
    if (mats.all) return mats.all;
    if (faceName === 'top') return mats.top || mats.side;
    if (faceName === 'bottom') return mats.bottom || mats.side;
    return mats.side || mats.top || mats.bottom;
  }

  function rebuildWorldMesh() {
    while (worldGroup.children.length) {
      const child = worldGroup.children.pop();
      child.geometry.dispose();
    }
    const buffers = {};
    for (const matKey of Object.keys(materials)) {
      buffers[matKey] = { positions: [], normals: [], uvs: [], indices: [], v: 0, transparent: materials[matKey].transparent };
    }

    for (const [k, type] of world) {
      if (!isRenderableType(type)) continue;
      const [x, y, z] = parseKey(k);
      for (const face of faceDefs) {
        const nx = x + face.dir[0];
        const ny = y + face.dir[1];
        const nz = z + face.dir[2];
        if (!shouldShowFace(type, nx, ny, nz)) continue;
        const matKey = materialForFace(type, face.name);
        const b = buffers[matKey];
        const base = b.v;
        for (const c of face.corners) {
          b.positions.push(x + c[0] - WORLD_W / 2, y + c[1], z + c[2] - WORLD_D / 2);
          b.normals.push(...face.normal);
        }
        b.uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
        b.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
        b.v += 4;
      }
    }

    meshCount = 0;
    const orderedKeys = Object.keys(buffers).sort((a, b) => Number(buffers[a].transparent) - Number(buffers[b].transparent));
    for (const matKey of orderedKeys) {
      const b = buffers[matKey];
      if (!b.positions.length) continue;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(b.positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(b.normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(b.uvs, 2));
      geometry.setIndex(b.indices);
      geometry.computeBoundingSphere();
      const mesh = new THREE.Mesh(geometry, materials[matKey]);
      mesh.receiveShadow = true;
      mesh.castShadow = matKey !== 'water';
      worldGroup.add(mesh);
      meshCount++;
    }
    worldDirty = false;
    renderOnce();
  }

  function createClouds() {
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.72 });
    for (let i = 0; i < 18; i++) {
      const group = new THREE.Group();
      const count = 3 + Math.floor(hash2(i, 4, 55) * 4);
      for (let j = 0; j < count; j++) {
        const geo = new THREE.BoxGeometry(4 + hash2(i, j, 1) * 5, 0.65, 2 + hash2(j, i, 2) * 3);
        const puff = new THREE.Mesh(geo, mat);
        puff.position.set((j - count / 2) * 3.2, 0, (hash2(j, i, 3) - .5) * 2.5);
        group.add(puff);
      }
      group.position.set((hash2(i, 1, 7) - .5) * 115, 23 + hash2(i, 2, 8) * 9, (hash2(i, 3, 9) - .5) * 115);
      group.userData.speed = 0.18 + hash2(i, 9, 4) * 0.22;
      clouds.add(group);
    }
  }
  createClouds();

  function setupHotbar() {
    hotbarEl.innerHTML = '';
    hotbar.forEach((type, i) => {
      const slot = document.createElement('button');
      slot.className = 'hotbar-slot';
      slot.type = 'button';
      slot.title = blocks[type].name;
      slot.innerHTML = `<small>${i + 1}</small><img src="${blocks[type].icon}" alt="${blocks[type].name}"><span>${blocks[type].name}</span>`;
      slot.addEventListener('pointerdown', e => {
        e.preventDefault();
        selectedHotbarIndex = i;
        updateHotbar();
      });
      hotbarEl.appendChild(slot);
    });
    updateHotbar();
  }

  function updateHotbar() {
    [...hotbarEl.children].forEach((el, i) => el.classList.toggle('selected', i === selectedHotbarIndex));
    const type = hotbar[selectedHotbarIndex];
    biomeLabel.textContent = `Selected: ${blocks[type].name}`;
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function loadSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      Object.assign(settings, stored);
    } catch (_) {}
    sensSlider.value = settings.sensitivity;
    fovSlider.value = settings.fov;
    distanceSlider.value = settings.renderDistance;
    autosaveCheck.checked = settings.autosave;
    fancySkyCheck.checked = settings.fancySky;
    applySettings();
  }

  function applySettings() {
    settings.sensitivity = Number(sensSlider.value);
    settings.fov = Number(fovSlider.value);
    settings.renderDistance = Number(distanceSlider.value);
    settings.autosave = autosaveCheck.checked;
    settings.fancySky = fancySkyCheck.checked;
    sensValue.textContent = `${settings.sensitivity.toFixed(2)}x`;
    fovValue.textContent = `${settings.fov}°`;
    distanceValue.textContent = `${settings.renderDistance}`;
    camera.fov = settings.fov;
    camera.updateProjectionMatrix();
    scene.fog.far = settings.fancySky ? settings.renderDistance + 25 : 999;
    scene.fog.near = settings.fancySky ? Math.max(18, settings.renderDistance * 0.42) : 999;
    clouds.visible = settings.fancySky;
    saveSettings();
  }

  function saveWorld() {
    const data = {
      player: { x: player.x, y: player.y, z: player.z, yaw: player.yaw, pitch: player.pitch },
      world: [...world.entries()]
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      showToast('Dunia tersimpan. Peradaban kotak selamat sementara.');
    } catch (err) {
      console.warn(err);
      showToast('Gagal save, localStorage penuh. Dunia digital pun punya kos-kosan sempit.');
    }
  }

  function loadWorld() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      world.clear();
      for (const [k, v] of data.world) world.set(k, v);
      Object.assign(player, data.player || {});
      player.vy = 0;
      player.onGround = false;
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  function resetWorld() {
    localStorage.removeItem(SAVE_KEY);
    generateWorld();
    placePlayerAtSpawn();
    rebuildWorldMesh();
    showToast('Dunia baru dibuat. Pohon-pohon belum sempat protes.');
  }

  function placePlayerAtSpawn() {
    const sx = Math.floor(WORLD_W / 2);
    const sz = Math.floor(WORLD_D / 2);
    const gy = highestSolidAt(sx, sz) + 1;
    player.x = sx - WORLD_W / 2 + 0.5;
    player.z = sz - WORLD_D / 2 + 0.5;
    player.y = gy + EYE_HEIGHT;
    player.vy = 0;
  }

  function highestSolidAtLocal(worldX, worldZ) {
    const x = Math.floor(worldX + WORLD_W / 2);
    const z = Math.floor(worldZ + WORLD_D / 2);
    return highestSolidAt(x, z);
  }

  function highestSolidAt(x, z) {
    for (let y = WORLD_H - 1; y >= 0; y--) {
      const t = getBlock(x, y, z);
      if (isSolidType(t) && t !== 9) return y;
    }
    return -1;
  }

  function startGame() {
    gameRunning = true;
    paused = false;
    menu.classList.add('hidden');
    menu.classList.remove('show');
    settingsPanel.classList.add('hidden');
    hud.classList.remove('hidden');
    if (isTouch) mobileControls.classList.remove('hidden');
    if (!isTouch && document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
    lastTime = performance.now();
    if (!loopStarted) {
      loopStarted = true;
      requestAnimationFrame(loop);
    }
    showToast(isTouch ? 'Geser layar kanan untuk lihat, tombol kiri buat jalan.' : 'Klik layar kalau mouse belum terkunci. WASD, klik kiri/kanan, 1-8.');
  }

  function pauseGame() {
    paused = true;
    menu.classList.remove('hidden');
    menu.classList.add('show');
    hud.classList.add('hidden');
    mobileControls.classList.add('hidden');
    document.exitPointerLock?.();
    if (settings.autosave) saveWorld();
  }

  function showSettings() {
    menu.classList.add('hidden');
    menu.classList.remove('show');
    settingsPanel.classList.remove('hidden');
    settingsPanel.classList.add('show');
  }

  function showMenu() {
    settingsPanel.classList.add('hidden');
    settingsPanel.classList.remove('show');
    menu.classList.remove('hidden');
    menu.classList.add('show');
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  function updateCamera() {
    player.pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, player.pitch));
    camera.position.set(player.x, player.y, player.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
    camera.rotation.z = 0;
  }

  function getForwardRight() {
    const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw)).normalize();
    return { forward, right };
  }

  function wouldCollide(nx, nz, eyeY) {
    const points = [
      [nx - PLAYER_RADIUS, nz - PLAYER_RADIUS],
      [nx + PLAYER_RADIUS, nz - PLAYER_RADIUS],
      [nx - PLAYER_RADIUS, nz + PLAYER_RADIUS],
      [nx + PLAYER_RADIUS, nz + PLAYER_RADIUS]
    ];
    for (const [px, pz] of points) {
      const ground = highestSolidAtLocal(px, pz) + 1 + EYE_HEIGHT;
      if (eyeY < ground - 0.05) return true;
    }
    return false;
  }

  function updatePlayer(dt) {
    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 9.3 : 5.6;
    const { forward, right } = getForwardRight();
    const wish = new THREE.Vector3();
    if (keys.has('KeyW')) wish.add(forward);
    if (keys.has('KeyS')) wish.sub(forward);
    if (keys.has('KeyD')) wish.add(right);
    if (keys.has('KeyA')) wish.sub(right);
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed * dt);

    let nx = player.x + wish.x;
    let nz = player.z + wish.z;
    if (!wouldCollide(nx, player.z, player.y)) player.x = nx;
    if (!wouldCollide(player.x, nz, player.y)) player.z = nz;

    player.vy -= 22 * dt;
    player.y += player.vy * dt;

    const groundY = highestSolidAtLocal(player.x, player.z) + 1 + EYE_HEIGHT;
    if (player.y <= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    if ((keys.has('Space') || pressMap.get('jump')) && player.onGround) {
      player.vy = 8.2;
      player.onGround = false;
    }

    const margin = 1.2;
    player.x = Math.max(-WORLD_W / 2 + margin, Math.min(WORLD_W / 2 - margin, player.x));
    player.z = Math.max(-WORLD_D / 2 + margin, Math.min(WORLD_D / 2 - margin, player.z));
  }

  function worldCoordFromSceneCoord(v) {
    return {
      x: Math.floor(v.x + WORLD_W / 2),
      y: Math.floor(v.y),
      z: Math.floor(v.z + WORLD_D / 2)
    };
  }

  function raycastBlock(maxDist = 7) {
    const origin = camera.position.clone();
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
    let lastEmpty = null;
    for (let d = 0.08; d <= maxDist; d += 0.045) {
      const p = origin.clone().addScaledVector(dir, d);
      const c = worldCoordFromSceneCoord(p);
      if (!inWorld(c.x, c.y, c.z)) continue;
      const type = getBlock(c.x, c.y, c.z);
      if (type && blocks[type].solid) {
        return { x: c.x, y: c.y, z: c.z, type, place: lastEmpty };
      }
      lastEmpty = c;
    }
    return null;
  }

  function breakBlock() {
    const hit = raycastBlock();
    if (!hit || hit.y <= 0) return;
    if (hit.type === 10) return;
    setBlock(hit.x, hit.y, hit.z, 0);
    rebuildWorldMesh();
    showToast(`Block ${blocks[hit.type].name} dihancurkan.`);
  }

  function placeBlock() {
    const hit = raycastBlock();
    if (!hit || !hit.place) return;
    const p = hit.place;
    const type = hotbar[selectedHotbarIndex];
    if (!inWorld(p.x, p.y, p.z) || getBlock(p.x, p.y, p.z)) return;
    const sx = p.x - WORLD_W / 2 + 0.5;
    const sz = p.z - WORLD_D / 2 + 0.5;
    const footY = player.y - EYE_HEIGHT;
    if (Math.abs(sx - player.x) < 0.8 && Math.abs(sz - player.z) < 0.8 && p.y >= footY - 0.05 && p.y <= player.y + 0.25) {
      showToast('Jangan letak block dalam badan sendiri. Evolusi kecewa.');
      return;
    }
    setBlock(p.x, p.y, p.z, type);
    rebuildWorldMesh();
    showToast(`${blocks[type].name} diletakkan.`);
  }

  function updateTargetOutline() {
    currentTarget = raycastBlock();
    if (!currentTarget) {
      outline.visible = false;
      return;
    }
    outline.visible = true;
    outline.position.set(currentTarget.x - WORLD_W / 2 + 0.5, currentTarget.y + 0.5, currentTarget.z - WORLD_D / 2 + 0.5);
  }

  function updateSky(dt) {
    if (!settings.fancySky) return;
    const time = performance.now() * 0.00003;
    const hue = 0.55 + Math.sin(time) * 0.035;
    scene.background.setHSL(hue, 0.68, 0.73);
    scene.fog.color.copy(scene.background);
    sun.position.x = Math.sin(time * 2.0) * 48;
    sun.position.z = Math.cos(time * 2.0) * 48;
    clouds.children.forEach(cloud => {
      cloud.position.x += cloud.userData.speed * dt;
      if (cloud.position.x > 64) cloud.position.x = -64;
    });
  }

  function updateHud(now) {
    fpsFrames++;
    if (now - fpsLast > 500) {
      const fps = Math.round(fpsFrames * 1000 / (now - fpsLast));
      fpsLabel.textContent = `${fps} FPS`;
      fpsFrames = 0;
      fpsLast = now;
    }
    posLabel.textContent = `X ${Math.round(player.x)} Y ${Math.round(player.y - EYE_HEIGHT)} Z ${Math.round(player.z)} • meshes ${meshCount}`;
  }

  function maybeAutosave(now) {
    if (!settings.autosave || !gameRunning) return;
    if (worldDirty && now - lastAutosave > 2500) {
      saveWorld();
      lastAutosave = now;
    }
  }

  function loop(now) {
    if (!gameRunning) return;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    if (!paused) {
      updatePlayer(dt);
      updateCamera();
      updateTargetOutline();
      updateSky(dt);
      updateHud(now);
      maybeAutosave(now);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);
  }

  function renderOnce() {
    if (!gameRunning) {
      updateCamera();
      renderer.render(scene, camera);
    }
  }

  function handleMouseMove(e) {
    if (paused || isTouch) return;
    if (document.pointerLockElement !== canvas) return;
    const scale = settings.sensitivity * 0.0022;
    player.yaw -= e.movementX * scale;
    player.pitch -= e.movementY * scale;
  }

  function onKeyDown(e) {
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight'].includes(e.code)) e.preventDefault();
    if (e.code === 'Escape' && gameRunning && !paused) pauseGame();
    if (e.code === 'KeyE') pauseGame();
    if (e.code.startsWith('Digit')) {
      const n = Number(e.code.replace('Digit', ''));
      if (n >= 1 && n <= hotbar.length) {
        selectedHotbarIndex = n - 1;
        updateHotbar();
      }
    }
    keys.add(e.code);
  }

  function onKeyUp(e) {
    keys.delete(e.code);
  }

  function handleWheel(e) {
    if (paused) return;
    e.preventDefault();
    selectedHotbarIndex = (selectedHotbarIndex + Math.sign(e.deltaY) + hotbar.length) % hotbar.length;
    updateHotbar();
  }

  function handlePointerDown(e) {
    if (paused) return;
    if (!isTouch) {
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
      return;
    }
    if (e.target.closest('button')) return;
    activeLookPointer = e.pointerId;
    lastTouchLook = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!isTouch || paused || activeLookPointer !== e.pointerId || !lastTouchLook) return;
    const dx = e.clientX - lastTouchLook.x;
    const dy = e.clientY - lastTouchLook.y;
    lastTouchLook = { x: e.clientX, y: e.clientY };
    const scale = settings.sensitivity * 0.006;
    player.yaw -= dx * scale;
    player.pitch -= dy * scale;
  }

  function handlePointerUp(e) {
    if (activeLookPointer === e.pointerId) {
      activeLookPointer = null;
      lastTouchLook = null;
    }
  }

  function setupTouchButton(btn) {
    const key = btn.dataset.key;
    const down = e => {
      e.preventDefault();
      btn.classList.add('active');
      if (key) keys.add(key);
    };
    const up = e => {
      e.preventDefault();
      btn.classList.remove('active');
      if (key) keys.delete(key);
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
  }

  function setupEvents() {
    startBtn.addEventListener('click', startGame);
    settingsBtn.addEventListener('click', showSettings);
    backBtn.addEventListener('click', showMenu);
    resetBtn.addEventListener('click', resetWorld);
    for (const el of [sensSlider, fovSlider, distanceSlider, autosaveCheck, fancySkyCheck]) el.addEventListener('input', applySettings);

    addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    });
    addEventListener('keydown', onKeyDown);
    addEventListener('keyup', onKeyUp);
    addEventListener('mousemove', handleMouseMove);
    addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    canvas.addEventListener('mousedown', e => {
      if (paused || isTouch) return;
      if (e.button === 0) breakBlock();
      if (e.button === 2) placeBlock();
    });

    document.querySelectorAll('.touch-btn[data-key]').forEach(setupTouchButton);
    document.getElementById('jumpBtn').addEventListener('pointerdown', e => { e.preventDefault(); pressMap.set('jump', true); e.currentTarget.classList.add('active'); });
    document.getElementById('jumpBtn').addEventListener('pointerup', e => { e.preventDefault(); pressMap.set('jump', false); e.currentTarget.classList.remove('active'); });
    document.getElementById('breakBtn').addEventListener('pointerdown', e => { e.preventDefault(); e.currentTarget.classList.add('active'); breakBlock(); });
    document.getElementById('breakBtn').addEventListener('pointerup', e => { e.currentTarget.classList.remove('active'); });
    document.getElementById('placeBtn').addEventListener('pointerdown', e => { e.preventDefault(); e.currentTarget.classList.add('active'); placeBlock(); });
    document.getElementById('placeBtn').addEventListener('pointerup', e => { e.currentTarget.classList.remove('active'); });
    document.getElementById('pauseBtn').addEventListener('pointerdown', e => { e.preventDefault(); pauseGame(); });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && gameRunning && settings.autosave) saveWorld();
    });
  }

  function init() {
    loadSettings();
    if (!loadWorld()) {
      generateWorld();
      placePlayerAtSpawn();
    }
    rebuildWorldMesh();
    setupHotbar();
    setupEvents();
    updateCamera();
    renderOnce();
    if (isTouch) document.body.classList.add('touch-device');
  }

  init();
})();
