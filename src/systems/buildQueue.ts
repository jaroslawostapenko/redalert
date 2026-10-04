import type { BuildQueueItem, PlayerState, Building, Vector2 } from '../models/types';

export function updateBuildQueue(
    buildQueue: BuildQueueItem[],
    players: Record<string, PlayerState>,
    buildings: Record<string, Building>,
    dt: number
): { nextBuildQueue: BuildQueueItem[], completedUnits: { name: string, owner: string, position: Vector2 }[] } {

    // We update each item in the build queue
    // We only update items that are 'queued' or 'building', but actually they should become 'building' immediately if there's no other item of the same type?
    // Usually C&C builds one item of a type at a time (e.g. one infantry, one vehicle, one structure). We can just process all of them simultaneously for simplicity, or we can limit it.
    // Let's allow parallel building for now or just process the first one of each category.
    // To make it simple, we process the first item in the queue for each itemType.

    const newQueue = [...buildQueue];
    const player = players['player'];
    const completedUnits: { name: string, owner: string, position: Vector2 }[] = [];

    // Calculate if low power
    const isLowPower = player.power > player.maxPower;
    const timeMultiplier = isLowPower ? 0.5 : 1.0; // 2x slower if low power

    // Find the first building and first unit in the queue to process
    let buildingIndex = newQueue.findIndex(q => q.itemType === 'building' && q.status !== 'ready_to_place');
    let unitIndex = newQueue.findIndex(q => q.itemType === 'unit' && q.status !== 'ready_to_place');

    if (buildingIndex !== -1) {
        let item = { ...newQueue[buildingIndex] };
        if (item.status === 'queued') item.status = 'building';

        item.progress += (dt / item.buildTime) * timeMultiplier;
        if (item.progress >= 1) {
            item.progress = 1;
            item.status = 'ready_to_place';
        }
        newQueue[buildingIndex] = item;
    }

    if (unitIndex !== -1) {
        let item = { ...newQueue[unitIndex] };
        if (item.status === 'queued') item.status = 'building';

        item.progress += (dt / item.buildTime) * timeMultiplier;
        if (item.progress >= 1) {
            // Unit is finished! We need to spawn it and remove from queue
            // Find a valid production structure
            let productionBuildingType = item.name === 'rifleman' || item.name === 'engineer' ? 'barracks' : 'warFactory';
            let prodBuilding = Object.values(buildings).find(b => b.owner === item.owner && b.buildingType === productionBuildingType && b.state === 'active');

            if (prodBuilding) {
                // Spawn the unit right next to the building
                const spawnPos = { x: prodBuilding.position.x, y: prodBuilding.position.y + (prodBuilding.size.height * 32) + 16 };
                completedUnits.push({ name: item.name, owner: item.owner, position: spawnPos });

                // Remove from queue
                newQueue.splice(unitIndex, 1);
            } else {
                // Production building destroyed while building? Progress is saved or cancelled?
                // For simplicity, do nothing, it waits.
                newQueue[unitIndex] = item;
            }
        } else {
            newQueue[unitIndex] = item;
        }
    }

    return { nextBuildQueue: newQueue, completedUnits };
}
