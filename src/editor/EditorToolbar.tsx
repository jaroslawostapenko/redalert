import React, { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { TerrainType } from '../store/editorStore';
import { UNIT_DATA, BUILDING_DATA } from '../constants/gameData';
import { saveMapToLocalStorage, loadMapFromLocalStorage } from '../utils/mapExport';

const EditorToolbar: React.FC = () => {
  const store = useEditorStore();
  const [saveSlot, setSaveSlot] = useState('default');

  const handleSave = () => {
    saveMapToLocalStorage(store, saveSlot);
    alert('Map saved!');
  };

  const handleLoad = () => {
    const data = loadMapFromLocalStorage(saveSlot);
    if (data) {
      store.loadMapData(data);
      alert('Map loaded!');
    } else {
      alert('No save found in that slot.');
    }
  };

  const handleClear = () => {
      if (confirm('Clear the entire map?')) {
          store.initGrid(store.terrain[0].length, store.terrain.length);
      }
  }

  const btnStyle = (active: boolean) => ({
    padding: '8px',
    margin: '4px',
    background: active ? '#4a90e2' : '#444',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '4px'
  });

  return (
    <div style={{ padding: '15px', color: '#eee', height: '100%', overflowY: 'auto' }}>

      <div style={{ marginBottom: '20px' }}>
        <h3>Map Actions</h3>
        <input
            type="text"
            value={saveSlot}
            onChange={e => setSaveSlot(e.target.value)}
            placeholder="Slot name"
            style={{ width: '100%', padding: '5px', marginBottom: '5px' }}
        />
        <button onClick={handleSave} style={btnStyle(false)}>Save</button>
        <button onClick={handleLoad} style={btnStyle(false)}>Load</button>
        <button onClick={handleClear} style={{...btnStyle(false), background: '#c23b3b'}}>Clear Map</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Tools</h3>
        <button onClick={() => store.setToolInfo({ activeTool: 'terrain' })} style={btnStyle(store.activeTool === 'terrain')}>Terrain</button>
        <button onClick={() => store.setToolInfo({ activeTool: 'unit' })} style={btnStyle(store.activeTool === 'unit')}>Units</button>
        <button onClick={() => store.setToolInfo({ activeTool: 'building' })} style={btnStyle(store.activeTool === 'building')}>Buildings</button>
        <button onClick={() => store.setToolInfo({ activeTool: 'resource' })} style={btnStyle(store.activeTool === 'resource')}>Resources</button>
      </div>

      {store.activeTool === 'terrain' && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Terrain Type</h3>
          {(['grass', 'water', 'sand', 'cliff'] as TerrainType[]).map(t => (
            <button
              key={t}
              onClick={() => store.setToolInfo({ activeTerrain: t })}
              style={btnStyle(store.activeTerrain === t)}
            >
              {t}
            </button>
          ))}

          <h4 style={{marginTop: '10px'}}>Brush Size</h4>
          <input
            type="range"
            min="1"
            max="10"
            value={store.brushSize}
            onChange={(e) => store.setToolInfo({ brushSize: parseInt(e.target.value) })}
            style={{ width: '100%' }}
          />
          <span>Size: {store.brushSize}</span>
        </div>
      )}

      {store.activeTool === 'unit' && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Unit Type</h3>
          {Object.keys(UNIT_DATA).map(u => (
            <button
              key={u}
              onClick={() => store.setToolInfo({ activeEntityId: u })}
              style={btnStyle(store.activeEntityId === u)}
            >
              {UNIT_DATA[u as keyof typeof UNIT_DATA].name}
            </button>
          ))}
        </div>
      )}

      {store.activeTool === 'building' && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Building Type</h3>
          {Object.keys(BUILDING_DATA).map(b => (
            <button
              key={b}
              onClick={() => store.setToolInfo({ activeEntityId: b })}
              style={btnStyle(store.activeEntityId === b)}
            >
              {BUILDING_DATA[b as keyof typeof BUILDING_DATA].name}
            </button>
          ))}
        </div>
      )}

      {store.activeTool === 'resource' && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Resource Type</h3>
          {['ore', 'gems'].map(r => (
            <button
              key={r}
              onClick={() => store.setToolInfo({ activeEntityId: r })}
              style={btnStyle(store.activeEntityId === r)}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {(store.activeTool === 'unit' || store.activeTool === 'building') && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Owner</h3>
          <button onClick={() => store.setToolInfo({ activeOwner: 'player' })} style={btnStyle(store.activeOwner === 'player')}>Player</button>
          <button onClick={() => store.setToolInfo({ activeOwner: 'enemy' })} style={btnStyle(store.activeOwner === 'enemy')}>Enemy</button>
          <button onClick={() => store.setToolInfo({ activeOwner: 'neutral' })} style={btnStyle(store.activeOwner === 'neutral')}>Neutral</button>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
          <p>Left Click: Paint/Place</p>
          <p>Right Click: Remove Entity</p>
          <p>Middle Click / Alt: Pan Camera</p>
          <p>Scroll: Zoom</p>
      </div>
    </div>
  );
};

export default EditorToolbar;
