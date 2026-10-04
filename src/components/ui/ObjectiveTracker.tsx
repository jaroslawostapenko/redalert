import React from 'react';
import { useCampaignStore } from '../../store/campaignStore';

export const ObjectiveTracker: React.FC = () => {
    const objectives = useCampaignStore(state => state.objectives);
    const missionStatus = useCampaignStore(state => state.missionStatus);

    const visibleObjectives = Object.values(objectives).filter(obj => obj.status !== 'hidden');

    if (visibleObjectives.length === 0) return null;

    return (
        <div style={{
            position: 'absolute',
            top: '50px',
            left: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            border: '1px solid #444',
            color: '#fff',
            padding: '10px',
            minWidth: '200px',
            pointerEvents: 'auto',
            zIndex: 900
        }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#00ff00', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
                MISSION OBJECTIVES
            </h3>

            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {visibleObjectives.map(obj => (
                    <li key={obj.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px' }}>
                        <span style={{
                            color: obj.status === 'completed' ? '#00ff00' : obj.status === 'failed' ? '#ff0000' : '#ffff00',
                            fontWeight: 'bold'
                        }}>
                            {obj.status === 'completed' ? '[✓]' : obj.status === 'failed' ? '[X]' : '[ ]'}
                        </span>
                        <span style={{
                            textDecoration: obj.status === 'completed' ? 'line-through' : 'none',
                            color: obj.status === 'completed' ? '#888' : '#fff'
                        }}>
                            {obj.description}
                        </span>
                    </li>
                ))}
            </ul>

            {missionStatus === 'won' && (
                <div style={{ marginTop: '15px', color: '#00ff00', fontWeight: 'bold', textAlign: 'center', fontSize: '18px' }}>
                    MISSION ACCOMPLISHED
                </div>
            )}

            {missionStatus === 'lost' && (
                <div style={{ marginTop: '15px', color: '#ff0000', fontWeight: 'bold', textAlign: 'center', fontSize: '18px' }}>
                    MISSION FAILED
                </div>
            )}
        </div>
    );
};
