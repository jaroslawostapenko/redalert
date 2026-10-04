import React, { useEffect } from 'react';
import Viewport from './game/Viewport';
import UIOverlay from './ui/UIOverlay';
import { useGameStore } from '../store/gameStore';
import { useGameLoop } from '../hooks/useGameLoop';

interface GameProps {
  onBackToMenu?: () => void;
}

const Game: React.FC<GameProps> = ( { onBackToMenu } ) => {
  const initGame = useGameStore(state => state.initGame);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Start the game loop
  useGameLoop();

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <Viewport />
      <UIOverlay />
      {onBackToMenu && (
        <button
          onClick={onBackToMenu}
          style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 100000, padding: '5px 10px', background: '#333', color: 'white' }}
        >
          Quit to Menu
        </button>
      )}
    </div>
  );
};

export default Game;