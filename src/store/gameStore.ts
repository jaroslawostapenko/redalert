import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  GameStateData,
  Vector2,
  PlayerId,
  Command,
  BuildQueueItem,
  Unit,
  Building,
  ResourceNode,
} from '../models/types';
import { GAME_CONFIG, UNIT_DATA, BUILDING_DATA } from '../constants/gameData';

interface GameState extends GameStateData {
  // Actions
  initGame: () => void;
  setViewport: (viewport: Partial<GameStateData['viewport']>) => void;
  selectEntities: (ids: string[]) => void;
  commandUnits: (command: Command) => void;
  queueBuild: (itemType: 'unit' | 'building', typeName: string) => void;
  spawnUnit: (type: 'rifleman' | 'tank' | 'harvester' | 'engineer', position: Vector2, owner: PlayerId) => string;
  spawnBuilding: (type: keyof typeof BUILDING_DATA, position: Vector2, owner: PlayerId) => string;
  spawnResource: (type: 'ore' | 'gems', position: Vector2, amount: number) => string;
  updateTick: (deltaTime: number) => void;
}

const initialState: GameStateData = {
  units: {},
  buildings: {},
  resources: {},
  players: {
    player: { id: 'player', faction: 'Allies', money: GAME_CONFIG.startingMoney, power: 0, maxPower: 0 },
    enemy: { id: 'enemy', faction: 'Soviet', money: GAME_CONFIG.startingMoney, power: 0, maxPower: 0 },
    neutral: { id: 'neutral', faction: 'Allies', money: 0, power: 0, maxPower: 0 },
  },
  viewport: {
    x: 0,
    y: 0,
    scale: 1,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  selection: [],
  gameTime: 0,
  buildQueue: [],
  // We will initialize fogOfWar as a 1D array with dimensions:
  // Math.ceil(GAME_CONFIG.mapSize.width / GAME_CONFIG.tileSize) x Math.ceil(GAME_CONFIG.mapSize.height / GAME_CONFIG.tileSize)
  // But wait, the state needs to be initialized outside components so it's a bit tricky to dynamically get it from GAME_CONFIG,
  // though GAME_CONFIG is available here.
  fogOfWar: new Array(Math.ceil(GAME_CONFIG.mapSize.width / GAME_CONFIG.tileSize) * Math.ceil(GAME_CONFIG.mapSize.height / GAME_CONFIG.tileSize)).fill(0),
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  initGame: () => {
    // Spawn some initial stuff
    
    // Spawn a construction yard for the player
    get().spawnBuilding('constructionYard', { x: 50, y: 50 }, 'player');
    
    // Spawn some ore
    for(let i=0; i<10; i++) {
        for(let j=0; j<10; j++) {
             get().spawnResource('ore', { x: 800 + i * GAME_CONFIG.tileSize, y: 800 + j * GAME_CONFIG.tileSize }, 100);
        }
    }
  },

  setViewport: (viewport) => {
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    }));
  },

  selectEntities: (ids) => {
    set((state) => {
      // Clear old selection
      const newUnits = { ...state.units };
      const newBuildings = { ...state.buildings };

      state.selection.forEach((id) => {
        if (newUnits[id]) newUnits[id] = { ...newUnits[id], selected: false };
        if (newBuildings[id]) newBuildings[id] = { ...newBuildings[id], selected: false };
      });

      // Set new selection
      ids.forEach((id) => {
        if (newUnits[id]) newUnits[id] = { ...newUnits[id], selected: true };
        if (newBuildings[id]) newBuildings[id] = { ...newBuildings[id], selected: true };
      });

      return { selection: ids, units: newUnits, buildings: newBuildings };
    });
  },

  commandUnits: (command) => {
    set((state) => {
      const newUnits = { ...state.units };
      command.unitIds.forEach((id) => {
        const unit = newUnits[id];
        if (unit && unit.owner === 'player') {
          newUnits[id] = {
            ...unit,
            targetPosition: command.targetPosition,
            targetId: command.targetId,
            path: undefined, // Clear existing path on new command
            state: command.type === 'move' ? 'moving' : command.type === 'harvest' ? 'harvesting' : 'attacking',
          };
        }
      });
      return { units: newUnits };
    });
  },

  queueBuild: (itemType, typeName) => {
    set((state) => {
      const player = state.players['player'];
      let cost = 0;
      let buildTime = 0;
      

      if (itemType === 'unit') {
        const data = UNIT_DATA[typeName as keyof typeof UNIT_DATA];
        cost = data.cost;
        buildTime = data.buildTime;
        
      } else {
        const data = BUILDING_DATA[typeName as keyof typeof BUILDING_DATA];
        cost = data.cost;
        buildTime = data.buildTime;
        
      }

      if (player.money >= cost) {
        const newPlayer = { ...player, money: player.money - cost };
        const queueItem: BuildQueueItem = {
          id: uuidv4(),
          itemType,
          name: typeName,
          progress: 0,
          cost,
          buildTime,
          owner: 'player',
        };
        return {
          players: { ...state.players, player: newPlayer },
          buildQueue: [...state.buildQueue, queueItem],
        };
      }
      return state;
    });
  },

  spawnUnit: (type, position, owner) => {
    const id = uuidv4();
    const data = UNIT_DATA[type];
    
    set((state) => {
      const newUnit: Unit = {
        id,
        type: 'unit',
        unitType: type,
        owner,
        position,
        health: data.health,
        maxHealth: data.health,
        selected: false,
        name: data.name,
        speed: data.speed,
        // @ts-ignore
             damage: data.damage,
        // @ts-ignore
             range: data.range,
        // @ts-ignore
             attackCooldown: data.attackCooldown,
        lastAttackTime: 0,
        state: 'idle',
        rotation: 0,
        carryingResource: type === 'harvester' ? 0 : undefined,
        // @ts-ignore
        maxCarry: type === 'harvester' ? data.maxCarry : undefined,
      };
      
      return { units: { ...state.units, [id]: newUnit } };
    });
    return id;
  },

  spawnBuilding: (type, position, owner) => {
     const id = uuidv4();
     const data = BUILDING_DATA[type];
     set((state) => {
         const newBuilding: Building = {
             id,
             type: 'building',
             buildingType: type,
             owner,
             position,
             health: data.health,
             maxHealth: data.health,
             selected: false,
             name: data.name,
             size: data.size,
             powerGenerated: data.powerGenerated,
             powerConsumed: data.powerConsumed,
             state: 'active',
             buildProgress: 1,
             // @ts-ignore
             damage: data.damage,
             // @ts-ignore
             range: data.range,
             // @ts-ignore
             attackCooldown: data.attackCooldown,
             lastAttackTime: 0
         };
         
         const player = state.players[owner];
         const updatedPlayer = {
             ...player,
             power: player.power + data.powerConsumed,
             maxPower: player.maxPower + data.powerGenerated
         }

         return { 
             buildings: { ...state.buildings, [id]: newBuilding },
             players: { ...state.players, [owner]: updatedPlayer}
         };
     });
     return id;
  },

  spawnResource: (type, position, amount) => {
      const id = uuidv4();
      set((state) => {
          const newResource: ResourceNode = {
              id,
              type: 'resource',
              resourceType: type,
              owner: 'neutral',
              position,
              health: amount,
              maxHealth: amount,
              selected: false,
              name: type === 'ore' ? 'Ore' : 'Gems',
              amount
          };
          return { resources: { ...state.resources, [id]: newResource }};
      });
      return id;
  },

  updateTick: (_deltaTime) => {
     // This will be overridden or called by the systems
  }
}));