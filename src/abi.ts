export const SLOTS_ABI = [
    // Constructor
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "initialOwner",
                "type": "address"
            },
            {
                "internalType": "uint64",
                "name": "_subscriptionId",
                "type": "uint64"
            }
        ],
        "stateMutability": "payable",
        "type": "constructor"
    },

    // Events (kept core ones + new BulkSpinStarted)
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "player",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "lizardCount",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "requestId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "BonusGameWon",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "player",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "spinsAwarded",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "totalFreeSpins",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "requestId",
                "type": "uint256"
            }
        ],
        "name": "FreeSpinsAwarded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "FundsWithdrawn",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "player",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "betSize",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "requestId",
                "type": "uint256"
            }
        ],
        "name": "JackpotWon",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "Paused",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "Unpaused",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "requestId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "player",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "bet",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "isFreeSpin",
                "type": "bool"
            }
        ],
        "name": "SpinRequested",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "player",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "requestId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "payout",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "jackpotWon",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint8[15]",
                "name": "reels",
                "type": "uint8[15]"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "isBonusGame",
                "type": "bool"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "SpinResult",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "player",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "numSpins",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "betPerSpin",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "totalAmount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "BulkSpinStarted",
        "type": "event"
    },

    // Functions (optimized: removed updateVrfFee, kept views/constants)
    {
        "inputs": [],
        "name": "CALLBACK_GAS_LIMIT",
        "outputs": [{ "internalType": "uint32", "name": "", "type": "uint32" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "KEY_HASH",
        "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
        "stateMutability": "view",
        "type": "function"
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
        "name": "REQUEST_CONFIRMATIONS",
        "outputs": [{ "internalType": "uint16", "name": "", "type": "uint16" }],
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
        "inputs": [],
        "name": "VRF_COORDINATOR",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "numSpins", "type": "uint256" }],
        "name": "autoPlayFreeSpins",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "numSpins", "type": "uint256" }],
        "name": "bulkSpin",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "currentSessionId",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "emergencyPause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "emergencyWithdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "forceStartSession",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "freeSpins",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "requestId", "type": "uint256" },
            { "internalType": "uint256[]", "name": "randomWords", "type": "uint256[]" }
        ],
        "name": "fulfillRandomWords",
        "outputs": [],
        "stateMutability": "nonpayable",
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
        "inputs": [
            { "internalType": "address", "name": "user", "type": "address" },
            { "internalType": "uint256", "name": "index", "type": "uint256" }
        ],
        "name": "getPendingRequest",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "getPendingRequestsCount",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
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
                    { "internalType": "uint256", "name": "maxWinStreak", "type": "uint256" },
                    { "internalType": "uint256", "name": "totalSessions", "type": "uint256" }
                ],
                "internalType": "struct CrimeLizardSlots.PlayerStats",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getSessionPlayers",
        "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "sessionId", "type": "uint256" }],
        "name": "getSessionStats",
        "outputs": [
            { "internalType": "uint256", "name": "totalWagered", "type": "uint256" },
            { "internalType": "uint256", "name": "totalWon", "type": "uint256" },
            { "internalType": "uint256", "name": "spinsCount", "type": "uint256" },
            { "internalType": "uint256", "name": "playerCount", "type": "uint256" },
            { "internalType": "bool", "name": "isActive", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getSessionStatus",
        "outputs": [
            { "internalType": "bool", "name": "isPending", "type": "bool" },
            { "internalType": "bool", "name": "isActive", "type": "bool" },
            { "internalType": "uint256", "name": "currentPlayers", "type": "uint256" },
            { "internalType": "uint256", "name": "minPlayers", "type": "uint256" },
            { "internalType": "uint256", "name": "maxPlayers", "type": "uint256" },
            { "internalType": "uint256", "name": "timeUntilForceStart", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "count", "type": "uint256" }],
        "name": "getTopPlayers",
        "outputs": [
            { "internalType": "address[]", "name": "topPlayers", "type": "address[]" },
            { "internalType": "uint256[]", "name": "totalWon", "type": "uint256[]" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getVrfFee",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "hasPlayedBefore",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
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
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "lastBet",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
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
        "name": "maxPlayersPerSession",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "maxWaitTime",
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
        "name": "minPlayersToStart",
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
        "inputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" },
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "name": "payouts",
        "outputs": [{ "internalType": "uint16", "name": "", "type": "uint16" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "", "type": "address" },
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "name": "pendingRequests",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pendingOwner",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "playerStats",
        "outputs": [
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
            { "internalType": "uint256", "name": "maxWinStreak", "type": "uint256" },
            { "internalType": "uint256", "name": "totalSessions", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "requests",
        "outputs": [
            { "internalType": "address", "name": "player", "type": "address" },
            { "internalType": "uint256", "name": "bet", "type": "uint256" },
            { "internalType": "uint256", "name": "freeSpinsLeft", "type": "uint256" },
            { "internalType": "bool", "name": "isFreeSpin", "type": "bool" },
            { "internalType": "bool", "name": "processed", "type": "bool" },
            { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
            { "internalType": "uint256", "name": "chance", "type": "uint256" },
            { "internalType": "uint256", "name": "vrfFeePaid", "type": "uint256" },
            { "internalType": "uint256", "name": "roundId", "type": "uint256" },
            { "internalType": "bool", "name": "isBonus", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "sessions",
        "outputs": [
            { "internalType": "uint256", "name": "sessionId", "type": "uint256" },
            { "internalType": "uint256", "name": "startTime", "type": "uint256" },
            { "internalType": "uint256", "name": "playerCount", "type": "uint256" },
            { "internalType": "bool", "name": "isActive", "type": "bool" },
            { "internalType": "uint256", "name": "totalWagered", "type": "uint256" },
            { "internalType": "uint256", "name": "totalWon", "type": "uint256" },
            { "internalType": "uint256", "name": "spinsInSession", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "newHouseFee", "type": "uint256" }],
        "name": "setHouseFee",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "newJackpotFee", "type": "uint256" }],
        "name": "setJackpotFee",
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
        "inputs": [{ "internalType": "uint256", "name": "newMaxBet", "type": "uint256" }],
        "name": "setMaxBet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "newMaxPlayers", "type": "uint256" }],
        "name": "setMaxPlayersPerSession",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "newMaxWaitTime", "type": "uint256" }],
        "name": "setMaxWaitTime",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "newMinBet", "type": "uint256" }],
        "name": "setMinBet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "newMinPlayers", "type": "uint256" }],
        "name": "setMinPlayersToStart",
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
        "inputs": [{ "internalType": "uint256", "name": "newTimeout", "type": "uint256" }],
        "name": "setSessionTimeout",
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
        "inputs": [{ "internalType": "bool", "name": "_useMock", "type": "bool" }],
        "name": "setUseMockRandomness",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "sessionTimeout",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "spin",
        "outputs": [],
        "stateMutability": "payable",
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
            { "internalType": "uint256", "name": "dailySpins", "type": "uint256" },
            { "internalType": "uint256", "name": "dailyAmountSpent", "type": "uint256" },
            { "internalType": "uint256", "name": "dailyAmountWon", "type": "uint256" },
            { "internalType": "uint256", "name": "lastDayReset", "type": "uint256" },
            { "internalType": "uint256", "name": "biggestSingleWin", "type": "uint256" },
            { "internalType": "address", "name": "biggestWinner", "type": "address" },
            { "internalType": "uint256", "name": "averageBet", "type": "uint256" },
            { "internalType": "uint256", "name": "currentRTP", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "subscriptionId",
        "outputs": [{ "internalType": "uint64", "name": "", "type": "uint64" }],
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
        "inputs": [],
        "name": "useMockRandomness",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "vrfFee",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "withdrawVrfFees",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    }
];

// Backward compatibility
export const ABI = SLOTS_ABI;