import { rooms, netArea, W, D, WALL_H } from './plan.js';

// Vérification automatique de la cohérence du plan :
//  1. surfaces annoncées / surfaces modélisées
//  2. meubles qui traversent les murs
//  3. dégagement du débattement de chaque porte
//  4. accessibilité de toutes les pièces (portes ouvertes) pour un visiteur de 0,50 m d'emprise
export function verifyLayout(c, { radius = 0.25, step = 0.05, verbose = false } = {}) {
  const res = { areas: [], embedded: [], doorSwing: [], unreachableRooms: [], pockets: [], thresholds: [], narrow: [], total: {} };

  // ---- 1. surfaces ----
  const ids = [...new Set(rooms.map((r) => r.id))];
  let net = 0, target = 0;
  for (const id of ids) {
    const rs = rooms.filter((r) => r.id === id);
    const a = rs.reduce((s, r) => s + netArea(r), 0);
    const brut = rs.reduce((s, r) => s + (r.x1 - r.x0) * (r.z1 - r.z0), 0);
    const t = rs[0].target;
    res.areas.push({ id, name: rs[0].name, target: t, net: +a.toFixed(1), brut: +brut.toFixed(1), ecart: +(((a - t) / t) * 100).toFixed(0) });
    net += a; target += t;
  }
  res.total = { net: +net.toFixed(1), target, enveloppe: W * D };

  // ---- 2. meubles dans les murs ----
  const ov = (a, b) => {
    const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), d = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
    return w > 0 && d > 0 ? Math.min(w, d) : 0;
  };
  const furn = c.kit.colliders, walls = c.wallCol;
  for (const f of furn) for (const w of walls) {
    const p = ov(f, w);
    if (p > 0.03) res.embedded.push({ meuble: f.tag, x: +((f.x0 + f.x1) / 2).toFixed(2), z: +((f.z0 + f.z1) / 2).toFixed(2), penetration: +p.toFixed(2), mur: w.tag });
  }

  // ---- 3. débattement des portes ----
  const hit = (x, z, rr) => {
    for (const f of furn) {
      const dx = Math.max(f.x0 - x, 0, x - f.x1), dz = Math.max(f.z0 - z, 0, z - f.z1);
      if (dx * dx + dz * dz < rr * rr) return f;
    }
    return null;
  };
  for (const d of c.doors) {
    for (const e of d.entries) {
      const hp = e.pivot.position;
      const leaf = e.pivot.children[0];
      // longueur du vantail
      const L = (d.w - 0.04) / d.entries.length;
      // directions : u = direction fermée, n = direction ouverte
      const ang = leaf.rotation.y; // R(ang)(1,0) = (cos, -sin)
      const u = { x: Math.cos(ang), z: -Math.sin(ang) };
      const th = e.openAngle;      // pivot rotation : R(th) u = n
      const n = { x: u.x * Math.cos(th) + u.z * Math.sin(th), z: -u.x * Math.sin(th) + u.z * Math.cos(th) };
      let bad = null;
      for (let phi = 0; phi <= 1.0001 && !bad; phi += 0.1) {
        const dir = { x: u.x * Math.cos(phi * Math.PI / 2) + n.x * Math.sin(phi * Math.PI / 2), z: u.z * Math.cos(phi * Math.PI / 2) + n.z * Math.sin(phi * Math.PI / 2) };
        for (let r = 0.12; r <= L && !bad; r += 0.1) {
          const x = hp.x + dir.x * r, z = hp.z + dir.z * r;
          const f = hit(x, z, 0.03);
          if (f) bad = { porte: d.id, bloque_par: f.tag, x: +x.toFixed(2), z: +z.toFixed(2) };
        }
      }
      if (bad) res.doorSwing.push(bad);
    }
  }

  // ---- 4. accessibilité ----
  const x0 = -1.5, x1 = W + 3, z0 = -1.5, z1 = D + 3.5;
  const nx = Math.ceil((x1 - x0) / step), nz = Math.ceil((z1 - z0) / step);
  const blocked = new Uint8Array(nx * nz);
  const allCol = [...walls, ...furn];
  const rr = radius;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = x0 + (i + 0.5) * step, z = z0 + (j + 0.5) * step;
    let b = 0;
    for (const f of allCol) {
      const dx = Math.max(f.x0 - x, 0, x - f.x1), dz = Math.max(f.z0 - z, 0, z - f.z1);
      if (dx * dx + dz * dz < rr * rr) { b = 1; break; }
    }
    blocked[j * nx + i] = b;
  }
  const idx = (x, z) => [Math.floor((x - x0) / step), Math.floor((z - z0) / step)];
  const reach = new Uint8Array(nx * nz);
  const [sx, sz] = idx(6.85, D + 1.5);
  const q = [sz * nx + sx]; reach[q[0]] = 1;
  for (let h = 0; h < q.length; h++) {
    const k = q[h], i = k % nx, j = (k / nx) | 0;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
      const kk = jj * nx + ii;
      if (reach[kk] || blocked[kk]) continue;
      reach[kk] = 1; q.push(kk);
    }
  }
  // pièces : proportion de cellules libres atteintes
  const perRoom = {};
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = x0 + (i + 0.5) * step, z = z0 + (j + 0.5) * step;
    if (blocked[j * nx + i]) continue;
    const r = rooms.find((q2) => x >= q2.x0 && x < q2.x1 && z >= q2.z0 && z < q2.z1);
    if (!r) continue;
    const e = perRoom[r.id] || (perRoom[r.id] = { libre: 0, atteint: 0 });
    e.libre++; if (reach[j * nx + i]) e.atteint++;
  }
  for (const [id, e] of Object.entries(perRoom)) {
    if (e.atteint === 0) res.unreachableRooms.push(id);
    else if (e.atteint / e.libre < 0.97) res.pockets.push({ piece: id, libre_m2: +(e.libre * step * step).toFixed(2), atteint_m2: +(e.atteint * step * step).toFixed(2) });
  }
  res.reachShare = Object.fromEntries(Object.entries(perRoom).map(([id, e]) => [id, +(e.atteint / e.libre).toFixed(2)]));
  // seuils de portes : cellule de part et d'autre
  for (const d of c.doors) {
    const sides = [-0.55, 0.55].map((s) => ({ x: d.cx + (d.horizontal ? 0 : s), z: d.cz + (d.horizontal ? s : 0) }));
    const ok = sides.map((p) => { const [i, j] = idx(p.x, p.z); return !!reach[j * nx + i]; });
    if (!(ok[0] && ok[1])) res.thresholds.push({ porte: d.id, cote_a: ok[0], cote_b: ok[1] });
  }
  // largeur de passage minimale : sur les portes (cellules libres sur le seuil)
  for (const d of c.doors) {
    let free = 0;
    for (let s = -d.w / 2; s <= d.w / 2; s += step) {
      const x = d.cx + (d.horizontal ? s : 0), z = d.cz + (d.horizontal ? 0 : s);
      const [i, j] = idx(x, z);
      if (!blocked[j * nx + i]) free++;
    }
    // passage libre pour le centre d'un visiteur (rayon pris en compte) : > 0 suffit
    if (free === 0) res.narrow.push({ porte: d.id, largeur_utile_m: 0 });
  }
  res._grid = { nx, nz, x0, z0, step, blocked, reach };
  return res;
}

export function printReport(r) {
  const L = [];
  L.push('SURFACES (m²) : nom | annoncé | modélisé (utile) | écart');
  for (const a of r.areas) L.push(`  ${a.name.padEnd(18)} ${String(a.target).padStart(3)}  ${String(a.net).padStart(6)}  ${a.ecart >= 0 ? '+' : ''}${a.ecart}%`);
  L.push(`  TOTAL annoncé ${r.total.target} m² ; modélisé ${r.total.net} m² utiles dans une enveloppe de ${r.total.enveloppe} m²`);
  L.push(`MEUBLES DANS LES MURS : ${r.embedded.length}`);
  r.embedded.slice(0, 20).forEach((e) => L.push('  ' + JSON.stringify(e)));
  L.push(`PORTES BLOQUÉES PAR UN MEUBLE : ${r.doorSwing.length}`);
  r.doorSwing.forEach((e) => L.push('  ' + JSON.stringify(e)));
  L.push(`PIÈCES INACCESSIBLES : ${r.unreachableRooms.length ? r.unreachableRooms.join(', ') : 'aucune'}`);
  L.push(`ZONES ISOLÉES / PARTIELLEMENT ACCESSIBLES : ${r.pockets.length}`);
  r.pockets.forEach((e) => L.push('  ' + JSON.stringify(e)));
  L.push(`SEUILS DE PORTES NON ATTEIGNABLES : ${r.thresholds.length}`);
  r.thresholds.forEach((e) => L.push('  ' + JSON.stringify(e)));
  L.push(`PORTES TROP ÉTROITES POUR UN VISITEUR : ${r.narrow.length}`);
  r.narrow.forEach((e) => L.push('  ' + JSON.stringify(e)));
  return L.join('\n');
}
