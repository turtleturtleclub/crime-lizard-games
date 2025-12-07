import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlayerCharacter } from '../../types/legend.types';
import { useLanguage } from '../../contexts/LanguageContext';
import ASCIIBar from './ASCIIBar';

interface GameHeaderProps {
    player: PlayerCharacter;
    onShowCharSheet: () => void;
    onShowLeaderboard?: () => void;
    onShowCharProfile?: () => void;
    onShowStatus?: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({ player, onShowCharSheet, onShowLeaderboard, onShowCharProfile, onShowStatus }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Get location display info
    const getLocationInfo = () => {
        const isAtSafeZone = player.location === 'inn' || player.location === 'brothel';
        const locationEmoji = player.location === 'inn' ? '🏨' :
                             player.location === 'brothel' ? '💋' :
                             player.location === 'town' ? '🏛️' :
                             player.location === 'forest' ? '🌲' :
                             player.location === 'bank' ? '🏦' :
                             player.location === 'healer' ? '💊' :
                             '📍';

        return { isAtSafeZone, locationEmoji };
    };

    const { isAtSafeZone, locationEmoji } = getLocationInfo();

    return (
        <div className="bg-black border-b-2 border-[#00FF88] sticky top-0 z-40 shadow-lg shadow-green-500/20 overflow-x-hidden">
            <div className="w-full max-w-full px-2 md:container md:mx-auto md:px-4 py-2 overflow-x-hidden">
                {/* MOBILE: Single consolidated card with all info */}
                <div className="md:hidden font-bbs w-full max-w-full overflow-x-hidden">
                    <div className="border border-[#00FF88] bg-black p-2 w-full max-w-full overflow-x-hidden">
                        {/* Character Name & Level */}
                        <div className="text-yellow-500 text-glow-gold text-base mb-2 font-bold flex items-center justify-between">
                            <span
                                className="truncate cursor-pointer hover:text-[#FFD700] transition-colors"
                                onClick={onShowCharProfile}
                                title="Click to view character profile"
                            >
                                🦎 {player.name} [Lv {player.level}]
                            </span>
                            <button
                                onClick={() => {
                                    navigate('/');
                                    window.location.href = '/';
                                }}
                                className="text-xs text-gray-500 hover:text-[#00FF88] ml-2 flex-shrink-0"
                                title="Return to Dashboard"
                            >
                                ← EXIT
                            </button>
                        </div>

                        {/* HP and XP Bars - Compact */}
                        <div className="space-y-1 mb-2 text-xs">
                            <ASCIIBar
                                current={player.health}
                                max={player.maxHealth}
                                width={12}
                                label={t.legend.stats.hp}
                                color="red"
                                showNumbers={true}
                            />
                            <ASCIIBar
                                current={player.experience}
                                max={player.experienceToNextLevel}
                                width={12}
                                label={t.legend.stats.xp}
                                color="blue"
                                showNumbers={true}
                            />
                        </div>

                        {/* Resources - Compact Grid */}
                        <div className="grid grid-cols-3 gap-2 text-xs mb-2 w-full max-w-full">
                            <div className="text-center min-w-0">
                                <div className="text-yellow-500">💰</div>
                                <div className="text-white font-bold truncate">{player.gold.toLocaleString()}</div>
                            </div>
                            <div className="text-center min-w-0">
                                <div className="text-blue-400">⚔️</div>
                                <div className="text-white font-bold truncate">{player.turnsRemaining}/{player.maxTurns}</div>
                            </div>
                            <div className="text-center min-w-0">
                                <div className="text-purple-400">🏦</div>
                                <div className="text-white font-bold truncate">{player.goldInBank?.toLocaleString() || 0}</div>
                            </div>
                        </div>

                        {/* Quick Links - Compact */}
                        <div className="text-xs text-gray-500 border-t border-[#00AA55] pt-2 w-full max-w-full overflow-x-hidden">
                            <span
                                onClick={onShowCharSheet}
                                className="cursor-pointer hover:text-[#00FF88] hover:underline"
                            >
                                📋 Sheet
                            </span>
                            {onShowCharProfile && (
                                <>
                                    {' | '}
                                    <span
                                        onClick={onShowCharProfile}
                                        className="cursor-pointer hover:text-yellow-500 hover:underline"
                                    >
                                        🎒 Inv
                                    </span>
                                </>
                            )}
                            {onShowLeaderboard && (
                                <>
                                    {' | '}
                                    <span
                                        onClick={onShowLeaderboard}
                                        className="cursor-pointer hover:text-[#00FF88] hover:underline"
                                    >
                                        🏆 Rewards
                                    </span>
                                </>
                            )}
                            {onShowStatus && (
                                <>
                                    {' | '}
                                    <span
                                        onClick={onShowStatus}
                                        className={`cursor-pointer hover:underline ${
                                            isAtSafeZone
                                                ? player.sleptSafely
                                                    ? 'text-green-400 hover:text-green-300'
                                                    : 'text-yellow-400 hover:text-yellow-300'
                                                : 'text-cyan-400 hover:text-cyan-300'
                                        }`}
                                        title={`${locationEmoji} ${player.location}${isAtSafeZone ? (player.sleptSafely ? ' - Protected' : ' - Not Protected!') : ''}`}
                                    >
                                        {locationEmoji} Status
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* DESKTOP: Original 3-column layout */}
                <div className="hidden md:grid md:grid-cols-3 gap-4 font-bbs">
                    {/* Left: Character */}
                    <div className="border border-[#00FF88] bg-black p-3">
                        <div className="text-yellow-500 text-glow-gold text-xl mb-2 flex items-center justify-between">
                            <span
                                className="cursor-pointer hover:text-[#FFD700] transition-colors"
                                onClick={onShowCharProfile}
                                title="Click to view character profile"
                            >
                                🦎 {player.name} [{t.legend.stats.level} {player.level}]
                            </span>
                            <button
                                onClick={() => {
                                    navigate('/');
                                    window.location.href = '/';
                                }}
                                className="text-xs text-gray-500 hover:text-[#00FF88] ml-2"
                                title="Return to Dashboard"
                            >
                                ← EXIT
                            </button>
                        </div>
                        <div className="text-xs text-gray-500">
                            <span
                                onClick={onShowCharSheet}
                                className="cursor-pointer hover:text-[#00FF88] hover:underline"
                            >
                                📋 {t.legend.header.characterSheet}
                            </span>
                            {onShowCharProfile && (
                                <>
                                    {' | '}
                                    <span
                                        onClick={onShowCharProfile}
                                        className="cursor-pointer hover:text-yellow-500 hover:underline"
                                    >
                                        🎒 Inventory
                                    </span>
                                </>
                            )}
                            {onShowLeaderboard && (
                                <>
                                    {' | '}
                                    <span
                                        onClick={onShowLeaderboard}
                                        className="cursor-pointer hover:text-[#00FF88] hover:underline"
                                    >
                                        🏆 {t.legend.header.rewards}
                                    </span>
                                </>
                            )}
                            {onShowStatus && (
                                <>
                                    {' | '}
                                    <span
                                        onClick={onShowStatus}
                                        className={`cursor-pointer hover:underline ${
                                            isAtSafeZone
                                                ? player.sleptSafely
                                                    ? 'text-green-400 hover:text-green-300'
                                                    : 'text-yellow-400 hover:text-yellow-300'
                                                : 'text-cyan-400 hover:text-cyan-300'
                                        }`}
                                        title={`${locationEmoji} ${player.location}${isAtSafeZone ? (player.sleptSafely ? ' - Protected' : ' - Not Protected!') : ''}`}
                                    >
                                        {locationEmoji} Status
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Middle: Stats */}
                    <div className="border border-[#00FF88] bg-black p-3 space-y-1">
                        <ASCIIBar
                            current={player.health}
                            max={player.maxHealth}
                            width={15}
                            label={t.legend.stats.hp}
                            color="red"
                            showNumbers={true}
                        />
                        <ASCIIBar
                            current={player.experience}
                            max={player.experienceToNextLevel}
                            width={15}
                            label={t.legend.stats.xp}
                            color="blue"
                            showNumbers={true}
                        />
                    </div>

                    {/* Right: Resources */}
                    <div className="border border-[#00FF88] bg-black p-3 font-bbs text-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-yellow-500 text-glow-gold">💰 {t.legend.stats.gold}:</span>
                            <span className="text-white">{player.gold.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-blue-400 text-glow-blue">⚔️ {t.legend.stats.turns}:</span>
                            <span className="text-white">
                                {player.turnsRemaining}/{player.maxTurns}
                                {player.lastTurnBonus && player.lastTurnBonus > 0 && (
                                    <span
                                        className="text-green-400 ml-2 cursor-help text-sm"
                                        title={player.lastTurnBonusReasons?.join(', ') || 'Bonus turns'}
                                    >
                                        (+{player.lastTurnBonus} 🎁)
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-sm">
                            <span className="text-purple-400">📊 {t.legend.stats.bank}:</span>
                            <span className="text-white">{player.goldInBank?.toLocaleString() || 0}</span>
                        </div>
                        {player.lastTurnBonus && player.lastTurnBonus > 0 && player.lastTurnBonusReasons && (
                            <div className="mt-2 pt-2 border-t border-[#00AA55]">
                                <div className="text-xs text-green-400">🎁 Turn Bonuses:</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {player.lastTurnBonusReasons.map((reason, i) => (
                                        <div key={i}>• {reason}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameHeader;
