/**
 * ShipModel - Shared ShipId → ship component registry
 *
 * Single source of truth for mapping a ShipId to its 3D component.
 * Used by both gameplay (Player) and the ship selector preview so the
 * roster only needs to be wired up in one place.
 *
 * NOTE: imports each ship from its own file (not ./index) to avoid a
 * circular import, since index.ts re-exports ShipModel.
 */

import type { ComponentType } from 'react';
import type { ShipId } from '../types/ship.types';
import { Rocketship } from './Rocketship';
import { GuardiansShip } from './GuardiansShip';
import { PlanetExpress } from './PlanetExpress';
import { RickNMorty } from './RickNMorty';
import { SayanCapsule } from './SayanCapsule';
import { SpaceShuttle } from './SpaceShuttle';
import { Starship } from './Starship';
import { TieFighter } from './TieFighter';
import { TimeMachine } from './TimeMachine';

const SHIP_COMPONENTS: Record<ShipId, ComponentType> = {
  rocketship: Rocketship,
  'guardians-ship': GuardiansShip,
  'planet-express': PlanetExpress,
  'rick-n-morty': RickNMorty,
  'sayan-capsule': SayanCapsule,
  'space-shuttle': SpaceShuttle,
  starship: Starship,
  'tie-fighter': TieFighter,
  'time-machine': TimeMachine,
};

interface ShipModelProps {
  shipId: ShipId;
}

export function ShipModel({ shipId }: ShipModelProps) {
  const Ship = SHIP_COMPONENTS[shipId] ?? Rocketship;
  return <Ship  />;
}
