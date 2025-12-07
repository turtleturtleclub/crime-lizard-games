// Quest Database - Level 1-10 Quest Progression
// Includes story quests, heists, and the legendary Bank Heist

// ============================================================================
// LEVEL 1-2: TUTORIAL QUESTS
// ============================================================================

export const QUEST_FIRST_SCORE = {
    id: 'quest_first_score',
    title: 'The First Score',
    description: 'Defeat your first enemies to prove yourself as a Crime Lizard.',
    lore: 'Gecko Graves watches from the shadows. "Every legend starts with a first kill," he whispers. "Show me you have what it takes."',

    type: 'story',
    difficulty: 'easy',
    giver: 'gecko_graves',
    location: 'town',

    requirements: {
        minLevel: 1
    },

    objectives: [
        {
            id: 'kill_forest_enemies',
            description: 'Defeat 3 enemies in the Dark Forest',
            type: 'kill',
            target: 'any_forest_enemy',
            amount: 3
        }
    ],

    rewards: {
        gold: 50,
        experience: 50,
        reputation: 5,
        title: 'Initiate',
        nftReward: {
            type: 'badge',
            name: 'First Blood Badge',
            description: 'Awarded for defeating your first enemies',
            rarity: 'common'
        }
    },

    aiIntegration: {
        dynamicDialogue: true,
        adaptiveDifficulty: false,
        generateObjectives: false,
        personalizedRewards: false
    },

    tags: ['tutorial', 'combat', 'required']
};

export const QUEST_DRESS_FOR_SUCCESS = {
    id: 'quest_dress_for_success',
    title: 'Dress for Success',
    description: 'Buy your first weapon and armor to prepare for tougher battles.',
    lore: 'Gribnak grins, "A lizard with no gear is a dead lizard. Get yourself equipped, then we talk business."',

    type: 'story',
    difficulty: 'easy',
    giver: 'gribnak',
    location: 'town',

    requirements: {
        minLevel: 1,
        prerequisites: ['quest_first_score']
    },

    objectives: [
        {
            id: 'buy_weapon',
            description: 'Purchase any weapon from the Weapons Shop',
            type: 'collect',
            target: 'any_weapon',
            amount: 1
        },
        {
            id: 'buy_armor',
            description: 'Purchase any armor from the Armor Shop',
            type: 'collect',
            target: 'any_armor',
            amount: 1
        }
    ],

    rewards: {
        gold: 25,
        experience: 30,
        items: ['shop_discount_token'],
        reputation: 5
    },

    aiIntegration: {
        dynamicDialogue: true,
        adaptiveDifficulty: false,
        generateObjectives: false,
        personalizedRewards: true
    },

    tags: ['tutorial', 'shopping', 'required']
};

// ============================================================================
// LEVEL 3-4: CHOICE & CONSEQUENCE
// ============================================================================

export const QUEST_ROBIN_HOOD_DILEMMA = {
    id: 'quest_robin_hood_dilemma',
    title: 'The Robin Hood Dilemma',
    description: 'Choose your path: help the poor or aid the law.',
    lore: 'The city watches. Will you be a hero of the people, or an enforcer of order? Your choice will echo through your journey.',

    type: 'side',
    difficulty: 'medium',
    giver: 'random_spawn',
    location: 'poor_district',

    requirements: {
        minLevel: 3
    },

    objectives: [
        {
            id: 'path_choice',
            description: 'Choose your path',
            type: 'talk',
            target: 'beggar_king_or_guard',
            amount: 1
        },
        // These are dynamically added based on choice
        {
            id: 'path_a_donate',
            description: 'Donate 200 gold to the poor',
            type: 'collect',
            target: 'gold_to_poor',
            amount: 200,
            hidden: true
        },
        {
            id: 'path_b_bounties',
            description: 'Defeat 3 criminal players in PvP',
            type: 'kill',
            target: 'rogue_or_crime_lord',
            amount: 3,
            hidden: true
        }
    ],

    rewards: {
        gold: 0,
        experience: 100,
        reputation: 50,
        factionReputation: [
            // Dynamically assigned based on path choice
        ]
    },

    aiIntegration: {
        dynamicDialogue: true,
        adaptiveDifficulty: false,
        generateObjectives: false,
        personalizedRewards: false
    },

    branches: [
        {
            choiceId: 'path_choice',
            nextQuest: 'quest_path_a_hero_of_poor'
        },
        {
            choiceId: 'path_choice',
            nextQuest: 'quest_path_b_law_enforcer'
        }
    ],

    tags: ['branching', 'reputation', 'moral_choice']
};

export const QUEST_LOAN_SHARK_COLLECTION = {
    id: 'quest_loan_shark_collection',
    title: "The Liquidation Protocol",
    description: 'Track down a delinquent borrower with an underwater DeFi position. They may resist liquidation.',
    lore: '"Their collateral ratio dropped below 110%," Vex the Liquidator hisses. "The protocol demands liquidation. Find them in the Rekt District and recover what\'s owed... or seize their assets by force if needed."',

    type: 'daily',
    difficulty: 'medium',
    giver: 'vex_liquidator',
    location: 'bank',

    requirements: {
        minLevel: 3
    },

    objectives: [
        {
            id: 'find_debtor',
            description: 'Locate the underwater borrower in the Rekt District',
            type: 'explore',
            target: 'debtor_hideout',
            amount: 1
        },
        {
            id: 'collect_debt',
            description: 'Liquidate their position (combat may be required)',
            type: 'collect',
            target: 'debt_gold',
            amount: 500
        }
    ],

    rewards: {
        gold: 50,  // 10% liquidation bonus
        experience: 40,
        reputation: -5  // DeFi enforcement isn't popular with the rekt
    },

    failureConsequences: {
        goldLoss: 50,
        reputationLoss: 10
    },

    repeatable: true,
    repeatCooldown: 24,  // 24 hours

    aiIntegration: {
        dynamicDialogue: true,
        adaptiveDifficulty: true,
        generateObjectives: false,
        personalizedRewards: false
    },

    tags: ['daily', 'combat', 'risk', 'defi']
};

// ============================================================================
// LEVEL 5-6: MULTIPLAYER INTRODUCTION
// ============================================================================

export const QUEST_JEWELRY_STORE_JOB = {
    id: 'quest_jewelry_store_job',
    title: 'The Jewelry Store Job',
    description: 'Your first heist! Rob a jewelry store with a partner.',
    lore: 'The Planner lays out blueprints. "Two people, three phases, five minutes. Can you handle it?"',

    type: 'heist',
    difficulty: 'medium',
    giver: 'the_planner',
    location: 'town',

    requirements: {
        minLevel: 5,
        gold: 100,  // Entry fee
        team: {
            minPlayers: 2,
            maxPlayers: 2,
            requiredRoles: ['damage', 'utility']  // Need lockpicking or combat
        }
    },

    objectives: [
        {
            id: 'stealth_entry',
            description: 'Sneak past the guards',
            type: 'stealth',
            target: 'front_door',
            amount: 1,
            statCheck: {
                stat: 'charm',
                value: 10,
                bonus: [
                    { archetype: 1, value: 5 },  // rogue
                    { archetype: 8, value: 3 }   // crime_lord
                ]
            }
        },
        {
            id: 'break_vault',
            description: 'Break into the vault',
            type: 'skill_check',
            target: 'vault_door',
            amount: 1,
            statCheck: {
                stat: 'strength',
                value: 15
            }
        },
        {
            id: 'defeat_guards',
            description: 'Defeat the arriving guards',
            type: 'kill',
            target: 'jewelry_store_guard',
            amount: 2
        }
    ],

    rewards: {
        gold: 400,  // Split between team
        experience: 150,
        reputation: 15,
        title: 'Apprentice Thief',
        unlockQuest: ['quest_bank_heist']
    },

    failureConsequences: {
        goldLoss: 100,  // Entry fee
        reputationLoss: 25,
        randomItemLoss: 1  // 10% chance
    },

    heistData: {
        phases: [
            {
                id: 'phase_stealth',
                name: 'Infiltration',
                description: 'Sneak past the guards undetected',
                type: 'infiltration',
                skillChecks: [
                    {
                        player: 'any',
                        role: 'damage',
                        stat: 'charm',
                        difficulty: 10,
                        failureConsequence: 'alarm'
                    }
                ],
                aiNarration: true
            },
            {
                id: 'phase_vault',
                name: 'The Vault',
                description: 'Break into the vault',
                type: 'objective',
                skillChecks: [
                    {
                        player: 'any',
                        stat: 'strength',
                        difficulty: 15,
                        failureConsequence: 'damage'
                    }
                ],
                aiNarration: true
            },
            {
                id: 'phase_escape',
                name: 'Escape',
                description: 'Fight off guards and escape',
                type: 'combat',
                combat: {
                    enemyCount: 2,
                    enemyLevel: 5,
                    enemyType: 'jewelry_store_guard',
                    defeatable: true
                },
                turnLimit: 10,
                aiNarration: true
            }
        ],
        choices: [
            {
                id: 'entry_choice',
                phase: 'phase_stealth',
                question: 'How do you want to enter?',
                description: 'Choose your approach',
                votingType: 'majority',
                options: [
                    {
                        id: 'front_door',
                        label: 'Front Door (Stealth)',
                        description: 'Requires charm check',
                        effects: {}
                    },
                    {
                        id: 'back_window',
                        label: 'Back Window (Risky)',
                        description: 'Skip stealth, but guards alerted earlier',
                        effects: {
                            skipPhase: 'phase_stealth',
                            addGuards: 1
                        }
                    }
                ]
            }
        ],
        loot: {
            minGold: 300,
            maxGold: 500,
            distribution: 'equal',
            tiers: [
                {
                    percentage: 50,
                    difficulty: 'easy',
                    bonusItems: []
                },
                {
                    percentage: 75,
                    difficulty: 'medium',
                    bonusItems: ['rare_gem']
                },
                {
                    percentage: 100,
                    difficulty: 'hard',
                    bonusItems: ['rare_gem', 'jewelry_store_key']
                }
            ]
        }
    },

    aiIntegration: {
        dynamicDialogue: true,
        adaptiveDifficulty: true,
        generateObjectives: false,
        personalizedRewards: false
    },

    tags: ['heist', 'multiplayer', 'combat', 'stealth']
};

export const QUEST_UNDERGROUND_ARENA = {
    id: 'quest_underground_arena',
    title: 'The Underground Arena',
    description: 'Practice your PvP skills in the underground fighting arena.',
    lore: 'Brutus the Brawler cracks his knuckles. "Win three fights, and you\'ll earn my respect. And a nice bonus."',

    type: 'side',
    difficulty: 'medium',
    giver: 'brutus',
    location: 'arena',

    requirements: {
        minLevel: 5
    },

    objectives: [
        {
            id: 'arena_wins',
            description: 'Win 3 arena fights (no gold loss)',
            type: 'kill',
            target: 'arena_opponent',
            amount: 3
        }
    ],

    rewards: {
        gold: 100,
        experience: 80,
        title: 'Gladiator',
        // Permanent passive bonus
        items: ['gladiator_mark']  // +5% PvP damage
    },

    repeatable: false,

    aiIntegration: {
        dynamicDialogue: true,
        adaptiveDifficulty: false,
        generateObjectives: false,
        personalizedRewards: false
    },

    tags: ['pvp', 'training', 'arena']
};

// ============================================================================
// LEVEL 7-8: TEAM SYNERGIES
// ============================================================================

export const QUEST_CORRUPTED_MAYOR = {
    id: 'quest_corrupted_mayor',
    title: 'The Rug Pull Hunter',
    description: 'Team up to track down Do Kwon and recover the stolen funds.',
    lore: 'A DeFi Detective whispers, "Do Kwon fled with billions in Luna. The community wants justice. Help us catch this rug puller."',

    type: 'story',
    difficulty: 'hard',
    giver: 'defi_detective',
    location: 'town',

    requirements: {
        minLevel: 7,
        gold: 200,  // Track his location
        team: {
            minPlayers: 4,  // Changed from 2 to 4
            maxPlayers: 4,
            requiredRoles: ['tank', 'damage']  // Need speed and damage to catch him
        }
    },

    objectives: [
        {
            id: 'defeat_mayor',
            description: 'Catch Do Kwon and recover the funds',
            type: 'kill',
            target: 'corrupted_mayor_boss',
            amount: 1
        }
    ],

    rewards: {
        gold: 500,
        experience: 200,
        reputation: 50,
        title: 'Freedom Fighter',
        unlockLocation: 'city_district',
        factionReputation: [
            { faction: 'poor', amount: 100 },
            { faction: 'noble', amount: -50 }
        ]
    },

    failureConsequences: {
        goldLoss: 200,
        reputationLoss: 50,
        debuff: {
            stat: 'defense',
            amount: 5,
            duration: 24
        }
    },

    repeatable: false,

    aiIntegration: {
        dynamicDialogue: true,
        adaptiveDifficulty: true,
        generateObjectives: false,
        personalizedRewards: false
    },

    tags: ['story', 'boss', 'multiplayer', 'required']
};

export const QUEST_SMUGGLERS_ROUTE = {
    id: 'quest_smugglers_route',
    title: "The Smuggler's Route",
    description: 'Deliver contraband across three dangerous zones without dying.',
    lore: 'Sly Fox hands you a package. "Get this to the docks. Don\'t open it. Don\'t get caught. Don\'t die."',

    type: 'daily',
    difficulty: 'medium',
    giver: 'sly_fox',
    location: 'town',

    requirements: {
        minLevel: 7
    },

    objectives: [
        {
            id: 'deliver_forest',
            description: 'Pass through the Dark Forest',
            type: 'explore',
            target: 'dark_forest',
            amount: 1
        },
        {
            id: 'deliver_city',
            description: 'Pass through the City District',
            type: 'explore',
            target: 'city_district',
            amount: 1
        },
        {
            id: 'deliver_docks',
            description: 'Deliver to the Docks',
            type: 'deliver',
            target: 'contraband_package',
            amount: 1
        }
    ],

    rewards: {
        gold: 150,
        experience: 100,
        items: ['random_rare_item'],
        reputation: 10
    },

    failureConsequences: {
        goldLoss: 100,
        reputationLoss: 25
    },

    repeatable: true,
    repeatCooldown: 24,

    aiIntegration: {
        dynamicDialogue: true,
        adaptiveDifficulty: true,
        generateObjectives: false,
        personalizedRewards: true
    },

    tags: ['daily', 'exploration', 'risk']
};

// ============================================================================
// LEVEL 9-10: ENDGAME PREP
// ============================================================================

export const QUEST_DRAGONS_HOARD = {
    id: 'quest_dragons_hoard',
    title: "The Dragon's Hoard",
    description: 'Steal from a sleeping dragon. High risk, high reward.',
    lore: 'A drunk dwarf whispers, "There\'s a dragon in the mountains... sleeping on a pile of gold. If you\'re brave... or stupid... you could steal from it."',

    type: 'side',
    difficulty: 'hard',
    giver: 'drunk_dwarf',
    location: 'inn',

    requirements: {
        minLevel: 9,
        gold: 500  // Insurance fee
    },

    objectives: [
        {
            id: 'stealth_mission',
            description: 'Sneak into the dragon\'s lair',
            type: 'stealth',
            target: 'dragon_lair',
            amount: 5,  // 5 stealth checks
            statCheck: {
                stat: 'charm',
                value: 20
            }
        },
        {
            id: 'steal_item',
            description: 'Steal 1 item from the hoard',
            type: 'collect',
            target: 'dragon_scale',
            amount: 1
        }
    ],

    rewards: {
        experience: 300,
        items: ['dragon_scale'],
        title: 'Dragon Thief',
        reputation: 75,
        nftReward: {
            type: 'achievement',
            name: 'Dragon Thief Badge',
            description: 'Stole from a sleeping dragon and lived to tell the tale',
            rarity: 'epic'
        }
    },

    failureConsequences: {
        goldLoss: 500,  // Lose insurance
        reputationLoss: 100,
        randomItemLoss: 1,  // 20% chance to lose best equipment
        debuff: {
            stat: 'defense',
            amount: 10,
            duration: 48
        }
    },

    repeatable: false,

    aiIntegration: {
        dynamicDialogue: true,
        adaptiveDifficulty: true,
        generateObjectives: false,
        personalizedRewards: false
    },

    tags: ['high_risk', 'stealth', 'dragon', 'legendary']
};

// ============================================================================
// LEVEL 10: THE LEGENDARY BANK HEIST
// ============================================================================

export const QUEST_BANK_HEIST = {
    id: 'quest_bank_heist',
    title: 'The BSC Central Bank Heist',
    description: 'The ultimate heist. Rob the BSC Central Bank with your crew.',
    lore: 'The Planner spreads blueprints across the table. "This is it. The big one. The BSC Central Bank holds millions. Are you ready to become legends?"',

    type: 'heist',
    difficulty: 'legendary',
    giver: 'the_planner',
    location: 'town',

    requirements: {
        minLevel: 10,
        gold: 500,  // Entry fee per player
        prerequisites: ['quest_jewelry_store_job', 'quest_corrupted_mayor'],
        team: {
            minPlayers: 3,
            maxPlayers: 4,
            requiredRoles: ['damage', 'tank', 'utility']
        }
    },

    objectives: [
        {
            id: 'phase_1_planning',
            description: 'Plan the heist with your team',
            type: 'talk',
            target: 'the_planner',
            amount: 1
        },
        {
            id: 'phase_2_infiltration',
            description: 'Infiltrate the bank',
            type: 'stealth',
            target: 'bank_entrance',
            amount: 1
        },
        {
            id: 'phase_3_vault',
            description: 'Crack the vault',
            type: 'skill_check',
            target: 'bank_vault',
            amount: 4  // 4 locks
        },
        {
            id: 'phase_4_grab',
            description: 'Collect the loot',
            type: 'collect',
            target: 'bank_gold',
            amount: 1
        },
        {
            id: 'phase_5_escape',
            description: 'Escape from the guards',
            type: 'survive',
            target: 'bank_guards',
            amount: 10  // 10 turns to survive
        }
    ],

    rewards: {
        gold: 2500,  // Per player (10,000 total split)
        experience: 500,
        reputation: 100,
        title: 'Bank Robber',
        unlockLocation: 'high_roller_casino',
        factionReputation: [
            { faction: 'criminal', amount: 100 },
            { faction: 'law', amount: -100 }
        ],
        nftReward: {
            type: 'achievement',
            name: 'Master Thief Badge',
            description: 'Successfully robbed the BSC Central Bank',
            rarity: 'legendary'
        }
    },

    failureConsequences: {
        goldLoss: 500,
        reputationLoss: 50,
        jail: {
            duration: 24,
            restriction: 'all_quests'
        }
    },

    heistData: {
        phases: [
            {
                id: 'phase_1_planning',
                name: 'Planning',
                description: 'Discuss strategy with your team',
                type: 'planning',
                aiNarration: true
            },
            {
                id: 'phase_2_infiltration',
                name: 'Infiltration',
                description: 'Sneak into the bank',
                type: 'infiltration',
                skillChecks: [
                    {
                        player: 'specific',
                        role: 'utility',
                        stat: 'charm',
                        difficulty: 25,
                        failureConsequence: 'alarm'
                    },
                    {
                        player: 'specific',
                        role: 'damage',
                        stat: 'charm',
                        difficulty: 20,
                        failureConsequence: 'alarm'
                    },
                    {
                        player: 'specific',
                        role: 'tank',
                        stat: 'strength',
                        difficulty: 15,
                        failureConsequence: 'damage'
                    }
                ],
                aiNarration: true
            },
            {
                id: 'phase_3_vault',
                name: 'The Vault',
                description: 'Break into the vault',
                type: 'objective',
                skillChecks: [
                    {
                        player: 'any',
                        stat: 'strength',
                        difficulty: 20,
                        failureConsequence: 'alarm'
                    },
                    {
                        player: 'any',
                        stat: 'defense',
                        difficulty: 18,
                        failureConsequence: 'damage'
                    },
                    {
                        player: 'any',
                        stat: 'charm',
                        difficulty: 22,
                        failureConsequence: 'alarm'
                    }
                ],
                aiNarration: true
            },
            {
                id: 'phase_4_grab',
                name: 'The Grab',
                description: 'Decide how much loot to take',
                type: 'objective',
                aiNarration: true
            },
            {
                id: 'phase_5_escape',
                name: 'Escape',
                description: 'Fight your way out',
                type: 'combat',
                combat: {
                    enemyCount: 8,
                    enemyLevel: 10,
                    enemyType: 'bank_guard',
                    defeatable: true
                },
                turnLimit: 10,
                aiNarration: true
            }
        ],
        choices: [
            {
                id: 'approach_choice',
                phase: 'phase_1_planning',
                question: 'Choose your approach',
                description: 'How will you rob the bank?',
                votingType: 'majority',
                options: [
                    {
                        id: 'quiet',
                        label: 'Quiet (Stealth)',
                        description: 'Harder skill checks, fewer guards',
                        effects: {}
                    },
                    {
                        id: 'loud',
                        label: 'Loud (Combat)',
                        description: 'Easier checks, more guards',
                        effects: {
                            addGuards: 4
                        }
                    },
                    {
                        id: 'inside_job',
                        label: 'Inside Job',
                        description: 'Pay 300 gold to skip infiltration',
                        effects: {
                            goldCost: 300,
                            skipPhase: 'phase_2_infiltration'
                        }
                    }
                ]
            },
            {
                id: 'loot_amount',
                phase: 'phase_4_grab',
                question: 'How much gold do you take?',
                description: 'More gold = more guards in escape',
                votingType: 'majority',
                options: [
                    {
                        id: 'take_50',
                        label: 'Take 50%',
                        description: 'Safer escape, 50% loot',
                        effects: {
                            addLoot: 50
                        }
                    },
                    {
                        id: 'take_75',
                        label: 'Take 75%',
                        description: 'Medium difficulty, 75% loot',
                        effects: {
                            addLoot: 75,
                            addGuards: 2
                        }
                    },
                    {
                        id: 'take_100',
                        label: 'Take 100%',
                        description: 'Hardest escape, 100% loot + bonus item',
                        effects: {
                            addLoot: 100,
                            addGuards: 5
                        }
                    }
                ]
            }
        ],
        loot: {
            minGold: 5000,
            maxGold: 10000,
            distribution: 'performance',  // MVP gets bonus
            tiers: [
                {
                    percentage: 50,
                    difficulty: 'easy',
                    bonusItems: []
                },
                {
                    percentage: 75,
                    difficulty: 'medium',
                    bonusItems: ['bank_vault_key']
                },
                {
                    percentage: 100,
                    difficulty: 'hard',
                    bonusItems: ['bank_vault_key', 'safu_amulet']
                }
            ],
            multipliers: [
                {
                    condition: 'No alarms triggered',
                    value: 1.25
                },
                {
                    condition: 'No team member died',
                    value: 1.15
                },
                {
                    condition: 'Completed in under 20 turns',
                    value: 1.30
                }
            ]
        },
        insurance: {
            cost: 200,
            protectsAgainst: ['gold_loss', 'item_loss']
        }
    },

    aiIntegration: {
        dynamicDialogue: true,
        adaptiveDifficulty: true,
        generateObjectives: false,
        personalizedRewards: false
    },

    repeatable: true,
    repeatCooldown: 168,  // 7 days

    tags: ['heist', 'legendary', 'multiplayer', 'high_reward', 'signature']
};

// ============================================================================
// QUEST DATABASE EXPORT
// ============================================================================

export const LEVEL_1_10_QUESTS = {
    // Level 1-2
    quest_first_score: QUEST_FIRST_SCORE,
    quest_dress_for_success: QUEST_DRESS_FOR_SUCCESS,

    // Level 3-4
    quest_robin_hood_dilemma: QUEST_ROBIN_HOOD_DILEMMA,
    quest_loan_shark_collection: QUEST_LOAN_SHARK_COLLECTION,

    // Level 5-6
    quest_jewelry_store_job: QUEST_JEWELRY_STORE_JOB,
    quest_underground_arena: QUEST_UNDERGROUND_ARENA,

    // Level 7-8
    quest_corrupted_mayor: QUEST_CORRUPTED_MAYOR,
    quest_smugglers_route: QUEST_SMUGGLERS_ROUTE,

    // Level 9-10
    quest_dragons_hoard: QUEST_DRAGONS_HOARD,
    quest_bank_heist: QUEST_BANK_HEIST
};

// Quest chains
export const QUEST_CHAINS = {
    main_story: [
        'quest_first_score',
        'quest_dress_for_success',
        'quest_corrupted_mayor'
    ],
    heist_progression: [
        'quest_jewelry_store_job',
        'quest_bank_heist'
    ],
    reputation_path: [
        'quest_robin_hood_dilemma',
        'quest_underground_arena'
    ]
};

export default LEVEL_1_10_QUESTS;
