/**
 * PlayerSprite Component
 * Animated player character sprite for the 2D town overworld
 * Handles walk animations in 4 directions
 * Supports different archetype skins
 */

import React, { useEffect, useState } from 'react';
import { getArchetypeSprite } from '../../data/archetypeSprites';

export type Direction = 'down' | 'up' | 'left' | 'right';

interface PlayerSpriteProps {
  x: number;
  y: number;
  direction: Direction;
  isMoving: boolean;
  scale?: number;
  archetype?: number; // Character archetype (0-9) for different skins
}

// Sprite sheet configuration
// Each sprite sheet is 1024x1024 with 4x4 grid (256px per frame)
const SPRITE_CONFIG = {
  sheetWidth: 1024,
  sheetHeight: 1024,
  cols: 4,
  rows: 4,
  frameWidth: 256, // 1024 / 4
  frameHeight: 256, // 1024 / 4
  displaySize: 64, // Final rendered size
};

// Frame mapping - sprites are arranged in rows by direction
// Each row has 4 frames for walking animation
const DIRECTION_FRAMES: Record<Direction, { row: number; cols: number[] }> = {
  down: { row: 0, cols: [0, 1, 2, 3] },
  up: { row: 1, cols: [0, 1, 2, 3] },
  left: { row: 2, cols: [0, 1, 2, 3] },
  right: { row: 3, cols: [0, 1, 2, 3] },
};

export const PlayerSprite: React.FC<PlayerSpriteProps> = ({
  x,
  y,
  direction,
  isMoving,
  scale = 1,
  archetype,
}) => {
  const [frameIndex, setFrameIndex] = useState(0);

  // Get the sprite filename based on archetype
  const spriteFile = getArchetypeSprite(archetype);

  // Animation loop
  useEffect(() => {
    if (!isMoving) {
      setFrameIndex(1); // Standing frame (middle)
      return;
    }

    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % 4);
    }, 120); // ~8 fps animation

    return () => clearInterval(interval);
  }, [isMoving]);

  const frameData = DIRECTION_FRAMES[direction];
  const col = frameData.cols[frameIndex];
  const row = frameData.row;

  const size = SPRITE_CONFIG.displaySize * scale;

  // Calculate sprite sheet scaling
  // We want to scale the entire sheet so each frame fits in our display size
  const scaleFactor = size / SPRITE_CONFIG.frameWidth;
  const scaledSheetWidth = SPRITE_CONFIG.sheetWidth * scaleFactor;
  const scaledSheetHeight = SPRITE_CONFIG.sheetHeight * scaleFactor;

  // Calculate which frame to show (position in the scaled sheet)
  const backgroundX = -(col * size);
  const backgroundY = -(row * size);

  return (
    <div
      className="player-sprite"
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        backgroundImage: `url(/assets/town/${spriteFile})`,
        backgroundSize: `${scaledSheetWidth}px ${scaledSheetHeight}px`,
        backgroundPosition: `${backgroundX}px ${backgroundY}px`,
        imageRendering: 'pixelated',
        zIndex: 100,
        pointerEvents: 'none',
        // Add subtle shadow under player
        filter: 'drop-shadow(2px 4px 3px rgba(0,0,0,0.5))',
        transition: isMoving ? 'none' : 'left 0.1s, top 0.1s',
      }}
    />
  );
};

export default PlayerSprite;
