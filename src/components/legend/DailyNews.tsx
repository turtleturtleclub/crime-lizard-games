import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { PlayerCharacter } from '../../types/legend.types';
import { useModalClose } from '../../hooks/useModalClose';

interface DailyNewsProps {
    player: PlayerCharacter;
    onClose: () => void;
}

interface MarketData {
    price: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    marketCap: number;
    priceChangePercent5m: number;
    priceChangePercent1h: number;
    priceChangePercent6h: number;
    priceChangePercent24h: number;
    txns24h: {
        buys: number;
        sells: number;
    };
    isFourMeme?: boolean;
    graduationProgress?: number;
    bnbRaised?: number;
    graduationMarketCap?: number;
    tokensSold?: number;
    leftTokens?: number;
    bnbRemaining?: number;
}

interface CryptoMarketData {
    symbol: string;
    name: string;
    price: number;
    priceChange24h: number;
    marketCap: number;
    volume24h: number;
}

interface NewsHeadline {
    title: string;
    source: string;
    url: string;
    publishedAt: string;
}

interface AIMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const DailyNews: React.FC<DailyNewsProps> = ({ player, onClose }) => {
    const [marketData, setMarketData] = useState<MarketData | null>(null);
    const [cryptoData, setCryptoData] = useState<CryptoMarketData[]>([]);
    const [newsHeadlines, setNewsHeadlines] = useState<NewsHeadline[]>([]);
    const [aiSummary, setAiSummary] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<AIMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Handle ESC key and mobile back button
    useModalClose(onClose);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Fetch crypto prices (BNB, BTC, ETH, SOL) from CoinGecko
    const fetchCryptoData = async () => {
        try {
            const response = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin,bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true'
            );
            const data = await response.json();

            const cryptoInfo: CryptoMarketData[] = [
                {
                    symbol: 'BNB',
                    name: 'BNB',
                    price: data.binancecoin?.usd || 0,
                    priceChange24h: data.binancecoin?.usd_24h_change || 0,
                    marketCap: data.binancecoin?.usd_market_cap || 0,
                    volume24h: data.binancecoin?.usd_24h_vol || 0
                },
                {
                    symbol: 'BTC',
                    name: 'Bitcoin',
                    price: data.bitcoin?.usd || 0,
                    priceChange24h: data.bitcoin?.usd_24h_change || 0,
                    marketCap: data.bitcoin?.usd_market_cap || 0,
                    volume24h: data.bitcoin?.usd_24h_vol || 0
                },
                {
                    symbol: 'ETH',
                    name: 'Ethereum',
                    price: data.ethereum?.usd || 0,
                    priceChange24h: data.ethereum?.usd_24h_change || 0,
                    marketCap: data.ethereum?.usd_market_cap || 0,
                    volume24h: data.ethereum?.usd_24h_vol || 0
                },
                {
                    symbol: 'SOL',
                    name: 'Solana',
                    price: data.solana?.usd || 0,
                    priceChange24h: data.solana?.usd_24h_change || 0,
                    marketCap: data.solana?.usd_market_cap || 0,
                    volume24h: data.solana?.usd_24h_vol || 0
                }
            ];

            setCryptoData(cryptoInfo);
        } catch (err) {
            console.error('Error fetching crypto data:', err);
        }
    };

    // Fetch crypto news headlines using X/Grok AI live search
    const fetchNewsHeadlines = async () => {
        try {
const response = await fetch('/api/legend/crypto-news');
            const data = await response.json();

            if (data.headlines && data.headlines.length > 0) {
                setNewsHeadlines(data.headlines);
            } else {
                // Fallback if no headlines returned
                setNewsHeadlines([
                    { title: 'Crypto market continues to evolve', source: 'Market Watch', url: '#', publishedAt: new Date().toISOString() },
                    { title: 'DeFi innovations driving adoption', source: 'DeFi Pulse', url: '#', publishedAt: new Date().toISOString() },
                    { title: 'BSC ecosystem shows strong growth', source: 'BSC News', url: '#', publishedAt: new Date().toISOString() }
                ]);
            }
        } catch (err) {
            console.error('Error fetching news:', err);
            // Fallback to generic news if API fails
            setNewsHeadlines([
                { title: 'Crypto market continues to evolve', source: 'Market Watch', url: '#', publishedAt: new Date().toISOString() },
                { title: 'DeFi innovations driving adoption', source: 'DeFi Pulse', url: '#', publishedAt: new Date().toISOString() },
                { title: 'BSC ecosystem shows strong growth', source: 'BSC News', url: '#', publishedAt: new Date().toISOString() }
            ]);
        }
    };

    // Fetch market data from Dexscreener using BSC contract address
    const fetchMarketData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch CLZD from Dexscreener using BSC contract address
            const clzdContractAddress = '0xa5996fc5007dd2019f9a9ff6c50c1c847aa64444';
            const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${clzdContractAddress}`);
            const data = await response.json();

            if (data.pairs && data.pairs.length > 0) {
                // Find the BSC pair - prioritize four.meme pairs
                const bscPairs = data.pairs.filter((p: any) => p.chainId === 'bsc');

                // Check if this is a four.meme token
                const fourMemePair = bscPairs.find((p: any) =>
                    p.dexId === 'fourmeme' ||
                    p.labels?.includes('four.meme') ||
                    p.url?.includes('four.meme')
                );

                // Use four.meme pair if available, otherwise use the pair with highest liquidity
                const pair = fourMemePair || bscPairs.reduce((prev: any, current: any) =>
                    (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0) ? current : prev
                );

                // Extract four.meme graduation progress if available
                const isFourMeme = !!(fourMemePair || pair.dexId === 'fourmeme');
                let graduationProgress = 0;
                let bnbRaised = 0;
                let tokensSold = 0;
                let leftTokens = 0;
                let bnbRemaining = 0;
                const graduationMarketCap = 108066.17; // Updated target market cap at graduation

                // Fetch accurate bonding curve data from blockchain if this is four.meme
                if (isFourMeme) {
                    try {
                        const bondingResponse = await fetch('/api/legend/bonding-curve/progress');
                        if (bondingResponse.ok) {
                            const bondingData = await bondingResponse.json();
                            if (bondingData.success) {
                                graduationProgress = bondingData.progress;
                                bnbRaised = bondingData.bnbRaised;
                                tokensSold = bondingData.tokensSold;
                                leftTokens = bondingData.leftTokens;
                                bnbRemaining = bondingData.bnbRemaining;
}
                        }
                    } catch (err) {
                        console.error('Error fetching bonding curve data:', err);
                    }
                }

                const marketInfo: MarketData = {
                    price: parseFloat(pair.priceUsd || '0'),
                    priceChange24h: parseFloat(pair.priceChange?.h24 || '0'),
                    volume24h: parseFloat(pair.volume?.h24 || '0'),
                    liquidity: parseFloat(pair.liquidity?.usd || '0'),
                    marketCap: parseFloat(pair.fdv || pair.marketCap || '0'),
                    priceChangePercent5m: parseFloat(pair.priceChange?.m5 || '0'),
                    priceChangePercent1h: parseFloat(pair.priceChange?.h1 || '0'),
                    priceChangePercent6h: parseFloat(pair.priceChange?.h6 || '0'),
                    priceChangePercent24h: parseFloat(pair.priceChange?.h24 || '0'),
                    txns24h: {
                        buys: parseInt(pair.txns?.h24?.buys || '0'),
                        sells: parseInt(pair.txns?.h24?.sells || '0')
                    },
                    isFourMeme,
                    graduationProgress: graduationProgress > 0 ? graduationProgress : undefined,
                    bnbRaised: bnbRaised > 0 ? bnbRaised : undefined,
                    tokensSold: tokensSold > 0 ? tokensSold : undefined,
                    leftTokens: leftTokens > 0 ? leftTokens : undefined,
                    bnbRemaining: bnbRemaining > 0 ? bnbRemaining : undefined,
                    graduationMarketCap: isFourMeme ? graduationMarketCap : undefined
                };

                setMarketData(marketInfo);

                // Fetch other data in parallel
                await Promise.all([
                    generateAISummary(marketInfo),
                    fetchCryptoData(),
                    fetchNewsHeadlines()
                ]);
            } else {
                setError('No market data found for $CLZD on BSC');
            }
        } catch (err) {
            console.error('Error fetching market data:', err);
            setError('Failed to fetch market data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Generate AI summary using the game server's AI endpoint
    const generateAISummary = async (data: MarketData) => {
        try {
            // Build bonding curve section if available
            let bondingCurveInfo = '';
            if (data.isFourMeme && data.graduationProgress !== undefined) {
                bondingCurveInfo = `

🎓 BONDING CURVE STATUS (four.meme):
Progress: ${data.graduationProgress.toFixed(2)}%
Tokens Sold: ${data.tokensSold?.toLocaleString() || 'N/A'} / 800,000,000
BNB Raised: ${data.bnbRaised?.toFixed(3) || '0'} / 18 BNB
BNB to Graduation: ${data.bnbRemaining?.toFixed(3) || '0'} BNB
Target Market Cap: $${data.graduationMarketCap?.toLocaleString() || '108,066'}

Note: The progress is calculated from on-chain token balance. The bonding curve uses a constant product model where price increases non-linearly as more tokens are purchased. Liquidity shows as $0 in DexScreener because it's virtual liquidity still in the bonding curve until we graduate to PancakeSwap.`;
            }

            const prompt = `You are the Crime Lizard AI butler. Analyze the following $CLZD token market data and provide an informative, witty daily crypto summary (3-4 sentences):

Price: $${data.price.toFixed(6)}
24h Change: ${data.priceChange24h.toFixed(2)}%
24h Volume: $${data.volume24h.toLocaleString()}
Market Cap: $${data.marketCap.toLocaleString()}
24h Buys: ${data.txns24h.buys} | Sells: ${data.txns24h.sells}${bondingCurveInfo}

IMPORTANT INSTRUCTIONS:
- DO NOT say "no liquidity in sight" - we ARE on a bonding curve with virtual liquidity (not $0!)
- Focus on the bonding curve progress percentage (${data.graduationProgress?.toFixed(1)}% complete)
- Explain what this progress means: we've sold ${data.graduationProgress?.toFixed(1)}% of the 800M tokens
- Mention BNB raised: ${data.bnbRaised?.toFixed(2)} BNB out of 18 BNB target
- At 100% graduation: liquidity deposited to PancakeSwap, LP tokens burned
- The bonding curve means price increases non-linearly as more tokens are bought
- Be informative, accurate about the actual numbers, and entertaining with dry British humor`;

            const response = await fetch('/api/legend/ai-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: prompt,
                    username: player.name,
                    userId: player.walletAddress,
                    source: 'daily-news'
                })
            });

            if (response.ok) {
                const result = await response.json();
                setAiSummary(result.response);
            } else {
                setAiSummary('Market data retrieved. Ask me anything about $CLZD!');
            }
        } catch (err) {
            console.error('Error generating AI summary:', err);
            setAiSummary('Market data retrieved. Ask me anything about $CLZD!');
        }
    };

    // Handle user chat with AI
    const handleAskAI = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isAiThinking) return;

        const userMessage: AIMessage = {
            role: 'user',
            content: userInput,
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setIsAiThinking(true);

        try {
            // Include market context in the prompt for better AI responses
            const contextPrompt = marketData
                ? `[Market Context: $CLZD Price: $${marketData.price.toFixed(6)}, 24h: ${marketData.priceChange24h.toFixed(2)}%, Volume: $${marketData.volume24h.toLocaleString()}]

User question: ${userInput}`
                : userInput;

            const response = await fetch('/api/legend/ai-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: contextPrompt,
                    username: player.name,
                    userId: player.walletAddress,
                    source: 'daily-news-chat'
                })
            });

            if (response.ok) {
                const result = await response.json();
                const aiMessage: AIMessage = {
                    role: 'assistant',
                    content: result.response,
                    timestamp: new Date()
                };
                setChatMessages(prev => [...prev, aiMessage]);
            } else {
                throw new Error('Failed to get AI response');
            }
        } catch (err) {
            console.error('Error asking AI:', err);
            const errorMessage: AIMessage = {
                role: 'assistant',
                content: 'My apologies, I seem to be experiencing technical difficulties. Please try again.',
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsAiThinking(false);
        }
    };

    // Fetch data on mount
    useEffect(() => {
        fetchMarketData();
    }, []);

    const formatNumber = (num: number) => {
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
        return `$${num.toFixed(2)}`;
    };

    const getPriceChangeColor = (change: number) => {
        if (change > 0) return 'text-green-400';
        if (change < 0) return 'text-red-400';
        return 'text-gray-400';
    };

    const modalContent = (

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 overscroll-none"
            style={{ zIndex: 9999 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-black border-2 border-[#00FF88] p-6 max-w-4xl w-full max-h-[90dvh] overflow-hidden font-bbs pb-safe-bottom"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="text-[#00FF88] text-center mb-4 text-glow-green text-xl font-bold">
                    📰 DAILY NEWS - CRYPTO MARKET REPORT 📰
                </div>

                {/* Content Area */}
                <div className="overflow-y-auto max-h-[calc(90vh-200px)] space-y-4">
                    {loading ? (
                        <div className="text-center text-[#00FF88] py-8">
                            <div className="animate-pulse">Loading market data...</div>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-8">
                            <div>{error}</div>
                            <button
                                onClick={fetchMarketData}
                                className="mt-4 px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00AA55]/30"
                            >
                                Retry
                            </button>
                        </div>
                    ) : marketData ? (
                        <>
                            {/* AI Summary Section */}
                            <div className="bg-black border-2 border-[#00FF88] p-4">
                                <div className="flex items-start gap-3">
                                    <div className="text-3xl">🦎</div>
                                    <div className="flex-1">
                                        <div className="text-green-400 font-bold mb-2">Crime Lizard AI Summary</div>
                                        <div className="text-gray-300 text-sm leading-relaxed">
                                            {aiSummary || 'Analyzing market data...'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Four.meme Graduation Progress */}
                            {marketData.isFourMeme && marketData.graduationProgress !== undefined && (
                                <div className="bg-black border-2 border-yellow-500 p-4">
                                    <div className="text-yellow-400 font-bold mb-3 text-center">
                                        🎓 Four.meme Bonding Curve Progress
                                    </div>
                                    <div className="space-y-3">
                                        {/* Main Progress Display */}
                                        <div className="bg-black border border-yellow-500 p-3 text-center">
                                            <div className="text-gray-400 text-xs mb-1">Bonding Curve Progress</div>
                                            <div className="text-yellow-400 font-bold text-3xl">
                                                {marketData.graduationProgress.toFixed(2)}%
                                            </div>
                                            <div className="text-gray-400 text-xs mt-2">
                                                {marketData.tokensSold?.toLocaleString() || '0'} / 800,000,000 tokens sold
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-black rounded-full h-4 border border-yellow-500">
                                            <div
                                                className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-green-500 h-full rounded-full transition-all duration-500 flex items-center justify-center text-xs font-bold text-black"
                                                style={{ width: `${Math.min(marketData.graduationProgress, 100)}%` }}
                                            >
                                                {marketData.graduationProgress >= 10 && `${marketData.graduationProgress.toFixed(0)}%`}
                                            </div>
                                        </div>

                                        {/* BNB & Token Stats Grid */}
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-black border border-yellow-500 p-2">
                                                <div className="text-gray-500">BNB Raised</div>
                                                <div className="text-green-400 font-bold">
                                                    {marketData.bnbRaised?.toFixed(3) || '0.000'} BNB
                                                </div>
                                            </div>
                                            <div className="bg-black border border-yellow-500 p-2">
                                                <div className="text-gray-500">BNB to Graduation</div>
                                                <div className="text-yellow-400 font-bold">
                                                    {marketData.bnbRemaining?.toFixed(3) || '0.000'} BNB
                                                </div>
                                            </div>
                                            <div className="bg-black border border-yellow-500 p-2">
                                                <div className="text-gray-500">Current MC</div>
                                                <div className="text-green-400 font-bold">
                                                    {formatNumber(marketData.marketCap)}
                                                </div>
                                            </div>
                                            <div className="bg-black border border-yellow-500 p-2">
                                                <div className="text-gray-500">Graduation MC</div>
                                                <div className="text-yellow-400 font-bold">
                                                    {formatNumber(marketData.graduationMarketCap || 108066.17)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tokens Remaining */}
                                        {marketData.leftTokens !== undefined && (
                                            <div className="bg-black border border-yellow-500/50 p-2 text-center">
                                                <div className="text-gray-500 text-xs">Tokens Left in Curve</div>
                                                <div className="text-yellow-400 font-bold">
                                                    {marketData.leftTokens.toLocaleString()}
                                                </div>
                                            </div>
                                        )}

                                        {/* Status Message */}
                                        <div className="text-xs text-gray-300 text-center pt-2 border-t border-yellow-500/30 leading-relaxed">
                                            {marketData.graduationProgress >= 100
                                                ? '🎉 Ready to graduate to PancakeSwap! All liquidity will be deposited and LP tokens burned for permanent liquidity.'
                                                : `Once we reach 100%, $CLZD will graduate to PancakeSwap with all raised BNB as liquidity. LP tokens will be permanently burned. Price increases non-linearly as more tokens are bought (constant product curve).`}
                                        </div>

                                        {/* Liquidity Note */}
                                        <div className="text-xs text-yellow-400/70 italic text-center bg-yellow-500/5 p-2 rounded border border-yellow-500/20">
                                            ℹ️ Note: Liquidity shows $0 on DexScreener because it's virtual liquidity in the bonding curve launchpad. Real liquidity will be added to PancakeSwap upon graduation.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Market Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {/* Price */}
                                <div className="bg-black border-2 border-[#00FF88] p-3">
                                    <div className="text-gray-400 text-xs mb-1">Price</div>
                                    <div className="text-[#00FF88] font-bold">${marketData.price.toFixed(6)}</div>
                                </div>

                                {/* 24h Change */}
                                <div className="bg-black border-2 border-[#00FF88] p-3">
                                    <div className="text-gray-400 text-xs mb-1">24h Change</div>
                                    <div className={`font-bold ${getPriceChangeColor(marketData.priceChange24h)}`}>
                                        {marketData.priceChange24h > 0 ? '+' : ''}{marketData.priceChange24h.toFixed(2)}%
                                    </div>
                                </div>

                                {/* Volume */}
                                <div className="bg-black border-2 border-[#00FF88] p-3">
                                    <div className="text-gray-400 text-xs mb-1">24h Volume</div>
                                    <div className="text-[#00FF88] font-bold">{formatNumber(marketData.volume24h)}</div>
                                </div>

                                {/* Liquidity / Bonding Curve Progress */}
                                <div className="bg-black border-2 border-[#00FF88] p-3">
                                    <div className="text-gray-400 text-xs mb-1">
                                        {marketData.isFourMeme ? 'Bonding Curve' : 'Liquidity'}
                                    </div>
                                    <div className="text-[#00FF88] font-bold">
                                        {marketData.isFourMeme && marketData.graduationProgress !== undefined
                                            ? `${marketData.graduationProgress.toFixed(1)}% Complete`
                                            : marketData.liquidity > 0
                                                ? formatNumber(marketData.liquidity)
                                                : 'N/A'}
                                    </div>
                                </div>

                                {/* Market Cap */}
                                <div className="bg-black border-2 border-[#00FF88] p-3">
                                    <div className="text-gray-400 text-xs mb-1">Market Cap</div>
                                    <div className="text-[#00FF88] font-bold">{formatNumber(marketData.marketCap)}</div>
                                </div>

                                {/* 24h Transactions */}
                                <div className="bg-black border-2 border-[#00FF88] p-3">
                                    <div className="text-gray-400 text-xs mb-1">24h Transactions</div>
                                    <div className="text-[#00FF88] font-bold">
                                        <span className="text-green-400">↑{marketData.txns24h.buys}</span>
                                        {' / '}
                                        <span className="text-red-400">↓{marketData.txns24h.sells}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Price Changes Timeline */}
                            <div className="bg-black border-2 border-[#00FF88] p-4">
                                <div className="text-green-400 font-bold mb-3">Price Changes</div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                        <div className="text-gray-400 text-xs">5m</div>
                                        <div className={getPriceChangeColor(marketData.priceChangePercent5m)}>
                                            {marketData.priceChangePercent5m > 0 ? '+' : ''}{marketData.priceChangePercent5m.toFixed(2)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 text-xs">1h</div>
                                        <div className={getPriceChangeColor(marketData.priceChangePercent1h)}>
                                            {marketData.priceChangePercent1h > 0 ? '+' : ''}{marketData.priceChangePercent1h.toFixed(2)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 text-xs">6h</div>
                                        <div className={getPriceChangeColor(marketData.priceChangePercent6h)}>
                                            {marketData.priceChangePercent6h > 0 ? '+' : ''}{marketData.priceChangePercent6h.toFixed(2)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 text-xs">24h</div>
                                        <div className={getPriceChangeColor(marketData.priceChangePercent24h)}>
                                            {marketData.priceChangePercent24h > 0 ? '+' : ''}{marketData.priceChangePercent24h.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Major Crypto Markets Section */}
                            {cryptoData.length > 0 && (
                                <div className="bg-black border-2 border-[#00FF88] p-4">
                                    <div className="text-green-400 font-bold mb-3">🌐 Major Crypto Markets</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {cryptoData.map((crypto) => (
                                            <div key={crypto.symbol} className="bg-black border border-[#00FF88] p-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="text-[#00FF88] font-bold">{crypto.symbol}</div>
                                                        <div className="text-gray-400 text-xs">{crypto.name}</div>
                                                    </div>
                                                    <div className={`font-bold ${getPriceChangeColor(crypto.priceChange24h)}`}>
                                                        {crypto.priceChange24h > 0 ? '+' : ''}{crypto.priceChange24h.toFixed(2)}%
                                                    </div>
                                                </div>
                                                <div className="text-[#00FF88] text-lg font-bold mb-2">
                                                    ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <div className="text-gray-500">Market Cap</div>
                                                        <div className="text-gray-300">{formatNumber(crypto.marketCap)}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-500">24h Volume</div>
                                                        <div className="text-gray-300">{formatNumber(crypto.volume24h)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Crypto News Headlines Section */}
                            {newsHeadlines.length > 0 && (
                                <div className="bg-black border-2 border-[#00FF88] p-4">
                                    <div className="text-green-400 font-bold mb-3">📰 Top Crypto News</div>
                                    <div className="space-y-3">
                                        {newsHeadlines.map((news, idx) => (
                                            <a
                                                key={idx}
                                                href={news.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block bg-black border border-[#00FF88] p-3 hover:bg-[#00AA55]/20 transition-colors"
                                            >
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1">
                                                        <div className="text-[#00FF88] font-bold mb-1 hover:text-green-400">
                                                            {news.title}
                                                        </div>
                                                        <div className="text-gray-400 text-xs">
                                                            {news.source} • {new Date(news.publishedAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <div className="text-[#00FF88] text-xl">→</div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Chat Section */}
                            <div className="bg-black border-2 border-[#00FF88] p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-green-400 font-bold">💬 Ask the Crime Lizard AI</div>
                                    <button
                                        onClick={() => setIsChatExpanded(!isChatExpanded)}
                                        className="text-green-400 hover:text-green-300 text-sm px-2 py-1 border border-[#00FF88] hover:bg-[#00AA55]/20"
                                        title={isChatExpanded ? 'Collapse chat' : 'Expand chat'}
                                    >
                                        {isChatExpanded ? '▼ Collapse' : '▲ Expand'}
                                    </button>
                                </div>

                                {/* Chat Messages */}
                                <div className={`bg-black border border-[#00FF88] p-3 overflow-y-auto mb-3 space-y-3 transition-all duration-300 ${isChatExpanded ? 'h-96' : 'h-48'}`}>
                                    {chatMessages.length === 0 ? (
                                        <div className="text-gray-500 text-sm italic">
                                            Ask me anything about $CLZD, the market, or trading strategies...
                                        </div>
                                    ) : (
                                        chatMessages.map((msg, idx) => (
                                            <div key={idx} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                                                <div className={`inline-block max-w-[80%] p-2 rounded ${
                                                    msg.role === 'user'
                                                        ? 'bg-[#00AA55]/30 text-green-300'
                                                        : 'bg-black/30 text-gray-300'
                                                }`}>
                                                    <div className="text-xs opacity-70 mb-1">
                                                        {msg.role === 'user' ? 'You' : '🦎 Crime Lizard AI'}
                                                    </div>
                                                    <div className="text-sm">{msg.content}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {isAiThinking && (
                                        <div className="text-left">
                                            <div className="inline-block bg-black/30 text-gray-300 p-2 rounded">
                                                <div className="text-xs opacity-70 mb-1">🦎 Crime Lizard AI</div>
                                                <div className="text-sm animate-pulse">Thinking...</div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chat Input */}
                                <form onSubmit={handleAskAI} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        placeholder="Ask about market trends, TA, or predictions..."
                                        className="flex-1 bg-black border-2 border-[#00FF88] text-[#00FF88] px-3 py-2 focus:outline-none focus:border-green-400"
                                        disabled={isAiThinking}
                                        maxLength={500}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isAiThinking || !userInput.trim()}
                                        className="px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00AA55]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Send
                                    </button>
                                </form>
                            </div>

                            {/* Refresh Button */}
                            <button
                                onClick={fetchMarketData}
                                className="w-full py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00AA55]/30"
                            >
                                🔄 Refresh Market Data
                            </button>
                        </>
                    ) : null}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-4 py-3 bg-black border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00AA55]/30 font-bold"
                >
                    [ESC] Close
                </button>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default DailyNews;
