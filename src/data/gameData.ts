// Legend of the Crime Lizard - Game Data

import type { Enemy, Weapon, Armor, AIPersonality, Potion } from '../types/legend.types';

// ENEMIES - Dark Forest Encounters (Crime Lizard Style!)
export const ENEMIES: Record<string, Enemy> = {
    // Level 1-3: Common Forest Threats
    forest_goblin: {
        id: 'forest_goblin',
        name: 'Forest Goblin Pickpocket',
        level: 1,
        health: 20,
        maxHealth: 20,
        strength: 3,
        defense: 2,
        goldMin: 5,
        goldMax: 15,
        experienceReward: 10,
        description: 'A sneaky goblin trying to steal YOUR stolen gold. The audacity!',
        rarity: 'common',
        specialAbility: {
            name: 'Gold Snatch',
            description: '30% chance to steal 5 gold on hit',
            chance: 30
        }
    },

    giant_sewer_rat: {
        id: 'giant_sewer_rat',
        name: 'Giant Sewer Rat',
        level: 1,
        health: 25,
        maxHealth: 25,
        strength: 4,
        defense: 1,
        goldMin: 3,
        goldMax: 10,
        experienceReward: 12,
        description: 'A nasty rat from the city sewers. Probably escaped from a crypto mining farm.',
        rarity: 'common',
        specialAbility: {
            name: 'Disease Bite',
            description: '35% chance to reduce max HP by 5 for this battle',
            chance: 35
        }
    },

    corrupted_wolf: {
        id: 'corrupted_wolf',
        name: 'Corrupted Wolf',
        level: 2,
        health: 35,
        maxHealth: 35,
        strength: 6,
        defense: 3,
        goldMin: 10,
        goldMax: 25,
        experienceReward: 20,
        description: 'A wolf twisted by dark magic. Its eyes glow like BNB price charts.',
        rarity: 'common',
        specialAbility: {
            name: 'Pack Hunter',
            description: '40% chance to attack twice in one turn',
            chance: 40
        }
    },

    bandit_lizard: {
        id: 'bandit_lizard',
        name: 'Bandit Lizard',
        level: 3,
        health: 40,
        maxHealth: 40,
        strength: 7,
        defense: 5,
        goldMin: 20,
        goldMax: 40,
        experienceReward: 30,
        description: 'A rival lizard who steals from the poor. Give them a lesson in lizard honor!',
        rarity: 'common'
    },

    // Level 4-6: Uncommon Encounters
    dark_forest_troll: {
        id: 'dark_forest_troll',
        name: 'Dark Forest Troll',
        level: 4,
        health: 70,
        maxHealth: 70,
        strength: 10,
        defense: 8,
        goldMin: 40,
        goldMax: 80,
        experienceReward: 50,
        description: 'A massive troll hoarding stolen treasure under a bridge. Classic.',
        rarity: 'uncommon',
        specialAbility: {
            name: 'Regeneration',
            description: 'Heals 5 HP per turn',
            chance: 100
        }
    },

    shadow_assassin: {
        id: 'shadow_assassin',
        name: 'Shadow Assassin',
        level: 5,
        health: 60,
        maxHealth: 60,
        strength: 12,
        defense: 6,
        goldMin: 60,
        goldMax: 120,
        experienceReward: 75,
        description: 'A deadly assassin hired by the rich to stop you. Paid in BNB.',
        rarity: 'uncommon',
        specialAbility: {
            name: 'Backstab',
            description: '45% chance to deal double damage',
            chance: 45
        }
    },

    corrupted_ent: {
        id: 'corrupted_ent',
        name: 'Corrupted Treant',
        level: 6,
        health: 100,
        maxHealth: 100,
        strength: 9,
        defense: 12,
        goldMin: 80,
        goldMax: 150,
        experienceReward: 100,
        description: 'An ancient tree corrupted by greed. Its roots dig deep into stolen gold.',
        rarity: 'uncommon',
        specialAbility: {
            name: 'Root Entangle',
            description: '35% chance to stun for 1 turn',
            chance: 35
        }
    },

    // Level 7-9: Rare Encounters
    dark_elf_noble: {
        id: 'dark_elf_noble',
        name: 'Dark Elf Noble',
        level: 7,
        health: 120,
        maxHealth: 120,
        strength: 14,
        defense: 11,
        goldMin: 150,
        goldMax: 300,
        experienceReward: 150,
        description: 'A wealthy dark elf who hoards riches while their people starve. Sound familiar?',
        rarity: 'rare',
        specialAbility: {
            name: 'Shadow Magic',
            description: '50% chance to blind you, reducing accuracy',
            chance: 50
        }
    },

    crypto_witch: {
        id: 'crypto_witch',
        name: 'Crypto Witch',
        level: 8,
        health: 100,
        maxHealth: 100,
        strength: 15,
        defense: 8,
        goldMin: 200,
        goldMax: 400,
        experienceReward: 200,
        description: 'A witch who scams travelers with fake potions. Basically a rug puller.',
        rarity: 'rare',
        specialAbility: {
            name: 'Curse of FOMO',
            description: 'Reduces your defense by 3 for the battle',
            chance: 60
        },
        itemDrops: ['witch_staff', 'health_potion_large']
    },

    ogre_whale: {
        id: 'ogre_whale',
        name: 'Ogre Whale',
        level: 9,
        health: 130,
        maxHealth: 130,
        strength: 17,
        defense: 12,
        goldMin: 300,
        goldMax: 600,
        experienceReward: 250,
        description: 'A massive ogre who holds bags of BNB. A true crypto whale!',
        rarity: 'rare',
        specialAbility: {
            name: 'Diamond Hands',
            description: '+4 defense when below 50% HP',
            chance: 100
        },
        itemDrops: ['ogre_club', 'bnb_shard']
    },

    // Level 10-12: Epic Encounters
    dragon_hoarder: {
        id: 'dragon_hoarder',
        name: 'Dragon Hoarder',
        level: 10,
        health: 160,
        maxHealth: 160,
        strength: 20,
        defense: 14,
        goldMin: 150,
        goldMax: 300,
        experienceReward: 350,
        description: 'A greedy dragon sitting on mountains of stolen wealth. Time to redistribute!',
        rarity: 'epic',
        specialAbility: {
            name: 'Fire Breath',
            description: '40% chance to deal 1.5x damage and burn',
            chance: 40
        },
        itemDrops: ['dragon_scale', 'fire_crystal', 'dragon_gold']
    },

    binance_golem: {
        id: 'binance_golem',
        name: 'BNB Chain Golem',
        level: 11,
        health: 250,
        maxHealth: 250,
        strength: 20,
        defense: 22,
        goldMin: 200,
        goldMax: 400,
        experienceReward: 400,
        description: 'A magical golem powered by BNB. Its chest glows yellow with chain energy.',
        rarity: 'epic',
        specialAbility: {
            name: 'Gas Fee Shield',
            description: 'Reflects 10% of damage back to attacker',
            chance: 100
        },
        itemDrops: ['bnb_core', 'chain_armor']
    },

    // Level 13-14: Legendary Pre-Boss
    shadow_dragon: {
        id: 'shadow_dragon',
        name: 'Shadow Dragon Lord',
        level: 13,
        health: 350,
        maxHealth: 350,
        strength: 28,
        defense: 24,
        goldMin: 300,
        goldMax: 600,
        experienceReward: 600,
        description: 'A legendary dragon corrupted by greed. Lieutenant of the Dark Sorcerer.',
        rarity: 'legendary',
        specialAbility: {
            name: 'Shadow Flame',
            description: '50% chance to deal 2x damage and drain 10 HP',
            chance: 50
        },
        itemDrops: ['shadow_scale', 'void_crystal', 'legendary_weapon_fragment']
    },

    // RARE SPAWNS (Crypto Legends)
    cz_the_wanderer: {
        id: 'cz_the_wanderer',
        name: 'CZ the Wanderer',
        level: 10,
        health: 200,
        maxHealth: 200,
        strength: 20,
        defense: 20,
        goldMin: 777,
        goldMax: 777,
        experienceReward: 500,
        description: '🔶 A mysterious traveler in a yellow hood. "FUNDS ARE SAFU," he whispers before vanishing.',
        rarity: 'legendary',
        spawnChance: 0.005, // 0.5% chance (1 in 200)
        specialAbility: {
            name: 'SAFU Protocol',
            description: 'Cannot be defeated - always escapes at 10% HP, drops massive rewards',
            chance: 100
        },
        itemDrops: ['safu_amulet', 'binance_blessing', 'bnb_shard']
    },

    satoshi_nakamoto: {
        id: 'satoshi_nakamoto',
        name: 'Satoshi Nakamoto',
        level: 15,
        health: 250,
        maxHealth: 250,
        strength: 25,
        defense: 25,
        goldMin: 2100,
        goldMax: 2100,
        experienceReward: 1000,
        description: '₿ The legendary creator of Bitcoin. His identity remains a mystery. "Be your own bank," echoes from the shadows.',
        rarity: 'legendary',
        spawnChance: 0.002, // 0.2% chance - ultra rare (1 in 500)
        specialAbility: {
            name: 'Genesis Block',
            description: 'Cannot be defeated - vanishes in a flash of light, dropping legendary Bitcoin treasures',
            chance: 100
        },
        itemDrops: ['genesis_block', 'bitcoin_medallion', 'satoshi_whitepaper', 'legendary_weapon_fragment']
    },

    vitalik_the_ethereal: {
        id: 'vitalik_the_ethereal',
        name: 'Vitalik the Ethereal',
        level: 12,
        health: 180,
        maxHealth: 180,
        strength: 18,
        defense: 22,
        goldMin: 400,
        goldMax: 800,
        experienceReward: 750,
        description: '⟠ A young wizard in purple robes. Smart contracts flow from his fingertips. "World Computer," he murmurs.',
        rarity: 'legendary',
        spawnChance: 0.004, // 0.4% chance (1 in 250)
        specialAbility: {
            name: 'Smart Contract Shield',
            description: 'Deploys defensive smart contracts - cannot be defeated, escapes after deploying upgrades',
            chance: 100
        },
        itemDrops: ['ethereum_crystal', 'vitalik_wisdom', 'gas_token', 'fire_crystal']
    },

    he_jiankui: {
        id: 'he_jiankui',
        name: 'He Jiankui - "BUIDL Master"',
        level: 11,
        health: 220,
        maxHealth: 220,
        strength: 22,
        defense: 19,
        goldMin: 300,
        goldMax: 500,
        experienceReward: 666,
        description: '🏗️ The tireless builder from the East. "Stop talking, start BUIDLING!" echoes through the code.',
        rarity: 'legendary',
        spawnChance: 0.004, // 0.4% chance (1 in 250)
        specialAbility: {
            name: 'BUIDL Protocol',
            description: 'Creates defensive structures mid-battle - escapes to build another day',
            chance: 100
        },
        itemDrops: ['builders_hammer', 'bnb_core', 'buidl_badge']
    },

    changpeng_zhao: {
        id: 'changpeng_zhao',
        name: 'Changpeng "CZ" Zhao',
        level: 13,
        health: 300,
        maxHealth: 300,
        strength: 24,
        defense: 24,
        goldMin: 888,
        goldMax: 1888,
        experienceReward: 888,
        description: '🟡 The founder of Binance himself. Yellow energy radiates from his form. "Build and they will come."',
        rarity: 'legendary',
        spawnChance: 0.003, // 0.3% chance (1 in 333)
        specialAbility: {
            name: 'Binance Empire',
            description: 'Summons the power of the world\'s largest exchange - escapes in a flash of yellow light',
            chance: 100
        },
        itemDrops: ['binance_crown', 'safu_amulet', 'bnb_core', 'legendary_weapon_fragment']
    },

    brian_armstrong: {
        id: 'brian_armstrong',
        name: 'Brian Armstrong - "Coinbase King"',
        level: 11,
        health: 210,
        maxHealth: 210,
        strength: 20,
        defense: 21,
        goldMin: 1000,
        goldMax: 1500,
        experienceReward: 700,
        description: '🔵 The American crypto pioneer. Blue corporate energy surrounds him. "Crypto for everyone."',
        rarity: 'legendary',
        spawnChance: 0.004, // 0.4% chance (1 in 250)
        specialAbility: {
            name: 'Institutional Shield',
            description: 'Protected by Wall Street - escapes through regulatory portals',
            chance: 100
        },
        itemDrops: ['coinbase_badge', 'institutional_armor', 'blue_chip_token']
    },

    michael_saylor: {
        id: 'michael_saylor',
        name: 'Michael Saylor - "Bitcoin Maxi"',
        level: 12,
        health: 200,
        maxHealth: 200,
        strength: 28,
        defense: 16,
        goldMin: 1500,
        goldMax: 2000,
        experienceReward: 800,
        description: '🟠 The ultimate Bitcoin maximalist. Orange laser eyes pierce through altcoins. "There is only Bitcoin."',
        rarity: 'legendary',
        spawnChance: 0.004, // 0.4% chance (1 in 250)
        specialAbility: {
            name: 'Laser Eyes',
            description: 'Fires orange laser eyes - flees to buy more Bitcoin',
            chance: 100
        },
        itemDrops: ['laser_eyes_relic', 'bitcoin_medallion', 'orange_pill', 'fire_crystal']
    },

    // BOSS: The Dark Sorcerer (replaces Crime Lord)
    dark_sorcerer: {
        id: 'dark_sorcerer',
        name: 'The Dark Sorcerer',
        level: 15,
        health: 500,
        maxHealth: 500,
        strength: 32,
        defense: 28,
        goldMin: 5000,
        goldMax: 10000,
        experienceReward: 1000,
        description: 'The evil wizard hoarding all the realm\'s wealth in his dark tower. Defeat him to free the people!',
        rarity: 'boss',
        specialAbility: {
            name: 'Dark Magic Mastery',
            description: 'Cycles through 3 attack types: Lightning (high damage), Shield (heals 50HP), Curse (lowers your stats)',
            chance: 100
        },
        itemDrops: ['sorcerer_staff', 'dark_crown', 'legendary_weapon_fragment', 'ultimate_power']
    },

    // ===========================
    // LEVEL 15-20: Elite Enemies
    // ===========================
    corrupted_knight: {
        id: 'corrupted_knight',
        name: 'Corrupted Knight',
        level: 17,
        health: 1000,
        maxHealth: 1000,
        strength: 35,
        defense: 30,
        goldMin: 400,
        goldMax: 800,
        experienceReward: 600,
        description: 'Once a noble knight, now corrupted by greed and dark magic. Their armor gleams with ill-gotten gold.',
        rarity: 'rare',
        specialAbility: {
            name: 'Shield Bash',
            description: '30% chance to stun for 1 turn',
            chance: 30
        },
        itemDrops: ['knight_armor', 'corrupted_blade', 'fire_crystal']
    },

    dark_mage: {
        id: 'dark_mage',
        name: 'Dark Mage',
        level: 18,
        health: 800,
        maxHealth: 800,
        strength: 40,
        defense: 25,
        goldMin: 500,
        goldMax: 1000,
        experienceReward: 700,
        description: 'A wizard who sold their soul for power. Dark energy crackles around their staff.',
        rarity: 'rare',
        specialAbility: {
            name: 'Void Bolt',
            description: '35% chance to deal 1.5x damage and ignore 10 defense',
            chance: 35
        },
        itemDrops: ['dark_staff', 'void_crystal', 'mana_potion']
    },

    elite_assassin: {
        id: 'elite_assassin',
        name: 'Elite Shadow Assassin',
        level: 19,
        health: 600,
        maxHealth: 600,
        strength: 50,
        defense: 20,
        goldMin: 600,
        goldMax: 1200,
        experienceReward: 800,
        description: 'The best of the best. They move like smoke and strike like lightning.',
        rarity: 'epic',
        specialAbility: {
            name: 'Critical Strike',
            description: '40% chance to deal triple damage',
            chance: 40
        },
        itemDrops: ['shadow_dagger', 'stealth_cloak', 'poison_vial']
    },

    blood_demon: {
        id: 'blood_demon',
        name: 'Blood Demon',
        level: 20,
        health: 1200,
        maxHealth: 1200,
        strength: 38,
        defense: 28,
        goldMin: 700,
        goldMax: 1400,
        experienceReward: 900,
        description: 'A demon summoned from the depths. It feeds on the blood of the greedy.',
        rarity: 'epic',
        specialAbility: {
            name: 'Life Drain',
            description: '25% chance to steal 50 HP from you',
            chance: 25
        },
        itemDrops: ['demon_horn', 'blood_crystal', 'cursed_amulet']
    },

    // ===========================
    // LEVEL 25-30: Champion Enemies
    // ===========================
    ancient_dragon: {
        id: 'ancient_dragon',
        name: 'Ancient Dragon',
        level: 26,
        health: 3000,
        maxHealth: 3000,
        strength: 60,
        defense: 50,
        goldMin: 2000,
        goldMax: 4000,
        experienceReward: 2500,
        description: 'An ancient dragon that has lived for millennia. Its hoard rivals kingdoms.',
        rarity: 'legendary',
        specialAbility: {
            name: 'Ancient Fire',
            description: '45% chance to deal 2x damage with burning effect',
            chance: 45
        },
        itemDrops: ['ancient_scale', 'dragon_heart', 'legendary_weapon_fragment', 'fire_crystal']
    },

    demon_lord: {
        id: 'demon_lord',
        name: 'Demon Lord',
        level: 27,
        health: 2500,
        maxHealth: 2500,
        strength: 70,
        defense: 45,
        goldMin: 2200,
        goldMax: 4500,
        experienceReward: 2800,
        description: 'A powerful demon lord who commands legions. Dark energy radiates from its form.',
        rarity: 'legendary',
        specialAbility: {
            name: 'Hellfire',
            description: '50% chance to deal massive fire damage and curse',
            chance: 50
        },
        itemDrops: ['demon_crown', 'hellfire_orb', 'void_crystal', 'cursed_blade']
    },

    celestial_warrior: {
        id: 'celestial_warrior',
        name: 'Celestial Warrior',
        level: 28,
        health: 2000,
        maxHealth: 2000,
        strength: 65,
        defense: 60,
        goldMin: 2500,
        goldMax: 5000,
        experienceReward: 3000,
        description: 'A warrior from the heavens sent to stop you. Holy light surrounds their blade.',
        rarity: 'legendary',
        specialAbility: {
            name: 'Divine Smite',
            description: '40% chance to deal holy damage that ignores armor',
            chance: 40
        },
        itemDrops: ['celestial_blade', 'angel_wings', 'holy_relic', 'legendary_weapon_fragment']
    },

    void_harbinger: {
        id: 'void_harbinger',
        name: 'Void Harbinger',
        level: 30,
        health: 3500,
        maxHealth: 3500,
        strength: 75,
        defense: 55,
        goldMin: 3000,
        goldMax: 6000,
        experienceReward: 3500,
        description: 'A being from the void between dimensions. Reality warps around it.',
        rarity: 'legendary',
        specialAbility: {
            name: 'Void Tear',
            description: '55% chance to deal void damage and reduce your max HP temporarily',
            chance: 55
        },
        itemDrops: ['void_shard', 'reality_fragment', 'void_crystal', 'chaos_orb']
    },

    // ===========================
    // LEVEL 35-40: Titan Enemies
    // ===========================
    titan_guardian: {
        id: 'titan_guardian',
        name: 'Titan Guardian',
        level: 36,
        health: 8000,
        maxHealth: 8000,
        strength: 90,
        defense: 80,
        goldMin: 5000,
        goldMax: 10000,
        experienceReward: 6000,
        description: 'A massive titan from the age of gods. Mountains tremble at its footsteps.',
        rarity: 'legendary',
        specialAbility: {
            name: 'Earthquake Strike',
            description: '50% chance to deal massive damage and stun',
            chance: 50
        },
        itemDrops: ['titan_core', 'mountain_shard', 'legendary_weapon_fragment', 'ancient_relic']
    },

    void_creature: {
        id: 'void_creature',
        name: 'Void Creature',
        level: 37,
        health: 6000,
        maxHealth: 6000,
        strength: 110,
        defense: 65,
        goldMin: 6000,
        goldMax: 12000,
        experienceReward: 7000,
        description: 'A nightmarish creature from the void. Its form shifts and writhes unnaturally.',
        rarity: 'legendary',
        specialAbility: {
            name: 'Void Consumption',
            description: '60% chance to ignore defense and drain life',
            chance: 60
        },
        itemDrops: ['void_essence', 'nightmare_shard', 'void_crystal', 'chaos_orb']
    },

    ancient_god: {
        id: 'ancient_god',
        name: 'Ancient God',
        level: 40,
        health: 10000,
        maxHealth: 10000,
        strength: 100,
        defense: 100,
        goldMin: 8000,
        goldMax: 16000,
        experienceReward: 8500,
        description: 'A forgotten god from the dawn of time. Divine power flows through its very being.',
        rarity: 'boss',
        specialAbility: {
            name: 'Divine Wrath',
            description: '65% chance to unleash devastating divine attacks',
            chance: 65
        },
        itemDrops: ['god_fragment', 'divine_essence', 'legendary_weapon_fragment', 'ultimate_power']
    },

    cosmic_horror: {
        id: 'cosmic_horror',
        name: 'Cosmic Horror',
        level: 38,
        health: 7000,
        maxHealth: 7000,
        strength: 105,
        defense: 70,
        goldMin: 7000,
        goldMax: 14000,
        experienceReward: 7500,
        description: 'An incomprehensible being from beyond the stars. Looking at it hurts your mind.',
        rarity: 'legendary',
        specialAbility: {
            name: 'Madness',
            description: '55% chance to confuse and deal psychic damage',
            chance: 55
        },
        itemDrops: ['cosmic_shard', 'star_fragment', 'void_crystal', 'eldritch_tome']
    },

    // ===========================
    // LEVEL 45-50: World Enders
    // ===========================
    world_ender: {
        id: 'world_ender',
        name: 'World Ender',
        level: 46,
        health: 20000,
        maxHealth: 20000,
        strength: 140,
        defense: 120,
        goldMin: 15000,
        goldMax: 30000,
        experienceReward: 15000,
        description: 'A being of pure destruction. It has ended countless worlds and civilizations.',
        rarity: 'boss',
        specialAbility: {
            name: 'Apocalypse',
            description: '70% chance to deal catastrophic damage to everything',
            chance: 70
        },
        itemDrops: ['apocalypse_fragment', 'world_core', 'legendary_weapon_fragment', 'ultimate_power', 'void_crystal']
    },

    primordial_being: {
        id: 'primordial_being',
        name: 'Primordial Being',
        level: 50,
        health: 30000,
        maxHealth: 30000,
        strength: 160,
        defense: 140,
        goldMin: 25000,
        goldMax: 50000,
        experienceReward: 20000,
        description: 'The first. The oldest. The most powerful. It existed before existence itself.',
        rarity: 'boss',
        specialAbility: {
            name: 'Primordial Chaos',
            description: '80% chance to unleash reality-shattering attacks',
            chance: 80
        },
        itemDrops: ['primordial_essence', 'genesis_core', 'legendary_weapon_fragment', 'ultimate_power', 'god_fragment', 'infinite_crystal']
    },

    eternal_dragon: {
        id: 'eternal_dragon',
        name: 'Eternal Dragon Emperor',
        level: 48,
        health: 25000,
        maxHealth: 25000,
        strength: 150,
        defense: 130,
        goldMin: 20000,
        goldMax: 40000,
        experienceReward: 17500,
        description: 'The emperor of all dragons. It has ruled for eons and its power is unmatched.',
        rarity: 'boss',
        specialAbility: {
            name: 'Eternal Flame',
            description: '75% chance to deal fire damage that cannot be resisted',
            chance: 75
        },
        itemDrops: ['eternal_scale', 'dragon_emperor_crown', 'legendary_weapon_fragment', 'ultimate_power', 'ancient_scale']
    },

    chaos_incarnate: {
        id: 'chaos_incarnate',
        name: 'Chaos Incarnate',
        level: 47,
        health: 22000,
        maxHealth: 22000,
        strength: 145,
        defense: 125,
        goldMin: 18000,
        goldMax: 36000,
        experienceReward: 16500,
        description: 'Pure chaos given form. Reality itself breaks down around it.',
        rarity: 'boss',
        specialAbility: {
            name: 'Chaotic Rift',
            description: '72% chance to deal random massive damage',
            chance: 72
        },
        itemDrops: ['chaos_core', 'reality_breaker', 'legendary_weapon_fragment', 'ultimate_power', 'void_crystal']
    }
};

// WEAPONS - Tools of the Crime Lizard
export const WEAPONS: Record<string, Weapon> = {
    rusty_knife: {
        id: 'rusty_knife',
        name: 'Rusty Dagger of Poverty',
        attackBonus: 2,
        price: 0,
        minLevel: 1,
        description: 'A worn blade from the slums. Every lizard starts somewhere.',
        rarity: 'common'
    },

    brass_knuckles: {
        id: 'brass_knuckles',
        name: 'Bronze Token Knuckles',
        attackBonus: 4,
        price: 50,
        minLevel: 1,
        description: 'Forged from melted bronze coins. Street justice at its finest.',
        rarity: 'common'
    },

    switchblade: {
        id: 'switchblade',
        name: 'Lizard\'s Fang',
        attackBonus: 6,
        price: 150,
        minLevel: 2,
        description: 'Swift and sharp as a lizard\'s strike. Perfect for ambushes.',
        rarity: 'common'
    },

    stun_baton: {
        id: 'stun_baton',
        name: 'Aster\'s Lightning Rod',
        attackBonus: 8,
        price: 300,
        minLevel: 3,
        description: 'Charged with Aster Protocol energy. Shocks enemies into submission.',
        rarity: 'uncommon',
        advantages: {
            stunChance: 25 // 25% chance to stun
        }
    },

    silenced_pistol: {
        id: 'silenced_pistol',
        name: 'Phantom BEP-20 Pistol',
        attackBonus: 12,
        price: 700,
        minLevel: 5,
        description: 'Silent as a BNB Chain transaction. No witnesses, no trace.',
        rarity: 'uncommon',
        advantages: {
            criticalChance: 20 // 20% bonus to critical hits
        }
    },

    enchanted_dagger: {
        id: 'enchanted_dagger',
        name: 'Moonlight Enchanted Dagger',
        attackBonus: 14,
        price: 1000,
        minLevel: 6,
        description: 'A dagger blessed by forest spirits. Glows softly in darkness.',
        rarity: 'rare',
        advantages: {
            criticalChance: 25, // 25% bonus to critical hits
            armorPenetration: 3 // Ignores 3 points of enemy defense
        }
    },

    carbon_fiber_blade: {
        id: 'carbon_fiber_blade',
        name: 'CZ\'s Precision Blade',
        attackBonus: 16,
        price: 1500,
        minLevel: 7,
        description: 'Crafted with the precision of a blockchain. Cuts through FUD and armor alike.',
        rarity: 'rare',
        advantages: {
            bleedDamage: 3, // 3 damage per turn for 3 turns
            armorPenetration: 5 // Ignores 5 points of enemy defense
        }
    },

    electro_katana: {
        id: 'electro_katana',
        name: 'Electro-Katana of the East',
        attackBonus: 19,
        price: 2200,
        minLevel: 8,
        description: 'A high-tech katana crackling with electric energy. Fast and deadly.',
        rarity: 'rare',
        advantages: {
            criticalChance: 35, // 35% bonus to critical hits
            armorPenetration: 8, // Ignores 8 points of enemy defense
            stunChance: 15 // 15% chance to stun enemy
        }
    },

    plasma_knife: {
        id: 'plasma_knife',
        name: 'BNB Chain Plasma Cutter',
        attackBonus: 22,
        price: 3500,
        minLevel: 9,
        description: 'Infused with yellow BNB energy. Burns through enemies like gas fees through wallets.',
        rarity: 'epic',
        advantages: {
            armorPenetration: 15, // Ignores 15 points of enemy defense
            criticalChance: 30 // 30% bonus to critical hits
        }
    },

    justice_bringer: {
        id: 'justice_bringer',
        name: 'Sword of the SAFU Lizard',
        attackBonus: 30,
        price: 10000,
        minLevel: 12,
        description: 'Legendary blade blessed by CZ the Wanderer. "Funds are SAFU, justice is swift."',
        rarity: 'legendary',
        advantages: {
            criticalChance: 50, // 50% bonus to critical hits
            healingOnHit: 5, // Heal 5 HP on every attack
            armorPenetration: 20 // Ignores 20 points of enemy defense
        }
    },

    // LEVEL 20-30 WEAPONS
    void_ripper: {
        id: 'void_ripper',
        name: 'Void Ripper Scythe',
        attackBonus: 38,
        price: 18000,
        minLevel: 20,
        description: 'A scythe forged in the void between blocks. Tears through reality and armor alike.',
        rarity: 'legendary',
        advantages: {
            criticalChance: 55,
            armorPenetration: 25,
            lifesteal: 8 // Heal 8 HP on every attack
        }
    },

    dragon_fang: {
        id: 'dragon_fang',
        name: 'Dragon\'s Fang Blade',
        attackBonus: 45,
        price: 25000,
        minLevel: 25,
        description: 'Carved from a dragon\'s fang. Burns with ancient fire and fury.',
        rarity: 'legendary',
        advantages: {
            criticalChance: 60,
            armorPenetration: 30,
            burnDamage: 8, // 8 burn damage per turn for 3 turns
            lifesteal: 10
        }
    },

    // LEVEL 30-40 WEAPONS
    chaos_blade: {
        id: 'chaos_blade',
        name: 'Blade of Infinite Chaos',
        attackBonus: 55,
        price: 45000,
        minLevel: 30,
        description: 'A weapon of pure chaos energy. Reality bends around its edge.',
        rarity: 'mythic',
        advantages: {
            criticalChance: 70,
            armorPenetration: 40,
            lifesteal: 15,
            chaosStrike: 20 // 20% chance to deal double damage
        }
    },

    cosmic_destroyer: {
        id: 'cosmic_destroyer',
        name: 'Cosmic Destroyer',
        attackBonus: 68,
        price: 75000,
        minLevel: 35,
        description: 'Forged from the heart of a dying star. Commands the power of the cosmos.',
        rarity: 'mythic',
        advantages: {
            criticalChance: 80,
            armorPenetration: 50,
            lifesteal: 20,
            cosmicBlast: 30 // 30% chance for AoE damage
        }
    },

    // LEVEL 40+ WEAPONS
    reality_ender: {
        id: 'reality_ender',
        name: 'Reality Ender',
        attackBonus: 85,
        price: 120000,
        minLevel: 40,
        description: 'The ultimate weapon. Ends all arguments, all battles, all existence.',
        rarity: 'mythic',
        advantages: {
            criticalChance: 90,
            armorPenetration: 65,
            lifesteal: 25,
            voidStrike: 40, // 40% chance to ignore ALL defense
            executioner: 15 // 15% chance to instantly defeat enemies below 25% HP
        }
    },

    eternity_breaker: {
        id: 'eternity_breaker',
        name: 'Eternity Breaker',
        attackBonus: 100,
        price: 200000,
        minLevel: 45,
        description: 'A weapon beyond comprehension. Shatters the very concept of defeat.',
        rarity: 'mythic',
        advantages: {
            criticalChance: 100,
            armorPenetration: 80,
            lifesteal: 30,
            divineWrath: 50, // 50% chance for triple damage
            immortalSlayer: 25 // 25% chance to instantly defeat ANY enemy
        }
    }
};

// ARMOR - Protection for the People's Hero
export const ARMOR: Record<string, Armor> = {
    street_clothes: {
        id: 'street_clothes',
        name: 'Beggar\'s Rags',
        defenseBonus: 1,
        price: 0,
        minLevel: 1,
        description: 'Tattered clothes from the poor district. At least they\'re honest.',
        rarity: 'common'
    },

    leather_jacket: {
        id: 'leather_jacket',
        name: 'Lizard Scale Leather',
        defenseBonus: 3,
        price: 75,
        minLevel: 1,
        description: 'Made from shed lizard scales. Flexible and surprisingly tough.',
        rarity: 'common'
    },

    reinforced_hoodie: {
        id: 'reinforced_hoodie',
        name: 'HODL Hoodie',
        defenseBonus: 5,
        price: 200,
        minLevel: 2,
        description: 'Diamond hands sewn into the fabric. Protection against paper cuts and FUD.',
        rarity: 'common'
    },

    tactical_vest: {
        id: 'tactical_vest',
        name: 'Validator\'s Vest',
        defenseBonus: 8,
        price: 400,
        minLevel: 3,
        description: 'Worn by BNB Chain validators. Protects against slashing and bad actors.',
        rarity: 'uncommon',
        advantages: {
            damageReduction: 5 // 5% additional damage reduction
        }
    },

    stealth_suit: {
        id: 'stealth_suit',
        name: 'Ghost Protocol Suit',
        defenseBonus: 12,
        price: 900,
        minLevel: 5,
        description: 'Stealth tech from Aster Protocol. Move like a shadow through the blockchain.',
        rarity: 'uncommon',
        advantages: {
            dodgeChance: 10 // 10% chance to dodge attacks
        }
    },

    enchanted_robes: {
        id: 'enchanted_robes',
        name: 'Moonweave Robes',
        defenseBonus: 14,
        price: 1200,
        minLevel: 6,
        description: 'Magical robes woven with moonlight threads. Provides mystical protection.',
        rarity: 'rare',
        advantages: {
            regeneration: 2, // Regenerate 2 HP per turn
            dodgeChance: 12 // 12% chance to dodge attacks
        }
    },

    ballistic_armor: {
        id: 'ballistic_armor',
        name: 'Binance Shield Plating',
        defenseBonus: 16,
        price: 2000,
        minLevel: 7,
        description: 'Forged in Binance Labs. Yellow armor that reflects attacks like BNB reflects value.',
        rarity: 'rare',
        advantages: {
            thorns: 3, // Reflect 3 damage back to attacker
            damageReduction: 10 // 10% additional damage reduction
        }
    },

    cyber_exosuit: {
        id: 'cyber_exosuit',
        name: 'Cyber-Enhanced Exosuit',
        defenseBonus: 19,
        price: 2800,
        minLevel: 8,
        description: 'Advanced exoskeleton armor with integrated shields. Military grade protection.',
        rarity: 'rare',
        advantages: {
            regeneration: 3, // Regenerate 3 HP per turn
            thorns: 5, // Reflect 5 damage back to attacker
            damageReduction: 12 // 12% additional damage reduction
        }
    },

    nano_weave_suit: {
        id: 'nano_weave_suit',
        name: 'Smart Contract Chainmail',
        defenseBonus: 22,
        price: 4500,
        minLevel: 9,
        description: 'Self-executing defense protocols. Heals itself like a well-coded smart contract.',
        rarity: 'epic',
        advantages: {
            regeneration: 5, // Regenerate 5 HP per turn
            damageReduction: 15 // 15% additional damage reduction
        }
    },

    champion_cloak: {
        id: 'champion_cloak',
        name: 'Cloak of the SAFU Guardian',
        defenseBonus: 30,
        price: 12000,
        minLevel: 12,
        description: 'Legendary cloak blessed by CZ. "Your funds AND your life are SAFU."',
        rarity: 'legendary',
        advantages: {
            regeneration: 10, // Regenerate 10 HP per turn
            counterAttack: 25, // 25% chance to counter attack
            dodgeChance: 20 // 20% chance to dodge attacks
        }
    },

    // LEVEL 20-30 ARMOR
    void_plate: {
        id: 'void_plate',
        name: 'Void Plate Armor',
        defenseBonus: 38,
        price: 20000,
        minLevel: 20,
        description: 'Armor forged from void crystals. Absorbs damage into nothingness.',
        rarity: 'legendary',
        advantages: {
            regeneration: 12,
            damageReduction: 20,
            thorns: 8,
            dodgeChance: 25
        }
    },

    dragon_scales: {
        id: 'dragon_scales',
        name: 'Ancient Dragon Scales',
        defenseBonus: 45,
        price: 28000,
        minLevel: 25,
        description: 'Scales shed by an ancient dragon. Nearly impenetrable.',
        rarity: 'legendary',
        advantages: {
            regeneration: 15,
            damageReduction: 25,
            thorns: 12,
            fireResist: 50 // 50% fire damage reduction
        }
    },

    // LEVEL 30-40 ARMOR
    chaos_armor: {
        id: 'chaos_armor',
        name: 'Chaos Warden Armor',
        defenseBonus: 55,
        price: 50000,
        minLevel: 30,
        description: 'Armor infused with chaos magic. Unpredictable and unbreakable.',
        rarity: 'mythic',
        advantages: {
            regeneration: 18,
            damageReduction: 30,
            thorns: 15,
            dodgeChance: 30,
            chaosShield: 20 // 20% chance to nullify all damage
        }
    },

    cosmic_aegis: {
        id: 'cosmic_aegis',
        name: 'Cosmic Aegis',
        defenseBonus: 68,
        price: 80000,
        minLevel: 35,
        description: 'A shield from beyond the stars. Reality itself protects you.',
        rarity: 'mythic',
        advantages: {
            regeneration: 22,
            damageReduction: 35,
            thorns: 20,
            dodgeChance: 35,
            cosmicBarrier: 25 // 25% chance to reflect all damage
        }
    },

    // LEVEL 40+ ARMOR
    immortal_bulwark: {
        id: 'immortal_bulwark',
        name: 'Immortal Bulwark',
        defenseBonus: 85,
        price: 130000,
        minLevel: 40,
        description: 'Armor of the gods. Death itself cannot penetrate its defenses.',
        rarity: 'mythic',
        advantages: {
            regeneration: 28,
            damageReduction: 40,
            thorns: 25,
            dodgeChance: 40,
            revive: 10 // 10% chance to revive with 50% HP if defeated
        }
    },

    absolute_fortress: {
        id: 'absolute_fortress',
        name: 'Absolute Fortress',
        defenseBonus: 100,
        price: 220000,
        minLevel: 45,
        description: 'The pinnacle of protection. An immovable object made manifest.',
        rarity: 'mythic',
        advantages: {
            regeneration: 35,
            damageReduction: 50,
            thorns: 30,
            dodgeChance: 45,
            ironWill: 30, // 30% chance to reduce damage to 1
            revive: 20 // 20% chance to revive with 75% HP
        }
    }
};

// POTIONS - Magical and Medicinal Items (Crime Lizard Edition!)
export const POTIONS: Record<string, Potion> = {
    health_potion_small: {
        id: 'health_potion_small',
        name: 'Lesser Lizard Elixir',
        description: 'Basic healing tonic brewed by street alchemists. Restores 50 HP.',
        emoji: '🧪',
        effect: {
            type: 'heal',
            value: 50,
            target: 'self'
        },
        price: 25,
        minLevel: 1,
        rarity: 'common'
    },

    health_potion_medium: {
        id: 'health_potion_medium',
        name: 'BNB Regeneration Brew',
        description: 'Yellow healing potion infused with BNB energy. Restores 100 HP.',
        emoji: '🧪',
        effect: {
            type: 'heal',
            value: 100,
            target: 'self'
        },
        price: 75,
        minLevel: 3,
        rarity: 'uncommon'
    },

    health_potion_large: {
        id: 'health_potion_large',
        name: 'Greater SAFU Potion',
        description: 'CZ-approved healing magic. "Your health is SAFU." Restores 200 HP.',
        emoji: '🧪',
        effect: {
            type: 'heal',
            value: 200,
            target: 'self'
        },
        price: 200,
        minLevel: 5,
        rarity: 'rare'
    },

    strength_elixir: {
        id: 'strength_elixir',
        name: 'Bull Market Tonic',
        description: 'Pump your strength to the moon! +20 attack for 3 turns.',
        emoji: '💪',
        effect: {
            type: 'buff',
            value: 20,
            duration: 3,
            target: 'self'
        },
        price: 150,
        minLevel: 4,
        rarity: 'uncommon'
    },

    defense_potion: {
        id: 'defense_potion',
        name: 'Diamond Hands Potion',
        description: 'Hardens your resolve and armor. +15 defense for 4 turns.',
        emoji: '🛡️',
        effect: {
            type: 'buff',
            value: 15,
            duration: 4,
            target: 'self'
        },
        price: 120,
        minLevel: 4,
        rarity: 'uncommon'
    },

    phoenix_feather: {
        id: 'phoenix_feather',
        name: 'Aster Phoenix Token',
        description: 'Legendary Aster Protocol artifact. Revives fallen heroes once per battle.',
        emoji: '🔥',
        effect: {
            type: 'revive',
            value: 50, // Revive to 50% HP
            target: 'self'
        },
        price: 1000,
        minLevel: 8,
        rarity: 'epic'
    },

    poison_antidote: {
        id: 'poison_antidote',
        name: 'Anti-FUD Serum',
        description: 'Cleanses your system of toxins and FUD. Cures poison effects.',
        emoji: '🧴',
        effect: {
            type: 'heal',
            value: 0, // Special effect - cure poison
            target: 'self'
        },
        price: 50,
        minLevel: 2,
        rarity: 'common'
    }
};

// ACCESSORIES - Special items with bonuses (Crime Lizard + Crypto themed!)
export const ACCESSORIES: Record<string, any> = {
    // Enemy Drops
    safu_amulet: {
        id: 'safu_amulet',
        name: 'SAFU Amulet',
        description: '🔶 A blessed amulet from CZ himself. "Funds are SAFU" is engraved on it.',
        emoji: '🔶',
        bonuses: {
            goldBonus: 25, // +25% gold from all sources
            defense: 10,
            luck: 5
        },
        rarity: 'legendary',
        lore: 'Blessed by the Wanderer in Yellow. Protects your gold like Binance protects funds.'
    },

    binance_blessing: {
        id: 'binance_blessing',
        name: 'Binance Blessing',
        description: '⚡ A magical buff that lasts 24 hours. +10% to all stats!',
        emoji: '⚡',
        bonuses: {
            health: 50,
            strength: 5,
            defense: 5,
            xpBonus: 10,
            goldBonus: 10
        },
        rarity: 'legendary',
        lore: 'The power of BNB Chain flows through you.'
    },

    bnb_shard: {
        id: 'bnb_shard',
        name: 'BNB Shard',
        description: '💎 A glowing yellow crystal shard pulsing with blockchain energy.',
        emoji: '💎',
        bonuses: {
            goldBonus: 15,
            xpBonus: 10
        },
        rarity: 'rare',
        lore: 'Fragments of pure BNB energy. Enhances all gains.'
    },

    bnb_core: {
        id: 'bnb_core',
        name: 'BNB Core',
        description: '🔥 The heart of a BNB Chain Golem. Radiates immense power.',
        emoji: '🔥',
        bonuses: {
            health: 100,
            strength: 10,
            defense: 10
        },
        rarity: 'epic',
        lore: 'The crystallized essence of Binance Smart Chain.'
    },

    dragon_scale: {
        id: 'dragon_scale',
        name: 'Dragon Scale',
        description: '🐉 An iridescent scale from a mighty dragon. Incredibly durable.',
        emoji: '🐉',
        bonuses: {
            defense: 15
        },
        rarity: 'epic',
        lore: 'Can be used for crafting legendary armor.'
    },

    fire_crystal: {
        id: 'fire_crystal',
        name: 'Fire Crystal',
        description: '🔥 A burning red crystal that never cools.',
        emoji: '🔥',
        bonuses: {
            strength: 10
        },
        rarity: 'rare',
        lore: 'Enhances weapon damage with fire energy.'
    },

    void_crystal: {
        id: 'void_crystal',
        name: 'Void Crystal',
        description: '🌑 A dark crystal from the Shadow Realm. Absorbs light.',
        emoji: '🌑',
        bonuses: {
            strength: 15,
            luck: 10
        },
        rarity: 'epic',
        lore: 'Channels shadow magic to empower your attacks.'
    },

    shadow_scale: {
        id: 'shadow_scale',
        name: 'Shadow Dragon Scale',
        description: '🌑 A scale from the Shadow Dragon Lord. Darker than night.',
        emoji: '🌑',
        bonuses: {
            defense: 20,
            luck: 5
        },
        rarity: 'legendary',
        lore: 'The ultimate defensive material.'
    },

    // Crafting Materials
    legendary_weapon_fragment: {
        id: 'legendary_weapon_fragment',
        name: 'Legendary Weapon Fragment',
        description: '⚔️ A piece of an ancient legendary weapon.',
        emoji: '⚔️',
        bonuses: {
            strength: 5
        },
        rarity: 'legendary',
        lore: 'Collect 3 fragments to forge a legendary weapon.'
    },

    witch_staff: {
        id: 'witch_staff',
        name: 'Witch\'s Staff (Material)',
        description: '🪄 A gnarled staff crackling with chaotic magic.',
        emoji: '🪄',
        bonuses: {
            luck: 15
        },
        rarity: 'rare',
        lore: 'Can be used for crafting magical weapons.'
    },

    ogre_club: {
        id: 'ogre_club',
        name: 'Ogre Club',
        description: '🦴 A massive club from an Ogre Whale. Smells like money.',
        emoji: '🦴',
        bonuses: {
            strength: 20,
            health: -10 // Heavy!
        },
        rarity: 'rare',
        lore: 'Brutally effective but weighs you down.'
    },

    // Boss Drops
    sorcerer_staff: {
        id: 'sorcerer_staff',
        name: 'Dark Sorcerer\'s Staff',
        description: '🪄 The ultimate weapon of dark magic. Glows with purple energy.',
        emoji: '🪄',
        bonuses: {
            strength: 25,
            luck: 20,
            goldBonus: 50
        },
        rarity: 'legendary',
        lore: 'The staff of the Dark Sorcerer himself. Radiates immense power.'
    },

    dark_crown: {
        id: 'dark_crown',
        name: 'Crown of the Dark Sorcerer',
        description: '👑 A crown of pure darkness. Whispers secrets of power.',
        emoji: '👑',
        bonuses: {
            health: 200,
            strength: 20,
            defense: 20,
            xpBonus: 25,
            goldBonus: 25
        },
        rarity: 'legendary',
        lore: 'Wearing this crown makes you feel like royalty... evil royalty.'
    },

    ultimate_power: {
        id: 'ultimate_power',
        name: 'Ultimate Power Essence',
        description: '💫 Pure concentrated power from defeating the Dark Sorcerer.',
        emoji: '💫',
        bonuses: {
            health: 100,
            strength: 30,
            defense: 30,
            luck: 30,
            xpBonus: 50,
            goldBonus: 50
        },
        rarity: 'legendary',
        lore: 'You have become a legend. This is the ultimate prize.'
    },

    // Quest Rewards
    dragon_gold: {
        id: 'dragon_gold',
        name: 'Dragon Hoard Coin',
        description: '🪙 An ancient gold coin from a dragon\'s hoard.',
        emoji: '🪙',
        bonuses: {
            goldBonus: 20
        },
        rarity: 'epic',
        lore: 'Dragons know how to pick the best treasure.'
    },

    chain_armor: {
        id: 'chain_armor',
        name: 'BNB Chain Mail',
        description: '⛓️ Armor forged from the essence of BNB Chain itself.',
        emoji: '⛓️',
        bonuses: {
            defense: 25,
            health: 50
        },
        rarity: 'epic',
        lore: 'As unbreakable as the blockchain.'
    },

    // Robin Hood themed
    robinhood_hat: {
        id: 'robinhood_hat',
        name: 'Robin Hood\'s Hat',
        description: '🎩 The iconic green cap of the legendary thief.',
        emoji: '🎩',
        bonuses: {
            luck: 25,
            goldBonus: 15,
            charm: 10
        },
        rarity: 'legendary',
        lore: 'Wearing this makes the poor love you even more.'
    },

    // Crypto Legend Drops
    genesis_block: {
        id: 'genesis_block',
        name: 'Genesis Block Fragment',
        description: '₿ A piece of the very first Bitcoin block. Priceless.',
        emoji: '₿',
        bonuses: {
            health: 100,
            strength: 20,
            defense: 20,
            goldBonus: 100,
            xpBonus: 50
        },
        rarity: 'legendary',
        lore: 'The beginning of it all. "Chancellor on brink of second bailout for banks."'
    },

    bitcoin_medallion: {
        id: 'bitcoin_medallion',
        name: 'Bitcoin Medallion',
        description: '🟠 A golden medallion with the Bitcoin symbol.',
        emoji: '🟠',
        bonuses: {
            goldBonus: 50,
            luck: 25,
            strength: 15
        },
        rarity: 'legendary',
        lore: 'Worn by true Bitcoin believers. Orange pill energy.'
    },

    satoshi_whitepaper: {
        id: 'satoshi_whitepaper',
        name: 'Satoshi\'s Whitepaper',
        description: '📄 The original Bitcoin whitepaper. Knowledge is power.',
        emoji: '📄',
        bonuses: {
            xpBonus: 75,
            luck: 30,
            goldBonus: 25
        },
        rarity: 'legendary',
        lore: 'Bitcoin: A Peer-to-Peer Electronic Cash System.'
    },

    ethereum_crystal: {
        id: 'ethereum_crystal',
        name: 'Ethereum Crystal',
        description: '⟠ A purple crystal containing smart contract code.',
        emoji: '⟠',
        bonuses: {
            strength: 18,
            defense: 18,
            luck: 20,
            xpBonus: 30
        },
        rarity: 'legendary',
        lore: 'The power of the world computer in crystalline form.'
    },

    vitalik_wisdom: {
        id: 'vitalik_wisdom',
        name: 'Vitalik\'s Wisdom',
        description: '🧠 Ancient knowledge of smart contracts and DeFi.',
        emoji: '🧠',
        bonuses: {
            xpBonus: 60,
            luck: 25,
            goldBonus: 30
        },
        rarity: 'legendary',
        lore: '"The Internet of Value" - Vitalik Buterin'
    },

    gas_token: {
        id: 'gas_token',
        name: 'Infinite Gas Token',
        description: '⛽ Never worry about gas fees again.',
        emoji: '⛽',
        bonuses: {
            goldBonus: 40,
            xpBonus: 20,
            luck: 15
        },
        rarity: 'epic',
        lore: 'Unlimited transactions. The dream of every DeFi degen.'
    },

    builders_hammer: {
        id: 'builders_hammer',
        name: 'Builder\'s Hammer',
        description: '🔨 The tool of those who BUIDL instead of talk.',
        emoji: '🔨',
        bonuses: {
            strength: 25,
            health: 50,
            xpBonus: 25
        },
        rarity: 'legendary',
        lore: 'Stop talking, start BUIDLING!'
    },

    buidl_badge: {
        id: 'buidl_badge',
        name: 'BUIDL Badge',
        description: '🏗️ Proof that you\'re a real builder.',
        emoji: '🏗️',
        bonuses: {
            xpBonus: 40,
            goldBonus: 20,
            luck: 20
        },
        rarity: 'epic',
        lore: 'Recognized by builders everywhere.'
    },

    binance_crown: {
        id: 'binance_crown',
        name: 'Crown of Binance',
        description: '👑 The golden crown of the world\'s largest exchange.',
        emoji: '👑',
        bonuses: {
            health: 150,
            strength: 25,
            defense: 25,
            goldBonus: 75,
            xpBonus: 50,
            luck: 30
        },
        rarity: 'legendary',
        lore: 'Worn by CZ himself. Ultimate power and prestige.'
    },

    coinbase_badge: {
        id: 'coinbase_badge',
        name: 'Coinbase Badge',
        description: '🔵 Official badge from America\'s crypto exchange.',
        emoji: '🔵',
        bonuses: {
            defense: 20,
            goldBonus: 40,
            xpBonus: 30,
            luck: 15
        },
        rarity: 'legendary',
        lore: 'Institutional-grade legitimacy.'
    },

    institutional_armor: {
        id: 'institutional_armor',
        name: 'Institutional Armor',
        description: '🛡️ Protected by Wall Street money.',
        emoji: '🛡️',
        bonuses: {
            defense: 30,
            health: 100,
            goldBonus: 35
        },
        rarity: 'epic',
        lore: 'When traditional finance meets crypto.'
    },

    blue_chip_token: {
        id: 'blue_chip_token',
        name: 'Blue Chip Token',
        description: '💎 A token representing institutional trust.',
        emoji: '💎',
        bonuses: {
            goldBonus: 50,
            luck: 20
        },
        rarity: 'epic',
        lore: 'The safe bet in crypto.'
    },

    laser_eyes_relic: {
        id: 'laser_eyes_relic',
        name: 'Laser Eyes Relic',
        description: '👁️ Orange laser eyes that pierce FUD.',
        emoji: '👁️',
        bonuses: {
            strength: 30,
            luck: 25,
            goldBonus: 45
        },
        rarity: 'legendary',
        lore: '#LaserRayUntil100K'
    },

    orange_pill: {
        id: 'orange_pill',
        name: 'The Orange Pill',
        description: '🟠 Take it and see how deep the Bitcoin rabbit hole goes.',
        emoji: '🟠',
        bonuses: {
            xpBonus: 50,
            goldBonus: 40,
            luck: 30,
            strength: 20
        },
        rarity: 'legendary',
        lore: 'Once you take it, there\'s no going back. Bitcoin only.'
    }
};

// AI PERSONALITIES - NPCs in the game world
export const AI_PERSONALITIES: Record<string, AIPersonality> = {
    whisper: {
        id: 'whisper',
        name: 'Whisper',
        role: 'informant',
        baseDialogue: [
            "Psst... I got information for the right price.",
            "The streets talk to those who listen...",
            "I know things. Things that could help you.",
            "Trust is earned, not bought. But information? That's for sale."
        ],
        mood: 'mysterious',
        relationshipThreshold: 0
    },

    jade: {
        id: 'jade',
        name: 'Jade',
        role: 'ally',
        baseDialogue: [
            "Back again? The poor need your help, lizard.",
            "You're doing good work out there. Keep it up.",
            "Every coin you steal from the rich makes a difference.",
            "The people believe in you. Don't let them down."
        ],
        mood: 'friendly',
        relationshipThreshold: 25
    },

    viper: {
        id: 'viper',
        name: 'Viper',
        role: 'rival',
        baseDialogue: [
            "You think you're the only thief in this city?",
            "One day, lizard, we'll settle this.",
            "You're good, but I'm better.",
            "Stay out of my territory."
        ],
        mood: 'hostile',
        relationshipThreshold: -25
    },

    oldman_grey: {
        id: 'oldman_grey',
        name: 'Old Man Grey',
        role: 'quest_giver',
        baseDialogue: [
            "Ah, the famous Crime Lizard. I have a proposition for you.",
            "Help an old man out, and I'll make it worth your while.",
            "These old bones remember when this city was different...",
            "The Crime Lord must be stopped. Will you help?"
        ],
        mood: 'neutral',
        relationshipThreshold: 10
    },

    marcus: {
        id: 'marcus',
        name: 'Marcus the Smith',
        role: 'merchant',
        baseDialogue: [
            "Need better gear? I got what you need.",
            "Quality weapons for quality work.",
            "Your money's good here, Crime Lizard.",
            "Fighting the good fight requires good tools."
        ],
        mood: 'friendly',
        relationshipThreshold: 0
    },

    vex_liquidator: {
        id: 'vex_liquidator',
        name: 'Vex the Liquidator',
        role: 'quest_giver',
        baseDialogue: [
            "Collateral ratios don't lie, lizard. Someone's underwater.",
            "The protocol must be enforced. Underwater positions must be liquidated.",
            "DeFi demands discipline. Help me enforce the protocol.",
            "There's a 10% liquidation bonus if you can recover the debt.",
            "Markets are ruthless. Someone over-leveraged and now they owe."
        ],
        mood: 'neutral',
        relationshipThreshold: 0
    },

    gribnak_shopkeeper: {
        id: 'gribnak_shopkeeper',
        name: 'Gribnak',
        role: 'merchant',
        baseDialogue: [
            "Ssssalutations! What can Gribnak get for you today?",
            "Ah, a customer! Gribnak lovesss visitors!",
            "Welcome to The Scaly Satchel! Everything you need!",
            "Hssss! Good to see you, friend! How can I help?",
            "Gribnak's shop is open for business! Gold, goods, or gossip?"
        ],
        mood: 'friendly',
        relationshipThreshold: 0
    }
};

// LEVEL PROGRESSION - Extended to Level 50
export const LEVEL_REQUIREMENTS = [
    0,        // Level 1
    100,      // Level 2
    250,      // Level 3
    500,      // Level 4
    850,      // Level 5
    1300,     // Level 6
    1900,     // Level 7
    2700,     // Level 8
    3700,     // Level 9
    5000,     // Level 10
    6800,     // Level 11
    9000,     // Level 12
    12000,    // Level 13
    16000,    // Level 14
    21000,    // Level 15
    28000,    // Level 16
    37000,    // Level 17
    48000,    // Level 18
    62000,    // Level 19
    80000,    // Level 20
    100000,   // Level 21
    125000,   // Level 22
    155000,   // Level 23
    190000,   // Level 24
    235000,   // Level 25
    290000,   // Level 26
    355000,   // Level 27
    430000,   // Level 28
    520000,   // Level 29
    625000,   // Level 30
    750000,   // Level 31
    895000,   // Level 32
    1065000,  // Level 33
    1265000,  // Level 34
    1500000,  // Level 35
    1775000,  // Level 36
    2095000,  // Level 37
    2465000,  // Level 38
    2890000,  // Level 39
    3380000,  // Level 40
    3945000,  // Level 41
    4595000,  // Level 42
    5340000,  // Level 43
    6195000,  // Level 44
    7175000,  // Level 45
    8295000,  // Level 46
    9575000,  // Level 47
    11035000, // Level 48
    12695000, // Level 49
    14575000  // Level 50 (Max)
];

// STAT GAINS PER LEVEL
export const STAT_GAINS_PER_LEVEL = {
    health: 10,
    strength: 2,
    defense: 2,
    charm: 1
};

// GAME CONSTANTS
export const GAME_CONSTANTS = {
    STARTING_GOLD: 50,
    STARTING_HEALTH: 50,
    STARTING_STRENGTH: 5,
    STARTING_DEFENSE: 5,
    STARTING_CHARM: 5,
    DAILY_TURNS: 100,
    MAX_TURNS: 100,
    HEALER_COST_PER_HP: 3,
    BANK_INTEREST_RATE: 0.05, // 5% daily
    PVP_GOLD_STAKE: 100,
    POOR_DISTRICT_DONATION_MIN: 10,
    TURN_RESET_HOUR: 0, // Midnight
    MAX_LEVEL: 50,
    // Enemy Scaling Constants
    ENEMY_SCALING_ENABLED: true,
    ENEMY_SCALING_START_LEVEL: 16, // Start scaling enemies at level 16
    ENEMY_SCALING_MULTIPLIER: 0.15, // 15% increase per level above enemy base level
    // Turn Cost Scaling (makes high-level combat more expensive)
    TURN_COST_SCALING_ENABLED: true,
    TURN_COST_LEVEL_20_THRESHOLD: 20, // Enemies level 20+ cost 2 turns per attack
    TURN_COST_LEVEL_30_THRESHOLD: 30, // Enemies level 30+ cost 3 turns per attack
    TURN_COST_BOSS_MULTIPLIER: 5, // Boss fights cost 5 turns per attack
    // Death/Respawn System
    DEATH_ENABLED: true,
    DEATH_RESPAWN_LOCATION: 'town', // Where player respawns
    DEATH_GOLD_LOSS_PERCENT: 0.25, // Lose 25% of carried gold
    DEATH_XP_LOSS_PERCENT: 0.10, // Lose 10% of current level XP
    DEATH_RESPAWN_HP_PERCENT: 0.30, // Respawn with 30% HP
    DEATH_RESPAWN_COOLDOWN_TURNS: 5, // Lose 5 turns on death
    // Enemy Critical Hit System
    ENEMY_CRIT_ENABLED: true,
    ENEMY_CRIT_BASE_CHANCE: 15, // 15% base crit chance for all enemies
    ENEMY_CRIT_DAMAGE_MULTIPLIER: 2.5, // Crits deal 2.5x damage
    ENEMY_BOSS_CRIT_CHANCE: 25, // Bosses have 25% crit chance
    ENEMY_ELITE_CRIT_CHANCE: 20, // Epic/Legendary enemies have 20% crit chance
    // Save State Constants
    SAVE_STATE_COST: 500, // Gold cost for saving game state
    SAVE_STATE_MAX_SLOTS: 3, // Maximum number of save slots per player
    SAVE_STATE_DURATION: 7, // Days until save expires
    SAVE_STATE_RESTORE_HEALTH_PERCENT: 100, // Restore to full health on load
    SAVE_STATE_RESTORE_TURNS: false, // Don't restore turns when loading save

    // Sleep/Safe Save Constants - DYNAMIC PRICING
    INN_SLEEP_BASE_COST: 50, // Base gold to sleep at inn (level 1-4)
    BROTHEL_SLEEP_BASE_COST: 100, // Base gold to sleep at brothel (level 1-4)
    INN_SLEEP_LEVEL_MULTIPLIER: 15, // Additional gold per level (starting at level 5)
    BROTHEL_SLEEP_LEVEL_MULTIPLIER: 25, // Additional gold per level (starting at level 5)
    SLEEP_SCALING_STARTS_AT_LEVEL: 5, // Level when pricing starts scaling
    GANKING_BASE_CHANCE: 0.25, // 25% chance of being ganked if not sleeping safely
    GANKING_GOLD_LOSS_MIN: 0.1, // Lose minimum 10% of carried gold
    GANKING_GOLD_LOSS_MAX: 0.3, // Lose maximum 30% of carried gold
    BROTHEL_HEALTH_BONUS: 10, // Extra max health from brothel rest
    BROTHEL_STAT_BONUS: 1, // +1 to random stat from brothel rest

    // Bank Loan System
    LOAN_MIN_AMOUNT: 100, // Minimum loan amount
    LOAN_MAX_AMOUNT: 5000, // Maximum loan amount
    LOAN_INTEREST_RATE: 0.10, // 10% daily interest on unpaid loans
    LOAN_MAX_DURATION_DAYS: 7, // Maximum loan duration (7 days)
    LOAN_DEFAULT_PENALTY_XP: 50, // XP lost per day when defaulting
    LOAN_DEFAULT_PENALTY_LEVEL_THRESHOLD: 200, // XP debt before losing a level
    LOAN_COLLECTION_FEE: 0.25, // 25% fee on top of owed amount when forced collection happens
    BANK_DAILY_INTEREST_RATE: 0.05 // 5% daily interest on deposits (already defined but ensuring consistency)
};

// Location descriptions - LORD Style
export const LOCATION_DESCRIPTIONS: Record<string, { name: string; description: string; emoji: string }> = {
    town: {
        name: 'Town Square',
        emoji: '🏛️',
        description: 'The bustling center of town. Various shops and services are available here.'
    },
    forest: {
        name: 'The Dark Forest',
        emoji: '🌲',
        description: 'A dangerous forest filled with monsters and beasts. Hunt here to gain gold and experience!'
    },
    healer: {
        name: 'Healer\'s Hut',
        emoji: '⚕️',
        description: 'Restore your health here for a price.'
    },
    bank: {
        name: 'The Scaly Satchel',
        emoji: '🦎',
        description: 'Gribnak\'s shop! Buy weapons, armor, turns, bags, manage your gold, and take loans. Everything you need!'
    },
    inn: {
        name: 'The Inn',
        emoji: '🏨',
        description: 'Sleep here to protect your gold from thieves and restore your daily turns.'
    },
    player_list: {
        name: 'Player List',
        emoji: '📜',
        description: 'View other players in the realm. Attack those who didn\'t sleep at the inn!'
    },
    daily_news: {
        name: 'Daily News',
        emoji: '📰',
        description: 'Read the latest happenings in the realm.'
    },
    arena: {
        name: 'Arena',
        emoji: '⚔️',
        description: 'Challenge other players to honorable combat!'
    },
    poor_district: {
        name: 'The Rekt District (Sonic)',
        emoji: '💀',
        description: 'Where rugged lizards gather. Donate your gains to help degens who got rekt.'
    },
    boss_queue: {
        name: 'Boss Queue',
        emoji: '👥',
        description: 'Team up with others to defeat powerful bosses!'
    },
    brothel: {
        name: 'Violet\'s Brothel',
        emoji: '💋',
        description: 'A night of pleasure grants stat bonuses and premium protection.'
    },
    casino: {
        name: 'Crime Lizard Casino',
        emoji: '🎰',
        description: 'Try your luck at the slots! Win gold and bonus experience with every spin.'
    },
    castle: {
        name: 'The Castle',
        emoji: '🏰',
        description: 'Target wealthy nobles for big heists. Guarded by elite knights.'
    },
    crime_lord_lair: {
        name: 'Crime Lord\'s Lair',
        emoji: '👹',
        description: 'Face the ultimate evil! Only the strongest dare enter.'
    },
    // New expanded locations for richer RPG experience
    enchanted_forest: {
        name: 'Enchanted Forest',
        emoji: '🌲',
        description: 'A mystical forest filled with magical creatures and ancient secrets. Rumors speak of powerful artifacts hidden within.'
    },
    dragon_mountains: {
        name: 'Dragon Mountains',
        emoji: '🏔️',
        description: 'Towering peaks where dragons once roamed. Now home to bandits, golems, and legendary treasures.'
    },
    underwater_city: {
        name: 'Sunken City',
        emoji: '🏊‍♂️',
        description: 'An ancient underwater civilization. Requires special equipment to explore its depths.'
    },
    shadow_realm: {
        name: 'Shadow Realm',
        emoji: '🌑',
        description: 'A dangerous dimension where nightmares come to life. Only the bravest dare enter.'
    },
    crystal_caves: {
        name: 'Crystal Caves',
        emoji: '💎',
        description: 'Glowing caves filled with precious crystals and rare minerals. Home to crystal golems.'
    },
    pirate_cove: {
        name: 'Pirate Cove',
        emoji: '🏴‍☠️',
        description: 'A hidden cove where pirates gather. Treasure maps and sea monsters await.'
    },
    elven_enclave: {
        name: 'Elven Enclave',
        emoji: '🏹',
        description: 'A hidden elven village in the treetops. The elves guard ancient wisdom and powerful artifacts.'
    },
    dwarven_mines: {
        name: 'Dwarven Mines',
        emoji: '⛏️',
        description: 'Deep underground mines where dwarves craft legendary weapons. Danger lurks in the darkness.'
    },
    magic_academy: {
        name: 'Magic Academy',
        emoji: '🎓',
        description: 'A school of magic where wizards train. Knowledge and magical artifacts can be found here.'
    },
    celestial_tower: {
        name: 'Celestial Tower',
        emoji: '🏰',
        description: 'A tower that reaches the heavens. Angels and celestial beings guard its secrets.'
    },
    quest_board: {
        name: 'Quest Board',
        emoji: '📜',
        description: 'Browse available quests, form heist crews, and embark on epic adventures throughout the realm!'
    }
};

// Random events that can occur on the streets
export const RANDOM_EVENTS = {
    mysterious_stranger: {
        title: 'Mysterious Stranger',
        description: 'A hooded figure approaches you in the shadows...',
        outcomes: ['gold', 'item', 'information', 'ambush']
    },
    police_patrol: {
        title: 'Police Patrol',
        description: 'You spot a police patrol ahead. They haven\'t seen you yet.',
        outcomes: ['escape', 'fight', 'bribe']
    },
    wealthy_target: {
        title: 'Wealthy Target',
        description: 'A rich merchant walks by, flaunting their wealth.',
        outcomes: ['steal', 'intimidate', 'ignore']
    },
    beggar: {
        title: 'Beggar',
        description: 'A homeless person asks for help.',
        outcomes: ['give_gold', 'ignore', 'talk']
    }
};

// Enhanced Quest System
export interface Quest {
    id: string;
    title: string;
    description: string;
    giver: string; // NPC who gives the quest
    location: string; // Where the quest takes place
    type: 'main' | 'side' | 'daily' | 'achievement';
    requirements: {
        minLevel?: number;
        minReputation?: number;
        prerequisites?: string[]; // Other quest IDs that must be completed
        items?: string[]; // Required items
    };
    objectives: QuestObjective[];
    rewards: {
        gold?: number;
        experience?: number;
        items?: string[];
        reputation?: number;
        title?: string;
    };
    timeLimit?: number; // Hours to complete
    difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
}

export interface QuestObjective {
    id: string;
    description: string;
    type: 'kill' | 'collect' | 'explore' | 'talk' | 'deliver' | 'protect';
    target: string;
    amount: number;
    currentAmount?: number;
}

// Comprehensive Quest Database
export const QUESTS: Record<string, Quest> = {
    // Main Story Quests
    first_heist: {
        id: 'first_heist',
        title: 'The First Heist',
        description: 'Steal from your first wealthy target to prove your worth as a Crime Lizard.',
        giver: 'Whisper',
        location: 'streets',
        type: 'main',
        requirements: { minLevel: 1 },
        objectives: [
            {
                id: 'steal_gold',
                description: 'Steal 100 gold from wealthy targets',
                type: 'collect',
                target: 'gold_from_rich',
                amount: 100
            }
        ],
        rewards: {
            gold: 50,
            experience: 100,
            reputation: 10,
            items: ['rusty_knife']
        },
        difficulty: 'easy'
    },

    poor_district_hero: {
        id: 'poor_district_hero',
        title: 'Hero of the Poor',
        description: 'The poor district needs a champion. Help the downtrodden by donating your stolen wealth.',
        giver: 'Jade',
        location: 'poor_district',
        type: 'main',
        requirements: { minLevel: 2, minReputation: 10 },
        objectives: [
            {
                id: 'donate_gold',
                description: 'Donate 200 gold to the poor',
                type: 'collect',
                target: 'gold_donated',
                amount: 200
            }
        ],
        rewards: {
            gold: 0,
            experience: 250,
            reputation: 25,
            title: 'Friend of the Poor'
        },
        difficulty: 'easy'
    },

    gang_war: {
        id: 'gang_war',
        title: 'Gang War',
        description: 'Rival gangs are fighting for control of the streets. Choose a side and help them win.',
        giver: 'Whisper',
        location: 'streets',
        type: 'side',
        requirements: { minLevel: 3 },
        objectives: [
            {
                id: 'defeat_gang_members',
                description: 'Defeat 10 gang enforcers',
                type: 'kill',
                target: 'gang_enforcer',
                amount: 10
            }
        ],
        rewards: {
            gold: 300,
            experience: 400,
            reputation: 15
        },
        difficulty: 'medium'
    },

    enchanted_forest_mystery: {
        id: 'enchanted_forest_mystery',
        title: 'The Enchanted Forest Mystery',
        description: 'Strange lights have been seen in the enchanted forest. Investigate and uncover the source.',
        giver: 'Old Man Grey',
        location: 'enchanted_forest',
        type: 'side',
        requirements: { minLevel: 5, prerequisites: ['poor_district_hero'] },
        objectives: [
            {
                id: 'explore_forest',
                description: 'Explore the enchanted forest',
                type: 'explore',
                target: 'enchanted_forest',
                amount: 1
            },
            {
                id: 'find_artifact',
                description: 'Find the mysterious artifact',
                type: 'collect',
                target: 'mystic_crystal',
                amount: 1
            }
        ],
        rewards: {
            gold: 500,
            experience: 600,
            items: ['magic_crystal']
        },
        difficulty: 'medium'
    },

    dragon_hunter: {
        id: 'dragon_hunter',
        title: 'Dragon Hunter',
        description: 'A dragon has been terrorizing nearby villages. Slay the beast and claim its hoard.',
        giver: 'Marcus the Smith',
        location: 'dragon_mountains',
        type: 'side',
        requirements: { minLevel: 8, minReputation: 50 },
        objectives: [
            {
                id: 'defeat_dragon',
                description: 'Defeat the Dragon of Greed',
                type: 'kill',
                target: 'dragon_of_greed',
                amount: 1
            }
        ],
        rewards: {
            gold: 2000,
            experience: 1500,
            items: ['dragon_scale_armor', 'dragon_heart'],
            reputation: 50
        },
        difficulty: 'hard'
    },

    pirate_treasure: {
        id: 'pirate_treasure',
        title: 'Pirate\'s Lost Treasure',
        description: 'A pirate captain has hidden his treasure in the cove. Find it before others do!',
        giver: 'Whisper',
        location: 'pirate_cove',
        type: 'side',
        requirements: { minLevel: 6 },
        objectives: [
            {
                id: 'find_treasure_map',
                description: 'Find a treasure map',
                type: 'collect',
                target: 'treasure_map',
                amount: 1
            },
            {
                id: 'dig_up_treasure',
                description: 'Dig up the buried treasure',
                type: 'explore',
                target: 'buried_treasure',
                amount: 1
            }
        ],
        rewards: {
            gold: 1000,
            experience: 800,
            items: ['pirate_hat', 'cutlass']
        },
        difficulty: 'medium'
    },

    dwarven_forge: {
        id: 'dwarven_forge',
        title: 'The Dwarven Forge',
        description: 'The dwarves need help defending their mines from goblin invaders. Aid them and learn their crafting secrets.',
        giver: 'Dwarven Elder',
        location: 'dwarven_mines',
        type: 'side',
        requirements: { minLevel: 7 },
        objectives: [
            {
                id: 'defeat_goblins',
                description: 'Defeat 15 goblin invaders',
                type: 'kill',
                target: 'goblin_warrior',
                amount: 15
            },
            {
                id: 'deliver_ore',
                description: 'Deliver 10 chunks of mithril ore to the dwarves',
                type: 'deliver',
                target: 'mithril_ore',
                amount: 10
            }
        ],
        rewards: {
            gold: 800,
            experience: 900,
            items: ['mithril_sword', 'dwarven_shield'],
            reputation: 30
        },
        difficulty: 'medium'
    },

    shadow_realm_invasion: {
        id: 'shadow_realm_invasion',
        title: 'Shadow Realm Invasion',
        description: 'Creatures from the shadow realm are leaking into our world. Seal the breach!',
        giver: 'Archmage Elandor',
        location: 'shadow_realm',
        type: 'side',
        requirements: { minLevel: 10, minReputation: 100 },
        objectives: [
            {
                id: 'seal_breaches',
                description: 'Seal 5 shadow breaches',
                type: 'explore',
                target: 'shadow_breach',
                amount: 5
            },
            {
                id: 'defeat_shadow_lord',
                description: 'Defeat the Shadow Lord',
                type: 'kill',
                target: 'shadow_lord',
                amount: 1
            }
        ],
        rewards: {
            gold: 3000,
            experience: 2000,
            items: ['shadow_cloak', 'void_crystal'],
            reputation: 75
        },
        difficulty: 'hard'
    },

    // Daily Quests
    daily_street_cleanup: {
        id: 'daily_street_cleanup',
        title: 'Street Cleanup',
        description: 'Clear the streets of criminals and help maintain peace in the city.',
        giver: 'Guard Captain',
        location: 'streets',
        type: 'daily',
        requirements: { minLevel: 1 },
        objectives: [
            {
                id: 'defeat_criminals',
                description: 'Defeat 5 street criminals',
                type: 'kill',
                target: 'street_criminal',
                amount: 5
            }
        ],
        rewards: {
            gold: 100,
            experience: 150,
            reputation: 5
        },
        timeLimit: 24,
        difficulty: 'easy'
    },

    daily_gold_donation: {
        id: 'daily_gold_donation',
        title: 'Daily Charity',
        description: 'Help those in need by donating some of your hard-earned gold.',
        giver: 'Jade',
        location: 'poor_district',
        type: 'daily',
        requirements: { minLevel: 1 },
        objectives: [
            {
                id: 'donate_daily',
                description: 'Donate 50 gold to the poor',
                type: 'collect',
                target: 'daily_donation',
                amount: 50
            }
        ],
        rewards: {
            experience: 100,
            reputation: 10,
            title: 'Daily Donor'
        },
        timeLimit: 24,
        difficulty: 'easy'
    },

    // Achievement Quests (unlockable content)
    legendary_weapon_crafter: {
        id: 'legendary_weapon_crafter',
        title: 'Legendary Weapon Crafter',
        description: 'Craft a legendary weapon using rare materials gathered from across the realm.',
        giver: 'Marcus the Smith',
        location: 'weapons_shop',
        type: 'achievement',
        requirements: { minLevel: 12, items: ['dragon_scale', 'mithril_ingot', 'void_crystal'] },
        objectives: [
            {
                id: 'craft_legendary_weapon',
                description: 'Craft Justice Bringer, the legendary sword',
                type: 'collect',
                target: 'justice_bringer',
                amount: 1
            }
        ],
        rewards: {
            experience: 3000,
            items: ['justice_bringer'],
            title: 'Legendary Craftsman'
        },
        difficulty: 'legendary'
    }
};

// Quest chains for progressive storytelling
export const QUEST_CHAINS = {
    main_story: [
        'first_heist',
        'poor_district_hero',
        'gang_war',
        'enchanted_forest_mystery',
        'dragon_hunter',
        'shadow_realm_invasion'
    ],
    crafting_path: [
        'dwarven_forge',
        'pirate_treasure',
        'legendary_weapon_crafter'
    ],
    exploration_path: [
        'enchanted_forest_mystery',
        'pirate_treasure',
        'dragon_hunter',
        'shadow_realm_invasion'
    ]
};

// TURN COST UTILITY
/**
 * Calculates how many turns an attack against this enemy should cost
 * @param enemy - The enemy being attacked
 * @returns The number of turns this attack should cost
 */
export function calculateTurnCost(enemy: Enemy): number {
    if (!GAME_CONSTANTS.TURN_COST_SCALING_ENABLED) {
        return 1; // Default: 1 turn per attack
    }

    // Boss fights always cost 5 turns
    if (enemy.rarity === 'boss') {
        return GAME_CONSTANTS.TURN_COST_BOSS_MULTIPLIER;
    }

    // Level-based turn costs
    if (enemy.level >= GAME_CONSTANTS.TURN_COST_LEVEL_30_THRESHOLD) {
        return 3; // Level 30+ enemies cost 3 turns
    } else if (enemy.level >= GAME_CONSTANTS.TURN_COST_LEVEL_20_THRESHOLD) {
        return 2; // Level 20+ enemies cost 2 turns
    }

    return 1; // Default: 1 turn per attack
}

// ENEMY SCALING UTILITY
/**
 * Scales an enemy's stats based on player level to maintain challenge
 * @param enemy - The base enemy to scale
 * @param playerLevel - The player's current level
 * @returns A scaled version of the enemy
 */
export function scaleEnemyToPlayerLevel(enemy: Enemy, playerLevel: number): Enemy {
    // Don't scale if disabled or player is below scaling threshold
    if (!GAME_CONSTANTS.ENEMY_SCALING_ENABLED || playerLevel < GAME_CONSTANTS.ENEMY_SCALING_START_LEVEL) {
        return enemy;
    }

    // Don't scale if enemy is already higher level than player
    if (enemy.level >= playerLevel) {
        return enemy;
    }

    // Calculate level difference and scaling factor
    const levelDifference = playerLevel - enemy.level;
    const scalingFactor = 1 + (levelDifference * GAME_CONSTANTS.ENEMY_SCALING_MULTIPLIER);

    // Create scaled enemy
    const scaledEnemy = { ...enemy };

    // Scale stats (round to integers)
    scaledEnemy.maxHealth = Math.floor(enemy.maxHealth * scalingFactor);
    scaledEnemy.health = scaledEnemy.maxHealth;
    scaledEnemy.strength = Math.floor(enemy.strength * scalingFactor);
    scaledEnemy.defense = Math.floor(enemy.defense * scalingFactor);

    // Scale rewards
    scaledEnemy.goldMin = Math.floor(enemy.goldMin * scalingFactor);
    scaledEnemy.goldMax = Math.floor(enemy.goldMax * scalingFactor);
    scaledEnemy.experienceReward = Math.floor(enemy.experienceReward * scalingFactor);

    // Update level to player level (visual indicator)
    scaledEnemy.level = playerLevel;

    // Add visual indicator that enemy is scaled
    scaledEnemy.name = `${enemy.name} ⚡`;

    return scaledEnemy;
}

// ENEMY CRITICAL HIT UTILITY
/**
 * Calculates if an enemy scores a critical hit and the damage multiplier
 * @param enemy - The enemy attacking
 * @returns Object with isCrit boolean and damage multiplier
 */
export function calculateEnemyCritical(enemy: Enemy): { isCrit: boolean; multiplier: number } {
    if (!GAME_CONSTANTS.ENEMY_CRIT_ENABLED) {
        return { isCrit: false, multiplier: 1 };
    }

    // Determine crit chance based on enemy rarity
    let critChance = GAME_CONSTANTS.ENEMY_CRIT_BASE_CHANCE;

    if (enemy.rarity === 'boss') {
        critChance = GAME_CONSTANTS.ENEMY_BOSS_CRIT_CHANCE;
    } else if (enemy.rarity === 'legendary' || enemy.rarity === 'epic') {
        critChance = GAME_CONSTANTS.ENEMY_ELITE_CRIT_CHANCE;
    }

    const isCrit = Math.random() * 100 < critChance;
    const multiplier = isCrit ? GAME_CONSTANTS.ENEMY_CRIT_DAMAGE_MULTIPLIER : 1;

    return { isCrit, multiplier };
}

// DEATH/RESPAWN UTILITY
/**
 * Calculates penalties when a player dies
 * @param player - The player character
 * @returns Object with penalties to apply
 */
export function calculateDeathPenalties(player: any): {
    goldLost: number;
    xpLost: number;
    respawnHP: number;
    turnsLost: number;
} {
    if (!GAME_CONSTANTS.DEATH_ENABLED) {
        return { goldLost: 0, xpLost: 0, respawnHP: player.maxHealth, turnsLost: 0 };
    }

    const goldLost = Math.floor(player.gold * GAME_CONSTANTS.DEATH_GOLD_LOSS_PERCENT);

    // XP loss is based on progress through current level
    const currentLevelXP = player.experience - (LEVEL_REQUIREMENTS[player.level - 1] || 0);
    const xpLost = Math.floor(currentLevelXP * GAME_CONSTANTS.DEATH_XP_LOSS_PERCENT);

    const respawnHP = Math.floor(player.maxHealth * GAME_CONSTANTS.DEATH_RESPAWN_HP_PERCENT);
    const turnsLost = GAME_CONSTANTS.DEATH_RESPAWN_COOLDOWN_TURNS;

    return { goldLost, xpLost, respawnHP, turnsLost };
}

// ═══════════════════════════════════════════════════════════════════
// CLZD EXCLUSIVE ITEMS
// Items that can only be purchased with CLZD tokens
// ═══════════════════════════════════════════════════════════════════

export interface CLZDExclusiveItem {
    id: string;
    name: string;
    type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'special';
    clzdPrice: number; // Price in CLZD (whole tokens)
    description: string;
    rarity: 'rare' | 'epic' | 'legendary' | 'mythic';
    minLevel: number;
    stats?: {
        attackBonus?: number;
        defenseBonus?: number;
        healthBonus?: number;
        goldBonus?: number;
        xpBonus?: number;
    };
    advantages?: Record<string, number>;
    limited?: boolean;
    maxPurchases?: number;
    imageEmoji: string;
}

export const CLZD_EXCLUSIVE_ITEMS: Record<string, CLZDExclusiveItem> = {
    // ═══════════════════════════════════════
    // LEGENDARY WEAPONS
    // ═══════════════════════════════════════
    clzd_blade_of_fortune: {
        id: 'clzd_blade_of_fortune',
        name: 'Blade of CLZD Fortune',
        type: 'weapon',
        clzdPrice: 500000,
        description: 'A mystical blade forged with CLZD tokens. Grants bonus gold on every strike.',
        rarity: 'legendary',
        minLevel: 10,
        stats: { attackBonus: 25 },
        advantages: { goldBonus: 15, criticalChance: 10 },
        imageEmoji: '🗡️'
    },
    clzd_lizard_fang: {
        id: 'clzd_lizard_fang',
        name: 'Primordial Lizard Fang',
        type: 'weapon',
        clzdPrice: 1000000,
        description: 'The tooth of an ancient crime lizard. Legendary power flows through it.',
        rarity: 'mythic',
        minLevel: 15,
        stats: { attackBonus: 40 },
        advantages: { chaosStrike: 15, lifesteal: 10, armorPenetration: 20 },
        imageEmoji: '🦷'
    },
    clzd_token_scepter: {
        id: 'clzd_token_scepter',
        name: 'Token Scepter of Wealth',
        type: 'weapon',
        clzdPrice: 750000,
        description: 'A scepter made of compressed CLZD tokens. Radiates financial power.',
        rarity: 'legendary',
        minLevel: 12,
        stats: { attackBonus: 20 },
        advantages: { goldBonus: 25, healingOnHit: 5 },
        imageEmoji: '👑'
    },
    clzd_crypto_katana: {
        id: 'clzd_crypto_katana',
        name: 'Crypto Katana',
        type: 'weapon',
        clzdPrice: 600000,
        description: 'A blade infused with blockchain energy. Cuts through anything, even smart contracts.',
        rarity: 'legendary',
        minLevel: 10,
        stats: { attackBonus: 22 },
        advantages: { criticalChance: 15, armorPenetration: 10 },
        imageEmoji: '⚔️'
    },

    // ═══════════════════════════════════════
    // LEGENDARY ARMOR
    // ═══════════════════════════════════════
    clzd_dragonscale_armor: {
        id: 'clzd_dragonscale_armor',
        name: 'CLZD Dragonscale Armor',
        type: 'armor',
        clzdPrice: 600000,
        description: 'Armor infused with dragon essence. Nearly impenetrable.',
        rarity: 'legendary',
        minLevel: 10,
        stats: { defenseBonus: 30 },
        advantages: { thorns: 10, fireResist: 50, dodgeChance: 5 },
        imageEmoji: '🐉'
    },
    clzd_void_cloak: {
        id: 'clzd_void_cloak',
        name: 'Void Cloak of Shadows',
        type: 'armor',
        clzdPrice: 1200000,
        description: 'A cloak woven from the fabric of the void. You become one with darkness.',
        rarity: 'mythic',
        minLevel: 15,
        stats: { defenseBonus: 35 },
        advantages: { dodgeChance: 20, counterAttack: 15, chaosShield: 10 },
        imageEmoji: '🌑'
    },
    clzd_diamond_plate: {
        id: 'clzd_diamond_plate',
        name: 'Diamond Plate of Prosperity',
        type: 'armor',
        clzdPrice: 800000,
        description: 'Armor forged from compressed diamond and CLZD essence. Wealth is your shield.',
        rarity: 'legendary',
        minLevel: 12,
        stats: { defenseBonus: 28 },
        advantages: { damageReduction: 15, regeneration: 3 },
        imageEmoji: '💎'
    },

    // ═══════════════════════════════════════
    // EXCLUSIVE ACCESSORIES
    // ═══════════════════════════════════════
    clzd_lucky_charm: {
        id: 'clzd_lucky_charm',
        name: 'CLZD Lucky Charm',
        type: 'accessory',
        clzdPrice: 250000,
        description: 'A charm blessed by the crypto gods. Increases all luck-based outcomes.',
        rarity: 'rare',
        minLevel: 5,
        stats: { goldBonus: 10, xpBonus: 10 },
        imageEmoji: '🍀'
    },
    clzd_ring_of_wealth: {
        id: 'clzd_ring_of_wealth',
        name: 'Ring of Infinite Wealth',
        type: 'accessory',
        clzdPrice: 800000,
        description: 'A ring that attracts gold like a magnet. The rich get richer.',
        rarity: 'legendary',
        minLevel: 10,
        stats: { goldBonus: 25 },
        imageEmoji: '💍'
    },
    clzd_amulet_of_rebirth: {
        id: 'clzd_amulet_of_rebirth',
        name: 'Amulet of Rebirth',
        type: 'accessory',
        clzdPrice: 1500000,
        description: 'An amulet that defies death itself. Grants a second chance at life.',
        rarity: 'mythic',
        minLevel: 15,
        stats: { healthBonus: 50 },
        advantages: { revive: 25 },
        imageEmoji: '🔮'
    },
    clzd_monocle_of_insight: {
        id: 'clzd_monocle_of_insight',
        name: 'Monocle of Market Insight',
        type: 'accessory',
        clzdPrice: 400000,
        description: 'See through the lies of merchants and enemies alike. Reveals hidden opportunities.',
        rarity: 'epic',
        minLevel: 8,
        stats: { xpBonus: 15 },
        imageEmoji: '🧐'
    },

    // ═══════════════════════════════════════
    // CONSUMABLES & SPECIAL ITEMS
    // ═══════════════════════════════════════
    clzd_xp_tome: {
        id: 'clzd_xp_tome',
        name: 'Tome of Instant Knowledge',
        type: 'consumable',
        clzdPrice: 100000,
        description: 'Instantly grants 5000 XP to your character. One-time use.',
        rarity: 'epic',
        minLevel: 1,
        imageEmoji: '📚'
    },
    clzd_gold_chest: {
        id: 'clzd_gold_chest',
        name: 'Legendary Gold Chest',
        type: 'consumable',
        clzdPrice: 200000,
        description: 'Contains 10,000 gold. A treasure worthy of a crime lord.',
        rarity: 'legendary',
        minLevel: 1,
        imageEmoji: '💰'
    },
    clzd_stat_reroll: {
        id: 'clzd_stat_reroll',
        name: 'Scroll of Stat Reroll',
        type: 'special',
        clzdPrice: 300000,
        description: 'Reroll your character\'s base stats with guaranteed legendary outcomes.',
        rarity: 'epic',
        minLevel: 5,
        limited: true,
        maxPurchases: 3,
        imageEmoji: '📜'
    },
    clzd_title_holder: {
        id: 'clzd_title_holder',
        name: 'CLZD Holder Title',
        type: 'special',
        clzdPrice: 500000,
        description: 'Grants the exclusive "CLZD Holder" title displayed next to your name.',
        rarity: 'legendary',
        minLevel: 1,
        limited: true,
        maxPurchases: 1,
        imageEmoji: '🏷️'
    },
    clzd_mega_health_potion: {
        id: 'clzd_mega_health_potion',
        name: 'Mega Health Elixir',
        type: 'consumable',
        clzdPrice: 75000,
        description: 'Instantly restores ALL health. Premium healing for premium players.',
        rarity: 'rare',
        minLevel: 1,
        imageEmoji: '❤️‍🔥'
    },
    clzd_turn_boost: {
        id: 'clzd_turn_boost',
        name: 'Time Crystal',
        type: 'consumable',
        clzdPrice: 150000,
        description: 'Instantly grants 50 bonus turns. Time is money, and you have both.',
        rarity: 'epic',
        minLevel: 1,
        imageEmoji: '⏳'
    },
    clzd_golden_key: {
        id: 'clzd_golden_key',
        name: 'Golden Key of the Vault',
        type: 'special',
        clzdPrice: 2000000,
        description: 'Permanently unlocks access to the exclusive CLZD Vault area with rare encounters.',
        rarity: 'mythic',
        minLevel: 20,
        limited: true,
        maxPurchases: 1,
        imageEmoji: '🔑'
    }
};

// Helper function to get all CLZD exclusive items as an array
export function getCLZDExclusiveItemsArray(): CLZDExclusiveItem[] {
    return Object.values(CLZD_EXCLUSIVE_ITEMS);
}

// Helper function to get item by ID
export function getCLZDExclusiveItem(itemId: string): CLZDExclusiveItem | undefined {
    return CLZD_EXCLUSIVE_ITEMS[itemId];
}
