import React, { useEffect } from 'react';
import Viewport from './game/Viewport';
import UIOverlay from './ui/UIOverlay';
import { useGameStore } from '../store/gameStore';
import { useGameLoop } from '../hooks/useGameLoop';

const Game: React.FC = () => {
  const initGame = useGameStore(state => state.initGame);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Start the game loop
  useGameLoop();

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Viewport />
      <UIOverlay />
    </div>
  );
};

export default Game;