# Command & Conquer: Red Alert 1 (Remake)

A Real-Time Strategy (RTS) game prototype and browser-based remake of Command & Conquer: Red Alert 1, built with React, TypeScript, Vite, and Zustand.

This project is a minimal but feature-rich foundation for an RTS game set in the classic Red Alert universe. It uses modern web technologies to handle the rendering, state management, and core systems, running a game loop directly in the browser.

## Features

- **React-based Rendering**: Uses standard React components to render the game world and UI efficiently.
- **State Management**: Powered by Zustand for lightweight, fast, and scalable global game state.
- **Game Systems**: Includes basic RTS systems separated from state logic:
  - Movement System (handling unit pathing and movement towards targets).
  - Combat System (handling targeting, cooldowns, and damage).
- **Entities**: Supports classic units (Rifleman, Medium Tank, Ore Truck, Engineer), buildings (Construction Yard, Power Plant, Barracks, War Factory, Ore Refinery, Pillbox), and resources (Ore, Gems) with Allies and Soviet factions.
- **Core Mechanics**:
  - Entity selection.
  - Issuing commands (move, attack, harvest).
  - Building/Unit queuing and economy (money, power management).
- **Configurable Data**: Centralized configurations in `src/constants/gameData.ts` for unit stats, building costs, map sizes, and game rules.

## Getting Started

### Prerequisites

You will need [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Development Server

To start the local development server:

```bash
npm run dev
```

The game should now be accessible in your browser (usually at `http://localhost:5173`).

### Building for Production

To build the project for production:

```bash
npm run build
```
This generates the optimized static files in the `dist` folder.

To preview the production build:

```bash
npm run preview
```

## Linting

This project uses [Oxlint](https://oxc.rs/docs/guide/usage/linter) for fast linting.

```bash
npm run lint
```

## Documentation

For technical details regarding the architecture, game loop, and how to add new features, please see the [Architecture Documentation](docs/ARCHITECTURE.md).

## License

This project is open-source. See the LICENSE file for details.
