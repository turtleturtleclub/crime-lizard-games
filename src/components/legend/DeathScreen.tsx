import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type PlayerCharacter } from '../../types/legend.types';

interface DeathScreenProps {
    player: PlayerCharacter;
    onRespawn: () => void;
    causeOfDeath?: string;
    killedBy?: string;
}

// LORD-style death messages with personality
const DEATH_MESSAGES = [
    "Your adventure has come to a temporary halt...",
    "The darkness embraces you...",
    "You have been slain!",
    "Your lizard soul departs your body...",
    "Game Over... for now!",
    "Death is but a doorway...",
    "You fought well, but not well enough...",
    "The streets have claimed another victim...",
    "Your enemies celebrate your demise...",
    "Even the mightiest fall sometimes..."
];

// Humorous epitaphs inspired by LORD
const EPITAPHS = [
    "Here lies {name}, who thought they were invincible",
    "{name} - They died as they lived: poorly equipped",
    "RIP {name} - Should have slept at the inn",
    "{name} - Gone but not forgotten (probably forgotten)",
    "Here rests {name} - They were warned",
    "{name} - A lizard who flew too close to the sun",
    "In memory of {name} - 'It seemed like a good idea at the time'",
    "{name} - At least their death was entertaining",
    "Here lies {name} - They'll be back in 5 minutes anyway",
    "{name} - Death is just a minor inconvenience"
];

const DeathScreen: React.FC<DeathScreenProps> = ({ player, onRespawn, causeOfDeath, killedBy }) => {
    const [showRespawnButton, setShowRespawnButton] = useState(false);
    const [hoveredButton, setHoveredButton] = useState(false);
    const [respawning, setRespawning] = useState(false);
    const [deathMessage] = useState(() =>
        DEATH_MESSAGES[Math.floor(Math.random() * DEATH_MESSAGES.length)]
    );
    const [epitaph] = useState(() => {
        const template = EPITAPHS[Math.floor(Math.random() * EPITAPHS.length)];
        return template.replace('{name}', player.name);
    });

    useEffect(() => {
        // Dramatic delay before showing respawn button
        const timer = setTimeout(() => {
            setShowRespawnButton(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    const handleRespawn = async () => {
        setRespawning(true);

        try {
            const response = await fetch('/api/legend/player/respawn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId
                })
            });

            if (response.ok) {
                await response.json();
// Dramatic delay before closing
                setTimeout(() => {
                    onRespawn();
                }, 1500);
            } else {
                console.error('Failed to respawn');
                setRespawning(false);
            }
        } catch (error) {
            console.error('Error respawning:', error);
            setRespawning(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-critical bg-black bg-opacity-95 overflow-y-auto overscroll-none"
        >
            {/* Animated background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-red-900/20 via-black to-black"
                    animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: 'reverse',
                    }}
                />
            </div>

            {/* Main death screen content - now scrollable with padding for mobile */}
            <div className="relative z-10 max-w-4xl w-full mx-auto px-4 py-8 md:py-16 min-h-full flex items-center">
                <motion.div
                    initial={{ scale: 0.8, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-gradient-to-br from-gray-900 via-red-900/40 to-gray-900 border-4 border-red-700 rounded-lg shadow-2xl p-4 md:p-8 w-full"
                >
                    {/* Skull/Death Icon */}
                    <motion.div
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ duration: 0.8, type: 'spring' }}
                        className="text-center mb-4 md:mb-6"
                    >
                        <div className="text-6xl md:text-8xl mb-2 md:mb-4">💀</div>
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-3xl md:text-5xl font-bold text-red-500 mb-2 tracking-wider"
                            style={{ textShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}
                        >
                            YOU HAVE DIED
                        </motion.h1>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
                        {/* Character Image */}
                        <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="relative"
                        >
                            <div className="relative overflow-hidden rounded-lg border-4 border-red-800 shadow-xl">
                                <img
                                    src="/assets/character.jpg"
                                    alt={player.name}
                                    className="w-full h-auto opacity-50 grayscale"
                                    style={{ filter: 'brightness(0.4) sepia(100%) hue-rotate(-50deg) saturate(600%)' }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 right-2 md:right-4">
                                    <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{player.name}</h2>
                                    <p className="text-red-400 text-xs md:text-sm">Level {player.level} - Token #{player.tokenId}</p>
                                </div>
                            </div>

                            {/* Tombstone decoration */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1.2 }}
                                className="mt-3 md:mt-4 bg-black border-2 border-gray-700 rounded-lg p-3 md:p-4 text-center"
                            >
                                <p className="text-gray-400 text-xs md:text-sm italic">"{epitaph}"</p>
                            </motion.div>
                        </motion.div>

                        {/* Death Statistics */}
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 1.0 }}
                            className="space-y-3 md:space-y-4"
                        >
                            {/* Death Message */}
                            <div className="bg-black/50 border-2 border-red-900 rounded-lg p-3 md:p-4">
                                <p className="text-red-400 text-base md:text-lg italic mb-3 md:mb-4">{deathMessage}</p>

                                {killedBy && (
                                    <div className="mb-2 md:mb-3">
                                        <p className="text-gray-400 text-xs md:text-sm">Slain by:</p>
                                        <p className="text-red-500 font-bold text-lg md:text-xl">{killedBy}</p>
                                    </div>
                                )}

                                {causeOfDeath && (
                                    <div className="mb-2 md:mb-3">
                                        <p className="text-gray-400 text-xs md:text-sm">Cause of Death:</p>
                                        <p className="text-white text-sm md:text-base">{causeOfDeath}</p>
                                    </div>
                                )}
                            </div>

                            {/* Death Statistics */}
                            <div className="bg-black/50 border-2 border-gray-700 rounded-lg p-3 md:p-4">
                                <h3 className="text-yellow-500 font-bold mb-2 md:mb-3 text-center text-sm md:text-base">⚰️ YOUR FATE ⚰️</h3>
                                <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Total Deaths:</span>
                                        <span className="text-white font-bold">{player.deathCount || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">PVP Wins:</span>
                                        <span className="text-[#00FF88] font-bold">{player.pvpWins || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">PVP Losses:</span>
                                        <span className="text-red-500 font-bold">{player.pvpLosses || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Level:</span>
                                        <span className="text-yellow-500 font-bold">{player.level}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Current Gold:</span>
                                        <span className="text-yellow-600 font-bold">💰 {player.gold}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Respawn Information */}
                            <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-2 border-[#00BB66] rounded-lg p-3 md:p-4">
                                <h3 className="text-green-400 font-bold mb-2 text-center text-sm md:text-base">✨ RESURRECTION ✨</h3>
                                <ul className="text-xs text-gray-300 space-y-0.5 md:space-y-1">
                                    <li>✓ Respawn with 50% health</li>
                                    <li>✓ Return to Town Square</li>
                                    <li>✓ 5-minute PVP protection</li>
                                    <li>✓ Keep all your gear & gold</li>
                                </ul>
                            </div>
                        </motion.div>
                    </div>

                    {/* Respawn Button */}
                    <AnimatePresence>
                        {showRespawnButton && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="text-center"
                            >
                                <motion.button
                                    onClick={handleRespawn}
                                    disabled={respawning}
                                    onHoverStart={() => setHoveredButton(true)}
                                    onHoverEnd={() => setHoveredButton(false)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`
                                        px-6 md:px-12 py-3 md:py-4 text-base md:text-xl font-bold rounded-lg
                                        transition-all duration-300
                                        ${respawning
                                            ? 'bg-gray-600 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-[#00DD77] via-[#00FF88] to-emerald-600 hover:from-[#00FF88] hover:via-green-400 hover:to-emerald-500'
                                        }
                                        text-white shadow-lg
                                        border-2 md:border-4 border-[#00BB66]
                                        w-full md:w-auto
                                    `}
                                    style={{
                                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                        boxShadow: hoveredButton
                                            ? '0 0 30px rgba(34, 197, 94, 0.6)'
                                            : '0 0 15px rgba(34, 197, 94, 0.3)'
                                    }}
                                >
                                    {respawning ? (
                                        <>
                                            <motion.span
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                className="inline-block mr-2"
                                            >
                                                ⚡
                                            </motion.span>
                                            RESPAWNING...
                                        </>
                                    ) : (
                                        <>
                                            ✨ RESURRECT AT TOWN SQUARE ✨
                                        </>
                                    )}
                                </motion.button>

                                {!respawning && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-gray-400 text-xs md:text-sm mt-3 md:mt-4"
                                    >
                                        Press to rise again and continue your adventure!
                                    </motion.p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Flavor text at bottom */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="mt-4 md:mt-6 text-center text-gray-500 text-xs italic"
                    >
                        "Death is lighter than a feather, but duty is heavier than a mountain."
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default DeathScreen;

