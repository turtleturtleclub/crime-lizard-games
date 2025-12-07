/**
 * TownHUD Component
 * Displays player stats overlay on the town map
 * Health, Gold, Turns, Level - compact mobile-friendly design
 */

import React from 'react';
import type { PlayerCharacter } from '../../types/legend.types';

interface TownHUDProps {
  player: PlayerCharacter;
  onOpenCharSheet?: () => void;
  onOpenInventory?: () => void;
  nearbyLocation?: string | null;
}

export const TownHUD: React.FC<TownHUDProps> = ({
  player,
  onOpenCharSheet,
  onOpenInventory,
  nearbyLocation,
}) => {
  const healthPercent = Math.round((player.health / player.maxHealth) * 100);
  const xpPercent = Math.round((player.experience / player.experienceToNextLevel) * 100);

  return (
    <div className="town-hud" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      padding: '8px 12px',
      background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 80%, transparent 100%)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      zIndex: 900,
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '10px',
      color: '#fff',
      gap: '8px',
    }}>
      {/* Left section - Character info */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flex: 1,
      }}>
        {/* Name & Level */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
            {player.name}
          </span>
          <span style={{
            background: '#7c3aed',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '8px',
          }}>
            Lv.{player.level}
          </span>
        </div>

        {/* Health bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#ef4444', minWidth: '20px' }}>❤️</span>
          <div style={{
            flex: 1,
            maxWidth: '100px',
            height: '10px',
            background: '#1f2937',
            borderRadius: '5px',
            overflow: 'hidden',
            border: '1px solid #374151',
          }}>
            <div style={{
              width: `${healthPercent}%`,
              height: '100%',
              background: healthPercent > 50
                ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                : healthPercent > 25
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #dc2626, #ef4444)',
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: '8px', minWidth: '50px' }}>
            {player.health}/{player.maxHealth}
          </span>
        </div>

        {/* XP bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#a855f7', minWidth: '20px' }}>⭐</span>
          <div style={{
            flex: 1,
            maxWidth: '100px',
            height: '6px',
            background: '#1f2937',
            borderRadius: '3px',
            overflow: 'hidden',
            border: '1px solid #374151',
          }}>
            <div style={{
              width: `${xpPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: '7px', color: '#9ca3af' }}>
            {xpPercent}%
          </span>
        </div>
      </div>

      {/* Right section - Resources */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '4px',
      }}>
        {/* Gold */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(234, 179, 8, 0.2)',
          padding: '3px 8px',
          borderRadius: '12px',
          border: '1px solid rgba(234, 179, 8, 0.4)',
        }}>
          <span>💰</span>
          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
            {player.gold.toLocaleString()}
          </span>
        </div>

        {/* Turns */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(59, 130, 246, 0.2)',
          padding: '3px 8px',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.4)',
        }}>
          <span>⚡</span>
          <span style={{ color: '#60a5fa' }}>
            {player.turnsRemaining}/{player.maxTurns}
          </span>
        </div>

        {/* Quick actions */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginTop: '2px',
        }}>
          <button
            onClick={onOpenCharSheet}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              padding: '4px 8px',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            title="Character Sheet"
          >
            📋
          </button>
          <button
            onClick={onOpenInventory}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              padding: '4px 8px',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            title="Inventory"
          >
            🎒
          </button>
        </div>
      </div>

      {/* Location indicator (shows when near a building) */}
      {nearbyLocation && (
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.85)',
          border: '2px solid #4ade80',
          borderRadius: '8px',
          padding: '6px 16px',
          whiteSpace: 'nowrap',
          animation: 'pulse 1.5s infinite',
        }}>
          <span style={{ color: '#4ade80' }}>
            Press E or Tap to enter {nearbyLocation}
          </span>
        </div>
      )}
    </div>
  );
};

export default TownHUD;
