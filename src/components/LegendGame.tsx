import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletContext } from '../providers/WalletContext';
import { useCharacter } from '../contexts/CharacterContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { PlayerCharacter, GameLocation } from '../types/legend.types';
import TerminalTownSquare from './legend/TerminalTownSquare';
import TerminalCombat from './legend/TerminalCombat';
import TownOverworld from './legend/TownOverworld';
import CharacterSheet from './legend/CharacterSheet';
import CharacterProfile from './legend/CharacterProfile';
import DailySysopMessage from './legend/DailySysopMessage';
import MultiplayerFeed from './legend/MultiplayerFeed';
import WeeklyLeaderboard from './legend/WeeklyLeaderboard';
import QuestLog from './legend/QuestLog';
import QuestNotifications from './QuestNotifications';
import MultiplayerBossCombat, { type BattleRaid } from './legend/MultiplayerBossCombat';
import DeathScreen from './legend/DeathScreen';
import CharacterCreationV2 from './legend/CharacterCreationV2';
import QuestCompleteCelebration from './legend/QuestCompleteCelebration';
import { useQuests } from '../contexts/QuestContext';
import { useLegendAI } from '../services/LegendAI';
import { CHARACTER_CONTRACT_ADDRESS } from '../characterAbi';
import { useLegendGame } from '../contexts/LegendGameContext';

interface LegendGameProps {
    use2DMapDefault?: boolean;
}

const LegendGameComponent: React.FC<LegendGameProps> = ({ use2DMapDefault = false }) => {
const { account, currentChainId } = useContext(WalletContext);
    const { selectedCharacter, userCharacters } = useCharacter();
    const { t } = useLanguage();
    const legendGame = useLegendGame() as any;
    const { notifications, markNotificationRead, getQuest } = useQuests();
    const [player, setPlayer] = useState<PlayerCharacter | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [showCharSheet, setShowCharSheet] = useState(false);
    const [showCharProfile, setShowCharProfile] = useState(false);
    const [showDailyMessage, setShowDailyMessage] = useState(false);
    const [showWeeklyLeaderboard, setShowWeeklyLeaderboard] = useState(false);
    const [showQuestLog, setShowQuestLog] = useState(false);
    const [showBossBattle, setShowBossBattle] = useState(false);
    const [questCelebrationData, setQuestCelebrationData] = useState<any>(null);
    const [showCharacterCreation, setShowCharacterCreation] = useState(false);
    const [currentRaid, setCurrentRaid] = useState<any>(null);
    const [gameMessage, setGameMessage] = useState<string>('');
    const [showDeathScreen, setShowDeathScreen] = useState(false);
    const [deathCause, _setDeathCause] = useState<string>('');
    const [killedBy, _setKilledBy] = useState<string>('');
    // 2D Map view toggle - controlled by prop (main route = terminal, /testee = 2D)
    const [use2DMap, setUse2DMap] = useState(use2DMapDefault);
    // Track which modal to show when entering a location from 2D map
    const [activeLocationModal, setActiveLocationModal] = useState<string | null>(null);
    // Intro sequence removed - going straight to game

    // AI Integration
    const ai = useLegendAI(player);
    const aiInitializedRef = useRef(false);
    const aiRef = useRef(ai); // Store AI ref to avoid dependency issues

    // Update aiRef when ai changes
    useEffect(() => {
        aiRef.current = ai;
    }, [ai]);

    // Listen for quest completion notifications and trigger celebration
    useEffect(() => {
        const completionNotifications = notifications.filter(
            n => n.type === 'quest_complete' && !n.read
        );

        if (completionNotifications.length > 0) {
            const latestCompletion = completionNotifications[0];
            const quest = getQuest(latestCompletion.questId);

            if (quest) {
                // Prepare rewards for celebration
                const rewards = [];
                if (quest.rewards?.gold && quest.rewards.gold > 0) {
                    rewards.push({ type: 'gold' as const, amount: quest.rewards.gold });
                }
                if (quest.rewards?.experience && quest.rewards.experience > 0) {
                    rewards.push({ type: 'xp' as const, amount: quest.rewards.experience });
                }
                if (quest.rewards?.items && quest.rewards.items.length > 0) {
                    quest.rewards.items.forEach(item => {
                        if (typeof item === 'string') {
                            rewards.push({
                                type: 'item' as const,
                                itemName: item,
                                description: 'New Item'
                            });
                        }
                    });
                }

                // Trigger celebration
                setQuestCelebrationData({
                    title: quest.title,
                    description: quest.description,
                    rewards
                });

                // Mark notification as read
                markNotificationRead(latestCompletion.id);
            }
        }
    }, [notifications, getQuest, markNotificationRead]);

    // Cleanup on unmount
    useEffect(() => {
return () => {
};
    }, []);

    // Character creation is now handled by CharacterEntry component

    const [charProfileTab, setCharProfileTab] = useState<'stats' | 'equipment' | 'inventory' | 'status'>('stats');

    const loadPlayerData = useCallback(async (tokenId: number) => {
        try {
            // Ensure tokenId is properly converted to string for URL
            const tokenIdStr = tokenId.toString();
            const response = await fetch(`/api/legend/player/${account}/${tokenIdStr}`);

            if (response.ok) {
                const data = await response.json();
// GameFi Best Practice: Always return players to town on session start
                // Combat state is not preserved across page refreshes, so starting mid-combat would be confusing
                if (data.location !== 'town') {
                    data.location = 'town';

                    // Save the location change to database
                    fetch('/api/legend/player/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            walletAddress: account,
                            tokenId: tokenId,
                            location: 'town'
                        })
                    }).catch(err => console.error('Failed to save location:', err));
                }

                // Always check ganking status (whether they slept safely or not)
                // This ensures the sleptSafely flag is reset when players come back online
                if (data.gold > 0) {
                    // Call ganking check endpoint
                    const gankResponse = await fetch('/api/legend/check-ganking', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            walletAddress: account,
                            tokenId: tokenId
                        })
                    });

                    if (gankResponse.ok) {
                        const gankData = await gankResponse.json();
                        if (gankData.ganked) {
                            setGameMessage(
                                t.legend.messages.gankedMessage.replace('{goldLost}', gankData.goldLost.toString())
                            );
                            // Update player with reduced gold
                            data.gold = gankData.newGold;
                        }
                        // Always reset the sleptSafely flag when player comes back online
                        data.sleptSafely = false;
                    }
                } else {
                    // Even if player has no gold, reset the sleptSafely flag
                    data.sleptSafely = false;
                }

                setPlayer(data);

                // Check if player is dead
                if (data.isDead || data.health <= 0) {
setShowDeathScreen(true);
                }
            } else {
                const errorText = await response.text();
                console.error('❌ Failed to load player data:', response.status, errorText);
                // Show error message
                setGameMessage(t.legend.messages.failedToLoadCharacter);
            }
        } catch (error) {
            console.error('❌ Error loading player:', error);
            // Show error message
            setGameMessage(t.legend.messages.failedToLoadCharacter);
        }
    }, [account, t.legend.messages]);

    const loadPlayerDataForSelectedCharacter = useCallback(async () => {
        if (!selectedCharacter) return;

        try {
            setLoadingMessage(t.legend.loading.checkingCharacters);

            // Convert bigint tokenId to number for API call
            const tokenIdNumber = Number(selectedCharacter.tokenId);
await loadPlayerData(tokenIdNumber);

            // Check for daily message
            const lastSeen = localStorage.getItem('lastSysopMessageDate');
            const today = new Date().toDateString();
            if (lastSeen !== today) {
                setShowDailyMessage(true);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading player data:', error);
            setLoading(false);
        }
    }, [selectedCharacter, t.legend.loading.checkingCharacters, loadPlayerData]);

    // Initialize AI when player is loaded
    useEffect(() => {
        if (player && !aiInitializedRef.current) {
ai.initialize();
            aiInitializedRef.current = true;
        }
        // Explicitly return undefined to satisfy React
        return undefined;
    }, [player, ai]);

    // Load player data when character is selected
    // Use a ref to track the last loaded character to prevent duplicate loads
    const lastLoadedCharacterIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!account) {
            setLoading(false);
            return undefined;
        }

        if (!selectedCharacter) {
            // No character selected yet - wait for CharacterContext to load
            // Don't immediately show character creation if we're still loading
            // Check localStorage to see if we had a character before
            const savedCharacterId = localStorage.getItem('selectedCharacterId');

            if (savedCharacterId && userCharacters.length === 0) {
                // We had a character, but characters haven't loaded yet - keep loading
                return undefined;
            } else {
                // Has characters but none selected - CharacterContext should auto-select
                // CharacterEntry ensures characters exist before rendering LegendGame
                setLoading(false);
            }
            return undefined;
        }

        // Character is selected - check if we need to load their game data
        const currentCharacterId = selectedCharacter.tokenId.toString();
        if (lastLoadedCharacterIdRef.current !== currentCharacterId) {
            lastLoadedCharacterIdRef.current = currentCharacterId;
            loadPlayerDataForSelectedCharacter();
        }
        return undefined;
    }, [account, selectedCharacter, userCharacters.length, loadPlayerDataForSelectedCharacter]);

    const updatePlayer = useCallback((updates: Partial<PlayerCharacter>, options?: { skipImmediateSave?: boolean }) => {
        setPlayer(prevPlayer => {
            if (!prevPlayer) return null;

            const newPlayer = { ...prevPlayer, ...updates };

            // Check for death
            if (updates.health !== undefined && updates.health <= 0 && !prevPlayer.isDead) {
setShowDeathScreen(true);
            }

            // Check for respawn
            if (updates.isDead === false && prevPlayer.isDead) {
setShowDeathScreen(false);
                setGameMessage('You have been resurrected! You have 5 minutes of PVP protection.');
            }

            // Broadcast significant events
            if (updates.level && updates.level > prevPlayer.level) {
                aiRef.current.broadcastAction({
                    type: 'level_up',
                    player: {
                        name: prevPlayer.name,
                        address: prevPlayer.walletAddress,
                        level: updates.level
                    },
                    details: { newLevel: updates.level }
                });
            }

            if (updates.hasDefeatedCrimeLord && !prevPlayer.hasDefeatedCrimeLord) {
                aiRef.current.broadcastAction({
                    type: 'crime_lord_defeated',
                    player: {
                        name: prevPlayer.name,
                        address: prevPlayer.walletAddress,
                        level: prevPlayer.level
                    },
                    details: { timestamp: new Date() }
                });
            }

            // Trigger immediate save for critical updates (equipment, inventory, gold, health, combat stats, core stats)
            if (!options?.skipImmediateSave &&
                (updates.weapon !== undefined || updates.armor !== undefined ||
                 updates.inventory !== undefined || updates.equippedAccessories !== undefined ||
                 updates.gold !== undefined || updates.health !== undefined ||
                 updates.enemiesDefeated !== undefined || updates.heistsCompleted !== undefined ||
                 updates.goldStolen !== undefined || updates.experience !== undefined ||
                 updates.level !== undefined || updates.turnsRemaining !== undefined ||
                 updates.goldGivenToPoor !== undefined || updates.charm !== undefined ||
                 updates.strength !== undefined || updates.defense !== undefined ||
                 updates.maxHealth !== undefined)) {
                // Use setTimeout to avoid calling save during render
                // We'll make an inline save call to avoid circular dependency
                setTimeout(async () => {
                    if (!newPlayer) return;
                    try {
                        const contractAddress = CHARACTER_CONTRACT_ADDRESS.mainnet;

                        await fetch('/api/legend/player/save', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...newPlayer,
                                contractAddress: contractAddress?.toLowerCase()
                            })
                        });
                    } catch (error) {
                        console.error('Error saving player:', error);
                    }
                }, 0);
            }

            return newPlayer;
        });
    }, [currentChainId]); // Only dependency on currentChainId

    const savePlayerData = useCallback(async () => {
        if (!player) return;

        try {
            // Get the mainnet contract address
            const contractAddress = CHARACTER_CONTRACT_ADDRESS.mainnet;

            const response = await fetch('/api/legend/player/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...player,
                    contractAddress: contractAddress?.toLowerCase()
                })
            });

            if (response.ok) {
                await response.json();
            }
        } catch (error) {
            console.error('Error saving player:', error);
        }
    }, [player, currentChainId]);

    // Save player data and change location in one operation
    // Ensures stats are persisted before transitioning between game modes
    const saveAndChangeLocation = useCallback(async (newLocation: PlayerCharacter['location']) => {
        if (!player) return;
// Save current state first
        await savePlayerData();

        // Then update location
        updatePlayer({ location: newLocation });

        // Track exploration for quest objectives
        if (selectedCharacter && account) {
            try {
                await fetch('/api/quests/track-exploration', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        walletAddress: account.toLowerCase(),
                        tokenId: Number(selectedCharacter.tokenId),
                        location: newLocation
                    })
                });
} catch (error) {
                console.error('Failed to track exploration:', error);
            }
        }
}, [player, savePlayerData, updatePlayer, selectedCharacter, account]);

    // Sync gold from blockchain to Legend player state
    // Used after casino/dice wins to keep Legend game state in sync
    const syncGoldFromBlockchain = useCallback(async () => {
        if (!player || !selectedCharacter) return;

        try {
// Fetch current blockchain gold balance
            const response = await fetch(`/api/legend/player/${account}/${selectedCharacter.tokenId.toString()}`);
            if (response.ok) {
                const freshData = await response.json();

                // Update player gold from blockchain
                if (freshData.gold !== undefined) {
                    updatePlayer({ gold: freshData.gold });
}
            }
        } catch (error) {
            console.error('Failed to sync gold from blockchain:', error);
        }
    }, [player, selectedCharacter, account, updatePlayer]);

    // Auto-save every 30 seconds
    useEffect(() => {
        if (player) {
            const interval = setInterval(savePlayerData, 30000);
            return () => clearInterval(interval);
        }
        return undefined;
    }, [player, savePlayerData]);

    // Online heartbeat - update every 2 minutes
    useEffect(() => {
        if (!player || !account) {
            return undefined;
        }

        const sendHeartbeat = async () => {
            try {
                await fetch('/api/legend/players/heartbeat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        walletAddress: account,
                        tokenId: player.tokenId
                    })
                });
            } catch (error) {
                console.error('Error sending heartbeat:', error);
            }
        };

        // Send initial heartbeat
        sendHeartbeat();

        // Send heartbeat every 2 minutes
        const interval = setInterval(sendHeartbeat, 120000);

        // GameFi Best Practice: Sync pending gold at session end
        return () => {
            clearInterval(interval);

            // Mark as offline
            fetch('/api/legend/players/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: account,
                    tokenId: player.tokenId,
                    isOnline: false
                })
            }).catch(console.error);

            // Sync pending gold to blockchain
            fetch('/api/legend/session/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: account,
                    tokenId: player.tokenId
                })
            }).then(res => res.json())
                .then(data => {
                    if (data.goldSynced > 0) {
}
                })
                .catch(console.error);
        };
    }, [player?.tokenId, account]);

    // Register handlers for EnhancedHeader and context
    // Update handlers whenever player or functions change
    useEffect(() => {
        if (legendGame.registerHandlers) {
            legendGame.registerHandlers({
                showCharSheet: () => setShowCharSheet(true),
                showInventory: () => {
                    setCharProfileTab('inventory');
                    setShowCharProfile(true);
                },
                showLeaderboard: () => setShowWeeklyLeaderboard(true),
                showQuestLog: () => setShowQuestLog(true),
                showCharacterCreation: () => setShowCharacterCreation(true),
                showStatus: () => {
                    setCharProfileTab('status');
                    setShowCharProfile(true);
                },
                // Expose player state and sync functions to context
                player,
                updatePlayer,
                savePlayerData,
                saveAndChangeLocation,
                syncGoldFromBlockchain,
            });
        }
    }, [legendGame.registerHandlers, player, updatePlayer, savePlayerData, saveAndChangeLocation, syncGoldFromBlockchain]);

    // Character creation is now handled by CharacterEntry
    if (!account) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-black border-2 border-[#00FF88] rounded-xl p-8 text-center shadow-xl shadow-[#00FF88]/20"
                >
                    <img
                        src="/base-images/base-4-robin_hood.png"
                        alt="Crime Lizard"
                        className="w-32 h-32 mx-auto mb-4 object-contain"
                    />
                    <h2 className="text-3xl font-bold text-[#00FF88] mb-4 font-retro">
                        {t.legend.loading.connectWallet}
                    </h2>
                    <p className="text-gray-300 mb-6 font-retro">
                        {t.legend.loading.connectWalletMessage}
                    </p>
                </motion.div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="text-6xl mb-4"
                    >
                        🦎
                    </motion.div>
                    <p className="text-[#00FF88] font-retro text-lg">
                        {loadingMessage || t.common.loading}
                    </p>
                </div>
            </div>
        );
    }

    // If no character is selected but user has characters, show message
    if (!selectedCharacter && userCharacters.length > 0 && !loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-black border-2 border-[#00FF88] rounded-xl p-8 text-center shadow-xl shadow-[#00FF88]/20"
                >
                    <div className="text-6xl mb-4">🦎</div>
                    <h2 className="text-3xl font-bold text-[#00FF88] mb-4 font-retro">
                        Select Your Character
                    </h2>
                    <p className="text-gray-300 mb-6 font-retro">
                        Choose a character from the header menu to start playing Crime Lizard Legends!
                    </p>
                    <div className="text-[#00FF88] font-retro">
                        ↑ Look for the character selector in the header ↑
                    </div>
                </motion.div>
            </div>
        );
    }

    // CharacterEntry ensures a character is selected before rendering LegendGame
    // If no player could be loaded, show error
    if (!player && !loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-black border-2 border-red-500 rounded-xl p-8 text-center shadow-xl shadow-red-500/20"
                >
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-3xl font-bold text-red-500 mb-4 font-retro">
                        {t.legend.loading.failedToLoad}
                    </h2>
                    <p className="text-gray-300 mb-6 font-retro">
                        {t.legend.loading.failedMessage}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00BB66] font-bbs text-lg rounded-lg"
                    >
                        {t.legend.loading.refresh}
                    </button>
                </motion.div>
            </div>
        );
    }

    // Player should be loaded at this point
    if (!player) {
        return null; // Shouldn't reach here, but TypeScript needs this
    }

    const handleRespawn = async () => {
// Reload player data to get updated stats from server
        if (selectedCharacter) {
            await loadPlayerData(Number(selectedCharacter.tokenId));
            setShowDeathScreen(false);
        }
    };

    // Intro sequence removed - no useEffect needed

    return (
        <div className="bg-black text-[#00FF88] legend-game pb-0">
            {/* Quest Notifications */}
            <QuestNotifications />

            {/* Death Screen - Highest Priority */}
            <AnimatePresence>
                {showDeathScreen && player && (
                    <DeathScreen
                        player={player}
                        onRespawn={handleRespawn}
                        causeOfDeath={deathCause}
                        killedBy={killedBy}
                    />
                )}
            </AnimatePresence>

            {/* Game Message Bar - Terminal Style */}
            <AnimatePresence>
                {gameMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-24 left-1/2 transform -translate-x-1/2 z-system-message max-w-2xl w-full mx-4"
                    >
                        <div className="bg-black border-2 border-yellow-500 p-4 text-center shadow-xl font-bbs">
                            <pre className="text-yellow-500 text-glow-gold text-sm mb-2">
                                {`╔════════════════════════════════════════╗
║          ${t.legend.messages.systemMessage}         ║
╚════════════════════════════════════════╝`}
                            </pre>
                            <p className="text-white text-lg">{gameMessage}</p>
                            <button
                                onClick={() => setGameMessage('')}
                                className="mt-3 px-6 py-2 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00BB66] font-bbs text-lg"
                            >
                                {t.legend.messages.enterButton}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Daily Sysop Message */}
            <AnimatePresence>
                {showDailyMessage && (
                    <DailySysopMessage onClose={() => setShowDailyMessage(false)} />
                )}
            </AnimatePresence>

            {/* Multiplayer Activity Feed */}
            <MultiplayerFeed />

            {/* Main Game Area */}
            <main className={use2DMap && player.location === 'town' ? '' : 'container mx-auto px-4 py-6'}>
                {player.location === 'forest' || player.location === 'castle' || player.location === 'crime_lord_lair' ? (
                    <TerminalCombat
                        key="combat"
                        player={player}
                        updatePlayer={updatePlayer}
                        setGameMessage={setGameMessage}
                        ai={ai}
                        saveAndChangeLocation={saveAndChangeLocation}
                    />
                ) : use2DMap && player.location === 'town' ? (
                    <TownOverworld
                        key="town-2d"
                        player={player}
                        archetype={selectedCharacter?.archetype}
                        onEnterLocation={(location: GameLocation | string) => {
                            // Handle location entry from 2D map
                            // Combat locations change player.location directly
                            if (location === 'forest' || location === 'castle' || location === 'crime_lord_lair') {
                                saveAndChangeLocation(location as GameLocation);
                            } else if (location === 'casino') {
                                // Full scene - use TerminalTownSquare's casino modal
                                setUse2DMap(false);
                                setActiveLocationModal('casino');
                            } else if (location === 'dice') {
                                setUse2DMap(false);
                                setActiveLocationModal('dice');
                            } else if (location === 'predictions') {
                                setUse2DMap(false);
                                setActiveLocationModal('predictions');
                            } else {
                                // Modal locations - switch to terminal mode with that modal open
                                setUse2DMap(false);
                                setActiveLocationModal(location);
                            }
                        }}
                        onOpenCharSheet={() => setShowCharSheet(true)}
                        onOpenInventory={() => {
                            setCharProfileTab('inventory');
                            setShowCharProfile(true);
                        }}
                    />
                ) : (
                    <TerminalTownSquare
                        key="town"
                        player={player}
                        updatePlayer={updatePlayer}
                        setGameMessage={setGameMessage}
                        ai={ai}
                        saveAndChangeLocation={saveAndChangeLocation}
                        onBossBattleStart={(raid: BattleRaid) => {
                            setCurrentRaid(raid);
                            setShowBossBattle(true);
                        }}
                        onShowCharProfile={() => {
                            setCharProfileTab('stats'); // Always open to stats tab when clicking character name
                            setShowCharProfile(true);
                        }}
                        initialModal={activeLocationModal}
                        onModalClose={() => {
                            // When modal closes, return to 2D map
                            setActiveLocationModal(null);
                            setUse2DMap(true);
                        }}
                    />
                )}
            </main>

            {/* Character Sheet Modal */}
            <AnimatePresence>
                {showCharSheet && (
                    <CharacterSheet
                        player={player}
                        updatePlayer={updatePlayer}
                        onClose={() => setShowCharSheet(false)}
                    />
                )}
                {showCharProfile && (
                    <CharacterProfile
                        player={player}
                        updatePlayer={updatePlayer}
                        onClose={() => {
                            setShowCharProfile(false);
                            setCharProfileTab('stats'); // Reset to default tab when closing
                        }}
                        setGameMessage={setGameMessage}
                        defaultTab={charProfileTab}
                    />
                )}
                {showWeeklyLeaderboard && (
                    <WeeklyLeaderboard
                        onClose={() => setShowWeeklyLeaderboard(false)}
                    />
                )}
                {showQuestLog && (
                    <QuestLog
                        onClose={() => setShowQuestLog(false)}
                    />
                )}
                {questCelebrationData && (
                    <QuestCompleteCelebration
                        questTitle={questCelebrationData.title}
                        questDescription={questCelebrationData.description}
                        rewards={questCelebrationData.rewards}
                        onClose={() => {
                            setQuestCelebrationData(null);
                            // Reload player data to get updated stats
                            if (selectedCharacter) {
                                loadPlayerData(Number(selectedCharacter.tokenId));
                            }
                        }}
                    />
                )}
                {showBossBattle && currentRaid && (
                    <MultiplayerBossCombat
                        raid={currentRaid}
                        player={player!}
                        onBattleEnd={async (victory, rewards) => {
                            setShowBossBattle(false);
                            const raid = currentRaid;
                            setCurrentRaid(null);

                            // Complete the raid on the backend and clean up queue
                            try {
                                // Get survivors (party members with HP > 0)
                                const survivors = raid.partyMembers.filter((member: any) => member.currentHP > 0);

                                await fetch('/api/legend/boss-queue/complete', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        raidId: raid.id,
                                        victory,
                                        survivors: survivors.map((member: any) => ({
                                            walletAddress: member.walletAddress,
                                            name: member.name
                                        }))
                                    })
                                });
} catch (error) {
                                console.error('Failed to complete boss queue:', error);
                            }

                            if (victory) {
                                // Apply rewards to player
                                updatePlayer({
                                    gold: player!.gold + rewards.gold,
                                    experience: player!.experience + rewards.xp
                                });
                                setGameMessage(
                                    t.legend.messages.victoryRewards
                                        .replace('{gold}', rewards.gold.toString())
                                        .replace('{xp}', rewards.xp.toString())
                                        .replace('{loot}', rewards.specialLoot.join(', '))
                                );

                                // Track boss defeat for quest objectives
                                if (selectedCharacter && account && raid) {
                                    try {
                                        await fetch('/api/quests/track-combat', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                walletAddress: account.toLowerCase(),
                                                tokenId: Number(selectedCharacter.tokenId),
                                                enemyId: raid.bossId,
                                                location: 'multiplayer_boss',
                                                goldEarned: rewards.gold
                                            })
                                        });
} catch (error) {
                                        console.error('Failed to track boss defeat:', error);
                                    }
                                }
                            } else {
                                setGameMessage(t.legend.messages.defeatMessage);
                            }
                        }}
                    />
                )}
                {showCharacterCreation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-modal-elevated overflow-y-auto"
                    >
                        <CharacterCreationV2
                            onCharacterCreated={async (_tokenId: number) => {
setShowCharacterCreation(false);
                                // Character context will auto-refresh and load the new character
                                setGameMessage('✅ Character created successfully! Refreshing...');
                                // Force reload to pick up the new character
                                window.location.reload();
                            }}
                            onCancel={() => {
                                setShowCharacterCreation(false);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Export directly without memo to allow proper navigation
export default LegendGameComponent;
