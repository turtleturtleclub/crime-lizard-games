/**
 * MobileControls Component
 * Touch-friendly D-pad/joystick for mobile town navigation
 */

import React, { useCallback, useRef, useState } from 'react';
import type { Direction } from './PlayerSprite';

interface MobileControlsProps {
  onDirectionChange: (direction: Direction | null) => void;
  onInteract: () => void;
  canInteract: boolean;
  interactLabel?: string;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onDirectionChange,
  onInteract,
  canInteract,
  interactLabel = 'Enter',
}) => {
  const [activeDirection, setActiveDirection] = useState<Direction | null>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);

  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsJoystickActive(true);
    handleJoystickMove(e);
  }, []);

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    if (!joystickRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const touch = e.touches[0];
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;

    // Clamp to joystick radius
    const maxRadius = 40;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const clampedX = distance > maxRadius ? (deltaX / distance) * maxRadius : deltaX;
    const clampedY = distance > maxRadius ? (deltaY / distance) * maxRadius : deltaY;

    setJoystickPos({ x: clampedX, y: clampedY });

    // Determine direction based on angle
    if (distance > 15) { // Dead zone
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      let dir: Direction;

      if (angle >= -45 && angle < 45) {
        dir = 'right';
      } else if (angle >= 45 && angle < 135) {
        dir = 'down';
      } else if (angle >= -135 && angle < -45) {
        dir = 'up';
      } else {
        dir = 'left';
      }

      if (dir !== activeDirection) {
        setActiveDirection(dir);
        onDirectionChange(dir);
      }
    } else {
      if (activeDirection !== null) {
        setActiveDirection(null);
        onDirectionChange(null);
      }
    }
  }, [activeDirection, onDirectionChange]);

  const handleJoystickEnd = useCallback(() => {
    setIsJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    setActiveDirection(null);
    onDirectionChange(null);
  }, [onDirectionChange]);

  // D-pad button handlers
  const handleDpadPress = useCallback((dir: Direction) => {
    setActiveDirection(dir);
    onDirectionChange(dir);
  }, [onDirectionChange]);

  const handleDpadRelease = useCallback(() => {
    setActiveDirection(null);
    onDirectionChange(null);
  }, [onDirectionChange]);

  return (
    <div className="mobile-controls" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '180px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 20px 20px',
      pointerEvents: 'none',
      zIndex: 1000,
    }}>
      {/* Virtual Joystick (Left side) */}
      <div
        ref={joystickRef}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
      >
        {/* Joystick knob */}
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: isJoystickActive
            ? 'linear-gradient(145deg, #4ade80, #22c55e)'
            : 'linear-gradient(145deg, #666, #444)',
          border: '2px solid rgba(255,255,255,0.5)',
          transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
          transition: isJoystickActive ? 'none' : 'transform 0.1s',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }} />
      </div>

      {/* D-Pad Alternative (can be hidden if joystick preferred) */}
      <div style={{
        display: 'none', // Hidden by default, joystick is primary
        width: '140px',
        height: '140px',
        position: 'relative',
      }}>
        {/* Up */}
        <button
          onTouchStart={() => handleDpadPress('up')}
          onTouchEnd={handleDpadRelease}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '45px',
            height: '45px',
            background: activeDirection === 'up' ? '#22c55e' : 'rgba(0,0,0,0.6)',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '20px',
            pointerEvents: 'auto',
          }}
        >▲</button>
        {/* Down */}
        <button
          onTouchStart={() => handleDpadPress('down')}
          onTouchEnd={handleDpadRelease}
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '45px',
            height: '45px',
            background: activeDirection === 'down' ? '#22c55e' : 'rgba(0,0,0,0.6)',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '20px',
            pointerEvents: 'auto',
          }}
        >▼</button>
        {/* Left */}
        <button
          onTouchStart={() => handleDpadPress('left')}
          onTouchEnd={handleDpadRelease}
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '45px',
            height: '45px',
            background: activeDirection === 'left' ? '#22c55e' : 'rgba(0,0,0,0.6)',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '20px',
            pointerEvents: 'auto',
          }}
        >◄</button>
        {/* Right */}
        <button
          onTouchStart={() => handleDpadPress('right')}
          onTouchEnd={handleDpadRelease}
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '45px',
            height: '45px',
            background: activeDirection === 'right' ? '#22c55e' : 'rgba(0,0,0,0.6)',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '20px',
            pointerEvents: 'auto',
          }}
        >►</button>
      </div>

      {/* Action Button (Right side) */}
      <button
        onClick={onInteract}
        disabled={!canInteract}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: canInteract
            ? 'linear-gradient(145deg, #f59e0b, #d97706)'
            : 'rgba(0, 0, 0, 0.4)',
          border: canInteract
            ? '3px solid #fbbf24'
            : '3px solid rgba(255,255,255,0.2)',
          color: canInteract ? '#000' : 'rgba(255,255,255,0.4)',
          fontSize: '14px',
          fontWeight: 'bold',
          fontFamily: 'inherit',
          cursor: canInteract ? 'pointer' : 'default',
          pointerEvents: 'auto',
          boxShadow: canInteract
            ? '0 4px 15px rgba(245, 158, 11, 0.4)'
            : 'none',
          transition: 'all 0.2s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
        }}
      >
        <span style={{ fontSize: '20px' }}>🚪</span>
        <span>{interactLabel}</span>
      </button>
    </div>
  );
};

export default MobileControls;
