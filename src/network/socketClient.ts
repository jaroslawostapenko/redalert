import { useGameStore } from '../store/gameStore';
import { commandBuffer } from './commandBuffer';

class SocketClient {
    private ws: WebSocket | null = null;
    private serverUrl = 'ws://localhost:3001';

    public connect() {
        if (this.ws) return;

        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
            console.log('Connected to server');
            useGameStore.setState({ isConnected: true });
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'LOBBY_STATE':
                    useGameStore.setState({
                        playersInLobby: data.payload.players,
                    });
                    break;
                case 'GAME_STARTED':
                    commandBuffer.reset();
                    // Seed initialization would go here, maybe store in gameStore
                    useGameStore.setState({ isMultiplayerGameStarted: true });
                    break;
                case 'FRAME':
                    commandBuffer.pushFrame(data.payload.frame, data.payload.commands);
                    break;
            }
        };

        this.ws.onclose = () => {
            console.log('Disconnected from server');
            useGameStore.setState({ isConnected: false, isMultiplayerGameStarted: false });
            this.ws = null;
        };
    }

    public sendCommand(payload: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'COMMAND',
                payload
            }));
        }
    }

    public startGame() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'START_GAME' }));
        }
    }
}

export const socketClient = new SocketClient();
