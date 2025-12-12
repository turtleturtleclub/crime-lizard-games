import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useContext, useEffect } from 'react';
import { WalletContext } from '../providers/WalletContext';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../types/i18n.types';
import { useContractStats } from '../hooks/useContractStats';
import { useCharacterCount } from '../hooks/useCharacterCount';
import { useCharacter } from '../contexts/CharacterContext';
import { useLegendGame } from '../contexts/LegendGameContext';
import { RewardsModal } from './RewardsPage';
import HowToPlay from './HowToPlay';
import { Twitter, Send, Mail, DollarSign, Volume2, VolumeX, AlertTriangle, User, Crown, Menu } from 'lucide-react';

interface EnhancedHeaderProps {
    soundEnabled?: boolean;
    setSoundEnabled?: (enabled: boolean) => void;
    soundSystemReady?: boolean;
}

interface CharacterGameData {
    tokenId: number;
    health: number;
    maxHealth: number;
    location: string;
    isDead?: boolean;
    isOnline?: boolean;
    level: number;
    experience?: number;
    experienceToNextLevel?: number;
    gold?: number;
    goldInBank?: number;
    turnsRemaining?: number;
    maxTurns?: number;
    name?: string;
    sleptSafely?: boolean;
}

interface UserProfile {
    username: string;
    telegramUsername: string;
    twitterUsername: string;
}

// Profile save cost in GOLD
const PROFILE_SAVE_COST = 100;

function EnhancedHeader({ soundEnabled = true, setSoundEnabled, soundSystemReady = false }: EnhancedHeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { account, currentChainId, connectWallet, provider } = useContext(WalletContext);
    const { language, setLanguage, t } = useLanguage();
    const contractStats = useContractStats();
    const characterCount = useCharacterCount();
    const { userCharacters, selectedCharacter, selectCharacter } = useCharacter();
    const { showCharSheet, showInventory, showQuestLog, showCharacterCreation, showStatus } = useLegendGame();

    const [localSoundEnabled, setLocalSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('crimeLizardSoundEnabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showRewardsModal, setShowRewardsModal] = useState(false);
    const [showBuyDropdown, setShowBuyDropdown] = useState(false);
    const [showHowToPlay, setShowHowToPlay] = useState(false);
    const [profile, setProfile] = useState<UserProfile>({
        username: '',
        telegramUsername: '',
        twitterUsername: ''
    });
    const [saving, setSaving] = useState(false);
    const [characterGameData, setCharacterGameData] = useState<Map<string, CharacterGameData>>(new Map());

    // Use player from context instead of separate API polling - real-time sync!
    const { player: activeLegendPlayer } = useLegendGame();

    const isAdmin = (address: string) => {
        const adminWallet = import.meta.env.VITE_ADMIN_WALLET || '';
        return adminWallet && address.toLowerCase() === adminWallet.toLowerCase();
    };

    // activeLegendPlayer now comes from context - no need for separate API polling!
    // This provides real-time stats updates as the player plays the game

    const actualSoundEnabled = setSoundEnabled ? soundEnabled : localSoundEnabled;
    const actualSetSoundEnabled = setSoundEnabled || setLocalSoundEnabled;

    // Load profile data when account changes or modal opens
    useEffect(() => {
        if (account && showProfileModal) {
            loadProfile();
            loadCharacterGameData();
        }
    }, [account, showProfileModal]);

    // Auto-refresh character data every 5 seconds when modal is open
    useEffect(() => {
        if (!showProfileModal || !account) return;

        const refreshInterval = setInterval(() => {
            loadCharacterGameData();
        }, 5000); // Refresh every 5 seconds

        return () => clearInterval(refreshInterval);
    }, [showProfileModal, account]);

    // Refresh when userCharacters changes (resurrection, character updates, etc.)
    useEffect(() => {
        if (showProfileModal && account && userCharacters.length > 0) {
            loadCharacterGameData();
        }
    }, [userCharacters]);

    // Handle Escape key and mobile back button
    useEffect(() => {
        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showProfileModal) {
                setShowProfileModal(false);
                loadProfile(); // Reset profile data
            }
        };

        const handlePopState = () => {
            if (showProfileModal) {
                setShowProfileModal(false);
                loadProfile(); // Reset profile data
            }
        };

        // Add keyboard listener
        document.addEventListener('keydown', handleEscapeKey);

        // Push a new state when modal opens (for mobile back button)
        if (showProfileModal) {
            window.history.pushState({ modalOpen: true }, '');
            window.addEventListener('popstate', handlePopState);
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [showProfileModal]);

    const loadProfile = async () => {
        if (!account) return;

        try {
            const response = await fetch(`/api/profile/${account}`);
            if (response.ok) {
                const data = await response.json();
                setProfile({
                    username: data.username || '',
                    telegramUsername: data.telegramUsername || '',
                    twitterUsername: data.twitterUsername || ''
                });
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    };

    // Load game data for all characters
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
                            location: gameData.location || 'town',
                            isDead: gameData.isDead || false,
                            isOnline: gameData.isOnline || false,
                            level: gameData.level || 1
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

    // Check for already connected wallet (only if user didn't manually disconnect)
    useEffect(() => {
        const checkExistingConnection = async () => {
            // Check if user manually disconnected in this session
            const manuallyDisconnected = sessionStorage.getItem('crimeLizardWalletDisconnected');

            if (window.ethereum && !account && !manuallyDisconnected) {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts && accounts.length > 0) {
                        await connectWallet();
                    }
                } catch (error) {
                    console.warn('Failed to check existing wallet connection:', error);
                }
            }
        };
        checkExistingConnection();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account]); // Removed connectWallet dependency to prevent duplicate calls

    const toggleSound = async () => {
        const newState = !actualSoundEnabled;
        if (newState && !soundSystemReady) {
            try {
                if (typeof window !== 'undefined' && 'AudioContext' in window) {
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    if (audioContext.state === 'suspended') {
                        await audioContext.resume();
                    }
                }
            } catch (error) {
                console.warn('⚠️ Failed to reinitialize sound system:', error);
            }
        }
        actualSetSoundEnabled(newState);
        localStorage.setItem('crimeLizardSoundEnabled', JSON.stringify(newState));
    };

    const handleWalletConnect = async () => {
        try {
            // Clear the disconnect flag when user manually connects
            sessionStorage.removeItem('crimeLizardWalletDisconnected');
            await connectWallet();
            setShowMobileMenu(false);
        } catch (err: any) {
            console.error('Wallet connection error:', err);
            toast.error(`${t.wallet.connectionFailed}: ${err.message || t.wallet.unknownError}`);
        }
    };

    const handleWalletDisconnect = async () => {
        try {
            // Set flag to prevent auto-reconnect
            sessionStorage.setItem('crimeLizardWalletDisconnected', 'true');

            if (window.ethereum && window.ethereum.disconnect) {
                await window.ethereum.disconnect();
            }
            // Remove all wallet-related localStorage items
            localStorage.removeItem('walletConnected'); // WalletProvider checks this
            localStorage.removeItem('crimeLizardWalletConnected');
            localStorage.removeItem('crimeLizardWalletAddress');
            localStorage.removeItem('selectedCharacterId');
            window.location.reload();
        } catch (err: any) {
            console.error('Wallet disconnect error:', err);
            toast.error(t.wallet.disconnectFailed);
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
            // Save to database (gold will be deducted server-side from Legend game database)
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
                // Update socket for chat
                const serverUrl = import.meta.env.DEV ? 'http://localhost:3003' : window.location.origin;
                const socket = io(serverUrl);
                socket.emit('updateProfile', {
                    userId: account,
                    nickname: profile.username.trim()
                });

                // Show success message with NFT sync info
                if (userCharacters.length > 0) {
                    toast.success(`Profile saved & synced to ${userCharacters.length} NFT${userCharacters.length > 1 ? 's' : ''}! 🦎`, {
                        autoClose: 5000
                    });
                } else {
                    toast.success('Profile saved successfully! 🦎');
                }

                setTimeout(() => socket.disconnect(), 1000);
                setShowProfileModal(false);
            } else {
                toast.error(data.error || 'Failed to save profile');
            }
        } catch (error: any) {
            console.error('Failed to save profile:', error);
            if (error.code === 'ACTION_REJECTED') {
                toast.error('Transaction cancelled by user');
            } else if (error.message?.includes('insufficient')) {
                toast.error(`Insufficient gold! Need ${PROFILE_SAVE_COST} GOLD to save profile.`);
            } else {
                toast.error('Failed to save profile: ' + (error.reason || error.message || 'Unknown error'));
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* Terminal Style Header */}
            <header className="sticky top-0 bg-black border-b-2 border-[#00FF88] font-bbs" style={{ zIndex: 10 }}>
                <div className="container mx-auto px-4 py-2">
                    {/* Main Header Row */}
                    <div className="flex items-center justify-between">
                        {/* Left - Logo and Brand */}
                        <motion.div
                            className="flex items-center space-x-3 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                // Force reload to home
                                window.location.href = '/';
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="text-3xl">🦎</div>
                            <h1 className="text-xl md:text-2xl text-[#00FF88] text-glow-green font-bold">
                                {t.header.title}
                            </h1>
                        </motion.div>

                        {/* Right - Actions */}
                        <div className="flex items-center gap-1">
                            {/* Desktop Actions */}
                            <div className="hidden md:flex items-center gap-1">
                                {/* Social Icons Group - using inline styles to guarantee sizing */}
                                <a
                                    href="https://x.com/CrimeLizardBNB"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center bg-black border border-[#00FF88] hover:bg-[#00FF88] transition-all group"
                                    style={{ width: '32px', height: '32px' }}
                                    title={t.header.followX}
                                >
                                    <Twitter size={16} className="text-[#00FF88] group-hover:text-black" />
                                </a>
                                <a
                                    href="https://t.me/crimelizard"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center bg-black border border-[#00FF88] hover:bg-[#00FF88] transition-all group"
                                    style={{ width: '32px', height: '32px' }}
                                    title={t.header.joinTelegram}
                                >
                                    <Send size={16} className="text-[#00FF88] group-hover:text-black" />
                                </a>
                                <a
                                    href="mailto:dev@crimelizard.tech"
                                    className="flex items-center justify-center bg-black border border-[#00FF88] hover:bg-[#00FF88] transition-all group"
                                    style={{ width: '32px', height: '32px' }}
                                    title={t.header.contactSupport}
                                >
                                    <Mail size={16} className="text-[#00FF88] group-hover:text-black" />
                                </a>

                                {/* Buy Token Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowBuyDropdown(!showBuyDropdown)}
                                        className="header-btn flex items-center justify-center bg-black border border-[#00FF88] hover:bg-[#00FF88] transition-all group"
                                        style={{ width: '32px', height: '32px' }}
                                        title={t.header.buyToken}
                                    >
                                        <DollarSign size={16} className="text-[#00FF88] group-hover:text-black" />
                                    </button>
                                    {showBuyDropdown && (
                                        <>
                                            <div className="fixed inset-0" onClick={() => setShowBuyDropdown(false)} style={{ zIndex: 49 }} />
                                            <div className="absolute right-0 bg-black border border-[#00FF88] min-w-[160px]" style={{ zIndex: 50, top: '28px' }}>
                                                <a
                                                    href="https://app.openocean.finance/swap/bsc/BNB/CLZD"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-2 text-[#00FF88] hover:bg-[#00FF88] hover:text-black transition-all text-xs"
                                                    onClick={() => setShowBuyDropdown(false)}
                                                >
                                                    <img src="/assets/openocean.png" alt="OpenOcean" className="w-4 h-4" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                    <span className="font-bold">OpenOcean</span>
                                                </a>
                                                <a
                                                    href="https://pancakeswap.finance/swap?chain=bsc&inputCurrency=BNB&outputCurrency=0xa5996Fc5007dD2019F9a9Ff6c50c1c847Aa64444"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-2 text-[#00FF88] hover:bg-[#00FF88] hover:text-black transition-all border-t border-[#00FF88]/30 text-xs"
                                                    onClick={() => setShowBuyDropdown(false)}
                                                >
                                                    <img src="/assets/pancakeswap.png" alt="PancakeSwap" className="w-4 h-4" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                    <span className="font-bold">PancakeSwap</span>
                                                </a>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Language Selector */}
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value as Language)}
                                    className="bg-black text-[#00FF88] text-xs cursor-pointer outline-none border border-[#00FF88] font-bold px-2"
                                    style={{ height: '32px' }}
                                    title={t.common.language}
                                >
                                    <option value="en" className="bg-black">EN</option>
                                    <option value="zh" className="bg-black">中文</option>
                                </select>

                                {/* Sound Toggle */}
                                <button
                                    onClick={toggleSound}
                                    className={`header-btn flex items-center justify-center border transition-all group ${actualSoundEnabled && soundSystemReady
                                        ? 'bg-black border-[#00FF88] hover:bg-[#00FF88]'
                                        : actualSoundEnabled && !soundSystemReady
                                            ? 'bg-black border-yellow-500 hover:bg-yellow-500'
                                            : 'bg-black border-gray-500 hover:bg-gray-600'
                                        }`}
                                    style={{ width: '32px', height: '32px' }}
                                    title={t.header.toggleSound}
                                >
                                    {actualSoundEnabled && soundSystemReady ? (
                                        <Volume2 size={16} className="text-[#00FF88] group-hover:text-black" />
                                    ) : actualSoundEnabled && !soundSystemReady ? (
                                        <AlertTriangle size={16} className="text-yellow-500 group-hover:text-black" />
                                    ) : (
                                        <VolumeX size={16} className="text-gray-500 group-hover:text-white" />
                                    )}
                                </button>

                                {/* Network Indicator */}
                                <div className="px-2 flex items-center bg-black border border-[#00FF88]" style={{ height: '32px' }}>
                                    <div className={`w-1.5 h-1.5 ${currentChainId === 56 ? 'bg-green-400' : 'bg-yellow-400'} mr-1`} />
                                    <span className="text-[#00FF88] text-xs font-bold">BNB</span>
                                </div>

                                {/* Wallet Connection */}
                                {!account ? (
                                    <button
                                        onClick={handleWalletConnect}
                                        className="header-btn px-2 flex items-center gap-1 bg-black border border-[#00FF88] text-[#00FF88] hover:bg-[#00FF88] hover:text-black transition-all"
                                        style={{ height: '32px' }}
                                    >
                                        <span className="text-xs">🔗</span>
                                        <span className="text-xs font-bold">{t.wallet.connect}</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        {/* Profile Button */}
                                        <button
                                            onClick={() => setShowProfileModal(true)}
                                            className="header-btn flex items-center justify-center bg-black border border-[#00FF88] hover:bg-[#00FF88] transition-all group"
                                            style={{ width: '32px', height: '32px' }}
                                            title={t.wallet.profile}
                                        >
                                            <User size={16} className="text-[#00FF88] group-hover:text-black" />
                                        </button>

                                        {/* Admin Button */}
                                        {isAdmin(account) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate('/admin');
                                                }}
                                                className="header-btn flex items-center justify-center bg-black border border-yellow-500 hover:bg-yellow-500 transition-all group"
                                                style={{ width: '32px', height: '32px' }}
                                                title={t.wallet.admin}
                                            >
                                                <Crown size={16} className="text-yellow-500 group-hover:text-black" />
                                            </button>
                                        )}

                                        {/* Wallet Address / Disconnect */}
                                        <button
                                            onClick={handleWalletDisconnect}
                                            className="header-btn px-2 flex items-center gap-1 bg-black border border-[#00FF88] text-[#00FF88] hover:bg-[#00FF88] hover:text-black transition-all"
                                            style={{ height: '32px' }}
                                        >
                                            <div className={`w-1.5 h-1.5 ${currentChainId === 56 ? 'bg-green-400' : 'bg-yellow-400'}`} />
                                            <span className="text-xs font-bold">{account.slice(0, 4)}...{account.slice(-3)}</span>
                                            <span className="text-xs">×</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setShowMobileMenu(true)}
                                className="header-btn md:hidden flex items-center justify-center bg-black border border-[#00FF88] hover:bg-[#00FF88] transition-all group"
                                style={{ width: '32px', height: '32px' }}
                            >
                                <Menu size={16} className="text-[#00FF88] group-hover:text-black" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Terminal Stats Bar - Shows different stats based on current route */}
                <div className="border-t border-[#00FF88] py-2 px-2 md:px-4 bg-black">
                    {location.pathname === '/' && activeLegendPlayer ? (
                        /* Legend Game Stats Bar - Full Player Info */
                        <div className="space-y-2">
                            {/* Mobile: Stacked Layout */}
                            <div className="md:hidden space-y-2">
                                {/* Row 1: Name & Level */}
                                <div className="flex items-center gap-2">
                                    <span>🦎</span>
                                    <span className="text-yellow-500 font-bold">{activeLegendPlayer.name}</span>
                                    <span className="text-[#00FF88] text-xs">[Lv {activeLegendPlayer.level}]</span>
                                </div>

                                {/* Row 2: HP & XP */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-1">
                                        <span className="text-red-500">❤️</span>
                                        <span className="text-red-400">{activeLegendPlayer.health}/{activeLegendPlayer.maxHealth}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-blue-500">✨</span>
                                        <span className="text-blue-400">{activeLegendPlayer.experience}/{activeLegendPlayer.experienceToNextLevel}</span>
                                    </div>
                                </div>

                                {/* Row 3: Gold, Turns, Bank */}
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="flex items-center gap-1">
                                        <span>💰</span>
                                        <span className="text-yellow-500 font-bold">{(activeLegendPlayer.gold || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[#00FF88]">⚔️</span>
                                        <span className="text-green-400">{activeLegendPlayer.turnsRemaining}/{activeLegendPlayer.maxTurns}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-purple-500">🏦</span>
                                        <span className="text-purple-400">{(activeLegendPlayer.goldInBank || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Row 4: Action Buttons */}
                                <div className="flex items-center gap-2 text-xs">
                                    <button
                                        onClick={showCharSheet}
                                        className="flex-1 px-2 py-1 bg-[#00AA55]/30 border border-[#00FF88] text-[#00FF88] hover:bg-[#00FF88] hover:text-black transition-all"
                                    >
                                        📋 {t.header.stats}
                                    </button>
                                    <button
                                        onClick={showInventory}
                                        className="flex-1 px-2 py-1 bg-yellow-900/30 border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all"
                                    >
                                        🎒 {t.header.inv}
                                    </button>
                                    <button
                                        onClick={showQuestLog}
                                        className="flex-1 px-2 py-1 bg-blue-900/30 border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-black transition-all"
                                    >
                                        📜 {t.header.quests}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowRewardsModal(true);
                                        }}
                                        className="flex-1 px-2 py-1 bg-purple-900/30 border border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-black transition-all"
                                    >
                                        🏆 {t.header.rewards}
                                    </button>
                                    {showStatus && (
                                        <button
                                            onClick={showStatus}
                                            className={`flex-1 px-2 py-1 transition-all ${
                                                activeLegendPlayer.location === 'inn' || activeLegendPlayer.location === 'brothel'
                                                    ? activeLegendPlayer.sleptSafely
                                                        ? 'bg-green-900/30 border border-green-500 text-green-400 hover:bg-green-500 hover:text-black'
                                                        : 'bg-yellow-900/30 border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black'
                                                    : 'bg-cyan-900/30 border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black'
                                            }`}
                                            title={`Location: ${activeLegendPlayer.location}`}
                                        >
                                            {activeLegendPlayer.location === 'inn' ? '🏨' :
                                             activeLegendPlayer.location === 'brothel' ? '💋' :
                                             activeLegendPlayer.location === 'town' ? '🏛️' :
                                             activeLegendPlayer.location === 'forest' ? '🌲' :
                                             '📍'} {t.header.status}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Desktop: Single Row Layout */}
                            <div className="hidden md:flex items-center justify-between gap-4 text-xs">
                                {/* Character Name & Level */}
                                <div className="flex items-center gap-2">
                                    <span>🦎</span>
                                    <span className="text-yellow-500 font-bold">{activeLegendPlayer.name}</span>
                                    <span className="text-[#00FF88]">[Lv {activeLegendPlayer.level}]</span>
                                </div>

                                {/* HP */}
                                <div className="flex items-center gap-1">
                                    <span className="text-red-500">❤️</span>
                                    <span className="text-red-400">{activeLegendPlayer.health}/{activeLegendPlayer.maxHealth}</span>
                                </div>

                                {/* XP */}
                                <div className="flex items-center gap-1">
                                    <span className="text-blue-500">✨</span>
                                    <span className="text-blue-400">{activeLegendPlayer.experience}/{activeLegendPlayer.experienceToNextLevel}</span>
                                </div>

                                {/* Gold */}
                                <div className="flex items-center gap-1">
                                    <span>💰</span>
                                    <span className="text-yellow-500 font-bold">{(activeLegendPlayer.gold || 0).toLocaleString()}</span>
                                </div>

                                {/* Turns */}
                                <div className="flex items-center gap-1">
                                    <span className="text-[#00FF88]">⚔️</span>
                                    <span className="text-green-400">{activeLegendPlayer.turnsRemaining}/{activeLegendPlayer.maxTurns}</span>
                                </div>

                                {/* Bank */}
                                <div className="flex items-center gap-1">
                                    <span className="text-purple-500">🏦</span>
                                    <span className="text-purple-400">{(activeLegendPlayer.goldInBank || 0).toLocaleString()}</span>
                                </div>

                                {/* Vertical Separator */}
                                <div className="w-px h-4 bg-[#00FF88]/30"></div>

                                {/* Action Buttons */}
                                <button
                                    onClick={showCharSheet}
                                    className="px-2 py-1 text-xs bg-[#00AA55]/30 border border-[#00FF88] text-[#00FF88] hover:bg-[#00FF88] hover:text-black transition-all"
                                >
                                    📋 {t.header.stats}
                                </button>
                                <button
                                    onClick={showInventory}
                                    className="px-2 py-1 text-xs bg-yellow-900/30 border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all"
                                >
                                    🎒 {t.header.inventory}
                                </button>
                                <button
                                    onClick={showQuestLog}
                                    className="px-2 py-1 text-xs bg-blue-900/30 border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-black transition-all"
                                >
                                    📜 {t.header.quests}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowRewardsModal(true);
                                    }}
                                    className="px-2 py-1 text-xs bg-purple-900/30 border border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-black transition-all"
                                >
                                    🏆 {t.header.rewards}
                                </button>
                                {showStatus && (
                                    <button
                                        onClick={showStatus}
                                        className={`px-2 py-1 text-xs transition-all ${
                                            activeLegendPlayer.location === 'inn' || activeLegendPlayer.location === 'brothel'
                                                ? activeLegendPlayer.sleptSafely
                                                    ? 'bg-green-900/30 border border-green-500 text-green-400 hover:bg-green-500 hover:text-black'
                                                    : 'bg-yellow-900/30 border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black'
                                                : 'bg-cyan-900/30 border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black'
                                        }`}
                                        title={`Location: ${activeLegendPlayer.location}`}
                                    >
                                        {activeLegendPlayer.location === 'inn' ? '🏨' :
                                         activeLegendPlayer.location === 'brothel' ? '💋' :
                                         activeLegendPlayer.location === 'town' ? '🏛️' :
                                         activeLegendPlayer.location === 'forest' ? '🌲' :
                                         '📍'} {t.header.status}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Default Stats Bar for other pages */
                        <div className="flex items-center justify-center gap-4 md:gap-8 text-xs">
                            {/* Total Minted Characters */}
                            <div className="flex items-center gap-1">
                                <span>🦎</span>
                                <span className="text-gray-400">{t.header.characters}:</span>
                                <span className="text-[#00FF88] font-bold">
                                    {characterCount.loading ? '...' : characterCount.totalMinted}
                                </span>
                            </div>

                            {/* Separator */}
                            <div className="hidden md:block w-px h-3 bg-[#00FF88]"></div>

                            {/* Jackpot */}
                            <div className="flex items-center gap-1">
                                <span>💰</span>
                                <span className="text-gray-400">{t.landing.jackpot}:</span>
                                <span className="text-yellow-500 font-bold">
                                    {contractStats.loading ? '...' : `${parseInt(contractStats.jackpot || '0').toLocaleString()}`}
                                </span>
                            </div>

                            {/* Separator */}
                            <div className="hidden md:block w-px h-3 bg-[#00FF88]"></div>

                            {/* Total Spins */}
                            <div className="hidden md:flex items-center gap-1">
                                <span>🎰</span>
                                <span className="text-gray-400">{t.landing.spins}:</span>
                                <span className="text-cyan-500 font-bold">
                                    {contractStats.loading ? '...' : contractStats.totalSpins}
                                </span>
                            </div>

                            {/* Separator */}
                            <div className="hidden lg:block w-px h-3 bg-[#00FF88]"></div>

                            {/* Leaderboard Rewards - Top 10 players */}
                            <div className="hidden lg:flex items-center gap-1">
                                <span>🏆</span>
                                <span className="text-gray-400">{t.header.leaderboard}:</span>
                                <span className="text-purple-400 font-bold">
                                    500K $CLZD
                                </span>
                            </div>

                            {/* Live Indicator */}
                            <motion.div
                                className="flex items-center gap-1 ml-auto"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <div className="w-2 h-2 rounded-none bg-[#00FF88]"></div>
                                <span className="text-[#00FF88] font-bold">{t.common.live}</span>
                            </motion.div>
                        </div>
                    )}
                </div>
            </header>

            {/* Mobile Menu - Terminal Style to Match Desktop */}
            <AnimatePresence>
                {showMobileMenu && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 md:hidden font-bbs overscroll-none"
                        style={{ zIndex: 9999 }}
                        onClick={() => setShowMobileMenu(false)}
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-black border-l-2 border-[#00FF88] p-6 overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-8 border-b-2 border-[#00FF88] pb-4">
                                <h2 className="text-xl font-bold text-[#00FF88] text-glow-green">{t.header.menu}</h2>
                                <button
                                    onClick={() => setShowMobileMenu(false)}
                                    className="text-[#00FF88] hover:text-green-400 text-3xl leading-none"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Navigation Menu - Terminal Style */}
                            <nav className="space-y-3 mb-6">
                                {[
                                    { path: '/', label: 'Game World', icon: '🦎' },
                                ].map((item) => (
                                    <motion.button
                                        key={item.path}
                                        onClick={() => {
                                            navigate(item.path);
                                            setShowMobileMenu(false);
                                        }}
                                        className="w-full flex items-center space-x-3 p-3 border-2 rounded-none transition-all text-[#00FF88] border-[#00FF88] hover:bg-[#00FF88] hover:text-black bg-black"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span className="text-xl">{item.icon}</span>
                                        <span className="font-bold">{item.label}</span>
                                    </motion.button>
                                ))}
                            </nav>

                            {/* Network Indicator - Mobile */}
                            <div className="mb-6 border-b-2 border-[#00FF88] pb-6">
                                <div className="flex items-center space-x-3 p-3 border-2 border-[#00FF88] bg-black">
                                    <span className="text-xl">🔗</span>
                                    <span className="font-bold text-[#00FF88]">Network:</span>
                                    <div className={`w-3 h-3 rounded-none ${currentChainId === 56 ? 'bg-[#00FF88]' : 'bg-yellow-400'}`} />
                                    <span className="text-[#00FF88] font-bold">BNB Smart Chain</span>
                                </div>
                            </div>

                            {/* Sound Toggle - Terminal Style */}
                            <div className="mb-6 border-b-2 border-[#00FF88] pb-6">
                                <motion.button
                                    onClick={toggleSound}
                                    className={`w-full flex items-center space-x-3 p-3 border-2 rounded-none transition-all ${actualSoundEnabled && soundSystemReady
                                        ? 'text-[#00FF88] border-[#00FF88] hover:bg-[#00FF88] hover:text-black bg-black'
                                        : actualSoundEnabled && !soundSystemReady
                                            ? 'text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black bg-black'
                                            : 'text-gray-500 border-gray-500 hover:bg-gray-600 hover:text-white bg-black'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="text-xl">
                                        {actualSoundEnabled && soundSystemReady ? '🔊' :
                                            actualSoundEnabled && !soundSystemReady ? '⚠️' : '🔇'}
                                    </span>
                                    <span className="font-bold">
                                        {actualSoundEnabled && soundSystemReady ? t.header.soundOn :
                                            actualSoundEnabled && !soundSystemReady ? t.header.soundLoading : t.header.soundOff}
                                    </span>
                                </motion.button>
                            </div>

                            {/* How to Play - Terminal Style */}
                            <div className="mb-6 border-b-2 border-[#00FF88] pb-6">
                                <motion.button
                                    onClick={() => {
                                        setShowHowToPlay(true);
                                        setShowMobileMenu(false);
                                    }}
                                    className="w-full flex items-center space-x-3 p-3 border-2 rounded-none transition-all text-[#FFD700] border-[#FFD700] hover:bg-[#FFD700] hover:text-black bg-black"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="text-xl">❓</span>
                                    <span className="font-bold">How to Play</span>
                                </motion.button>
                            </div>

                            {/* Social Links - Terminal Style */}
                            <div className="space-y-3 mb-6">
                                <motion.a
                                    href="https://x.com/CrimeLizardBNB"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center space-x-3 p-3 bg-black border-2 border-[#00FF88] rounded-none text-[#00FF88] hover:bg-[#00FF88] hover:text-black transition-all group"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Twitter size={20} className="text-[#00FF88] group-hover:text-black transition-colors flex-shrink-0" />
                                    <span className="font-bold">{t.header.followX}</span>
                                </motion.a>

                                <motion.a
                                    href="https://t.me/crimelizard"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center space-x-3 p-3 bg-black border-2 border-[#00FF88] rounded-none text-[#00FF88] hover:bg-[#00FF88] hover:text-black transition-all group"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Send size={20} className="text-[#00FF88] group-hover:text-black transition-colors flex-shrink-0" />
                                    <span className="font-bold">{t.header.joinTelegram}</span>
                                </motion.a>

                                <motion.a
                                    href="mailto:dev@crimelizard.tech"
                                    className="w-full flex items-center space-x-3 p-3 bg-black border-2 border-[#00FF88] rounded-none text-[#00FF88] hover:bg-[#00FF88] hover:text-black transition-all group"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Mail size={20} className="text-[#00FF88] group-hover:text-black transition-colors flex-shrink-0" />
                                    <span className="font-bold">{t.header.contactSupport}</span>
                                </motion.a>

                                {/* Buy Token - OpenOcean (Primary) */}
                                <motion.a
                                    href="https://app.openocean.finance/swap/bsc/BNB/CLZD"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center space-x-3 p-3 bg-black border-2 border-[#00FF88] rounded-none text-[#00FF88] hover:bg-[#00FF88] hover:text-black transition-all group"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <img src="/assets/openocean.png" alt="OpenOcean" className="w-5 h-5 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    <span className="font-bold">{t.header.buyToken} (OpenOcean)</span>
                                </motion.a>

                                {/* Buy Token - PancakeSwap */}
                                <motion.a
                                    href="https://pancakeswap.finance/swap?chain=bsc&inputCurrency=BNB&outputCurrency=0xa5996Fc5007dD2019F9a9Ff6c50c1c847Aa64444"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center space-x-3 p-3 bg-black border-2 border-[#00FF88] rounded-none text-[#00FF88] hover:bg-[#00FF88] hover:text-black transition-all group"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <img src="/assets/pancakeswap.png" alt="PancakeSwap" className="w-5 h-5 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    <span className="font-bold">{t.header.buyToken} (PancakeSwap)</span>
                                </motion.a>
                            </div>

                            {/* Wallet Section - Terminal Style */}
                            <div className="border-t-2 border-[#00FF88] pt-6">
                                {!account ? (
                                    <motion.button
                                        onClick={handleWalletConnect}
                                        className="w-full flex items-center justify-center space-x-2 p-3 bg-black border-2 border-[#00FF88] rounded-none text-[#00FF88] hover:bg-[#00FF88] hover:text-black transition-all font-bold"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span>🔗</span>
                                        <span>{t.wallet.connect}</span>
                                    </motion.button>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Character selection moved to Profile tab */}

                                        <div className="flex items-center space-x-3 p-3 bg-black border-2 border-[#00FF88] rounded-none">
                                            <div className={`w-3 h-3 rounded-none ${currentChainId === 56 ? 'bg-[#00FF88]' : 'bg-red-500'}`}></div>
                                            <span className="text-sm font-mono text-[#00FF88] font-bold">
                                                {account.slice(0, 6)}...{account.slice(-4)}
                                            </span>
                                        </div>

                                        <motion.button
                                            onClick={() => {
                                                setShowProfileModal(true);
                                                setShowMobileMenu(false);
                                            }}
                                            className="w-full flex items-center space-x-3 p-3 bg-black border-2 border-[#00FF88] rounded-none text-[#00FF88] hover:bg-[#00FF88] hover:text-black transition-all"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span>👤</span>
                                            <span className="font-bold">{t.wallet.profileSettings}</span>
                                        </motion.button>

                                        {isAdmin(account) && (
                                            <motion.button
                                                onClick={() => {
                                                    navigate('/admin');
                                                    setShowMobileMenu(false);
                                                }}
                                                className="w-full flex items-center space-x-3 p-3 bg-black border-2 border-yellow-500 rounded-none text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <span>👑</span>
                                                <span className="font-bold">{t.wallet.adminPanel}</span>
                                            </motion.button>
                                        )}

                                        <motion.button
                                            onClick={handleWalletDisconnect}
                                            className="w-full flex items-center justify-center space-x-2 p-3 bg-black border-2 border-[#00FF88] rounded-none text-[#00FF88] hover:bg-[#00FF88] hover:text-black transition-all font-bold"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span>🔌</span>
                                            <span>{t.wallet.disconnect}</span>
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Enhanced GameFi Profile Modal */}
            <AnimatePresence>
                {showProfileModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-black/90 p-4 overscroll-none"
                        style={{ zIndex: 60 }}
                        onClick={() => setShowProfileModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-black border-2 border-[#FFD700] shadow-2xl shadow-primary-gold/20 p-6 m-4 max-w-3xl w-full font-bbs max-h-[90dvh] overflow-y-auto pb-safe-bottom"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(255, 215, 0, 0.5) rgba(0, 0, 0, 0.3)'
                            }}
                        >
                            {/* Modern Header */}
                            <div className="text-center mb-6 border-b-2 border-[#FFD700]/30 pb-4">
                                <h2 className="text-2xl font-bold text-[#FFD700] text-glow-gold flex items-center justify-center gap-3">
                                    <span>🦎</span>
                                    <span>CRIME LIZARD PROFILE</span>
                                    <span>🦎</span>
                                </h2>
                            </div>

                            {/* Current Character Display - Prominent */}
                            {selectedCharacter && (
                                <div className="mb-6 bg-gradient-to-r from-[#FFD700]/20 to-neon-green/20 border-2 border-[#FFD700] p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {selectedCharacter.ipfsImageHash ? (
                                                <div
                                                    className="w-16 h-16 border-2 border-neon-green rounded overflow-hidden cursor-pointer hover:border-[#FFD700] transition-all"
                                                    onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${selectedCharacter.ipfsImageHash}`, '_blank')}
                                                >
                                                    <img
                                                        src={`https://gateway.pinata.cloud/ipfs/${selectedCharacter.ipfsImageHash}`}
                                                        alt={selectedCharacter.name}
                                                        className="w-full h-full object-contain bg-black/40"
                                                        onError={(e) => {
                                                            // Fallback to token number display on error
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            const fallback = document.createElement('div');
                                                            fallback.className = 'w-16 h-16 border-2 border-neon-green bg-black flex items-center justify-center text-2xl font-bold text-neon-green';
                                                            fallback.textContent = `#${selectedCharacter.tokenId.toString().slice(-2)}`;
                                                            (e.target as HTMLImageElement).parentElement?.appendChild(fallback);
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 border-2 border-neon-green bg-black flex items-center justify-center text-2xl font-bold text-neon-green">
                                                    #{selectedCharacter.tokenId.toString().slice(-2)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-[#FFD700] font-bold text-lg text-glow-gold flex items-center gap-2">
                                                    {selectedCharacter.name}
                                                    <span className="text-xs text-[#00FF88] border border-[#00FF88] px-2 py-0.5">ACTIVE</span>
                                                </div>
                                                <div className="text-sm text-green-400 flex items-center gap-3 mt-1">
                                                    <span>💰 {parseInt(selectedCharacter.goldBalance || '0').toLocaleString()} GOLD</span>
                                                    <span className="text-gray-400">|</span>
                                                    <span>🆔 #{selectedCharacter.tokenId.toString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {(() => {
                                                const gameData = characterGameData.get(selectedCharacter.tokenId.toString());
                                                if (gameData) {
                                                    return (
                                                        <div className="space-y-1">
                                                            <div className={`font-bold ${gameData.isDead ? 'text-red-400' : 'text-green-400'}`}>
                                                                {gameData.isDead ? '💀 DEAD' : '❤️ ALIVE'}
                                                            </div>
                                                            {!gameData.isDead && (
                                                                <div className="text-xs text-[#00FF88]">
                                                                    HP: {gameData.health}/{gameData.maxHealth}
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-[#FFD700]">
                                                                📍 {gameData.location.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                {/* Wallet Address */}
                                <div>
                                    <label className="block text-sm font-bold text-[#FFD700] mb-2">
                                        ▸ WALLET ADDRESS
                                    </label>
                                    <div className="bg-black/60 border-2 border-[#00FF88]/30 p-3">
                                        <code className="text-xs text-green-400 break-all font-mono">{account}</code>
                                    </div>
                                </div>

                                {/* Username - Always Visible in Chat */}
                                <div>
                                    <label className="block text-sm font-bold text-[#FFD700] mb-2">
                                        ▸ CHAT USERNAME <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.username}
                                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                        placeholder="Enter your chat username"
                                        className="w-full bg-black/60 border-2 border-[#00FF88]/50 px-4 py-3 text-green-400 placeholder-green-700 focus:border-[#FFD700] focus:outline-none text-sm"
                                        maxLength={32}
                                    />
                                    <p className="text-xs text-[#00DD77] mt-1">
                                        › Displayed in all chat messages & synced to your NFT characters
                                    </p>
                                </div>

                                {/* Social Handles - GameFi Integration */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Telegram */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#FFD700] mb-2">
                                            ▸ TELEGRAM HANDLE
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#00FF88] font-bold">@</span>
                                            <input
                                                type="text"
                                                value={profile.telegramUsername}
                                                onChange={(e) => setProfile({ ...profile, telegramUsername: e.target.value.replace('@', '') })}
                                                placeholder="YourTelegramHandle"
                                                className="flex-1 bg-black/60 border-2 border-[#00FF88]/50 px-3 py-2 text-green-400 placeholder-green-700 focus:border-[#FFD700] focus:outline-none text-sm"
                                                maxLength={32}
                                            />
                                        </div>
                                        <p className="text-xs text-[#00DD77] mt-1">
                                            › For TG bot stats & notifications
                                        </p>
                                    </div>

                                    {/* Twitter/X */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#FFD700] mb-2">
                                            ▸ X (TWITTER) HANDLE
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#00FF88] font-bold">@</span>
                                            <input
                                                type="text"
                                                value={profile.twitterUsername}
                                                onChange={(e) => setProfile({ ...profile, twitterUsername: e.target.value.replace('@', '') })}
                                                placeholder="YourTwitterHandle"
                                                className="flex-1 bg-black/60 border-2 border-[#00FF88]/50 px-3 py-2 text-green-400 placeholder-green-700 focus:border-[#FFD700] focus:outline-none text-sm"
                                                maxLength={32}
                                            />
                                        </div>
                                        <p className="text-xs text-[#00DD77] mt-1">
                                            › Shown on NFT marketplaces
                                        </p>
                                    </div>
                                </div>

                                {/* NFT Characters Overview */}
                                {userCharacters.length > 0 && (
                                    <div className="border-t-2 border-[#FFD700]/30 pt-6">
                                        <h3 className="text-lg font-bold text-[#FFD700] mb-4 flex items-center gap-2 text-glow-gold">
                                            🎮 YOUR NFT CHARACTERS ({userCharacters.length})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2"
                                            style={{
                                                scrollbarWidth: 'thin',
                                                scrollbarColor: 'rgba(0, 255, 0, 0.5) rgba(0, 0, 0, 0.3)'
                                            }}
                                        >
                                            {userCharacters.map((char) => {
                                                const gameData = characterGameData.get(char.tokenId.toString());
                                                const isSelected = selectedCharacter?.tokenId === char.tokenId;
                                                const nftImage = char.metadata?.image || 'http://crimelizard.tech/assets/lizard.png';

                                                return (
                                                    <motion.div
                                                        key={char.tokenId.toString()}
                                                        className={`bg-black/60 border-2 p-3 transition-all cursor-pointer ${isSelected
                                                                ? 'border-[#FFD700] bg-[#FFD700]/10'
                                                                : 'border-[#00FF88]/30 hover:border-[#00FF88]/50'
                                                            }`}
                                                        onClick={() => {
                                                            if (!isSelected) {
                                                                selectCharacter(char.tokenId);
                                                                toast.success(`Switched to ${char.name}! 🦎`);
                                                            }
                                                        }}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className={`w-12 h-12 border-2 overflow-hidden cursor-pointer transition-all hover:border-[#FFD700] ${isSelected ? 'border-[#FFD700]' : 'border-neon-green'}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // Open image in new tab
                                                                        window.open(nftImage, '_blank');
                                                                    }}
                                                                >
                                                                    <img
                                                                        src={nftImage}
                                                                        alt={char.name}
                                                                        className="w-full h-full object-contain bg-black/40"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = '/assets/lizard.png';
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <p className="text-green-400 font-bold text-sm flex items-center gap-2">
                                                                        {char.name}
                                                                        {isSelected && (
                                                                            <span className="text-xs text-[#FFD700] border border-[#FFD700] px-1.5 py-0.5">
                                                                                ACTIVE
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                    <p className="text-xs text-[#00DD77] font-mono">
                                                                        ID #{char.tokenId.toString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm text-[#FFD700] font-bold">
                                                                    {parseInt(char.goldBalance || '0').toLocaleString()} 🪙
                                                                </p>
                                                                {gameData && (
                                                                    <p className="text-xs text-[#00FF88] mt-1">
                                                                        ⭐ Lv {gameData.level}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {gameData && (
                                                            <div className="flex items-center justify-between text-xs border-t border-[#00FF88]/20 pt-2 mt-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`font-bold ${gameData.isDead ? 'text-red-400' : 'text-green-400'}`}>
                                                                        {gameData.isDead ? '💀 DEAD' : '❤️ ALIVE'}
                                                                    </span>
                                                                    {!gameData.isDead && (
                                                                        <span className="text-[#00FF88] font-mono">
                                                                            {gameData.health}/{gameData.maxHealth} HP
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {gameData.isOnline && (
                                                                        <span className="text-green-400 animate-pulse">🟢</span>
                                                                    )}
                                                                    <span className="text-[#FFD700]">
                                                                        📍 {gameData.location.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>

                                        {/* Create New Character Button */}
                                        <motion.button
                                            onClick={() => {
setShowProfileModal(false);
                                                // Call the context handler to show character creation
                                                showCharacterCreation();
                                            }}
                                            className="w-full mt-4 bg-black border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00FF88] hover:text-black py-3 px-4 font-bold transition-all flex items-center justify-center gap-2"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span className="text-xl">🦎</span>
                                            <span>CREATE NEW CHARACTER</span>
                                        </motion.button>

                                        <p className="text-xs text-[#00DD77] mt-3 text-center border-t border-[#00FF88]/20 pt-3">
                                            › Profile settings auto-sync to all NFTs you own. Updates when traded.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6 border-t-2 border-[#FFD700]/30 pt-6">
                                <motion.button
                                    onClick={() => {
                                        setShowProfileModal(false);
                                        loadProfile(); // Reset on cancel
                                    }}
                                    className="flex-1 bg-black border-2 border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white py-3 px-4 font-bold transition-all"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    [ESC] CANCEL
                                </motion.button>
                                <motion.button
                                    onClick={saveProfile}
                                    disabled={saving || !profile.username.trim() || !selectedCharacter}
                                    className="flex-1 bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black hover:shadow-lg hover:shadow-primary-gold/20 disabled:bg-black/40 disabled:border-[#00AA55]/50 disabled:text-[#00BB66] disabled:cursor-not-allowed py-3 px-4 font-bold transition-all"
                                    whileHover={!saving && profile.username.trim() && selectedCharacter ? { scale: 1.02 } : {}}
                                    whileTap={!saving && profile.username.trim() && selectedCharacter ? { scale: 0.98 } : {}}
                                >
                                    {saving ? '⋯ SAVING...' : `💾 SAVE PROFILE (${PROFILE_SAVE_COST} 💰 GOLD)`}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rewards Modal */}
            <AnimatePresence>
                {showRewardsModal && (
                    <RewardsModal onClose={() => setShowRewardsModal(false)} />
                )}
            </AnimatePresence>

            {/* How to Play Modal */}
            <HowToPlay isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
        </>
    );
}

export default EnhancedHeader;
