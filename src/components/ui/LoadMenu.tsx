import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { saveGameToLocalStorage, loadGameFromLocalStorage } from '../../utils/saveManager';
import { replayRecorder } from '../../utils/replayRecorder';
import { loadGameState } from '../../utils/saveManager';

const LoadMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    const state = useGameStore.getState();
    saveGameToLocalStorage(state, 'save_1');
    alert('Game saved to slot 1!');
  };

  const handleLoad = () => {
    const data = loadGameFromLocalStorage('save_1');
    if (data) {
      useGameStore.getState().loadGameData(data);
      alert('Game loaded from slot 1!');
    } else {
      alert('No save found in slot 1.');
    }
  };

  const handleSaveReplay = () => {
    replayRecorder.saveReplayToLocalStorage('replay_1');
    alert('Replay saved to slot 1!');
  };

  const handleLoadReplay = () => {
    const replay = replayRecorder.loadReplayFromLocalStorage('replay_1');
    if (replay) {
      const initialState = loadGameState(replay.initialState);
      if (initialState) {
        useGameStore.getState().loadGameData(initialState);
        replayRecorder.startPlayback(replay);
        alert('Replay loaded and playing!');
      }
    } else {
      alert('No replay found in slot 1.');
    }
  };

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 100 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#333',
          color: '#fff',
          border: '1px solid #555',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Menu
      </button>

      {isOpen && (
        <div style={{
          marginTop: 5,
          background: '#222',
          border: '1px solid #555',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          <button onClick={handleSave}>Save Game</button>
          <button onClick={handleLoad}>Load Game</button>
          <button onClick={handleSaveReplay}>Save Replay</button>
          <button onClick={handleLoadReplay}>Load Replay</button>
        </div>
      )}
    </div>
  );
};

export default LoadMenu;
