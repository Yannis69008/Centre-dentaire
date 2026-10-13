import { buildCenter } from '../src/build.js';
import { verifyLayout, printReport } from '../src/verify.js';
const c = buildCenter();
const r = verifyLayout(c);
console.log(printReport(r));
const bad = r.embedded.length + r.doorSwing.length + r.unreachableRooms.length + r.pockets.length + r.thresholds.length + r.narrow.length;
process.exit(bad ? 1 : 0);
