/**
 * Market Detail - Full view of a single market with betting
 * Styled to match Bank/Satchel UI
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Market, Bet } from '../../types/prediction.types';
import { MarketStatus } from '../../types/prediction.types';
import BetSlip from './BetSlip';

interface MarketDetailProps {
    market: Market;
    onBack: () => void;
    onPlaceBet: (marketId: number, outcomeIndex: number, amount: number) => Promise<void>;
    goldBalance: number;
    myBets: Bet[];
    onClaimWinnings: (marketId: number) => Promise<void>;
}

// Helper to format time remaining
function formatTimeRemaining(deadline: Date | string): { text: string; urgent: boolean } {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return { text: 'BETTING CLOSED', urgent: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return { text: `${days}d ${hours}h remaining`, urgent: false };
    if (hours > 0) return { text: `${hours}h ${minutes}m remaining`, urgent: hours < 1 };
    if (minutes > 0) return { text: `${minutes}m ${seconds}s remaining`, urgent: minutes < 5 };
    return { text: `${seconds}s remaining`, urgent: true };
}

// Helper to format odds
function formatOdds(odds: number): string {
    if (odds === 0) return '-';
    return `${(odds / 10000).toFixed(2)}x`;
}

// Calculate implied probability
function getImpliedProbability(odds: number): number {
    if (odds === 0) return 0;
    return Math.round((10000 / odds) * 100);
}

export default function MarketDetail({
    market,
    onBack,
    onPlaceBet,
    goldBalance,
    myBets,
    onClaimWinnings
}: MarketDetailProps) {
    const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(market.bettingDeadline));
    const [isPlacingBet, setIsPlacingBet] = useState(false);

    // Update countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining(formatTimeRemaining(market.bettingDeadline));
        }, 1000);

        return () => clearInterval(interval);
    }, [market.bettingDeadline]);

    // Check if user can claim
    const claimableAmount = useMemo(() => {
        if (market.status !== MarketStatus.RESOLVED) return 0;

        return myBets
            .filter(b => !b.claimed && b.outcomeIndex === market.winningOutcome)
            .reduce((sum, b) => sum + (b.potentialPayout || 0), 0);
    }, [market, myBets]);

    // My total bet on each outcome
    const myBetsByOutcome = useMemo(() => {
        const bets: Record<number, number> = {};
        myBets.forEach(b => {
            bets[b.outcomeIndex] = (bets[b.outcomeIndex] || 0) + b.amount;
        });
        return bets;
    }, [myBets]);

    // Handle bet placement
    const handlePlaceBet = async (amount: number) => {
        if (selectedOutcome === null) return;

        setIsPlacingBet(true);
        try {
            // Use market.id, fallback to marketId if id is undefined
            const marketId = market.id ?? (market as any).marketId;
            await onPlaceBet(marketId, selectedOutcome, amount);
            setSelectedOutcome(null);
        } finally {
            setIsPlacingBet(false);
        }
    };

    const isBettingOpen = new Date(market.bettingDeadline) > new Date() && market.status === MarketStatus.ACTIVE;

    return (
        <div className="space-y-4">
            {/* Back Button & Title */}
            <div className="flex items-start gap-3">
                <button
                    onClick={onBack}
                    className="px-3 py-1 bg-black border border-gray-600 text-gray-400 hover:border-[#00FF88] hover:text-[#00FF88] transition-all text-sm"
                >
                    BACK
                </button>
                <div className="flex-1">
                    <h2 className="text-white font-bold text-sm mb-1">{market.question}</h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`${timeRemaining.urgent ? 'text-red-400' : 'text-[#00FF88]'}`}>
                            {timeRemaining.text}
                        </span>
                        <span className="text-gray-600">|</span>
                        <span className="text-yellow-500 font-bold">
                            {market.totalPool.toLocaleString()} gold
                        </span>
                        <span className="text-gray-600">|</span>
                        <span className="text-gray-400">
                            {market.totalBets} bets
                        </span>
                    </div>
                </div>
            </div>

            {/* Status Banner - Resolved */}
            {market.status === MarketStatus.RESOLVED && (
                <div className="bg-black border-2 border-[#00FF88] p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[#00FF88] font-bold text-sm">MARKET RESOLVED</div>
                            <div className="text-white text-lg font-bold mt-1">
                                Winner: {market.outcomes[market.winningOutcome!]}
                            </div>
                        </div>
                        {claimableAmount > 0 && (
                            <button
                                onClick={() => onClaimWinnings(market.id)}
                                className="px-4 py-2 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] font-bold hover:bg-[#00BB66] transition-all"
                            >
                                CLAIM {claimableAmount.toLocaleString()} GOLD
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Outcomes List - Takes more space */}
                <div className="lg:col-span-3 space-y-2">
                    <h3 className="text-[#00FF88] font-bold text-sm text-glow-green">SELECT OUTCOME</h3>

                    {market.outcomes.map((outcome, i) => {
                        const odds = market.cachedOdds?.[i] || 0;
                        const pool = market.pools[i] || 0;
                        const poolPercent = market.totalPool > 0 ? (pool / market.totalPool) * 100 : 0;
                        const myBet = myBetsByOutcome[i] || 0;
                        const isWinner = market.status === MarketStatus.RESOLVED && market.winningOutcome === i;
                        const isSelected = selectedOutcome === i;

                        return (
                            <motion.div
                                key={i}
                                onClick={() => isBettingOpen && setSelectedOutcome(isSelected ? null : i)}
                                className={`relative overflow-hidden border-2 transition-all ${
                                    isWinner
                                        ? 'border-[#00FF88] bg-[#00FF88]/10'
                                        : isSelected
                                        ? 'border-yellow-500 bg-yellow-500/10'
                                        : 'border-gray-700 bg-black hover:border-gray-600'
                                } ${isBettingOpen ? 'cursor-pointer' : ''}`}
                                whileHover={isBettingOpen ? { scale: 1.01 } : {}}
                                whileTap={isBettingOpen ? { scale: 0.99 } : {}}
                            >
                                {/* Pool percentage background */}
                                <div
                                    className={`absolute inset-0 ${
                                        isWinner ? 'bg-[#00FF88]/20' : 'bg-[#00FF88]/5'
                                    }`}
                                    style={{ width: `${poolPercent}%` }}
                                />

                                <div className="relative p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isWinner && (
                                            <span className="text-[#00FF88] font-bold">WIN</span>
                                        )}
                                        {isSelected && !isWinner && (
                                            <span className="text-yellow-500 font-bold">*</span>
                                        )}
                                        <div>
                                            <div className={`font-bold text-sm ${isWinner ? 'text-[#00FF88]' : 'text-white'}`}>
                                                {outcome}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {poolPercent.toFixed(1)}% | {pool.toLocaleString()} gold
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xl font-bold text-[#00FF88]">
                                            {formatOdds(odds)}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {getImpliedProbability(odds)}% prob
                                        </div>
                                        {myBet > 0 && (
                                            <div className="text-xs text-yellow-500 mt-1">
                                                Your: {myBet.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bet Slip / Info Panel */}
                <div className="lg:col-span-2 space-y-4">
                    {isBettingOpen && selectedOutcome !== null ? (
                        <BetSlip
                            outcome={market.outcomes[selectedOutcome]}
                            currentOdds={market.cachedOdds?.[selectedOutcome] || 0}
                            currentPool={market.pools[selectedOutcome] || 0}
                            totalPool={market.totalPool}
                            goldBalance={goldBalance}
                            onPlaceBet={handlePlaceBet}
                            onCancel={() => setSelectedOutcome(null)}
                            isLoading={isPlacingBet}
                        />
                    ) : (
                        <>
                            {/* Market Info */}
                            <div className="bg-black border border-[#00FF88] p-4 space-y-3">
                                <h3 className="font-bold text-[#00FF88] text-sm">MARKET INFO</h3>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Total Pool</span>
                                        <span className="text-yellow-500 font-bold">
                                            {market.totalPool.toLocaleString()} gold
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Total Bets</span>
                                        <span className="text-white">{market.totalBets}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">House Fee</span>
                                        <span className="text-white">5%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Resolution</span>
                                        <span className="text-white text-xs">
                                            {new Date(market.resolutionTime).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* My Bets on this Market */}
                            {myBets.length > 0 && (
                                <div className="bg-black border border-cyan-500 p-4 space-y-3">
                                    <h3 className="font-bold text-cyan-500 text-sm">MY BETS</h3>

                                    {myBets.map((bet, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between text-xs bg-gray-900/50 border border-gray-700 p-2"
                                        >
                                            <div>
                                                <div className="text-white">
                                                    {market.outcomes[bet.outcomeIndex]}
                                                </div>
                                                <div className="text-gray-400">
                                                    {bet.amount.toLocaleString()} @ {formatOdds(bet.oddsAtBet)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[#00FF88] font-bold">
                                                    +{bet.potentialPayout?.toLocaleString() || '-'}
                                                </div>
                                                {bet.claimed && (
                                                    <span className="text-gray-500">Claimed</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Betting CTA */}
                            {isBettingOpen && selectedOutcome === null && (
                                <div className="bg-black border border-gray-600 p-4 text-center">
                                    <p className="text-gray-400 text-sm mb-2">
                                        Select an outcome to place your bet
                                    </p>
                                    <div className="text-xs text-gray-500">
                                        Balance: <span className="text-yellow-500">{goldBalance.toLocaleString()}</span> gold
                                    </div>
                                </div>
                            )}

                            {!isBettingOpen && market.status === MarketStatus.ACTIVE && (
                                <div className="bg-black border border-red-500 p-4 text-center">
                                    <p className="text-red-400 text-sm">Betting is closed</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Awaiting resolution
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* How it works */}
            <div className="bg-black border border-gray-700 p-3 text-xs text-gray-500">
                <span className="text-[#00FF88]">PARIMUTUEL:</span> All bets pooled. Winners split pot proportionally. 5% house fee.
            </div>
        </div>
    );
}
