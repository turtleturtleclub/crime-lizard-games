// Quest Integration Hooks
// Automatically track quest progress during combat, exploration, shopping, etc.

import { useCallback } from 'react';
import { useQuests } from '../contexts/QuestContext';
import { useCharacter } from '../contexts/CharacterContext';
import type { Enemy } from '../types/legend.types';

// ============================================================================
// MAIN QUEST INTEGRATION HOOK
// ============================================================================

export const useQuestIntegration = () => {
    const { activeQuests, updateQuestProgress, getQuest } = useQuests();
    const { selectedCharacter: character } = useCharacter();

    // ========================================================================
    // COMBAT INTEGRATION
    // ========================================================================

    /**
     * Track enemy kill for quest objectives
     */
    const trackEnemyKill = useCallback(async (
        enemy: Enemy,
        goldEarned: number
    ) => {
        if (!character || activeQuests.length === 0) return;
const updates: Promise<void>[] = [];

        // Find all active quests with relevant objectives
        for (const activeQuest of activeQuests) {
            const quest = getQuest(activeQuest.questId);
            if (!quest) continue;

            for (const objective of quest.objectives) {
                // Check if objective is already completed
                const progress = activeQuest.objectives.find(o => o.objectiveId === objective.id);
                if (progress?.completed) continue;

                // Kill objectives
                if (objective.type === 'kill') {
                    // Exact enemy match
                    if (objective.target === enemy.id) {
                        updates.push(
                            updateQuestProgress(quest.id, objective.id, 1).then(() => {})
                        );
}

                    // Generic kill objectives (e.g., "kill any enemy")
                    if (objective.target === 'any_enemy') {
                        updates.push(
                            updateQuestProgress(quest.id, objective.id, 1).then(() => {})
                        );
                    }

                    // Rarity-based kill objectives (e.g., "kill 5 rare enemies")
                    if (objective.target === `${enemy.rarity}_enemy`) {
                        updates.push(
                            updateQuestProgress(quest.id, objective.id, 1).then(() => {})
                        );
                    }
                }

                // Gold collection objectives
                if (objective.type === 'collect' && objective.target.includes('gold')) {
                    updates.push(
                        updateQuestProgress(quest.id, objective.id, goldEarned).then(() => {})
                    );
}
            }
        }

        // Execute all updates
        await Promise.all(updates);
    }, [character, activeQuests, getQuest, updateQuestProgress]);

    // ========================================================================
    // EXPLORATION INTEGRATION
    // ========================================================================

    /**
     * Track location exploration
     */
    const trackLocationVisit = useCallback(async (location: string) => {
        if (!character || activeQuests.length === 0) return;
const updates: Promise<void>[] = [];

        for (const activeQuest of activeQuests) {
            const quest = getQuest(activeQuest.questId);
            if (!quest) continue;

            for (const objective of quest.objectives) {
                const progress = activeQuest.objectives.find(o => o.objectiveId === objective.id);
                if (progress?.completed) continue;

                // Exploration objectives
                if (objective.type === 'explore' && objective.target === location) {
                    updates.push(
                        updateQuestProgress(quest.id, objective.id, 1).then(() => {})
                    );
}
            }
        }

        await Promise.all(updates);
    }, [character, activeQuests, getQuest, updateQuestProgress]);

    // ========================================================================
    // COLLECTION INTEGRATION
    // ========================================================================

    /**
     * Track item collection
     */
    const trackItemCollection = useCallback(async (
        itemId: string,
        quantity: number = 1
    ) => {
        if (!character || activeQuests.length === 0) return;
const updates: Promise<void>[] = [];

        for (const activeQuest of activeQuests) {
            const quest = getQuest(activeQuest.questId);
            if (!quest) continue;

            for (const objective of quest.objectives) {
                const progress = activeQuest.objectives.find(o => o.objectiveId === objective.id);
                if (progress?.completed) continue;

                // Collection objectives
                if (objective.type === 'collect' && objective.target === itemId) {
                    updates.push(
                        updateQuestProgress(quest.id, objective.id, quantity).then(() => {})
                    );
}

                // Generic item collection (any item)
                if (objective.type === 'collect' && objective.target === 'any_item') {
                    updates.push(
                        updateQuestProgress(quest.id, objective.id, quantity).then(() => {})
                    );
                }
            }
        }

        await Promise.all(updates);
    }, [character, activeQuests, getQuest, updateQuestProgress]);

    // ========================================================================
    // GOLD TRACKING
    // ========================================================================

    /**
     * Track gold earned
     */
    const trackGoldEarned = useCallback(async (amount: number, source?: string) => {
        if (!character || activeQuests.length === 0) return;
const updates: Promise<void>[] = [];

        for (const activeQuest of activeQuests) {
            const quest = getQuest(activeQuest.questId);
            if (!quest) continue;

            for (const objective of quest.objectives) {
                const progress = activeQuest.objectives.find(o => o.objectiveId === objective.id);
                if (progress?.completed) continue;

                // Gold collection objectives
                if (objective.type === 'collect') {
                    // General gold collection
                    if (objective.target === 'gold' || objective.target === 'gold_earned') {
                        updates.push(
                            updateQuestProgress(quest.id, objective.id, amount).then(() => {})
                        );
                    }

                    // Source-specific gold (e.g., "gold_from_rich", "gold_stolen")
                    if (source && objective.target === `gold_${source}`) {
                        updates.push(
                            updateQuestProgress(quest.id, objective.id, amount).then(() => {})
                        );
                    }
                }
            }
        }

        await Promise.all(updates);
    }, [character, activeQuests, getQuest, updateQuestProgress]);

    /**
     * Track gold donated
     */
    const trackGoldDonated = useCallback(async (amount: number) => {
        if (!character || activeQuests.length === 0) return;
const updates: Promise<void>[] = [];

        for (const activeQuest of activeQuests) {
            const quest = getQuest(activeQuest.questId);
            if (!quest) continue;

            for (const objective of quest.objectives) {
                const progress = activeQuest.objectives.find(o => o.objectiveId === objective.id);
                if (progress?.completed) continue;

                // Donation objectives
                if (objective.type === 'collect' && (
                    objective.target === 'gold_donated' ||
                    objective.target === 'gold_to_poor' ||
                    objective.target === 'daily_donation'
                )) {
                    updates.push(
                        updateQuestProgress(quest.id, objective.id, amount).then(() => {})
                    );
}
            }
        }

        await Promise.all(updates);
    }, [character, activeQuests, getQuest, updateQuestProgress]);

    // ========================================================================
    // NPC INTERACTION
    // ========================================================================

    /**
     * Track talking to NPCs
     */
    const trackNPCInteraction = useCallback(async (npcId: string) => {
        if (!character || activeQuests.length === 0) return;
const updates: Promise<void>[] = [];

        for (const activeQuest of activeQuests) {
            const quest = getQuest(activeQuest.questId);
            if (!quest) continue;

            for (const objective of quest.objectives) {
                const progress = activeQuest.objectives.find(o => o.objectiveId === objective.id);
                if (progress?.completed) continue;

                // Talk objectives
                if (objective.type === 'talk' && objective.target === npcId) {
                    updates.push(
                        updateQuestProgress(quest.id, objective.id, 1).then(() => {})
                    );
}

                // Generic NPC interaction
                if (objective.type === 'talk' && objective.target === 'any_npc') {
                    updates.push(
                        updateQuestProgress(quest.id, objective.id, 1).then(() => {})
                    );
                }
            }
        }

        await Promise.all(updates);
    }, [character, activeQuests, getQuest, updateQuestProgress]);

    // ========================================================================
    // DELIVERY TRACKING
    // ========================================================================

    /**
     * Track item delivery
     */
    const trackItemDelivery = useCallback(async (
        itemId: string,
        _recipientId: string
    ) => {
        if (!character || activeQuests.length === 0) return;
const updates: Promise<void>[] = [];

        for (const activeQuest of activeQuests) {
            const quest = getQuest(activeQuest.questId);
            if (!quest) continue;

            for (const objective of quest.objectives) {
                const progress = activeQuest.objectives.find(o => o.objectiveId === objective.id);
                if (progress?.completed) continue;

                // Delivery objectives
                if (objective.type === 'deliver' && objective.target === itemId) {
                    updates.push(
                        updateQuestProgress(quest.id, objective.id, 1).then(() => {})
                    );
}
            }
        }

        await Promise.all(updates);
    }, [character, activeQuests, getQuest, updateQuestProgress]);

    // ========================================================================
    // PVP TRACKING
    // ========================================================================

    /**
     * Track PvP victory
     */
    const trackPVPVictory = useCallback(async (
        opponent: {
            walletAddress: string;
            tokenId: number;
            name: string;
            archetypeId?: string;
        }
    ) => {
        if (!character || activeQuests.length === 0) return;
const updates: Promise<void>[] = [];

        for (const activeQuest of activeQuests) {
            const quest = getQuest(activeQuest.questId);
            if (!quest) continue;

            for (const objective of quest.objectives) {
                const progress = activeQuest.objectives.find(o => o.objectiveId === objective.id);
                if (progress?.completed) continue;

                // PvP kill objectives
                if (objective.type === 'kill') {
                    // Generic PvP wins
                    if (objective.target === 'arena_opponent' || objective.target === 'any_player') {
                        updates.push(
                            updateQuestProgress(quest.id, objective.id, 1).then(() => {})
                        );
                    }

                    // Archetype-specific PvP (e.g., "kill 3 Rogues")
                    if (opponent.archetypeId && objective.target === opponent.archetypeId) {
                        updates.push(
                            updateQuestProgress(quest.id, objective.id, 1).then(() => {})
                        );
                    }
                }
            }
        }

        await Promise.all(updates);
    }, [character, activeQuests, getQuest, updateQuestProgress]);

    // ========================================================================
    // SHOPPING TRACKING
    // ========================================================================

    /**
     * Track item purchase
     */
    const trackItemPurchase = useCallback(async (
        itemId: string,
        itemType: 'weapon' | 'armor' | 'potion' | 'accessory'
    ) => {
        if (!character || activeQuests.length === 0) return;


        const updates: Promise<void>[] = [];

        for (const activeQuest of activeQuests) {
            const quest = getQuest(activeQuest.questId);
            if (!quest) continue;

            for (const objective of quest.objectives) {
                const progress = activeQuest.objectives.find(o => o.objectiveId === objective.id);
                if (progress?.completed) continue;

                // Purchase objectives
                if (objective.type === 'collect') {
                    // Specific item purchase
                    if (objective.target === itemId) {
                        updates.push(
                            updateQuestProgress(quest.id, objective.id, 1).then(() => {})
                        );
                    }

                    // Type-based purchase (e.g., "buy any weapon")
                    if (objective.target === `any_${itemType}`) {
                        updates.push(
                            updateQuestProgress(quest.id, objective.id, 1).then(() => {})
                        );
                    }
                }
            }
        }

        await Promise.all(updates);
    }, [character, activeQuests, getQuest, updateQuestProgress]);

    // ========================================================================
    // RETURN ALL TRACKING FUNCTIONS
    // ========================================================================

    return {
        // Combat
        trackEnemyKill,

        // Exploration
        trackLocationVisit,

        // Collection
        trackItemCollection,

        // Economy
        trackGoldEarned,
        trackGoldDonated,

        // Social
        trackNPCInteraction,
        trackPVPVictory,

        // Delivery
        trackItemDelivery,

        // Shopping
        trackItemPurchase
    };
};

// ============================================================================
// HELPER: Batch Quest Updates
// ============================================================================

/**
 * Helper to batch multiple quest updates into a single operation
 * Useful for complex actions that trigger multiple objectives
 */
export const useBatchQuestUpdates = () => {
    const { updateQuestProgress } = useQuests();

    const batchUpdate = useCallback(async (
        updates: Array<{
            questId: string;
            objectiveId: string;
            amount: number;
        }>
    ) => {
        const promises = updates.map(update =>
            updateQuestProgress(update.questId, update.objectiveId, update.amount)
        );

        await Promise.all(promises);
    }, [updateQuestProgress]);

    return { batchUpdate };
};

export default useQuestIntegration;
