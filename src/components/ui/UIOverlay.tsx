import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { CircleDollarSign, Zap } from 'lucide-react';
import Minimap from './Minimap';
import Sidebar from './Sidebar';

const UIOverlay: React.FC = () => {
  const player = useGameStore((state) => state.players['player']);

  const isLowPower = player.power > player.maxPower;

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', flex: 1, flexDirection: 'row' }}>
          {/* Main Overlay Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Top Bar - Resources */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                pointerEvents: 'auto',
                alignItems: 'flex-start'
            }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CircleDollarSign size={20} color="#FFD700" />
                    <span>${player.money}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Zap size={20} color={isLowPower ? 'red' : '#00FFFF'} />
                    <span>{player.maxPower - player.power}</span>
                    {isLowPower && (
                        <span style={{ color: 'red', fontWeight: 'bold', marginLeft: '10px', animation: 'blink 1s linear infinite' }}>
                            LOW POWER!
                        </span>
                    )}
                </div>
                </div>
            </div>

            {/* Minimap in bottom left perhaps? For now leave as is or place somewhere. We had it in the top bar right. Let's keep it there but move it out of flex row if needed. Actually it was in the Top Bar. */}
            <div style={{ position: 'absolute', top: '10px', right: '260px', pointerEvents: 'auto' }}>
                <Minimap />
            </div>

          </div>

          {/* Right Sidebar */}
          <Sidebar />
      </div>
      <style>
        {`
          @keyframes blink {
            50% { opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

export default UIOverlay;