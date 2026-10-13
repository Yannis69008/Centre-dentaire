import * as THREE from 'three';

// Textures procédurales (canvas) — aucune ressource externe.
const HAS_DOM = typeof document !== 'undefined';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function tex(c, repeat = true, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Parquet bois clair : lames de 0.2 m x 1.2 m, une texture couvre 1.2 m x 1.2 m
function woodTexture() {
  const c = canvas(512, 512), g = c.getContext('2d'), r = rng(7);
  const planks = 6, ph = 512 / planks;
  for (let i = 0; i < planks; i++) {
    const off = Math.floor(r() * 512);
    const tone = 0.93 + r() * 0.1;
    const base = [226 * tone, 190 * tone, 142 * tone];
    for (let seg = 0; seg < 2; seg++) {
      const sx0 = ((seg * 256 + off) % 512), w = 256;
      const vein = [];
      for (let k = 0; k < 26; k++) vein.push([r() * ph, `rgba(${150 + r() * 30 | 0},${105 + r() * 25 | 0},${60 + r() * 20 | 0},${0.05 + r() * 0.12})`, 0.6 + r() * 1.3, (r() - 0.5) * 5, (r() - 0.5) * 5, (r() - 0.5) * 3]);
      // dessiné deux fois (x et x-512) pour que la lame se raccorde d'un bord à l'autre de la texture
      for (const x0 of [sx0, sx0 - 512]) {
        g.fillStyle = `rgb(${base[0] | 0},${base[1] | 0},${base[2] | 0})`;
        g.fillRect(x0, i * ph, w, ph);
        for (const [vy, col, lw, a1, a2, a3] of vein) {
          const y = i * ph + vy;
          g.strokeStyle = col; g.lineWidth = lw;
          g.beginPath(); g.moveTo(x0, y);
          g.bezierCurveTo(x0 + w * 0.3, y + a1, x0 + w * 0.6, y + a2, x0 + w, y + a3);
          g.stroke();
        }
        g.fillStyle = 'rgba(70,45,20,0.35)';
        g.fillRect(x0, i * ph, 1.2, ph);
      }
    }
    g.fillStyle = 'rgba(70,45,20,0.4)';
    g.fillRect(0, i * ph, 512, 1.3);
  }
  return tex(c);
}

// Bois clair vertical (mobilier, panneaux)
function woodFurnitureTexture(tint = [214, 176, 128]) {
  const c = canvas(256, 256), g = c.getContext('2d'), r = rng(21);
  g.fillStyle = `rgb(${tint[0]},${tint[1]},${tint[2]})`;
  g.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 90; k++) {
    const x = r() * 256;
    g.strokeStyle = `rgba(${130 + r() * 30 | 0},${90 + r() * 25 | 0},${50 + r() * 20 | 0},${0.06 + r() * 0.1})`;
    g.lineWidth = 0.6 + r() * 1.6;
    g.beginPath(); g.moveTo(x, 0);
    g.bezierCurveTo(x + (r() - 0.5) * 8, 80, x + (r() - 0.5) * 8, 170, x + (r() - 0.5) * 4, 256);
    g.stroke();
  }
  return tex(c);
}

// Carrelage gris clair 60x60 cm : une texture = 1.2 m x 1.2 m (2x2 carreaux)
function tileTexture(base = 205, grout = 160, seed = 3) {
  const c = canvas(512, 512), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = `rgb(${grout},${grout},${grout + 2})`;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const t = base + (r() - 0.5) * 8;
    g.fillStyle = `rgb(${t},${t},${t + 3})`;
    g.fillRect(i * 256 + 3, j * 256 + 3, 250, 250);
    // marbrure légère
    for (let k = 0; k < 10; k++) {
      g.strokeStyle = `rgba(255,255,255,${0.05 + r() * 0.07})`;
      g.lineWidth = 1 + r() * 3;
      g.beginPath();
      const x = i * 256 + r() * 250, y = j * 256 + r() * 250;
      g.moveTo(x, y); g.bezierCurveTo(x + 50, y + 20, x + 90, y + 80, x + 130 * (r() - 0.4), y + 140 * (r() - 0.4));
      g.stroke();
    }
  }
  return tex(c);
}

function noiseTexture(base = [244, 243, 238], amp = 6, seed = 5, size = 256) {
  const c = canvas(size, size), g = c.getContext('2d'), r = rng(seed);
  const img = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const n = (r() - 0.5) * amp;
    img.data[i * 4] = base[0] + n; img.data[i * 4 + 1] = base[1] + n; img.data[i * 4 + 2] = base[2] + n; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return tex(c);
}

function fabricTexture(base = [96, 126, 160], seed = 11) {
  const c = canvas(256, 256), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    g.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.05})`; g.fillRect(0, y, 256, 1);
  }
  for (let x = 0; x < 256; x += 2) {
    g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.05})`; g.fillRect(x, 0, 1, 256);
  }
  return tex(c);
}

function gradientBlob() {
  const c = canvas(128, 128), g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return tex(c, false);
}

function grassTexture() {
  const c = canvas(256, 256), g = c.getContext('2d'), r = rng(31);
  g.fillStyle = '#5f8a46'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(${70 + r() * 50 | 0},${110 + r() * 60 | 0},${50 + r() * 30 | 0},0.55)`;
    g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 2 + r() * 4);
  }
  return tex(c);
}
function asphaltTexture() {
  return noiseTexture([108, 110, 114], 30, 17, 256);
}

// Écran : dessine une radiographie panoramique ou une fiche patient
export function screenTexture(kind = 'pano', w = 256, h = 160) {
  if (!HAS_DOM) return null;
  const c = canvas(w, h), g = c.getContext('2d');
  g.fillStyle = '#0b1218'; g.fillRect(0, 0, w, h);
  if (kind === 'pano') {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#3a4650'); gr.addColorStop(1, '#10161c');
    g.fillStyle = gr; g.fillRect(6, 6, w - 12, h - 12);
    g.strokeStyle = 'rgba(235,240,245,0.9)'; g.lineWidth = 3;
    // arcade dentaire
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 16; i++) {
        const x = 34 + i * ((w - 68) / 15);
        const y = row === 0 ? h * 0.38 : h * 0.62;
        const k = Math.abs(i - 7.5) / 7.5;
        const yy = y + (row === 0 ? 1 : -1) * (1 - k) * 4 + (row === 0 ? -k * 6 : k * 6) * -1;
        g.fillStyle = 'rgba(240,245,248,0.85)';
        g.fillRect(x - 4, yy - (row === 0 ? 0 : 14), 8, 14);
        g.fillStyle = 'rgba(190,200,210,0.5)';
        g.fillRect(x - 2, yy - (row === 0 ? -14 : 28), 4, 14);
      }
    }
    g.strokeStyle = 'rgba(210,220,230,0.5)'; g.lineWidth = 6;
    g.beginPath(); g.ellipse(w / 2, h * 0.52, w * 0.38, h * 0.38, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    g.beginPath(); g.ellipse(w / 2, h * 0.5, w * 0.38, h * 0.36, 0, Math.PI * 0.08, Math.PI * 0.92); g.stroke();
  } else if (kind === 'chart') {
    g.fillStyle = '#12304a'; g.fillRect(0, 0, w, 20);
    g.fillStyle = '#9fd3ff'; g.font = 'bold 12px sans-serif'; g.fillText('Dossier patient', 8, 14);
    for (let i = 0; i < 16; i++) {
      g.fillStyle = i % 5 === 0 ? '#ffd27a' : '#e8eef3';
      g.fillRect(14 + i * 14, 44, 10, 22);
      g.fillRect(14 + i * 14, 74, 10, 22);
    }
    g.fillStyle = '#5aa9e6';
    for (let i = 0; i < 5; i++) g.fillRect(14, 112 + i * 9, 60 + i * 30, 4);
  } else if (kind === 'cbct') {
    g.fillStyle = '#1b2530'; g.fillRect(4, 4, w / 2 - 6, h - 8); g.fillRect(w / 2 + 2, 4, w / 2 - 6, h / 2 - 6); g.fillRect(w / 2 + 2, h / 2 + 2, w / 2 - 6, h / 2 - 6);
    g.strokeStyle = 'rgba(230,238,245,0.8)'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(w / 4, h / 2, 34, 44, 0, 0, 6.3); g.stroke();
    g.beginPath(); g.ellipse(w * 0.75, h * 0.25, 30, 14, 0, 0, 6.3); g.stroke();
    g.beginPath(); g.ellipse(w * 0.75, h * 0.75, 30, 14, 0, 0, 6.3); g.stroke();
    g.fillStyle = '#6cf'; g.fillRect(w / 4 - 20, h / 2, 40, 2);
  } else {
    // interface logiciel (devis)
    g.fillStyle = '#f2f4f7'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1d4e89'; g.fillRect(0, 0, w, 22);
    g.fillStyle = '#fff'; g.font = 'bold 12px sans-serif'; g.fillText('Plan de traitement', 8, 15);
    g.fillStyle = '#c9d3dd';
    for (let i = 0; i < 6; i++) g.fillRect(10, 34 + i * 18, w - 20, 10);
    g.fillStyle = '#3aa76d'; g.fillRect(w - 84, h - 28, 72, 18);
  }
  const t = tex(c, false); return t;
}

export function labelTexture(text, { w = 512, h = 128, bg = 'rgba(20,24,28,0.82)', fg = '#fff', font = 'bold 38px system-ui, sans-serif', sub = '' } = {}) {
  if (!HAS_DOM) return null;
  const c = canvas(w, h), g = c.getContext('2d');
  const r = 22;
  g.fillStyle = bg;
  g.beginPath(); g.moveTo(r, 0); g.arcTo(w, 0, w, h, r); g.arcTo(w, h, 0, h, r); g.arcTo(0, h, 0, 0, r); g.arcTo(0, 0, w, 0, r); g.fill();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = font;
  if (sub) {
    g.fillText(text, w / 2, h * 0.38);
    g.font = '28px system-ui, sans-serif'; g.fillStyle = 'rgba(255,255,255,0.78)';
    g.fillText(sub, w / 2, h * 0.76);
  } else g.fillText(text, w / 2, h / 2);
  return tex(c, false);
}

export function signTexture(lines, { w = 256, h = 256, bg = '#f6d02f', fg = '#111', icon = 'none' } = {}) {
  if (!HAS_DOM) return null;
  const c = canvas(w, h), g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
  if (icon === 'trefoil') {
    g.translate(w / 2, h * 0.36);
    g.fillStyle = fg;
    for (let i = 0; i < 3; i++) {
      g.rotate((Math.PI * 2) / 3);
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 50, -Math.PI / 2 - 0.52, -Math.PI / 2 + 0.52); g.closePath(); g.fill();
    }
    g.beginPath(); g.arc(0, 0, 9, 0, 6.3); g.fill();
    g.setTransform(1, 0, 0, 1, 0, 0);
  } else if (icon === 'wheelchair') {
    g.strokeStyle = fg; g.lineWidth = 9; g.fillStyle = fg;
    g.beginPath(); g.arc(w * 0.46, h * 0.2, 12, 0, 6.3); g.fill();
    g.beginPath(); g.moveTo(w * 0.46, h * 0.3); g.lineTo(w * 0.46, h * 0.52); g.lineTo(w * 0.68, h * 0.52); g.lineTo(w * 0.74, h * 0.7); g.stroke();
    g.beginPath(); g.moveTo(w * 0.46, h * 0.38); g.lineTo(w * 0.6, h * 0.38); g.stroke();
    g.beginPath(); g.arc(w * 0.46, h * 0.64, 34, 0.5, 4.6); g.stroke();
  } else if (icon === 'biohazard') {
    g.fillStyle = fg; g.beginPath(); g.arc(w / 2, h * 0.34, 38, 0, 6.3); g.fill();
    g.fillStyle = bg; g.beginPath(); g.arc(w / 2, h * 0.34, 16, 0, 6.3); g.fill();
  }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 22px system-ui, sans-serif';
  const y0 = icon === 'none' ? h * 0.3 : h * 0.68;
  lines.forEach((l, i) => g.fillText(l, w / 2, y0 + i * 27));
  return tex(c, false);
}

export function artTexture(seed = 1, palette = ['#e9d8c4', '#7a9e9f', '#c8794a', '#2f3e46']) {
  if (!HAS_DOM) return null;
  const c = canvas(256, 192), g = c.getContext('2d'), r = rng(seed * 97);
  g.fillStyle = palette[0]; g.fillRect(0, 0, 256, 192);
  for (let i = 0; i < 6; i++) {
    g.fillStyle = palette[1 + (i % 3)] + (i % 2 ? 'cc' : 'ee');
    const x = r() * 200, y = r() * 140, w = 40 + r() * 120, h = 30 + r() * 90;
    if (i % 2) { g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 6.3); g.fill(); } else g.fillRect(x, y, w, h);
  }
  return tex(c, false);
}

export function createMaterials() {
  const M = {};
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const woodFloor = HAS_DOM ? woodTexture() : null;
  const woodFurn = HAS_DOM ? woodFurnitureTexture() : null;
  const woodDark = HAS_DOM ? woodFurnitureTexture([120, 84, 56]) : null;
  const tileLight = HAS_DOM ? tileTexture(212, 168, 3) : null;
  const tileDark = HAS_DOM ? tileTexture(166, 126, 9) : null;
  const plaster = HAS_DOM ? noiseTexture([246, 245, 241], 5, 5) : null;
  const fabricBlue = HAS_DOM ? fabricTexture([84, 112, 150]) : null;
  const fabricGrey = HAS_DOM ? fabricTexture([170, 166, 158], 19) : null;
  const fabricAnth = HAS_DOM ? fabricTexture([62, 66, 72], 27) : null;

  M.floorWood = std({ map: woodFloor, roughness: 0.55, metalness: 0, envMapIntensity: 0.6 });
  M.floorTile = std({ map: tileLight, roughness: 0.35, metalness: 0.02, envMapIntensity: 0.9 });
  M.floorTileDark = std({ map: tileDark, roughness: 0.4, metalness: 0.02 });
  M.floorConcrete = std({ map: HAS_DOM ? noiseTexture([140, 142, 145], 28, 8) : null, roughness: 0.9 });
  M.floorResin = std({ color: 0xa9b1b8, roughness: 0.3, metalness: 0.03, envMapIntensity: 0.8 });
  M.floorSteril = std({ map: tileLight, roughness: 0.3, color: 0xf2f4f6 });
  M.floorRed = std({ color: 0xb23a3a, roughness: 0.5 });
  M.floorGreen = std({ color: 0x2f8f5b, roughness: 0.5 });

  M.wall = std({ map: plaster, color: 0xe4e1db, roughness: 0.92 });
  M.wallExt = std({ color: 0x2a2d31, roughness: 0.75 });
  M.wallExtLight = std({ color: 0xdedbd4, roughness: 0.9 });
  M.baseboard = std({ color: 0x3a3d42, roughness: 0.6 });
  M.ceiling = std({ color: 0xf0efec, roughness: 1 });
  M.roof = std({ color: 0x4a4f55, roughness: 0.9 });
  M.black = std({ color: 0x1b1d20, roughness: 0.45, metalness: 0.2 });
  M.blackMatte = std({ color: 0x25272b, roughness: 0.9 });
  M.white = std({ color: 0xf5f6f7, roughness: 0.4 });
  M.whiteGloss = std({ color: 0xfafafa, roughness: 0.18, metalness: 0.02, envMapIntensity: 1.1 });
  M.offWhite = std({ color: 0xe6e8ea, roughness: 0.5 });
  M.grey = std({ color: 0xa4a9ae, roughness: 0.5 });
  M.greyDark = std({ color: 0x5d6268, roughness: 0.55, metalness: 0.15 });
  M.chrome = std({ color: 0xd9dde0, roughness: 0.18, metalness: 1, envMapIntensity: 1.3 });
  M.steel = std({ color: 0xbfc4c8, roughness: 0.32, metalness: 0.9, envMapIntensity: 1.1 });
  M.alu = std({ color: 0xc9ccd0, roughness: 0.4, metalness: 0.7 });
  M.wood = std({ map: woodFurn, roughness: 0.55, envMapIntensity: 0.6 });
  M.woodDark = std({ map: woodDark, roughness: 0.55 });
  M.woodSlat = std({ color: 0xc9a173, roughness: 0.6 });
  M.fabricBlue = std({ map: fabricBlue, roughness: 0.85 });
  M.fabricGrey = std({ map: fabricGrey, roughness: 0.95 });
  M.fabricAnth = std({ map: fabricAnth, roughness: 0.95 });
  M.leather = std({ color: 0x24272b, roughness: 0.55 });
  M.leatherBlue = std({ color: 0x35557d, roughness: 0.5, metalness: 0.02 });
  M.ceramic = std({ color: 0xffffff, roughness: 0.12, envMapIntensity: 1.1 });
  M.rubber = std({ color: 0x2c2e31, roughness: 0.95 });
  M.glass = new THREE.MeshStandardMaterial({ color: 0xcfe6f2, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, envMapIntensity: 1.4, depthWrite: false });
  M.glassLead = new THREE.MeshStandardMaterial({ color: 0xc8d86a, roughness: 0.05, transparent: true, opacity: 0.38, depthWrite: false });
  M.glassDoor = new THREE.MeshStandardMaterial({ color: 0xcfe6f2, roughness: 0.04, transparent: true, opacity: 0.2, envMapIntensity: 1.4, depthWrite: false });
  M.mirror = std({ color: 0xffffff, roughness: 0.02, metalness: 1, envMapIntensity: 1.6 });
  M.leaf = std({ color: 0x3e7d3c, roughness: 0.7 });
  M.leaf2 = std({ color: 0x5f9a45, roughness: 0.7 });
  M.leaf3 = std({ color: 0x2c6538, roughness: 0.75 });
  M.soil = std({ color: 0x3b2e25, roughness: 1 });
  M.pot = std({ color: 0xe7e3dc, roughness: 0.55 });
  M.potBlack = std({ color: 0x242628, roughness: 0.6 });
  M.pdf = std({ color: 0xffffff, roughness: 0.9 });
  M.cardboard = std({ color: 0xb89466, roughness: 0.9 });
  M.cardboard2 = std({ color: 0xcfae7c, roughness: 0.9 });
  M.blue = std({ color: 0x1f5fa8, roughness: 0.35, metalness: 0.25 });
  M.blueLight = std({ color: 0x4f97d6, roughness: 0.4 });
  M.red = std({ color: 0xc23b34, roughness: 0.5 });
  M.yellow = std({ color: 0xf0c418, roughness: 0.55 });
  M.green = std({ color: 0x2f9b57, roughness: 0.55 });
  M.orange = std({ color: 0xea7d1e, roughness: 0.5 });
  M.binGrey = std({ color: 0x5a5f65, roughness: 0.6 });
  M.binBlue = std({ color: 0x2c6cb8, roughness: 0.6 });
  M.binGreen = std({ color: 0x2f8a4d, roughness: 0.6 });
  M.binYellow = std({ color: 0xf0c418, roughness: 0.6 });
  M.binBlack = std({ color: 0x25272a, roughness: 0.6 });
  M.led = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3dc, emissiveIntensity: 2.4, roughness: 0.4 });
  M.ledCool = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe8f6ff, emissiveIntensity: 3.0, roughness: 0.4 });
  M.ledGreen = new THREE.MeshStandardMaterial({ color: 0x0d3, emissive: 0x00ff66, emissiveIntensity: 2.0 });
  M.ledRed = new THREE.MeshStandardMaterial({ color: 0xf33, emissive: 0xff2222, emissiveIntensity: 2.0 });
  M.ledBlue = new THREE.MeshStandardMaterial({ color: 0x39f, emissive: 0x3399ff, emissiveIntensity: 2.0 });
  M.screenOff = std({ color: 0x0b0d10, roughness: 0.2, metalness: 0.4 });
  M.ground = std({ map: HAS_DOM ? asphaltTexture() : null, roughness: 0.95 });
  M.paving = std({ color: 0xbdbab3, roughness: 0.95, map: HAS_DOM ? noiseTexture([190, 187, 180], 22, 12) : null });
  M.grass = std({ map: HAS_DOM ? grassTexture() : null, roughness: 1 });
  M.hill = std({ color: 0x4d6b4a, roughness: 1, fog: true });
  M.trunk = std({ color: 0x5b4636, roughness: 1 });
  M.sign = std({ color: 0x1b1d20, roughness: 0.5 });
  M.blobTex = HAS_DOM ? gradientBlob() : null;
  M.blob = new THREE.MeshBasicMaterial({ map: M.blobTex, transparent: true, depthWrite: false, opacity: 0.9 });
  const screenCache = {};
  M.screen = (kind) => screenCache[kind] || (screenCache[kind] = new THREE.MeshBasicMaterial({ map: screenTexture(kind), toneMapped: false, color: 0xffffff }));
  return M;
}

export const FLOOR_MATERIAL = {
  wood: 'floorWood', tile: 'floorTile', tileDark: 'floorTileDark', concrete: 'floorConcrete', resin: 'floorResin', steril: 'floorSteril',
};
export { HAS_DOM };
