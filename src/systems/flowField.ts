import type { Vector2, Building } from '../models/types';
import { GAME_CONFIG } from '../constants/gameData';
import { normalize } from '../utils/math';

export const MAX_COST = 255;
export const IMPASSABLE_COST = 255;
export const MAX_INTEGRATION_COST = 65535;

export interface FlowField {
  targetGridPos: Vector2;
  costField: Uint8Array;
  integrationField: Uint16Array;
  vectorField: { x: number, y: number }[];
  cols: number;
  rows: number;
}

const TILE_SIZE = GAME_CONFIG.tileSize;
const MAP_COLS = Math.floor(GAME_CONFIG.mapSize.width / TILE_SIZE);
const MAP_ROWS = Math.floor(GAME_CONFIG.mapSize.height / TILE_SIZE);

function getIndex(x: number, y: number, cols: number): number {
  return y * cols + x;
}

export function generateCostField(buildings: Record<string, Building>): Uint8Array {
  const costField = new Uint8Array(MAP_COLS * MAP_ROWS).fill(1); // Default cost is 1

  for (const b of Object.values(buildings)) {
    const startX = Math.floor(b.position.x / TILE_SIZE);
    const startY = Math.floor(b.position.y / TILE_SIZE);

    for (let x = startX; x < startX + b.size.width; x++) {
      for (let y = startY; y < startY + b.size.height; y++) {
        if (x >= 0 && x < MAP_COLS && y >= 0 && y < MAP_ROWS) {
          costField[getIndex(x, y, MAP_COLS)] = IMPASSABLE_COST;
        }
      }
    }
  }

  return costField;
}

export function generateIntegrationField(target: Vector2, costField: Uint8Array): Uint16Array {
  const integrationField = new Uint16Array(MAP_COLS * MAP_ROWS).fill(MAX_INTEGRATION_COST);

  const targetX = Math.floor(target.x / TILE_SIZE);
  const targetY = Math.floor(target.y / TILE_SIZE);

  if (targetX < 0 || targetX >= MAP_COLS || targetY < 0 || targetY >= MAP_ROWS) {
    return integrationField;
  }

  const targetIndex = getIndex(targetX, targetY, MAP_COLS);
  integrationField[targetIndex] = 0;

  let openList: {x: number, y: number}[] = [{ x: targetX, y: targetY }];

  const neighbors = [
    {x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}, // Cardinals
    {x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y: 1}, {x: 1, y: 1} // Diagonals
  ];

  while (openList.length > 0) {
    const current = openList.shift()!;
    const currentIndex = getIndex(current.x, current.y, MAP_COLS);

    for (const n of neighbors) {
      const neighborX = current.x + n.x;
      const neighborY = current.y + n.y;

      if (neighborX >= 0 && neighborX < MAP_COLS && neighborY >= 0 && neighborY < MAP_ROWS) {
        const neighborIndex = getIndex(neighborX, neighborY, MAP_COLS);
        const cost = costField[neighborIndex];

        if (cost === IMPASSABLE_COST) continue;

        // Basic path distance approximation
        const distCost = (n.x !== 0 && n.y !== 0) ? 14 : 10;
        const totalCost = cost * distCost;

        const newCost = integrationField[currentIndex] + totalCost;

        if (newCost < integrationField[neighborIndex]) {
          integrationField[neighborIndex] = newCost;
          openList.push({ x: neighborX, y: neighborY });
        }
      }
    }
  }

  return integrationField;
}

export function generateVectorField(integrationField: Uint16Array, costField: Uint8Array): {x: number, y: number}[] {
  const vectorField = new Array(MAP_COLS * MAP_ROWS).fill({ x: 0, y: 0 });

  const neighbors = [
    {x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0},
    {x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y: 1}, {x: 1, y: 1}
  ];

  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      const index = getIndex(x, y, MAP_COLS);

      if (costField[index] === IMPASSABLE_COST) {
        vectorField[index] = { x: 0, y: 0 };
        continue;
      }

      let minCost = integrationField[index];
      let minX = 0;
      let minY = 0;
      let hasValidNeighbor = false;

      for (const n of neighbors) {
        const nx = x + n.x;
        const ny = y + n.y;

        if (nx >= 0 && nx < MAP_COLS && ny >= 0 && ny < MAP_ROWS) {
          const nIndex = getIndex(nx, ny, MAP_COLS);
          if (costField[nIndex] !== IMPASSABLE_COST && integrationField[nIndex] < minCost) {
            minCost = integrationField[nIndex];
            minX = n.x;
            minY = n.y;
            hasValidNeighbor = true;
          }
        }
      }

      if (hasValidNeighbor) {
        const dir = normalize({ x: minX, y: minY });
        vectorField[index] = dir;
      }
    }
  }

  return vectorField;
}

export function getFlowFieldDirection(pos: Vector2, flowField: FlowField | null): Vector2 {
  if (!flowField) return { x: 0, y: 0 };

  const gx = Math.floor(pos.x / TILE_SIZE);
  const gy = Math.floor(pos.y / TILE_SIZE);

  if (gx < 0 || gx >= flowField.cols || gy < 0 || gy >= flowField.rows) {
    return { x: 0, y: 0 };
  }

  return flowField.vectorField[getIndex(gx, gy, flowField.cols)];
}
