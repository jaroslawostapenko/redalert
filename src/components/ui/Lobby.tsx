import React, { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { socketClient } from '../../network/socketClient';

const Lobby: React.FC = () => {
    const isConnected = useGameStore(state => state.isConnected);
    const playersInLobby = useGameStore(state => state.playersInLobby);
    const isMultiplayerGameStarted = useGameStore(state => state.isMultiplayerGameStarted);

    useEffect(() => {
        // Automatically connect to the websocket server for MVP
        socketClient.connect();
    }, []);

    const handleStartGame = () => {
        socketClient.startGame();
    };

    // If game started, hide lobby
    if (isMultiplayerGameStarted) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#222',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000 // Always on top of game while in lobby
        }}>
            <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>RED ALERT - MULTIPLAYER LOBBY</h1>

            <div style={{
                background: '#333',
                padding: '30px',
                borderRadius: '8px',
                border: '2px solid #555',
                minWidth: '300px',
                textAlign: 'center'
            }}>
                <p style={{ fontSize: '18px', marginBottom: '20px' }}>
                    Status: <span style={{ color: isConnected ? '#4caf50' : '#f44336' }}>
                        {isConnected ? 'Connected' : 'Connecting to Server...'}
                    </span>
                </p>

                {isConnected && (
                    <>
                        <p style={{ fontSize: '16px', marginBottom: '30px' }}>
                            Players in Lobby: <strong>{playersInLobby}</strong>
                        </p>
                        <button
                            onClick={handleStartGame}
                            style={{
                                padding: '15px 30px',
                                fontSize: '18px',
                                background: '#d32f2f',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Start Match
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Lobby;
