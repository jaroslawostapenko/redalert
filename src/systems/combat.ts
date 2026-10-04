import type { Unit, Building, ResourceNode, PlayerState, Projectile } from '../models/types';
import { distance, normalize, multiply, add } from '../utils/math';
import { v4 as uuidv4 } from 'uuid';

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
    if (unit.unitType === 'submarine') {
        let detected = false;
        if (gameTime - unit.lastAttackTime < 3000) {
            detected = true;
        } else {
            // Check for nearby enemy destroyers
            for (const otherId in newUnits) {
                const other = newUnits[otherId];
                if (other.owner !== unit.owner && other.unitType === 'destroyer') {
                    // Vision range of destroyer
                    const dist = distance(unit.position, other.position);
                    if (dist <= 400) { // 400 is destroyer vision
                        detected = true;
                        break;
                    }
                }
            }
        }

        if (unit.isSubmerged === detected) { // If it was submerged and is detected (true), then isSubmerged should be false
             newUnits[id] = { ...unit, isSubmerged: !detected };
             unitsChanged = true;
        }
    }
  }

  for (const id in newUnits) {
    const unit = newUnits[id];

    // COMBAT LOGIC
    if (unit.state === 'attacking' && unit.targetId) {


      const targetUnit = newUnits[unit.targetId];
      const targetBuilding = newBuildings[unit.targetId];

      // Engineer repairing bridges
      if (unit.unitType === 'engineer' && targetBuilding && targetBuilding.buildingType === 'bridge' && targetBuilding.health < targetBuilding.maxHealth) {
          const dist = distance(unit.position, targetBuilding.position);
          if (dist <= 50) {
              if (gameTime - unit.lastAttackTime >= 500) { // Repair tick
                  const repairAmount = 50;
                  newBuildings[unit.targetId] = {
                      ...targetBuilding,
                      health: Math.min(targetBuilding.maxHealth, targetBuilding.health + repairAmount),
                      state: targetBuilding.health + repairAmount >= targetBuilding.maxHealth ? 'active' : targetBuilding.state
                  };
                  newUnits[id] = { ...unit, lastAttackTime: gameTime };
                  unitsChanged = true;
                  buildingsChanged = true;

                  if (newBuildings[unit.targetId].health >= targetBuilding.maxHealth) {
                      newUnits[id] = { ...unit, state: 'idle', targetId: undefined };
                  }
              }
          } else {
              const dir = normalize({ x: targetBuilding.position.x - unit.position.x, y: targetBuilding.position.y - unit.position.y });
              const velocity = multiply(dir, unit.speed * (deltaTime / 1000));
              newUnits[id] = { ...unit, position: add(unit.position, velocity) };
              unitsChanged = true;
          }
          continue; // Skip normal combat logic
      }

      const target = targetUnit || targetBuilding;



      if (!target) {
        newUnits[id] = { ...unit, state: 'idle', targetId: undefined };
        unitsChanged = true;
        continue;
      }

      if (targetUnit && targetUnit.unitType === 'submarine' && targetUnit.isSubmerged) {
         // Cannot attack submerged submarine
         newUnits[id] = { ...unit, state: 'idle', targetId: undefined };
         unitsChanged = true;
         continue;
      }


      if (unit.damage <= 0) continue;

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


    // BOARDING LOGIC
    if (unit.state === 'boarding' && unit.targetId) {
        const targetTransport = newUnits[unit.targetId];
        if (!targetTransport || targetTransport.unitType !== 'transport') {
            newUnits[id] = { ...unit, state: 'idle', targetId: undefined };
            unitsChanged = true;
            continue;
        }

        const dist = distance(unit.position, targetTransport.position);
        if (dist <= 30) {
            // Board!
            const capacity = 5; // Should come from data
            const passengers = targetTransport.passengers || [];
            if (passengers.length < capacity) {
                newUnits[unit.targetId] = { ...targetTransport, passengers: [...passengers, id] };
                newUnits[id] = { ...unit, state: 'in_transport', targetId: undefined };
                unitsChanged = true;
            } else {
                newUnits[id] = { ...unit, state: 'idle', targetId: undefined };
                unitsChanged = true;
            }
        } else {
            const dir = normalize({ x: targetTransport.position.x - unit.position.x, y: targetTransport.position.y - unit.position.y });
            const velocity = multiply(dir, unit.speed * (deltaTime / 1000));
            newUnits[id] = { ...unit, position: add(unit.position, velocity) };
            unitsChanged = true;
        }
    }

    // UNBOARDING LOGIC
    if (unit.state === 'unboard' as any && unit.unitType === 'transport') {
        const passengers = unit.passengers || [];
        if (passengers.length > 0) {
            // Eject them
            passengers.forEach(pid => {
                if (newUnits[pid]) {
                    newUnits[pid] = { ...newUnits[pid], state: 'idle', position: { x: unit.position.x + (Math.random()-0.5)*40, y: unit.position.y + (Math.random()-0.5)*40 } };
                }
            });
            newUnits[id] = { ...unit, passengers: [], state: 'idle', targetPosition: undefined };
            unitsChanged = true;
        } else {
            newUnits[id] = { ...unit, state: 'idle', targetPosition: undefined };
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