import React from 'react';

// Pixel art icons mapping for common game elements
const ICON_MAP = {
    // Game elements
    lizard: 'moon-star', // closest to lizard theme
    heart: 'heart',
    star: 'moon-star',
    dice: 'dice',
    trophy: 'trophy',

    // Economy
    gold: 'coin',
    cash: 'coin',
    money: 'coin',
    diamond: 'diamond',
    crown: 'crown',

    // Equipment
    shield: 'shield',
    armor: 'shield',
    weapon: 'sword',
    sword: 'sword',

    // Status
    alert: 'alert',
    warning: 'alert',

    // UI elements
    add: 'add-box',
    close: 'close',
    menu: 'menu',
    settings: 'settings',

    // Combat & Actions
    attack: 'sword',
    combat: 'sword',
    battle: 'sword',
    fight: 'sword',
    flee: 'arrow-left',
    run: 'arrow-left',

    // Buildings & Locations
    town: 'building',
    square: 'building',
    bank: 'building',
    shop: 'building',
    hideout: 'home',
    home: 'home',

    // Game mechanics
    experience: 'moon-star',
    exp: 'moon-star',
    level: 'moon-star',
    progress: 'chart',

    // Achievement & Events
    achievement: 'trophy',
    milestone: 'trophy',
    event: 'alert',
    random: 'dice',

    // Characters & NPCs
    player: 'user',
    enemy: 'user',
    boss: 'user',
    npc: 'user',

    // Special
    skull: 'skull',
    key: 'key',
    lock: 'lock',
    chart: 'chart',
} as const;

type PixelIconName = keyof typeof ICON_MAP | string;

interface PixelIconProps {
    name: PixelIconName;
    size?: number;
    className?: string;
    glow?: boolean;
    glowColor?: 'gold' | 'blue' | 'green' | 'red' | 'purple';
    animated?: boolean;
}

const PixelIcon: React.FC<PixelIconProps> = ({
    name,
    size = 24,
    className = '',
    glow = false,
    glowColor = 'gold',
    animated = false,
}) => {
    // Get the actual icon filename
    const iconKey = ICON_MAP[name as keyof typeof ICON_MAP] || name;
    const iconPath = `https://unpkg.com/pixelarticons@1.8.0/svg/${iconKey}.svg`;

    // Glow color classes
    const glowClasses = {
        gold: 'drop-shadow-[0_0_8px_#FFD700] drop-shadow-[0_0_16px_#FFD700]',
        blue: 'drop-shadow-[0_0_8px_#00BFFF] drop-shadow-[0_0_16px_#00BFFF]',
        green: 'drop-shadow-[0_0_8px_#00FF88] drop-shadow-[0_0_16px_#00FF88]',
        red: 'drop-shadow-[0_0_8px_#FF0000] drop-shadow-[0_0_16px_#FF0000]',
        purple: 'drop-shadow-[0_0_8px_#FF00FF] drop-shadow-[0_0_16px_#FF00FF]',
    };

    const baseClasses = `inline-block pixel-art ${glow ? glowClasses[glowColor] : ''} ${animated ? 'animate-pulse' : ''} ${className}`;

    return (
        <img
            src={iconPath}
            alt={`${name} icon`}
            width={size}
            height={size}
            className={baseClasses}
        />
    );
};

export default PixelIcon;
