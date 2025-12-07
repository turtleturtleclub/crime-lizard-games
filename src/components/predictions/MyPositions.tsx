/**
 * My Positions - Player's active and past bets
 * Styled to match Bank/Satchel UI
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Bet } from '../../types/prediction.types';

interface MyPositionsProps {
    bets: Bet[];
    onClaimWinnings: (marketId: number) => Promise<void>;
    onViewMarket: (marketId: number) => void;
}

// Helper to format odds
function formatOdds(odds: number): string {
    if (odds === 0) return '-';
    return `${(odds / 10000).toFixed(2)}x`;
}

// Format relative time
function formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

type BetWithStatus = Bet & {
    question?: string;
    outcomeName?: string;
    marketStatus?: string;
    winningOutcome?: number;
};

export default function MyPositions({ bets, onClaimWinnings, onViewMarket }: MyPositionsProps) {
    // Group bets by status
    const { activeBets, claimableBets, resolvedBets } = useMemo(() => {
        const active: BetWithStatus[] = [];
        const claimable: BetWithStatus[] = [];
        const resolved: BetWithStatus[] = [];

        bets.forEach((bet: BetWithStatus) => {
            if (bet.marketStatus === 'ACTIVE') {
                active.push(bet);
            } else if (bet.marketStatus === 'RESOLVED') {
                if (!bet.claimed && bet.outcomeIndex === bet.winningOutcome) {
                    claimable.push(bet);
                } else {
                    resolved.push(bet);
                }
            }
        });

        return { activeBets: active, claimableBets: claimable, resolvedBets: resolved };
    }, [bets]);

    // Total claimable
    const totalClaimable = claimableBets.reduce((sum, b) => sum + (b.potentialPayout || 0), 0);

    // Group claimable by market
    const claimableByMarket = useMemo(() => {
        const grouped: Record<number, BetWithStatus[]> = {};
        claimableBets.forEach(bet => {
            if (!grouped[bet.marketId]) grouped[bet.marketId] = [];
            grouped[bet.marketId].push(bet);
        });
        return grouped;
    }, [claimableBets]);

    const renderBetCard = (bet: BetWithStatus, showActions = false) => {
        const isWinner = bet.marketStatus === 'RESOLVED' && bet.outcomeIndex === bet.winningOutcome;
        const isLoser = bet.marketStatus === 'RESOLVED' && bet.outcomeIndex !== bet.winningOutcome;

        return (
            <motion.div
                key={`${bet.marketId}-${bet.timestamp}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-black border p-3 ${
                    isWinner && !bet.claimed
                        ? 'border-[#00FF88]'
                        : isLoser
                        ? 'border-red-500/50'
                        : 'border-gray-700'
                }`}
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">
                            {formatRelativeTime(bet.timestamp)}
                        </div>
                        <div className="text-white text-sm font-bold mb-2 line-clamp-2">
                            {bet.question || `Market #${bet.marketId}`}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs border ${
                                isWinner
                                    ? 'bg-[#00FF88]/10 border-[#00FF88] text-[#00FF88]'
                                    : isLoser
                                    ? 'bg-red-500/10 border-red-500/50 text-red-400'
                                    : 'bg-gray-800 border-gray-600 text-gray-300'
                            }`}>
                                {bet.outcomeName || `Option ${bet.outcomeIndex + 1}`}
                            </span>
                            {isWinner && !bet.claimed && (
                                <span className="text-[#00FF88] text-xs font-bold">WIN!</span>
                            )}
                            {isLoser && (
                                <span className="text-red-400 text-xs">Lost</span>
                            )}
                            {bet.claimed && (
                                <span className="text-gray-500 text-xs">Claimed</span>
                            )}
                        </div>
                    </div>

                    <div className="text-right ml-3">
                        <div className="text-yellow-500 font-bold text-sm">
                            {bet.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">
                            @ {formatOdds(bet.oddsAtBet)}
                        </div>
                        {(isWinner || bet.marketStatus === 'ACTIVE') && (
                            <div className="text-xs text-[#00FF88] font-bold mt-1">
                                +{(bet.potentialPayout || 0).toLocaleString()}
                            </div>
                        )}
                        {isLoser && (
                            <div className="text-xs text-red-400 mt-1">
                                -{bet.amount.toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-800">
                    <button
                        onClick={() => onViewMarket(bet.marketId)}
                        className="text-xs text-[#00FF88] hover:underline"
                    >
                        View Market
                    </button>

                    {showActions && isWinner && !bet.claimed && (
                        <button
                            onClick={() => onClaimWinnings(bet.marketId)}
                            className="ml-auto px-3 py-1 bg-[#00AA55] border border-[#00FF88] text-[#00FF88] text-xs font-bold hover:bg-[#00BB66] transition-all"
                        >
                            CLAIM
                        </button>
                    )}
                </div>
            </motion.div>
        );
    };

    if (bets.length === 0) {
        return (
            <div className="text-center py-8">
                <h3 className="text-lg font-bold text-gray-400 mb-2">NO BETS YET</h3>
                <p className="text-gray-500 text-sm">
                    Browse markets and place your first prediction!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Claimable Winnings Banner */}
            {totalClaimable > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-black border-2 border-[#00FF88] p-4"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[#00FF88] font-bold text-sm">UNCLAIMED WINNINGS</div>
                            <div className="text-2xl font-bold text-white">
                                {totalClaimable.toLocaleString()} gold
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-400">
                                {Object.keys(claimableByMarket).length} market(s)
                            </div>
                            <button
                                onClick={() => {
                                    // Claim from first market
                                    const firstMarketId = parseInt(Object.keys(claimableByMarket)[0]);
                                    if (firstMarketId) onClaimWinnings(firstMarketId);
                                }}
                                className="mt-2 px-4 py-2 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] font-bold hover:bg-[#00BB66] transition-all"
                            >
                                CLAIM ALL
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Active Bets */}
            {activeBets.length > 0 && (
                <div>
                    <h3 className="text-[#00FF88] font-bold text-sm mb-2 flex items-center gap-2 text-glow-green">
                        <span className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse"></span>
                        ACTIVE ({activeBets.length})
                    </h3>
                    <div className="space-y-2">
                        {activeBets.map(bet => renderBetCard(bet))}
                    </div>
                </div>
            )}

            {/* Claimable Bets */}
            {claimableBets.length > 0 && (
                <div>
                    <h3 className="text-yellow-500 font-bold text-sm mb-2">
                        CLAIMABLE ({claimableBets.length})
                    </h3>
                    <div className="space-y-2">
                        {claimableBets.map(bet => renderBetCard(bet, true))}
                    </div>
                </div>
            )}

            {/* Resolved Bets */}
            {resolvedBets.length > 0 && (
                <div>
                    <h3 className="text-gray-400 font-bold text-sm mb-2">
                        HISTORY ({resolvedBets.length})
                    </h3>
                    <div className="space-y-2">
                        {resolvedBets.slice(0, 10).map(bet => renderBetCard(bet))}
                    </div>
                    {resolvedBets.length > 10 && (
                        <div className="text-center text-gray-500 mt-2 text-xs">
                            Showing 10 of {resolvedBets.length}
                        </div>
                    )}
                </div>
            )}

            {/* Stats Summary */}
            <div className="bg-black border border-gray-700 p-4">
                <h4 className="text-gray-400 font-bold text-sm mb-3">SUMMARY</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="bg-gray-900/50 p-2 border border-gray-800">
                        <div className="text-xl font-bold text-white">{bets.length}</div>
                        <div className="text-xs text-gray-500">Total</div>
                    </div>
                    <div className="bg-gray-900/50 p-2 border border-gray-800">
                        <div className="text-xl font-bold text-yellow-500">
                            {bets.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">Wagered</div>
                    </div>
                    <div className="bg-gray-900/50 p-2 border border-gray-800">
                        <div className="text-xl font-bold text-[#00FF88]">
                            {resolvedBets.filter(b => b.outcomeIndex === b.winningOutcome).length}
                        </div>
                        <div className="text-xs text-gray-500">Correct</div>
                    </div>
                    <div className="bg-gray-900/50 p-2 border border-gray-800">
                        <div className="text-xl font-bold text-red-400">
                            {resolvedBets.filter(b => b.outcomeIndex !== b.winningOutcome).length}
                        </div>
                        <div className="text-xs text-gray-500">Incorrect</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
