/**
 * Town Map Data Structure
 * Defines building positions, interaction zones, and map configuration
 * for the 2D overworld town view
 */

import type { GameLocation } from '../types/legend.types';

// Map dimensions (in pixels at 1x scale)
export const MAP_CONFIG = {
  width: 1600,
  height: 1600,
  // Player spawn position (center of town square)
  spawnX: 800,
  spawnY: 800,
  // Movement speed (pixels per frame at 60fps)
  playerSpeed: 4,
  // Interaction distance (how close to trigger building prompt)
  interactionRadius: 70,
};

// Building/location definition
export interface BuildingData {
  id: string;
  name: string;
  location: GameLocation | 'weapons_shop' | 'armor_shop' | 'bug_report' | 'dice';
  // Position on map (center point)
  x: number;
  y: number;
  // Size for collision/interaction
  width: number;
  height: number;
  // Asset filename
  asset: string;
  // Display scale (buildings are large images, need to scale down)
  scale: number;
  // Level requirement (0 = none)
  levelRequired: number;
  // Whether this opens as full scene or modal
  isFullScene: boolean;
  // Short description shown on hover/approach
  description: string;
  // Emoji for UI
  emoji: string;
}

// All town buildings with their positions
// Positions designed for 1600x1600 map with thematic clustering
// Buildings are sized larger (1.5-2x) for better visibility and interaction
export const BUILDINGS: BuildingData[] = [
  // === NORTHWEST (Dark Forest Area) ===
  {
    id: 'forest',
    name: 'Dark Forest',
    location: 'forest',
    x: 200,
    y: 180,
    width: 220,
    height: 200,
    asset: 'building-forest.png',
    scale: 0.22,
    levelRequired: 0,
    isFullScene: true,
    description: 'Hunt monsters for gold & XP',
    emoji: '🌲',
  },

  // === NORTH (Noble/Castle District) ===
  {
    id: 'castle',
    name: 'The Castle',
    location: 'castle',
    x: 800,
    y: 150,
    width: 280,
    height: 260,
    asset: 'building-castle.png',
    scale: 0.28,
    levelRequired: 5,
    isFullScene: true,
    description: 'Heist wealthy nobles',
    emoji: '🏰',
  },

  // === NORTHEAST (Crime Lord's Territory) ===
  {
    id: 'crime_lord',
    name: "Crime Lord's Lair",
    location: 'crime_lord_lair',
    x: 1400,
    y: 180,
    width: 200,
    height: 200,
    asset: 'building-crimelord.png',
    scale: 0.2,
    levelRequired: 10,
    isFullScene: true,
    description: 'Face the ultimate evil',
    emoji: '👹',
  },

  // === WEST (Market/Shopping District) ===
  {
    id: 'weapons',
    name: 'Weapons Shop',
    location: 'weapons_shop',
    x: 250,
    y: 480,
    width: 160,
    height: 160,
    asset: 'building-weapons.png',
    scale: 0.16,
    levelRequired: 0,
    isFullScene: false,
    description: 'Buy swords & daggers',
    emoji: '⚔️',
  },
  {
    id: 'armor',
    name: 'Armor Shop',
    location: 'armor_shop',
    x: 250,
    y: 700,
    width: 160,
    height: 160,
    asset: 'building-armor.png',
    scale: 0.16,
    levelRequired: 0,
    isFullScene: false,
    description: 'Buy shields & armor',
    emoji: '🛡️',
  },
  {
    id: 'bank',
    name: 'The Scaly Satchel',
    location: 'bank',
    x: 480,
    y: 580,
    width: 180,
    height: 170,
    asset: 'building-bank.png',
    scale: 0.18,
    levelRequired: 0,
    isFullScene: false,
    description: "Gribnak's shop & bank",
    emoji: '💰',
  },

  // === TOWN SQUARE (Center) ===
  {
    id: 'quest_board',
    name: 'Quest Board',
    location: 'arena',
    x: 700,
    y: 800,
    width: 100,
    height: 120,
    asset: 'building-questboard.png',
    scale: 0.12,
    levelRequired: 0,
    isFullScene: false,
    description: 'Browse available quests',
    emoji: '📜',
  },
  {
    id: 'news',
    name: 'Daily News',
    location: 'daily_news',
    x: 900,
    y: 800,
    width: 100,
    height: 100,
    asset: 'building-news.png',
    scale: 0.1,
    levelRequired: 0,
    isFullScene: false,
    description: 'Read realm happenings',
    emoji: '📰',
  },

  // === EAST (Combat District) ===
  {
    id: 'arena',
    name: 'The Arena',
    location: 'player_list',
    x: 1350,
    y: 550,
    width: 200,
    height: 200,
    asset: 'building-arena.png',
    scale: 0.2,
    levelRequired: 0,
    isFullScene: false,
    description: 'PVP battles',
    emoji: '⚔️',
  },
  {
    id: 'boss_queue',
    name: 'War Tent',
    location: 'boss_queue',
    x: 1350,
    y: 820,
    width: 170,
    height: 170,
    asset: 'building-bossqueue.png',
    scale: 0.17,
    levelRequired: 0,
    isFullScene: false,
    description: 'Team boss raids',
    emoji: '👥',
  },

  // === NORTHWEST (Residential/Services) ===
  {
    id: 'inn',
    name: 'The Inn',
    location: 'inn',
    x: 480,
    y: 350,
    width: 180,
    height: 165,
    asset: 'building-inn.png',
    scale: 0.18,
    levelRequired: 0,
    isFullScene: false,
    description: 'Sleep safely & restore turns',
    emoji: '🏨',
  },
  {
    id: 'healer',
    name: "Healer's Hut",
    location: 'healer',
    x: 700,
    y: 350,
    width: 150,
    height: 150,
    asset: 'building-healer.png',
    scale: 0.15,
    levelRequired: 0,
    isFullScene: false,
    description: 'Restore your health',
    emoji: '⚕️',
  },

  // === SOUTH (Entertainment/Vice District) ===
  {
    id: 'brothel',
    name: "Violet's Establishment",
    location: 'brothel',
    x: 300,
    y: 1200,
    width: 170,
    height: 170,
    asset: 'building-brothel.png',
    scale: 0.17,
    levelRequired: 0,
    isFullScene: false,
    description: 'Stat bonuses & protection',
    emoji: '💋',
  },
  {
    id: 'casino',
    name: 'Crime Lizard Casino',
    location: 'casino',
    x: 600,
    y: 1250,
    width: 200,
    height: 180,
    asset: 'building-casino.png',
    scale: 0.2,
    levelRequired: 0,
    isFullScene: true,
    description: 'Gamble for gold & XP',
    emoji: '🎰',
  },
  {
    id: 'dice',
    name: 'Dice Den',
    location: 'dice',
    x: 900,
    y: 1250,
    width: 170,
    height: 170,
    asset: 'building-casino.png',
    scale: 0.17,
    levelRequired: 0,
    isFullScene: true,
    description: 'Roll the dice!',
    emoji: '🎲',
  },
  {
    id: 'predictions',
    name: 'Prediction Market',
    location: 'predictions',
    x: 1100,
    y: 1250,
    width: 170,
    height: 170,
    asset: 'building-casino.png',
    scale: 0.17,
    levelRequired: 0,
    isFullScene: true,
    description: 'Bet on crypto & events!',
    emoji: '🔮',
  },

  // === SOUTHEAST (Slums) ===
  {
    id: 'poor_district',
    name: 'Rekt District',
    location: 'poor_district',
    x: 1300,
    y: 1200,
    width: 160,
    height: 150,
    asset: 'building-poordistrict.png',
    scale: 0.16,
    levelRequired: 0,
    isFullScene: false,
    description: 'Help poor players',
    emoji: '💀',
  },
];

// Player sprite configuration
export const PLAYER_SPRITE_CONFIG = {
  asset: 'player-sprite.png',
  frameWidth: 341, // ~1024/3 for 3 columns
  frameHeight: 341, // ~1024/3 for 3 rows (DALL-E made a different layout)
  scale: 0.12, // Scale down to ~40px
  // Animation frames per direction
  // Based on the generated sprite sheet layout
  animations: {
    down: { row: 0, frames: 3 },
    up: { row: 0, frames: 3 }, // Will adjust based on actual sprite
    left: { row: 1, frames: 3 },
    right: { row: 2, frames: 3 },
  },
  frameRate: 8, // Frames per second for walk animation
};

// Get building by location ID
export function getBuildingByLocation(location: string): BuildingData | undefined {
  return BUILDINGS.find(b => b.location === location || b.id === location);
}

// Get building at position (for collision/interaction detection)
export function getBuildingAtPosition(x: number, y: number): BuildingData | undefined {
  return BUILDINGS.find(building => {
    const halfW = building.width / 2;
    const halfH = building.height / 2;
    return (
      x >= building.x - halfW &&
      x <= building.x + halfW &&
      y >= building.y - halfH &&
      y <= building.y + halfH
    );
  });
}

// Get nearby building within interaction radius
export function getNearbyBuilding(
  playerX: number,
  playerY: number,
  radius: number = MAP_CONFIG.interactionRadius
): BuildingData | undefined {
  let closest: BuildingData | undefined;
  let closestDist = Infinity;

  for (const building of BUILDINGS) {
    const dx = playerX - building.x;
    const dy = playerY - building.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < radius && dist < closestDist) {
      closest = building;
      closestDist = dist;
    }
  }

  return closest;
}

// Check if position is walkable (not inside a building)
export function isWalkable(x: number, y: number, margin: number = 20): boolean {
  // Check map boundaries
  if (x < margin || x > MAP_CONFIG.width - margin) return false;
  if (y < margin || y > MAP_CONFIG.height - margin) return false;

  // Check building collisions
  for (const building of BUILDINGS) {
    const halfW = (building.width / 2) + margin;
    const halfH = (building.height / 2) + margin;
    if (
      x >= building.x - halfW &&
      x <= building.x + halfW &&
      y >= building.y - halfH &&
      y <= building.y + halfH
    ) {
      return false;
    }
  }

  return true;
}
