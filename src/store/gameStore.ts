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
import { audioSystem } from '../systems/audioSystem';
import { generateCostField, generateIntegrationField, generateVectorField } from '../systems/flowField';
import { calculateFormationPositions } from '../utils/formation';

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
  placementMode: {
    active: false,
    buildingType: null,
    queueItemId: null,
  },
  projectiles: [],
  audio: {
    muted: false,
    volume: 1.0,
  },
};

interface GameStateActions {
  initGame: () => void;
  setViewport: (viewport: Partial<GameStateData['viewport']>) => void;
  selectEntities: (ids: string[]) => void;
  commandUnits: (command: Command) => void;
  queueBuild: (itemType: 'unit' | 'building', typeName: string) => void;
  spawnUnit: (type: 'rifleman' | 'tank' | 'harvester' | 'engineer', position: Vector2, owner: PlayerId) => string;
  spawnBuilding: (type: keyof typeof BUILDING_DATA, position: Vector2, owner: PlayerId) => string;
  spawnResource: (type: 'ore' | 'gems', position: Vector2, amount: number) => string;
  updateTick: (deltaTime: number) => void;
  setPlacementMode: (buildingType: string, queueItemId: string) => void;
  cancelPlacementMode: () => void;
  completePlacement: (position: Vector2) => void;
  setAudioPreferences: (prefs: Partial<GameStateData['audio']>) => void;
}

export const useGameStore = create<GameState & GameStateActions>((set, get) => ({
  ...initialState,

  initGame: () => {
    // Spawn some initial stuff
    
    // Spawn a construction yard for the player
    get().spawnBuilding('constructionYard', { x: 50, y: 50 }, 'player');
    
    // Spawn an enemy target nearby for testing combat
    // get().spawnUnit('tank', { x: 300, y: 300 }, 'enemy');

    // Spawn enemy barracks to trigger AI Tactics
    // get().spawnBuilding('barracks', { x: 500, y: 500 }, 'enemy');

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
      let selectedPlayerEntity = false;
      ids.forEach((id) => {
        if (newUnits[id]) {
            newUnits[id] = { ...newUnits[id], selected: true };
            if (newUnits[id].owner === 'player') selectedPlayerEntity = true;
        }
        if (newBuildings[id]) {
            newBuildings[id] = { ...newBuildings[id], selected: true };
            if (newBuildings[id].owner === 'player') selectedPlayerEntity = true;
        }
      });

      if (selectedPlayerEntity) {
          audioSystem.play('acknowledge', state.audio.volume, state.audio.muted);
      }

      return { selection: ids, units: newUnits, buildings: newBuildings };
    });
  },

  commandUnits: (command) => {
    set((state) => {
      let issuedCommand = false;
      const newUnits = { ...state.units };

      const movingUnits = command.unitIds.map(id => newUnits[id]).filter(u => u && u.owner === 'player');

      if (movingUnits.length === 0) return state;

      issuedCommand = true;

      let assignments: Vector2[] = [];
      let flowField: import('../systems/flowField').FlowField | undefined;

      if (command.targetPosition) {
        if (command.type === 'move') {
           assignments = calculateFormationPositions(command.targetPosition, movingUnits, 40);

           // Generate flow fields for each unique assignment (in a real system, you might group these if they are close)
           // For simplicity we will just assign the exact assignment to targetPosition for each unit,
           // and calculate a flow field towards the *center* target position that all units can use to guide them generally,
           // or we can generate a flow field per target. Let's do one shared flow field towards the main target for performance,
           // and rely on local steering/separation to handle the final formation positions.
           const costField = generateCostField(state.buildings);
           const integrationField = generateIntegrationField(command.targetPosition, costField);
           const vectorField = generateVectorField(integrationField, costField);
           flowField = {
             targetGridPos: { x: Math.floor(command.targetPosition.x / GAME_CONFIG.tileSize), y: Math.floor(command.targetPosition.y / GAME_CONFIG.tileSize) },
             costField,
             integrationField,
             vectorField,
             cols: Math.floor(GAME_CONFIG.mapSize.width / GAME_CONFIG.tileSize),
             rows: Math.floor(GAME_CONFIG.mapSize.height / GAME_CONFIG.tileSize)
           };
        }
      }

      movingUnits.forEach((unit, index) => {
        const targetPos = command.type === 'move' && assignments[index] ? assignments[index] : command.targetPosition;
        newUnits[unit.id] = {
          ...unit,
          targetPosition: targetPos,
          targetId: command.targetId,
          path: undefined, // Clear existing path on new command
          flowField: flowField, // Use the shared flow field
          state: command.type === 'move' ? 'moving' : command.type === 'harvest' ? 'harvesting' : 'attacking',
        };
      });

      if (issuedCommand) {
          if (command.type === 'move' || command.type === 'harvest') {
              audioSystem.play('moving', state.audio.volume, state.audio.muted);
          } else if (command.type === 'attack') {
              audioSystem.play('attack', state.audio.volume, state.audio.muted);
          }
      }

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
          status: 'queued',
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
  },

  setPlacementMode: (buildingType, queueItemId) => {
    set({
      placementMode: {
        active: true,
        buildingType,
        queueItemId,
      }
    });
  },

  cancelPlacementMode: () => {
    set({
      placementMode: {
        active: false,
        buildingType: null,
        queueItemId: null,
      }
    });
  },

  completePlacement: (position) => {
    const { placementMode, buildQueue, audio } = get();
    if (!placementMode.active || !placementMode.buildingType || !placementMode.queueItemId) return;

    const buildingType = placementMode.buildingType as keyof typeof BUILDING_DATA;
    get().spawnBuilding(buildingType, position, 'player');

    audioSystem.play('building_complete', audio.volume, audio.muted);

    set({
      placementMode: {
        active: false,
        buildingType: null,
        queueItemId: null,
      },
      buildQueue: buildQueue.filter((item) => item.id !== placementMode.queueItemId),
    });
  },

  setAudioPreferences: (prefs) => {
    set((state) => ({
      audio: { ...state.audio, ...prefs },
    }));
  }
}));