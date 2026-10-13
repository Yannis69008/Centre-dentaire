import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildCenter } from './build.js';
import { Player } from './player.js';
import { UI } from './ui.js';
import { W, D, WALL_H, teleports, roomAt, netArea, rooms } from './plan.js';
import { verifyLayout, printReport } from './verify.js';

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);

function setLoading(p, msg) {
  const bar = $('#load-bar'), txt = $('#load-msg');
  if (bar) bar.style.width = Math.round(p * 100) + '%';
  if (txt && msg) txt.textContent = msg;
}
function fatal(title, detail) {
  const el = $('#fatal');
  if (!el) return;
  el.querySelector('h2').textContent = title;
  el.querySelector('p').textContent = detail;
  el.hidden = false;
  const ld = $('#loading'); if (ld) ld.hidden = true;
}
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

async function main() {
  setLoading(0.05, 'Initialisation du moteur 3D…');
  const canvas = $('#scene');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    fatal('WebGL indisponible', "Votre navigateur ou votre carte graphique ne permet pas d'afficher la 3D. Essayez Chrome, Edge ou Firefox récents, avec l'accélération matérielle activée.");
    return;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 400);

  await nextFrame();
  setLoading(0.15, 'Construction du bâtiment…');
  await nextFrame();
  let center;
  try {
    center = buildCenter();
  } catch (e) {
    console.error(e);
    fatal('Erreur de construction', 'La scène n\'a pas pu être créée : ' + (e && e.message ? e.message : e));
    return;
  }
  setLoading(0.55, 'Mise en place des équipements…');
  scene.add(center.root);

  // ------------------------------------------------------------------ environnement / lumières
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const hemi = new THREE.HemisphereLight(0xdfeaff, 0x8a7f70, 0.5);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, 3.0);
  sun.position.set(W / 2 - 11, 22, D / 2 + 15);
  sun.target.position.set(W / 2, 0, D / 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -17; sc.right = 17; sc.top = 17; sc.bottom = -17; sc.near = 1; sc.far = 70;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const moon = new THREE.DirectionalLight(0x8fa8ff, 0.0);
  moon.position.set(-10, 30, -12); scene.add(moon);

  // réserve de lumières ponctuelles réaffectées aux sources les plus proches
  const POOL = 9;
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const l = new THREE.PointLight(0xfff1dc, 0, 9, 2);
    scene.add(l); pool.push(l);
  }
  const extLamps = center.exterior.lamps.map((p) => ({ x: p.x, y: p.y, z: p.z, power: 2.2, ext: true }));
  const allSources = [...center.lightSources.map((s) => ({ ...s, ext: false })), ...extLamps];

  // ciel : dôme dégradé
  const skyU = { top: { value: new THREE.Color(0x4f8fd0) }, hor: { value: new THREE.Color(0xdbe9f4) }, ground: { value: new THREE.Color(0x9aa89a) } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 hor; uniform vec3 ground; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h>0.0 ? mix(hor, top, pow(clamp(h,0.0,1.0),0.55)) : mix(hor, ground, clamp(-h*4.0,0.0,1.0)); gl_FragColor = vec4(c,1.0); }',
  }));
  sky.renderOrder = -10; scene.add(sky);
  // étoiles
  const starGeo = new THREE.BufferGeometry();
  { const n = 500, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u); const y = Math.abs(u); a.set([r * Math.cos(t) * 280, y * 280 + 10, r * Math.sin(t) * 280], i * 3); } starGeo.setAttribute('position', new THREE.BufferAttribute(a, 3)); }
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  scene.add(stars);
  // collines lointaines
  {
    const M = center.M;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, r = 150 + (i % 3) * 18;
      const h = 14 + ((i * 37) % 11) * 2.2;
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), M.hill);
      m.scale.set(46 + (i % 4) * 8, h, 46); m.position.set(W / 2 + Math.cos(a) * r, -3, D / 2 + Math.sin(a) * r); scene.add(m);
    }
  }
  scene.fog = new THREE.Fog(0xcfe0ee, 70, 260);

  // ------------------------------------------------------------------ joueur / contrôles
  const dom = renderer.domElement;
  const doorCols = center.doors.map((d) => d.collider);
  const player = new Player(camera, dom, center.staticColliders, center.doors);
  const tp = (id) => { const t = teleports[id]; if (t) { player.teleport(t.x, t.z, t.yaw, 0); } };
  tp('entree');
  player.yaw = 0;

  const orbit = new OrbitControls(camera, dom);
  orbit.enableDamping = true; orbit.dampingFactor = 0.08;
  orbit.maxPolarAngle = Math.PI * 0.49; orbit.minDistance = 3; orbit.maxDistance = 55;
  orbit.target.set(W / 2, 0, D / 2 - 0.5);
  orbit.enabled = false;

  const state = {
    mode: 'visit', night: false, roof: true, walls: true, labels: true, autodoors: true,
    quality: 'high', nightT: 0, started: false, prevRoof: true,
  };
  try { const q = localStorage.getItem('dc_quality'); if (q) state.quality = q; } catch (e) { /* stockage indisponible */ }
  if (params.get('quality')) state.quality = params.get('quality');

  // ------------------------------------------------------------------ jour / nuit
  const day = { top: new THREE.Color(0x4f8fd0), hor: new THREE.Color(0xdbe9f4), ground: new THREE.Color(0x9aa89a), fog: new THREE.Color(0xcfe0ee), hemiSky: new THREE.Color(0xdfeaff), hemiG: new THREE.Color(0x8a7f70) };
  const ngt = { top: new THREE.Color(0x040810), hor: new THREE.Color(0x1b2740), ground: new THREE.Color(0x0b0f18), fog: new THREE.Color(0x0b1220), hemiSky: new THREE.Color(0x2a3a60), hemiG: new THREE.Color(0x0d0f16) };
  const M = center.M;
  const glowBase = { led: M.led.emissiveIntensity, cool: M.ledCool.emissiveIntensity };
  function applyDayNight(t) {
    skyU.top.value.copy(day.top).lerp(ngt.top, t); skyU.hor.value.copy(day.hor).lerp(ngt.hor, t); skyU.ground.value.copy(day.ground).lerp(ngt.ground, t);
    scene.fog.color.copy(day.fog).lerp(ngt.fog, t);
    hemi.color.copy(day.hemiSky).lerp(ngt.hemiSky, t); hemi.groundColor.copy(day.hemiG).lerp(ngt.hemiG, t);
    hemi.intensity = THREE.MathUtils.lerp(0.5, 0.07, t);
    sun.intensity = THREE.MathUtils.lerp(3.2, 0.0, t);
    moon.intensity = THREE.MathUtils.lerp(0.0, 0.32, t);
    scene.environmentIntensity = THREE.MathUtils.lerp(0.5, 0.09, t);
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1.0, 1.15, t);
    stars.material.opacity = Math.max(0, (t - 0.4) / 0.6);
    M.led.emissiveIntensity = THREE.MathUtils.lerp(glowBase.led * 0.9, glowBase.led * 1.5, t);
    M.ledCool.emissiveIntensity = THREE.MathUtils.lerp(glowBase.cool * 0.9, glowBase.cool * 1.4, t);
    state.lightScale = THREE.MathUtils.lerp(0.8, 1.35, t);
    sky.visible = true;
  }
  applyDayNight(0);

  // ------------------------------------------------------------------ portes
  const raycaster = new THREE.Raycaster();
  raycaster.far = 3.2;
  const doorMeshes = [];
  center.gDoors.traverse((o) => { if (o.isMesh) doorMeshes.push(o); });
  const doorOf = new Map();
  for (const d of center.doors) for (const e of d.entries) e.pivot.traverse((o) => { if (o.isMesh) doorOf.set(o, d); });
  center.doors.forEach((d) => { d.t = 0; });

  function playerNearDoor(d, margin = 0.85) {
    const dx = player.pos.x - d.cx, dz = player.pos.z - d.cz;
    return Math.hypot(dx, dz) < Math.max(margin, d.w * 0.5 + 0.35);
  }
  function setDoor(d, open, manual = true) {
    if (!open && playerNearDoor(d)) { ui.toast('La porte est bloquée : écartez-vous pour la fermer'); return; }
    d.target = open ? 1 : 0; d.auto = !manual;
  }
  function toggleDoor(d) { setDoor(d, d.target === 0, true); }

  function updateDoors(dt) {
    for (const d of center.doors) {
      if (state.autodoors && state.mode === 'visit') {
        const near = Math.hypot(player.pos.x - d.cx, player.pos.z - d.cz);
        if (d.target === 0 && near < (d.kind === 'double' ? 2.0 : 1.2)) { d.target = 1; d.auto = true; }
        else if (d.target === 1 && d.auto && near > (d.kind === 'double' ? 3.6 : 2.6)) { d.target = 0; }
      }
      if (d.t !== d.target) {
        const sp = dt / 0.55;
        d.t = d.t < d.target ? Math.min(d.target, d.t + sp) : Math.max(d.target, d.t - sp);
        const ease = d.t * d.t * (3 - 2 * d.t);
        for (const e of d.entries) e.pivot.rotation.y = e.openAngle * ease;
      }
      d.collider.active = d.t < 0.45 && d.target === 0 || d.t === 0;
    }
  }

  // ------------------------------------------------------------------ interface
  const ui = new UI({ center, teleports, state, player, camera, rooms });
  ui.onTeleport = (id) => {
    if (state.mode !== 'visit') setMode('visit');
    tp(id);
  };
  ui.onMode = (m) => setMode(m);
  ui.onToggle = (k, v) => {
    state[k] = v;
    if (k === 'roof') center.gRoof.visible = v;
    if (k === 'walls') { center.gPart.visible = v; center.gDoors.visible = v; }
    if (k === 'labels') center.gLabels.visible = v;
  };
  ui.onNight = (n) => { state.night = n; };
  ui.onQuality = (q) => { setQuality(q); try { localStorage.setItem('dc_quality', q); } catch (e) { /* ignoré */ } };
  ui.onStart = () => { state.started = true; if (state.mode === 'visit') player.lock(); };
  ui.onResume = () => { if (state.mode === 'visit') player.lock(); };
  ui.onMinimapClick = (x, z) => {
    if (state.mode === 'visit') { player.teleport(x, z, player.yaw, 0); }
    else { orbit.target.set(x, 0, z); }
  };

  function setQuality(q) {
    state.quality = q;
    const dpr = window.devicePixelRatio || 1;
    if (q === 'high') { renderer.setPixelRatio(Math.min(dpr, 2)); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); }
    else if (q === 'medium') { renderer.setPixelRatio(Math.min(dpr, 1.5)); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); }
    else { renderer.setPixelRatio(1); sun.castShadow = false; }
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    resize();
  }

  function setMode(m) {
    if (m === state.mode) return;
    state.mode = m;
    if (m === 'aerial') {
      player.unlock(); player.enabled = false; player.keys.clear();
      state.prevRoof = state.roof;
      ui.setToggle('roof', false);
      camera.position.set(W / 2 + 0.01, 19, D + 12);
      orbit.target.set(W / 2, 0, D / 2 - 0.5);
      orbit.enabled = true; orbit.update();
      center.doors.forEach((d) => { /* conserve l'état */ });
    } else {
      orbit.enabled = false;
      player.enabled = true;
      ui.setToggle('roof', state.prevRoof);
      player.apply();
    }
    ui.setMode(m);
  }

  // clic : verrouiller la souris / actionner une porte / porte visée en vue aérienne
  let down = null;
  dom.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  dom.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 5) return;
    if (!state.started) return;
    if (state.mode === 'visit') {
      if (!player.locked) { if (!player.noPointerLock) player.lock(); else interact(); }
      else interact();
    } else {
      const r = dom.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.far = 200;
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(doorMeshes, false)[0];
      if (hit) { const d = doorOf.get(hit.object); if (d) toggleDoor(d); }
    }
  });
  function aimedDoor() {
    raycaster.far = 2.6;
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const hit = raycaster.intersectObjects(doorMeshes, false)[0];
    return hit ? doorOf.get(hit.object) : null;
  }
  function interact() { const d = aimedDoor(); if (d) toggleDoor(d); }
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyE' && state.mode === 'visit') interact();
    if (e.code === 'Tab') { e.preventDefault(); ui.togglePanel(); }
    if (e.code === 'KeyV') setMode(state.mode === 'visit' ? 'aerial' : 'visit');
    if (e.code === 'KeyN') ui.setNight(!state.night);
    if (e.code === 'KeyM') ui.toggleMap();
    if (e.code === 'KeyT' && state.mode === 'visit') ui.setToggle('roof', !state.roof);
  });
  player.onLockChange = (locked, failed) => { ui.setLocked(locked, failed); };

  // ------------------------------------------------------------------ redimensionnement
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  setQuality(state.quality);

  // ------------------------------------------------------------------ boucle
  const clock = new THREE.Clock();
  const tmpV = new THREE.Vector3();
  const labelBase = center.roomLabels.map((s) => s.scale.clone());
  const eqLabels = []; center.gLabels.traverse((o) => { if (o.userData.eq) eqLabels.push(o); });
  let hudT = 0;

  function updateLights(focusX, focusZ) {
    const scale = state.lightScale || 1;
    // trie les sources par distance au point d'intérêt
    const arr = allSources;
    for (const s of arr) s._d = (s.x - focusX) ** 2 + (s.z - focusZ) ** 2;
    const sorted = arr.slice().sort((a, b) => a._d - b._d);
    for (let i = 0; i < POOL; i++) {
      const s = sorted[i], l = pool[i];
      if (!s) { l.intensity = 0; continue; }
      l.position.set(s.x, s.y, s.z);
      const dist = Math.sqrt(s._d);
      const fade = THREE.MathUtils.clamp(1 - (dist - 5.5) / 3.5, 0, 1);
      const base = s.ext ? (state.night ? 14 : 0) : 7.2;
      l.intensity = base * (s.power || 1) * scale * (s.ext ? 1 : 1) * fade;
      l.distance = s.ext ? 14 : 7.5;
      l.color.set(s.ext ? 0xffe2b0 : 0xfff0dc);
    }
  }

  function loop() {
    const dt = clock.getDelta();
    // jour / nuit : transition douce
    const target = state.night ? 1 : 0;
    if (state.nightT !== target) {
      state.nightT += Math.sign(target - state.nightT) * Math.min(Math.abs(target - state.nightT), dt / 1.2);
      applyDayNight(state.nightT);
    }
    updateDoors(dt);
    let fx, fz;
    if (state.mode === 'visit') {
      player.update(dt);
      fx = player.pos.x; fz = player.pos.z;
    } else {
      orbit.update();
      fx = orbit.target.x; fz = orbit.target.z;
    }
    updateLights(fx, fz);

    // étiquettes : plus petites en visite, plus grandes en vue aérienne
    const aerial = state.mode === 'aerial';
    const dist = aerial ? camera.position.distanceTo(orbit.target) : 6;
    const k = aerial ? THREE.MathUtils.clamp(dist / 14, 0.9, 3.4) : 0.72;
    center.roomLabels.forEach((s, i) => { s.scale.set(labelBase[i].x * k, labelBase[i].y * k, 1); s.position.y = aerial ? WALL_H * 0.5 + 0.2 : WALL_H - 0.45; s.material.opacity = 0.95; });
    // étiquettes d'équipement : apparaissent à moins de 3,2 m, se fondent au-delà
    for (const l of eqLabels) {
      const d = camera.position.distanceTo(l.position);
      const a = aerial ? 0 : THREE.MathUtils.clamp(1 - (d - 1.6) / 1.8, 0, 1);
      l.material.opacity = a; l.visible = a > 0.02;
    }
    sun.target.position.set(W / 2, 0, D / 2);

    hudT += dt;
    if (hudT > 0.1) {
      hudT = 0;
      const px = state.mode === 'visit' ? player.pos.x : orbit.target.x;
      const pz = state.mode === 'visit' ? player.pos.z : orbit.target.z;
      const rm = roomAt(px, pz);
      ui.updateHud({ room: rm, px: player.pos.x, pz: player.pos.z, yaw: player.yaw, mode: state.mode, aimed: state.mode === 'visit' ? aimedDoor() : null, camera, orbit });
    }
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  // ------------------------------------------------------------------ débogage / tests
  window.__app = {
    player, camera, scene, state, center, orbit, THREE, renderer,
    teleport: (id) => ui.onTeleport(id), setMode, setNight: (n) => ui.setNight(n),
    openAll: (v = true) => center.doors.forEach((d) => { d.target = v ? 1 : 0; d.auto = false; }),
    verify: () => printReport(verifyLayout(center)),
    lookAt: (x, y, z) => { camera.lookAt(x, y, z); const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'); player.yaw = e.y; player.pitch = e.x; },
    setQuality, updateDoors,
    step: (dt) => { updateDoors(dt); player.update(dt); },
  };

  setLoading(0.9, 'Finalisation…');
  await nextFrame();
  player.enabled = true;
  ui.init();
  // paramètres d'URL (partage de vues, tests automatisés)
  if (params.get('night') === '1') { state.nightT = 1; state.night = true; ui.setNight(true, true); applyDayNight(1); }
  if (params.get('open') === '1') window.__app.openAll(true);
  const start = params.get('tp'); if (start && teleports[start]) tp(start);
  if (params.get('yaw')) { player.yaw = parseFloat(params.get('yaw')); player.apply(); }
  if (params.get('pitch')) { player.pitch = parseFloat(params.get('pitch')); player.apply(); }
  if (params.get('x') && params.get('z')) { player.teleport(parseFloat(params.get('x')), parseFloat(params.get('z')), player.yaw, player.pitch); }
  if (params.get('view') === 'aerial') { setMode('aerial'); }
  if (params.get('skip') === '1') { state.started = true; ui.hideStart(); }
  if (params.get('ui') === '0') document.body.classList.add('clean');
  if (params.get('roof') === '0') ui.setToggle('roof', false);
  if (params.get('walls') === '0') ui.setToggle('walls', false);
  setLoading(1, 'Prêt');
  const ld = $('#loading'); if (ld) { ld.classList.add('done'); setTimeout(() => { ld.hidden = true; }, 500); }
  clock.start();
  requestAnimationFrame(loop);
}

window.addEventListener('error', (e) => {
  if (!document.querySelector('#fatal').hidden) return;
  console.error(e.error || e.message);
});
main().catch((e) => { console.error(e); fatal('Erreur inattendue', String(e && e.message ? e.message : e)); });
