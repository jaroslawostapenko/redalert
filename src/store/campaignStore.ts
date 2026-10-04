import { create } from 'zustand';
import type { Objective } from '../campaign/types';

interface DialogueState {
    active: boolean;
    portrait: string;
    characterName: string;
    text: string;
    endTime: number;
}

interface CampaignState {
    missionId: string | null;
    missionStatus: 'playing' | 'won' | 'lost';
    objectives: Record<string, Objective>;
    firedTriggers: Set<string>;
    dialogue: DialogueState | null;
}

interface CampaignActions {
    initMission: (missionId: string, initialObjectives: Objective[]) => void;
    setMissionStatus: (status: 'playing' | 'won' | 'lost') => void;
    addObjective: (objective: Objective) => void;
    updateObjectiveStatus: (id: string, status: Objective['status']) => void;
    markTriggerFired: (triggerId: string) => void;
    showDialogue: (portrait: string, characterName: string, text: string, durationMs: number, currentTime: number) => void;
    updateDialogue: (currentTime: number) => void;
}

const initialState: CampaignState = {
    missionId: null,
    missionStatus: 'playing',
    objectives: {},
    firedTriggers: new Set(),
    dialogue: null,
};

export const useCampaignStore = create<CampaignState & CampaignActions>((set, get) => ({
    ...initialState,

    initMission: (missionId, initialObjectives) => {
        const objectivesMap: Record<string, Objective> = {};
        initialObjectives.forEach(obj => {
            objectivesMap[obj.id] = obj;
        });

        set({
            missionId,
            missionStatus: 'playing',
            objectives: objectivesMap,
            firedTriggers: new Set(),
            dialogue: null,
        });
    },

    setMissionStatus: (status) => {
        set({ missionStatus: status });
    },

    addObjective: (objective) => {
        set((state) => ({
            objectives: {
                ...state.objectives,
                [objective.id]: objective
            }
        }));
    },

    updateObjectiveStatus: (id, status) => {
        set((state) => {
            const obj = state.objectives[id];
            if (!obj) return state;
            return {
                objectives: {
                    ...state.objectives,
                    [id]: { ...obj, status }
                }
            };
        });
    },

    markTriggerFired: (triggerId) => {
        set((state) => {
            const newSet = new Set(state.firedTriggers);
            newSet.add(triggerId);
            return { firedTriggers: newSet };
        });
    },

    showDialogue: (portrait, characterName, text, durationMs, currentTime) => {
        set({
            dialogue: {
                active: true,
                portrait,
                characterName,
                text,
                endTime: currentTime + durationMs
            }
        });
    },

    updateDialogue: (currentTime) => {
        const { dialogue } = get();
        if (dialogue && dialogue.active && currentTime >= dialogue.endTime) {
            set({ dialogue: null });
        }
    }
}));
