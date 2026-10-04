import type { GameStateData } from '../models/types';
import { GAME_CONFIG, UNIT_DATA, BUILDING_DATA } from '../constants/gameData';

export const updateFogOfWar = (
  state: GameStateData
): number[] => {
  const { units, buildings, fogOfWar } = state;
  const tileSize = GAME_CONFIG.tileSize;
  const gridWidth = Math.ceil(GAME_CONFIG.mapSize.width / tileSize);
  const gridHeight = Math.ceil(GAME_CONFIG.mapSize.height / tileSize);

  // 1. Mark all currently visible tiles (2) as explored (1)
  const nextFogOfWar = new Int8Array(fogOfWar); // use Int8Array for efficiency, then convert back or keep if possible. Let's just use regular array for now based on types, but map correctly.

  for (let i = 0; i < nextFogOfWar.length; i++) {
    if (nextFogOfWar[i] === 2) {
      nextFogOfWar[i] = 1;
    }
  }

  // 2. Calculate new visible tiles based on player entities
  const updateVisibility = (x: number, y: number, vision: number) => {
    const tileX = Math.floor(x / tileSize);
    const tileY = Math.floor(y / tileSize);
    const visionTiles = Math.ceil(vision / tileSize);

    for (let dy = -visionTiles; dy <= visionTiles; dy++) {
      for (let dx = -visionTiles; dx <= visionTiles; dx++) {
        // Simple circle check
        if (dx * dx + dy * dy <= visionTiles * visionTiles) {
          const targetX = tileX + dx;
          const targetY = tileY + dy;

          if (targetX >= 0 && targetX < gridWidth && targetY >= 0 && targetY < gridHeight) {
            const index = targetY * gridWidth + targetX;
            nextFogOfWar[index] = 2; // Mark as currently visible
          }
        }
      }
    }
  };

  // Iterate over player units
  Object.values(units).forEach(unit => {
    if (unit.owner === 'player') {
      const vision = UNIT_DATA[unit.unitType].vision;
      updateVisibility(unit.position.x, unit.position.y, vision);
    }
  });

  // Iterate over player buildings
  Object.values(buildings).forEach(building => {
    if (building.owner === 'player') {
      const vision = BUILDING_DATA[building.buildingType].vision;
      // Building position is top-left, we can use center or top-left, let's use center for vision origin
      const bw = building.size.width * tileSize;
      const bh = building.size.height * tileSize;
      const cx = building.position.x + bw / 2;
      const cy = building.position.y + bh / 2;
      updateVisibility(cx, cy, vision);
    }
  });

  // Convert back to regular array if we used typed array, or just return it
  return Array.from(nextFogOfWar);
};
