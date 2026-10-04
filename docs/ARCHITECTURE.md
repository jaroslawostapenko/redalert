# Architecture Documentation

This document provides a technical overview of the `my-rts` project. The game leverages React for rendering and UI, Zustand for state management, and a custom game loop to handle game logic simulation.

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

### Movement System (`src/systems/movement.ts`)
Iterates over all units whose state is `moving`. It calculates the direction vector toward their `targetPosition`, applies the unit's `speed` and `deltaTime`, and updates the unit's `position` and `rotation`.

### Combat System (`src/systems/combat.ts`)
Iterates over all units and structures that have attack capabilities. It handles:
- Checking if targets are in `range`.
- Managing `attackCooldown` and `lastAttackTime`.
- Applying `damage` to the target's `health`.
- Handling entity death (removing them from state, resetting target references).

*Note: Harvesting logic is also generally handled alongside systems, updating resources and player money over time.*

## Rendering and Components

Rendering is entirely handled via React. Since Zustand provides fine-grained subscriptions, only components that are actively tracking changing data will re-render.

### Viewport and Renderer
- **`Game.tsx`**: The root component which mounts the viewport and UI overlays, and initializes the game loop.
- **`Viewport.tsx`**: Handles zooming, panning, and mouse interactions (box selection, right-clicking to command units).
- **`Renderer.tsx`**: Iterates through state entities (units, buildings, resources) and renders them as DOM elements positioned absolutely relative to the viewport.

### UI Overlay
- **`UIOverlay.tsx`**: Provides the heads-up display. It renders the minimap, resource counters, build menus, and current selection information.

## Adding New Features

1. **New Unit or Building**: Add its stats to `src/constants/gameData.ts`. The UI and core game loop will automatically pick it up via the `spawnUnit` or `spawnBuilding` actions.
2. **New System**: Create a new file in `src/systems/`. Export an update function that takes `state` and `deltaTime`. Call this update function within the `updateTick` logic or the `useGameLoop` directly before setting the final state.
3. **New Entity Types**: Update the `EntityType` and respective interfaces in `src/models/types.ts` to ensure TypeScript support.

## Performance Considerations

- For large numbers of entities, consider optimizing rendering by using `<canvas>` for the `Renderer.tsx` rather than standard DOM elements.
- The systems currently use naive iteration (e.g., iterating through all units). If scale increases significantly, implementing a spatial partition system (like a QuadTree or Grid) for the Combat and Movement systems will improve performance.
