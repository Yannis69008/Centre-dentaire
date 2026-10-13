import * as THREE from 'three';

// Déplacement à la première personne avec collisions (cercle contre rectangles alignés sur les axes).
export class Player {
  constructor(camera, dom, colliders, doors) {
    this.camera = camera;
    this.dom = dom;
    this.colliders = colliders;
    this.doors = doors;
    this.pos = new THREE.Vector3(6.85, 0, 11.3);
    this.yaw = 0; this.pitch = 0;
    this.eye = 1.65;
    this.radius = 0.26;
    this.vel = new THREE.Vector2();
    this.keys = new Set();
    this.joy = { x: 0, y: 0 };
    this.enabled = false;
    this.locked = false;
    this.speed = 1.75; this.run = 3.2;
    this.bob = 0;
    this.bounds = { x0: -9, x1: 28, z0: -8, z1: 26 };
    this.dragLook = false;
    this._bind();
    this.apply();
  }

  _bind() {
    const k = (e, down) => {
      const c = e.code;
      const map = { KeyW: 'f', KeyZ: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', KeyQ: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', ShiftLeft: 'run', ShiftRight: 'run' };
      // AZERTY : la touche étiquetée Z a le code KeyW, Q → KeyA ; QWERTY : W → KeyW, A → KeyA.
      const key = map[c];
      if (!key) return;
      if (!this.enabled) return;
      if (down) this.keys.add(key); else this.keys.delete(key);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(c)) e.preventDefault();
    };
    window.addEventListener('keydown', (e) => k(e, true));
    window.addEventListener('keyup', (e) => k(e, false));
    window.addEventListener('blur', () => this.keys.clear());
    document.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      if (!this.locked && !this.dragLook) return;
      const s = 0.0022;
      this.yaw -= (e.movementX || 0) * s;
      this.pitch -= (e.movementY || 0) * s;
      this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch));
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom;
      this.onLockChange && this.onLockChange(this.locked);
    });
    this.dom.addEventListener('mousedown', () => { if (this.enabled && !this.locked && this.noPointerLock) this.dragLook = true; });
    window.addEventListener('mouseup', () => { this.dragLook = false; });
  }

  lock() {
    if (this.dom.requestPointerLock) {
      try { const p = this.dom.requestPointerLock(); if (p && p.catch) p.catch(() => { this.noPointerLock = true; this.onLockChange && this.onLockChange(false, true); }); }
      catch (e) { this.noPointerLock = true; }
    } else this.noPointerLock = true;
  }
  unlock() { if (document.exitPointerLock) document.exitPointerLock(); }

  teleport(x, z, yaw = 0, pitch = 0) {
    this.pos.set(x, 0, z); this.yaw = yaw; this.pitch = pitch; this.vel.set(0, 0);
    this.apply();
  }

  apply() {
    const bobY = Math.sin(this.bob) * 0.012;
    this.camera.position.set(this.pos.x, this.eye + bobY, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  // Collision cercle / AABB : pousse le cercle hors de chaque rectangle pénétré
  _push(c) {
    const r = this.radius;
    if (c.x1 < this.pos.x - 1 || c.x0 > this.pos.x + 1 || c.z1 < this.pos.z - 1 || c.z0 > this.pos.z + 1) return false;
    const cx = Math.max(c.x0, Math.min(this.pos.x, c.x1));
    const cz = Math.max(c.z0, Math.min(this.pos.z, c.z1));
    const dx = this.pos.x - cx, dz = this.pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) return false;
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2), push = r - d;
      this.pos.x += (dx / d) * push; this.pos.z += (dz / d) * push;
    } else {
      // centre dans le rectangle : sortir par le côté le plus proche
      const l = this.pos.x - c.x0, rr = c.x1 - this.pos.x, t = this.pos.z - c.z0, b = c.z1 - this.pos.z;
      const m = Math.min(l, rr, t, b);
      if (m === l) this.pos.x = c.x0 - r; else if (m === rr) this.pos.x = c.x1 + r;
      else if (m === t) this.pos.z = c.z0 - r; else this.pos.z = c.z1 + r;
    }
    return true;
  }
  resolve() {
    for (let it = 0; it < 3; it++) {
      let moved = false;
      for (const c of this.colliders) moved = this._push(c) || moved;
      for (const d of this.doors) if (d.collider.active) moved = this._push(d.collider) || moved;
      if (!moved) break;
    }
  }

  update(dt) {
    if (!this.enabled) return;
    dt = Math.min(dt, 0.05);
    const f = (this.keys.has('f') ? 1 : 0) - (this.keys.has('b') ? 1 : 0) + this.joy.y;
    const s = (this.keys.has('r') ? 1 : 0) - (this.keys.has('l') ? 1 : 0) + this.joy.x;
    const sp = this.keys.has('run') ? this.run : this.speed;
    // direction monde : le regard est -z quand yaw = 0
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    let wx = (-sin) * f + cos * s, wz = (-cos) * f + (-sin) * s;
    const len = Math.hypot(wx, wz);
    if (len > 0) { const k = Math.min(1, len) / len; wx *= k; wz *= k; }
    const tx = wx * sp, tz = wz * sp;
    const a = 1 - Math.exp(-dt * 12);
    this.vel.x += (tx - this.vel.x) * a; this.vel.y += (tz - this.vel.y) * a;
    // sous-pas pour éviter de traverser les murs fins
    const dist = Math.hypot(this.vel.x, this.vel.y) * dt;
    const steps = Math.max(1, Math.ceil(dist / 0.08));
    for (let i = 0; i < steps; i++) {
      this.pos.x += (this.vel.x * dt) / steps; this.pos.z += (this.vel.y * dt) / steps;
      this.resolve();
    }
    this.pos.x = Math.max(this.bounds.x0, Math.min(this.bounds.x1, this.pos.x));
    this.pos.z = Math.max(this.bounds.z0, Math.min(this.bounds.z1, this.pos.z));
    if (dist > 0.0005) this.bob += dist * 7.0;
    this.apply();
  }
}
