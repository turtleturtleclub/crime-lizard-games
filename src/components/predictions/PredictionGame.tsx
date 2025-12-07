/**
 * CRIME LIZARD PREDICTIONS - Parimutuel Prediction Market
 * Dynamic odds that shift as bets come in!
 */

import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { WalletContext } from '../../providers/WalletContext';
import { useCharacter } from '../../contexts/CharacterContext';
import { useModalClose } from '../../hooks/useModalClose';
import { Howl } from 'howler';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { Market, Bet, PlayerPredictionStats } from '../../types/prediction.types';
import { MarketStatus } from '../../types/prediction.types';
import MarketBrowser from './MarketBrowser';
import MarketDetail from './MarketDetail';
import MyPositions from './MyPositions';
import '../../App.css';

// Sound effects
const sounds = {
    bet: new Howl({ src: ['/assets/spin.mp3'], volume: 0.3 }),
    win: new Howl({ src: ['/assets/win.mp3'], volume: 0.4 }),
    bigWin: new Howl({ src: ['/assets/jackpot.mp3'], volume: 0.5 }),
    loss: new Howl({ src: ['/assets/near-miss.mp3'], volume: 0.2 }),
    tick: new Howl({ src: ['/assets/tick.mp3'], volume: 0.1, sprite: { tick: [0, 100] } })
};

// API base URL
const API_BASE = '';

// Tab options
type TabType = 'browse' | 'positions' | 'leaderboard';

interface PredictionGameProps {
    onClose: () => void;
}

interface LeaderboardEntry {
    rank: number;
    walletAddress: string;
    accuracy: number;
    totalBets: number;
    correctPredictions: number;
    totalWon: number;
    currentStreak: number;
    bestStreak: number;
}

export default function PredictionGame({ onClose }: PredictionGameProps) {
    const { account } = useContext(WalletContext);
    const { selectedCharacter, goldBalance, refreshGoldBalance } = useCharacter();

    // Handle ESC key, mobile back button
    useModalClose(onClose);

    // State
    const [activeTab, setActiveTab] = useState<TabType>('browse');
    const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
    const [markets, setMarkets] = useState<Market[]>([]);
    const [myBets, setMyBets] = useState<Bet[]>([]);
    const [playerStats, setPlayerStats] = useState<PlayerPredictionStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Socket connection
    const socketRef = useRef<Socket | null>(null);

    // Initialize socket connection
    useEffect(() => {
        const socket = io(window.location.origin, {
            path: '/socket.io/',
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            socket.emit('prediction:join_active');
        });

        socket.on('prediction:odds_update', (data) => {
            setMarkets(prev => prev.map(m =>
                m.id === data.marketId
                    ? { ...m, pools: data.pools, totalPool: data.totalPool, cachedOdds: data.odds }
                    : m
            ));

            if (selectedMarket?.id === data.marketId) {
                setSelectedMarket(prev => prev ? {
                    ...prev,
                    pools: data.pools,
                    totalPool: data.totalPool,
                    cachedOdds: data.odds
                } : null);
            }
        });

        socket.on('prediction:market_resolved', (data) => {
            setMarkets(prev => prev.map(m =>
                m.id === data.marketId
                    ? { ...m, status: MarketStatus.RESOLVED, winningOutcome: data.winningOutcome }
                    : m
            ));

            if (selectedMarket?.id === data.marketId) {
                setSelectedMarket(prev => prev ? {
                    ...prev,
                    status: MarketStatus.RESOLVED,
                    winningOutcome: data.winningOutcome
                } : null);
                toast.success(`Market resolved! ${data.winningOutcomeName} wins!`);
            }
        });

        socket.on('prediction:new_market', (data) => {
            setMarkets(prev => [data.market, ...prev]);
            toast.info(`New market: ${data.market.question}`);
        });

        socket.on('prediction:big_bet', (data) => {
            toast.info(`${data.playerName} bet ${data.amount} gold on "${data.outcomeName}"`);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [selectedMarket?.id]);

    // Join specific market room when selected
    useEffect(() => {
        if (socketRef.current && selectedMarket) {
            socketRef.current.emit('prediction:join_market', selectedMarket.id);
        }
    }, [selectedMarket?.id]);

    // Fetch markets
    const fetchMarkets = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/api/predictions/markets?status=ACTIVE`);
            const data = await response.json();
            setMarkets(data.markets || []);
        } catch (err) {
            console.error('Error fetching markets:', err);
            setError('Failed to load markets');
        }
    }, []);

    // Fetch player's bets
    const fetchMyBets = useCallback(async () => {
        if (!account || !selectedCharacter?.tokenId) return;

        try {
            const response = await fetch(
                `${API_BASE}/api/predictions/my-bets/${account}/${selectedCharacter.tokenId}`
            );
            const data = await response.json();
            setMyBets(data.bets || []);
        } catch (err) {
            console.error('Error fetching bets:', err);
        }
    }, [account, selectedCharacter?.tokenId]);

    // Fetch player stats
    const fetchPlayerStats = useCallback(async () => {
        if (!account || !selectedCharacter?.tokenId) return;

        try {
            const response = await fetch(
                `${API_BASE}/api/predictions/stats/${account}/${selectedCharacter.tokenId}`
            );
            const data = await response.json();
            setPlayerStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }, [account, selectedCharacter?.tokenId]);

    // Fetch leaderboard
    const fetchLeaderboard = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/api/predictions/leaderboard`);
            const data = await response.json();
            setLeaderboard(data.leaderboard || []);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        }
    }, []);

    // Initial data load
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchMarkets(),
                fetchMyBets(),
                fetchPlayerStats(),
                fetchLeaderboard()
            ]);
            setLoading(false);
        };

        loadData();
    }, [fetchMarkets, fetchMyBets, fetchPlayerStats, fetchLeaderboard]);

    // Place bet handler
    const handlePlaceBet = async (marketId: number, outcomeIndex: number, amount: number) => {
        if (!account || !selectedCharacter?.tokenId) {
            toast.error('Please connect wallet and select a character');
            return;
        }

        const goldNum = parseInt(goldBalance || '0');
        if (amount > goldNum) {
            toast.error('Insufficient gold');
            return;
        }

        try {
            sounds.bet.play();

            const betPayload = {
                marketId,
                characterId: Number(selectedCharacter.tokenId),
                outcomeIndex,
                amount,
                walletAddress: account
            };

            const response = await fetch(`${API_BASE}/api/predictions/bet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(betPayload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to place bet');
            }

            toast.success(`Bet placed! ${amount} gold on outcome ${outcomeIndex + 1}`);
            await refreshGoldBalance();
            await fetchMyBets();

            // Update market with new odds
            if (data.newOdds && selectedMarket) {
                setSelectedMarket(prev => prev ? {
                    ...prev,
                    pools: selectedMarket.pools.map((p, i) =>
                        i === outcomeIndex ? p + amount : p
                    ),
                    totalPool: selectedMarket.totalPool + amount,
                    cachedOdds: data.newOdds
                } : null);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to place bet');
            console.error('Bet error:', err);
        }
    };

    // Claim winnings handler
    const handleClaimWinnings = async (marketId: number) => {
        if (!account || !selectedCharacter?.tokenId) {
            toast.error('Please connect wallet and select a character');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/predictions/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    marketId,
                    characterId: Number(selectedCharacter.tokenId),
                    walletAddress: account
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to claim winnings');
            }

            if (data.payout > 0) {
                sounds.win.play();
                toast.success(`Claimed ${data.payout} gold!`);
            } else {
                toast.info('No winnings to claim');
            }

            await refreshGoldBalance();
            await fetchMyBets();
            await fetchPlayerStats();
        } catch (err: any) {
            toast.error(err.message || 'Failed to claim winnings');
            console.error('Claim error:', err);
        }
    };


    // Format address
    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Render content
    const renderContent = () => {
        if (selectedMarket) {
            return (
                <MarketDetail
                    market={selectedMarket}
                    onBack={() => setSelectedMarket(null)}
                    onPlaceBet={handlePlaceBet}
                    goldBalance={parseInt(String(goldBalance) || '0')}
                    myBets={myBets.filter(b => b.marketId === selectedMarket.id)}
                    onClaimWinnings={handleClaimWinnings}
                />
            );
        }

        switch (activeTab) {
            case 'browse':
                return (
                    <MarketBrowser
                        markets={markets}
                        onSelectMarket={setSelectedMarket}
                        loading={loading}
                    />
                );
            case 'positions':
                return (
                    <MyPositions
                        bets={myBets}
                        onClaimWinnings={handleClaimWinnings}
                        onViewMarket={(marketId) => {
                            const market = markets.find(m => m.id === marketId);
                            if (market) setSelectedMarket(market);
                        }}
                    />
                );
            case 'leaderboard':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-[#00FF88] text-glow-green">TOP PREDICTORS</h3>
                        <div className="bg-black border border-[#00FF88] overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-[#00AA55]/20">
                                    <tr className="text-left text-[#00FF88]">
                                        <th className="p-2">#</th>
                                        <th className="p-2">Player</th>
                                        <th className="p-2">Acc%</th>
                                        <th className="p-2 hidden md:table-cell">Bets</th>
                                        <th className="p-2">Won</th>
                                        <th className="p-2 hidden md:table-cell">Streak</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((entry) => (
                                        <tr
                                            key={entry.walletAddress}
                                            className={`border-t border-gray-800 hover:bg-[#00FF88]/5 ${
                                                entry.walletAddress.toLowerCase() === account?.toLowerCase()
                                                    ? 'bg-[#00FF88]/10'
                                                    : ''
                                            }`}
                                        >
                                            <td className="p-2 text-gray-400">
                                                {entry.rank <= 3 ? (
                                                    <span className={
                                                        entry.rank === 1 ? 'text-yellow-400' :
                                                        entry.rank === 2 ? 'text-gray-300' :
                                                        'text-amber-600'
                                                    }>
                                                        {entry.rank === 1 ? '1st' : entry.rank === 2 ? '2nd' : '3rd'}
                                                    </span>
                                                ) : entry.rank}
                                            </td>
                                            <td className="p-2 font-mono text-xs text-white">
                                                {formatAddress(entry.walletAddress)}
                                            </td>
                                            <td className="p-2 text-[#00FF88] font-bold">
                                                {entry.accuracy.toFixed(0)}%
                                            </td>
                                            <td className="p-2 text-gray-300 hidden md:table-cell">{entry.totalBets}</td>
                                            <td className="p-2 text-yellow-500 font-bold">
                                                {entry.totalWon.toLocaleString()}
                                            </td>
                                            <td className="p-2 hidden md:table-cell">
                                                <span className="text-orange-400">{entry.currentStreak}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {leaderboard.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-500">
                                                No predictions yet. Be the first!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Portal render
    return createPortal(
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
                className="bg-black border-2 border-[#00FF88] p-4 md:p-6 max-w-4xl w-full h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto overflow-x-hidden font-bbs pb-safe-bottom"
                style={{ touchAction: 'pan-y' }}
            >
                {/* Header */}
                <div className="text-[#00FF88] text-center mb-4 text-glow-green">
                    <div className="text-2xl font-bold">🔮  PREDICTION MARKET  🔮</div>
                </div>
                <div className="text-center mb-4 text-gray-400 text-sm">
                    Dynamic odds • Winners take all
                </div>

                {/* Player Stats Row */}
                {playerStats && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-black border border-[#00FF88] p-3 text-center">
                            <div className="text-[#00FF88] text-xl font-bold">
                                {playerStats.accuracy?.toFixed(1) || 0}%
                            </div>
                            <div className="text-xs text-gray-400">Accuracy</div>
                        </div>
                        <div className="bg-black border border-orange-500 p-3 text-center">
                            <div className="text-orange-400 text-xl font-bold">
                                {playerStats.currentStreak || 0}
                            </div>
                            <div className="text-xs text-gray-400">Streak</div>
                        </div>
                        <div className="bg-black border border-yellow-500 p-3 text-center">
                            <div className="text-yellow-500 text-xl font-bold">
                                {parseInt(String(goldBalance) || '0').toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">Gold</div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                {!selectedMarket && (
                    <div className="flex gap-2 mb-4">
                        {(['browse', 'positions', 'leaderboard'] as TabType[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 px-3 font-bold border-2 transition-all text-sm ${
                                    activeTab === tab
                                        ? 'bg-[#00AA55] border-[#00FF88] text-[#00FF88]'
                                        : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                                }`}
                            >
                                {tab === 'browse' && 'Markets'}
                                {tab === 'positions' && 'My Bets'}
                                {tab === 'leaderboard' && 'Leaders'}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="min-h-[200px]">
                    {error ? (
                        <div className="text-center text-red-400 py-8">
                            {error}
                            <button
                                onClick={() => {
                                    setError(null);
                                    fetchMarkets();
                                }}
                                className="ml-4 text-[#00FF88] hover:underline"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedMarket?.id || activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                            >
                                {renderContent()}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-4 px-4 py-3 bg-black border-2 border-gray-600 text-gray-400 hover:bg-gray-900 font-bold"
                >
                    [ESC] LEAVE
                </button>
            </motion.div>
        </motion.div>,
        document.body
    );
}
