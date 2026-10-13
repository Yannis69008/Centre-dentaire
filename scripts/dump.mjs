import { buildCenter } from '../src/build.js';
import { verifyLayout } from '../src/verify.js';
const [x0, z0, x1, z1] = process.argv.slice(2).map(Number);
const c = buildCenter(); const r = verifyLayout(c);
const { nx, x0: gx, z0: gz, step, blocked, reach } = r._grid;
const st = 0.1;
for (let z = z0; z < z1; z += st) {
  let line = z.toFixed(1).padStart(5) + ' ';
  for (let x = x0; x < x1; x += st) {
    const i = Math.floor((x - gx) / step), j = Math.floor((z - gz) / step);
    const k = j * nx + i;
    line += blocked[k] ? '#' : reach[k] ? '.' : 'o';
  }
  console.log(line);
}
