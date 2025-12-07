import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useModalClose } from '../../hooks/useModalClose';

interface PlayerStats {
    name: string;
    level: number;
    experience: number;
    experienceToNextLevel: number;
    health: number;
    maxHealth: number;
    strength: number;
    defense: number;
    charm: number;
    gold: number;
    goldInBank: number;
    pendingGold: number;
    totalGold: number;
    goldStolen: number;
    goldGivenToPoor: number;
    enemiesDefeated: number;
    heistsCompleted: number;
    deathCount: number;
    pvpWins: number;
    pvpLosses: number;
    pvpWinRate: number;
    hasDefeatedCrimeLord: boolean;
    crimeLordDefeats: number;
    weapon: any;
    armor: any;
    turnsRemaining: number;
    maxTurns: number;
    lastTurnBonus: number;
    lastTurnBonusReasons: string[];
    rankings: {
        goldStolen: number;
        level: number;
        enemiesDefeated: number;
        heistsCompleted: number;
        pvpWins: number;
    };
}

interface LeaderboardData {
    topGoldStolen: any[];
    topLevel: any[];
    topEnemiesDefeated: any[];
    topHeists: any[];
    topCharity: any[];
    topPvPWins: any[];
    topCombatStats: any[];
    crimeLordVictors: any[];
    richestPlayers: any[];
    mostTurns: any[];
    globalStats: {
        totalPlayers: number;
        totalGoldStolen: number;
        totalEnemiesDefeated: number;
        totalHeistsCompleted: number;
        totalPvPBattles: number;
        totalCrimeLordDefeats: number;
        averageLevel: number;
    };
}

interface RPGStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletAddress: string;
    tokenId: number;
}

const RPGStatsModal: React.FC<RPGStatsModalProps> = ({ isOpen, onClose, walletAddress, tokenId }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose, isOpen);

    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
    const [selectedTab, setSelectedTab] = useState<'personal' | 'leaderboard' | 'global'>('personal');
    const [selectedCategory, setSelectedCategory] = useState<string>('topGoldStolen');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, walletAddress, tokenId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsRes, leaderboardRes] = await Promise.all([
                fetch(`/api/legend/player-stats/${walletAddress}/${tokenId}`),
                fetch('/api/legend/leaderboard')
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            if (leaderboardRes.ok) {
                const leaderboardData = await leaderboardRes.json();
                setLeaderboard(leaderboardData);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getCurrentLeaderboard = (): any[] => {
        if (!leaderboard) return [];
        const data = leaderboard[selectedCategory as keyof LeaderboardData];
        // Handle both array types and globalStats object
        return Array.isArray(data) ? data : [];
    };

    const getCategoryInfo = (category: string) => {
        const categories: Record<string, { title: string; icon: string; field: string; unit: string }> = {
            topGoldStolen: { title: 'Top Gold Stealers', icon: '💰', field: 'goldStolen', unit: ' gold' },
            topLevel: { title: 'Highest Level', icon: '⭐', field: 'level', unit: '' },
            topEnemiesDefeated: { title: 'Most Enemies Defeated', icon: '⚔️', field: 'enemiesDefeated', unit: ' enemies' },
            topHeists: { title: 'Most Heists Completed', icon: '🏆', field: 'heistsCompleted', unit: ' heists' },
            topCharity: { title: 'Most Charitable', icon: '❤️', field: 'goldGivenToPoor', unit: ' gold given' },
            topPvPWins: { title: 'PvP Champions', icon: '🗡️', field: 'pvpWins', unit: ' wins' },
            topCombatStats: { title: 'Strongest Fighters', icon: '💪', field: 'strength', unit: ' STR' },
            crimeLordVictors: { title: 'Crime Lord Victors', icon: '👑', field: 'crimeLordDefeats', unit: ' defeats' },
            richestPlayers: { title: 'Richest Players', icon: '💎', field: 'gold', unit: ' gold' },
            mostTurns: { title: 'Most Active', icon: '🎯', field: 'maxTurns', unit: ' turns' }
        };
        return categories[category] || categories.topGoldStolen;
    };

    const modalContent = (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 overscroll-none" style={{ zIndex: 9999 }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-black border-2 border-[#00FF88] rounded-lg p-6 max-w-6xl w-full max-h-[90dvh] overflow-y-auto pb-safe-bottom"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-yellow-500">📊 RPG Statistics & Leaderboards</h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-400 text-3xl font-bold"
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4 animate-spin">⏳</div>
                        <p className="text-gray-400">Loading stats...</p>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 border-b-2 border-gray-700">
                            {[
                                { key: 'personal', label: '👤 Your Stats', icon: '👤' },
                                { key: 'leaderboard', label: '🏆 Leaderboards', icon: '🏆' },
                                { key: 'global', label: '🌍 Global Stats', icon: '🌍' }
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setSelectedTab(tab.key as any)}
                                    className={`px-6 py-3 font-bold transition-all ${
                                        selectedTab === tab.key
                                            ? 'bg-[#00AA55]/30 text-yellow-500 border-b-2 border-yellow-500'
                                            : 'text-gray-400 hover:text-green-400'
                                    }`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Personal Stats Tab */}
                        {selectedTab === 'personal' && stats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Combat Stats */}
                                <div className="bg-black border-2 border-red-500 rounded-lg p-4">
                                    <h3 className="text-xl font-bold text-red-400 mb-4">⚔️ Combat Stats</h3>
                                    <div className="space-y-3">
                                        <StatRow label="Level" value={`${stats.level} (${stats.experience}/${stats.experienceToNextLevel} XP)`} rank={`#${stats.rankings.level}`} />
                                        <StatRow label="Health" value={`${stats.health}/${stats.maxHealth} HP`} />
                                        <StatRow label="Strength" value={stats.strength} />
                                        <StatRow label="Defense" value={stats.defense} />
                                        <StatRow label="Charm" value={stats.charm} />
                                        <StatRow label="Enemies Defeated" value={stats.enemiesDefeated} rank={`#${stats.rankings.enemiesDefeated}`} />
                                        <StatRow label="Deaths" value={stats.deathCount} />
                                    </div>
                                </div>

                                {/* Economy Stats */}
                                <div className="bg-black border-2 border-yellow-500 rounded-lg p-4">
                                    <h3 className="text-xl font-bold text-yellow-400 mb-4">💰 Economy</h3>
                                    <div className="space-y-3">
                                        <StatRow label="Gold (On-chain)" value={stats.gold.toLocaleString()} />
                                        <StatRow label="Pending Gold" value={stats.pendingGold.toLocaleString()} highlight={stats.pendingGold > 0} />
                                        <StatRow label="Gold in Bank" value={stats.goldInBank.toLocaleString()} />
                                        <StatRow label="Total Gold" value={stats.totalGold.toLocaleString()} />
                                        <StatRow label="Gold Stolen" value={stats.goldStolen.toLocaleString()} rank={`#${stats.rankings.goldStolen}`} />
                                        <StatRow label="Given to Poor" value={stats.goldGivenToPoor.toLocaleString()} />
                                    </div>
                                </div>

                                {/* Progression Stats */}
                                <div className="bg-black border-2 border-blue-500 rounded-lg p-4">
                                    <h3 className="text-xl font-bold text-blue-400 mb-4">🎯 Progression</h3>
                                    <div className="space-y-3">
                                        <StatRow label="Heists Completed" value={stats.heistsCompleted} rank={`#${stats.rankings.heistsCompleted}`} />
                                        <StatRow label="Crime Lord Defeats" value={stats.crimeLordDefeats} highlight={stats.hasDefeatedCrimeLord} />
                                        <StatRow label="Turns Remaining" value={`${stats.turnsRemaining}/${stats.maxTurns}`} />
                                        <StatRow label="Turn Bonus" value={`+${stats.lastTurnBonus}`} />
                                        {stats.lastTurnBonusReasons.length > 0 && (
                                            <div className="text-xs text-gray-400 ml-4">
                                                {stats.lastTurnBonusReasons.map((reason, i) => (
                                                    <div key={i}>• {reason}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* PvP Stats */}
                                <div className="bg-black border-2 border-purple-500 rounded-lg p-4">
                                    <h3 className="text-xl font-bold text-purple-400 mb-4">🗡️ PvP</h3>
                                    <div className="space-y-3">
                                        <StatRow label="PvP Wins" value={stats.pvpWins} rank={`#${stats.rankings.pvpWins}`} />
                                        <StatRow label="PvP Losses" value={stats.pvpLosses} />
                                        <StatRow label="Win Rate" value={`${stats.pvpWinRate}%`} highlight={stats.pvpWinRate >= 50} />
                                        <StatRow
                                            label="Equipment"
                                            value={`${stats.weapon?.name || 'None'} / ${stats.armor?.name || 'None'}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Leaderboard Tab */}
                        {selectedTab === 'leaderboard' && leaderboard && (
                            <div>
                                {/* Category Selector */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
                                    {Object.keys(leaderboard).filter(key => key !== 'globalStats' && key !== 'lastUpdated').map((category) => {
                                        const info = getCategoryInfo(category);
                                        return (
                                            <button
                                                key={category}
                                                onClick={() => setSelectedCategory(category)}
                                                className={`px-4 py-2 border-2 rounded font-medium transition-all ${
                                                    selectedCategory === category
                                                        ? 'bg-[#00AA55]/30 text-yellow-500 border-[#00FF88]'
                                                        : 'bg-black text-gray-400 border-gray-700 hover:border-[#00DD77]'
                                                }`}
                                            >
                                                {info.icon} {info.title.split(' ')[0]}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Leaderboard List */}
                                <div className="bg-black border-2 border-[#00FF88] rounded-lg p-6">
                                    <h3 className="text-2xl font-bold text-green-400 mb-4 text-center">
                                        {getCategoryInfo(selectedCategory).icon} {getCategoryInfo(selectedCategory).title}
                                    </h3>
                                    <div className="space-y-3">
                                        {getCurrentLeaderboard().slice(0, 10).map((entry: any, index: number) => (
                                            <div
                                                key={entry._id}
                                                className="flex items-center justify-between p-3 bg-gray-700/50 border border-gray-600 rounded"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="text-2xl font-bold text-yellow-500">
                                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-green-400">{entry.name}</div>
                                                        <div className="text-sm text-gray-400">Level {entry.level}</div>
                                                    </div>
                                                </div>
                                                <div className="text-xl font-bold text-yellow-400">
                                                    {entry[getCategoryInfo(selectedCategory).field]?.toLocaleString() || 0}
                                                    <span className="text-sm text-gray-400">{getCategoryInfo(selectedCategory).unit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Global Stats Tab */}
                        {selectedTab === 'global' && leaderboard?.globalStats && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <GlobalStatCard icon="👥" label="Total Players" value={leaderboard.globalStats.totalPlayers} />
                                <GlobalStatCard icon="💰" label="Total Gold Stolen" value={leaderboard.globalStats.totalGoldStolen.toLocaleString()} />
                                <GlobalStatCard icon="⚔️" label="Total Enemies Defeated" value={leaderboard.globalStats.totalEnemiesDefeated.toLocaleString()} />
                                <GlobalStatCard icon="🏆" label="Total Heists" value={leaderboard.globalStats.totalHeistsCompleted.toLocaleString()} />
                                <GlobalStatCard icon="🗡️" label="Total PvP Battles" value={leaderboard.globalStats.totalPvPBattles.toLocaleString()} />
                                <GlobalStatCard icon="👑" label="Crime Lord Defeats" value={leaderboard.globalStats.totalCrimeLordDefeats} />
                                <GlobalStatCard icon="📊" label="Average Level" value={leaderboard.globalStats.averageLevel.toFixed(1)} />
                            </div>
                        )}
                    </>
                )}

                {/* Close Button */}
                <div className="flex justify-center mt-6">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-[#00DD77] hover:bg-[#00BB66] text-white font-bold rounded-lg transition-all"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

const StatRow: React.FC<{ label: string; value: string | number; rank?: string; highlight?: boolean }> = ({ label, value, rank, highlight }) => (
    <div className="flex justify-between items-center">
        <span className="text-gray-400">{label}:</span>
        <div className="flex items-center gap-2">
            <span className={`font-bold ${highlight ? 'text-yellow-400' : 'text-white'}`}>{value}</span>
            {rank && <span className="text-xs text-green-400 bg-[#00AA55]/30 px-2 py-1 rounded">{rank}</span>}
        </div>
    </div>
);

const GlobalStatCard: React.FC<{ icon: string; label: string; value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-black border-2 border-[#00FF88] rounded-lg p-6 text-center">
        <div className="text-4xl mb-2">{icon}</div>
        <div className="text-3xl font-bold text-yellow-400 mb-2">{value}</div>
        <div className="text-sm text-gray-400">{label}</div>
    </div>
);

export default RPGStatsModal;
