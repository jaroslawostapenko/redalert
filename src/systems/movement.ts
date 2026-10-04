import type { Unit } from '../models/types';
import { distance, normalize, multiply, add, angleBetween } from '../utils/math';

export const updateMovement = (units: Record<string, Unit>, deltaTime: number): Record<string, Unit> => {
  const updatedUnits = { ...units };
  let changed = false;

  const dtSeconds = deltaTime / 1000;

  for (const id in updatedUnits) {
    const unit = updatedUnits[id];
    
    if (unit.state === 'moving' && unit.targetPosition) {
      const dist = distance(unit.position, unit.targetPosition);
      
      // Reached destination
      if (dist < 5) {
        updatedUnits[id] = { ...unit, state: 'idle', targetPosition: undefined };
        changed = true;
        continue;
      }

      // Move towards target
      const dir = normalize({
        x: unit.targetPosition.x - unit.position.x,
        y: unit.targetPosition.y - unit.position.y,
      });
      
      const velocity = multiply(dir, unit.speed * dtSeconds);
      const newPos = add(unit.position, velocity);
      
      // Update rotation
      const targetRotation = angleBetween(unit.position, unit.targetPosition);
      
      updatedUnits[id] = { ...unit, position: newPos, rotation: targetRotation };
      changed = true;
    }
  }

  return changed ? updatedUnits : units;
};