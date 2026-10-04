import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { CircleDollarSign, Zap } from 'lucide-react';
import { UNIT_DATA, BUILDING_DATA } from '../../constants/gameData';

const UIOverlay: React.FC = () => {
  const player = useGameStore((state) => state.players['player']);
  
  const spawnUnit = useGameStore((state) => state.spawnUnit); // For MVP instant spawn
  const buildings = useGameStore((state) => state.buildings);
  const queueBuild = useGameStore((state) => state.queueBuild);
  const buildQueue = useGameStore((state) => state.buildQueue);
  const setPlacementMode = useGameStore((state) => state.setPlacementMode);

  // Check if we have prerequisites
  const hasBarracks = Object.values(buildings).some(b => b.owner === 'player' && b.buildingType === 'barracks');
  const hasWarFactory = Object.values(buildings).some(b => b.owner === 'player' && b.buildingType === 'warFactory');
  const hasConYard = Object.values(buildings).some(b => b.owner === 'player' && b.buildingType === 'constructionYard');

  const handleBuildUnit = (type: 'rifleman' | 'tank' | 'harvester') => {
     if (player.money >= UNIT_DATA[type].cost) {
         // Queue it normally, but for MVP let's just spawn it near a building
         const cost = UNIT_DATA[type].cost;
         useGameStore.setState(state => ({
             players: { ...state.players, player: { ...state.players['player'], money: state.players['player'].money - cost } }
         }));
         spawnUnit(type, { x: 200, y: 200 }, 'player'); // Hardcoded spawn point for now
     }
  };

  const handleBuildStructure = (type: keyof typeof BUILDING_DATA) => {
    // For now we just add it to the queue and instantly mark it as ready to place since we don't have a time tick for queue yet.
    queueBuild('building', type);
    // Note: the queueBuild logic handles cost
  }

  const handlePlaceStructure = (id: string, type: string) => {
    setPlacementMode(type, id);
  }

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      {/* Top Bar - Resources */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        pointerEvents: 'auto'
      }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CircleDollarSign size={20} color="#FFD700" />
            <span>${player.money}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
             <Zap size={20} color={player.power > player.maxPower ? 'red' : '#00FFFF'} />
             <span>{player.maxPower - player.power}</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Build Menu (Scrollable for mobile) */}
      <div style={{
        background: 'rgba(30, 30, 30, 0.9)',
        padding: '10px',
        display: 'flex',
        gap: '10px',
        overflowX: 'auto',
        pointerEvents: 'auto',
        borderTop: '2px solid #555'
      }}>
        {hasConYard && (
            <button onClick={() => handleBuildStructure('powerPlant')} style={btnStyle}>
                Power ($300)
            </button>
        )}
        {hasConYard && (
            <button onClick={() => handleBuildStructure('barracks')} style={btnStyle}>
                Barracks ($300)
            </button>
        )}
        {hasConYard && (
            <button onClick={() => handleBuildStructure('oreRefinery')} style={btnStyle}>
                Refinery ($2000)
            </button>
        )}
        {hasConYard && (
            <button onClick={() => handleBuildStructure('warFactory')} style={btnStyle}>
                War Fact ($2000)
            </button>
        )}
        {hasBarracks && (
            <button onClick={() => handleBuildUnit('rifleman')} style={btnStyle}>
                Rifleman ($100)
            </button>
        )}
        {hasWarFactory && (
            <button onClick={() => handleBuildUnit('tank')} style={btnStyle}>
                Tank ($800)
            </button>
        )}
        {hasWarFactory && (
            <button onClick={() => handleBuildUnit('harvester')} style={btnStyle}>
                Harvester ($1400)
            </button>
        )}

        {/* Render queued buildings ready to place */}
        {buildQueue.filter(q => q.itemType === 'building').map(q => (
            <button
                key={q.id}
                onClick={() => handlePlaceStructure(q.id, q.name)}
                style={{...btnStyle, border: '2px solid #0f0'}}
            >
                Place {BUILDING_DATA[q.name as keyof typeof BUILDING_DATA].name}
            </button>
        ))}
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
    padding: '15px 20px',
    background: '#333',
    color: 'white',
    border: '1px solid #666',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    minWidth: '100px',
    cursor: 'pointer'
};

export default UIOverlay;