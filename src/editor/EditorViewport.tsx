import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { GAME_CONFIG, UNIT_DATA, BUILDING_DATA } from '../constants/gameData';

const EditorViewport: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const terrain = useEditorStore(state => state.terrain);
  const entities = useEditorStore(state => state.entities);
  const viewport = useEditorStore(state => state.viewport);
  const setViewport = useEditorStore(state => state.setViewport);

  const initGrid = useEditorStore(state => state.initGrid);
  const activeTool = useEditorStore(state => state.activeTool);
  const activeTerrain = useEditorStore(state => state.activeTerrain);
  const activeEntityId = useEditorStore(state => state.activeEntityId);
  const activeOwner = useEditorStore(state => state.activeOwner);
  const brushSize = useEditorStore(state => state.brushSize);
  const paintTerrain = useEditorStore(state => state.paintTerrain);
  const placeEntity = useEditorStore(state => state.placeEntity);
  const removeEntity = useEditorStore(state => state.removeEntity);

  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Initialize map if empty
  useEffect(() => {
    if (terrain.length === 0) {
      const gridWidth = Math.ceil(GAME_CONFIG.mapSize.width / GAME_CONFIG.tileSize);
      const gridHeight = Math.ceil(GAME_CONFIG.mapSize.height / GAME_CONFIG.tileSize);
      initGrid(gridWidth, gridHeight);
    }
  }, [terrain, initGrid]);

  // Handle Resize
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth - 300, height: window.innerHeight - 40 }); // 300px toolbar, 40px header

  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({
        width: window.innerWidth - 300,
        height: window.innerHeight - 40
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();

      // Move camera to viewport center based on current scale
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(viewport.scale, viewport.scale);
      ctx.translate(-viewport.x, -viewport.y);

      // Render Terrain
      const tileSize = GAME_CONFIG.tileSize;
      if (terrain.length > 0) {
        for (let y = 0; y < terrain.length; y++) {
          for (let x = 0; x < terrain[y].length; x++) {
            const tileType = terrain[y][x];

            // Just clipping simple bounds check
            const worldX = x * tileSize;
            const worldY = y * tileSize;

            if (
              worldX + tileSize < viewport.x - (canvas.width / 2) / viewport.scale ||
              worldX > viewport.x + (canvas.width / 2) / viewport.scale ||
              worldY + tileSize < viewport.y - (canvas.height / 2) / viewport.scale ||
              worldY > viewport.y + (canvas.height / 2) / viewport.scale
            ) {
              continue;
            }

            if (tileType === 'grass') ctx.fillStyle = '#3a5f33';
            else if (tileType === 'water') ctx.fillStyle = '#3a7ca5';
            else if (tileType === 'sand') ctx.fillStyle = '#d4c4a8';
            else if (tileType === 'cliff') ctx.fillStyle = '#555';

            ctx.fillRect(worldX, worldY, tileSize, tileSize);

            // Grid lines
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.strokeRect(worldX, worldY, tileSize, tileSize);
          }
        }
      }

      // Render Entities
      for (const ent of entities) {
        ctx.save();
        ctx.translate(ent.position.x, ent.position.y);

        const isPlayer = ent.owner === 'player';
        const isEnemy = ent.owner === 'enemy';
        const color = isPlayer ? '#4a90e2' : (isEnemy ? '#e24a4a' : '#aaaaaa');

        if (ent.type === 'building') {
            const bSize = (BUILDING_DATA as any)[ent.entityId]?.size || { width: 2, height: 2 };
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, bSize.width * tileSize, bSize.height * tileSize);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(0, 0, bSize.width * tileSize, bSize.height * tileSize);
            ctx.fillStyle = '#fff';
            ctx.font = '10px sans-serif';
            ctx.fillText(ent.entityId, 2, 12);
        } else if (ent.type === 'unit') {
            const radius = (UNIT_DATA as any)[ent.entityId]?.radius || 10;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.stroke();
        } else if (ent.type === 'resource') {
             ctx.fillStyle = ent.entityId === 'gems' ? '#e24ac2' : '#e2b84a';
             ctx.beginPath();
             ctx.arc(0, 0, 15, 0, Math.PI * 2);
             ctx.fill();
        }

        ctx.restore();
      }

      // Draw map bounds
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, GAME_CONFIG.mapSize.width, GAME_CONFIG.mapSize.height);

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [terrain, entities, viewport]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);

    if (e.button === 1 || e.buttons === 4 || e.altKey) {
      // Middle click or Alt+click to pan
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    if (e.button === 0) {
      setIsDragging(true);
      handleAction(e, false);
    }

    if (e.button === 2) { // Right click to remove entity
      handleRemoveAction(e);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;

      setViewport({
        x: viewport.x - dx / viewport.scale,
        y: viewport.y - dy / viewport.scale,
      });
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isDragging && activeTool === 'terrain') {
      handleAction(e, true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const zoomFactor = 1.1;
    let newScale = viewport.scale;
    if (e.deltaY < 0) newScale *= zoomFactor;
    else if (e.deltaY > 0) newScale /= zoomFactor;

    newScale = Math.max(0.1, Math.min(newScale, 5));
    setViewport({ scale: newScale });
  };

  const handleAction = (e: React.PointerEvent<HTMLCanvasElement>, isDrag: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert screen to world
    const worldX = (mouseX - canvas.width / 2) / viewport.scale + viewport.x;
    const worldY = (mouseY - canvas.height / 2) / viewport.scale + viewport.y;

    if (activeTool === 'terrain') {
      const cellX = Math.floor(worldX / GAME_CONFIG.tileSize);
      const cellY = Math.floor(worldY / GAME_CONFIG.tileSize);
      paintTerrain(cellX, cellY, brushSize, activeTerrain);
    } else if (!isDrag) {
      // Place entity

      let pos = { x: worldX, y: worldY };

      if (activeTool === 'building') {
         // Snap building to grid
         const snappedX = Math.floor(worldX / GAME_CONFIG.tileSize) * GAME_CONFIG.tileSize;
         const snappedY = Math.floor(worldY / GAME_CONFIG.tileSize) * GAME_CONFIG.tileSize;
         pos = { x: snappedX, y: snappedY };
      }

      placeEntity({
        type: activeTool,
        entityId: activeEntityId,
        position: pos,
        owner: activeOwner
      });
    }
  };

  const handleRemoveAction = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Convert screen to world
      const worldX = (mouseX - canvas.width / 2) / viewport.scale + viewport.x;
      const worldY = (mouseY - canvas.height / 2) / viewport.scale + viewport.y;

      // Find closest entity to remove
      let closestId = null;
      let minDst = 50; // pixels leeway

      for (const ent of entities) {
          const dx = ent.position.x - worldX;
          const dy = ent.position.y - worldY;
          const dst = Math.sqrt(dx*dx + dy*dy);
          if (dst < minDst) {
              minDst = dst;
              closestId = ent.id;
          }
      }

      if (closestId) {
          removeEntity(closestId);
      }
  }

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      style={{ display: 'block', cursor: activeTool === 'terrain' ? 'crosshair' : 'default', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};

export default EditorViewport;
