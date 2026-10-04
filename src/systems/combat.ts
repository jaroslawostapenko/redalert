import type { Unit, Building, ResourceNode, PlayerState } from '../models/types';
// import { distance, normalize, multiply, add } from '../utils/math';
// import {} from '../constants/gameData';

export const updateCombatAndHarvest = (
  units: Record<string, Unit>,
  buildings: Record<string, Building>,
  resources: Record<string, ResourceNode>,
  players: Record<string, PlayerState>,
  _deltaTime: number,
  _gameTime: number
) => {
  const newUnits = { ...units };
  const newBuildings = { ...buildings };
  const newResources = { ...resources };
  const newPlayers = { ...players };
  let unitsChanged = false;
  let buildingsChanged = false;
  let resourcesChanged = false;
  let playersChanged = false;

  // for (const id in newUnits) {
  //   // Add real combat logic here later using newUnits[id]
  // }

  return {
    units: unitsChanged ? newUnits : units,
    buildings: buildingsChanged ? newBuildings : buildings,
    resources: resourcesChanged ? newResources : resources,
    players: playersChanged ? newPlayers : players,
  };
};