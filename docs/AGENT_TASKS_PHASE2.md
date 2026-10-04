# AI Agent Phase 2 Expansion Plan

This document outlines 10 massive new tasks (Agents 11-20) designed to scale the `my-rts` project from a prototype into a full-fledged engine. Each task is complex and involves implementing substantial new subsystems, data structures, UI panels, and integrations, expected to average around 1,000 lines of code per agent, culminating in a +10,000 LOC expansion.

Agents must maintain the separation of concerns: Zustand for State, pure function logic in `systems/`, and React for Rendering.

---

## Agent 11: Multiplayer Networking Core (WebSockets)
**Goal**: Implement a client-server architecture to support multiplayer matches with deterministic lockstep simulation.
**Files to Modify/Create**:
- `src/network/socketClient.ts` (New: WebSocket connection manager)
- `src/network/commandBuffer.ts` (New: Handles syncing command frames)
- `src/store/gameStore.ts` (Update: Hook store into network events)
- `server/index.ts` (New: Basic Node.js WebSocket relay server)
**Scope** (~1000 LOC):
- Build a lightweight Node/Express/WS server in a new `/server` directory that relays commands between connected clients.
- Implement a lockstep architecture on the frontend: user actions (e.g., "Move Unit", "Build") are sent to the server, given a frame number, and broadcasted to all clients.
- Ensure the game loop in `useGameLoop.ts` halts and waits if network frames are delayed, ensuring deterministic simulation across clients.
- Add basic Lobby UI components to host, join, and select factions.

---

## Agent 12: Campaign Engine & Scripting System
**Goal**: Create a data-driven campaign system with scripted events, triggers, and dialogue boxes.
**Files to Modify/Create**:
- `src/campaign/campaignEngine.ts` (New: Evaluates triggers/conditions)
- `src/campaign/missions/mission1.ts` (New: JSON/Object defining first level)
- `src/components/ui/DialogueBox.tsx` (New: UI for transmission text)
- `src/store/campaignStore.ts` (New: Zustand store for mission state)
**Scope** (~1000 LOC):
- Define a schema for Missions (objectives, starting units, map data, triggers).
- Implement a trigger engine that runs every tick, evaluating conditions (e.g., `UnitEntersRegion`, `BaseDestroyed`, `TimeElapsed`).
- Execute actions on triggers (e.g., `SpawnReinforcements`, `PlayAudio`, `ShowDialogue`, `WinMission`).
- Create a complex UI overlay for in-game cutscenes and objective tracking, mimicking classic C&C briefings.

---

## Agent 13: In-Browser Map Editor
**Goal**: Build a fully featured map editor accessible from the main menu to paint terrain and place starting units.
**Files to Modify/Create**:
- `src/editor/EditorViewport.tsx` (New: Map rendering canvas with paint tools)
- `src/editor/EditorToolbar.tsx` (New: Tile, Unit, and Building selection UI)
- `src/store/editorStore.ts` (New: Manages editor state separate from game state)
- `src/utils/mapExport.ts` (New: Serializes map data to JSON)
**Scope** (~1200 LOC):
- Implement terrain painting mechanics (brush sizes, tile types, auto-tiling logic for shores/cliffs).
- Allow placement, rotation, and team assignment of units and structures.
- Create an intuitive React-based UI with tabs for Terrain, Entities, Waypoints, and Map Settings.
- Implement Save/Load functionality using `localStorage` and JSON export/import.

---

## Agent 14: Flow Field Pathfinding & Formation Movement
**Goal**: Upgrade the movement system from individual A* paths to vector-based Flow Fields to support massive unit counts seamlessly moving in formation.
**Files to Modify/Create**:
- `src/systems/flowField.ts` (New: Generates cost fields and vector fields)
- `src/systems/movement.ts` (Refactor: Hook into flow fields)
- `src/utils/formation.ts` (New: Handles unit grouping and offsets)
**Scope** (~1100 LOC):
- Implement an algorithm to generate a Cost Field based on static obstacles.
- Implement an Integration Field algorithm that floods out from the target destination.
- Implement a Vector Field algorithm that points units towards the lowest cost neighbor.
- Update unit logic to read their velocity from the Vector Field, adding local avoidance (Boids separation) so units don't overlap.
- Implement rigid body formations when multiple units are selected.

---

## Agent 15: Particle Physics & Visual Effects Engine
**Goal**: Introduce a robust particle system for explosions, smoke, muzzle flashes, and debris.
**Files to Modify/Create**:
- `src/systems/particles.ts` (New: Handles particle physics simulation)
- `src/components/game/ParticleRenderer.tsx` (New: Optimized canvas rendering)
- `src/constants/vfxData.ts` (New: Definitions for different particle emitters)
**Scope** (~1000 LOC):
- Build a lightweight WebGL or highly optimized Canvas 2D particle engine.
- Define emitter types (e.g., Burst, Cone, Continuous) with properties like velocity, gravity, fade, color over lifetime, and size over lifetime.
- Hook emitters into game events (e.g., building destruction spawns a massive debris cloud; tank firing spawns a muzzle flash and smoke puff).
- Ensure the system can handle 10,000+ particles simultaneously without dipping below 30FPS.

---

## Agent 16: Complete UI/UX Overhaul & Tech Trees
**Goal**: Build a complex, faithful recreation of the Red Alert sidebar UI, complete with animated build queues, tech tree dependencies, and power management visuals.
**Files to Modify/Create**:
- `src/components/ui/Sidebar.tsx` (New: Complete redesign of UIOverlay)
- `src/components/ui/BuildButton.tsx` (New: Handles radar sweeps and animations)
- `src/systems/techTree.ts` (New: Manages unlocks based on structures)
**Scope** (~1200 LOC):
- Implement a tabbed sidebar (Structures, Defense, Infantry, Vehicles).
- Create a `techTree.ts` validator that checks if a player has the prerequisite structures before unlocking build buttons (e.g., require Radar Dome for Helipad).
- Implement animated radial progress bars for items in the build queue.
- Implement "Low Power" state UI warnings and increase build times dramatically when power is negative.
- Add tooltips with detailed stats for all units and buildings.

---

## Agent 17: Save/Load System and Replay Data
**Goal**: Allow saving the current state of a match to disk and recording replays of entire matches.
**Files to Modify/Create**:
- `src/utils/saveManager.ts` (New: Serializes and deserializes Zustand state)
- `src/utils/replayRecorder.ts` (New: Records inputs over time)
- `src/components/ui/LoadMenu.tsx` (New)
**Scope** (~900 LOC):
- Implement robust serialization to take the entire `gameStore` state (Entities, Map, Resources, Projectiles) and stringify it, stripping out circular references or class instances.
- Implement a Replay system that piggybacks off Agent 11's Command Buffer, saving the initial random seed and every user command frame-by-frame.
- Build a Replay Viewer UI that allows users to playback a match, adjust speed, and freely move the camera.

---

## Agent 18: Advanced Enemy AI - Strategic Decision Making
**Goal**: Upgrade the simple AI tactics to a multi-threaded, goal-oriented action planning (GOAP) or behavior tree system.
**Files to Modify/Create**:
- `src/ai/behaviorTree.ts` (New: Core behavior tree implementation)
- `src/ai/nodes/*.ts` (New: Various condition and action nodes)
- `src/systems/advancedAi.ts` (Refactor: Replaces old AI systems)
**Scope** (~1300 LOC):
- Implement a Behavior Tree architecture (Selectors, Sequences, Decorators).
- Create Nodes for scouting, resource expansion (building new refineries near distant ore), and targeted attacks (prioritizing player power plants).
- Implement dynamic threat assessment: the AI should scan the map for player forces and build counter-units (e.g., if player builds tanks, AI builds anti-tank infantry).
- Ensure the AI can manage multiple bases and harvesters simultaneously without cheating (must rely on Fog of War vision).

---

## Agent 19: Dynamic Terrain, Water, and Naval Combat
**Goal**: Introduce water tiles, bridges, and naval units to the game.
**Files to Modify/Create**:
- `src/components/game/TerrainRenderer.tsx` (New: Handles animated water/bridges)
- `src/systems/movement.ts` (Update: Support amphibious and naval pathing)
- `src/constants/navalData.ts` (New: Submarines, Destroyers, Transports)
**Scope** (~1100 LOC):
- Update the Map definition to support terrain heights and tile types (Land, Water, Coast, Bridge).
- Implement animated shader-like effects for water tiles using a secondary canvas layer.
- Add destructible bridges that can be repaired by Engineers.
- Add naval units (Gunboat, Submarine) and Amphibious Transports. Update pathfinding so naval units only traverse water, and land units only traverse land/bridges.
- Implement submarine dive mechanics (invisible until attacking or detected by a Destroyer).

---

## Agent 20: Modding API and Lua Script Integration
**Goal**: Create a sandbox environment allowing users to write custom scripts to alter game rules and define new units without changing source code.
**Files to Modify/Create**:
- `src/modding/modLoader.ts` (New: Parses custom JSON and JS/Wasm scripts)
- `src/modding/api.ts` (New: Exposes safe game hooks to mods)
- `src/components/ui/ModManager.tsx` (New: UI to enable/disable mods)
**Scope** (~1200 LOC):
- Implement a virtual file system (VFS) or loader that intercepts `GAME_CONFIG` and `UNIT_DATA` requests, allowing external JSON files to override base stats.
- Create an Event Hook system (e.g., `onUnitSpawn`, `onDamageTaken`) that external scripts can subscribe to.
- Use a safe interpreter (like a lightweight JS sandbox or WebAssembly module) to execute custom mod logic safely without exposing the global `window` object or raw Zustand store.
- Build a UI interface to manage load order of installed mods.
