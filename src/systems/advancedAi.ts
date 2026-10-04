import type { Unit, Building, PlayerState, ResourceNode } from '../models/types';
import { Sequence, Selector, Parallel } from '../ai/behaviorTree';
import type { Blackboard } from '../ai/behaviorTree';
import {
    EnsureBuilding,
    PlacePendingBuildings,
    AssessThreats,
    BuildDynamicArmy,
    ExecuteCoordinatedAttack,
    ScoutAndExpand
} from '../ai/nodes/aiNodes';

// Create the AI Blackboard
const aiBlackboard: Blackboard = {
    gameTime: 0,
    units: {},
    buildings: {},
    resources: {},
    playerState: {} as PlayerState, // Temporary initialization
    pendingBuildings: [],
};

// Build the Behavior Tree
const buildOrderTree = new Sequence([
    new EnsureBuilding('powerPlant', 1),
    new EnsureBuilding('oreRefinery', 1),
    new EnsureBuilding('barracks', 1),
    new EnsureBuilding('powerPlant', 2),
    new EnsureBuilding('warFactory', 1),
]);

const baseManagementTree = new Parallel([
    buildOrderTree,
    new PlacePendingBuildings(),
]);

const armyManagementTree = new Sequence([
    new AssessThreats(),
    new BuildDynamicArmy(),
]);

const tacticalTree = new Selector([
    new ExecuteCoordinatedAttack(),
    new ScoutAndExpand(),
]);

// Main AI Root Node
const aiRootNode = new Sequence([
    baseManagementTree,
    armyManagementTree,
    tacticalTree,
]);

let lastAITick = 0;

export const updateAdvancedAI = (
    units: Record<string, Unit>,
    buildings: Record<string, Building>,
    resources: Record<string, ResourceNode>,
    players: Record<string, PlayerState>,
    gameTime: number
) => {
    // Run AI logic roughly every 1000ms
    if (gameTime - lastAITick < 1000) {
        return { units, buildings, players };
    }
    lastAITick = gameTime;

    const enemy = players['enemy'];
    if (!enemy) return { units, buildings, players };

    // Deep clone state to pass to blackboard and apply changes
    const newUnits = { ...units };
    const newBuildings = { ...buildings };
    const newPlayers = { ...players, enemy: { ...enemy } } as Record<string, PlayerState>;

    // Update Blackboard
    aiBlackboard.gameTime = gameTime;
    aiBlackboard.units = newUnits;
    aiBlackboard.buildings = newBuildings;
    aiBlackboard.resources = resources;
    aiBlackboard.playerState = newPlayers['enemy'];

    // Evaluate the Behavior Tree
    aiRootNode.evaluate(aiBlackboard);

    return {
        units: newUnits,
        buildings: newBuildings,
        players: newPlayers,
    };
};
