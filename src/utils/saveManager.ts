import type { GameStateData } from '../models/types';

export const saveGameState = (state: GameStateData): string => {
  // Extract only the serializable data portions of the state
  const stateData: Partial<GameStateData> = {
    units: state.units,
    buildings: state.buildings,
    resources: state.resources,
    players: state.players,
    viewport: state.viewport,
    selection: state.selection,
    gameTime: state.gameTime,
    buildQueue: state.buildQueue,
    fogOfWar: state.fogOfWar,
    placementMode: state.placementMode,
    projectiles: state.projectiles,
    audio: state.audio,
  };

  try {
    return JSON.stringify(stateData);
  } catch (error) {
    console.error("Failed to serialize game state:", error);
    return "";
  }
};

export const loadGameState = (jsonString: string): Partial<GameStateData> | null => {
  try {
    const parsed = JSON.parse(jsonString) as Partial<GameStateData>;
    return parsed;
  } catch (error) {
    console.error("Failed to deserialize game state:", error);
    return null;
  }
};

export const saveGameToLocalStorage = (state: GameStateData, slot: string = 'save_1') => {
  const json = saveGameState(state);
  if (json) {
    localStorage.setItem(`my_rts_save_${slot}`, json);
    console.log(`Saved game to slot ${slot}`);
  }
};

export const loadGameFromLocalStorage = (slot: string = 'save_1'): Partial<GameStateData> | null => {
  const json = localStorage.getItem(`my_rts_save_${slot}`);
  if (json) {
    console.log(`Loaded game from slot ${slot}`);
    return loadGameState(json);
  }
  return null;
};
