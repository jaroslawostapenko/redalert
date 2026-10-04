import type { Size } from '../models/types';

export const GAME_CONFIG = {
  mapSize: { width: 4000, height: 4000 } as Size,
  tileSize: 32, // pixels per grid cell
  tickRate: 33, // approx 30 fps for logic
  startingMoney: 5000,
};

export const UNIT_DATA = {
  rifleman: {
    name: 'Rifleman',
    cost: 100,
    buildTime: 3000,
    health: 50,
    speed: 60, // pixels per second
    damage: 10,
    range: 150,
    attackCooldown: 1000, // ms
    radius: 10,
    vision: 300,
  },
  tank: {
    name: 'Medium Tank',
    cost: 800,
    buildTime: 8000,
    health: 400,
    speed: 80,
    damage: 40,
    range: 200,
    attackCooldown: 1500,
    radius: 16,
    vision: 400,
  },
  harvester: {
    name: 'Ore Truck',
    cost: 1400,
    buildTime: 12000,
    health: 600,
    speed: 50,
    damage: 0,
    range: 0,
    attackCooldown: 0,
    radius: 20,
    maxCarry: 500, // credits worth of ore
    harvestRate: 50, // per tick or second
    vision: 300,
  },
  engineer: {
    name: 'Engineer',
    cost: 500,
    buildTime: 5000,
    health: 25,
    speed: 50,
    damage: 0,
    range: 0,
    attackCooldown: 0,
    radius: 10,
    vision: 200,
  },
};

export const BUILDING_DATA = {
  constructionYard: {
    name: 'Construction Yard',
    cost: 2500,
    buildTime: 0, // usually starts with it or unpacks from MCV
    health: 1000,
    size: { width: 3, height: 3 },
    powerGenerated: 10,
    powerConsumed: 0,
    vision: 500,
  },
  powerPlant: {
    name: 'Power Plant',
    cost: 300,
    buildTime: 4000,
    health: 400,
    size: { width: 2, height: 2 },
    powerGenerated: 100,
    powerConsumed: 0,
    vision: 300,
  },
  barracks: {
    name: 'Barracks',
    cost: 300,
    buildTime: 4000,
    health: 400,
    size: { width: 2, height: 2 },
    powerGenerated: 0,
    powerConsumed: 20,
    vision: 300,
  },
  warFactory: {
    name: 'War Factory',
    cost: 2000,
    buildTime: 10000,
    health: 800,
    size: { width: 3, height: 3 },
    powerGenerated: 0,
    powerConsumed: 30,
    vision: 400,
  },
  oreRefinery: {
    name: 'Ore Refinery',
    cost: 2000,
    buildTime: 10000,
    health: 800,
    size: { width: 3, height: 3 },
    powerGenerated: 0,
    powerConsumed: 40,
    vision: 400,
    provides: 'harvester', // Usually comes with a free harvester
  },
  pillbox: {
    name: 'Pillbox',
    cost: 400,
    buildTime: 4000,
    health: 300,
    size: { width: 1, height: 1 },
    powerGenerated: 0,
    powerConsumed: 15,
    damage: 15,
    range: 250,
    attackCooldown: 600,
    vision: 350,
  },
};
