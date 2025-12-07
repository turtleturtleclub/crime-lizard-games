import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WalletContext } from '../../providers/WalletContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ethers } from 'ethers';
import { ARCHETYPES } from '../../types/archetype.types';
import { CHARACTER_CONTRACT_ABI } from '../../characterAbi';
import { getContractAddress } from '../../config/contracts';

interface CharacterCreationProps {
    onCharacterCreated: (tokenId: number) => void;
    onCancel: () => void;
}

const CharacterCreationV2: React.FC<CharacterCreationProps> = ({ onCharacterCreated, onCancel }) => {
    const { account, signer, currentChainId } = useContext(WalletContext);
    const { t } = useLanguage(); // Translation system ready for internationalization
    const [selectedArchetype, setSelectedArchetype] = useState(0);
    const [customName, setCustomName] = useState('');
    const [generatedName, setGeneratedName] = useState('');
    const [isGeneratingName, setIsGeneratingName] = useState(false);
    const [telegramUsername, setTelegramUsername] = useState('');
    const [xUsername, setXUsername] = useState('');
    const [minting, setMinting] = useState(false);
    const [message, setMessage] = useState('');

    // AI Customizations
    const [hatColor, setHatColor] = useState('red');
    const [accessory, setAccessory] = useState('sword');
    const [backgroundTheme, setBackgroundTheme] = useState('dark forest');
    const [expression, setExpression] = useState('confident');
    const [pose, setPose] = useState('standing');

    const archetypeList = Object.values(ARCHETYPES);
    const archetype = archetypeList[selectedArchetype];
    const mintPrice = archetype.mintPrice;

    // Generate AI name for character and fill the input field
    const generateCharacterName = async (archetypeName: string, forceUpdate: boolean = false) => {
        setIsGeneratingName(true);
        try {
            const response = await fetch('/api/legend/generate-character-name', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archetype: archetypeName })
            });

            if (response.ok) {
                const data = await response.json();
                setGeneratedName(data.name);
                // Fill the input field if it's empty, matches previous AI name, or forceUpdate is true
                if (forceUpdate || !customName || customName === generatedName) {
                    setCustomName(data.name);
                }
            } else {
                console.error('Failed to generate name');
            }
        } catch (error) {
            console.error('Error generating name:', error);
        } finally {
            setIsGeneratingName(false);
        }
    };

    const nextArchetype = () => {
        setSelectedArchetype((prev) => (prev + 1) % archetypeList.length);
    };

    const prevArchetype = () => {
        setSelectedArchetype((prev) => (prev - 1 + archetypeList.length) % archetypeList.length);
    };

    // Auto-generate name when archetype changes
    useEffect(() => {
        generateCharacterName(archetype.name);
    }, [selectedArchetype, archetype.name]);

    const handleMint = async () => {
        if (!account || !signer) {
            setMessage('❌ Please connect your wallet first!');
            return;
        }

        // Ensure we have a name (either custom or AI-generated)
        const characterName = customName.trim() || generatedName;
        if (!characterName) {
            setMessage('⏳ Generating character name... Please wait and try again.');
            generateCharacterName(archetype.name);
            return;
        }

        // ✅ FIX: Prevent double-click
        if (minting) {
            console.warn('Mint already in progress, ignoring duplicate click');
            return;
        }

        setMinting(true);
        setMessage('🎨 Minting your AI-generated character NFT...');

        try {
            // IMPORTANT: Always use mainnet (56) for minting - testnet is dev only
            const mintChainId = 56; // Force mainnet
            const contractAddress = getContractAddress(mintChainId, 'character');

            if (!contractAddress) {
                setMessage('❌ Character contract not configured');
                setMinting(false);
                return;
            }

            // Verify user is on the correct network before proceeding
            if (currentChainId !== 56) {
                setMessage('⚠️ Please switch to BNB Mainnet to mint. Current network: ' + (currentChainId || 'unknown'));
                setMinting(false);
                return;
            }

            const contract = new ethers.Contract(contractAddress, CHARACTER_CONTRACT_ABI, signer);

            // Use custom name if provided, otherwise use AI-generated name
            const finalName = customName.trim() || generatedName || "";

            const tx = await contract.mintCharacter(
                archetype.id,
                finalName,
                { value: ethers.parseEther(mintPrice) }
            );

            setMessage('⏳ Waiting for blockchain confirmation...');
            const receipt = await tx.wait();

            // Parse CharacterMinted event or fallback to Transfer event
            let tokenId: number | null = null;

            // First, try to find CharacterMinted event
            for (const log of receipt.logs) {
                try {
                    const parsed = contract.interface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });
                    if (parsed && parsed.name === 'CharacterMinted') {
                        tokenId = Number(parsed.args.tokenId);
                        break;
                    }
                } catch {
                    // Not a matching event, continue
                }
            }

            // Fallback: Try to find ERC721 Transfer event (from address(0) = mint)
            if (!tokenId) {
                for (const log of receipt.logs) {
                    // ERC721 Transfer has 4 topics: signature, from, to, tokenId
                    if (log.topics.length === 4) {
                        const fromAddress = '0x' + log.topics[1].slice(26);
                        // Check if it's a mint (from zero address)
                        if (fromAddress === '0x0000000000000000000000000000000000000000') {
                            tokenId = Number(BigInt(log.topics[3]));
                            break;
                        }
                    }
                }
            }

            if (!tokenId || tokenId <= 0) {
                console.error('❌ Could not find tokenId in logs:', receipt.logs);
                throw new Error('Failed to get token ID from mint transaction. Please check the transaction on BSCScan.');
            }

            setMessage('🎨 Generating your unique AI artwork...');

            // Call backend with AI customizations (with 5 minute timeout for AI generation + blockchain txs)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

            try {
                const response = await fetch('/api/legend/mint-character', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        walletAddress: account,
                        archetype: archetype.id,
                        archetypeName: archetype.name,
                        customName: customName || generatedName || null,
                        telegramUsername: telegramUsername || null,
                        xUsername: xUsername || null,
                        transactionHash: tx.hash,
                        tokenId,
                        customizations: {
                            hatColor,
                            accessory,
                            backgroundTheme,
                            expression,
                            pose
                        }
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    setMessage(`✅ SUCCESS! Character #${tokenId} minted with AI artwork! 🎉🎨`);
                    setTimeout(() => {
                        onCharacterCreated(tokenId);
                    }, 2000);
                } else {
                    setMessage('❌ Failed to generate AI artwork. Contact support.');
                }
            } catch (fetchError: unknown) {
                clearTimeout(timeoutId);
                if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                    setMessage('❌ AI artwork generation timed out. Please try again.');
                } else {
                    setMessage('❌ Failed to generate AI artwork. Contact support.');
                }
            }
        } catch (error: unknown) {
            console.error('Mint error:', error);
            setMessage(`❌ Minting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setMinting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-bbs">
            {/* Green/Gold Terminal Glow Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-[#00FF88]/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
                <div className="absolute w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
                <div className="absolute w-96 h-96 bg-[#00FF88]/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-2000"></div>
            </div>

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-5"></div>

            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-7xl w-full relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.h1
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl md:text-6xl font-bold text-[#FFD700] mb-3 text-glow-gold font-bbs"
                    >
                        &gt; {t.characterEntry.forgeYourLegend}
                    </motion.h1>
                    <motion.p
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg md:text-xl text-[#00FF88] font-bbs"
                    >
                        {t.characterEntry.aiGeneratedNFTs}
                    </motion.p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Character Showcase */}
                    <div className="lg:col-span-2">
                        <motion.div
                            key={selectedArchetype}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="relative bg-black border-2 border-[#00FF88] p-8"
                            style={{
                                boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)'
                            }}
                        >
                            {/* Character Image */}
                            <div className="relative mb-6">
                                <img
                                    src={`/base-images/base-${archetype.id}-${archetype.name}.png?v=3.0`}
                                    alt={archetype.displayName}
                                    className="w-full h-auto border-4 border-[#FFD700]"
                                    style={{
                                        imageRendering: 'pixelated',
                                        filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.5))'
                                    }}
                                    onError={(e) => {
                                        // Fallback to emoji if image doesn't load
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />

                                {/* Rarity Badge */}
                                <div className="absolute top-4 right-4">
                                    <div className={`px-4 py-2 font-bold text-sm border-2 bg-black ${
                                        archetype.rarity === 'legendary' ? 'border-[#FFD700] text-[#FFD700] text-glow-gold' :
                                        archetype.rarity === 'epic' ? 'border-[#FFD700] text-[#FFD700] text-glow-gold' :
                                        archetype.rarity === 'rare' ? 'border-[#00FF88] text-[#00FF88] text-glow-green' :
                                        archetype.rarity === 'uncommon' ? 'border-[#00FF88] text-[#00FF88] text-glow-green' :
                                        'border-[#00FF88] text-[#00FF88]'
                                    }`}>
                                        [{archetype.rarity.toUpperCase()}]
                                    </div>
                                </div>

                                {/* Role Badge */}
                                <div className="absolute top-4 left-4">
                                    <div className="px-4 py-2 font-bold text-sm bg-black border-2 border-[#00FF88] text-[#00FF88] text-glow-green">
                                        [{t.characterEntry[archetype.role as keyof typeof t.characterEntry] || archetype.role.toUpperCase()}]
                                    </div>
                                </div>
                            </div>

                            {/* Character Info */}
                            <div className="space-y-4">
                                <div className="text-center">
                                    <h2 className="text-3xl md:text-4xl font-bold text-[#FFD700] mb-2 text-glow-gold font-bbs">
                                        {archetype.emoji} {t.archetypes[archetype.name as keyof typeof t.archetypes]?.displayName || archetype.displayName}
                                    </h2>
                                    <p className="text-[#00FF88]/80 font-bbs">&gt; {t.characterEntry[`${archetype.name}Desc` as keyof typeof t.characterEntry] || archetype.description}</p>
                                </div>

                                <div className="bg-black border-2 border-[#00FF88] p-4">
                                    <p className="text-[#00FF88] leading-relaxed font-bbs">{t.archetypes[archetype.name as keyof typeof t.archetypes]?.lore || archetype.lore}</p>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-black border-2 border-[#FFD700] p-3 text-center">
                                        <div className="text-[#FFD700] font-bold text-sm text-glow-gold">💪 {t.characterEntry.str}</div>
                                        <div className="text-2xl font-bold text-[#00FF88] text-glow-green">{5 + archetype.statBonuses.strength}</div>
                                    </div>
                                    <div className="bg-black border-2 border-[#00FF88] p-3 text-center">
                                        <div className="text-[#00FF88] font-bold text-sm text-glow-green">🛡️ {t.characterEntry.def}</div>
                                        <div className="text-2xl font-bold text-[#00FF88] text-glow-green">{5 + archetype.statBonuses.defense}</div>
                                    </div>
                                    <div className="bg-black border-2 border-[#FFD700] p-3 text-center">
                                        <div className="text-[#FFD700] font-bold text-sm text-glow-gold">✨ {t.characterEntry.chm}</div>
                                        <div className="text-2xl font-bold text-[#00FF88] text-glow-green">{5 + archetype.statBonuses.charm}</div>
                                    </div>
                                </div>

                                {/* Navigation */}
                                <div className="flex items-center justify-between pt-4">
                                    <button
                                        onClick={prevArchetype}
                                        disabled={minting}
                                        className="px-6 py-3 bg-black border-2 border-[#00FF88] hover:bg-[#00FF88]/10 font-bold text-[#00FF88] text-glow-green disabled:opacity-50 transition-all font-bbs"
                                    >
                                        {t.characterEntry.prev}
                                    </button>
                                    <div className="text-[#FFD700] font-bold text-glow-gold font-bbs">
                                        {selectedArchetype + 1} / {archetypeList.length}
                                    </div>
                                    <button
                                        onClick={nextArchetype}
                                        disabled={minting}
                                        className="px-6 py-3 bg-black border-2 border-[#00FF88] hover:bg-[#00FF88]/10 font-bold text-[#00FF88] text-glow-green disabled:opacity-50 transition-all font-bbs"
                                    >
                                        {t.characterEntry.next}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Customization Panel */}
                    <div className="space-y-6">
                        {/* AI Customization */}
                        <div className="bg-black border-2 border-[#FFD700] p-6">
                            <h3 className="text-xl font-bold text-[#FFD700] mb-4 flex items-center gap-2 text-glow-gold font-bbs">
                                🎨 {t.characterEntry.aiCustomization}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-[#00FF88] mb-2 font-bbs">{t.characterEntry.hatColor}</label>
                                    <select
                                        value={hatColor}
                                        onChange={(e) => setHatColor(e.target.value)}
                                        className="w-full px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] focus:border-[#FFD700] focus:outline-none font-bbs"
                                    >
                                        <option value="red">🔴 Red</option>
                                        <option value="blue">🔵 Blue</option>
                                        <option value="green">🟢 Green</option>
                                        <option value="purple">🟣 Purple</option>
                                        <option value="gold">🟡 Gold</option>
                                        <option value="silver">⚪ Silver</option>
                                        <option value="black">⚫ Black</option>
                                        <option value="white">⚪ White</option>
                                        <option value="orange">🟠 Orange</option>
                                        <option value="pink">🩷 Pink</option>
                                        <option value="cyan">🔷 Cyan</option>
                                        <option value="crimson">🔴 Crimson</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-[#00FF88] mb-2 font-bbs">{t.characterEntry.accessory}</label>
                                    <select
                                        value={accessory}
                                        onChange={(e) => setAccessory(e.target.value)}
                                        className="w-full px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] focus:border-[#FFD700] focus:outline-none font-bbs"
                                    >
                                        <option value="sword">⚔️ Sword</option>
                                        <option value="shield">🛡️ Shield</option>
                                        <option value="bag">💰 Bag of Gold</option>
                                        <option value="staff">🪄 Magic Staff</option>
                                        <option value="bow">🏹 Bow</option>
                                        <option value="dagger">🗡️ Dagger</option>
                                        <option value="potion">🧪 Potion</option>
                                        <option value="book">📖 Spell Book</option>
                                        <option value="crown">👑 Crown</option>
                                        <option value="chain">⛓️ Chain</option>
                                        <option value="axe">🪓 Axe</option>
                                        <option value="crossbow">🎯 Crossbow</option>
                                        <option value="orb">🔮 Crystal Orb</option>
                                        <option value="none">❌ None</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-[#00FF88] mb-2 font-bbs">{t.characterEntry.background}</label>
                                    <select
                                        value={backgroundTheme}
                                        onChange={(e) => setBackgroundTheme(e.target.value)}
                                        className="w-full px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] focus:border-[#FFD700] focus:outline-none font-bbs"
                                    >
                                        <option value="dark forest">🌲 Dark Forest</option>
                                        <option value="night city">🌃 Night City</option>
                                        <option value="cave">🗿 Cave</option>
                                        <option value="castle">🏰 Castle</option>
                                        <option value="volcano">🌋 Volcano</option>
                                        <option value="desert">🏜️ Desert</option>
                                        <option value="ice cave">❄️ Ice Cave</option>
                                        <option value="graveyard">🪦 Graveyard</option>
                                        <option value="throne room">👑 Throne Room</option>
                                        <option value="forest clearing">🌳 Forest Clearing</option>
                                        <option value="dungeon">⛓️ Dungeon</option>
                                        <option value="tavern">🍺 Tavern</option>
                                        <option value="mountain peak">⛰️ Mountain Peak</option>
                                        <option value="swamp">🐊 Swamp</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-[#00FF88] mb-2 font-bbs">{t.characterEntry.expression}</label>
                                    <select
                                        value={expression}
                                        onChange={(e) => setExpression(e.target.value)}
                                        className="w-full px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] focus:border-[#FFD700] focus:outline-none font-bbs"
                                    >
                                        <option value="confident">😎 Confident</option>
                                        <option value="menacing">😈 Menacing</option>
                                        <option value="cheerful">😄 Cheerful</option>
                                        <option value="mysterious">🤫 Mysterious</option>
                                        <option value="angry">😠 Angry</option>
                                        <option value="focused">🎯 Focused</option>
                                        <option value="playful">😜 Playful</option>
                                        <option value="sinister">👿 Sinister</option>
                                        <option value="noble">🦁 Noble</option>
                                        <option value="cunning">🦊 Cunning</option>
                                        <option value="wise">🦉 Wise</option>
                                        <option value="battle-hardened">⚔️ Battle-Hardened</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-[#00FF88] mb-2 font-bbs">{t.characterEntry.pose}</label>
                                    <select
                                        value={pose}
                                        onChange={(e) => setPose(e.target.value)}
                                        className="w-full px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] focus:border-[#FFD700] focus:outline-none font-bbs"
                                    >
                                        <option value="standing">🧍 Standing</option>
                                        <option value="battle-ready">⚔️ Battle-Ready</option>
                                        <option value="casting">🪄 Casting Spell</option>
                                        <option value="sneaking">🥷 Sneaking</option>
                                        <option value="commanding">👑 Commanding</option>
                                        <option value="resting">😌 Resting</option>
                                        <option value="victorious">🏆 Victorious</option>
                                        <option value="meditative">🧘 Meditative</option>
                                        <option value="running">🏃 Running</option>
                                        <option value="defensive">🛡️ Defensive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Name & Social */}
                        <div className="bg-black border-2 border-[#00FF88] p-6">
                            <h3 className="text-xl font-bold text-[#00FF88] mb-4 text-glow-green font-bbs">📝 {t.characterEntry.characterDetails}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-[#00FF88]/80 mb-2 font-bbs">
                                        {t.characterEntry.name} {isGeneratingName && t.characterEntry.generating}:
                                    </label>
                                    <input
                                        type="text"
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        placeholder={generatedName || "Enter custom name..."}
                                        maxLength={20}
                                        className="w-full px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] focus:border-[#FFD700] focus:outline-none font-bbs placeholder-[#00FF88]/40"
                                    />
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-xs text-[#00FF88]/60 font-bbs">
                                            {customName && customName === generatedName ? t.characterEntry.aiGenerated : customName ? t.characterEntry.customName : ''}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => generateCharacterName(archetype.name, true)}
                                            disabled={isGeneratingName || minting}
                                            className="text-xs text-[#FFD700] hover:text-[#FFD700]/80 disabled:opacity-50 font-bbs"
                                        >
                                            {isGeneratingName ? '⏳' : t.characterEntry.newName}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-[#00FF88]/80 mb-2 font-bbs">{t.characterEntry.telegramOptional}</label>
                                    <input
                                        type="text"
                                        value={telegramUsername}
                                        onChange={(e) => setTelegramUsername(e.target.value)}
                                        placeholder="@username"
                                        maxLength={32}
                                        className="w-full px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] focus:border-[#FFD700] focus:outline-none font-bbs placeholder-[#00FF88]/40"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-[#00FF88]/80 mb-2 font-bbs">{t.characterEntry.xOptional}</label>
                                    <input
                                        type="text"
                                        value={xUsername}
                                        onChange={(e) => setXUsername(e.target.value)}
                                        placeholder="@handle"
                                        maxLength={15}
                                        className="w-full px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] focus:border-[#FFD700] focus:outline-none font-bbs placeholder-[#00FF88]/40"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="bg-black border-2 border-[#FFD700] p-6 text-center">
                            <div className="text-sm text-[#FFD700]/80 mb-1 font-bbs">{t.characterEntry.mintPrice}</div>
                            <div className="text-4xl font-bold text-[#FFD700] text-glow-gold font-bbs">{mintPrice} BNB</div>
                        </div>

                        {/* Mint Button */}
                        <motion.button
                            onClick={handleMint}
                            disabled={minting || !account || !signer}
                            whileHover={{ scale: minting ? 1 : 1.02 }}
                            whileTap={{ scale: minting ? 1 : 0.98 }}
                            className={`w-full py-4 font-bold text-lg transition-all font-bbs ${
                                minting || !account || !signer
                                    ? 'bg-black border-2 border-[#00FF88]/30 text-[#00FF88]/30 cursor-not-allowed'
                                    : 'bg-black border-4 border-[#00FF88] hover:bg-[#00FF88]/10 text-[#00FF88] text-glow-green'
                            }`}
                            style={{
                                boxShadow: minting || !account || !signer ? 'none' : '0 0 20px rgba(0, 255, 136, 0.3)'
                            }}
                        >
                            {!account || !signer ? t.characterEntry.connectWallet : minting ? t.characterEntry.minting : t.characterEntry.mintAICharacter}
                        </motion.button>

                        {/* Message */}
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 border-2 text-center font-bbs ${
                                    message.includes('SUCCESS') ? 'bg-black border-[#00FF88] text-[#00FF88] text-glow-green' :
                                    message.includes('failed') || message.includes('❌') ? 'bg-black border-red-500 text-red-500' :
                                    'bg-black border-[#FFD700] text-[#FFD700] text-glow-gold'
                                }`}
                            >
                                {message}
                            </motion.div>
                        )}

                        {/* Back Button */}
                        <button
                            onClick={onCancel}
                            disabled={minting}
                            className="w-full py-3 bg-black hover:bg-[#00FF88]/10 border-2 border-[#00FF88] font-bold text-[#00FF88] text-glow-green disabled:opacity-50 transition-all font-bbs"
                        >
                            [&lt; {t.common.back.toUpperCase()}]
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-[#00FF88]/60 font-bbs">
                    <pre className="text-xs">
{`════════════════════════════════════════════════════
🦎 Crime Lizard • AI NFTs • Powered by Crayons 🖍️ • ${new Date().getFullYear()}
════════════════════════════════════════════════════`}
                    </pre>
                </div>
            </motion.div>
        </div>
    );
};

export default CharacterCreationV2;
