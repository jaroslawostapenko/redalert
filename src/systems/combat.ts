import type { Unit, Building, ResourceNode, PlayerState, Projectile } from '../models/types';
import { distance, normalize, multiply, add } from '../utils/math';
import { v4 as uuidv4 } from 'uuid';
import { particleSystem } from './particles';

export const updateCombatAndHarvest = (
  units: Record<string, Unit>,
  buildings: Record<string, Building>,
  resources: Record<string, ResourceNode>,
  players: Record<string, PlayerState>,
  projectiles: Projectile[],
  deltaTime: number,
  gameTime: number
) => {
  const newUnits = { ...units };
  const newBuildings = { ...buildings };
  const newResources = { ...resources };
  const newPlayers = { ...players };
  const newProjectiles = [...projectiles];
  let unitsChanged = false;
  let buildingsChanged = false;
  let resourcesChanged = false;
  let playersChanged = false;
  let projectilesChanged = false;

  for (const id in newUnits) {
    const unit = newUnits[id];

    // COMBAT LOGIC
    if (unit.state === 'attacking' && unit.targetId && unit.damage > 0) {
      const targetUnit = newUnits[unit.targetId];
      const targetBuilding = newBuildings[unit.targetId];
      const target = targetUnit || targetBuilding;

      if (!target) {
        newUnits[id] = { ...unit, state: 'idle', targetId: undefined };
        unitsChanged = true;
        continue;
      }

      const dist = distance(unit.position, target.position);

      if (dist <= unit.range) {
        // In range, check cooldown
        if (gameTime - unit.lastAttackTime >= unit.attackCooldown) {
          // Spawn projectile
          newProjectiles.push({
            id: uuidv4(),
            position: { ...unit.position },
            targetId: unit.targetId,
            speed: 300, // Pixels per second
            damage: unit.damage,
            owner: unit.owner,
          });

          const dirToTarget = normalize({ x: target.position.x - unit.position.x, y: target.position.y - unit.position.y });
          particleSystem.spawnEmitter('muzzleFlash', unit.position, dirToTarget);

          if (unit.unitType === 'tank') {
             particleSystem.spawnEmitter('smoke', unit.position, {x: -dirToTarget.x, y: -dirToTarget.y});
          }

          newUnits[id] = { ...unit, lastAttackTime: gameTime };
          unitsChanged = true;
          projectilesChanged = true;
        }
      } else {
        // Out of range, move towards target
        const dir = normalize({ x: target.position.x - unit.position.x, y: target.position.y - unit.position.y });
        const velocity = multiply(dir, unit.speed * (deltaTime / 1000));
        newUnits[id] = { ...unit, position: add(unit.position, velocity) };
        unitsChanged = true;
      }
    }

    // HARVESTING LOGIC
    if (unit.state === 'harvesting' && unit.targetId && unit.unitType === 'harvester') {
      const targetResource = newResources[unit.targetId];

      if (!targetResource || targetResource.amount <= 0) {
         // Resource depleted, find nearest refinery or return to idle
         newUnits[id] = { ...unit, state: 'idle', targetId: undefined };
         unitsChanged = true;
         continue;
      }

      const dist = distance(unit.position, targetResource.position);

      if (dist > 50) {
          // Move to resource
          const dir = normalize({ x: targetResource.position.x - unit.position.x, y: targetResource.position.y - unit.position.y});
          const velocity = multiply(dir, unit.speed * (deltaTime / 1000));
          newUnits[id] = { ...unit, position: add(unit.position, velocity)};
          unitsChanged = true;
      } else {
         // Gather
         if ((unit.carryingResource || 0) < (unit.maxCarry || 500)) {
             // Fake harvest rate (e.g., 10 per tick)
             const harvestAmount = Math.min(10, targetResource.amount);
             newResources[unit.targetId] = { ...targetResource, amount: targetResource.amount - harvestAmount, health: targetResource.amount - harvestAmount };
             newUnits[id] = { ...unit, carryingResource: (unit.carryingResource || 0) + harvestAmount };
             unitsChanged = true;
             resourcesChanged = true;
         } else {
             // Return to refinery (simplified, just add money for now)
             newPlayers[unit.owner] = { ...newPlayers[unit.owner], money: newPlayers[unit.owner].money + (unit.carryingResource || 0) };
             newUnits[id] = { ...unit, carryingResource: 0 }; // Instantly deposit for MVP
             playersChanged = true;
             unitsChanged = true;
         }
      }
    }
  }

  return {
    units: unitsChanged ? newUnits : units,
    buildings: buildingsChanged ? newBuildings : buildings,
    resources: resourcesChanged ? newResources : resources,
    players: playersChanged ? newPlayers : players,
    projectiles: projectilesChanged ? newProjectiles : projectiles,
  };
};