// Fractional NFT (fNFT) Types for Scalable On-Chain Game Data
// Instead of storing full player data on-chain, we use fNFTs for key achievements

export interface fNFTMetadata {
    tokenId: number;
    owner: string;
    type: 'achievement' | 'milestone' | 'rare_event' | 'leaderboard_snapshot';
    name: string;
    description: string;
    attributes: fNFTAttribute[];
    timestamp: number;
    blockNumber?: number;
    transactionHash?: string;
}

export interface fNFTAttribute {
    trait_type: string;
    value: string | number;
    display_type?: 'number' | 'date' | 'boost_percentage' | 'boost_number';
}

// Achievement fNFTs - Minted for major accomplishments
export interface AchievementfNFT extends fNFTMetadata {
    type: 'achievement';
    achievement: {
        id: string;
        name: string;
        rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
        requirement: string;
        claimedAt: Date;
    };
}

// Milestone fNFTs - Level milestones, gold milestones, etc.
export interface MilestonefNFT extends fNFTMetadata {
    type: 'milestone';
    milestone: {
        category: 'level' | 'gold' | 'heists' | 'crime_lord' | 'pvp';
        value: number;
        reachedAt: Date;
    };
}

// Rare Event fNFTs - Commemorative for special events
export interface RareEventfNFT extends fNFTMetadata {
    type: 'rare_event';
    event: {
        eventId: string;
        eventName: string;
        description: string;
        participatedAt: Date;
        isFirstPlace?: boolean;
    };
}

// Leaderboard Snapshot fNFTs - Daily/Weekly top ranks
export interface LeaderboardSnapshotfNFT extends fNFTMetadata {
    type: 'leaderboard_snapshot';
    leaderboard: {
        period: 'daily' | 'weekly' | 'monthly';
        rank: number;
        totalGoldStolen: number;
        totalHeists: number;
        date: Date;
    };
}

// fNFT Collection - Player's collection of fNFTs
export interface fNFTCollection {
    walletAddress: string;
    achievements: AchievementfNFT[];
    milestones: MilestonefNFT[];
    rareEvents: RareEventfNFT[];
    leaderboardSnapshots: LeaderboardSnapshotfNFT[];
    totalfNFTs: number;
    collectionValue: number; // Rarity score
}

// Off-chain Storage Structure (MongoDB) - Most data stays off-chain
export interface PlayerOffChainData {
    walletAddress: string;

    // Core game data (off-chain for cost efficiency)
    coreData: {
        name: string;
        level: number;
        experience: number;
        health: number;
        maxHealth: number;
        gold: number;
        goldInBank: number;
        strength: number;
        defense: number;
        charm: number;
        weapon: any;
        armor: any;
        turnsRemaining: number;
        location: string;
    };

    // Progress tracking (off-chain)
    progress: {
        enemiesDefeated: number;
        heistsCompleted: number;
        goldStolen: number;
        goldGivenToPoor: number;
        deathCount: number;
        pvpWins: number;
        pvpLosses: number;
        crimeLordDefeats: number;
    };

    // fNFT tracking (references to on-chain tokens)
    fNFTs: {
        achievementTokenIds: number[];
        milestoneTokenIds: number[];
        rareEventTokenIds: number[];
        leaderboardTokenIds: number[];
    };

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    lastSync: Date; // Last on-chain sync
}

// Hybrid Storage Strategy
export interface HybridStorageConfig {
    // What gets stored on-chain vs off-chain
    onChain: {
        // Only critical, immutable data
        achievements: boolean;      // true - as fNFTs
        milestones: boolean;         // true - as fNFTs
        leaderboardSnapshots: boolean; // true - historical record
        rareEvents: boolean;         // true - commemorative
    };

    offChain: {
        // Everything else for cost efficiency
        playerStats: boolean;        // true
        inventory: boolean;          // true
        dailyProgress: boolean;      // true
        combatHistory: boolean;      // true
        npcRelationships: boolean;   // true
        questProgress: boolean;      // true
    };

    syncStrategy: {
        achievementSync: 'immediate';  // Mint fNFT immediately
        milestoneSync: 'immediate';    // Mint fNFT immediately
        leaderboardSync: 'daily';      // Sync once per day
        fullSync: 'weekly';            // Full reconciliation
    };
}

// Scalability Benefits:
// 1. Cost: Only mint fNFTs for important events, not every action
// 2. Speed: Most operations are off-chain (instant)
// 3. Gas: Players only pay gas for claiming achievements/milestones
// 4. Storage: Blockchain stores ~5% of data, MongoDB stores 95%
// 5. Flexibility: Can update game mechanics without contract changes
// 6. Performance: Fast gameplay with occasional on-chain commits

// Example: 10,000 players
// - Traditional: 10,000 * 500 bytes = 5MB on-chain = $$$$$
// - fNFT Hybrid: 10,000 * (5 fNFTs * 100 bytes) = 5MB on-chain BUT spread over time
// - Plus: Most data in MongoDB = Fast + Cheap
// - Achievement fNFTs = Tradeable, Provable, Permanent
