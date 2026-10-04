import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const TICK_RATE = 33; // 30 FPS targeting
let currentFrame = 0;
let nextFrameCommands: any[] = [];

// Rooms mapping if we want to expand, for now just a global room
const clients = new Set<WebSocket>();

// Game State
let isGameRunning = false;
let gameLoopInterval: NodeJS.Timeout | null = null;
let seed = Math.floor(Math.random() * 1000000);

wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);

    // Send initial state
    ws.send(JSON.stringify({
        type: 'LOBBY_STATE',
        payload: {
            players: clients.size,
            isGameRunning
        }
    }));

    broadcastLobbyUpdate();

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'START_GAME' && !isGameRunning) {
                startGame();
            } else if (data.type === 'COMMAND' && isGameRunning) {
                // Attach player info if needed
                nextFrameCommands.push(data.payload);
            }
        } catch (e) {
            console.error('Invalid message format', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
        broadcastLobbyUpdate();

        if (clients.size === 0) {
            stopGame();
        }
    });
});

function broadcastLobbyUpdate() {
    if (isGameRunning) return;
    const msg = JSON.stringify({
        type: 'LOBBY_STATE',
        payload: { players: clients.size, isGameRunning }
    });
    clients.forEach(c => {
        if (c.readyState === WebSocket.OPEN) {
            c.send(msg);
        }
    });
}

function startGame() {
    isGameRunning = true;
    currentFrame = 0;
    seed = Math.floor(Math.random() * 1000000);

    const startMsg = JSON.stringify({
        type: 'GAME_STARTED',
        payload: { seed }
    });

    clients.forEach(c => {
        if (c.readyState === WebSocket.OPEN) {
            c.send(startMsg);
        }
    });

    gameLoopInterval = setInterval(gameTick, TICK_RATE);
    console.log('Game started');
}

function stopGame() {
    isGameRunning = false;
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
        gameLoopInterval = null;
    }
    console.log('Game stopped due to 0 clients');
}

function gameTick() {
    const frameMsg = JSON.stringify({
        type: 'FRAME',
        payload: {
            frame: currentFrame,
            commands: nextFrameCommands
        }
    });

    clients.forEach(c => {
        if (c.readyState === WebSocket.OPEN) {
            c.send(frameMsg);
        }
    });

    currentFrame++;
    nextFrameCommands = [];
}

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
});
