// Item Name Mapping - Friendly display names for in-game items
// Used in quest rewards, inventory, and other UI displays

export const ITEM_FRIENDLY_NAMES: Record<string, string> = {
    // Quest Reward Items
    'shop_discount_token': '🎫 Shop Discount Token',
    'gladiator_mark': '⚔️ Gladiator Mark',
    'random_rare_item': '🎁 Random Rare Item',
    'dragon_scale': '🐉 Dragon Scale',
    'rare_gem': '💎 Rare Gem',
    'jewelry_store_key': '🔑 Jewelry Store Key',
    'bank_vault_key': '🗝️ Bank Vault Key',
    'safu_amulet': '🧿 SAFU Amulet',

    // Consumables
    'health_potion': '🧪 Health Potion',
    'mana_potion': '💙 Mana Potion',
    'strength_buff': '💪 Strength Buff',
    'defense_buff': '🛡️ Defense Buff',
    'charm_buff': '✨ Charm Buff',

    // Special Items
    'contraband_package': '📦 Contraband Package',
    'debt_gold': '💰 Debt Gold',
    'stolen_goods': '💼 Stolen Goods',
    'insurance': '📋 Heist Insurance',

    // Tokens & Currency
    'gold': '💰 Gold',
    'experience': '⭐ Experience',
    'reputation': '📈 Reputation',

    // NFT Rewards
    'first_blood_badge': '🩸 First Blood Badge',
    'dragon_thief_badge': '🐉 Dragon Thief Badge',
    'master_thief_badge': '👑 Master Thief Badge',

    // Rekt District Special
    'rekt_survivor_badge': '💀 Rekt Survivor Badge',
    'degen_hero_token': '🦸 Degen Hero Token'
};

/**
 * Get friendly display name for an item
 * Falls back to formatted item_id if no mapping exists
 */
export function getItemDisplayName(itemId: string): string {
    // Check if we have a friendly name mapping
    if (ITEM_FRIENDLY_NAMES[itemId]) {
        return ITEM_FRIENDLY_NAMES[itemId];
    }

    // Fallback: Convert snake_case to Title Case
    return itemId
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Get just the emoji for an item (if it has one)
 */
export function getItemEmoji(itemId: string): string {
    const displayName = ITEM_FRIENDLY_NAMES[itemId];
    if (displayName) {
        const emoji = displayName.split(' ')[0];
        // Check if it's actually an emoji (simple check)
        if (emoji.length <= 2 && /[\u{1F300}-\u{1F9FF}]/u.test(emoji)) {
            return emoji;
        }
    }
    return '🎁'; // Default emoji
}

/**
 * Get item name without emoji
 */
export function getItemNameWithoutEmoji(itemId: string): string {
    const displayName = getItemDisplayName(itemId);
    // Remove emoji if present (first character if it's an emoji)
    return displayName.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '');
}
