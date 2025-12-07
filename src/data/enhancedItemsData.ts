/**
 * ═══════════════════════════════════════════════════════════
 * ENHANCED ITEMS SYSTEM
 * ═══════════════════════════════════════════════════════════
 * Expanded item system with crafting, consumables, and set bonuses
 * Inspired by Diablo, WoW, and Path of Exile
 */

export interface EnhancedItem {
    id: string;
    name: string;
    description: string;
    emoji: string;
    type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'quest_item' | 'set_piece';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'set';

    // Stats & Effects
    stats?: {
        health?: number;
        strength?: number;
        defense?: number;
        charm?: number;
        luck?: number;
        goldBonus?: number; // Percentage
        xpBonus?: number; // Percentage
        critChance?: number; // Percentage
        critDamage?: number; // Multiplier
        lifesteal?: number; // Percentage of damage as healing
    };

    // Requirements
    minLevel: number;
    requiredArchetype?: number[];

    // Economy
    value: number; // Sell price
    canTrade: boolean;
    canDestroy: boolean;

    // Set Bonus Info
    setId?: string;
    setName?: string;

    // Crafting
    craftable?: boolean;
    craftingRecipe?: {
        materials: Array<{ itemId: string; amount: number }>;
        gold: number;
        minLevel: number;
        craftingTime?: number; // Minutes
    };

    // Consumable-specific
    consumable?: {
        effect: string;
        duration?: number; // Turns or minutes
        cooldown?: number; // Minutes
    };

    lore: string;
}

// ═══════════════════════════════════════════════════════════
// SET ITEMS - Equip multiple pieces for powerful bonuses
// ═══════════════════════════════════════════════════════════

export const ITEM_SETS = {
    shadow_assassin: {
        id: 'shadow_assassin',
        name: 'Shadow Assassin Set',
        emoji: '🌑',
        pieces: ['shadow_blade', 'shadow_armor', 'shadow_boots', 'shadow_cloak'],
        bonuses: [
            {
                pieces: 2,
                description: '+20% critical hit chance',
                stats: { critChance: 20 }
            },
            {
                pieces: 4,
                description: '+50% damage from stealth, become invisible for 2 seconds after kills',
                stats: { strength: 25, critDamage: 0.5 }
            }
        ],
        rarity: 'legendary',
        lore: 'Worn by the most feared assassins in the Crime Lizard underworld.'
    },

    blockchain_guardian: {
        id: 'blockchain_guardian',
        name: 'Blockchain Guardian Set',
        emoji: '🔗',
        pieces: ['chain_blade', 'chain_armor', 'chain_helm', 'chain_boots'],
        bonuses: [
            {
                pieces: 2,
                description: '+100 health and +15 defense',
                stats: { health: 100, defense: 15 }
            },
            {
                pieces: 4,
                description: '+100% gold find, blocks are SAFU',
                stats: { defense: 30, goldBonus: 100 }
            }
        ],
        rarity: 'epic',
        lore: 'Forged in the fires of BSC, this armor makes your funds SAFU.'
    },

    dragon_emperor: {
        id: 'dragon_emperor',
        name: 'Dragon Emperor Set',
        emoji: '🐉',
        pieces: ['dragon_fang_sword', 'dragon_scale_armor', 'dragon_crown', 'dragon_wings'],
        bonuses: [
            {
                pieces: 2,
                description: '+20% fire damage, immune to burn effects',
                stats: { strength: 15 }
            },
            {
                pieces: 4,
                description: '+200 health, attacks have 30% chance to breathe fire (50 AOE damage)',
                stats: { health: 200, strength: 30, defense: 20 }
            }
        ],
        rarity: 'mythic',
        lore: 'Legends speak of a lizard who ascended to become the Dragon Emperor...'
    }
};

// ═══════════════════════════════════════════════════════════
// CONSUMABLES - Potions, Buffs, Temporary Items
// ═══════════════════════════════════════════════════════════

export const CONSUMABLES: Record<string, EnhancedItem> = {
    // Healing Potions
    health_potion_small: {
        id: 'health_potion_small',
        name: 'Small Health Potion',
        description: 'Restore 50 HP instantly',
        emoji: '🧪',
        type: 'consumable',
        rarity: 'common',
        minLevel: 1,
        value: 25,
        canTrade: true,
        canDestroy: true,
        consumable: {
            effect: 'heal',
            cooldown: 1
        },
        lore: 'Basic healing. Tastes like chicken.'
    },

    health_potion_large: {
        id: 'health_potion_large',
        name: 'Large Health Potion',
        description: 'Restore 150 HP instantly',
        emoji: '🧪',
        type: 'consumable',
        rarity: 'uncommon',
        minLevel: 5,
        value: 80,
        canTrade: true,
        canDestroy: true,
        consumable: {
            effect: 'heal',
            cooldown: 1
        },
        lore: 'Powerful healing magic in a bottle.'
    },

    // Buff Potions
    strength_elixir: {
        id: 'strength_elixir',
        name: 'Elixir of Strength',
        description: '+50% strength for 10 turns',
        emoji: '💪',
        type: 'consumable',
        rarity: 'rare',
        minLevel: 7,
        value: 200,
        canTrade: true,
        canDestroy: true,
        consumable: {
            effect: 'buff_strength',
            duration: 10,
            cooldown: 30
        },
        lore: 'Feel the power surge through your scales!'
    },

    defense_potion: {
        id: 'defense_potion',
        name: 'Iron Skin Potion',
        description: '+100% defense for 5 turns',
        emoji: '🛡️',
        type: 'consumable',
        rarity: 'rare',
        minLevel: 6,
        value: 180,
        canTrade: true,
        canDestroy: true,
        consumable: {
            effect: 'buff_defense',
            duration: 5,
            cooldown: 30
        },
        lore: 'Your scales become as hard as diamond.'
    },

    luck_potion: {
        id: 'luck_potion',
        name: 'Potion of Fortune',
        description: '+200% gold drops for 30 minutes',
        emoji: '🍀',
        type: 'consumable',
        rarity: 'epic',
        minLevel: 10,
        value: 500,
        canTrade: true,
        canDestroy: true,
        consumable: {
            effect: 'buff_gold',
            duration: 30,
            cooldown: 180
        },
        lore: 'Make it rain gold! The ultimate greed juice.'
    },

    xp_boost: {
        id: 'xp_boost',
        name: 'Experience Boost',
        description: '+300% XP gain for 60 minutes',
        emoji: '📚',
        type: 'consumable',
        rarity: 'epic',
        minLevel: 1,
        value: 400,
        canTrade: true,
        canDestroy: false,
        consumable: {
            effect: 'buff_xp',
            duration: 60,
            cooldown: 240
        },
        lore: 'Level up faster with this concentrated knowledge serum.'
    },

    // Utility Items
    teleport_scroll: {
        id: 'teleport_scroll',
        name: 'Teleport Scroll',
        description: 'Instantly return to town from anywhere',
        emoji: '📜',
        type: 'consumable',
        rarity: 'uncommon',
        minLevel: 1,
        value: 50,
        canTrade: true,
        canDestroy: true,
        consumable: {
            effect: 'teleport_town',
            cooldown: 10
        },
        lore: 'For when things go south. Fast.'
    },

    resurrection_token: {
        id: 'resurrection_token',
        name: 'Resurrection Token',
        description: 'Auto-revive on death with 50% HP and no gold loss',
        emoji: '👼',
        type: 'consumable',
        rarity: 'legendary',
        minLevel: 8,
        value: 2000,
        canTrade: false,
        canDestroy: false,
        consumable: {
            effect: 'auto_revive',
            cooldown: 0
        },
        lore: 'Cheat death itself. Only works once, so make it count!'
    }
};

// ═══════════════════════════════════════════════════════════
// CRAFTING MATERIALS - Used to create powerful items
// ═══════════════════════════════════════════════════════════

export const CRAFTING_MATERIALS: Record<string, EnhancedItem> = {
    iron_ore: {
        id: 'iron_ore',
        name: 'Iron Ore',
        description: 'Basic crafting material for weapons and armor',
        emoji: '⛏️',
        type: 'material',
        rarity: 'common',
        minLevel: 1,
        value: 10,
        canTrade: true,
        canDestroy: true,
        lore: 'The foundation of any blacksmith\'s craft.'
    },

    mithril_ingot: {
        id: 'mithril_ingot',
        name: 'Mithril Ingot',
        description: 'Rare metal used in legendary weapons',
        emoji: '🔷',
        type: 'material',
        rarity: 'epic',
        minLevel: 10,
        value: 500,
        canTrade: true,
        canDestroy: true,
        lore: 'Lighter than steel, stronger than diamond. The dwarves knew their craft.'
    },

    enchanted_essence: {
        id: 'enchanted_essence',
        name: 'Enchanted Essence',
        description: 'Magical energy used for enchanting items',
        emoji: '✨',
        type: 'material',
        rarity: 'rare',
        minLevel: 7,
        value: 200,
        canTrade: true,
        canDestroy: true,
        lore: 'Bottled magic. Handle with care.'
    },

    dragon_heart: {
        id: 'dragon_heart',
        name: 'Dragon Heart',
        description: 'The still-beating heart of an ancient dragon',
        emoji: '❤️',
        type: 'material',
        rarity: 'legendary',
        minLevel: 15,
        value: 5000,
        canTrade: true,
        canDestroy: false,
        lore: 'Pulsing with primordial fire. Few have ever obtained one.'
    }
};

// ═══════════════════════════════════════════════════════════
// CRAFTABLE ITEMS - Recipes for powerful gear
// ═══════════════════════════════════════════════════════════

export const CRAFTABLE_ITEMS: Record<string, EnhancedItem> = {
    // Legendary Weapons
    justice_bringer: {
        id: 'justice_bringer',
        name: 'Justice Bringer',
        description: 'Legendary sword that deals 100 damage and has 30% crit chance',
        emoji: '⚔️',
        type: 'weapon',
        rarity: 'legendary',
        stats: {
            strength: 100,
            critChance: 30,
            critDamage: 2.0
        },
        minLevel: 12,
        value: 10000,
        canTrade: true,
        canDestroy: false,
        craftable: true,
        craftingRecipe: {
            materials: [
                { itemId: 'legendary_weapon_fragment', amount: 3 },
                { itemId: 'mithril_ingot', amount: 5 },
                { itemId: 'enchanted_essence', amount: 10 },
                { itemId: 'dragon_scale', amount: 2 }
            ],
            gold: 5000,
            minLevel: 12,
            craftingTime: 120
        },
        lore: 'Forged from the fragments of fallen heroes. Brings swift justice to all who oppose you.'
    },

    void_reaper: {
        id: 'void_reaper',
        name: 'Void Reaper',
        description: 'Scythe that deals 120 damage and drains 10% HP per hit',
        emoji: '🗡️',
        type: 'weapon',
        rarity: 'mythic',
        stats: {
            strength: 120,
            lifesteal: 10,
            critDamage: 2.5
        },
        minLevel: 15,
        value: 25000,
        canTrade: true,
        canDestroy: false,
        craftable: true,
        craftingRecipe: {
            materials: [
                { itemId: 'void_crystal', amount: 10 },
                { itemId: 'shadow_scale', amount: 5 },
                { itemId: 'mithril_ingot', amount: 8 },
                { itemId: 'ultimate_power', amount: 1 }
            ],
            gold: 15000,
            minLevel: 15,
            craftingTime: 240
        },
        lore: 'A weapon forged in the void between dimensions. Hungers for souls.'
    },

    // Set Pieces
    shadow_blade: {
        id: 'shadow_blade',
        name: 'Shadow Assassin\'s Blade',
        description: 'Part of the Shadow Assassin set. +60 damage, +20% crit.',
        emoji: '🗡️',
        type: 'set_piece',
        rarity: 'set',
        setId: 'shadow_assassin',
        setName: 'Shadow Assassin Set',
        stats: {
            strength: 60,
            critChance: 20
        },
        minLevel: 10,
        requiredArchetype: [1], // Rogue only
        value: 5000,
        canTrade: true,
        canDestroy: false,
        craftable: true,
        craftingRecipe: {
            materials: [
                { itemId: 'shadow_scale', amount: 3 },
                { itemId: 'void_crystal', amount: 5 },
                { itemId: 'mithril_ingot', amount: 3 }
            ],
            gold: 3000,
            minLevel: 10
        },
        lore: 'Silent as the night, deadly as the void.'
    }
};

// ═══════════════════════════════════════════════════════════
// QUEST ITEMS - Special items from quests
// ═══════════════════════════════════════════════════════════

export const QUEST_ITEMS: Record<string, EnhancedItem> = {
    crime_lord_medallion: {
        id: 'crime_lord_medallion',
        name: 'Crime Lord\'s Medallion',
        description: 'Proof of defeating the Crime Lord. +50 to all stats.',
        emoji: '🏅',
        type: 'quest_item',
        rarity: 'legendary',
        stats: {
            health: 200,
            strength: 50,
            defense: 50,
            charm: 50,
            goldBonus: 50,
            xpBonus: 50
        },
        minLevel: 20,
        value: 0, // Priceless
        canTrade: false,
        canDestroy: false,
        lore: 'Only the strongest Crime Lizards can claim this trophy.'
    },

    safu_certificate: {
        id: 'safu_certificate',
        name: 'SAFU Certificate',
        description: 'Blessed by CZ himself. Your funds are always SAFU.',
        emoji: '📜',
        type: 'quest_item',
        rarity: 'legendary',
        stats: {
            goldBonus: 100,
            defense: 50
        },
        minLevel: 15,
        value: 0,
        canTrade: false,
        canDestroy: false,
        lore: 'The ultimate proof that your funds are safe. Blessed by the Wanderer in Yellow.'
    }
};

export const ALL_ENHANCED_ITEMS = {
    ...CONSUMABLES,
    ...CRAFTING_MATERIALS,
    ...CRAFTABLE_ITEMS,
    ...QUEST_ITEMS
};

export default {
    ITEM_SETS,
    CONSUMABLES,
    CRAFTING_MATERIALS,
    CRAFTABLE_ITEMS,
    QUEST_ITEMS,
    ALL_ENHANCED_ITEMS
};
