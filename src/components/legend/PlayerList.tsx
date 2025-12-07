import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { PlayerCharacter, PVPTarget } from '../../types/legend.types';
import { useModalClose } from '../../hooks/useModalClose';
import { useLanguage } from '../../contexts/LanguageContext';

interface PlayerListProps {
    player: PlayerCharacter;
    onClose: () => void;
    onAttack: (target: PVPTarget) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({ player, onClose, onAttack }) => {
    const { t } = useLanguage();
    const [players, setPlayers] = useState<PVPTarget[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Handle ESC key and mobile back button
    useModalClose(onClose);

    useEffect(() => {
        loadPlayers(true); // Initial load
    }, [searchQuery]); // Reload when search changes

    // Auto-refresh every 10 seconds (local DB is fast!)
    useEffect(() => {
        const interval = setInterval(() => {
            loadPlayers(false); // Background refresh
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, [searchQuery]); // Re-create interval if search changes

    const loadPlayers = async (showLoading: boolean = false) => {
        try {
            if (showLoading) {
                setLoading(true);
            } else {
                setIsRefreshing(true);
            }

            // Build query params
            const params = new URLSearchParams({
                walletAddress: player.walletAddress,
                currentLevel: player.level.toString()
            });

            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }

            const response = await fetch(`/api/legend/players/list?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setPlayers(data.players);
            }
        } catch (error) {
            console.error('Error loading players:', error);
        } finally {
            if (showLoading) {
                setLoading(false);
            } else {
                setIsRefreshing(false);
            }
        }
    };

    const canAttack = (target: PVPTarget): boolean => {
        // Can only attack offline players who didn't sleep at inn
        if (target.isOnline) return false;
        if (target.sleptSafely) return false;

        // Cannot attack dead players (they must respawn first)
        if ((target as any).isDead) return false;

        // Cannot attack players with 0 health (they are dead)
        if (target.health <= 0) return false;

        // 5-minute offline grace period (prevents instant attacks on logout and protects new characters)
        const OFFLINE_GRACE_PERIOD = 5 * 60 * 1000; // 5 minutes in milliseconds
        if (target.lastSeen) {
            const offlineTime = Date.now() - new Date(target.lastSeen).getTime();
            if (offlineTime < OFFLINE_GRACE_PERIOD) return false;
        }

        // Level restrictions (can't attack someone 5+ levels below you)
        if (player.level - target.level >= 5) return false;

        return true;
    };

    const getAttackBlockReason = (target: PVPTarget): string => {
        if (target.isOnline) return 'online';
        if (target.sleptSafely) return 'protected';
        if ((target as any).isDead || target.health <= 0) return 'dead';

        // Check grace period
        const OFFLINE_GRACE_PERIOD = 5 * 60 * 1000;
        if (target.lastSeen) {
            const offlineTime = Date.now() - new Date(target.lastSeen).getTime();
            if (offlineTime < OFFLINE_GRACE_PERIOD) {
                const minutesLeft = Math.ceil((OFFLINE_GRACE_PERIOD - offlineTime) / 60000);
                return `grace:${minutesLeft}`;
            }
        }

        // Check level gap
        if (player.level - target.level >= 5) return 'level_gap';

        return 'unknown';
    };

    const getLastSeenText = (lastSeen: Date): string => {
        const now = new Date();
        const diff = now.getTime() - new Date(lastSeen).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return t.legend.pvp.justNow;
        if (minutes < 60) return t.legend.pvp.mAgo.replace('{m}', minutes.toString());
        if (hours < 24) return t.legend.pvp.hAgo.replace('{h}', hours.toString());
        return t.legend.pvp.dAgo.replace('{d}', days.toString());
    };

    const filteredPlayers = players.filter(p => {
        // Filter by status (backend already filtered out owned characters and sorted by attackability)
        if (filter === 'online') return p.isOnline;
        if (filter === 'offline') return !p.isOnline;
        return true;
    });

    // Sort players by status and level
    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
        const aAttackable = canAttack(a);
        const bAttackable = canAttack(b);

        // Priority 1: Attackable players first
        if (aAttackable && !bAttackable) return -1;
        if (!aAttackable && bAttackable) return 1;

        // Priority 2: Within attackable players, sort by level (highest first)
        if (aAttackable && bAttackable) {
            return b.level - a.level;
        }

        // Priority 3: Online players next
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;

        // Priority 4: Protected (slept safely) players
        if (!a.isOnline && !b.isOnline) {
            if (!a.sleptSafely && b.sleptSafely) return -1;
            if (a.sleptSafely && !b.sleptSafely) return 1;
        }

        // Priority 5: Within same status, sort by level (highest first)
        return b.level - a.level;
    });

    const onlinePlayers = filteredPlayers.filter(p => p.isOnline);
    const offlinePlayers = filteredPlayers.filter(p => !p.isOnline);
    const vulnerablePlayers = offlinePlayers.filter(p => !p.sleptSafely);

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
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-black border-2 border-[#00FF88] p-4 md:p-6 max-w-4xl w-full h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto overflow-x-hidden font-bbs pb-safe-bottom"
                style={{ touchAction: 'pan-y' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="text-[#00FF88] text-center mb-4 text-glow-green">
                    <div className="text-2xl font-bold">📜 {t.legend.pvp.playerList} 📜</div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                    <div className="bg-black border border-[#00FF88] p-3">
                        <div className="text-[#00FF88] text-xl font-bold">{onlinePlayers.length}</div>
                        <div className="text-gray-400 text-sm">{t.legend.pvp.online}</div>
                    </div>
                    <div className="bg-black border border-yellow-500 p-3">
                        <div className="text-yellow-500 text-xl font-bold">{offlinePlayers.length}</div>
                        <div className="text-gray-400 text-sm">{t.legend.pvp.offline}</div>
                    </div>
                    <div className="bg-black border border-red-500 p-3">
                        <div className="text-red-500 text-xl font-bold">{vulnerablePlayers.length}</div>
                        <div className="text-gray-400 text-sm">{t.legend.pvp.vulnerable}</div>
                    </div>
                </div>

                {/* Auto-refresh indicator */}
                <div className="mb-2 text-center text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                        {isRefreshing && <span className="animate-spin">↻</span>}
                        {t.legend.pvp.autoRefreshing} {isRefreshing && `(${t.legend.pvp.updating})`}
                    </span>
                </div>

                {/* Search Bar with Refresh */}
                <div className="mb-4 flex gap-2">
                    <input
                        type="text"
                        placeholder={`🔍 ${t.legend.pvp.searchPlaceholder}`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-4 py-2 bg-black border border-[#00FF88] text-[#00FF88] placeholder-gray-600 focus:outline-none focus:border-green-400"
                    />
                    <button
                        onClick={() => loadPlayers(false)}
                        disabled={loading || isRefreshing}
                        className={`px-4 py-2 border ${
                            loading || isRefreshing
                                ? 'bg-gray-900 border-gray-600 text-gray-600'
                                : 'bg-[#00AA55] border-[#00FF88] text-[#00FF88] hover:bg-[#00BB66]'
                        }`}
                        title={t.legend.pvp.refreshPlayerList}
                    >
                        {isRefreshing ? <span className="animate-spin">↻</span> : '🔄'}
                    </button>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setFilter('all')}
                        className={`flex-1 py-2 border ${filter === 'all' ? 'bg-[#00AA55] border-[#00FF88] text-[#00FF88]' : 'bg-black border-gray-600 text-gray-400'} hover:bg-[#00BB66]`}
                    >
                        {t.legend.pvp.allPlayers}
                    </button>
                    <button
                        onClick={() => setFilter('online')}
                        className={`flex-1 py-2 border ${filter === 'online' ? 'bg-[#00AA55] border-[#00FF88] text-[#00FF88]' : 'bg-black border-gray-600 text-gray-400'} hover:bg-[#00BB66]`}
                    >
                        {t.legend.pvp.online}
                    </button>
                    <button
                        onClick={() => setFilter('offline')}
                        className={`flex-1 py-2 border ${filter === 'offline' ? 'bg-[#00AA55] border-[#00FF88] text-[#00FF88]' : 'bg-black border-gray-600 text-gray-400'} hover:bg-[#00BB66]`}
                    >
                        {t.legend.pvp.offline}
                    </button>
                </div>

                {/* Player List */}
                {loading ? (
                    <div className="text-center text-[#00FF88] py-8">
                        {t.legend.pvp.loadingPlayers}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sortedPlayers.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                {t.legend.pvp.noPlayersFound}
                            </div>
                        ) : (
                            sortedPlayers.map((target, index) => {
                                const attackable = canAttack(target);
                                return (
                                    <div
                                        key={`${target.walletAddress}-${target.tokenId}`}
                                        className={`border p-3 ${target.isOnline
                                            ? 'border-[#00FF88] bg-[#00AA55]/10'
                                            : target.sleptSafely
                                                ? 'border-gray-600 bg-black/30'
                                                : 'border-red-500 bg-red-900/10'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500">#{index + 1}</span>
                                                    <span className={`${target.isOnline ? 'text-[#00FF88]' : 'text-gray-400'} font-bold`}>
                                                        {target.name}
                                                    </span>
                                                    <span className="text-yellow-500">{t.legend.pvp.lv}{target.level}</span>
                                                    {target.isOnline ? (
                                                        <span className="text-[#00FF88] text-xs">● {t.legend.pvp.onlineStatus}</span>
                                                    ) : (
                                                        <span className="text-gray-500 text-xs">
                                                            ○ {getLastSeenText(target.lastSeen)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    <span className="mr-4">💪 {t.legend.pvp.str}: {target.strength}</span>
                                                    <span className="mr-4">🛡️ {t.legend.pvp.def}: {target.defense}</span>
                                                    <span className="mr-4">💰 {t.legend.pvp.gold}: {target.gold != null ? target.gold.toLocaleString() : '0'}</span>
                                                    {target.weapon && <span className="mr-4">⚔️ {target.weapon.name}</span>}
                                                    {target.armor && <span>🛡️ {target.armor.name}</span>}
                                                </div>
                                                {!target.isOnline && !target.sleptSafely && (
                                                    <div className="text-xs text-red-500 mt-1">
                                                        ⚠️ {t.legend.pvp.vulnerableWarning}
                                                    </div>
                                                )}
                                                {target.sleptSafely && !target.isOnline && (
                                                    <div className="text-xs text-blue-500 mt-1">
                                                        🛡️ {t.legend.pvp.protectedStatus}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                {attackable ? (
                                                    <button
                                                        onClick={() => onAttack(target)}
                                                        className="px-4 py-2 bg-red-900 border border-red-500 text-red-500 hover:bg-red-800 text-sm"
                                                    >
                                                        ⚔️ {t.legend.pvp.attack}
                                                    </button>
                                                ) : (() => {
                                                    const reason = getAttackBlockReason(target);
                                                    if (reason === 'online') {
                                                        return (
                                                            <div className="text-gray-600 text-xs text-center px-4">
                                                                {t.legend.pvp.cannotAttackOnline}
                                                            </div>
                                                        );
                                                    } else if (reason === 'protected') {
                                                        return (
                                                            <div className="text-blue-600 text-xs text-center px-4">
                                                                {t.legend.pvp.protectedByInn}
                                                            </div>
                                                        );
                                                    } else if (reason === 'dead') {
                                                        return (
                                                            <div className="text-gray-600 text-xs text-center px-4">
                                                                {t.legend.pvp.targetDead}
                                                            </div>
                                                        );
                                                    } else if (reason.startsWith('grace:')) {
                                                        const minutes = reason.split(':')[1];
                                                        return (
                                                            <div className="text-yellow-600 text-xs text-center px-4">
                                                                {t.legend.pvp.gracePeriod}<br />{t.legend.pvp.mLeft.replace('{m}', minutes)}
                                                            </div>
                                                        );
                                                    } else if (reason === 'level_gap') {
                                                        return (
                                                            <div className="text-gray-600 text-xs text-center px-4">
                                                                {t.legend.pvp.levelGapTooLarge}
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <div className="text-gray-600 text-xs text-center px-4">
                                                                {t.legend.pvp.cannotAttack}
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Help Text */}
                <div className="mt-6 p-4 bg-black border border-gray-700 text-gray-400 text-xs">
                    <div className="text-[#00FF88] font-bold mb-2">💡 {t.legend.pvp.pvpRules}</div>
                    <ul className="space-y-1 ml-4">
                        <li>• {t.legend.pvp.rule1}</li>
                        <li>• {t.legend.pvp.rule2}</li>
                        <li>• {t.legend.pvp.rule3}</li>
                        <li>• {t.legend.pvp.rule4}</li>
                        <li>• {t.legend.pvp.rule5}</li>
                        <li>• <span className="text-red-500">{t.legend.pvp.rule6}</span>{t.legend.pvp.rule6b}</li>
                        <li>• {t.legend.pvp.rule7}</li>
                        <li>• {t.legend.pvp.rule8}</li>
                        <li>• <span className="text-[#00FF88]">{t.legend.pvp.rule9}</span></li>
                    </ul>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-4 py-3 bg-black border-2 border-gray-600 text-gray-400 hover:bg-black font-bold"
                >
                    {t.legend.pvp.escClose}
                </button>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default PlayerList;
