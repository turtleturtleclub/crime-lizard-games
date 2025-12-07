// Epic Quest Completion Celebration
// Full-screen celebration when a quest is completed

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import Confetti from 'react-confetti';
import '../../styles/QuestCelebration.css';

interface QuestReward {
    type: 'gold' | 'xp' | 'item';
    amount?: number;
    itemName?: string;
    description?: string;
}

interface QuestCompleteCelebrationProps {
    questTitle: string;
    questDescription: string;
    rewards: QuestReward[];
    onClose: () => void;
}

export const QuestCompleteCelebration: React.FC<QuestCompleteCelebrationProps> = ({
    questTitle,
    questDescription,
    rewards,
    onClose
}) => {
    const [showConfetti, setShowConfetti] = useState(true);
    const [showRewards, setShowRewards] = useState(false);

    useEffect(() => {
        // Show rewards after initial animation
        const timer = setTimeout(() => setShowRewards(true), 1500);

        // Stop confetti after 5 seconds
        const confettiTimer = setTimeout(() => setShowConfetti(false), 5000);

        return () => {
            clearTimeout(timer);
            clearTimeout(confettiTimer);
        };
    }, []);

    const getRewardIcon = (type: string) => {
        switch (type) {
            case 'gold': return '💰';
            case 'xp': return '✨';
            case 'item': return '🎁';
            default: return '⭐';
        }
    };

    const modalContent = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="quest-celebration-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            {showConfetti && (
                <Confetti
                    width={window.innerWidth}
                    height={window.innerHeight}
                    recycle={false}
                    numberOfPieces={500}
                    colors={['#FFD700', '#00FF88', '#FF6B6B', '#4ECDC4', '#95E1D3']}
                />
            )}

            <motion.div
                initial={{ scale: 0.5, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.5, y: 100 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                className="quest-celebration-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Epic Header */}
                <motion.div
                    className="celebration-header"
                    animate={{
                        textShadow: [
                            '0 0 20px rgba(255,215,0,0.8)',
                            '0 0 40px rgba(255,215,0,1)',
                            '0 0 20px rgba(255,215,0,0.8)'
                        ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <motion.div
                        className="celebration-icon"
                        animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        🏆
                    </motion.div>
                    <h1 className="celebration-title">QUEST COMPLETE!</h1>
                </motion.div>

                {/* Quest Info */}
                <div className="celebration-quest-info">
                    <h2 className="quest-name">{questTitle}</h2>
                    <p className="quest-description">{questDescription}</p>
                </div>

                {/* Rewards Section */}
                <AnimatePresence>
                    {showRewards && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="celebration-rewards"
                        >
                            <h3 className="rewards-title">🎁 REWARDS EARNED 🎁</h3>
                            <div className="rewards-grid">
                                {rewards.map((reward, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        transition={{
                                            delay: index * 0.2,
                                            type: 'spring',
                                            damping: 10
                                        }}
                                        className="reward-card"
                                    >
                                        <motion.div
                                            className="reward-icon"
                                            animate={{
                                                y: [0, -10, 0]
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                delay: index * 0.1
                                            }}
                                        >
                                            {getRewardIcon(reward.type)}
                                        </motion.div>
                                        <div className="reward-details">
                                            {reward.type === 'gold' && (
                                                <>
                                                    <div className="reward-amount">{reward.amount?.toLocaleString()}</div>
                                                    <div className="reward-label">Gold</div>
                                                </>
                                            )}
                                            {reward.type === 'xp' && (
                                                <>
                                                    <div className="reward-amount">{reward.amount?.toLocaleString()}</div>
                                                    <div className="reward-label">Experience</div>
                                                </>
                                            )}
                                            {reward.type === 'item' && (
                                                <>
                                                    <div className="reward-item-name">{reward.itemName}</div>
                                                    <div className="reward-label">{reward.description || 'New Item'}</div>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Button */}
                <AnimatePresence>
                    {showRewards && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: rewards.length * 0.2 + 0.5 }}
                            className="celebration-actions"
                        >
                            <motion.button
                                onClick={onClose}
                                className="celebrate-btn"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                animate={{
                                    boxShadow: [
                                        '0 0 20px rgba(255,215,0,0.5)',
                                        '0 0 40px rgba(255,215,0,0.8)',
                                        '0 0 20px rgba(255,215,0,0.5)'
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <span className="btn-icon">🎉</span>
                                <span className="btn-text">CONTINUE ADVENTURE</span>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Flavor Text */}
                <div className="celebration-footer">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="footer-text"
                    >
                        "Another job well done, lizard. Come back when you're ready for more."
                    </motion.p>
                    <p className="footer-signature">- Gecko Graves</p>
                </div>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default QuestCompleteCelebration;
