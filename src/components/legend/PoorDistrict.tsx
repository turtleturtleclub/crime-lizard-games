import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { PlayerCharacter } from '../../types/legend.types';
import { GAME_CONSTANTS } from '../../data/gameData';
import { useLanguage } from '../../contexts/LanguageContext';
import { useQuests } from '../../contexts/QuestContext';
import { useModalClose } from '../../hooks/useModalClose';

interface PoorDistrictProps {
    player: PlayerCharacter;
    updatePlayer: (updates: Partial<PlayerCharacter>) => void;
    onClose: () => void;
    setGameMessage: (message: string) => void;
}

const PoorDistrict: React.FC<PoorDistrictProps> = ({ player, updatePlayer, onClose, setGameMessage }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose);

    const { t } = useLanguage();
    const { activeQuests, updateQuestProgress } = useQuests();
    const [donationAmount, setDonationAmount] = useState('');
    const [isDonating, setIsDonating] = useState(false);

    const donate = async () => {
        const amount = parseInt(donationAmount);

        if (isNaN(amount) || amount < GAME_CONSTANTS.POOR_DISTRICT_DONATION_MIN) {
            setGameMessage(t.legend.poorDistrict.minDonation.replace('{min}', GAME_CONSTANTS.POOR_DISTRICT_DONATION_MIN.toString()));
            return;
        }

        if (amount > player.gold) {
            setGameMessage(t.legend.poorDistrict.notEnoughGold);
            return;
        }

        setIsDonating(true);

        try {
            // Call backend API to process donation (database-first with blockchain sync)
            const response = await fetch('/api/legend/donate-to-poor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    amount
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setGameMessage(data.error || 'Failed to process donation');
                return;
            }

            // Update local state with server response
            updatePlayer({
                gold: data.gold,
                goldGivenToPoor: data.goldGivenToPoor,
                experience: data.experience,
                charm: data.charm
            });

            // Update quest progress if player has The Degen Robin Hood quest active
            const robinHoodQuest = activeQuests.find(q => q.questId === 'quest_robin_hood_dilemma');
            if (robinHoodQuest) {
                try {
                    await updateQuestProgress('quest_robin_hood_dilemma', 'path_a_donate', amount);
                    setGameMessage(t.legend.poorDistrict.donatedSuccess.replace('{amount}', amount.toString()).replace('{xp}', data.expBonus.toString()) + ' 📜 Quest progress updated!');
                } catch (error) {
                    console.error('❌ Failed to update quest progress:', error);
                    setGameMessage(t.legend.poorDistrict.donatedSuccess.replace('{amount}', amount.toString()).replace('{xp}', data.expBonus.toString()));
                }
            } else {
                setGameMessage(t.legend.poorDistrict.donatedSuccess.replace('{amount}', amount.toString()).replace('{xp}', data.expBonus.toString()));
            }

            setDonationAmount('');

        } catch (error) {
            console.error('❌ Donation error:', error);
            setGameMessage('Failed to process donation. Please try again.');
        } finally {
            setIsDonating(false);
        }
    };

    const modalContent = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 overscroll-none"
            style={{ zIndex: 9999 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border-2 border-[#FFD700] p-4 md:p-8 max-w-md w-full font-bbs"
            >
                <div className="text-center mb-6">
                    <div className="text-6xl mb-4">💀</div>
                    <h2 className="text-3xl font-bold text-[#FFD700] text-glow-gold mb-2">{t.legend.poorDistrict.title}</h2>
                    <p className="text-gray-400 text-sm">{t.legend.poorDistrict.subtitle}</p>
                </div>

                {/* Story Text */}
                <div className="bg-black border border-gray-700 p-4 mb-6 text-gray-300 text-sm leading-relaxed">
                    <p className="mb-3">
                        {t.legend.poorDistrict.storyPart1}
                    </p>
                    <p className="text-[#00FF88] italic">
                        {t.legend.poorDistrict.storyPart2}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-black border border-[#00FF88] p-3 text-center">
                        <div className="text-[#00FF88] text-xl font-bold text-glow-green">{player.goldGivenToPoor.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">{t.legend.poorDistrict.totalGiven}</div>
                    </div>
                    <div className="bg-black border border-blue-500 p-3 text-center">
                        <div className="text-blue-400 text-xl font-bold">{player.charm}</div>
                        <div className="text-xs text-gray-400">{t.legend.poorDistrict.charm}</div>
                    </div>
                </div>

                {/* Donation */}
                <div className="bg-black border-2 border-[#FFD700] p-4 mb-6">
                    <h3 className="font-bold text-[#FFD700] text-glow-gold mb-3 text-center">{t.legend.poorDistrict.donateToPoor}</h3>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="number"
                            value={donationAmount}
                            onChange={(e) => setDonationAmount(e.target.value)}
                            placeholder={`Min ${GAME_CONSTANTS.POOR_DISTRICT_DONATION_MIN}`}
                            className="flex-1 px-3 py-2 bg-black text-[#00FF88] border-2 border-[#00FF88] focus:border-[#FFD700] outline-none font-bold"
                        />
                        <button
                            onClick={() => setDonationAmount(player.gold.toString())}
                            className="hidden md:block px-3 py-2 bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 text-sm font-bold"
                        >
                            MAX
                        </button>
                        <button
                            onClick={() => setDonationAmount(player.gold.toString())}
                            className="md:hidden px-3 py-2 bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 text-sm font-bold"
                        >
                            MAX
                        </button>
                    </div>

                    {donationAmount && parseInt(donationAmount) > 0 && (
                        <div className="text-center text-sm mb-3 text-blue-400">
                            💫 +{Math.floor(parseInt(donationAmount) * 0.5)} XP • +1 CHARM
                        </div>
                    )}

                    <button
                        onClick={donate}
                        disabled={isDonating || !donationAmount || parseInt(donationAmount) < GAME_CONSTANTS.POOR_DISTRICT_DONATION_MIN || parseInt(donationAmount) > player.gold}
                        className="w-full px-4 py-3 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] font-bold hover:bg-[#00BB66] transition-all disabled:opacity-30 disabled:cursor-not-allowed text-glow-green"
                    >
                        {isDonating ? '⏳ DONATING...' : '💰 DONATE'}
                    </button>
                </div>

                {/* Info */}
                <div className="bg-black border border-blue-500 p-3 mb-6 text-sm text-blue-400" dangerouslySetInnerHTML={{ __html: t.legend.poorDistrict.robinHoodWay }} />

                <div className="text-center text-sm text-gray-400 mb-6">
                    💰 {t.legend.poorDistrict.yourGold}: <span className="text-[#FFD700] font-bold text-glow-gold">{player.gold.toLocaleString()}</span>
                </div>

                {/* Close */}
                <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-black border-2 border-gray-600 text-gray-400 font-bold hover:bg-gray-900 transition-all"
                >
                    [ESC] {t.legend.poorDistrict.leave}
                </button>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default PoorDistrict;
