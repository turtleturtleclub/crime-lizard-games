import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerCharacter, GameLocation } from '../../types/legend.types';
import { LOCATION_DESCRIPTIONS } from '../../data/gameData';
import { useLanguage } from '../../contexts/LanguageContext';
import GoblinHoard from './GoblinHoard';
import Healer from './Healer';
import PoorDistrict from './PoorDistrict';
import GoldShop from './GoldShop';
import PixelIcon from '../PixelIcon';
import BossQueue, { type BossRaid } from './BossQueue';
import SaveStatePurchase from './SaveStatePurchase';
import Inn from './Inn';
import Brothel from './Brothel';
import ConfirmationModal from './ConfirmationModal';

interface TownSquareProps {
    player: PlayerCharacter;
    updatePlayer: (updates: Partial<PlayerCharacter>) => void;
    setGameMessage: (message: string) => void;
    ai?: ReturnType<typeof import('../../services/LegendAI').useLegendAI>;
    onBossBattleStart?: (raid: BossRaid) => void;
}

const TownSquare: React.FC<TownSquareProps> = ({ player, updatePlayer, setGameMessage, ai, onBossBattleStart }) => {
    const { t } = useLanguage();
    const [selectedLocation, setSelectedLocation] = useState<GameLocation | null>(null);
    const [showGoldShop, setShowGoldShop] = useState(false);
    const [showBossQueue, setShowBossQueue] = useState(false);
    const [showSaveState, setShowSaveState] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    // Get AI tip when entering town
    React.useEffect(() => {
        if (ai && Math.random() < 0.3) { // 30% chance
            ai.getTips().then((tips) => {
                if (tips.length > 0) {
                    const randomTip = tips[Math.floor(Math.random() * tips.length)];
                    setGameMessage(`🤖 AI Tip: ${randomTip}`);
                }
            });
        }
    }, []);

    const locations: Array<{ id: GameLocation; locked?: boolean; requirement?: string }> = [
        { id: 'player_list' },
        { id: 'healer' },
        { id: 'bank' },
        { id: 'inn' },
        { id: 'brothel' },
        { id: 'forest' },
        { id: 'arena' },
        { id: 'poor_district' },
        { id: 'castle', locked: player.level < 5, requirement: 'Level 5+' },
        { id: 'crime_lord_lair', locked: player.level < 10, requirement: 'Level 10+' },
        { id: 'boss_queue' }
    ];

    const goToLocation = (location: GameLocation, locked: boolean = false) => {
        if (locked) {
            setGameMessage(t.legend.town.areaLocked);
            return;
        }

        // Check if player is currently at a safe zone (inn or brothel)
        const isAtSafeZone = player.location === 'inn' || player.location === 'brothel';
        const isLeavingSafeZone = isAtSafeZone && location !== player.location;

        // If leaving a safe zone, show confirmation modal
        if (isLeavingSafeZone) {
            const safeZoneName = player.location === 'inn' ? 'The Rusty Dagger Inn' : 'Violet\'s Velvet Embrace';
            const protectionStatus = player.sleptSafely ? 'You ARE protected from PVP attacks.' : 'You are NOT protected from PVP attacks!';

            setConfirmModal({
                isOpen: true,
                title: '⚠️ Leaving Safe Zone',
                message: `Are you sure you want to leave ${safeZoneName}? ${protectionStatus} ${!player.sleptSafely ? 'Consider sleeping first for protection!' : ''}`,
                onConfirm: () => {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    proceedToLocation(location);
                }
            });
            return;
        }

        proceedToLocation(location);
    };

    const proceedToLocation = (location: GameLocation) => {
        if (location === 'forest' || location === 'castle' || location === 'crime_lord_lair') {
            updatePlayer({ location });
        } else if (location === 'boss_queue') {
            setShowBossQueue(true);
        } else {
            setSelectedLocation(location);
        }
    };

    const closeLocation = () => {
        setSelectedLocation(null);
    };

    return (
        <>
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Leave"
                cancelText="Stay"
                confirmColor="red"
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />

            <div className="max-w-6xl mx-auto">
                {/* Title */}
                <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <h2 className="text-4xl font-bold text-[#FFD700] mb-2">
                    {t.legend.town.townSquare}
                </h2>
                <p className="text-gray-300">
                    {t.legend.town.whereNext}
                </p>
            </motion.div>

            {/* Buy Gold Button */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex justify-center"
            >
                <button
                    onClick={() => setShowGoldShop(true)}
                    className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-yellow-400/50 transition-all transform hover:scale-105 border-2 border-yellow-300"
                >
                    {t.legend.town.buyGoldBNB}
                </button>
            </motion.div>

            {/* Locations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations.map((loc, index) => {
                    const locationData = LOCATION_DESCRIPTIONS[loc.id];

                    return (
                        <motion.div
                            key={loc.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={!loc.locked ? { scale: 1.05 } : {}}
                            className={`relative bg-black border-2 rounded-xl p-6 cursor-pointer transition-all ${loc.locked
                                ? 'border-gray-600 opacity-50 cursor-not-allowed'
                                : 'border-[#FFD700] hover:shadow-xl hover:shadow-primary-gold/20'
                                }`}
                            onClick={() => goToLocation(loc.id, loc.locked || false)}
                        >
                            {loc.locked && (
                                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                    🔒 {loc.requirement}
                                </div>
                            )}

                            <div className="text-5xl mb-3 text-center">{locationData.emoji}</div>
                            <h3 className="text-xl font-bold text-[#FFD700] mb-2 text-center">
                                {locationData.name}
                            </h3>
                            <p className="text-gray-300 text-sm text-center leading-relaxed">
                                {locationData.description}
                            </p>

                            {!loc.locked && (
                                <div className="mt-4 text-center">
                                    <span className="text-neon-green text-sm font-bold">{t.legend.town.enterArrow}</span>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Player Stats Summary */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 bg-black border-2 border-[#FFD700] rounded-xl p-6"
            >
                <h3 className="text-xl font-bold text-[#FFD700] mb-4 flex items-center gap-2">
                    <PixelIcon name="progress" size={20} glow={true} glowColor="gold" />
                    {t.legend.town.yourProgress}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-neon-green">{player.heistsCompleted}</div>
                        <div className="text-xs text-gray-400">{t.legend.town.heistsCompleted}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-[#FFD700]">{player.goldStolen.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">{t.legend.town.goldStolen}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-neon-blue">{player.goldGivenToPoor.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">{t.legend.town.givenToPoor}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{player.crimeLordDefeats}</div>
                        <div className="text-xs text-gray-400">{t.legend.town.crimeLordDefeats}</div>
                    </div>
                </div>
            </motion.div>

            {/* Location Modals */}
            <AnimatePresence>
                {selectedLocation === 'healer' && (
                    <Healer player={player} updatePlayer={updatePlayer} onClose={closeLocation} setGameMessage={setGameMessage} />
                )}
                {selectedLocation === 'bank' && (
                    <GoblinHoard player={player} updatePlayer={updatePlayer} onClose={closeLocation} setGameMessage={setGameMessage} defaultTab="goods" />
                )}
                {selectedLocation === 'poor_district' && (
                    <PoorDistrict player={player} updatePlayer={updatePlayer} onClose={closeLocation} setGameMessage={setGameMessage} />
                )}
                {selectedLocation === 'inn' && (
                    <Inn player={player} updatePlayer={updatePlayer} onClose={closeLocation} setGameMessage={setGameMessage} />
                )}
                {selectedLocation === 'brothel' && (
                    <Brothel player={player} updatePlayer={updatePlayer} onClose={closeLocation} setGameMessage={setGameMessage} />
                )}
                {selectedLocation === 'player_list' && (
                    <HideoutModal onClose={closeLocation} ai={ai} onShowSaveState={() => setShowSaveState(true)} />
                )}
                {showGoldShop && (
                    <GoldShop
                        onClose={() => setShowGoldShop(false)}
                        onPurchase={async (gold, turns, serverPlayer) => {
                            // 🔐 FIX: Use server's authoritative player state instead of calling sync-gold
                            // This prevents race condition where sync-gold would overwrite pending combat gold
                            if (serverPlayer) {
                                // Server returned authoritative state - use it directly
                                updatePlayer({
                                    gold: serverPlayer.gold,
                                    goldInBank: serverPlayer.goldInBank,
                                    turnsRemaining: serverPlayer.turnsRemaining,
                                    maxTurns: serverPlayer.maxTurns
                                });
                            } else {
                                // Fallback if server didn't return player state (shouldn't happen)
                                updatePlayer({
                                    gold: player.gold + gold,
                                    turnsRemaining: player.turnsRemaining + turns,
                                    maxTurns: player.maxTurns + turns
                                });
                            }
                            setGameMessage(`${t.legend.town.youReceived} ${gold.toLocaleString()} ${t.legend.stats.gold} and ${turns} turns!`);
                        }}
                        tokenId={player.tokenId}
                    />
                )}

                {showBossQueue && (
                    <BossQueue
                        player={player}
                        onClose={() => setShowBossQueue(false)}
                        onBattleStart={(raid) => {
                            setShowBossQueue(false);
                            setGameMessage(`${t.legend.town.joiningBattle} ${raid.bossName}!`);
                            if (onBossBattleStart) {
                                onBossBattleStart(raid);
                            }
                        }}
                    />
                )}

                {showSaveState && (
                    <SaveStatePurchase
                        player={player}
                        updatePlayer={updatePlayer}
                        onClose={() => setShowSaveState(false)}
                        setGameMessage={setGameMessage}
                    />
                )}
            </AnimatePresence>
        </div>
        </>
    );
};

// Enhanced Hideout Modal with Save States
const HideoutModal: React.FC<{
    onClose: () => void;
    ai?: ReturnType<typeof import('../../services/LegendAI').useLegendAI>;
    onShowSaveState: () => void;
}> = ({ onClose, ai, onShowSaveState }) => {
    const { t } = useLanguage();
    const [aiMessage, setAiMessage] = React.useState('');

    React.useEffect(() => {
        // Get AI message when entering hideout
        if (ai) {
            const messages = [
                "Welcome back, Crime Lizard. Rest up - the streets are dangerous tonight...",
                "💭 The Crime Lord's forces grow stronger each day. Are you ready?",
                "🌙 In the shadows, we thrive. Your legend grows with each heist...",
                "⚔️ Sharpen your blade, fill your pockets. Tomorrow, we strike again!",
                "🗝️ This hideout has seen many heroes. Will you be the one to save the city?"
            ];
            setAiMessage(messages[Math.floor(Math.random() * messages.length)]);
        }
    }, [ai]);
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 overscroll-none z-modal"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border-2 border-[#FFD700] rounded-xl p-8 max-w-md w-full"
            >
                <div className="text-center">
                    {/* Header */}
                    <div className="text-[#FFD700] mb-4 text-center">
                        <div className="text-2xl font-bold">🏚️  THE HIDEOUT  🏚️</div>
                        <div className="text-sm mt-2 text-gray-400 italic">Your Secret Base of Operations</div>
                    </div>

                    <div className="text-6xl mb-4 flex justify-center">
                        <PixelIcon name="hideout" size={60} glow={true} glowColor="gold" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#FFD700] mb-4">{t.legend.locations.hideout}</h2>
                    <p className="text-gray-300 mb-6">
                        {t.legend.town.hideoutDescription}
                    </p>

                    {aiMessage && (
                        <div className="bg-gray-700 border-2 border-purple-500 rounded-lg p-4 mb-6">
                            <p className="text-purple-300 italic">
                                {aiMessage}
                            </p>
                        </div>
                    )}

                    <p className="text-neon-green italic mb-6">
                        {t.legend.town.hideoutWelcome}
                    </p>

                    {/* Save State Button */}
                    <button
                        onClick={onShowSaveState}
                        className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-all mb-4"
                    >
                        💾 {t.legend.town.manageSaveStates}
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-[#FFD700] text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition-all"
                    >
                        🚪 {t.legend.town.leaveHideout}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default TownSquare;
