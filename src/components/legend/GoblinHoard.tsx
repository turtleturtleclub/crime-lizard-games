import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerCharacter, Weapon, Armor, InventoryItem } from '../../types/legend.types';
import { useLanguage } from '../../contexts/LanguageContext';
import { GAME_CONSTANTS, ACCESSORIES, WEAPONS, ARMOR, AI_PERSONALITIES } from '../../data/gameData';
import { LEVEL_1_10_QUESTS } from '../../data/questData';
import { useLegendAI } from '../../services/LegendAI';
import { useQuests } from '../../contexts/QuestContext';
import { useModalClose } from '../../hooks/useModalClose';
import GoldShop from './GoldShop';
import ConfirmationModal from './ConfirmationModal';

interface GoblinHoardProps {
    player: PlayerCharacter;
    updatePlayer: (updates: Partial<PlayerCharacter>) => void;
    onClose: () => void;
    setGameMessage: (message: string) => void;
    defaultTab?: 'bank' | 'goods' | 'inventory' | 'weapons' | 'armor' | 'npcs';
}

interface ChatMessage {
    role: 'player' | 'gribnak';
    content: string;
    timestamp: number;
}

// Inventory expansion tiers
const INVENTORY_TIERS = [
    { slots: 50, cost: 500, emoji: '🎒', name: 'Goblin Satchel' },
    { slots: 100, cost: 1500, emoji: '💼', name: 'Lizard\'s Luggage' },
    { slots: 150, cost: 3500, emoji: '🧳', name: 'Dragon\'s Cargo' }
];

// Turn purchase bundles - BASE pricing (will be scaled by player level)
const BASE_TURN_BUNDLES = [
    { turns: 10, baseCost: 500, emoji: '⚔️', name: 'Quick Skirmish' },
    { turns: 25, baseCost: 1000, emoji: '🗡️', name: 'Battle Pack' },
    { turns: 50, baseCost: 1750, emoji: '⚔️', name: 'War Campaign' },
    { turns: 100, baseCost: 3000, emoji: '👑', name: 'Conqueror\'s Bounty' }
];

// Calculate turn cost multiplier based on player level
// Levels 1-5: 10x base (matches your request)
// Every 5 levels after: 2x increase
const calculateTurnCostMultiplier = (playerLevel: number): number => {
    if (playerLevel <= 5) {
        return 1; // Base cost is already 10x
    }

    // Every 5 levels beyond 5, double the cost
    const levelBracket = Math.floor((playerLevel - 1) / 5);
    return Math.pow(2, levelBracket - 1); // 1x for levels 6-10, 2x for 11-15, 4x for 16-20, etc.
};

const GoblinHoard: React.FC<GoblinHoardProps> = ({ player, updatePlayer, onClose, setGameMessage, defaultTab = 'goods' }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose);

    const { t } = useLanguage();
    const { talkToNPC } = useLegendAI(player);
    const { startQuest, activeQuests } = useQuests();
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [loanAmount, setLoanAmount] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [activeTab, setActiveTab] = useState<'bank' | 'goods' | 'inventory' | 'weapons' | 'armor' | 'npcs'>(defaultTab || 'bank');
    const [purchasing, setPurchasing] = useState(false);
    const [selling, setSelling] = useState(false);
    const [depositing, setDepositing] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [showGoldShop, setShowGoldShop] = useState(false);
    const [acceptingQuest, setAcceptingQuest] = useState(false);
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

    // Calculate turn bundles with level-based pricing
    const TURN_BUNDLES = React.useMemo(() => {
        const multiplier = calculateTurnCostMultiplier(player.level);
        return BASE_TURN_BUNDLES.map(bundle => ({
            ...bundle,
            cost: Math.floor(bundle.baseCost * multiplier)
        }));
    }, [player.level]);

    // Chat system
    const [showChat, setShowChat] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isGribnakTyping, setIsGribnakTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Set active tab from defaultTab prop when component mounts or defaultTab changes
    useEffect(() => {
        if (defaultTab) {
            setActiveTab(defaultTab);
        }
    }, [defaultTab]);

    // Initialize chat greeting and sync to blockchain when shop opens
    useEffect(() => {
        // Sync database TO blockchain in background (don't block UI)
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

        const greetings = [
            t.legend.shops.greeting1,
            t.legend.shops.greeting2,
            t.legend.shops.greeting3,
            t.legend.shops.greeting4,
            t.legend.shops.greeting5
        ];
        setChatMessages([{
            role: 'gribnak',
            content: greetings[Math.floor(Math.random() * greetings.length)],
            timestamp: Date.now()
        }]);
    }, [t]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAcceptQuest = async (questId: string) => {
        setAcceptingQuest(true);
        setGameMessage('⏳ Accepting quest...');

        try {
            const result = await startQuest(questId);

            if (result.success) {
                setGameMessage(`✅ Quest accepted: ${LEVEL_1_10_QUESTS[questId]?.title || 'New Quest'}! Check your Quest Log.`);
            } else {
                setGameMessage(`❌ Failed to accept quest: ${result.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Quest acceptance error:', error);
            setGameMessage(`❌ Error accepting quest: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setAcceptingQuest(false);
        }
    };

    const handleChatSubmit = async () => {
        if (!chatInput.trim() || isGribnakTyping) return;

        const userMessage = chatInput.trim();
        setChatInput('');

        // Add user message
        setChatMessages(prev => [...prev, {
            role: 'player',
            content: userMessage,
            timestamp: Date.now()
        }]);

        setIsGribnakTyping(true);

        // Build context for AI
        const context = `You are Gribnak, a goblin-lizard hybrid shopkeeper at "The Scaly Satchel" bank and shop.
You're friendly but greedy, love gold, and speak with a slight hiss (use 'sss' sounds).
You sell: turn bundles (10-100 turns), inventory bags (50-150 slots), banking services, and loans.
Note: Vex the Liquidator also works here - he's a DeFi enforcer who handles underwater positions and gives quests to liquidate delinquent borrowers. If asked about work or quests, mention Vex in the NPCs tab.
Player's current gold: ${player.gold}, Banked: ${player.goldInBank || 0}, Turns: ${player.turnsRemaining}, Inventory: ${player.inventory?.length || 0}/${player.maxInventorySlots} slots.
Player says: "${userMessage}"
Respond in character, be helpful but entertaining. Keep responses under 50 words.`;

        try {
            const response = await talkToNPC('gribnak_shopkeeper', context);

            setChatMessages(prev => [...prev, {
                role: 'gribnak',
                content: response?.content || "Gribnak is too busy counting gold to respond...",
                timestamp: Date.now()
            }]);
        } catch (error) {
            // Fallback responses if AI fails
            const fallbacks = [
                t.legend.shops.fallback1,
                t.legend.shops.fallback2,
                t.legend.shops.fallback3,
                t.legend.shops.fallback4
            ];
            setChatMessages(prev => [...prev, {
                role: 'gribnak',
                content: fallbacks[Math.floor(Math.random() * fallbacks.length)],
                timestamp: Date.now()
            }]);
        } finally {
            setIsGribnakTyping(false);
        }
    };

    const deposit = async () => {
        const amount = parseInt(depositAmount);

        if (isNaN(amount) || amount <= 0) {
            setGameMessage(t.legend.shops.invalidAmount);
            return;
        }

        if (amount > player.gold) {
            setGameMessage(t.legend.shops.notEnoughGoldToDeposit);
            return;
        }

        setDepositing(true);
        try {
            const requestBody = {
                walletAddress: player.walletAddress,
                tokenId: Number(player.tokenId), // Ensure tokenId is a number
                amount: Number(amount) // Ensure amount is a number
            };
const response = await fetch('/api/legend/bank/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Update local state with new balances from backend response
                updatePlayer({
                    gold: data.gold,
                    goldInBank: data.goldInBank
                });
                setGameMessage(t.legend.shops.depositSuccess.replace('{amount}', amount.toString()));
                setDepositAmount('');
            } else {
                setGameMessage(`❌ ${data.error || 'Failed to deposit'}`);
            }
        } catch (error) {
            console.error('Deposit error:', error);
            setGameMessage('❌ Error depositing gold. Please try again.');
        } finally {
            setDepositing(false);
        }
    };

    const withdraw = async () => {
        const amount = parseInt(withdrawAmount);

        if (isNaN(amount) || amount <= 0) {
            setGameMessage(t.legend.shops.invalidAmount);
            return;
        }

        if (amount > player.goldInBank) {
            setGameMessage(t.legend.shops.notEnoughGoldInBank);
            return;
        }

        setWithdrawing(true);
        try {
            const requestBody = {
                walletAddress: player.walletAddress,
                tokenId: Number(player.tokenId), // Ensure tokenId is a number
                amount: Number(amount) // Ensure amount is a number
            };
const response = await fetch('/api/legend/bank/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Update local state with new balances from backend response
                updatePlayer({
                    gold: data.gold,
                    goldInBank: data.goldInBank
                });
                setGameMessage(t.legend.shops.withdrawSuccess.replace('{amount}', amount.toString()));
                setWithdrawAmount('');
            } else {
                setGameMessage(`❌ ${data.error || 'Failed to withdraw'}`);
            }
        } catch (error) {
            console.error('Withdraw error:', error);
            setGameMessage('❌ Error withdrawing gold. Please try again.');
        } finally {
            setWithdrawing(false);
        }
    };

    const takeLoan = async () => {
        const amount = parseInt(loanAmount);

        if (isNaN(amount) || amount < GAME_CONSTANTS.LOAN_MIN_AMOUNT) {
            setGameMessage(`❌ Minimum loan amount is ${GAME_CONSTANTS.LOAN_MIN_AMOUNT} gold.`);
            return;
        }

        if (amount > GAME_CONSTANTS.LOAN_MAX_AMOUNT) {
            setGameMessage(`❌ Maximum loan amount is ${GAME_CONSTANTS.LOAN_MAX_AMOUNT} gold.`);
            return;
        }

        if (player.activeLoan) {
            setGameMessage('❌ You already have an active loan. Pay it off first!');
            return;
        }

        try {
            const response = await fetch('/api/legend/bank/loan/take', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    amount
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                updatePlayer({
                    gold: player.gold + amount,
                    activeLoan: data.loan
                });
                setGameMessage(`💰 Loan approved! ${amount} gold added to your hand. Pay back ${data.loan.amountOwed.toFixed(0)} gold by ${new Date(data.loan.dueDate).toLocaleDateString()}.`);
                setLoanAmount('');
            } else {
                setGameMessage(`❌ ${data.error || 'Failed to take loan'}`);
            }
        } catch (error) {
            console.error('Loan error:', error);
            setGameMessage('❌ Error taking loan. Please try again.');
        }
    };

    const payLoan = async () => {
        const amount = parseInt(paymentAmount);

        if (!player.activeLoan) {
            setGameMessage('❌ You don\'t have an active loan.');
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            setGameMessage(t.legend.shops.invalidAmount);
            return;
        }

        if (amount > player.gold) {
            setGameMessage('❌ Not enough gold on hand to make this payment!');
            return;
        }

        try {
            const response = await fetch('/api/legend/bank/loan/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    amount
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                updatePlayer({
                    gold: player.gold - amount,
                    activeLoan: data.loanPaidOff ? undefined : data.loan
                });
                if (data.loanPaidOff) {
                    setGameMessage('🎉 Loan paid off completely! Your credit is restored.');
                } else {
                    setGameMessage(`💸 Payment of ${amount} gold accepted. Remaining balance: ${data.loan.amountOwed.toFixed(0)} gold.`);
                }
                setPaymentAmount('');
            } else {
                setGameMessage(`❌ ${data.error || 'Failed to make payment'}`);
            }
        } catch (error) {
            console.error('Payment error:', error);
            setGameMessage('❌ Error making payment. Please try again.');
        }
    };

    const purchaseInventoryExpansion = async (tier: typeof INVENTORY_TIERS[0]) => {
        if (player.gold < tier.cost) {
            setGameMessage(`❌ Not enough gold! Need ${tier.cost} gold.`);
            return;
        }

        if (player.maxInventorySlots >= tier.slots) {
            setGameMessage(`❌ You already have ${player.maxInventorySlots} slots or more!`);
            return;
        }

        setPurchasing(true);
        try {
            const response = await fetch('/api/legend/shop/inventory-expansion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    tier: tier.slots,
                    cost: tier.cost
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                updatePlayer({
                    gold: player.gold - tier.cost,
                    maxInventorySlots: tier.slots
                });
                // Removed delayed success message - user gets instant feedback from UI
                // setGameMessage(`🎒 Inventory expanded to ${tier.slots} slots! The goblin grins, showing too many teeth.`);
            } else {
                setGameMessage(`❌ ${data.error || 'Purchase failed'}`);
            }
        } catch (error) {
            console.error('Inventory expansion error:', error);
            setGameMessage('❌ Error purchasing expansion. Please try again.');
        } finally {
            setPurchasing(false);
        }
    };

    const purchaseTurns = async (bundle: typeof TURN_BUNDLES[0]) => {
        if (player.gold < bundle.cost) {
            setGameMessage(`❌ Not enough gold! Need ${bundle.cost} gold.`);
            return;
        }

        setPurchasing(true);
        try {
            const response = await fetch('/api/legend/shop/buy-turns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    turns: bundle.turns,
                    cost: bundle.cost
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                updatePlayer({
                    gold: data.gold,  // Use server-returned gold (atomic operation)
                    turnsRemaining: data.turnsRemaining  // Use server-returned turns
                });
                setGameMessage(`⚔️ Purchased ${bundle.turns} turns! The goblin winks: "Go cause some chaos!"`);
            } else {
                setGameMessage(`❌ ${data.error || 'Purchase failed'}`);
            }
        } catch (error) {
            console.error('Turn purchase error:', error);
            setGameMessage('❌ Error purchasing turns. Please try again.');
        } finally {
            setPurchasing(false);
        }
    };

    const handlePurchaseComplete = async (goldAmount: number, turnBonus: number, serverPlayer?: { gold: number; goldInBank: number; turnsRemaining: number; maxTurns: number }) => {
        // 🔐 FIX: Use server's authoritative player state instead of calling sync-gold
        // This prevents race condition where sync-gold would overwrite pending combat gold
        if (serverPlayer) {
            // Server returned authoritative state - use it directly
            updatePlayer({
                gold: serverPlayer.gold,
                goldInBank: serverPlayer.goldInBank,
                turnsRemaining: serverPlayer.turnsRemaining,
                maxTurns: serverPlayer.maxTurns
            });
        } else {
            // Fallback if server didn't return player state (shouldn't happen)
            updatePlayer({
                gold: player.gold + goldAmount,
                turnsRemaining: player.turnsRemaining + turnBonus
            });
        }

        setGameMessage(`✅ Received ${goldAmount.toLocaleString()} gold and ${turnBonus} turns! 🎉`);
        setShowGoldShop(false);
    };

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

    const getSellPrice = (item: any): number => {
        if (!item.itemData) return 0;

        const price = item.itemData.price || 0;

        // Free items (starter gear) can be sold for 1 gold to clear inventory
        if (price === 0) {
            return 1;
        }

        // All other items sell for 50% of purchase price
        return Math.floor(price * 0.5);
    };

    const sellItem = async (item: any, index: number) => {
        // Check if item is currently equipped by comparing with player's equipped items
        const isWeaponEquipped = item.itemType === 'weapon' && player.weapon && player.weapon.id === item.id;
        const isArmorEquipped = item.itemType === 'armor' && player.armor && player.armor.id === item.id;
        const isAccessoryEquipped = item.itemType === 'accessory' && (player.equippedAccessories || []).some(acc => acc.id === item.id);

        if (isWeaponEquipped || isArmorEquipped || isAccessoryEquipped || item.equipped) {
            setGameMessage('❌ Cannot sell equipped items! Unequip it first from your Character Profile.');
            return;
        }

        const sellPrice = getSellPrice(item);
        const itemName = item.itemData?.name || item.id;

        // Show custom confirmation modal
        setConfirmModal({
            isOpen: true,
            title: '💰 Sell Item',
            message: `Sell ${itemName} for ${sellPrice} gold?`,
            onConfirm: () => performSell(item, index, sellPrice)
        });
    };

    const performSell = async (item: any, index: number, sellPrice: number) => {
        // Close modal
        setConfirmModal(prev => ({ ...prev, isOpen: false }));

        // Show processing message
        setSelling(true);
        setGameMessage('⏳ Processing sale...');

        try {
            const requestBody = {
                walletAddress: player.walletAddress,
                tokenId: Number(player.tokenId),
                inventoryIndex: index,
                itemData: item.itemData || { name: item.id, price: 0 },
                sellPrice
            };
const response = await fetch('/api/legend/shop/sell-equipment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
if (response.ok && data.success) {
                // Update local inventory
                const newInventory = [...(player.inventory || [])];
                newInventory.splice(index, 1);

                // Use server's gold value (source of truth) or fallback to local calculation
                const newGold = data.newGold !== undefined ? data.newGold : player.gold + sellPrice;

                updatePlayer({
                    inventory: newInventory,
                    gold: newGold
                });

                setGameMessage(`✅ Sold ${item.itemData?.name || item.id} for ${sellPrice} gold!`);
            } else {
                console.error('❌ Backend error:', data);
                setGameMessage(`❌ ${data.error || 'Failed to sell item'}`);
            }
        } catch (error) {
            console.error('Sell error:', error);
            setGameMessage('❌ Error selling item. Please try again.');
        } finally {
            setSelling(false);
        }
    };

    const forgeLegendaryWeapon = async () => {
        // Count legendary weapon fragments
        const fragments = (player.inventory || []).filter(
            item => item.id === 'legendary_weapon_fragment'
        );

        if (fragments.length < 3) {
            setGameMessage(`❌ Need 3 Legendary Weapon Fragments to forge! You have ${fragments.length}/3.`);
            return;
        }

        try {
            const response = await fetch('/api/legend/shop/forge-legendary-weapon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Remove 3 fragments and add the legendary weapon
                const newInventory = [...(player.inventory || [])];
                let fragmentsRemoved = 0;

                for (let i = newInventory.length - 1; i >= 0 && fragmentsRemoved < 3; i--) {
                    if (newInventory[i].id === 'legendary_weapon_fragment') {
                        newInventory.splice(i, 1);
                        fragmentsRemoved++;
                    }
                }

                // Add the forged weapon if returned
                if (data.weapon) {
                    newInventory.push({
                        id: data.weapon.id,
                        itemType: 'weapon',
                        quantity: 1,
                        rarity: data.weapon.rarity,
                        itemData: data.weapon,
                        equipped: false,
                        acquiredAt: new Date()
                    });
                }

                updatePlayer({
                    inventory: newInventory
                });

                // Removed delayed success message - user gets instant feedback from UI
                // setGameMessage(`⚔️ ✨ Forged legendary weapon: ${data.weapon?.name || 'Legendary Blade'}! Check your inventory to equip it!`);
            } else {
                setGameMessage(`❌ ${data.error || 'Failed to forge weapon'}`);
            }
        } catch (error) {
            console.error('Forge error:', error);
            setGameMessage('❌ Error forging weapon. Please try again.');
        }
    };

    const buyWeapon = async (weapon: Weapon) => {
        if (!player.walletAddress || player.tokenId === undefined || player.tokenId === null) {
            setGameMessage('❌ Missing player data. Please refresh the page and try again.');
            return;
        }

        if (player.gold < weapon.price) {
            setGameMessage(t.legend.shops.notEnoughGoldAlert);
            return;
        }

        if (player.level < weapon.minLevel) {
            setGameMessage(t.legend.shops.needLevelAlert.replace('{level}', weapon.minLevel.toString()));
            return;
        }

        const currentInventory = player.inventory || [];
        const alreadyOwned = currentInventory.some(item => item.id === weapon.id && item.itemType === 'weapon');

        if (alreadyOwned) {
            setGameMessage('❌ You already own this weapon! Check your inventory to equip it.');
            return;
        }

        if (currentInventory.length >= player.maxInventorySlots) {
            setGameMessage('❌ Your inventory is full! Sell or use some items first.');
            return;
        }

        setPurchasing(true);
        try {
            const response = await fetch('/api/legend/shop/buy-equipment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    itemType: 'weapon',
                    itemId: weapon.id,
                    itemData: weapon,
                    cost: weapon.price
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Purchase failed');
            }

            const newItem: InventoryItem = {
                id: weapon.id,
                itemType: 'weapon',
                quantity: 1,
                rarity: weapon.rarity,
                itemData: weapon,
                equipped: false,
                acquiredAt: new Date()
            };

            updatePlayer({
                inventory: [...currentInventory, newItem],
                gold: player.gold - weapon.price
            });

            // Removed delayed success message - user gets instant feedback from UI
            // setGameMessage(`⚔️ ${weapon.name} added to your inventory! Open your Character Profile to equip it.`);
        } catch (error) {
            console.error('Purchase error:', error);
            setGameMessage(`❌ Failed to purchase weapon: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setPurchasing(false);
        }
    };

    const buyArmor = async (armor: Armor) => {
        if (!player.walletAddress || player.tokenId === undefined || player.tokenId === null) {
            setGameMessage('❌ Missing player data. Please refresh the page and try again.');
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

        const currentInventory = player.inventory || [];
        const alreadyOwned = currentInventory.some(item => item.id === armor.id && item.itemType === 'armor');

        if (alreadyOwned) {
            setGameMessage('❌ You already own this armor! Check your inventory to equip it.');
            return;
        }

        if (currentInventory.length >= player.maxInventorySlots) {
            setGameMessage('❌ Your inventory is full! Sell or use some items first.');
            return;
        }

        setPurchasing(true);
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
                gold: player.gold - armor.price
            });

            // Removed delayed success message - user gets instant feedback from UI
            // setGameMessage(`🛡️ ${armor.name} added to your inventory! Open your Character Profile to equip it.`);
        } catch (error) {
            console.error('Purchase error:', error);
            setGameMessage(`❌ Failed to purchase armor: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setPurchasing(false);
        }
    };

    // Equip weapon from inventory
    const equipWeapon = (item: InventoryItem) => {
        const weapon = item.itemData as Weapon;
        if (player.level < weapon.minLevel) {
            setGameMessage(`❌ You need to be level ${weapon.minLevel} to equip this weapon!`);
            return;
        }

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
        setGameMessage(`⚔️ Equipped ${weapon.name}!`);
    };

    // Unequip current weapon
    const unequipWeapon = () => {
        if (!player.weapon) return;

        const updatedInventory = [...(player.inventory || [])];
        const weaponIndex = updatedInventory.findIndex(
            i => i.id === player.weapon!.id && i.itemType === 'weapon'
        );

        if (weaponIndex >= 0) {
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

        updatePlayer({
            weapon: null,
            inventory: updatedInventory
        });
        setGameMessage('🔓 Weapon unequipped!');
    };

    // Equip armor from inventory
    const equipArmor = (item: InventoryItem) => {
        const armor = item.itemData as Armor;
        if (player.level < armor.minLevel) {
            setGameMessage(`❌ You need to be level ${armor.minLevel} to equip this armor!`);
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
        setGameMessage(`🛡️ Equipped ${armor.name}!`);
    };

    // Unequip current armor
    const unequipArmor = () => {
        if (!player.armor) return;

        const updatedInventory = [...(player.inventory || [])];
        const armorIndex = updatedInventory.findIndex(
            i => i.id === player.armor!.id && i.itemType === 'armor'
        );

        if (armorIndex >= 0) {
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

        updatePlayer({
            armor: null,
            inventory: updatedInventory
        });
        setGameMessage('🔓 Armor unequipped!');
    };

    // Equip accessory from inventory (max 3 accessories)
    const equipAccessory = (item: InventoryItem) => {
        const accessory = item.itemData as any;
        const currentAccessories = player.equippedAccessories || [];

        // Check if already equipped
        if (currentAccessories.some(acc => acc.id === accessory.id)) {
            setGameMessage('❌ This accessory is already equipped!');
            return;
        }

        // Max 3 accessories can be equipped
        if (currentAccessories.length >= 3) {
            setGameMessage('❌ Maximum 3 accessories can be equipped! Unequip one first.');
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
        setGameMessage(`💎 Equipped ${accessory.name}!`);
    };

    // Unequip an accessory
    const unequipAccessory = (accessoryId: string) => {
        const currentAccessories = player.equippedAccessories || [];
        const updatedAccessories = currentAccessories.filter(acc => acc.id !== accessoryId);

        const updatedInventory = [...(player.inventory || [])];
        const accessoryIndex = updatedInventory.findIndex(
            i => i.id === accessoryId && i.itemType === 'accessory'
        );

        if (accessoryIndex >= 0) {
            updatedInventory[accessoryIndex].equipped = false;
        }

        updatePlayer({
            equippedAccessories: updatedAccessories,
            inventory: updatedInventory
        });
        setGameMessage('🔓 Accessory unequipped!');
    };

    const modalContent = (

        <>
            {/* Gold Shop Modal */}
            <AnimatePresence>
                {showGoldShop && (
                    <GoldShop
                        onClose={() => setShowGoldShop(false)}
                        onPurchase={handlePurchaseComplete}
                        tokenId={player.tokenId}
                    />
                )}
            </AnimatePresence>

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
                    className="bg-black border-2 border-yellow-500 p-4 md:p-6 max-w-2xl w-full h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto overflow-x-hidden font-bbs pb-safe-bottom"
                    style={{ touchAction: 'pan-y' }}
                >
                {/* Header with Goblin theme & Chat Button */}
                <div className="text-yellow-500 text-center mb-4 text-glow-gold">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1"></div>
                        <div className="text-2xl font-bold flex-shrink-0">🦎 THE SCALY SATCHEL 💰</div>
                        {/* Chat Toggle Button - Moved to side */}
                        <div className="flex-1 flex justify-end">
                            <button
                                onClick={() => setShowChat(!showChat)}
                                className={`px-2 md:px-3 py-1 md:py-2 border-2 font-bold text-xs md:text-sm transition-all ${
                                    showChat
                                        ? 'bg-cyan-900 border-cyan-500 text-cyan-500'
                                        : 'bg-black border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-500'
                                }`}
                            >
                                💬 {showChat ? t.legend.shops.chatHide : t.legend.shops.chatShow}
                            </button>
                        </div>
                    </div>
                    <div className="text-xs md:text-sm text-gray-400 px-8">
                        "{t.legend.shops.headerSubtitle}"
                    </div>
                </div>

                {/* Chat Window */}
                <AnimatePresence>
                    {showChat && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-4 overflow-hidden"
                        >
                            <div className="bg-black border-2 border-cyan-500 p-3">
                                <div className="flex items-center gap-2 mb-2 text-cyan-500 font-bold text-sm">
                                    🦎 {t.legend.shops.chatWithGribnak}
                                </div>

                                {/* Chat Messages */}
                                <div className="bg-black border border-cyan-500 p-2 h-40 overflow-y-auto mb-2 text-xs custom-scrollbar">
                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`mb-2 ${msg.role === 'player' ? 'text-right' : 'text-left'}`}>
                                            <div className={`inline-block px-2 py-1 rounded ${
                                                msg.role === 'player'
                                                    ? 'bg-[#00AA55] text-green-400 border border-[#00FF88]'
                                                    : 'bg-yellow-900 text-yellow-400 border border-yellow-500'
                                            }`}>
                                                <div className="font-bold text-[10px] mb-0.5">
                                                    {msg.role === 'player' ? t.legend.shops.chatYou : '🦎 Gribnak'}
                                                </div>
                                                <div>{msg.content}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {isGribnakTyping && (
                                        <div className="text-left">
                                            <div className="inline-block px-2 py-1 rounded bg-yellow-900 text-yellow-400 border border-yellow-500">
                                                <div className="font-bold text-[10px] mb-0.5">🦎 Gribnak</div>
                                                <div className="animate-pulse">{t.legend.shops.gribnakTyping}</div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chat Input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                                        placeholder={t.legend.shops.chatPlaceholder}
                                        disabled={isGribnakTyping}
                                        className="flex-1 px-2 py-1 bg-black text-white border border-cyan-500 focus:border-cyan-400 outline-none text-xs disabled:opacity-50"
                                    />
                                    <button
                                        onClick={handleChatSubmit}
                                        disabled={!chatInput.trim() || isGribnakTyping}
                                        className="px-3 py-1 bg-cyan-900 border border-cyan-500 text-cyan-500 hover:bg-cyan-800 font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {t.legend.shops.chatSend}
                                    </button>
                                </div>

                                <div className="text-[10px] text-gray-500 mt-1 text-center">
                                    💡 {t.legend.shops.chatTip}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabs */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-1 md:gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab('bank')}
                        className={`py-2 px-1 md:px-2 font-bold border-2 transition-all text-xs ${
                            activeTab === 'bank'
                                ? 'bg-[#00AA55] border-[#00FF88] text-[#00FF88]'
                                : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                    >
                        💰 {t.legend.shops.tabBank}{player.activeLoan ? ' ⚠️' : ''}
                    </button>
                    <button
                        onClick={() => setActiveTab('npcs')}
                        className={`py-2 px-1 md:px-2 font-bold border-2 transition-all text-xs ${
                            activeTab === 'npcs'
                                ? 'bg-orange-900 border-orange-500 text-orange-500'
                                : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                    >
                        👥 {t.legend.shops.tabNpcs}
                    </button>
                    <button
                        onClick={() => setActiveTab('weapons')}
                        className={`py-2 px-1 md:px-2 font-bold border-2 transition-all text-xs ${
                            activeTab === 'weapons'
                                ? 'bg-red-900 border-red-500 text-red-500'
                                : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                    >
                        ⚔️ {t.legend.shops.tabWeapons}
                    </button>
                    <button
                        onClick={() => setActiveTab('armor')}
                        className={`py-2 px-1 md:px-2 font-bold border-2 transition-all text-xs ${
                            activeTab === 'armor'
                                ? 'bg-cyan-900 border-cyan-500 text-cyan-500'
                                : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                    >
                        🛡️ {t.legend.shops.tabArmor}
                    </button>
                    <button
                        onClick={() => setActiveTab('goods')}
                        className={`py-2 px-1 md:px-2 font-bold border-2 transition-all text-xs ${
                            activeTab === 'goods'
                                ? 'bg-yellow-900 border-yellow-500 text-yellow-500'
                                : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                    >
                        🛒 {t.legend.shops.tabGoods}
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`py-2 px-1 md:px-2 font-bold border-2 transition-all text-xs ${
                            activeTab === 'inventory'
                                ? 'bg-purple-900 border-purple-500 text-purple-500'
                                : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                    >
                        📦 {t.legend.shops.tabInv}
                    </button>
                </div>

                {/* Balances */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-black border border-yellow-500 p-4 text-center">
                        <div className="text-yellow-500 text-2xl font-bold">{(player.gold || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-400">{t.legend.shops.goldOnHand}</div>
                    </div>
                    <div className="bg-black border border-[#00FF88] p-4 text-center">
                        <div className="text-[#00FF88] text-2xl font-bold">{(player.goldInBank || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-400">{t.legend.shops.goldInBank}</div>
                    </div>
                </div>


                {/* BANK TAB - Now first! */}
                {activeTab === 'bank' && (
                    <>
                        {/* Deposit */}
                        <div className="bg-black border border-[#00FF88] p-4 mb-3">
                            <h3 className="font-bold text-[#00FF88] mb-3">{t.legend.shops.depositGold}</h3>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    placeholder={t.legend.shops.amount}
                                    className="flex-1 px-3 py-2 bg-black text-white border border-[#00FF88] focus:border-green-400 outline-none"
                                />
                                <button
                                    onClick={() => setDepositAmount(player.gold.toString())}
                                    className="px-3 py-2 bg-black border border-[#00FF88] text-[#00FF88] hover:bg-gray-700 text-sm"
                                >
                                    {t.legend.shops.all}
                                </button>
                            </div>
                            <button
                                onClick={deposit}
                                disabled={depositing || !depositAmount || parseInt(depositAmount) <= 0 || parseInt(depositAmount) > player.gold}
                                className="w-full mt-3 px-4 py-3 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] font-bold hover:bg-[#00BB66] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {depositing ? '⏳ Processing...' : t.legend.shops.deposit}
                            </button>
                        </div>

                        {/* Withdraw */}
                        <div className="bg-black border border-cyan-500 p-4 mb-4">
                            <h3 className="font-bold text-cyan-500 mb-3">{t.legend.shops.withdrawGold}</h3>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder={t.legend.shops.amount}
                                    className="flex-1 px-3 py-2 bg-black text-white border border-cyan-500 focus:border-cyan-400 outline-none"
                                />
                                <button
                                    onClick={() => setWithdrawAmount(player.goldInBank.toString())}
                                    className="px-3 py-2 bg-black border border-cyan-500 text-cyan-500 hover:bg-gray-700 text-sm"
                                >
                                    {t.legend.shops.all}
                                </button>
                            </div>
                            <button
                                onClick={withdraw}
                                disabled={withdrawing || !withdrawAmount || parseInt(withdrawAmount) <= 0 || parseInt(withdrawAmount) > player.goldInBank}
                                className="w-full mt-3 px-4 py-3 bg-cyan-900 border-2 border-cyan-500 text-cyan-500 font-bold hover:bg-cyan-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {withdrawing ? '⏳ Processing...' : t.legend.shops.withdraw}
                            </button>
                        </div>

                        {/* Interest Info */}
                        <div className="bg-black border border-[#00FF88] p-3 mb-4 text-sm text-green-400">
                            📈 Earn {GAME_CONSTANTS.BANK_DAILY_INTEREST_RATE * 100}% daily interest on deposits!
                        </div>

                        {/* Info */}
                        <div className="bg-black border border-yellow-500 p-3 mb-4 text-sm text-yellow-500">
                            💡 {t.legend.shops.bankTip}
                        </div>

                        {/* Buy Gold with BNB */}
                        <div className="bg-black border border-purple-500 p-4 mb-4">
                            <h3 className="font-bold text-purple-500 mb-3 flex items-center gap-2">
                                💎 Buy Gold with BNB
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Purchase gold directly with BNB! Get instant delivery plus bonus turns for larger packages.
                                Your purchase helps fund weekly $CLZD rewards! 🚀
                            </p>

                            <button
                                onClick={() => setShowGoldShop(true)}
                                className="w-full py-3 bg-purple-900 border-2 border-purple-500 text-purple-500 font-bold hover:bg-purple-800 transition-all text-lg"
                            >
                                💰 OPEN GOLD SHOP 💎
                            </button>
                        </div>

                        <div className="bg-black border border-cyan-500 p-4 mb-4">
                            <h3 className="font-bold text-cyan-500 mb-2 text-sm">💡 Why Buy Gold?</h3>
                            <ul className="text-xs text-gray-400 space-y-1">
                                <li>✅ Instant delivery - gold credited immediately</li>
                                <li>✅ Bonus turns included with every purchase</li>
                                <li>✅ Larger packages get bonus gold (10-30%)</li>
                                <li>✅ Support weekly $CLZD reward pools</li>
                                <li>✅ Secure blockchain transactions</li>
                            </ul>
                        </div>

                        {/* LOANS SECTION - Merged into Bank */}
                        <div className="bg-black border-2 border-red-500 p-4 mb-4">
                            <h3 className="font-bold text-red-500 mb-3 text-lg flex items-center gap-2">
                                📜 LOANS & CREDIT
                            </h3>

                            {/* Active Loan Status */}
                            {player.activeLoan && (
                                <div className={`bg-black border-2 p-4 mb-4 ${
                                    player.activeLoan.daysOverdue > 0 ? 'border-red-500' : 'border-yellow-500'
                                }`}>
                                    <h3 className="font-bold text-red-500 mb-3 flex items-center gap-2">
                                        ⚠️ Active Loan
                                        {player.activeLoan.daysOverdue > 0 && <span className="text-red-400 text-xs">(OVERDUE!)</span>}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <div className="text-gray-400">Original Amount:</div>
                                            <div className="text-white font-bold">{player.activeLoan.amount} gold</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400">Amount Owed:</div>
                                            <div className="text-red-400 font-bold">{player.activeLoan.amountOwed.toFixed(0)} gold</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400">Due Date:</div>
                                            <div className="text-white">{new Date(player.activeLoan.takenAt).toLocaleDateString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400">Days Overdue:</div>
                                            <div className={player.activeLoan.daysOverdue > 0 ? 'text-red-500 font-bold' : 'text-[#00FF88]'}>
                                                {player.activeLoan.daysOverdue || 0}
                                            </div>
                                        </div>
                                    </div>
                                    {player.activeLoan.xpPenaltyAccrued > 0 && (
                                        <div className="mt-3 p-2 bg-red-900/30 border border-red-500 text-red-400 text-xs">
                                            💀 XP Penalty: -{player.activeLoan.xpPenaltyAccrued} XP (grinding daily!)
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Take Loan */}
                            {!player.activeLoan && (
                                <div className="bg-black border border-red-500 p-4 mb-4">
                                    <h3 className="font-bold text-red-500 mb-3">💰 Take a Loan</h3>
                                    <div className="text-xs text-gray-400 mb-3">
                                        <div>• Min: {GAME_CONSTANTS.LOAN_MIN_AMOUNT} gold | Max: {GAME_CONSTANTS.LOAN_MAX_AMOUNT} gold</div>
                                        <div>• {GAME_CONSTANTS.LOAN_INTEREST_RATE * 100}% daily interest</div>
                                        <div>• {GAME_CONSTANTS.LOAN_MAX_DURATION_DAYS} day repayment period</div>
                                        <div className="text-red-400 mt-1">⚠️ Default = {GAME_CONSTANTS.LOAN_DEFAULT_PENALTY_XP} XP lost per day!</div>
                                    </div>
                                    <input
                                        type="number"
                                        value={loanAmount}
                                        onChange={(e) => setLoanAmount(e.target.value)}
                                        placeholder="Loan amount"
                                        className="w-full px-3 py-2 mb-3 bg-black text-white border border-red-500 focus:border-red-400 outline-none"
                                    />
                                    <button
                                        onClick={takeLoan}
                                        disabled={!loanAmount || parseInt(loanAmount) < GAME_CONSTANTS.LOAN_MIN_AMOUNT || parseInt(loanAmount) > GAME_CONSTANTS.LOAN_MAX_AMOUNT}
                                        className="w-full px-4 py-3 bg-red-900 border-2 border-red-500 text-red-500 font-bold hover:bg-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        📜 {t.legend.shops.takeLoan}
                                    </button>
                                </div>
                            )}

                            {/* Pay Loan */}
                            {player.activeLoan && (
                                <div className="bg-black border border-[#00FF88] p-4 mb-4">
                                    <h3 className="font-bold text-[#00FF88] mb-3">💸 {t.legend.shops.makePayment}</h3>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            placeholder={t.legend.shops.paymentAmount}
                                            className="flex-1 px-3 py-2 bg-black text-white border border-[#00FF88] focus:border-green-400 outline-none"
                                        />
                                        <button
                                            onClick={() => setPaymentAmount(Math.min(player.gold, player.activeLoan?.amountOwed || 0).toString())}
                                            className="px-3 py-2 bg-black border border-[#00FF88] text-[#00FF88] hover:bg-gray-700 text-sm"
                                        >
                                            {t.legend.shops.max}
                                        </button>
                                    </div>
                                    <button
                                        onClick={payLoan}
                                        disabled={!paymentAmount || parseInt(paymentAmount) <= 0 || parseInt(paymentAmount) > player.gold}
                                        className="w-full px-4 py-3 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] font-bold hover:bg-[#00BB66] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        💸 {t.legend.shops.makePayment}
                                    </button>
                                </div>
                            )}

                            {/* Loan Warning */}
                            <div className="bg-black border border-red-500 p-3 mb-2 text-sm text-red-400">
                                ⚠️ <strong>{t.legend.shops.loanWarning}</strong> {t.legend.shops.loanWarningText.replace('{threshold}', GAME_CONSTANTS.LOAN_DEFAULT_PENALTY_LEVEL_THRESHOLD.toString())}
                            </div>
                        </div>

                        <div className="bg-black border border-yellow-500 p-3 mb-4 text-sm text-yellow-500">
                            🦎 <em>"{t.legend.shops.gribnakFinanceQuote}"</em>
                        </div>
                    </>
                )}

                {/* GOODS TAB */}
                {activeTab === 'goods' && (
                    <>
                        {/* Turn Bundles */}
                        <div className="bg-black border border-cyan-500 p-4 mb-3">
                            <h3 className="font-bold text-cyan-500 mb-3 flex items-center gap-2">
                                ⚔️ {t.legend.shops.battleTurns}
                                <span className="text-xs text-gray-400">({player.turnsRemaining} {t.legend.shops.remaining})</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {TURN_BUNDLES.map((bundle) => (
                                    <button
                                        key={bundle.turns}
                                        onClick={() => purchaseTurns(bundle)}
                                        disabled={purchasing || player.gold < bundle.cost}
                                        className="bg-black border-2 border-cyan-500 hover:bg-cyan-900 disabled:opacity-50 disabled:cursor-not-allowed p-3 transition-all"
                                    >
                                        <div className="text-2xl mb-1">{bundle.emoji}</div>
                                        <div className="text-cyan-500 font-bold">{bundle.turns} {t.legend.shops.turns}</div>
                                        <div className="text-yellow-500 text-sm mt-1">{bundle.cost} 💰</div>
                                        <div className="text-xs text-gray-500 mt-1">{bundle.name}</div>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3 text-xs text-gray-400">
                                💡 {t.legend.shops.buyTurnsTip}
                            </div>
                        </div>

                        {/* Inventory Bag Upgrades */}
                        <div className="bg-black border border-purple-500 p-4 mb-3">
                            <h3 className="font-bold text-purple-500 mb-3 flex items-center gap-2">
                                🎒 {t.legend.shops.bagUpgrades}
                                <span className="text-xs text-gray-400">({player.maxInventorySlots} {t.legend.shops.slots})</span>
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                {INVENTORY_TIERS.map((tier) => (
                                    <button
                                        key={tier.slots}
                                        onClick={() => purchaseInventoryExpansion(tier)}
                                        disabled={purchasing || player.gold < tier.cost || player.maxInventorySlots >= tier.slots}
                                        className={`bg-black border-2 p-3 hover:bg-purple-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-between ${
                                            player.maxInventorySlots >= tier.slots ? 'border-gray-700' : 'border-purple-500'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-3xl">{tier.emoji}</div>
                                            <div className="text-left">
                                                <div className="text-purple-500 font-bold">{tier.name}</div>
                                                <div className="text-xs text-gray-400">{tier.slots} {t.legend.shops.slots}</div>
                                            </div>
                                        </div>
                                        <div className="text-yellow-500 font-bold text-lg">
                                            {player.maxInventorySlots >= tier.slots ? `✓ ${t.legend.shops.owned}` : `${tier.cost} 💰`}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3 text-xs text-gray-400">
                                💡 {t.legend.shops.bagUpgradesTip}
                            </div>
                        </div>

                        {/* Rare Items Section */}
                        <div className="bg-black border border-purple-500 p-4 mb-3">
                            <h3 className="font-bold text-purple-500 mb-3 flex items-center gap-2">
                                ✨ {t.legend.shops.rareItems}
                                <span className="text-xs text-gray-400">({t.legend.shops.legendaryMythic})</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar">
                                {Object.values(ACCESSORIES)
                                    .filter((item: any) => item.rarity === 'legendary' || item.rarity === 'mythic')
                                    .map((item: any) => {
                                        const isOwned = (player.inventory || []).some(
                                            invItem => invItem.id === item.id && invItem.itemType === 'accessory'
                                        );

                                        return (
                                            <div
                                                key={item.id}
                                                className={`bg-black border-2 p-3 ${
                                                    isOwned ? 'border-blue-500 opacity-50' : 'border-purple-600 opacity-60'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl">{item.emoji}</span>
                                                        <div>
                                                            <div className={`font-bold text-sm ${getRarityColor(item.rarity)}`}>
                                                                {item.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 uppercase">{item.rarity}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-400 mb-2">{item.description}</p>
                                                {item.lore && (
                                                    <p className="text-xs text-gray-500 italic mb-2">"{item.lore}"</p>
                                                )}
                                                {item.bonuses && (
                                                    <div className="text-xs text-gray-400 mb-2">
                                                        {Object.entries(item.bonuses).map(([key, value]: [string, any]) => (
                                                            <div key={key} className="flex justify-between">
                                                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                                                <span className="text-green-400">+{value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="text-center mt-2 text-xs text-gray-500">
                                                    {isOwned ? '✓ OWNED' : '🎁 Rare Drop Only'}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                            <div className="mt-3 text-xs text-gray-400">
                                💡 These rare items cannot be purchased - they must be found by defeating legendary enemies!
                            </div>
                        </div>

                        {/* Goblin's wisdom */}
                        <div className="bg-black border border-yellow-500 p-3 mb-4 text-sm text-yellow-500">
                            🦎 <em>"More bagss, more loot! More turnss, more glory! Gribnak knowss what you need!"</em>
                        </div>
                    </>
                )}

                {/* INVENTORY TAB */}
                {activeTab === 'inventory' && (
                    <>
                        <div className="text-center mb-4 text-purple-500 text-sm">
                            📦 Your personal inventory - Manage items and expand your bag
                        </div>

                        {/* Inventory Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-black border border-purple-500 p-3 text-center">
                                <div className="text-purple-500 text-xl font-bold">{player.inventory?.length || 0}</div>
                                <div className="text-xs text-gray-400">Items</div>
                            </div>
                            <div className="bg-black border border-purple-500 p-3 text-center">
                                <div className="text-purple-500 text-xl font-bold">{player.maxInventorySlots}</div>
                                <div className="text-xs text-gray-400">Max Slots</div>
                            </div>
                            <div className="bg-black border border-purple-500 p-3 text-center">
                                <div className="text-purple-500 text-xl font-bold">
                                    {player.maxInventorySlots - (player.inventory?.length || 0)}
                                </div>
                                <div className="text-xs text-gray-400">Free Slots</div>
                            </div>
                        </div>


                        {/* Legendary Weapon Forge */}
                        {player.inventory && player.inventory.filter(item => item.id === 'legendary_weapon_fragment').length > 0 && (
                            <div className="bg-black border-2 border-yellow-500 p-4 mb-4">
                                <h3 className="font-bold text-yellow-500 mb-3 flex items-center gap-2">
                                    ⚒️ LEGENDARY FORGE
                                </h3>
                                <div className="text-sm text-gray-400 mb-3">
                                    Collect 3 Legendary Weapon Fragments to forge a powerful legendary weapon!
                                </div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl">⚔️</span>
                                        <div>
                                            <div className="text-yellow-500 font-bold">Legendary Weapon Fragments</div>
                                            <div className="text-xs text-gray-400">
                                                Collected: {player.inventory.filter(item => item.id === 'legendary_weapon_fragment').length}/3
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={forgeLegendaryWeapon}
                                        disabled={player.inventory.filter(item => item.id === 'legendary_weapon_fragment').length < 3}
                                        className={`px-4 py-2 border-2 font-bold transition-all ${
                                            player.inventory.filter(item => item.id === 'legendary_weapon_fragment').length >= 3
                                                ? 'bg-yellow-900 border-yellow-500 text-yellow-500 hover:bg-yellow-800'
                                                : 'bg-black border-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                                        }`}
                                    >
                                        ⚒️ FORGE
                                    </button>
                                </div>
                                {player.inventory.filter(item => item.id === 'legendary_weapon_fragment').length >= 3 && (
                                    <div className="text-xs text-yellow-400 animate-pulse">
                                        ✨ Ready to forge! Click the button above to create a legendary weapon!
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Inventory Items */}
                        {player.inventory && player.inventory.length > 0 ? (
                            <div className="bg-black border border-purple-500 p-4 mb-4 max-h-96 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 gap-2">
                                    {player.inventory.map((item, index) => {
                                        const sellPrice = getSellPrice(item);
                                        // Check if item is currently equipped
                                        const isWeaponEquipped = item.itemType === 'weapon' && player.weapon && player.weapon.id === item.id;
                                        const isArmorEquipped = item.itemType === 'armor' && player.armor && player.armor.id === item.id;
                                        const isAccessoryEquipped = item.itemType === 'accessory' && (player.equippedAccessories || []).some(acc => acc.id === item.id);
                                        const isEquipped = isWeaponEquipped || isArmorEquipped || isAccessoryEquipped || item.equipped;

                                        // Check if player can equip (level requirement)
                                        const canEquip = item.itemData?.minLevel ? player.level >= item.itemData.minLevel : true;


                                        return (
                                            <div
                                                key={`${item.id}-${index}`}
                                                className={`bg-black border-2 p-3 ${
                                                    isEquipped ? 'border-green-500' : 'border-gray-600'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`font-bold text-sm ${getRarityColor(item.rarity || 'common')}`}>
                                                                {item.itemData?.name || item.id}
                                                            </span>
                                                            {isEquipped && (
                                                                <span className="text-xs bg-green-900 border border-green-500 text-green-500 px-2 py-0.5 rounded">
                                                                    EQUIPPED
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mb-1">
                                                            Type: <span className="capitalize text-gray-300">{item.itemType}</span>
                                                            {item.quantity && item.quantity > 1 && (
                                                                <span className="ml-2">Qty: <span className="text-white">{item.quantity}</span></span>
                                                            )}
                                                        </div>
                                                        {item.itemData?.description && (
                                                            <div className="text-xs text-gray-500">{item.itemData.description}</div>
                                                        )}
                                                        {item.itemType === 'weapon' && item.itemData?.attackBonus && (
                                                            <div className="text-xs text-red-400 mt-1">⚔️ +{item.itemData.attackBonus} ATK</div>
                                                        )}
                                                        {item.itemType === 'armor' && item.itemData?.defenseBonus && (
                                                            <div className="text-xs text-blue-400 mt-1">🛡️ +{item.itemData.defenseBonus} DEF</div>
                                                        )}
                                                        {item.itemType === 'accessory' && item.itemData?.bonuses && (
                                                            <div className="text-xs text-cyan-400 mt-1 flex flex-wrap gap-2">
                                                                {item.itemData.bonuses.health && <span>❤️ +{item.itemData.bonuses.health} HP</span>}
                                                                {item.itemData.bonuses.strength && <span>💪 +{item.itemData.bonuses.strength} STR</span>}
                                                                {item.itemData.bonuses.defense && <span>🛡️ +{item.itemData.bonuses.defense} DEF</span>}
                                                                {item.itemData.bonuses.luck && <span>🍀 +{item.itemData.bonuses.luck} LCK</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
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
                                                                className={`px-3 py-1 border-2 font-bold text-xs transition-all whitespace-nowrap ${
                                                                    isEquipped
                                                                        ? 'bg-red-900 border-red-500 text-red-500 hover:bg-red-800'
                                                                        : !canEquip
                                                                            ? 'bg-black border-gray-600 text-gray-600 cursor-not-allowed'
                                                                            : 'bg-cyan-900 border-cyan-500 text-cyan-500 hover:bg-cyan-800'
                                                                }`}
                                                                title={!canEquip ? `Level ${item.itemData?.minLevel} required` : ''}
                                                            >
                                                                {isEquipped ? '❌ UNEQUIP' : !canEquip ? '🔒 LOCKED' : '⚔️ EQUIP'}
                                                            </button>
                                                        )}
                                                        {/* Sell button */}
                                                        <button
                                                            onClick={() => sellItem(item, index)}
                                                            disabled={isEquipped || selling}
                                                            className={`px-3 py-1 border-2 font-bold text-xs transition-all whitespace-nowrap ${
                                                                isEquipped || selling
                                                                    ? 'bg-black border-gray-600 text-gray-600 cursor-not-allowed'
                                                                    : 'bg-black border-yellow-500 text-yellow-500 hover:bg-yellow-900'
                                                            }`}
                                                        >
                                                            {selling ? '⏳ SELLING...' : `💰 SELL\n${sellPrice}g`}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-black border border-gray-600 p-8 mb-4 text-center">
                                <div className="text-4xl mb-2">📦</div>
                                <div className="text-gray-400">Your inventory is empty!</div>
                                <div className="text-xs text-gray-500 mt-2">
                                    Defeat enemies to collect loot or check out the GOODS tab for rare items info.
                                </div>
                            </div>
                        )}


                        {/* Goblin's wisdom */}
                        <div className="bg-black border border-yellow-500 p-3 mb-4 text-sm text-yellow-500">
                            🦎 <em>"Gribnak buys your junk for fair prices, yesss! Rare items worth many gold. Forge fragments into legendary weapons at my shop!"</em>
                        </div>
                    </>
                )}

                {/* WEAPONS TAB */}
                {activeTab === 'weapons' && (
                    <>
                        <div className="text-center mb-4 text-red-500 text-sm">
                            ⚔️ Browse Gribnak's weapon collection - Upgrade your arsenal!
                        </div>

                        {/* Current Weapon */}
                        {player.weapon && (
                            <div className="bg-black border-2 border-red-500 p-4 mb-4">
                                <h3 className="text-red-500 font-bold mb-2">{t.legend.shops.currentlyEquipped}</h3>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className={`font-bold ${getRarityColor(player.weapon.rarity)}`}>
                                            {player.weapon.name}
                                        </div>
                                        <div className="text-sm text-gray-400">{player.weapon.description}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-red-400 font-bold">+{player.weapon.attackBonus} ATK</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Weapons Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {Object.values(WEAPONS).map((weapon) => {
                                const canAfford = player.gold >= weapon.price;
                                const canUse = player.level >= weapon.minLevel;
                                const isEquipped = player.weapon?.id === weapon.id;
                                const isOwned = (player.inventory || []).some(item => item.id === weapon.id && item.itemType === 'weapon');

                                return (
                                    <div
                                        key={weapon.id}
                                        className={`bg-black border-2 p-4 ${isEquipped
                                            ? 'border-red-500'
                                            : isOwned
                                                ? 'border-blue-500'
                                                : canAfford && canUse
                                                    ? 'border-yellow-500'
                                                    : 'border-gray-600 opacity-60'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className={`font-bold ${getRarityColor(weapon.rarity)}`}>
                                                    {weapon.name}
                                                </div>
                                                <div className="text-xs text-gray-400">Level {weapon.minLevel}+</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-red-400 font-bold">+{weapon.attackBonus}</div>
                                                <div className="text-xs text-gray-400">ATK</div>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-300 mb-3">{weapon.description}</p>

                                        <div className="flex justify-between items-center">
                                            <div className="text-yellow-500 font-bold">{weapon.price} 💰</div>
                                            {isEquipped ? (
                                                <div className="px-3 py-1 bg-red-900 border border-red-500 text-red-500 text-sm font-bold">
                                                    {t.legend.shops.equipped}
                                                </div>
                                            ) : isOwned ? (
                                                <div className="px-3 py-1 bg-blue-900 border border-blue-500 text-blue-500 text-sm font-bold">
                                                    OWNED
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => buyWeapon(weapon)}
                                                    disabled={!canAfford || !canUse || purchasing}
                                                    className={`px-4 py-2 border-2 font-bold text-sm transition-all ${canAfford && canUse
                                                        ? 'bg-yellow-900 border-yellow-500 text-yellow-500 hover:bg-yellow-800'
                                                        : 'bg-black border-gray-600 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {purchasing ? '⏳ Processing...' : !canUse ? t.legend.shops.levelTooLow : !canAfford ? t.legend.shops.tooExpensive : t.legend.shops.buy}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Goblin's wisdom */}
                        <div className="bg-black border border-yellow-500 p-3 mb-4 text-sm text-yellow-500">
                            🦎 <em>"Finest blades in all the realm, yesss! Gribnak knows quality when he sees it!"</em>
                        </div>
                    </>
                )}

                {/* ARMOR TAB */}
                {activeTab === 'armor' && (
                    <>
                        <div className="text-center mb-4 text-cyan-500 text-sm">
                            🛡️ Browse Gribnak's armor collection - Protect yourself!
                        </div>

                        {/* Current Armor */}
                        {player.armor && (
                            <div className="bg-black border-2 border-cyan-500 p-4 mb-4">
                                <h3 className="text-cyan-500 font-bold mb-2">{t.legend.shops.currentlyEquipped}</h3>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className={`font-bold ${getRarityColor(player.armor.rarity)}`}>
                                            {player.armor.name}
                                        </div>
                                        <div className="text-sm text-gray-400">{player.armor.description}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-blue-400 font-bold">+{player.armor.defenseBonus} DEF</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Armor Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {Object.values(ARMOR).map((armor) => {
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
                                                    {armor.name}
                                                </div>
                                                <div className="text-xs text-gray-400">Level {armor.minLevel}+</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-blue-400 font-bold">+{armor.defenseBonus}</div>
                                                <div className="text-xs text-gray-400">DEF</div>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-300 mb-3">{armor.description}</p>

                                        <div className="flex justify-between items-center">
                                            <div className="text-yellow-500 font-bold">{armor.price} 💰</div>
                                            {isEquipped ? (
                                                <div className="px-3 py-1 bg-cyan-900 border border-cyan-500 text-cyan-500 text-sm font-bold">
                                                    {t.legend.shops.equipped}
                                                </div>
                                            ) : isOwned ? (
                                                <div className="px-3 py-1 bg-blue-900 border border-blue-500 text-blue-500 text-sm font-bold">
                                                    OWNED
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => buyArmor(armor)}
                                                    disabled={!canAfford || !canUse || purchasing}
                                                    className={`px-4 py-2 border-2 font-bold text-sm transition-all ${canAfford && canUse
                                                        ? 'bg-yellow-900 border-yellow-500 text-yellow-500 hover:bg-yellow-800'
                                                        : 'bg-black border-gray-600 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {purchasing ? '⏳ Processing...' : !canUse ? t.legend.shops.levelTooLow : !canAfford ? t.legend.shops.tooExpensive : t.legend.shops.buy}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Goblin's wisdom */}
                        <div className="bg-black border border-yellow-500 p-3 mb-4 text-sm text-yellow-500">
                            🦎 <em>"Best protection gold can buy, yesss! Don't go into battle unarmored, friend!"</em>
                        </div>
                    </>
                )}

                {/* NPCs TAB */}
                {activeTab === 'npcs' && (
                    <>
                        <div className="bg-black border border-orange-500 p-4 mb-4">
                            <h2 className="text-2xl font-bold text-orange-500 mb-4 text-center">
                                👥 People at the Bank
                            </h2>
                            <p className="text-gray-400 text-sm text-center mb-6">
                                Talk to NPCs to receive quests, information, and opportunities.
                            </p>

                            {/* NPC: Gribnak */}
                            <div className="bg-black border-2 border-yellow-500 p-4 mb-4">
                                <div className="flex items-start gap-4">
                                    <div className="text-5xl">🦎</div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-yellow-500 mb-1">
                                            {AI_PERSONALITIES.gribnak_shopkeeper?.name || 'Gribnak'}
                                        </h3>
                                        <p className="text-xs text-gray-400 mb-2">Merchant • Shopkeeper</p>
                                        <p className="text-sm text-gray-300 mb-3 italic">
                                            {AI_PERSONALITIES.gribnak_shopkeeper?.baseDialogue?.[0] ||
                                             "Ssssalutations! What can Gribnak get for you today?"}
                                        </p>
                                        <div className="text-xs text-gray-500">
                                            💡 Visit other tabs to shop for weapons, armor, goods, and banking services.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* NPC: Vex the Liquidator */}
                            <div className="bg-black border-2 border-orange-500 p-4 mb-4">
                                <div className="flex items-start gap-4">
                                    <div className="text-5xl">⚡</div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-orange-500 mb-1">
                                            {AI_PERSONALITIES.vex_liquidator?.name || 'Vex the Liquidator'}
                                        </h3>
                                        <p className="text-xs text-gray-400 mb-2">DeFi Enforcer • Quest Giver</p>
                                        <p className="text-sm text-gray-300 mb-3 italic">
                                            {AI_PERSONALITIES.vex_liquidator?.baseDialogue?.[0] ||
                                             "Collateral ratios don't lie, lizard. Someone's underwater."}
                                        </p>

                                        {/* Available Quests */}
                                        <div className="mt-4">
                                            <div className="text-xs font-bold text-orange-500 mb-2">📜 AVAILABLE QUESTS:</div>

                                            {/* The Liquidation Protocol Quest */}
                                            {(() => {
                                                const quest = LEVEL_1_10_QUESTS.quest_loan_shark_collection;
                                                const meetsLevel = player.level >= (quest.requirements.minLevel || 0);
                                                const isActive = activeQuests?.some((aq: any) => aq.questId === quest.id);

                                                return (
                                                    <div className={`bg-black border-2 p-3 mb-2 ${
                                                        isActive ? 'border-green-500' :
                                                        meetsLevel ? 'border-orange-500' :
                                                        'border-gray-600 opacity-60'
                                                    }`}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <div className="font-bold text-orange-500 flex items-center gap-2">
                                                                    {isActive && '✅ '}
                                                                    {quest.title}
                                                                    {quest.repeatable && ' 🔄'}
                                                                </div>
                                                                <div className="text-xs text-gray-400">
                                                                    Level {quest.requirements.minLevel}+ • {quest.difficulty.toUpperCase()} • {quest.type.toUpperCase()}
                                                                </div>
                                                            </div>
                                                            {!meetsLevel && (
                                                                <div className="text-xs bg-red-900 border border-red-500 text-red-500 px-2 py-1">
                                                                    LOCKED
                                                                </div>
                                                            )}
                                                            {isActive && (
                                                                <div className="text-xs bg-green-900 border border-green-500 text-green-500 px-2 py-1">
                                                                    ACTIVE
                                                                </div>
                                                            )}
                                                        </div>

                                                        <p className="text-xs text-gray-300 mb-2">{quest.description}</p>
                                                        <p className="text-xs text-gray-400 italic mb-3">{quest.lore}</p>

                                                        <div className="text-xs text-gray-400 mb-2">
                                                            <strong className="text-orange-500">Rewards:</strong> {quest.rewards.gold} 💰 • {quest.rewards.experience} XP
                                                        </div>

                                                        {meetsLevel && !isActive && (
                                                            <button
                                                                onClick={() => handleAcceptQuest(quest.id)}
                                                                disabled={acceptingQuest}
                                                                className="w-full mt-2 px-3 py-2 bg-orange-900 border-2 border-orange-500 text-orange-500 font-bold hover:bg-orange-800 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {acceptingQuest ? '⏳ ACCEPTING...' : 'ACCEPT QUEST'}
                                                            </button>
                                                        )}

                                                        {isActive && (
                                                            <div className="text-xs text-green-400 mt-2">
                                                                ✅ Quest is active! Check your Quest Log for progress.
                                                            </div>
                                                        )}

                                                        {!meetsLevel && (
                                                            <div className="text-xs text-red-400 mt-2">
                                                                ❌ Requires Level {quest.requirements.minLevel}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black border border-orange-500 p-3 mb-4 text-sm text-orange-500">
                                ⚡ <em>"The protocol must be enforced. Help me liquidate underwater positions for a generous commission."</em>
                            </div>
                        </div>
                    </>
                )}

                {/* Close */}
                <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-black border-2 border-gray-600 text-gray-400 hover:bg-black font-bold"
                >
                    [ESC] {t.legend.shops.leave}
                </button>
                </motion.div>
            </motion.div>
        </>
    );

    return (
        <>
            {createPortal(modalContent, document.body)}
            {/* Render ConfirmationModal separately so it appears above GoblinHoard */}
            {createPortal(
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    confirmText={t.legend.shops.sell}
                    cancelText={t.common.cancel}
                    confirmColor="yellow"
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                />,
                document.body
            )}
        </>
    );
};

export default GoblinHoard;
