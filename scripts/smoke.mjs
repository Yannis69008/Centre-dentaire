import { buildCenter } from '../src/build.js';
const t0 = performance.now();
const c = buildCenter();
let meshes = 0, tris = 0;
c.root.traverse(o => { if (o.isMesh) { meshes++; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
console.log('ok', (performance.now() - t0).toFixed(0) + 'ms', 'meshes', meshes, 'tris', Math.round(tris), 'doors', c.doors.length, 'colliders', c.staticColliders.length, 'lights', c.lightSources.length);
