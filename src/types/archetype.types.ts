// Character Archetypes for Legend of the Crime Lizard
// Each archetype has unique skills, perks, and playstyles!

export interface Archetype {
    id: number;
    name: string;
    displayName: string;
    emoji: string;
    description: string;
    lore: string;

    // Base stat modifications
    statBonuses: {
        strength: number;
        defense: number;
        charm: number;
    };

    // Unique skills
    skills: ArchetypeSkill[];

    // Special perks
    perks: ArchetypePerk[];

    // Multiplayer role
    role: 'damage' | 'tank' | 'support' | 'balanced' | 'utility';

    // Visuals
    color: string;
    gradient: string;

    // Mint cost
    mintPrice: string; // in BNB

    // Rarity
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface ArchetypeSkill {
    id: string;
    name: string;
    emoji: string;
    description: string;
    cooldown: number; // turns
    effect: SkillEffect;
}

export interface SkillEffect {
    type: 'damage' | 'heal' | 'buff' | 'debuff' | 'gold' | 'xp' | 'special';
    value: number;
    duration?: number; // for buffs/debuffs
    target: 'self' | 'enemy' | 'party' | 'all_players';
}

export interface ArchetypePerk {
    name: string;
    emoji: string;
    description: string;
    effect: PerkEffect;
}

export interface PerkEffect {
    type: 'combat' | 'economy' | 'social' | 'exploration' | 'special';
    bonus: string; // Description of what it does
    value?: number; // Numeric bonus if applicable
}

// AMAZING ARCHETYPE DEFINITIONS
export const ARCHETYPES: Record<string, Archetype> = {
    // COMMON ARCHETYPES (0.01 BNB)

    blacksmith: {
        id: 0,
        name: 'blacksmith',
        displayName: 'THE BLACKSMITH',
        emoji: '🔨',
        description: 'Master Craftsman • Equipment Expert',
        lore: 'A skilled tradesman who knows weapons and armor better than anyone. Gets discounts and can repair gear.',
        statBonuses: { strength: 2, defense: 2, charm: 0 },
        skills: [
            {
                id: 'forge_weapon',
                name: 'Forge Weapon',
                emoji: '⚒️',
                description: 'Craft a temporary powerful weapon (+5 ATK for 3 turns)',
                cooldown: 5,
                effect: { type: 'buff', value: 5, duration: 3, target: 'self' }
            },
            {
                id: 'repair',
                name: 'Quick Repair',
                emoji: '🛠️',
                description: 'Repair armor in the field (+3 DEF for 2 turns)',
                cooldown: 4,
                effect: { type: 'buff', value: 3, duration: 2, target: 'self' }
            }
        ],
        perks: [
            { name: 'Master Craftsman', emoji: '⚒️', description: '20% discount on all weapons and armor', effect: { type: 'economy', bonus: 'Shop discounts', value: 20 } },
            { name: 'Sturdy Build', emoji: '💪', description: '+10% max health', effect: { type: 'combat', bonus: 'Health boost', value: 10 } }
        ],
        role: 'balanced',
        color: 'text-orange-400',
        gradient: 'from-orange-600 to-red-700',
        mintPrice: '0.01',
        rarity: 'common'
    },

    rogue: {
        id: 1,
        name: 'rogue',
        displayName: 'THE ROGUE',
        emoji: '🗡️',
        description: 'Sneaky Thief • Critical Strike Master',
        lore: 'A master of stealth and daggers. Critical hits are your specialty. Quick and deadly.',
        statBonuses: { strength: 3, defense: 0, charm: 1 },
        skills: [
            {
                id: 'backstab',
                name: 'Backstab',
                emoji: '🗡️',
                description: 'Deal 2x damage with guaranteed critical hit',
                cooldown: 6,
                effect: { type: 'damage', value: 200, target: 'enemy' }
            },
            {
                id: 'vanish',
                name: 'Vanish',
                emoji: '💨',
                description: 'Guaranteed escape from combat',
                cooldown: 3,
                effect: { type: 'special', value: 100, target: 'self' }
            }
        ],
        perks: [
            { name: 'Critical Expert', emoji: '💥', description: '15% chance for double damage', effect: { type: 'combat', bonus: 'Critical chance', value: 15 } },
            { name: 'Light Fingers', emoji: '👋', description: '+15% gold from enemies', effect: { type: 'economy', bonus: 'Gold bonus', value: 15 } }
        ],
        role: 'damage',
        color: 'text-gray-400',
        gradient: 'from-gray-600 to-gray-800',
        mintPrice: '0.01',
        rarity: 'common'
    },

    // UNCOMMON ARCHETYPES (0.02 BNB)

    knight: {
        id: 2,
        name: 'knight',
        displayName: 'THE KNIGHT',
        emoji: '🛡️',
        description: 'Noble Defender • Team Protector',
        lore: 'A honorable warrior sworn to protect the weak. Can shield allies and take massive damage.',
        statBonuses: { strength: 1, defense: 4, charm: 1 },
        skills: [
            {
                id: 'shield_bash',
                name: 'Shield Bash',
                emoji: '🛡️',
                description: 'Stun enemy and reduce their damage by 50% next turn',
                cooldown: 5,
                effect: { type: 'debuff', value: 50, duration: 1, target: 'enemy' }
            },
            {
                id: 'protect_party',
                name: 'Protect Party',
                emoji: '🛡️',
                description: 'Multiplayer: Shield nearby allies, taking 50% of their damage',
                cooldown: 8,
                effect: { type: 'buff', value: 50, duration: 2, target: 'party' }
            }
        ],
        perks: [
            { name: 'Iron Will', emoji: '💪', description: '+20% defense against bosses', effect: { type: 'combat', bonus: 'Boss defense', value: 20 } },
            { name: 'Inspiring Presence', emoji: '✨', description: 'Party members near you get +2 STR', effect: { type: 'social', bonus: 'Party buff', value: 2 } }
        ],
        role: 'tank',
        color: 'text-blue-400',
        gradient: 'from-blue-600 to-cyan-700',
        mintPrice: '0.02',
        rarity: 'uncommon'
    },

    mage: {
        id: 3,
        name: 'mage',
        displayName: 'THE MAGE',
        emoji: '🔮',
        description: 'Arcane Master • Elemental Fury',
        lore: 'A wielder of forbidden magic. Can deal massive area damage and buff the party.',
        statBonuses: { strength: 4, defense: -1, charm: 2 },
        skills: [
            {
                id: 'fireball',
                name: 'Fireball',
                emoji: '🔥',
                description: 'Deal 3x damage but costs health (10 HP)',
                cooldown: 4,
                effect: { type: 'damage', value: 300, target: 'enemy' }
            },
            {
                id: 'mana_shield',
                name: 'Mana Shield',
                emoji: '🔮',
                description: 'Gain temporary shield (+5 DEF for 3 turns)',
                cooldown: 6,
                effect: { type: 'buff', value: 5, duration: 3, target: 'self' }
            },
            {
                id: 'arcane_blast',
                name: 'Arcane Blast',
                emoji: '⚡',
                description: 'Multiplayer: Damage all enemies in area for 1.5x',
                cooldown: 10,
                effect: { type: 'damage', value: 150, target: 'all_players' }
            }
        ],
        perks: [
            { name: 'Mana Regen', emoji: '💫', description: '+1 turn every 5 enemies defeated', effect: { type: 'special', bonus: 'Bonus turns', value: 1 } },
            { name: 'Arcane Wisdom', emoji: '📚', description: '+25% XP from all sources', effect: { type: 'special', bonus: 'XP boost', value: 25 } }
        ],
        role: 'damage',
        color: 'text-purple-400',
        gradient: 'from-purple-600 to-indigo-700',
        mintPrice: '0.02',
        rarity: 'uncommon'
    },

    // RARE ARCHETYPES (0.03 BNB)

    robin_hood: {
        id: 4,
        name: 'robin_hood',
        displayName: 'ROBIN HOOD',
        emoji: '🏹',
        description: 'The People\'s Champion • Charity Hero',
        lore: 'The legendary outlaw who steals from rich to give to poor. Massive bonuses for helping others.',
        statBonuses: { strength: 2, defense: 1, charm: 5 },
        skills: [
            {
                id: 'charity_strike',
                name: 'Charity Strike',
                emoji: '💚',
                description: 'Deal damage equal to gold donated this session',
                cooldown: 7,
                effect: { type: 'damage', value: 0, target: 'enemy' } // Calculated dynamically
            },
            {
                id: 'inspire_hope',
                name: 'Inspire Hope',
                emoji: '✨',
                description: 'Multiplayer: All allies gain +3 to all stats for 2 turns',
                cooldown: 10,
                effect: { type: 'buff', value: 3, duration: 2, target: 'party' }
            }
        ],
        perks: [
            { name: 'Hero of the Poor', emoji: '💚', description: 'Donations give 2x XP and 2x Charm', effect: { type: 'social', bonus: 'Donation multiplier', value: 200 } },
            { name: 'Legendary Aim', emoji: '🎯', description: '10% chance to instantly defeat common enemies', effect: { type: 'combat', bonus: 'Instant kill', value: 10 } }
        ],
        role: 'support',
        color: 'text-green-400',
        gradient: 'from-green-600 to-emerald-700',
        mintPrice: '0.03',
        rarity: 'rare'
    },

    developer: {
        id: 5,
        name: 'developer',
        displayName: 'THE DEVELOPER',
        emoji: '👨‍💻',
        description: 'Code Wizard • Smart Contract Master',
        lore: 'A legendary developer who codes magic into existence. Masters Solidity, TypeScript, and the arcane arts of blockchain development. Fueled by coffee and memes.',
        statBonuses: { strength: 2, defense: 2, charm: 4 },
        skills: [
            {
                id: 'deploy_contract',
                name: 'Deploy Contract',
                emoji: '📜',
                description: 'Create a magical smart contract shield (reduce enemy damage by 75% for 1 turn)',
                cooldown: 8,
                effect: { type: 'debuff', value: 75, duration: 1, target: 'enemy' }
            },
            {
                id: 'code_buff',
                name: 'Console.log Victory',
                emoji: '💻',
                description: 'Multiplayer: Debug party bugs - all allies gain +5 STR and +5 DEF for 3 turns',
                cooldown: 12,
                effect: { type: 'buff', value: 5, duration: 3, target: 'party' }
            }
        ],
        perks: [
            { name: 'Gas Optimizer', emoji: '⛽', description: '+25% gold from all sources (lower fees!)', effect: { type: 'economy', bonus: 'Gold multiplier', value: 25 } },
            { name: 'Stack Overflow Master', emoji: '📚', description: 'Party members deal +10% damage when near you', effect: { type: 'social', bonus: 'Dev aura', value: 10 } },
            { name: 'VC Funding', emoji: '💰', description: 'Start with 2x starting gold', effect: { type: 'economy', bonus: 'Starting gold', value: 100 } }
        ],
        role: 'support',
        color: 'text-cyan-400',
        gradient: 'from-cyan-500 to-purple-700',
        mintPrice: '0.03',
        rarity: 'rare'
    },

    // EPIC ARCHETYPES (0.05 BNB)

    necromancer: {
        id: 6,
        name: 'necromancer',
        displayName: 'THE NECROMANCER',
        emoji: '💀',
        description: 'Death Lord • Life Stealer',
        lore: 'Master of dark magic. Drains life from enemies and raises the dead as minions.',
        statBonuses: { strength: 5, defense: 0, charm: -2 },
        skills: [
            {
                id: 'life_drain',
                name: 'Life Drain',
                emoji: '🧛',
                description: 'Deal damage and heal for 50% of damage dealt',
                cooldown: 5,
                effect: { type: 'heal', value: 50, target: 'self' }
            },
            {
                id: 'raise_dead',
                name: 'Raise Dead',
                emoji: '💀',
                description: 'Summon defeated enemy to fight for you (one battle)',
                cooldown: 10,
                effect: { type: 'special', value: 100, target: 'self' }
            },
            {
                id: 'death_aura',
                name: 'Death Aura',
                emoji: '☠️',
                description: 'Multiplayer: All enemies take 10% HP drain per turn',
                cooldown: 15,
                effect: { type: 'debuff', value: 10, duration: 3, target: 'all_players' }
            }
        ],
        perks: [
            { name: 'Soul Harvest', emoji: '👻', description: 'Gain bonus XP equal to 10% of damage dealt', effect: { type: 'special', bonus: 'Damage to XP', value: 10 } },
            { name: 'Undying', emoji: '🧟', description: 'Revive once per day at 25% HP instead of death', effect: { type: 'special', bonus: 'Second chance', value: 25 } }
        ],
        role: 'damage',
        color: 'text-purple-500',
        gradient: 'from-purple-700 to-black',
        mintPrice: '0.05',
        rarity: 'epic'
    },

    paladin: {
        id: 7,
        name: 'paladin',
        displayName: 'THE PALADIN',
        emoji: '⚔️✨',
        description: 'Holy Warrior • Divine Protector',
        lore: 'A warrior blessed with divine power. Heals allies and smites evil with holy fury.',
        statBonuses: { strength: 3, defense: 3, charm: 3 },
        skills: [
            {
                id: 'divine_smite',
                name: 'Divine Smite',
                emoji: '⚡',
                description: 'Deal 2.5x damage to evil enemies (Crime Lord, bosses)',
                cooldown: 6,
                effect: { type: 'damage', value: 250, target: 'enemy' }
            },
            {
                id: 'lay_on_hands',
                name: 'Lay on Hands',
                emoji: '🙏',
                description: 'Heal self OR ally for 30 HP',
                cooldown: 5,
                effect: { type: 'heal', value: 30, target: 'party' }
            },
            {
                id: 'aura_of_protection',
                name: 'Aura of Protection',
                emoji: '✨',
                description: 'Multiplayer: All allies gain +30% defense for 4 turns',
                cooldown: 12,
                effect: { type: 'buff', value: 30, duration: 4, target: 'party' }
            }
        ],
        perks: [
            { name: 'Divine Grace', emoji: '😇', description: 'Healing costs 50% less', effect: { type: 'economy', bonus: 'Healer discount', value: 50 } },
            { name: 'Righteous Fury', emoji: '⚡', description: '+50% damage to bosses', effect: { type: 'combat', bonus: 'Boss damage', value: 50 } },
            { name: 'Blessing', emoji: '🙏', description: 'Party members near you regenerate 5 HP/turn', effect: { type: 'social', bonus: 'HP regen aura', value: 5 } }
        ],
        role: 'support',
        color: 'text-yellow-200',
        gradient: 'from-yellow-400 to-white',
        mintPrice: '0.05',
        rarity: 'epic'
    },

    // LEGENDARY ARCHETYPES (0.1 BNB)

    degen: {
        id: 8,
        name: 'degen',
        displayName: 'THE DEGEN',
        emoji: '🎲',
        description: 'Legendary Gambler • Moon or Bust',
        lore: 'A fearless degen who risks everything on moonshots. Apes into opportunities others fear. Diamond hands and nerves of steel. 100x or zero - no in between.',
        statBonuses: { strength: 5, defense: 5, charm: 5 },
        skills: [
            {
                id: 'yolo_trade',
                name: 'YOLO Trade',
                emoji: '🚀',
                description: 'All-in gamble: Passive gold generation (+10 gold/turn when lucky)',
                cooldown: 0,
                effect: { type: 'gold', value: 10, target: 'self' }
            },
            {
                id: 'diamond_hands',
                name: 'Diamond Hands',
                emoji: '💎',
                description: 'HODL power: Enemies have 30% chance to flee from your conviction',
                cooldown: 3,
                effect: { type: 'special', value: 30, target: 'enemy' }
            },
            {
                id: 'pump_party',
                name: 'Pump It',
                emoji: '📈',
                description: 'Multiplayer: All party members gain +20% to ALL stats for 5 turns (moon mission!)',
                cooldown: 15,
                effect: { type: 'buff', value: 20, duration: 5, target: 'party' }
            }
        ],
        perks: [
            { name: 'Degen Lifestyle', emoji: '🎰', description: 'Earn 10 gold per turn passively (passive income!)', effect: { type: 'economy', bonus: 'Passive income', value: 10 } },
            { name: 'Risk Taker', emoji: '⚡', description: 'Enemies have -20% attack (they fear degens)', effect: { type: 'combat', bonus: 'Enemy debuff', value: 20 } },
            { name: '100x or Bust', emoji: '🚀', description: '+50% gold AND +50% XP from all sources', effect: { type: 'special', bonus: 'Everything multiplier', value: 50 } }
        ],
        role: 'balanced',
        color: 'text-green-400',
        gradient: 'from-green-500 to-emerald-700',
        mintPrice: '0.1',
        rarity: 'legendary'
    },

    dragon_tamer: {
        id: 9,
        name: 'dragon_tamer',
        displayName: 'THE DRAGON TAMER',
        emoji: '🐉',
        description: 'Beast Master • Legendary Summoner',
        lore: 'One who befriended a dragon. Can summon the dragon for devastating attacks.',
        statBonuses: { strength: 6, defense: 3, charm: 3 },
        skills: [
            {
                id: 'dragon_breath',
                name: 'Dragon Breath',
                emoji: '🔥',
                description: 'Deal 4x damage to single target',
                cooldown: 8,
                effect: { type: 'damage', value: 400, target: 'enemy' }
            },
            {
                id: 'dragon_scales',
                name: 'Dragon Scales',
                emoji: '🐉',
                description: 'Gain +10 DEF for 4 turns',
                cooldown: 7,
                effect: { type: 'buff', value: 10, duration: 4, target: 'self' }
            },
            {
                id: 'dragon_flight',
                name: 'Dragon Flight',
                emoji: '🦅',
                description: 'Multiplayer: Fly over obstacles, reach treasure first',
                cooldown: 20,
                effect: { type: 'special', value: 100, target: 'self' }
            }
        ],
        perks: [
            { name: 'Dragon Bond', emoji: '🐉', description: 'Immune to fire damage, +20% damage to all', effect: { type: 'combat', bonus: 'Dragon power', value: 20 } },
            { name: 'Treasure Hoarder', emoji: '💎', description: '+100% gold from boss defeats', effect: { type: 'economy', bonus: 'Boss gold', value: 100 } },
            { name: 'Flight', emoji: '🦅', description: 'Can escape from any battle instantly', effect: { type: 'special', bonus: 'Always escape', value: 100 } }
        ],
        role: 'damage',
        color: 'text-orange-500',
        gradient: 'from-orange-500 to-red-900',
        mintPrice: '0.1',
        rarity: 'legendary'
    }
};

// Multiplayer Boss Mechanics
export interface MultiplayerBoss {
    id: string;
    name: string;
    emoji: string;
    level: number;
    health: number;
    requiredPlayers: number;
    requiredRoles?: ('damage' | 'tank' | 'support')[]; // Some bosses need specific roles
    rewards: {
        goldPerPlayer: number;
        xpPerPlayer: number;
        specialLoot?: string[];
    };
    mechanics: BossMechanic[];
}

export interface BossMechanic {
    name: string;
    description: string;
    trigger: 'health_threshold' | 'turn_count' | 'player_role';
    effect: string;
}

// Multiplayer bosses - MUST match backend bosses in routes/legend/constants.js
// Theme: Crypto scammers in medieval LORD-style fantasy setting
export const MULTIPLAYER_BOSSES: Record<string, MultiplayerBoss> = {
    do_kwon: {
        id: 'do_kwon',
        name: 'Do Kwon - The Rug Puller',
        emoji: '💰🏃‍♂️',
        level: 10,
        health: 2000,
        requiredPlayers: 4,
        requiredRoles: [],
        rewards: {
            goldPerPlayer: 5000,      // 10x from 500
            xpPerPlayer: 3000,        // 10x from 300
            specialLoot: ['Luna Tokens', 'Extradition Papers', 'Stolen USDT Wallet']
        },
        mechanics: [
            {
                name: 'Exit Scam',
                description: 'Teleports away at 50% HP - party must chase him down before he escapes!',
                trigger: 'health_threshold',
                effect: 'Boss gains evasion and attempts to flee'
            },
            {
                name: 'Ponzi Shield',
                description: 'Protected by a pyramid of bag holders - break through their defenses!',
                trigger: 'turn_count',
                effect: 'Damage reduction shield that must be destroyed'
            }
        ]
    },

    sam_bankman: {
        id: 'sam_bankman',
        name: 'Sam Bankman-Fried - The Ponzi Prince',
        emoji: '👑💸',
        level: 25,
        health: 8000,
        requiredPlayers: 4,
        requiredRoles: ['tank', 'support'],
        rewards: {
            goldPerPlayer: 25000,     // 10x from 2500
            xpPerPlayer: 15000,       // 10x from 1500
            specialLoot: ['FTX Crown', 'Alameda Ledger', 'Bahamas Deed']
        },
        mechanics: [
            {
                name: 'Customer Funds Shield',
                description: 'Uses customer deposits as armor - Tank must break through the stolen gold barrier!',
                trigger: 'health_threshold',
                effect: 'Massive damage reduction shield'
            },
            {
                name: 'Alameda Summons',
                description: 'Calls forth trading bots to drain party gold - Support must cleanse the debuff!',
                trigger: 'turn_count',
                effect: 'Gold drain over time on entire party'
            },
            {
                name: 'Effective Altruism',
                description: 'Pretends to help while stealing more - heals himself and damages party',
                trigger: 'turn_count',
                effect: 'Self-heal and AoE damage'
            }
        ]
    },

    alex_mashinsky: {
        id: 'alex_mashinsky',
        name: 'Alex Mashinsky - The Celsius Swindler',
        emoji: '🧊💎',
        level: 50,
        health: 20000,
        requiredPlayers: 4,
        requiredRoles: ['damage'],
        rewards: {
            goldPerPlayer: 80000,     // 10x from 8000
            xpPerPlayer: 50000,       // 10x from 5000
            specialLoot: ['Frozen Assets Key', 'Celsius Network Seal', 'Ponzi Scheme Blueprint']
        },
        mechanics: [
            {
                name: 'Freeze Withdrawals',
                description: 'Locks party members in place - high DPS required to break free!',
                trigger: 'turn_count',
                effect: 'Stuns random party members'
            },
            {
                name: 'Celsius Network',
                description: 'Drains party resources while promising high yields - DPS must burn him down fast!',
                trigger: 'health_threshold',
                effect: 'Party-wide resource drain and damage over time'
            },
            {
                name: 'Bankruptcy Shield',
                description: 'Files Chapter 11 protection - massive damage reduction until shield is broken',
                trigger: 'health_threshold',
                effect: 'Temporary invulnerability phase'
            }
        ]
    }
};

// Role synergies
export const ROLE_SYNERGIES: Record<string, string> = {
    "damage_tank": "Tank protects DPS, allowing consistent damage output",
    "damage_support": "Support buffs DPS for massive burst damage",
    "tank_support": "Ultimate survival combo, can outlast any boss",
    "damage_damage_tank": "Optimal boss killing - double DPS with protection",
    "tank_support_support": "Immortal party - can't lose but takes forever",
    "balanced_party": "One of each role - versatile for any situation"
};
