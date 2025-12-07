import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletContext } from '../../providers/WalletContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ethers } from 'ethers';
import { ARCHETYPES } from '../../types/archetype.types';
import { CHARACTER_CONTRACT_ABI, CHARACTER_CONTRACT_ADDRESS } from '../../characterAbi';

interface CharacterCreationProps {
    onCharacterCreated: (tokenId: number) => void;
    onCancel: () => void;
}

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onCharacterCreated, onCancel }) => {
    const { account, signer } = useContext(WalletContext);
    const { t } = useLanguage();
    const [selectedArchetype, setSelectedArchetype] = useState(0);
    const [customName, setCustomName] = useState('');
    const [telegramUsername, setTelegramUsername] = useState('');
    const [xUsername, setXUsername] = useState('');
    const [minting, setMinting] = useState(false);
    const [message, setMessage] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

    const archetypeList = Object.values(ARCHETYPES);
    const archetype = archetypeList[selectedArchetype];
    const mintPrice = archetype.mintPrice;

    // Debug: Log wallet state changes
    useEffect(() => {
}, [account, signer, minting]);

    // Auto-scroll through archetypes (stops when user interacts)
    useEffect(() => {
        if (!autoScrollEnabled) return;

        const interval = setInterval(() => {
            if (!isAnimating) {
                nextArchetype();
            }
        }, 10000); // Auto-advance every 10 seconds

        return () => clearInterval(interval);
    }, [selectedArchetype, isAnimating, autoScrollEnabled]);

    const nextArchetype = () => {
        if (isAnimating) return;
        setAutoScrollEnabled(false); // Stop auto-scroll when user manually navigates
        setIsAnimating(true);
        setSelectedArchetype((prev) => (prev + 1) % archetypeList.length);
        setTimeout(() => setIsAnimating(false), 600);
    };

    const prevArchetype = () => {
        if (isAnimating) return;
        setAutoScrollEnabled(false); // Stop auto-scroll when user manually navigates
        setIsAnimating(true);
        setSelectedArchetype((prev) => (prev - 1 + archetypeList.length) % archetypeList.length);
        setTimeout(() => setIsAnimating(false), 600);
    };

    const handleDotClick = (index: number) => {
        if (!isAnimating && index !== selectedArchetype) {
            setAutoScrollEnabled(false); // Stop auto-scroll when user clicks a dot
            setIsAnimating(true);
            setSelectedArchetype(index);
            setTimeout(() => setIsAnimating(false), 500);
        }
    };

    const handleMint = async () => {
if (!account || !signer) {
            setMessage('❌ Please connect your wallet first!');
            console.error('Wallet not connected:', { account, signer: !!signer });
            return;
        }

        setMinting(true);
        setMessage('🔄 Minting your character NFT...');

        try {
            // Get contract instance
            const contractAddress = CHARACTER_CONTRACT_ADDRESS.mainnet;
            const contract = new ethers.Contract(contractAddress, CHARACTER_CONTRACT_ABI, signer);

            // Call the smart contract
            const tx = await contract.mintCharacter(
                archetype.id,
                customName || "",
                { value: ethers.parseEther(mintPrice) }
            );

            setMessage('⏳ Waiting for confirmation...');
            const receipt = await tx.wait();

            // Get the token ID from the event
const mintEvent = receipt.logs.find((log: any) => {
                try {
                    const parsed = contract.interface.parseLog(log);
return parsed?.name === 'CharacterMinted';
                } catch (error) {
return false;
                }
            });

            let tokenId;
            if (mintEvent) {
                const parsed = contract.interface.parseLog(mintEvent);
                tokenId = Number(parsed?.args.tokenId);
} else {
                // Fallback: generate a unique tokenId based on transaction details
const blockNumber = Number(receipt.blockNumber);
                const transactionIndex = Number(receipt.index || 0);
                const logCount = receipt.logs.length;

                // Create a unique ID: blockNumber + transactionIndex + logCount
                tokenId = blockNumber * 1000000 + transactionIndex * 1000 + logCount;
            }

            // Ensure tokenId is valid
            if (!tokenId || tokenId <= 0) {
                console.error('Invalid tokenId generated:', tokenId);
                tokenId = Date.now(); // Ultimate fallback
            }
// Record mint in backend
            const response = await fetch('/api/legend/mint-character', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: account,
                    archetype: archetype.id,
                    archetypeName: archetype.name,
                    customName: customName || null,
                    telegramUsername: telegramUsername || null,
                    xUsername: xUsername || null,
                    transactionHash: tx.hash,
                    tokenId
                })
            });

            if (response.ok) {
                setMessage(`✅ SUCCESS! Character NFT #${tokenId} minted! 🎉`);
                setTimeout(() => {
                    onCharacterCreated(tokenId);
                }, 2000);
            } else {
                setMessage('❌ Failed to record character. Contact support.');
            }
        } catch (error: unknown) {
            console.error('Mint error:', error);
            setMessage(`❌ Minting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setMinting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            {/* Retro scanlines */}
            <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-10"></div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-4xl w-full relative"
            >
                {/* Header - Desktop */}
                <div className="hidden md:block text-[#FFD700] text-center mb-8 font-bbs overflow-hidden">
                    <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-[#FFD700] text-glow-gold mb-2 whitespace-nowrap px-4">
                        🦎 CREATE YOUR CRIMINAL EMPIRE 🦎
                    </h1>
                    <p className="text-base lg:text-lg text-gray-400 px-4">
                        SPIN THE REEL • CHOOSE YOUR CRIMINAL
                    </p>
                    {autoScrollEnabled && (
                        <div className="text-xs text-neon-green mt-2">
                            [ AUTO-SCROLL ACTIVE • CLICK ARROWS OR DOTS TO DISABLE ]
                        </div>
                    )}
                </div>

                {/* Header - Mobile */}
                <div className="block md:hidden text-[#FFD700] text-center mb-6 font-bbs px-2 overflow-x-hidden">
                    <div className="inline-block max-w-full">
                        <h1 className="text-base sm:text-xl font-bold text-[#FFD700] text-glow-gold mb-2 leading-tight whitespace-nowrap scale-95 sm:scale-100 origin-center">
                            🦎 CREATE YOUR EMPIRE 🦎
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400">
                        SPIN • CHOOSE • MINT
                    </p>
                    {autoScrollEnabled && (
                        <div className="text-xs text-neon-green mt-1">
                            [ AUTO-SCROLL ON ]
                        </div>
                    )}
                </div>

                {/* Navigation Arrows - Outside the Card */}
                <button
                    onClick={prevArchetype}
                    disabled={isAnimating}
                    className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-20 text-5xl md:text-7xl text-[#FFD700] hover:text-yellow-400 transition-all disabled:opacity-50 font-mono hover:scale-110"
                    style={{
                        textShadow: '3px 3px 0px rgba(0,0,0,0.9), 0 0 20px rgba(255, 215, 0, 0.5)',
                        filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.3))'
                    }}
                >
                    ◀
                </button>

                <button
                    onClick={nextArchetype}
                    disabled={isAnimating}
                    className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-20 text-5xl md:text-7xl text-[#FFD700] hover:text-yellow-400 transition-all disabled:opacity-50 font-mono hover:scale-110"
                    style={{
                        textShadow: '3px 3px 0px rgba(0,0,0,0.9), 0 0 20px rgba(255, 215, 0, 0.5)',
                        filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.3))'
                    }}
                >
                    ▶
                </button>

                {/* Main Carousel Container - Terminal Style */}
                <div className="relative bg-black border-2 border-[#FFD700] p-6 md:p-8 shadow-2xl shadow-primary-gold/20 font-bbs">
                    {/* Character Display Area - Clean Layout */}
                    <div className="min-h-[400px] md:min-h-[500px] flex flex-col items-center justify-center relative">

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedArchetype}
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
                                {/* Character Portrait - Slot Symbol */}
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
                                    {archetype.emoji}
                                </motion.div>

                                {/* Character Name - Terminal Style */}
                                <h2 className="text-2xl md:text-4xl font-bold text-[#FFD700] mb-2 font-bbs text-glow-gold"
                                    style={{ letterSpacing: '2px' }}>
                                    {t.archetypes[archetype.name as keyof typeof t.archetypes]?.displayName || archetype.displayName}
                                </h2>

                                {/* Archetype Description - Terminal Style */}
                                <div className="bg-black p-4 md:p-6 mb-4 border-2 border-gray-600">
                                    <p className="text-sm md:text-lg text-gray-300 font-bbs leading-relaxed">
                                        "{t.archetypes[archetype.name as keyof typeof t.archetypes]?.lore || archetype.lore}"
                                    </p>
                                </div>

                                {/* Archetype Badge - Terminal Style */}
                                <div className="inline-block px-4 md:px-6 py-2 md:py-3 bg-black text-xs md:text-sm font-bbs mb-4 md:mb-6 border-2 border-[#FFD700]">
                                    <span className="text-[#FFD700] font-bold">
                                        [{archetype.role.toUpperCase()}]
                                    </span>
                                    <span className="text-gray-400 mx-2">•</span>
                                    <span className="text-yellow-400 font-bold">
                                        [{archetype.rarity.toUpperCase()}]
                                    </span>
                                </div>

                                {/* Stats - Terminal Style */}
                                <div className="mb-4">
                                    <pre className="text-neon-green mb-3 text-center text-xs md:text-sm text-glow-green">
                                        {`┌───────────────────────────┐
│  ${t.characterSelect.baseStats.toUpperCase()}  │
└───────────────────────────┘`}
                                    </pre>
                                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                                        <div className="text-center bg-black p-2 md:p-3 border-2 border-red-400">
                                            <div className="text-red-400 font-bbs font-bold text-xs md:text-sm">
                                                [STR]
                                            </div>
                                            <div className="text-lg md:text-2xl font-bold text-[#FFD700] mt-1">
                                                {5 + archetype.statBonuses.strength}
                                            </div>
                                            <div className="text-xs text-gray-500 font-bbs">+{archetype.statBonuses.strength}</div>
                                        </div>
                                        <div className="text-center bg-black p-2 md:p-3 border-2 border-blue-400">
                                            <div className="text-blue-400 font-bbs font-bold text-xs md:text-sm">
                                                [DEF]
                                            </div>
                                            <div className="text-lg md:text-2xl font-bold text-[#FFD700] mt-1">
                                                {5 + archetype.statBonuses.defense}
                                            </div>
                                            <div className="text-xs text-gray-500 font-bbs">+{archetype.statBonuses.defense}</div>
                                        </div>
                                        <div className="text-center bg-black p-2 md:p-3 border-2 border-pink-400">
                                            <div className="text-pink-400 font-bbs font-bold text-xs md:text-sm">
                                                [CHM]
                                            </div>
                                            <div className="text-lg md:text-2xl font-bold text-[#FFD700] mt-1">
                                                {5 + archetype.statBonuses.charm}
                                            </div>
                                            <div className="text-xs text-gray-500 font-bbs">+{archetype.statBonuses.charm}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Skills - Terminal Style */}
                                <div className="mb-4">
                                    <pre className="text-neon-blue mb-3 text-center text-xs md:text-sm text-glow-blue">
                                        {`┌───────────────────────────┐
│  ${t.characterSelect.skills.toUpperCase()}  │
└───────────────────────────┘`}
                                    </pre>
                                    <div className="space-y-1 md:space-y-2 max-h-32 md:max-h-40 overflow-y-auto">
                                        {archetype.skills.map((skill, i) => {
                                            const translatedSkill = t.archetypes[archetype.name as keyof typeof t.archetypes]?.skills?.[skill.id];
                                            return (
                                                <div key={i} className="flex items-center gap-2 bg-black p-2 border-2 border-neon-blue">
                                                    <span className="text-sm md:text-base">{skill.emoji}</span>
                                                    <div className="text-xs md:text-sm text-gray-300 font-bbs">
                                                        <span className="font-bold text-neon-blue">[{translatedSkill?.name || skill.name}]:</span> {translatedSkill?.description || skill.description}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Perks - Terminal Style */}
                                <div className="mb-4">
                                    <pre className="text-purple-400 mb-3 text-center text-xs md:text-sm">
                                        {`┌───────────────────────────┐
│  ${t.characterSelect.perks.toUpperCase()}  │
└───────────────────────────┘`}
                                    </pre>
                                    <div className="space-y-1 md:space-y-2 max-h-24 md:max-h-32 overflow-y-auto">
                                        {archetype.perks.map((perk, i) => {
                                            // Convert perk name to snake_case for translation key lookup
                                            const perkKey = perk.name.toLowerCase().replace(/\s+/g, '_');
                                            const translatedPerk = t.archetypes[archetype.name as keyof typeof t.archetypes]?.perks?.[perkKey];
                                            return (
                                                <div key={i} className="flex items-center gap-2 bg-black p-2 border-2 border-purple-400">
                                                    <span className="text-sm md:text-base">{perk.emoji}</span>
                                                    <div className="text-xs md:text-sm text-gray-300 font-bbs">
                                                        <span className="font-bold text-purple-400">[{translatedPerk?.name || perk.name}]:</span> {translatedPerk?.description || perk.description}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Progress Indicators */}
                    <div className="flex justify-center mt-4 md:mt-6 space-x-2">
                        {archetypeList.map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    scale: selectedArchetype === i ? 1.2 : 1,
                                    backgroundColor: selectedArchetype === i ? '#FFD700' : '#374151'
                                }}
                                className="w-2 md:w-3 h-2 md:h-3 border-2 border-[#FFD700] cursor-pointer"
                                style={{ backgroundColor: selectedArchetype === i ? '#FFD700' : '#000' }}
                                onClick={() => handleDotClick(i)}
                            />
                        ))}
                    </div>
                </div>

                {/* Custom Name and Mint Section */}
                <div className="mt-6 md:mt-8 space-y-4">
                    {/* Custom Name (optional) */}
                    <div className="bg-black border-2 border-[#FFD700] p-4">
                        <label className="block text-sm text-[#FFD700] mb-2 font-bbs">
                            [{t.characterSelect.customName.toUpperCase()}]
                        </label>
                        <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder={t.characterSelect.leaveBlank}
                            maxLength={20}
                            className="w-full px-4 py-2 bg-black border-2 border-gray-600 text-white focus:border-[#FFD700] focus:outline-none font-bbs"
                        />
                    </div>

                    {/* Telegram Username (optional) */}
                    <div className="bg-black border-2 border-neon-blue p-4">
                        <label className="block text-sm text-neon-blue mb-2 font-bbs">
                            [💬 TELEGRAM USERNAME (OPTIONAL)]
                        </label>
                        <input
                            type="text"
                            value={telegramUsername}
                            onChange={(e) => setTelegramUsername(e.target.value)}
                            placeholder="@YourUsername or YourUsername"
                            maxLength={32}
                            className="w-full px-4 py-2 bg-black border-2 border-gray-600 text-white focus:border-neon-blue focus:outline-none font-bbs"
                        />
                        <p className="text-xs text-gray-500 mt-1 font-bbs">
                            We'll tag you in Telegram when your character is minted! 🎉
                        </p>
                    </div>

                    {/* X Username (optional) */}
                    <div className="bg-black border-2 border-neon-blue p-4">
                        <label className="block text-sm text-neon-blue mb-2 font-bbs">
                            [🐦 X (TWITTER) USERNAME (OPTIONAL)]
                        </label>
                        <input
                            type="text"
                            value={xUsername}
                            onChange={(e) => setXUsername(e.target.value)}
                            placeholder="@YourHandle or YourHandle"
                            maxLength={15}
                            className="w-full px-4 py-2 bg-black border-2 border-gray-600 text-white focus:border-neon-blue focus:outline-none font-bbs"
                        />
                        <p className="text-xs text-gray-500 mt-1 font-bbs">
                            Connect your X account for future features and giveaways!
                        </p>
                    </div>

                    {/* Mint Price - Terminal Style - Display Only (Not a Button) */}
                    <div className="text-center bg-black border-2 border-gray-600 p-4 md:p-6 pointer-events-none">
                        <div className="text-xs text-gray-500 font-bbs mb-1">[{t.characterSelect.mintPrice.toUpperCase()}]</div>
                        <div className="text-xl md:text-3xl font-bold text-[#FFD700] font-bbs text-glow-gold">
                            {mintPrice} BNB
                        </div>
                        <div className="text-xs text-gray-500 font-bbs mt-1">INFO ONLY • USE BUTTON BELOW TO MINT</div>
                    </div>

                    {/* Message */}
                    {(message || (!account || !signer)) && (
                        <div className={`text-center p-3 border-2 mb-4 ${
                            !account || !signer
                                ? 'bg-black border-yellow-500 text-yellow-400'
                                : message.includes('SUCCESS') || message.includes('✅')
                                    ? 'bg-black border-neon-green text-neon-green'
                                    : message.includes('❌')
                                        ? 'bg-black border-red-500 text-red-400'
                                        : 'bg-black border-neon-blue text-neon-blue'
                            }`}>
                            <div className="text-sm font-bbs">
                                {!account || !signer
                                    ? '⚠️ Please connect your wallet using the button in the header to mint your character NFT'
                                    : message
                                }
                            </div>
                        </div>
                    )}

                    {/* Action Buttons - Terminal Style */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={onCancel}
                            disabled={minting}
                            className="flex-1 bg-black text-white font-bold py-3 md:py-4 px-6 transition-all border-2 border-gray-500 hover:border-gray-400 hover:bg-black font-bbs"
                        >
                            ← [{t.characterSelect.back.toUpperCase()}]
                        </button>
                        <motion.button
                            onClick={() => {
if (!account || !signer || minting) {
                                    console.warn('Button is disabled - should not fire');
                                    return;
                                }
                                handleMint();
                            }}
                            disabled={minting || !account || !signer}
                            className={`flex-1 font-bold py-3 md:py-4 px-6 border-2 transition-all font-bbs ${
                                (minting || !account || !signer)
                                    ? 'bg-black text-gray-500 border-gray-600 cursor-not-allowed opacity-60'
                                    : 'bg-black text-neon-green border-neon-green hover:bg-neon-green/20 hover:border-neon-green hover:shadow-lg hover:shadow-neon-green/50 cursor-pointer'
                            }`}
                            whileHover={(minting || !account || !signer) ? {} : { scale: 1.02 }}
                            whileTap={(minting || !account || !signer) ? {} : { scale: 0.98 }}
                            style={{ position: 'relative', zIndex: 10 }}
                        >
                            <span className="relative z-10">
                                {!account || !signer
                                    ? '🔌 CONNECT WALLET FIRST'
                                    : minting
                                        ? `⏳ ${t.characterSelect.minting.toUpperCase()}`
                                        : `🦎 ${t.characterSelect.mintNFT.toUpperCase()} (${mintPrice} BNB)`
                                }
                            </span>
                        </motion.button>
                    </div>
                </div>

                {/* Controls - Terminal Style */}
                <div className="mt-6 md:mt-8 text-center">
                    <div className="bg-black border-2 border-[#FFD700] p-3 md:p-4 inline-block">
                        <div className="text-[#FFD700] text-xs md:text-sm font-bbs font-bold mb-2 text-glow-gold">
                            [ {t.characterSelect.controls.toUpperCase()} ]
                        </div>
                        <div className="text-gray-300 text-xs font-bbs space-y-1">
                            <div>
                                ◀ ▶ : {t.characterSelect.spinArchetype}
                            </div>
                            <div>
                                🦎 MINT : {t.characterSelect.createYourCharacter}
                            </div>
                            <div className="text-neon-green">
                                {t.characterSelect.autoAdvances} {!autoScrollEnabled && '(DISABLED)'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Terminal Font */}
                <div className="mt-4 md:mt-6 text-center text-xs text-gray-600 font-bbs">
                    🦎 CRIME LIZARD GAMES • BLOCKCHAIN EDITION • CHARACTER CREATION • {new Date().getFullYear()} 🦎
                </div>
            </motion.div>
        </div>
    );
};

export default CharacterCreation;
