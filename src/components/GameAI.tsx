import { useState, useEffect, useRef, useContext } from 'react';
import io, { Socket } from 'socket.io-client';
import { WalletContext } from '../providers/WalletContext';

interface GameStats {
    currentGame: string;
    totalPlayers: number;
    activeRounds: number;
    jackpotPool: string;
    recentWins: Array<{
        player: string;
        amount: string;
        game: string;
        timestamp: number;
    }>;
    gameSpecific: {
        slots?: {
            totalSpins: number;
            freeSpinsActive: number;
            bonusGamesActive: number;
        };
        roulette?: {
            currentRound: number;
            bettingPhase: boolean;
            timeLeft: number;
            totalBets: number;
        };
    };
}

interface AIResponse {
    message: string;
    type: 'info' | 'tip' | 'analysis' | 'warning' | 'celebration' | 'prediction' | 'strategy' | 'personalized';
    context?: any;
    confidence?: number;
    timestamp?: number;
    actionable?: boolean;
}

interface AIPrediction {
    type: 'win_probability' | 'hot_cold_analysis' | 'trend_prediction' | 'optimal_bet';
    value: any;
    confidence: number;
    timeframe: 'next_spin' | 'next_10_spins' | 'session';
    reasoning: string;
}

interface AIStrategy {
    name: string;
    description: string;
    riskLevel: 'low' | 'medium' | 'high';
    expectedROI: number;
    steps: string[];
    activeConditions: string[];
}

class GameFAICore {
    private static instance: GameFAICore;
    private socket: Socket | null = null;
    private gameStats: GameStats | null = null;
    private listeners: Array<(stats: GameStats) => void> = [];
    private aiListeners: Array<(response: AIResponse) => void> = [];

    static getInstance(): GameFAICore {
        if (!GameFAICore.instance) {
            GameFAICore.instance = new GameFAICore();
        }
        return GameFAICore.instance;
    }

    async initialize(serverUrl: string, account?: string) {
        if (this.socket?.connected) return;

        this.socket = io(serverUrl);

        this.socket.on('connect', () => {
this.socket?.emit('ai:register', {
                type: 'game_monitor',
                account: account || 'anonymous',
                capabilities: ['game_analysis', 'pattern_detection', 'strategy_tips', 'ecosystem_monitoring']
            });
        });

        this.socket.on('game_stats_update', (stats: GameStats) => {
            this.gameStats = stats;
            this.listeners.forEach(listener => listener(stats));
        });

        this.socket.on('ai_response', (response: AIResponse) => {
            this.aiListeners.forEach(listener => listener(response));
        });

        this.socket.on('ecosystem_event', (event: any) => {
            this.handleEcosystemEvent(event);
        });
    }

    private handleEcosystemEvent(event: any) {
        switch (event.type) {
            case 'big_win':
                this.notifyAI('A big win just happened! ' + event.details);
                break;
            case 'jackpot':
                this.notifyAI('JACKPOT ALERT! ' + event.details);
                break;
            case 'new_player':
                this.notifyAI('New player joined the ecosystem');
                break;
            case 'game_milestone':
                this.notifyAI('Game milestone reached: ' + event.details);
                break;
        }
    }

    subscribeToStats(listener: (stats: GameStats) => void) {
        this.listeners.push(listener);
        if (this.gameStats) {
            listener(this.gameStats);
        }
    }

    subscribeToAI(listener: (response: AIResponse) => void) {
        this.aiListeners.push(listener);
    }

    unsubscribeFromStats(listener: (stats: GameStats) => void) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    unsubscribeFromAI(listener: (response: AIResponse) => void) {
        this.aiListeners = this.aiListeners.filter(l => l !== listener);
    }

    notifyGameEvent(event: {
        type: 'spin' | 'bet' | 'win' | 'bonus' | 'jackpot';
        game: 'slots' | 'roulette';
        player: string;
        amount?: string;
        details?: any;
    }) {
        this.socket?.emit('game_event', event);
    }

    requestAIAnalysis(query: string, context?: any) {
        this.socket?.emit('ai_query', {
            query,
            context: {
                ...context,
                gameStats: this.gameStats,
                timestamp: Date.now()
            }
        });
    }

    // Advanced AI Features - 2025
    requestPrediction(type: AIPrediction['type'], context?: any): Promise<AIPrediction | null> {
        return new Promise((resolve) => {
            this.socket?.emit('ai_prediction_request', {
                type,
                context: {
                    ...context,
                    gameStats: this.gameStats,
                    timestamp: Date.now()
                }
            });

            const timeout = setTimeout(() => resolve(null), 5000);

            this.socket?.once('ai_prediction_response', (prediction: AIPrediction) => {
                clearTimeout(timeout);
                resolve(prediction);
            });
        });
    }

    requestStrategy(riskTolerance: 'low' | 'medium' | 'high', sessionDuration: number): Promise<AIStrategy[]> {
        return new Promise((resolve) => {
            this.socket?.emit('ai_strategy_request', {
                riskTolerance,
                sessionDuration,
                gameStats: this.gameStats,
                timestamp: Date.now()
            });

            const timeout = setTimeout(() => resolve([]), 5000);

            this.socket?.once('ai_strategy_response', (strategies: AIStrategy[]) => {
                clearTimeout(timeout);
                resolve(strategies);
            });
        });
    }

    requestPersonalizedTips(playerId: string, sessionStats: any): Promise<AIResponse[]> {
        return new Promise((resolve) => {
            this.socket?.emit('ai_personalized_tips', {
                playerId,
                sessionStats,
                gameStats: this.gameStats,
                timestamp: Date.now()
            });

            const timeout = setTimeout(() => resolve([]), 5000);

            this.socket?.once('ai_personalized_response', (tips: AIResponse[]) => {
                clearTimeout(timeout);
                resolve(tips);
            });
        });
    }

    analyzeGameSession(sessionData: any): Promise<{
        insights: string[];
        recommendations: string[];
        riskAssessment: 'low' | 'medium' | 'high';
        optimalPlayTime: number;
    }> {
        return new Promise((resolve) => {
            this.socket?.emit('ai_session_analysis', {
                sessionData,
                gameStats: this.gameStats,
                timestamp: Date.now()
            });

            const timeout = setTimeout(() => resolve({
                insights: [],
                recommendations: [],
                riskAssessment: 'medium' as const,
                optimalPlayTime: 30
            }), 5000);

            this.socket?.once('ai_session_analysis_response', (analysis: any) => {
                clearTimeout(timeout);
                resolve(analysis);
            });
        });
    }

    private notifyAI(message: string) {
        this.socket?.emit('ai_notification', {
            message,
            timestamp: Date.now(),
            context: this.gameStats
        });
    }

    getCurrentStats(): GameStats | null {
        return this.gameStats;
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
        this.listeners = [];
        this.aiListeners = [];
    }
}

// Hook for using GameFAI AI in components
export function useGameFAI() {
    const [stats, setStats] = useState<GameStats | null>(null);
    const [aiResponses, setAiResponses] = useState<AIResponse[]>([]);
    const { account } = useContext(WalletContext);
    const aiCore = useRef<GameFAICore | null>(null);

    useEffect(() => {
        aiCore.current = GameFAICore.getInstance();

        const serverUrl = import.meta.env.DEV ? 'http://localhost:3003' : window.location.origin;
        aiCore.current.initialize(serverUrl, account || undefined);

        const statsListener = (newStats: GameStats) => {
            setStats(newStats);
        };

        const aiListener = (response: AIResponse) => {
            setAiResponses(prev => [...prev.slice(-9), response]); // Keep last 10 responses
        };

        aiCore.current.subscribeToStats(statsListener);
        aiCore.current.subscribeToAI(aiListener);

        return () => {
            if (aiCore.current) {
                aiCore.current.unsubscribeFromStats(statsListener);
                aiCore.current.unsubscribeFromAI(aiListener);
            }
        };
    }, [account]);

    const notifyGameEvent = (event: Parameters<GameFAICore['notifyGameEvent']>[0]) => {
        aiCore.current?.notifyGameEvent(event);
    };

    const askAI = (query: string, context?: any) => {
        aiCore.current?.requestAIAnalysis(query, context);
    };

    const getPrediction = (type: AIPrediction['type'], context?: any) => {
        return aiCore.current?.requestPrediction(type, context) || Promise.resolve(null);
    };

    const getStrategies = (riskTolerance: 'low' | 'medium' | 'high', sessionDuration: number) => {
        return aiCore.current?.requestStrategy(riskTolerance, sessionDuration) || Promise.resolve([]);
    };

    const getPersonalizedTips = (sessionStats: any) => {
        return aiCore.current?.requestPersonalizedTips(account || 'anonymous', sessionStats) || Promise.resolve([]);
    };

    const analyzeSession = (sessionData: any) => {
        return aiCore.current?.analyzeGameSession(sessionData) || Promise.resolve({
            insights: [],
            recommendations: [],
            riskAssessment: 'medium' as const,
            optimalPlayTime: 30
        });
    };

    return {
        stats,
        aiResponses,
        notifyGameEvent,
        askAI,
        clearResponses: () => setAiResponses([]),
        // Advanced AI Features - 2025
        getPrediction,
        getStrategies,
        getPersonalizedTips,
        analyzeSession
    };
}

// Enhanced AI Chat Widget Component - 2025
export function GameFAIWidget() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const [query, setQuery] = useState('');
    const [activeTab] = useState<'chat' | 'predictions' | 'strategies' | 'analysis'>('chat');
    const [predictions, setPredictions] = useState<AIPrediction[]>([]);
    const [strategies, setStrategies] = useState<AIStrategy[]>([]);
    const [sessionAnalysis, setSessionAnalysis] = useState<any>(null);
    const { stats, aiResponses, askAI, clearResponses, getPrediction, getStrategies, analyzeSession } = useGameFAI();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [aiResponses]);

    const handleAskAI = () => {
        if (query.trim()) {
            askAI(query.trim());
            setQuery('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAskAI();
        }
    };

    // Advanced AI Features - 2025
    const handleGetPrediction = async (type: AIPrediction['type']) => {
        const prediction = await getPrediction(type);
        if (prediction) {
            setPredictions(prev => [prediction, ...prev.slice(0, 4)]);
        }
    };

    const handleGetStrategies = async () => {
        const newStrategies = await getStrategies('medium', 30);
        setStrategies(newStrategies);
    };

    const handleSessionAnalysis = async () => {
        // Mock session data - in real implementation this would come from game state
        const mockSessionData = {
            spins: 25,
            totalBet: '2.5',
            totalWon: '3.1',
            freeSpinsUsed: 3,
            timePlayed: 15, // minutes
            winStreak: 2,
            lossStreak: 1
        };
        const analysis = await analyzeSession(mockSessionData);
        setSessionAnalysis(analysis);
    };

    useEffect(() => {
        if (isExpanded && activeTab === 'predictions' && predictions.length === 0) {
            // Auto-load some predictions when opening the tab
            handleGetPrediction('win_probability');
            handleGetPrediction('hot_cold_analysis');
        }
        if (isExpanded && activeTab === 'strategies' && strategies.length === 0) {
            handleGetStrategies();
        }
        if (isExpanded && activeTab === 'analysis' && !sessionAnalysis) {
            handleSessionAnalysis();
        }
    }, [isExpanded, activeTab]);

    if (!isExpanded) {
        return (
            <div className="fixed bottom-32 left-4 z-40">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="bg-gradient-primary rounded-full p-3 shadow-lg shadow-soft-blue/25 hover:shadow-xl hover:shadow-soft-blue/40 transition-all duration-300 hover:scale-105 border border-glass-border/50 backdrop-blur-sm"
                    title="Crime Lizard AI Assistant - Advanced Gaming Intelligence"
                >
                    <span className="text-xl">🤖</span>
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-32 left-4 z-40 w-80 bg-card-bg/98 backdrop-blur-2xl border border-glass-border/60 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 p-4 border-b border-cyan-400/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl">🤖</span>
                        <div>
                            <h3 className="font-bold text-cyan-400">Crime Lizard AI</h3>
                            <p className="text-xs text-gray-400">GameFAI Assistant</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsChatExpanded(!isChatExpanded)}
                            className="text-gray-400 hover:text-white text-sm px-2 py-1 border border-gray-600 rounded hover:bg-gray-700"
                            title={isChatExpanded ? 'Collapse chat' : 'Expand chat'}
                        >
                            {isChatExpanded ? '▼' : '▲'}
                        </button>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>

            {/* Ecosystem Stats */}
            {stats && (
                <div className="p-3 bg-black/50 border-b border-gray-700/50">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center">
                            <div className="text-cyan-400 font-bold">{stats.totalPlayers}</div>
                            <div className="text-gray-400">Players</div>
                        </div>
                        <div className="text-center">
                            <div className="text-yellow-400 font-bold">{stats.jackpotPool} S</div>
                            <div className="text-gray-400">Jackpot</div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Responses */}
            <div className={`overflow-y-auto p-4 space-y-3 transition-all duration-300 ${isChatExpanded ? 'h-96' : 'h-64'}`}>
                {aiResponses.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <div className="text-2xl mb-2">🤖</div>
                        <p className="text-sm">Ask me anything about GameFAI!</p>
                        <p className="text-xs text-gray-600 mt-1">
                            Try: "How's the jackpot?" or "Any winning strategies?"
                        </p>
                    </div>
                ) : (
                    aiResponses.map((response, i) => (
                        <div
                            key={i}
                            className={`p-3 rounded-lg ${response.type === 'celebration' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                                response.type === 'warning' ? 'bg-red-500/20 border border-red-500/30' :
                                    response.type === 'tip' ? 'bg-[#00FF88]/20 border border-[#00FF88]/30' :
                                        'bg-cyan-500/20 border border-cyan-500/30'
                                }`}
                        >
                            <div className="flex items-start space-x-2">
                                <span className="text-sm">
                                    {response.type === 'celebration' ? '🎉' :
                                        response.type === 'warning' ? '⚠️' :
                                            response.type === 'tip' ? '💡' :
                                                '🤖'}
                                </span>
                                <p className="text-sm text-gray-100 leading-relaxed">{response.message}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-700/50">
                <div className="flex space-x-2">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask Crime Lizard AI..."
                        className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 text-sm"
                        maxLength={500}
                    />
                    <button
                        onClick={handleAskAI}
                        disabled={!query.trim()}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-3 py-2 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 text-sm"
                    >
                        Ask
                    </button>
                </div>
                {aiResponses.length > 0 && (
                    <button
                        onClick={clearResponses}
                        className="text-xs text-gray-500 hover:text-gray-300 mt-2"
                    >
                        Clear chat
                    </button>
                )}
            </div>
        </div>
    );
}

export default GameFAICore;
