import type { Unit, Building, PlayerState } from '../models/types';
import { distance } from '../utils/math';
import { v4 as uuidv4 } from 'uuid';
import { GAME_CONFIG, UNIT_DATA } from '../constants/gameData';

let lastAITick = 0;

export const updateAITactics = (
  units: Record<string, Unit>,
  buildings: Record<string, Building>,
  players: Record<string, PlayerState>,
  gameTime: number
) => {
  // Run AI logic only every 1 second (1000ms)
  if (gameTime - lastAITick < 1000) {
    return { units, players };
  }
  lastAITick = gameTime;

  const newUnits = { ...units };
  const newPlayers = { ...players };

  // AI Logic for 'enemy' faction
  const enemyId = 'enemy';
  const enemyState = newPlayers[enemyId];

  // Group enemy buildings and units
  const enemyBuildings = Object.values(buildings).filter(b => b.owner === enemyId);

  // Find enemy Barracks and War Factory
  const barracks = enemyBuildings.find(b => b.buildingType === 'barracks');
  const warFactory = enemyBuildings.find(b => b.buildingType === 'warFactory');

  // Spawn Riflemen if we have Barracks and Money
  if (barracks && enemyState.money >= UNIT_DATA['rifleman'].cost) {
    const cost = UNIT_DATA['rifleman'].cost;
    newPlayers[enemyId] = { ...enemyState, money: enemyState.money - cost };

    // Spawn near barracks
    const spawnPos = {
        x: barracks.position.x + (barracks.size.width * GAME_CONFIG.tileSize) / 2 + (Math.random() * 50 - 25),
        y: barracks.position.y + (barracks.size.height * GAME_CONFIG.tileSize) + 20
    };

    const id = uuidv4();
    newUnits[id] = {
        id,
        type: 'unit',
        unitType: 'rifleman',
        owner: enemyId,
        position: spawnPos,
        health: UNIT_DATA['rifleman'].health,
        maxHealth: UNIT_DATA['rifleman'].health,
        selected: false,
        name: UNIT_DATA['rifleman'].name,
        speed: UNIT_DATA['rifleman'].speed,
        // @ts-ignore
        damage: UNIT_DATA['rifleman'].damage,
        // @ts-ignore
        range: UNIT_DATA['rifleman'].range,
        // @ts-ignore
        attackCooldown: UNIT_DATA['rifleman'].attackCooldown,
        lastAttackTime: 0,
        state: 'idle',
        rotation: 0,
    };
  }

  // Spawn Tanks if we have War Factory and Money
  if (warFactory && enemyState.money >= UNIT_DATA['tank'].cost) {
    const cost = UNIT_DATA['tank'].cost;
    newPlayers[enemyId] = { ...enemyState, money: enemyState.money - cost };

    // Spawn near war factory
    const spawnPos = {
        x: warFactory.position.x + (warFactory.size.width * GAME_CONFIG.tileSize) / 2 + (Math.random() * 50 - 25),
        y: warFactory.position.y + (warFactory.size.height * GAME_CONFIG.tileSize) + 20
    };

    const id = uuidv4();
    newUnits[id] = {
        id,
        type: 'unit',
        unitType: 'tank',
        owner: enemyId,
        position: spawnPos,
        health: UNIT_DATA['tank'].health,
        maxHealth: UNIT_DATA['tank'].health,
        selected: false,
        name: UNIT_DATA['tank'].name,
        speed: UNIT_DATA['tank'].speed,
        // @ts-ignore
        damage: UNIT_DATA['tank'].damage,
        // @ts-ignore
        range: UNIT_DATA['tank'].range,
        // @ts-ignore
        attackCooldown: UNIT_DATA['tank'].attackCooldown,
        lastAttackTime: 0,
        state: 'idle',
        rotation: 0,
    };
  }

  // Combat Tactics: Group idle military units
  // If we have more than 10 idle military units, order them to attack the player's ConYard
  const militaryUnits = Object.values(newUnits).filter(u => u.owner === enemyId && (u.unitType === 'rifleman' || u.unitType === 'tank'));
  const idleMilitaryUnits = militaryUnits.filter(u => u.state === 'idle');

  if (idleMilitaryUnits.length >= 10) {
      // Find player ConYard
      const playerConYard = Object.values(buildings).find(b => b.owner === 'player' && b.buildingType === 'constructionYard');

      // If we don't find a conyard, find any player building or unit
      const target = playerConYard || Object.values(buildings).find(b => b.owner === 'player') || Object.values(units).find(u => u.owner === 'player');

      if (target) {
          // Issue attack-move command (for MVP, we'll just set them to move/attack towards it)
          idleMilitaryUnits.forEach(u => {
              newUnits[u.id] = {
                  ...u,
                  state: 'moving', // Should technically be attack-moving, but we'll use move to target position for now, and combat system handles auto-attacking if near
                  targetPosition: { x: target.position.x, y: target.position.y },
              };
          });
      }
  } else {
      // Otherwise, rally them near the War Factory or Barracks
      const rallyPointBuilding = warFactory || barracks;
      if (rallyPointBuilding) {
          const rallyPos = {
              x: rallyPointBuilding.position.x + (rallyPointBuilding.size.width * GAME_CONFIG.tileSize) / 2,
              y: rallyPointBuilding.position.y + (rallyPointBuilding.size.height * GAME_CONFIG.tileSize) + 100
          };

          idleMilitaryUnits.forEach(u => {
              // Only move if far from rally point to prevent twitching
              if (distance(u.position, rallyPos) > 100) {
                  // Assign spread out rally pos
                  const offsetRallyPos = {
                      x: rallyPos.x + (Math.random() * 80 - 40),
                      y: rallyPos.y + (Math.random() * 80 - 40)
                  }
                  newUnits[u.id] = {
                      ...u,
                      state: 'moving',
                      targetPosition: offsetRallyPos
                  };
              }
          });
      }
  }

  return {
    units: newUnits,
    players: newPlayers,
  };
};