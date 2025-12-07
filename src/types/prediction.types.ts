// Prediction Market Types

export const MarketType = {
    CRYPTO_PRICE: 'CRYPTO_PRICE',
    IN_GAME: 'IN_GAME',
    COMMUNITY: 'COMMUNITY'
} as const;
export type MarketType = typeof MarketType[keyof typeof MarketType];

export const MarketStatus = {
    ACTIVE: 'ACTIVE',
    RESOLVED: 'RESOLVED',
    CANCELLED: 'CANCELLED'
} as const;
export type MarketStatus = typeof MarketStatus[keyof typeof MarketStatus];

export const OracleType = {
    CHAINLINK: 'CHAINLINK',
    GAME_SERVER: 'GAME_SERVER',
    COMMUNITY_VOTE: 'COMMUNITY_VOTE'
} as const;
export type OracleType = typeof OracleType[keyof typeof OracleType];

export interface Market {
    id: number;
    question: string;
    outcomes: string[];
    pools: number[];           // Gold per outcome
    totalPool: number;
    createdAt: Date;
    bettingDeadline: Date;
    resolutionTime: Date;
    marketType: MarketType;
    status: MarketStatus;
    oracleType: OracleType;
    oracleFeed?: string;       // Chainlink feed address
    targetPrice?: number;      // For price markets
    winningOutcome?: number;
    totalBets: number;
    creator: string;
    // Computed fields
    cachedOdds: number[];      // Odds in basis points (10000 = 1x)
    featured?: boolean;
    tags?: string[];
}

export interface Bet {
    id?: string;
    marketId: number;
    characterId: number;
    walletAddress: string;
    player: string;
    outcomeIndex: number;
    amount: number;
    timestamp: Date;
    oddsAtBet: number;         // Snapshot of odds when bet placed
    potentialPayout: number;   // Calculated at bet time
    claimed: boolean;
    // Resolved fields
    won?: boolean;
    actualPayout?: number;
}

export interface PlayerPredictionStats {
    totalBets: number;
    totalWagered: number;
    totalWon: number;
    correctPredictions: number;
    accuracy: number;          // Percentage
    currentStreak: number;
    bestStreak: number;
    lastBetTime: Date;
    weeklyRank?: number;
    monthlyRank?: number;
}

export interface ContractStats {
    totalMarkets: number;
    totalBets: number;
    totalVolume: number;
    totalPaidOut: number;
    totalPlayers: number;
    biggestPayout: number;
    biggestWinner: string;
}

// API Response Types

export interface MarketListResponse {
    markets: Market[];
    total: number;
    page: number;
    pageSize: number;
}

export interface MarketDetailResponse {
    market: Market;
    recentBets: Bet[];
    oddsHistory: OddsHistoryPoint[];
}

export interface OddsHistoryPoint {
    timestamp: Date;
    odds: number[];
    totalPool: number;
}

export interface PlaceBetRequest {
    marketId: number;
    characterId: number;
    outcomeIndex: number;
    amount: number;
    walletAddress: string;
}

export interface PlaceBetResponse {
    success: boolean;
    bet?: Bet;
    newOdds: number[];
    newTotalPool: number;
    txHash?: string;
    error?: string;
}

export interface ClaimWinningsRequest {
    marketId: number;
    characterId: number;
    walletAddress: string;
}

export interface ClaimWinningsResponse {
    success: boolean;
    payout: number;
    txHash?: string;
    error?: string;
}

export interface LeaderboardEntry {
    rank: number;
    walletAddress: string;
    characterId: number;
    playerName?: string;
    accuracy: number;
    totalBets: number;
    totalWon: number;
    currentStreak: number;
    bestStreak: number;
}

// Socket.IO Event Types

export interface OddsUpdateEvent {
    marketId: number;
    odds: number[];
    pools: number[];
    totalPool: number;
    lastBet?: {
        player: string;
        amount: number;
        outcomeIndex: number;
    };
}

export interface MarketResolvedEvent {
    marketId: number;
    winningOutcome: number;
    winningOutcomeName: string;
    payoutMultiplier: number;
    totalPaidOut: number;
}

export interface NewMarketEvent {
    market: Market;
}

export interface BigBetEvent {
    marketId: number;
    playerName: string;
    amount: number;
    outcomeIndex: number;
    outcomeName: string;
}

export interface BigWinEvent {
    marketId: number;
    playerName: string;
    amount: number;
    multiplier: number;
}

// Utility Types

export interface MarketFilters {
    status?: MarketStatus;
    marketType?: MarketType;
    featured?: boolean;
    minPool?: number;
    search?: string;
    sortBy?: 'deadline' | 'pool' | 'bets' | 'created';
    sortOrder?: 'asc' | 'desc';
}

export interface OddsCalculation {
    outcomeIndex: number;
    impliedProbability: number;  // 0-100
    payoutMultiplier: number;    // e.g., 2.5 = 2.5x
    potentialPayout: number;     // For a given bet amount
}

// Helper function types
export type CalculateOdds = (pools: number[], totalPool: number) => number[];
export type CalculatePayout = (betAmount: number, outcomePool: number, totalPool: number, houseFee: number) => number;
