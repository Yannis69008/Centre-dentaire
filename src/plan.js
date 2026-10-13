// Plan géométrique du centre dentaire — source unique de vérité.
// Repère : x = est (0..19 m), z = sud (0..12 m). z=0 : façade nord, z=12 : façade sud (entrée patients).
// Les murs sont tracés sur les lignes de séparation ; l'épaisseur est répartie de part et d'autre.

export const W = 19.0;
export const D = 12.0;
export const WALL_H = 2.9;
export const EXT_T = 0.26;
export const INT_T = 0.12;
export const DOOR_H = 2.1;

// type de sol : wood | tile | tileDark | concrete | resin | steril
export const rooms = [
  { id: 'tech',      name: 'Local technique',  x0: 0,    z0: 0,    x1: 3.8,  z1: 1.65, floor: 'concrete', target: 6 },
  { id: 'stock',     name: 'Stock',            x0: 0,    z0: 1.65, x1: 3.8,  z1: 2.8,  floor: 'tile',     target: 4 },
  { id: 'bureau',    name: 'Bureau',           x0: 0,    z0: 2.8,  x1: 3.8,  z1: 5.6,  floor: 'wood',     target: 10 },
  { id: 'soin1',     name: 'Salle de soin 1',  x0: 4.8,  z0: 0,    x1: 7.3,  z1: 5.6,  floor: 'tile',     target: 14 },
  { id: 'soin2',     name: 'Salle de soin 2',  x0: 7.3,  z0: 0,    x1: 9.8,  z1: 5.6,  floor: 'tile',     target: 14 },
  { id: 'soin3',     name: 'Salle de soin 3',  x0: 9.8,  z0: 0,    x1: 12.3, z1: 5.6,  floor: 'tile',     target: 14 },
  { id: 'soin4',     name: 'Salle de soin 4',  x0: 12.3, z0: 0,    x1: 14.8, z1: 5.6,  floor: 'tile',     target: 14 },
  { id: 'imagerie',  name: 'Imagerie',         x0: 14.8, z0: 0,    x1: 19,   z1: 4.3,  floor: 'tileDark', target: 18 },
  { id: 'lecture',   name: 'Salle de lecture', x0: 14.8, z0: 4.3,  x1: 19,   z1: 5.6,  floor: 'tileDark', target: 6 },
  // Couloir : passage nord-ouest, couloir central et prolongement ouest
  { id: 'couloir',   name: 'Couloir',          x0: 3.8,  z0: 0,    x1: 4.8,  z1: 5.6,  floor: 'tile',     target: 12, label: false },
  { id: 'couloir',   name: 'Couloir',          x0: 0,    z0: 5.6,  x1: 19,   z1: 7.0,  floor: 'tile',     target: 12 },
  { id: 'entretien', name: "Salle d'entretien",x0: 0,    z0: 7.0,  x1: 3.8,  z1: 9.0,  floor: 'wood',     target: 8 },
  { id: 'pause',     name: 'Salle de pause',   x0: 0,    z0: 9.0,  x1: 3.8,  z1: 12,   floor: 'wood',     target: 12 },
  // Hall : accueil (zone derrière le comptoir) + salle d'attente
  { id: 'accueil',   name: 'Accueil',          x0: 3.8,  z0: 7.0,  x1: 9.8,  z1: 8.7,  floor: 'wood',     target: 10, zone: true },
  { id: 'attente',   name: "Salle d'attente",  x0: 3.8,  z0: 8.7,  x1: 9.8,  z1: 12,   floor: 'wood',     target: 20, zone: true },
  { id: 'sanitaires',name: 'Sanitaires PMR',   x0: 9.8,  z0: 7.0,  x1: 11.8, z1: 9.7,  floor: 'tile',     target: 4 },
  { id: 'menage',    name: 'Local ménage',     x0: 11.8, z0: 7.0,  x1: 14.2, z1: 9.7,  floor: 'resin',    target: 6 },
  { id: 'steril',    name: 'Stérilisation',    x0: 14.2, z0: 7.0,  x1: 19,   z1: 9.7,  floor: 'steril',   target: 12 },
  { id: 'vestiaire', name: 'Vestiaire',        x0: 9.8,  z0: 9.7,  x1: 14.2, z1: 12,   floor: 'tile',     target: 10 },
  { id: 'dechets',   name: 'Local déchets',    x0: 14.2, z0: 9.7,  x1: 17.2, z1: 12,   floor: 'resin',    target: 6 },
  { id: 'sas',       name: 'Sas de collecte',  x0: 17.2, z0: 9.7,  x1: 19,   z1: 12,   floor: 'resin',    target: 4, label: false },
];

// Portes (id, mur, position le long du mur, largeur, charnière, sens d'ouverture)
// Un mur : { x0,z0,x1,z1, ext, openings:[...] }.
// opening: { k:'door'|'double'|'window'|'open', at, w, sill?, h?, hinge:'a'|'b', swing:+1|-1, id }
//   'a' = charnière côté début du mur (x0/z0), 'b' = côté fin.
//   swing +1 : la porte s'ouvre vers +z (mur horizontal) ou +x (mur vertical) ; -1 : vers l'opposé.
const S = 3; // raccourci lisibilité

export const walls = [
  // ---------- Façade nord (z=0) ----------
  { x0: 0, z0: 0, x1: W, z1: 0, ext: true, openings: [
    { k: 'window', at: 2.4,  w: 0.9, sill: 1.3, h: 0.9 },                // local technique (haute)
    { k: 'window', at: 4.3,  w: 0.5, sill: 0.9, h: 1.4 },                // passage
    { k: 'window', at: 6.05, w: 1.5, sill: 0.85, h: 1.5 },               // soin 1
    { k: 'window', at: 8.55, w: 1.5, sill: 0.85, h: 1.5 },               // soin 2
    { k: 'window', at: 11.05,w: 1.5, sill: 0.85, h: 1.5 },               // soin 3
    { k: 'window', at: 13.55,w: 1.5, sill: 0.85, h: 1.5 },               // soin 4
    { k: 'window', at: 17.0, w: 1.6, sill: 1.35, h: 0.9 },               // imagerie (haute, protection)
  ]},
  // ---------- Façade sud (z=12) ----------
  { x0: 0, z0: D, x1: W, z1: D, ext: true, openings: [
    { k: 'window', at: 1.9,  w: 1.6, sill: 0.9, h: 1.3 },                // pause
    { k: 'window', at: 4.95, w: 1.7, sill: 0.1, h: 2.55 },               // vitrine hall
    { k: 'double', at: 6.85, w: 1.8, id: 'entree', hinge: 'a', swing: -1, glass: true },
    { k: 'window', at: 8.8,  w: 1.7, sill: 0.1, h: 2.55 },               // vitrine hall
    { k: 'window', at: 12.0, w: 1.4, sill: 1.5, h: 0.8 },                // vestiaire (haute)
  ]},
  // ---------- Façade ouest (x=0) ----------
  { x0: 0, z0: 0, x1: 0, z1: D, ext: true, openings: [
    { k: 'window', at: 4.2,  w: 1.5, sill: 0.9, h: 1.3 },                // bureau
    { k: 'window', at: 6.3,  w: 0.9, sill: 0.9, h: 1.3 },                // couloir ouest
    { k: 'window', at: 8.0,  w: 1.1, sill: 0.9, h: 1.3 },                // entretien
    { k: 'window', at: 10.5, w: 1.6, sill: 0.9, h: 1.3 },                // pause
  ]},
  // ---------- Façade est (x=19) ----------
  { x0: W, z0: 0, x1: W, z1: D, ext: true, openings: [
    { k: 'window', at: 2.0,  w: 1.4, sill: 1.35, h: 0.9 },               // imagerie (haute)
    { k: 'window', at: 8.3,  w: 1.4, sill: 1.1, h: 1.0 },                // stérilisation
    { k: 'door',   at: 10.85,w: 1.0, id: 'sortie_dechets', hinge: 'a', swing: +1, ext: true }, // sas -> extérieur
  ]},

  // ---------- Cloisons nord-ouest (x 0..3.8) ----------
  { x0: 0, z0: 1.65, x1: 3.8, z1: 1.65, openings: [] },
  { x0: 0, z0: 2.8,  x1: 3.8, z1: 2.8,  openings: [] },
  { x0: 0, z0: 5.6,  x1: 3.8, z1: 5.6,  openings: [] },
  // paroi est des locaux nord-ouest (x=3.8, z 0..5.6) vers le passage
  { x0: 3.8, z0: 0, x1: 3.8, z1: 5.6, openings: [
    { k: 'door', at: 0.95, w: 0.9, id: 'tech',   hinge: 'a', swing: -1 },
    { k: 'door', at: 2.2,  w: 0.8, id: 'stock',  hinge: 'a', swing: -1 },
    { k: 'door', at: 4.2,  w: 0.9, id: 'bureau', hinge: 'b', swing: -1 },
  ]},
  // paroi est du passage (x=4.8) = ouest soin 1
  { x0: 4.8, z0: 0, x1: 4.8, z1: 5.6, openings: [] },
  // ---------- Séparations entre salles de soins ----------
  { x0: 7.3,  z0: 0, x1: 7.3,  z1: 5.6, openings: [] },
  { x0: 9.8,  z0: 0, x1: 9.8,  z1: 5.6, openings: [] },
  { x0: 12.3, z0: 0, x1: 12.3, z1: 5.6, openings: [] },
  { x0: 14.8, z0: 0, x1: 14.8, z1: 5.6, openings: [] },
  // ---------- Murs sud des soins (z=5.6) : portes vers le couloir ----------
  { x0: 4.8, z0: 5.6, x1: W, z1: 5.6, openings: [
    { k: 'door', at: 6.05,  w: 0.9, id: 'soin1', hinge: 'a', swing: -1 },
    { k: 'door', at: 8.55,  w: 0.9, id: 'soin2', hinge: 'a', swing: -1 },
    { k: 'door', at: 11.05, w: 0.9, id: 'soin3', hinge: 'a', swing: -1 },
    { k: 'door', at: 13.55, w: 0.9, id: 'soin4', hinge: 'a', swing: -1 },
    { k: 'door', at: 17.9,  w: 0.9, id: 'lecture', hinge: 'b', swing: -1 },
  ]},
  // ---------- Imagerie / lecture (z=4.3) ----------
  { x0: 14.8, z0: 4.3, x1: W, z1: 4.3, openings: [
    { k: 'door', at: 16.9, w: 1.0, id: 'imagerie', hinge: 'a', swing: -1 },
    { k: 'window', at: 15.55, w: 0.6, sill: 1.0, h: 0.9, lead: true }, // vitre plombée de contrôle
  ]},
  // ---------- Mur sud du couloir (z=7.0) ----------
  { x0: 0, z0: 7.0, x1: W, z1: 7.0, openings: [
    { k: 'open', at: 8.65, w: 2.1 },                               // hall -> couloir (passage large)
    { k: 'door', at: 13.0,  w: 0.9, id: 'menage', hinge: 'b', swing: +1 },
    { k: 'door', at: 16.6,  w: 1.0, id: 'steril', hinge: 'a', swing: +1 },
  ]},
  // ---------- Entretien / pause / hall (x=3.8, z 7..12) ----------
  { x0: 3.8, z0: 7.0, x1: 3.8, z1: D, openings: [
    { k: 'door', at: 8.0,  w: 0.9, id: 'entretien', hinge: 'a', swing: -1 },
    { k: 'door', at: 10.6, w: 0.9, id: 'pause',     hinge: 'a', swing: -1 },
  ]},
  { x0: 0, z0: 9.0, x1: 3.8, z1: 9.0, openings: [] },
  // ---------- Paroi est du hall (x=9.8, z 7..12) ----------
  { x0: 9.8, z0: 7.0, x1: 9.8, z1: D, openings: [
    { k: 'door', at: 8.4,  w: 1.0, id: 'sanitaires', hinge: 'a', swing: -1 },
    { k: 'door', at: 10.95,w: 0.9, id: 'vestiaire',  hinge: 'a', swing: +1 },
  ]},
  // ---------- Bloc technique sud-est ----------
  { x0: 11.8, z0: 7.0, x1: 11.8, z1: 9.7, openings: [] },
  { x0: 14.2, z0: 7.0, x1: 14.2, z1: D, openings: [] },
  { x0: 9.8,  z0: 9.7, x1: W,    z1: 9.7, openings: [
    { k: 'door', at: 15.75, w: 0.9, id: 'steril_dechets', hinge: 'a', swing: +1 },
  ]},
  { x0: 17.2, z0: 9.7, x1: 17.2, z1: D, openings: [
    { k: 'door', at: 11.0, w: 0.9, id: 'dechets_sas', hinge: 'a', swing: +1 },
  ]},
];

// Points de téléportation (position + direction du regard en radians, 0 = vers -z / nord)
export const teleports = {
  entree:   { label: 'Entrée patients',  x: 6.85, z: 11.3, yaw: 0 },
  accueil:  { label: 'Accueil',          x: 8.2,  z: 8.6,  yaw: Math.PI * 0.85 },
  attente:  { label: "Salle d'attente",  x: 5.0,  z: 11.0, yaw: -0.6 },
  soin1:    { label: 'Soin 1',           x: 6.05, z: 4.6,  yaw: 0 },
  soin2:    { label: 'Soin 2',           x: 8.55, z: 4.6,  yaw: 0 },
  soin3:    { label: 'Soin 3',           x: 11.05,z: 4.6,  yaw: 0 },
  soin4:    { label: 'Soin 4',           x: 13.55,z: 4.6,  yaw: 0 },
  imagerie: { label: 'Imagerie',         x: 17.0, z: 3.5,  yaw: 0 },
  steril:   { label: 'Stérilisation',    x: 16.6, z: 7.6,  yaw: Math.PI },
  entretien:{ label: 'Entretien',        x: 1.9,  z: 7.7,  yaw: Math.PI * 0.5 },
  pause:    { label: 'Pause',            x: 2.0,  z: 10.0, yaw: Math.PI * 0.75 },
};

export function roomAt(x, z) {
  for (const r of rooms) if (x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1) return r;
  return null;
}

// Zones « couloir » fusionnées pour le calcul des surfaces
export function areaReport() {
  const byId = new Map();
  for (const r of rooms) {
    if (r.zone && false) continue;
    const a = (r.x1 - r.x0) * (r.z1 - r.z0);
    const e = byId.get(r.id) || { id: r.id, name: r.name, brut: 0, target: r.target };
    e.brut += a;
    byId.set(r.id, e);
  }
  return [...byId.values()];
}

// Surface utile approchée : retire la demi-épaisseur des murs sur les 4 côtés
export function netArea(r) {
  const tx0 = r.x0 === 0 ? EXT_T / 2 : INT_T / 2, tx1 = r.x1 === W ? EXT_T / 2 : INT_T / 2;
  const tz0 = r.z0 === 0 ? EXT_T / 2 : INT_T / 2, tz1 = r.z1 === D ? EXT_T / 2 : INT_T / 2;
  const sx0 = r.zone && r.id === 'attente' ? 0 : tx0;
  return (r.x1 - r.x0 - tx0 - tx1) * (r.z1 - r.z0 - tz0 - tz1);
}
export function innerRect(r) {
  const tx0 = r.x0 === 0 ? EXT_T / 2 : INT_T / 2, tx1 = r.x1 === W ? EXT_T / 2 : INT_T / 2;
  const tz0 = r.z0 === 0 ? EXT_T / 2 : INT_T / 2, tz1 = r.z1 === D ? EXT_T / 2 : INT_T / 2;
  return { x0: r.x0 + tx0, z0: r.z0 + tz0, x1: r.x1 - tx1, z1: r.z1 - tz1 };
}
