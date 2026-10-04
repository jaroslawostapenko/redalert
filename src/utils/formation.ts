import type { Vector2, Unit } from '../models/types';
import { distance } from './math';

export function calculateFormationPositions(centerPosition: Vector2, units: Unit[], spacing: number = 30): Vector2[] {
  if (units.length === 0) return [];
  if (units.length === 1) return [centerPosition];

  // Simple grid formation
  const count = units.length;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  const startX = centerPosition.x - (cols * spacing) / 2 + spacing / 2;
  const startY = centerPosition.y - (rows * spacing) / 2 + spacing / 2;

  const positions: Vector2[] = [];

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.push({
      x: startX + col * spacing,
      y: startY + row * spacing
    });
  }

  // Sort units by distance to positions to minimize crossover
  // Simple greedy assignment
  const assignments: Vector2[] = new Array(count);
  const usedPositions = new Set<number>();

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    let bestDist = Infinity;
    let bestPosIndex = -1;

    for (let j = 0; j < positions.length; j++) {
      if (usedPositions.has(j)) continue;

      const dist = distance(unit.position, positions[j]);
      if (dist < bestDist) {
        bestDist = dist;
        bestPosIndex = j;
      }
    }

    if (bestPosIndex !== -1) {
      assignments[i] = positions[bestPosIndex];
      usedPositions.add(bestPosIndex);
    } else {
      assignments[i] = centerPosition; // Fallback
    }
  }

  return assignments;
}

export function applyBoidsSeparation(unit: Unit, allUnits: Record<string, Unit>, separationRadius: number = 25): Vector2 {
  let separationForce = { x: 0, y: 0 };
  let count = 0;

  for (const id in allUnits) {
    if (id === unit.id) continue;

    const otherUnit = allUnits[id];
    // Ignore units of different owners for local avoidance, or don't. Let's just avoid all units to prevent overlapping
    if (otherUnit.state !== 'moving' && otherUnit.state !== 'idle') continue;

    const dist = distance(unit.position, otherUnit.position);

    if (dist > 0 && dist < separationRadius) {
      const dir = {
        x: unit.position.x - otherUnit.position.x,
        y: unit.position.y - otherUnit.position.y
      };

      // Weight force by distance (closer = stronger)
      const weight = 1 - (dist / separationRadius);

      const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
      if (len > 0) {
        separationForce.x += (dir.x / len) * weight;
        separationForce.y += (dir.y / len) * weight;
      }
      count++;
    }
  }

  if (count > 0) {
    separationForce.x /= count;
    separationForce.y /= count;
  }

  return separationForce;
}
