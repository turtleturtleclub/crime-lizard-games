/**
 * CLZDExclusiveShop.tsx
 * Exclusive shop for items that can only be purchased with CLZD tokens
 */

import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { WalletContext } from '../../providers/WalletContext';
import { getContractAddress } from '../../config/contracts';
import { CLZD_ABI } from '../../clzdAbi';
import { useModalClose } from '../../hooks/useModalClose';
import type { PlayerCharacter } from '../../types/legend.types';

interface CLZDExclusiveShopProps {
    isOpen: boolean;
    onClose: () => void;
    tokenId: number;
    playerData: PlayerCharacter | null;
    onPurchase?: () => void;
}

interface ExclusiveItem {
    id: string;
    name: string;
    type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'special';
    clzdPrice: number; // Price in CLZD (whole tokens)
    description: string;
    rarity: 'rare' | 'epic' | 'legendary' | 'mythic';
    minLevel: number;
    stats?: {
        attackBonus?: number;
        defenseBonus?: number;
        healthBonus?: number;
        goldBonus?: number;
        xpBonus?: number;
    };
    advantages?: Record<string, number>;
    limited?: boolean;
    maxPurchases?: number;
    imageEmoji: string;
}

// CLZD Exclusive Items (defined here, but can also be loaded from backend)
const EXCLUSIVE_ITEMS: ExclusiveItem[] = [
    // Legendary Weapons
    {
        id: 'clzd_blade_of_fortune',
        name: 'Blade of CLZD Fortune',
        type: 'weapon',
        clzdPrice: 500000,
        description: 'A mystical blade forged with CLZD tokens. Grants bonus gold on every strike.',
        rarity: 'legendary',
        minLevel: 10,
        stats: { attackBonus: 25 },
        advantages: { goldBonus: 15, criticalChance: 10 },
        imageEmoji: '🗡️'
    },
    {
        id: 'clzd_lizard_fang',
        name: 'Primordial Lizard Fang',
        type: 'weapon',
        clzdPrice: 1000000,
        description: 'The tooth of an ancient crime lizard. Legendary power flows through it.',
        rarity: 'mythic',
        minLevel: 15,
        stats: { attackBonus: 40 },
        advantages: { chaosStrike: 15, lifesteal: 10, armorPenetration: 20 },
        imageEmoji: '🦷'
    },
    {
        id: 'clzd_token_scepter',
        name: 'Token Scepter of Wealth',
        type: 'weapon',
        clzdPrice: 750000,
        description: 'A scepter made of compressed CLZD tokens. Radiates financial power.',
        rarity: 'legendary',
        minLevel: 12,
        stats: { attackBonus: 20 },
        advantages: { goldBonus: 25, healingOnHit: 5 },
        imageEmoji: '👑'
    },

    // Legendary Armor
    {
        id: 'clzd_dragonscale_armor',
        name: 'CLZD Dragonscale Armor',
        type: 'armor',
        clzdPrice: 600000,
        description: 'Armor infused with dragon essence. Nearly impenetrable.',
        rarity: 'legendary',
        minLevel: 10,
        stats: { defenseBonus: 30 },
        advantages: { thorns: 10, fireResist: 50, dodgeChance: 5 },
        imageEmoji: '🐉'
    },
    {
        id: 'clzd_void_cloak',
        name: 'Void Cloak of Shadows',
        type: 'armor',
        clzdPrice: 1200000,
        description: 'A cloak woven from the fabric of the void. You become one with darkness.',
        rarity: 'mythic',
        minLevel: 15,
        stats: { defenseBonus: 35 },
        advantages: { dodgeChance: 20, counterAttack: 15, chaosShield: 10 },
        imageEmoji: '🌑'
    },

    // Exclusive Accessories
    {
        id: 'clzd_lucky_charm',
        name: 'CLZD Lucky Charm',
        type: 'accessory',
        clzdPrice: 250000,
        description: 'A charm blessed by the crypto gods. Increases all luck-based outcomes.',
        rarity: 'rare',
        minLevel: 5,
        stats: { goldBonus: 10, xpBonus: 10 },
        imageEmoji: '🍀'
    },
    {
        id: 'clzd_ring_of_wealth',
        name: 'Ring of Infinite Wealth',
        type: 'accessory',
        clzdPrice: 800000,
        description: 'A ring that attracts gold like a magnet. The rich get richer.',
        rarity: 'legendary',
        minLevel: 10,
        stats: { goldBonus: 25 },
        imageEmoji: '💍'
    },
    {
        id: 'clzd_amulet_of_rebirth',
        name: 'Amulet of Rebirth',
        type: 'accessory',
        clzdPrice: 1500000,
        description: 'An amulet that defies death itself. Grants a second chance at life.',
        rarity: 'mythic',
        minLevel: 15,
        stats: { healthBonus: 50 },
        advantages: { revive: 25 },
        imageEmoji: '🔮'
    },

    // Consumables & Special Items
    {
        id: 'clzd_xp_tome',
        name: 'Tome of Instant Knowledge',
        type: 'consumable',
        clzdPrice: 100000,
        description: 'Instantly grants 5000 XP to your character. One-time use.',
        rarity: 'epic',
        minLevel: 1,
        imageEmoji: '📚'
    },
    {
        id: 'clzd_gold_chest',
        name: 'Legendary Gold Chest',
        type: 'consumable',
        clzdPrice: 200000,
        description: 'Contains 10,000 gold. A treasure worthy of a crime lord.',
        rarity: 'legendary',
        minLevel: 1,
        imageEmoji: '💰'
    },
    {
        id: 'clzd_stat_reroll',
        name: 'Scroll of Stat Reroll',
        type: 'special',
        clzdPrice: 300000,
        description: 'Reroll your character\'s base stats with guaranteed legendary outcomes.',
        rarity: 'epic',
        minLevel: 5,
        limited: true,
        maxPurchases: 3,
        imageEmoji: '📜'
    },
    {
        id: 'clzd_title_holder',
        name: 'CLZD Holder Title',
        type: 'special',
        clzdPrice: 500000,
        description: 'Grants the exclusive "CLZD Holder" title displayed next to your name.',
        rarity: 'legendary',
        minLevel: 1,
        limited: true,
        maxPurchases: 1,
        imageEmoji: '🏷️'
    },
];

const CLZDExclusiveShop: React.FC<CLZDExclusiveShopProps> = ({
    isOpen,
    onClose,
    tokenId,
    playerData,
    onPurchase
}) => {
    const { account, signer, provider, currentChainId } = useContext(WalletContext);

    const [clzdBalance, setClzdBalance] = useState<string>('0');
    const [clzdPrice, setClzdPrice] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<ExclusiveItem | null>(null);
    const [needsApproval, setNeedsApproval] = useState(false);
    const [approving, setApproving] = useState(false);
    const [purchasedItems, setPurchasedItems] = useState<string[]>([]);

    // Use the modal close hook (args: onClose, isOpen)
    useModalClose(onClose, isOpen);

    // Load data when modal opens
    useEffect(() => {
        if (isOpen && account && provider) {
            loadShopData();
        }
    }, [isOpen, account, provider]);

    const loadShopData = async () => {
        if (!provider || !account) return;

        setLoading(true);
        try {
            const clzdTokenAddress = getContractAddress(currentChainId || 56, 'clzdToken');
            const goldContractAddress = getContractAddress(currentChainId || 56, 'gold');

            if (!clzdTokenAddress || !goldContractAddress) {
                toast.error('Contract addresses not configured');
                return;
            }

            const clzdContract = new ethers.Contract(clzdTokenAddress, CLZD_ABI, provider);

            // Get CLZD balance
            const balance = await clzdContract.balanceOf(account);
            setClzdBalance(ethers.formatEther(balance));

            // Check allowance
            const allowance = await clzdContract.allowance(account, goldContractAddress);
            setNeedsApproval(allowance < ethers.parseEther('10000000000')); // Check if less than 10B

            // Fetch CLZD price from API
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            const priceRes = await fetch(`${serverUrl}/api/legend/clzd/price`);
            const priceData = await priceRes.json();
            if (priceData.success) {
                setClzdPrice(parseFloat(priceData.priceUsd));
            }

            // Load purchased items from backend
            const purchasedRes = await fetch(`${serverUrl}/api/legend/clzd/exclusive-items?tokenId=${tokenId}`);
            const purchasedData = await purchasedRes.json();
            if (purchasedData.success) {
                setPurchasedItems(purchasedData.purchasedItems || []);
            }
        } catch (error) {
            console.error('Error loading shop data:', error);
            toast.error('Failed to load shop data');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!signer) return;

        setApproving(true);
        try {
            const clzdTokenAddress = getContractAddress(currentChainId || 56, 'clzdToken');
            const goldContractAddress = getContractAddress(currentChainId || 56, 'gold');

            if (!clzdTokenAddress || !goldContractAddress) {
                toast.error('Contract addresses not configured');
                return;
            }

            const clzdContract = new ethers.Contract(clzdTokenAddress, CLZD_ABI, signer);
            const tx = await clzdContract.approve(goldContractAddress, ethers.MaxUint256);

            toast.info('Approval transaction submitted...');
            await tx.wait();

            setNeedsApproval(false);
            toast.success('CLZD approved for exclusive shop!');
        } catch (error: any) {
            console.error('Approval error:', error);
            toast.error(`Approval failed: ${error.reason || error.message}`);
        } finally {
            setApproving(false);
        }
    };

    const handlePurchase = async (item: ExclusiveItem) => {
        if (!signer || !account) return;

        // Check if player level is sufficient
        if (playerData && playerData.level < item.minLevel) {
            toast.error(`You need to be level ${item.minLevel} to purchase this item`);
            return;
        }

        // Check balance
        if (parseFloat(clzdBalance) < item.clzdPrice) {
            toast.error(`Insufficient CLZD balance. You need ${item.clzdPrice.toLocaleString()} CLZD`);
            return;
        }

        // Check if limited item already purchased
        if (item.limited && purchasedItems.includes(item.id)) {
            toast.error('You have already purchased this item');
            return;
        }

        setPurchasing(item.id);
        try {
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            // Call backend to process purchase
            const response = await fetch(`${serverUrl}/api/legend/clzd/purchase-exclusive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: account,
                    tokenId,
                    itemId: item.id,
                    clzdAmount: item.clzdPrice
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Purchased ${item.name}!`);
                setPurchasedItems([...purchasedItems, item.id]);
                loadShopData(); // Refresh balance
                if (onPurchase) onPurchase();
            } else {
                toast.error(data.error || 'Purchase failed');
            }
        } catch (error: any) {
            console.error('Purchase error:', error);
            toast.error(`Purchase failed: ${error.message}`);
        } finally {
            setPurchasing(null);
            setSelectedItem(null);
        }
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'rare': return 'text-blue-400 border-blue-500';
            case 'epic': return 'text-purple-400 border-purple-500';
            case 'legendary': return 'text-yellow-400 border-yellow-500';
            case 'mythic': return 'text-red-400 border-red-500';
            default: return 'text-gray-400 border-gray-500';
        }
    };

    const getRarityBg = (rarity: string) => {
        switch (rarity) {
            case 'rare': return 'bg-blue-900/30';
            case 'epic': return 'bg-purple-900/30';
            case 'legendary': return 'bg-yellow-900/30';
            case 'mythic': return 'bg-red-900/30';
            default: return 'bg-gray-900/30';
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-gradient-to-br from-gray-900 via-green-900/50 to-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-green-500/50"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-green-500/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-green-400">CLZD Exclusive Shop</h2>
                                <p className="text-gray-400 text-sm mt-1">Rare items available only for CLZD holders</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Balance Display */}
                        <div className="mt-4 flex items-center justify-between bg-black/50 rounded-lg p-3">
                            <div>
                                <span className="text-gray-400 text-sm">Your CLZD Balance:</span>
                                <span className="text-green-400 font-bold text-xl ml-2">
                                    {formatNumber(parseFloat(clzdBalance))} CLZD
                                </span>
                            </div>
                            {clzdPrice > 0 && (
                                <div className="text-sm text-gray-500">
                                    ~${(parseFloat(clzdBalance) * clzdPrice).toFixed(2)} USD
                                </div>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                            <p className="text-gray-400">Loading exclusive items...</p>
                        </div>
                    ) : needsApproval ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-300 mb-6">
                                Before you can purchase exclusive items, you need to approve CLZD spending.
                            </p>
                            <motion.button
                                onClick={handleApprove}
                                disabled={approving}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-lg disabled:opacity-50"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {approving ? 'Approving...' : 'Approve CLZD'}
                            </motion.button>
                        </div>
                    ) : (
                        <div className="p-6">
                            {/* Item Categories */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {EXCLUSIVE_ITEMS.map((item) => {
                                    const isPurchased = purchasedItems.includes(item.id);
                                    const meetsLevel = !playerData || playerData.level >= item.minLevel;

                                    return (
                                        <motion.div
                                            key={item.id}
                                            className={`${getRarityBg(item.rarity)} rounded-xl p-4 border-2 ${getRarityColor(item.rarity)} cursor-pointer transition-all ${
                                                isPurchased ? 'opacity-50' : ''
                                            }`}
                                            whileHover={{ scale: isPurchased ? 1 : 1.02 }}
                                            onClick={() => !isPurchased && setSelectedItem(item)}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <span className="text-4xl">{item.imageEmoji}</span>
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getRarityColor(item.rarity)}`}>
                                                    {item.rarity}
                                                </span>
                                            </div>

                                            <h3 className="text-white font-bold mb-1">{item.name}</h3>
                                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>

                                            {/* Stats Preview */}
                                            {item.stats && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {item.stats.attackBonus && (
                                                        <span className="bg-red-900/50 px-2 py-0.5 rounded text-xs text-red-300">
                                                            +{item.stats.attackBonus} ATK
                                                        </span>
                                                    )}
                                                    {item.stats.defenseBonus && (
                                                        <span className="bg-blue-900/50 px-2 py-0.5 rounded text-xs text-blue-300">
                                                            +{item.stats.defenseBonus} DEF
                                                        </span>
                                                    )}
                                                    {item.stats.goldBonus && (
                                                        <span className="bg-yellow-900/50 px-2 py-0.5 rounded text-xs text-yellow-300">
                                                            +{item.stats.goldBonus}% Gold
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-green-400 font-bold">
                                                        {formatNumber(item.clzdPrice)} CLZD
                                                    </span>
                                                    {clzdPrice > 0 && (
                                                        <span className="text-gray-500 text-xs ml-1">
                                                            (~${(item.clzdPrice * clzdPrice).toFixed(2)})
                                                        </span>
                                                    )}
                                                </div>
                                                {!meetsLevel && (
                                                    <span className="text-red-400 text-xs">Lvl {item.minLevel}+</span>
                                                )}
                                            </div>

                                            {isPurchased && (
                                                <div className="mt-2 text-center text-green-400 font-bold">
                                                    ✓ Owned
                                                </div>
                                            )}

                                            {item.limited && !isPurchased && (
                                                <div className="mt-2 text-center text-yellow-400 text-xs">
                                                    Limited: {item.maxPurchases} per player
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Purchase Confirmation Modal */}
                    <AnimatePresence>
                        {selectedItem && (
                            <motion.div
                                className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedItem(null)}
                            >
                                <motion.div
                                    className={`${getRarityBg(selectedItem.rarity)} rounded-2xl max-w-md w-full p-6 border-2 ${getRarityColor(selectedItem.rarity)}`}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="text-center mb-4">
                                        <span className="text-6xl">{selectedItem.imageEmoji}</span>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white text-center mb-2">
                                        {selectedItem.name}
                                    </h3>
                                    <p className={`text-center uppercase font-bold mb-4 ${getRarityColor(selectedItem.rarity)}`}>
                                        {selectedItem.rarity} {selectedItem.type}
                                    </p>

                                    <p className="text-gray-300 text-center mb-4">{selectedItem.description}</p>

                                    {/* Full Stats */}
                                    {(selectedItem.stats || selectedItem.advantages) && (
                                        <div className="bg-black/50 rounded-lg p-4 mb-4">
                                            <h4 className="text-white font-bold mb-2">Stats & Bonuses:</h4>
                                            <div className="space-y-1 text-sm">
                                                {selectedItem.stats?.attackBonus && (
                                                    <div className="text-red-300">+{selectedItem.stats.attackBonus} Attack</div>
                                                )}
                                                {selectedItem.stats?.defenseBonus && (
                                                    <div className="text-blue-300">+{selectedItem.stats.defenseBonus} Defense</div>
                                                )}
                                                {selectedItem.stats?.healthBonus && (
                                                    <div className="text-green-300">+{selectedItem.stats.healthBonus} Max Health</div>
                                                )}
                                                {selectedItem.stats?.goldBonus && (
                                                    <div className="text-yellow-300">+{selectedItem.stats.goldBonus}% Gold Bonus</div>
                                                )}
                                                {selectedItem.stats?.xpBonus && (
                                                    <div className="text-purple-300">+{selectedItem.stats.xpBonus}% XP Bonus</div>
                                                )}
                                                {selectedItem.advantages && Object.entries(selectedItem.advantages).map(([key, value]) => (
                                                    <div key={key} className="text-cyan-300 capitalize">
                                                        +{value}% {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <span className="text-2xl font-bold text-green-400">
                                            {formatNumber(selectedItem.clzdPrice)} CLZD
                                        </span>
                                        {clzdPrice > 0 && (
                                            <span className="text-gray-400 ml-2">
                                                (~${(selectedItem.clzdPrice * clzdPrice).toFixed(2)} USD)
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setSelectedItem(null)}
                                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-bold"
                                        >
                                            Cancel
                                        </button>
                                        <motion.button
                                            onClick={() => handlePurchase(selectedItem)}
                                            disabled={purchasing === selectedItem.id || parseFloat(clzdBalance) < selectedItem.clzdPrice}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {purchasing === selectedItem.id ? 'Purchasing...' : 'Purchase'}
                                        </motion.button>
                                    </div>

                                    {parseFloat(clzdBalance) < selectedItem.clzdPrice && (
                                        <p className="text-red-400 text-sm text-center mt-3">
                                            Insufficient CLZD balance. Need {formatNumber(selectedItem.clzdPrice - parseFloat(clzdBalance))} more CLZD.
                                        </p>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CLZDExclusiveShop;
