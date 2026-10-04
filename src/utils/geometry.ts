import type { Size, Vector2 } from '../models/types';
import { GAME_CONFIG } from '../constants/gameData';

export const worldToGrid = (worldPos: Vector2): Vector2 => {
  return {
    x: Math.floor(worldPos.x / GAME_CONFIG.tileSize),
    y: Math.floor(worldPos.y / GAME_CONFIG.tileSize),
  };
};

export const gridToWorld = (gridPos: Vector2): Vector2 => {
  return {
    x: gridPos.x * GAME_CONFIG.tileSize,
    y: gridPos.y * GAME_CONFIG.tileSize,
  };
};

// Gets the center world position of a building
export const getBuildingCenter = (gridPos: Vector2, size: Size): Vector2 => {
  return {
    x: (gridPos.x + size.width / 2) * GAME_CONFIG.tileSize,
    y: (gridPos.y + size.height / 2) * GAME_CONFIG.tileSize,
  };
};

// Check if two circles intersect (simple collision)
export const circlesIntersect = (
  p1: Vector2,
  r1: number,
  p2: Vector2,
  r2: number
): boolean => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < r1 + r2;
};
