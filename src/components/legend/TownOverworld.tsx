/**
 * TownOverworld Component
 * Main 2D overworld map for town navigation
 * Dragon Warrior / Zelda inspired top-down view
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { PlayerSprite } from './PlayerSprite';
import type { Direction } from './PlayerSprite';
import { MobileControls } from './MobileControls';
import { TownHUD } from './TownHUD';
import {
  MAP_CONFIG,
  BUILDINGS,
  getNearbyBuilding,
  isWalkable,
} from '../../data/townMap';
import type { BuildingData } from '../../data/townMap';
import type { PlayerCharacter, GameLocation } from '../../types/legend.types';

interface TownOverworldProps {
  player: PlayerCharacter;
  onEnterLocation: (location: GameLocation | string) => void;
  onOpenCharSheet: () => void;
  onOpenInventory: () => void;
  archetype?: number; // Character archetype (0-9) for sprite skin
}

export const TownOverworld: React.FC<TownOverworldProps> = ({
  player,
  onEnterLocation,
  onOpenCharSheet,
  onOpenInventory,
  archetype,
}) => {
  // Player position state
  const [playerPos, setPlayerPos] = useState({
    x: MAP_CONFIG.spawnX,
    y: MAP_CONFIG.spawnY,
  });
  const [playerDirection, setPlayerDirection] = useState<Direction>('down');
  const [isMoving, setIsMoving] = useState(false);
  const [nearbyBuilding, setNearbyBuilding] = useState<BuildingData | null>(null);
  const [previewBuilding, setPreviewBuilding] = useState<BuildingData | null>(null);
  const [expandedBuilding, setExpandedBuilding] = useState<BuildingData | null>(null);

  // Movement state
  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Viewport/camera state for following player
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState({ x: 0, y: 0 });

  // Detect if mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update viewport size
  useEffect(() => {
    const updateViewport = () => {
      if (containerRef.current) {
        setViewport({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Update camera to follow player
  useEffect(() => {
    const targetX = Math.max(0, Math.min(
      playerPos.x - viewport.width / 2,
      MAP_CONFIG.width - viewport.width
    ));
    const targetY = Math.max(0, Math.min(
      playerPos.y - viewport.height / 2,
      MAP_CONFIG.height - viewport.height
    ));
    setCamera({ x: targetX, y: targetY });
  }, [playerPos, viewport]);

  // Check for nearby buildings and trigger "open up" animation
  useEffect(() => {
    const nearby = getNearbyBuilding(playerPos.x, playerPos.y);
    setNearbyBuilding(nearby || null);

    // When player gets very close to a building (within interaction radius * 0.6), expand it
    if (nearby) {
      const dx = playerPos.x - nearby.x;
      const dy = playerPos.y - nearby.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const closeRadius = MAP_CONFIG.interactionRadius * 0.7;

      if (dist < closeRadius && nearby.levelRequired <= player.level) {
        setExpandedBuilding(nearby);
      } else {
        setExpandedBuilding(null);
      }
    } else {
      setExpandedBuilding(null);
    }
  }, [playerPos, player.level]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for arrow keys to avoid page scroll
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
      }
      keysPressed.current.add(e.key.toLowerCase());

      // Interaction key
      if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && nearbyBuilding) {
        handleEnterBuilding(nearbyBuilding);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nearbyBuilding]);

  // Game loop for movement
  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastUpdateRef.current;

      if (deltaTime >= 16) { // ~60fps cap
        lastUpdateRef.current = timestamp;

        const keys = keysPressed.current;
        let dx = 0;
        let dy = 0;
        let newDirection: Direction | null = null;

        // Check movement keys
        if (keys.has('w') || keys.has('arrowup')) {
          dy -= MAP_CONFIG.playerSpeed;
          newDirection = 'up';
        }
        if (keys.has('s') || keys.has('arrowdown')) {
          dy += MAP_CONFIG.playerSpeed;
          newDirection = 'down';
        }
        if (keys.has('a') || keys.has('arrowleft')) {
          dx -= MAP_CONFIG.playerSpeed;
          newDirection = 'left';
        }
        if (keys.has('d') || keys.has('arrowright')) {
          dx += MAP_CONFIG.playerSpeed;
          newDirection = 'right';
        }

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
          const factor = 0.707; // 1/sqrt(2)
          dx *= factor;
          dy *= factor;
        }

        if (dx !== 0 || dy !== 0) {
          setPlayerPos(prev => {
            const newX = prev.x + dx;
            const newY = prev.y + dy;

            // Check if new position is walkable
            if (isWalkable(newX, newY)) {
              return { x: newX, y: newY };
            } else if (isWalkable(newX, prev.y)) {
              // Try horizontal only
              return { x: newX, y: prev.y };
            } else if (isWalkable(prev.x, newY)) {
              // Try vertical only
              return { x: prev.x, y: newY };
            }
            return prev;
          });

          if (newDirection) {
            setPlayerDirection(newDirection);
          }
          setIsMoving(true);
        } else {
          setIsMoving(false);
        }
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Mobile direction handler
  const handleMobileDirection = useCallback((direction: Direction | null) => {
    keysPressed.current.clear();
    if (direction) {
      const keyMap: Record<Direction, string> = {
        up: 'w',
        down: 's',
        left: 'a',
        right: 'd',
      };
      keysPressed.current.add(keyMap[direction]);
    }
  }, []);

  // Enter building handler
  const handleEnterBuilding = useCallback((building: BuildingData) => {
    // Check level requirement
    if (building.levelRequired > player.level) {
      // Could show a toast/notification here
return;
    }

    onEnterLocation(building.location as GameLocation);
  }, [player.level, onEnterLocation]);

  // Handle interaction button
  const handleInteract = useCallback(() => {
    if (nearbyBuilding) {
      handleEnterBuilding(nearbyBuilding);
    }
  }, [nearbyBuilding, handleEnterBuilding]);

  // Handle tap-to-move
  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return; // Use joystick on mobile

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left + camera.x;
    const clickY = e.clientY - rect.top + camera.y;

    // Check if clicked on a building
    const clickedBuilding = BUILDINGS.find(b => {
      const halfW = b.width / 2;
      const halfH = b.height / 2;
      return (
        clickX >= b.x - halfW &&
        clickX <= b.x + halfW &&
        clickY >= b.y - halfH &&
        clickY <= b.y + halfH
      );
    });

    if (clickedBuilding) {
      // Move toward building then enter
      // For now, just teleport near it
      const targetX = clickedBuilding.x;
      const targetY = clickedBuilding.y + clickedBuilding.height / 2 + 30;
      if (isWalkable(targetX, targetY)) {
        setPlayerPos({ x: targetX, y: targetY });
        setPlayerDirection('up');
      }
    }
  }, [camera, isMobile]);

  return (
    <div
      ref={containerRef}
      className="town-overworld"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        background: '#1a1a2e',
        touchAction: 'none',
      }}
      onClick={handleMapClick}
    >
      {/* HUD */}
      <TownHUD
        player={player}
        onOpenCharSheet={onOpenCharSheet}
        onOpenInventory={onOpenInventory}
        nearbyLocation={nearbyBuilding?.name || null}
      />

      {/* Map container with camera offset */}
      <div
        className="map-viewport"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%)`,
          width: viewport.width,
          height: viewport.height,
          overflow: 'hidden',
        }}
      >
        <div
          className="map-world"
          style={{
            position: 'absolute',
            width: MAP_CONFIG.width,
            height: MAP_CONFIG.height,
            transform: `translate(${-camera.x}px, ${-camera.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          {/* Background map image */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: 'url(/assets/town/town-background.png)',
              backgroundSize: '1600px 1600px',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
              backgroundColor: '#1a472a', // Dark green fallback for edges
            }}
          />

          {/* Buildings layer */}
          {BUILDINGS.map((building) => {
            const isLocked = building.levelRequired > player.level;
            const isNearby = nearbyBuilding?.id === building.id;
            const isExpanded = expandedBuilding?.id === building.id;

            return (
              <div
                key={building.id}
                className="building"
                style={{
                  position: 'absolute',
                  left: building.x - building.width / 2,
                  top: building.y - building.height / 2,
                  width: building.width,
                  height: building.height,
                  cursor: 'pointer',
                  zIndex: isExpanded ? 9000 : Math.floor(building.y),
                  transition: 'z-index 0.3s',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Show building preview instead of entering directly
                  setPreviewBuilding(building);
                }}
              >
                {/* Building sprite with "open up" animation */}
                <img
                  src={`/assets/town/${building.asset}`}
                  alt={building.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                    filter: isLocked
                      ? 'grayscale(50%) brightness(0.7)'
                      : isExpanded
                        ? 'drop-shadow(0 0 20px rgba(74, 222, 128, 0.6)) brightness(1.1)'
                        : 'none',
                    transition: 'transform 0.3s ease-out, filter 0.3s',
                    transform: isExpanded
                      ? 'scale(1.4) translateY(-10%)'
                      : isNearby
                        ? 'scale(1.08)'
                        : 'scale(1)',
                    transformOrigin: 'bottom center',
                  }}
                />
                {/* Glow effect when expanded */}
                {isExpanded && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: '-20%',
                      background: 'radial-gradient(ellipse at center bottom, rgba(74, 222, 128, 0.3) 0%, transparent 70%)',
                      pointerEvents: 'none',
                      zIndex: -1,
                    }}
                  />
                )}

                {/* Locked overlay */}
                {isLocked && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(0,0,0,0.8)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '2px solid #ef4444',
                      fontSize: '10px',
                      color: '#ef4444',
                      fontFamily: "'Press Start 2P', monospace",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🔒 Lv.{building.levelRequired}+
                  </div>
                )}

                {/* Nearby highlight / interaction prompt */}
                {isNearby && !isLocked && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      position: 'absolute',
                      bottom: -50,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      zIndex: 1000,
                    }}
                  >
                    {/* Building name label */}
                    <div style={{
                      background: 'rgba(0,0,0,0.9)',
                      border: '2px solid #4ade80',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      whiteSpace: 'nowrap',
                      fontSize: '10px',
                      fontFamily: "'Press Start 2P', monospace",
                      color: '#4ade80',
                    }}>
                      {building.emoji} {building.name}
                    </div>
                    {/* Enter button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnterBuilding(building);
                      }}
                      style={{
                        background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                        border: '2px solid #4ade80',
                        borderRadius: '6px',
                        padding: '6px 16px',
                        fontSize: '10px',
                        fontFamily: "'Press Start 2P', monospace",
                        color: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.4)',
                        transition: 'transform 0.1s, box-shadow 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.4)';
                      }}
                    >
                      Enter
                    </button>
                  </motion.div>
                )}

                {/* Building label (always visible) */}
                <div
                  style={{
                    position: 'absolute',
                    top: -20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '16px',
                    textShadow: '0 0 4px black, 0 0 4px black',
                  }}
                >
                  {building.emoji}
                </div>
              </div>
            );
          })}

          {/* Player sprite */}
          <PlayerSprite
            x={playerPos.x}
            y={playerPos.y}
            direction={playerDirection}
            isMoving={isMoving}
            scale={1}
            archetype={archetype}
          />
        </div>
      </div>

      {/* Mobile controls */}
      {isMobile && (
        <MobileControls
          onDirectionChange={handleMobileDirection}
          onInteract={handleInteract}
          canInteract={!!nearbyBuilding && nearbyBuilding.levelRequired <= player.level}
          interactLabel={nearbyBuilding?.name || 'Enter'}
        />
      )}

      {/* Desktop instructions */}
      {!isMobile && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#9ca3af',
            fontFamily: "'Press Start 2P', monospace",
          }}
        >
          WASD / Arrows to move • Click buildings to preview
        </div>
      )}

      {/* Building Preview Modal */}
      {previewBuilding && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setPreviewBuilding(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '800px',
              maxHeight: '90vh',
              width: '100%',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '4px solid #4ade80',
              borderRadius: '16px',
              boxShadow: '0 0 40px rgba(74, 222, 128, 0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(90deg, #22c55e 0%, #15803d 100%)',
                padding: '16px 24px',
                borderBottom: '2px solid #4ade80',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>{previewBuilding.emoji}</span>
                <h2
                  style={{
                    fontSize: '18px',
                    fontFamily: "'Press Start 2P', monospace",
                    color: '#fff',
                    margin: 0,
                  }}
                >
                  {previewBuilding.name}
                </h2>
              </div>
              <button
                onClick={() => setPreviewBuilding(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '2px solid #fff',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '20px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                }}
              >
                ×
              </button>
            </div>

            {/* Building Image */}
            <div
              style={{
                flex: 1,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                overflow: 'auto',
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxHeight: '500px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <img
                  src={`/assets/town/${previewBuilding.asset}`}
                  alt={previewBuilding.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '450px',
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                    filter: previewBuilding.levelRequired > player.level ? 'grayscale(80%)' : 'none',
                  }}
                />
              </div>

              {/* Description */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '2px solid #4ade80',
                }}
              >
                <p
                  style={{
                    fontSize: '12px',
                    fontFamily: "'Press Start 2P', monospace",
                    color: '#4ade80',
                    margin: 0,
                    lineHeight: '1.8',
                  }}
                >
                  {previewBuilding.description}
                </p>
                {previewBuilding.levelRequired > 0 && (
                  <p
                    style={{
                      fontSize: '10px',
                      fontFamily: "'Press Start 2P', monospace",
                      color: previewBuilding.levelRequired > player.level ? '#ef4444' : '#9ca3af',
                      margin: '12px 0 0 0',
                    }}
                  >
                    {previewBuilding.levelRequired > player.level
                      ? `🔒 Requires Level ${previewBuilding.levelRequired}`
                      : `✅ Level ${previewBuilding.levelRequired} Required`}
                  </p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '2px solid #4ade80',
                background: 'rgba(0, 0, 0, 0.3)',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setPreviewBuilding(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid #9ca3af',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '10px',
                  fontFamily: "'Press Start 2P', monospace",
                  color: '#9ca3af',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.borderColor = '#fff';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.color = '#9ca3af';
                }}
              >
                Close
              </button>
              {previewBuilding.levelRequired <= player.level && (
                <button
                  onClick={() => {
                    setPreviewBuilding(null);
                    handleEnterBuilding(previewBuilding);
                  }}
                  style={{
                    background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                    border: '2px solid #4ade80',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '10px',
                    fontFamily: "'Press Start 2P', monospace",
                    color: '#fff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)';
                  }}
                >
                  Enter →
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .building:hover img {
          transform: scale(1.05);
        }

        .town-overworld {
          user-select: none;
          -webkit-user-select: none;
        }
      `}</style>
    </div>
  );
};

export default TownOverworld;
