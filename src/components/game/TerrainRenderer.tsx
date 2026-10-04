import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { GAME_CONFIG } from '../../constants/gameData';

const TerrainRenderer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const viewport = useGameStore((state) => state.viewport);
  const terrain = useGameStore((state) => state.terrain);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.05; // For water animation

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(viewport.scale, viewport.scale);
      ctx.translate(-viewport.x, -viewport.y);

      const gridWidth = Math.ceil(GAME_CONFIG.mapSize.width / GAME_CONFIG.tileSize);
      const gridHeight = Math.ceil(GAME_CONFIG.mapSize.height / GAME_CONFIG.tileSize);

      const worldLeft = viewport.x - (canvas.width / 2) / viewport.scale;
      const worldTop = viewport.y - (canvas.height / 2) / viewport.scale;
      const worldRight = viewport.x + (canvas.width / 2) / viewport.scale;
      const worldBottom = viewport.y + (canvas.height / 2) / viewport.scale;

      const fowStartX = Math.max(0, Math.floor(worldLeft / GAME_CONFIG.tileSize));
      const fowStartY = Math.max(0, Math.floor(worldTop / GAME_CONFIG.tileSize));
      const fowEndX = Math.min(gridWidth - 1, Math.ceil(worldRight / GAME_CONFIG.tileSize));
      const fowEndY = Math.min(gridHeight - 1, Math.ceil(worldBottom / GAME_CONFIG.tileSize));

      for (let y = fowStartY; y <= fowEndY; y++) {
        for (let x = fowStartX; x <= fowEndX; x++) {
          const index = y * gridWidth + x;
          const type = terrain[index];

          if (type === 1) { // Water
            // Animated shader-like effect
            const wave = Math.sin(x * 0.5 + y * 0.5 + time) * 10;
            ctx.fillStyle = `hsl(210, 80%, ${40 + wave}%)`; // Blueish water
            ctx.fillRect(x * GAME_CONFIG.tileSize, y * GAME_CONFIG.tileSize, GAME_CONFIG.tileSize, GAME_CONFIG.tileSize);
          } else {
             // Land is just ground color, handled by viewport background or can be drawn here
             // ctx.fillStyle = '#225522'; // Dark green
             // ctx.fillRect(x * GAME_CONFIG.tileSize, y * GAME_CONFIG.tileSize, GAME_CONFIG.tileSize, GAME_CONFIG.tileSize);
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
  }, [viewport, terrain]);

  return <canvas ref={canvasRef} style={{ display: 'block', position: 'absolute', top: 0, left: 0, zIndex: 0 }} />;
};

export default TerrainRenderer;
