// Quest Reward Contract ABI
// Generated from QuestRewardContract.sol

export const QUEST_REWARD_ABI = [
  // ========================================================================
  // QUEST COMPLETION
  // ========================================================================
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "bytes32", "name": "questId", "type": "bytes32" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "internalType": "bytes", "name": "signature", "type": "bytes" }
    ],
    "name": "recordQuestCompletion",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "bytes32", "name": "questId", "type": "bytes32" }
    ],
    "name": "hasCompletedQuest",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },

  // ========================================================================
  // NFT REWARDS
  // ========================================================================
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "bytes32", "name": "questId", "type": "bytes32" },
      { "internalType": "uint8", "name": "rarity", "type": "uint8" },
      { "internalType": "string", "name": "metadataURI", "type": "string" }
    ],
    "name": "mintQuestReward",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "bytes32", "name": "questId", "type": "bytes32" },
      { "internalType": "uint8", "name": "rarity", "type": "uint8" },
      { "internalType": "string", "name": "metadataURI", "type": "string" }
    ],
    "name": "mintQuestRewardForCompletion",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // ========================================================================
  // ACHIEVEMENT TOKENS
  // ========================================================================
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "achievementId", "type": "uint256" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "mintAchievementToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // ========================================================================
  // REWARD CLAIMING
  // ========================================================================
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "addReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "claimQuestRewards",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "getClaimableRewards",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },

  // ========================================================================
  // PLAYER STATISTICS
  // ========================================================================
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "getPlayerQuestStats",
    "outputs": [
      { "internalType": "uint256", "name": "totalCompleted", "type": "uint256" },
      { "internalType": "uint256", "name": "totalRewardsEarned", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // ========================================================================
  // ADMIN FUNCTIONS
  // ========================================================================
  {
    "inputs": [],
    "name": "fundRewardPool",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "manager", "type": "address" },
      { "internalType": "bool", "name": "authorized", "type": "bool" }
    ],
    "name": "setQuestManager",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "withdrawRewardPool",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // ========================================================================
  // EVENTS
  // ========================================================================
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": true, "internalType": "bytes32", "name": "questId", "type": "bytes32" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "indexed": false, "internalType": "bool", "name": "nftMinted", "type": "bool" }
    ],
    "name": "QuestCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "rewardTokenId", "type": "uint256" },
      { "indexed": false, "internalType": "uint8", "name": "rarity", "type": "uint8" },
      { "indexed": false, "internalType": "string", "name": "metadataURI", "type": "string" }
    ],
    "name": "QuestRewardMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "achievementId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "AchievementUnlocked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "recipient", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "RewardsClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "manager", "type": "address" },
      { "indexed": false, "internalType": "bool", "name": "authorized", "type": "bool" }
    ],
    "name": "QuestManagerUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "funder", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "RewardPoolFunded",
    "type": "event"
  },

  // ========================================================================
  // VIEW STATE VARIABLES
  // ========================================================================
  {
    "inputs": [],
    "name": "questRewardNFT",
    "outputs": [{ "internalType": "contract QuestRewardNFT", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "achievementTokens",
    "outputs": [{ "internalType": "contract AchievementTokens", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rewardPool",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "questManagers",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "accumulatedRewards",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },

  // ========================================================================
  // RECEIVE FUNCTION
  // ========================================================================
  {
    "stateMutability": "payable",
    "type": "receive"
  }
] as const;

export default QUEST_REWARD_ABI;
