// Captures d'écran automatisées (Chromium headless + SwiftShader). Usage : node scripts/shot.mjs nom "query" [largeur hauteur]
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const jobs = JSON.parse(process.argv[2]);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const logs = [];
for (const j of jobs) {
  const page = await browser.newPage({ viewport: { width: j.w || 1280, height: j.h || 720 } });
  page.setDefaultTimeout(180000);
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  await page.goto('http://localhost:5173/?skip=1&quality=' + (j.quality || 'low') + '&' + j.q, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__app && document.querySelector('#loading').hidden, null, { timeout: 120000 }).catch(() => {});
  if (j.js) await page.evaluate(j.js);
  await page.waitForTimeout(j.wait || 2500);
  await page.screenshot({ path: `/tmp/shots/${j.name}.png`, timeout: 180000 });
  console.log('shot', j.name);
  await page.close();
}
console.log(logs.slice(0, 20).join('\n') || 'no console issues');
await browser.close();
