import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { GAME_CONFIG } from '../../constants/gameData';

const Minimap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const units = useGameStore(state => state.units);
  const buildings = useGameStore(state => state.buildings);
  const resources = useGameStore(state => state.resources);
  const viewport = useGameStore(state => state.viewport);
  const setViewport = useGameStore(state => state.setViewport);

  const minimapSize = 150;
  const mapWidth = GAME_CONFIG.mapSize.width;
  const mapHeight = GAME_CONFIG.mapSize.height;

  // Render the minimap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, minimapSize, minimapSize);

    // Draw background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, minimapSize, minimapSize);

    // Helper to scale map coordinates to minimap coordinates
    const scaleX = (x: number) => (x / mapWidth) * minimapSize;
    const scaleY = (y: number) => (y / mapHeight) * minimapSize;

    // Draw resources
    ctx.fillStyle = 'yellow';
    Object.values(resources).forEach(resource => {
      ctx.fillRect(scaleX(resource.position.x), scaleY(resource.position.y), 2, 2);
    });

    // Draw buildings
    Object.values(buildings).forEach(building => {
      ctx.fillStyle = building.owner === 'player' ? 'green' : 'red';
      ctx.fillRect(scaleX(building.position.x), scaleY(building.position.y), 3, 3);
    });

    // Draw units
    Object.values(units).forEach(unit => {
      ctx.fillStyle = unit.owner === 'player' ? 'green' : 'red';
      ctx.fillRect(scaleX(unit.position.x), scaleY(unit.position.y), 2, 2);
    });

    // Draw viewport
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    const vpX = scaleX(viewport.x);
    const vpY = scaleY(viewport.y);
    const vpW = scaleX(viewport.width / viewport.scale);
    const vpH = scaleY(viewport.height / viewport.scale);
    ctx.strokeRect(vpX, vpY, vpW, vpH);

  }, [units, buildings, resources, viewport, mapWidth, mapHeight]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    // Scale back to world coordinates
    const targetWorldX = (clickX / minimapSize) * mapWidth;
    const targetWorldY = (clickY / minimapSize) * mapHeight;

    // Center the viewport on the click location
    const vpW = viewport.width / viewport.scale;
    const vpH = viewport.height / viewport.scale;

    setViewport({
      x: Math.max(0, Math.min(targetWorldX - vpW / 2, mapWidth - vpW)),
      y: Math.max(0, Math.min(targetWorldY - vpH / 2, mapHeight - vpH))
    });
  };

  return (
    <div style={{
      width: minimapSize,
      height: minimapSize,
      border: '2px solid #555',
      backgroundColor: '#000',
      pointerEvents: 'auto',
      cursor: 'crosshair',
    }}>
      <canvas
        ref={canvasRef}
        width={minimapSize}
        height={minimapSize}
        onMouseDown={handleMinimapClick}
        onMouseMove={(e) => {
          if (e.buttons === 1) handleMinimapClick(e);
        }}
        onTouchStart={handleMinimapClick}
        onTouchMove={(e) => handleMinimapClick(e)}
      />
    </div>
  );
};

export default Minimap;
