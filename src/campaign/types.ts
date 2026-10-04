import type { Vector2, PlayerId } from '../models/types';
import { BUILDING_DATA, UNIT_DATA } from '../constants/gameData';

export type ConditionType = 'TimeElapsed' | 'UnitEntersRegion' | 'BaseDestroyed' | 'ObjectiveCompleted' | 'EntityDestroyed';

export interface BaseCondition {
    type: ConditionType;
}

export interface TimeElapsedCondition extends BaseCondition {
    type: 'TimeElapsed';
    timeMs: number; // Time since mission start in ms
}

export interface UnitEntersRegionCondition extends BaseCondition {
    type: 'UnitEntersRegion';
    region: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    playerId?: PlayerId;
}

export interface BaseDestroyedCondition extends BaseCondition {
    type: 'BaseDestroyed';
    playerId: PlayerId;
}

export interface ObjectiveCompletedCondition extends BaseCondition {
    type: 'ObjectiveCompleted';
    objectiveId: string;
}

export interface EntityDestroyedCondition extends BaseCondition {
    type: 'EntityDestroyed';
    entityId: string;
}

export type Condition =
    | TimeElapsedCondition
    | UnitEntersRegionCondition
    | BaseDestroyedCondition
    | ObjectiveCompletedCondition
    | EntityDestroyedCondition;

export type ActionType = 'SpawnReinforcements' | 'PlayAudio' | 'ShowDialogue' | 'WinMission' | 'LoseMission' | 'SetObjectiveStatus' | 'AddObjective' | 'PanCamera' | 'SpawnBuilding';

export interface BaseAction {
    type: ActionType;
}

export interface SpawnReinforcementsAction extends BaseAction {
    type: 'SpawnReinforcements';
    unitType: keyof typeof UNIT_DATA;
    count: number;
    position: Vector2;
    playerId: PlayerId;
}

export interface SpawnBuildingAction extends BaseAction {
    type: 'SpawnBuilding';
    buildingType: keyof typeof BUILDING_DATA;
    position: Vector2;
    playerId: PlayerId;
    id?: string;
}

export interface PlayAudioAction extends BaseAction {
    type: 'PlayAudio';
    audioId: string;
}

export interface ShowDialogueAction extends BaseAction {
    type: 'ShowDialogue';
    portrait: string; // URL or identifier for character portrait
    characterName: string;
    text: string;
    durationMs: number;
}

export interface WinMissionAction extends BaseAction {
    type: 'WinMission';
}

export interface LoseMissionAction extends BaseAction {
    type: 'LoseMission';
}

export interface SetObjectiveStatusAction extends BaseAction {
    type: 'SetObjectiveStatus';
    objectiveId: string;
    status: 'active' | 'completed' | 'failed';
}

export interface AddObjectiveAction extends BaseAction {
    type: 'AddObjective';
    objectiveId: string;
    description: string;
}

export interface PanCameraAction extends BaseAction {
    type: 'PanCamera';
    position: Vector2;
}

export type Action =
    | SpawnReinforcementsAction
    | SpawnBuildingAction
    | PlayAudioAction
    | ShowDialogueAction
    | WinMissionAction
    | LoseMissionAction
    | SetObjectiveStatusAction
    | AddObjectiveAction
    | PanCameraAction;

export interface Trigger {
    id: string;
    conditions: Condition[];
    actions: Action[];
    once?: boolean; // If true, trigger only fires once
}

export interface Objective {
    id: string;
    description: string;
    status: 'hidden' | 'active' | 'completed' | 'failed';
}

export interface MissionData {
    id: string;
    name: string;
    description: string;
    initialObjectives: Objective[];
    triggers: Trigger[];
    startingUnits: {
        type: keyof typeof UNIT_DATA;
        position: Vector2;
        playerId: PlayerId;
        id?: string;
    }[];
    startingBuildings: {
        type: keyof typeof BUILDING_DATA;
        position: Vector2;
        playerId: PlayerId;
        id?: string;
    }[];
    startingResources: {
        type: 'ore' | 'gems';
        position: Vector2;
        amount: number;
    }[];
    startingMoney: Record<PlayerId, number>;
}
