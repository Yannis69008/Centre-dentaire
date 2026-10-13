import { W, D, EXT_T, INT_T, rooms, netArea } from './plan.js';

const $ = (s, r = document) => r.querySelector(s);

const FLOOR_COL = {
  wood: '#d9bd96', tile: '#d3d6d8', tileDark: '#b7bcc1', concrete: '#a9acaf', resin: '#9fb0bd', steril: '#cfe3da',
};
const TP_ORDER = ['entree', 'accueil', 'attente', 'soin1', 'soin2', 'soin3', 'soin4', 'imagerie', 'steril', 'entretien', 'pause'];

export class UI {
  constructor({ center, teleports, state, player, camera, rooms: rms }) {
    Object.assign(this, { center, teleports, state, player, camera });
    this.mapOpen = true;
    this.panelOpen = true;
    this.mapScale = 12.5;
    this.mapPad = 8;
  }

  init() {
    this.hud = $('#hud'); this.hud.hidden = false;
    this.buildPanel();
    this.buildMap();
    $('#start-btn').addEventListener('click', () => { this.hideStart(); this.onStart && this.onStart(); });
    $('#start').hidden = false;
    $('#resume').addEventListener('click', () => this.onResume && this.onResume());
    $('#panel-toggle').addEventListener('click', () => this.togglePanel());
    $('#map-toggle').addEventListener('click', () => this.toggleMap());
  }

  hideStart() { const s = $('#start'); if (s) s.hidden = true; }

  buildPanel() {
    const tpBox = $('#tp-grid');
    TP_ORDER.forEach((id) => {
      const t = this.teleports[id];
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tp'; b.textContent = t.label; b.dataset.id = id;
      b.addEventListener('click', () => { this.onTeleport && this.onTeleport(id); this.toast(`Vous êtes à : ${t.label}`); this.setLocked(false); });
      tpBox.appendChild(b);
    });
    document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => this.onMode && this.onMode(b.dataset.mode)));
    document.querySelectorAll('[data-toggle]').forEach((el) => {
      el.addEventListener('change', () => this.onToggle && this.onToggle(el.dataset.toggle, el.checked));
    });
    document.querySelectorAll('[data-night]').forEach((b) => b.addEventListener('click', () => this.setNight(b.dataset.night === '1')));
    document.querySelectorAll('[data-quality]').forEach((b) => b.addEventListener('click', () => { this.onQuality && this.onQuality(b.dataset.quality); this.markQuality(b.dataset.quality); }));
    this.markQuality(this.state.quality);
    this.setMode(this.state.mode);
  }

  markQuality(q) { document.querySelectorAll('[data-quality]').forEach((b) => b.classList.toggle('on', b.dataset.quality === q)); }

  setMode(m) {
    document.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
    document.body.dataset.mode = m;
    const lbl = $('#mode-hint');
    if (lbl) lbl.textContent = m === 'visit'
      ? 'ZQSD / WASD : se déplacer · Souris : regarder · E ou clic : portes · Maj : courir'
      : 'Clic gauche glissé : tourner · Clic droit glissé : déplacer · Molette : zoom · Clic sur une porte : l\'ouvrir';
  }
  setToggle(k, v) { const el = document.querySelector(`[data-toggle="${k}"]`); if (el) { el.checked = v; this.state[k] = v; this.onToggle && this.onToggle(k, v); } }
  setNight(n, silent) {
    document.querySelectorAll('[data-night]').forEach((b) => b.classList.toggle('on', (b.dataset.night === '1') === n));
    document.body.classList.toggle('night', n);
    if (!silent) this.onNight && this.onNight(n); else this.state.night = n;
    this.onNight && silent && this.onNight(n);
  }
  setLocked(locked, failed) {
    const inVisit = this.state.mode === 'visit' && this.state.started;
    const r = $('#resume');
    if (r) r.hidden = !(inVisit && !locked);
    document.body.classList.toggle('locked', !!locked);
    if (failed) this.toast('Verrouillage de la souris indisponible : faites glisser la souris pour regarder autour de vous.');
  }
  togglePanel() { this.panelOpen = !this.panelOpen; $('#panel').classList.toggle('closed', !this.panelOpen); }
  toggleMap() { this.mapOpen = !this.mapOpen; $('#map-card').classList.toggle('closed', !this.mapOpen); }

  toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ---------------------------------------------------------------- mini-plan
  buildMap() {
    const c = $('#minimap');
    const s = this.mapScale, pad = this.mapPad;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round((W * s + pad * 2) * dpr); c.height = Math.round((D * s + pad * 2) * dpr);
    c.style.width = (W * s + pad * 2) + 'px'; c.style.height = (D * s + pad * 2) + 'px';
    this.mapCtx = c.getContext('2d'); this.mapCtx.scale(dpr, dpr);
    this.mapC = c;
    c.addEventListener('click', (e) => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left - pad) / s, z = (e.clientY - r.top - pad) / s;
      if (x > 0 && x < W && z > 0 && z < D) this.onMinimapClick && this.onMinimapClick(x, z);
    });
    this.drawStatic();
  }

  drawStatic() {
    // fond statique mis en cache
    const s = this.mapScale, pad = this.mapPad;
    const off = document.createElement('canvas'); off.width = (W * s + pad * 2); off.height = (D * s + pad * 2);
    const g = off.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0, 0, off.width, off.height);
    for (const r of rooms) {
      g.fillStyle = FLOOR_COL[r.floor] || '#ddd';
      g.fillRect(pad + r.x0 * s, pad + r.z0 * s, (r.x1 - r.x0) * s, (r.z1 - r.z0) * s);
    }
    // murs
    g.strokeStyle = '#20262c'; g.lineCap = 'butt';
    for (const w of this.center.wallRuns) {
      g.lineWidth = w.ext ? 3.2 : 1.8;
      g.beginPath();
      if (w.horizontal) { g.moveTo(pad + w.a * s, pad + w.fixed * s); g.lineTo(pad + w.b * s, pad + w.fixed * s); }
      else { g.moveTo(pad + w.fixed * s, pad + w.a * s); g.lineTo(pad + w.fixed * s, pad + w.b * s); }
      g.stroke();
    }
    // ouvertures : portes en trait ocre, par-dessus les murs
    for (const d of this.center.doors) {
      g.strokeStyle = '#f2e8d8'; g.lineWidth = d.wallExt ? 3.6 : 2.4;
      g.beginPath();
      if (d.horizontal) { g.moveTo(pad + (d.cx - d.w / 2) * s, pad + d.cz * s); g.lineTo(pad + (d.cx + d.w / 2) * s, pad + d.cz * s); }
      else { g.moveTo(pad + d.cx * s, pad + (d.cz - d.w / 2) * s); g.lineTo(pad + d.cx * s, pad + (d.cz + d.w / 2) * s); }
      g.stroke();
      g.strokeStyle = '#b8864b'; g.lineWidth = 1;
      g.stroke();
    }
    // légendes courtes
    g.fillStyle = 'rgba(20,28,34,0.82)'; g.font = '600 8.5px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lab = [['S1', 6.05, 2.8], ['S2', 8.55, 2.8], ['S3', 11.05, 2.8], ['S4', 13.55, 2.8], ['Imagerie', 16.9, 2.1], ['Stérilisation', 16.6, 8.35], ['Accueil', 6.8, 7.6], ['Attente', 6.8, 10.8], ['Entretien', 1.9, 8.0], ['Pause', 1.9, 10.5], ['Bureau', 1.9, 4.2], ['Vest.', 12.0, 10.8], ['WC', 10.8, 8.3]];
    lab.forEach(([t, x, z]) => g.fillText(t, pad + x * s, pad + z * s));
    this.mapBase = off;
  }

  drawMap(px, pz, yaw, aerial, camera, orbit) {
    const g = this.mapCtx, s = this.mapScale, pad = this.mapPad;
    g.clearRect(0, 0, W * s + pad * 2, D * s + pad * 2);
    g.drawImage(this.mapBase, 0, 0);
    // portes ouvertes en vert discret
    for (const d of this.center.doors) {
      if (d.t > 0.5) {
        g.strokeStyle = '#6dd6a2'; g.lineWidth = 2;
        g.beginPath();
        if (d.horizontal) { g.moveTo(pad + (d.cx - d.w / 2) * s, pad + d.cz * s); g.lineTo(pad + (d.cx + d.w / 2) * s, pad + d.cz * s); }
        else { g.moveTo(pad + d.cx * s, pad + (d.cz - d.w / 2) * s); g.lineTo(pad + d.cx * s, pad + (d.cz + d.w / 2) * s); }
        g.stroke();
      }
    }
    const x = pad + px * s, z = pad + pz * s;
    let ang = -yaw;                       // yaw 0 → regarde vers -z (haut de la carte)
    if (aerial && camera) { ang = Math.atan2(-(camera.position.x - orbit.target.x), (camera.position.z - orbit.target.z)) + Math.PI; px = orbit.target.x; pz = orbit.target.z; }
    const fx = aerial ? pad + orbit.target.x * s : x, fz = aerial ? pad + orbit.target.z * s : z;
    // cône de vision
    g.save(); g.translate(fx, fz); g.rotate(ang);
    const grad = g.createRadialGradient(0, 0, 2, 0, 0, 46);
    grad.addColorStop(0, 'rgba(45,212,191,0.55)'); grad.addColorStop(1, 'rgba(45,212,191,0)');
    g.fillStyle = grad; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 46, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.62); g.closePath(); g.fill();
    g.fillStyle = '#0f766e'; g.strokeStyle = '#fff'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 5); g.lineTo(0, 2.5); g.lineTo(-5, 5); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }

  updateHud({ room, px, pz, yaw, mode, aimed, camera, orbit }) {
    const chip = $('#room-chip');
    if (room) {
      const same = rooms.filter((q) => q.id === room.id);
      const area = same.reduce((a, q) => a + netArea(q), 0);
      chip.innerHTML = `<b>${room.name}</b><span>≈ ${Math.round(area)} m²</span>`;
    } else chip.innerHTML = '<b>Extérieur</b><span>Parvis</span>';
    const pr = $('#prompt');
    if (aimed) { pr.textContent = aimed.target === 0 ? 'E · clic — Ouvrir la porte' : 'E · clic — Fermer la porte'; pr.classList.add('show'); }
    else pr.classList.remove('show');
    this.drawMap(px, pz, yaw, mode === 'aerial', camera, orbit);
  }
}
