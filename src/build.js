import * as THREE from 'three';
import { createMaterials, FLOOR_MATERIAL } from './materials.js';
import { Kit, box, cyl, sph, grp, mergeStatic } from './kit.js';
import { furnish } from './rooms.js';
import { W, D, WALL_H, EXT_T, INT_T, DOOR_H, rooms, walls, netArea } from './plan.js';
import * as F from './furniture.js';

const PI = Math.PI;

// Construit toute la scène du centre dentaire. Fonctionne aussi sans DOM/WebGL (vérification en Node).
export function buildCenter() {
  const M = createMaterials();
  const kit = new Kit(M);

  const root = new THREE.Group(); root.name = 'centre';
  const gShell = grp(root);        // enveloppe, sols, sol extérieur
  const gPart = grp(root);         // cloisons intérieures (masquables)
  const gFurn = grp(root);         // mobilier
  const gRoof = grp(root);         // toit + plafonds + luminaires
  const gDoors = grp(root);        // portes animées (non fusionnées)
  const gLabels = grp(root);       // étiquettes
  const gExt = grp(root);          // extérieur
  gDoors.userData.noMerge = true;

  const wallCol = [];              // colliders des murs
  const doors = [];                // portes interactives

  // -------------------------------------------------------------------------
  // Sols
  // -------------------------------------------------------------------------
  for (const r of rooms) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(-PI / 2);
    g.translate((r.x0 + r.x1) / 2, 0.0, (r.z0 + r.z1) / 2);
    const uv = g.attributes.uv, pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 1.2, pos.getZ(i) / 1.2);
    const m = new THREE.Mesh(g, M[FLOOR_MATERIAL[r.floor]]);
    m.receiveShadow = true;
    gShell.add(m);
  }
  // dalle d'assise du bâtiment (évite de voir le vide sous les murs)
  box(gShell, W + 0.5, 0.3, D + 0.5, M.black, W / 2, -0.32, D / 2, false);

  // -------------------------------------------------------------------------
  // Murs avec ouvertures (portes, fenêtres, baies)
  // -------------------------------------------------------------------------
  const OPEN_H = 2.3;
  function wallPiece(parent, horizontal, fixed, a, b, y0, y1, t, mat, extInfo) {
    // segment le long de l'axe [a,b], y de y0 à y1. Murs extérieurs : moitié extérieure sombre + moitié intérieure blanche.
    if (b - a < 1e-3 || y1 - y0 < 1e-3) return;
    const L = b - a, h = y1 - y0, c = (a + b) / 2;
    const put = (tt, off, m) => {
      if (horizontal) box(parent, L, h, tt, m, c, y0, fixed + off); else box(parent, tt, h, L, m, fixed + off, y0, c);
    };
    if (extInfo) { const q = extInfo.innerSign * t / 4; put(t / 2, -q, mat); put(t / 2, q, M.wall); }
    else put(t, 0, mat);
  }
  function addCollider(horizontal, fixed, a, b, t, tag = 'mur') {
    const m = 0.0;
    if (horizontal) wallCol.push({ x0: a, z0: fixed - t / 2, x1: b, z1: fixed + t / 2, tag });
    else wallCol.push({ x0: fixed - t / 2, z0: a, x1: fixed + t / 2, z1: b, tag });
  }

  const wallRuns = []; // utile à la vérification
  for (const wl of walls) {
    const horizontal = wl.z0 === wl.z1;
    const t = wl.ext ? EXT_T : INT_T;
    const fixed = horizontal ? wl.z0 : wl.x0;
    let a = horizontal ? Math.min(wl.x0, wl.x1) : Math.min(wl.z0, wl.z1);
    let b = horizontal ? Math.max(wl.x0, wl.x1) : Math.max(wl.z0, wl.z1);
    const parent = wl.ext ? gShell : gPart;
    const mat = wl.ext ? M.wallExt : M.wall;
    // prolonge aux extrémités pour combler les angles
    const ea = a - t / 2, eb = b + t / 2;
    const ops = (wl.openings || []).map((o) => ({ ...o, s0: o.at - o.w / 2, s1: o.at + o.w / 2 })).sort((p, q) => p.s0 - q.s0);
    let cur = ea;
    const innerSign = wl.ext ? (fixed === 0 ? 1 : -1) : 0;
    const extI = wl.ext ? { innerSign } : null;
    const full = (A, B) => {
      wallPiece(parent, horizontal, fixed, A, B, 0, WALL_H, t, mat, extI);
      addCollider(horizontal, fixed, A, B, t);
      // plinthe sombre
      if (B - A > 0.05) {
        const c = (A + B) / 2, L = B - A;
        if (horizontal) box(gPart, L, 0.09, t + 0.012, M.baseboard, c, 0, fixed, false);
        else box(gPart, t + 0.012, 0.09, L, M.baseboard, fixed, 0, c, false);
      }
    };
    for (const o of ops) {
      full(cur, Math.max(cur, o.s0)); // mur plein avant l'ouverture
      const s0 = o.s0, s1 = o.s1;
      if (o.k === 'window') {
        const sill = o.sill ?? 0.9, h = o.h ?? 1.3;
        if (sill > 0.001) { wallPiece(parent, horizontal, fixed, s0, s1, 0, sill, t, mat, extI); addCollider(horizontal, fixed, s0, s1, t, 'allège'); }
        wallPiece(parent, horizontal, fixed, s0, s1, sill + h, WALL_H, t, mat, extI);
        // vitrage + menuiserie noire
        const gm = o.lead ? M.glassLead : M.glass;
        const c = (s0 + s1) / 2, L = s1 - s0;
        const fb = 0.045, ft = t + 0.03;
        if (horizontal) {
          box(gShell, L, h, 0.012, gm, c, sill, fixed, false);
          box(gShell, L, fb, ft, M.black, c, sill, fixed, false); box(gShell, L, fb, ft, M.black, c, sill + h - fb, fixed, false);
          box(gShell, fb, h, ft, M.black, s0 + fb / 2, sill, fixed, false); box(gShell, fb, h, ft, M.black, s1 - fb / 2, sill, fixed, false);
          if (L > 1.3) box(gShell, 0.03, h, ft * 0.8, M.black, c, sill, fixed, false);
          if (sill > 0.3) box(gShell, L + 0.1, 0.03, t + 0.1, M.white, c, sill - 0.015, fixed, false);
        } else {
          box(gShell, 0.012, h, L, gm, fixed, sill, c, false);
          box(gShell, ft, fb, L, M.black, fixed, sill, c, false); box(gShell, ft, fb, L, M.black, fixed, sill + h - fb, c, false);
          box(gShell, ft, h, fb, M.black, fixed, sill, s0 + fb / 2, false); box(gShell, ft, h, fb, M.black, fixed, sill, s1 - fb / 2, false);
          if (L > 1.3) box(gShell, ft * 0.8, h, 0.03, M.black, fixed, sill, c, false);
          if (sill > 0.3) box(gShell, t + 0.1, 0.03, L + 0.1, M.white, fixed, sill - 0.015, c, false);
        }
      } else if (o.k === 'open') {
        wallPiece(parent, horizontal, fixed, s0, s1, OPEN_H, WALL_H, t, mat, extI);
        // cadre noir
        if (horizontal) box(gPart, o.w, 0.05, t + 0.03, M.black, (s0 + s1) / 2, OPEN_H - 0.05, fixed, false);
      } else { // door / double
        wallPiece(parent, horizontal, fixed, s0, s1, DOOR_H, WALL_H, t, mat, extI);
        const fr = 0.045;
        if (horizontal) {
          box(gPart, o.w, fr, t + 0.025, M.black, (s0 + s1) / 2, DOOR_H - fr, fixed, false);
          box(gPart, fr, DOOR_H, t + 0.025, M.black, s0 + fr / 2, 0, fixed, false); box(gPart, fr, DOOR_H, t + 0.025, M.black, s1 - fr / 2, 0, fixed, false);
        } else {
          box(gPart, t + 0.025, fr, o.w, M.black, fixed, DOOR_H - fr, (s0 + s1) / 2, false);
          box(gPart, t + 0.025, DOOR_H, fr, M.black, fixed, 0, s0 + fr / 2, false); box(gPart, t + 0.025, DOOR_H, fr, M.black, fixed, 0, s1 - fr / 2, false);
        }
        makeDoor(o, horizontal, fixed, t, wl);
      }
      cur = Math.max(cur, s1);
    }
    full(cur, eb);
    wallRuns.push({ horizontal, fixed, a, b, ext: !!wl.ext });
  }

  // -------------------------------------------------------------------------
  // Portes : pivot + vantail, collision tant que fermée
  // -------------------------------------------------------------------------
  function makeLeaf(parent, len, o) {
    const gl = !!o.glass;
    const th = gl ? 0.045 : 0.04, h = DOOR_H - 0.03;
    if (gl) {
      box(parent, len, 0.06, th, M.black, len / 2, 0.02, 0);
      box(parent, len, 0.06, th, M.black, len / 2, h - 0.04, 0);
      box(parent, 0.06, h, th, M.black, 0.03, 0.02, 0); box(parent, 0.06, h, th, M.black, len - 0.03, 0.02, 0);
      box(parent, len - 0.1, h - 0.14, 0.012, M.glassDoor, len / 2, 0.08, 0, false);
      box(parent, 0.03, 0.9, 0.03, M.steel, len - 0.14, 0.55, 0.05); box(parent, 0.03, 0.9, 0.03, M.steel, len - 0.14, 0.55, -0.05);
    } else {
      box(parent, len, h, th, o.ext ? M.blackMatte : M.wood, len / 2, 0.015, 0);
      // poignée
      box(parent, 0.14, 0.022, 0.07, M.steel, len - 0.1, 1.0, 0, false);
      box(parent, 0.03, 0.03, 0.09, M.steel, len - 0.05, 1.0, 0, false);
      // plaque de propreté sombre
      box(parent, 0.05, 0.3, th + 0.004, M.black, len - 0.08, 0.9, 0, false);
    }
  }
  function makeDoor(o, horizontal, fixed, t, wl) {
    const n = o.k === 'double' ? 2 : 1;
    const leafW = (o.w - 0.04) / n;
    const dir = o.swing > 0 ? 1 : -1;
    const nrm = horizontal ? new THREE.Vector3(0, 0, dir) : new THREE.Vector3(dir, 0, 0);
    const entries = [];
    for (let i = 0; i < n; i++) {
      // double : leaf 0 charnière 'a' (début), leaf 1 charnière 'b' (fin)
      const hingeSide = n === 2 ? (i === 0 ? 'a' : 'b') : o.hinge;
      const s0 = o.at - o.w / 2 + 0.02, s1 = o.at + o.w / 2 - 0.02;
      const hingeS = n === 2 ? (i === 0 ? s0 : s1) : (hingeSide === 'a' ? s0 : s1);
      const u = new THREE.Vector3(horizontal ? (hingeSide === 'a' ? 1 : -1) : 0, 0, horizontal ? 0 : (hingeSide === 'a' ? 1 : -1));
      const pivot = new THREE.Group();
      pivot.position.set(horizontal ? hingeS : fixed, 0, horizontal ? fixed : hingeS);
      const leafG = new THREE.Group();
      leafG.rotation.y = Math.atan2(-u.z, u.x);
      pivot.add(leafG);
      makeLeaf(leafG, leafW, o);
      gDoors.add(pivot);
      pivot.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      const sgn = Math.sign(nrm.x * u.z - nrm.z * u.x) || 1;
      entries.push({ pivot, openAngle: sgn * (PI / 2) * (n === 2 ? 1.0 : 0.96) });
    }
    const door = {
      id: o.id, entries, angle: 0, target: 0, state: 'closed',
      cx: horizontal ? o.at : fixed, cz: horizontal ? fixed : o.at, w: o.w, horizontal, nrm: { x: nrm.x, z: nrm.z },
      collider: horizontal
        ? { x0: o.at - o.w / 2, z0: fixed - 0.07, x1: o.at + o.w / 2, z1: fixed + 0.07, tag: 'porte:' + o.id, active: true }
        : { x0: fixed - 0.07, z0: o.at - o.w / 2, x1: fixed + 0.07, z1: o.at + o.w / 2, tag: 'porte:' + o.id, active: true },
      wallExt: !!wl.ext, glass: !!o.glass, hinge: o.hinge, swing: o.swing, kind: o.k,
    };
    doors.push(door);
  }

  // -------------------------------------------------------------------------
  // Toit, plafond, luminaires
  // -------------------------------------------------------------------------
  {
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W + EXT_T, D + EXT_T), M.ceiling);
    ceil.rotation.x = PI / 2; ceil.position.set(W / 2, WALL_H - 0.006, D / 2); ceil.receiveShadow = true; gRoof.add(ceil);
    box(gRoof, W + EXT_T + 0.3, 0.28, D + EXT_T + 0.3, M.roof, W / 2, WALL_H, D / 2);   // (face inférieure masquée par le plafond relevé)
    // acrotère
    const pt = 0.12, ph = 0.22;
    box(gRoof, W + EXT_T + 0.3, ph, pt, M.black, W / 2, WALL_H + 0.28, -EXT_T / 2 - 0.15 + pt / 2);
    box(gRoof, W + EXT_T + 0.3, ph, pt, M.black, W / 2, WALL_H + 0.28, D + EXT_T / 2 + 0.15 - pt / 2);
    box(gRoof, pt, ph, D + EXT_T + 0.3, M.black, -EXT_T / 2 - 0.15 + pt / 2, WALL_H + 0.28, D / 2);
    box(gRoof, pt, ph, D + EXT_T + 0.3, M.black, W + EXT_T / 2 + 0.15 - pt / 2, WALL_H + 0.28, D / 2);
    // casquette d'entrée
    box(gRoof, 3.4, 0.1, 1.4, M.black, 6.85, WALL_H - 0.2, D + 0.7);
    box(gRoof, 3.4, 0.03, 1.4, M.led, 6.85, WALL_H - 0.215, D + 0.7, false).userData.glow = true;
  }

  // -------------------------------------------------------------------------
  // Mobilier et équipements
  // -------------------------------------------------------------------------
  const lightSources = furnish(kit, gFurn, gRoof, gLabels);

  // -------------------------------------------------------------------------
  // Étiquettes de pièces (nom + surface)
  // -------------------------------------------------------------------------
  const roomLabels = [];
  {
    const done = new Set();
    const spec = {
      couloir: { x: 11.5, z: 6.3 }, accueil: { x: 5.9, z: 7.55 }, attente: { x: 6.9, z: 10.5 },
    };
    for (const r of rooms) {
      if (r.label === false || done.has(r.id)) continue; done.add(r.id);
      const sameId = rooms.filter((q) => q.id === r.id);
      const area = sameId.reduce((s, q) => s + netArea(q), 0);
      const sp = spec[r.id];
      const cx = sp ? sp.x : (r.x0 + r.x1) / 2, cz = sp ? sp.z : (r.z0 + r.z1) / 2;
      const txt = Math.round(area);
      const s = F.textSprite(kit, r.name, { w: 1.5, sub: `${txt} m²` });
      s.position.set(cx, WALL_H - 0.5, cz);
      s.userData.room = r.id;
      gLabels.add(s); roomLabels.push(s);
    }
  }

  // -------------------------------------------------------------------------
  // Extérieur : sol, parvis, route, arbres, ciel, collines
  // -------------------------------------------------------------------------
  const exterior = buildExterior(kit, gExt, M);

  // fusion statique (réduit les appels de rendu)
  const out = { root, gShell, gPart, gFurn, gRoof, gDoors, gLabels, gExt, kit, M, doors, wallCol, lightSources, roomLabels, exterior, wallRuns };
  for (const g of [gShell, gPart, gFurn, gRoof]) {
    const merged = mergeStatic(g);
    g.add(merged);
  }
  mergeExterior(gExt);

  // colliders totaux
  out.staticColliders = [...wallCol, ...kit.colliders];
  return out;
}

function mergeExterior(g) {
  const merged = mergeStatic(g);
  g.add(merged);
}

function buildExterior(kit, g, M) {
  const ext = {};
  // herbe
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M.grass);
  const gp = grass.geometry; const uv = gp.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 100, uv.getY(i) * 100);
  grass.rotation.x = -PI / 2; grass.position.set(W / 2, -0.04, D / 2); grass.receiveShadow = true; grass.userData.noMerge = true; g.add(grass);
  // trottoir / parvis
  const pave = (x0, z0, x1, z1, mat = M.paving, y = -0.02) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), mat);
    const uv2 = m.geometry.attributes.uv; for (let i = 0; i < uv2.count; i++) uv2.setXY(i, uv2.getX(i) * (x1 - x0) / 2, uv2.getY(i) * (z1 - z0) / 2);
    m.rotation.x = -PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.receiveShadow = true; g.add(m); return m;
  };
  pave(-1.2, D + 0.13, W + 1.2, D + 5.5);          // parvis
  pave(-1.2, -2.0, -0.13, D + 5.5);                // ceinture ouest
  pave(W + 0.13, -2.0, W + 1.2, D + 5.5);          // ceinture est
  pave(-1.2, -2.0, W + 1.2, -0.13);                // arrière
  // route + marquage
  pave(-60, D + 12, 80, D + 20, M.ground, -0.03);
  for (let x = -50; x < 70; x += 4) { const l = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.14), M.white); l.rotation.x = -PI / 2; l.position.set(x, -0.025, D + 16); g.add(l); }
  pave(-60, D + 5.5, 80, D + 7.5, M.paving, -0.025);                // trottoir
  // places de stationnement devant (petites bandes)
  for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 4.5), M.white); l.rotation.x = -PI / 2; l.position.set(2 + i * 3.0, -0.015, D + 9.8); g.add(l); }
  // bordures végétales
  const hedge = (x, z, w, d) => { box(g, w, 0.8, d, M.leaf3, x, 0, z); };
  hedge(W / 2, -1.6, W + 1, 0.5);
  // arbres
  const tree = (x, z, h = 4.2, r = 1.4) => {
    cyl(g, 0.12, 0.2, h * 0.55, M.trunk, x, 0, z, 8);
    sph(g, r, M.leaf2, x, h * 0.55 + r * 0.55, z, 1, 1, 1, 10);
    sph(g, r * 0.75, M.leaf, x + r * 0.5, h * 0.55 + r * 0.2, z + r * 0.2, 1, 1, 1, 8);
    sph(g, r * 0.7, M.leaf3, x - r * 0.45, h * 0.55 + r * 0.35, z - r * 0.2, 1, 1, 1, 8);
  };
  ext.trees = [[-3.2, 3, 4.5], [-3.5, 10, 3.8], [W + 3.4, 2, 4.6], [W + 3.2, 9, 4.0], [-4, 16.5, 4.5], [W + 4, 16.5, 4.0], [3, D + 4.2, 3.2], [12, D + 4.4, 3.4], [W + 5, -3, 5.0], [-5, -3, 4.8], [9, -4, 5.5]];
  ext.trees.forEach(([x, z, h]) => tree(x, z, h, h * 0.33));
  // jardinières à l'entrée
  [[3.9, D + 0.55], [9.7, D + 0.55]].forEach(([x, z]) => { box(g, 0.9, 0.55, 0.5, M.black, x, 0, z); sph(g, 0.45, M.leaf, x, 0.85, z, 1, 0.7, 0.6, 10); });
  // enseigne extérieure sur la façade + lettrage entrée
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.5), new THREE.MeshBasicMaterial({ map: facadeTexture('CENTRE DENTAIRE'), transparent: true, toneMapped: false }));
  sign.position.set(6.85, WALL_H + 0.55 - 0.3 + 0.0, D + EXT_T / 2 + 0.2); sign.userData.noMerge = true; g.add(sign);
  const entSign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.25), new THREE.MeshBasicMaterial({ map: facadeTexture('ENTRÉE PATIENTS', 52), transparent: true, toneMapped: false }));
  entSign.position.set(6.85, WALL_H - 0.45, D + 1.42); entSign.userData.noMerge = true; g.add(entSign);
  // lampadaires
  ext.lamps = [];
  [[-2.5, D + 5], [W + 2.5, D + 5], [9.5, D + 5]].forEach(([x, z]) => {
    cyl(g, 0.05, 0.06, 4.2, M.black, x, 0, z, 8);
    box(g, 0.9, 0.08, 0.2, M.black, x + 0.3, 4.2, z);
    const bulb = box(g, 0.5, 0.04, 0.16, M.led, x + 0.45, 4.15, z, false); bulb.userData.glow = true;
    ext.lamps.push({ x: x + 0.45, y: 4.1, z });
  });
  return ext;
}

function facadeTexture(text, size = 70) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = 1024; c.height = 200;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `600 ${size}px "Helvetica Neue", Arial, sans-serif`;
  g.fillText(text, 512, 100);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
