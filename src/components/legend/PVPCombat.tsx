import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { PlayerCharacter, PVPTarget } from '../../types/legend.types';
import { useModalClose } from '../../hooks/useModalClose';

interface PVPCombatProps {
    player: PlayerCharacter;
    target: PVPTarget;
    onComplete: (victory: boolean, goldChange: number, serverData?: { turnsRemaining: number }) => void;
    onCancel: () => void;
}

interface CombatLog {
    message: string;
    type: 'info' | 'damage' | 'heal' | 'victory' | 'defeat';
}

const PVPCombat: React.FC<PVPCombatProps> = ({ player, target, onComplete, onCancel }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onCancel);

    const [combatLog, setCombatLog] = useState<CombatLog[]>([]);
    const [playerHP, setPlayerHP] = useState(player.health);
    const [targetHP, setTargetHP] = useState(target.maxHealth || target.defense * 10 + 50); // Use actual maxHealth
    const [combatStarted, setCombatStarted] = useState(false);
    const [combatEnded, setCombatEnded] = useState(false);
    const [victory, setVictory] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Track mobile state for reversing combat log
    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const addLog = (message: string, type: CombatLog['type'] = 'info') => {
        setCombatLog(prev => [...prev, { message, type }]);
    };

    const calculateDamage = (attacker: { strength: number; weapon?: any }, defender: { defense: number; armor?: any }): number => {
        const baseAttack = attacker.strength + (attacker.weapon?.attackBonus || 0);
        const baseDefense = defender.defense + (defender.armor?.defenseBonus || 0);
        const damage = Math.max(1, baseAttack - Math.floor(baseDefense / 2) + Math.floor(Math.random() * 10));
        return damage;
    };

    const startCombat = async () => {
        setCombatStarted(true);

        // Player list auto-refreshes every 10s, so stats are always fresh
        addLog(`⚔️ You attack ${target.name}!`, 'info');
        addLog(`Your STR: ${player.strength} vs Their DEF: ${target.defense}`, 'info');
        addLog('', 'info');

        await new Promise(resolve => setTimeout(resolve, 1000));

        let currentPlayerHP = playerHP;
        let currentTargetHP = targetHP;
        let round = 1;

        while (currentPlayerHP > 0 && currentTargetHP > 0 && round <= 20) {
            addLog(`--- Round ${round} ---`, 'info');
            await new Promise(resolve => setTimeout(resolve, 800));

            // Player attacks
            const playerDamage = calculateDamage(
                { strength: player.strength, weapon: player.weapon },
                { defense: target.defense, armor: target.armor }
            );
            currentTargetHP -= playerDamage;
            addLog(`💥 You deal ${playerDamage} damage to ${target.name}!`, 'damage');
            setTargetHP(currentTargetHP);
            await new Promise(resolve => setTimeout(resolve, 800));

            if (currentTargetHP <= 0) {
                break;
            }

            // Target attacks back
            const targetDamage = calculateDamage(
                { strength: target.strength, weapon: target.weapon },
                { defense: player.defense, armor: player.armor }
            );
            currentPlayerHP -= targetDamage;
            addLog(`💢 ${target.name} deals ${targetDamage} damage to you!`, 'damage');
            setPlayerHP(currentPlayerHP);
            await new Promise(resolve => setTimeout(resolve, 800));

            if (currentPlayerHP <= 0) {
                break;
            }

            round++;
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Determine winner
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (currentPlayerHP > 0) {
            // Player wins
            const goldStolen = Math.floor(target.gold * (0.1 + Math.random() * 0.2)); // 10-30% of target's gold
            addLog('', 'info');
            addLog(`🎉 VICTORY! You have defeated ${target.name}!`, 'victory');
            addLog(`💰 You stole ${goldStolen} gold!`, 'victory');
            setVictory(true);
            setCombatEnded(true);

            // Record PVP victory and get authoritative server data
            const response = await fetch('/api/legend/pvp/result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attackerWallet: player.walletAddress,
                    attackerTokenId: player.tokenId,
                    defenderWallet: target.walletAddress,
                    defenderTokenId: target.tokenId,
                    victory: true,
                    goldChange: goldStolen
                })
            });
            const serverData = await response.json();

            setTimeout(() => {
                onComplete(true, goldStolen, { turnsRemaining: serverData.attacker?.turnsRemaining ?? player.turnsRemaining - 1 });
            }, 2000);
        } else {
            // Player loses
            const goldLost = Math.floor(player.gold * 0.1); // Lose 10% of your gold
            addLog('', 'info');
            addLog(`💀 DEFEAT! You were bested by ${target.name}!`, 'defeat');
            addLog(`💸 You lost ${goldLost} gold!`, 'defeat');
            setVictory(false);
            setCombatEnded(true);

            // Record PVP defeat and get authoritative server data
            const response = await fetch('/api/legend/pvp/result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attackerWallet: player.walletAddress,
                    attackerTokenId: player.tokenId,
                    defenderWallet: target.walletAddress,
                    defenderTokenId: target.tokenId,
                    victory: false,
                    goldChange: -goldLost
                })
            });
            const serverData = await response.json();

            setTimeout(() => {
                onComplete(false, -goldLost, { turnsRemaining: serverData.attacker?.turnsRemaining ?? player.turnsRemaining - 1 });
            }, 2000);
        }
    };

    const modalContent = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center p-0 md:p-4 overscroll-none"
            style={{ zIndex: 9999 }}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-black border-2 border-red-500 p-4 md:p-6 max-w-4xl w-full h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto overflow-x-hidden font-bbs pb-safe-bottom"
                style={{ touchAction: 'pan-y' }}
            >
                {/* Header */}
                <div className="text-red-500 text-center mb-4 text-glow-red text-2xl font-bold">
                    ⚔️  PVP COMBAT ⚔️
                </div>

                {/* Combatants */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Player */}
                    <div className="bg-black border border-[#00FF88] p-4">
                        <div className="text-[#00FF88] font-bold text-lg mb-2">{player.name}</div>
                        <div className="text-yellow-500">Level {player.level}</div>
                        <div className="mt-2">
                            <div className="text-sm text-gray-400">HP:</div>
                            <div className="w-full bg-black h-6 border border-[#00FF88] relative">
                                <motion.div
                                    className="bg-[#00FF88] h-full"
                                    initial={{ width: '100%' }}
                                    animate={{ width: `${Math.max(0, (playerHP / player.maxHealth) * 100)}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                                    {Math.max(0, playerHP)} / {player.maxHealth}
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                            <div>⚔️ STR: {player.strength + (player.weapon?.attackBonus || 0)}</div>
                            <div>🛡️ DEF: {player.defense + (player.armor?.defenseBonus || 0)}</div>
                        </div>
                    </div>

                    {/* Target */}
                    <div className="bg-black border border-red-500 p-4">
                        <div className="text-red-500 font-bold text-lg mb-2">{target.name}</div>
                        <div className="text-yellow-500">Level {target.level}</div>
                        <div className="mt-2">
                            <div className="text-sm text-gray-400">HP:</div>
                            <div className="w-full bg-black h-6 border border-red-500 relative">
                                <motion.div
                                    className="bg-red-500 h-full"
                                    initial={{ width: '100%' }}
                                    animate={{ width: `${Math.max(0, (targetHP / (target.maxHealth || target.defense * 10 + 50)) * 100)}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                                    {Math.max(0, targetHP)} / {target.maxHealth || target.defense * 10 + 50}
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                            <div>⚔️ STR: {target.strength + (target.weapon?.attackBonus || 0)}</div>
                            <div>🛡️ DEF: {target.defense + (target.armor?.defenseBonus || 0)}</div>
                        </div>
                    </div>
                </div>

                {/* Combat Log */}
                <div className="bg-black border-2 border-gray-700 p-4 h-64 overflow-y-auto mb-4 combat-log-scrollbar">
                    {combatLog.length === 0 ? (
                        <div className="text-gray-500 text-center py-8">
                            Ready to attack {target.name}?<br />
                            This will cost 1 turn.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {/* Reverse order on mobile (most recent first), normal order on desktop */}
                            {(isMobile ? [...combatLog].reverse() : combatLog).map((log, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`text-sm ${log.type === 'victory'
                                            ? 'text-[#00FF88] font-bold'
                                            : log.type === 'defeat'
                                                ? 'text-red-500 font-bold'
                                                : log.type === 'damage'
                                                    ? 'text-yellow-500'
                                                    : 'text-gray-400'
                                        }`}
                                >
                                    {log.message}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    {!combatStarted ? (
                        <>
                            <button
                                onClick={startCombat}
                                className="flex-1 py-3 bg-red-900 border-2 border-red-500 text-red-500 hover:bg-red-800 font-bold"
                            >
                                ⚔️ ATTACK!
                            </button>
                            <button
                                onClick={onCancel}
                                className="flex-1 py-3 bg-black border-2 border-gray-600 text-gray-400 hover:bg-black font-bold"
                            >
                                [ESC] Cancel
                            </button>
                        </>
                    ) : combatEnded ? (
                        <button
                            onClick={() => onComplete(victory, victory ? Math.floor(target.gold * 0.2) : -Math.floor(player.gold * 0.1))}
                            className="flex-1 py-3 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00BB66] font-bold"
                        >
                            Continue
                        </button>
                    ) : (
                        <div className="flex-1 py-3 bg-black border-2 border-gray-600 text-gray-400 text-center font-bold">
                            Combat in progress...
                        </div>
                    )}
                </div>

                {/* Info */}
                {!combatStarted && (
                    <div className="mt-4 p-3 bg-black border border-yellow-500 text-yellow-500 text-xs">
                        ⚠️ Warning: Attacking costs 1 turn. You can steal 10-30% of their gold if you win, but lose 10% of your gold if you lose!
                    </div>
                )}
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default PVPCombat;
