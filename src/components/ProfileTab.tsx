import { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletContext } from '../providers/WalletContext';
import { useCharacter } from '../contexts/CharacterContext';
import { useLegendGame } from '../contexts/LegendGameContext';
import { toast } from 'react-toastify';
import { useModalClose } from '../hooks/useModalClose';

interface UserProfile {
    walletAddress: string;
    username: string;
    telegramUsername: string;
    twitterUsername: string;
    lastUpdated?: Date;
}

interface CharacterGameData {
    tokenId: number;
    health: number;
    maxHealth: number;
    mana?: number;
    maxMana?: number;
    location: string;
    isDead?: boolean;
    isOnline?: boolean;
    level: number;
    experience?: number;
    experienceToNextLevel?: number;
    archetype?: number;
}

// Archetypes that use mana/magic
const MANA_USING_ARCHETYPES = [3, 6, 7]; // Mage, Necromancer, Paladin

// Profile save cost in GOLD
const PROFILE_SAVE_COST = 100;

// Character customization cost in GOLD
const CUSTOMIZATION_COST = 100;

// Customization options (same as CharacterCreationV2)
const HAT_COLOR_OPTIONS = [
    { value: 'red', label: '🔴 Red' },
    { value: 'blue', label: '🔵 Blue' },
    { value: 'green', label: '🟢 Green' },
    { value: 'purple', label: '🟣 Purple' },
    { value: 'gold', label: '🟡 Gold' },
    { value: 'silver', label: '⚪ Silver' },
    { value: 'black', label: '⚫ Black' },
    { value: 'white', label: '⚪ White' },
    { value: 'orange', label: '🟠 Orange' },
    { value: 'pink', label: '🩷 Pink' },
    { value: 'cyan', label: '🔷 Cyan' },
    { value: 'crimson', label: '🔴 Crimson' }
];

const ACCESSORY_OPTIONS = [
    { value: 'sword', label: '⚔️ Sword' },
    { value: 'shield', label: '🛡️ Shield' },
    { value: 'bag', label: '💰 Bag of Gold' },
    { value: 'staff', label: '🪄 Magic Staff' },
    { value: 'bow', label: '🏹 Bow' },
    { value: 'dagger', label: '🗡️ Dagger' },
    { value: 'potion', label: '🧪 Potion' },
    { value: 'book', label: '📖 Spell Book' },
    { value: 'crown', label: '👑 Crown' },
    { value: 'chain', label: '⛓️ Chain' },
    { value: 'axe', label: '🪓 Axe' },
    { value: 'crossbow', label: '🎯 Crossbow' },
    { value: 'orb', label: '🔮 Crystal Orb' },
    { value: 'none', label: '❌ None' }
];

const BACKGROUND_OPTIONS = [
    { value: 'dark forest', label: '🌲 Dark Forest' },
    { value: 'night city', label: '🌃 Night City' },
    { value: 'cave', label: '🗿 Cave' },
    { value: 'castle', label: '🏰 Castle' },
    { value: 'volcano', label: '🌋 Volcano' },
    { value: 'desert', label: '🏜️ Desert' },
    { value: 'ice cave', label: '❄️ Ice Cave' },
    { value: 'graveyard', label: '🪦 Graveyard' },
    { value: 'throne room', label: '👑 Throne Room' },
    { value: 'forest clearing', label: '🌳 Forest Clearing' },
    { value: 'dungeon', label: '⛓️ Dungeon' },
    { value: 'tavern', label: '🍺 Tavern' },
    { value: 'mountain peak', label: '⛰️ Mountain Peak' },
    { value: 'swamp', label: '🐊 Swamp' }
];

const EXPRESSION_OPTIONS = [
    { value: 'confident', label: '😎 Confident' },
    { value: 'menacing', label: '😈 Menacing' },
    { value: 'cheerful', label: '😄 Cheerful' },
    { value: 'mysterious', label: '🤫 Mysterious' },
    { value: 'angry', label: '😠 Angry' },
    { value: 'focused', label: '🎯 Focused' },
    { value: 'playful', label: '😜 Playful' },
    { value: 'sinister', label: '👿 Sinister' },
    { value: 'noble', label: '🦁 Noble' },
    { value: 'cunning', label: '🦊 Cunning' },
    { value: 'wise', label: '🦉 Wise' },
    { value: 'battle-hardened', label: '⚔️ Battle-Hardened' }
];

const POSE_OPTIONS = [
    { value: 'standing', label: '🧍 Standing' },
    { value: 'battle-ready', label: '⚔️ Battle-Ready' },
    { value: 'casting', label: '🪄 Casting Spell' },
    { value: 'sneaking', label: '🥷 Sneaking' },
    { value: 'commanding', label: '👑 Commanding' },
    { value: 'resting', label: '😌 Resting' },
    { value: 'victorious', label: '🏆 Victorious' },
    { value: 'meditative', label: '🧘 Meditative' },
    { value: 'running', label: '🏃 Running' },
    { value: 'defensive', label: '🛡️ Defensive' }
];

export const ProfileTab = () => {
    const { account, provider } = useContext(WalletContext);
    const { userCharacters, selectedCharacter, selectCharacter, goldContract, refreshCharacters } = useCharacter();
    const { showCharacterCreation } = useLegendGame();
    const [profile, setProfile] = useState<UserProfile>({
        walletAddress: account || '',
        username: '',
        telegramUsername: '',
        twitterUsername: ''
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [characterGameData, setCharacterGameData] = useState<Map<string, CharacterGameData>>(new Map());
    const [expandedCharacter, setExpandedCharacter] = useState<string | null>(null);
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

    // Customization modal state
    const [showCustomizeModal, setShowCustomizeModal] = useState(false);
    const [customizingCharacter, setCustomizingCharacter] = useState<any | null>(null);
    const [isCustomizing, setIsCustomizing] = useState(false);

    // Customization form state
    const [hatColor, setHatColor] = useState('red');
    const [accessory, setAccessory] = useState('sword');
    const [backgroundTheme, setBackgroundTheme] = useState('dark forest');
    const [expression, setExpression] = useState('confident');
    const [pose, setPose] = useState('standing');

    // Close handlers for modals
    const closeEnlargedImage = useCallback(() => setEnlargedImage(null), []);
    const closeCustomizeModal = useCallback(() => {
        setShowCustomizeModal(false);
        setCustomizingCharacter(null);
    }, []);

    useModalClose(closeEnlargedImage, enlargedImage !== null);
    useModalClose(closeCustomizeModal, showCustomizeModal);

    // Load existing profile
    useEffect(() => {
        if (account) {
            loadProfile();
            loadCharacterGameData();
        }
    }, [account, userCharacters]);

    const handleCreateCharacter = () => {
showCharacterCreation();
    };

    const loadProfile = async () => {
        if (!account) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/profile/${account}`);
            if (response.ok) {
                const data = await response.json();
                setProfile({
                    walletAddress: account,
                    username: data.username || '',
                    telegramUsername: data.telegramUsername || '',
                    twitterUsername: data.twitterUsername || ''
                });
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load game data for all characters (health, location, status, XP, etc.)
    const loadCharacterGameData = async () => {
        if (!account || userCharacters.length === 0) return;

        try {
            const gameDataMap = new Map<string, CharacterGameData>();

            for (const char of userCharacters) {
                try {
                    const response = await fetch(`/api/legend/player/${account}/${char.tokenId.toString()}`);
                    if (response.ok) {
                        const gameData = await response.json();
                        gameDataMap.set(char.tokenId.toString(), {
                            tokenId: Number(char.tokenId),
                            health: gameData.health || 0,
                            maxHealth: gameData.maxHealth || 100,
                            mana: gameData.mana,
                            maxMana: gameData.maxMana,
                            location: gameData.location || 'town',
                            isDead: gameData.isDead || false,
                            isOnline: gameData.isOnline || false,
                            level: gameData.level || 1,
                            experience: gameData.experience || 0,
                            experienceToNextLevel: gameData.experienceToNextLevel || 100,
                            archetype: char.archetype
                        });
                    }
                } catch (error) {
                    console.error(`Failed to load game data for character ${char.tokenId}:`, error);
                }
            }

            setCharacterGameData(gameDataMap);
        } catch (error) {
            console.error('Failed to load character game data:', error);
        }
    };

    const saveProfile = async () => {
        if (!account) {
            toast.error('Please connect your wallet first');
            return;
        }

        if (!profile.username.trim()) {
            toast.error('Username is required');
            return;
        }

        if (!selectedCharacter) {
            toast.error('Please select a character first');
            return;
        }

        if (!provider) {
            toast.error('Wallet provider not available');
            return;
        }

        setSaving(true);
        try {
            // Step 1: Spend Gold on blockchain
if (!goldContract) {
                toast.error('Gold contract not initialized');
                setSaving(false);
                return;
            }

            const signer = await provider.getSigner();
const goldContractWithSigner = goldContract.connect(signer) as any;


            // Check if character has enough gold
            let goldBalance: bigint;
            try {
                goldBalance = await goldContractWithSigner.getGoldBalance(selectedCharacter.tokenId);
            } catch (balanceError: any) {
                console.error('❌ Failed to check gold balance:', balanceError);
                toast.error('Failed to check gold balance: ' + (balanceError.reason || balanceError.message));
                setSaving(false);
                return;
            }

            if (goldBalance < PROFILE_SAVE_COST) {
                toast.error(`Insufficient gold! Need ${PROFILE_SAVE_COST} GOLD to save profile. Current: ${goldBalance.toString()}`);
                setSaving(false);
                return;
            }

            toast.info(`Spending ${PROFILE_SAVE_COST} GOLD to save profile...`);


            // Execute blockchain transaction
            let tx;
            try {
                tx = await goldContractWithSigner.spendGold(
                    selectedCharacter.tokenId,
                    PROFILE_SAVE_COST,
                    'Profile Update'
                );
} catch (txError: any) {
                console.error('❌ Transaction failed:', {
                    error: txError,
                    code: txError.code,
                    message: txError.message,
                    reason: txError.reason,
                    data: txError.data
                });
                throw txError;
            }

            toast.info('Waiting for transaction confirmation...');
            await tx.wait();
toast.success(`${PROFILE_SAVE_COST} GOLD spent! Saving profile...`);

            // Step 2: Save to database
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    walletAddress: account,
                    username: profile.username.trim(),
                    telegramUsername: profile.telegramUsername.trim(),
                    twitterUsername: profile.twitterUsername.trim(),
                    tokenId: selectedCharacter?.tokenId.toString() // Include tokenId for gold deduction
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message with NFT sync info
                if (userCharacters.length > 0) {
                    toast.success(`Profile saved & synced to ${userCharacters.length} NFT${userCharacters.length > 1 ? 's' : ''}! 🦎`, {
                        autoClose: 5000
                    });
                } else {
                    toast.success('Profile saved successfully! 🦎');
                }
                setProfile(prev => ({ ...prev, lastUpdated: new Date() }));

                // Refresh character data to show updated social info
await refreshCharacters();
                await loadCharacterGameData();
} else {
                toast.error(data.error || 'Failed to save profile');
            }
        } catch (error: any) {
            console.error('❌ Failed to save profile:', {
                error,
                code: error.code,
                message: error.message,
                reason: error.reason,
                data: error.data,
                stack: error.stack
            });

            // Provide detailed error messages
            if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
                toast.error('Transaction cancelled by user');
            } else if (error.code === 'INSUFFICIENT_FUNDS') {
                toast.error('Insufficient BNB for gas fees');
            } else if (error.message?.includes('insufficient')) {
                toast.error(`Insufficient gold! Need ${PROFILE_SAVE_COST} GOLD to save profile.`);
            } else if (error.message?.includes('not authorized') || error.message?.includes('caller is not')) {
                toast.error('Contract error: Not authorized to spend gold. Please contact support.');
            } else if (error.reason) {
                toast.error('Transaction failed: ' + error.reason);
            } else if (error.message) {
                toast.error('Failed to save profile: ' + error.message);
            } else {
                toast.error('Failed to save profile. Check console for details.');
            }
        } finally {
            setSaving(false);
        }
    };

    // Open customization modal for a character
    const openCustomizeModal = (char: any) => {
        setCustomizingCharacter(char);
        // Pre-fill with existing customizations if available
        const existing = char.metadata?.attributes || [];
        const hatAttr = existing.find((a: any) => a.trait_type === 'Hat Color');
        const accAttr = existing.find((a: any) => a.trait_type === 'Accessory');
        const bgAttr = existing.find((a: any) => a.trait_type === 'Background Theme');

        setHatColor(hatAttr?.value?.toLowerCase() || 'red');
        setAccessory(accAttr?.value?.toLowerCase() || 'sword');
        setBackgroundTheme(bgAttr?.value?.toLowerCase() || 'dark forest');
        setExpression('confident');
        setPose('standing');
        setShowCustomizeModal(true);
    };

    // Handle character customization
    const handleCustomize = async () => {
        if (!account || !customizingCharacter) {
            toast.error('Please select a character first');
            return;
        }

        if (!provider) {
            toast.error('Wallet provider not available');
            return;
        }

        if (!goldContract) {
            toast.error('Gold contract not initialized');
            return;
        }

        setIsCustomizing(true);

        try {
            const signer = await provider.getSigner();
            const goldContractWithSigner = goldContract.connect(signer) as any;

            // Check gold balance
            let goldBalance: bigint;
            try {
                goldBalance = await goldContractWithSigner.getGoldBalance(customizingCharacter.tokenId);
            } catch (balanceError: any) {
                console.error('Failed to check gold balance:', balanceError);
                toast.error('Failed to check gold balance');
                setIsCustomizing(false);
                return;
            }

            if (goldBalance < CUSTOMIZATION_COST) {
                toast.error(`Insufficient gold! Need ${CUSTOMIZATION_COST} GOLD. Current: ${goldBalance.toString()}`);
                setIsCustomizing(false);
                return;
            }

            toast.info(`Spending ${CUSTOMIZATION_COST} GOLD for customization...`);

            // Spend gold on-chain
            const tx = await goldContractWithSigner.spendGold(
                customizingCharacter.tokenId,
                CUSTOMIZATION_COST,
                'Character Customization'
            );

            toast.info('Waiting for transaction confirmation...');
            await tx.wait();
            toast.success(`${CUSTOMIZATION_COST} GOLD spent! Generating new artwork...`);

            // Call backend to regenerate image with new customizations
            const response = await fetch('/api/legend/customize-character', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: account,
                    tokenId: customizingCharacter.tokenId.toString(),
                    customizations: {
                        hatColor,
                        accessory,
                        backgroundTheme,
                        expression,
                        pose
                    }
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success('Character customized successfully! New AI artwork generated!');
                setShowCustomizeModal(false);
                setCustomizingCharacter(null);
                // Refresh to show new image
                await refreshCharacters();
            } else {
                toast.error(data.error || 'Failed to customize character');
            }
        } catch (error: any) {
            console.error('Customization failed:', error);
            if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
                toast.error('Transaction cancelled');
            } else {
                toast.error('Customization failed: ' + (error.message || 'Unknown error'));
            }
        } finally {
            setIsCustomizing(false);
        }
    };

    if (!account) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-[#00FF88] mb-4 font-bbs">CONNECT WALLET TO MANAGE PROFILE</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="bg-black/80 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-[#FFD700] mb-6 flex items-center gap-2 font-bbs text-glow-gold">
                    🦎 GAMEFI PLAYER PROFILE
                </h2>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF88] mx-auto"></div>
                        <p className="text-[#00FF88] mt-4 font-bbs">LOADING PROFILE...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Wallet Address */}
                        <div>
                            <label className="block text-sm font-medium text-[#FFD700] mb-2 font-bbs">
                                ▸ WALLET ADDRESS
                            </label>
                            <div className="bg-black/60 rounded p-3 border-2 border-[#00FF88]/30">
                                <code className="text-xs text-green-400 break-all font-mono">{account}</code>
                            </div>
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-[#FFD700] mb-2 font-bbs">
                                ▸ DISPLAY NAME <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={profile.username}
                                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                placeholder="Enter your display name"
                                className="w-full bg-black/60 border-2 border-[#00FF88]/50 rounded px-4 py-2 text-green-400 placeholder-green-700 focus:border-[#FFD700]/70 focus:outline-none font-bbs text-sm"
                                maxLength={32}
                            />
                            <p className="text-xs text-[#00DD77] mt-1 font-bbs">
                                › Used in chat & synced to all your NFT characters
                            </p>
                        </div>

                        {/* Telegram Username */}
                        <div>
                            <label className="block text-sm font-medium text-[#FFD700] mb-2 font-bbs">
                                ▸ TELEGRAM HANDLE
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-[#00FF88] font-bbs">@</span>
                                <input
                                    type="text"
                                    value={profile.telegramUsername}
                                    onChange={(e) => setProfile({ ...profile, telegramUsername: e.target.value.replace('@', '') })}
                                    placeholder="YourTelegramHandle"
                                    className="flex-1 bg-black/60 border-2 border-[#00FF88]/50 rounded px-4 py-2 text-green-400 placeholder-green-700 focus:border-[#FFD700]/70 focus:outline-none font-bbs text-sm"
                                    maxLength={32}
                                />
                            </div>
                            <p className="text-xs text-[#00DD77] mt-1 font-bbs">
                                › Syncs to all NFTs & enables personalized TG bot stats
                            </p>
                        </div>

                        {/* Twitter/X Username */}
                        <div>
                            <label className="block text-sm font-medium text-[#FFD700] mb-2 font-bbs">
                                ▸ X (TWITTER) HANDLE
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-[#00FF88] font-bbs">@</span>
                                <input
                                    type="text"
                                    value={profile.twitterUsername}
                                    onChange={(e) => setProfile({ ...profile, twitterUsername: e.target.value.replace('@', '') })}
                                    placeholder="YourTwitterHandle"
                                    className="flex-1 bg-black/60 border-2 border-[#00FF88]/50 rounded px-4 py-2 text-green-400 placeholder-green-700 focus:border-[#FFD700]/70 focus:outline-none font-bbs text-sm"
                                    maxLength={32}
                                />
                            </div>
                            <p className="text-xs text-[#00DD77] mt-1 font-bbs">
                                › Added to all NFT metadata & visible on marketplaces
                            </p>
                        </div>

                        {/* Linked NFT Characters with Character Selection */}
                        {userCharacters.length > 0 && (
                            <div className="border-t-2 border-[#00FF88]/30 pt-4 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-[#FFD700] font-bbs text-glow-gold">
                                        🎮 YOUR NFT CHARACTERS ({userCharacters.length})
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {selectedCharacter && (
                                            <div className="text-xs text-green-400 font-bbs">
                                                ✓ Active: {selectedCharacter.name}
                                            </div>
                                        )}
                                        <motion.button
                                            onClick={handleCreateCharacter}
                                            className="px-3 py-1 bg-black border-2 border-[#00FF88] text-[#00FF88] text-xs font-bold hover:bg-[#00FF88]/10 transition-all duration-300 font-bbs"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <span className="flex items-center gap-1">
                                                <span>🦎</span>
                                                <span className="hidden sm:inline">[+] New</span>
                                                <span className="sm:hidden">+</span>
                                            </span>
                                        </motion.button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto" style={{
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: 'rgba(0, 255, 0, 0.5) rgba(0, 0, 0, 0.3)'
                                }}>
                                    {userCharacters.map((char) => {
                                        const gameData = characterGameData.get(char.tokenId.toString());
                                        const locationDisplay = gameData?.location ?
                                            gameData.location.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) :
                                            'Unknown';
                                        const isSelected = selectedCharacter?.tokenId === char.tokenId;
                                        const isExpanded = expandedCharacter === char.tokenId.toString();

                                        // Get NFT image from metadata
                                        const nftImage = char.metadata?.image || 'https://crimelizard.tech/assets/lizard.png';

                                        return (
                                            <motion.div
                                                key={char.tokenId.toString()}
                                                className={`bg-black/60 border-2 rounded p-3 cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'border-[#FFD700] shadow-lg shadow-primary-gold/20'
                                                        : 'border-[#00FF88]/30 hover:border-[#00FF88]/60'
                                                }`}
                                                onClick={() => {
                                                    if (!isSelected) {
                                                        selectCharacter(char.tokenId);
                                                        toast.success(`Switched to ${char.name}! 🦎`);
                                                    }
                                                    setExpandedCharacter(isExpanded ? null : char.tokenId.toString());
                                                }}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* NFT Thumbnail */}
                                                    <div className="relative flex-shrink-0 flex flex-col gap-1">
                                                        <div
                                                            className={`w-20 h-20 rounded border-2 overflow-hidden cursor-pointer transition-all hover:border-[#FFD700] ${
                                                                isSelected ? 'border-[#FFD700]' : 'border-[#00FF88]/50'
                                                            }`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEnlargedImage(nftImage);
                                                            }}
                                                            title="Click to view larger"
                                                        >
                                                            <img
                                                                src={nftImage}
                                                                alt={char.name}
                                                                className="w-full h-full object-contain bg-black/40"
                                                                onError={(e) => {
                                                                    // Fallback to default lizard image
                                                                    (e.target as HTMLImageElement).src = '/assets/lizard.png';
                                                                }}
                                                            />
                                                        </div>
                                                        {/* Customize Button */}
                                                        <motion.button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openCustomizeModal(char);
                                                            }}
                                                            className="px-2 py-1 bg-black border border-[#FFD700]/60 text-[#FFD700] text-[10px] font-bold hover:bg-[#FFD700]/10 transition-all font-bbs rounded"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            title="Customize appearance (100 GOLD)"
                                                        >
                                                            🎨 Edit
                                                        </motion.button>
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFD700] border-2 border-black rounded-full flex items-center justify-center text-black font-bold text-xs"
                                                            >
                                                                ✓
                                                            </motion.div>
                                                        )}
                                                    </div>

                                                    {/* Character Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-green-400 font-bold font-bbs text-sm truncate">
                                                                    {char.name}
                                                                </p>
                                                                <p className="text-xs text-[#00DD77] font-mono">
                                                                    NFT ID #{char.tokenId.toString()}
                                                                </p>
                                                            </div>
                                                            <div className="text-right ml-2">
                                                                <p className="text-sm text-[#FFD700] font-bbs whitespace-nowrap">
                                                                    💰 {parseInt(char.goldBalance).toLocaleString()}
                                                                </p>
                                                                {gameData && (
                                                                    <p className="text-xs text-green-400 font-bbs">
                                                                        ⭐ Level {gameData.level}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Game Status Row */}
                                                        {gameData && (
                                                            <>
                                                                {/* HP & XP Progress */}
                                                                <div className="border-t border-[#00FF88]/20 pt-2 mt-2 space-y-1">
                                                                    {/* Health Bar */}
                                                                    <div className="flex items-center justify-between text-xs">
                                                                        <span className={`font-bbs ${gameData.isDead ? 'text-red-400' : 'text-green-400'}`}>
                                                                            {gameData.isDead ? '💀 DEAD' : '❤️'}
                                                                        </span>
                                                                        <div className="flex-1 mx-2">
                                                                            <div className="bg-black/60 rounded-full h-3 overflow-hidden border border-[#00FF88]/30">
                                                                                <div
                                                                                    className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all"
                                                                                    style={{ width: `${(gameData.health / gameData.maxHealth) * 100}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <span className="text-[#00FF88] font-mono text-xs whitespace-nowrap">
                                                                            {gameData.health}/{gameData.maxHealth} HP
                                                                        </span>
                                                                    </div>

                                                                    {/* Mana Bar - Only for magic users */}
                                                                    {gameData.archetype !== undefined && MANA_USING_ARCHETYPES.includes(gameData.archetype) && (
                                                                        <div className="flex items-center justify-between text-xs">
                                                                            <span className="font-bbs text-blue-400">🔮</span>
                                                                            <div className="flex-1 mx-2">
                                                                                <div className="bg-black/60 rounded-full h-3 overflow-hidden border border-blue-500/30">
                                                                                    <div
                                                                                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                                                                                        style={{ width: `${((gameData.mana || 0) / (gameData.maxMana || 1)) * 100}%` }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <span className="text-blue-400 font-mono text-xs whitespace-nowrap">
                                                                                {gameData.mana || 0}/{gameData.maxMana || 0} MP
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {/* XP Progress Bar */}
                                                                    {gameData.experience !== undefined && gameData.experienceToNextLevel !== undefined && (
                                                                        <div className="flex items-center justify-between text-xs">
                                                                            <span className="font-bbs text-[#FFD700]">⭐</span>
                                                                            <div className="flex-1 mx-2">
                                                                                <div className="bg-black/60 rounded-full h-3 overflow-hidden border border-[#FFD700]/30">
                                                                                    <div
                                                                                        className="h-full bg-gradient-to-r from-[#FFD700] to-yellow-400 transition-all"
                                                                                        style={{ width: `${(gameData.experience / gameData.experienceToNextLevel) * 100}%` }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <span className="text-[#FFD700] font-mono text-xs whitespace-nowrap">
                                                                                {gameData.experience}/{gameData.experienceToNextLevel} XP
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {/* Location & Status */}
                                                                    <div className="flex items-center justify-between text-xs pt-1">
                                                                        <div className="flex items-center gap-1">
                                                                            {gameData.isOnline && (
                                                                                <span className="text-green-400 animate-pulse">🟢</span>
                                                                            )}
                                                                            <span className="text-[#FFD700] font-bbs text-xs">
                                                                                📍 {locationDisplay}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}

                                                        {/* Expanded Info */}
                                                        <AnimatePresence>
                                                            {isExpanded && char.metadata && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="border-t border-[#00FF88]/20 mt-2 pt-2 overflow-hidden"
                                                                >
                                                                    <div className="text-xs space-y-1">
                                                                        <p className="text-[#00DD77] font-bbs">
                                                                            ▸ Archetype: {char.metadata.attributes?.find((a: any) => a.trait_type === 'Archetype')?.value || 'Unknown'}
                                                                        </p>
                                                                        <p className="text-[#00DD77] font-bbs">
                                                                            ▸ Role: {char.metadata.attributes?.find((a: any) => a.trait_type === 'Role')?.value || 'Unknown'}
                                                                        </p>
                                                                        <p className="text-[#00DD77] font-bbs">
                                                                            ▸ Rarity: {char.metadata.attributes?.find((a: any) => a.trait_type === 'Rarity')?.value || 'Unknown'}
                                                                        </p>
                                                                        {char.metadata.external_url && (
                                                                            <a
                                                                                href={char.metadata.external_url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-[#FFD700] hover:text-[#FFD700]/80 font-bbs inline-flex items-center gap-1"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                🔗 View Details ›
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                <div className="mt-3 space-y-1">
                                    <p className="text-xs text-[#00DD77] font-bbs">
                                        › Click any character to switch. Profile auto-syncs to all NFTs.
                                    </p>
                                    <p className="text-xs text-[#00DD77] font-bbs">
                                        › Character stats & gold are stored ON-CHAIN and transfer with NFT!
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* No Characters - Create Character Button */}
                        {userCharacters.length === 0 && (
                            <div className="border-t-2 border-[#00FF88]/30 pt-4 mt-4">
                                <div className="text-center py-8 space-y-4">
                                    <div className="text-4xl">🦎</div>
                                    <h3 className="text-lg font-semibold text-[#FFD700] font-bbs text-glow-gold">
                                        NO CHARACTERS YET
                                    </h3>
                                    <p className="text-sm text-[#00FF88] font-bbs">
                                        Create your first Crime Lizard character to start playing!
                                    </p>
                                    <motion.button
                                        onClick={handleCreateCharacter}
                                        className="px-6 py-3 bg-black border-2 border-[#00FF88] text-[#00FF88] font-bold hover:bg-[#00FF88]/10 transition-all duration-300 font-bbs"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>🦎</span>
                                            <span>[+] Create Your First Character</span>
                                        </span>
                                    </motion.button>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="flex items-center gap-3 pt-4">
                            <button
                                onClick={saveProfile}
                                disabled={saving || !profile.username.trim() || !selectedCharacter}
                                className="flex-1 bg-[#00AA55]/60 hover:bg-[#00AA55]/80 disabled:bg-black/40 disabled:cursor-not-allowed text-[#FFD700] border-2 border-[#FFD700]/60 hover:border-[#FFD700] disabled:border-[#00AA55]/50 disabled:text-[#00BB66] font-bold py-2 px-6 rounded transition-all duration-200 shadow-md hover:shadow-primary-gold/30 font-bbs"
                            >
                                {saving ? '⋯ SAVING' : `💾 SAVE PROFILE (${PROFILE_SAVE_COST} 💰 GOLD)`}
                            </button>
                            <button
                                onClick={loadProfile}
                                disabled={loading || saving}
                                className="bg-black/60 hover:bg-black/80 disabled:bg-black/40 disabled:cursor-not-allowed text-[#00FF88] border-2 border-[#00FF88]/50 hover:border-[#00FF88] disabled:border-[#00AA55]/50 disabled:text-[#00BB66] font-medium py-2 px-6 rounded transition-all duration-200 font-bbs"
                            >
                                ↻ RESET
                            </button>
                        </div>

                        {profile.lastUpdated && (
                            <p className="text-xs text-[#00BB66] text-center font-bbs">
                                › LAST UPDATE: {new Date(profile.lastUpdated).toLocaleString()}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Image Enlargement Modal - Large fullscreen view */}
            <AnimatePresence>
                {enlargedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 z-modal flex items-center justify-center p-2 overscroll-none"
                        onClick={() => setEnlargedImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="relative w-full h-full max-w-4xl max-h-[95dvh] bg-black border-4 border-[#FFD700] p-2 flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setEnlargedImage(null)}
                                className="absolute top-2 right-2 w-10 h-10 bg-red-600 border-2 border-white text-white font-bold rounded-full hover:bg-red-700 transition-colors z-10 text-xl"
                            >
                                ×
                            </button>
                            <div className="flex-1 flex items-center justify-center overflow-hidden">
                                <img
                                    src={enlargedImage}
                                    alt="NFT Character"
                                    className="max-w-full max-h-full object-contain"
                                    style={{ imageRendering: 'pixelated' }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/assets/lizard.png';
                                    }}
                                />
                            </div>
                            <p className="text-center text-[#00FF88] font-bbs text-sm mt-2">
                                Click anywhere outside or press ESC to close
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Character Customization Modal */}
            <AnimatePresence>
                {showCustomizeModal && customizingCharacter && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-modal flex items-center justify-center p-4 overscroll-none"
                        onClick={closeCustomizeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-black border-4 border-[#FFD700] p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={closeCustomizeModal}
                                className="absolute top-2 right-2 w-8 h-8 bg-red-600 border-2 border-white text-white font-bold rounded-full hover:bg-red-700 transition-colors z-10"
                                disabled={isCustomizing}
                            >
                                ×
                            </button>

                            <h2 className="text-2xl font-bold text-[#FFD700] mb-4 text-glow-gold font-bbs">
                                🎨 CUSTOMIZE CHARACTER
                            </h2>

                            <div className="mb-4 p-3 bg-black/60 border-2 border-[#00FF88]/30 rounded">
                                <p className="text-[#00FF88] font-bbs text-sm">
                                    Customizing: <span className="text-[#FFD700]">{customizingCharacter.name}</span>
                                </p>
                                <p className="text-[#00FF88]/70 font-bbs text-xs mt-1">
                                    NFT #{customizingCharacter.tokenId.toString()}
                                </p>
                            </div>

                            <div className="mb-4 p-3 bg-[#FFD700]/10 border-2 border-[#FFD700]/50 rounded">
                                <p className="text-[#FFD700] font-bbs text-sm">
                                    💰 Cost: {CUSTOMIZATION_COST} GOLD
                                </p>
                                <p className="text-[#FFD700]/70 font-bbs text-xs mt-1">
                                    AI will generate new pixel art with your choices
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Hat Color */}
                                <div>
                                    <label className="block text-sm text-[#00FF88] mb-2 font-bbs">🎩 Hat Color</label>
                                    <select
                                        value={hatColor}
                                        onChange={(e) => setHatColor(e.target.value)}
                                        disabled={isCustomizing}
                                        className="w-full px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] focus:border-[#FFD700] focus:outline-none font-bbs disabled:opacity-50"
                                    >
                                        {HAT_COLOR_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Accessory */}
                                <div>
                                    <label className="block text-sm text-[#00FF88] mb-2 font-bbs">⚔️ Accessory</label>
                                    <select
                                        value={accessory}
                                        onChange={(e) => setAccessory(e.target.value)}
                                        disabled={isCustomizing}
                                        className="w-full px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] focus:border-[#FFD700] focus:outline-none font-bbs disabled:opacity-50"
                                    >
                                        {ACCESSORY_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Background Theme */}
                                <div>
                                    <label className="block text-sm text-[#00FF88] mb-2 font-bbs">🌆 Background</label>
                                    <select
                                        value={backgroundTheme}
                                        onChange={(e) => setBackgroundTheme(e.target.value)}
                                        disabled={isCustomizing}
                                        className="w-full px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] focus:border-[#FFD700] focus:outline-none font-bbs disabled:opacity-50"
                                    >
                                        {BACKGROUND_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Expression */}
                                <div>
                                    <label className="block text-sm text-[#00FF88] mb-2 font-bbs">😎 Expression</label>
                                    <select
                                        value={expression}
                                        onChange={(e) => setExpression(e.target.value)}
                                        disabled={isCustomizing}
                                        className="w-full px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] focus:border-[#FFD700] focus:outline-none font-bbs disabled:opacity-50"
                                    >
                                        {EXPRESSION_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Pose */}
                                <div>
                                    <label className="block text-sm text-[#00FF88] mb-2 font-bbs">🧍 Pose</label>
                                    <select
                                        value={pose}
                                        onChange={(e) => setPose(e.target.value)}
                                        disabled={isCustomizing}
                                        className="w-full px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] focus:border-[#FFD700] focus:outline-none font-bbs disabled:opacity-50"
                                    >
                                        {POSE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6">
                                <motion.button
                                    onClick={handleCustomize}
                                    disabled={isCustomizing}
                                    className="flex-1 py-3 bg-black border-2 border-[#FFD700] text-[#FFD700] font-bold hover:bg-[#FFD700]/10 transition-all font-bbs disabled:opacity-50 disabled:cursor-not-allowed"
                                    whileHover={!isCustomizing ? { scale: 1.02 } : {}}
                                    whileTap={!isCustomizing ? { scale: 0.98 } : {}}
                                >
                                    {isCustomizing ? '⏳ GENERATING...' : `🎨 CUSTOMIZE (${CUSTOMIZATION_COST} 💰)`}
                                </motion.button>
                                <motion.button
                                    onClick={closeCustomizeModal}
                                    disabled={isCustomizing}
                                    className="px-6 py-3 bg-black border-2 border-[#00FF88]/50 text-[#00FF88] font-bold hover:bg-[#00FF88]/10 transition-all font-bbs disabled:opacity-50"
                                    whileHover={!isCustomizing ? { scale: 1.02 } : {}}
                                    whileTap={!isCustomizing ? { scale: 0.98 } : {}}
                                >
                                    CANCEL
                                </motion.button>
                            </div>

                            {isCustomizing && (
                                <div className="mt-4 p-3 bg-[#00FF88]/10 border-2 border-[#00FF88]/30 rounded">
                                    <p className="text-[#00FF88] font-bbs text-sm animate-pulse">
                                        🎨 AI is generating your custom pixel art... This may take up to 60 seconds.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
