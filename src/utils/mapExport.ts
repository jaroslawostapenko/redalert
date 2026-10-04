import type { EditorState, EditorEntity, TerrainType } from '../store/editorStore';

export interface MapData {
  version: number;
  widthCells: number;
  heightCells: number;
  terrain: TerrainType[][];
  entities: EditorEntity[];
}

export const exportMapData = (state: EditorState): string => {
  if (state.terrain.length === 0) {
    return '{}';
  }

  const mapData: MapData = {
    version: 1,
    widthCells: state.terrain[0].length,
    heightCells: state.terrain.length,
    terrain: state.terrain,
    entities: state.entities,
  };

  return JSON.stringify(mapData);
};

export const importMapData = (jsonStr: string): MapData | null => {
  try {
    const data = JSON.parse(jsonStr) as MapData;
    if (data.version === 1 && data.terrain && data.entities) {
      return data;
    }
    return null;
  } catch (e) {
    console.error("Failed to parse map data", e);
    return null;
  }
};

export const saveMapToLocalStorage = (state: EditorState, slot: string = 'default') => {
  const dataStr = exportMapData(state);
  localStorage.setItem(`my-rts-map-${slot}`, dataStr);
};

export const loadMapFromLocalStorage = (slot: string = 'default'): MapData | null => {
  const dataStr = localStorage.getItem(`my-rts-map-${slot}`);
  if (dataStr) {
    return importMapData(dataStr);
  }
  return null;
};
