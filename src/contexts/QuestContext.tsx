// Quest Context - React State Management for Quest System
// Provides quest data, actions, and real-time updates to all components

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useCharacter } from './CharacterContext';
import { WalletContext } from '../providers/WalletContext';
import { QuestManager, getQuestManager } from '../services/QuestManager';
import { LEVEL_1_10_QUESTS } from '../data/questData';
import type {
    EnhancedQuest,
    ActiveQuestState,
    QuestNotification,
    QuestStatistics,
    QuestFilter,
    QuestStartResult,
    QuestProgressResult,
    QuestCompleteResult,
    HeistTeam,
    HeistTeamInvite,
    QuestStatus
} from '../types/quest.types';
import type { PlayerCharacter } from '../types/legend.types';

// ============================================================================
// CONTEXT TYPE DEFINITIONS
// ============================================================================

interface QuestContextType {
    // Quest data
    availableQuests: EnhancedQuest[];
    activeQuests: ActiveQuestState[];
    completedQuestIds: string[];
    notifications: QuestNotification[];
    statistics: QuestStatistics | null;

    // Loading states
    loading: boolean;
    error: string | null;

    // Quest actions
    getAvailableQuests: (filter?: QuestFilter) => Promise<void>;
    startQuest: (questId: string, team?: HeistTeam) => Promise<QuestStartResult>;
    updateQuestProgress: (questId: string, objectiveId: string, amount?: number) => Promise<QuestProgressResult>;
    completeQuest: (questId: string) => Promise<QuestCompleteResult>;
    abandonQuest: (questId: string) => Promise<void>;

    // Team/heist actions
    createHeistTeam: (questId: string) => Promise<HeistTeam | null>;
    inviteToHeist: (teamId: string, targetPlayer: { walletAddress: string; tokenId: number }) => Promise<boolean>;
    acceptHeistInvite: (inviteId: string) => Promise<HeistTeam | null>;
    heistInvites: HeistTeamInvite[];

    // Notifications
    markNotificationRead: (notificationId: string) => Promise<void>;
    clearAllNotifications: () => void;

    // Utility
    refreshQuests: () => Promise<void>;
    getQuest: (questId: string) => EnhancedQuest | null;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const QuestContext = createContext<QuestContextType | null>(null);

// ============================================================================
// QUEST PROVIDER COMPONENT
// ============================================================================

interface QuestProviderProps {
    children: ReactNode;
    apiUrl?: string;
}

export const QuestProvider: React.FC<QuestProviderProps> = ({
    children,
    apiUrl = '/api'
}) => {
    const { selectedCharacter: character, refreshGoldBalance } = useCharacter();
    const { account } = useContext(WalletContext);
    const [questManager] = useState<QuestManager>(() => getQuestManager(apiUrl));

    // State
    const [availableQuests, setAvailableQuests] = useState<EnhancedQuest[]>([]);
    const [activeQuests, setActiveQuests] = useState<ActiveQuestState[]>([]);
    const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);
    const [notifications, setNotifications] = useState<QuestNotification[]>([]);
    const [statistics, setStatistics] = useState<QuestStatistics | null>(null);
    const [heistInvites, setHeistInvites] = useState<HeistTeamInvite[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cache for quest data
    const [questCache, setQuestCache] = useState<Map<string, EnhancedQuest>>(new Map());

    // ========================================================================
    // INITIALIZE QUESTS ON CHARACTER LOAD
    // ========================================================================

    useEffect(() => {
        // Initialize quests when we have both account and character
        if (character && account) {
            // Create a PlayerCharacter-compatible object
            const playerCharacter: Partial<PlayerCharacter> = {
                walletAddress: account,
                tokenId: Number(character.tokenId),
                name: character.name,
                level: 1, // Default - will be loaded from server
                activeQuests: [],
                completedQuests: []
            };
            initializeQuests(playerCharacter as any);
        }
    }, [character, account]);

    const initializeQuests = async (player: PlayerCharacter) => {
        setLoading(true);
        setError(null);

        try {
            // CRITICAL: Sync quest state first to clean up any duplicates/desyncs
const syncResponse = await fetch('/api/quests/sync-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId
                })
            });

            if (syncResponse.ok) {
                await syncResponse.json();
} else {
                console.warn('⚠️ Quest sync failed, continuing anyway');
            }

            // Fetch player data from legendPlayers to get actual quest progress
            const playerDataResponse = await fetch(`/api/legend/player/${player.walletAddress}/${player.tokenId}`);
            const playerData = playerDataResponse.ok ? await playerDataResponse.json() : null;
// Fetch active quests from API
            const activeQuestsData = await questManager.getActiveQuests(player);

            // Convert to ActiveQuestState format
            const convertedQuests: ActiveQuestState[] = activeQuestsData.map(aq => ({
                questId: aq.questId,
                status: 'active' as QuestStatus,
                startedAt: aq.startedAt,
                expiresAt: aq.expiresAt,
                objectives: (aq.objectives || []).map((obj: any) => ({
                    objectiveId: obj.objectiveId,
                    currentAmount: obj.currentAmount,
                    completed: obj.completed
                }))
            }));
            setActiveQuests(convertedQuests);

            // CRITICAL: Add active quests to cache so they can be displayed with full data
            setQuestCache(prevCache => {
                const newCache = new Map(prevCache);
                convertedQuests.forEach(aq => {
                    const questData = LEVEL_1_10_QUESTS[aq.questId];
                    if (questData) {
newCache.set(aq.questId, questData);
                    } else {
                        console.warn(`⚠️ Active quest ${aq.questId} not found in LEVEL_1_10_QUESTS`);
                    }
                });
                return newCache;
            });

            // Use completedQuests from database, not from the passed-in player object
            const completedIds = playerData?.completedQuests || [];
setCompletedQuestIds(completedIds);

            // Fetch available quests and pass completedIds directly to ensure cache is populated
            await getAvailableQuests(undefined, completedIds);

            // Fetch notifications
            const notifs = await questManager.getQuestNotifications(player);
            setNotifications(notifs);

            // Fetch statistics
            const stats = await questManager.getQuestStatistics(player);
            setStatistics(stats);
        } catch (err) {
            console.error('Failed to initialize quests:', err);
            setError('Failed to load quests');
        } finally {
            setLoading(false);
        }
    };

    // ========================================================================
    // QUEST ACTIONS
    // ========================================================================

    const getAvailableQuests = useCallback(async (filter?: QuestFilter, completedIds?: string[]) => {
        if (!character || !account) return;

        setLoading(true);
        setError(null);

        try {
            // Create PlayerCharacter-compatible object with completedQuests
            const playerCharacter: Partial<PlayerCharacter> = {
                walletAddress: account,
                tokenId: Number(character.tokenId),
                name: character.name,
                level: 1, // Will be overridden by server data
                activeQuests: [],
                completedQuests: completedIds || completedQuestIds  // ✅ Include completed quests
            };

            const quests = await questManager.getAvailableQuests(playerCharacter as any, filter);
            setAvailableQuests(quests);

            // Update cache with available quests AND completed quests
            setQuestCache(prevCache => {
                const newCache = new Map(prevCache);

                // Add available quests
                quests.forEach(quest => newCache.set(quest.id, quest));

                // Also add completed quests from local data (use passed completedIds or state)
                const idsToAdd = completedIds || completedQuestIds;
                if (idsToAdd && idsToAdd.length > 0) {
                    idsToAdd.forEach(questId => {
                        const quest = LEVEL_1_10_QUESTS[questId];
                        if (quest) {
newCache.set(quest.id, quest);
                        }
                    });
                }

                return newCache;
            });
        } catch (err) {
            console.error('Failed to fetch available quests:', err);
            setError('Failed to load available quests');
        } finally {
            setLoading(false);
        }
    }, [character, account, questManager, completedQuestIds]);

    const startQuest = useCallback(async (
        questId: string,
        team?: HeistTeam
    ): Promise<QuestStartResult> => {
        if (!character || !account) {
            return { success: false, message: 'No character loaded' };
        }

        setLoading(true);
        setError(null);

        try {
            // Create PlayerCharacter-compatible object with completedQuests
            const playerCharacter: Partial<PlayerCharacter> = {
                walletAddress: account,
                tokenId: Number(character.tokenId),
                name: character.name,
                completedQuests: completedQuestIds,  // ✅ Include completed quests for prerequisite checking
                activeQuests: []
            };

            const result = await questManager.startQuest(playerCharacter as any, questId, team);

            if (result.success && result.activeQuest) {
                // Refresh active quests from API to get full data
                const activeQuestsData = await questManager.getActiveQuests(playerCharacter as any);
                const convertedQuests: ActiveQuestState[] = activeQuestsData.map(aq => ({
                    questId: aq.questId,
                    status: 'active' as QuestStatus,
                    startedAt: aq.startedAt,
                    expiresAt: aq.expiresAt,
                    objectives: (aq.objectives || []).map((obj: any) => ({
                        objectiveId: obj.objectiveId,
                        currentAmount: obj.currentAmount,
                        completed: obj.completed
                    }))
                }));
                setActiveQuests(convertedQuests);

                // Remove from available quests
                setAvailableQuests(prev => prev.filter(q => q.id !== questId));

                // Add notification (handled by new QuestNotifications system)
                addNotification({
                    id: `quest_start_${questId}_${Date.now()}`,
                    type: 'new_quest',
                    questId,
                    questTitle: result.quest?.title || 'Quest',
                    message: `Started: ${result.quest?.title}`,
                    timestamp: new Date(),
                    read: false
                });

                // Refresh gold balance after quest start
                if (result.quest?.requirements.gold) {
                    await refreshGoldBalance();
                }
            }

            return result;
        } catch (err) {
            console.error('Failed to start quest:', err);
            setError('Failed to start quest');
            return { success: false, message: 'An error occurred' };
        } finally {
            setLoading(false);
        }
    }, [character, account, questManager, activeQuests, refreshGoldBalance, completedQuestIds]);

    const updateQuestProgress = useCallback(async (
        questId: string,
        objectiveId: string,
        amount: number = 1
    ): Promise<QuestProgressResult> => {
        if (!character || !account) {
            return { success: false, message: 'No character loaded' };
        }

        try {
            const playerCharacter: Partial<PlayerCharacter> = {
                walletAddress: account,
                tokenId: Number(character.tokenId),
                name: character.name,
                completedQuests: completedQuestIds,  // ✅ Include completed quests
                activeQuests: []
            };

            const result = await questManager.updateObjectiveProgress(
                playerCharacter as any,
                questId,
                objectiveId,
                amount
            );

            if (result.success) {
                // Get quest definition to find target amount
                const quest = getQuest(questId);
                const objectiveDef = quest?.objectives.find(o => o.id === objectiveId);

                // Update active quests
                setActiveQuests(prev => prev.map(aq => {
                    if (aq.questId === questId) {
                        return {
                            ...aq,
                            objectives: aq.objectives.map(obj => {
                                if (obj.objectiveId === objectiveId) {
                                    const targetAmount = objectiveDef?.amount || 1;
                                    const newCurrentAmount = obj.currentAmount + amount;
                                    return {
                                        ...obj,
                                        currentAmount: newCurrentAmount,
                                        completed: newCurrentAmount >= targetAmount
                                    };
                                }
                                return obj;
                            })
                        };
                    }
                    return aq;
                }));

                // Progress notifications are now handled by the new QuestNotifications system

                // Add notifications
                if (result.notifications) {
                    result.notifications.forEach(notif => addNotification(notif));
                }

                // If quest completed, handle completion
                if (result.questCompleted) {
                    await completeQuest(questId);
                }
            }

            return result;
        } catch (err) {
            console.error('Failed to update quest progress:', err);
            return { success: false, message: 'An error occurred' };
        }
    }, [character, account, questManager, completedQuestIds]);

    const completeQuest = useCallback(async (
        questId: string
    ): Promise<QuestCompleteResult> => {
        if (!character || !account) {
            return { success: false, message: 'No character loaded' };
        }

        setLoading(true);

        try {
            const playerCharacter: Partial<PlayerCharacter> = {
                walletAddress: account,
                tokenId: Number(character.tokenId),
                name: character.name,
                completedQuests: completedQuestIds,  // ✅ Include completed quests
                activeQuests: []
            };

            const result = await questManager.completeQuest(playerCharacter as any, questId);

            if (result.success) {
                // Remove from active quests
                setActiveQuests(prev => prev.filter(aq => aq.questId !== questId));

                // Add to completed quests
                setCompletedQuestIds(prev => [...prev, questId]);

                // Add notification
                const quest = getQuest(questId);
                addNotification({
                    id: `quest_complete_${questId}_${Date.now()}`,
                    type: 'quest_complete',
                    questId,
                    questTitle: quest?.title || 'Quest',
                    message: `Completed: ${quest?.title}`,
                    timestamp: new Date(),
                    read: false,
                    rewards: result.rewards
                });

                // Refresh character stats after completion
                if (result.playerUpdates?.goldGained) {
                    await refreshGoldBalance();
                }

                // Refresh available quests (new quests may have unlocked)
                await getAvailableQuests();
            }

            return result;
        } catch (err) {
            console.error('Failed to complete quest:', err);
            return { success: false, message: 'An error occurred' };
        } finally {
            setLoading(false);
        }
    }, [character, questManager, completedQuestIds, refreshGoldBalance, getAvailableQuests]);

    const abandonQuest = useCallback(async (questId: string) => {
        if (!character || !account) return;

        try {
            const playerCharacter: Partial<PlayerCharacter> = {
                walletAddress: account,
                tokenId: Number(character.tokenId),
                name: character.name,
                completedQuests: completedQuestIds,  // ✅ Include completed quests
                activeQuests: []
            };

            const result = await questManager.abandonQuest(playerCharacter as any, questId);

            if (result.success) {
                // Remove from active quests
                setActiveQuests(prev => prev.filter(aq => aq.questId !== questId));

                // Add notification
                const quest = getQuest(questId);
                addNotification({
                    id: `quest_abandon_${questId}_${Date.now()}`,
                    type: 'quest_failed',
                    questId,
                    questTitle: quest?.title || 'Quest',
                    message: `Abandoned: ${quest?.title}`,
                    timestamp: new Date(),
                    read: false
                });
            }
        } catch (err) {
            console.error('Failed to abandon quest:', err);
        }
    }, [character, account, questManager, completedQuestIds]);

    // ========================================================================
    // TEAM/HEIST ACTIONS
    // ========================================================================

    const createHeistTeam = useCallback(async (questId: string): Promise<HeistTeam | null> => {
        if (!character || !account) return null;

        try {
            const playerCharacter: Partial<PlayerCharacter> = {
                walletAddress: account,
                tokenId: Number(character.tokenId),
                name: character.name,
                completedQuests: completedQuestIds,  // ✅ Include completed quests
                activeQuests: []
            };

            const result = await questManager.createHeistTeam(playerCharacter as any, questId);
            return result.team || null;
        } catch (err) {
            console.error('Failed to create heist team:', err);
            return null;
        }
    }, [character, account, questManager, completedQuestIds]);

    const inviteToHeist = useCallback(async (
        teamId: string,
        targetPlayer: { walletAddress: string; tokenId: number }
    ): Promise<boolean> => {
        try {
            const result = await questManager.inviteToHeist(teamId, targetPlayer);
            return result.success;
        } catch (err) {
            console.error('Failed to invite to heist:', err);
            return false;
        }
    }, [questManager]);

    const acceptHeistInvite = useCallback(async (
        inviteId: string
    ): Promise<HeistTeam | null> => {
        if (!character || !account) return null;

        try {
            const playerCharacter: Partial<PlayerCharacter> = {
                walletAddress: account,
                tokenId: Number(character.tokenId),
                name: character.name,
                completedQuests: completedQuestIds,  // ✅ Include completed quests
                activeQuests: []
            };

            const result = await questManager.acceptHeistInvite(playerCharacter as any, inviteId);

            if (result.success) {
                // Remove invite from list
                setHeistInvites(prev => prev.filter(inv => inv.inviteId !== inviteId));
            }

            return result.team || null;
        } catch (err) {
            console.error('Failed to accept heist invite:', err);
            return null;
        }
    }, [character, account, questManager, completedQuestIds]);

    // ========================================================================
    // NOTIFICATIONS
    // ========================================================================

    const addNotification = (notification: QuestNotification) => {
        setNotifications(prev => [notification, ...prev]);
    };

    const markNotificationRead = useCallback(async (notificationId: string) => {
        await questManager.markNotificationRead(notificationId);
        setNotifications(prev => prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
        ));
    }, [questManager]);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // ========================================================================
    // UTILITY
    // ========================================================================

    const refreshQuests = useCallback(async () => {
        if (character && account) {
            // Refresh both available and active quests to get latest progress
            const playerCharacter: Partial<PlayerCharacter> = {
                walletAddress: account,
                tokenId: Number(character.tokenId),
                name: character.name
            };

            // Fetch active quests to get updated progress
            const activeQuestsData = await questManager.getActiveQuests(playerCharacter as any);
            const convertedQuests: ActiveQuestState[] = activeQuestsData.map(aq => ({
                questId: aq.questId,
                status: 'active' as QuestStatus,
                startedAt: aq.startedAt,
                expiresAt: aq.expiresAt,
                objectives: (aq.objectives || []).map((obj: any) => ({
                    objectiveId: obj.objectiveId,
                    currentAmount: obj.currentAmount,
                    completed: obj.completed
                }))
            }));
            setActiveQuests(convertedQuests);

            // CRITICAL FIX: Also refresh completed quests from database
            // This ensures completedQuestIds stays in sync after auto-completion
            try {
                const playerDataResponse = await fetch(`/api/legend/player/${account}/${character.tokenId}`);
                if (playerDataResponse.ok) {
                    const playerData = await playerDataResponse.json();
                    if (playerData?.completedQuests) {
setCompletedQuestIds(playerData.completedQuests);
                    }
                }
            } catch (err) {
                console.error('⚠️ Failed to refresh completed quests:', err);
            }

            // Also refresh available quests (pass updated completedIds if we got them)
            await getAvailableQuests();
        }
    }, [character, account, questManager, getAvailableQuests]);

    const getQuest = useCallback((questId: string): EnhancedQuest | null => {
        return questCache.get(questId) || null;
    }, [questCache]);

    // ========================================================================
    // CONTEXT VALUE
    // ========================================================================

    const value: QuestContextType = {
        // Data
        availableQuests,
        activeQuests,
        completedQuestIds,
        notifications,
        statistics,

        // Loading states
        loading,
        error,

        // Actions
        getAvailableQuests,
        startQuest,
        updateQuestProgress,
        completeQuest,
        abandonQuest,

        // Team/heist
        createHeistTeam,
        inviteToHeist,
        acceptHeistInvite,
        heistInvites,

        // Notifications
        markNotificationRead,
        clearAllNotifications,

        // Utility
        refreshQuests,
        getQuest
    };

    return (
        <QuestContext.Provider value={value}>
            {children}
        </QuestContext.Provider>
    );
};

// ============================================================================
// HOOK
// ============================================================================

export const useQuests = (): QuestContextType => {
    const context = useContext(QuestContext);
    if (!context) {
        throw new Error('useQuests must be used within a QuestProvider');
    }
    return context;
};

export default QuestContext;
