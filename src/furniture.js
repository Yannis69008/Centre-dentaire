import * as THREE from 'three';
import { box, cyl, cylX, cylZ, sph, rbox, tube, plane, grp, blob } from './kit.js';
import { labelTexture, signTexture, artTexture, screenTexture } from './materials.js';

// Convention locale : le « devant » du meuble regarde +z, le dos est à -z. y=0 : sol.

// ------------------------------ Végétation ---------------------------------
export function plant(kit, p, { h = 1.4, kind = 'ficus', pot = 'pot' } = {}) {
  const M = kit.M, g = grp(p);
  const potMat = M[pot] || M.pot;
  const pr = 0.17 + h * 0.04;
  cyl(g, pr, pr * 0.78, 0.36 + h * 0.06, potMat, 0, 0, 0, 20);
  cyl(g, pr * 0.9, pr * 0.9, 0.02, M.soil, 0, 0.34 + h * 0.06, 0, 16, false);
  blob(kit, g, pr * 4.2, pr * 4.2, 0, 0);
  const baseY = 0.36 + h * 0.06;
  if (kind === 'ficus') {
    cyl(g, 0.018, 0.03, h * 0.75, M.trunk, 0, baseY, 0, 8);
    const mats = [M.leaf, M.leaf2, M.leaf3];
    let s = 3;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 20; i++) {
      const a = rnd() * Math.PI * 2, rr = 0.07 + rnd() * h * 0.16, y = baseY + h * (0.3 + rnd() * 0.65);
      const l = sph(g, 0.1 + rnd() * 0.07, mats[i % 3], Math.cos(a) * rr, y, Math.sin(a) * rr, 1, 0.55, 1.5);
      l.rotation.y = a; l.rotation.z = (rnd() - 0.5) * 0.7;
    }
  } else if (kind === 'palm') {
    cyl(g, 0.02, 0.03, h * 0.45, M.trunk, 0, baseY, 0, 8);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const l = sph(g, 0.34, i % 2 ? M.leaf : M.leaf2, Math.cos(a) * 0.22, baseY + h * 0.55 + (i % 3) * 0.05, Math.sin(a) * 0.22, 1.5, 0.07, 0.34);
      l.rotation.y = -a; l.rotation.z = 0.5;
    }
  } else if (kind === 'sansevieria') {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + i, rr = 0.05 + (i % 3) * 0.035;
      const l = sph(g, 0.5, i % 2 ? M.leaf3 : M.leaf, Math.cos(a) * rr, baseY + h * 0.4, Math.sin(a) * rr, 0.14, h * 0.5 / 0.5 * 0.5, 0.04);
      l.rotation.y = a; l.rotation.z = (i % 3 - 1) * 0.12;
    }
  } else { // petite plante dense
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4, rr = 0.03 + (i % 4) * 0.035;
      const l = sph(g, 0.1, i % 2 ? M.leaf : M.leaf2, Math.cos(a) * rr, baseY + 0.08 + (i % 5) * 0.05, Math.sin(a) * rr, 1.2, 0.5, 1.2);
      l.rotation.z = (i % 3 - 1) * 0.5;
    }
  }
  return g;
}

// --------------------------- Fauteuil dentaire -----------------------------
export function dentalChair(kit, p) {
  const M = kit.M, g = grp(p);
  // base et colonne
  cyl(g, 0.34, 0.37, 0.05, M.greyDark, 0, 0, 0, 28);
  cyl(g, 0.3, 0.31, 0.035, M.chrome, 0, 0.05, 0, 28);
  cyl(g, 0.11, 0.13, 0.32, M.white, 0, 0.085, 0, 20);
  cyl(g, 0.09, 0.09, 0.08, M.steel, 0, 0.3, 0, 16);
  box(g, 0.32, 0.1, 0.46, M.white, 0, 0.38, 0.02);           // châssis d'assise
  // assise
  rbox(g, 0.56, 0.11, 0.5, 0.05, M.leatherBlue, 0, 0.46, 0.08);
  // dossier articulé
  const back = grp(g, 0, 0.55, -0.2, 0, 0.32);
  rbox(back, 0.52, 0.11, 0.78, 0.05, M.leatherBlue, 0, -0.04, -0.38);
  box(back, 0.2, 0.05, 0.7, M.white, 0, -0.1, -0.38);
  // appui-tête
  const head = grp(back, 0, -0.02, -0.82, 0, -0.2);
  rbox(head, 0.28, 0.1, 0.2, 0.04, M.leatherBlue, 0, -0.03, -0.04);
  cylX(head, 0.012, 0.1, M.chrome, 0, -0.05, 0.12);
  // repose-jambes
  const leg = grp(g, 0, 0.5, 0.36, 0, 0.22);
  rbox(leg, 0.4, 0.09, 0.46, 0.04, M.leatherBlue, 0, -0.02, 0.22);
  box(leg, 0.16, 0.04, 0.4, M.white, 0, -0.08, 0.22);
  rbox(leg, 0.34, 0.04, 0.14, 0.02, M.rubber, 0, 0.03, 0.46); // repose-pieds
  // accoudoirs
  for (const s of [-1, 1]) {
    cyl(g, 0.012, 0.012, 0.16, M.chrome, s * 0.3, 0.5, 0.0, 8);
    rbox(g, 0.07, 0.05, 0.3, 0.02, M.leatherBlue, s * 0.31, 0.64, -0.05);
  }
  blob(kit, g, 1.2, 2.2, 0, -0.05, 0.007, 0.9);
  return g;
}

// Éclairage opératoire : bras articulé + tête à LED
export function opLight(kit, p, ceilY) {
  const M = kit.M, g = grp(p);
  cyl(g, 0.05, 0.05, 0.03, M.white, 0, ceilY - 0.03, 0, 16);
  cyl(g, 0.03, 0.03, 0.55, M.white, 0, ceilY - 0.58, 0, 12);
  const a1 = grp(g, 0, ceilY - 0.58, 0, 0.5);
  box(a1, 0.06, 0.05, 0.9, M.white, 0, -0.03, -0.35);
  const a2 = grp(a1, 0, 0, -0.8, -0.6);
  cyl(a2, 0.028, 0.028, 0.3, M.white, 0, -0.34, 0, 10);
  box(a2, 0.05, 0.04, 0.5, M.white, 0, -0.04, 0.2);
  const head = grp(a2, 0, -0.38, 0.38, 0, 0.12);
  cyl(head, 0.24, 0.26, 0.06, M.white, 0, -0.05, 0, 28);
  cyl(head, 0.2, 0.2, 0.012, M.ledCool, 0, -0.058, 0, 28, false);
  cyl(head, 0.05, 0.05, 0.015, M.white, 0, -0.064, 0, 14, false);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    cyl(head, 0.016, 0.016, 0.014, M.white, Math.cos(a) * 0.13, -0.066, Math.sin(a) * 0.13, 8, false);
  }
  box(head, 0.03, 0.03, 0.34, M.steel, 0, -0.06, 0.24);
  return g;
}

// Unit dentaire (chariot praticien) : flexibles, caméra intra-orale, écran
export function deliveryUnit(kit, p) {
  const M = kit.M, g = grp(p);
  rbox(g, 0.46, 0.8, 0.46, 0.04, M.white, 0, 0.05, 0);
  box(g, 0.42, 0.04, 0.5, M.black, 0, 0.0, 0);
  box(g, 0.3, 0.5, 0.02, M.wood, 0, 0.18, 0.235);
  cyl(g, 0.028, 0.028, 0.3, M.steel, 0, 0.85, 0, 10);
  // bras porte-instruments
  const arm = grp(g, 0, 1.12, 0, 0);
  box(arm, 0.08, 0.05, 0.62, M.white, 0, 0, 0.3);
  rbox(arm, 0.5, 0.08, 0.2, 0.03, M.white, 0, -0.01, 0.62);
  // instruments : 4 flexibles + turbine + contre-angle + seringue + détartreur
  const cols = [M.blueLight, M.steel, M.greyDark, M.chrome, M.green];
  for (let i = 0; i < 5; i++) {
    const x = -0.18 + i * 0.09;
    box(arm, 0.06, 0.05, 0.05, M.blackMatte, x, 0.01, 0.7);
    cyl(arm, 0.012, 0.012, 0.15, cols[i], x, 0.04, 0.7, 8);
    tube(arm, [[x, -0.01, 0.74], [x, -0.12, 0.8], [x + 0.02, -0.28, 0.76], [x + 0.03, -0.4, 0.62], [x, -0.46, 0.42]], 0.008, M.rubber, 0, 0, 0);
  }
  // caméra intra-orale
  cyl(arm, 0.014, 0.014, 0.17, M.white, 0.28, 0.0, 0.62, 10).rotation.x = Math.PI / 2.6;
  sph(arm, 0.02, M.black, 0.28, 0.04, 0.55);
  tube(arm, [[0.28, 0, 0.55], [0.3, -0.2, 0.45], [0.2, -0.4, 0.3], [0.05, -0.55, 0.2]], 0.006, M.rubber, 0, 0, 0);
  // écran sur bras
  const arm2 = grp(g, 0, 1.0, 0);
  box(arm2, 0.04, 0.04, 0.35, M.white, 0.12, 0, -0.1);
  cyl(g, 0.02, 0.02, 0.45, M.white, 0.12, 0.98, -0.26, 8);
  const mon = grp(g, 0.12, 1.45, -0.3, Math.PI * 0.12);
  box(mon, 0.34, 0.22, 0.025, M.black, 0, 0, 0);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.19), kit.M.screen('cbct'));
  sc.position.set(0, 0.11, 0.0135); mon.add(sc); sc.userData.noMerge = false;
  // petits boutons / panneau tactile
  box(g, 0.2, 0.04, 0.12, M.blackMatte, 0, 0.62, 0.15);
  box(g, 0.14, 0.005, 0.07, M.ledBlue, 0, 0.664, 0.15, false);
  blob(kit, g, 0.9, 0.9, 0, 0);
  return g;
}

// Unité d'aspiration / crachoir (côté assistante)
export function assistantUnit(kit, p) {
  const M = kit.M, g = grp(p);
  cyl(g, 0.12, 0.14, 0.05, M.greyDark, 0, 0, 0, 20);
  cyl(g, 0.05, 0.05, 0.55, M.white, 0, 0.05, 0, 14);
  const bowl = cyl(g, 0.12, 0.07, 0.07, M.ceramic, 0, 0.6, 0, 22);
  cyl(g, 0.1, 0.1, 0.01, M.blue, 0, 0.665, 0, 22, false);
  cyl(g, 0.012, 0.012, 0.12, M.chrome, 0.1, 0.66, 0, 8);
  cyl(g, 0.02, 0.02, 0.07, M.glass, -0.13, 0.62, 0, 10, false);
  // tuyaux d'aspiration (grande + petite)
  box(g, 0.18, 0.04, 0.1, M.white, 0, 0.9, 0.0);
  cyl(g, 0.02, 0.02, 0.3, M.white, 0, 0.6, 0, 10);
  box(g, 0.2, 0.05, 0.1, M.white, 0.12, 0.88, -0.02);
  tube(g, [[0.12, 0.9, 0.05], [0.2, 0.7, 0.15], [0.15, 0.5, 0.18], [0.08, 0.35, 0.1]], 0.013, M.greyDark, 0, 0, 0);
  tube(g, [[-0.04, 0.9, 0.05], [0.04, 0.72, 0.18], [0.0, 0.52, 0.2], [-0.05, 0.38, 0.1]], 0.008, M.blueLight, 0, 0, 0);
  blob(kit, g, 0.6, 0.6, 0, 0);
  return g;
}

export function stool(kit, p, { h = 0.52, back = false, mat = 'leather', seatR = 0.19 } = {}) {
  const M = kit.M, g = grp(p);
  const m = M[mat] || M.leather;
  cyl(g, 0.26, 0.26, 0.025, M.greyDark, 0, 0.04, 0, 5);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    const l = box(g, 0.28, 0.025, 0.035, M.greyDark, Math.cos(a) * 0.14, 0.06, Math.sin(a) * 0.14);
    l.rotation.y = -a;
    sph(g, 0.025, M.black, Math.cos(a) * 0.27, 0.025, Math.sin(a) * 0.27, 1, 1, 1, 8);
  }
  cyl(g, 0.025, 0.025, h - 0.16, M.chrome, 0, 0.08, 0, 10);
  rbox(g, seatR * 2, 0.07, seatR * 2, 0.08, m, 0, h - 0.07, 0);
  if (back) {
    rbox(g, 0.36, 0.2, 0.05, 0.04, m, 0, h + 0.14, -seatR - 0.03);
    box(g, 0.03, 0.14, 0.03, M.chrome, 0, h, -seatR - 0.02);
  }
  blob(kit, g, 0.7, 0.7, 0, 0);
  return g;
}

export function officeChair(kit, p, mat = 'fabricAnth') {
  const M = kit.M, g = grp(p);
  stool(kit, g, { h: 0.46, mat, seatR: 0.23 });
  rbox(g, 0.44, 0.5, 0.06, 0.05, M[mat], 0, 0.58, -0.24);
  box(g, 0.04, 0.12, 0.04, M.chrome, 0, 0.46, -0.22);
  for (const s of [-1, 1]) box(g, 0.04, 0.03, 0.26, M.black, s * 0.26, 0.68, -0.08);
  return g;
}

// -------------------------------- Rangements --------------------------------
// Éléments bas : len (m), profondeur 0.6, plan de travail ; sink: x local de la vasque (ou null)
export function baseCabinets(kit, p, { len = 1.2, depth = 0.6, h = 0.85, top = 'white', modules = null, drawers = 0, sink = null, handles = true } = {}) {
  const M = kit.M, g = grp(p);
  const n = modules || Math.max(1, Math.round(len / 0.6));
  const mw = len / n;
  box(g, len, h - 0.04, depth - 0.02, M.greyDark, len / 2, 0.08, -0.01);
  box(g, len, 0.08, depth - 0.06, M.black, len / 2, 0, -0.03);
  for (let i = 0; i < n; i++) {
    const cx = (i + 0.5) * mw;
    const useDrawers = i < drawers;
    if (useDrawers) {
      for (let k = 0; k < 3; k++) {
        const hh = (h - 0.14) / 3 - 0.012;
        box(g, mw - 0.012, hh, 0.02, M.white, cx, 0.09 + k * (hh + 0.012), depth / 2 - 0.02);
        if (handles) box(g, mw * 0.5, 0.012, 0.012, M.steel, cx, 0.09 + k * (hh + 0.012) + hh - 0.04, depth / 2 + 0.002);
      }
    } else {
      box(g, mw - 0.012, h - 0.14, 0.02, M.white, cx, 0.09, depth / 2 - 0.02);
      if (handles) box(g, 0.012, 0.22, 0.012, M.steel, cx + (i % 2 ? -1 : 1) * (mw / 2 - 0.05), 0.09 + h - 0.34, depth / 2 + 0.002);
    }
  }
  const topMat = top === 'wood' ? M.wood : top === 'steel' ? M.steel : M.whiteGloss;
  box(g, len + 0.02, 0.04, depth + 0.02, topMat, len / 2, h - 0.04, 0.0);
  if (sink != null) {
    box(g, 0.46, 0.012, 0.36, M.steel, sink, h - 0.002, 0.02);
    box(g, 0.4, 0.006, 0.3, M.greyDark, sink, h + 0.008, 0.02, false);
    cyl(g, 0.014, 0.014, 0.26, M.chrome, sink, h, -depth / 2 + 0.06, 10);
    const sp = box(g, 0.012, 0.012, 0.16, M.chrome, sink, h + 0.25, -depth / 2 + 0.14);
    cyl(g, 0.02, 0.02, 0.06, M.chrome, sink + 0.14, h, -depth / 2 + 0.06, 8);
  }
  return g;
}

export function wallCabinets(kit, p, { len = 1.2, depth = 0.32, h = 0.7, y = 1.5 } = {}) {
  const M = kit.M, g = grp(p);
  const n = Math.max(1, Math.round(len / 0.6)), mw = len / n;
  box(g, len, h, depth - 0.02, M.greyDark, len / 2, y, -0.01);
  for (let i = 0; i < n; i++) {
    box(g, mw - 0.012, h - 0.02, 0.02, M.white, (i + 0.5) * mw, y + 0.01, depth / 2 - 0.02);
    box(g, 0.012, 0.2, 0.012, M.steel, (i + 0.5) * mw + (mw / 2 - 0.05), y + h / 2 - 0.2, depth / 2 + 0.002);
  }
  return g;
}

export function tallCabinet(kit, p, { w = 0.6, d = 0.5, h = 2.1, wood = false, glass = false } = {}) {
  const M = kit.M, g = grp(p);
  box(g, w, h, d - 0.02, M.greyDark, 0, 0, -0.01);
  const front = wood ? M.wood : M.white;
  const n = glass ? 2 : 3;
  const bh = (h - 0.06) / n;
  for (let i = 0; i < n; i++) {
    const m = glass && i === 1 ? M.glass : front;
    box(g, w - 0.012, bh - 0.012, 0.02, m, 0, 0.03 + i * bh, d / 2 - 0.02, !(glass && i === 1));
    box(g, 0.012, 0.3, 0.012, M.steel, w / 2 - 0.06, 0.03 + i * bh + bh / 2 - 0.15, d / 2 + 0.002);
  }
  if (glass) { // contenu visible : boîtes d'instruments conditionnés
    for (let k = 0; k < 4; k++) box(g, w - 0.1, 0.18, 0.2, k % 2 ? M.blueLight : M.white, 0, 0.03 + bh + 0.04 + k * 0.01 + (k % 2) * 0.0, 0.0, false);
  }
  return g;
}

export function shelfUnit(kit, p, { w = 1.2, d = 0.4, h = 1.9, levels = 5, items = 'cartons', seed = 1 } = {}) {
  const M = kit.M, g = grp(p);
  for (const s of [-1, 1]) box(g, 0.04, h, d, M.steel, s * (w / 2 - 0.02), 0, 0);
  box(g, w, h * 0.9, 0.01, M.greyDark, 0, 0.1, -d / 2 + 0.005, false);
  let sd = seed;
  const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < levels; i++) {
    const y = 0.12 + i * ((h - 0.2) / (levels - 1));
    box(g, w - 0.04, 0.03, d, M.steel, 0, y, 0);
    let x = -w / 2 + 0.07;
    while (x < w / 2 - 0.2) {
      const bw = 0.12 + r() * 0.14, bh = 0.1 + r() * 0.2;
      if (x + bw > w / 2 - 0.05) break;
      const mats = items === 'cartons' ? [M.cardboard, M.cardboard2, M.white, M.blueLight] : [M.white, M.blueLight, M.offWhite, M.green];
      box(g, bw, Math.min(bh, (h - 0.2) / (levels - 1) - 0.05), d * 0.75, mats[(r() * mats.length) | 0], x + bw / 2, y + 0.03, 0.02);
      x += bw + 0.015;
    }
  }
  return g;
}

// ------------------------------ Informatique --------------------------------
export function monitor(kit, p, { w = 0.52, kind = 'chart', stand = true, tilt = 0 } = {}) {
  const M = kit.M, g = grp(p, 0, 0, 0, 0, tilt);
  const h = w * 0.58;
  box(g, w, h, 0.025, M.black, 0, 0.14, 0);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.025, h - 0.025), kit.M.screen(kind));
  sc.position.set(0, 0.14 + h / 2, 0.0135); g.add(sc);
  if (stand) {
    box(g, 0.04, 0.12, 0.03, M.greyDark, 0, 0.04, -0.02);
    box(g, 0.2, 0.012, 0.15, M.greyDark, 0, 0.0, 0.0);
  }
  return g;
}

export function workstation(kit, p, { w = 1.4, d = 0.7, kind = 'chart', dual = false, chair = true, tower = true } = {}) {
  const M = kit.M, g = grp(p);
  box(g, w, 0.035, d, M.wood, 0, 0.72, 0);
  for (const s of [-1, 1]) {
    box(g, 0.04, 0.72, d - 0.1, M.black, s * (w / 2 - 0.04), 0, 0);
  }
  box(g, w - 0.1, 0.35, 0.02, M.black, 0, 0.38, -d / 2 + 0.06);
  const m1 = grp(g, dual ? -0.28 : 0, 0.755, -0.12, dual ? 0.2 : 0);
  monitor(kit, m1, { kind, w: 0.5 });
  if (dual) { const m2 = grp(g, 0.28, 0.755, -0.12, -0.2); monitor(kit, m2, { kind: 'cbct', w: 0.5 }); }
  rbox(g, 0.42, 0.018, 0.14, 0.01, M.black, 0, 0.757, 0.16);
  rbox(g, 0.06, 0.02, 0.1, 0.02, M.black, 0.32, 0.757, 0.15);
  if (tower) box(g, 0.2, 0.4, 0.4, M.black, w / 2 - 0.2, 0.1, 0.0, true).position.y = 0.2;
  if (chair) { const c = grp(g, 0, 0, d / 2 + 0.3, Math.PI); officeChair(kit, c); }
  blob(kit, g, w + 0.4, d + 0.5, 0, 0.1);
  return g;
}

// -------------------------------- Salon / hall ------------------------------
export function sofa(kit, p, { w = 1.8, mat = 'fabricGrey' } = {}) {
  const M = kit.M, g = grp(p), m = M[mat];
  rbox(g, w, 0.18, 0.78, 0.05, m, 0, 0.12, 0);
  const seats = Math.max(1, Math.round(w / 0.6));
  for (let i = 0; i < seats; i++) rbox(g, w / seats - 0.04, 0.14, 0.58, 0.05, m, -w / 2 + (i + 0.5) * (w / seats), 0.28, 0.08);
  rbox(g, w, 0.46, 0.18, 0.06, m, 0, 0.3, -0.3);
  for (const s of [-1, 1]) rbox(g, 0.14, 0.3, 0.78, 0.05, m, s * (w / 2 - 0.07), 0.2, 0);
  for (const s of [-1, 1]) box(g, 0.03, 0.12, 0.03, M.wood, s * (w / 2 - 0.1), 0, 0.3), box(g, 0.03, 0.12, 0.03, M.wood, s * (w / 2 - 0.1), 0, -0.3);
  blob(kit, g, w + 0.4, 1.2, 0, 0);
  return g;
}
export function armchair(kit, p, mat = 'fabricGrey') {
  const M = kit.M, g = grp(p), m = M[mat];
  rbox(g, 0.78, 0.18, 0.74, 0.05, m, 0, 0.12, 0);
  rbox(g, 0.52, 0.14, 0.58, 0.05, m, 0, 0.28, 0.06);
  rbox(g, 0.78, 0.44, 0.16, 0.06, m, 0, 0.3, -0.29);
  for (const s of [-1, 1]) rbox(g, 0.13, 0.28, 0.72, 0.05, m, s * 0.325, 0.2, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.03, 0.12, 0.03, M.wood, sx * 0.3, 0, sz * 0.3);
  blob(kit, g, 1.2, 1.2, 0, 0);
  return g;
}
export function coffeeTable(kit, p, { r = 0.42, round = true } = {}) {
  const M = kit.M, g = grp(p);
  if (round) {
    cyl(g, r, r, 0.035, M.wood, 0, 0.4, 0, 28);
    cyl(g, 0.03, 0.03, 0.4, M.black, 0, 0, 0, 10);
    cyl(g, 0.2, 0.2, 0.02, M.black, 0, 0, 0, 20);
  } else {
    box(g, r * 2, 0.035, r * 1.3, M.wood, 0, 0.4, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.03, 0.4, 0.03, M.black, sx * (r - 0.06), 0, sz * (r * 0.65 - 0.06));
  }
  // magazines et carafe
  box(g, 0.28, 0.01, 0.2, M.white, -0.05, 0.435, 0.05, false).rotation.y = 0.3;
  box(g, 0.26, 0.01, 0.19, M.blueLight, -0.04, 0.445, 0.05, false).rotation.y = -0.2;
  cyl(g, 0.06, 0.05, 0.1, M.glass, 0.18, 0.435, -0.1, 14, false);
  blob(kit, g, r * 3, r * 3, 0, 0);
  return g;
}
export function floorLamp(kit, p) {
  const M = kit.M, g = grp(p);
  cyl(g, 0.12, 0.12, 0.02, M.black, 0, 0, 0, 20);
  cyl(g, 0.012, 0.012, 1.55, M.black, 0, 0.02, 0, 8);
  cyl(g, 0.17, 0.2, 0.26, M.led, 0, 1.5, 0, 20, false);
  return g;
}
export function artwork(kit, p, { w = 0.9, h = 0.65, seed = 1, palette } = {}) {
  const M = kit.M, g = grp(p);
  box(g, w + 0.05, h + 0.05, 0.03, M.black, 0, 0, 0).position.y = 0;
  const m = new THREE.MeshStandardMaterial({ map: artTexture(seed, palette), roughness: 0.8 });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  pl.position.z = 0.017; g.add(pl);
  return g;
}

// --------------------------------- Accueil ----------------------------------
// Comptoir incurvé : successions de segments le long d'une courbe de Bézier
export function curvedCounter(kit, p, pts, { depth = 0.62, h = 1.05, n = 18 } = {}) {
  const M = kit.M, g = grp(p);
  const curve = new THREE.CubicBezierCurve3(...pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const P = curve.getPoints(n);
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[i + 1];
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) + 0.035;
    const ang = Math.atan2(dx, dz);
    const cx = (a.x + b.x) / 2, cz = (a.z + b.z) / 2;
    const seg = grp(g, cx, 0, cz, ang + Math.PI / 2);
    box(seg, L, h - 0.04, depth, M.whiteGloss, 0, 0.1, 0);
    box(seg, L, 0.1, depth - 0.1, M.black, 0, 0, 0);
    box(seg, L, 0.045, depth + 0.1, M.woodSlat, 0, h - 0.05, 0.03);
    box(seg, L, 0.06, 0.02, M.wood, 0, 0.6, depth / 2 + 0.002);
    // plan transaction bas en façade
    box(seg, L, 0.035, depth * 0.6, M.wood, 0, 0.78, depth * 0.4);
    if (i % 3 === 1) { const c = P[i]; kit.col(cx, cz, 0.8, 0.8, 0, 'counter'); }
  }
  for (let i = 0; i <= n; i += 1) {
    const q = P[i]; if (i % 2 === 0) kit.col(q.x, q.z, 0.55, 0.55, 0, 'counter');
  }
  return g;
}

// --------------------------- Salle de pause / cuisine -------------------------
export function fridge(kit, p, { h = 1.85, w = 0.6 } = {}) {
  const M = kit.M, g = grp(p);
  rbox(g, w, h, 0.62, 0.02, M.offWhite, 0, 0, 0);
  box(g, w - 0.02, 0.005, 0.01, M.greyDark, 0, h * 0.34, 0.31);
  box(g, 0.02, 0.5, 0.03, M.steel, w / 2 - 0.07, h * 0.4, 0.33);
  box(g, 0.02, 0.35, 0.03, M.steel, w / 2 - 0.07, h * 0.72, 0.33);
  return g;
}
export function microwave(kit, p) {
  const M = kit.M, g = grp(p);
  box(g, 0.46, 0.27, 0.34, M.black, 0, 0, 0);
  box(g, 0.28, 0.2, 0.01, M.glass, -0.05, 0.035, 0.172, false);
  box(g, 0.08, 0.2, 0.01, M.greyDark, 0.16, 0.035, 0.172);
  return g;
}
export function coffeeMachine(kit, p) {
  const M = kit.M, g = grp(p);
  rbox(g, 0.26, 0.34, 0.34, 0.03, M.black, 0, 0, 0);
  box(g, 0.2, 0.02, 0.1, M.steel, 0, 0.13, 0.12);
  cyl(g, 0.03, 0.03, 0.06, M.white, 0, 0.0, 0.14, 10);
  return g;
}
export function diningTable(kit, p, { w = 1.7, d = 0.85 } = {}) {
  const M = kit.M, g = grp(p);
  box(g, w, 0.04, d, M.wood, 0, 0.72, 0);
  for (const sx of [-1, 1]) {
    box(g, 0.05, 0.72, d - 0.2, M.black, sx * (w / 2 - 0.12), 0, 0);
    box(g, 0.05, 0.05, d - 0.1, M.black, sx * (w / 2 - 0.12), 0, 0).scale.y = 1;
  }
  cyl(g, 0.045, 0.04, 0.12, M.pot, 0, 0.76, 0, 12);
  for (let i = 0; i < 5; i++) { const a = i * 1.26; sph(g, 0.05, M.leaf, Math.cos(a) * 0.04, 0.9, Math.sin(a) * 0.04, 1, 1.4, 0.4); }
  blob(kit, g, w + 0.3, d + 0.3, 0, 0);
  return g;
}
export function diningChair(kit, p, mat = 'fabricAnth') {
  const M = kit.M, g = grp(p);
  rbox(g, 0.42, 0.045, 0.42, 0.03, M[mat], 0, 0.44, 0);
  rbox(g, 0.4, 0.34, 0.035, 0.03, M[mat], 0, 0.5, -0.2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.025, 0.44, 0.025, M.black, sx * 0.18, 0, sz * 0.18);
  for (const sx of [-1, 1]) box(g, 0.025, 0.35, 0.025, M.black, sx * 0.18, 0.44, -0.2);
  blob(kit, g, 0.7, 0.7, 0, 0, 0.007, 0.6);
  return g;
}

// ------------------------------ Vestiaire / WC -------------------------------
export function lockers(kit, p, { n = 6, h = 1.8, w = 0.4, d = 0.5 } = {}) {
  const M = kit.M, g = grp(p);
  const cols = [0x8b9bb0, 0xa9b4a6, 0xb7b2a5];
  for (let i = 0; i < n; i++) {
    box(g, w - 0.01, h, d, M.greyDark, (i + 0.5) * w, 0.0, 0);
    box(g, w - 0.012, h - 0.04, 0.02, i % 2 ? M.offWhite : M.white, (i + 0.5) * w, 0.02, d / 2);
    box(g, 0.02, 0.1, 0.02, M.steel, (i + 0.5) * w + w / 2 - 0.06, h * 0.55, d / 2 + 0.02);
    for (let k = 0; k < 4; k++) box(g, 0.2, 0.01, 0.005, M.greyDark, (i + 0.5) * w, h - 0.18 + k * 0.025 - 0.02, d / 2 + 0.012, false);
    box(g, 0.05, 0.03, 0.005, M.wood, (i + 0.5) * w, h * 0.7, d / 2 + 0.012, false);
  }
  box(g, n * w, 0.03, d + 0.01, M.black, (n * w) / 2, h, 0);
  return g;
}
export function bench(kit, p, { len = 1.6, d = 0.35 } = {}) {
  const M = kit.M, g = grp(p);
  box(g, len, 0.04, d, M.wood, 0, 0.44, 0);
  for (const sx of [-1, 1]) { box(g, 0.04, 0.44, d - 0.06, M.black, sx * (len / 2 - 0.1), 0, 0); }
  box(g, len - 0.2, 0.025, 0.1, M.black, 0, 0.1, 0);
  blob(kit, g, len + 0.3, d + 0.4, 0, 0, 0.007, 0.7);
  return g;
}
export function hooks(kit, p, { n = 5, spacing = 0.28, coats = true } = {}) {
  const M = kit.M, g = grp(p);
  box(g, n * spacing, 0.12, 0.025, M.wood, (n * spacing) / 2 - spacing / 2, 1.65, 0);
  const cols = [M.blue, M.white, M.green, M.blueLight, M.offWhite];
  for (let i = 0; i < n; i++) {
    const x = i * spacing;
    cyl(g, 0.012, 0.012, 0.07, M.black, x, 1.66, 0.045, 8).rotation.x = Math.PI / 2;
    if (coats && i % 3 !== 2) {
      const c = grp(g, x, 1.22, 0.1);
      rbox(c, 0.24, 0.48, 0.1, 0.05, cols[i % cols.length], 0, 0, 0);
      box(c, 0.03, 0.2, 0.02, M.white, 0, 0.3, 0.0);
    }
  }
  return g;
}
export function toilet(kit, p) {
  const M = kit.M, g = grp(p);
  box(g, 0.38, 0.8, 0.18, M.ceramic, 0, 0.0, -0.34);
  sph(g, 0.2, M.ceramic, 0, 0.3, -0.02, 1.0, 0.8, 1.55);
  cyl(g, 0.17, 0.17, 0.03, M.ceramic, 0, 0.42, 0.02, 20).scale.z = 1.4;
  box(g, 0.1, 0.02, 0.04, M.chrome, 0, 0.82, -0.34, false);
  return g;
}
export function washbasin(kit, p, { pmr = true } = {}) {
  const M = kit.M, g = grp(p);
  rbox(g, 0.55, 0.12, 0.45, 0.06, M.ceramic, 0, 0.8, 0.05);
  box(g, 0.4, 0.01, 0.28, M.offWhite, 0, 0.915, 0.06, false);
  cyl(g, 0.012, 0.012, 0.18, M.chrome, 0, 0.92, -0.12, 8);
  box(g, 0.012, 0.012, 0.12, M.chrome, 0, 1.1, -0.06);
  // miroir incliné PMR
  const mi = grp(g, 0, 1.2, -0.2, 0, -0.18);
  box(mi, 0.55, 0.7, 0.015, M.mirror, 0, 0, 0);
  box(mi, 0.57, 0.72, 0.01, M.black, 0, -0.005, -0.012);
  return g;
}
export function grabBar(kit, p, { len = 0.7, vertical = false } = {}) {
  const M = kit.M, g = grp(p);
  if (vertical) cyl(g, 0.017, 0.017, len, M.steel, 0, 0, 0, 10);
  else cylX(g, 0.017, len, M.steel, 0, 0, 0, 10);
  return g;
}
export function dispenser(kit, p, mat) {
  const M = kit.M, g = grp(p);
  rbox(g, 0.12, 0.2, 0.08, 0.02, mat || M.white, 0, 0, 0);
  box(g, 0.05, 0.02, 0.02, M.chrome, 0, 0.04, 0.05);
  return g;
}

// ----------------------------- Matériel de soins ------------------------------
export function instrumentTray(kit, p) {
  const M = kit.M, g = grp(p);
  box(g, 0.28, 0.012, 0.2, M.steel, 0, 0, 0);
  box(g, 0.28, 0.025, 0.006, M.steel, 0, 0, 0.097); box(g, 0.28, 0.025, 0.006, M.steel, 0, 0, -0.097);
  for (let i = 0; i < 5; i++) {
    const m = cyl(g, 0.004, 0.004, 0.15, i % 2 ? M.chrome : M.steel, -0.09 + i * 0.045, 0.012, 0.01 * (i % 2), 6, false);
    m.rotation.x = Math.PI / 2; m.rotation.z = 0.04 * i;
    sph(g, 0.007, M.chrome, -0.09 + i * 0.045, 0.016, -0.07, 1, 1, 1, 6);
  }
  box(g, 0.06, 0.015, 0.06, M.blueLight, 0.1, 0.012, -0.05, false);
  return g;
}
export function counterItems(kit, p, seed = 1) {
  const M = kit.M, g = grp(p);
  // boîte de gants, distributeur de masques, gel hydroalcoolique, pot de coton
  box(g, 0.2, 0.08, 0.1, M.blueLight, 0, 0, 0);
  box(g, 0.1, 0.01, 0.02, M.white, 0, 0.082, 0.0, false);
  rbox(g, 0.12, 0.17, 0.1, 0.02, M.white, 0.28, 0, 0.0);
  cyl(g, 0.03, 0.03, 0.16, M.white, 0.5, 0, 0.0, 12);
  cyl(g, 0.012, 0.012, 0.04, M.steel, 0.5, 0.16, 0.0, 8);
  cyl(g, 0.045, 0.045, 0.1, M.glass, 0.7, 0, 0, 14, false);
  cyl(g, 0.04, 0.04, 0.07, M.white, 0.7, 0.0, 0, 14, false);
  return g;
}

// Hotte/évier double bac de stérilisation
export function sterilSink(kit, p, { w = 1.0 } = {}) {
  const M = kit.M, g = grp(p);
  baseCabinets(kit, g, { len: w, top: 'steel', modules: 2, depth: 0.65 });
  box(g, w * 0.38, 0.14, 0.4, M.greyDark, w * 0.25, 0.8, 0.02, false);
  box(g, w * 0.38, 0.14, 0.4, M.greyDark, w * 0.75, 0.8, 0.02, false);
  cyl(g, 0.014, 0.014, 0.3, M.chrome, w * 0.5, 0.85, -0.25, 8);
  box(g, 0.012, 0.012, 0.2, M.chrome, w * 0.5, 1.14, -0.15);
  box(g, w, 0.18, 0.02, M.steel, w / 2, 0.87, -0.32);
  return g;
}
export function autoclave(kit, p, { label = 'B' } = {}) {
  const M = kit.M, g = grp(p);
  rbox(g, 0.5, 0.42, 0.6, 0.03, M.white, 0, 0, 0);
  box(g, 0.34, 0.2, 0.012, M.greyDark, -0.04, 0.12, 0.3);
  box(g, 0.28, 0.14, 0.006, M.glassLead, -0.04, 0.15, 0.308, false);
  box(g, 0.1, 0.12, 0.012, M.black, 0.17, 0.19, 0.3);
  box(g, 0.07, 0.04, 0.006, M.ledGreen, 0.17, 0.2, 0.307, false);
  box(g, 0.06, 0.02, 0.01, M.steel, 0.17, 0.09, 0.305);
  box(g, 0.46, 0.012, 0.18, M.white, 0, 0.42, -0.2); // couvercle réservoir
  blob(kit, g, 0.7, 0.8, 0, 0, 0.004);
  return g;
}
export function washerDisinfector(kit, p) {
  const M = kit.M, g = grp(p);
  rbox(g, 0.6, 0.85, 0.62, 0.03, M.steel, 0, 0, 0);
  box(g, 0.48, 0.5, 0.01, M.greyDark, 0, 0.18, 0.31);
  box(g, 0.4, 0.4, 0.006, M.glass, 0, 0.23, 0.318, false);
  box(g, 0.48, 0.1, 0.012, M.black, 0, 0.72, 0.31);
  box(g, 0.08, 0.03, 0.006, M.ledBlue, 0.14, 0.76, 0.318, false);
  box(g, 0.03, 0.3, 0.03, M.chrome, 0.27, 0.22, 0.33);
  return g;
}
export function sealer(kit, p) {
  const M = kit.M, g = grp(p);
  rbox(g, 0.42, 0.14, 0.3, 0.03, M.white, 0, 0, 0);
  box(g, 0.34, 0.012, 0.06, M.greyDark, 0, 0.14, 0.04);
  box(g, 0.06, 0.012, 0.05, M.ledGreen, 0.14, 0.14, -0.08, false);
  box(g, 0.28, 0.008, 0.25, M.white, -0.0, 0.0, 0.25, false); // rouleau
  cylX(g, 0.04, 0.3, M.blueLight, 0, 0.1, -0.2);
  return g;
}
export function ultrasonicBath(kit, p) {
  const M = kit.M, g = grp(p);
  rbox(g, 0.36, 0.26, 0.28, 0.02, M.steel, 0, 0, 0);
  box(g, 0.3, 0.012, 0.22, M.greyDark, 0, 0.26, 0, false);
  box(g, 0.09, 0.05, 0.01, M.black, 0.11, 0.1, 0.14);
  return g;
}

// ------------------------------ Imagerie --------------------------------------
export function panoramic(kit, p) {
  const M = kit.M, g = grp(p);
  cyl(g, 0.36, 0.38, 0.05, M.greyDark, 0, 0, 0, 24);
  rbox(g, 0.22, 2.1, 0.22, 0.05, M.white, -0.2, 0.05, -0.22);       // colonne
  rbox(g, 0.12, 0.7, 0.15, 0.03, M.offWhite, -0.2, 1.5, -0.22);
  // bras rotatif (C)
  const arm = grp(g, 0, 1.78, 0);
  box(arm, 0.55, 0.16, 0.16, M.white, 0, 0, -0.1);
  rbox(arm, 0.18, 0.62, 0.2, 0.05, M.white, -0.36, -0.52, 0.0);   // tête émettrice
  rbox(arm, 0.18, 0.62, 0.2, 0.05, M.white, 0.36, -0.52, 0.0);    // détecteur
  box(arm, 0.04, 0.4, 0.02, M.ledBlue, -0.36, -0.42, 0.11, false);
  // poste patient : appui-menton + poignées
  cyl(g, 0.02, 0.02, 1.2, M.steel, 0.0, 0.7, 0.08, 10);
  rbox(g, 0.18, 0.05, 0.12, 0.02, M.black, 0.0, 1.22, 0.14);
  rbox(g, 0.05, 0.1, 0.05, 0.02, M.steel, 0.0, 1.27, 0.18);
  cylX(g, 0.012, 0.36, M.steel, 0, 1.38, 0.12, 8);
  box(g, 0.3, 0.08, 0.02, M.black, 0.0, 1.48, 0.0);
  // ecran tactile
  box(g, 0.12, 0.08, 0.012, M.black, -0.2, 1.34, -0.1);
  box(g, 0.1, 0.05, 0.005, M.ledBlue, -0.2, 1.355, -0.092, false);
  blob(kit, g, 1.4, 1.4, 0, 0);
  return g;
}
export function cbct(kit, p) {
  const M = kit.M, g = grp(p);
  cyl(g, 0.44, 0.46, 0.06, M.greyDark, 0, 0, 0, 28);
  rbox(g, 0.34, 2.15, 0.3, 0.06, M.white, 0, 0.06, -0.3);
  // portique avec anneau
  const ring = grp(g, 0, 1.45, 0.0);
  const t = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.07, 14, 36), M.white);
  t.rotation.x = Math.PI / 2; t.castShadow = true; ring.add(t);
  rbox(ring, 0.26, 0.2, 0.26, 0.04, M.white, 0, 0, -0.35);
  box(ring, 0.1, 0.16, 0.06, M.ledBlue, 0.0, 0.02, 0.44, false);
  // appui-tête + poignées
  cyl(g, 0.02, 0.02, 0.5, M.steel, 0, 0.9, 0.18, 10);
  rbox(g, 0.24, 0.06, 0.2, 0.02, M.black, 0, 1.28, 0.16);
  cylX(g, 0.013, 0.5, M.steel, 0, 1.2, 0.34, 8);
  box(g, 0.22, 0.12, 0.02, M.black, 0.42, 1.0, -0.1);
  blob(kit, g, 1.5, 1.5, 0, 0);
  return g;
}
export function apronRack(kit, p) {
  const M = kit.M, g = grp(p);
  cyl(g, 0.014, 0.014, 1.4, M.steel, 0, 0.0, 0, 8);
  box(g, 0.5, 0.025, 0.04, M.steel, 0, 1.4, 0);
  for (let i = 0; i < 3; i++) {
    const a = grp(g, -0.16 + i * 0.16, 0.85, 0.04);
    rbox(a, 0.14, 0.55, 0.035, 0.03, i % 2 ? M.greyDark : M.leatherBlue, 0, 0, 0);
    box(a, 0.12, 0.04, 0.036, M.yellow, 0, 0.45, 0.0, false);
  }
  cyl(g, 0.15, 0.17, 0.03, M.greyDark, 0, 0, 0, 16);
  return g;
}

// ------------------------------ Technique -------------------------------------
export function compressor(kit, p) {
  const M = kit.M, g = grp(p);
  // réservoir bleu horizontal
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.1, 24), M.blue);
  tank.rotation.z = Math.PI / 2; tank.position.set(0, 0.6, 0); tank.castShadow = tank.receiveShadow = true; g.add(tank);
  for (const s of [-1, 1]) sph(g, 0.28, M.blue, s * 0.55, 0.6, 0, 0.45, 1, 1, 18);
  for (const s of [-1, 1]) { box(g, 0.1, 0.32, 0.5, M.black, s * 0.38, 0.0, 0); }
  // groupe moteur
  rbox(g, 0.4, 0.34, 0.3, 0.04, M.blackMatte, -0.15, 0.95, 0.0);
  cyl(g, 0.12, 0.12, 0.16, M.greyDark, -0.15, 1.28, 0.0, 16);
  cyl(g, 0.045, 0.045, 0.12, M.alu, 0.3, 0.88, 0.0, 12);
  // manomètre + robinet
  cyl(g, 0.055, 0.055, 0.04, M.white, 0.35, 0.95, 0.27, 20).rotation.x = Math.PI / 2;
  cyl(g, 0.012, 0.012, 0.12, M.steel, 0.35, 0.8, 0.22, 8);
  box(g, 0.012, 0.05, 0.01, M.red, 0.35, 0.945, 0.3, false);
  // tuyauterie
  tube(g, [[0.5, 0.65, 0.0], [0.7, 0.9, 0.05], [0.72, 1.3, 0.05], [0.7, 1.9, -0.1]], 0.02, M.steel, 0, 0, 0);
  blob(kit, g, 1.9, 1.0, 0, 0);
  return g;
}
export function suctionUnit(kit, p) {
  const M = kit.M, g = grp(p);
  rbox(g, 0.6, 0.95, 0.55, 0.03, M.offWhite, 0, 0, 0);
  box(g, 0.5, 0.1, 0.01, M.black, 0, 0.7, 0.28);
  box(g, 0.1, 0.03, 0.006, M.ledGreen, 0.15, 0.735, 0.285, false);
  for (let i = 0; i < 4; i++) box(g, 0.4, 0.012, 0.005, M.greyDark, 0, 0.3 + i * 0.05, 0.28, false);
  cyl(g, 0.05, 0.05, 0.3, M.greyDark, 0.18, 0.95, 0.0, 12);
  cyl(g, 0.05, 0.05, 0.9, M.steel, 0.18, 1.25, 0.0, 12);
  tube(g, [[0.18, 1.6, 0.0], [0.2, 2.0, -0.05], [0.1, 2.5, -0.2], [0.0, 2.8, -0.28]], 0.04, M.steel, 0, 0, 0);
  blob(kit, g, 1.0, 0.9, 0, 0);
  return g;
}
export function amalgamSeparator(kit, p) {
  const M = kit.M, g = grp(p);
  rbox(g, 0.24, 0.44, 0.24, 0.03, M.white, 0, 0.0, 0.0);
  cyl(g, 0.07, 0.07, 0.14, M.glass, 0, 0.46, 0, 12, false);
  box(g, 0.1, 0.02, 0.005, M.ledGreen, 0, 0.3, 0.125, false);
  tube(g, [[0, 0.6, 0], [0.05, 1.2, -0.05], [0.0, 2.0, -0.1], [0.0, 2.5, -0.12]], 0.02, M.steel, 0, 0, 0);
  blob(kit, g, 0.6, 0.6, 0, 0);
  return g;
}

// ------------------------------ Ménage / déchets -----------------------------
export function serviceSink(kit, p) {
  const M = kit.M, g = grp(p);
  rbox(g, 0.6, 0.28, 0.55, 0.03, M.ceramic, 0, 0, 0);
  box(g, 0.5, 0.012, 0.45, M.offWhite, 0, 0.28, 0.0, false);
  box(g, 0.6, 0.12, 0.05, M.steel, 0, 0.28, -0.25);
  cyl(g, 0.014, 0.014, 0.35, M.chrome, 0, 0.7, -0.27, 8);
  box(g, 0.012, 0.012, 0.15, M.chrome, 0, 1.05, -0.2);
  box(g, 0.6, 0.55, 0.02, M.whiteGloss, 0, 0.28, -0.275, false);
  blob(kit, g, 1.0, 0.9, 0, 0.05);
  return g;
}
export function mopBucket(kit, p) {
  const M = kit.M, g = grp(p);
  box(g, 0.38, 0.28, 0.5, M.yellow, 0, 0.1, 0);
  box(g, 0.34, 0.12, 0.2, M.yellow, 0, 0.3, 0.27);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) sph(g, 0.04, M.black, sx * 0.15, 0.05, sz * 0.2, 1, 1, 1, 8);
  cyl(g, 0.012, 0.012, 1.15, M.steel, 0.08, 0.3, -0.15, 8).rotation.z = 0.12;
  cyl(g, 0.012, 0.012, 1.1, M.alu, -0.08, 0.3, -0.12, 8).rotation.z = -0.1;
  blob(kit, g, 0.9, 1.0, 0, 0);
  return g;
}
export function mopRail(kit, p, { n = 4 } = {}) {
  const M = kit.M, g = grp(p);
  box(g, n * 0.22, 0.06, 0.03, M.steel, (n * 0.22) / 2 - 0.1, 1.35, 0);
  for (let i = 0; i < n; i++) {
    const x = i * 0.22;
    cyl(g, 0.011, 0.011, 1.45, i % 2 ? M.wood : M.alu, x, 0.05, 0.05, 8);
    if (i % 2 === 0) { box(g, 0.28, 0.025, 0.07, M.blueLight, x, 0.02, 0.06); }
    else sph(g, 0.06, M.white, x, 0.14, 0.05, 1, 1.3, 1, 8);
  }
  return g;
}
export function bin(kit, p, mat, { h = 0.78, w = 0.44, d = 0.5, lid = null } = {}) {
  const M = kit.M, g = grp(p);
  rbox(g, w, h, d, 0.03, mat, 0, 0.1, 0);
  box(g, w + 0.02, 0.05, d + 0.02, lid || M.binBlack, 0, h + 0.1, 0);
  for (const sx of [-1, 1]) sph(g, 0.045, M.black, sx * (w / 2 - 0.04), 0.045, -d / 2 + 0.06, 1, 1, 1, 8);
  box(g, 0.14, 0.015, 0.02, M.black, 0, h + 0.11, d / 2 + 0.01, false);
  blob(kit, g, w + 0.4, d + 0.4, 0, 0);
  return g;
}
export function sharpsBox(kit, p) {
  const M = kit.M, g = grp(p);
  rbox(g, 0.2, 0.26, 0.15, 0.02, M.yellow, 0, 0, 0);
  box(g, 0.1, 0.01, 0.12, M.black, 0, 0.26, 0, false);
  box(g, 0.1, 0.1, 0.005, M.red, 0, 0.08, 0.077, false);
  return g;
}

// ------------------------------ Étiquettes & signalétique --------------------
export function textSprite(kit, text, { w = 0.6, sub = '', bg, fg, scale = 1 } = {}) {
  const t = labelTexture(text, { bg, fg, sub });
  const m = new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true });
  const s = new THREE.Sprite(m);
  s.scale.set(w * scale, (w * scale) / 4, 1);
  return s;
}
export function wallSign(kit, p, lines, { w = 0.22, icon = 'none', bg, fg } = {}) {
  const t = signTexture(lines, { icon, bg, fg });
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, w), m);
  pl.castShadow = false; pl.receiveShadow = true;
  p.add(pl); return pl;
}
