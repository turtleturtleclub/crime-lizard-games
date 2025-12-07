import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { useLanguage } from './contexts/LanguageContext';

interface LeaderboardEntry {
    address: string;
    displayName: string;
    score: number;
    rank: number;
}

interface LeaderboardData {
    biggestJackpots: LeaderboardEntry[];
    mostSpins: LeaderboardEntry[];
    highestSingleWin: LeaderboardEntry[];
    mostFreeSpins: LeaderboardEntry[];
    bestRTP: LeaderboardEntry[];
    bonusGames: LeaderboardEntry[];
    lastUpdated: number;
}

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentAccount: string | null;
    playerStats?: any;
    contract?: any;
    contractAddress?: string;
}


const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, currentAccount, playerStats, contract, contractAddress }) => {
    const { t } = useLanguage();
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<'jackpots' | 'spins' | 'singleWin' | 'freeSpins' | 'rtp' | 'bonusGames'>('jackpots');
    const [isLoading, setIsLoading] = useState(true);

    // Format numbers with K for thousands and M for millions
    const formatGoldAmount = (num: number): string => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toFixed(0);
    };

    // Get known players from localStorage - filtered by contract address
    const getKnownPlayers = (): string[] => {
        const key = contractAddress ? `crimeLizardKnownPlayers_${contractAddress.toLowerCase()}` : 'crimeLizardKnownPlayers';
        const known = localStorage.getItem(key);
        if (known) {
            try {
                return JSON.parse(known);
            } catch {
                return [];
            }
        }
        return [];
    };

    const knownPlayers = getKnownPlayers();

    // Generate anonymous display names for privacy
    const generateDisplayName = (address: string): string => {
        const hash = ethers.keccak256(ethers.toUtf8Bytes(address));
        const num = parseInt(hash.slice(-4), 16);
        const adjectives = ['Mysterious', 'Legendary', 'Epic', 'Pro', 'Master', 'Elite', 'Supreme', 'Ultimate', 'Cosmic', 'Quantum'];
        const nouns = ['Gamer', 'Spinner', 'Winner', 'Player', 'Champion', 'Hero', 'Wizard', 'Ninja', 'Samurai', 'Pirate'];
        return `${adjectives[num % adjectives.length]} ${nouns[Math.floor(num / adjectives.length) % nouns.length]}`;
    };

    // Generate leaderboard data using real contract data where possible
    const generateLeaderboardData = async (currentAccount: string | null, playerStats: any, contract: any): Promise<LeaderboardData> => {
        const playerAddress = currentAccount || playerStats?.address || '';

        // Calculate player's RTP if they have sufficient stats
        const playerRTP = playerStats && playerStats.totalSpent >= 1 && playerStats.totalSpins >= 10
            ? Math.max(50, Math.min(200, (playerStats.totalWon / playerStats.totalSpent) * 100))
            : 95.0;


        // Try to discover more players from contract activity
        const discoverMorePlayers = async (): Promise<string[]> => {
            const discoveredPlayers = new Set([...knownPlayers]);

            // Always include current player if available
            if (currentAccount) {
                discoveredPlayers.add(currentAccount);
            }

            try {
                // Try to get players from recent pending requests
                if (contract && currentAccount) {
                    // Check recent pending requests for the current user
                    try {
                        const maxRequests = 20; // Check up to 20 recent requests
                        for (let i = 0; i < maxRequests; i++) {
                            try {
                                const requestId = await contract.pendingRequests(currentAccount, BigInt(i));
                                if (requestId && requestId > 0n) {
                                    const requestData = await contract.requests(requestId);
                                    if (requestData && requestData[0]) {
                                        discoveredPlayers.add(requestData[0]); // Add player address
                                    }
                                }
                            } catch (error) {
                                // Stop checking if we hit an invalid request
                                break;
                            }
                        }
                    } catch (error) {
                        console.warn('⚠️ Failed to discover players from requests:', error);
                    }
                }
            } catch (error) {
                console.warn('⚠️ Failed to discover additional players:', error);
            }
return Array.from(discoveredPlayers);
        };

        // Generate community entries using real contract data and stored achievements
        const createCommunityEntries = async (category: string, isHigherBetter: boolean = true): Promise<LeaderboardEntry[]> => {
            const entries: LeaderboardEntry[] = [];

            // Get more comprehensive player list
            const allPlayers = await discoverMorePlayers();
// Get real data from all discovered players
            if (allPlayers.length > 0) {
                // Process players in batches to avoid overwhelming the contract
                const batchSize = 3;
                for (let i = 0; i < allPlayers.length; i += batchSize) {
                    const batch = allPlayers.slice(i, i + batchSize);

                    // Process batch concurrently
                    const batchPromises = batch.map(async (playerAddr) => {
                        try {
                            let realScore = 0;

                            if (category === 'freeSpins' && contract) {
                                try {
                                    const freeSpins = await contract.freeSpins(playerAddr);
                                    realScore = Number(freeSpins);
                                } catch (error) {
                                    console.warn(`⚠️ Failed to get free spins for ${playerAddr}:`, error);
                                }
                            } else if (category === 'jackpots') {
                                // Get jackpot achievements from localStorage - contract specific
                                const achievementKey = contractAddress
                                    ? `crimeLizardAchievements_${playerAddr.toLowerCase()}_${contractAddress.toLowerCase()}`
                                    : `crimeLizardAchievements_${playerAddr}`;
                                const achievements = JSON.parse(localStorage.getItem(achievementKey) || '{}');
                                realScore = achievements.biggestJackpot || 0;
                            } else if (category === 'bonusGames') {
                                // Get bonus game achievements from localStorage - contract specific
                                const achievementKey = contractAddress
                                    ? `crimeLizardAchievements_${playerAddr.toLowerCase()}_${contractAddress.toLowerCase()}`
                                    : `crimeLizardAchievements_${playerAddr}`;
                                const achievements = JSON.parse(localStorage.getItem(achievementKey) || '{}');
                                realScore = achievements.totalBonusAmount || 0;
                            } else if (category === 'lastBet' && contract) {
                                try {
                                    const lastBet = await contract.lastBet(playerAddr);
                                    realScore = Number(ethers.formatEther(lastBet));
                                } catch (error) {
                                    console.warn(`⚠️ Failed to get last bet for ${playerAddr}:`, error);
                                }
                            } else if (category === 'spins') {
                                // Try to get spin count from player stats stored locally - contract specific
                                const playerStatsKey = contractAddress
                                    ? `crimeLizardPlayerStats_${playerAddr.toLowerCase()}_${contractAddress.toLowerCase()}`
                                    : `crimeLizardPlayerStats_${playerAddr}`;
                                const playerStatsData = JSON.parse(localStorage.getItem(playerStatsKey) || '{}');
                                realScore = playerStatsData.totalSpins || 0;
                            } else if (category === 'singleWin') {
                                // Try to get highest single win from player stats - contract specific
                                const playerStatsKey = contractAddress
                                    ? `crimeLizardPlayerStats_${playerAddr.toLowerCase()}_${contractAddress.toLowerCase()}`
                                    : `crimeLizardPlayerStats_${playerAddr}`;
                                const playerStatsData = JSON.parse(localStorage.getItem(playerStatsKey) || '{}');
                                realScore = playerStatsData.highestSingleWin || 0;
                            } else if (category === 'rtp') {
                                // Calculate RTP from player stats (won/spent * 100) - contract specific
                                // Only include players with sufficient data (at least 10 spins and $1 spent)
                                const playerStatsKey = contractAddress
                                    ? `crimeLizardPlayerStats_${playerAddr.toLowerCase()}_${contractAddress.toLowerCase()}`
                                    : `crimeLizardPlayerStats_${playerAddr}`;
                                const playerStatsData = JSON.parse(localStorage.getItem(playerStatsKey) || '{}');
                                if (playerStatsData.totalSpent >= 1 && playerStatsData.totalSpins >= 10) {
                                    realScore = (playerStatsData.totalWon / playerStatsData.totalSpent) * 100;
                                    // Cap at reasonable range (50% to 200%) to avoid extreme outliers
                                    realScore = Math.max(50, Math.min(200, realScore));
                                } else {
                                    realScore = 95.0; // Default RTP if insufficient data
                                }
                            }

                            // Only include players with actual data
                            if (realScore > 0) {
                                return {
                                    address: playerAddr,
                                    displayName: generateDisplayName(playerAddr),
                                    score: realScore,
                                    rank: 0 // Will be set by sorting
                                };
                            }
                        } catch (error) {
                            console.warn(`Failed to get ${category} data for ${playerAddr}:`, error);
                        }
                        return null;
                    });

                    const batchResults = await Promise.all(batchPromises);
                    const validResults = batchResults.filter(result => result !== null);
                    entries.push(...validResults);
                }
            }

            // Sort by score
            if (isHigherBetter) {
                entries.sort((a, b) => b.score - a.score);
            } else {
                entries.sort((a, b) => a.score - b.score);
            }

            // Update ranks after sorting
            entries.forEach((entry, index) => {
                entry.rank = index + 1;
            });

            // Return top 10 entries for leaderboard
            return entries.slice(0, 10);
        };

        // Generate all leaderboard categories
        const [biggestJackpots, mostSpins, highestSingleWin, mostFreeSpins, bestRTP, bonusGames] = await Promise.all([
            createCommunityEntries('jackpots', true),      // Biggest jackpots from stored achievements
            createCommunityEntries('spins', true),         // Most spins from player stats
            createCommunityEntries('singleWin', true),     // Highest single win from player stats
            createCommunityEntries('freeSpins', true),     // Most free spins from contract
            createCommunityEntries('rtp', false),          // Best RTP (calculated from player stats)
            createCommunityEntries('bonusGames', true)     // Bonus game wins from stored achievements
        ]);

        // Insert player's actual performance into leaderboards
        if (playerAddress && playerStats) {
            // Helper function to insert player into leaderboard
            const insertPlayerEntry = (leaderboard: LeaderboardEntry[], score: number, categoryName: string) => {
                const existingIndex = leaderboard.findIndex(entry => entry.address.toLowerCase() === playerAddress.toLowerCase());

                const playerEntry = {
                    address: playerAddress,
                    displayName: 'YOU',
                    score: score,
                    rank: 0
                };

                if (existingIndex >= 0) {
                    // Update existing entry
                    leaderboard[existingIndex] = playerEntry;
                } else {
                    // Add new entry
                    leaderboard.push(playerEntry);
                }

                // Re-sort and update ranks
                if (categoryName === 'rtp') {
                    leaderboard.sort((a, b) => b.score - a.score); // Higher RTP is better
                } else {
                    leaderboard.sort((a, b) => b.score - a.score);
                }

                leaderboard.forEach((entry, index) => {
                    entry.rank = index + 1;
                });

                return leaderboard.slice(0, 10); // Keep top 10
            };

            // Insert player into leaderboards that have data available
            // Free spins from contract
            if (mostFreeSpins.length > 0 || playerStats.freeSpinsEarned > 0) {
                mostFreeSpins.splice(0, mostFreeSpins.length, ...insertPlayerEntry([...mostFreeSpins], playerStats.freeSpinsEarned, 'freeSpins'));
            }

            // Insert player into leaderboards with available data
            // Jackpots from achievements
            if (playerStats.biggestJackpot > 0) {
                biggestJackpots.splice(0, biggestJackpots.length, ...insertPlayerEntry([...biggestJackpots], playerStats.biggestJackpot, 'jackpots'));
            }

            // Spins from player stats
            if (playerStats.totalSpins > 0) {
                mostSpins.splice(0, mostSpins.length, ...insertPlayerEntry([...mostSpins], playerStats.totalSpins, 'spins'));
            }

            // Highest single win from player stats
            if (playerStats.highestSingleWin > 0) {
                highestSingleWin.splice(0, highestSingleWin.length, ...insertPlayerEntry([...highestSingleWin], playerStats.highestSingleWin, 'singleWin'));
            }

            // Bonus games from achievements - contract specific
            const achievementKey = contractAddress
                ? `crimeLizardAchievements_${playerAddress.toLowerCase()}_${contractAddress.toLowerCase()}`
                : `crimeLizardAchievements_${playerAddress}`;
            const playerAchievements = JSON.parse(localStorage.getItem(achievementKey) || '{}');
            const playerBonusTotal = playerAchievements.totalBonusAmount || 0;
            if (playerBonusTotal > 0) {
                bonusGames.splice(0, bonusGames.length, ...insertPlayerEntry([...bonusGames], playerBonusTotal, 'bonusGames'));
            }

            // RTP calculated from player stats
            if (playerRTP > 0) {
                bestRTP.splice(0, bestRTP.length, ...insertPlayerEntry([...bestRTP], playerRTP, 'rtp'));
            }
        }

        return {
            biggestJackpots,
            mostSpins,
            highestSingleWin,
            mostFreeSpins,
            bestRTP,
            bonusGames,
            lastUpdated: Date.now()
        };
    };

    // Load leaderboard data with real contract integration
    useEffect(() => {
        if (!isOpen) return;

        setIsLoading(true);

        // Generate leaderboard data with real contract data
        const loadLeaderboardData = async () => {
            try {
const data = await generateLeaderboardData(currentAccount, playerStats, contract);
setLeaderboardData(data);
            } catch (error) {
                console.error('❌ Failed to load leaderboard data:', error);
                // Fallback to basic data with current player if available
                const fallbackData: LeaderboardData = {
                    biggestJackpots: currentAccount && playerStats ? [{
                        address: currentAccount,
                        displayName: 'YOU',
                        score: playerStats.biggestJackpot || 0,
                        rank: 1
                    }] : [],
                    mostSpins: currentAccount && playerStats ? [{
                        address: currentAccount,
                        displayName: 'YOU',
                        score: playerStats.totalSpins || 0,
                        rank: 1
                    }] : [],
                    highestSingleWin: currentAccount && playerStats ? [{
                        address: currentAccount,
                        displayName: 'YOU',
                        score: playerStats.highestSingleWin || 0,
                        rank: 1
                    }] : [],
                    mostFreeSpins: currentAccount && playerStats ? [{
                        address: currentAccount,
                        displayName: 'YOU',
                        score: playerStats.freeSpinsEarned || 0,
                        rank: 1
                    }] : [],
                    bestRTP: [],
                    bonusGames: [],
                    lastUpdated: Date.now()
                };
                setLeaderboardData(fallbackData);
            } finally {
                setIsLoading(false);
            }
        };

        loadLeaderboardData();
    }, [isOpen, currentAccount, playerStats, contract]);

    if (!isOpen) return null;

    const getCurrentLeaderboard = () => {
        if (!leaderboardData) return [];
        switch (selectedCategory) {
            case 'jackpots': return leaderboardData.biggestJackpots;
            case 'spins': return leaderboardData.mostSpins;
            case 'singleWin': return leaderboardData.highestSingleWin;
            case 'freeSpins': return leaderboardData.mostFreeSpins;
            case 'rtp': return leaderboardData.bestRTP;
            case 'bonusGames': return leaderboardData.bonusGames;
            default: return leaderboardData.biggestJackpots;
        }
    };

    const getCategoryInfo = () => {
        switch (selectedCategory) {
            case 'jackpots':
                return {
                    title: `🏆 ${t.leaderboard.biggestJackpots}`,
                    subtitle: t.leaderboard.largestJackpotWins,
                    icon: '💎',
                    unit: ' Gold',
                    color: 'yellow'
                };
            case 'spins':
                return {
                    title: `🎰 ${t.leaderboard.mostActivePlayers}`,
                    subtitle: t.leaderboard.totalSpinsPlayed,
                    icon: '🎯',
                    unit: 'spins',
                    color: 'blue'
                };
            case 'singleWin':
                return {
                    title: `💰 ${t.leaderboard.highestSingleWins}`,
                    subtitle: t.leaderboard.biggestIndividualPayouts,
                    icon: '💵',
                    unit: ' Gold',
                    color: 'green'
                };
            case 'freeSpins':
                return {
                    title: `🎁 ${t.leaderboard.freeSpinChampions}`,
                    subtitle: t.leaderboard.mostFreeSpinsEarned,
                    icon: '🎪',
                    unit: 'spins',
                    color: 'purple'
                };
            case 'bonusGames':
                return {
                    title: `🦎 ${t.leaderboard.bonusGameMasters}`,
                    subtitle: t.leaderboard.totalBonusGameWinnings,
                    icon: '🔥',
                    unit: ' Gold',
                    color: 'orange'
                };
            case 'rtp':
                return {
                    title: `📊 ${t.leaderboard.bestRTPPlayers}`,
                    subtitle: t.leaderboard.highestReturnToPlayer,
                    icon: '📈',
                    unit: '%',
                    color: 'teal'
                };
            default:
                return {
                    title: `🏆 ${t.leaderboard.biggestJackpots}`,
                    subtitle: t.leaderboard.largestJackpotWins,
                    icon: '💎',
                    unit: ' Gold',
                    color: 'yellow'
                };
        }
    };

    const categoryInfo = getCategoryInfo();
    const currentLeaderboard = getCurrentLeaderboard();

    const RankBadge: React.FC<{ rank: number; isCurrentUser?: boolean }> = ({ rank, isCurrentUser }) => {
        const getRankColor = () => {
            switch (rank) {
                case 1: return 'from-yellow-400 to-yellow-600';
                case 2: return 'from-gray-300 to-gray-500';
                case 3: return 'from-amber-600 to-amber-800';
                default: return 'from-gray-600 to-gray-800';
            }
        };

        const getRankIcon = () => {
            switch (rank) {
                case 1: return '👑';
                case 2: return '🥈';
                case 3: return '🥉';
                default: return `#${rank}`;
            }
        };

        return (
            <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${getRankColor()} text-white font-bold text-lg shadow-lg ${isCurrentUser ? 'ring-2 ring-[#FFD700] ring-offset-2 ring-offset-gray-900' : ''}`}>
                {getRankIcon()}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black/90 z-modal flex items-center justify-center p-4 overscroll-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-black border-2 border-[#00FF88] p-8 max-w-4xl w-full max-h-[90dvh] overflow-y-auto paytable-scroll font-bbs pb-safe-bottom"
                >
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF88] mx-auto mb-4"></div>
                        <p className="text-[#00FF88] text-lg text-glow-green">{t.leaderboard.loading}</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/90 z-modal flex items-center justify-center p-4 overscroll-none">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-black border-2 border-[#00FF88] p-6 max-w-6xl w-full max-h-[90dvh] overflow-y-auto paytable-scroll font-bbs pb-safe-bottom"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-yellow-500 text-glow-gold">{t.leaderboard.title}</h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-400 text-2xl font-bold"
                    >
                        [X]
                    </button>
                </div>

                {/* Category Selector */}
                <div className="flex flex-wrap gap-2 mb-6 p-4 bg-black border-2 border-[#00FF88]">
                    {[
                        { key: 'jackpots', label: t.leaderboard.categoryJackpots, icon: '💎' },
                        { key: 'bonusGames', label: t.leaderboard.categoryBonus, icon: '🦎' },
                        { key: 'freeSpins', label: t.leaderboard.categoryFreeSpins, icon: '🎁' },
                        { key: 'spins', label: t.leaderboard.categorySpins, icon: '🎰' },
                        { key: 'singleWin', label: t.leaderboard.categoryBigWins, icon: '💰' },
                        { key: 'rtp', label: t.leaderboard.categoryRTP, icon: '📊' }
                    ].map((category) => (
                        <button
                            key={category.key}
                            onClick={() => setSelectedCategory(category.key as any)}
                            className={`px-4 py-2 font-medium transition-all duration-200 flex items-center space-x-2 border-2 ${selectedCategory === category.key
                                ? 'bg-[#00AA55]/30 text-yellow-500 border-[#00FF88] text-glow-gold'
                                : 'bg-black text-gray-400 border-gray-700 hover:border-[#00DD77] hover:text-green-400'
                                }`}
                        >
                            <span>{category.icon}</span>
                            <span>{category.label}</span>
                        </button>
                    ))}
                </div>

                {/* Current Category Leaderboard */}
                <div className="mb-6">
                    <h3 className="text-center text-xl font-bold text-[#00FF88] text-glow-green mb-3">{categoryInfo.icon} {categoryInfo.title}</h3>
                    <div className="mb-2">
                        <p className="text-gray-400 text-sm text-center">{categoryInfo.subtitle}</p>
                    </div>

                    <div className="space-y-3">
                        {currentLeaderboard.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="text-4xl mb-4">🏆</div>
                                <h3 className="text-xl font-bold text-white mb-2">{t.leaderboard.noPlayersYet}</h3>
                                <p className="text-gray-400 text-sm">
                                    {t.leaderboard.beTheFirst}
                                    <br />
                                    {t.leaderboard.leaderboardWillFill}
                                </p>
                            </motion.div>
                        ) : (
                            currentLeaderboard.map((entry, index) => {
                                const isCurrentUser = currentAccount && entry.address.toLowerCase() === currentAccount.toLowerCase();
                                return (
                                    <motion.div
                                        key={entry.address}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`flex items-center justify-between p-4 border-2 transition-all duration-300 ${isCurrentUser
                                            ? 'bg-[#00AA55]/20 border-yellow-500 text-glow-gold'
                                            : 'bg-black border-gray-700 hover:border-[#00DD77]'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <RankBadge rank={entry.rank} isCurrentUser={!!isCurrentUser} />
                                            <div>
                                                <div className={`font-bold ${isCurrentUser ? 'text-yellow-500 text-glow-gold' : 'text-green-400'}`}>
                                                    {isCurrentUser ? t.leaderboard.you : entry.displayName}
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono">
                                                    {`${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xl font-bold ${selectedCategory === 'rtp' ? 'text-cyan-400' :
                                                selectedCategory === 'jackpots' ? 'text-yellow-400 text-glow-gold' :
                                                    selectedCategory === 'singleWin' ? 'text-green-400 text-glow-green' :
                                                        selectedCategory === 'freeSpins' ? 'text-purple-400' :
                                                            'text-blue-400'
                                                }`}>
                                                {selectedCategory === 'rtp'
                                                    ? `${entry.score.toFixed(1)}${categoryInfo.unit}`
                                                    : (categoryInfo.unit === ' Gold'
                                                        ? `${formatGoldAmount(entry.score)}${categoryInfo.unit}`
                                                        : `${entry.score.toLocaleString()}${categoryInfo.unit}`)
                                                }
                                            </div>
                                            {isCurrentUser && (
                                                <div className="text-xs text-yellow-500 font-medium">
                                                    {t.leaderboard.yourRank}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="bg-black border-2 border-[#00FF88] p-4">
                    <h3 className="text-center text-xl font-bold text-[#00FF88] text-glow-green mb-3">📈 {t.leaderboard.communityStats.toUpperCase()}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[#00FF88] text-glow-green">
                                {knownPlayers.length > 0 ? knownPlayers.length.toString() : '0'}
                            </p>
                            <p className="text-gray-400">{t.leaderboard.totalPlayers}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[#00FF88] text-glow-green">
                                {playerStats?.totalSpins || '0'}
                            </p>
                            <p className="text-gray-400">{t.leaderboard.yourTotalSpins}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[#00FF88] text-glow-green">
                                {playerStats?.biggestJackpot ? `${formatGoldAmount(playerStats.biggestJackpot)} Gold` : '0 Gold'}
                            </p>
                            <p className="text-gray-400">{t.leaderboard.yourBiggestJackpot}</p>
                        </div>
                    </div>
                    <div className="mt-4 text-center text-xs text-gray-400">
                        {t.leaderboard.realTimeStats}
                    </div>
                </div>

                {/* Close Button */}
                <div className="flex justify-center mt-6">
                    <motion.button
                        onClick={onClose}
                        className="px-8 py-3 bg-black border-2 border-[#00FF88] text-[#00FF88] font-bold hover:bg-[#00AA55]/30 hover:text-yellow-500 transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        [ESC] {t.leaderboard.closeLeaderboard}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default LeaderboardModal;
