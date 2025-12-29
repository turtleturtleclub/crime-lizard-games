/**
 * @title CrimeLizardSlotsV12 Contract ABI
 * @notice Provably Fair Slots game with commit-reveal randomness
 * @dev Uses seed commitment for verifiable fairness
 */

export const SLOTS_V12_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_characterNFT", "type": "address" },
      { "internalType": "address", "name": "_goldContract", "type": "address" },
      { "internalType": "address", "name": "_seedServer", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  { "inputs": [], "name": "EnforcedPause", "type": "error" },
  { "inputs": [], "name": "ExpectedPause", "type": "error" },
  { "inputs": [], "name": "InsufficientGold", "type": "error" },
  { "inputs": [], "name": "InvalidBetAmount", "type": "error" },
  { "inputs": [], "name": "InvalidSeedHash", "type": "error" },
  { "inputs": [], "name": "InvalidSeedId", "type": "error" },
  { "inputs": [], "name": "InvalidServer", "type": "error" },
  { "inputs": [], "name": "NoActiveCharacter", "type": "error" },
  { "inputs": [], "name": "NoSeedsAvailable", "type": "error" },
  { "inputs": [], "name": "NotCharacterOwner", "type": "error" },
  { "inputs": [], "name": "NotOwner", "type": "error" },
  { "inputs": [], "name": "NotSeedServer", "type": "error" },
  { "inputs": [], "name": "ReentrancyGuardReentrantCall", "type": "error" },
  { "inputs": [], "name": "RevealTimeoutNotReached", "type": "error" },
  { "inputs": [], "name": "SeedAlreadyRevealed", "type": "error" },
  { "inputs": [], "name": "SeedAlreadyUsed", "type": "error" },
  { "inputs": [], "name": "SeedNotUsed", "type": "error" },
  { "inputs": [], "name": "SeedNotYours", "type": "error" },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "characterId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "lizardCount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "BonusGameWon",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "characterId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "CharacterSelected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "spinsAwarded", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "totalFreeSpins", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "FreeSpinsAwarded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "characterId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "goldAmount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "GoldBetPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "oldContract", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newContract", "type": "address" }
    ],
    "name": "GoldContractUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "characterId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "goldAmount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "GoldWon",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "characterId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "betSize", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "JackpotWon",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "seedId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "RefundClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "seedId", "type": "uint256" },
      { "indexed": false, "internalType": "bytes32", "name": "serverSeed", "type": "bytes32" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "SeedRevealed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "oldServer", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newServer", "type": "address" }
    ],
    "name": "SeedServerUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "startSeedId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "count", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "SeedsCommitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "characterId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "seedId", "type": "uint256" },
      { "indexed": false, "internalType": "bytes32", "name": "clientSeed", "type": "bytes32" },
      { "indexed": false, "internalType": "uint256", "name": "betAmount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "SpinRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "characterId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "seedId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "payout", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "jackpotWon", "type": "uint256" },
      { "indexed": false, "internalType": "uint8[15]", "name": "reels", "type": "uint8[15]" },
      { "indexed": false, "internalType": "uint8[]", "name": "winningPaylines", "type": "uint8[]" },
      { "indexed": false, "internalType": "bool", "name": "isBonusGame", "type": "bool" },
      { "indexed": false, "internalType": "uint256", "name": "betAmount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "SpinResult",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "REELS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "REVEAL_TIMEOUT",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ROWS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TOTAL_WEIGHT",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
    "name": "activeCharacter",
    "outputs": [{ "internalType": "uint256", "name": "characterId", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "allPlayers",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "characterNFT",
    "outputs": [{ "internalType": "contract IERC721", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "seedId", "type": "uint256" }],
    "name": "claimRefund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32[]", "name": "hashes", "type": "bytes32[]" }],
    "name": "commitSeeds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
    "name": "freeSpins",
    "outputs": [{ "internalType": "uint256", "name": "spins", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
    "name": "getActiveCharacter",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAvailableSeedCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "characterId", "type": "uint256" }],
    "name": "getCharacterGoldBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentRTP",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "bet", "type": "uint256" }],
    "name": "getJackpotChanceForBet",
    "outputs": [
      { "internalType": "uint256", "name": "chance", "type": "uint256" },
      { "internalType": "uint256", "name": "bonusMultiplier", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
    "name": "getPlayerStats",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "totalSpins", "type": "uint256" },
          { "internalType": "uint256", "name": "totalWagered", "type": "uint256" },
          { "internalType": "uint256", "name": "totalWon", "type": "uint256" },
          { "internalType": "uint256", "name": "biggestWin", "type": "uint256" },
          { "internalType": "uint256", "name": "jackpotsWon", "type": "uint256" },
          { "internalType": "uint256", "name": "freeSpinsEarned", "type": "uint256" },
          { "internalType": "uint256", "name": "freeSpinsUsed", "type": "uint256" },
          { "internalType": "uint256", "name": "bonusGamesPlayed", "type": "uint256" },
          { "internalType": "uint256", "name": "lastPlayTime", "type": "uint256" },
          { "internalType": "uint256", "name": "winStreak", "type": "uint256" },
          { "internalType": "uint256", "name": "maxWinStreak", "type": "uint256" }
        ],
        "internalType": "struct CrimeLizardSlotsV12.PlayerStats",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "seedId", "type": "uint256" }],
    "name": "getSpinDetails",
    "outputs": [
      { "internalType": "bytes32", "name": "commitHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "commitBlock", "type": "uint256" },
      { "internalType": "bool", "name": "used", "type": "bool" },
      { "internalType": "bool", "name": "revealed", "type": "bool" },
      { "internalType": "address", "name": "player", "type": "address" },
      { "internalType": "bytes32", "name": "clientSeed", "type": "bytes32" },
      { "internalType": "uint256", "name": "betAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "characterId", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "goldContract",
    "outputs": [{ "internalType": "contract ICrimeLizardGold", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
    "name": "hasPlayedBefore",
    "outputs": [{ "internalType": "bool", "name": "played", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "houseFee",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "jackpot",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "jackpotFee",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "jackpotTiers",
    "outputs": [
      { "internalType": "uint256", "name": "minBet", "type": "uint256" },
      { "internalType": "uint256", "name": "baseChance", "type": "uint256" },
      { "internalType": "uint256", "name": "bonusMultiplier", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
    "name": "lastBet",
    "outputs": [{ "internalType": "uint256", "name": "bet", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxBetSize",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minBetSize",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextSeedId",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextUsableSeedId",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "refundPool",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "seedId", "type": "uint256" },
      { "internalType": "bytes32", "name": "serverSeed", "type": "bytes32" }
    ],
    "name": "revealSeed",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "revealedSeeds",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "seedServer",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "seeds",
    "outputs": [
      { "internalType": "bytes32", "name": "hash", "type": "bytes32" },
      { "internalType": "uint256", "name": "commitBlock", "type": "uint256" },
      { "internalType": "bool", "name": "used", "type": "bool" },
      { "internalType": "bool", "name": "revealed", "type": "bool" },
      { "internalType": "address", "name": "player", "type": "address" },
      { "internalType": "bytes32", "name": "clientSeed", "type": "bytes32" },
      { "internalType": "uint256", "name": "betAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "characterId", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "characterId", "type": "uint256" }],
    "name": "selectCharacter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "newMin", "type": "uint256" },
      { "internalType": "uint256", "name": "newMax", "type": "uint256" }
    ],
    "name": "setBetLimits",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "newGoldContract", "type": "address" }],
    "name": "setGoldContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "newFee", "type": "uint256" }],
    "name": "setHouseFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "newJackpot", "type": "uint256" }],
    "name": "setJackpot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint8", "name": "tierIndex", "type": "uint8" },
      { "internalType": "uint256", "name": "minBet", "type": "uint256" },
      { "internalType": "uint256", "name": "baseChance", "type": "uint256" },
      { "internalType": "uint256", "name": "bonusMultiplier", "type": "uint256" }
    ],
    "name": "setJackpotTier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint16[3][10]", "name": "newPayouts", "type": "uint16[3][10]" }],
    "name": "setPayouts",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "newServer", "type": "address" }],
    "name": "setSeedServer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint8[10]", "name": "newWeights", "type": "uint8[10]" }],
    "name": "setSymbolWeights",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "betAmount", "type": "uint256" },
      { "internalType": "bytes32", "name": "clientSeed", "type": "bytes32" }
    ],
    "name": "spin",
    "outputs": [{ "internalType": "uint256", "name": "seedId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "stats",
    "outputs": [
      { "internalType": "uint256", "name": "totalSpins", "type": "uint256" },
      { "internalType": "uint256", "name": "totalAmountSpent", "type": "uint256" },
      { "internalType": "uint256", "name": "totalAmountWon", "type": "uint256" },
      { "internalType": "uint256", "name": "totalFreeSpinsAwarded", "type": "uint256" },
      { "internalType": "uint256", "name": "totalFreeSpinsUsed", "type": "uint256" },
      { "internalType": "uint256", "name": "totalJackpotWins", "type": "uint256" },
      { "internalType": "uint256", "name": "totalJackpotAmountWon", "type": "uint256" },
      { "internalType": "uint256", "name": "totalBonusGamesPlayed", "type": "uint256" },
      { "internalType": "uint256", "name": "totalBonusAmountWon", "type": "uint256" },
      { "internalType": "uint256", "name": "totalPlayers", "type": "uint256" },
      { "internalType": "uint256", "name": "biggestSingleWin", "type": "uint256" },
      { "internalType": "address", "name": "biggestWinner", "type": "address" },
      { "internalType": "uint256", "name": "currentRTP", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "symbolWeights",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "seedId", "type": "uint256" }],
    "name": "verifyOutcome",
    "outputs": [
      { "internalType": "bool", "name": "isValid", "type": "bool" },
      { "internalType": "bytes32", "name": "serverSeed", "type": "bytes32" },
      { "internalType": "bytes32", "name": "clientSeed", "type": "bytes32" },
      { "internalType": "bytes32", "name": "commitHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "randomValue", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fundRefundPool",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

export const SLOTS_V12_CONTRACT_ADDRESS = {
    mainnet: import.meta.env.VITE_SLOTS_V12_ADDRESS || "0x2B7e31CAB044AfA8aa3B29EE6447fEC8cd17a4Fa"
} as const;
