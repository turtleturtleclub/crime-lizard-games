/**
 * @title CrimeLizardDice Contract ABI
 * @notice Fair dice game contract for Crime Lizard ecosystem
 * @dev Uses instant on-chain randomness with tournament support
 */

export const DICE_V5_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_characterNFT",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_goldContract",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InsufficientGold",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidBetAmount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidCharacter",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidMultiplier",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NoActiveCharacter",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotCharacterOwner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotOwner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
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
        "name": "characterId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "achievementName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "Achievement",
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
        "name": "multiplier",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "BigWin",
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
        "name": "characterId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "CharacterSelected",
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
        "name": "characterId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rollsToday",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "wageredToday",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "wonToday",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "dayNumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "DailyStatsSnapshot",
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
        "name": "characterId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "goldAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "GoldBetPlaced",
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
        "name": "characterId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "goldAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "GoldWon",
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
        "name": "characterId",
        "type": "uint256"
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
    "name": "JackpotWon",
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
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "NewPlayerJoined",
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
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalRolls",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalWagered",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalWon",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "PlayerStatsUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newRTP",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalRolls",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalAmountSpent",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalWon",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "RTPUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint64",
        "name": "sequenceNumber",
        "type": "uint64"
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
        "name": "characterId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "betAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "RollRequested",
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
        "internalType": "uint64",
        "name": "sequenceNumber",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "characterId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "dice1",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "dice2",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "total",
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
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "RollResult",
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
        "name": "characterId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "goldAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rollCount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "TournamentContribution",
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
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "characterId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rollsThisWeek",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "wageredThisWeek",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "wonThisWeek",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "biggestWinThisWeek",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "weekNumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "WeeklyStatsSnapshot",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "DAY_DURATION",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "JACKPOT_CHANCE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "WEEK_DURATION",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "achievementsUnlocked",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "activeCharacter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "characterId",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "allPlayers",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "characterNFT",
    "outputs": [
      {
        "internalType": "contract IERC721",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "dailyStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "rolls",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "wagered",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "won",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastUpdateDay",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "diceNames",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getActiveCharacter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "characterId",
        "type": "uint256"
      }
    ],
    "name": "getCharacterGoldBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentRTP",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getDailyStats",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "rolls",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "wagered",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "won",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lastUpdateDay",
            "type": "uint256"
          }
        ],
        "internalType": "struct CrimeLizardDiceV5.DailyStats",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "name": "getDiceName",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "name": "getPayoutForTotal",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getPlayerStats",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "totalRolls",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalWagered",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalWon",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "biggestWin",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "jackpotsWon",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lastPlayTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "winStreak",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxWinStreak",
            "type": "uint256"
          },
          {
            "internalType": "uint256[11]",
            "name": "diceOutcomes",
            "type": "uint256[11]"
          }
        ],
        "internalType": "struct CrimeLizardDiceV5.PlayerStats",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "count",
        "type": "uint256"
      }
    ],
    "name": "getTopPlayers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "topPlayers",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "totalWon",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getWeeklyStats",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "rolls",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "wagered",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "won",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "biggestWin",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lastUpdateWeek",
            "type": "uint256"
          }
        ],
        "internalType": "struct CrimeLizardDiceV5.WeeklyStats",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "goldContract",
    "outputs": [
      {
        "internalType": "contract ICrimeLizardGold",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "achievementName",
        "type": "string"
      }
    ],
    "name": "hasAchievement",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "hasPlayedBefore",
    "outputs": [
      {
        "internalType": "bool",
        "name": "played",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "houseFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "jackpot",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "jackpotFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxBetSize",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minBetSize",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
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
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "payoutMultipliers",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "playerStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalRolls",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalWagered",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalWon",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "biggestWin",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "jackpotsWon",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastPlayTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "winStreak",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxWinStreak",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "betAmount",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "userRandomSeed",
        "type": "bytes32"
      }
    ],
    "name": "roll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "characterId",
        "type": "uint256"
      }
    ],
    "name": "selectCharacter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newHouseFee",
        "type": "uint256"
      }
    ],
    "name": "setHouseFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newJackpot",
        "type": "uint256"
      }
    ],
    "name": "setJackpot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newJackpotFee",
        "type": "uint256"
      }
    ],
    "name": "setJackpotFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newMaxBet",
        "type": "uint256"
      }
    ],
    "name": "setMaxBet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newMinBet",
        "type": "uint256"
      }
    ],
    "name": "setMinBet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      },
      {
        "internalType": "uint16",
        "name": "multiplier",
        "type": "uint16"
      }
    ],
    "name": "setPayoutMultiplier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "stats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalRolls",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalAmountSpent",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalAmountWon",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalJackpotWins",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalJackpotAmountWon",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalPlayers",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "biggestSingleWin",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "biggestWinner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "currentRTP",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
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
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "weeklyStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "rolls",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "wagered",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "won",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "biggestWin",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastUpdateWeek",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
] as const;

/**
 * Dice V5 Contract Address - Mainnet only (BSC Chain ID 56)
 */
export const DICE_CONTRACT_ADDRESS = {
  mainnet: import.meta.env.VITE_DICE_V5_ADDRESS || "0x71eddE644B160CB95aB89e53d8F758c1E548a505"
} as const;
