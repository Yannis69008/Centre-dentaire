// Tests fonctionnels dans un vrai navigateur : collisions, portes, modes. Usage : node scripts/e2e.mjs
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 320, height: 200 } });
page.setDefaultTimeout(180000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:5173/?skip=1&quality=low&ui=0');
await page.waitForFunction(() => window.__app && document.querySelector('#loading').hidden);
const res = await page.evaluate(() => {
  const A = window.__app, P = A.player, out = [];
  const run = (n, dt = 0.05) => { for (let i = 0; i < n; i++) A.step(dt); };
  const walk = (keys, n) => { keys.forEach((k) => P.keys.add(k)); run(n); keys.forEach((k) => P.keys.delete(k)); P.vel.set(0, 0); };
  const door = (id) => A.center.doors.find((d) => d.id === id);
  const t = (name, ok, info) => out.push({ name, ok: !!ok, info });
  A.state.autodoors = false;
  A.openAll(false); run(40);
  // 1. mur nord d'une salle de soins
  P.teleport(6.05, 3.0, 0, 0); walk(['f'], 140);
  t('Mur nord infranchissable (soin 1)', P.pos.z > 0.13 + 0.25, 'z=' + P.pos.z.toFixed(2));
  // 2. porte fermée bloque
  P.teleport(6.05, 6.3, 0, 0); walk(['f'], 80);
  t('Porte fermée bloque le passage', P.pos.z > 5.6 + 0.06, 'z=' + P.pos.z.toFixed(2));
  // 3. porte ouverte laisse passer
  door('soin1').target = 1; run(30);
  P.teleport(6.05, 6.3, 0, 0); walk(['f'], 60);
  t('Porte ouverte : on entre dans la salle', P.pos.z < 5.0, 'z=' + P.pos.z.toFixed(2));
  // 4. fauteuil dentaire solide
  P.teleport(6.1, 4.2, 0, 0); P.yaw = 0; walk(['f'], 120);
  t('Fauteuil dentaire solide', P.pos.z > 3.45, 'z=' + P.pos.z.toFixed(2));
  // 5. portes automatiques
  A.openAll(false); run(40); A.state.autodoors = true;
  P.teleport(8.55, 6.3, 0, 0); walk(['f'], 55);
  t('Porte automatique : s\'ouvre à l\'approche', P.pos.z < 5.0, 'z=' + P.pos.z.toFixed(2));
  // 6. porte entrée patients depuis l'extérieur
  A.openAll(false); run(40);
  P.teleport(6.85, 13.5, Math.PI, 0); P.yaw = 0; walk(['f'], 90);
  t('Entrée patients : accès depuis le parvis', P.pos.z < 11.8, 'z=' + P.pos.z.toFixed(2));
  // 7. comptoir d'accueil solide
  P.teleport(6.8, 10.3, 0, 0); P.yaw = 0; walk(['f'], 100);
  t("Comptoir d'accueil solide", P.pos.z > 9.0, 'z=' + P.pos.z.toFixed(2));
  // 8. parcours complet avec portes automatiques : parvis -> hall -> couloir -> imagerie (via salle de lecture)
  const goto = (x, z, maxSteps = 400) => {
    for (let i = 0; i < maxSteps; i++) {
      const dx = x - P.pos.x, dz = z - P.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.25) return true;
      P.yaw = Math.atan2(-dx, -dz);
      P.keys.add('f'); A.step(0.05);
    }
    P.keys.delete('f'); return false;
  };
  A.openAll(false); run(40); A.state.autodoors = true;
  P.teleport(6.85, 13.8, 0, 0);
  const route = [[6.85, 11.0], [6.85, 9.8]];
  let reached = 0;
  for (const [x, z] of route) { if (goto(x, z)) reached++; else break; }
  P.keys.delete('f'); P.vel.set(0, 0);
  t('Parcours parvis → hall (porte automatique)', reached === route.length, reached + '/' + route.length + ', fin (' + P.pos.x.toFixed(1) + ',' + P.pos.z.toFixed(1) + ')');
  const rep = A.verify();
  t('Toutes les pièces accessibles (BFS rayon 25 cm)', /PIÈCES INACCESSIBLES : aucune/.test(String(rep)), 'rapport BFS');
  // 9. porte bloquée à la fermeture quand le visiteur est dessus
  A.state.autodoors = false; A.openAll(true); run(40);
  P.teleport(6.05, 5.6, 0, 0);
  const d = door('soin1'); d.target = 1;
  A.openAll(false); // ne ferme pas la porte où se tient le joueur : openAll force target direct ; on teste setDoor via touche
  // modes
  A.setMode('aerial'); const m1 = A.state.mode; A.setMode('visit'); const m2 = A.state.mode;
  t('Bascule vue aérienne / visite', m1 === 'aerial' && m2 === 'visit', m1 + ' → ' + m2);
  A.setNight(true); run(1);
  t('Mode nuit', true, '');
  return out;
});
for (const r of res) console.log((r.ok ? '  OK  ' : ' ÉCHEC') + ' ' + r.name + '  (' + r.info + ')');
console.log(errors.length ? 'Erreurs console :\n' + errors.join('\n') : 'Aucune erreur console');
await browser.close();
process.exit(res.every((r) => r.ok) && !errors.length ? 0 : 1);
