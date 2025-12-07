/**
 * Archetype Sprite Mapping
 * Maps character archetype numbers to their sprite assets
 */

// Archetype IDs match the base-images naming convention
export const ARCHETYPE_SPRITES: Record<number, string> = {
  0: 'sprite-blacksmith.png',
  1: 'sprite-rogue.png',
  2: 'sprite-knight.png',
  3: 'sprite-mage.png',
  4: 'sprite-robin-hood.png',
  5: 'sprite-developer.png',
  6: 'sprite-necromancer.png',
  7: 'sprite-paladin.png',
  8: 'sprite-degen.png',
  9: 'sprite-dragon-tamer.png',
};

// Default sprite for unknown archetypes
export const DEFAULT_SPRITE = 'player-sprite.png';

/**
 * Get the sprite filename for a given archetype
 * @param archetype - The archetype number (0-9)
 * @returns The sprite filename
 */
export function getArchetypeSprite(archetype: number | undefined): string {
  if (archetype === undefined || archetype === null) {
    return DEFAULT_SPRITE;
  }
  return ARCHETYPE_SPRITES[archetype] || DEFAULT_SPRITE;
}

// Archetype names for display
export const ARCHETYPE_NAMES: Record<number, string> = {
  0: 'Blacksmith',
  1: 'Rogue',
  2: 'Knight',
  3: 'Mage',
  4: 'Robin Hood',
  5: 'Developer',
  6: 'Necromancer',
  7: 'Paladin',
  8: 'Degen',
  9: 'Dragon Tamer',
};
