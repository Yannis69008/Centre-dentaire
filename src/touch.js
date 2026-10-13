// Commandes tactiles : joystick virtuel (moitié gauche), regard au doigt (moitié droite),
// toucher bref sur une porte pour l'ouvrir, bouton « Porte » pour la porte visée.
export const isTouch = () => {
  try { return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; } catch (e) { return false; }
};

export function initTouch({ dom, player, state, onTap, onAction }) {
  document.body.classList.add('touch');
  player.noPointerLock = true;
  dom.style.touchAction = 'none';

  const pad = document.createElement('div'); pad.id = 'joy'; pad.innerHTML = '<i></i>';
  const knob = pad.firstChild;
  const act = document.createElement('button'); act.id = 'act'; act.type = 'button'; act.textContent = 'Porte';
  const run = document.createElement('button'); run.id = 'runbtn'; run.type = 'button'; run.textContent = 'Courir';
  document.getElementById('hud').append(pad, act, run);
  act.addEventListener('pointerdown', (e) => { e.stopPropagation(); onAction(); });
  run.addEventListener('pointerdown', (e) => { e.stopPropagation(); run.classList.toggle('on'); player.keys[run.classList.contains('on') ? 'add' : 'delete']('run'); });

  const R = 56;                       // rayon du joystick (px)
  let joyId = null, joyO = null, lookId = null, last = null, tapStart = null;
  const active = () => state.started && state.mode === 'visit';

  dom.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch' || !active()) return;
    const left = e.clientX < window.innerWidth * 0.45;
    if (left && joyId === null) {
      joyId = e.pointerId; joyO = { x: e.clientX, y: e.clientY };
      pad.style.left = joyO.x + 'px'; pad.style.top = joyO.y + 'px'; pad.classList.add('on'); knob.style.transform = 'translate(0,0)';
    } else if (!left && lookId === null) {
      lookId = e.pointerId; last = { x: e.clientX, y: e.clientY };
      tapStart = { x: e.clientX, y: e.clientY, t: performance.now() };
    }
    try { dom.setPointerCapture(e.pointerId); } catch (err) { /* ignoré */ }
  });
  dom.addEventListener('pointermove', (e) => {
    if (e.pointerId === joyId) {
      let dx = e.clientX - joyO.x, dy = e.clientY - joyO.y;
      const d = Math.hypot(dx, dy); if (d > R) { dx = dx / d * R; dy = dy / d * R; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      player.joy.x = dx / R; player.joy.y = -dy / R;
    } else if (e.pointerId === lookId) {
      player.yaw -= (e.clientX - last.x) * 0.005;
      player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch - (e.clientY - last.y) * 0.005));
      last = { x: e.clientX, y: e.clientY };
    }
  });
  const end = (e) => {
    if (e.pointerId === joyId) { joyId = null; player.joy.x = 0; player.joy.y = 0; pad.classList.remove('on'); }
    if (e.pointerId === lookId) {
      lookId = null;
      if (tapStart && e.type === 'pointerup' && Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y) < 10 && performance.now() - tapStart.t < 350) onTap(e.clientX, e.clientY);
      tapStart = null;
    }
  };
  dom.addEventListener('pointerup', end);
  dom.addEventListener('pointercancel', end);
}
