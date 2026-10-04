import type { MissionData } from '../types';
import { GAME_CONFIG } from '../../constants/gameData';

export const mission1: MissionData = {
    id: 'mission1',
    name: 'Operation: First Strike',
    description: 'Establish a base and destroy the enemy outpost.',
    initialObjectives: [
        {
            id: 'obj_build_base',
            description: 'Deploy the Construction Yard.',
            status: 'active'
        },
        {
            id: 'obj_destroy_enemy',
            description: 'Destroy all Soviet forces in the area.',
            status: 'hidden'
        }
    ],
    startingMoney: {
        player: 5000,
        enemy: 1000,
        neutral: 0
    },
    startingUnits: [], // Handled by intro trigger or just empty for now
    startingBuildings: [],
    startingResources: [
        { type: 'ore', position: { x: 800, y: 800 }, amount: 100 },
        { type: 'ore', position: { x: 800 + GAME_CONFIG.tileSize, y: 800 }, amount: 100 },
        { type: 'ore', position: { x: 800, y: 800 + GAME_CONFIG.tileSize }, amount: 100 },
        { type: 'ore', position: { x: 800 + GAME_CONFIG.tileSize, y: 800 + GAME_CONFIG.tileSize }, amount: 100 }
    ],
    triggers: [
        {
            id: 'trig_intro',
            conditions: [
                { type: 'TimeElapsed', timeMs: 1000 }
            ],
            actions: [
                {
                    type: 'ShowDialogue',
                    portrait: 'commander', // Placeholder
                    characterName: 'Commander',
                    text: 'Commander, establish a base of operations here. Deploy the Construction Yard.',
                    durationMs: 5000
                },
                {
                    type: 'SpawnReinforcements',
                    unitType: 'engineer',
                    count: 1,
                    position: { x: 100, y: 100 },
                    playerId: 'player'
                },
                {
                    type: 'SpawnBuilding',
                    buildingType: 'constructionYard',
                    position: { x: 200, y: 200 },
                    playerId: 'player'
                }
            ],
            once: true
        },
        {
            id: 'trig_base_built',
            conditions: [
                { type: 'TimeElapsed', timeMs: 7000 }
            ],
            actions: [
                {
                    type: 'SetObjectiveStatus',
                    objectiveId: 'obj_build_base',
                    status: 'completed'
                },
                {
                    type: 'SetObjectiveStatus',
                    objectiveId: 'obj_destroy_enemy',
                    status: 'active'
                },
                {
                    type: 'ShowDialogue',
                    portrait: 'commander',
                    characterName: 'Commander',
                    text: 'Base established. Now, eliminate the Soviet outpost to the east.',
                    durationMs: 5000
                },
                {
                    type: 'SpawnBuilding',
                    buildingType: 'barracks',
                    position: { x: 1000, y: 1000 },
                    playerId: 'enemy'
                }
            ],
            once: true
        },
        {
            id: 'trig_win',
            conditions: [
                { type: 'BaseDestroyed', playerId: 'enemy' }
            ],
            actions: [
                {
                    type: 'ShowDialogue',
                    portrait: 'commander',
                    characterName: 'Commander',
                    text: 'Excellent work, Commander. Mission accomplished.',
                    durationMs: 4000
                },
                { type: 'SetObjectiveStatus', objectiveId: 'obj_destroy_enemy', status: 'completed' },
                { type: 'WinMission' }
            ],
            once: true
        },
        {
            id: 'trig_lose',
            conditions: [
                { type: 'BaseDestroyed', playerId: 'player' }
            ],
            actions: [
                { type: 'LoseMission' }
            ],
            once: true
        }
    ]
};
