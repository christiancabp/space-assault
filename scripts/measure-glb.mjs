// Quick GLB bounding-box measurement: parses the glTF JSON chunk and walks the
// node hierarchy applying TRS/matrix transforms to POSITION accessor min/max.
import { readFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const MODELS_DIR = new URL('../public/models/', import.meta.url).pathname;

function mat4Identity() {
  return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
}

function mat4Multiply(a, b) {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 4; k++)
        out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return out;
}

function mat4FromTRS(t = [0,0,0], q = [0,0,0,1], s = [1,1,1]) {
  const [x, y, z, w] = q;
  const x2 = x+x, y2 = y+y, z2 = z+z;
  const xx = x*x2, xy = x*y2, xz = x*z2;
  const yy = y*y2, yz = y*z2, zz = z*z2;
  const wx = w*x2, wy = w*y2, wz = w*z2;
  return [
    (1-(yy+zz))*s[0], (xy+wz)*s[0], (xz-wy)*s[0], 0,
    (xy-wz)*s[1], (1-(xx+zz))*s[1], (yz+wx)*s[1], 0,
    (xz+wy)*s[2], (yz-wx)*s[2], (1-(xx+yy))*s[2], 0,
    t[0], t[1], t[2], 1,
  ];
}

function transformPoint(m, p) {
  return [
    m[0]*p[0] + m[4]*p[1] + m[8]*p[2] + m[12],
    m[1]*p[0] + m[5]*p[1] + m[9]*p[2] + m[13],
    m[2]*p[0] + m[6]*p[1] + m[10]*p[2] + m[14],
  ];
}

function parseGLB(path) {
  const buf = readFileSync(path);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB');
  const jsonLen = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
}

function measure(path) {
  const gltf = parseGLB(path);
  const bbox = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };

  function visit(nodeIdx, parentMat) {
    const node = gltf.nodes[nodeIdx];
    const local = node.matrix ?? mat4FromTRS(node.translation, node.rotation, node.scale);
    const world = mat4Multiply(parentMat, local);
    if (node.mesh !== undefined) {
      for (const prim of gltf.meshes[node.mesh].primitives) {
        const acc = gltf.accessors[prim.attributes.POSITION];
        if (!acc?.min || !acc?.max) continue;
        // transform all 8 corners of the accessor's AABB
        for (let i = 0; i < 8; i++) {
          const corner = [
            i & 1 ? acc.max[0] : acc.min[0],
            i & 2 ? acc.max[1] : acc.min[1],
            i & 4 ? acc.max[2] : acc.min[2],
          ];
          const p = transformPoint(world, corner);
          for (let a = 0; a < 3; a++) {
            bbox.min[a] = Math.min(bbox.min[a], p[a]);
            bbox.max[a] = Math.max(bbox.max[a], p[a]);
          }
        }
      }
    }
    for (const child of node.children ?? []) visit(child, world);
  }

  const scene = gltf.scenes[gltf.scene ?? 0];
  for (const root of scene.nodes) visit(root, mat4Identity());

  const size = bbox.max.map((v, i) => v - bbox.min[i]);
  const center = bbox.max.map((v, i) => (v + bbox.min[i]) / 2);
  return { size, center };
}

for (const file of readdirSync(MODELS_DIR).filter(f => f.endsWith('.glb')).sort()) {
  try {
    const { size, center } = measure(join(MODELS_DIR, file));
    const fmt = (arr) => arr.map(v => +v.toPrecision(4)).join(', ');
    console.log(`${file.padEnd(22)} size: [${fmt(size)}]  center: [${fmt(center)}]`);
  } catch (e) {
    console.log(`${file.padEnd(22)} ERROR: ${e.message}`);
  }
}
