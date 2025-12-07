/**
 * Combat Utility Functions
 * Handles damage calculations with realistic variance
 */

/**
 * Calculate damage with variance for more realistic combat
 * @param baseDamage - The base damage amount (strength, attack power, etc.)
 * @param variance - Variance percentage (0.15 = ±15%)
 * @returns Randomized damage amount
 */
export function calculateDamageWithVariance(baseDamage: number, variance: number = 0.20): number {
    // Add ±variance (default ±20%) to make combat less predictable
    const min = Math.floor(baseDamage * (1 - variance));
    const max = Math.ceil(baseDamage * (1 + variance));
    const randomDamage = Math.floor(Math.random() * (max - min + 1)) + min;

    // Ensure at least 1 damage
    return Math.max(1, randomDamage);
}

/**
 * Calculate player attack damage (with equipment bonuses)
 * @param playerStrength - Player's base strength
 * @param weaponBonus - Weapon attack bonus
 * @param accessoryBonuses - Accessory strength bonuses
 * @returns Damage dealt with variance
 */
export function calculatePlayerDamage(
    playerStrength: number,
    weaponBonus: number = 0,
    accessoryBonuses: number = 0
): number {
    const baseDamage = playerStrength + weaponBonus + accessoryBonuses;

    // Players get ±20% variance for dynamic combat
    return calculateDamageWithVariance(baseDamage, 0.20);
}

/**
 * Calculate enemy attack damage
 * @param enemyStrength - Enemy's strength/attack stat
 * @param playerDefense - Player's defense (reduces damage)
 * @param armorBonus - Armor defense bonus
 * @param accessoryBonuses - Accessory defense bonuses
 * @returns Damage dealt with variance
 */
export function calculateEnemyDamage(
    enemyStrength: number,
    playerDefense: number,
    armorBonus: number = 0,
    accessoryBonuses: number = 0
): number {
    const totalDefense = playerDefense + armorBonus + accessoryBonuses;

    // Base damage calculation (enemy attack - player defense)
    const baseDamage = Math.max(1, enemyStrength - Math.floor(totalDefense * 0.5));

    // Enemies get ±20% variance for unpredictability
    return calculateDamageWithVariance(baseDamage, 0.20);
}

/**
 * Check for critical hit (bonus damage)
 * @param baseDamage - The base damage amount
 * @param critChance - Critical hit chance (0.0 to 1.0)
 * @param critMultiplier - Damage multiplier on crit (default 2x)
 * @returns Object with damage and whether it was a crit
 */
export function calculateCriticalHit(
    baseDamage: number,
    critChance: number = 0.10,
    critMultiplier: number = 2.0
): { damage: number; isCrit: boolean } {
    const isCrit = Math.random() < critChance;

    return {
        damage: isCrit ? Math.floor(baseDamage * critMultiplier) : baseDamage,
        isCrit
    };
}

/**
 * Format damage display with variance indicator
 * @param damage - Damage amount
 * @param isCrit - Whether it was a critical hit
 * @returns Formatted damage string
 */
export function formatDamageDisplay(damage: number, isCrit: boolean = false): string {
    if (isCrit) {
        return `${damage} CRIT!`;
    }
    return `${damage}`;
}
