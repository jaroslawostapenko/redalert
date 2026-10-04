# Architecture Documentation

This document provides a technical overview of the `my-rts` project, a Command & Conquer: Red Alert 1 remake. The game leverages React for rendering and UI, Zustand for state management, and a custom game loop to handle game logic simulation.

## High-Level Architecture

The architecture relies on the following key separations of concern:

1. **State (`src/store/gameStore.ts`)**: Holds the entire game state. The state is global and reactivity is managed by Zustand.
2. **Game Loop (`src/hooks/useGameLoop.ts`)**: Uses `requestAnimationFrame` to tick the game forward based on elapsed time (`deltaTime`).
3. **Systems (`src/systems/`)**: Pure functions or logic handlers that modify the state on each tick.
4. **Rendering (`src/components/`)**: React components that observe the Zustand store and render the visual representation of the state.

## State Management

We use [Zustand](https://github.com/pmndrs/zustand) for global state management. The main store is defined in `gameStore.ts`.

### State Structure
- `units`: A dictionary mapping unit IDs to `Unit` objects.
- `buildings`: A dictionary mapping building IDs to `Building` objects.
- `resources`: A dictionary mapping resource IDs to `ResourceNode` objects.
- `players`: Tracks player, enemy, and neutral factions' money, power, and state.
- `viewport`: Details for the camera position, scale, and window size.
- `selection`: An array of currently selected entity IDs.
- `gameTime`: Total elapsed in-game time.
- `buildQueue`: Manages items currently being constructed or recruited.

### Actions
State mutations should be handled via the actions defined in the `gameStore`. Example actions include:
- `commandUnits`: Issues a command (e.g. `move`, `attack`) to selected units.
- `queueBuild`: Deducts money and adds a unit or building to the build queue.
- `spawnUnit`, `spawnBuilding`, `spawnResource`: Instantiates new entities into the game world.

## The Game Loop

The core engine is driven by `useGameLoop`, a React hook that initializes a `requestAnimationFrame` loop.

On every frame, the loop calculates the `deltaTime` (time elapsed since the last frame) and executes the **Systems**. The state update is then flushed to Zustand, which inherently triggers React to re-render the appropriate components.

## Systems

Systems are where the business logic of the RTS resides. They process entities based on their components (properties) and current states.

### Movement & Pathfinding System (`src/systems/movement.ts`)
Iterates over all units whose state is `moving`. By utilizing an A* pathfinding algorithm (`src/utils/pathfinding.ts`), it computes optimal routes around buildings and obstacles, generating waypoints. It then applies the unit's `speed` and `deltaTime` to move the unit along the path.

### Combat & Projectiles System (`src/systems/combat.ts` & `src/systems/projectiles.ts`)
Iterates over all units and structures that have attack capabilities. It handles:
- Checking if targets are in `range`.
- Managing `attackCooldown` and `lastAttackTime`.
- Spawning `Projectile` entities when attacks are executed.
- The Projectiles system iterates over active projectiles, moving them towards their targets, applying `damage` on impact, and handling entity death.

### Fog of War System (`src/systems/fogOfWar.ts`)
Iterates through all player-owned units and buildings to calculate visibility based on their `vision` property. Updates a 2D grid overlay to track unexplored vs. visible tiles.

### Resource Harvesting System (`src/systems/harvesting.ts`)
Manages the state machine for Harvesters. Handles pathing to resource nodes, accumulating resources over time while decrementing the node's payload, pathing to a friendly Refinery, and depositing resources to increase player funds.

### AI Systems (`src/systems/aiDirector.ts` & `src/systems/aiTactics.ts`)
- **Director**: Runs periodically to manage the enemy faction's economy and base construction, following a structured build order.
- **Tactics**: Continuously trains military units and rallies them. Upon reaching a critical mass, it issues attack-move commands against player structures.

### Audio System (`src/systems/audioSystem.ts`)
A centralized manager that intercepts game events (selection, movement, construction completion) to play appropriate sound effects, complete with anti-spam cooldowns and user-configurable settings.

## Rendering and Components

Rendering is entirely handled via React. Since Zustand provides fine-grained subscriptions, only components that are actively tracking changing data will re-render.

### Viewport and Renderer
- **`Game.tsx`**: The root component which mounts the viewport and UI overlays, and initializes the game loop.
- **`Viewport.tsx`**: Handles zooming, panning, and mouse/keyboard interactions (box selection, commanding units, double-click matching, and control group assignments).
- **`Renderer.tsx`**: Iterates through state entities (units, buildings, resources, projectiles) and overlays (Fog of War, Placement Ghosts) rendering them as DOM elements positioned absolutely relative to the viewport.

### UI Overlay
- **`UIOverlay.tsx`**: Provides the heads-up display. It renders the `Minimap`, resource counters, build queues, and interactive placement modes.
- **`Minimap.tsx`**: A secondary renderer that scales down the map bounds to provide real-time radar capabilities and quick camera navigation.
- **`PlacementGhost.tsx`**: Renders a translucent, grid-snapped footprint during building placement to signify visual overlap/validity.

## Adding New Features

1. **New Unit or Building**: Add its stats to `src/constants/gameData.ts`. The UI and core game loop will automatically pick it up via the `spawnUnit` or `spawnBuilding` actions.
2. **New System**: Create a new file in `src/systems/`. Export an update function that takes `state` and `deltaTime`. Call this update function within the `updateTick` logic or the `useGameLoop` directly before setting the final state.
3. **New Entity Types**: Update the `EntityType` and respective interfaces in `src/models/types.ts` to ensure TypeScript support.

## Performance Considerations

- For large numbers of entities, consider optimizing rendering by using `<canvas>` for the `Renderer.tsx` rather than standard DOM elements.
- The systems currently use naive iteration (e.g., iterating through all units). If scale increases significantly, implementing a spatial partition system (like a QuadTree or Grid) for the Combat and Movement systems will improve performance.
