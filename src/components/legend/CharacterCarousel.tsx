import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ARCHETYPES } from '../../types/archetype.types';
import { useLanguage } from '../../contexts/LanguageContext';

interface CharacterNFT {
    tokenId: number;
    archetype: number;
    createdAt: number;
    metadata: {
        name: string;
        level: number;
        goldStolen: number;
        image: string;
    };
    status?: {
        health: number;
        maxHealth: number;
        isAlive: boolean;
        location: string;
        sleptSafely: boolean;
        isOnline: boolean;
        lastSeen: Date | null;
    };
}

interface CharacterCarouselProps {
    characters: CharacterNFT[];
    onCharacterSelected: (tokenId: number) => void;
    onCreateNew: () => void;
}

const CharacterCarousel: React.FC<CharacterCarouselProps> = ({
    characters,
    onCharacterSelected,
    onCreateNew
}) => {
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Auto-scroll through characters
    useEffect(() => {
        if (characters.length <= 1) return;

        const interval = setInterval(() => {
            if (!isAnimating) {
                nextCharacter();
            }
        }, 4000); // Auto-advance every 4 seconds

        return () => clearInterval(interval);
    }, [characters.length, currentIndex, isAnimating]);

    const nextCharacter = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev + 1) % (characters.length + 1)); // +1 for create new option
        setTimeout(() => setIsAnimating(false), 600);
    };

    const prevCharacter = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev - 1 + (characters.length + 1)) % (characters.length + 1));
        setTimeout(() => setIsAnimating(false), 600);
    };

    const selectCharacter = () => {
        if (currentIndex < characters.length) {
            onCharacterSelected(characters[currentIndex].tokenId);
        } else {
            onCreateNew();
        }
    };

    const getCurrentItem = () => {
        if (currentIndex < characters.length) {
            const char = characters[currentIndex];
            const archetypeList = Object.values(ARCHETYPES);
            const archetype = archetypeList[char.archetype] || archetypeList[0];
            return { type: 'character', data: char, archetype };
        } else {
            return { type: 'create', data: null, archetype: null };
        }
    };

    const getLocationName = (location: string): string => {
        const locationMap: { [key: string]: string } = {
            'town': '🏛️ Town Square',
            'inn': '🏨 Inn (Safe)',
            'brothel': '💋 Brothel',
            'market': '🏪 Market',
            'arena': '⚔️ Arena',
            'forest': '🌲 Forest',
            'dungeon': '🏰 Dungeon',
            'unknown': '❓ Unknown'
        };
        return locationMap[location] || `📍 ${location}`;
    };

    const currentItem = getCurrentItem();
    const isCharacter = currentItem.type === 'character';

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
            {/* Retro CRT Effect */}
            <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-20"></div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-4xl w-full relative"
            >
                {/* Header - Desktop */}
                <div className="hidden md:block text-[#FFD700] text-center mb-8 font-retro">
                    <div className="animate-pulse">
                        <div className="text-3xl font-bold">🦎 {t.characterSelect.carouselTitle} 🦎</div>
                        <div className="text-lg mt-2 text-gray-400">{t.characterSelect.carouselSubtitle}</div>
                    </div>
                </div>

                {/* Header - Mobile */}
                <div className="block md:hidden text-[#FFD700] text-center mb-6 font-retro">
                    <div className="animate-pulse">
                        <div className="text-xl font-bold">🦎 {t.characterSelect.carouselTitle.substring(0, 20)} 🦎</div>
                        <div className="text-sm mt-2 text-gray-400">{t.characterSelect.carouselSubtitle.substring(0, 22)}</div>
                    </div>
                </div>

                {/* Main Carousel Container - Slot Machine Style */}
                <div className="relative bg-gradient-to-b from-gray-900 via-black to-gray-900 border-4 border-[#FFD700] rounded-2xl p-8 backdrop-blur-sm shadow-2xl shadow-primary-gold/20">

                    {/* Navigation Arrows - Pixel Style */}
                    <button
                        onClick={prevCharacter}
                        disabled={isAnimating}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-6xl text-[#FFD700] hover:text-yellow-400 transition-all disabled:opacity-50 font-mono hover:scale-110"
                        style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}
                    >
                        ◀
                    </button>

                    <button
                        onClick={nextCharacter}
                        disabled={isAnimating}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-6xl text-[#FFD700] hover:text-yellow-400 transition-all disabled:opacity-50 font-mono hover:scale-110"
                        style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}
                    >
                        ▶
                    </button>

                    {/* Character Display Area - Slot Machine Reel */}
                    <div className="min-h-[500px] flex flex-col items-center justify-center relative">
                        {/* Slot Machine Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-radial from-[#FFD700]/5 via-transparent to-transparent rounded-xl pointer-events-none"></div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 400, scale: 0.7, rotateY: -90 }}
                                animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
                                exit={{ opacity: 0, x: -400, scale: 0.7, rotateY: 90 }}
                                transition={{
                                    duration: 0.8,
                                    ease: [0.25, 0.1, 0.25, 1],
                                    type: "spring",
                                    stiffness: 100
                                }}
                                className="text-center w-full relative z-10"
                            >
                                {isCharacter ? (
                                    <>
                                        {/* Character Portrait - Clean Style */}
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                rotate: [0, 5, -5, 0]
                                            }}
                                            transition={{
                                                duration: 4,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            className="text-6xl md:text-9xl mb-4 md:mb-6 relative"
                                            style={{
                                                textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3)',
                                                filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))'
                                            }}
                                        >
                                            {currentItem.archetype?.emoji}
                                        </motion.div>

                                        {/* Character Name - Pixel Font with Glow */}
                                        <h2 className="text-4xl font-bold text-[#FFD700] mb-2 font-retro"
                                            style={{
                                                textShadow: '2px 2px 0px rgba(0,0,0,0.8), 0 0 10px rgba(255, 215, 0, 0.5)',
                                                letterSpacing: '2px'
                                            }}>
                                            {currentItem.data?.metadata.name || `${currentItem.archetype ? (t.archetypes[currentItem.archetype.name as keyof typeof t.archetypes]?.displayName || currentItem.archetype.displayName) : ''} #${currentItem.data?.tokenId}`}
                                        </h2>

                                        {/* Character Status - Real-time Game State */}
                                        {currentItem.data?.status && (
                                            <div className="mb-4 bg-black/80 border-2 rounded-lg p-3"
                                                style={{
                                                    borderColor: currentItem.data.status.isAlive
                                                        ? (currentItem.data.status.sleptSafely || currentItem.data.status.location === 'inn' ? '#3B82F6' : currentItem.data.status.isOnline ? '#00FF88' : '#EAB308')
                                                        : '#EF4444'
                                                }}>
                                                <div className="text-xs font-retro text-gray-400 mb-2 text-center">⚡ CURRENT STATUS ⚡</div>
                                                <div className="grid grid-cols-2 gap-2 text-xs font-retro">
                                                    {/* Health Status */}
                                                    <div className={`p-2 rounded ${currentItem.data.status.isAlive ? 'bg-[#00AA55]/30 border border-[#00DD77]' : 'bg-red-900/30 border border-red-600'}`}>
                                                        <div className={currentItem.data.status.isAlive ? 'text-green-400' : 'text-red-400'}>
                                                            {currentItem.data.status.isAlive ? '❤️ ALIVE' : '💀 DEAD'}
                                                        </div>
                                                        <div className="text-white text-lg">
                                                            {currentItem.data.status.health}/{currentItem.data.status.maxHealth}
                                                        </div>
                                                    </div>

                                                    {/* Online Status */}
                                                    <div className={`p-2 rounded ${currentItem.data.status.isOnline ? 'bg-[#00AA55]/30 border border-[#00DD77]' : 'bg-black border border-gray-600'}`}>
                                                        <div className={currentItem.data.status.isOnline ? 'text-green-400' : 'text-gray-400'}>
                                                            {currentItem.data.status.isOnline ? '● ONLINE' : '○ OFFLINE'}
                                                        </div>
                                                    </div>

                                                    {/* Location */}
                                                    <div className="col-span-2 p-2 rounded bg-purple-900/30 border border-purple-600">
                                                        <div className="text-purple-400">
                                                            {getLocationName(currentItem.data.status.location)}
                                                        </div>
                                                    </div>

                                                    {/* Protection Status */}
                                                    {currentItem.data.status.sleptSafely ? (
                                                        <div className="col-span-2 p-2 rounded bg-blue-900/30 border border-blue-600">
                                                            <div className="text-blue-400">
                                                                🛡️ PROTECTED FROM PVP ATTACKS
                                                            </div>
                                                        </div>
                                                    ) : !currentItem.data.status.isOnline && currentItem.data.status.isAlive ? (
                                                        <div className="col-span-2 p-2 rounded bg-yellow-900/30 border border-yellow-600">
                                                            <div className="text-yellow-400">
                                                                ⚠️ VULNERABLE TO PVP ATTACKS
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )}

                                        {/* Archetype Description - Clean Style */}
                                        <div className="bg-black/30 rounded-lg p-4 md:p-6 mb-4 border border-gray-600"
                                            style={{ boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)' }}>
                                            <p className="text-sm md:text-lg text-gray-300 font-retro leading-relaxed text-justify"
                                                style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.6)' }}>
                                                "{currentItem.archetype ? (t.archetypes[currentItem.archetype.name as keyof typeof t.archetypes]?.lore || currentItem.archetype.lore) : ''}"
                                            </p>
                                        </div>

                                        {/* Archetype Badge - Clean Style */}
                                        <div className="inline-block px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg text-xs md:text-sm font-retro mb-4 md:mb-6 border-2 border-[#FFD700]/50 shadow-lg"
                                            style={{
                                                textShadow: '1px 1px 0px rgba(0,0,0,0.8)',
                                                boxShadow: '0 0 10px rgba(255, 215, 0, 0.2), inset 0 1px 0 rgba(255, 215, 0, 0.1)'
                                            }}>
                                            <span className="text-[#FFD700] font-bold">
                                                {currentItem.archetype?.role.toUpperCase()}
                                            </span>
                                            <span className="text-gray-400 mx-2">•</span>
                                            <span className="text-yellow-400 font-bold">
                                                {currentItem.archetype?.rarity.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Character Stats - Clean Style */}
                                        <div className="mb-4">
                                            <h3 className="text-neon-green mb-3 md:mb-4 text-center font-retro text-sm md:text-lg font-bold"
                                                style={{ textShadow: '0 0 10px rgba(0, 255, 136, 0.5)' }}>
                                                [ {t.legend.character.stats.toUpperCase()} ]
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2 md:gap-4 font-mono">
                                                <div className="text-center bg-black/50 rounded p-2 md:p-3 border border-gray-600">
                                                    <div className="text-red-400 font-retro font-bold text-xs md:text-sm"
                                                        style={{ textShadow: '0 0 5px rgba(239, 68, 68, 0.5)' }}>
                                                        {t.legend.stats.level.toUpperCase()}
                                                    </div>
                                                    <div className="text-lg md:text-2xl font-bold text-white mt-1"
                                                        style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
                                                        {currentItem.data?.metadata.level}
                                                    </div>
                                                </div>
                                                <div className="text-center bg-black/50 rounded p-2 md:p-3 border border-gray-600">
                                                    <div className="text-yellow-400 font-retro font-bold text-xs md:text-sm"
                                                        style={{ textShadow: '0 0 5px rgba(251, 191, 36, 0.5)' }}>
                                                        {t.legend.character.goldStolen.toUpperCase()}
                                                    </div>
                                                    <div className="text-lg md:text-xl font-bold text-white mt-1"
                                                        style={{ textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>
                                                        {currentItem.data?.metadata.goldStolen.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Archetype Stats - Clean Style */}
                                        <div className="mb-4">
                                            <h3 className="text-neon-blue mb-3 md:mb-4 text-center font-retro text-sm md:text-lg">{t.characterSelect.chooseArchetype.toUpperCase()}</h3>
                                            <div className="grid grid-cols-3 gap-2 md:gap-4 font-mono">
                                                <div className="text-center bg-black/50 rounded p-2 md:p-3 border border-gray-600">
                                                    <div className="text-red-400 font-retro font-bold text-xs md:text-sm"
                                                        style={{ textShadow: '0 0 5px rgba(239, 68, 68, 0.5)' }}>
                                                        {t.legend.character.strength.substring(0, 3).toUpperCase()}
                                                    </div>
                                                    <div className="text-lg md:text-2xl font-bold text-white mt-1"
                                                        style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
                                                        {5 + (currentItem.archetype?.statBonuses.strength || 0)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-retro">+{currentItem.archetype?.statBonuses.strength || 0}</div>
                                                </div>
                                                <div className="text-center bg-black/50 rounded p-2 md:p-3 border border-gray-600">
                                                    <div className="text-blue-400 font-retro font-bold text-xs md:text-sm"
                                                        style={{ textShadow: '0 0 5px rgba(59, 130, 246, 0.5)' }}>
                                                        {t.legend.character.defense.substring(0, 3).toUpperCase()}
                                                    </div>
                                                    <div className="text-lg md:text-2xl font-bold text-white mt-1"
                                                        style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
                                                        {5 + (currentItem.archetype?.statBonuses.defense || 0)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-retro">+{currentItem.archetype?.statBonuses.defense || 0}</div>
                                                </div>
                                                <div className="text-center bg-black/50 rounded p-2 md:p-3 border border-gray-600">
                                                    <div className="text-pink-400 font-retro font-bold text-xs md:text-sm"
                                                        style={{ textShadow: '0 0 5px rgba(236, 72, 153, 0.5)' }}>
                                                        {t.legend.character.charm.substring(0, 3).toUpperCase()}
                                                    </div>
                                                    <div className="text-lg md:text-2xl font-bold text-white mt-1"
                                                        style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
                                                        {5 + (currentItem.archetype?.statBonuses.charm || 0)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-retro">+{currentItem.archetype?.statBonuses.charm || 0}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Create New Character - Clean Style */}
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.2, 1],
                                                rotate: [0, 10, -10, 0]
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            className="text-6xl md:text-9xl mb-4 md:mb-6 relative"
                                            style={{
                                                textShadow: '0 0 20px rgba(0, 255, 136, 0.5), 0 0 40px rgba(0, 255, 136, 0.3)',
                                                filter: 'drop-shadow(0 0 15px rgba(0, 255, 136, 0.5))'
                                            }}
                                        >
                                            ➕
                                        </motion.div>

                                        <h2 className="text-4xl font-bold text-neon-green mb-4 font-retro"
                                            style={{
                                                textShadow: '2px 2px 0px rgba(0,0,0,0.8), 0 0 15px rgba(0, 255, 136, 0.7)',
                                                letterSpacing: '2px'
                                            }}>
                                            {t.characterSelect.createNew.toUpperCase()}
                                        </h2>

                                        <div className="text-xl text-gray-300 mb-6 font-retro"
                                            style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.6)' }}>
                                            {t.characterSelect.characterCreation}
                                        </div>

                                        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-neon-green rounded-lg p-6 mb-6 shadow-lg"
                                            style={{ boxShadow: '0 0 20px rgba(0, 255, 136, 0.2), inset 0 0 20px rgba(0, 255, 136, 0.05)' }}>
                                            <div className="text-center">
                                                <div className="text-4xl font-bold text-neon-green mb-2 font-retro"
                                                    style={{ textShadow: '0 0 15px rgba(0, 255, 136, 0.8)' }}>
                                                    0.01 BNB
                                                </div>
                                                <div className="text-gray-300 font-retro font-bold">{t.characterSelect.mintPrice}</div>
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-400 max-w-md font-retro text-center bg-black/50 rounded p-4 border border-gray-600"
                                            style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                                            {t.characterSelect.mintInfo}
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Selection Button - Arcade Style */}
                    <motion.button
                        onClick={selectCharacter}
                        className="w-full mt-6 bg-gradient-to-r from-[#FFD700] via-yellow-500 to-[#FFD700] text-gray-900 font-bold py-5 px-8 rounded-lg font-retro text-xl border-4 border-yellow-300 shadow-2xl transition-all relative overflow-hidden"
                        style={{
                            boxShadow: '0 0 30px rgba(255, 215, 0, 0.5), 0 4px 15px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255, 255, 255, 0.2)',
                            background: 'linear-gradient(45deg, #FFD700, #FFA500, #FFD700, #FFA500)',
                            backgroundSize: '400% 400%',
                            animation: 'shimmer 3s ease-in-out infinite'
                        }}
                        whileHover={{
                            scale: 1.02,
                            boxShadow: '0 0 40px rgba(255, 215, 0, 0.7), 0 6px 20px rgba(0,0,0,0.4)'
                        }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {/* Button shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
                        <span className="relative z-10">
                            {isCharacter ? `🎯 ${t.characterSelect.selectCharacter.toUpperCase()} ${currentItem.data?.metadata.name || (currentItem.archetype ? (t.archetypes[currentItem.archetype.name as keyof typeof t.archetypes]?.displayName || currentItem.archetype.displayName) : '')}` : `🦎 ${t.characterSelect.createNew.toUpperCase()}`}
                        </span>
                    </motion.button>

                    {/* Progress Indicators */}
                    <div className="flex justify-center mt-6 space-x-2">
                        {Array.from({ length: characters.length + 1 }, (_, i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    scale: currentIndex === i ? 1.2 : 1,
                                    backgroundColor: currentIndex === i ? '#FFD700' : '#374151'
                                }}
                                className="w-3 h-3 rounded-full cursor-pointer"
                                onClick={() => {
                                    if (!isAnimating) {
                                        setIsAnimating(true);
                                        setCurrentIndex(i);
                                        setTimeout(() => setIsAnimating(false), 600);
                                    }
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Controls - Pixel Terminal Style */}
                <div className="mt-8 text-center">
                    <div className="bg-gradient-to-b from-gray-900 to-black border-4 border-[#FFD700] rounded-lg p-4 inline-block shadow-2xl"
                        style={{ boxShadow: '0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(0,0,0,0.5)' }}>
                        <div className="text-[#FFD700] text-sm font-retro font-bold mb-2"
                            style={{ textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>
                            [ {t.characterSelect.controls.toUpperCase()} ]
                        </div>
                        <div className="text-gray-300 text-xs font-retro space-y-1">
                            <div style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.8)' }}>
                                ◀ ▶ : {t.characterSelect.spinReel}
                            </div>
                            <div style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.8)' }}>
                                🎯 {t.characterSelect.selectCharacter.toUpperCase()} : {t.characterSelect.chooseCriminal}
                            </div>
                            <div style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.8)' }}>
                                {t.characterSelect.autoAdvances}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Pixel Font */}
                <div className="mt-6 text-center text-xs text-gray-600 font-retro">
                    🦎 CRIME LIZARD GAMES • BLOCKCHAIN EDITION • CHARACTER CAROUSEL • {new Date().getFullYear()} 🦎
                </div>
            </motion.div>
        </div>
    );
};

export default CharacterCarousel;
