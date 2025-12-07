import React from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { useLanguage } from './contexts/LanguageContext';

interface ContractStats {
    totalSpins: bigint;
    totalAmountSpent: bigint;
    totalAmountWon: bigint;
    totalFreeSpinsAwarded: bigint;
    totalFreeSpinsUsed: bigint;
    totalJackpotWins: bigint;
    totalJackpotAmountWon: bigint;
    totalBonusGamesPlayed: bigint;
    totalBonusAmountWon: bigint;
    totalPlayers: bigint;
    dailySpins: bigint;
    dailyAmountSpent: bigint;
    dailyAmountWon: bigint;
    lastDayReset: bigint;
    biggestSingleWin: bigint;
    biggestWinner: string;
    averageBet: bigint;
    currentRTP: bigint;
}

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: ContractStats | null;
    isLoading: boolean;
}

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, stats, isLoading }) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    const formatEther = (value: bigint) => {
        return parseFloat(ethers.formatEther(value)).toFixed(2);
    };

    const getColorClasses = (color: string) => {
        const colorMap: Record<string, { border: string; text: string }> = {
            blue: { border: 'hover:border-blue-500/50', text: 'text-blue-400' },
            red: { border: 'hover:border-red-500/50', text: 'text-red-400' },
            green: { border: 'hover:border-[#00FF88]/50', text: 'text-green-400' },
            yellow: { border: 'hover:border-yellow-500/50', text: 'text-yellow-400' },
            purple: { border: 'hover:border-purple-500/50', text: 'text-purple-400' },
            cyan: { border: 'hover:border-cyan-500/50', text: 'text-cyan-400' },
            orange: { border: 'hover:border-orange-500/50', text: 'text-orange-400' },
            teal: { border: 'hover:border-teal-500/50', text: 'text-teal-400' },
            indigo: { border: 'hover:border-indigo-500/50', text: 'text-indigo-400' }
        };
        return colorMap[color] || colorMap.blue;
    };

    const StatCard: React.FC<{
        title: string;
        value: string;
        subtitle?: string;
        icon?: string;
        color?: string;
    }> = ({ title, value, subtitle, icon, color = "blue" }) => {
        const colors = getColorClasses(color);
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-black p-4 border-2 ${colors.border.replace('hover:', '')} transition-all duration-300`}
            >
                <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-sm font-medium ${colors.text}`}>{title}</h4>
                    {icon && <span className="text-lg">{icon}</span>}
                </div>
                <p className="text-2xl font-bold text-[#FFD700] mb-1">{value}</p>
                {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            </motion.div>
        );
    };

    const calculateProfit = (won: bigint, spent: bigint) => {
        const profit = won - spent;
        const isPositive = profit >= 0n;
        return {
            value: formatEther(profit < 0n ? -profit : profit),
            isPositive
        };
    };

    const calculateRTP = (won: bigint, spent: bigint) => {
        if (spent === 0n) return "0.00";
        return ((Number(won) / Number(spent)) * 100).toFixed(2);
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black/90 z-modal flex items-center justify-center p-4 overscroll-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-black border-2 border-[#FFD700] p-8 max-w-4xl w-full max-h-[90dvh] overflow-y-auto paytable-scroll font-bbs pb-safe-bottom"
                >
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto mb-4"></div>
                        <p className="text-[#FFD700] text-lg">{t.stats.loading}</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="fixed inset-0 bg-black/90 z-modal flex items-center justify-center p-4 overscroll-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-black border-2 border-[#FFD700] p-8 max-w-4xl w-full max-h-[90dvh] overflow-y-auto paytable-scroll font-bbs pb-safe-bottom"
                >
                    <div className="text-center">
                        <p className="text-[#FFD700] text-lg">{t.stats.noStats}</p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-6 py-2 bg-black border-2 border-[#FFD700] text-[#FFD700] font-bold hover:bg-[#FFD700]/20 transition-colors"
                        >
                            {t.common.close}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const allTimeProfit = calculateProfit(stats.totalAmountWon, stats.totalAmountSpent);
    const last24hProfit = calculateProfit(stats.dailyAmountWon, stats.dailyAmountSpent);

    return (
        <div className="fixed inset-0 bg-black/90 z-modal flex items-center justify-center p-4 overscroll-none">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-black border-2 border-[#FFD700] p-6 max-w-6xl w-full max-h-[90dvh] overflow-y-auto paytable-scroll font-bbs pb-safe-bottom"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-[#FFD700]">
                            {t.stats.title}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">{t.stats.subtitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-400 transition-colors text-2xl font-bold"
                    >
                        [X]
                    </button>
                </div>

                {/* All-Time Stats */}
                <div className="mb-8">
                    <h3 className="text-center text-xl font-bold text-[#00FF88] text-glow-green mb-3">🌟 {t.stats.allTimeStats.toUpperCase()}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            title={t.slots.totalSpins}
                            value={stats.totalSpins.toString()}
                            icon="🎰"
                            color="blue"
                        />
                        <StatCard
                            title={t.stats.totalSpent}
                            value={`${formatEther(stats.totalAmountSpent)} Gold`}
                            icon="💰"
                            color="red"
                        />
                        <StatCard
                            title={t.stats.totalWon}
                            value={`${formatEther(stats.totalAmountWon)} Gold`}
                            icon="🏆"
                            color="green"
                        />
                        <StatCard
                            title={t.stats.netProfit}
                            value={`${allTimeProfit.isPositive ? '+' : '-'}${allTimeProfit.value} Gold`}
                            subtitle={t.stats.houseEarnings}
                            icon={allTimeProfit.isPositive ? "📈" : "📉"}
                            color={allTimeProfit.isPositive ? "green" : "red"}
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            title={t.stats.freeSpinsAwarded}
                            value={stats.totalFreeSpinsAwarded.toString()}
                            icon="🎁"
                            color="purple"
                        />
                        <StatCard
                            title={t.stats.freeSpinsUsed}
                            value={stats.totalFreeSpinsUsed.toString()}
                            icon="🔄"
                            color="cyan"
                        />
                        <StatCard
                            title={t.stats.jackpotWins}
                            value={stats.totalJackpotWins.toString()}
                            icon="💎"
                            color="yellow"
                        />
                        <StatCard
                            title={t.stats.jackpotAmountWon}
                            value={`${formatEther(stats.totalJackpotAmountWon)} Gold`}
                            icon="👑"
                            color="yellow"
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <StatCard
                            title={t.stats.bonusGamesPlayed}
                            value={stats.totalBonusGamesPlayed.toString()}
                            icon="🦎"
                            color="orange"
                        />
                        <StatCard
                            title={t.stats.bonusAmountWon}
                            value={`${formatEther(stats.totalBonusAmountWon)} Gold`}
                            icon="🔥"
                            color="orange"
                        />
                        <StatCard
                            title={t.stats.overallRTP}
                            value={`${calculateRTP(stats.totalAmountWon, stats.totalAmountSpent)}%`}
                            subtitle={t.stats.returnToPlayer}
                            icon="📊"
                            color="teal"
                        />
                        <StatCard
                            title={t.stats.avgBetSize}
                            value={`${stats.totalSpins > 0n ? formatEther(stats.totalAmountSpent / stats.totalSpins) : '0.00'} Gold`}
                            subtitle={t.stats.perSpin}
                            icon="🎯"
                            color="indigo"
                        />
                    </div>
                </div>

                {/* 24-Hour Stats */}
                <div className="mb-6">
                    <h3 className="text-center text-xl font-bold text-[#00FF88] text-glow-green mb-3">⏰ {t.slots.last24Hours.toUpperCase()}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <StatCard
                            title={t.stats.spins24h}
                            value={stats.dailySpins.toString()}
                            icon="🎰"
                            color="blue"
                        />
                        <StatCard
                            title={t.stats.spent24h}
                            value={`${formatEther(stats.dailyAmountSpent)} Gold`}
                            icon="💰"
                            color="red"
                        />
                        <StatCard
                            title={t.stats.won24h}
                            value={`${formatEther(stats.dailyAmountWon)} Gold`}
                            icon="🏆"
                            color="green"
                        />
                        <StatCard
                            title={t.stats.profit24h}
                            value={`${last24hProfit.isPositive ? '+' : '-'}${last24hProfit.value} Gold`}
                            icon={last24hProfit.isPositive ? "📈" : "📉"}
                            color={last24hProfit.isPositive ? "green" : "red"}
                        />
                    </div>
                </div>

                {/* Additional Insights */}
                <div className="bg-black border-2 border-[#00FF88] p-4">
                    <h3 className="text-center text-xl font-bold text-[#00FF88] text-glow-green mb-3">💡 {t.stats.insights.toUpperCase()}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                        <div>
                            <p>• {t.stats.avgJackpotWin}: {stats.totalJackpotWins > 0n ? `${formatEther(stats.totalJackpotAmountWon / stats.totalJackpotWins)} Gold` : '0.00 Gold'}</p>
                            <p>• {t.stats.freeSpinsConversion}: {stats.totalFreeSpinsAwarded > 0n ? `${((Number(stats.totalFreeSpinsUsed) / Number(stats.totalFreeSpinsAwarded)) * 100).toFixed(1)}%` : '0.0%'}</p>
                            <p>• {t.stats.bonusGameFrequency}: {stats.totalSpins > 0n ? `${((Number(stats.totalBonusGamesPlayed) / Number(stats.totalSpins)) * 100).toFixed(2)}% ${t.stats.ofSpins}` : '0.00%'}</p>
                        </div>
                        <div>
                            <p>• {t.stats.mostValuableFeature}: {stats.totalJackpotAmountWon >= stats.totalBonusAmountWon ? t.stats.jackpots : t.stats.bonusGames}</p>
                            <p>• {t.stats.dailyActivity}: {stats.dailySpins > 0n ? `${((Number(stats.dailySpins) / 24)).toFixed(1)} ${t.stats.spinsPerHour}` : t.stats.noActivity}</p>
                            <p>• {t.stats.houseEdgePerformance}: {allTimeProfit.isPositive ? t.stats.positive : t.stats.negative} {t.stats.overall}</p>
                        </div>
                    </div>
                </div>

                {/* Close Button */}
                <div className="flex justify-center mt-6">
                    <motion.button
                        onClick={onClose}
                        className="px-8 py-3 bg-black border-2 border-[#FFD700] text-[#FFD700] font-bold hover:bg-[#FFD700]/20 transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        [ESC] {t.stats.closeStatistics}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default StatsModal;
