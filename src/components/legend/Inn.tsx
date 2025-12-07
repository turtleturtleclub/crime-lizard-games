import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { PlayerCharacter } from '../../types/legend.types';
import { GAME_CONSTANTS } from '../../data/gameData';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModalClose } from '../../hooks/useModalClose';

interface InnProps {
    player: PlayerCharacter;
    updatePlayer: (updates: Partial<PlayerCharacter>) => void;
    onClose: () => void;
    setGameMessage: (message: string) => void;
}

const Inn: React.FC<InnProps> = ({ player, updatePlayer, onClose, setGameMessage }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose);

    const { t } = useLanguage();
    const [sleeping, setSleeping] = useState(false);

    // Dynamic pricing based on level (starts scaling at level 5)
    const calculateSleepCost = () => {
        if (player.level < GAME_CONSTANTS.SLEEP_SCALING_STARTS_AT_LEVEL) {
            return GAME_CONSTANTS.INN_SLEEP_BASE_COST;
        }
        const levelsAboveThreshold = player.level - GAME_CONSTANTS.SLEEP_SCALING_STARTS_AT_LEVEL + 1;
        return GAME_CONSTANTS.INN_SLEEP_BASE_COST + (levelsAboveThreshold * GAME_CONSTANTS.INN_SLEEP_LEVEL_MULTIPLIER);
    };

    const sleepCost = calculateSleepCost();
    const canAfford = player.gold >= sleepCost;

    const handleSleep = async () => {
        if (!canAfford) {
            setGameMessage(t.legend.messages.notEnoughGold);
            return;
        }

        setSleeping(true);

        try {
            // Call server endpoint to record safe sleep
            const response = await fetch('/api/legend/sleep/inn', {
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
                // Update player locally
                updatePlayer({
                    gold: player.gold - sleepCost,
                    lastSafeSleep: new Date(),
                    sleptSafely: true,
                    health: player.maxHealth // Full heal on sleep
                });

                setGameMessage(`💤 ${t.legend.messages.sleepSuccess} ${t.legend.messages.protected} ${t.legend.sleep.fullHeal}.`);

                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setGameMessage('❌ Failed to sleep at inn. Try again.');
            }
        } catch (error) {
            console.error('Sleep error:', error);
            setGameMessage('❌ Error sleeping at inn. Please try again.');
        } finally {
            setSleeping(false);
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
                className="bg-black border-2 border-[#00FF88] p-4 md:p-6 max-w-3xl w-full h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto overflow-x-hidden font-bbs pb-safe-bottom"
                style={{ touchAction: 'pan-y' }}
            >
                {/* Header */}
                <div className="text-[#00FF88] text-center mb-4 text-glow-green">
                    <div className="text-2xl font-bold">🏨  THE RUSTY DAGGER INN 🏨</div>
                    <div className="text-sm mt-2 text-gray-400 italic">"Safe Sleep for Smart Thieves"</div>
                </div>

                {/* Inn Image Ad */}
                <div className="mb-4 border-2 border-[#00FF88]/30 rounded overflow-hidden max-w-xs md:max-w-sm mx-auto">
                    <img
                        src="/assets/innAd.jpg"
                        alt="The Rusty Dagger Inn"
                        className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity"
                    />
                </div>

                <div className="text-center mb-6 text-gray-400 text-sm">
                    {t.legend.sleep.innDescription}
                </div>

                {/* Warning Banner */}
                <div className="bg-black border-2 border-red-500 p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <span className="text-3xl">⚠️</span>
                        <div>
                            <h3 className="font-bold text-red-500 mb-1">🌙 {t.legend.sleep.dangerWarning}</h3>
                            <p className="text-sm text-gray-300">
                                {t.legend.sleep.gankedWarning}
                                {' '}You could lose {GAME_CONSTANTS.GANKING_GOLD_LOSS_MIN * 100}%-
                                {GAME_CONSTANTS.GANKING_GOLD_LOSS_MAX * 100}% of your carried gold!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sleep Info */}
                <div className="bg-black border border-[#00FF88] p-4 mb-4">
                    <h3 className="font-bold text-[#00FF88] mb-4 text-center">💤 {t.legend.sleep.benefits}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-black border border-[#00FF88] p-4">
                            <div className="text-3xl mb-2">🛡️</div>
                            <h4 className="font-bold text-white mb-1">{t.legend.sleep.protection}</h4>
                            <p className="text-sm text-gray-400">
                                {t.legend.messages.protected}
                            </p>
                        </div>
                        <div className="bg-black border border-[#00FF88] p-4">
                            <div className="text-3xl mb-2">❤️</div>
                            <h4 className="font-bold text-white mb-1">{t.legend.sleep.fullHeal}</h4>
                            <p className="text-sm text-gray-400">
                                {t.legend.shops.healthRestored}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-black border-2 border-[#00FF88] p-4 mb-4 text-center">
                    <div className="text-2xl font-bold text-yellow-500 mb-2">
                        💰 {sleepCost} {t.legend.stats.gold}
                    </div>
                    {player.level >= GAME_CONSTANTS.SLEEP_SCALING_STARTS_AT_LEVEL && (
                        <p className="text-xs text-gray-500 mb-1">
                            (Base {GAME_CONSTANTS.INN_SLEEP_BASE_COST} + Level {player.level} Premium)
                        </p>
                    )}
                    <p className="text-sm text-gray-400">
                        {t.legend.shops.yourGold} <span className={canAfford ? 'text-[#00FF88]' : 'text-red-400'}>{player.gold}</span>
                    </p>
                </div>

                {/* Sleep Button */}
                <button
                    onClick={handleSleep}
                    disabled={!canAfford || sleeping}
                    className="w-full py-4 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] font-bold hover:bg-[#00BB66] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg mb-4"
                >
                    {sleeping ? '💤 Resting...' : `💤 ${t.legend.sleep.sleepAtInn} (${sleepCost} ${t.legend.stats.gold.toLowerCase()})`}
                </button>

                {/* Comparison */}
                <div className="bg-black border border-purple-500 p-3 mb-4 text-sm text-purple-400">
                    💡 {t.legend.sleep.brothelDescription} ({
                        player.level < GAME_CONSTANTS.SLEEP_SCALING_STARTS_AT_LEVEL
                            ? GAME_CONSTANTS.BROTHEL_SLEEP_BASE_COST
                            : GAME_CONSTANTS.BROTHEL_SLEEP_BASE_COST + ((player.level - GAME_CONSTANTS.SLEEP_SCALING_STARTS_AT_LEVEL + 1) * GAME_CONSTANTS.BROTHEL_SLEEP_LEVEL_MULTIPLIER)
                    } {t.legend.stats.gold.toLowerCase()})!
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

export default Inn;
