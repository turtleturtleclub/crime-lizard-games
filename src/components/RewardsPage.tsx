import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { WalletContext } from '../providers/WalletContext';
import SubmissionForms from './SubmissionForms';

interface LeaderboardEntry {
    walletAddress: string;
    username: string;
    telegramUsername: string;
    characterName: string;
    characterImage: string;
    tokenId: number | null;
    totalXP: number;
    gameXP: number;
    goldXP: number;
    goldBalance: number;
    manualXP: number;
    rank: number;
    prize: number;
}

interface LeaderboardData {
    totalPrizePool: number;
    prizeDistribution: number[];
    leaderboard: LeaderboardEntry[];
    lastUpdated: string;
}

interface UserXPData {
    walletAddress: string;
    username: string;
    telegramUsername: string;
    gameXP: number;
    goldXP: number;
    manualXP: number;
    goldBalance: number;
    totalXP: number;
    rank: number | null;
    prize: number;
    inTop10: boolean;
}

interface RewardsModalProps {
    onClose: () => void;
}

// Format numbers with K for thousands and M for millions
const formatPrizeAmount = (num: number): string => {
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(0);
};

// Full page version (for /rewards route)
const RewardsPage: React.FC = () => {
    const { account } = useContext(WalletContext);
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
    const [userXPData, setUserXPData] = useState<UserXPData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedRank, setSelectedRank] = useState<number | null>(null);

    useEffect(() => {
        loadLeaderboard();
        if (account) {
            loadUserXP();
        }
    }, [account]);

    const loadLeaderboard = async () => {
        setLoading(true);
        try {
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            const response = await fetch(`${serverUrl}/api/xp-rewards/leaderboard`);
            const data = await response.json();

            if (response.ok) {
                setLeaderboardData(data);
            } else {
                console.error('Failed to load leaderboard:', data.error);
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserXP = async () => {
        if (!account) return;

        try {
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            const response = await fetch(`${serverUrl}/api/xp-rewards/user/${account}`);
            const data = await response.json();

            if (response.ok) {
                setUserXPData(data);
            }
        } catch (error) {
            console.error('Error loading user XP:', error);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return '👑';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1: return 'from-yellow-400 to-yellow-600';
            case 2: return 'from-gray-300 to-gray-500';
            case 3: return 'from-amber-600 to-amber-800';
            default: return 'from-gray-600 to-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="bg-black flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin h-16 w-16 border-b-2 border-[#FFD700] mx-auto mb-4"></div>
                    <p className="text-[#FFD700] text-xl">Loading Rewards...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black p-4 md:p-8 pb-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-[#FFD700] to-yellow-600 mb-4 font-bbs">
                        🏆 LEADERBOARD 🏆
                    </h1>
                    <p className="text-xl md:text-2xl text-[#FFD700] font-bold mb-2">
                        500,000 $CLZD PRIZE POOL
                    </p>
                    <p className="text-gray-400">
                        Top 10 Players Win $CLZD Rewards!
                    </p>
                </motion.div>

                {/* Prize Pool Info */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-black border-2 border-[#FFD700]/30 p-6 mb-8"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-4xl font-bold text-[#FFD700]">
                                💰 500,000
                            </div>
                            <div className="text-sm text-gray-400">Total $CLZD Prize Pool</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-[#FFD700]">
                                🥇 150,000
                            </div>
                            <div className="text-sm text-gray-400">Top Prize (Rank #1)</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-[#FFD700]">
                                {leaderboardData?.leaderboard.length || 0}
                            </div>
                            <div className="text-sm text-gray-400">Active Players</div>
                        </div>
                    </div>
                </motion.div>

                {/* Your Stats */}
                {account && userXPData && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`border-2 p-6 mb-8 ${userXPData.inTop10
                            ? 'bg-black border-[#FFD700]'
                            : 'bg-black border-gray-700'
                            }`}
                    >
                        <h2 className="text-2xl font-bold text-[#FFD700] mb-4 font-bbs">📊 Your Stats</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-gray-400 text-sm">Rank</p>
                                <p className="text-2xl font-bold text-[#FFD700]">
                                    {userXPData.rank ? `🏅 #${userXPData.rank}` : 'Unranked'}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Total XP</p>
                                <p className="text-2xl font-bold text-[#FFD700]">
                                    ⭐ {userXPData.totalXP.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Prize</p>
                                <p className="text-2xl font-bold text-[#FFD700]">
                                    {userXPData.prize > 0 ? `💰 ${formatPrizeAmount(userXPData.prize)} $CLZD` : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                                <p className="text-gray-400 text-sm">Game XP</p>
                                <p className="text-xl font-bold text-[#FFD700]">
                                    🎮 {userXPData.gameXP.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Gold XP</p>
                                <p className="text-xl font-bold text-[#FFD700]">
                                    🪙 {userXPData.goldXP.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Manual XP</p>
                                <p className="text-xl font-bold text-[#FFD700]">
                                    ⭐ {userXPData.manualXP.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Gold Balance</p>
                                <p className="text-xl font-bold text-gray-400">
                                    {userXPData.goldBalance.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        {userXPData.inTop10 && (
                            <div className="mt-4 bg-black border-2 border-[#FFD700] p-3 text-center">
                                <p className="text-[#FFD700] font-bold">
                                    🎉 Congratulations! You're in the TOP 10! Keep earning XP to secure your prize! 🎉
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Top 10 Leaderboard */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-black border-2 border-[#FFD700]/30 p-6 mb-8"
                >
                    <h2 className="text-3xl font-bold text-[#FFD700] mb-6 text-center font-bbs">
                        🏅 TOP 10 XP LEADERBOARD
                    </h2>

                    {leaderboardData && leaderboardData.leaderboard.length > 0 ? (
                        <div className="space-y-3">
                            {leaderboardData.leaderboard.map((entry) => {
                                const isCurrentUser = account && entry.walletAddress.toLowerCase() === account.toLowerCase();

                                return (
                                    <motion.div
                                        key={entry.walletAddress}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: entry.rank * 0.05 }}
                                        className={`bg-black ${isCurrentUser
                                            ? 'border-[#FFD700]'
                                            : 'border-gray-700'
                                            } border-2 p-4 hover:border-[#FFD700] transition-all cursor-pointer`}
                                        onClick={() => setSelectedRank(selectedRank === entry.rank ? null : entry.rank)}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            {/* Rank Badge */}
                                            <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${getRankColor(entry.rank)} text-white font-bold text-lg`}>
                                                {getRankIcon(entry.rank)}
                                            </div>

                                            {/* Character Image */}
                                            <div className="w-14 h-14 flex-shrink-0 border-2 border-[#FFD700]/50 overflow-hidden bg-gray-900">
                                                {entry.characterImage ? (
                                                    <img
                                                        src={entry.characterImage}
                                                        alt={entry.characterName || 'Character'}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = '/assets/lizard.png';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-2xl">🦎</div>
                                                )}
                                            </div>

                                            {/* User Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className={`font-bold text-lg truncate ${isCurrentUser ? 'text-[#FFD700]' : 'text-gray-300'}`}>
                                                        {entry.username || `Player ${entry.walletAddress.slice(0, 6)}...`}
                                                        {isCurrentUser && <span className="ml-2 text-[#FFD700]">(YOU)</span>}
                                                    </p>
                                                </div>
                                                {entry.characterName && entry.characterName !== entry.username && (
                                                    <p className="text-sm text-purple-400">🗡️ {entry.characterName}</p>
                                                )}
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    {entry.telegramUsername && (
                                                        <span className="text-cyan-400">@{entry.telegramUsername}</span>
                                                    )}
                                                    <span className="font-mono">
                                                        {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* XP & Prize */}
                                            <div className="text-right flex-shrink-0">
                                                <div className="text-2xl font-bold text-[#FFD700]">
                                                    ⭐ {entry.totalXP.toLocaleString()}
                                                </div>
                                                <div className="text-sm text-[#FFD700] font-bold">
                                                    💰 {formatPrizeAmount(entry.prize)} $CLZD
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {selectedRank === entry.rank && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4 text-sm"
                                            >
                                                <div>
                                                    <p className="text-gray-400">Game XP</p>
                                                    <p className="text-[#FFD700] font-bold">🎮 {entry.gameXP.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400">Gold XP</p>
                                                    <p className="text-[#FFD700] font-bold">🪙 {entry.goldXP.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400">Gold Balance</p>
                                                    <p className="text-gray-400 font-bold">{entry.goldBalance.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400">Manual XP (Bonus)</p>
                                                    <p className="text-[#FFD700] font-bold">⭐ {entry.manualXP.toLocaleString()}</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-4xl mb-4">🏆</p>
                            <p className="text-gray-400 text-xl">No players yet! Be the first to compete!</p>
                            <p className="text-gray-500 text-sm mt-2">Earn XP automatically by playing games (RPG, Casino, Dice) and earning gold!</p>
                        </div>
                    )}
                </motion.div>

                {/* How to Earn XP */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-black border-2 border-[#FFD700]/30 p-6"
                >
                    <h2 className="text-2xl font-bold text-[#FFD700] mb-4 font-bbs">💡 How to Earn XP</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-300">
                        <div className="bg-black p-6 border-2 border-gray-700 hover:border-[#FFD700] transition-all aspect-square flex flex-col justify-center">
                            <h3 className="font-bold text-[#FFD700] mb-2 text-center">🪙 Gold Balance (Automatic)</h3>
                            <p className="text-sm text-center">Your total gold balance across all characters counts as XP 1:1. Play any game to earn more gold automatically!</p>
                        </div>
                        <div className="bg-black p-6 border-2 border-gray-700 hover:border-[#FFD700] transition-all aspect-square flex flex-col justify-center">
                            <h3 className="font-bold text-[#FFD700] mb-2 text-center">🎮 RPG Game (Automatic)</h3>
                            <p className="text-sm text-center">Play the Legend RPG to earn gold and XP automatically. Complete quests, battle enemies, and level up!</p>
                        </div>
                        <div className="bg-black p-6 border-2 border-gray-700 hover:border-[#FFD700] transition-all aspect-square flex flex-col justify-center">
                            <h3 className="font-bold text-[#FFD700] mb-2 text-center">🎰 Casino Games (Automatic)</h3>
                            <p className="text-sm text-center">Play Slots and other casino games from the RPG. Win gold to automatically increase your XP!</p>
                        </div>
                        <div className="bg-black p-6 border-2 border-gray-700 hover:border-[#FFD700] transition-all aspect-square flex flex-col justify-center">
                            <h3 className="font-bold text-[#FFD700] mb-2 text-center">🎲 Dice Game (Automatic)</h3>
                            <p className="text-sm text-center">Play the Dice game accessible from the RPG. Every gold coin you win adds to your XP automatically!</p>
                        </div>
                        <div className="bg-black p-6 border-2 border-gray-700 hover:border-[#FFD700] transition-all aspect-square flex flex-col justify-center">
                            <h3 className="font-bold text-[#FFD700] mb-2 text-center">📱 Telegram Raidar (Manual XP)</h3>
                            <p className="text-sm text-center">High raidar scores in Telegram earn you bonus XP added by admins!</p>
                        </div>
                        <div className="bg-black p-6 border-2 border-gray-700 hover:border-[#FFD700] transition-all aspect-square flex flex-col justify-center">
                            <h3 className="font-bold text-[#FFD700] mb-2 text-center">🐛 Bug Bounties (Manual XP)</h3>
                            <p className="text-sm text-center">Find and report bugs to earn bonus XP rewards!</p>
                        </div>
                    </div>

                    <div className="mt-6 bg-black border-2 border-[#FFD700] p-4">
                        <p className="text-[#FFD700] font-bold text-center">
                            🦎 Leaderboard is live! Play the game to climb the ranks and win $CLZD rewards!
                        </p>
                    </div>
                </motion.div>

                {/* Bug Bounties & Feature Requests Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8"
                >
                    <h2 className="text-3xl font-bold text-[#FFD700] mb-6 text-center font-bbs">
                        🎯 Earn Bonus XP
                    </h2>
                    <SubmissionForms />
                </motion.div>
            </div>
        </div>
    );
};

// Modal version (for in-game popup)
export const RewardsModal: React.FC<RewardsModalProps> = ({ onClose }) => {
    const { account } = useContext(WalletContext);
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
    const [userXPData, setUserXPData] = useState<UserXPData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedRank, setSelectedRank] = useState<number | null>(null);

    useEffect(() => {
        loadLeaderboard();
        if (account) {
            loadUserXP();
        }
    }, [account]);

    const loadLeaderboard = async () => {
        setLoading(true);
        try {
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            const response = await fetch(`${serverUrl}/api/xp-rewards/leaderboard`);
            const data = await response.json();

            if (response.ok) {
                setLeaderboardData(data);
            } else {
                console.error('Failed to load leaderboard:', data.error);
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserXP = async () => {
        if (!account) return;

        try {
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            const response = await fetch(`${serverUrl}/api/xp-rewards/user/${account}`);
            const data = await response.json();

            if (response.ok) {
                setUserXPData(data);
            }
        } catch (error) {
            console.error('Error loading user XP:', error);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return '👑';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1: return 'from-yellow-400 to-yellow-600';
            case 2: return 'from-gray-300 to-gray-500';
            case 3: return 'from-amber-600 to-amber-800';
            default: return 'from-gray-600 to-gray-800';
        }
    };

    // Handle Escape key
    useEffect(() => {
        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [onClose]);

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-modal flex items-center justify-center bg-black/90 p-4 overscroll-none"
                onClick={onClose}
            >
                <div className="bg-black border-2 border-[#FFD700] p-8" onClick={(e) => e.stopPropagation()}>
                    <div className="animate-spin h-16 w-16 border-b-2 border-[#FFD700] mx-auto mb-4"></div>
                    <p className="text-[#FFD700] text-xl">Loading Rewards...</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-modal flex items-center justify-center bg-black/90 p-4 font-bbs overscroll-none"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-black border-2 border-[#FFD700] max-w-6xl w-full max-h-[90dvh] overflow-y-auto pb-safe-bottom"
                onClick={(e) => e.stopPropagation()}
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255, 215, 0, 0.5) rgba(0, 0, 0, 0.3)'
                }}
            >
                {/* Close Button */}
                <div className="sticky top-0 bg-black border-b-2 border-[#FFD700] p-4 flex items-center justify-between z-10">
                    <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-[#FFD700] to-yellow-600">
                        🏆 LEADERBOARD
                    </h1>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center bg-black border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-all text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                <div className="p-4 md:p-8">
                    {/* Prize Pool Info */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black border-2 border-[#FFD700]/30 p-6 mb-8"
                    >
                        <p className="text-xl md:text-2xl text-[#FFD700] font-bold mb-4 text-center">
                            500,000 $CLZD PRIZE POOL
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-3xl md:text-4xl font-bold text-[#FFD700]">
                                    💰 500,000
                                </div>
                                <div className="text-sm text-gray-400">Total $CLZD Prize Pool</div>
                            </div>
                            <div>
                                <div className="text-3xl md:text-4xl font-bold text-[#FFD700]">
                                    🥇 150,000
                                </div>
                                <div className="text-sm text-gray-400">Top Prize (Rank #1)</div>
                            </div>
                            <div>
                                <div className="text-3xl md:text-4xl font-bold text-[#FFD700]">
                                    {leaderboardData?.leaderboard.length || 0}
                                </div>
                                <div className="text-sm text-gray-400">Active Players</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Your Stats */}
                    {account && userXPData && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`border-2 p-6 mb-8 ${userXPData.inTop10
                                ? 'bg-black border-[#FFD700]'
                                : 'bg-black border-gray-700'
                                }`}
                        >
                            <h2 className="text-2xl font-bold text-[#FFD700] mb-4">📊 Your Stats</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-gray-400 text-sm">Rank</p>
                                    <p className="text-xl md:text-2xl font-bold text-[#FFD700]">
                                        {userXPData.rank ? `🏅 #${userXPData.rank}` : 'Unranked'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Total XP</p>
                                    <p className="text-xl md:text-2xl font-bold text-[#FFD700]">
                                        ⭐ {userXPData.totalXP.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Prize</p>
                                    <p className="text-xl md:text-2xl font-bold text-[#FFD700]">
                                        {userXPData.prize > 0 ? `💰 ${formatPrizeAmount(userXPData.prize)}` : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div>
                                    <p className="text-gray-400 text-sm">Game XP</p>
                                    <p className="text-lg md:text-xl font-bold text-[#FFD700]">
                                        🎮 {userXPData.gameXP.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Gold XP</p>
                                    <p className="text-lg md:text-xl font-bold text-[#FFD700]">
                                        🪙 {userXPData.goldXP.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Manual XP</p>
                                    <p className="text-lg md:text-xl font-bold text-[#FFD700]">
                                        ⭐ {userXPData.manualXP.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Gold Balance</p>
                                    <p className="text-lg md:text-xl font-bold text-gray-400">
                                        {userXPData.goldBalance.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {userXPData.inTop10 && (
                                <div className="mt-4 bg-black border-2 border-[#FFD700] p-3 text-center">
                                    <p className="text-[#FFD700] font-bold">
                                        🎉 Congratulations! You're in the TOP 10! Keep earning XP to secure your prize! 🎉
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Top 10 Leaderboard */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black border-2 border-[#FFD700]/30 p-6 mb-8"
                    >
                        <h2 className="text-2xl md:text-3xl font-bold text-[#FFD700] mb-6 text-center">
                            🏅 TOP 10 XP LEADERBOARD
                        </h2>

                        {leaderboardData && leaderboardData.leaderboard.length > 0 ? (
                            <div className="space-y-3">
                                {leaderboardData.leaderboard.map((entry) => {
                                    const isCurrentUser = account && entry.walletAddress.toLowerCase() === account.toLowerCase();

                                    return (
                                        <motion.div
                                            key={entry.walletAddress}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: entry.rank * 0.05 }}
                                            className={`bg-black ${isCurrentUser
                                                ? 'border-[#FFD700]'
                                                : 'border-gray-700'
                                                } border-2 p-4 hover:border-[#FFD700] transition-all cursor-pointer`}
                                            onClick={() => setSelectedRank(selectedRank === entry.rank ? null : entry.rank)}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                {/* Rank Badge */}
                                                <div className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${getRankColor(entry.rank)} text-white font-bold text-sm md:text-lg`}>
                                                    {getRankIcon(entry.rank)}
                                                </div>

                                                {/* Character Image */}
                                                <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 border-2 border-[#FFD700]/50 overflow-hidden bg-gray-900">
                                                    {entry.characterImage ? (
                                                        <img
                                                            src={entry.characterImage}
                                                            alt={entry.characterName || 'Character'}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = '/assets/lizard.png';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xl">🦎</div>
                                                    )}
                                                </div>

                                                {/* User Info */}
                                                <div className="flex-1 min-w-0 ml-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className={`font-bold text-sm md:text-lg truncate ${isCurrentUser ? 'text-[#FFD700]' : 'text-gray-300'}`}>
                                                            {entry.username || `Player ${entry.walletAddress.slice(0, 6)}...`}
                                                            {isCurrentUser && <span className="ml-1 text-[#FFD700]">(YOU)</span>}
                                                        </p>
                                                    </div>
                                                    {entry.characterName && entry.characterName !== entry.username && (
                                                        <p className="text-xs text-purple-400 truncate">🗡️ {entry.characterName}</p>
                                                    )}
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        {entry.telegramUsername && (
                                                            <span className="text-cyan-400 hidden md:inline">@{entry.telegramUsername}</span>
                                                        )}
                                                        <span className="font-mono">
                                                            {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* XP & Prize */}
                                                <div className="text-right flex-shrink-0">
                                                    <div className="text-lg md:text-2xl font-bold text-[#FFD700]">
                                                        ⭐ {entry.totalXP.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs md:text-sm text-[#FFD700] font-bold">
                                                        💰 {formatPrizeAmount(entry.prize)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {selectedRank === entry.rank && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4 text-sm"
                                                >
                                                    <div>
                                                        <p className="text-gray-400">Game XP</p>
                                                        <p className="text-[#FFD700] font-bold">🎮 {entry.gameXP.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400">Gold XP</p>
                                                        <p className="text-[#FFD700] font-bold">🪙 {entry.goldXP.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400">Gold Balance</p>
                                                        <p className="text-gray-400 font-bold">{entry.goldBalance.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400">Manual XP (Bonus)</p>
                                                        <p className="text-[#FFD700] font-bold">⭐ {entry.manualXP.toLocaleString()}</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-4xl mb-4">🏆</p>
                                <p className="text-gray-400 text-xl">No players yet! Be the first to compete!</p>
                            </div>
                        )}
                    </motion.div>

                    {/* How to Earn XP - Compact Version */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black border-2 border-[#FFD700]/30 p-6"
                    >
                        <h2 className="text-xl md:text-2xl font-bold text-[#FFD700] mb-4">💡 How to Earn XP</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-gray-300 text-sm">
                            <div className="bg-black p-4 border-2 border-gray-700">
                                <h3 className="font-bold text-[#FFD700] mb-2">🪙 Gold Balance</h3>
                                <p>Your total gold = XP 1:1</p>
                            </div>
                            <div className="bg-black p-4 border-2 border-gray-700">
                                <h3 className="font-bold text-[#FFD700] mb-2">🎮 RPG Game</h3>
                                <p>Play Legend RPG to earn gold automatically</p>
                            </div>
                            <div className="bg-black p-4 border-2 border-gray-700">
                                <h3 className="font-bold text-[#FFD700] mb-2">🎰 Casino & 🎲 Dice</h3>
                                <p>Win gold in games = more XP!</p>
                            </div>
                            <div className="bg-black p-4 border-2 border-gray-700">
                                <h3 className="font-bold text-[#FFD700] mb-2">📱 Telegram Raidar</h3>
                                <p>High raidar scores = bonus XP</p>
                            </div>
                            <div className="bg-black p-4 border-2 border-gray-700">
                                <h3 className="font-bold text-[#FFD700] mb-2">🐛 Bug Bounties</h3>
                                <p>Find bugs = XP rewards</p>
                            </div>
                            <div className="bg-black p-4 border-2 border-gray-700">
                                <h3 className="font-bold text-[#FFD700] mb-2">💡 Feature Ideas</h3>
                                <p>Submit winning ideas = XP</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default RewardsPage;
