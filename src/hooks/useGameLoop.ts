import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { updateMovement } from '../systems/movement';
import { updateCombatAndHarvest } from '../systems/combat';
import { updateFogOfWar } from '../systems/fogOfWar';
import { updateProjectiles } from '../systems/projectiles';
import { updateAITactics } from '../systems/aiTactics';
import { GAME_CONFIG, UNIT_DATA } from '../constants/gameData';
import { updateBuildQueue } from '../systems/buildQueue';
import { v4 as uuidv4 } from 'uuid';

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

            const aiResult = updateAITactics(
                projResult.units,
                projResult.buildings,
                combatResult.players,
                state.gameTime + dt
            );

            const { nextBuildQueue, completedUnits } = updateBuildQueue(
                state.buildQueue,
                combatResult.players,
                projResult.buildings,
                dt
            );

            let finalUnits = { ...aiResult.units };
            if (completedUnits.length > 0) {
                completedUnits.forEach(u => {
                    const id = uuidv4();
                    const data = UNIT_DATA[u.name as keyof typeof UNIT_DATA];

                    finalUnits[id] = {
                        id,
                        type: 'unit',
                        unitType: u.name as any,
                        owner: u.owner as any,
                        position: u.position,
                        health: data.health,
                        maxHealth: data.health,
                        selected: false,
                        name: data.name,
                        speed: data.speed,
                        damage: (data as any).damage || 0,
                        range: (data as any).range || 0,
                        attackCooldown: (data as any).attackCooldown || 0,
                        lastAttackTime: 0,
                        state: 'idle',
                        rotation: 0,
                        carryingResource: u.name === 'harvester' ? 0 : undefined,
                        maxCarry: u.name === 'harvester' ? (data as any).maxCarry : undefined,
                    };
                });
            }

            const nextFogOfWar = updateFogOfWar({
                ...state,
                units: finalUnits,
                buildings: projResult.buildings,
            });

            return {
                units: finalUnits,
                buildings: projResult.buildings,
                resources: combatResult.resources,
                players: aiResult.players,
                projectiles: projResult.projectiles,
                gameTime: state.gameTime + dt,
                fogOfWar: nextFogOfWar,
                buildQueue: nextBuildQueue,
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