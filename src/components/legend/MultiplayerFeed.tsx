import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MultiplayerEvent {
    type: 'player_level_up' | 'crime_lord_defeated' | 'heist_completed' | 'donation_made' | 'pvp_challenge';
    playerName: string;
    playerAddress: string;
    details: Record<string, unknown>;
    timestamp: Date;
}

const MultiplayerFeed: React.FC = () => {
    const [events] = useState<MultiplayerEvent[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        // This will be populated by the AI service via socket
        // For now, showing structure
    }, []);

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'player_level_up': return '⬆️';
            case 'crime_lord_defeated': return '👑';
            case 'heist_completed': return '💰';
            case 'donation_made': return '💚';
            case 'pvp_challenge': return '⚔️';
            default: return '🦎';
        }
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'player_level_up': return 'border-blue-400 bg-blue-500/10';
            case 'crime_lord_defeated': return 'border-yellow-400 bg-yellow-500/10';
            case 'heist_completed': return 'border-green-400 bg-[#00FF88]/10';
            case 'donation_made': return 'border-pink-400 bg-pink-500/10';
            case 'pvp_challenge': return 'border-red-400 bg-red-500/10';
            default: return 'border-gray-400 bg-gray-500/10';
        }
    };

    const getEventMessage = (event: MultiplayerEvent) => {
        switch (event.type) {
            case 'player_level_up':
                return `reached level ${event.details.newLevel}!`;
            case 'crime_lord_defeated':
                return `defeated the Crime Lord! The city celebrates! 🎉`;
            case 'heist_completed':
                return `pulled off a heist and stole ${event.details.goldEarned} gold!`;
            case 'donation_made':
                return `donated ${event.details.amount} gold to help the poor!`;
            case 'pvp_challenge':
                return `challenged ${event.details.opponent} to a duel!`;
            default:
                return 'did something legendary!';
        }
    };

    if (!isExpanded && events.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-20 right-4 z-30 max-w-sm">
            <AnimatePresence>
                {!isExpanded && events.length > 0 && (
                    <motion.button
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        onClick={() => setIsExpanded(true)}
                        className="bg-black border-2 border-[#FFD700] rounded-xl p-3 flex items-center gap-2 hover:bg-gray-700 transition-all shadow-xl"
                    >
                        <span className="text-2xl animate-bounce">🌍</span>
                        <div className="text-left">
                            <div className="text-sm font-bold text-[#FFD700]">Activity Feed</div>
                            <div className="text-xs text-gray-400">{events.length} new events</div>
                        </div>
                    </motion.button>
                )}

                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-black border-2 border-[#FFD700] rounded-xl overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#FFD700]/20 to-yellow-600/20 p-4 border-b border-[#FFD700]/30">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🌍</span>
                                    <div>
                                        <h3 className="font-bold text-[#FFD700]">Live Activity</h3>
                                        <p className="text-xs text-gray-400">What others are doing</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsExpanded(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Events List */}
                        <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                            {events.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <div className="text-4xl mb-2">🦎</div>
                                    <p className="text-sm">Waiting for activity...</p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        See what other players are doing in real-time!
                                    </p>
                                </div>
                            ) : (
                                events.map((event, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`border-2 rounded-lg p-3 ${getEventColor(event.type)}`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-xl">{getEventIcon(event.type)}</span>
                                            <div className="flex-1">
                                                <div className="font-bold text-white">
                                                    {event.playerName}
                                                </div>
                                                <div className="text-sm text-gray-300">
                                                    {getEventMessage(event)}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(event.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MultiplayerFeed;
