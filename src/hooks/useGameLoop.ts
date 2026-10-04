import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { updateMovement } from '../systems/movement';
import { updateCombatAndHarvest } from '../systems/combat';
import { updateFogOfWar } from '../systems/fogOfWar';
import { updateProjectiles } from '../systems/projectiles';
import { GAME_CONFIG } from '../constants/gameData';

export const useGameLoop = () => {
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);

  const update = (time: number) => {
    if (previousTimeRef.current === 0) {
      previousTimeRef.current = time;
    }

    const deltaTime = time - previousTimeRef.current;
    
    // Cap delta time to prevent huge jumps if tab is inactive
    const dt = Math.min(deltaTime, 100);

    if (dt >= GAME_CONFIG.tickRate) {
        useGameStore.setState((state) => {
            let nextUnits = updateMovement(state.units, dt);
            
            const combatResult = updateCombatAndHarvest(
                nextUnits, 
                state.buildings, 
                state.resources, 
                state.players, 
                state.projectiles,
                dt, 
                state.gameTime
            );

            const projResult = updateProjectiles(
                combatResult.projectiles,
                combatResult.units,
                combatResult.buildings,
                dt
            );

            const nextFogOfWar = updateFogOfWar({
                ...state,
                units: projResult.units,
                buildings: projResult.buildings,
            });

            return {
                units: projResult.units,
                buildings: projResult.buildings,
                resources: combatResult.resources,
                players: combatResult.players,
                projectiles: projResult.projectiles,
                gameTime: state.gameTime + dt,
                fogOfWar: nextFogOfWar
            };
        });
        
        previousTimeRef.current = time;
    }

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};