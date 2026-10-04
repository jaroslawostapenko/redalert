import type { Unit, Building, Vector2 } from '../models/types';
import { distance, normalize, multiply, add } from '../utils/math';
import { applyBoidsSeparation } from '../utils/formation';
import { GAME_CONFIG } from '../constants/gameData';

export const updateMovement = (units: Record<string, Unit>, _buildings: Record<string, Building>, deltaTime: number): Record<string, Unit> => {
  const updatedUnits = { ...units };
  let changed = false;

  const dtSeconds = deltaTime / 1000;

  for (const id in updatedUnits) {
    const unit = updatedUnits[id];
    
    if (unit.state === 'moving' && unit.targetPosition) {
      const distToDestination = distance(unit.position, unit.targetPosition);

      // Stop condition
      if (distToDestination < 15) {
          updatedUnits[id] = { ...unit, state: 'idle', targetPosition: undefined, path: undefined, flowField: undefined };
          changed = true;
          continue;
      }

      let desiredVelocity: Vector2 = { x: 0, y: 0 };
      
      // If we have a flow field, use it
      if (unit.flowField) {
          // get current vector from vector field
          const TILE_SIZE = GAME_CONFIG.tileSize;
          const gx = Math.floor(unit.position.x / TILE_SIZE);
          const gy = Math.floor(unit.position.y / TILE_SIZE);

          if (gx >= 0 && gx < unit.flowField.cols && gy >= 0 && gy < unit.flowField.rows) {
              const index = gy * unit.flowField.cols + gx;
              const flowDir = unit.flowField.vectorField[index];

              if (flowDir && (flowDir.x !== 0 || flowDir.y !== 0)) {
                  desiredVelocity = multiply(flowDir, unit.speed * dtSeconds);
              }
          }
      }

      // Fallback if no flow field or we are off map or vector field is 0
      if (desiredVelocity.x === 0 && desiredVelocity.y === 0) {
          const dir = normalize({
              x: unit.targetPosition.x - unit.position.x,
              y: unit.targetPosition.y - unit.position.y,
          });
          desiredVelocity = multiply(dir, unit.speed * dtSeconds);
      }

      // Apply Boids Separation (Local Avoidance)
      const separationForce = applyBoidsSeparation(unit, units, 30);
      const separationWeight = 0.5 * unit.speed * dtSeconds; // arbitrary weight

      let finalVelocity = add(desiredVelocity, multiply(separationForce, separationWeight));

      // Limit speed so we don't go too fast because of separation
      const currentSpeed = Math.sqrt(finalVelocity.x * finalVelocity.x + finalVelocity.y * finalVelocity.y);
      const maxSpeed = unit.speed * dtSeconds;
      if (currentSpeed > maxSpeed) {
          finalVelocity = multiply(normalize(finalVelocity), maxSpeed);
      }
      
      const newPos = add(unit.position, finalVelocity);
      
      // We also update rotation based on final velocity
      const targetRotation = Math.atan2(finalVelocity.y, finalVelocity.x);
      
      updatedUnits[id] = { ...unit, position: newPos, rotation: targetRotation };
      changed = true;
    }
  }

  return changed ? updatedUnits : units;
};
