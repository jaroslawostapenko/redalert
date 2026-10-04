# AI Agent Distribution Plan

This document outlines 10 distinct tasks designed for 10 separate AI agents to work on in parallel or sequentially. Together, these tasks will add approximately 1000 lines of robust, well-architected code to the `my-rts` Command & Conquer: Red Alert 1 remake.

Each agent should refer to `docs/ARCHITECTURE.md` before starting their task to understand the Zustand store, React components, and pure function systems.

---

## Agent 1: Minimap UI Implementation
**Goal**: Create a fully functional minimap in the UI that displays the map boundaries, units, and allows for viewport navigation.
**Files to Modify/Create**:
- `src/components/ui/Minimap.tsx` (New)
- `src/components/ui/UIOverlay.tsx` (Update to include Minimap)
**Instructions**:
1. Create a `Minimap` component that reads `units`, `buildings`, and `viewport` from `useGameStore`.
2. Render a scaled-down version of the `GAME_CONFIG.mapSize` using a `<canvas>` or small absolute `<div>`s.
3. Draw player units/buildings as green dots, enemies as red dots, and resources as yellow dots.
4. Draw a white rectangle representing the current `viewport`.
5. Add an `onClick` or `onMouseDown` handler to the minimap that calls `setViewport` in the store to instantly pan the camera to the clicked location.

---

## Agent 2: Fog of War System
**Goal**: Implement a basic Fog of War (FoW) system so players can only see areas around their units/buildings.
**Files to Modify/Create**:
- `src/models/types.ts` (Update `GameStateData`)
- `src/store/gameStore.ts` (Add FoW state)
- `src/systems/fogOfWar.ts` (New system)
- `src/components/game/Renderer.tsx` (Update rendering)
**Instructions**:
1. Add a 2D grid structure to `gameStore.ts` to represent explored vs. visible tiles.
2. Create `src/systems/fogOfWar.ts` to iterate through all player-owned units and buildings. Using their `vision` property (from `GAME_CONFIG`), calculate which grid tiles are currently visible.
3. Hook `fogOfWar.ts` into the `updateTick` logic.
4. In `Renderer.tsx`, render a black/semi-transparent overlay over tiles that are unexplored or previously explored but not currently visible.

---

## Agent 3: A* Pathfinding Implementation
**Goal**: Replace the current direct-line movement with intelligent A* pathfinding that navigates around buildings.
**Files to Modify/Create**:
- `src/utils/pathfinding.ts` (New utility)
- `src/systems/movement.ts` (Update existing system)
**Instructions**:
1. In `pathfinding.ts`, implement the A* algorithm. The grid should treat any tile occupied by a `building` as impassable terrain.
2. In `movement.ts`, when a unit receives a new `targetPosition`, calculate the path using A* and store the waypoints on the unit object.
3. Update the movement logic to move towards the next waypoint in the list rather than the final destination directly.

---

## Agent 4: Resource Harvesting System Enhancements
**Goal**: Implement the full state machine for Harvesters (Ore Trucks).
**Files to Modify/Create**:
- `src/systems/harvesting.ts` (New system)
- `src/store/gameStore.ts` (Update updateTick)
**Instructions**:
1. Create `src/systems/harvesting.ts`.
2. Logic: If a Harvester is assigned to a ResourceNode, it should move to the node. Once close, it stops and increments its `carryingResource` over time while decrementing the node's `amount`.
3. Once full (`carryingResource >= maxCarry`), it must find the nearest friendly Ore Refinery and move to it.
4. Upon reaching the Refinery, it deposits the ore (increasing player `money`), and automatically paths back to the last known resource node.

---

## Agent 5: Building Placement Mechanics
**Goal**: Allow players to place buildings on the map after construction finishes, rather than spawning them instantly.
**Files to Modify/Create**:
- `src/store/gameStore.ts` (Update build queue logic)
- `src/components/game/Viewport.tsx` (Handle placement clicks)
- `src/components/ui/PlacementGhost.tsx` (New component)
**Instructions**:
1. When a building finishes in the `buildQueue`, change its state to "ready_to_place".
2. Allow the user to click on the ready item in the UI, which activates a "placement mode" in the `gameStore`.
3. In `PlacementGhost.tsx`, render a translucent footprint of the building attached to the mouse cursor. Turn it red if the location overlaps with existing entities.
4. On left-click in `Viewport.tsx`, if the location is valid, remove the item from the queue and call `spawnBuilding` at that coordinate.

---

## Agent 6: Projectile & Visual Effects System
**Goal**: Add visual projectiles (e.g., tank shells) instead of applying instant damage.
**Files to Modify/Create**:
- `src/models/types.ts` (Add Projectile interface)
- `src/store/gameStore.ts` (Add projectiles array)
- `src/systems/combat.ts` (Update attacking logic)
- `src/systems/projectiles.ts` (New system)
- `src/components/game/Renderer.tsx` (Render projectiles)
**Instructions**:
1. Define a `Projectile` with position, target, speed, and damage.
2. In `combat.ts`, when a tank attacks, spawn a projectile instead of immediately deducting health.
3. Create `projectiles.ts` to move projectiles toward their targets each tick. On impact, apply damage and remove the projectile.
4. Update `Renderer.tsx` to draw the active projectiles on the screen.

---

## Agent 7: Basic Enemy AI - Base Building
**Goal**: Create an AI director that manages the enemy's economy and base construction.
**Files to Modify/Create**:
- `src/systems/aiDirector.ts` (New system)
- `src/store/gameStore.ts` (Update loop)
**Instructions**:
1. Create `aiDirector.ts` which runs every ~1 second (not every tick).
2. If the enemy faction has money but lacks a Power Plant, it should queue and place a Power Plant near its Construction Yard.
3. It should then build an Ore Refinery, Barracks, and War Factory in a structured build order.
4. It should maintain at least 1-2 Harvesters to keep the economy going.
5. Hook this system into the `gameStore` tick.

---

## Agent 8: Basic Enemy AI - Combat & Tactics
**Goal**: Extend the AI to build military units and attack the player.
**Files to Modify/Create**:
- `src/systems/aiTactics.ts` (New system)
**Instructions**:
1. Create `aiTactics.ts`.
2. Once the enemy base has a Barracks/War Factory, the AI should continuously queue Riflemen and Tanks using its available money.
3. Group these newly spawned units near the War Factory (Rally Point).
4. When the idle military group exceeds 10 units, issue an attack-move command towards the player's Construction Yard or nearest known player structure.

---

## Agent 9: Advanced Unit Selection & Control Groups
**Goal**: Add classic RTS selection mechanics (double-click, control groups).
**Files to Modify/Create**:
- `src/store/gameStore.ts` (Add controlGroups state)
- `src/components/game/Viewport.tsx` (Update mouse/keyboard handlers)
**Instructions**:
1. Add `controlGroups: Record<number, string[]>` to the store.
2. In `Viewport.tsx`, listen for `Ctrl + [1-9]` to assign currently selected unit IDs to a control group.
3. Listen for just `[1-9]` keys to retrieve and select the units in that control group.
4. Implement a double-click handler on units: when triggered, select all units of the exact same type (e.g., all Riflemen) currently visible in the viewport.

---

## Agent 10: Audio System Integration
**Goal**: Add sound effects for user feedback and immersion.
**Files to Modify/Create**:
- `src/systems/audioSystem.ts` (New system)
- `src/hooks/useAudio.ts` (New hook)
- `src/store/gameStore.ts` (Add audio preferences)
**Instructions**:
1. Create a centralized audio manager that loads sound files (use placeholder URLs or dummy functions).
2. Hook into `gameStore` actions or React components to play sounds when:
   - A unit is selected (e.g., "Acknowledged").
   - A movement command is issued (e.g., "Moving out").
   - A building completes construction (e.g., "Building Complete").
3. Ensure sounds don't overlap too aggressively (e.g., limit unit selection spam).
4. Add basic volume and mute toggles to the game state.
