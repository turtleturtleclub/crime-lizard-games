import React from 'react';
import ASCIIBar from './ASCIIBar';
import type { PlayerCharacter, Enemy } from '../../types/legend.types';
import { useLanguage } from '../../contexts/LanguageContext';

interface BattleHeaderProps {
    player: PlayerCharacter;
    enemy: Enemy | null;
    enemyHealth: number;
}

const BattleHeader: React.FC<BattleHeaderProps> = ({ player, enemy, enemyHealth }) => {
    const { t } = useLanguage();

    if (!enemy) return null;

    return (
        <div className="bg-black border-2 border-yellow-500 p-3 mb-3 shadow-lg">
            {/* Battle Title */}
            <div className="text-center text-yellow-500 font-bbs text-sm mb-2 tracking-wider">
                ⚔️ {t.legend.combat.battleInProgress} ⚔️
            </div>

            {/* Mobile: Compact Side-by-Side Layout */}
            <div className="md:hidden">
                <div className="grid grid-cols-2 gap-2">
                    {/* Player Column */}
                    <div className="bg-[#00AA55]/20 border border-[#00FF88] p-2 rounded">
                        <div className="text-green-400 font-bbs text-xs mb-1 flex items-center">
                            <span className="mr-1">🦎</span>
                            <span className="truncate">{player.name}</span>
                        </div>
                        <div className="text-[#00FF88] font-bbs text-xs mb-1">
                            {t.legend.combat.lvl} {player.level}
                        </div>
                        <ASCIIBar
                            current={player.health}
                            max={player.maxHealth}
                            width={12}
                            label="HP"
                            color="green"
                        />
                        <div className="text-gray-400 font-bbs text-xs mt-1 space-y-0.5">
                            <div>ATK: {player.strength + (player.weapon?.attackBonus || 0)}</div>
                            <div>DEF: {player.defense + (player.armor?.defenseBonus || 0)}</div>
                        </div>
                    </div>

                    {/* Enemy Column */}
                    <div className="bg-red-900/20 border border-red-500 p-2 rounded">
                        <div className="text-red-400 font-bbs text-xs mb-1 flex items-center">
                            <span className="mr-1">👹</span>
                            <span className="truncate">{enemy.name}</span>
                        </div>
                        <div className="text-red-500 font-bbs text-xs mb-1">
                            {t.legend.combat.lvl} {enemy.level}
                        </div>
                        <ASCIIBar
                            current={enemyHealth}
                            max={enemy.maxHealth}
                            width={12}
                            label="HP"
                            color="red"
                        />
                        <div className="text-gray-400 font-bbs text-xs mt-1 space-y-0.5">
                            <div>ATK: {enemy.strength}</div>
                            <div>DEF: {enemy.defense}</div>
                        </div>
                    </div>
                </div>

                {/* Mobile: Battle Info Row */}
                <div className="mt-2 pt-2 border-t border-gray-700 grid grid-cols-3 gap-2 text-center">
                    <div className="text-xs">
                        <div className="text-gray-500">{t.legend.stats.gold}</div>
                        <div className="text-yellow-400 font-bbs">💰 {(player.gold || 0).toLocaleString()}</div>
                    </div>
                    <div className="text-xs">
                        <div className="text-gray-500">{t.legend.stats.turns}</div>
                        <div className="text-blue-400 font-bbs">⚔️ {player.turnsRemaining || 0}/{player.maxTurns || 0}</div>
                    </div>
                    <div className="text-xs">
                        <div className="text-gray-500">XP</div>
                        <div className="text-purple-400 font-bbs">✨ {player.experience || 0}/{player.experienceToNextLevel || 0}</div>
                    </div>
                </div>
            </div>

            {/* Desktop: Traditional Layout */}
            <div className="hidden md:block">
                <div className="grid grid-cols-2 gap-4">
                    {/* Player Column */}
                    <div className="bg-[#00AA55]/20 border border-[#00FF88] p-3 rounded">
                        <div className="text-[#00FF88] text-glow-green font-bbs text-lg mb-2 flex items-center">
                            <span className="mr-2">🦎</span>
                            <span>{player.name}</span>
                            <span className="ml-2 text-sm">[{t.legend.combat.lvl} {player.level}]</span>
                        </div>
                        <ASCIIBar
                            current={player.health}
                            max={player.maxHealth}
                            width={20}
                            label="HP"
                            color="green"
                        />
                        <div className="text-gray-400 font-bbs text-sm mt-2 flex justify-between">
                            <span>ATK: {player.strength + (player.weapon?.attackBonus || 0)}</span>
                            <span>DEF: {player.defense + (player.armor?.defenseBonus || 0)}</span>
                        </div>
                        <div className="text-gray-400 font-bbs text-xs mt-2 flex justify-between">
                            <span>💰 {(player.gold || 0).toLocaleString()}</span>
                            <span>⚔️ {player.turnsRemaining || 0}/{player.maxTurns || 0}</span>
                            <span>✨ {player.experience || 0}/{player.experienceToNextLevel || 0}</span>
                        </div>
                    </div>

                    {/* Enemy Column */}
                    <div className="bg-red-900/20 border border-red-500 p-3 rounded">
                        <div className="text-red-500 text-glow-red font-bbs text-lg mb-2 flex items-center">
                            <span className="mr-2">👹</span>
                            <span>{enemy.name}</span>
                            <span className="ml-2 text-sm">[{t.legend.combat.lvl} {enemy.level}]</span>
                        </div>
                        <ASCIIBar
                            current={enemyHealth}
                            max={enemy.maxHealth}
                            width={20}
                            label="HP"
                            color="red"
                        />
                        <div className="text-gray-400 font-bbs text-sm mt-2 flex justify-between">
                            <span>ATK: {enemy.strength}</span>
                            <span>DEF: {enemy.defense}</span>
                        </div>
                        {enemy.specialAbility && (
                            <div className="text-yellow-500 font-bbs text-xs mt-2">
                                ⚠️ {enemy.specialAbility.name}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BattleHeader;
