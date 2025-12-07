/**
 * Bet Slip - Bet placement form with payout preview
 * Styled to match Bank/Satchel UI
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface BetSlipProps {
    outcome: string;
    currentOdds: number;
    currentPool: number;
    totalPool: number;
    goldBalance: number;
    onPlaceBet: (amount: number) => Promise<void>;
    onCancel: () => void;
    isLoading: boolean;
}

const HOUSE_FEE = 500; // 5% in basis points
const FEE_DENOMINATOR = 10000;
const MIN_BET = 10;
const MAX_BET = 100000;

// Quick bet presets
const QUICK_BETS = [
    { label: '10', value: 10 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: '500', value: 500 },
    { label: '1K', value: 1000 },
    { label: 'MAX', value: -1 } // Special case
];

export default function BetSlip({
    outcome,
    currentOdds,
    currentPool,
    totalPool,
    goldBalance,
    onPlaceBet,
    onCancel,
    isLoading
}: BetSlipProps) {
    const [betAmount, setBetAmount] = useState<string>('100');
    const [error, setError] = useState<string | null>(null);

    const amount = parseInt(betAmount) || 0;

    // Calculate potential payout after placing bet
    const { potentialPayout, newOdds, slippage } = useMemo(() => {
        if (amount <= 0) {
            return { potentialPayout: 0, newOdds: currentOdds, slippage: 0 };
        }

        // After our bet, the new pools would be:
        const newOutcomePool = currentPool + amount;
        const newTotalPool = totalPool + amount;

        // New odds
        const odds = newOutcomePool > 0
            ? Math.floor((newTotalPool * FEE_DENOMINATOR) / newOutcomePool)
            : 0;

        // Calculate payout
        const netPool = Math.floor((newTotalPool * (FEE_DENOMINATOR - HOUSE_FEE)) / FEE_DENOMINATOR);
        const payout = newOutcomePool > 0
            ? Math.floor((amount * netPool) / newOutcomePool)
            : 0;

        // Slippage (difference between current odds and what we'll get)
        const slippagePercent = currentOdds > 0
            ? Math.abs(((odds - currentOdds) / currentOdds) * 100)
            : 0;

        return {
            potentialPayout: payout,
            newOdds: odds,
            slippage: slippagePercent
        };
    }, [amount, currentPool, totalPool, currentOdds]);

    const handleQuickBet = (value: number) => {
        if (value === -1) {
            // MAX bet
            const maxBet = Math.min(goldBalance, MAX_BET);
            setBetAmount(String(maxBet));
        } else {
            setBetAmount(String(Math.min(value, goldBalance)));
        }
        setError(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setBetAmount(value);
        setError(null);
    };

    const handleSubmit = async () => {
        // Validation
        if (amount < MIN_BET) {
            setError(`Min bet: ${MIN_BET} gold`);
            return;
        }
        if (amount > MAX_BET) {
            setError(`Max bet: ${MAX_BET.toLocaleString()} gold`);
            return;
        }
        if (amount > goldBalance) {
            setError('Not enough gold');
            return;
        }

        setError(null);
        await onPlaceBet(amount);
    };

    const formatOdds = (odds: number) => {
        if (odds === 0) return '-';
        return `${(odds / 10000).toFixed(2)}x`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black border-2 border-yellow-500 p-4 space-y-4"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-yellow-500 text-sm">PLACE BET</h3>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-white transition-colors text-xs"
                >
                    [X]
                </button>
            </div>

            {/* Selected Outcome */}
            <div className="bg-gray-900/50 border border-gray-700 p-3">
                <div className="text-xs text-gray-400">Betting on:</div>
                <div className="text-white font-bold text-sm">{outcome}</div>
                <div className="text-xs text-[#00FF88] mt-1">
                    Current: {formatOdds(currentOdds)}
                </div>
            </div>

            {/* Amount Input */}
            <div>
                <label className="text-xs text-gray-400 mb-2 block">Amount</label>
                <div className="relative">
                    <input
                        type="text"
                        value={betAmount}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-black border border-yellow-500 text-white text-lg font-bold focus:outline-none focus:border-yellow-400"
                        placeholder="Enter amount"
                        disabled={isLoading}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500 text-sm">
                        gold
                    </span>
                </div>

                {/* Quick Bet Buttons */}
                <div className="grid grid-cols-6 gap-1 mt-2">
                    {QUICK_BETS.map(({ label, value }) => (
                        <button
                            key={label}
                            onClick={() => handleQuickBet(value)}
                            disabled={isLoading}
                            className="py-1 bg-black border border-gray-600 text-gray-400 text-xs hover:border-yellow-500 hover:text-yellow-500 transition-all disabled:opacity-50"
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="flex justify-between text-xs mt-2">
                    <span className="text-gray-500">Balance:</span>
                    <span className="text-yellow-500">{goldBalance.toLocaleString()}</span>
                </div>
            </div>

            {/* Payout Preview */}
            {amount > 0 && (
                <div className="bg-gray-900/50 border border-gray-700 p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Your Bet</span>
                        <span className="text-white">{amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Eff. Odds</span>
                        <span className={slippage > 5 ? 'text-yellow-400' : 'text-[#00FF88]'}>
                            {formatOdds(newOdds)}
                        </span>
                    </div>
                    {slippage > 1 && (
                        <div className="flex justify-between">
                            <span className="text-gray-400">Slippage</span>
                            <span className={slippage > 10 ? 'text-red-400' : 'text-yellow-400'}>
                                {slippage.toFixed(1)}%
                            </span>
                        </div>
                    )}
                    <div className="border-t border-gray-700 pt-2 mt-2">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Pot. Win</span>
                            <span className="text-[#00FF88] font-bold">
                                +{potentialPayout.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Profit</span>
                            <span className={potentialPayout > amount ? 'text-[#00FF88]' : 'text-red-400'}>
                                {potentialPayout > amount ? '+' : ''}{(potentialPayout - amount).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Slippage Warning */}
            {slippage > 10 && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 p-2 text-xs text-yellow-400">
                    Large bet may move odds significantly
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="text-red-400 text-xs text-center">{error}</div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={isLoading || amount <= 0}
                className={`w-full py-3 font-bold transition-all ${
                    isLoading || amount <= 0
                        ? 'bg-gray-800 border-2 border-gray-600 text-gray-500 cursor-not-allowed'
                        : 'bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00BB66]'
                }`}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">*</span>
                        Placing...
                    </span>
                ) : (
                    `BET ${amount.toLocaleString()} GOLD`
                )}
            </button>

            {/* Info */}
            <p className="text-xs text-gray-500 text-center">
                5% fee | Min {MIN_BET} | Max {MAX_BET.toLocaleString()}
            </p>
        </motion.div>
    );
}
