import { BehaviorNode, NodeState } from '../behaviorTree';
import type { Blackboard } from '../behaviorTree';
import type { Building, Unit, PlayerState, ResourceNode } from '../../models/types';
import { GAME_CONFIG, BUILDING_DATA, UNIT_DATA } from '../../constants/gameData';
import { distance } from '../../utils/math';
import { v4 as uuidv4 } from 'uuid';

// -- Actions --

// Generic action to ensure a minimum amount of a building type exists
export class EnsureBuilding extends BehaviorNode {
    private buildingType: keyof typeof BUILDING_DATA;
    private requiredCount: number;

    constructor(buildingType: keyof typeof BUILDING_DATA, requiredCount: number) {
        super();
        this.buildingType = buildingType;
        this.requiredCount = requiredCount;
    }

    public evaluate(blackboard: Blackboard): NodeState {
        const buildings = blackboard.buildings as Record<string, Building>;
        const playerState = blackboard.playerState as PlayerState;

        const myBuildings = Object.values(buildings).filter(b => b.owner === 'enemy' && b.buildingType === this.buildingType);
        const myPending = (blackboard.pendingBuildings || []).filter((p: {type: string, time: number}) => p.type === this.buildingType);

        if (myBuildings.length + myPending.length >= this.requiredCount) {
            return NodeState.SUCCESS;
        }

        const cost = BUILDING_DATA[this.buildingType].cost;
        if (playerState.money >= cost) {
            // Deduct money immediately for AI ease
            playerState.money -= cost;

            // Queue it up in blackboard pending builds
            if (!blackboard.pendingBuildings) blackboard.pendingBuildings = [];
            blackboard.pendingBuildings.push({
                type: this.buildingType,
                time: blackboard.gameTime + BUILDING_DATA[this.buildingType].buildTime
            });
            return NodeState.RUNNING; // It's building
        }

        return NodeState.FAILURE; // Can't afford
    }
}

// Action to place pending buildings
export class PlacePendingBuildings extends BehaviorNode {
    public evaluate(blackboard: Blackboard): NodeState {
        if (!blackboard.pendingBuildings || blackboard.pendingBuildings.length === 0) {
            return NodeState.SUCCESS;
        }

        const toKeep = [];

        for (const pending of blackboard.pendingBuildings) {
            if (blackboard.gameTime >= pending.time) {
                // Find spawn position
                const enemyBuildings = Object.values(blackboard.buildings as Record<string, Building>).filter(b => b.owner === 'enemy');
                const conYard = enemyBuildings.find(b => b.buildingType === 'constructionYard');
                const baseCenter = conYard ? conYard.position : { x: GAME_CONFIG.mapSize.width - 500, y: GAME_CONFIG.mapSize.height - 500 };

                // Random placement near base
                const offset = enemyBuildings.length * GAME_CONFIG.tileSize * 1.5;
                const spawnPos = {
                    x: baseCenter.x - offset + Math.random() * (offset * 2),
                    y: baseCenter.y - offset + Math.random() * (offset * 2)
                };

                const id = uuidv4();
                const data = BUILDING_DATA[pending.type as keyof typeof BUILDING_DATA];
                (blackboard.buildings as Record<string, Building>)[id] = {
                    id,
                    type: 'building',
                    buildingType: pending.type,
                    owner: 'enemy',
                    position: spawnPos,
                    health: data.health,
                    maxHealth: data.health,
                    selected: false,
                    name: data.name,
                    size: data.size,
                    powerGenerated: data.powerGenerated,
                    powerConsumed: data.powerConsumed,
                    state: 'active',
                    buildProgress: 1,
                    // @ts-ignore
                    damage: data.damage,
                    // @ts-ignore
                    range: data.range,
                    // @ts-ignore
                    attackCooldown: data.attackCooldown,
                    lastAttackTime: 0
                };

                blackboard.playerState.power += data.powerConsumed;
                blackboard.playerState.maxPower += data.powerGenerated;
            } else {
                toKeep.push(pending);
            }
        }

        blackboard.pendingBuildings = toKeep;

        // If we still have pending buildings, we're RUNNING, otherwise SUCCESS (if none left)
        return toKeep.length > 0 ? NodeState.RUNNING : NodeState.SUCCESS;
    }
}

export class EnsureUnit extends BehaviorNode {
    private unitType: keyof typeof UNIT_DATA;
    private requiredCount: number;

    constructor(unitType: keyof typeof UNIT_DATA, requiredCount: number) {
        super();
        this.unitType = unitType;
        this.requiredCount = requiredCount;
    }

    public evaluate(blackboard: Blackboard): NodeState {
        const units = blackboard.units as Record<string, Unit>;
        const playerState = blackboard.playerState as PlayerState;

        const myUnits = Object.values(units).filter(u => u.owner === 'enemy' && u.unitType === this.unitType);

        if (myUnits.length >= this.requiredCount) {
            return NodeState.SUCCESS;
        }

        const cost = UNIT_DATA[this.unitType].cost;
        if (playerState.money >= cost) {
            // Find appropriate factory
            let spawnFactory: Building | undefined;
            const myBuildings = Object.values(blackboard.buildings as Record<string, Building>).filter(b => b.owner === 'enemy');

            if (this.unitType === 'rifleman' || this.unitType === 'engineer') {
                spawnFactory = myBuildings.find(b => b.buildingType === 'barracks');
            } else {
                spawnFactory = myBuildings.find(b => b.buildingType === 'warFactory');
            }

            if (spawnFactory) {
                 playerState.money -= cost;
                 // Spawn immediately for MVP
                 const spawnPos = {
                    x: spawnFactory.position.x + (spawnFactory.size.width * GAME_CONFIG.tileSize) / 2 + (Math.random() * 50 - 25),
                    y: spawnFactory.position.y + (spawnFactory.size.height * GAME_CONFIG.tileSize) + 20
                 };

                 const id = uuidv4();
                 const data = UNIT_DATA[this.unitType];
                 (blackboard.units as Record<string, Unit>)[id] = {
                    id,
                    type: 'unit',
                    unitType: this.unitType,
                    owner: 'enemy',
                    position: spawnPos,
                    health: data.health,
                    maxHealth: data.health,
                    selected: false,
                    name: data.name,
                    speed: data.speed,
                    // @ts-ignore
                    damage: data.damage,
                    // @ts-ignore
                    range: data.range,
                    // @ts-ignore
                    attackCooldown: data.attackCooldown,
                    lastAttackTime: 0,
                    state: 'idle',
                    rotation: 0,
                 };
                 return NodeState.SUCCESS; // spawned!
            }
            return NodeState.FAILURE; // No factory
        }

        return NodeState.FAILURE; // Can't afford
    }
}

// Assess Threat
export class AssessThreats extends BehaviorNode {
    public evaluate(blackboard: Blackboard): NodeState {
        // AI uses 'fog of war' vision or just simple distance based scanning
        // For MVP, AI will scan all player units and calculate a threat level
        const units = blackboard.units as Record<string, Unit>;
        const playerUnits = Object.values(units).filter(u => u.owner === 'player');

        let tankCount = 0;
        let infantryCount = 0;

        for (const u of playerUnits) {
            if (u.unitType === 'tank') tankCount++;
            if (u.unitType === 'rifleman') infantryCount++;
        }

        blackboard.threatState = {
            tanks: tankCount,
            infantry: infantryCount,
            totalThreatLevel: tankCount * 3 + infantryCount,
            prioritizeAntiArmor: tankCount > infantryCount
        };

        return NodeState.SUCCESS;
    }
}

// Dynamic Army Builder based on Threat
export class BuildDynamicArmy extends BehaviorNode {
    public evaluate(blackboard: Blackboard): NodeState {
        const threat = blackboard.threatState;
        if (!threat) return NodeState.FAILURE;

        let targetTanks = 2; // Baseline
        let targetInfantry = 5;

        // If high threat, scale army target
        if (threat.totalThreatLevel > 5) {
            if (threat.prioritizeAntiArmor) {
                targetTanks = Math.max(targetTanks, threat.tanks + 2);
            } else {
                targetInfantry = Math.max(targetInfantry, threat.infantry + 5);
                targetTanks = Math.max(targetTanks, 1);
            }
        }

        // Try to build to targets
        const infantryNode = new EnsureUnit('rifleman', targetInfantry);
        const tankNode = new EnsureUnit('tank', targetTanks);

        infantryNode.evaluate(blackboard);
        tankNode.evaluate(blackboard);

        return NodeState.SUCCESS; // It's fine if it fails to build due to funds, we evaluated it.
    }
}


// Attack Priority
export class ExecuteCoordinatedAttack extends BehaviorNode {
    public evaluate(blackboard: Blackboard): NodeState {
        const units = blackboard.units as Record<string, Unit>;
        const buildings = blackboard.buildings as Record<string, Building>;

        const myMilitary = Object.values(units).filter(u => u.owner === 'enemy' && (u.unitType === 'rifleman' || u.unitType === 'tank'));
        const idleMilitary = myMilitary.filter(u => u.state === 'idle' || !u.targetId); // include moving if they don't have a specific target

        // If we have enough forces, attack
        // Using arbitrary group size for now
        if (myMilitary.length >= 10 && idleMilitary.length >= 5) {
             const playerBuildings = Object.values(buildings).filter(b => b.owner === 'player');
             const playerUnits = Object.values(units).filter(u => u.owner === 'player');

             // Priority: Power Plants, then ConYard, then Units
             let target = playerBuildings.find(b => b.buildingType === 'powerPlant') ||
                          playerBuildings.find(b => b.buildingType === 'constructionYard') ||
                          playerBuildings[0] ||
                          playerUnits[0];

             if (target) {
                 idleMilitary.forEach(u => {
                     (blackboard.units as Record<string, Unit>)[u.id] = {
                         ...u,
                         state: 'moving',
                         targetPosition: { x: target.position.x, y: target.position.y },
                     };
                 });
                 return NodeState.SUCCESS;
             }
        } else if (idleMilitary.length > 0) {
            // Rally point near War Factory or Barracks
            const enemyBuildings = Object.values(buildings).filter(b => b.owner === 'enemy');
            const rallyPoint = enemyBuildings.find(b => b.buildingType === 'warFactory') || enemyBuildings.find(b => b.buildingType === 'barracks');

            if (rallyPoint) {
                const rallyPos = {
                    x: rallyPoint.position.x,
                    y: rallyPoint.position.y + 150
                };

                idleMilitary.forEach(u => {
                    if (distance(u.position, rallyPos) > 150) {
                        const offset = {
                            x: rallyPos.x + (Math.random() * 100 - 50),
                            y: rallyPos.y + (Math.random() * 100 - 50)
                        };
                         (blackboard.units as Record<string, Unit>)[u.id] = {
                             ...u,
                             state: 'moving',
                             targetPosition: offset
                         };
                    }
                });
            }
            return NodeState.RUNNING;
        }

        return NodeState.FAILURE;
    }
}

// Scouting Expansion
export class ScoutAndExpand extends BehaviorNode {
    public evaluate(blackboard: Blackboard): NodeState {
        // Find if we need a new refinery
        const resources = blackboard.resources as Record<string, ResourceNode>;
        const buildings = blackboard.buildings as Record<string, Building>;
        const playerState = blackboard.playerState as PlayerState;

        const myRefineries = Object.values(buildings).filter(b => b.owner === 'enemy' && b.buildingType === 'oreRefinery');

        // Very basic logic: if we have 1 refinery and a lot of money, build another near an ore patch
        if (myRefineries.length > 0 && myRefineries.length < 3 && playerState.money > 3000) {
             const cost = BUILDING_DATA['oreRefinery'].cost;
             if (playerState.money >= cost) {
                 // find an ore patch far from existing refineries
                 let targetOre: ResourceNode | null = null;

                 for (const ore of Object.values(resources)) {
                     let tooClose = false;
                     for (const ref of myRefineries) {
                         if (distance(ore.position, ref.position) < 500) {
                             tooClose = true;
                             break;
                         }
                     }
                     if (!tooClose) {
                         targetOre = ore;
                         break;
                     }
                 }

                 if (targetOre) {
                      playerState.money -= cost;
                      const id = uuidv4();
                      const data = BUILDING_DATA['oreRefinery'];
                      (blackboard.buildings as Record<string, Building>)[id] = {
                          id,
                          type: 'building',
                          buildingType: 'oreRefinery',
                          owner: 'enemy',
                          position: { x: targetOre.position.x - 100, y: targetOre.position.y },
                          health: data.health,
                          maxHealth: data.health,
                          selected: false,
                          name: data.name,
                          size: data.size,
                          powerGenerated: data.powerGenerated,
                          powerConsumed: data.powerConsumed,
                          state: 'active',
                          buildProgress: 1,
                      };
                      return NodeState.SUCCESS;
                 }
             }
        }

        return NodeState.FAILURE;
    }
}
