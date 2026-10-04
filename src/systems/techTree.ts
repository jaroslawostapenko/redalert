import type { Building } from '../models/types';

export const TECH_TREE = {
  buildings: {
    powerPlant: ['constructionYard'],
    barracks: ['constructionYard', 'powerPlant'],
    oreRefinery: ['constructionYard', 'powerPlant'],
    warFactory: ['constructionYard', 'oreRefinery'],
    pillbox: ['constructionYard', 'barracks'],
    // constructionYard has no prerequisites
  },
  units: {
    rifleman: ['barracks'],
    engineer: ['barracks'],
    tank: ['warFactory'],
    harvester: ['warFactory'],
  }
};

export function canBuild(itemType: 'unit' | 'building', itemName: string, playerBuildings: Record<string, Building>): boolean {
  if (itemType === 'building' && itemName === 'constructionYard') {
      return true; // We can always build construction yards if we wanted to
  }

  const reqs = itemType === 'building' ? (TECH_TREE.buildings as any)[itemName] : (TECH_TREE.units as any)[itemName];
  if (!reqs || reqs.length === 0) return true;

  const playerBuildingTypes = new Set(Object.values(playerBuildings).filter(b => b.state === 'active').map(b => b.buildingType));

  for (const req of reqs) {
    if (!playerBuildingTypes.has(req)) {
      return false;
    }
  }

  return true;
}
