import { useCampaignStore } from '../store/campaignStore';
import { useGameStore } from '../store/gameStore';
import type { Condition, Action, MissionData } from './types';
import type { GameStateData } from '../models/types';
// import { audioSystem } from '../systems/audioSystem'; // Can be added later for audio action

export const loadMission = (mission: MissionData) => {
    useCampaignStore.getState().initMission(mission.id, mission.initialObjectives);

    useGameStore.setState((state) => {
        // Reset players money
        const newPlayers = { ...state.players };
        for (const pid in mission.startingMoney) {
            if (newPlayers[pid as keyof typeof newPlayers]) {
                newPlayers[pid as keyof typeof newPlayers].money = mission.startingMoney[pid as keyof typeof mission.startingMoney];
            }
        }

        return { players: newPlayers };
    });

    // Spawn starting entities
    mission.startingBuildings.forEach(b => {
        useGameStore.getState().spawnBuilding(b.type, b.position, b.playerId);
    });

    mission.startingUnits.forEach(u => {
        useGameStore.getState().spawnUnit(u.type, u.position, u.playerId);
    });

    mission.startingResources.forEach(r => {
        useGameStore.getState().spawnResource(r.type, r.position, r.amount);
    });
};

const evaluateCondition = (condition: Condition, gameState: GameStateData, campaignState: ReturnType<typeof useCampaignStore.getState>): boolean => {
    switch (condition.type) {
        case 'TimeElapsed':
            return gameState.gameTime >= condition.timeMs;

        case 'UnitEntersRegion': {
            const { region, playerId } = condition;
            for (const unit of Object.values(gameState.units)) {
                if (playerId && unit.owner !== playerId) continue;
                if (
                    unit.position.x >= region.x &&
                    unit.position.x <= region.x + region.width &&
                    unit.position.y >= region.y &&
                    unit.position.y <= region.y + region.height
                ) {
                    return true;
                }
            }
            return false;
        }

        case 'BaseDestroyed': {
            // Base is destroyed if there are no buildings belonging to the player
            // But only count it if they ever HAD buildings (this is a simple implementation)
            // A more robust way is to check if it's past the initial setup and building count is 0
            if (gameState.gameTime < 10000) return false; // Give more time for initial spawn/gameplay so it doesn't instantly trigger
            const hasBuildings = Object.values(gameState.buildings).some(b => b.owner === condition.playerId);
            const hasUnits = Object.values(gameState.units).some(u => u.owner === condition.playerId);
            return !hasBuildings && !hasUnits; // True if no buildings and no units
        }

        case 'ObjectiveCompleted': {
            const obj = campaignState.objectives[condition.objectiveId];
            return obj ? obj.status === 'completed' : false;
        }

        case 'EntityDestroyed': {
            const unitExists = !!gameState.units[condition.entityId];
            const buildingExists = !!gameState.buildings[condition.entityId];
            return !unitExists && !buildingExists;
        }

        default:
            return false;
    }
};

const executeAction = (action: Action, gameState: GameStateData, campaignState: ReturnType<typeof useCampaignStore.getState>) => {
    switch (action.type) {
        case 'SpawnReinforcements':
            for (let i = 0; i < action.count; i++) {
                const offset = i * 20; // Simple offset so they don't stack perfectly
                useGameStore.getState().spawnUnit(
                    action.unitType,
                    { x: action.position.x + offset, y: action.position.y + offset },
                    action.playerId
                );
            }
            break;

        case 'SpawnBuilding':
            useGameStore.getState().spawnBuilding(action.buildingType, action.position, action.playerId);
            break;

        case 'PlayAudio':
            // audioSystem.play(action.audioId); // Assuming audioSystem can handle arbitrary string IDs or needs extension
            break;

        case 'ShowDialogue':
            campaignState.showDialogue(
                action.portrait,
                action.characterName,
                action.text,
                action.durationMs,
                gameState.gameTime
            );
            break;

        case 'WinMission':
            campaignState.setMissionStatus('won');
            break;

        case 'LoseMission':
            campaignState.setMissionStatus('lost');
            break;

        case 'SetObjectiveStatus':
            campaignState.updateObjectiveStatus(action.objectiveId, action.status);
            break;

        case 'AddObjective':
            campaignState.addObjective({
                id: action.objectiveId,
                description: action.description,
                status: 'active'
            });
            break;

        case 'PanCamera':
            useGameStore.getState().setViewport({ x: action.position.x, y: action.position.y });
            break;
    }
};

export const updateCampaignEngine = (mission: MissionData | null, gameState: GameStateData) => {
    if (!mission) return;

    const campaignState = useCampaignStore.getState();

    // Update dialogue expiration
    campaignState.updateDialogue(gameState.gameTime);

    if (campaignState.missionStatus !== 'playing') return;

    mission.triggers.forEach(trigger => {
        if (trigger.once && campaignState.firedTriggers.has(trigger.id)) {
            return;
        }

        // Check if ALL conditions are met
        const allConditionsMet = trigger.conditions.every(cond => evaluateCondition(cond, gameState, campaignState));

        if (allConditionsMet) {
            // Execute all actions
            trigger.actions.forEach(action => executeAction(action, gameState, campaignState));

            if (trigger.once) {
                campaignState.markTriggerFired(trigger.id);
            }
        }
    });
};
