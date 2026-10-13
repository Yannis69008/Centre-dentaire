import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Boîte à outils de modélisation procédurale : primitives, colliders, fusion statique.

export class Kit {
  constructor(M) {
    this.M = M;
    this.colliders = [];   // { x0,z0,x1,z1, tag }
    this.lights = [];      // lumières ponctuelles (pièces)
    this.glowMats = [];    // matériaux émissifs (dalles de plafond)
    this.labels = [];      // étiquettes de pièces
    this.screens = [];
  }

  // ---- colliders (coordonnées monde, rectangle centré, rotation éventuelle) ----
  col(x, z, w, d, ry = 0, tag = '') {
    const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry));
    const hw = (w * c + d * s) / 2, hd = (w * s + d * c) / 2;
    this.colliders.push({ x0: x - hw, z0: z - hd, x1: x + hw, z1: z + hd, tag });
  }
  // collider exprimé dans le repère local du groupe (centre local ox,oz)
  colLocal(g, ox, oz, w, d, tag = '') {
    g.updateWorldMatrix(true, false);
    const p = new THREE.Vector3(ox, 0, oz).applyMatrix4(g.matrixWorld);
    const q = new THREE.Euler().setFromRotationMatrix(g.matrixWorld, 'YXZ');
    this.col(p.x, p.z, w, d, q.y, tag);
  }
}

// ----------------------------------------------------------------------------
// Primitives. y = bas de l'objet pour box/cyl/rbox ; centre pour sph.
// ----------------------------------------------------------------------------
function mk(geo, mat, p, x, y, z, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true;
  p.add(m);
  return m;
}
export function grp(p, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z); g.rotation.set(rx, ry, rz, 'YXZ');
  p.add(g); return g;
}
export function box(p, w, h, d, mat, x = 0, y = 0, z = 0, shadow = true) {
  return mk(new THREE.BoxGeometry(w, h, d), mat, p, x, y + h / 2, z, shadow);
}
export function cyl(p, rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 18, shadow = true) {
  return mk(new THREE.CylinderGeometry(rt, rb, h, seg), mat, p, x, y + h / 2, z, shadow);
}
export function cylX(p, r, len, mat, x, y, z, seg = 14) {
  const m = mk(new THREE.CylinderGeometry(r, r, len, seg), mat, p, x, y, z);
  m.rotation.z = Math.PI / 2; return m;
}
export function cylZ(p, r, len, mat, x, y, z, seg = 14) {
  const m = mk(new THREE.CylinderGeometry(r, r, len, seg), mat, p, x, y, z);
  m.rotation.x = Math.PI / 2; return m;
}
export function sph(p, r, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, seg = 14) {
  const m = mk(new THREE.SphereGeometry(r, seg, Math.max(8, seg - 4)), mat, p, x, y, z);
  m.scale.set(sx, sy, sz); return m;
}
const rboxCache = new Map();
// Boîte aux arêtes arrondies (extrusion d'un rectangle arrondi + biseau)
export function rbox(p, w, h, d, r, mat, x = 0, y = 0, z = 0, shadow = true) {
  const bev = Math.min(r * 0.6, d * 0.4, 0.03);
  const key = [w, h, d, r].map((v) => v.toFixed(3)).join('_');
  let geo = rboxCache.get(key);
  if (!geo) {
    const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001);
    const s = new THREE.Shape();
    const hw = w / 2 - bev, hh = h / 2 - bev;
    s.moveTo(-hw + rr, -hh); s.lineTo(hw - rr, -hh); s.quadraticCurveTo(hw, -hh, hw, -hh + rr);
    s.lineTo(hw, hh - rr); s.quadraticCurveTo(hw, hh, hw - rr, hh); s.lineTo(-hw + rr, hh);
    s.quadraticCurveTo(-hw, hh, -hw, hh - rr); s.lineTo(-hw, -hh + rr); s.quadraticCurveTo(-hw, -hh, -hw + rr, -hh);
    geo = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * bev), bevelEnabled: bev > 0.002, bevelSize: bev, bevelThickness: bev, bevelSegments: 2, curveSegments: 5 });
    geo.translate(0, 0, -(d - 2 * bev) / 2);
    rboxCache.set(key, geo);
  }
  return mk(geo, mat, p, x, y + h / 2, z, shadow);
}
export function tube(p, pts, r, mat, x = 0, y = 0, z = 0, seg = 28) {
  const curve = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)));
  return mk(new THREE.TubeGeometry(curve, seg, r, 6, false), mat, p, x, y, z, true);
}
export function plane(p, w, h, mat, x, y, z, rx = 0, ry = 0, shadow = false) {
  const m = mk(new THREE.PlaneGeometry(w, h), mat, p, x, y, z, shadow);
  m.rotation.set(rx, ry, 0, 'YXZ'); return m;
}
// Ombre de contact (fausse occlusion ambiante) posée sur le sol
export function blob(kit, p, w, d, x, z, y = 0.006, opacity = 1) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), kit.M.blob);
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z);
  m.userData.blob = true; m.renderOrder = 1;
  m.receiveShadow = false; m.castShadow = false;
  p.add(m); return m;
}

// ----------------------------------------------------------------------------
// Fusion statique : réduit des milliers de maillages en quelques dizaines d'appels de rendu.
// ----------------------------------------------------------------------------
export function mergeStatic(root) {
  root.updateMatrixWorld(true);
  const buckets = new Map();
  const toRemove = [];
  root.traverse((o) => {
    if (!o.isMesh || o.userData.noMerge) return;
    // ne pas fusionner les enfants d'objets dynamiques
    let a = o.parent, dyn = false;
    while (a) { if (a.userData && a.userData.noMerge) { dyn = true; break; } a = a.parent; }
    if (dyn) return;
    const mat = o.material;
    if (Array.isArray(mat)) return;
    const key = mat.uuid + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0) + '|' + o.renderOrder + '|' + (o.userData.blob ? 'b' : '');
    let b = buckets.get(key);
    if (!b) { b = { mat, cast: o.castShadow, recv: o.receiveShadow, ro: o.renderOrder, geos: [] }; buckets.set(key, b); }
    let g = o.geometry.clone();
    if (g.index) g = g.toNonIndexed();
    g.applyMatrix4(o.matrixWorld);
    for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    b.geos.push(g);
    toRemove.push(o);
  });
  for (const o of toRemove) o.parent && o.parent.remove(o);
  const merged = new THREE.Group();
  merged.name = 'merged';
  for (const b of buckets.values()) {
    const geo = mergeGeometries(b.geos, false);
    if (!geo) continue;
    geo.computeBoundingSphere();
    const m = new THREE.Mesh(geo, b.mat);
    m.castShadow = b.cast; m.receiveShadow = b.recv; m.renderOrder = b.ro;
    merged.add(m);
    b.geos.forEach((g) => g.dispose());
  }
  // retire les groupes vides
  return merged;
}
