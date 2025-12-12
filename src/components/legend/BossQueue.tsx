import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerCharacter } from '../../types/legend.types';
import { MULTIPLAYER_BOSSES, ARCHETYPES } from '../../types/archetype.types';
import PixelIcon from '../PixelIcon';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useModalClose } from '../../hooks/useModalClose';
import { useLanguage } from '../../contexts/LanguageContext';

import type { PartyMember } from './MultiplayerBossCombat';

export interface BossRaid {
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

interface BossQueueProps {
    player: PlayerCharacter;
    onClose: () => void;
    onBattleStart: (raid: BossRaid) => void;
}

const BossQueue: React.FC<BossQueueProps> = ({ player, onClose, onBattleStart }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose);
    const { t } = useLanguage();

    const [selectedBoss, setSelectedBoss] = useState<string | null>(null);
    const [currentRaid, setCurrentRaid] = useState<BossRaid | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [partyChatMessages, setPartyChatMessages] = useState<Array<{message: string, username: string, type: string, timestamp: string}>>([]);
    const [chatInput, setChatInput] = useState('');
    const socketRef = useRef<Socket | null>(null);

    const bossList = Object.values(MULTIPLAYER_BOSSES);

    // Check if player is actually in queue on mount (validate queue state)
    useEffect(() => {
        const checkQueueStatus = async () => {
            try {
                const response = await fetch(`/api/legend/boss-queue/status/${player.walletAddress}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'in_queue' && data.raid) {
                        // Player is in queue, restore state
setCurrentRaid(data.raid);
                        setSelectedBoss(data.raid.bossId);
                    } else if (data.status === 'not_in_queue' || data.status === 'raid_expired') {
                        // Player is not in queue, clear any stale state
setCurrentRaid(null);
                        setSelectedBoss(null);
                        setIsReady(false);
                    }
                }
            } catch (error) {
                console.error('Failed to check queue status:', error);
            }
        };

        checkQueueStatus();
    }, [player.walletAddress]);

    // Socket.IO - Listen for party updates and chat
    useEffect(() => {
        if (!currentRaid) return;

        const socket = io({
            path: '/socket.io/',
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        const partyRoom = `party_${currentRaid.id}`;

        socket.on('connect', () => {
// Join party room
            socket.emit('joinChannel', {
                channel: partyRoom,
                username: player.name,
                userId: player.walletAddress
            });
        });

        // Listen for party updates
        socket.on('partyUpdate', (data: any) => {
if (data.raid) {
setCurrentRaid(data.raid);
            }
        });

        // Listen for chat messages
        socket.on('receiveMessage', (msg: any) => {
setPartyChatMessages(prev => [...prev, msg]);
        });

        socket.on('loadMessages', (messages: any[]) => {
            setPartyChatMessages(messages);
        });

        return () => {
            socket.disconnect();
        };
    }, [currentRaid?.id]);

    // Periodic queue status validation (every 5 seconds)
    useEffect(() => {
        if (!currentRaid) return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/legend/boss-queue/status/${player.walletAddress}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'not_in_queue' || data.status === 'raid_expired') {
setCurrentRaid(null);
                        setSelectedBoss(null);
                        setIsReady(false);
                        setError('Your raid has expired or been cleared. Please join a new queue.');
                    } else if (data.status === 'in_queue' && data.raid) {
                        // Update raid state with latest data
setCurrentRaid(data.raid);
                    }
                }
            } catch (error) {
                console.error('Failed to validate queue status:', error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [currentRaid, player.walletAddress]);

    useEffect(() => {
        // Countdown when raid is ready
        if (currentRaid?.status === 'ready' && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }

        if (countdown === 0 && currentRaid) {
// Validate raid has required properties before starting battle
            if (!currentRaid.bossId) {
                console.error('❌ Missing bossId in raid data!');
                setError('Invalid raid data - missing boss ID. Please try joining the queue again.');
                return;
            }

            // Ensure raid has all required properties (add defaults if missing)
            const validatedRaid = {
                ...currentRaid,
                bossStatus: currentRaid.bossStatus || [],
                phase: currentRaid.phase || 1,
                totalPhases: currentRaid.totalPhases || 1
            };

            onBattleStart(validatedRaid);
        }
    }, [countdown, currentRaid]);

    const joinQueue = async (bossId: string) => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch character data to get archetype
            let characterArchetype = 'Unknown';
            let characterRole = 'balanced';

            try {
                const charResponse = await fetch(`/api/legend/character/${player.walletAddress}/${player.tokenId}`);
                if (charResponse.ok) {
                    const charData = await charResponse.json();
                    if (charData.character && typeof charData.character.archetype === 'number') {
                        const archetypeIndex = charData.character.archetype;

                        // Archetype names array
                        const archetypeNames = ['Blacksmith', 'Rogue', 'Knight', 'Mage', 'Robin Hood', 'Prince', 'Necromancer', 'Paladin', 'Crime Lord', 'Dragon Tamer'];
                        characterArchetype = archetypeNames[archetypeIndex] || 'Unknown';

                        // Get role from ARCHETYPES object
                        const archetypeName = archetypeNames[archetypeIndex]?.toLowerCase().replace(' ', '_');
                        const archetypeData = archetypeName ? ARCHETYPES[archetypeName] : null;
                        characterRole = archetypeData?.role || 'balanced';
}
                }
            } catch (charError) {
                console.warn('⚠️ Could not fetch character archetype, using default:', charError);
            }

            const response = await fetch('/api/legend/boss-queue/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bossId,
                    player: {
                        walletAddress: player.walletAddress,
                        name: player.name,
                        level: player.level,
                        archetype: characterArchetype,
                        role: characterRole
                    }
                })
            });
if (response.ok) {
                const data = await response.json();
setCurrentRaid(data.raid);
                setSelectedBoss(bossId);
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('❌ Failed to join queue:', errorData);
                setError(errorData.error || `Failed to join queue (${response.status})`);
            }
        } catch (error) {
            console.error('❌ Exception joining queue:', error);
            setError(error instanceof Error ? error.message : 'Network error - please try again');
        } finally {
            setIsLoading(false);
        }
    };

    const leaveQueue = async () => {
        try {
            setIsLoading(true);
            setError(null);
const response = await fetch('/api/legend/boss-queue/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress
                })
            });
if (response.ok) {
setCurrentRaid(null);
                setSelectedBoss(null);
                setIsReady(false);
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('❌ Failed to leave queue:', errorData);
                setError(errorData.error || `Failed to leave queue (${response.status})`);
            }
        } catch (error) {
            console.error('❌ Exception leaving queue:', error);
            setError(error instanceof Error ? error.message : 'Network error - please try again');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleReady = () => {
        setIsReady(!isReady);
        // TODO: Emit ready status to party
    };

    const sendChatMessage = () => {
        if (!chatInput.trim() || !currentRaid || !socketRef.current) return;

        const partyRoom = `party_${currentRaid.id}`;
        socketRef.current.emit('sendMessage', {
            channel: partyRoom,
            message: chatInput.trim(),
            username: player.name,
            type: 'message',
            userId: player.walletAddress
        });

        setChatInput('');
    };

    const modalContent = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-0 md:p-4 overscroll-none"
            style={{ zIndex: 9999 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border-2 border-[#00FF88] rounded-2xl p-4 md:p-8 max-w-6xl w-full h-full md:h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto overflow-x-hidden shadow-2xl shadow-[#00FF88]/30 pb-safe-bottom"
            >
                {/* Header */}
                <div className="text-[#00FF88] text-center mb-6 font-retro">
                    <div className="text-2xl font-bold">{t.bossQueue.title}</div>
                    <div className="text-sm mt-2">{t.bossQueue.subtitle}</div>
                </div>

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-[#00FF88] mb-2 font-retro">
                            {t.bossQueue.multiplayerBossBattles}
                        </h2>
                        <p className="text-gray-400 font-retro">{t.bossQueue.teamworkRequired}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-3xl text-[#00FF88] hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-red-900/30 border-2 border-red-500 rounded-xl"
                    >
                        <div className="flex items-center gap-2 text-red-400 font-retro">
                            <span className="text-2xl">⚠️</span>
                            <span>{error}</span>
                        </div>
                    </motion.div>
                )}

                {/* Loading Indicator */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-4 p-4 bg-[#00FF88]/10 border-2 border-[#00FF88] rounded-xl text-center"
                    >
                        <div className="text-[#00FF88] font-retro animate-pulse">
                            {t.bossQueue.processing}
                        </div>
                    </motion.div>
                )}

                {!currentRaid ? (
                    <>
                        {/* Boss Selection */}
                        <div className="space-y-4">
                            {bossList.map((boss) => {
                                const canJoin = player.level >= boss.level;

                                return (
                                    <motion.div
                                        key={boss.id}
                                        whileHover={canJoin ? { scale: 1.02 } : {}}
                                        className={`bg-black border-2 rounded-xl p-6 ${canJoin
                                            ? 'border-[#00FF88] cursor-pointer hover:shadow-xl hover:shadow-[#00FF88]/50'
                                            : 'border-gray-700 opacity-50'
                                            }`}
                                        onClick={() => canJoin && joinQueue(boss.id)}
                                    >
                                        <div className="grid md:grid-cols-3 gap-6">
                                            {/* Boss Info */}
                                            <div className="md:col-span-2">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="text-6xl">{boss.emoji}</div>
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-[#00FF88] font-retro">{boss.name}</h3>
                                                        <p className="text-gray-400 font-retro">Level {boss.level} • {boss.health.toLocaleString()} HP</p>
                                                    </div>
                                                </div>

                                                {/* Requirements */}
                                                <div className="bg-black border border-[#00FF88]/30 rounded-lg p-4 mb-4">
                                                    <h4 className="font-bold font-retro text-[#FFD700] mb-2 flex items-center gap-2">
                                                        <PixelIcon name="alert" size={16} glow={true} glowColor="gold" />
                                                        {t.bossQueue.requirements}
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-gray-400">{t.bossQueue.players}</span>
                                                            <span className="text-white ml-2 font-bold">{boss.requiredPlayers}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">{t.bossQueue.minLevel}</span>
                                                            <span className="text-white ml-2 font-bold">{boss.level}</span>
                                                        </div>
                                                    </div>
                                                    {boss.requiredRoles && boss.requiredRoles.length > 0 && (
                                                        <div className="mt-2">
                                                            <span className="text-gray-400">{t.bossQueue.requiredRoles}</span>
                                                            <div className="flex gap-2 mt-1">
                                                                {boss.requiredRoles.map((role, i) => (
                                                                    <span key={i} className="px-2 py-1 bg-gray-700 rounded text-xs text-white">
                                                                        {role.toUpperCase()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Mechanics */}
                                                <div className="space-y-2">
                                                    <h4 className="font-bold font-retro text-[#00FF88]">{t.bossQueue.bossMechanics}</h4>
                                                    {boss.mechanics.map((mechanic, i) => (
                                                        <div key={i} className="text-sm text-gray-300 bg-black border border-[#00FF88]/20 rounded p-2 font-retro">
                                                            <span className="font-bold text-[#00FF88]">{mechanic.name}:</span> {mechanic.description}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Rewards */}
                                            <div className="bg-black border-2 border-[#FFD700] rounded-xl p-4 shadow-lg shadow-[#FFD700]/20">
                                                <h4 className="font-bold font-retro text-[#FFD700] mb-3 text-center flex items-center justify-center gap-2">
                                                    <PixelIcon name="trophy" size={16} glow={true} glowColor="gold" />
                                                    {t.bossQueue.rewardsPerPlayer}
                                                </h4>
                                                <div className="space-y-2 text-sm font-retro">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-300">{t.bossQueue.goldReward}</span>
                                                        <span className="text-[#FFD700] font-bold">
                                                            {boss.rewards.goldPerPlayer.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-300">{t.bossQueue.xpReward}</span>
                                                        <span className="text-[#00FF88] font-bold">
                                                            {boss.rewards.xpPerPlayer.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {boss.rewards.specialLoot && (
                                                        <div className="mt-3 pt-3 border-t border-[#FFD700]/30">
                                                            <div className="text-[#FFD700] font-bold mb-2 flex items-center gap-1">
                                                                <PixelIcon name="gift" size={14} glow={true} glowColor="gold" />
                                                                {t.bossQueue.specialLoot}
                                                            </div>
                                                            {boss.rewards.specialLoot.map((loot, i) => (
                                                                <div key={i} className="text-xs text-gray-300">
                                                                    ✦ {loot}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {!canJoin && (
                                                    <div className="mt-4 text-center text-xs text-red-400 font-retro">
                                                        {t.bossQueue.levelRequired.replace('{level}', boss.level.toString())}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {canJoin && (
                                            <div className="mt-4 text-center">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    disabled={isLoading}
                                                    className={`relative px-10 py-4 bg-gradient-to-r from-[#00FF88] via-[#00DD77] to-[#00BB66] text-black font-bold rounded-xl overflow-hidden group shadow-2xl shadow-[#00FF88]/50 hover:shadow-[#00FF88]/70 transition-all border-2 border-[#00FF88] ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {/* Animated background shimmer */}
                                                    <motion.div
                                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                                        animate={{ x: ['-200%', '200%'] }}
                                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                    />

                                                    {/* Button content */}
                                                    <span className="relative flex items-center gap-2 text-lg">
                                                        <span className="animate-pulse">⚔️</span>
                                                        <span className="font-retro tracking-wider">{isLoading ? t.bossQueue.joining : t.bossQueue.joinQueue}</span>
                                                        <span className="animate-pulse">⚔️</span>
                                                    </span>
                                                </motion.button>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Party Lobby */}
                        <div className="bg-black border-2 border-[#00FF88] rounded-xl p-6 mb-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-[#00FF88] font-retro">
                                        {MULTIPLAYER_BOSSES[selectedBoss!]?.name || 'Boss Battle'}
                                    </h3>
                                    <p className="text-gray-400 font-retro">{t.bossQueue.formingParty}</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-[#00FF88] font-retro">
                                        {currentRaid.partyMembers.length}/{currentRaid.requiredPlayers}
                                    </div>
                                    <div className="text-xs text-gray-400 font-retro">Players</div>
                                </div>
                            </div>

                            {/* Party Members Carousel */}
                            <PartyMembersCarousel
                                partyMembers={currentRaid.partyMembers}
                                requiredPlayers={currentRaid.requiredPlayers}
                            />

                            {/* Role Check */}
                            {currentRaid.requiredRoles && currentRaid.requiredRoles.length > 0 && (
                                <div className="bg-black border border-[#FFD700] rounded-lg p-4 mb-4">
                                    <h4 className="font-bold font-retro text-[#FFD700] mb-2 flex items-center gap-2">
                                        <PixelIcon name="alert" size={16} glow={true} glowColor="gold" />
                                        {t.bossQueue.roleRequirements}
                                    </h4>
                                    <div className="flex gap-2 flex-wrap">
                                        {currentRaid.requiredRoles.map((role, i) => {
                                            const hasRole = currentRaid.partyMembers.some(m => m.role === role);
                                            return (
                                                <div key={i} className={`px-3 py-1 rounded text-sm font-bold font-retro ${hasRole ? 'bg-[#00FF88] text-black border border-[#00FF88]' : 'bg-black border border-gray-700 text-gray-400'
                                                    }`}>
                                                    {hasRole ? '✅' : '❌'} {role.toUpperCase()}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Ready Button */}
                            <div className="flex gap-4">
                                <button
                                    onClick={toggleReady}
                                    disabled={currentRaid.status === 'ready'}
                                    className={`flex-1 px-6 py-4 rounded-xl font-bold font-retro transition-all border-2 ${isReady
                                        ? 'bg-[#00FF88] text-black border-[#00FF88] shadow-lg shadow-[#00FF88]/50'
                                        : 'bg-black text-gray-300 border-gray-700 hover:border-[#00FF88]'
                                        } disabled:opacity-50`}
                                >
                                    {isReady ? `✅ ${t.bossQueue.ready}` : t.bossQueue.clickWhenReady}
                                </button>
                                <button
                                    onClick={leaveQueue}
                                    className="px-6 py-4 bg-black border-2 border-red-500 text-red-500 rounded-xl hover:bg-red-500 hover:text-black transition-all font-retro font-bold"
                                >
                                    🚪 Leave Queue
                                </button>
                            </div>

                            {/* Battle Starting */}
                            {currentRaid.status === 'ready' && (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="mt-6 text-center"
                                >
                                    <div className="bg-gradient-to-r from-[#00FF88] to-[#00DD77] rounded-xl p-6 border-2 border-[#00FF88] shadow-2xl shadow-[#00FF88]/50">
                                        <h3 className="text-3xl font-bold text-black mb-2 font-retro">
                                            {t.bossQueue.battleStarting}
                                        </h3>
                                        <div className="text-6xl font-bold text-black mb-2 font-retro">
                                            {countdown}
                                        </div>
                                        <p className="text-black font-retro">{t.bossQueue.getReady}</p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Party Chat */}
                        <div className="bg-black border-2 border-[#00FF88] rounded-xl p-4">
                            <h4 className="font-bold font-retro text-[#00FF88] mb-3">{t.bossQueue.partyChat}</h4>
                            <div className="bg-black border border-[#00FF88]/30 rounded-lg p-3 h-32 overflow-y-auto mb-3">
                                {partyChatMessages.length === 0 ? (
                                    <p className="text-xs text-gray-500 text-center font-retro">
                                        {t.bossQueue.waitingForMessages}
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {partyChatMessages.map((msg, idx) => (
                                            <div key={idx} className="text-xs">
                                                <span className={`font-bold font-retro ${msg.type === 'system' ? 'text-[#FFD700]' : 'text-[#00FF88]'}`}>
                                                    {msg.username}:
                                                </span>
                                                <span className="text-gray-300 ml-2 font-retro">{msg.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                                    placeholder={t.bossQueue.typeMessage}
                                    className="flex-1 bg-black border border-[#00FF88]/30 rounded px-3 py-2 text-sm text-white font-retro focus:outline-none focus:border-[#00FF88]"
                                />
                                <button
                                    onClick={sendChatMessage}
                                    className="px-4 py-2 bg-[#00FF88] text-black font-bold rounded font-retro hover:bg-[#00DD77] transition-colors"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

// Party Members Carousel Component
const PartyMembersCarousel: React.FC<{
    partyMembers: PartyMember[];
    requiredPlayers: number;
}> = ({ partyMembers, requiredPlayers }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Create array with actual members + empty slots
    const allSlots = [
        ...partyMembers,
        ...Array.from({ length: requiredPlayers - partyMembers.length }, (_, i) => ({
            walletAddress: `empty-${i}`,
            name: 'Waiting for player...',
            level: 0,
            archetype: '',
            role: 'balanced' as const,
            ready: false,
            currentHP: 0,
            maxHP: 0,
            status: []
        }))
    ];

    // Auto-advance carousel
    useEffect(() => {
        if (allSlots.length <= 1) return;

        const interval = setInterval(() => {
            if (!isAnimating) {
                nextMember();
            }
        }, 3000); // Auto-advance every 3 seconds

        return () => clearInterval(interval);
    }, [allSlots.length, currentIndex, isAnimating]);

    const nextMember = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev + 1) % allSlots.length);
        setTimeout(() => setIsAnimating(false), 500);
    };

    const prevMember = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev - 1 + allSlots.length) % allSlots.length);
        setTimeout(() => setIsAnimating(false), 500);
    };

    const currentMember = allSlots[currentIndex];
    const isEmptySlot = currentMember.walletAddress.startsWith('empty-');

    return (
        <div className="mb-6">
            {/* Header */}
            <div className="text-[#FFD700] text-center mb-4 font-retro">
                <div className="text-xl font-bold">🦎 PARTY MEMBERS 🦎</div>
                <div className="text-sm mt-2 text-gray-400">SPIN THROUGH YOUR TEAM</div>
            </div>

            <div className="relative bg-black border-4 border-[#00FF88] rounded-xl p-6 shadow-xl shadow-[#00FF88]/30">
                {/* Navigation Arrows */}
                <button
                    onClick={prevMember}
                    disabled={isAnimating}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 text-4xl text-[#00FF88] hover:text-white transition-colors disabled:opacity-50"
                >
                    ◀
                </button>

                <button
                    onClick={nextMember}
                    disabled={isAnimating}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 text-4xl text-[#00FF88] hover:text-white transition-colors disabled:opacity-50"
                >
                    ▶
                </button>

                {/* Character Display */}
                <div className="min-h-[200px] flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 200, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -200, scale: 0.8 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="text-center w-full"
                        >
                            {isEmptySlot ? (
                                <>
                                    {/* Empty Slot */}
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="text-6xl mb-4"
                                    >
                                        👤
                                    </motion.div>

                                    <h3 className="text-2xl font-bold text-gray-500 mb-2 font-retro">
                                        WAITING FOR PLAYER
                                    </h3>

                                    <div className="text-gray-600 font-retro">
                                        A hero will join soon...
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Party Member */}
                                    <motion.div
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="text-6xl mb-4"
                                    >
                                        <PixelIcon name="lizard" size={16} glow={true} glowColor="gold" />
                                    </motion.div>

                                    <h3 className="text-3xl font-bold text-[#00FF88] mb-2 font-retro">
                                        {currentMember.name}
                                    </h3>

                                    <div className="text-xl text-gray-300 mb-4 font-retro">
                                        Level {currentMember.level} • {currentMember.archetype}
                                    </div>

                                    {/* Role Badge */}
                                    <div className="inline-block px-4 py-2 bg-black rounded-full text-sm font-retro mb-4 border-2 border-[#00FF88]">
                                        <span className="text-[#00FF88]">
                                            {currentMember.role.toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Stats - Pixel Font */}
                                    <div className="bg-black rounded-lg p-4 mb-4 border-2 border-[#00FF88]/50 max-w-xs">
                                        <h4 className="text-[#00FF88] mb-3 text-center font-retro text-lg">CHARACTER STATS</h4>
                                        <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                                            <div className="text-center">
                                                <div className="text-[#FFD700] font-retro">HP</div>
                                                <div className="text-2xl font-bold text-white">
                                                    {currentMember.currentHP}/{currentMember.maxHP}
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[#00FF88] font-retro">STATUS</div>
                                                <div className="text-lg font-bold text-white">
                                                    {currentMember.status.length > 0 ? currentMember.status.join(', ') : 'Ready'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ready Status */}
                                    {currentMember.ready && (
                                        <div className="text-4xl text-[#00FF88] font-bold font-retro">
                                            ✅ READY!
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center mt-4 space-x-2">
                    {allSlots.map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: currentIndex === i ? 1.2 : 1,
                                backgroundColor: currentIndex === i ? '#00FF88' : '#1F2937'
                            }}
                            className="w-3 h-3 rounded-full cursor-pointer border border-[#00FF88]/50"
                            onClick={() => {
                                if (!isAnimating) {
                                    setIsAnimating(true);
                                    setCurrentIndex(i);
                                    setTimeout(() => setIsAnimating(false), 500);
                                }
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Controls - Pixel Font */}
            <div className="text-center mt-4">
                <div className="bg-black border-2 border-[#00FF88]/50 rounded-lg p-3 inline-block">
                    <div className="text-[#00FF88] text-xs font-retro space-y-1">
                        <div>◀ ▶ : Navigate Party Members</div>
                        <div>Auto-advances every 3 seconds</div>
                        <div>{partyMembers.length}/{requiredPlayers} Players Joined</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BossQueue;
