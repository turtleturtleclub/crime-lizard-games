// @ts-nocheck
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { PlayerCharacter } from '../../types/legend.types';
import { GAME_CONSTANTS } from '../../data/gameData';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModalClose } from '../../hooks/useModalClose';

interface BrothelProps {
    player: PlayerCharacter;
    updatePlayer: (updates: Partial<PlayerCharacter>) => void;
    onClose: () => void;
    setGameMessage: (message: string) => void;
}

const Brothel: React.FC<BrothelProps> = ({ player, updatePlayer, onClose, setGameMessage }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose);

    const { t } = useLanguage();
    const [sleeping, setSleeping] = useState(false);

    // Dynamic pricing based on level (starts scaling at level 5)
    const calculateSleepCost = () => {
        if (player.level < GAME_CONSTANTS.SLEEP_SCALING_STARTS_AT_LEVEL) {
            return GAME_CONSTANTS.BROTHEL_SLEEP_BASE_COST;
        }
        const levelsAboveThreshold = player.level - GAME_CONSTANTS.SLEEP_SCALING_STARTS_AT_LEVEL + 1;
        return GAME_CONSTANTS.BROTHEL_SLEEP_BASE_COST + (levelsAboveThreshold * GAME_CONSTANTS.BROTHEL_SLEEP_LEVEL_MULTIPLIER);
    };

    const sleepCost = calculateSleepCost();
    const canAfford = player.gold >= sleepCost;

    const handleSleep = async () => {
        if (!canAfford) {
            setGameMessage('❌ Not enough gold for the Velvet Embrace!');
            return;
        }

        setSleeping(true);

        try {
            // Call server endpoint to record premium sleep
            const response = await fetch('/api/legend/sleep/brothel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    cost: sleepCost
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Apply bonuses
                const statBonus = data.statBonus || { stat: 'charm', amount: GAME_CONSTANTS.BROTHEL_STAT_BONUS };
                const healthBonus = GAME_CONSTANTS.BROTHEL_HEALTH_BONUS;

                const updates: Partial<PlayerCharacter> = {
                    gold: player.gold - sleepCost,
                    lastSafeSleep: new Date(),
                    sleptSafely: true,
                    health: player.maxHealth + healthBonus,
                    maxHealth: player.maxHealth + healthBonus
                };

                // Apply stat bonus
                if (statBonus.stat === 'strength') {
                    updates.strength = player.strength + statBonus.amount;
                } else if (statBonus.stat === 'defense') {
                    updates.defense = player.defense + statBonus.amount;
                } else if (statBonus.stat === 'charm') {
                    updates.charm = player.charm + statBonus.amount;
                }

                updatePlayer(updates);

                setGameMessage(
                    `💋 A night of luxury! ` +
                    `Health fully restored + ${healthBonus} max HP! ` +
                    `+${statBonus.amount} ${statBonus.stat.toUpperCase()}! ` +
                    `Protected from gankers! 🌹`
                );

                setTimeout(() => {
                    onClose();
                }, 3000);
            } else {
                setGameMessage('❌ Failed to rest at the brothel. Try again.');
            }
        } catch (error) {
            console.error('Sleep error:', error);
            setGameMessage('❌ Error resting at brothel. Please try again.');
        } finally {
            setSleeping(false);
        }
    };

    const modalContent = (

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 overscroll-none z-modal"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border-2 border-pink-500 p-4 md:p-6 max-w-3xl w-full h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto overflow-x-hidden font-bbs pb-safe-bottom"
                style={{ touchAction: 'pan-y' }}
            >
                {/* Header */}
                <div className="text-pink-500 text-center mb-4 text-glow-pink">
                    <div className="text-2xl font-bold">💋  VIOLET'S VELVET EMBRACE 💋</div>
                    <div className="text-sm mt-2 text-pink-300 italic">"Luxury Rest for Legends"</div>
                </div>

                {/* Brothel Image Ad */}
                <div className="mb-4 border-2 border-pink-500/30 rounded overflow-hidden max-w-xs md:max-w-sm mx-auto">
                    <img
                        src="/assets/violetsAd.jpg"
                        alt="Violet's Velvet Embrace"
                        className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity"
                    />
                </div>

                <div className="text-center mb-6 text-pink-300 text-sm">
                    {t.legend.sleep.brothelDescription}
                </div>

                {/* Premium Benefits */}
                <div className="bg-black border border-pink-500 p-4 mb-4">
                    <h3 className="font-bold text-pink-500 mb-4 text-center">✨ {t.legend.sleep.premiumBenefits}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-black border border-pink-500 p-4">
                            <div className="text-3xl mb-2">🛡️</div>
                            <h4 className="font-bold text-white mb-1">{t.legend.sleep.maxProtection}</h4>
                            <p className="text-sm text-pink-300">
                                {t.legend.sleep.safeFromGankers}
                            </p>
                        </div>
                        <div className="bg-black border border-pink-500 p-4">
                            <div className="text-3xl mb-2">💪</div>
                            <h4 className="font-bold text-white mb-1">{t.legend.sleep.statBoost}</h4>
                            <p className="text-sm text-pink-300">
                                +{GAME_CONSTANTS.BROTHEL_STAT_BONUS} {t.legend.sleep.randomStat}
                            </p>
                        </div>
                        <div className="bg-black border border-pink-500 p-4">
                            <div className="text-3xl mb-2">❤️</div>
                            <h4 className="font-bold text-white mb-1">{t.legend.sleep.healthBonus}</h4>
                            <p className="text-sm text-pink-300">
                                +{GAME_CONSTANTS.BROTHEL_HEALTH_BONUS} {t.legend.sleep.maxHPPermanently}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Services Description */}
                <div className="bg-black border-2 border-pink-500 p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <span className="text-3xl">🌹</span>
                        <div>
                            <h3 className="font-bold text-pink-500 mb-1">🎭 {t.legend.sleep.luxuryServices}</h3>
                            <p className="text-sm text-pink-300">
                                {t.legend.sleep.servicesDescription}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-black border-2 border-pink-500 p-4 mb-4 text-center">
                    <div className="text-2xl font-bold text-yellow-500 mb-2">
                        💰 {sleepCost} {t.legend.sleep.goldPerNight}
                    </div>
                    {player.level >= GAME_CONSTANTS.SLEEP_SCALING_STARTS_AT_LEVEL && (
                        <p className="text-xs text-gray-500 mb-1">
                            (Base {GAME_CONSTANTS.BROTHEL_SLEEP_BASE_COST} + Level {player.level} Premium)
                        </p>
                    )}
                    <p className="text-sm text-gray-400 mb-2">
                        {t.legend.sleep.yourGold}: <span className={canAfford ? 'text-[#00FF88]' : 'text-red-400'}>{player.gold}</span>
                    </p>
                    <p className="text-xs text-pink-400">
                        {t.legend.sleep.worthIt} 💎
                    </p>
                </div>

                {/* Sleep Button */}
                <button
                    onClick={handleSleep}
                    disabled={!canAfford || sleeping}
                    className="w-full py-4 bg-pink-900 border-2 border-pink-500 text-pink-500 font-bold hover:bg-pink-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg mb-4"
                >
                    {sleeping ? `💋 ${t.legend.sleep.enjoyingLuxury}...` : `💋 ${t.legend.sleep.restAtBrothel} (${sleepCost} ${t.legend.stats.gold})`}
                </button>

                {/* Comparison */}
                <div className="bg-black border border-gray-600 p-3 mb-4 text-sm text-gray-400">
                    💡 <strong>{t.legend.sleep.budgetOption}:</strong> {t.legend.sleep.innComparison.replace('{cost}', (
                        player.level < GAME_CONSTANTS.SLEEP_SCALING_STARTS_AT_LEVEL
                            ? GAME_CONSTANTS.INN_SLEEP_BASE_COST
                            : GAME_CONSTANTS.INN_SLEEP_BASE_COST + ((player.level - GAME_CONSTANTS.SLEEP_SCALING_STARTS_AT_LEVEL + 1) * GAME_CONSTANTS.INN_SLEEP_LEVEL_MULTIPLIER)
                    ).toString())}
                </div>

                {/* Close */}
                <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-black border-2 border-gray-600 text-gray-400 hover:bg-black font-bold"
                >
                    [ESC] {t.legend.sleep.leaveBrothel}
                </button>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default Brothel;
