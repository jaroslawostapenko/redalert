import React, { useState } from 'react';
import Game from './components/Game';
import MapEditor from './editor/MapEditor';

const App: React.FC = () => {
  const [view, setView] = useState<'menu' | 'game' | 'editor'>('menu');

  if (view === 'game') {
    return <Game onBackToMenu={() => setView('menu')} />;
  }

  if (view === 'editor') {
    return <MapEditor onBackToMenu={() => setView('menu')} />;
  }

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#1a1a1a', color: 'white',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>My-RTS</h1>
      <button
        style={{ padding: '1rem 2rem', fontSize: '1.5rem', marginBottom: '1rem', cursor: 'pointer', background: '#333', color: 'white', border: '1px solid #555' }}
        onClick={() => setView('game')}
      >
        Play Game
      </button>
      <button
        style={{ padding: '1rem 2rem', fontSize: '1.5rem', cursor: 'pointer', background: '#333', color: 'white', border: '1px solid #555' }}
        onClick={() => setView('editor')}
      >
        Map Editor
      </button>
    </div>
  );
};

export default App;
