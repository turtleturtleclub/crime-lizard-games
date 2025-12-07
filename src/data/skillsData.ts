/**
 * ═══════════════════════════════════════════════════════════
 * SKILLS & ABILITIES SYSTEM
 * ═══════════════════════════════════════════════════════════
 * Active and passive abilities for each archetype
 * Inspired by World of Warcraft talent trees
 */

export interface Skill {
    id: string;
    name: string;
    description: string;
    emoji: string;
    type: 'active' | 'passive';
    cooldown?: number; // Minutes for active skills
    energyCost?: number; // Turn cost for active skills

    // Requirements
    minLevel: number;
    prerequisites?: string[]; // Other skill IDs required
    archetypes: number[]; // Which archetypes can use this (empty = all)

    // Effects
    effects: SkillEffect[];

    // Upgrade path
    maxRank: number;
    currentRank?: number;
    upgradeCost: {
        gold: number;
        experience: number;
        materials?: string[]; // Item IDs needed
    };

    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    lore: string;
}

export interface SkillEffect {
    type: 'damage' | 'heal' | 'buff' | 'debuff' | 'utility' | 'summon';
    value: number;
    stat?: 'strength' | 'defense' | 'charm' | 'health' | 'gold' | 'xp';
    duration?: number; // Turns
    target: 'self' | 'enemy' | 'ally' | 'all_enemies' | 'all_allies';
    chance?: number; // Percentage chance to proc
}

// ═══════════════════════════════════════════════════════════
// UNIVERSAL SKILLS (Available to all archetypes)
// ═══════════════════════════════════════════════════════════

export const UNIVERSAL_SKILLS: Record<string, Skill> = {
    second_wind: {
        id: 'second_wind',
        name: 'Second Wind',
        description: 'Recover 30% of your max health instantly. The streets taught you to never give up.',
        emoji: '💨',
        type: 'active',
        cooldown: 60,
        energyCost: 0,
        minLevel: 3,
        archetypes: [],
        effects: [
            {
                type: 'heal',
                value: 0.30, // 30% of max HP
                target: 'self'
            }
        ],
        maxRank: 3,
        upgradeCost: {
            gold: 200,
            experience: 100
        },
        rarity: 'common',
        lore: 'Every Crime Lizard learns to bounce back from near-death experiences.'
    },

    lucky_break: {
        id: 'lucky_break',
        name: 'Lucky Break',
        description: 'Passive: 10% chance to dodge enemy attacks completely.',
        emoji: '🍀',
        type: 'passive',
        minLevel: 5,
        archetypes: [],
        effects: [
            {
                type: 'utility',
                value: 0.10,
                target: 'self',
                chance: 10
            }
        ],
        maxRank: 5,
        upgradeCost: {
            gold: 300,
            experience: 150
        },
        rarity: 'uncommon',
        lore: 'Luck favors the bold... and the lizard.'
    },

    intimidate: {
        id: 'intimidate',
        name: 'Intimidate',
        description: 'Reduce enemy attack by 20% for 3 turns. Your reputation precedes you.',
        emoji: '😈',
        type: 'active',
        cooldown: 30,
        energyCost: 1,
        minLevel: 7,
        archetypes: [],
        effects: [
            {
                type: 'debuff',
                value: -0.20,
                stat: 'strength',
                duration: 3,
                target: 'enemy'
            }
        ],
        maxRank: 3,
        upgradeCost: {
            gold: 400,
            experience: 200
        },
        rarity: 'uncommon',
        lore: 'Fear is the most effective weapon.'
    }
};

// ═══════════════════════════════════════════════════════════
// ARCHETYPE-SPECIFIC SKILLS
// ═══════════════════════════════════════════════════════════

export const ROGUE_SKILLS: Record<string, Skill> = {
    backstab: {
        id: 'backstab',
        name: 'Backstab',
        description: 'Deal 200% damage from the shadows. Critical hits deal 300%!',
        emoji: '🗡️',
        type: 'active',
        cooldown: 20,
        energyCost: 2,
        minLevel: 1,
        archetypes: [1], // Rogue
        effects: [
            {
                type: 'damage',
                value: 2.0,
                target: 'enemy'
            }
        ],
        maxRank: 5,
        upgradeCost: {
            gold: 150,
            experience: 75
        },
        rarity: 'rare',
        lore: 'The signature move of every Crime Lizard Rogue. Silent, deadly, profitable.'
    },

    shadow_step: {
        id: 'shadow_step',
        name: 'Shadow Step',
        description: 'Become untargetable for 2 turns. Perfect for escaping or repositioning.',
        emoji: '🌑',
        type: 'active',
        cooldown: 45,
        energyCost: 1,
        minLevel: 5,
        archetypes: [1],
        prerequisites: ['backstab'],
        effects: [
            {
                type: 'buff',
                value: 1.0,
                duration: 2,
                target: 'self'
            }
        ],
        maxRank: 3,
        upgradeCost: {
            gold: 500,
            experience: 250,
            materials: ['shadow_scale']
        },
        rarity: 'epic',
        lore: 'Merge with the shadows. The ultimate escape technique.'
    },

    poison_blade: {
        id: 'poison_blade',
        name: 'Poison Blade',
        description: 'Passive: All attacks have 25% chance to poison enemies (10 damage/turn for 3 turns).',
        emoji: '☠️',
        type: 'passive',
        minLevel: 8,
        archetypes: [1],
        effects: [
            {
                type: 'debuff',
                value: 10,
                duration: 3,
                target: 'enemy',
                chance: 25
            }
        ],
        maxRank: 5,
        upgradeCost: {
            gold: 600,
            experience: 300,
            materials: ['poison_vial']
        },
        rarity: 'epic',
        lore: 'Coat your blades with deadly toxins. Slow, painful, effective.'
    }
};

export const MAGE_SKILLS: Record<string, Skill> = {
    fireball: {
        id: 'fireball',
        name: 'Fireball',
        description: 'Hurl a blazing fireball for 150% magic damage. Burns everything.',
        emoji: '🔥',
        type: 'active',
        cooldown: 15,
        energyCost: 2,
        minLevel: 1,
        archetypes: [3], // Mage
        effects: [
            {
                type: 'damage',
                value: 1.5,
                stat: 'charm',
                target: 'enemy'
            }
        ],
        maxRank: 5,
        upgradeCost: {
            gold: 200,
            experience: 100
        },
        rarity: 'rare',
        lore: 'The classic mage spell. Simple, effective, explosive.'
    },

    mana_shield: {
        id: 'mana_shield',
        name: 'Mana Shield',
        description: 'Absorb the next 100 damage. Magic protects the wise.',
        emoji: '🛡️',
        type: 'active',
        cooldown: 40,
        energyCost: 1,
        minLevel: 4,
        archetypes: [3],
        effects: [
            {
                type: 'buff',
                value: 100,
                duration: 5,
                target: 'self'
            }
        ],
        maxRank: 5,
        upgradeCost: {
            gold: 400,
            experience: 200,
            materials: ['void_crystal']
        },
        rarity: 'epic',
        lore: 'Knowledge is power, and power is protection.'
    },

    arcane_intellect: {
        id: 'arcane_intellect',
        name: 'Arcane Intellect',
        description: 'Passive: +50% XP gain from all sources. The wise grow faster.',
        emoji: '📚',
        type: 'passive',
        minLevel: 6,
        archetypes: [3],
        effects: [
            {
                type: 'buff',
                value: 0.50,
                stat: 'xp',
                target: 'self'
            }
        ],
        maxRank: 5,
        upgradeCost: {
            gold: 500,
            experience: 250
        },
        rarity: 'rare',
        lore: 'Intelligence accelerates growth. Study the arcane arts.'
    },

    meteor_storm: {
        id: 'meteor_storm',
        name: 'Meteor Storm',
        description: 'Ultimate: Deal 300% damage to ALL enemies. The skies rain fire.',
        emoji: '☄️',
        type: 'active',
        cooldown: 120,
        energyCost: 5,
        minLevel: 10,
        archetypes: [3],
        prerequisites: ['fireball', 'arcane_intellect'],
        effects: [
            {
                type: 'damage',
                value: 3.0,
                stat: 'charm',
                target: 'all_enemies'
            }
        ],
        maxRank: 3,
        upgradeCost: {
            gold: 2000,
            experience: 1000,
            materials: ['fire_crystal', 'void_crystal', 'dragon_scale']
        },
        rarity: 'legendary',
        lore: 'The ultimate expression of magical power. Reality bends to your will.'
    }
};

export const KNIGHT_SKILLS: Record<string, Skill> = {
    shield_bash: {
        id: 'shield_bash',
        name: 'Shield Bash',
        description: 'Stun enemy for 1 turn and deal 80% damage. Interrupts their attacks.',
        emoji: '🛡️',
        type: 'active',
        cooldown: 25,
        energyCost: 1,
        minLevel: 1,
        archetypes: [2], // Knight
        effects: [
            {
                type: 'damage',
                value: 0.8,
                target: 'enemy'
            },
            {
                type: 'debuff',
                value: 1,
                duration: 1,
                target: 'enemy'
            }
        ],
        maxRank: 5,
        upgradeCost: {
            gold: 200,
            experience: 100
        },
        rarity: 'uncommon',
        lore: 'Sometimes the shield is mightier than the sword.'
    },

    last_stand: {
        id: 'last_stand',
        name: 'Last Stand',
        description: 'When HP drops below 20%, gain +100% defense for 3 turns. Knightly resolve.',
        emoji: '⚔️',
        type: 'passive',
        minLevel: 5,
        archetypes: [2],
        effects: [
            {
                type: 'buff',
                value: 1.0,
                stat: 'defense',
                duration: 3,
                target: 'self',
                chance: 100
            }
        ],
        maxRank: 3,
        upgradeCost: {
            gold: 500,
            experience: 250
        },
        rarity: 'epic',
        lore: 'True knights never surrender. Even in death, they stand tall.'
    },

    holy_strike: {
        id: 'holy_strike',
        name: 'Holy Strike',
        description: 'Deal 180% damage that ignores armor. Smite the wicked!',
        emoji: '✨',
        type: 'active',
        cooldown: 30,
        energyCost: 3,
        minLevel: 8,
        archetypes: [2],
        effects: [
            {
                type: 'damage',
                value: 1.8,
                target: 'enemy'
            }
        ],
        maxRank: 5,
        upgradeCost: {
            gold: 700,
            experience: 350,
            materials: ['holy_relic']
        },
        rarity: 'epic',
        lore: 'Channel divine justice through your blade. Evil cannot hide.'
    }
};

export const DEGEN_SKILLS: Record<string, Skill> = {
    all_in: {
        id: 'all_in',
        name: 'All In',
        description: 'Gamble your HP! Deal damage equal to 50% of your current HP. High risk, high reward.',
        emoji: '🎲',
        type: 'active',
        cooldown: 60,
        energyCost: 0,
        minLevel: 1,
        archetypes: [8], // Degen
        effects: [
            {
                type: 'damage',
                value: 0.50, // 50% of current HP as damage
                target: 'enemy'
            }
        ],
        maxRank: 5,
        upgradeCost: {
            gold: 250,
            experience: 125
        },
        rarity: 'rare',
        lore: 'No risk, no reward. YOLO!'
    },

    diamond_hands: {
        id: 'diamond_hands',
        name: 'Diamond Hands',
        description: 'Passive: Cannot lose more than 50% gold on death. HODL forever.',
        emoji: '💎',
        type: 'passive',
        minLevel: 5,
        archetypes: [8],
        effects: [
            {
                type: 'utility',
                value: 0.50,
                stat: 'gold',
                target: 'self'
            }
        ],
        maxRank: 3,
        upgradeCost: {
            gold: 600,
            experience: 300
        },
        rarity: 'epic',
        lore: 'True degens never sell at a loss. Diamond hands until moon or bust!'
    },

    pump_it: {
        id: 'pump_it',
        name: 'Pump It',
        description: '+100% gold from all sources for 10 minutes. Number go up!',
        emoji: '📈',
        type: 'active',
        cooldown: 180,
        energyCost: 2,
        minLevel: 7,
        archetypes: [8],
        effects: [
            {
                type: 'buff',
                value: 1.0,
                stat: 'gold',
                duration: 10,
                target: 'self'
            }
        ],
        maxRank: 3,
        upgradeCost: {
            gold: 800,
            experience: 400,
            materials: ['bnb_core']
        },
        rarity: 'legendary',
        lore: 'Activate maximum greed mode. To the moon! 🚀'
    }
};

export const DRAGON_TAMER_SKILLS: Record<string, Skill> = {
    dragon_breath: {
        id: 'dragon_breath',
        name: 'Dragon Breath',
        description: 'Your dragon breathes fire, dealing 200% damage and burning for 3 turns.',
        emoji: '🐉',
        type: 'active',
        cooldown: 35,
        energyCost: 3,
        minLevel: 1,
        archetypes: [9], // Dragon Tamer
        effects: [
            {
                type: 'damage',
                value: 2.0,
                target: 'enemy'
            },
            {
                type: 'debuff',
                value: 15,
                duration: 3,
                target: 'enemy'
            }
        ],
        maxRank: 5,
        upgradeCost: {
            gold: 300,
            experience: 150
        },
        rarity: 'epic',
        lore: 'Command your dragon companion to unleash devastation.'
    },

    dragon_scales: {
        id: 'dragon_scales',
        name: 'Dragon Scales',
        description: 'Passive: Reduce all damage taken by 15%. Dragon hide is legendary.',
        emoji: '🛡️',
        type: 'passive',
        minLevel: 5,
        archetypes: [9],
        effects: [
            {
                type: 'buff',
                value: 0.15,
                stat: 'defense',
                target: 'self'
            }
        ],
        maxRank: 5,
        upgradeCost: {
            gold: 500,
            experience: 250,
            materials: ['dragon_scale']
        },
        rarity: 'epic',
        lore: 'Your bond with dragons has toughened your skin.'
    },

    summon_dragon: {
        id: 'summon_dragon',
        name: 'Summon Dragon',
        description: 'Ultimate: Summon an Elder Dragon to fight for you for 5 turns. Deals 50 damage/turn.',
        emoji: '🐲',
        type: 'active',
        cooldown: 300,
        energyCost: 5,
        minLevel: 10,
        archetypes: [9],
        prerequisites: ['dragon_breath', 'dragon_scales'],
        effects: [
            {
                type: 'summon',
                value: 50,
                duration: 5,
                target: 'enemy'
            }
        ],
        maxRank: 3,
        upgradeCost: {
            gold: 3000,
            experience: 1500,
            materials: ['dragon_heart', 'ancient_scale', 'fire_crystal']
        },
        rarity: 'legendary',
        lore: 'The ultimate bond between tamer and dragon. Unleash apocalyptic power.'
    }
};

// ═══════════════════════════════════════════════════════════
// SKILL TREE EXPORTS
// ═══════════════════════════════════════════════════════════

export const ALL_SKILLS: Record<string, Skill> = {
    ...UNIVERSAL_SKILLS,
    ...ROGUE_SKILLS,
    ...MAGE_SKILLS,
    ...KNIGHT_SKILLS,
    ...DEGEN_SKILLS,
    ...DRAGON_TAMER_SKILLS
};

export const ARCHETYPE_SKILL_TREES: Record<number, string[]> = {
    0: ['second_wind', 'lucky_break', 'intimidate'], // Blacksmith - gets universal
    1: ['backstab', 'shadow_step', 'poison_blade'], // Rogue
    2: ['shield_bash', 'last_stand', 'holy_strike'], // Knight
    3: ['fireball', 'mana_shield', 'arcane_intellect', 'meteor_storm'], // Mage
    4: ['second_wind', 'lucky_break'], // Robin Hood
    5: ['second_wind', 'intimidate'], // Developer
    6: ['fireball', 'poison_blade'], // Necromancer (gets mage + rogue skills)
    7: ['shield_bash', 'holy_strike', 'last_stand'], // Paladin
    8: ['all_in', 'diamond_hands', 'pump_it'], // Degen
    9: ['dragon_breath', 'dragon_scales', 'summon_dragon'] // Dragon Tamer
};

export default {
    ALL_SKILLS,
    UNIVERSAL_SKILLS,
    ROGUE_SKILLS,
    MAGE_SKILLS,
    KNIGHT_SKILLS,
    DEGEN_SKILLS,
    DRAGON_TAMER_SKILLS,
    ARCHETYPE_SKILL_TREES
};
