import { create } from 'zustand';
import type { Vector2, PlayerId } from '../models/types';


export type TerrainType = 'grass' | 'water' | 'cliff' | 'sand';
export type ToolType = 'terrain' | 'unit' | 'building' | 'resource';

export interface EditorEntity {
  id: string;
  type: ToolType;
  entityId: string; // e.g. 'rifleman', 'constructionYard', 'ore'
  position: Vector2;
  owner?: PlayerId;
}

export interface EditorState {
  terrain: TerrainType[][];
  entities: EditorEntity[];
  viewport: { x: number; y: number; scale: number };

  // Toolbar state
  activeTool: ToolType;
  activeTerrain: TerrainType;
  activeEntityId: string;
  activeOwner: PlayerId;
  brushSize: number;

  // Actions
  initGrid: (widthCells: number, heightCells: number) => void;
  setViewport: (vp: Partial<EditorState['viewport']>) => void;
  setToolInfo: (info: Partial<Omit<EditorState, 'terrain' | 'entities' | 'viewport' | 'initGrid' | 'setViewport' | 'paintTerrain' | 'placeEntity' | 'removeEntity' | 'loadMapData'>>) => void;
  paintTerrain: (cellX: number, cellY: number, size: number, type: TerrainType) => void;
  placeEntity: (entity: Omit<EditorEntity, 'id'>) => void;
  removeEntity: (id: string) => void;
  loadMapData: (data: { terrain: TerrainType[][], entities: EditorEntity[] }) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  terrain: [],
  entities: [],
  viewport: { x: 0, y: 0, scale: 1 },

  activeTool: 'terrain',
  activeTerrain: 'grass',
  activeEntityId: 'rifleman',
  activeOwner: 'player',
  brushSize: 1,

  initGrid: (widthCells, heightCells) => {
    const grid: TerrainType[][] = [];
    for (let y = 0; y < heightCells; y++) {
      const row: TerrainType[] = [];
      for (let x = 0; x < widthCells; x++) {
        row.push('grass');
      }
      grid.push(row);
    }
    set({ terrain: grid, entities: [] });
  },

  setViewport: (vp) => set((state) => ({ viewport: { ...state.viewport, ...vp } })),

  setToolInfo: (info) => set((state) => ({ ...state, ...info })),

  paintTerrain: (cellX, cellY, size, type) => {
    set((state) => {
      const newTerrain = state.terrain.map(row => [...row]);
      const halfSize = Math.floor(size / 2);

      for (let y = cellY - halfSize; y <= cellY + halfSize; y++) {
        for (let x = cellX - halfSize; x <= cellX + halfSize; x++) {
          if (y >= 0 && y < newTerrain.length && x >= 0 && x < newTerrain[0].length) {
            newTerrain[y][x] = type;
          }
        }
      }
      return { terrain: newTerrain };
    });
  },

  placeEntity: (entityData) => {
    set((state) => {
      const newEntity: EditorEntity = {
        ...entityData,
        id: crypto.randomUUID()
      };
      return { entities: [...state.entities, newEntity] };
    });
  },

  removeEntity: (id) => {
    set((state) => ({
      entities: state.entities.filter(e => e.id !== id)
    }));
  },

  loadMapData: (data) => set({ terrain: data.terrain, entities: data.entities })
}));
