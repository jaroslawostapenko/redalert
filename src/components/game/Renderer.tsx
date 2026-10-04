import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { GAME_CONFIG } from '../../constants/gameData';

const Renderer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const viewport = useGameStore((state) => state.viewport);
  const units = useGameStore((state) => state.units);
  const buildings = useGameStore((state) => state.buildings);
  const resources = useGameStore((state) => state.resources);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Animation frame loop for rendering
    let animationFrameId: number;

    const render = () => {
      // Clear and resize canvas
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Camera transform
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(viewport.scale, viewport.scale);
      ctx.translate(-viewport.x, -viewport.y);

      // Draw Grid (optional, for debug/looks)
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      const startX = Math.floor((viewport.x - viewport.width/2 / viewport.scale) / GAME_CONFIG.tileSize) * GAME_CONFIG.tileSize;
      const startY = Math.floor((viewport.y - viewport.height/2 / viewport.scale) / GAME_CONFIG.tileSize) * GAME_CONFIG.tileSize;
      const endX = startX + (viewport.width / viewport.scale) + GAME_CONFIG.tileSize;
      const endY = startY + (viewport.height / viewport.scale) + GAME_CONFIG.tileSize;

      for (let x = startX; x <= endX; x += GAME_CONFIG.tileSize) {
          ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
      }
      for (let y = startY; y <= endY; y += GAME_CONFIG.tileSize) {
          ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
      }

      // Draw Resources
      Object.values(resources).forEach(res => {
         ctx.fillStyle = res.resourceType === 'ore' ? '#FFD700' : '#00FFFF';
         ctx.beginPath();
         ctx.arc(res.position.x, res.position.y, 8, 0, Math.PI * 2);
         ctx.fill();
      });

      // Draw Buildings
      Object.values(buildings).forEach(bldg => {
          ctx.fillStyle = bldg.owner === 'player' ? '#0000AA' : '#AA0000';
          const bw = bldg.size.width * GAME_CONFIG.tileSize;
          const bh = bldg.size.height * GAME_CONFIG.tileSize;
          ctx.fillRect(bldg.position.x, bldg.position.y, bw, bh);
          ctx.strokeStyle = bldg.selected ? '#00FF00' : '#fff';
          ctx.lineWidth = 2;
          ctx.strokeRect(bldg.position.x, bldg.position.y, bw, bh);
      });

      // Draw Units
      Object.values(units).forEach(unit => {
          ctx.save();
          ctx.translate(unit.position.x, unit.position.y);
          ctx.rotate(unit.rotation);

          ctx.fillStyle = unit.owner === 'player' ? '#4444FF' : '#FF4444';
          if (unit.unitType === 'tank') {
              ctx.fillRect(-10, -10, 20, 20);
              // Barrel
              ctx.fillStyle = '#aaa';
              ctx.fillRect(0, -2, 15, 4);
          } else if (unit.unitType === 'harvester') {
              ctx.fillRect(-12, -10, 24, 20);
          } else {
              // Rifleman
              ctx.beginPath();
              ctx.arc(0, 0, 6, 0, Math.PI * 2);
              ctx.fill();
          }

          ctx.restore();

          // Selection ring
          if (unit.selected) {
              ctx.strokeStyle = '#00FF00';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(unit.position.x, unit.position.y, 14, 0, Math.PI * 2);
              ctx.stroke();

              // Draw path if moving
              if (unit.path && unit.path.length > 0) {
                  ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
                  ctx.beginPath();
                  ctx.moveTo(unit.position.x, unit.position.y);
                  unit.path.forEach(wp => ctx.lineTo(wp.x, wp.y));
                  ctx.stroke();
              }
          }
          
          // Health bar
          if (unit.health < unit.maxHealth) {
              ctx.fillStyle = 'red';
              ctx.fillRect(unit.position.x - 10, unit.position.y - 15, 20, 3);
              ctx.fillStyle = 'green';
              ctx.fillRect(unit.position.x - 10, unit.position.y - 15, 20 * (unit.health / unit.maxHealth), 3);
          }
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [viewport, units, buildings, resources]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};

export default Renderer;