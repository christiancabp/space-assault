// Dump node/material/mesh name sets from GLBs so compression passes can be
// diffed against the names gltfjsx components reference (nodes.X, materials.Y).
// Usage: node scripts/check-glb-names.mjs [dir-or-file] > names.txt
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const TARGET = process.argv[2] ?? new URL('../public/models/', import.meta.url).pathname;

function parseGLB(path) {
  const buf = readFileSync(path);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB');
  const jsonLen = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
}

function dump(path) {
  const gltf = parseGLB(path);
  const names = (arr) => (arr ?? []).map((x, i) => x.name ?? `<unnamed ${i}>`).sort();
  console.log(`# ${basename(path)}`);
  console.log(`nodes(${(gltf.nodes ?? []).length}): ${names(gltf.nodes).join(' | ')}`);
  console.log(`meshes(${(gltf.meshes ?? []).length}): ${names(gltf.meshes).join(' | ')}`);
  console.log(`materials(${(gltf.materials ?? []).length}): ${names(gltf.materials).join(' | ')}`);
  console.log('');
}

const files = statSync(TARGET).isDirectory()
  ? readdirSync(TARGET).filter((f) => f.endsWith('.glb')).sort().map((f) => join(TARGET, f))
  : [TARGET];

for (const file of files) {
  try {
    dump(file);
  } catch (e) {
    console.log(`# ${basename(file)} ERROR: ${e.message}\n`);
  }
}
