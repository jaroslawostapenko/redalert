import type { Vector2, Building } from '../models/types';
import { GAME_CONFIG } from '../constants/gameData';

interface Node {
    x: number;
    y: number;
    g: number;
    h: number;
    f: number;
    parent: Node | null;
}

const TILE_SIZE = GAME_CONFIG.tileSize;

function heuristic(a: Node, b: Node): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getGridPos(v: Vector2): { x: number, y: number } {
    return { x: Math.floor(v.x / TILE_SIZE), y: Math.floor(v.y / TILE_SIZE) };
}

export function findPath(startPos: Vector2, targetPos: Vector2, buildings: Record<string, Building>, terrain: number[], movementType: 'land' | 'water' | 'amphibious' = 'land'): Vector2[] {
    const startGrid = getGridPos(startPos);
    const targetGrid = getGridPos(targetPos);

    // Quick escape if start is target
    if (startGrid.x === targetGrid.x && startGrid.y === targetGrid.y) {
        return [targetPos];
    }

    // Create an impassable grid representation based on buildings
    const mapCols = Math.floor(GAME_CONFIG.mapSize.width / TILE_SIZE);
    const mapRows = Math.floor(GAME_CONFIG.mapSize.height / TILE_SIZE);

    // We'll just check collision on the fly instead of building a huge 2D array every time

    const isImpassable = (gx: number, gy: number): boolean => {
        if (gx < 0 || gx >= mapCols || gy < 0 || gy >= mapRows) return true;

        const terrainType = terrain[gy * mapCols + gx] || 0;

        let hasBridge = false;
        let isBuildingImpassable = false;

        for (const b of Object.values(buildings)) {
            const bx = Math.floor(b.position.x / TILE_SIZE);
            const by = Math.floor(b.position.y / TILE_SIZE);

            if (gx >= bx && gx < bx + b.size.width && gy >= by && gy < by + b.size.height) {
                if (b.buildingType === 'bridge' && b.state !== 'destroyed') {
                    hasBridge = true;
                } else if (b.state !== 'destroyed') {
                    isBuildingImpassable = true;
                }
            }
        }

        if (movementType === 'land') {
            if (isBuildingImpassable) return true;
            if (terrainType === 1 && !hasBridge) return true;
            return false;
        } else if (movementType === 'water') {
            if (terrainType === 0) return true; // Can't go on land
            // Can pass under bridges, but not through other buildings
            if (isBuildingImpassable) return true;
            return false;
        } else if (movementType === 'amphibious') {
            if (isBuildingImpassable) return true;
            return false;
        }

        return false;
    };


    // A* initialization
    let openList: Node[] = [];
    const closedList: boolean[][] = Array(mapRows).fill(null).map(() => Array(mapCols).fill(false));

    const startNode: Node = { x: startGrid.x, y: startGrid.y, g: 0, h: 0, f: 0, parent: null };
    const targetNode: Node = { x: targetGrid.x, y: targetGrid.y, g: 0, h: 0, f: 0, parent: null };

    openList.push(startNode);

    const neighbors = [
        {x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0},
        {x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y: 1}, {x: 1, y: 1} // Diagonals
    ];

    let maxIterations = 1000; // safety valve

    while (openList.length > 0 && maxIterations > 0) {
        maxIterations--;

        // Get lowest f score
        openList.sort((a, b) => a.f - b.f);
        const currentNode = openList.shift()!;

        closedList[currentNode.y][currentNode.x] = true;

        // Target reached
        if (currentNode.x === targetNode.x && currentNode.y === targetNode.y) {
            const path: Vector2[] = [];
            let curr: Node | null = currentNode;
            while (curr) {
                // Convert grid pos back to world pos (center of tile)
                path.push({
                    x: curr.x * TILE_SIZE + TILE_SIZE / 2,
                    y: curr.y * TILE_SIZE + TILE_SIZE / 2
                });
                curr = curr.parent;
            }
            path.reverse();
            // Replace the last node with exact target pos to be precise
            path[path.length - 1] = targetPos;

            // Remove the first node if it's the current tile to prevent backtracking slightly
            if (path.length > 1) {
                path.shift();
            }
            return path;
        }

        for (const dir of neighbors) {
            const nextX = currentNode.x + dir.x;
            const nextY = currentNode.y + dir.y;

            if (isImpassable(nextX, nextY) || closedList[nextY]?.[nextX]) {
                continue;
            }

            // Basic path distance
            const gCost = dir.x !== 0 && dir.y !== 0 ? 1.414 : 1;
            const g = currentNode.g + gCost;

            const nextNode: Node = { x: nextX, y: nextY, g: 0, h: 0, f: 0, parent: currentNode };
            nextNode.h = heuristic(nextNode, targetNode);
            nextNode.g = g;
            nextNode.f = nextNode.g + nextNode.h;

            const existingNode = openList.find(n => n.x === nextX && n.y === nextY);
            if (existingNode) {
                if (g < existingNode.g) {
                    existingNode.g = g;
                    existingNode.parent = currentNode;
                    existingNode.f = existingNode.g + existingNode.h;
                }
            } else {
                openList.push(nextNode);
            }
        }
    }

    // If no path found or max iterations reached, return straight line to destination as fallback
    return [targetPos];
}
