// QuestManager Service - Core Quest System Logic
// Handles quest state, progress tracking, team formation, AI integration, and rewards

import type { PlayerCharacter } from '../types/legend.types';
import type {
    EnhancedQuest,
    QuestStartResult,
    QuestProgressResult,
    QuestCompleteResult,
    QuestNotification,
    HeistTeam,
    HeistTeamInvite,
    QuestStatistics,
    QuestFilter,
    ArchetypeRole
} from '../types/quest.types';

// ============================================================================
// QUEST MANAGER CLASS
// ============================================================================

export class QuestManager {
    private apiUrl: string;

    constructor(apiUrl: string = '/api') {
        this.apiUrl = apiUrl;
    }

    // ========================================================================
    // QUEST DISCOVERY & AVAILABILITY
    // ========================================================================

    /**
     * Get active quests for a player
     */
    async getActiveQuests(player: PlayerCharacter): Promise<any[]> {
        try {
            const response = await fetch(`${this.apiUrl}/quests/active`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId
                })
            });

            if (!response.ok) throw new Error('Failed to fetch active quests');
            return await response.json();
        } catch (error) {
            console.error('Error fetching active quests:', error);
            return [];
        }
    }

    /**
     * Get all available quests for a player based on their level, reputation, etc.
     */
    async getAvailableQuests(player: PlayerCharacter, filter?: QuestFilter): Promise<EnhancedQuest[]> {
        try {
            const response = await fetch(`${this.apiUrl}/quests/available`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    filter
                })
            });

            if (!response.ok) throw new Error('Failed to fetch available quests');
            return await response.json();
        } catch (error) {
            console.error('Error fetching available quests:', error);
            return [];
        }
    }

    /**
     * Get a specific quest by ID
     */
    async getQuest(questId: string): Promise<EnhancedQuest | null> {
        try {
            const response = await fetch(`${this.apiUrl}/quests/${questId}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Error fetching quest:', error);
            return null;
        }
    }

    /**
     * Check if player meets quest requirements
     */
    async canStartQuest(player: PlayerCharacter, quest: EnhancedQuest): Promise<{
        canStart: boolean;
        reasons: string[];
    }> {
        const reasons: string[] = [];
        const req = quest.requirements;

        // Level check
        if (req.minLevel && player.level < req.minLevel) {
            reasons.push(`Requires level ${req.minLevel} (you are level ${player.level})`);
        }
        if (req.maxLevel && player.level > req.maxLevel) {
            reasons.push(`Quest only available for levels ${req.maxLevel} and below`);
        }

        // Reputation check
        const questReputation = player.questReputation || 0;
        if (req.minReputation && questReputation < req.minReputation) {
            reasons.push(`Requires ${req.minReputation} reputation (you have ${questReputation})`);
        }

        // Gold check
        const playerGold = player.gold || 0;
        if (req.gold && playerGold < req.gold) {
            reasons.push(`Requires ${req.gold} gold (you have ${playerGold})`);
        }

        // Item check
        if (req.items && req.items.length > 0) {
            const playerInventory = player.inventory || [];
            const missingItems = req.items.filter(itemId =>
                !playerInventory.some(inv => inv.itemData?.id === itemId)
            );
            if (missingItems.length > 0) {
                reasons.push(`Missing required items: ${missingItems.join(', ')}`);
            }
        }

        // Prerequisites check
        if (req.prerequisites && req.prerequisites.length > 0) {
            const completedQuests = player.completedQuests || [];
const missingPrereqs = req.prerequisites.filter(prereqId =>
                !completedQuests.includes(prereqId)
            );
if (missingPrereqs.length > 0) {
                reasons.push(`Must complete prerequisite quests first: ${missingPrereqs.join(', ')}`);
            }
        }

        // Check if already active
        const activeQuests = player.activeQuests || [];
        const isActive = activeQuests.some(aq => aq.questId === quest.id);
        if (isActive) {
            reasons.push('Quest already active');
        }

        // Check if already completed and not repeatable
        const completedQuests = player.completedQuests || [];
        if (completedQuests.includes(quest.id) && !quest.repeatable) {
            reasons.push('Quest already completed');
        }

        return {
            canStart: reasons.length === 0,
            reasons
        };
    }

    // ========================================================================
    // QUEST START
    // ========================================================================

    /**
     * Start a quest for a player
     */
    async startQuest(
        player: PlayerCharacter,
        questId: string,
        team?: HeistTeam
    ): Promise<QuestStartResult> {
        try {
            const quest = await this.getQuest(questId);
            if (!quest) {
                return { success: false, message: 'Quest not found' };
            }

            // Check requirements
            const canStart = await this.canStartQuest(player, quest);
            if (!canStart.canStart) {
                return {
                    success: false,
                    message: 'Requirements not met',
                    errors: canStart.reasons
                };
            }

            // Team quest validation
            if (quest.requirements.team && !team) {
                return {
                    success: false,
                    message: 'This quest requires a team'
                };
            }

            // Start quest via API
            const response = await fetch(`${this.apiUrl}/quests/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    questId,
                    teamId: team?.teamId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                return {
                    success: false,
                    message: error.message || 'Failed to start quest'
                };
            }

            const result = await response.json();

            return {
                success: true,
                message: `Quest started: ${quest.title}`,
                quest,
                activeQuest: result.activeQuest
            };
        } catch (error) {
            console.error('Error starting quest:', error);
            return {
                success: false,
                message: 'An error occurred while starting the quest'
            };
        }
    }

    // ========================================================================
    // QUEST PROGRESS TRACKING
    // ========================================================================

    /**
     * Update quest objective progress
     */
    async updateObjectiveProgress(
        player: PlayerCharacter,
        questId: string,
        objectiveId: string,
        amount: number = 1
    ): Promise<QuestProgressResult> {
        try {
            const response = await fetch(`${this.apiUrl}/quests/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    questId,
                    objectiveId,
                    amount
                })
            });

            if (!response.ok) {
                return {
                    success: false,
                    message: 'Failed to update quest progress'
                };
            }

            const result = await response.json();

            return {
                success: true,
                message: result.message,
                objectivesCompleted: result.objectivesCompleted,
                questCompleted: result.questCompleted,
                questFailed: result.questFailed,
                rewards: result.rewards,
                notifications: result.notifications
            };
        } catch (error) {
            console.error('Error updating quest progress:', error);
            return {
                success: false,
                message: 'An error occurred while updating quest progress'
            };
        }
    }

    /**
     * Batch update multiple objectives (useful for combat)
     */
    async updateMultipleObjectives(
        player: PlayerCharacter,
        updates: { questId: string; objectiveId: string; amount: number }[]
    ): Promise<QuestProgressResult[]> {
        const results: QuestProgressResult[] = [];

        for (const update of updates) {
            const result = await this.updateObjectiveProgress(
                player,
                update.questId,
                update.objectiveId,
                update.amount
            );
            results.push(result);
        }

        return results;
    }

    /**
     * Track combat kills for quest objectives
     */
    async trackCombatKill(
        player: PlayerCharacter,
        enemyId: string,
        goldEarned: number
    ): Promise<QuestProgressResult[]> {
        const updates: { questId: string; objectiveId: string; amount: number }[] = [];

        // Find all active quests with kill objectives
        const activeQuests = player.activeQuests || [];
        for (const activeQuest of activeQuests) {
            const quest = await this.getQuest(activeQuest.questId);
            if (!quest) continue;

            for (const objective of quest.objectives) {
                if (objective.type === 'kill' && objective.target === enemyId) {
                    updates.push({
                        questId: quest.id,
                        objectiveId: objective.id,
                        amount: 1
                    });
                }

                // Track gold collection objectives
                if (objective.type === 'collect' && objective.target.includes('gold')) {
                    updates.push({
                        questId: quest.id,
                        objectiveId: objective.id,
                        amount: goldEarned
                    });
                }
            }
        }

        if (updates.length > 0) {
            return await this.updateMultipleObjectives(player, updates);
        }

        return [];
    }

    // ========================================================================
    // QUEST COMPLETION
    // ========================================================================

    /**
     * Complete a quest and distribute rewards
     */
    async completeQuest(
        player: PlayerCharacter,
        questId: string
    ): Promise<QuestCompleteResult> {
        try {
            const response = await fetch(`${this.apiUrl}/quests/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    questId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                return {
                    success: false,
                    message: error.message || 'Failed to complete quest'
                };
            }

            const result = await response.json();

            return {
                success: true,
                message: `Quest completed: ${result.questTitle}`,
                rewards: result.rewards,
                unlockedQuests: result.unlockedQuests,
                nextQuestInChain: result.nextQuestInChain,
                playerUpdates: result.playerUpdates
            };
        } catch (error) {
            console.error('Error completing quest:', error);
            return {
                success: false,
                message: 'An error occurred while completing the quest'
            };
        }
    }

    /**
     * Fail a quest and apply consequences
     */
    async failQuest(
        player: PlayerCharacter,
        questId: string,
        reason?: string
    ): Promise<QuestCompleteResult> {
        try {
            const response = await fetch(`${this.apiUrl}/quests/fail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    questId,
                    reason
                })
            });

            if (!response.ok) {
                return {
                    success: false,
                    message: 'Failed to process quest failure'
                };
            }

            const result = await response.json();

            return {
                success: true,
                message: result.message,
                playerUpdates: result.consequences
            };
        } catch (error) {
            console.error('Error failing quest:', error);
            return {
                success: false,
                message: 'An error occurred while processing quest failure'
            };
        }
    }

    /**
     * Abandon/cancel a quest
     */
    async abandonQuest(
        player: PlayerCharacter,
        questId: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const response = await fetch(`${this.apiUrl}/quests/abandon`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    questId
                })
            });

            if (!response.ok) {
                return { success: false, message: 'Failed to abandon quest' };
            }

            return { success: true, message: 'Quest abandoned' };
        } catch (error) {
            console.error('Error abandoning quest:', error);
            return { success: false, message: 'An error occurred' };
        }
    }

    // ========================================================================
    // TEAM/MULTIPLAYER HEIST FUNCTIONS
    // ========================================================================

    /**
     * Create a heist team
     */
    async createHeistTeam(
        leader: PlayerCharacter,
        questId: string
    ): Promise<{ success: boolean; team?: HeistTeam; message: string }> {
        try {
            const response = await fetch(`${this.apiUrl}/quests/heist/create-team`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: leader.walletAddress,
                    tokenId: leader.tokenId,
                    questId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, message: error.message };
            }

            const result = await response.json();

            return {
                success: true,
                team: result.team,
                message: 'Team created successfully'
            };
        } catch (error) {
            console.error('Error creating heist team:', error);
            return { success: false, message: 'An error occurred' };
        }
    }

    /**
     * Invite player to heist team
     */
    async inviteToHeist(
        teamId: string,
        targetPlayer: {
            walletAddress: string;
            tokenId: number;
        },
        requiredRole?: ArchetypeRole
    ): Promise<{ success: boolean; invite?: HeistTeamInvite; message: string }> {
        try {
            const response = await fetch(`${this.apiUrl}/quests/heist/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId,
                    targetPlayer,
                    requiredRole
                })
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, message: error.message };
            }

            const result = await response.json();

            return {
                success: true,
                invite: result.invite,
                message: 'Invite sent successfully'
            };
        } catch (error) {
            console.error('Error sending heist invite:', error);
            return { success: false, message: 'An error occurred' };
        }
    }

    /**
     * Accept heist team invite
     */
    async acceptHeistInvite(
        player: PlayerCharacter,
        inviteId: string
    ): Promise<{ success: boolean; team?: HeistTeam; message: string }> {
        try {
            const response = await fetch(`${this.apiUrl}/quests/heist/accept-invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    inviteId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, message: error.message };
            }

            const result = await response.json();

            return {
                success: true,
                team: result.team,
                message: 'Joined team successfully'
            };
        } catch (error) {
            console.error('Error accepting heist invite:', error);
            return { success: false, message: 'An error occurred' };
        }
    }

    /**
     * Start heist with team
     */
    async startHeist(
        teamId: string
    ): Promise<QuestStartResult> {
        try {
            const response = await fetch(`${this.apiUrl}/quests/heist/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId })
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, message: error.message };
            }

            const result = await response.json();

            return {
                success: true,
                message: 'Heist started!',
                quest: result.quest,
                activeQuest: result.activeQuest
            };
        } catch (error) {
            console.error('Error starting heist:', error);
            return { success: false, message: 'An error occurred' };
        }
    }

    /**
     * Complete heist phase
     */
    async completeHeistPhase(
        teamId: string,
        phaseId: string,
        results: {
            skillChecks?: { playerId: string; success: boolean }[];
            combatResult?: { success: boolean; damageDealt: number };
            choicesMade?: { choiceId: string; optionId: string }[];
        }
    ): Promise<{ success: boolean; nextPhase?: string; message: string }> {
        try {
            const response = await fetch(`${this.apiUrl}/quests/heist/complete-phase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId,
                    phaseId,
                    results
                })
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, message: error.message };
            }

            const result = await response.json();

            return {
                success: true,
                nextPhase: result.nextPhase,
                message: result.message
            };
        } catch (error) {
            console.error('Error completing heist phase:', error);
            return { success: false, message: 'An error occurred' };
        }
    }

    // ========================================================================
    // QUEST STATISTICS & HISTORY
    // ========================================================================

    /**
     * Get player's quest statistics
     */
    async getQuestStatistics(
        player: PlayerCharacter
    ): Promise<QuestStatistics | null> {
        try {
            const response = await fetch(
                `${this.apiUrl}/quests/statistics/${player.walletAddress}/${player.tokenId}`
            );

            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Error fetching quest statistics:', error);
            return null;
        }
    }

    /**
     * Get quest notifications
     */
    async getQuestNotifications(
        player: PlayerCharacter
    ): Promise<QuestNotification[]> {
        try {
            const response = await fetch(
                `${this.apiUrl}/quests/notifications/${player.walletAddress}/${player.tokenId}`
            );

            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error('Error fetching quest notifications:', error);
            return [];
        }
    }

    /**
     * Mark notification as read
     */
    async markNotificationRead(notificationId: string): Promise<void> {
        try {
            await fetch(`${this.apiUrl}/quests/notifications/${notificationId}/read`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    // ========================================================================
    // AI INTEGRATION
    // ========================================================================

    /**
     * Generate AI dialogue for NPC quest giver
     */
    async generateQuestDialogue(
        questId: string,
        npcId: string,
        player: PlayerCharacter,
        context: 'offer' | 'accept' | 'complete' | 'fail'
    ): Promise<string> {
        try {
            const response = await fetch(`${this.apiUrl}/quests/ai/dialogue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questId,
                    npcId,
                    playerId: player.tokenId,
                    context
                })
            });

            if (!response.ok) {
                // Fallback to default dialogue
                return this.getDefaultDialogue(context);
            }

            const result = await response.json();
            return result.dialogue;
        } catch (error) {
            console.error('Error generating quest dialogue:', error);
            return this.getDefaultDialogue(context);
        }
    }

    /**
     * Get default dialogue fallback
     */
    private getDefaultDialogue(context: string): string {
        const dialogues: Record<string, string> = {
            offer: "I have a job for you, if you're interested...",
            accept: "Good. Don't let me down.",
            complete: "Excellent work! Here's your reward.",
            fail: "You failed. Better luck next time."
        };
        return dialogues[context] || "...";
    }

    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================

    /**
     * Calculate archetype role from archetype ID
     */
    getArchetypeRole(archetypeId: number): ArchetypeRole {
        const roleMap: Record<number, ArchetypeRole> = {
            0: 'balanced',      // blacksmith
            1: 'damage',        // rogue
            2: 'tank',          // knight
            3: 'damage',        // mage
            4: 'support',       // robin_hood
            5: 'support',       // prince
            6: 'damage',        // necromancer
            7: 'support',       // paladin
            8: 'balanced',      // crime_lord
            9: 'damage'         // dragon_tamer
        };

        return roleMap[archetypeId] || 'balanced';
    }

    /**
     * Validate team composition for heist
     */
    validateTeamComposition(
        team: PlayerCharacter[],
        requirements?: {
            minPlayers: number;
            maxPlayers: number;
            requiredRoles?: ArchetypeRole[];
            requiredArchetypes?: number[];
        }
    ): { valid: boolean; reasons: string[] } {
        const reasons: string[] = [];

        if (!requirements) return { valid: true, reasons: [] };

        // Check player count
        if (team.length < requirements.minPlayers) {
            reasons.push(`Need at least ${requirements.minPlayers} players`);
        }
        if (team.length > requirements.maxPlayers) {
            reasons.push(`Maximum ${requirements.maxPlayers} players allowed`);
        }

        // Check required roles
        if (requirements.requiredRoles && requirements.requiredRoles.length > 0) {
            const teamRoles = team.map(p => this.getArchetypeRole(p.tokenId as any));
            const missingRoles = requirements.requiredRoles.filter(
                role => !teamRoles.includes(role)
            );

            if (missingRoles.length > 0) {
                reasons.push(`Missing required roles: ${missingRoles.join(', ')}`);
            }
        }

        return {
            valid: reasons.length === 0,
            reasons
        };
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let questManagerInstance: QuestManager | null = null;

export function getQuestManager(apiUrl?: string): QuestManager {
    if (!questManagerInstance) {
        questManagerInstance = new QuestManager(apiUrl);
    }
    return questManagerInstance;
}

export default QuestManager;
