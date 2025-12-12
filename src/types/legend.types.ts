// Legend of the Crime Lizard - Type Definitions

export interface GameSaveState {
    id: string;
    name: string;
    createdAt: Date;
    expiresAt: Date;
    playerData: Partial<PlayerCharacter>;
    costPaid: number;
    description?: string;
}

export interface PlayerCharacter {
    walletAddress: string;
    tokenId: number; // NFT token ID
    name: string;
    level: number;
    experience: number;
    experienceToNextLevel: number;
    totalGameXP?: number; // Total XP earned across all gameplay (for leaderboards)

    // NFT Metadata
    ipfsImageHash?: string; // IPFS hash for character image
    ipfsMetadataHash?: string; // IPFS hash for NFT metadata

    // Character archetype role (for quest team mechanics)
    role?: 'damage' | 'tank' | 'support' | 'utility' | 'balanced';

    // Core Stats
    health: number;
    maxHealth: number;
    gold: number;
    goldInBank: number;

    // Bank Loan System
    activeLoan?: {
        amount: number; // Original loan amount
        amountOwed: number; // Current amount owed (with interest)
        takenAt: Date; // When the loan was taken
        dueDate: Date; // When the loan is due
        daysOverdue: number; // Number of days overdue
        xpPenaltyAccrued: number; // Total XP penalty from being late
    };
    lastBankInterestDate?: Date; // Last time bank interest was calculated

    // Combat Stats
    strength: number;
    defense: number;
    charm: number;

    // Equipment
    weapon: Weapon | null;
    armor: Armor | null;

    // NEW: Inventory & Items
    inventory: InventoryItem[];
    maxInventorySlots: number;
    equippedAccessories?: Accessory[];

    // NEW: Quests
    activeQuests: ActiveQuest[];
    completedQuests: string[]; // Quest IDs
    questReputation: number; // 0-1000

    // Game State
    turnsRemaining: number;
    maxTurns: number;
    lastTurnReset: Date;
    lastTurnBonus?: number; // Bonus turns awarded on last reset
    lastTurnBonusReasons?: string[]; // Reasons for bonus turns
    location: GameLocation;

    // Progress
    enemiesDefeated: number;
    heistsCompleted: number;
    goldStolen: number;
    goldGivenToPoor: number;
    deathCount: number;
    pvpWins: number;
    pvpLosses: number;

    // Casino Stats
    casinoSpins?: number;
    casinoGoldWon?: number;
    casinoGoldLost?: number;
    casinoBiggestWin?: number;

    // Special
    hasFoughtCrimeLord: boolean;
    hasDefeatedCrimeLord: boolean;
    crimeLordDefeats: number;

    // AI Interaction
    lastAIInteraction?: Date;
    aiRelationship: number; // -100 to 100

    // Save States
    saveStates: GameSaveState[];
    lastSafeSleep?: Date; // When player last slept at inn/brothel
    sleptSafely: boolean; // Did they sleep at a safe location before logging out

    // Death & Respawn
    isDead?: boolean; // Is the player currently dead (needs respawn)

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    lastSeen?: Date; // Last time player was active
    isOnline?: boolean; // Current online status
}

// NEW: Inventory System
export interface InventoryItem {
    id: string;
    itemType: 'weapon' | 'armor' | 'potion' | 'material' | 'quest_item' | 'accessory' | 'consumable';
    quantity: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
    // Full item data (reference from gameData)
    itemData?: Weapon | Armor | Potion | Accessory | any;
    equipped?: boolean; // For weapons and armor
    acquiredAt: Date;
}

export interface Accessory {
    id: string;
    name: string;
    description: string;
    emoji?: string; // Optional emoji for visual display
    bonuses: {
        health?: number;
        strength?: number;
        defense?: number;
        luck?: number;
        goldBonus?: number; // Percentage bonus to gold drops
        xpBonus?: number; // Percentage bonus to XP
    };
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// NEW: Quest System
export interface ActiveQuest {
    questId: string;
    startedAt: Date;
    progress: QuestProgress[];
    expiresAt?: Date; // For daily/timed quests
}

export interface QuestProgress {
    objectiveId: string;
    currentAmount: number;
    targetAmount: number;
    completed: boolean;
}

export interface PVPTarget {
    walletAddress: string;
    tokenId: number;
    name: string;
    level: number;
    health: number;
    maxHealth?: number;
    gold: number;
    strength: number;
    defense: number;
    weapon: Weapon | null;
    armor: Armor | null;
    sleptSafely: boolean;
    lastSeen: Date;
    isOnline: boolean;
    isDead?: boolean;
    pvpWins?: number;
    pvpLosses?: number;
}

export interface Enemy {
    id: string;
    name: string;
    level: number;
    health: number;
    maxHealth: number;
    strength: number;
    defense: number;
    goldMin: number;
    goldMax: number;
    experienceReward: number;
    description: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'boss';
    specialAbility?: {
        name: string;
        description: string;
        chance: number; // Percentage chance to trigger
        effect?: (attacker: Enemy | PlayerCharacter, defender: Enemy | PlayerCharacter) => CombatResult;
    };
    itemDrops?: string[]; // Item IDs that can drop from this enemy
    spawnChance?: number; // For rare spawns (0.0-1.0, default 1.0)
}

export interface SpecialAbility {
    name: string;
    description: string;
    effect: (attacker: Enemy | PlayerCharacter, defender: Enemy | PlayerCharacter) => CombatResult;
}

export interface Weapon {
    id: string;
    name: string;
    attackBonus: number;
    price: number;
    minLevel: number;
    description: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
    advantages?: {
        criticalChance?: number; // Percentage bonus to critical hits
        bleedDamage?: number; // Additional damage over time
        burnDamage?: number; // Burn damage over time
        armorPenetration?: number; // Ignores some enemy defense
        stunChance?: number; // Chance to stun enemy
        healingOnHit?: number; // Heal self when attacking
        lifesteal?: number; // Heal HP on every attack
        chaosStrike?: number; // Chance to deal double damage
        cosmicBlast?: number; // Chance for AoE damage
        voidStrike?: number; // Chance to ignore all defense
        executioner?: number; // Chance to instantly defeat low HP enemies
        divineWrath?: number; // Chance for triple damage
        immortalSlayer?: number; // Chance to instantly defeat any enemy
    };
}

export interface Armor {
    id: string;
    name: string;
    defenseBonus: number;
    price: number;
    minLevel: number;
    description: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
    advantages?: {
        damageReduction?: number; // Additional damage reduction percentage
        thorns?: number; // Damage reflected back to attacker
        regeneration?: number; // HP regen per turn
        dodgeChance?: number; // Chance to dodge attacks
        counterAttack?: number; // Chance to counter attack
        fireResist?: number; // Fire damage reduction
        chaosShield?: number; // Chance to nullify all damage
        cosmicBarrier?: number; // Chance to reflect all damage
        revive?: number; // Chance to revive if defeated
        ironWill?: number; // Chance to reduce damage to 1
    };
}

export interface Item {
    id: string;
    name: string;
    description: string;
    price: number;
    effect: (player: PlayerCharacter) => void;
}

export interface Potion {
    id: string;
    name: string;
    description: string;
    effect: {
        type: 'heal' | 'buff' | 'debuff' | 'revive';
        value: number;
        duration?: number; // For buffs/debuffs
        target?: 'self' | 'ally' | 'enemy';
    };
    price: number;
    minLevel: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    emoji: string;
}

export type GameLocation =
    | 'town'
    | 'forest'
    | 'weapons_shop'
    | 'armor_shop'
    | 'healer'
    | 'bank'
    | 'inn'
    | 'player_list'
    | 'daily_news'
    | 'arena'
    | 'poor_district'
    | 'castle' // Renamed from 'castle' for better theming
    | 'crime_lord_lair'
    | 'boss_queue'
    | 'brothel'
    | 'casino'
    | 'predictions';

export interface CombatResult {
    success: boolean;
    damage: number;
    message: string;
    critical?: boolean;
    goldEarned?: number;
    experienceEarned?: number;
    itemDropped?: Weapon | Armor;
    enemyDefeated?: boolean;
    playerDefeated?: boolean;
    specialEvent?: GameEvent;
}

export interface GameEvent {
    id: string;
    type: 'encounter' | 'treasure' | 'npc_interaction' | 'special' | 'ai_event';
    title: string;
    description: string;
    choices?: EventChoice[];
    outcome?: EventOutcome;
    aiGenerated?: boolean;
}

export interface EventChoice {
    id: string;
    text: string;
    requirement?: {
        stat: 'strength' | 'charm' | 'gold' | 'level';
        value: number;
    };
    outcome: EventOutcome;
}

export interface EventOutcome {
    success: boolean;
    message: string;
    goldChange?: number;
    healthChange?: number;
    experienceChange?: number;
    itemReceived?: Weapon | Armor;
    turnCost?: number;
}

export interface DailyRanking {
    rank: number;
    playerName: string;
    walletAddress: string;
    level: number;
    goldStolen: number;
    heistsCompleted: number;
    hasDefeatedCrimeLord: boolean;
}

export interface GameStats {
    totalPlayers: number;
    totalGoldStolen: number;
    totalHeistsCompleted: number;
    totalCrimeLordDefeats: number;
    topThief: DailyRanking | null;
    activePlayers: number;
}

// AI System Types
export interface AIPersonality {
    id: string;
    name: string;
    role: 'informant' | 'merchant' | 'rival' | 'ally' | 'quest_giver';
    baseDialogue: string[];
    mood: 'friendly' | 'neutral' | 'hostile' | 'mysterious';
    relationshipThreshold: number; // Affects dialogue and quest availability
}

export interface AIQuest {
    id: string;
    title: string;
    description: string;
    giver: string; // AI Personality ID
    requirements: {
        minLevel?: number;
        minRelationship?: number;
        itemsNeeded?: string[];
    };
    rewards: {
        gold?: number;
        experience?: number;
        item?: Weapon | Armor;
        relationshipBonus?: number;
    };
    status: 'available' | 'active' | 'completed' | 'failed';
}

// Blockchain Integration Types
export interface OnChainAchievement {
    id: string;
    name: string;
    description: string;
    requirement: {
        type: 'level' | 'gold' | 'heists' | 'crime_lord' | 'pvp';
        value: number;
    };
    claimed: boolean;
    tokenId?: number;
    transactionHash?: string;
}

export interface GameSession {
    sessionId: string;
    walletAddress: string;
    startTime: Date;
    endTime?: Date;
    turnsUsed: number;
    goldEarned: number;
    experienceEarned: number;
    enemiesDefeated: number;
    events: GameEvent[];
}
