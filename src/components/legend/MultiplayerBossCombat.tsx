import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerCharacter } from '../../types/legend.types';
import { MULTIPLAYER_BOSSES } from '../../types/archetype.types';

export interface PartyMember {
    walletAddress: string;
    name: string;
    level: number;
    archetype: string;
    role: 'damage' | 'tank' | 'support' | 'balanced';
    currentHP: number;
    maxHP: number;
    status: string[];
    ready: boolean;
}

export interface BattleRaid {
    id: string;
    bossId: string;
    bossName: string;
    bossLevel: number;
    bossHP: number;
    bossMaxHP: number;
    bossStatus: string[];
    phase: number;
    totalPhases: number;
    partyMembers: PartyMember[];
    requiredPlayers: number;
    requiredRoles?: string[];
    startTime?: Date | null;
    status: 'waiting' | 'ready' | 'in_progress' | 'completed';
}

export interface BattleRewards {
    gold: number;
    xp: number;
    specialLoot: string[];
}

interface CombatAction {
    playerId: string;
    playerName: string;
    action: 'attack' | 'defend' | 'heal' | 'skill';
    target?: string;
    damage?: number;
    healing?: number;
    message: string;
    timestamp: Date;
}

interface MultiplayerBossCombatProps {
    raid: BattleRaid;
    player: PlayerCharacter;
    onBattleEnd: (victory: boolean, rewards: BattleRewards) => void;
}

const MultiplayerBossCombat: React.FC<MultiplayerBossCombatProps> = ({
    raid,
    player,
    onBattleEnd
}) => {
    const [combatLog, setCombatLog] = useState<CombatAction[]>([]);
    const [currentTurn, setCurrentTurn] = useState(0);
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);
    const [raidState, setRaidState] = useState(raid);
    const [battleEnded, setBattleEnded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [skillCooldown, setSkillCooldown] = useState(0); // Cooldown in turns

    // Track mobile state for reversing combat log
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Debug logging

    const boss = MULTIPLAYER_BOSSES[raid.bossId];

    // Safety check: If boss doesn't exist, show error and end battle
    if (!boss) {
        console.error('❌ Boss not found for ID:', raid.bossId);
        console.error('❌ Raid data:', JSON.stringify(raid, null, 2));
        console.error('Available boss IDs:', Object.keys(MULTIPLAYER_BOSSES));

        const errorContent = (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/95 flex items-center justify-center overscroll-none"
                style={{ zIndex: 9999 }}
            >
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="bg-black border-2 border-red-500 rounded-xl p-8 max-w-2xl text-center"
                >
                    <div className="text-8xl mb-4">⚠️</div>
                    <h2 className="text-4xl font-bold mb-4 text-red-500">
                        Boss Configuration Error
                    </h2>
                    <p className="text-gray-400 mb-6">
                        Boss ID "{raid.bossId}" not found. Please try joining a different boss queue.
                    </p>
                    <button
                        onClick={() => onBattleEnd(false, { gold: 0, xp: 0, specialLoot: [] })}
                        className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                    >
                        Return to Game
                    </button>
                </motion.div>
            </motion.div>
        );

        return createPortal(errorContent, document.body);
    }

    const calculateRewards = useCallback((): BattleRewards => {
        const goldPerPlayer = boss.rewards.goldPerPlayer;
        const xpPerPlayer = boss.rewards.xpPerPlayer;

        return {
            gold: goldPerPlayer,
            xp: xpPerPlayer,
            specialLoot: boss.rewards.specialLoot || []
        };
    }, [boss.rewards.goldPerPlayer, boss.rewards.xpPerPlayer, boss.rewards.specialLoot]);

    const startTurn = useCallback((turnIndex: number) => {
        setCurrentTurn(turnIndex);
        const member = raidState.partyMembers[turnIndex % raidState.partyMembers.length];

        // Skip dead players' turns
        if (member.currentHP <= 0) {
            // Move to next turn
            const nextTurn = turnIndex + 1;
            setTimeout(() => startTurn(nextTurn), 500);
            return;
        }

        if (member.walletAddress === player.walletAddress) {
            setIsPlayerTurn(true);
            // Reduce cooldown when it's player's turn
            setSkillCooldown(prev => Math.max(0, prev - 1));
        } else {
            // AI turn for other players
            setTimeout(() => performAITurn(member), 1500);
        }
    }, [player.walletAddress, raidState.partyMembers]);

    const performAITurn = useCallback((member: PartyMember) => {
        // Simple AI logic for party members
        const actions: CombatAction['action'][] = ['attack', 'defend', 'skill'];
        const action = actions[Math.floor(Math.random() * actions.length)];

        const actionData: CombatAction = {
            playerId: member.walletAddress,
            playerName: member.name,
            action: action,
            message: `${member.name} uses ${action}!`,
            timestamp: new Date()
        };

        if (action === 'attack') {
            const damage = Math.floor(Math.random() * 50) + 20;
            actionData.damage = damage;
            actionData.message = `⚔️ ${member.name} attacks for ${damage} damage!`;
            // Apply damage to boss
            setRaidState(prev => ({
                ...prev,
                bossHP: Math.max(0, prev.bossHP - damage)
            }));
        } else if (action === 'skill') {
            actionData.message = `✨ ${member.name} uses a special skill!`;
        }

        setCombatLog(prev => [...prev, actionData]);

        // Boss counter-attack
        setTimeout(() => {
            // Boss attacks a random party member
            const targetIndex = Math.floor(Math.random() * raidState.partyMembers.length);
            const target = raidState.partyMembers[targetIndex];
            const damage = Math.floor(Math.random() * 60) + 30;

            const actionData: CombatAction = {
                playerId: 'boss',
                playerName: boss.name,
                action: 'attack',
                target: target.walletAddress,
                damage,
                message: `👹 ${boss.name} attacks ${target.name} for ${damage} damage!`,
                timestamp: new Date()
            };

            setCombatLog(prev => [...prev, actionData]);

            // Update party member HP
            setRaidState(prev => {
                const updatedPartyMembers = prev.partyMembers.map(member =>
                    member.walletAddress === target.walletAddress
                        ? { ...member, currentHP: Math.max(0, member.currentHP - damage) }
                        : member
                );

                // Check for defeat after updating
                const allDead = updatedPartyMembers.every(m => m.currentHP <= 0);
                const bossDead = prev.bossHP <= 0;

                if (allDead) {
                    setBattleEnded(true);
                    setTimeout(() => onBattleEnd(false, { gold: 0, xp: 0, specialLoot: [] }), 3000);
                } else if (bossDead) {
                    setBattleEnded(true);
                    const rewards = calculateRewards();
                    setTimeout(() => onBattleEnd(true, rewards), 3000);
                } else {
                    // Next turn - increment current turn and call startTurn
                    setCurrentTurn(prevTurn => {
                        const nextTurn = prevTurn + 1;
                        setTimeout(() => startTurn(nextTurn), 1500);
                        return nextTurn;
                    });
                }

                return {
                    ...prev,
                    partyMembers: updatedPartyMembers
                };
            });
        }, 1000);
    }, [boss.name, calculateRewards, onBattleEnd, startTurn]);

    const performPlayerAction = (action: CombatAction['action']) => {
        const actionData: CombatAction = {
            playerId: player.walletAddress,
            playerName: player.name,
            action: action,
            message: `${player.name} uses ${action}!`,
            timestamp: new Date()
        };

        if (action === 'attack') {
            const damage = Math.floor(Math.random() * 80) + 40; // Player does more damage
            actionData.damage = damage;
            actionData.message = `⚔️ ${player.name} attacks for ${damage} damage!`;
            setRaidState(prev => ({
                ...prev,
                bossHP: Math.max(0, prev.bossHP - damage)
            }));
        } else if (action === 'skill') {
            // Special skill does 1.5x to 2x damage of normal attack + guaranteed high roll
            const baseDamage = Math.floor(Math.random() * 80) + 60; // Higher base damage
            const damage = Math.floor(baseDamage * 1.8); // 1.8x multiplier for skills
            actionData.damage = damage;
            actionData.message = `✨ ${player.name} unleashes a powerful skill for ${damage} damage!`;
            setRaidState(prev => ({
                ...prev,
                bossHP: Math.max(0, prev.bossHP - damage)
            }));
            // Set cooldown of 3 turns
            setSkillCooldown(3);
        }

        setCombatLog(prev => [...prev, actionData]);
        setIsPlayerTurn(false);

        // Boss counter-attack
        setTimeout(() => {
            // Boss attacks a random party member
            const targetIndex = Math.floor(Math.random() * raidState.partyMembers.length);
            const target = raidState.partyMembers[targetIndex];
            const damage = Math.floor(Math.random() * 60) + 30;

            const actionData: CombatAction = {
                playerId: 'boss',
                playerName: boss.name,
                action: 'attack',
                target: target.walletAddress,
                damage,
                message: `👹 ${boss.name} attacks ${target.name} for ${damage} damage!`,
                timestamp: new Date()
            };

            setCombatLog(prev => [...prev, actionData]);

            // Update party member HP
            setRaidState(prev => {
                const updatedPartyMembers = prev.partyMembers.map(member =>
                    member.walletAddress === target.walletAddress
                        ? { ...member, currentHP: Math.max(0, member.currentHP - damage) }
                        : member
                );

                // Check for defeat after updating
                const allDead = updatedPartyMembers.every(m => m.currentHP <= 0);
                const bossDead = prev.bossHP <= 0;

                if (allDead) {
                    setBattleEnded(true);
                    setTimeout(() => onBattleEnd(false, { gold: 0, xp: 0, specialLoot: [] }), 3000);
                } else if (bossDead) {
                    setBattleEnded(true);
                    const rewards = calculateRewards();
                    setTimeout(() => onBattleEnd(true, rewards), 3000);
                } else {
                    // Next turn - increment current turn and call startTurn
                    setCurrentTurn(prevTurn => {
                        const nextTurn = prevTurn + 1;
                        setTimeout(() => startTurn(nextTurn), 1500);
                        return nextTurn;
                    });
                }

                return {
                    ...prev,
                    partyMembers: updatedPartyMembers
                };
            });
        }, 1000);
    };

    useEffect(() => {
        // Initialize combat
        const initialLog: CombatAction = {
            playerId: 'system',
            playerName: 'System',
            action: 'attack',
            message: `🎯 The party encounters ${boss.name}! Prepare for battle!`,
            timestamp: new Date()
        };
        setCombatLog([initialLog]);

        // Start first turn
        setTimeout(() => startTurn(0), 2000);
    }, [boss.name, startTurn]);

    const getHPBarColor = (current: number, max: number) => {
        const percentage = (current / max) * 100;
        if (percentage > 60) return 'bg-[#00FF88]';
        if (percentage > 30) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    if (battleEnded) {
        const victory = raidState.bossHP <= 0;
        const rewards: BattleRewards = victory ? calculateRewards() : { gold: 0, xp: 0, specialLoot: [] };

        const endContent = (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/95 flex items-center justify-center overscroll-none"
                style={{ zIndex: 9999 }}
            >
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className={`bg-black border-2 rounded-xl p-8 max-w-2xl text-center ${
                        victory ? 'border-[#00FF88]' : 'border-red-500'
                    }`}
                >
                    <div className="text-8xl mb-4">
                        {victory ? '🏆' : '💀'}
                    </div>
                    <h2 className={`text-4xl font-bold mb-4 ${
                        victory ? 'text-[#00FF88]' : 'text-red-500'
                    }`}>
                        {victory ? 'VICTORY!' : 'DEFEAT...'}
                    </h2>

                    {victory && (
                        <div className="space-y-2 mb-6">
                            <div className="text-2xl font-bold text-yellow-500">
                                +{rewards.gold} Gold
                            </div>
                            <div className="text-2xl font-bold text-[#00FF88]">
                                +{rewards.xp} XP
                            </div>
                            {rewards.specialLoot && rewards.specialLoot.length > 0 && (
                                <div className="mt-4">
                                    <div className="text-xl text-purple-400 mb-2">Special Loot:</div>
                                    {rewards.specialLoot.map((loot, i) => (
                                        <div key={i} className="text-white font-bold">✦ {loot}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-gray-400">
                        {victory ? 'The party grows stronger!' : 'Better luck next time...'}
                    </p>
                </motion.div>
            </motion.div>
        );

        return createPortal(endContent, document.body);
    }

    const modalContent = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center p-0 md:p-4 overscroll-none"
            style={{ zIndex: 9999 }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-black border-2 border-red-500 rounded-none md:rounded-xl p-4 md:p-6 max-w-6xl w-full h-full md:h-auto max-h-[100dvh] md:max-h-[95dvh] overflow-hidden overflow-x-hidden flex flex-col pb-safe-bottom"
            >
                {/* Header */}
                <div className="text-red-500 text-center mb-4 font-bold">
                    <div className="text-2xl">⚔️  MULTIPLAYER BOSS BATTLE  ⚔️</div>
                    <div className="text-sm mt-2 text-gray-400">👥 TEAM UP • COORDINATE • VICTORIOUS 👥</div>
                </div>

                <div className="flex gap-6 flex-1 min-h-0">
                    {/* Boss Side */}
                    <div className="flex-1 flex flex-col">
                        <h3 className="text-2xl font-bold text-red-500 mb-4 text-center">
                            👹 {boss.name}
                        </h3>

                        <div className="bg-black border-2 border-red-500 rounded-xl p-4 mb-4">
                            <div className="text-center mb-3">
                                <div className="text-6xl mb-2">{boss.emoji}</div>
                                <div className="text-sm text-gray-400">Level {boss.level}</div>
                            </div>

                            {/* Boss HP Bar */}
                            <div className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-red-400">HP</span>
                                    <span className="text-white font-bold">
                                        {raidState.bossHP.toLocaleString()} / {raidState.bossMaxHP.toLocaleString()}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                                    <motion.div
                                        initial={{ width: '100%' }}
                                        animate={{ width: `${(raidState.bossHP / raidState.bossMaxHP) * 100}%` }}
                                        className="h-full bg-gradient-to-r from-red-600 to-red-500"
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </div>

                            {/* Phase Indicator */}
                            <div className="text-center text-sm">
                                <span className="text-purple-400">Phase {raidState.phase}/{raidState.totalPhases}</span>
                            </div>
                        </div>

                        {/* Party Members */}
                        <div className="flex-1 overflow-y-auto">
                            <h4 className="font-bold text-[#00FF88] mb-3">👥 Party Members</h4>
                            <div className="space-y-2">
                                {raidState.partyMembers.map((member, index) => (
                                    <div key={member.walletAddress} className={`border-2 rounded p-3 ${
                                        member.currentHP <= 0
                                            ? 'border-red-900 bg-red-950/20 opacity-60'
                                            : currentTurn % raidState.partyMembers.length === index
                                            ? 'border-[#00FF88] bg-[#00FF88]/10'
                                            : 'border-gray-700 bg-black'
                                        }`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="text-2xl">{member.currentHP <= 0 ? '💀' : '🦎'}</div>
                                                <div>
                                                    <div className="font-bold text-white">
                                                        {member.name}
                                                        {member.currentHP <= 0 && <span className="text-red-500 ml-2">[DEAD]</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        Lv.{member.level} {member.archetype}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-bold ${member.role === 'tank' ? 'bg-blue-600' :
                                                member.role === 'damage' ? 'bg-red-600' :
                                                    member.role === 'support' ? 'bg-[#00DD77]' :
                                                        'bg-gray-600'
                                                }`}>
                                                {member.role.toUpperCase()}
                                            </div>
                                        </div>

                                        {/* HP Bar */}
                                        <div className="mb-2">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-400">HP</span>
                                                <span className="text-white font-bold">
                                                    {member.currentHP}/{member.maxHP}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${getHPBarColor(member.currentHP, member.maxHP)}`}
                                                    style={{ width: `${(member.currentHP / member.maxHP) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        {member.status && member.status.length > 0 && (
                                            <div className="flex gap-1">
                                                {member.status.map((status, i) => (
                                                    <span key={i} className="px-2 py-1 bg-purple-900 text-purple-300 rounded text-xs">
                                                        {status}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Combat Log & Actions */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Combat Log */}
                        <div className="bg-black border-2 border-[#00FF88] rounded-xl p-4 mb-4 flex-1 min-h-0">
                            <h4 className="font-bold text-[#00FF88] mb-3">📜 Combat Log</h4>
                            <div className="space-y-2 overflow-y-auto max-h-80 combat-log-scrollbar">
                                <AnimatePresence>
                                    {/* Show last 10 messages, reversed on mobile (most recent first), normal order on desktop */}
                                    {(isMobile ? [...combatLog.slice(-10)].reverse() : combatLog.slice(-10)).map((action, index) => (
                                        <motion.div
                                            key={`${action.timestamp.getTime()}-${index}`}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="text-sm bg-gray-700 rounded p-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400 text-xs">
                                                    {action.timestamp.toLocaleTimeString()}
                                                </span>
                                                <span className="text-white">{action.message}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Player Actions */}
                        {isPlayerTurn && (
                            <>
                                {/* Check if player is dead */}
                                {(raidState.partyMembers.find(m => m.walletAddress === player.walletAddress)?.currentHP ?? 1) <= 0 ? (
                                    <div className="bg-black border-2 border-red-900 rounded-xl p-4 text-center">
                                        <div className="text-4xl mb-2">💀</div>
                                        <div className="text-red-500 font-bold mb-2">You Have Fallen</div>
                                        <div className="text-gray-400 text-sm">
                                            You can no longer fight unless you have a resurrection item or spell.
                                        </div>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="bg-black border-2 border-[#00FF88] rounded-xl p-4"
                                    >
                                        <h4 className="font-bold text-[#00FF88] mb-4">⚡ Your Turn!</h4>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => performPlayerAction('attack')}
                                                className="p-3 bg-black border-2 border-red-500 text-red-500 hover:bg-red-900 font-bold transition-colors"
                                            >
                                                ⚔️ Attack
                                            </button>
                                            <button
                                                onClick={() => performPlayerAction('defend')}
                                                className="p-3 bg-black border-2 border-blue-500 text-blue-500 hover:bg-blue-900 font-bold transition-colors"
                                            >
                                                🛡️ Defend
                                            </button>
                                            <button
                                                onClick={() => performPlayerAction('skill')}
                                                disabled={skillCooldown > 0}
                                                className={`p-3 bg-black border-2 font-bold transition-colors ${
                                                    skillCooldown > 0
                                                        ? 'border-gray-600 text-gray-600 cursor-not-allowed opacity-50'
                                                        : 'border-purple-500 text-purple-500 hover:bg-purple-900'
                                                }`}
                                                title={skillCooldown > 0 ? `Cooldown: ${skillCooldown} turns remaining` : 'Powerful special attack (1.8x damage)'}
                                            >
                                                ✨ Skill {skillCooldown > 0 ? `(${skillCooldown})` : ''}
                                            </button>
                                            <button
                                                onClick={() => performPlayerAction('heal')}
                                                className="p-3 bg-black border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00AA55] font-bold transition-colors"
                                            >
                                                💚 Heal
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}

                        {!isPlayerTurn && (
                            <div className="bg-black border-2 border-gray-700 rounded-xl p-4 text-center">
                                <div className="text-4xl mb-2">⏳</div>
                                <div className="text-gray-400">
                                    {currentTurn % raidState.partyMembers.length === raidState.partyMembers.length - 1
                                        ? "Waiting for boss..."
                                        : `Waiting for ${raidState.partyMembers[currentTurn % raidState.partyMembers.length]?.name}...`
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default MultiplayerBossCombat;
