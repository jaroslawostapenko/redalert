import React from 'react';
import EditorViewport from './EditorViewport';
import EditorToolbar from './EditorToolbar';

interface MapEditorProps {
  onBackToMenu: () => void;
}

const MapEditor: React.FC<MapEditorProps> = ({ onBackToMenu }) => {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#222' }}>
      <div style={{ padding: '10px', background: '#333', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Map Editor</h2>
        <button onClick={onBackToMenu} style={{ padding: '5px 10px', cursor: 'pointer' }}>Back to Menu</button>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <EditorViewport />
        </div>
        <div style={{ width: '300px', background: '#2a2a2a', borderLeft: '1px solid #444' }}>
          <EditorToolbar />
        </div>
      </div>
    </div>
  );
};

export default MapEditor;
