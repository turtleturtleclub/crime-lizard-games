/**
 * @title CrimeLizardGold Contract ABI
 * @notice Gold economy contract with game server integration and bank system
 * @dev Supports both hand-held gold and protected bank deposits
 */
export const GOLD_CONTRACT_ABI = [
    // Gold Economy Functions
    "function purchaseGold(uint256 tokenId) payable",
    "function purchaseGoldForCharacter(uint256 tokenId, address characterOwner) payable",
    "function spendGold(uint256 tokenId, uint256 amount, string calldata reason)",
    "function transferGold(uint256 fromTokenId, uint256 toTokenId, uint256 amount)",
    "function getGoldBalance(uint256 tokenId) view returns (uint256)",
    "function calculateGoldAmount(uint256 bnbAmount) view returns (uint256)",
    "function calculateBnbCost(uint256 goldAmount) view returns (uint256)",
    "function getBatchGoldBalances(uint256[] calldata tokenIds) view returns (uint256[] memory)",

    // Game Server Management
    "function addGameServer(address server, string memory name)",
    "function removeGameServer(address server)",
    "function gameServers(address) view returns (bool)",
    "function gameServerNames(address) view returns (string memory)",

    // Game-Initiated Gold Updates
    "function gameAddGold(uint256 tokenId, uint256 amount, string calldata reason)",
    "function gameSpendGold(uint256 tokenId, uint256 amount, string calldata reason)",
    "function gameTransferGold(uint256 fromTokenId, uint256 toTokenId, uint256 amount)",
    "function gameBatchAddGold(uint256[] calldata tokenIds, uint256[] calldata amounts, string[] calldata reasons)",
    "function gameBatchSpendGold(uint256[] calldata tokenIds, uint256[] calldata amounts, string[] calldata reasons)",

    // Bank System
    "function depositToBank(uint256 tokenId, uint256 amount)",
    "function withdrawFromBank(uint256 tokenId, uint256 amount)",
    "function gameDepositToBank(uint256 tokenId, uint256 amount)",
    "function gameWithdrawFromBank(uint256 tokenId, uint256 amount)",
    "function gameAddInterest(uint256 tokenId, uint256 amount)",
    "function goldOnHand(uint256) view returns (uint256)",
    "function goldInBank(uint256) view returns (uint256)",
    "function getBankBalance(uint256 tokenId) view returns (uint256)",
    "function getTotalGold(uint256 tokenId) view returns (uint256)",

    // Admin Functions
    "function setGoldRate(uint256 _newRate)",
    "function setTreasury(address _treasury)",
    "function setTreasuryFee(uint256 _fee)",
    "function adminAddGold(uint256 tokenId, uint256 amount)",
    "function adminRemoveGold(uint256 tokenId, uint256 amount)",
    "function pause()",
    "function unpause()",
    "function withdraw()",
    "function emergencyWithdraw(address payable recipient)",
    "function paused() view returns (bool)",
    "function owner() view returns (address)",

    // View Functions
    "function characterNFT() view returns (address)",
    "function treasury() view returns (address)",
    "function treasuryFee() view returns (uint256)",
    "function goldBalances(uint256) view returns (uint256)",
    "function goldRate() view returns (uint256)",
    "function FEE_DENOMINATOR() view returns (uint256)",

    // Events
    "event GoldPurchased(uint256 indexed tokenId, address indexed buyer, uint256 bnbAmount, uint256 goldAmount, uint256 effectiveRate)",
    "event GoldSpent(uint256 indexed tokenId, uint256 amount, string reason)",
    "event GoldEarned(uint256 indexed tokenId, uint256 amount, string reason)",
    "event GoldTransferred(uint256 indexed fromTokenId, uint256 indexed toTokenId, uint256 amount)",
    "event GoldRateUpdated(uint256 oldRate, uint256 newRate)",
    "event GameServerAdded(address indexed server, string name)",
    "event GameServerRemoved(address indexed server)",
    "event DepositedToBank(uint256 indexed tokenId, uint256 amount, uint256 newBankBalance)",
    "event WithdrewFromBank(uint256 indexed tokenId, uint256 amount, uint256 newBankBalance)",
    "event InterestAdded(uint256 indexed tokenId, uint256 amount, uint256 newBankBalance)",

    // ============================================
    // V4: CLZD TOKEN INTEGRATION
    // ============================================

    // CLZD Purchase
    "function purchaseGoldWithCLZD(uint256 tokenId, uint256 clzdAmount)",

    // CLZD Staking
    "function stakeCLZD(uint256 tokenId, uint256 amount)",
    "function unstakeCLZD(uint256 tokenId, uint256 amount)",
    "function stakedClzd(uint256 tokenId) view returns (uint256)",
    "function stakeStartTime(uint256 tokenId) view returns (uint256)",

    // Bonus View Functions
    "function getStakingGoldBonus(uint256 tokenId) view returns (uint256)",
    "function getStakingXpBonus(uint256 tokenId) view returns (uint256)",
    "function getHoldingDiscount(address holder, bool isClzdPurchase) view returns (uint256)",
    "function getStakingInfo(uint256 tokenId) view returns (uint256 staked, uint256 startTime, uint256 goldBonus, uint256 xpBonus)",
    "function getStakingTiers() view returns (uint256[] thresholds, uint256[] goldBonuses, uint256[] xpBonuses)",
    "function getDiscountTiers() view returns (uint256[] thresholds, uint256[] bnbDiscounts, uint256[] clzdDiscounts)",

    // CLZD Config View Functions
    "function clzdToken() view returns (address)",
    "function clzdTreasury() view returns (address)",

    // V4.1: Rate with numerator/denominator for precise pricing
    "function clzdRateNumerator() view returns (uint256)",
    "function clzdRateDenominator() view returns (uint256)",
    "function getClzdRate() view returns (uint256 numerator, uint256 denominator)",
    "function calculateGoldFromCLZD(uint256 clzdAmount) view returns (uint256)",

    // CLZD Admin Functions
    "function setClzdToken(address _clzdToken)",
    "function setClzdTreasury(address _treasury)",
    "function setClzdRate(uint256 numerator, uint256 denominator)",
    "function setStakingTiers(uint256[] thresholds, uint256[] goldPercents, uint256[] xpPercents)",
    "function setDiscountTiers(uint256[] thresholds, uint256[] bnbPercents, uint256[] clzdPercents)",

    // V4.1 Events
    "event GoldPurchasedWithCLZD(uint256 indexed tokenId, address indexed buyer, uint256 clzdAmount, uint256 goldAmount, uint256 discountPercent, uint256 stakingBonusPercent)",
    "event CLZDStaked(uint256 indexed tokenId, address indexed staker, uint256 amount, uint256 totalStaked)",
    "event CLZDUnstaked(uint256 indexed tokenId, address indexed staker, uint256 amount, uint256 totalStaked)",
    "event ClzdRateUpdated(uint256 numerator, uint256 denominator)",
    "event StakingTiersUpdated(uint256 tierCount)",
    "event DiscountTiersUpdated(uint256 tierCount)"
] as const;

/**
 * Contract addresses loaded from environment variables
 * Configure in .env: VITE_GOLD_V4_ADDRESS
 * V4.1: Fixed rate formula with numerator/denominator for precise CLZD pricing
 */
// Mainnet only - BSC Chain ID 56
export const GOLD_CONTRACT_ADDRESS = {
    mainnet: import.meta.env.VITE_GOLD_V4_ADDRESS || "0x70C90e46C97086bE5c788618cE7Ad67f22EA6a3E"
} as const;
