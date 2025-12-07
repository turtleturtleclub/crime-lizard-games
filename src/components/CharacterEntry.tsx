/**
 * ═══════════════════════════════════════════════════════════
 * CHARACTER ENTRY - GameFi Gateway
 * ═══════════════════════════════════════════════════════════
 *
 * This is the ENTRY POINT to the Crime Lizard universe.
 * Your Character NFT is your identity, your account, your asset.
 *
 * Flow:
 * 1. No wallet? → Connect prompt
 * 2. No character? → Mint prompt
 * 3. Have characters? → Select & enter the world
 */

import { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { WalletContext } from '../providers/WalletContext';
import { useCharacter } from '../contexts/CharacterContext';
import { useLanguage } from '../contexts/LanguageContext';
import CharacterCreationV2 from './legend/CharacterCreationV2';
import LegendGame from './LegendGame';
import HowToPlay from './HowToPlay';

interface CharacterEntryProps {
    use2DMap?: boolean;
}

export default function CharacterEntry({ use2DMap = false }: CharacterEntryProps) {
    const { account, connectWallet } = useContext(WalletContext);
    const { selectedCharacter, userCharacters, selectCharacter, refreshCharacters, isLoading } = useCharacter();
    const { t } = useLanguage();
    const [showCharacterCreation, setShowCharacterCreation] = useState(false);
    const [showHowToPlay, setShowHowToPlay] = useState(false);

    // ═══════════════════════════════════════════════════════════
    // PHASE 0: LOADING CHARACTERS (Mobile Fix)
    // ═══════════════════════════════════════════════════════════
    // On mobile, async character fetching can cause race conditions.
    // Wait for character data to load before making routing decisions.
    if (account && isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-bbs">
                {/* Terminal scanlines */}
                <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-5"></div>

                {/* Green glow background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-96 h-96 bg-[#00FF88]/5 rounded-full blur-3xl top-1/4 left-1/4 animate-pulse"></div>
                    <div className="absolute w-96 h-96 bg-[#FFD700]/5 rounded-full blur-3xl bottom-1/4 right-1/4 animate-pulse delay-1000"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center relative z-10"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="text-6xl mb-6"
                    >
                        🦎
                    </motion.div>
                    <h2 className="text-2xl text-[#00FF88] font-bold text-glow-green mb-2">
                        {t.common?.loading || 'Loading...'}
                    </h2>
                    <p className="text-[#00FF88]/60 text-sm">
                        {t.legend?.loading?.checkingCharacters || 'Checking your characters...'}
                    </p>
                </motion.div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: NOT CONNECTED
    // ═══════════════════════════════════════════════════════════
    if (!account) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-bbs">
                {/* Terminal scanlines */}
                <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-5"></div>

                {/* Green glow background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-96 h-96 bg-[#00FF88]/5 rounded-full blur-3xl top-1/4 left-1/4 animate-pulse"></div>
                    <div className="absolute w-96 h-96 bg-[#FFD700]/5 rounded-full blur-3xl bottom-1/4 right-1/4 animate-pulse delay-1000"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-2xl relative z-10"
                >
                    {/* Animated Lizard Logo */}
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                            filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)']
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="mb-8"
                    >
                        <img
                            src="/assets/clzdLogo.png"
                            alt="Crime Lizard"
                            className="w-56 h-56 mx-auto object-contain"
                            style={{ filter: 'drop-shadow(0 0 20px rgba(0, 255, 136, 0.4))' }}
                        />
                    </motion.div>

                    {/* Title */}
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 text-[#00FF88] text-glow-green font-bbs">
                        &gt; {t.characterEntry.legendOfThe}
                    </h1>
                    <h1 className="text-6xl md:text-7xl font-bold mb-6 text-[#FFD700] text-glow-gold font-bbs">
                        {t.characterEntry.crimeLizard}
                    </h1>

                    {/* Tagline */}
                    <p className="text-xl text-[#00FF88]/80 mb-8 font-bbs">
                        &gt; {t.characterEntry.ultimateBlockchainRPG}
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-4 mb-12 text-left">
                        <div className="bg-black border-2 border-[#00FF88] p-4">
                            <div className="text-3xl mb-2">🦎</div>
                            <div className="text-[#00FF88] font-bold text-glow-green">{t.characterEntry.characterNFTs}</div>
                            <div className="text-[#00FF88]/60 text-sm">{t.characterEntry.characterNFTsDesc}</div>
                        </div>
                        <div className="bg-black border-2 border-[#FFD700] p-4">
                            <div className="text-3xl mb-2">⛓️</div>
                            <div className="text-[#FFD700] font-bold text-glow-gold">{t.characterEntry.onChainStats}</div>
                            <div className="text-[#FFD700]/60 text-sm">{t.characterEntry.onChainStatsDesc}</div>
                        </div>
                        <div className="bg-black border-2 border-[#FFD700] p-4">
                            <div className="text-3xl mb-2">💰</div>
                            <div className="text-[#FFD700] font-bold text-glow-gold">{t.characterEntry.earnGold}</div>
                            <div className="text-[#FFD700]/60 text-sm">{t.characterEntry.earnGoldDesc}</div>
                        </div>
                        <div className="bg-black border-2 border-[#00FF88] p-4">
                            <div className="text-3xl mb-2">🎮</div>
                            <div className="text-[#00FF88] font-bold text-glow-green">{t.characterEntry.epicGameplay}</div>
                            <div className="text-[#00FF88]/60 text-sm">{t.characterEntry.epicGameplayDesc}</div>
                        </div>
                    </div>

                    {/* Connect Button */}
                    <motion.button
                        onClick={() => connectWallet()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-12 py-6 bg-black border-4 border-[#00FF88] text-[#00FF88] text-2xl font-bold hover:bg-[#00FF88]/10 transition-all font-bbs text-glow-green"
                        style={{ boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' }}
                    >
                        {t.characterEntry.connectWallet}
                    </motion.button>

                    <p className="text-[#00FF88]/50 mt-4 text-sm font-bbs">
                        &gt; {t.characterEntry.supportedWallets}
                    </p>

                    {/* How to Play Button */}
                    <motion.button
                        onClick={() => setShowHowToPlay(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-6 px-8 py-3 bg-black border-2 border-[#FFD700] text-[#FFD700] text-lg font-bold hover:bg-[#FFD700]/10 transition-all font-bbs"
                    >
                        [?] HOW TO PLAY
                    </motion.button>
                </motion.div>

                {/* How to Play Modal */}
                <HowToPlay isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: NO CHARACTERS - MINT PROMPT
    // ═══════════════════════════════════════════════════════════
    if (userCharacters.length === 0 || showCharacterCreation) {
        return (
            <div className="min-h-screen bg-black">
                <CharacterCreationV2
                    onCharacterCreated={async (tokenId: number) => {
setShowCharacterCreation(false);
                        // Refresh character list
                        await refreshCharacters();
                        // Wait for refresh
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        // Select the new character
                        await selectCharacter(BigInt(tokenId));
                    }}
                    onCancel={() => {
                        setShowCharacterCreation(false);
                    }}
                />
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: HAS CHARACTERS - SELECT & ENTER
    // ═══════════════════════════════════════════════════════════
    if (!selectedCharacter) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-bbs">
                {/* Terminal scanlines */}
                <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-5"></div>

                {/* Green glow background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-96 h-96 bg-[#00FF88]/5 rounded-full blur-3xl top-1/4 left-1/4 animate-pulse"></div>
                    <div className="absolute w-96 h-96 bg-[#FFD700]/5 rounded-full blur-3xl bottom-1/4 right-1/4 animate-pulse delay-1000"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-6xl w-full relative z-10"
                >
                    {/* ASCII Header */}
                    <pre className="text-[#00FF88] text-xs mb-6 text-glow-green">
{`╔═══════════════════════════════════════════════════╗
║         CHARACTER SELECTION TERMINAL              ║
╚═══════════════════════════════════════════════════╝`}
                    </pre>

                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#00FF88] text-glow-green font-bbs">
                        &gt; SELECT YOUR CHARACTER_
                    </h1>
                    <p className="text-[#00FF88]/80 mb-12 text-lg font-bbs">
                        Choose which Crime Lizard to enter the world with
                    </p>

                    {/* Character Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {userCharacters.map((char) => (
                            <motion.div
                                key={char.tokenId.toString()}
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => selectCharacter(char.tokenId)}
                                className="bg-black border-2 border-[#00FF88] p-6 cursor-pointer hover:border-[#FFD700] hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all"
                            >
                                {/* Character Image */}
                                <div className="w-full aspect-square bg-black border-2 border-[#FFD700] mb-4 flex items-center justify-center">
                                    <span className="text-6xl">
                                        {char.archetype === 0 ? '⚒️' :
                                         char.archetype === 1 ? '🗡️' :
                                         char.archetype === 2 ? '🛡️' :
                                         char.archetype === 3 ? '🔮' :
                                         char.archetype === 4 ? '🏹' : '🦎'}
                                    </span>
                                </div>

                                {/* Character Info */}
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-[#00FF88] mb-1 text-glow-green">
                                        {char.name}
                                    </h3>
                                    <p className="text-[#00FF88]/60 text-sm mb-3">
                                        ID: #{char.tokenId.toString()}
                                    </p>

                                    {/* Stats */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[#00FF88]/60">GOLD:</span>
                                            <span className="text-[#FFD700] font-bold text-glow-gold">
                                                {parseInt(char.goldBalance || '0').toLocaleString()} 💰
                                            </span>
                                        </div>
                                        {char.metadata?.attributes && (
                                            <>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[#00FF88]/60">LEVEL:</span>
                                                    <span className="text-[#00FF88] font-bold text-glow-green">
                                                        {char.metadata.attributes.find((a: any) => a.trait_type === 'Level')?.value || 1}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Select Button */}
                                <div className="mt-4 px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] font-bold text-center text-glow-green hover:bg-[#00FF88]/10 transition-all">
                                    [ENTER_WORLD] &gt;
                                </div>
                            </motion.div>
                        ))}

                        {/* Create New Character Card */}
                        <motion.div
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCharacterCreation(true)}
                            className="bg-black border-2 border-dashed border-[#FFD700] p-6 cursor-pointer hover:border-[#FFD700] hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all flex flex-col items-center justify-center min-h-[400px]"
                        >
                            <div className="text-6xl mb-4">➕</div>
                            <h3 className="text-xl font-bold text-[#FFD700] mb-2 text-glow-gold">
                                [MINT_NEW_CHARACTER]
                            </h3>
                            <p className="text-[#FFD700]/60 text-sm text-center">
                                Create another Crime Lizard NFT
                            </p>
                        </motion.div>
                    </div>

                    {/* NFT Value Note */}
                    <div className="bg-black border-2 border-[#00FF88] p-4 text-sm text-[#00FF88]">
                        <pre className="text-xs text-glow-green whitespace-pre-wrap">
💎 YOUR NFT = YOUR ACCOUNT
All stats, gold, XP, and gear are stored on-chain.
Trade your character with all progress on NFT marketplaces!
                        </pre>
                    </div>

                    {/* How to Play Button */}
                    <motion.button
                        onClick={() => setShowHowToPlay(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-4 px-6 py-2 bg-black border-2 border-[#FFD700] text-[#FFD700] font-bold hover:bg-[#FFD700]/10 transition-all font-bbs"
                    >
                        [?] HOW TO PLAY
                    </motion.button>
                </motion.div>

                {/* How to Play Modal */}
                <HowToPlay isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 4: CHARACTER SELECTED - ENTER THE GAME!
    // ═══════════════════════════════════════════════════════════
    return <LegendGame use2DMapDefault={use2DMap} />;
}
