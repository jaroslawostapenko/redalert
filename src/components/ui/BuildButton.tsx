import React, { useState } from 'react';
import type { BuildQueueItem } from '../../models/types';
import { UNIT_DATA, BUILDING_DATA } from '../../constants/gameData';

interface BuildButtonProps {
  itemType: 'unit' | 'building';
  itemName: string;
  onClick: () => void;
  disabled: boolean;
  queueItem?: BuildQueueItem;
  lowPower: boolean;
}

const BuildButton: React.FC<BuildButtonProps> = ({ itemType, itemName, onClick, disabled, queueItem, lowPower }) => {
  const [isHovered, setIsHovered] = useState(false);
  const data = itemType === 'unit' ? UNIT_DATA[itemName as keyof typeof UNIT_DATA] : BUILDING_DATA[itemName as keyof typeof BUILDING_DATA];

  let progressText = '';
  let progressPercent = 0;

  if (queueItem) {
      if (queueItem.status === 'ready_to_place') {
          progressText = 'READY';
      } else {
          progressPercent = queueItem.progress * 100;
          progressText = lowPower ? 'LOW POWER' : 'BUILDING';
      }
  }

  const tooltipStyle: React.CSSProperties = {
      position: 'absolute',
      right: '100%',
      top: 0,
      width: '200px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      border: '1px solid #555',
      color: '#fff',
      padding: '10px',
      marginRight: '10px',
      zIndex: 10,
      pointerEvents: 'none',
      fontSize: '12px'
  };

  return (
    <div style={{ position: 'relative', marginBottom: '10px' }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <button
        onClick={onClick}
        disabled={disabled && !queueItem}
        style={{
          width: '100%',
          height: '60px',
          backgroundColor: queueItem?.status === 'ready_to_place' ? '#0f0' : (disabled && !queueItem ? '#222' : '#444'),
          color: queueItem?.status === 'ready_to_place' ? '#000' : (disabled && !queueItem ? '#666' : '#fff'),
          border: '2px solid',
          borderColor: queueItem?.status === 'ready_to_place' ? '#0f0' : '#666',
          cursor: (disabled && !queueItem) ? 'not-allowed' : 'pointer',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '12px',
        }}
      >
        <span style={{ zIndex: 2 }}>{data.name}</span>

        {/* Animated Radial/Linear Progress Overlay */}
        {queueItem && queueItem.status !== 'ready_to_place' && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: lowPower ? 'rgba(255, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.3)',
            zIndex: 1,
            transition: 'width 0.1s linear'
          }} />
        )}

        {queueItem && (
            <span style={{ zIndex: 2, fontSize: '10px', color: queueItem.status === 'ready_to_place' ? '#000' : (lowPower ? '#ff4444' : '#ccc') }}>
                {progressText}
            </span>
        )}

      </button>

      {/* Tooltip */}
      {isHovered && (
          <div style={tooltipStyle}>
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid #555', paddingBottom: '5px', marginBottom: '5px' }}>{data.name}</div>
              <div>Cost: ${data.cost}</div>
              {data.buildTime > 0 && <div>Time: {Math.round(data.buildTime / 1000)}s</div>}
              <div>HP: {data.health}</div>
              {('powerGenerated' in data) && data.powerGenerated > 0 && <div style={{color:'#0f0'}}>Power: +{data.powerGenerated}</div>}
              {('powerConsumed' in data) && data.powerConsumed > 0 && <div style={{color:'#f00'}}>Power: -{data.powerConsumed}</div>}
              {('damage' in data) && <div>Damage: {data.damage}</div>}
          </div>
      )}
    </div>
  );
};

export default BuildButton;
