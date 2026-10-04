import type { Unit, Building } from '../models/types';
import { distance, normalize, multiply, add, angleBetween } from '../utils/math';
import { findPath } from '../utils/pathfinding';

export const updateMovement = (units: Record<string, Unit>, buildings: Record<string, Building>, terrain: number[], deltaTime: number): Record<string, Unit> => {
  const updatedUnits = { ...units };
  let changed = false;

  const dtSeconds = deltaTime / 1000;

  for (const id in updatedUnits) {
    const unit = updatedUnits[id];
    
    if (unit.state === 'in_transport') continue;
    if (unit.state === 'moving' && unit.targetPosition) {
      // Calculate path if missing
      if (!unit.path || unit.path.length === 0) {
          unit.path = findPath(unit.position, unit.targetPosition, buildings, terrain, (unit as any).movementType || 'land');
      }

      const nextWaypoint = unit.path[0];

      if (!nextWaypoint) {
          // Reached destination or no path
          updatedUnits[id] = { ...unit, state: 'idle', targetPosition: undefined, path: undefined };
          changed = true;
          continue;
      }

      const distToWaypoint = distance(unit.position, nextWaypoint);
      
      // Reached current waypoint
      if (distToWaypoint < 5) {
        const newPath = unit.path.slice(1); // Remove current waypoint immutably

        if (newPath.length === 0) {
            // Reached final destination
            updatedUnits[id] = { ...unit, state: 'idle', targetPosition: undefined, path: undefined };
        } else {
             updatedUnits[id] = { ...unit, path: newPath }; // Trigger state update
        }
        changed = true;
        continue;
      }

      // Move towards next waypoint
      const dir = normalize({
        x: nextWaypoint.x - unit.position.x,
        y: nextWaypoint.y - unit.position.y,
      });
      
      const velocity = multiply(dir, unit.speed * dtSeconds);
      const newPos = add(unit.position, velocity);
      
      // Update rotation
      const targetRotation = angleBetween(unit.position, nextWaypoint);
      
      updatedUnits[id] = { ...unit, position: newPos, rotation: targetRotation };
      changed = true;
    }
  }

  return changed ? updatedUnits : units;
};