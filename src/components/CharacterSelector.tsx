import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCharacter } from '../contexts/CharacterContext';

const CharacterSelector = () => {
    const navigate = useNavigate();
    const { selectedCharacter, userCharacters, goldBalance, isLoading, selectCharacter } = useCharacter();
    const [isOpen, setIsOpen] = useState(false);
    const [hasCheckedCharacters, setHasCheckedCharacters] = useState(false);

    const handleCharacterSelect = async (tokenId: bigint) => {
        await selectCharacter(tokenId);
        setIsOpen(false);
    };

    const handleCreateCharacter = () => {
        setIsOpen(false);
        // Navigate to dedicated character creation page
        navigate('/create-character');
// Force check after navigation
        setTimeout(() => {
}, 100);
    };

    // Format gold balance
    const formatGold = (gold: string) => {
        const num = parseInt(gold || '0');
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    // Once loading is done and we have 0 characters, redirect to create
    useEffect(() => {
        if (!isLoading && !hasCheckedCharacters && userCharacters.length === 0) {
            setHasCheckedCharacters(true);
            // Small delay to ensure context is fully loaded
            const timer = setTimeout(() => {
// Don't auto-redirect, just show the create button
                // User should click it intentionally
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isLoading, userCharacters, hasCheckedCharacters]);

    if (isLoading) {
        return (
            <div className="h-12 flex items-center gap-2 px-4 bg-black border-2 border-[#00FF88]/50 rounded-lg">
                <div className="animate-spin text-[#00FF88]">⚙️</div>
                <span className="text-sm text-[#00FF88] font-bold">Loading...</span>
            </div>
        );
    }

    if (userCharacters.length === 0) {
        return (
            <motion.button
                onClick={handleCreateCharacter}
                className="h-12 w-full flex items-center justify-center gap-2 px-4 bg-black border-2 border-[#00FF88] rounded-lg text-[#00FF88] font-bold hover:bg-[#00FF88]/10 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <span>🦎</span>
                <span>Create Character</span>
            </motion.button>
        );
    }

    return (
        <div className="relative">
            {/* Selected Character Display */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="h-12 w-full flex items-center gap-2 px-4 bg-black border-2 border-[#00FF88] rounded-lg text-[#00FF88] font-bold hover:bg-[#00FF88]/10 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {selectedCharacter ? (
                    <>
                        <div className="flex items-center gap-2 flex-1">
                            <span className="text-xl">🦎</span>
                            <div className="hidden lg:block text-left">
                                <div className="text-sm font-bold text-[#00FF88] text-glow-green truncate max-w-[120px]">
                                    {selectedCharacter.name}
                                </div>
                                <div className="text-xs text-[#FFD700] flex items-center gap-1">
                                    <span>💰</span>
                                    <span>{formatGold(goldBalance)}</span>
                                </div>
                            </div>
                            <div className="lg:hidden flex items-center gap-2 flex-1">
                                <div className="text-sm font-bold text-[#00FF88] text-glow-green flex-1">
                                    {selectedCharacter.name}
                                </div>
                                <div className="text-xs text-[#FFD700] flex items-center gap-1">
                                    <span>💰</span>
                                    <span>{formatGold(goldBalance)}</span>
                                </div>
                            </div>
                        </div>
                        <motion.span
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            className="text-[#00FF88] ml-1 text-xs"
                        >
                            ▼
                        </motion.span>
                    </>
                ) : (
                    <>
                        <span>🦎</span>
                        <span className="text-sm">Select Character</span>
                    </>
                )}
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-2 md:right-0 md:left-auto md:w-72 bg-black border-2 border-[#FFD700] shadow-2xl z-modal-elevated overflow-hidden font-bbs"
                    >
                        {/* ASCII Header */}
                        <pre className="text-[#FFD700] text-center text-xs py-2 text-glow-gold">
                            {`╔════════════════════════════╗
║   YOUR CHARACTERS   ║
╚════════════════════════════╝`}
                        </pre>
                        {/* Header */}
                        <div className="px-4 py-3 border-b-2 border-gray-700 bg-black">
                            <h3 className="font-bold text-[#FFD700]">Character Selection</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                {userCharacters.length} character{userCharacters.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Character List */}
                        <div className="max-h-[400px] overflow-y-auto overflow-x-hidden character-list-scroll bg-black">
                            {userCharacters.map((character) => (
                                <motion.button
                                    key={character.tokenId.toString()}
                                    onClick={() => handleCharacterSelect(character.tokenId)}
                                    className={`w-full px-4 py-3 flex items-center gap-3 border-b-2 transition-colors ${selectedCharacter?.tokenId === character.tokenId
                                        ? 'bg-[#FFD700]/10 border-b-[#FFD700] border-l-4 border-l-[#FFD700]'
                                        : 'border-b-gray-700 hover:bg-black'
                                        }`}
                                    whileHover={{ x: 4 }}
                                >
                                    {/* Character Avatar */}
                                    <div className="w-12 h-12 border-2 border-neon-green bg-black flex items-center justify-center text-lg font-bold text-neon-green">
                                        #{character.tokenId.toString().slice(-2)}
                                    </div>

                                    {/* Character Info */}
                                    <div className="flex-1 text-left">
                                        <div className="font-bold text-[#00FF88] text-glow-green">
                                            {character.name}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            ID: {character.tokenId.toString()}
                                        </div>
                                        <div className="text-xs text-neon-green mt-1">
                                            💰 {formatGold(character.goldBalance)} Gold
                                        </div>
                                    </div>

                                    {/* Selected Indicator */}
                                    {selectedCharacter?.tokenId === character.tokenId && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-6 h-6 border-2 border-[#FFD700] bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold"
                                        >
                                            ✓
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {/* Footer - Create New Character */}
                        <div className="px-4 py-3 border-t-2 border-[#FFD700] bg-black">
                            <motion.button
                                onClick={handleCreateCharacter}
                                className="w-full py-2 px-4 bg-black border-2 border-neon-green text-neon-green font-bold hover:bg-neon-green/10 transition-all duration-300"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span>🦎</span>
                                    <span>[+] Create New Character</span>
                                </span>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-modal-backdrop"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default CharacterSelector;
