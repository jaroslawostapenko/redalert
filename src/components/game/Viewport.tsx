import React, { useRef, useState, useEffect } from "react";
import type { TouchEvent as ReactTouchEvent, MouseEvent } from "react";
import { useGameStore } from '../../store/gameStore';
import type { Vector2 } from '../../models/types';
import {  } from '../../utils/math';
import Renderer from './Renderer';

const Viewport: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const viewport = useGameStore((state) => state.viewport);
  const setViewport = useGameStore((state) => state.setViewport);
  const selectEntities = useGameStore((state) => state.selectEntities);
  const commandUnits = useGameStore((state) => state.commandUnits);
  const units = useGameStore((state) => state.units);
  const selection = useGameStore((state) => state.selection);
  
  // Touch panning state
  const [isPanning, setIsPanning] = useState(false);
  const [lastTouchPos, setLastTouchPos] = useState<Vector2 | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number>(0);

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setViewport]);

  const screenToWorld = (screenX: number, screenY: number): Vector2 => {
    return {
      x: (screenX - viewport.width / 2) / viewport.scale + viewport.x,
      y: (screenY - viewport.height / 2) / viewport.scale + viewport.y,
    };
  };

  const handleTouchStart = (e: ReactTouchEvent) => {
    if (e.touches.length === 1) {
      setLastTouchPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setIsPanning(true);
      setTouchStartTime(Date.now());
    }
  };

  const handleTouchMove = (e: ReactTouchEvent) => {
    if (isPanning && lastTouchPos && e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = (lastTouchPos.x - touch.clientX) / viewport.scale;
      const dy = (lastTouchPos.y - touch.clientY) / viewport.scale;
      
      setViewport({ x: viewport.x + dx, y: viewport.y + dy });
      setLastTouchPos({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchEnd = (e: ReactTouchEvent) => {
    if (e.changedTouches.length === 1 && lastTouchPos) {
        // If it was a quick tap, treat it as a click
        if (Date.now() - touchStartTime < 300) {
            handleInteraction(e.changedTouches[0].clientX, e.changedTouches[0].clientY, true);
        }
    }
    
    if (e.touches.length === 0) {
      setIsPanning(false);
      setLastTouchPos(null);
    }
  };

  const handleInteraction = (clientX: number, clientY: number, isTap: boolean, isRightClick: boolean = false) => {
    const worldPos = screenToWorld(clientX, clientY);

    // Check if we clicked a unit
    let clickedId = null;
    for (const id in units) {
      const u = units[id];
      // simple radius check
      const dx = u.position.x - worldPos.x;
      const dy = u.position.y - worldPos.y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        clickedId = id;
        break;
      }
    }

    if (isTap) {
        if (clickedId) {
            // Select the unit
            selectEntities([clickedId]);
        } else if (selection.length > 0) {
            // Tap on empty ground with selection -> move there
             commandUnits({
                 type: 'move',
                 targetPosition: worldPos,
                 unitIds: selection
             });
        } else {
            // Tap on empty ground with no selection -> deselect
            selectEntities([]);
        }
    } else {
        // Desktop logic
        if (!isRightClick) {
            if (clickedId) {
                selectEntities([clickedId]);
            } else {
                selectEntities([]); // deselect
            }
        } else if (isRightClick) {
            if (selection.length > 0) {
                 commandUnits({
                     type: 'move',
                     targetPosition: worldPos,
                     unitIds: selection
                 });
            }
        }
    }
  }

  const handleClick = (e: MouseEvent) => {
    // If we just finished a pan, ignore the click
    if (isPanning) return;
    handleInteraction(e.clientX, e.clientY, false, e.button === 2);
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden', 
        position: 'relative',
        backgroundColor: '#1a1a1a'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleClick}
      onContextMenu={(e) => { e.preventDefault(); handleClick(e); }}
    >
      <Renderer />
    </div>
  );
};

export default Viewport;