/**
 * Market Browser - List of prediction markets with filters
 * Styled to match Bank/Satchel UI
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Market } from '../../types/prediction.types';
import { MarketType, MarketStatus } from '../../types/prediction.types';

interface MarketBrowserProps {
    markets: Market[];
    onSelectMarket: (market: Market) => void;
    loading: boolean;
}

// Helper to format time remaining
function formatTimeRemaining(deadline: Date | string): string {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Closed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

// Helper to format odds as multiplier
function formatOdds(odds: number): string {
    if (odds === 0) return '-';
    return `${(odds / 10000).toFixed(2)}x`;
}

// Market type icons
const marketTypeIcons: Record<MarketType, string> = {
    [MarketType.CRYPTO_PRICE]: 'CRYPTO',
    [MarketType.IN_GAME]: 'GAME',
    [MarketType.COMMUNITY]: 'VOTE'
};

export default function MarketBrowser({ markets, onSelectMarket, loading }: MarketBrowserProps) {
    const [filter, setFilter] = useState<'all' | MarketType>('all');
    const [sortBy, setSortBy] = useState<'deadline' | 'pool' | 'bets'>('deadline');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter and sort markets
    const filteredMarkets = useMemo(() => {
        let result = markets.filter(m => m.status === MarketStatus.ACTIVE);

        // Apply type filter
        if (filter !== 'all') {
            result = result.filter(m => m.marketType === filter);
        }

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(m =>
                m.question.toLowerCase().includes(query) ||
                m.outcomes.some(o => o.toLowerCase().includes(query))
            );
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'pool':
                    return b.totalPool - a.totalPool;
                case 'bets':
                    return b.totalBets - a.totalBets;
                case 'deadline':
                default:
                    return new Date(a.bettingDeadline).getTime() - new Date(b.bettingDeadline).getTime();
            }
        });

        return result;
    }, [markets, filter, sortBy, searchQuery]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-[#00FF88] animate-pulse">Loading markets...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="bg-black border border-[#00FF88] p-3">
                <input
                    type="text"
                    placeholder="Search markets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-black text-white border border-gray-600 focus:border-[#00FF88] outline-none text-sm"
                />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2">
                {/* Type Filter */}
                <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 text-sm font-bold border transition-all ${
                        filter === 'all'
                            ? 'bg-[#00AA55] border-[#00FF88] text-[#00FF88]'
                            : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                >
                    ALL
                </button>
                {Object.entries(marketTypeIcons).map(([type, label]) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type as MarketType)}
                        className={`px-3 py-1 text-sm font-bold border transition-all ${
                            filter === type
                                ? 'bg-[#00AA55] border-[#00FF88] text-[#00FF88]'
                                : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                    >
                        {label}
                    </button>
                ))}

                {/* Sort Dropdown */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="ml-auto px-3 py-1 bg-black border border-gray-600 text-gray-400 text-sm focus:outline-none focus:border-[#00FF88]"
                >
                    <option value="deadline">Ending Soon</option>
                    <option value="pool">Highest Pool</option>
                    <option value="bets">Most Bets</option>
                </select>
            </div>

            {/* Markets List */}
            {filteredMarkets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <p>No active markets found</p>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-2 text-[#00FF88] hover:underline text-sm"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredMarkets.map((market, index) => (
                        <motion.div
                            key={market.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => onSelectMarket(market)}
                            className="bg-black border border-[#00FF88] p-4 cursor-pointer hover:bg-[#00FF88]/5 transition-all"
                        >
                            {/* Header Row */}
                            <div className="flex items-start justify-between mb-2">
                                <span className="text-xs px-2 py-0.5 bg-[#00AA55]/30 text-[#00FF88] border border-[#00FF88]/50">
                                    {marketTypeIcons[market.marketType as MarketType] || 'MARKET'}
                                </span>
                                <div className="flex items-center gap-2">
                                    {market.featured && (
                                        <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-500 border border-yellow-500/50">
                                            HOT
                                        </span>
                                    )}
                                    <span className={`text-xs px-2 py-0.5 ${
                                        new Date(market.bettingDeadline) > new Date()
                                            ? 'bg-[#00FF88]/20 text-[#00FF88]'
                                            : 'bg-red-500/20 text-red-400'
                                    }`}>
                                        {formatTimeRemaining(market.bettingDeadline)}
                                    </span>
                                </div>
                            </div>

                            {/* Question */}
                            <h3 className="text-white font-bold mb-3 text-sm">
                                {market.question}
                            </h3>

                            {/* Outcomes with Odds */}
                            <div className="space-y-1 mb-3">
                                {market.outcomes.slice(0, 3).map((outcome, i) => {
                                    const odds = market.cachedOdds?.[i] || 0;
                                    const poolPercent = market.totalPool > 0
                                        ? (market.pools[i] / market.totalPool) * 100
                                        : 0;

                                    return (
                                        <div key={i} className="relative bg-gray-900/50 border border-gray-700">
                                            {/* Background bar */}
                                            <div
                                                className="absolute inset-0 bg-[#00FF88]/10"
                                                style={{ width: `${poolPercent}%` }}
                                            />
                                            <div className="relative flex items-center justify-between p-2 text-xs">
                                                <span className="text-gray-300 truncate flex-1">
                                                    {outcome}
                                                </span>
                                                <span className="text-[#00FF88] font-bold ml-2">
                                                    {formatOdds(odds)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {market.outcomes.length > 3 && (
                                    <div className="text-center text-gray-500 text-xs">
                                        +{market.outcomes.length - 3} more options
                                    </div>
                                )}
                            </div>

                            {/* Footer Stats */}
                            <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-700 pt-2">
                                <div className="flex items-center gap-1">
                                    <span className="text-yellow-500 font-bold">
                                        {market.totalPool.toLocaleString()}
                                    </span>
                                    <span>gold</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-white">{market.totalBets}</span>
                                    <span>bets</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
