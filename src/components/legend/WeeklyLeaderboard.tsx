import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useModalClose } from '../../hooks/useModalClose';

interface LeaderboardData {
    topGoldStealer: { name: string; goldStolen: number } | null;
    topLevel: { name: string; level: number; experience: number } | null;
    weeklyRevenue: number;
    clzdBuyAmount: string;
    distributionDate: string;
    weekDates?: string;
}

const WeeklyLeaderboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose);

    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch('/api/legend/weekly-leaderboard');
            if (response.ok) {
                const leaderboardData = await response.json();
                setData(leaderboardData);
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-0 md:p-4 overscroll-none"
            style={{ zIndex: 9999 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border-2 border-purple-500 rounded-2xl p-8 max-w-3xl w-full relative overflow-hidden"
            >
                {/* Header */}
                <div className="text-purple-400 mb-4 text-center">
                    <div className="text-2xl font-bold">🏆 WEEKLY $CLZD AIRDROP LEADERBOARD 🏆</div>
                    <div className="text-sm mt-2">💎 PROFIT SHARING REWARDS 💎</div>
                </div>

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-purple-400 mb-2">
                            📊 Weekly Leaderboard
                        </h2>
                        <p className="text-gray-400">Compete for $CLZD rewards every week!</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-3xl hover:text-red-400 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4 animate-spin">⏳</div>
                        <p className="text-gray-400">Loading leaderboard...</p>
                    </div>
                ) : data ? (
                    <>
                        {/* Revenue Info */}
                        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-xl p-6 mb-6">
                            <h3 className="text-xl font-bold text-purple-400 mb-4">💰 This Week's Pool</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-[#FFD700]">
                                        {data.weeklyRevenue.toFixed(4)} BNB
                                    </div>
                                    <div className="text-sm text-gray-400">Total Revenue</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-purple-400">
                                        {data.clzdBuyAmount} BNB
                                    </div>
                                    <div className="text-sm text-gray-400">For $CLZD Buy</div>
                                </div>
                            </div>
                            <div className="mt-4 text-center text-sm text-gray-300">
                                📅 Current Week: <span className="text-cyan-400 font-bold">{data.weekDates || 'Sun - Sat'}</span>
                                <br />
                                🎁 Distribution: <span className="text-neon-green font-bold">{data.distributionDate}</span>
                            </div>
                        </div>

                        {/* Top Players */}
                        <div className="space-y-4 mb-6">
                            {/* Top Gold Stealer */}
                            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/50 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-5xl">🥇</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-yellow-400">Top Gold Stealer</h3>
                                            {data.topGoldStealer ? (
                                                <>
                                                    <p className="text-2xl font-bold text-[#FFD700]">
                                                        {data.topGoldStealer.name}
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        💰 {data.topGoldStealer.goldStolen.toLocaleString()} gold stolen
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-gray-500 italic">No winner yet this week</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-400">50%</div>
                                        <div className="text-xs text-gray-400">of pool</div>
                                    </div>
                                </div>
                            </div>

                            {/* Highest Level */}
                            <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-2 border-blue-500/50 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-5xl">🥇</div>
                                        <div>
                                            <h3 className="text-xl font-bold text-blue-400">Most XP Earned</h3>
                                            {data.topLevel ? (
                                                <>
                                                    <p className="text-2xl font-bold text-neon-blue">
                                                        {data.topLevel.name}
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        ✨ Level {data.topLevel.level} • {data.topLevel.experience.toLocaleString()} XP
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-gray-500 italic">No winner yet this week</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-400">50%</div>
                                        <div className="text-xs text-gray-400">of pool</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* How It Works */}
                        <div className="bg-gray-700/50 rounded-xl p-6">
                            <h3 className="font-bold text-neon-green mb-3">💡 How Weekly Rewards Work</h3>
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li>✅ Every Sunday, we calculate the week's winners</li>
                                <li>💰 30% of all gold purchases go to $CLZD buy</li>
                                <li>🏆 50% goes to top gold stealer, 50% to highest XP</li>
                                <li>📊 Winners earn airdrop points for future distributions</li>
                                <li>🦎 $CLZD bought from market and distributed directly</li>
                            </ul>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-400">Failed to load leaderboard</p>
                    </div>
                )}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-400/50 transition-all"
                >
                    🚪 Close
                </button>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default WeeklyLeaderboard;
