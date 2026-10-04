import type { Unit, Building, ResourceNode, PlayerState } from '../models/types';
import { distance, normalize, multiply, add, angleBetween } from '../utils/math';
import { GAME_CONFIG } from '../constants/gameData';

export const updateHarvesting = (
  units: Record<string, Unit>,
  buildings: Record<string, Building>,
  resources: Record<string, ResourceNode>,
  players: Record<string, PlayerState>,
  deltaTime: number
) => {
  const newUnits = { ...units };
  const newResources = { ...resources };
  const newPlayers = { ...players };
  let unitsChanged = false;
  let resourcesChanged = false;
  let playersChanged = false;

  const dtSeconds = deltaTime / 1000;

  for (const id in newUnits) {
    const unit = newUnits[id];

    if (unit.state === 'harvesting' && unit.unitType === 'harvester') {
      const isFull = (unit.carryingResource || 0) >= (unit.maxCarry || GAME_CONFIG.startingMoney); // using a fallback

      if (isFull) {
        // Need to return to nearest refinery
        let nearestRefinery: Building | null = null;
        let minRefineryDist = Infinity;

        for (const bId in buildings) {
          const b = buildings[bId];
          if (b.owner === unit.owner && b.buildingType === 'oreRefinery' && b.state === 'active') {
            const dist = distance(unit.position, b.position);
            if (dist < minRefineryDist) {
              minRefineryDist = dist;
              nearestRefinery = b;
            }
          }
        }

        if (nearestRefinery) {
          // Move towards refinery
          if (minRefineryDist > GAME_CONFIG.tileSize * 2) {
             const dir = normalize({ x: nearestRefinery.position.x - unit.position.x, y: nearestRefinery.position.y - unit.position.y});
             const velocity = multiply(dir, unit.speed * dtSeconds);
             const newPos = add(unit.position, velocity);
             newUnits[id] = { ...unit, position: newPos, rotation: angleBetween(unit.position, nearestRefinery.position) };
             unitsChanged = true;
          } else {
             // Deposit ore
             newPlayers[unit.owner] = { ...newPlayers[unit.owner], money: newPlayers[unit.owner].money + (unit.carryingResource || 0) };
             newUnits[id] = { ...unit, carryingResource: 0 };
             playersChanged = true;
             unitsChanged = true;
          }
        } else {
            // No refinery found, idle
            newUnits[id] = { ...unit, state: 'idle' };
            unitsChanged = true;
        }

      } else {
         // Gathering
         if (!unit.targetId) {
             newUnits[id] = { ...unit, state: 'idle' };
             unitsChanged = true;
             continue;
         }

         const targetResource = newResources[unit.targetId];

         if (!targetResource || targetResource.amount <= 0) {
            // Resource depleted, find nearest resource node or go idle
            let nearestResource: ResourceNode | null = null;
            let minResDist = Infinity;
            for (const rId in newResources) {
                const r = newResources[rId];
                if (r.amount > 0) {
                    const dist = distance(unit.position, r.position);
                    if (dist < minResDist) {
                        minResDist = dist;
                        nearestResource = r;
                    }
                }
            }
            if (nearestResource) {
                 newUnits[id] = { ...unit, targetId: nearestResource.id };
            } else {
                 newUnits[id] = { ...unit, state: 'idle', targetId: undefined };
            }
            unitsChanged = true;
            continue;
         }

         const dist = distance(unit.position, targetResource.position);

         if (dist > GAME_CONFIG.tileSize) {
             // Move to resource
             const dir = normalize({ x: targetResource.position.x - unit.position.x, y: targetResource.position.y - unit.position.y});
             const velocity = multiply(dir, unit.speed * dtSeconds);
             const newPos = add(unit.position, velocity);
             newUnits[id] = { ...unit, position: newPos, rotation: angleBetween(unit.position, targetResource.position) };
             unitsChanged = true;
         } else {
            // Harvest
            // Hardcoded harvest rate for now, e.g., 20 per second
            const harvestRate = 20 * dtSeconds;
            const amountToHarvest = Math.min(harvestRate, targetResource.amount);

            // Only update occasionally to avoid spamming small floating point changes, or just round it
            const newResAmount = targetResource.amount - amountToHarvest;
            const newCarrying = (unit.carryingResource || 0) + amountToHarvest;

            if (amountToHarvest > 0.1) {
                newResources[unit.targetId] = { ...targetResource, amount: newResAmount, health: newResAmount };
                newUnits[id] = { ...unit, carryingResource: newCarrying };
                unitsChanged = true;
                resourcesChanged = true;
            }
         }
      }
    }
  }

  return {
    units: unitsChanged ? newUnits : units,
    resources: resourcesChanged ? newResources : resources,
    players: playersChanged ? newPlayers : players,
  };
};