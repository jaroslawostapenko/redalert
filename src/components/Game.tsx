import React, { useEffect } from 'react';
import Viewport from './game/Viewport';
import UIOverlay from './ui/UIOverlay';
import Lobby from './ui/Lobby';
import { useGameStore } from '../store/gameStore';
import { useGameLoop } from '../hooks/useGameLoop';

const Game: React.FC = () => {
  const initGame = useGameStore((state) => state.initGame);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useGameLoop(); // Start the game loop

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Lobby />
      <Viewport />
      <UIOverlay />
    </div>
  );
};

export default Game;
