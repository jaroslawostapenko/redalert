import React from 'react';
import { useCampaignStore } from '../../store/campaignStore';

export const DialogueBox: React.FC = () => {
    const dialogue = useCampaignStore(state => state.dialogue);

    if (!dialogue || !dialogue.active) return null;

    return (
        <div style={{
            position: 'absolute',
            top: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            border: '2px solid #555',
            color: '#fff',
            display: 'flex',
            padding: '10px',
            gap: '15px',
            zIndex: 1000,
            pointerEvents: 'auto'
        }}>
            {/* Portrait placeholder */}
            <div style={{
                width: '100px',
                height: '100px',
                backgroundColor: '#333',
                border: '1px solid #777',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                {dialogue.portrait}
            </div>

            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                    color: '#00ff00',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #444',
                    paddingBottom: '5px',
                    marginBottom: '10px'
                }}>
                    INCOMING TRANSMISSION: {dialogue.characterName.toUpperCase()}
                </div>
                <div style={{ fontSize: '16px', lineHeight: '1.4' }}>
                    {dialogue.text}
                </div>
            </div>
        </div>
    );
};
