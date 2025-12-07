// Legend of the Crime Lizard - AI Service Integration
// Integrates with existing xAI/Grok system for dynamic game interactions

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type { PlayerCharacter, GameEvent } from '../types/legend.types';

interface LegendAIResponse {
    type: 'dialogue' | 'event' | 'daily_message' | 'multiplayer_event' | 'quest_offer' | 'tip';
    content: string;
    npcId?: string;
    emotion?: 'friendly' | 'neutral' | 'hostile' | 'mysterious' | 'celebratory';
    metadata?: any;
    timestamp: number;
}

interface DailyMessage {
    title: string;
    message: string;
    tone: 'motivational' | 'warning' | 'celebration' | 'mysterious' | 'update';
    timestamp: Date;
    sysopName: string;
}

interface MultiplayerEvent {
    type: 'player_level_up' | 'crime_lord_defeated' | 'heist_completed' | 'donation_made' | 'pvp_challenge';
    playerName: string;
    playerAddress: string;
    details: any;
    timestamp: Date;
}

class LegendAIService {
    private static instance: LegendAIService;
    private socket: Socket | null = null;
    private serverUrl: string;
    private listeners: Map<string, Array<(data: any) => void>> = new Map();

    private constructor() {
        this.serverUrl = import.meta.env.DEV ? 'http://localhost:3003' : window.location.origin;
    }

    static getInstance(): LegendAIService {
        if (!LegendAIService.instance) {
            LegendAIService.instance = new LegendAIService();
        }
        return LegendAIService.instance;
    }

    initialize(walletAddress?: string) {
        if (this.socket?.connected) return;

        this.socket = io(this.serverUrl);

        this.socket.on('connect', () => {
this.socket?.emit('legend:register', {
                walletAddress,
                timestamp: Date.now()
            });
        });

        // Listen for AI responses
        this.socket.on('legend:ai_response', (response: LegendAIResponse) => {
            this.emit('ai_response', response);
        });

        // Listen for daily messages (sysop-style)
        this.socket.on('legend:daily_message', (message: DailyMessage) => {
            this.emit('daily_message', message);
        });

        // Listen for multiplayer events
        this.socket.on('legend:multiplayer_event', (event: MultiplayerEvent) => {
            this.emit('multiplayer_event', event);
        });

        // Listen for random AI events
        this.socket.on('legend:random_event', (event: GameEvent) => {
            this.emit('random_event', event);
        });

        // Listen for other players' activities
        this.socket.on('legend:player_activity', (activity: any) => {
            this.emit('player_activity', activity);
        });
    }

    // NPC Interaction with AI
    async interactWithNPC(
        npcId: string,
        player: PlayerCharacter,
        context?: string
    ): Promise<LegendAIResponse> {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({
                    type: 'dialogue',
                    content: 'The NPC seems distracted...',
                    npcId,
                    emotion: 'neutral',
                    timestamp: Date.now()
                });
            }, 5000);

            this.socket?.emit('legend:npc_interact', {
                npcId,
                player: {
                    name: player.name,
                    level: player.level,
                    goldStolen: player.goldStolen,
                    goldGivenToPoor: player.goldGivenToPoor,
                    relationship: player.aiRelationship,
                    hasFoughtCrimeLord: player.hasFoughtCrimeLord,
                    // Quest stats for AI personality
                    questsCompleted: player.completedQuests?.length || 0,
                    activeQuests: player.activeQuests?.length || 0,
                    questReputation: player.questReputation || 0
                },
                context,
                timestamp: Date.now()
            });

            this.socket?.once('legend:npc_response', (response: LegendAIResponse) => {
                clearTimeout(timeout);
                resolve(response);
            });
        });
    }

    // Request daily sysop message
    async getDailyMessage(): Promise<DailyMessage | null> {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(null), 5000);

            this.socket?.emit('legend:request_daily_message', {
                timestamp: Date.now()
            });

            this.socket?.once('legend:daily_message', (message: DailyMessage) => {
                clearTimeout(timeout);
                resolve(message);
            });
        });
    }

    // Broadcast player action to other players
    broadcastPlayerAction(action: {
        type: 'level_up' | 'crime_lord_defeated' | 'heist' | 'donation' | 'death' | 'achievement' | 'quest_started' | 'quest_completed' | 'legendary_quest';
        player: {
            name: string;
            address: string;
            level: number;
        };
        details: any;
    }) {
        this.socket?.emit('legend:player_action', {
            ...action,
            timestamp: Date.now()
        });
    }

    // Broadcast quest events specifically
    broadcastQuestEvent(event: {
        type: 'quest_started' | 'quest_completed' | 'heist_team_formed' | 'legendary_completion';
        questTitle: string;
        player: {
            name: string;
            address: string;
            level: number;
        };
        questType?: 'story' | 'side' | 'daily' | 'heist' | 'achievement';
        difficulty?: 'easy' | 'medium' | 'hard' | 'legendary';
        teamSize?: number;
    }) {
        this.socket?.emit('legend:quest_event', {
            ...event,
            timestamp: Date.now()
        });
    }

    // Request AI-generated random event
    async requestRandomEvent(player: PlayerCharacter, location: string): Promise<GameEvent | null> {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(null), 5000);

            this.socket?.emit('legend:request_event', {
                player: {
                    name: player.name,
                    level: player.level,
                    location,
                    charm: player.charm,
                    goldOnHand: player.gold
                },
                timestamp: Date.now()
            });

            this.socket?.once('legend:generated_event', (event: GameEvent) => {
                clearTimeout(timeout);
                resolve(event);
            });
        });
    }

    // Get AI tips for player
    async getAITips(player: PlayerCharacter): Promise<string[]> {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve([]), 5000);

            this.socket?.emit('legend:request_tips', {
                player: {
                    level: player.level,
                    gold: player.gold,
                    goldInBank: player.goldInBank,
                    weapon: player.weapon?.name,
                    armor: player.armor?.name,
                    turnsRemaining: player.turnsRemaining,
                    hasFoughtCrimeLord: player.hasFoughtCrimeLord
                },
                timestamp: Date.now()
            });

            this.socket?.once('legend:tips_response', (tips: string[]) => {
                clearTimeout(timeout);
                resolve(tips);
            });
        });
    }

    // Request AI-generated quest
    async requestQuest(player: PlayerCharacter): Promise<any> {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(null), 5000);

            this.socket?.emit('legend:request_quest', {
                player: {
                    level: player.level,
                    reputation: player.goldGivenToPoor,
                    crimeLordProgress: player.hasFoughtCrimeLord
                },
                timestamp: Date.now()
            });

            this.socket?.once('legend:quest_generated', (quest: any) => {
                clearTimeout(timeout);
                resolve(quest);
            });
        });
    }

    // Event listener system
    on(event: string, callback: (data: any) => void) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }

    off(event: string, callback: (data: any) => void) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            this.listeners.set(
                event,
                callbacks.filter(cb => cb !== callback)
            );
        }
    }

    private emit(event: string, data: any) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
        this.listeners.clear();
    }
}

// React Hook for using Legend AI
export function useLegendAI(player: PlayerCharacter | null) {
    const aiService = LegendAIService.getInstance();
    const playerRef = useRef(player);

    // Update playerRef when player changes
    useEffect(() => {
        playerRef.current = player;
    }, [player]);

    const initialize = useCallback(() => {
        if (playerRef.current) {
            aiService.initialize(playerRef.current.walletAddress);
        }
    }, [aiService]);

    const talkToNPC = useCallback(async (npcId: string, context?: string) => {
        if (!playerRef.current) return null;
        return await aiService.interactWithNPC(npcId, playerRef.current, context);
    }, [aiService]);

    const getDailyMessage = useCallback(async () => {
        return await aiService.getDailyMessage();
    }, [aiService]);

    const requestEvent = useCallback(async (location: string) => {
        if (!playerRef.current) return null;
        return await aiService.requestRandomEvent(playerRef.current, location);
    }, [aiService]);

    const getTips = useCallback(async () => {
        if (!playerRef.current) return [];
        return await aiService.getAITips(playerRef.current);
    }, [aiService]);

    const requestQuest = useCallback(async () => {
        if (!playerRef.current) return null;
        return await aiService.requestQuest(playerRef.current);
    }, [aiService]);

    const broadcastAction = useCallback((action: Parameters<typeof aiService.broadcastPlayerAction>[0]) => {
        aiService.broadcastPlayerAction(action);
    }, [aiService]);

    const broadcastQuest = useCallback((event: Parameters<typeof aiService.broadcastQuestEvent>[0]) => {
        aiService.broadcastQuestEvent(event);
    }, [aiService]);

    const subscribe = useCallback((event: string, callback: (data: any) => void) => {
        aiService.on(event, callback);
        return () => aiService.off(event, callback);
    }, [aiService]);

    return useMemo(() => ({
        initialize,
        talkToNPC,
        getDailyMessage,
        requestEvent,
        getTips,
        requestQuest,
        broadcastAction,
        broadcastQuest,
        subscribe
    }), [initialize, talkToNPC, getDailyMessage, requestEvent, getTips, requestQuest, broadcastAction, broadcastQuest, subscribe]);
}

export default LegendAIService;
