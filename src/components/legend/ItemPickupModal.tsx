import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { InventoryItem, Accessory } from '../../types/legend.types';

interface ItemPickupModalProps {
    newItem: Accessory;
    currentInventory: InventoryItem[];
    maxSlots: number;
    onKeepNew: () => void;
    onDiscardNew: () => void;
    onReplaceOld: (itemIndex: number) => void;
}

const ItemPickupModal: React.FC<ItemPickupModalProps> = ({
    newItem,
    currentInventory,
    maxSlots,
    onKeepNew,
    onDiscardNew,
    onReplaceOld
}) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const isFull = currentInventory.length >= maxSlots;

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'text-gray-400';
            case 'uncommon': return 'text-green-400';
            case 'rare': return 'text-blue-400';
            case 'epic': return 'text-purple-400';
            case 'legendary': return 'text-yellow-400';
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
            default: return 'border-white';
        }
    };

    const handleConfirm = () => {
        if (!isFull) {
            onKeepNew();
        } else if (selectedIndex !== null) {
            onReplaceOld(selectedIndex);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-confirmation p-4 overscroll-none"
            onClick={(e) => e.stopPropagation()}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-black border-2 border-yellow-500 p-6 max-w-4xl w-full max-h-[90dvh] overflow-y-auto font-bbs pb-safe-bottom"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="text-yellow-500 text-center mb-6 text-glow-gold">
                    <div className="text-2xl font-bold">✨ ITEM FOUND! ✨</div>
                    <div className="text-sm mt-2 text-gray-400">
                        {isFull ? 'Your inventory is full! Choose what to do:' : 'Add this item to your inventory?'}
                    </div>
                </div>

                {/* New Item Display */}
                <div className="mb-6">
                    <h3 className="text-[#00FF88] font-bold mb-3">🎁 NEW ITEM:</h3>
                    <div className={`bg-black border-2 ${getRarityBorder(newItem.rarity)} p-4`}>
                        <div className="flex items-start gap-4">
                            <div className="text-4xl">{newItem.emoji || '🎁'}</div>
                            <div className="flex-1">
                                <div className={`font-bold text-xl ${getRarityColor(newItem.rarity)}`}>
                                    {newItem.name}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">{newItem.description}</div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    {newItem.bonuses.health && (
                                        <div className="text-red-400">❤️ +{newItem.bonuses.health} HP</div>
                                    )}
                                    {newItem.bonuses.strength && (
                                        <div className="text-red-400">⚔️ +{newItem.bonuses.strength} STR</div>
                                    )}
                                    {newItem.bonuses.defense && (
                                        <div className="text-blue-400">🛡️ +{newItem.bonuses.defense} DEF</div>
                                    )}
                                    {newItem.bonuses.luck && (
                                        <div className="text-green-400">🍀 +{newItem.bonuses.luck} LUCK</div>
                                    )}
                                    {newItem.bonuses.goldBonus && (
                                        <div className="text-yellow-400">💰 +{newItem.bonuses.goldBonus}% Gold</div>
                                    )}
                                    {newItem.bonuses.xpBonus && (
                                        <div className="text-cyan-400">⭐ +{newItem.bonuses.xpBonus}% XP</div>
                                    )}
                                </div>
                                <div className={`mt-2 text-xs font-bold ${getRarityColor(newItem.rarity)}`}>
                                    {newItem.rarity.toUpperCase()} RARITY
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventory Status */}
                {isFull && (
                    <>
                        <div className="mb-4">
                            <h3 className="text-red-500 font-bold mb-2">⚠️ INVENTORY FULL ({currentInventory.length}/{maxSlots})</h3>
                            <p className="text-sm text-gray-400">Select an item below to replace, or discard the new item.</p>
                        </div>

                        {/* Current Inventory Grid */}
                        <div className="mb-6">
                            <h3 className="text-cyan-500 font-bold mb-3">📦 YOUR CURRENT ITEMS:</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto custom-scrollbar">
                                {currentInventory.map((item, index) => (
                                    <div
                                        key={`${item.id}-${index}`}
                                        onClick={() => setSelectedIndex(index)}
                                        className={`bg-black border-2 ${
                                            selectedIndex === index
                                                ? 'border-red-500 bg-red-900/20'
                                                : getRarityBorder(item.rarity)
                                        } p-3 cursor-pointer hover:bg-black transition-all`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="text-2xl">{item.itemData?.emoji || '📦'}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-bold text-sm ${getRarityColor(item.rarity)} truncate`}>
                                                    {item.itemData?.name || item.id}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {item.itemType.toUpperCase()}
                                                    {item.quantity > 1 && ` x${item.quantity}`}
                                                </div>
                                                {item.equipped && (
                                                    <span className="text-xs bg-[#00AA55] border border-[#00FF88] text-[#00FF88] px-1">
                                                        EQUIPPED
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {selectedIndex === index && (
                                            <div className="mt-2 text-center text-red-500 text-xs font-bold">
                                                ❌ WILL BE REPLACED
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {!isFull ? (
                        <>
                            <button
                                onClick={onKeepNew}
                                className="flex-1 py-3 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00BB66] font-bold text-glow-green"
                            >
                                ✅ TAKE ITEM
                            </button>
                            <button
                                onClick={onDiscardNew}
                                className="flex-1 py-3 bg-black border-2 border-gray-600 text-gray-400 hover:bg-black font-bold"
                            >
                                ❌ LEAVE IT
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleConfirm}
                                disabled={selectedIndex === null}
                                className="flex-1 py-3 bg-red-900 border-2 border-red-500 text-red-500 hover:bg-red-800 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ♻️ REPLACE SELECTED
                            </button>
                            <button
                                onClick={onDiscardNew}
                                className="flex-1 py-3 bg-black border-2 border-gray-600 text-gray-400 hover:bg-black font-bold"
                            >
                                ❌ DISCARD NEW
                            </button>
                        </>
                    )}
                </div>

                {/* Hint */}
                <div className="mt-4 text-center text-xs text-gray-500">
                    {isFull
                        ? 'Tip: Equipped items can still be replaced, but will be unequipped first.'
                        : 'Items can be equipped or discarded later from your inventory.'}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ItemPickupModal;
