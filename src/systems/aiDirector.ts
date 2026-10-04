import type { Building, Unit, PlayerState, ResourceNode, Vector2 } from '../models/types';
import { GAME_CONFIG, BUILDING_DATA, UNIT_DATA } from '../constants/gameData';

// AI state to track build sequence
let aiState = {
    lastTickTime: 0,
    buildOrderIndex: 0,
    baseCenter: { x: GAME_CONFIG.mapSize.width - 500, y: GAME_CONFIG.mapSize.height - 500 }, // Default near corner
    pendingBuilding: null as keyof typeof BUILDING_DATA | null,
    pendingBuildingTime: 0
};

const buildOrder: (keyof typeof BUILDING_DATA)[] = [
    'powerPlant',
    'oreRefinery',
    'barracks',
    'powerPlant',
    'warFactory'
];

export const updateAiDirector = (
  units: Record<string, Unit>,
  buildings: Record<string, Building>,
  _resources: Record<string, ResourceNode>,
  players: Record<string, PlayerState>,
  gameTime: number,
  spawnBuilding: (type: keyof typeof BUILDING_DATA, position: Vector2, owner: 'enemy') => void,
  spawnUnit: (type: keyof typeof UNIT_DATA, position: Vector2, owner: 'enemy') => void
) => {
  // Only run AI logic roughly every 1000ms
  if (gameTime - aiState.lastTickTime < 1000) {
      return { players };
  }
  aiState.lastTickTime = gameTime;

  const enemy = players['enemy'];
  if (!enemy) return { players };

  const newPlayers = { ...players };

  // Find enemy buildings
  const enemyBuildings = Object.values(buildings).filter(b => b.owner === 'enemy');
  const conYard = enemyBuildings.find(b => b.buildingType === 'constructionYard');

  if (conYard) {
      aiState.baseCenter = conYard.position;
  }

  // 1. Manage Build Order
  if (aiState.pendingBuilding) {
      // Waiting for construction time
      if (gameTime > aiState.pendingBuildingTime) {
          // Time to place the building
          // Find a spot near the base center
          const offset = (enemyBuildings.length * GAME_CONFIG.tileSize * 2);
          const spawnPos = {
              x: aiState.baseCenter.x - offset + Math.random() * offset,
              y: aiState.baseCenter.y - offset + Math.random() * offset
          };

          spawnBuilding(aiState.pendingBuilding, spawnPos, 'enemy');

          aiState.pendingBuilding = null;
          aiState.buildOrderIndex++;
      }
  } else if (aiState.buildOrderIndex < buildOrder.length) {
      // Try to start next building
      const nextBuilding = buildOrder[aiState.buildOrderIndex];
      const cost = BUILDING_DATA[nextBuilding].cost;

      if (enemy.money >= cost) {
          // Deduct money
          newPlayers['enemy'] = { ...enemy, money: enemy.money - cost };
          // Start building process
          aiState.pendingBuilding = nextBuilding;
          aiState.pendingBuildingTime = gameTime + BUILDING_DATA[nextBuilding].buildTime;
      }
  }

  // 2. Manage Economy Units (Harvesters)
  const enemyUnits = Object.values(units).filter(u => u.owner === 'enemy');
  const harvesters = enemyUnits.filter(u => u.unitType === 'harvester');

  const hasWarFactory = enemyBuildings.some(b => b.buildingType === 'warFactory');

  // If we have a war factory, ensure we have at least 1 harvester (or 2)
  if (hasWarFactory && harvesters.length < 2) {
      const cost = UNIT_DATA['harvester'].cost;
      // Using latest money reference
      if (newPlayers['enemy'].money >= cost) {
          newPlayers['enemy'] = { ...newPlayers['enemy'], money: newPlayers['enemy'].money - cost };

          const wf = enemyBuildings.find(b => b.buildingType === 'warFactory');
          if (wf) {
             // Fake queue delay for MVP, just spawn instantly near WF
             spawnUnit('harvester', { x: wf.position.x - 50, y: wf.position.y }, 'enemy');
          }
      }
  }

  return { players: newPlayers };
};