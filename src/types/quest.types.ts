// Enhanced Quest System Types for Legend of the Crime Lizard
// Includes multiplayer heists, team mechanics, AI integration, and GameFi features

import type { PlayerCharacter } from './legend.types';

// ============================================================================
// CORE QUEST TYPES
// ============================================================================

export type QuestType = 'story' | 'side' | 'daily' | 'heist' | 'achievement';
export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';
export type QuestStatus = 'locked' | 'available' | 'active' | 'completed' | 'failed' | 'expired';

export type ObjectiveType =
    | 'kill'           // Defeat enemies
    | 'collect'        // Collect items/gold
    | 'explore'        // Visit locations
    | 'talk'           // Speak with NPCs
    | 'deliver'        // Deliver items
    | 'protect'        // Keep something safe
    | 'stealth'        // Complete without detection
    | 'survive'        // Survive for duration
    | 'skill_check';   // Pass stat check

// ============================================================================
// QUEST OBJECTIVE
// ============================================================================

export interface QuestObjective {
    id: string;
    description: string;
    type: ObjectiveType;
    target: string;              // What to target (enemy ID, item ID, location, etc.)
    amount: number;              // How many required
    currentAmount?: number;      // Current progress

    // Optional stat requirements
    statCheck?: {
        stat: 'strength' | 'defense' | 'charm' | 'level';
        value: number;
        bonus?: { archetype: number; value: number }[]; // Archetype-specific bonuses
    };

    // Hidden objectives (revealed during quest)
    hidden?: boolean;

    // Optional: required to complete quest
    optional?: boolean;
}

// ============================================================================
// QUEST REQUIREMENTS
// ============================================================================

export interface QuestRequirements {
    minLevel?: number;
    maxLevel?: number;
    minReputation?: number;
    prerequisites?: string[];    // Other quest IDs
    items?: string[];           // Required items in inventory
    gold?: number;              // Gold cost to start

    // Team requirements (for multiplayer quests)
    team?: {
        minPlayers: number;
        maxPlayers: number;
        requiredRoles?: ArchetypeRole[];  // Required archetype roles
        requiredArchetypes?: number[]; // Specific archetypes required
    };

    // Time-based requirements
    timeOfDay?: 'day' | 'night' | 'any';
    cooldown?: number;          // Hours between repeats
}

export type ArchetypeRole = 'damage' | 'tank' | 'support' | 'utility' | 'balanced';

// ============================================================================
// QUEST REWARDS
// ============================================================================

export interface QuestRewards {
    gold?: number;
    experience?: number;
    items?: string[];           // Item IDs
    reputation?: number;
    title?: string;

    // Special rewards
    unlockLocation?: string;    // Unlock new area
    unlockQuest?: string[];     // Unlock new quests

    // Faction reputation
    factionReputation?: {
        faction: 'criminal' | 'law' | 'merchant' | 'noble' | 'poor';
        amount: number;
    }[];

    // NFT rewards (GameFi integration)
    nftReward?: {
        type: 'badge' | 'achievement' | 'item';
        name: string;
        description: string;
        rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    };

    // Bonus turns
    bonusTurns?: number;
}

// ============================================================================
// QUEST FAILURE CONSEQUENCES
// ============================================================================

export interface QuestFailureConsequences {
    goldLoss?: number;
    goldLossPercentage?: number;
    reputationLoss?: number;
    itemLoss?: string[];         // Specific items
    randomItemLoss?: number;     // Number of random items

    // Penalties
    jail?: {
        duration: number;        // Hours
        restriction: 'all_quests' | 'heists' | 'pvp';
    };

    // Faction consequences
    factionPenalty?: {
        faction: 'criminal' | 'law' | 'merchant' | 'noble' | 'poor';
        amount: number;
    }[];

    // Experience loss
    experienceLoss?: number;

    // Temporary stat debuff
    debuff?: {
        stat: 'strength' | 'defense' | 'charm';
        amount: number;
        duration: number;  // Hours
    };
}

// ============================================================================
// HEIST-SPECIFIC TYPES
// ============================================================================

export interface HeistPhase {
    id: string;
    name: string;
    description: string;
    type: 'planning' | 'infiltration' | 'objective' | 'combat' | 'escape';

    // Phase requirements
    skillChecks?: {
        player: 'any' | 'specific';  // Which player does the check
        role?: ArchetypeRole;         // Required role for this check
        stat: 'strength' | 'defense' | 'charm';
        difficulty: number;
        failureConsequence?: 'alarm' | 'damage' | 'phase_skip' | 'instant_fail';
    }[];

    // Combat in this phase
    combat?: {
        enemyCount: number;
        enemyLevel: number;
        enemyType: string;
        defeatable?: boolean;  // Can enemies be defeated or just survived
    };

    // Time limit
    turnLimit?: number;

    // AI integration
    aiNarration?: boolean;  // Generate dynamic narration for this phase
}

export interface HeistChoice {
    id: string;
    phase: string;           // Which phase this choice appears in
    question: string;
    description: string;

    options: {
        id: string;
        label: string;
        description: string;
        effects: {
            modifyPhase?: string;  // Change which phase comes next
            addGuards?: number;
            addLoot?: number;
            skipPhase?: string;
            goldCost?: number;
        };
    }[];

    // Who votes (for team quests)
    votingType: 'majority' | 'unanimous' | 'leader';
}

export interface HeistLoot {
    minGold: number;
    maxGold: number;

    // Loot tiers based on performance
    tiers: {
        percentage: number;  // % of loot to take
        difficulty: 'easy' | 'medium' | 'hard';
        bonusItems?: string[];
    }[];

    // Distribution for team
    distribution: 'equal' | 'role_based' | 'performance' | 'custom';

    // Performance-based multipliers
    multipliers?: {
        condition: string;
        value: number;
    }[];
}

// ============================================================================
// MAIN ENHANCED QUEST INTERFACE
// ============================================================================

export interface EnhancedQuest {
    id: string;
    title: string;
    description: string;
    lore?: string;  // Extended story/background

    // Quest metadata
    type: QuestType;
    difficulty: QuestDifficulty;
    giver: string;              // NPC ID
    location: string;           // Starting location

    // Requirements
    requirements: QuestRequirements;

    // Objectives
    objectives: QuestObjective[];

    // Rewards
    rewards: QuestRewards;

    // Failure consequences
    failureConsequences?: QuestFailureConsequences;

    // Time limits
    timeLimit?: number;         // Hours to complete
    expirationDate?: Date;      // Specific expiration (for dailies)

    // Heist-specific data
    heistData?: {
        phases: HeistPhase[];
        choices: HeistChoice[];
        loot: HeistLoot;
        insurance?: {
            cost: number;
            protectsAgainst: ('gold_loss' | 'item_loss' | 'jail')[];
        };
    };

    // AI Integration
    aiIntegration?: {
        dynamicDialogue: boolean;      // Generate NPC dialogue
        adaptiveDifficulty: boolean;   // Adjust based on player skill
        generateObjectives: boolean;   // AI can add objectives
        personalizedRewards: boolean;  // Rewards based on player needs
    };

    // Quest chain
    chainId?: string;           // Quest chain this belongs to
    chainPosition?: number;     // Position in chain

    // Branching paths
    branches?: {
        choiceId: string;
        nextQuest: string;
    }[];

    // Repeatable
    repeatable?: boolean;
    repeatCooldown?: number;    // Hours

    // Tags for filtering
    tags?: string[];
}

// ============================================================================
// ACTIVE QUEST STATE
// ============================================================================

export interface ActiveQuestState {
    questId: string;
    status: QuestStatus;
    startedAt: Date;
    expiresAt?: Date;

    // Progress tracking
    objectives: {
        objectiveId: string;
        currentAmount: number;
        completed: boolean;
    }[];

    // Team quest state
    team?: {
        leaderId: string;       // Wallet address
        members: {
            walletAddress: string;
            tokenId: number;
            name: string;
            archetype: number;
            role: ArchetypeRole;
        }[];

        // Team performance tracking
        stats?: {
            totalDamage?: number;
            totalHealing?: number;
            skillChecksCompleted?: number;
        };
    };

    // Heist-specific state
    heistState?: {
        currentPhase: string;
        phasesCompleted: string[];
        choicesMade: { choiceId: string; optionId: string }[];
        lootCollected: number;
        guardsAlerted: boolean;
        alarmLevel: number;  // 0-100
        failedSkillChecks: number;
    };

    // AI-generated content
    aiContent?: {
        dialogue: { npcId: string; message: string }[];
        events: string[];
        customObjectives?: QuestObjective[];
    };

    // Quest variables (for complex quests)
    variables?: Record<string, any>;

    // Failure tracking
    attemptCount?: number;
    lastAttemptDate?: Date;
}

// ============================================================================
// QUEST NOTIFICATION
// ============================================================================

export interface QuestNotification {
    id: string;
    type: 'new_quest' | 'objective_complete' | 'quest_complete' | 'quest_failed' | 'quest_expired';
    questId: string;
    questTitle: string;
    message: string;
    timestamp: Date;
    read: boolean;

    // Rewards to display
    rewards?: QuestRewards;
}

// ============================================================================
// QUEST EVENT (for multiplayer)
// ============================================================================

export interface QuestEvent {
    eventId: string;
    questId: string;
    type: 'team_formed' | 'phase_complete' | 'choice_made' | 'player_joined' | 'player_left';
    timestamp: Date;
    data: any;

    // Broadcast to team
    broadcast: boolean;
}

// ============================================================================
// QUEST STATISTICS
// ============================================================================

export interface QuestStatistics {
    totalQuestsCompleted: number;
    questsByType: Record<QuestType, number>;
    questsByDifficulty: Record<QuestDifficulty, number>;

    heistStats: {
        totalHeists: number;
        successfulHeists: number;
        failedHeists: number;
        totalGoldStolen: number;
        biggestHeist: number;
        fastestHeist?: {
            questId: string;
            duration: number;
        };
    };

    // Faction reputation
    factionReputation: {
        criminal: number;
        law: number;
        merchant: number;
        noble: number;
        poor: number;
    };

    // Achievements
    achievements: string[];
    titles: string[];
}

// ============================================================================
// QUEST FILTER/SEARCH
// ============================================================================

export interface QuestFilter {
    type?: QuestType[];
    difficulty?: QuestDifficulty[];
    status?: QuestStatus[];
    minLevel?: number;
    maxLevel?: number;
    tags?: string[];
    searchTerm?: string;

    // Team filters
    soloOnly?: boolean;
    teamOnly?: boolean;
    availableForMyLevel?: boolean;
}

// ============================================================================
// QUEST MANAGER RESPONSE TYPES
// ============================================================================

export interface QuestStartResult {
    success: boolean;
    message: string;
    quest?: EnhancedQuest;
    activeQuest?: ActiveQuestState;
    errors?: string[];
}

export interface QuestProgressResult {
    success: boolean;
    message: string;
    objectivesCompleted?: string[];
    questCompleted?: boolean;
    questFailed?: boolean;
    rewards?: QuestRewards;
    notifications?: QuestNotification[];
}

export interface QuestCompleteResult {
    success: boolean;
    message: string;
    rewards?: QuestRewards;
    unlockedQuests?: string[];
    nextQuestInChain?: string;

    // Player state updates
    playerUpdates?: {
        goldGained?: number;
        experienceGained?: number;
        itemsGained?: string[];
        newTitle?: string;
    };
}

// ============================================================================
// HEIST TEAM FORMATION
// ============================================================================

export interface HeistTeamInvite {
    inviteId: string;
    questId: string;
    questTitle: string;
    leader: {
        walletAddress: string;
        tokenId: number;
        name: string;
        level: number;
    };

    invitedPlayer: {
        walletAddress: string;
        tokenId: number;
    };

    requiredRole?: ArchetypeRole;
    expiresAt: Date;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface HeistTeam {
    teamId: string;
    questId: string;
    leader: PlayerCharacter;
    members: PlayerCharacter[];

    status: 'forming' | 'ready' | 'in_progress' | 'completed' | 'failed';

    // Team composition validation
    hasRequiredRoles: boolean;
    missingRoles?: ArchetypeRole[];

    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}

// ============================================================================
// NPC QUEST GIVER
// ============================================================================

export interface QuestGiver {
    id: string;
    name: string;
    title?: string;
    description: string;
    location: string;

    // Available quests
    quests: string[];  // Quest IDs

    // Relationship with player
    requiresReputation?: number;

    // AI personality
    personality?: {
        greeting: string;
        questOffer: string;
        questComplete: string;
        questFailed: string;
        noQuestsAvailable: string;
    };

    // Visual
    avatar?: string;
    emoji?: string;
}

// Export type removed - use named export instead when verbatimModuleSyntax is enabled
