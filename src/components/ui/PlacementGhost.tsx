import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { GAME_CONFIG, BUILDING_DATA } from '../../constants/gameData';
import { worldToGrid } from '../../utils/geometry';

export const PlacementGhost: React.FC = () => {
  const placementMode = useGameStore(state => state.placementMode);
  const viewport = useGameStore(state => state.viewport);
  const buildings = useGameStore(state => state.buildings);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!placementMode.active) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [placementMode.active]);

  if (!placementMode.active || !placementMode.buildingType) return null;

  const buildingData = BUILDING_DATA[placementMode.buildingType as keyof typeof BUILDING_DATA];
  if (!buildingData) return null;

  // Convert mouse screen coords to world coords
  const worldX = (mousePos.x - viewport.width / 2) / viewport.scale + viewport.x;
  const worldY = (mousePos.y - viewport.height / 2) / viewport.scale + viewport.y;

  // Snap to grid
  const gridPos = worldToGrid({ x: worldX, y: worldY });
  const snappedWorldX = gridPos.x * GAME_CONFIG.tileSize;
  const snappedWorldY = gridPos.y * GAME_CONFIG.tileSize;

  const pixelWidth = buildingData.size.width * GAME_CONFIG.tileSize;
  const pixelHeight = buildingData.size.height * GAME_CONFIG.tileSize;

  // Check overlap
  let isValid = true;

  // Quick bounds check
  if (
      snappedWorldX < 0 ||
      snappedWorldY < 0 ||
      snappedWorldX + pixelWidth > GAME_CONFIG.mapSize.width ||
      snappedWorldY + pixelHeight > GAME_CONFIG.mapSize.height
  ) {
      isValid = false;
  }

  // Check collision with existing buildings
  if (isValid) {
      for (const bldgId in buildings) {
          const b = buildings[bldgId];
          const bw = b.size.width * GAME_CONFIG.tileSize;
          const bh = b.size.height * GAME_CONFIG.tileSize;

          if (
              snappedWorldX < b.position.x + bw &&
              snappedWorldX + pixelWidth > b.position.x &&
              snappedWorldY < b.position.y + bh &&
              snappedWorldY + pixelHeight > b.position.y
          ) {
              isValid = false;
              break;
          }
      }
  }

  // Convert snapped world pos back to screen pos for rendering the overlay
  // Wait, we can render the ghost directly on the map in world space if it's inside Viewport.
  // If we render it inside Game.tsx overlay, we need screen space.
  // Given we just need it visually, and Renderer is canvas... wait, it's easier to just draw it as a div over the canvas.

  const screenX = (snappedWorldX - viewport.x) * viewport.scale + viewport.width / 2;
  const screenY = (snappedWorldY - viewport.y) * viewport.scale + viewport.height / 2;

  return (
    <div
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY,
        width: pixelWidth * viewport.scale,
        height: pixelHeight * viewport.scale,
        backgroundColor: isValid ? 'rgba(0, 255, 0, 0.4)' : 'rgba(255, 0, 0, 0.4)',
        border: `2px solid ${isValid ? '#0f0' : '#f00'}`,
        pointerEvents: 'none',
        zIndex: 100, // Make sure it's above canvas
      }}
    />
  );
};