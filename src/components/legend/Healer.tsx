import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { PlayerCharacter } from '../../types/legend.types';
import { GAME_CONSTANTS } from '../../data/gameData';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModalClose } from '../../hooks/useModalClose';

interface HealerProps {
    player: PlayerCharacter;
    updatePlayer: (updates: Partial<PlayerCharacter>) => void;
    onClose: () => void;
    setGameMessage: (message: string) => void;
}

const Healer: React.FC<HealerProps> = ({ player, updatePlayer, onClose, setGameMessage }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose);

    const { t } = useLanguage();
    const [healAmount, setHealAmount] = useState(10);
    const [isHealing, setIsHealing] = useState(false);

    const hpMissing = player.maxHealth - player.health;
    const healCost = Math.floor(healAmount * GAME_CONSTANTS.HEALER_COST_PER_HP);
    const maxHeal = Math.min(hpMissing, Math.floor(player.gold / GAME_CONSTANTS.HEALER_COST_PER_HP));

    const heal = async () => {
        if (isHealing) return; // Prevent double-clicks

        if (hpMissing === 0) {
            setGameMessage(t.legend.shops.alreadyFullHealth);
            return;
        }

        if (player.gold < healCost) {
            setGameMessage(t.legend.shops.notEnoughGoldHealing);
            return;
        }

        const actualHeal = Math.min(healAmount, hpMissing);
        const actualCost = Math.floor(actualHeal * GAME_CONSTANTS.HEALER_COST_PER_HP);

        setIsHealing(true);

        try {
            // Call backend API to heal (database-first, then syncs to blockchain)
            const response = await fetch('/api/legend/heal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    healAmount: actualHeal,
                    cost: actualCost
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Update local state with new health AND gold from backend response
                updatePlayer({
                    health: data.health,
                    maxHealth: data.maxHealth,
                    gold: data.gold
                });

                setGameMessage(t.legend.shops.healedMessage.replace('{hp}', actualHeal.toString()).replace('{cost}', actualCost.toString()));

                if (data.health >= data.maxHealth) {
                    setTimeout(onClose, 1000);
                }
            } else {
                setGameMessage(`❌ ${data.error || 'Failed to heal'}`);
            }
        } catch (error) {
            console.error('Healing error:', error);
            setGameMessage('❌ Error healing. Please try again.');
        } finally {
            setIsHealing(false);
        }
    };

    const fullHeal = async () => {
        if (isHealing) return; // Prevent double-clicks

        if (hpMissing === 0) {
            setGameMessage(t.legend.shops.alreadyFullHealth);
            return;
        }

        const cost = Math.floor(hpMissing * GAME_CONSTANTS.HEALER_COST_PER_HP);

        if (player.gold < cost) {
            setGameMessage(t.legend.shops.notEnoughGoldFullHealing);
            return;
        }

        setIsHealing(true);

        try {
            // Call backend API to heal (database-first, then syncs to blockchain)
            const response = await fetch('/api/legend/heal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    healAmount: hpMissing,
                    cost: cost
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Update local state with new health AND gold from backend response
                updatePlayer({
                    health: data.health,
                    maxHealth: data.maxHealth,
                    gold: data.gold
                });

                setGameMessage(t.legend.shops.fullyHealedMessage.replace('{cost}', cost.toString()));
                setTimeout(onClose, 1000);
            } else {
                setGameMessage(`❌ ${data.error || 'Failed to heal'}`);
            }
        } catch (error) {
            console.error('Full healing error:', error);
            setGameMessage('❌ Error healing. Please try again.');
        } finally {
            setIsHealing(false);
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
                className="bg-black border-2 border-[#00FF88] p-4 md:p-6 max-w-2xl w-full h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto overflow-x-hidden font-bbs pb-safe-bottom"
                style={{ touchAction: 'pan-y' }}
            >
                {/* Header */}
                <div className="text-[#00FF88] text-center mb-4 text-glow-green">
                    <div className="text-2xl font-bold">⚕️  {t.legend.shops.healerTitle.toUpperCase()} ⚕️</div>
                </div>
                <div className="text-center mb-6 text-gray-400 text-sm">
                    {t.legend.shops.healerSubtitle}
                </div>

                {/* Health Status */}
                <div className="bg-black border border-[#00FF88] p-4 mb-4">
                    <div className="flex justify-between mb-2">
                        <span className="text-[#00FF88]">{t.legend.shops.currentHealth}</span>
                        <span className="text-red-400 font-bold">{player.health} / {player.maxHealth}</span>
                    </div>
                    <div className="h-6 bg-black border border-[#00FF88] relative">
                        <motion.div
                            className="h-full bg-[#00FF88]"
                            initial={{ width: `${(player.health / player.maxHealth) * 100}%` }}
                            animate={{ width: `${(player.health / player.maxHealth) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                            {player.health} / {player.maxHealth}
                        </div>
                    </div>
                    <div className="mt-2 text-center text-sm text-gray-400">
                        {hpMissing === 0 ? t.legend.shops.fullHealth : t.legend.shops.needHP.replace('{hp}', hpMissing.toString())}
                    </div>
                </div>

                {/* Healing Options */}
                <div className="space-y-3 mb-4">
                    <div className="bg-black border border-[#00FF88] p-4">
                        <h3 className="font-bold text-[#00FF88] mb-3">{t.legend.shops.partialHeal}</h3>
                        <div className="flex items-center gap-3 mb-3">
                            <button
                                onClick={() => setHealAmount(Math.max(1, healAmount - 10))}
                                className="px-3 py-1 bg-black border border-[#00FF88] text-[#00FF88] hover:bg-gray-700 font-bold"
                            >
                                -10
                            </button>
                            <input
                                type="range"
                                min="1"
                                max={maxHeal}
                                value={Math.min(healAmount, maxHeal)}
                                onChange={(e) => setHealAmount(parseInt(e.target.value))}
                                className="flex-1"
                            />
                            <button
                                onClick={() => setHealAmount(Math.min(maxHeal, healAmount + 10))}
                                className="px-3 py-1 bg-black border border-[#00FF88] text-[#00FF88] hover:bg-gray-700 font-bold"
                            >
                                +10
                            </button>
                        </div>
                        <div className="text-center text-sm mb-3">
                            <span className="text-[#00FF88]">+{Math.min(healAmount, hpMissing)} HP</span>
                            {' '}{t.legend.shops.forText}{' '}
                            <span className="text-yellow-500">{Math.floor(Math.min(healAmount, hpMissing) * GAME_CONSTANTS.HEALER_COST_PER_HP)} {t.legend.stats.gold.toLowerCase()}</span>
                        </div>
                        <button
                            onClick={heal}
                            disabled={hpMissing === 0 || player.gold < healCost || isHealing}
                            className="w-full px-4 py-3 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00BB66] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isHealing ? '⏳ Healing...' : t.legend.shops.heal}
                        </button>
                    </div>

                    <div className="bg-black border border-cyan-500 p-4">
                        <h3 className="font-bold text-cyan-500 mb-3">{t.legend.shops.fullHeal}</h3>
                        <div className="text-center text-sm mb-3">
                            <span className="text-[#00FF88]">+{hpMissing} HP</span>
                            {' '}{t.legend.shops.forText}{' '}
                            <span className="text-yellow-500">{Math.floor(hpMissing * GAME_CONSTANTS.HEALER_COST_PER_HP)} {t.legend.stats.gold.toLowerCase()}</span>
                        </div>
                        <button
                            onClick={fullHeal}
                            disabled={hpMissing === 0 || player.gold < Math.floor(hpMissing * GAME_CONSTANTS.HEALER_COST_PER_HP) || isHealing}
                            className="w-full px-4 py-3 bg-cyan-900 border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-800 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isHealing ? '⏳ Healing...' : t.legend.shops.fullHeal}
                        </button>
                    </div>
                </div>

                {/* Info */}
                <div className="bg-black border border-gray-700 p-3 mb-4 text-sm">
                    <div className="text-[#00FF88] mb-1">
                        💡 {t.legend.shops.healingRate} {GAME_CONSTANTS.HEALER_COST_PER_HP} {t.legend.shops.goldPerHP}
                    </div>
                    <div className="text-gray-400">
                        {t.legend.shops.yourGold} <span className="text-yellow-500 font-bold">{player.gold}</span>
                    </div>
                </div>

                {/* Close */}
                <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-black border-2 border-gray-600 text-gray-400 hover:bg-black font-bold"
                >
                    [ESC] {t.legend.shops.leave}
                </button>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default Healer;
