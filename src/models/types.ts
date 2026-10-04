export type Faction = 'Allies' | 'Soviet';
export type EntityType = 'unit' | 'building' | 'resource';
export type PlayerId = 'player' | 'enemy' | 'neutral';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface GameObject {
  id: string;
  type: EntityType;
  owner: PlayerId;
  position: Vector2; // center position or top-left for buildings
  health: number;
  maxHealth: number;
  selected: boolean;
  name: string;
}

export type UnitState = 'idle' | 'moving' | 'attacking' | 'harvesting' | 'dead';

export interface Unit extends GameObject {
  type: 'unit';
  unitType: 'rifleman' | 'tank' | 'harvester' | 'engineer';
  speed: number;
  damage: number;
  range: number;
  attackCooldown: number;
  lastAttackTime: number;
  targetId?: string; // Entity being attacked or harvested
  targetPosition?: Vector2; // Move destination
  path?: Vector2[]; // A* waypoints to destination
  state: UnitState;
  rotation: number; // in radians
  carryingResource?: number; // for harvester
  maxCarry?: number;
}

export type BuildingState = 'constructing' | 'active' | 'destroyed';

export interface Building extends GameObject {
  type: 'building';
  buildingType: 'constructionYard' | 'powerPlant' | 'barracks' | 'warFactory' | 'oreRefinery' | 'pillbox';
  size: Size; // in grid cells
  powerGenerated: number;
  powerConsumed: number;
  state: BuildingState;
  buildProgress: number; // 0 to 1
  rallyPoint?: Vector2;
  // For defensive structures
  damage?: number;
  range?: number;
  attackCooldown?: number;
  lastAttackTime?: number;
  targetId?: string;
}

export interface ResourceNode extends GameObject {
  type: 'resource';
  resourceType: 'ore' | 'gems';
  amount: number;
}

export interface PlayerState {
  id: PlayerId;
  faction: Faction;
  money: number;
  power: number;
  maxPower: number;
}

export interface GameStateData {
  units: Record<string, Unit>;
  buildings: Record<string, Building>;
  resources: Record<string, ResourceNode>;
  players: Record<PlayerId, PlayerState>;
  viewport: {
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
  };
  selection: string[];
  gameTime: number;
  buildQueue: BuildQueueItem[];
  // fogOfWar represents a 2D grid.
  // We can use a 1D array of integers to map to a 2D grid:
  // 0: Unexplored (black)
  // 1: Explored but not visible (semi-transparent)
  // 2: Currently visible (transparent)
  fogOfWar: number[];
}

export interface BuildQueueItem {
  id: string;
  itemType: 'unit' | 'building';
  name: string;
  progress: number;
  cost: number;
  buildTime: number; // total time required
  owner: PlayerId;
  factoryId?: string; // ID of the building producing it
}

export interface GameConfig {
  mapSize: Size; // total pixels or cells
  tileSize: number;
  tickRate: number; // ms per tick
}

export type CommandType = 'move' | 'attack' | 'harvest' | 'repair';

export interface Command {
  type: CommandType;
  targetPosition?: Vector2;
  targetId?: string;
  unitIds: string[];
}
