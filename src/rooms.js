import * as THREE from 'three';
import { box, cyl, cylX, sph, rbox, tube, plane, grp, blob } from './kit.js';
import * as F from './furniture.js';
import { rooms, WALL_H, innerRect } from './plan.js';

const PI = Math.PI;
const EXTI = 0.135, INTI = 0.065; // faces intérieures des murs (demi-épaisseur + jeu)

// Aménage toutes les pièces. `furn` reçoit meubles et équipements ; `labels` les étiquettes ;
// `ceil` les dalles lumineuses (groupe du toit) ; renvoie les sources lumineuses virtuelles.
export function furnish(kit, furn, ceil, labels) {
  const M = kit.M;
  const lightSources = [];
  const put = (fn, x, z, ry = 0, ...args) => { const g = grp(furn, x, 0, z, ry); fn(kit, g, ...args); return g; };
  const C = (x, z, w, d, ry = 0, tag = '') => kit.col(x, z, w, d, ry, tag);

  // pose un élément « de mur » : wall N/S/E/W, start = coordonnée de départ le long du mur, off = distance du mur à l'axe
  const run = (fn, wall, wallPos, start, off, len, depth, opts = {}, cprefix = '') => {
    let x, z, ry, cx, cz, cw, cd;
    if (wall === 'N') { x = start; z = wallPos + off; ry = 0; cx = x + len / 2; cz = z; cw = len; cd = depth; }
    else if (wall === 'S') { x = start; z = wallPos - off; ry = PI; cx = x - len / 2; cz = z; cw = len; cd = depth; }
    else if (wall === 'W') { x = wallPos + off; z = start; ry = PI / 2; cx = x; cz = z - len / 2; cw = depth; cd = len; }
    else { x = wallPos - off; z = start; ry = -PI / 2; cx = x; cz = z + len / 2; cw = depth; cd = len; }
    const g = grp(furn, x, 0, z, ry);
    fn(kit, g, opts);
    if (depth > 0) C(cx, cz, cw, cd, 0, cprefix || 'meuble');
    return g;
  };
  const onTop = (parentG, fn, lx, ly, lz, ry = 0, ...args) => { const g = grp(parentG, lx, ly, lz, ry); fn(kit, g, ...args); return g; };
  const lamp = (x, z, { power = 1, y = WALL_H - 0.03, w = 0.6, d = 0.6, warm = false } = {}) => {
    const m = box(ceil, w, 0.025, d, warm ? M.led : M.ledCool, x, y, z, false);
    m.userData.glow = true;
    lightSources.push({ x, y: WALL_H - 0.45, z, power });
  };
  const spot = (x, z) => { cyl(ceil, 0.05, 0.05, 0.02, M.led, x, WALL_H - 0.02, z, 12, false).userData.glow = true; };
  // étiquette d'équipement : petite, visible seulement à proximité (voir main.js)
  const label = (text, x, y, z, { w = 0.7 } = {}) => {
    const s = F.textSprite(kit, text, { w: w * 0.62, bg: 'rgba(15,20,25,0.72)' }); s.position.set(x, y, z);
    s.userData.eq = true; labels.add(s); return s;
  };
  const art = (x, y, z, ry, seed, w = 0.8, h = 0.55) => { const g = grp(furn, x, y, z, ry); F.artwork(kit, g, { w, h, seed }); return g; };

  const R = Object.fromEntries(rooms.filter((r) => !r.zone || true).map((r) => [r.id + (r.zone ? '' : ''), innerRect(r)]));
  const ri = (id) => R[id];

  // =====================================================================
  //   SALLES DE SOINS (x4 identiques)
  // =====================================================================
  for (let i = 0; i < 4; i++) {
    const rx = 4.8 + i * 2.5;           // origine locale
    const X = (lx) => rx + lx;          // helper local -> monde
    const cx = X(1.4);
    // fauteuil, tête vers le nord (fenêtre) ; décalé vers l'est pour laisser un passage côté ouest
    put(F.dentalChair, cx, 2.45);
    C(cx, 2.3, 0.78, 1.9, 0, 'fauteuil');
    // scialytique au plafond
    const L = grp(furn, cx, 0, 1.85, 0);
    F.opLight(kit, L, WALL_H - 0.05);
    // unit praticien (côté est), flexibles vers le fauteuil
    put(F.deliveryUnit, X(2.12), 1.6, -PI / 2);
    C(X(2.12), 1.6, 0.46, 0.46, 0, 'unit');
    // unité d'aspiration / crachoir (côté ouest, assistante)
    put(F.assistantUnit, X(0.3), 2.3, PI / 2);
    C(X(0.3), 2.3, 0.3, 0.3, 0, 'crachoir');
    // tabourets : praticien en tête, assistante côté ouest
    const s1 = put(F.stool, cx + 0.05, 0.85, 0.2, { h: 0.55, back: true, mat: 'leatherBlue' });
    C(cx + 0.05, 0.85, 0.46, 0.46, 0, 'tabouret');
    const s2 = put(F.stool, X(2.05), 3.55, 2.6, { h: 0.6, back: true, mat: 'leather' });
    C(X(2.05), 3.55, 0.46, 0.46, 0, 'tabouret');
    // meubles de rangement : ouest, avec évier + plan de travail ; éléments hauts
    const west = run((k, g) => { F.baseCabinets(k, g, { len: 1.2, depth: 0.58, modules: 2, drawers: 1, sink: 0.85, top: 'white' }); }, 'W', rx, 5.1, 0.37, 1.2, 0.6, {}, 'meuble');
    const westUp = run((k, g) => { F.wallCabinets(k, g, { len: 1.2, y: 1.45, h: 0.75 }); }, 'W', rx, 5.1, 0.22, 1.2, 0, {});
    // sur le plan de travail : plateau d'instruments, gants, etc.
    const wTop = grp(furn, X(0.37), 0.85, 4.45, PI / 2);
    F.instrumentTray(kit, grp(wTop, 0, 0, 0.2));
    F.counterItems(kit, grp(wTop, 0.28, 0.0, 0.0));
    // armoire haute vitrée côté est
    run((k, g) => F.tallCabinet(k, g, { w: 0.6, d: 0.5, h: 2.0, glass: i % 2 === 0 }), 'E', rx + 2.5, 4.1, 0.32, 0.6, 0.5, {}, 'armoire');
    // plantes sous la fenêtre
    put(F.plant, X(0.34), 0.34, 0, { h: 0.7, kind: 'sansevieria' }); C(X(0.34), 0.34, 0.3, 0.3, 0, 'plante');
    put(F.plant, X(2.15), 0.34, 0, { h: 0.7, kind: 'small' }); C(X(2.15), 0.34, 0.3, 0.3, 0, 'plante');
    // moniteur d'imagerie murale (est)
    const mw = grp(furn, X(2.42), 1.35, 2.9, -PI / 2);
    F.monitor(kit, mw, { w: 0.5, kind: i % 2 ? 'pano' : 'chart', stand: false });
    // signalétique : numéro sur la porte (côté couloir)
    const sg = grp(furn, X(1.25 + 0.65), 1.55, 5.6 + 0.07, 0);
    F.wallSign(kit, sg, [`Soin ${i + 1}`], { w: 0.18, bg: '#f4f5f6', fg: '#222' });
    // éclairage
    lamp(X(1.25), 1.55, { power: 0.8 }); lamp(X(1.25), 3.9, { power: 0.8 });
    spot(X(0.5), 4.7); spot(X(2.0), 4.7);
  }

  // =====================================================================
  //   IMAGERIE (x 14.8..19, z 0..4.3)
  // =====================================================================
  {
    put(F.panoramic, 15.85, 1.55, 0.0);
    C(15.85, 1.5, 1.0, 1.0, 0, 'panoramique');
    put(F.cbct, 17.85, 1.55, 0.0);
    C(17.85, 1.55, 1.0, 1.0, 0, 'cbct');
    // poste de visualisation contre le mur est
    const ws = grp(furn, 18.52, 0, 3.15, -PI / 2);
    F.workstation(kit, ws, { w: 1.2, d: 0.6, kind: 'pano', dual: false });
    C(18.55, 3.15, 0.6, 1.2, 0, 'poste'); C(17.9, 3.15, 0.5, 0.5, 0, 'siege');
    // tablier de plomb
    put(F.apronRack, 18.62, 0.45, 0); C(18.62, 0.45, 0.4, 0.3, 0, 'tabliers');
    put(F.plant, 15.1, 3.75, 0, { h: 1.1, kind: 'ficus' }); C(15.1, 3.75, 0.4, 0.4, 0, 'plante');
    // signalisation rayons X
    const s1 = grp(furn, 16.12, 1.55, 4.3 - 0.07, PI);   // face intérieure de la porte (côté imagerie)
    F.wallSign(kit, s1, ['Rayons X', 'Protection à valider'], { w: 0.26, icon: 'trefoil' });
    const s2 = grp(furn, 17.2, 1.55, 5.6 + 0.07, 0);
    F.wallSign(kit, s2, ['Zone contrôlée', 'Rayons X (à valider)'], { w: 0.26, icon: 'trefoil' });
    // marquage au sol : zones d'exposition
    const ring = (x, z, r) => { const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.04, 40), M.yellow); m.rotation.x = -PI / 2; m.position.set(x, 0.008, z); furn.add(m); m.receiveShadow = true; };
    ring(15.85, 1.55, 0.95); ring(17.85, 1.55, 0.95);
    lamp(16.0, 1.4); lamp(17.9, 1.4); lamp(16.9, 3.3);
    label('Protections plombées à valider', 16.9, 2.3, 2.9, { w: 0.9 }).visible = false;
  }
  // salle de lecture / contrôle (x 14.8..19, z 4.3..5.6)
  {
    const ws = grp(furn, 15.9, 0, 5.21, PI);
    F.workstation(kit, ws, { w: 1.4, d: 0.6, kind: 'pano', dual: true });
    C(15.9, 5.2, 1.4, 0.62, 0, 'poste'); C(15.9, 4.63, 0.44, 0.44, 0, 'siege');
    put(F.plant, 18.7, 4.65, 0, { h: 0.9, kind: 'small' }); C(18.7, 4.65, 0.3, 0.3, 0, 'plante');
    // vitre plombée visible côté contrôle : déjà dans le mur ; panneau de contrôle
    const p = grp(furn, 16.3, 1.1, 4.3 + 0.08, 0);
    box(p, 0.3, 0.1, 0.03, M.black, 0, 0, 0);
    box(p, 0.06, 0.03, 0.02, M.ledRed, -0.08, 0.04, 0.02, false);
    lamp(16.4, 4.95, { w: 0.5, d: 0.25 }); lamp(18.2, 4.95, { w: 0.5, d: 0.25 });
  }

  // =====================================================================
  //   STÉRILISATION (x 14.2..19, z 7..9.7) — circuit sale (ouest) -> propre (est)
  // =====================================================================
  {
    const rd = (x0, x1, mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 2.52), mat); m.rotation.x = -PI / 2; m.position.set((x0 + x1) / 2, 0.006, 8.35); furn.add(m); };
    rd(14.26, 15.95, M.floorRed);
    rd(17.35, 18.87, M.floorGreen);
    // zone sale : double bac + thermodésinfecteur au nord-ouest
    const sink = run((k, g) => F.sterilSink(k, g, { w: 1.1 }), 'N', 7.0, 14.32, 0.395, 1.1, 0.65, {}, 'sterilSink');
    const wd = run((k, g) => F.washerDisinfector(k, g), 'N', 7.0, 15.42, 0.37, 0.62, 0.64, {}, 'thermodesinfecteur');
    // paillasse sale ouest + bac à ultrasons
    const west = run((k, g) => F.baseCabinets(k, g, { len: 1.3, depth: 0.6, modules: 2, top: 'steel' }), 'W', 14.2, 9.55, 0.37, 1.3, 0.6, {}, 'paillasse');
    onTop(grp(furn, 14.55, 0.85, 8.9, PI / 2), F.ultrasonicBath, 0, 0, 0);
    F.instrumentTray(kit, grp(furn, 14.55, 0.855, 8.35));
    // zone propre : plan de travail sud, 2 autoclaves classe B + thermoscelleuse
    const south = run((k, g) => F.baseCabinets(k, g, { len: 2.45, depth: 0.62, modules: 4, top: 'steel', drawers: 4 }), 'S', 9.7, 18.85, 0.375, 2.45, 0.62, {}, 'paillasse propre');
    // sur le plan (hauteur 0.85) : autoclave 1, autoclave 2 (option), thermoscelleuse
    const a1 = grp(furn, 18.4, 0.85, 9.34, PI); F.autoclave(kit, a1);
    const a2 = grp(furn, 17.78, 0.85, 9.34, PI); F.autoclave(kit, a2);
    const se = grp(furn, 17.1, 0.85, 9.34, PI); F.sealer(kit, se);
    // armoires basses + rangement des instruments propres, est
    run((k, g) => F.baseCabinets(k, g, { len: 1.85, depth: 0.58, modules: 3, top: 'wood', drawers: 1 }), 'E', 19.0, 7.12, 0.435, 1.85, 0.6, {}, 'rangement propre');
    for (let k = 0; k < 4; k++) {
      const b = grp(furn, 18.6, 0.89, 7.4 + k * 0.4, -PI / 2);
      box(b, 0.25, 0.05, 0.3, M.blueLight, 0, 0, 0); box(b, 0.25, 0.05, 0.3, M.white, 0, 0.05, 0);
    }
    // signalétique + étiquettes
    const s1 = grp(furn, 14.9, 1.55, 7.07, 0); F.wallSign(kit, s1, ['ZONE SALE', 'Lavage'], { w: 0.28, bg: '#d54a43', fg: '#fff', icon: 'biohazard' });
    const s2 = grp(furn, 17.9, 1.55, 9.63, PI); F.wallSign(kit, s2, ['ZONE PROPRE', 'Stérilisation'], { w: 0.28, bg: '#2f9b57', fg: '#fff' });
    label('Autoclave B n°1', 18.4, 1.55, 9.2, { w: 0.5 }); label('Autoclave B n°2 (option)', 17.78, 1.62, 9.2, { w: 0.62 }); label('Thermoscelleuse', 17.1, 1.38, 9.2, { w: 0.5 });
    label('Thermodésinfecteur', 15.75, 1.34, 7.55, { w: 0.55 }); label('Circuit sale → propre', 16.6, 2.1, 8.4, { w: 0.9 });
    lamp(15.4, 8.3, { power: 0.8 }); lamp(18.0, 8.3, { power: 0.8 });
  }

  // =====================================================================
  //   LOCAL DÉCHETS (x 14.2..17.2, z 9.7..12) + SAS (17.2..19)
  // =====================================================================
  {
    const defs = [
      ['DASRI (infectieux)', M.binYellow, M.binBlack], ['Déchets ménagers', M.binGrey, M.binBlack],
      ['Recyclable', M.binBlue, M.binBlue], ['Verre / carton', M.binGreen, M.binGreen],
    ];
    defs.forEach(([name, mat, lid], i) => {
      const x = 14.6 + i * 0.55;
      const g = grp(furn, x, 0, 11.52, PI); F.bin(kit, g, mat, { lid, h: 0.78, w: 0.46, d: 0.5 });
      C(x, 11.52, 0.5, 0.54, 0, 'bac');
      label(name, x, 1.28, 11.62, { w: 0.5 });
    });
    // rayonnage ouest : boîtes à aiguilles et conteneurs fermés
    const sh = grp(furn, 14.48, 0, 10.55, PI / 2); F.shelfUnit(kit, sh, { w: 1.4, d: 0.4, h: 1.7, levels: 4, items: 'cartons' });
    C(14.48, 10.55, 0.4, 1.4, 0, 'rayonnage');
    for (let k = 0; k < 3; k++) { const s = grp(furn, 14.55, 0.82 + k * 0.4, 10.0 + k * 0.25, PI / 2); F.sharpsBox(kit, s); }
    // séparateur d'amalgame
    const am = grp(furn, 16.85, 0, 9.98, -PI / 2); F.amalgamSeparator(kit, am); C(16.85, 9.98, 0.28, 0.28, 0, 'amalgame');
    // zone au sol marquée
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.7), M.floorRed); fl.rotation.x = -PI / 2; fl.position.set(15.7, 0.006, 11.52); furn.add(fl);
    const sg = grp(furn, 16.75, 1.55, 9.78, 0); F.wallSign(kit, sg, ['Déchets', 'Accès restreint'], { w: 0.22, icon: 'biohazard' });
    lamp(15.7, 10.8, { w: 0.5, d: 0.5 });
    // sas de collecte
    put(F.bin, 18.5, 11.5, PI, M.binGrey, { h: 0.9, w: 0.6, d: 0.7 }); C(18.5, 11.5, 0.62, 0.7, 0, 'conteneur');
    const t = grp(furn, 17.6, 0.0, 10.15, 0); box(t, 0.5, 0.05, 0.6, M.greyDark, 0, 0.1, 0); box(t, 0.5, 0.5, 0.02, M.greyDark, 0, 0.15, -0.3);
    cyl(t, 0.03, 0.03, 0.05, M.black, -0.2, 0.0, 0.2, 8); cyl(t, 0.03, 0.03, 0.05, M.black, 0.2, 0.0, 0.2, 8);
    C(17.6, 10.15, 0.5, 0.6, 0, 'chariot');
    label('Sas de collecte', 18.1, 2.2, 10.9, { w: 0.7 });
    lamp(18.1, 10.8, { w: 0.4, d: 0.4, power: 0.6 });
  }

  // =====================================================================
  //   LOCAL MÉNAGE (x 11.8..14.2, z 7..9.7)
  // =====================================================================
  {
    const sh = grp(furn, 12.08, 0, 8.45, PI / 2); F.shelfUnit(kit, sh, { w: 1.3, d: 0.4, h: 1.9, levels: 5, items: 'cartons', seed: 4 });
    C(12.08, 8.45, 0.4, 1.3, 0, 'rayonnage');
    // bidons / flacons sur étagère
    for (let k = 0; k < 6; k++) { const c = cyl(furn, 0.045, 0.05, 0.22, k % 2 ? M.blueLight : M.green, 12.1, 1.0 + (k % 3) * 0.35, 8.0 + k * 0.08, 10); c.position.x = 12.1; }
    const ss = grp(furn, 13.25, 0, 9.36, PI); F.serviceSink(kit, ss); C(13.25, 9.36, 0.65, 0.6, 0, 'bac a laver');
    const mr = grp(furn, 14.07, 0, 7.75, -PI / 2); F.mopRail(kit, mr, { n: 3 }); C(14.0, 8.05, 0.2, 0.8, 0, 'balais');
    put(F.mopBucket, 12.75, 9.05, 0.35); C(12.75, 9.05, 0.5, 0.6, 0, 'seau');
    const sg = grp(furn, 12.2, 1.6, 7.07, 0); F.wallSign(kit, sg, ['Local ménage'], { w: 0.2, bg: '#2c6cb8', fg: '#fff' });
    // consigne : aucun stockage dans le passage
    const hk = grp(furn, 13.6, 0, 7.12, 0); box(hk, 0.4, 0.025, 0.02, M.steel, 0, 1.4, 0);
    lamp(13.0, 8.35, { w: 0.5, d: 0.5, power: 0.7 });
  }

  // =====================================================================
  //   SANITAIRES PMR (x 9.8..11.8, z 7..9.7)
  // =====================================================================
  {
    put(F.toilet, 11.0, 7.5, 0); C(11.0, 7.5, 0.45, 0.8, 0, 'wc');
    const gb = (x, y, z, ry, len, vert = false) => { const g = grp(furn, x, y, z, ry); F.grabBar(kit, g, { len, vertical: vert }); };
    gb(10.52, 0.8, 7.45, PI / 2, 0.7); gb(11.7, 0.8, 7.5, PI / 2, 0.7); gb(11.7, 0.8, 8.0, PI / 2, 0.5);
    gb(10.54, 0.75, 7.75, 0, 0.0, true);
    put(F.washbasin, 11.5, 8.95, -PI / 2); C(11.45, 8.95, 0.45, 0.55, 0, 'lavabo');
    const dp = grp(furn, 11.7, 1.1, 8.55, -PI / 2); F.dispenser(kit, dp, M.white);
    const ppr = grp(furn, 11.7, 0.9, 7.0 + 0.9, -PI / 2); cyl(ppr, 0.06, 0.06, 0.12, M.white, 0, 0, 0, 12).rotation.x = PI / 2;
    // poubelle + plante
    put(F.bin, 10.15, 9.4, PI, M.binGrey, { h: 0.3, w: 0.22, d: 0.22 });
    // signalétique PMR
    const sg = grp(furn, 9.72, 1.5, 9.25, -PI / 2); F.wallSign(kit, sg, ['Sanitaires', 'PMR'], { w: 0.2, bg: '#1d4e89', fg: '#fff', icon: 'wheelchair' });
    // zone de rotation 1,50 m (marquage discret)
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.73, 0.75, 40), M.blueLight); ring.rotation.x = -PI / 2; ring.position.set(10.75, 0.007, 8.5); furn.add(ring);
    lamp(10.8, 8.3, { w: 0.4, d: 0.4, power: 0.6 });
  }

  // =====================================================================
  //   VESTIAIRE (x 9.8..14.2, z 9.7..12)
  // =====================================================================
  {
    run((k, g) => F.lockers(k, g, { n: 5, w: 0.4, h: 1.85, d: 0.5 }), 'E', 14.2, 9.78, 0.32, 2.0, 0.5, {}, 'casiers');
    run((k, g) => F.lockers(k, g, { n: 5, w: 0.4, h: 1.85, d: 0.5 }), 'N', 9.7, 11.5, 0.32, 2.0, 0.5, {}, 'casiers');
    put(F.bench, 11.9, 11.15, 0); C(11.9, 11.15, 1.6, 0.4, 0, 'banc');
    const hk = grp(furn, 11.5, 0, 11.82, PI); F.hooks(kit, hk, { n: 5, spacing: 0.28, coats: true });
    // miroir
    const mi = grp(furn, 10.2, 1.45, 11.84, PI); box(mi, 0.5, 0.9, 0.015, M.mirror, 0, 0, 0);
    // tapis
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), M.fabricAnth); rug.rotation.x = -PI / 2; rug.position.set(11.9, 0.006, 10.55); rug.receiveShadow = true; furn.add(rug);
    put(F.plant, 10.2, 9.95, 0, { h: 1.0, kind: 'palm' }); C(10.2, 9.95, 0.4, 0.4, 0, 'plante');
    lamp(11.5, 10.9, { w: 0.6, d: 0.4, power: 0.8 });
  }

  // =====================================================================
  //   LOCAL TECHNIQUE (x 0..3.8, z 0..1.65)
  // =====================================================================
  {
    put(F.compressor, 0.98, 0.72, 0); C(0.98, 0.72, 1.7, 0.7, 0, 'compresseur');
    put(F.amalgamSeparator, 2.0, 0.4, 0); C(2.0, 0.4, 0.3, 0.3, 0, 'amalgame');
    put(F.suctionUnit, 2.58, 0.72, 0); C(2.58, 0.72, 0.65, 0.6, 0, 'aspiration');
    // gaines d'air et grille de ventilation
    const gr = grp(furn, 2.6, 2.3, 0.145, 0); box(gr, 0.4, 0.2, 0.02, M.greyDark, 0, 0, 0);
    for (let k = 0; k < 5; k++) box(gr, 0.36, 0.01, 0.01, M.alu, 0, 0.02 + k * 0.035, 0.014, false);
    // signe sur porte (côté couloir)
    const s2 = grp(furn, 3.88, 1.5, 0.27, PI / 2); F.wallSign(kit, s2, ['Local technique', 'Accès restreint'], { w: 0.2, bg: '#f4f5f6', fg: '#222' });
    lamp(1.8, 0.85, { w: 0.5, d: 0.3, power: 0.7 });
  }

  // =====================================================================
  //   STOCK (x 0..3.8, z 1.65..2.8) : une seule rangée de rayonnages pour garder un passage
  // =====================================================================
  {
    const s1 = run((k, g) => F.shelfUnit(k, g, { w: 1.2, d: 0.4, h: 1.95, levels: 5, seed: 2 }), 'N', 1.65, 0.62, 0.2 + INTI, 0, 0, {});
    // shelfUnit est centré : repositionner
    s1.parent.remove(s1);
    const place = (x) => { const g = grp(furn, x, 0, 1.65 + INTI + 0.2, 0); F.shelfUnit(kit, g, { w: 1.2, d: 0.4, h: 1.95, levels: 5, seed: x }); C(x, 1.65 + INTI + 0.2, 1.2, 0.4, 0, 'rayonnage'); };
    place(1.2); place(2.4);
    const w = grp(furn, 0.34, 0, 2.28, PI / 2); F.shelfUnit(kit, w, { w: 0.9, d: 0.4, h: 1.95, levels: 5, seed: 9 }); C(0.34, 2.28, 0.4, 0.9, 0, 'rayonnage');
    // cartons au sol (hors circulation)
    const cb = (x, z) => { box(furn, 0.4, 0.3, 0.3, M.cardboard, x, 0, z); };
    lamp(1.9, 2.25, { w: 0.5, d: 0.25, power: 0.6 });
  }

  // =====================================================================
  //   BUREAU (x 0..3.8, z 2.8..5.6)
  // =====================================================================
  {
    const ws = grp(furn, 0.5, 0, 4.2, PI / 2); F.workstation(kit, ws, { w: 1.5, d: 0.7, kind: 'chart', dual: true });
    C(0.5, 4.2, 0.7, 1.5, 0, 'bureau'); C(1.3, 4.2, 0.55, 0.55, 0, 'siege');
    // bibliothèques nord
    const bs = (x) => { const g = grp(furn, x, 0, 2.86 + INTI + 0.17, 0); F.shelfUnit(kit, g, { w: 1.1, d: 0.34, h: 1.9, levels: 5, seed: x * 3, items: 'doc' }); C(x, 3.09, 1.1, 0.34, 0, 'etagere'); };
    bs(1.05); bs(2.2);
    put(F.tallCabinet, 3.3, 3.1, 0, { w: 0.55, d: 0.45, h: 1.7 }); C(3.3, 3.1, 0.55, 0.45, 0, 'classeur');
    run((k, g) => F.baseCabinets(k, g, { len: 1.1, depth: 0.5, modules: 2, top: 'wood' }), 'S', 5.6, 2.2, 0.32, 1.1, 0.5, {}, 'imprimante');
    box(furn, 0.38, 0.2, 0.32, M.white, 1.65, 0.85, 5.3);
    put(F.plant, 3.45, 5.3, 0, { h: 1.3, kind: 'ficus' }); C(3.45, 5.3, 0.4, 0.4, 0, 'plante');
    art(1.9, 1.55, 5.54 - 0.04, PI, 3, 0.8, 0.5);
    lamp(1.9, 4.2, { w: 0.6, d: 0.6, power: 0.9 });
  }

  // =====================================================================
  //   SALLE D'ENTRETIEN (x 0..3.8, z 7..9) : confidentialité, devis, signatures
  // =====================================================================
  {
    const tb = grp(furn, 1.75, 0, 8.0, PI / 2); F.diningTable(kit, tb, { w: 1.4, d: 0.8 }); C(1.75, 8.0, 0.8, 1.4, 0, 'table');
    const ch = (x, z, ry) => { const c = grp(furn, x, 0, z, ry); F.diningChair(kit, c, 'fabricGrey'); C(x, z, 0.45, 0.45, 0, 'chaise'); };
    ch(0.95, 7.65, PI / 2); ch(0.95, 8.35, PI / 2);          // patient(s) côté ouest (regardent vers l'est)
    const oc = grp(furn, 2.55, 0, 8.0, -PI / 2); F.officeChair(kit, oc, 'fabricAnth'); C(2.55, 8.0, 0.5, 0.5, 0, 'siege');
    // ordinateur orienté vers le patient
    const mo = grp(furn, 1.75, 0.76, 7.95, -PI / 2); F.monitor(kit, mo, { w: 0.44, kind: 'devis' });
    const kb = grp(furn, 2.0, 0.76, 8.0, -PI / 2); rbox(kb, 0.34, 0.015, 0.12, 0.01, M.black, 0, 0, 0);
    // dossier de devis et stylo
    box(furn, 0.21, 0.012, 0.3, M.white, 1.45, 0.76, 8.35).rotation.y = 0.15;
    // desserte
    run((k, g) => F.baseCabinets(k, g, { len: 1.2, depth: 0.45, modules: 2, top: 'wood' }), 'N', 7.0, 0.7, 0.3, 1.2, 0.45, {}, 'desserte');
    box(furn, 0.12, 0.1, 0.12, M.white, 1.0, 0.85, 7.36);
    put(F.plant, 0.4, 8.68, 0, { h: 1.2, kind: 'ficus' }); C(0.4, 8.68, 0.4, 0.4, 0, 'plante');
    art(2.2, 1.5, 7.06 + 0.04, 0, 7, 0.7, 0.5);
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.7), M.fabricGrey); rug.rotation.x = -PI / 2; rug.position.set(1.75, 0.006, 8.0); rug.receiveShadow = true; furn.add(rug);
    const sg = grp(furn, 3.88, 1.5, 8.76, PI / 2); F.wallSign(kit, sg, ['Entretien', 'Confidentiel'], { w: 0.2, bg: '#1d4e89', fg: '#fff' });
    lamp(1.75, 8.0, { w: 0.7, d: 0.7, power: 0.9, warm: true });
  }

  // =====================================================================
  //   SALLE DE PAUSE (x 0..3.8, z 9..12)
  // =====================================================================
  {
    run((k, g) => F.baseCabinets(k, g, { len: 2.4, depth: 0.6, modules: 4, top: 'wood', drawers: 1, sink: 1.5 }), 'N', 9.0, 0.2, 0.375, 2.4, 0.62, {}, 'kitchenette');
    run((k, g) => F.wallCabinets(k, g, { len: 2.4, y: 1.5, h: 0.72 }), 'N', 9.0, 0.2, 0.22, 2.4, 0, {});
    const fr = grp(furn, 3.05, 0, 9.4, 0); F.fridge(kit, fr); C(3.05, 9.4, 0.62, 0.64, 0, 'frigo');
    // petit électroménager
    const mw = grp(furn, 0.8, 0.85, 9.3, 0); F.microwave(kit, mw);
    const cm = grp(furn, 2.3, 0.85, 9.3, 0); F.coffeeMachine(kit, cm);
    // table + 4 chaises
    const tb = grp(furn, 1.7, 0, 10.6, 0); F.diningTable(kit, tb, { w: 1.5, d: 0.85 }); C(1.7, 10.6, 1.5, 0.85, 0, 'table');
    [[1.15, 9.95, 0], [2.25, 9.95, 0], [1.15, 11.25, PI], [2.25, 11.25, PI]].forEach(([x, z, ry]) => { const c = grp(furn, x, 0, z, ry); F.diningChair(kit, c, 'fabricAnth'); C(x, z, 0.45, 0.45, 0, 'chaise'); });
    put(F.plant, 3.45, 11.6, 0, { h: 1.1, kind: 'palm' }); C(3.45, 11.6, 0.4, 0.4, 0, 'plante');
    put(F.plant, 0.35, 11.6, 0, { h: 0.8, kind: 'small' });
    // tableau d'affichage
    const pb = grp(furn, 3.7, 1.5, 10.3, -PI / 2); box(pb, 0.6, 0.4, 0.02, M.woodSlat, 0, 0, 0); for (let k = 0; k < 4; k++) box(pb, 0.12, 0.15, 0.005, k % 2 ? M.white : M.yellow, -0.2 + k * 0.13, 0.12, 0.012, false);
    lamp(1.7, 10.6, { w: 0.7, d: 0.7, power: 0.9, warm: true });
  }

  // =====================================================================
  //   ACCUEIL + SALLE D'ATTENTE (hall x 3.8..9.8, z 7..12)
  // =====================================================================
  {
    // comptoir incurvé (courbe de Bézier)
    const pts = [[5.4, 7.75], [5.7, 9.25], [7.1, 9.25], [7.4, 7.75]];
    const ct = grp(furn, 0, 0, 0, 0); F.curvedCounter(kit, ct, pts, { depth: 0.62, h: 1.05, n: 22 });
    const curve = new THREE.CubicBezierCurve3(...pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));
    // deux postes d'accueil derrière le comptoir
    [0.3, 0.7].forEach((t) => {
      const p = curve.getPoint(t), tg = curve.getTangent(t);
      const nz = new THREE.Vector3(-tg.z, 0, tg.x); // normale
      if (nz.z > 0) nz.negate();                       // pointe vers l'arrière (nord)
      const ang = Math.atan2(nz.x, nz.z);             // écran tourné vers le personnel
      const m = grp(furn, p.x + nz.x * 0.05, 1.055, p.z + nz.z * 0.05, ang); F.monitor(kit, m, { w: 0.5, kind: 'devis' });
      const ch = grp(furn, p.x + nz.x * 0.85, 0, p.z + nz.z * 0.85, ang + PI); F.officeChair(kit, ch, 'fabricAnth');
      kit.col(p.x + nz.x * 0.85, p.z + nz.z * 0.85, 0.5, 0.5, 0, 'siege');
    });
    // plan de travail arrière + mur de lattes de bois
    run((k, g) => F.baseCabinets(k, g, { len: 2.0, depth: 0.55, modules: 4, top: 'white', drawers: 2 }), 'N', 7.0, 5.0, 0.37, 2.0, 0.55, {}, 'meuble accueil');
    const slats = grp(furn, 0, 0, 0, 0);
    for (let i = 0; i < 48; i++) box(slats, 0.045, 2.7, 0.04, i % 3 ? M.woodSlat : M.wood, 3.95 + i * 0.075, 0.1, 7.1, false);
    // enseigne rétro-éclairée
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.5), new THREE.MeshBasicMaterial({ map: logoTexture(), toneMapped: false, transparent: true }));
    sign.position.set(5.6, 1.95, 7.135); furn.add(sign);
    // écran d'information
    const tv = grp(furn, 7.05, 1.35, 7.075, 0); F.monitor(kit, tv, { w: 0.7, kind: 'chart', stand: false });
    // coin attente (côté est, couloir ouest laissé libre vers entretien / pause)
    // seating rangé le long des murs : couloir central libre entre l'entrée, le couloir et les portes latérales
    const sf = grp(furn, 4.27, 0, 9.6, PI / 2); F.sofa(kit, sf, { w: 1.1, mat: 'fabricGrey' }); C(4.27, 9.6, 0.85, 1.1, 0, 'canapé');
    const a1 = grp(furn, 5.2, 0, 11.4, PI); F.armchair(kit, a1, 'fabricGrey'); C(5.2, 11.4, 0.8, 0.8, 0, 'fauteuil');
    const a2 = grp(furn, 9.35, 0, 9.65, -PI / 2); F.armchair(kit, a2, 'fabricGrey'); C(9.35, 9.65, 0.8, 0.8, 0, 'fauteuil');
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), M.fabricAnth); rug.rotation.x = -PI / 2; rug.position.set(4.85, 0.006, 9.6); rug.receiveShadow = true; furn.add(rug);
    put(F.floorLamp, 9.5, 10.15, 0); C(9.5, 10.15, 0.3, 0.3, 0, 'lampadaire');
    // plantes (grandes, comme sur le plan)
    put(F.plant, 4.2, 11.55, 0, { h: 1.9, kind: 'ficus' }); C(4.2, 11.55, 0.5, 0.5, 0, 'plante');
    put(F.plant, 7.25, 7.45, 0, { h: 1.5, kind: 'palm' }); C(7.25, 7.45, 0.4, 0.4, 0, 'plante');
    put(F.plant, 9.45, 11.62, 0, { h: 1.7, kind: 'ficus' }); C(9.45, 11.62, 0.5, 0.5, 0, 'plante');
    // décors muraux
    art(9.72, 1.55, 9.65, -PI / 2, 4, 0.9, 0.62);
    art(3.88, 1.55, 9.3, PI / 2, 6, 0.9, 0.62);
    // tapis d'entrée
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.9), M.rubber); mat.rotation.x = -PI / 2; mat.position.set(6.85, 0.007, 11.4); mat.receiveShadow = true; furn.add(mat);
    // éclairage
    lamp(5.0, 8.0, { w: 0.7, d: 0.7, power: 1.0, warm: true });
    lamp(6.7, 8.0, { w: 0.7, d: 0.7, power: 1.0, warm: true });
    lamp(5.2, 10.2, { w: 0.9, d: 0.9, power: 1.2, warm: true });
    lamp(8.4, 10.4, { w: 0.9, d: 0.9, power: 1.1, warm: true });
    lamp(6.9, 11.2, { w: 0.7, d: 0.7, power: 1.0, warm: true });
    for (const t of [0.2, 0.5, 0.8]) { const p = curve.getPoint(t); cyl(ceil, 0.01, 0.01, 0.5, M.black, p.x, WALL_H - 0.5, p.z, 6, false); cyl(ceil, 0.14, 0.14, 0.14, M.led, p.x, WALL_H - 0.62, p.z, 18, false).userData.glow = true; }
  }

  // =====================================================================
  //   COULOIR CENTRAL (x 3.8..19, z 5.6..7) + passage nord-ouest (3.8..4.8, 0..5.6)
  // =====================================================================
  {
    // éclairage linéaire
    for (const x of [6.0, 9.0, 12.0, 15.0, 17.8]) lamp(x, 6.3, { w: 1.0, d: 0.2, power: 0.9 });
    lamp(1.9, 6.3, { w: 0.8, d: 0.2, power: 0.7 });
    lamp(4.3, 3.0, { w: 0.2, d: 0.8, power: 0.7 });
    lamp(4.3, 0.9, { w: 0.2, d: 0.8, power: 0.6 });
    // décoration
    art(10.9, 1.55, 6.93, PI, 8, 1.1, 0.7);
    art(14.5, 1.55, 6.93, PI, 9, 0.8, 0.6);
    art(4.6, 1.5, 6.93, PI, 13, 0.6, 0.5);
    put(F.plant, 18.6, 6.3, 0, { h: 1.7, kind: 'ficus' }); C(18.6, 6.3, 0.45, 0.45, 0, 'plante');
    put(F.plant, 0.4, 6.35, 0, { h: 1.5, kind: 'palm' }); C(0.4, 6.35, 0.45, 0.45, 0, 'plante');
    // banc au bout ouest
    const bn = grp(furn, 1.5, 0, 6.72, 0); F.bench(kit, bn, { len: 1.2, d: 0.34 }); C(1.5, 6.72, 1.2, 0.34, 0, 'banc');
    put(F.plant, 4.6, 0.38, 0, { h: 0.9, kind: 'small' });
    // extincteur et plan d'évacuation
    const ex = grp(furn, 8.15, 0, 5.72, 0); cyl(ex, 0.07, 0.07, 0.4, M.red, 0, 0.5, 0, 14); cyl(ex, 0.02, 0.02, 0.1, M.black, 0, 0.9, 0, 8);
    const pl = grp(furn, 8.75, 1.45, 5.67, 0); F.wallSign(kit, pl, ['Plan', 'évacuation'], { w: 0.22, bg: '#2f9b57', fg: '#fff' });
  }

  return lightSources;
}

let _logo = null;
function logoTexture() {
  if (_logo) return _logo;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 1024, 256);
  g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.textBaseline = 'middle';
  // dent stylisée
  g.save(); g.translate(80, 128); g.fillStyle = '#ffffff';
  g.beginPath(); g.moveTo(-50, -40); g.bezierCurveTo(-70, -60, -20, -70, 0, -55); g.bezierCurveTo(20, -70, 70, -60, 50, -40);
  g.bezierCurveTo(60, 0, 35, 70, 28, 70); g.bezierCurveTo(20, 70, 18, 10, 0, 10); g.bezierCurveTo(-18, 10, -20, 70, -28, 70); g.bezierCurveTo(-35, 70, -60, 0, -50, -40);
  g.fill(); g.restore();
  g.font = '600 92px "Helvetica Neue", Arial, sans-serif'; g.fillText('CENTRE DENTAIRE', 170, 108);
  g.font = '300 44px "Helvetica Neue", Arial, sans-serif'; g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillText('Soins · Imagerie · Prévention', 172, 192);
  _logo = new THREE.CanvasTexture(c); _logo.colorSpace = THREE.SRGBColorSpace;
  return _logo;
}
