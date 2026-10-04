import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { canBuild } from '../../systems/techTree';
import BuildButton from './BuildButton';

type Tab = 'structures' | 'defense' | 'infantry' | 'vehicles';

const Sidebar: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('structures');

    const player = useGameStore(state => state.players['player']);
    const buildings = useGameStore(state => state.buildings);
    const buildQueue = useGameStore(state => state.buildQueue);
    const queueBuild = useGameStore(state => state.queueBuild);
    const setPlacementMode = useGameStore(state => state.setPlacementMode);

    const isLowPower = player.power > player.maxPower;

    const tabs: { id: Tab; label: string }[] = [
        { id: 'structures', label: 'Bldg' },
        { id: 'defense', label: 'Def' },
        { id: 'infantry', label: 'Inf' },
        { id: 'vehicles', label: 'Veh' },
    ];

    const getItemsForTab = (tab: Tab): { type: 'unit' | 'building', name: string }[] => {
        switch (tab) {
            case 'structures':
                return [
                    { type: 'building', name: 'powerPlant' },
                    { type: 'building', name: 'oreRefinery' },
                    { type: 'building', name: 'barracks' },
                    { type: 'building', name: 'warFactory' }
                ];
            case 'defense':
                return [
                    { type: 'building', name: 'pillbox' }
                ];
            case 'infantry':
                return [
                    { type: 'unit', name: 'rifleman' },
                    { type: 'unit', name: 'engineer' }
                ];
            case 'vehicles':
                return [
                    { type: 'unit', name: 'tank' },
                    { type: 'unit', name: 'harvester' }
                ];
        }
    };

    const handleBuildClick = (itemType: 'unit' | 'building', itemName: string) => {
        // Find if it's already in the queue
        const existingQueueItem = buildQueue.find(q => q.name === itemName && q.itemType === itemType);

        if (existingQueueItem) {
            // If it's a building and ready to place
            if (existingQueueItem.status === 'ready_to_place') {
                setPlacementMode(itemName, existingQueueItem.id);
            }
            // If it's building, clicking does nothing or cancels (could implement cancel later)
        } else {
            // Not in queue, try to build it
            queueBuild(itemType, itemName);
        }
    };

    return (
        <div style={{
            width: '250px',
            backgroundColor: '#222',
            borderLeft: '4px solid #555',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'auto',
            height: '100%',
            boxSizing: 'border-box'
        }}>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #555' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1,
                            padding: '10px 5px',
                            backgroundColor: activeTab === tab.id ? '#444' : '#222',
                            color: activeTab === tab.id ? '#fff' : '#aaa',
                            border: 'none',
                            borderRight: '1px solid #555',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ padding: '10px', flex: 1, overflowY: 'auto' }}>
                {getItemsForTab(activeTab).map(item => {
                    const isAvailable = canBuild(item.type, item.name, buildings);
                    const queueItem = buildQueue.find(q => q.name === item.name && q.itemType === item.type);

                    // A crude check if we have another item of the same broad type in queue to disable building
                    const isBusyBuilding = buildQueue.some(q => q.itemType === item.type && q.status !== 'ready_to_place' && q.name !== item.name);

                    // Actually let's allow queueing multiple different things but visually it might be confusing.
                    // Red Alert usually restricts you to building one thing at a time per tab.
                    // For now, if anything of the same itemType is building, we disable other buttons of that type unless they are already queued.

                    const isDisabled = !isAvailable || (isBusyBuilding && !queueItem);

                    // Don't show if we don't meet tech tree and it's not even close?
                    // Let's just show it but disabled if not available.

                    return (
                        <BuildButton
                            key={item.name}
                            itemType={item.type}
                            itemName={item.name}
                            disabled={isDisabled}
                            queueItem={queueItem}
                            lowPower={isLowPower}
                            onClick={() => handleBuildClick(item.type, item.name)}
                        />
                    );
                })}
            </div>

            {/* We could put the minimap here eventually, but it's currently at the top bar. */}
        </div>
    );
};

export default Sidebar;
