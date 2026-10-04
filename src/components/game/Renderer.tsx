import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { GAME_CONFIG } from '../../constants/gameData';

const Renderer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const viewport = useGameStore((state) => state.viewport);
  const units = useGameStore((state) => state.units);
  const buildings = useGameStore((state) => state.buildings);
  const resources = useGameStore((state) => state.resources);
  const fogOfWar = useGameStore((state) => state.fogOfWar);
  const projectiles = useGameStore((state) => state.projectiles);

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
          const bw = bldg.size.width * GAME_CONFIG.tileSize;
          const bh = bldg.size.height * GAME_CONFIG.tileSize;

          if (bldg.buildingType === 'bridge') {
              ctx.fillStyle = bldg.state === 'destroyed' ? '#4a3b2c' : '#8b5a2b'; // Brown colors
              ctx.fillRect(bldg.position.x, bldg.position.y, bw, bh);

              // Draw planks
              if (bldg.state !== 'destroyed') {
                  ctx.strokeStyle = '#5c3a21';
                  ctx.lineWidth = 2;
                  for(let i=0; i<bw; i+=10) {
                      ctx.beginPath(); ctx.moveTo(bldg.position.x + i, bldg.position.y); ctx.lineTo(bldg.position.x + i, bldg.position.y + bh); ctx.stroke();
                  }
              }
          } else {
              ctx.fillStyle = bldg.owner === 'player' ? '#0000AA' : '#AA0000';
              ctx.fillRect(bldg.position.x, bldg.position.y, bw, bh);
              ctx.strokeStyle = bldg.selected ? '#00FF00' : '#fff';
              ctx.lineWidth = 2;
              ctx.strokeRect(bldg.position.x, bldg.position.y, bw, bh);
          }
      });



      // Draw Units
      Object.values(units).forEach(unit => {
          // Hide in_transport units
          if (unit.state === 'in_transport') return;
          // Hide submerged enemy submarines
          if (unit.unitType === 'submarine' && unit.isSubmerged && unit.owner !== 'player') {
              return;
          }

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
          } else if (unit.unitType === 'gunboat') {
              ctx.beginPath();
              ctx.moveTo(15, 0);
              ctx.lineTo(-15, -8);
              ctx.lineTo(-15, 8);
              ctx.fill();
          } else if (unit.unitType === 'destroyer') {
              ctx.fillRect(-20, -10, 40, 20);
          } else if (unit.unitType === 'submarine') {
              ctx.beginPath();
              ctx.ellipse(0, 0, 15, 5, 0, 0, Math.PI*2);
              if (unit.isSubmerged) {
                 ctx.globalAlpha = 0.5; // Transparent if submerged (for player viewing their own sub)
              }
              ctx.fill();
              ctx.globalAlpha = 1.0;
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

      // Draw Projectiles
      projectiles.forEach(proj => {
          ctx.fillStyle = '#FFA500';
          ctx.beginPath();
          ctx.arc(proj.position.x, proj.position.y, 3, 0, Math.PI * 2);
          ctx.fill();
      });

      // Draw Fog of War
      const gridWidth = Math.ceil(GAME_CONFIG.mapSize.width / GAME_CONFIG.tileSize);
      const gridHeight = Math.ceil(GAME_CONFIG.mapSize.height / GAME_CONFIG.tileSize);

      // We need to calculate world bounds for the visible viewport
      const worldLeft = viewport.x - (canvas.width / 2) / viewport.scale;
      const worldTop = viewport.y - (canvas.height / 2) / viewport.scale;
      const worldRight = viewport.x + (canvas.width / 2) / viewport.scale;
      const worldBottom = viewport.y + (canvas.height / 2) / viewport.scale;

      const fowStartX = Math.floor(worldLeft / GAME_CONFIG.tileSize);
      const fowStartY = Math.floor(worldTop / GAME_CONFIG.tileSize);
      const fowEndX = Math.ceil(worldRight / GAME_CONFIG.tileSize);
      const fowEndY = Math.ceil(worldBottom / GAME_CONFIG.tileSize);

      for (let y = fowStartY; y <= fowEndY; y++) {
        for (let x = fowStartX; x <= fowEndX; x++) {
          if (x < 0 || y < 0 || x >= gridWidth || y >= gridHeight) {
            // Off map, draw black to hide out of bounds
            ctx.fillStyle = '#000000';
            ctx.fillRect(x * GAME_CONFIG.tileSize, y * GAME_CONFIG.tileSize, GAME_CONFIG.tileSize, GAME_CONFIG.tileSize);
            continue;
          }

          const index = y * gridWidth + x;
          const status = fogOfWar[index];

          if (status === 0 || status === undefined) {
            // Unexplored
            ctx.fillStyle = '#000000';
            ctx.fillRect(x * GAME_CONFIG.tileSize, y * GAME_CONFIG.tileSize, GAME_CONFIG.tileSize, GAME_CONFIG.tileSize);
          } else if (status === 1) {
            // Explored but not visible
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x * GAME_CONFIG.tileSize, y * GAME_CONFIG.tileSize, GAME_CONFIG.tileSize, GAME_CONFIG.tileSize);
          }
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [viewport, units, buildings, resources, fogOfWar, projectiles]);

  return <canvas ref={canvasRef} style={{ display: 'block', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />;
};

export default Renderer;