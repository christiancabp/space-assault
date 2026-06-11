// One-off codegen: converts raw gltfjsx output in src/ships/_wip/ to the
// project's active-ship pattern (see GuardiansShip.tsx) — shared GLTFResult
// type, config-driven transform group, `as Mesh` casts, engine effects.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SHIPS_DIR = new URL('../src/ships/', import.meta.url).pathname;
const WIP_DIR = join(SHIPS_DIR, '_wip');

const SHIPS = [
  { file: 'PlanetExpress.tsx', component: 'PlanetExpress', id: 'planet-express' },
  { file: 'RickNMorty.tsx', component: 'RickNMorty', id: 'rick-n-morty' },
  { file: 'SayanCapsule.tsx', component: 'SayanCapsule', id: 'sayan-capsule' },
  { file: 'SpaceShuttle.tsx', component: 'SpaceShuttle', id: 'space-shuttle' },
  { file: 'Starship.tsx', component: 'Starship', id: 'starship' },
  { file: 'TieFighter.tsx', component: 'TieFighter', id: 'tie-fighter' },
  { file: 'TimeMachine.tsx', component: 'TimeMachine', id: 'time-machine' },
];

for (const { file, component, id } of SHIPS) {
  const src = readFileSync(join(WIP_DIR, file), 'utf8');

  // Keep the attribution header comment
  const header = src.match(/^\/\*[\s\S]*?\*\/\n/)[0];

  // Extract JSX between the outer `<group {...props} dispose={null}>` and its
  // matching close (last `</group>` before the `)` that ends the return)
  const bodyMatch = src.match(
    /<group \{\.\.\.props\} dispose=\{null\}>\n([\s\S]*?)\n    <\/group>\n  \)\n\}/
  );
  if (!bodyMatch) throw new Error(`${file}: could not find outer group`);

  let body = bodyMatch[1];
  // Cast nodes to Mesh (shared GLTFResult types nodes as Object3D)
  body = body.replace(/nodes\.(\w+)\.geometry/g, '(nodes.$1 as Mesh).geometry');
  // Indent two levels deeper (now nested inside the config transform group)
  body = body.replace(/^/gm, '    ');

  const configKey = id.includes('-') ? `['${id}']` : `.${id}`;

  const out = `${header}
import { useGLTF } from '@react-three/drei'
import { SHIP_CONFIGS } from '../config/shipConfigs'
import { EnginePropulsion } from '../effects'
import type { Mesh } from 'three'
import type { GLTFResult } from '../types'

const config = SHIP_CONFIGS${configKey}

export function ${component}() {
  const { nodes, materials } = useGLTF('/models/${id}.glb') as GLTFResult
  return (
    <group dispose={null}>
      <group
        scale={config.transform.scale}
        rotation={config.transform.rotation}
        position={config.transform.positionOffset}
      >
${body}
      </group>

      {/* Engine propulsion effects */}
      {config.engines.map((engine, index) => (
        <EnginePropulsion
          key={index}
          position={engine.position}
          scale={engine.scale}
          coreColor={engine.color}
        />
      ))}
    </group>
  )
}

useGLTF.preload('/models/${id}.glb')
`;

  writeFileSync(join(SHIPS_DIR, file), out);
  console.log(`converted ${file}`);
}
