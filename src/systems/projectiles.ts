import type { Projectile, Unit, Building } from '../models/types';
import { distance, normalize, multiply, add } from '../utils/math';
import { particleSystem } from './particles';

export const updateProjectiles = (
  projectiles: Projectile[],
  units: Record<string, Unit>,
  buildings: Record<string, Building>,
  deltaTime: number
) => {
  const newProjectiles: Projectile[] = [];
  const newUnits = { ...units };
  const newBuildings = { ...buildings };
  let unitsChanged = false;
  let buildingsChanged = false;
  let projectilesChanged = false;

  for (const proj of projectiles) {
    const targetUnit = newUnits[proj.targetId];
    const targetBuilding = newBuildings[proj.targetId];
    const target = targetUnit || targetBuilding;

    if (!target) {
      // Target died, remove projectile
      projectilesChanged = true;
      continue;
    }

    const dist = distance(proj.position, target.position);

    // Check if it hit (arbitrary collision radius, e.g., 10 pixels)
    if (dist < 10) {
      particleSystem.spawnEmitter('smoke', target.position);
      // Apply damage
      if (targetUnit) {
        const newHealth = Math.max(0, targetUnit.health - proj.damage);
        if (newHealth === 0) {
            particleSystem.spawnEmitter('debris', target.position);            delete newBuildings[proj.targetId];
        } else {
            newBuildings[proj.targetId] = { ...targetBuilding, health: newHealth };
        }
        buildingsChanged = true;
      }

      projectilesChanged = true;
      continue; // Don't add to newProjectiles
    }

    // Move projectile
    const dir = normalize({ x: target.position.x - proj.position.x, y: target.position.y - proj.position.y });
    const velocity = multiply(dir, proj.speed * (deltaTime / 1000));

    newProjectiles.push({
      ...proj,
      position: add(proj.position, velocity)
    });
    projectilesChanged = true;
  }

  return {
    projectiles: projectilesChanged ? newProjectiles : projectiles,
    units: unitsChanged ? newUnits : units,
    buildings: buildingsChanged ? newBuildings : buildings,
  };
};