import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { updateMovement } from '../systems/movement';
import { updateCombatAndHarvest } from '../systems/combat';
import { updateHarvesting } from '../systems/harvesting';
import { updateAiDirector } from '../systems/aiDirector';
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
        
        // Call the AI director *outside* the synchronous tick update.
        // This ensures that when the AI calls spawnBuilding/spawnUnit, those independent
        // state mutations don't get overwritten by the return value of the tick update.
        const stateAfterTick = useGameStore.getState();
        const aiResult = updateAiDirector(
            stateAfterTick.units,
            stateAfterTick.buildings,
            stateAfterTick.resources,
            stateAfterTick.players,
            stateAfterTick.gameTime,
            stateAfterTick.spawnBuilding,
            stateAfterTick.spawnUnit
        );

        // If the AI updated player resources (e.g. spent money), flush it
        if (aiResult.players !== stateAfterTick.players) {
             useGameStore.setState({ players: aiResult.players });
        }

        previousTimeRef.current = time;
    }

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};