import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { updateMovement } from '../systems/movement';
import { updateCombatAndHarvest } from '../systems/combat';
import { updateHarvesting } from '../systems/harvesting';
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
            let nextUnits = updateMovement(state.units, state.buildings, dt);
            
            const combatResult = updateCombatAndHarvest(
                nextUnits, 
                state.buildings, 
                state.resources, 
                state.players, 
                dt, 
                state.gameTime
            );

            const harvestResult = updateHarvesting(
                combatResult.units,
                combatResult.buildings,
                combatResult.resources,
                combatResult.players,
                dt
            );

            return {
                units: harvestResult.units,
                buildings: combatResult.buildings,
                resources: harvestResult.resources,
                players: harvestResult.players,
                gameTime: state.gameTime + dt
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