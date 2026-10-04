import type { Vector2 } from '../models/types';

export const distance = (p1: Vector2, p2: Vector2): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const normalize = (v: Vector2): Vector2 => {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
};

export const subtract = (v1: Vector2, v2: Vector2): Vector2 => {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
};

export const add = (v1: Vector2, v2: Vector2): Vector2 => {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
};

export const multiply = (v: Vector2, scalar: number): Vector2 => {
  return { x: v.x * scalar, y: v.y * scalar };
};

export const angleBetween = (p1: Vector2, p2: Vector2): number => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

// Check if a point is inside a rectangle (defined by min and max corners)
export const isPointInRect = (
  point: Vector2,
  rectMin: Vector2,
  rectMax: Vector2
): boolean => {
  return (
    point.x >= rectMin.x &&
    point.x <= rectMax.x &&
    point.y >= rectMin.y &&
    point.y <= rectMax.y
  );
};
