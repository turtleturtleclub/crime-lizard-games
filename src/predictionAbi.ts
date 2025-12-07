// CrimeLizardPrediction Contract ABI
// Generated from CrimeLizardPrediction.sol
// Deployed: Dec 2025 to BSC Mainnet

export const PREDICTION_CONTRACT_ADDRESS = {
    mainnet: '0x472F1f89c6226a5682DEe4b9948D3200acC50aEe'
};

export const PREDICTION_ABI = [
    // Constructor
    "constructor(address _characterNFT, address _goldContract)",

    // Character Selection
    "function selectCharacter(uint256 characterId) external",
    "function getActiveCharacter(address player) external view returns (uint256)",

    // Market Creation
    "function createMarket(string calldata question, string[] calldata outcomes, uint256 bettingDuration, uint256 resolutionDelay, uint8 marketType, uint8 oracleType, address oracleFeed, int256 targetPrice) external returns (uint256 marketId)",

    // Betting
    "function placeBet(uint256 marketId, uint256 characterId, uint256 outcomeIndex, uint256 amount) external",

    // Resolution
    "function resolveWithChainlink(uint256 marketId) external",
    "function resolveWithGameServer(uint256 marketId, uint256 winningOutcome) external",
    "function resolveWithCommunityVote(uint256 marketId, uint256 winningOutcome) external",
    "function cancelMarket(uint256 marketId, string calldata reason) external",

    // Claiming
    "function claimWinnings(uint256 marketId, uint256 characterId) external",
    "function batchClaimWinnings(uint256[] calldata marketIds, uint256 characterId) external",

    // View Functions
    "function getCurrentOdds(uint256 marketId) external view returns (uint256[] memory odds)",
    "function getMarket(uint256 marketId) external view returns (string memory question, string[] memory outcomes, uint256[] memory pools, uint256 totalPool, uint256 bettingDeadline, uint256 resolutionTime, uint8 status, uint256 winningOutcome, uint256 totalBets)",
    "function getPlayerBetsForMarket(uint256 marketId, address player) external view returns (tuple(uint256 marketId, uint256 characterId, address player, uint256 outcomeIndex, uint256 amount, uint256 timestamp, uint256 oddsAtBet, bool claimed)[] memory)",
    "function getPlayerStats(address player) external view returns (tuple(uint256 totalBets, uint256 totalWagered, uint256 totalWon, uint256 correctPredictions, uint256 currentStreak, uint256 bestStreak, uint256 lastBetTime) memory)",
    "function getActiveMarketCount() external view returns (uint256 count)",
    "function isBettingOpen(uint256 marketId) external view returns (bool)",
    "function calculatePotentialPayout(uint256 marketId, uint256 outcomeIndex, uint256 betAmount) external view returns (uint256)",

    // State Variables
    "function markets(uint256) external view returns (uint256 id, string memory question, uint256 totalPool, uint256 createdAt, uint256 bettingDeadline, uint256 resolutionTime, uint8 marketType, uint8 status, uint8 oracleType, address oracleFeed, int256 targetPrice, uint256 winningOutcome, uint256 totalBets, address creator)",
    "function playerStats(address) external view returns (uint256 totalBets, uint256 totalWagered, uint256 totalWon, uint256 correctPredictions, uint256 currentStreak, uint256 bestStreak, uint256 lastBetTime)",
    "function stats() external view returns (uint256 totalMarkets, uint256 totalBets, uint256 totalVolume, uint256 totalPaidOut, uint256 totalPlayers, uint256 biggestPayout, address biggestWinner)",
    "function marketCount() external view returns (uint256)",
    "function activeCharacter(address) external view returns (uint256)",
    "function minBetSize() external view returns (uint256)",
    "function maxBetSize() external view returns (uint256)",
    "function houseFee() external view returns (uint256)",

    // Admin Functions
    "function setGameServer(address server, bool authorized) external",
    "function setMarketCreator(address creator, bool authorized) external",
    "function setChainlinkFeed(bytes32 key, address feed) external",
    "function setMinBet(uint256 newMinBet) external",
    "function setMaxBet(uint256 newMaxBet) external",
    "function setHouseFee(uint256 newFee) external",
    "function pause() external",
    "function unpause() external",
    "function transferOwnership(address newOwner) external",
    "function withdraw() external",

    // Events
    "event MarketCreated(uint256 indexed marketId, string question, uint256 outcomeCount, uint8 marketType, uint256 bettingDeadline, uint256 resolutionTime, address indexed creator)",
    "event BetPlaced(uint256 indexed marketId, uint256 indexed characterId, address indexed player, uint256 outcomeIndex, uint256 amount, uint256[] newOdds, uint256 totalPool)",
    "event OddsUpdated(uint256 indexed marketId, uint256[] odds, uint256 totalPool)",
    "event MarketResolved(uint256 indexed marketId, uint256 winningOutcome, uint256 winningPool, uint256 totalPool, uint256 payoutMultiplier)",
    "event WinningsClaimed(uint256 indexed marketId, uint256 indexed characterId, address indexed player, uint256 payout)",
    "event MarketCancelled(uint256 indexed marketId, string reason)",
    "event BigWin(address indexed player, uint256 indexed marketId, uint256 payout, uint256 multiplier)",
    "event StreakBonus(address indexed player, uint256 streak, uint256 bonusPercent)"
] as const;

// Enum mappings
export const MarketType = {
    CRYPTO_PRICE: 0,
    IN_GAME: 1,
    COMMUNITY: 2
} as const;

export const MarketStatus = {
    ACTIVE: 0,
    RESOLVED: 1,
    CANCELLED: 2
} as const;

export const OracleType = {
    CHAINLINK: 0,
    GAME_SERVER: 1,
    COMMUNITY_VOTE: 2
} as const;

// Chainlink Price Feeds (BSC Mainnet)
export const CHAINLINK_FEEDS = {
    'BNB/USD': '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',
    'BTC/USD': '0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf',
    'ETH/USD': '0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e'
} as const;

export default PREDICTION_ABI;
