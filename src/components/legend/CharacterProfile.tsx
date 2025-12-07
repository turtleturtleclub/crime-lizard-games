import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerCharacter, InventoryItem, Weapon, Armor, Accessory } from '../../types/legend.types';
import GoblinHoard from './GoblinHoard';
import ConfirmationModal from './ConfirmationModal';
import { useModalClose } from '../../hooks/useModalClose';

interface CharacterProfileProps {
    player: PlayerCharacter;
    updatePlayer: (updates: Partial<PlayerCharacter>) => void;
    onClose: () => void;
    setGameMessage?: (message: string) => void;
    defaultTab?: TabType;
}

type TabType = 'stats' | 'equipment' | 'inventory' | 'status';

const CharacterProfile: React.FC<CharacterProfileProps> = ({ player, updatePlayer, onClose, setGameMessage, defaultTab = 'stats' }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose);

    const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
    const [showGoblinShop, setShowGoblinShop] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(player.name);
    const [nameError, setNameError] = useState('');
    const [selling, setSelling] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'text-gray-400';
            case 'uncommon': return 'text-green-400';
            case 'rare': return 'text-blue-400';
            case 'epic': return 'text-purple-400';
            case 'legendary': return 'text-yellow-400';
            case 'mythic': return 'text-red-400';
            default: return 'text-white';
        }
    };

    const getRarityBorder = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'border-gray-400';
            case 'uncommon': return 'border-green-400';
            case 'rare': return 'border-blue-400';
            case 'epic': return 'border-purple-400';
            case 'legendary': return 'border-yellow-400';
            case 'mythic': return 'border-red-400';
            default: return 'border-white';
        }
    };

    // Equip a weapon from inventory
    const equipWeapon = (item: InventoryItem) => {
        const weapon = item.itemData as Weapon;
        if (player.level < weapon.minLevel) {
            setGameMessage?.(`⚠️ You need to be level ${weapon.minLevel} to equip this weapon!`);
            return;
        }

        // If there's a currently equipped weapon, unequip it (keep in inventory)
        const updatedInventory = [...(player.inventory || [])];

        // Mark current weapon as unequipped in inventory if it exists
        if (player.weapon) {
            const currentWeaponIndex = updatedInventory.findIndex(
                i => i.id === player.weapon!.id && i.itemType === 'weapon'
            );
            if (currentWeaponIndex >= 0) {
                updatedInventory[currentWeaponIndex].equipped = false;
            }
        }

        // Mark new weapon as equipped
        const newWeaponIndex = updatedInventory.findIndex(i => i.id === item.id);
        if (newWeaponIndex >= 0) {
            updatedInventory[newWeaponIndex].equipped = true;
        }

        updatePlayer({
            weapon: weapon,
            inventory: updatedInventory
        });
    };

    // Unequip current weapon (keep in inventory)
    const unequipWeapon = async () => {
        if (!player.weapon) return;

        const updatedInventory = [...(player.inventory || [])];
        const weaponIndex = updatedInventory.findIndex(
            i => i.id === player.weapon!.id && i.itemType === 'weapon'
        );

        if (weaponIndex >= 0) {
            // Weapon is already in inventory, just mark as unequipped
            updatedInventory[weaponIndex].equipped = false;
        } else {
            // Weapon is not in inventory, add it
            updatedInventory.push({
                id: player.weapon.id,
                itemType: 'weapon',
                quantity: 1,
                rarity: player.weapon.rarity,
                itemData: player.weapon,
                equipped: false,
                acquiredAt: new Date()
            });
        }

        // Update local state first
        updatePlayer({
            weapon: null,
            inventory: updatedInventory
        });

        // Persist to backend immediately to prevent sale issues
        try {
            await fetch('/api/legend/player/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...player,
                    weapon: null,
                    inventory: updatedInventory,
                    updatedAt: new Date()
                })
            });
        } catch (error) {
            console.error('Failed to sync unequip to backend:', error);
        }
    };

    // Equip armor from inventory
    const equipArmor = (item: InventoryItem) => {
        const armor = item.itemData as Armor;
        if (player.level < armor.minLevel) {
            setGameMessage?.(`⚠️ You need to be level ${armor.minLevel} to equip this armor!`);
            return;
        }

        const updatedInventory = [...(player.inventory || [])];

        // Mark current armor as unequipped in inventory if it exists
        if (player.armor) {
            const currentArmorIndex = updatedInventory.findIndex(
                i => i.id === player.armor!.id && i.itemType === 'armor'
            );
            if (currentArmorIndex >= 0) {
                updatedInventory[currentArmorIndex].equipped = false;
            }
        }

        // Mark new armor as equipped
        const newArmorIndex = updatedInventory.findIndex(i => i.id === item.id);
        if (newArmorIndex >= 0) {
            updatedInventory[newArmorIndex].equipped = true;
        }

        updatePlayer({
            armor: armor,
            inventory: updatedInventory
        });
    };

    // Unequip current armor
    const unequipArmor = async () => {
        if (!player.armor) return;

        const updatedInventory = [...(player.inventory || [])];
        const armorIndex = updatedInventory.findIndex(
            i => i.id === player.armor!.id && i.itemType === 'armor'
        );

        if (armorIndex >= 0) {
            // Armor is already in inventory, just mark as unequipped
            updatedInventory[armorIndex].equipped = false;
        } else {
            // Armor is not in inventory, add it
            updatedInventory.push({
                id: player.armor.id,
                itemType: 'armor',
                quantity: 1,
                rarity: player.armor.rarity,
                itemData: player.armor,
                equipped: false,
                acquiredAt: new Date()
            });
        }

        // Update local state first
        updatePlayer({
            armor: null,
            inventory: updatedInventory
        });

        // Persist to backend immediately to prevent sale issues
        try {
            await fetch('/api/legend/player/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...player,
                    armor: null,
                    inventory: updatedInventory,
                    updatedAt: new Date()
                })
            });
        } catch (error) {
            console.error('Failed to sync unequip to backend:', error);
        }
    };

    // Equip accessory from inventory (max 3 accessories)
    const equipAccessory = (item: InventoryItem) => {
        const accessory = item.itemData as Accessory;
        const currentAccessories = player.equippedAccessories || [];

        // Check if already equipped
        if (currentAccessories.some(acc => acc.id === accessory.id)) {
            setGameMessage?.('⚠️ This accessory is already equipped!');
            return;
        }

        // Max 3 accessories can be equipped
        if (currentAccessories.length >= 3) {
            setGameMessage?.('⚠️ Maximum 3 accessories can be equipped! Unequip one first.');
            return;
        }

        const updatedInventory = [...(player.inventory || [])];
        const accessoryIndex = updatedInventory.findIndex(i => i.id === item.id && i.itemType === 'accessory');

        if (accessoryIndex >= 0) {
            updatedInventory[accessoryIndex].equipped = true;
        }

        updatePlayer({
            equippedAccessories: [...currentAccessories, accessory],
            inventory: updatedInventory
        });
    };

    // Unequip an accessory
    const unequipAccessory = async (accessoryId: string) => {
        const currentAccessories = player.equippedAccessories || [];
        const updatedAccessories = currentAccessories.filter(acc => acc.id !== accessoryId);

        const updatedInventory = [...(player.inventory || [])];
        const accessoryIndex = updatedInventory.findIndex(
            i => i.id === accessoryId && i.itemType === 'accessory'
        );

        if (accessoryIndex >= 0) {
            updatedInventory[accessoryIndex].equipped = false;
        }

        // Update local state first
        updatePlayer({
            equippedAccessories: updatedAccessories,
            inventory: updatedInventory
        });

        // Persist to backend immediately to prevent sale issues
        try {
            await fetch('/api/legend/player/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...player,
                    equippedAccessories: updatedAccessories,
                    inventory: updatedInventory,
                    updatedAt: new Date()
                })
            });
        } catch (error) {
            console.error('Failed to sync unequip to backend:', error);
        }
    };

    // Get total attack (base strength + weapon bonus + accessory bonuses)
    const getTotalAttack = () => {
        let total = player.strength + (player.weapon?.attackBonus || 0);

        // Add accessory strength bonuses
        (player.equippedAccessories || []).forEach(acc => {
            total += acc.bonuses.strength || 0;
        });

        return total;
    };

    // Get total defense (base defense + armor bonus + accessory bonuses)
    const getTotalDefense = () => {
        let total = player.defense + (player.armor?.defenseBonus || 0);

        // Add accessory defense bonuses
        (player.equippedAccessories || []).forEach(acc => {
            total += acc.bonuses.defense || 0;
        });

        return total;
    };

    // Get total health (base + accessory bonuses)
    const getTotalHealth = () => {
        let total = player.maxHealth;

        // Add accessory health bonuses
        (player.equippedAccessories || []).forEach(acc => {
            total += acc.bonuses.health || 0;
        });

        return total;
    };

    // Filter inventory by type
    const getInventoryByType = (type: 'weapon' | 'armor' | 'potion' | 'accessory') => {
        return (player.inventory || []).filter(item => item.itemType === type);
    };

    // Calculate sell price (50% of purchase price, minimum 1 gold for free items)
    const getSellPrice = (item: InventoryItem): number => {
        if (!item.itemData) return 0;

        const price = item.itemData.price || 0;

        // Free items (starter gear) can be sold for 1 gold to clear inventory
        if (price === 0) {
            return 1;
        }

        // All other items sell for 50% of purchase price
        return Math.floor(price * 0.5);
    };

    // Sell an item from inventory
    const sellItem = async (index: number) => {
        const item = player.inventory?.[index];
        if (!item) return;

        // Check if item is currently equipped by comparing with player's equipped items
        const isWeaponEquipped = item.itemType === 'weapon' && player.weapon && player.weapon.id === item.id;
        const isArmorEquipped = item.itemType === 'armor' && player.armor && player.armor.id === item.id;
        const isAccessoryEquipped = item.itemType === 'accessory' && (player.equippedAccessories || []).some(acc => acc.id === item.id);

        // Can't sell equipped items - check BEFORE confirmation
        if (isWeaponEquipped || isArmorEquipped || isAccessoryEquipped || item.equipped) {
            setGameMessage?.('Cannot sell equipped items! Unequip it first.');
            return;
        }

        const sellPrice = getSellPrice(item);
        const itemName = item.itemData?.name || item.id;

        // Show confirmation modal
        setConfirmModal({
            isOpen: true,
            title: '💰 Sell Item',
            message: `Sell ${itemName} for ${sellPrice} gold?`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));

                // Show processing message
                setSelling(true);
                setGameMessage?.('⏳ Processing sale...');

                // Call backend API to sell item (syncs gold to blockchain)
                try {
                    const response = await fetch('/api/legend/shop/sell-equipment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            walletAddress: player.walletAddress,
                            tokenId: player.tokenId,
                            inventoryIndex: index,
                            itemData: item.itemData,
                            sellPrice: sellPrice
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || 'Sale failed');
                    }

                    // Remove item from inventory locally (backend already updated DB)
                    const updatedInventory = [...(player.inventory || [])];
                    updatedInventory.splice(index, 1);

                    // Use server's gold value (source of truth) or fallback to local calculation
                    const newGold = data.newGold !== undefined ? data.newGold : player.gold + sellPrice;

                    updatePlayer({
                        inventory: updatedInventory,
                        gold: newGold
                    });

                    setGameMessage?.(`✅ Sold ${itemName} for ${sellPrice} gold!`);
                } catch (error) {
                    console.error('Sale error:', error);
                    setGameMessage?.(`❌ Failed to sell item: ${error instanceof Error ? error.message : 'Unknown error'}`);
                } finally {
                    setSelling(false);
                }
            }
        });
    };

    // Calculate total inventory slots (base + bag bonuses)
    const calculateInventorySlots = () => {
        const baseSlots = player.maxInventorySlots || 5;

        // Check for bag items in inventory that increase slots
        const bagBonus = (player.inventory || []).reduce((total, item) => {
            if (item.itemType === 'accessory' && item.itemData) {
                const accessory = item.itemData as any;
                // Check if this accessory provides inventory bonus (future feature)
                if (accessory.bonuses?.inventorySlots) {
                    return total + accessory.bonuses.inventorySlots;
                }
            }
            return total;
        }, 0);

        return {
            base: baseSlots,
            bagBonus: bagBonus,
            total: baseSlots + bagBonus
        };
    };

    // Update character name
    const handleUpdateName = async () => {
        if (!newName || newName.trim() === player.name) {
            setIsEditingName(false);
            setNameError('');
            return;
        }

        // Validate name
        const trimmedName = newName.trim();
        if (trimmedName.length < 3 || trimmedName.length > 20) {
            setNameError('Name must be between 3 and 20 characters');
            return;
        }

        if (!/^[a-zA-Z0-9 -]+$/.test(trimmedName)) {
            setNameError('Only letters, numbers, spaces, and hyphens allowed');
            return;
        }

        try {
            const response = await fetch('/api/legend/player/update-name', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    newName: trimmedName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setNameError(data.error || 'Failed to update name');
                return;
            }

            // Update local player data
            updatePlayer({ name: trimmedName });
            setGameMessage?.(data.message || 'Name updated successfully!');
            setIsEditingName(false);
            setNameError('');
        } catch (error) {
            console.error('Error updating name:', error);
            setNameError('Failed to update name. Please try again.');
        }
    };

    const modalContent = (
        <>
            {/* Goblin Hoard Shop Modal */}
            <AnimatePresence>
                {showGoblinShop && (
                    <GoblinHoard
                        player={player}
                        updatePlayer={updatePlayer}
                        onClose={() => setShowGoblinShop(false)}
                        setGameMessage={setGameMessage || (() => {})}
                        defaultTab="goods"
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 overscroll-none z-modal"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-black border-2 border-[#00FF88] p-4 md:p-6 max-w-6xl w-full h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto overflow-x-hidden font-bbs pb-safe-bottom"
                    style={{ touchAction: 'pan-y' }}
                >
                {/* Header */}
                <div className="text-center mb-6">
                    {/* Character Image */}
                    {player.ipfsImageHash && (
                        <div className="mb-4 flex justify-center">
                            <img
                                src={`https://gateway.pinata.cloud/ipfs/${player.ipfsImageHash}`}
                                alt={player.name}
                                className="w-48 h-48 border-4 border-[#FFD700] rounded-lg object-cover"
                                onLoad={() => {}}
                                onError={(e) => {
                                    console.warn(`⚠️ Failed to load profile IPFS image for ${player.name}, hash: ${player.ipfsImageHash}`);
                                    // Fallback to default image on error
                                    (e.target as HTMLImageElement).src = '/assets/lizard.png';
                                }}
                            />
                        </div>
                    )}
                    <div className="text-[#00FF88] text-glow-green">
                        <div className="text-3xl font-bold">🦎 CHARACTER PROFILE 🦎</div>
                        <div className="text-xl mt-2 text-yellow-500">{player.name}</div>
                        <div className="text-sm text-gray-400">Level {player.level} Crime Lizard</div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 border-b border-[#00FF88] pb-2 flex-wrap">
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-6 py-2 font-bold transition-all ${activeTab === 'stats'
                            ? 'bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88]'
                            : 'bg-black border-2 border-gray-600 text-gray-400 hover:border-gray-400'
                            }`}
                    >
                        📊 STATS
                    </button>
                    <button
                        onClick={() => setActiveTab('status')}
                        className={`px-6 py-2 font-bold transition-all ${activeTab === 'status'
                            ? 'bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88]'
                            : 'bg-black border-2 border-gray-600 text-gray-400 hover:border-gray-400'
                            }`}
                    >
                        🛡️ STATUS
                    </button>
                    <button
                        onClick={() => setActiveTab('equipment')}
                        className={`px-6 py-2 font-bold transition-all ${activeTab === 'equipment'
                            ? 'bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88]'
                            : 'bg-black border-2 border-gray-600 text-gray-400 hover:border-gray-400'
                            }`}
                    >
                        ⚔️ EQUIPMENT
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-6 py-2 font-bold transition-all ${activeTab === 'inventory'
                            ? 'bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88]'
                            : 'bg-black border-2 border-gray-600 text-gray-400 hover:border-gray-400'
                            }`}
                    >
                        🎒 INVENTORY ({player.inventory?.length || 0}/{calculateInventorySlots().total})
                    </button>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'stats' && (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {/* Character Name Editing */}
                            <div className="bg-black border-2 border-[#FFD700] p-4">
                                <h3 className="text-[#FFD700] text-glow-gold font-bold mb-3 text-lg">✏️ CHARACTER NAME</h3>
                                {isEditingName ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => {
                                                setNewName(e.target.value);
                                                setNameError('');
                                            }}
                                            onKeyPress={(e) => e.key === 'Enter' && handleUpdateName()}
                                            maxLength={20}
                                            className="w-full px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] focus:border-[#FFD700] focus:outline-none font-bbs"
                                            placeholder="Enter new name..."
                                            autoFocus
                                        />
                                        {nameError && (
                                            <div className="text-red-500 text-sm">{nameError}</div>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdateName}
                                                className="px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00FF88]/10 transition-all font-bold"
                                            >
                                                ✅ Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingName(false);
                                                    setNewName(player.name);
                                                    setNameError('');
                                                }}
                                                className="px-4 py-2 bg-black border-2 border-gray-600 text-gray-400 hover:border-gray-400 transition-all font-bold"
                                            >
                                                ❌ Cancel
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            3-20 characters, letters/numbers/spaces/hyphens only
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="text-[#00FF88] text-xl font-bold">{player.name}</div>
                                        <button
                                            onClick={() => setIsEditingName(true)}
                                            className="px-4 py-2 bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 transition-all font-bold text-sm"
                                        >
                                            ✏️ Edit Name
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Core Stats */}
                            <div className="bg-black border-2 border-[#00FF88] p-4">
                                <h3 className="text-[#00FF88] text-glow-green font-bold mb-3 text-lg">⚡ CORE STATS</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <StatDisplay label="Level" value={player.level} color="yellow-500" />
                                    <StatDisplay
                                        label="Health"
                                        value={`${player.health}/${getTotalHealth()}`}
                                        color="red-400"
                                        extra={getTotalHealth() > player.maxHealth ? `(+${getTotalHealth() - player.maxHealth} accessories)` : ''}
                                    />
                                    <StatDisplay label="Gold" value={player.gold} color="yellow-500" emoji="💰" />
                                    <StatDisplay label="Bank" value={player.goldInBank} color="yellow-500" emoji="🏦" />
                                    <StatDisplay label="Experience" value={`${player.experience}/${player.experienceToNextLevel}`} color="blue-400" />
                                    <StatDisplay label="Turns" value={`${player.turnsRemaining}/${player.maxTurns}`} color="cyan-400" />
                                </div>
                            </div>

                            {/* Combat Stats */}
                            <div className="bg-black border-2 border-[#FFD700] p-4">
                                <h3 className="text-[#FFD700] text-glow-gold font-bold mb-3 text-lg">⚔️ COMBAT STATS</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <StatDisplay
                                        label="Base Strength"
                                        value={player.strength}
                                        color="red-400"
                                    />
                                    <StatDisplay
                                        label="Total Attack"
                                        value={getTotalAttack()}
                                        color="red-500"
                                        extra={player.weapon ? `(+${player.weapon.attackBonus} weapon)` : ''}
                                    />
                                    <StatDisplay
                                        label="Base Defense"
                                        value={player.defense}
                                        color="blue-400"
                                    />
                                    <StatDisplay
                                        label="Total Defense"
                                        value={getTotalDefense()}
                                        color="blue-500"
                                        extra={player.armor ? `(+${player.armor.defenseBonus} armor)` : ''}
                                    />
                                    <StatDisplay label="Charm" value={player.charm} color="pink-400" />
                                </div>
                            </div>

                            {/* Progress Stats */}
                            <div className="bg-black border-2 border-[#00FF88] p-4">
                                <h3 className="text-[#00FF88] text-glow-green font-bold mb-3 text-lg">📈 ACHIEVEMENTS</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <StatDisplay label="Enemies Defeated" value={player.enemiesDefeated} color="red-400" />
                                    <StatDisplay label="Heists Completed" value={player.heistsCompleted} color="yellow-400" />
                                    <StatDisplay label="Gold Stolen" value={player.goldStolen} color="yellow-500" emoji="💰" />
                                    <StatDisplay label="Given to Poor" value={player.goldGivenToPoor} color="green-400" emoji="💚" />
                                    <StatDisplay label="PVP Wins" value={player.pvpWins} color="green-500" />
                                    <StatDisplay label="PVP Losses" value={player.pvpLosses} color="red-500" />
                                    <StatDisplay label="Deaths" value={player.deathCount} color="gray-400" emoji="💀" />
                                    <StatDisplay
                                        label="Crime Lord"
                                        value={player.hasDefeatedCrimeLord ? "DEFEATED ✅" : "Not Defeated"}
                                        color={player.hasDefeatedCrimeLord ? "green-500" : "gray-400"}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'equipment' && (
                        <motion.div
                            key="equipment"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {/* Equipped Weapon */}
                            <div className="bg-black border-2 border-[#FFD700] p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-[#FFD700] text-glow-gold font-bold text-lg">⚔️ EQUIPPED WEAPON</h3>
                                    {player.weapon && (
                                        <button
                                            onClick={unequipWeapon}
                                            className="px-3 py-1 bg-red-900 border border-red-500 text-red-500 text-sm hover:bg-red-800"
                                        >
                                            Unequip
                                        </button>
                                    )}
                                </div>
                                {player.weapon ? (
                                    <div className={`bg-black border-2 ${getRarityBorder(player.weapon.rarity)} p-4`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className={`font-bold text-lg ${getRarityColor(player.weapon.rarity)}`}>
                                                    {player.weapon.name}
                                                </div>
                                                <div className="text-sm text-gray-400 mt-1">{player.weapon.description}</div>
                                                {player.weapon.advantages && (
                                                    <div className="mt-2 text-xs text-green-400">
                                                        {Object.entries(player.weapon.advantages).map(([key, value]) => (
                                                            <div key={key}>+ {key}: {value}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-red-400 font-bold text-xl">+{player.weapon.attackBonus}</div>
                                                <div className="text-xs text-gray-400">ATK</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-black border-2 border-gray-600 p-4 text-center text-gray-400">
                                        No weapon equipped
                                    </div>
                                )}
                            </div>

                            {/* Equipped Armor */}
                            <div className="bg-black border-2 border-[#00FF88] p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-[#00FF88] text-glow-green font-bold text-lg">🛡️ EQUIPPED ARMOR</h3>
                                    {player.armor && (
                                        <button
                                            onClick={unequipArmor}
                                            className="px-3 py-1 bg-blue-900 border border-blue-500 text-blue-500 text-sm hover:bg-blue-800"
                                        >
                                            Unequip
                                        </button>
                                    )}
                                </div>
                                {player.armor ? (
                                    <div className={`bg-black border-2 ${getRarityBorder(player.armor.rarity)} p-4`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className={`font-bold text-lg ${getRarityColor(player.armor.rarity)}`}>
                                                    {player.armor.name}
                                                </div>
                                                <div className="text-sm text-gray-400 mt-1">{player.armor.description}</div>
                                                {player.armor.advantages && (
                                                    <div className="mt-2 text-xs text-cyan-400">
                                                        {Object.entries(player.armor.advantages).map(([key, value]) => (
                                                            <div key={key}>+ {key}: {value}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-blue-400 font-bold text-xl">+{player.armor.defenseBonus}</div>
                                                <div className="text-xs text-gray-400">DEF</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-black border-2 border-gray-600 p-4 text-center text-gray-400">
                                        No armor equipped
                                    </div>
                                )}
                            </div>

                            {/* Equipped Accessories */}
                            <div className="bg-black border-2 border-cyan-500 p-4">
                                <h3 className="text-cyan-500 text-glow-cyan font-bold mb-3 text-lg">💎 EQUIPPED ACCESSORIES ({(player.equippedAccessories || []).length}/3)</h3>
                                {(player.equippedAccessories || []).length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {(player.equippedAccessories || []).map((accessory) => (
                                            <div
                                                key={accessory.id}
                                                className={`bg-black border-2 ${getRarityBorder(accessory.rarity)} p-3`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-start gap-2">
                                                        <div className="text-2xl">{accessory.emoji || '💎'}</div>
                                                        <div>
                                                            <div className={`font-bold ${getRarityColor(accessory.rarity)}`}>
                                                                {accessory.name}
                                                            </div>
                                                            <div className="text-xs text-gray-400 mt-1">{accessory.description}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => unequipAccessory(accessory.id)}
                                                        className="px-2 py-1 bg-red-900 border border-red-500 text-red-500 text-xs hover:bg-red-800 ml-2"
                                                    >
                                                        ❌
                                                    </button>
                                                </div>
                                                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                                                    {accessory.bonuses.health && (
                                                        <div className="text-red-400">+{accessory.bonuses.health} HP</div>
                                                    )}
                                                    {accessory.bonuses.strength && (
                                                        <div className="text-red-400">+{accessory.bonuses.strength} STR</div>
                                                    )}
                                                    {accessory.bonuses.defense && (
                                                        <div className="text-blue-400">+{accessory.bonuses.defense} DEF</div>
                                                    )}
                                                    {accessory.bonuses.luck && (
                                                        <div className="text-green-400">+{accessory.bonuses.luck} LCK</div>
                                                    )}
                                                    {accessory.bonuses.goldBonus && (
                                                        <div className="text-yellow-400">+{accessory.bonuses.goldBonus}% Gold</div>
                                                    )}
                                                    {accessory.bonuses.xpBonus && (
                                                        <div className="text-cyan-400">+{accessory.bonuses.xpBonus}% XP</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-black border-2 border-gray-600 p-4 text-center text-gray-400">
                                        No accessories equipped (Max 3)
                                    </div>
                                )}
                            </div>

                            {/* Available Accessories */}
                            {getInventoryByType('accessory').length > 0 && (
                                <div className="bg-black border-2 border-cyan-500 p-4">
                                    <h3 className="text-cyan-500 font-bold mb-3 text-lg">💎 OWNED ACCESSORIES</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {getInventoryByType('accessory').map((item, idx) => {
                                            const accessory = item.itemData as Accessory;
                                            const isEquipped = item.equipped;

                                            return (
                                                <div
                                                    key={`${item.id}-${idx}`}
                                                    className={`bg-black border-2 ${isEquipped ? 'border-[#00FF88]' : getRarityBorder(item.rarity)} p-3`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-start gap-2">
                                                            <div className="text-2xl">{accessory.emoji || '💎'}</div>
                                                            <div>
                                                                <div className={`font-bold ${getRarityColor(item.rarity)}`}>
                                                                    {accessory.name}
                                                                </div>
                                                                <div className="text-xs text-gray-400">
                                                                    {accessory.rarity.toUpperCase()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isEquipped ? (
                                                            <span className="px-2 py-1 bg-[#00AA55] border border-[#00FF88] text-[#00FF88] text-xs">
                                                                EQUIPPED
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => equipAccessory(item)}
                                                                className="px-3 py-1 text-xs font-bold bg-yellow-900 border border-yellow-500 text-yellow-500 hover:bg-yellow-800"
                                                            >
                                                                Equip
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-300 mb-2">{accessory.description}</p>
                                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                                        {accessory.bonuses.health && (
                                                            <div className="text-red-400">+{accessory.bonuses.health} HP</div>
                                                        )}
                                                        {accessory.bonuses.strength && (
                                                            <div className="text-red-400">+{accessory.bonuses.strength} STR</div>
                                                        )}
                                                        {accessory.bonuses.defense && (
                                                            <div className="text-blue-400">+{accessory.bonuses.defense} DEF</div>
                                                        )}
                                                        {accessory.bonuses.luck && (
                                                            <div className="text-green-400">+{accessory.bonuses.luck} LCK</div>
                                                        )}
                                                        {accessory.bonuses.goldBonus && (
                                                            <div className="text-yellow-400">+{accessory.bonuses.goldBonus}% Gold</div>
                                                        )}
                                                        {accessory.bonuses.xpBonus && (
                                                            <div className="text-cyan-400">+{accessory.bonuses.xpBonus}% XP</div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Available Weapons */}
                            {getInventoryByType('weapon').length > 0 && (
                                <div className="bg-black border-2 border-[#FFD700] p-4">
                                    <h3 className="text-[#FFD700] text-glow-gold font-bold mb-3 text-lg">⚔️ OWNED WEAPONS</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {getInventoryByType('weapon').map((item) => {
                                            const weapon = item.itemData as Weapon;
                                            const isEquipped = item.equipped;
                                            const canEquip = player.level >= weapon.minLevel;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`bg-black border-2 ${isEquipped ? 'border-[#00FF88]' : getRarityBorder(item.rarity)} p-3`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className={`font-bold ${getRarityColor(item.rarity)}`}>
                                                                {weapon.name}
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                Level {weapon.minLevel}+ | +{weapon.attackBonus} ATK
                                                            </div>
                                                        </div>
                                                        {isEquipped ? (
                                                            <span className="px-2 py-1 bg-[#00AA55] border border-[#00FF88] text-[#00FF88] text-xs">
                                                                EQUIPPED
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => equipWeapon(item)}
                                                                disabled={!canEquip}
                                                                className={`px-3 py-1 text-xs font-bold ${canEquip
                                                                    ? 'bg-yellow-900 border border-yellow-500 text-yellow-500 hover:bg-yellow-800'
                                                                    : 'bg-black border border-gray-600 text-gray-500 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                {canEquip ? 'Equip' : 'Level Too Low'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-300">{weapon.description}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Available Armor */}
                            {getInventoryByType('armor').length > 0 && (
                                <div className="bg-black border-2 border-[#00FF88] p-4">
                                    <h3 className="text-[#00FF88] text-glow-green font-bold mb-3 text-lg">🛡️ OWNED ARMOR</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {getInventoryByType('armor').map((item) => {
                                            const armor = item.itemData as Armor;
                                            const isEquipped = item.equipped;
                                            const canEquip = player.level >= armor.minLevel;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`bg-black border-2 ${isEquipped ? 'border-[#00FF88]' : getRarityBorder(item.rarity)} p-3`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className={`font-bold ${getRarityColor(item.rarity)}`}>
                                                                {armor.name}
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                Level {armor.minLevel}+ | +{armor.defenseBonus} DEF
                                                            </div>
                                                        </div>
                                                        {isEquipped ? (
                                                            <span className="px-2 py-1 bg-[#00AA55] border border-[#00FF88] text-[#00FF88] text-xs">
                                                                EQUIPPED
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => equipArmor(item)}
                                                                disabled={!canEquip}
                                                                className={`px-3 py-1 text-xs font-bold ${canEquip
                                                                    ? 'bg-yellow-900 border border-yellow-500 text-yellow-500 hover:bg-yellow-800'
                                                                    : 'bg-black border border-gray-600 text-gray-500 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                {canEquip ? 'Equip' : 'Level Too Low'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-300">{armor.description}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'inventory' && (
                        <motion.div
                            key="inventory"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {/* Inventory Summary */}
                            <div className="bg-black border-2 border-[#00FF88] p-4">
                                <h3 className="text-[#00FF88] text-glow-green font-bold mb-3 text-lg">🎒 INVENTORY CAPACITY</h3>

                                {/* Capacity Overview */}
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <div className="text-2xl font-bold text-yellow-500">
                                            {player.inventory?.length || 0} / {calculateInventorySlots().total}
                                        </div>
                                        <div className="text-xs text-gray-400">Items / Total Slots</div>
                                    </div>

                                    {/* Slot Breakdown */}
                                    <div className="text-right">
                                        <div className="text-sm text-cyan-400">
                                            <span className="font-bold">{calculateInventorySlots().base}</span> Base Slots
                                        </div>
                                        {calculateInventorySlots().bagBonus > 0 && (
                                            <div className="text-sm text-green-400">
                                                + <span className="font-bold">{calculateInventorySlots().bagBonus}</span> from Bags
                                            </div>
                                        )}
                                        {calculateInventorySlots().bagBonus === 0 && (
                                            <div className="text-xs text-gray-500">
                                                (No bag bonuses yet)
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-6 bg-black rounded-full overflow-hidden border-2 border-gray-700 relative">
                                    <div
                                        className={`h-full transition-all duration-300 ${
                                            (player.inventory?.length || 0) >= calculateInventorySlots().total
                                                ? 'bg-gradient-to-r from-red-600 to-red-400'
                                                : (player.inventory?.length || 0) > calculateInventorySlots().total * 0.75
                                                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-400'
                                                    : 'bg-gradient-to-r from-green-600 to-green-400'
                                        }`}
                                        style={{
                                            width: `${Math.min(100, ((player.inventory?.length || 0) / calculateInventorySlots().total) * 100)}%`
                                        }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                                        {((player.inventory?.length || 0) / calculateInventorySlots().total * 100).toFixed(0)}% Full
                                    </div>
                                </div>

                                {/* Warning if near capacity */}
                                {(player.inventory?.length || 0) >= calculateInventorySlots().total && (
                                    <div className="mt-3 p-2 bg-red-900/50 border border-red-500 rounded">
                                        <div className="text-red-400 text-xs font-bold">
                                            ⚠️ INVENTORY FULL! You won't be able to pick up new items until you make space.
                                        </div>
                                    </div>
                                )}

                                {/* Scaly Satchel Button */}
                                <div className="mt-4 p-3 bg-black border border-yellow-500 rounded">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">💰</span>
                                            <div>
                                                <div className="text-sm font-bold text-yellow-500">Need More Space?</div>
                                                <div className="text-xs text-gray-400">Visit the Scaly Satchel to buy inventory bags!</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowGoblinShop(true)}
                                            className="px-4 py-2 bg-yellow-900 border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-800 font-bold text-sm transition-all whitespace-nowrap"
                                        >
                                            🦎 VISIT SHOP
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* All Items with Empty Slots */}
                            <div className="bg-black border-2 border-[#FFD700] p-4">
                                <h3 className="text-[#FFD700] text-glow-gold font-bold mb-3">📦 ALL ITEMS</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {/* Render filled slots */}
                                    {(player.inventory || []).map((item, index) => {
                                        const sellPrice = getSellPrice(item);

                                        // Check if item is currently equipped by comparing with player's equipped items
                                        const isWeaponEquipped = item.itemType === 'weapon' && player.weapon && player.weapon.id === item.id;
                                        const isArmorEquipped = item.itemType === 'armor' && player.armor && player.armor.id === item.id;
                                        const isAccessoryEquipped = item.itemType === 'accessory' && (player.equippedAccessories || []).some(acc => acc.id === item.id);
                                        const isEquipped = isWeaponEquipped || isArmorEquipped || isAccessoryEquipped || item.equipped;

                                        // Check if player can equip (level requirement)
                                        const canEquip = item.itemData?.minLevel ? player.level >= item.itemData.minLevel : true;

                                        return (
                                        <div
                                            key={`${item.id}-${index}`}
                                            className={`bg-black border-2 ${getRarityBorder(item.rarity)} p-3 min-h-[140px] flex flex-col justify-between`}
                                        >
                                            <div>
                                                <div className={`font-bold text-sm ${getRarityColor(item.rarity)}`}>
                                                    {item.itemData?.name || item.id}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {item.itemType.toUpperCase()}
                                                    {item.quantity > 1 && ` x${item.quantity}`}
                                                </div>
                                            </div>
                                            <div className="mt-2 space-y-1">
                                                {isEquipped && (
                                                    <span className="text-xs bg-[#00AA55] border border-[#00FF88] text-[#00FF88] px-1 py-0.5 block text-center">
                                                        EQUIPPED
                                                    </span>
                                                )}
                                                <div className={`text-xs font-bold ${getRarityColor(item.rarity)}`}>
                                                    {item.rarity.toUpperCase()}
                                                </div>
                                                {/* Equip/Unequip button for weapons, armor, and accessories */}
                                                {(item.itemType === 'weapon' || item.itemType === 'armor' || item.itemType === 'accessory') && (
                                                    <button
                                                        onClick={() => {
                                                            if (isEquipped) {
                                                                if (item.itemType === 'weapon') unequipWeapon();
                                                                else if (item.itemType === 'armor') unequipArmor();
                                                                else if (item.itemType === 'accessory') unequipAccessory(item.id);
                                                            } else {
                                                                if (item.itemType === 'weapon') equipWeapon(item);
                                                                else if (item.itemType === 'armor') equipArmor(item);
                                                                else if (item.itemType === 'accessory') equipAccessory(item);
                                                            }
                                                        }}
                                                        disabled={!isEquipped && !canEquip}
                                                        className={`w-full py-1 text-xs font-bold transition-all ${
                                                            isEquipped
                                                                ? 'bg-red-900 border border-red-500 text-red-500 hover:bg-red-800'
                                                                : !canEquip
                                                                    ? 'bg-black border border-gray-600 text-gray-600 cursor-not-allowed'
                                                                    : 'bg-cyan-900 border border-cyan-500 text-cyan-500 hover:bg-cyan-800'
                                                        }`}
                                                        title={!canEquip ? `Level ${item.itemData?.minLevel} required` : ''}
                                                    >
                                                        {isEquipped ? '❌ UNEQUIP' : !canEquip ? '🔒 LOCKED' : '⚔️ EQUIP'}
                                                    </button>
                                                )}
                                                {sellPrice > 0 && (
                                                    <button
                                                        onClick={() => sellItem(index)}
                                                        disabled={isEquipped || selling}
                                                        className={`w-full py-1 text-xs font-bold transition-all ${
                                                            isEquipped || selling
                                                                ? 'bg-black border border-gray-600 text-gray-600 cursor-not-allowed'
                                                                : 'bg-yellow-900 border border-yellow-600 text-yellow-400 hover:bg-yellow-800 hover:border-yellow-500'
                                                        }`}
                                                        title={isEquipped ? 'Cannot sell equipped items - unequip first' : selling ? 'Processing sale...' : `Sell for ${sellPrice} gold`}
                                                    >
                                                        {isEquipped ? '🚫 EQUIPPED' : selling ? '⏳ SELLING...' : `💰 SELL ${sellPrice}g`}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        );
                                    })}

                                    {/* Render empty slots */}
                                    {Array.from({ length: Math.max(0, calculateInventorySlots().total - (player.inventory?.length || 0)) }).map((_, index) => (
                                        <div
                                            key={`empty-${index}`}
                                            className="bg-black/30 border-2 border-dashed border-gray-700 p-3 min-h-[100px] flex items-center justify-center"
                                        >
                                            <div className="text-gray-600 text-center">
                                                <div className="text-2xl mb-1">📦</div>
                                                <div className="text-xs">Empty</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tip about bags */}
                            <div className="bg-black border-2 border-yellow-500/50 p-3">
                                <div className="text-yellow-500 text-sm">
                                    💡 <strong>Pro Tip:</strong> You can increase your inventory slots by finding or purchasing special bag items! Look for accessories with bonus inventory slots.
                                </div>
                                <div className="text-gray-500 text-xs mt-2">
                                    💰 <strong>Base Slots:</strong> Determined by your character's archetype when minted (5-10 slots).
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'status' && (
                        <motion.div
                            key="status"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {/* Current Location */}
                            <div className="bg-black border-2 border-[#00FF88] p-4">
                                <h3 className="text-[#00FF88] text-glow-green font-bold mb-3 text-lg">📍 CURRENT LOCATION</h3>
                                <div className="bg-black border border-[#00FF88]/30 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-yellow-500">
                                                {player.location === 'inn' && '🏨 The Rusty Dagger Inn'}
                                                {player.location === 'brothel' && '💋 Violet\'s Velvet Embrace'}
                                                {player.location === 'town' && '🏛️ Town Square'}
                                                {player.location === 'forest' && '🌲 Dark Forest'}
                                                {player.location === 'weapons_shop' && '⚔️ Weapons Shop'}
                                                {player.location === 'armor_shop' && '🛡️ Armor Shop'}
                                                {player.location === 'healer' && '💊 Healer\'s Hut'}
                                                {player.location === 'bank' && '🏦 Bank'}
                                                {player.location === 'arena' && '⚔️ Arena'}
                                                {player.location === 'poor_district' && '🏚️ Poor District'}
                                                {player.location === 'castle' && '🏛️ The Castle'}
                                                {player.location === 'casino' && '🎰 Casino'}
                                                {!['inn', 'brothel', 'town', 'forest', 'weapons_shop', 'armor_shop', 'healer', 'bank', 'arena', 'poor_district', 'castle', 'casino'].includes(player.location) && `📍 ${player.location}`}
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1">
                                                {player.location === 'inn' && 'Safe haven for tired criminals'}
                                                {player.location === 'brothel' && 'Luxury rest and recovery'}
                                                {player.location === 'town' && 'The heart of criminal activity'}
                                                {player.location === 'forest' && 'Dangerous hunting grounds'}
                                                {player.location === 'weapons_shop' && 'Purchase deadly weapons'}
                                                {player.location === 'armor_shop' && 'Get protected'}
                                                {player.location === 'healer' && 'Restore your health'}
                                                {player.location === 'bank' && 'Store your ill-gotten gains'}
                                            </div>
                                        </div>
                                        {(player.location === 'inn' || player.location === 'brothel') && (
                                            <div className="text-right">
                                                <div className="px-3 py-2 bg-[#00AA55] border border-[#00FF88] text-[#00FF88] text-xs font-bold">
                                                    🛡️ SAFE ZONE
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Protection Status */}
                            <div className="bg-black border-2 border-[#FFD700] p-4">
                                <h3 className="text-[#FFD700] text-glow-gold font-bold mb-3 text-lg">🛡️ PROTECTION STATUS</h3>
                                <div className="space-y-3">
                                    {/* Slept Safely Status */}
                                    <div className={`p-3 border-2 ${player.sleptSafely ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className={`font-bold ${player.sleptSafely ? 'text-green-400' : 'text-red-400'}`}>
                                                    {player.sleptSafely ? '✅ Protected from PVP' : '❌ Not Protected'}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {player.sleptSafely
                                                        ? 'You slept safely and are protected from attacks'
                                                        : 'You need to sleep at an inn or brothel to get protection'
                                                    }
                                                </div>
                                            </div>
                                            {player.sleptSafely && (
                                                <div className="text-3xl">🛡️</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Last Safe Sleep */}
                                    {player.lastSafeSleep && (
                                        <div className="p-3 bg-black border border-cyan-500/30">
                                            <div className="text-sm text-cyan-400">
                                                <strong>Last Safe Sleep:</strong>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {new Date(player.lastSafeSleep).toLocaleString()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Online Status */}
                                    <div className={`p-3 border-2 ${player.isOnline ? 'bg-green-900/20 border-green-500' : 'bg-gray-900/20 border-gray-500'}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className={`font-bold ${player.isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                                                    {player.isOnline ? '🟢 Currently Online' : '⚫ Offline'}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {player.isOnline
                                                        ? 'You are protected while actively playing'
                                                        : 'Offline players can be attacked after 5 minutes'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Important Notice for Safe Zones */}
                            {(player.location === 'inn' || player.location === 'brothel') && (
                                <div className="bg-yellow-900/30 border-2 border-yellow-500 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="text-3xl">⚠️</div>
                                        <div>
                                            <div className="text-yellow-500 font-bold text-lg mb-2">
                                                You are in a Safe Zone
                                            </div>
                                            <div className="text-gray-300 text-sm space-y-2">
                                                <p>
                                                    <strong>Protected:</strong> You {player.sleptSafely ? 'have' : 'have not'} slept safely and {player.sleptSafely ? 'are' : 'are NOT'} protected from PVP attacks.
                                                </p>
                                                <p>
                                                    <strong>Warning:</strong> If you leave this safe zone, you may become vulnerable to attacks from other players!
                                                </p>
                                                {!player.sleptSafely && (
                                                    <p className="text-yellow-400">
                                                        💡 <strong>Tip:</strong> Sleep here first to ensure you're protected before logging out!
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Health Status */}
                            <div className="bg-black border-2 border-red-500 p-4">
                                <h3 className="text-red-400 font-bold mb-3 text-lg">❤️ HEALTH STATUS</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Current Health:</span>
                                        <span className={`font-bold ${player.health > player.maxHealth * 0.5 ? 'text-green-400' : player.health > player.maxHealth * 0.25 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {player.health} / {player.maxHealth}
                                        </span>
                                    </div>
                                    <div className="h-6 bg-black rounded-full overflow-hidden border-2 border-gray-700 relative">
                                        <div
                                            className={`h-full transition-all duration-300 ${
                                                player.health > player.maxHealth * 0.5
                                                    ? 'bg-gradient-to-r from-green-600 to-green-400'
                                                    : player.health > player.maxHealth * 0.25
                                                        ? 'bg-gradient-to-r from-yellow-600 to-yellow-400'
                                                        : 'bg-gradient-to-r from-red-600 to-red-400'
                                            }`}
                                            style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
                                        />
                                    </div>
                                    {player.health < player.maxHealth && (
                                        <div className="text-xs text-gray-500 mt-2">
                                            💡 Visit the Healer or sleep at an Inn/Brothel to restore health
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-6 py-3 bg-black border-2 border-gray-600 text-gray-400 hover:bg-black hover:border-[#00FF88] hover:text-[#00FF88] font-bold transition-all"
                >
                    [ESC] CLOSE
                </button>
            </motion.div>
        </motion.div>
        </>
    );

    return (
        <>
            {createPortal(modalContent, document.body)}
            {/* Render ConfirmationModal separately so it appears above CharacterProfile */}
            {createPortal(
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    confirmText="Sell"
                    cancelText="Cancel"
                    confirmColor="yellow"
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                />,
                document.body
            )}
        </>
    );
};

// Stat Display Component
const StatDisplay: React.FC<{
    label: string;
    value: string | number;
    color: string;
    emoji?: string;
    extra?: string;
}> = ({ label, value, color, emoji, extra }) => {
    // Map color strings to actual Tailwind classes
    const colorClasses: Record<string, string> = {
        'yellow-500': 'text-yellow-500',
        'red-400': 'text-red-400',
        'blue-400': 'text-blue-400',
        'cyan-400': 'text-cyan-400',
        'red-500': 'text-red-500',
        'blue-500': 'text-blue-500',
        'pink-400': 'text-pink-400',
        'yellow-400': 'text-yellow-400',
        'green-400': 'text-green-400',
        'green-500': 'text-[#00FF88]',
        'gray-400': 'text-gray-400',
    };

    return (
        <div>
            <div className="text-xs text-[#FFD700]">{label}</div>
            <div className={`${colorClasses[color] || 'text-[#00FF88]'} font-bold text-lg`}>
                {value} {emoji}
            </div>
            {extra && <div className="text-xs text-[#00DD77]">{extra}</div>}
        </div>
    );
};

export default CharacterProfile;

