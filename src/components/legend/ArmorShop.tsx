import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { PlayerCharacter, Armor, InventoryItem } from '../../types/legend.types';
import { ARMOR } from '../../data/gameData';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModalClose } from '../../hooks/useModalClose';
import { useQuests } from '../../contexts/QuestContext';

interface ArmorShopProps {
    player: PlayerCharacter;
    updatePlayer: (updates: Partial<PlayerCharacter>) => void;
    onClose: () => void;
    setGameMessage: (message: string) => void;
}

const ArmorShop: React.FC<ArmorShopProps> = ({ player, updatePlayer, onClose, setGameMessage }) => {
    const { t } = useLanguage();
    const { refreshQuests } = useQuests();
    const armorList = Object.values(ARMOR);

    // Helper to get translated armor name/description
    const getArmorText = (armor: Armor, field: 'name' | 'description') => {
        const armorTranslations = (t as any).armor;
        if (armorTranslations && armorTranslations[armor.id]) {
            return armorTranslations[armor.id][field] || armor[field];
        }
        return armor[field];
    };

    // Handle ESC key and mobile back button
    useModalClose(onClose);

    // Sync database TO blockchain when shop opens
    React.useEffect(() => {
        const syncToBlockchain = async () => {
            try {
const response = await fetch('/api/legend/sync-to-blockchain', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        walletAddress: player.walletAddress,
                        tokenId: Number(player.tokenId)
                    })
                });

                if (response.ok) {
} else {
                    console.warn('⚠️ Failed to sync to blockchain:', await response.text());
                }
            } catch (error) {
                console.error('❌ Error syncing to blockchain:', error);
            }
        };

        syncToBlockchain();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const buyArmor = async (armor: Armor) => {
        // Validate player data first
        if (!player.walletAddress || player.tokenId === undefined || player.tokenId === null) {
            console.error('❌ Missing player data:', { walletAddress: player.walletAddress, tokenId: player.tokenId });
            setGameMessage(`⚠️ ${t.goblinHoard.missingPlayerData}`);
            return;
        }

        if (player.gold < armor.price) {
            setGameMessage(t.legend.shops.notEnoughGoldAlert);
            return;
        }

        if (player.level < armor.minLevel) {
            setGameMessage(t.legend.shops.needLevelAlert.replace('{level}', armor.minLevel.toString()));
            return;
        }

        // Check if player already owns this armor
        const currentInventory = player.inventory || [];
        const alreadyOwned = currentInventory.some(item => item.id === armor.id && item.itemType === 'armor');

        if (alreadyOwned) {
            setGameMessage(`⚠️ ${t.goblinHoard.alreadyOwnArmor}`);
            return;
        }

        // Check inventory space
        if (currentInventory.length >= player.maxInventorySlots) {
            setGameMessage(`⚠️ ${t.goblinHoard.inventoryFull}`);
            return;
        }

        // Call backend API to purchase armor (syncs gold to blockchain)
        try {
const response = await fetch('/api/legend/shop/buy-equipment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    itemType: 'armor',
                    itemId: armor.id,
                    itemData: armor,
                    cost: armor.price
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Purchase failed');
            }

            // Add armor to inventory locally (backend already updated DB)
            const newItem: InventoryItem = {
                id: armor.id,
                itemType: 'armor',
                quantity: 1,
                rarity: armor.rarity,
                itemData: armor,
                equipped: false,
                acquiredAt: new Date()
            };

            updatePlayer({
                inventory: [...currentInventory, newItem],
                gold: player.gold - armor.price // Local state update (blockchain already synced)
            });

            // Refresh quests to check for quest completion (e.g., "Dress for Success")
            await refreshQuests();
            setGameMessage(`✅ ${t.armorShop.purchaseSuccess.replace('{name}', getArmorText(armor, 'name'))}`);

            // Close shop after successful purchase
            setTimeout(() => onClose(), 2000);
        } catch (error) {
            console.error('Purchase error:', error);
            setGameMessage(`❌ ${t.armorShop.purchaseFailed.replace('{error}', error instanceof Error ? error.message : 'Unknown error')}`);
        }
    };

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

    const modalContent = (

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-0 md:p-4 overscroll-none z-modal"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border-2 border-[#00FF88] p-4 md:p-6 max-w-5xl w-full h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto overflow-x-hidden font-bbs pb-safe-bottom"
                style={{ touchAction: 'pan-y' }}
            >
                {/* Header */}
                <div className="text-[#00FF88] text-center mb-4 text-glow-green">
                    <div className="text-2xl font-bold">🛡️  {t.legend.shops.armorTitle.toUpperCase()} 🛡️</div>
                </div>
                <div className="text-center mb-6 text-gray-400 text-sm">
                    {t.legend.shops.armorSubtitle}
                </div>

                {/* Current Armor */}
                {player.armor && (
                    <div className="bg-black border-2 border-cyan-500 p-4 mb-4">
                        <h3 className="text-cyan-500 font-bold mb-2">{t.legend.shops.currentlyEquipped}</h3>
                        <div className="flex justify-between items-center">
                            <div>
                                <div className={`font-bold ${getRarityColor(player.armor.rarity)}`}>
                                    {getArmorText(player.armor, 'name')}
                                </div>
                                <div className="text-sm text-gray-400">{getArmorText(player.armor, 'description')}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-blue-400 font-bold">+{player.armor.defenseBonus} DEF</div>
                                <div className="text-xs text-gray-400">
                                    {t.legend.shops.sellFor} {Math.floor(player.armor.price * 0.5)} {t.legend.stats.gold.toLowerCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Armor Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {armorList.map((armor) => {
                        const canAfford = player.gold >= armor.price;
                        const canUse = player.level >= armor.minLevel;
                        const isEquipped = player.armor?.id === armor.id;
                        const isOwned = (player.inventory || []).some(item => item.id === armor.id && item.itemType === 'armor');

                        return (
                            <div
                                key={armor.id}
                                className={`bg-black border-2 p-4 ${isEquipped
                                    ? 'border-cyan-500'
                                    : isOwned
                                        ? 'border-blue-500'
                                        : canAfford && canUse
                                            ? 'border-yellow-500'
                                            : 'border-gray-600 opacity-60'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className={`font-bold ${getRarityColor(armor.rarity)}`}>
                                            {getArmorText(armor, 'name')}
                                        </div>
                                        <div className="text-xs text-gray-400">{t.armorShop.levelRequired.replace('{level}', String(armor.minLevel))}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-blue-400 font-bold">+{armor.defenseBonus}</div>
                                        <div className="text-xs text-gray-400">{t.armorShop.def}</div>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-300 mb-3">{getArmorText(armor, 'description')}</p>

                                <div className="flex justify-between items-center">
                                    <div className="text-yellow-500 font-bold">{armor.price} 💰</div>
                                    {isEquipped ? (
                                        <div className="px-3 py-1 bg-cyan-900 border border-cyan-500 text-cyan-500 text-sm font-bold">
                                            {t.legend.shops.equipped}
                                        </div>
                                    ) : isOwned ? (
                                        <div className="px-3 py-1 bg-blue-900 border border-blue-500 text-blue-500 text-sm font-bold">
                                            {t.armorShop.owned}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => buyArmor(armor)}
                                            disabled={!canAfford || !canUse}
                                            className={`px-4 py-2 border-2 font-bold text-sm transition-all ${canAfford && canUse
                                                ? 'bg-yellow-900 border-yellow-500 text-yellow-500 hover:bg-yellow-800'
                                                : 'bg-black border-gray-600 text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {!canUse ? t.legend.shops.levelTooLow : !canAfford ? t.legend.shops.tooExpensive : t.legend.shops.buy}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Gold Display */}
                <div className="bg-black border border-gray-700 p-3 mb-4 text-center text-sm">
                    <span className="text-gray-400">{t.legend.shops.yourGold}</span>{' '}
                    <span className="text-yellow-500 font-bold">{player.gold} 💰</span>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-black border-2 border-gray-600 text-gray-400 hover:bg-black font-bold"
                >
                    {t.armorShop.escClose}
                </button>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default ArmorShop;
