import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { PlayerCharacter } from '../../types/legend.types';
import { useModalClose } from '../../hooks/useModalClose';

interface CharacterSheetProps {
    player: PlayerCharacter;
    onClose: () => void;
    updatePlayer?: (updates: Partial<PlayerCharacter>) => void;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ player, onClose, updatePlayer }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose);

    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(player.name);
    const [nameError, setNameError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState('');

    // Update character name
    const handleUpdateName = async () => {
        if (!newName || newName.trim() === player.name) {
            setIsEditingName(false);
            setNameError('');
            return;
        }

        // Validate name
        const trimmedName = newName.trim();
        if (trimmedName.length < 3 || trimmedName.length > 20) {
            setNameError('Name must be between 3 and 20 characters');
            return;
        }

        if (!/^[a-zA-Z0-9 -]+$/.test(trimmedName)) {
            setNameError('Only letters, numbers, spaces, and hyphens allowed');
            return;
        }

        try {
const response = await fetch('/api/legend/player/update-name', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    newName: trimmedName
                })
            });
const data = await response.json();
if (!response.ok) {
                setNameError(data.error || 'Failed to update name');
                return;
            }

            // Update local state via updatePlayer callback if provided
            if (updatePlayer) {
                updatePlayer({ name: trimmedName });
            } else {
                player.name = trimmedName; // Fallback for direct mutation
            }

            setSuccessMessage('✅ Name updated successfully!');
            setIsEditingName(false);
            setNameError('');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error updating name:', error);
            setNameError('Failed to update name. Please try again.');
        }
    };

    // Sync name to NFT (IPFS + On-Chain)
    const handleSyncToNFT = async () => {
        if (!player.walletAddress || !player.tokenId) {
            setSyncError('Missing wallet or token information');
            return;
        }

        setIsSyncing(true);
        setSyncError('');

        try {
            const response = await fetch('/api/legend/player/sync-name-to-nft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setSyncError(data.error || 'Failed to sync to NFT');
                setIsSyncing(false);
                return;
            }

            setSuccessMessage('✅ Name synced to NFT! (IPFS + Blockchain)');
            setIsSyncing(false);

            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            console.error('Error syncing to NFT:', error);
            setSyncError('Failed to sync. Please try again.');
            setIsSyncing(false);
        }
    };

    const modalContent = (

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 overscroll-none"
            style={{ zIndex: 9999 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border-2 border-[#00FF88] p-4 md:p-8 max-w-4xl w-full h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto overflow-x-hidden font-bbs pb-safe-bottom"
                style={{ touchAction: 'pan-y' }}
            >
                {/* Character Image (if available) */}
                {player.ipfsImageHash && (
                    <div className="mb-4 flex justify-center">
                        <img
                            src={`https://gateway.pinata.cloud/ipfs/${player.ipfsImageHash}`}
                            alt={player.name}
                            className="w-64 h-64 border-4 border-[#FFD700] rounded-lg object-cover shadow-2xl"
                            onLoad={() => {}}
                            onError={(e) => {
                                console.warn(`⚠️ Failed to load IPFS image for ${player.name}, hash: ${player.ipfsImageHash}`);
                                // Fallback to default image on error
                                (e.target as HTMLImageElement).src = '/assets/lizard.png';
                            }}
                        />
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        {isEditingName ? (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => {
                                        setNewName(e.target.value);
                                        setNameError('');
                                    }}
                                    onKeyPress={(e) => e.key === 'Enter' && handleUpdateName()}
                                    maxLength={20}
                                    className="w-full px-4 py-2 bg-black border-2 border-[#00FF88] text-[#00FF88] text-2xl focus:border-[#FFD700] focus:outline-none font-bbs"
                                    placeholder="Enter new name..."
                                    autoFocus
                                />
                                {nameError && (
                                    <div className="text-red-500 text-sm">{nameError}</div>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleUpdateName}
                                        className="px-4 py-1 bg-black border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00FF88]/10 transition-all font-bold text-sm"
                                    >
                                        ✅ Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditingName(false);
                                            setNewName(player.name);
                                            setNameError('');
                                        }}
                                        className="px-4 py-1 bg-black border-2 border-gray-600 text-gray-400 hover:border-gray-400 transition-all font-bold text-sm"
                                    >
                                        ❌ Cancel
                                    </button>
                                </div>
                                <div className="text-xs text-gray-500">
                                    3-20 characters, letters/numbers/spaces/hyphens only
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-3xl font-bold text-[#00FF88] text-glow-green flex items-center gap-2">
                                        🦎 {player.name}
                                    </h2>
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        className="px-3 py-1 bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10 transition-all font-bold text-xs"
                                        title="Edit character name"
                                    >
                                        ✏️ Edit
                                    </button>
                                </div>
                                <p className="text-[#FFD700]">The People's Champion</p>
                                {successMessage && (
                                    <div className="mt-2 text-green-400 text-sm font-bold">{successMessage}</div>
                                )}
                                {/* Sync to NFT Button */}
                                <div className="mt-3 pt-3 border-t border-gray-700">
                                    <button
                                        onClick={handleSyncToNFT}
                                        disabled={isSyncing}
                                        className={`px-4 py-2 font-bold text-sm transition-all ${
                                            isSyncing
                                                ? 'bg-gray-800 border-2 border-gray-600 text-gray-500 cursor-not-allowed'
                                                : 'bg-black border-2 border-blue-500 text-blue-400 hover:bg-blue-500/10'
                                        }`}
                                        title="Sync your name to the NFT metadata (IPFS + Blockchain). Server pays gas!"
                                    >
                                        {isSyncing ? '⏳ Syncing to NFT...' : '⛓️ Sync Name to NFT'}
                                    </button>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Updates NFT Metadata
                                    </div>
                                    {syncError && (
                                        <div className="mt-2 text-red-500 text-sm">{syncError}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-3xl text-red-500 hover:text-red-400 transition-colors font-bold ml-4"
                    >
                        [X]
                    </button>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Core Stats */}
                    <div className="bg-black border-2 border-[#00FF88] p-6">
                        <h3 className="text-xl font-bold text-[#00FF88] text-glow-green mb-4 flex items-center gap-2">
                            ⭐ CORE STATS
                        </h3>
                        <div className="space-y-3">
                            <StatRow label="Level" value={player.level} color="[#FFD700]" icon="level" />
                            <StatRow label="Health" value={`${player.health} / ${player.maxHealth}`} color="red-400" icon="heart" />
                            <StatRow label="Experience" value={`${player.experience} / ${player.experienceToNextLevel}`} color="blue-400" icon="exp" />
                            <div className="h-3 bg-gray-600 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                                    style={{ width: `${(player.experience / player.experienceToNextLevel) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Combat Stats */}
                    <div className="bg-black border-2 border-[#FFD700] p-6">
                        <h3 className="text-xl font-bold text-[#FFD700] text-glow-gold mb-4 flex items-center gap-2">
                            ⚔️ COMBAT STATS
                        </h3>
                        <div className="space-y-3">
                            <StatRow label="Strength" value={player.strength} color="red-400" icon="attack" />
                            <StatRow label="Defense" value={player.defense} color="blue-400" icon="armor" />
                            <StatRow label="Charm" value={player.charm} color="pink-400" icon="star" />
                            <div className="pt-3 border-t border-gray-600">
                                <StatRow
                                    label="Total Attack"
                                    value={player.strength + (player.weapon?.attackBonus || 0)}
                                    color="neon-green"
                                />
                                <StatRow
                                    label="Total Defense"
                                    value={player.defense + (player.armor?.defenseBonus || 0)}
                                    color="neon-blue"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Wealth */}
                    <div className="bg-black border-2 border-[#FFD700] p-6">
                        <h3 className="text-xl font-bold text-[#FFD700] text-glow-gold mb-4 flex items-center gap-2">
                            💰 WEALTH
                        </h3>
                        <div className="space-y-3">
                            <StatRow label="Gold (On Hand)" value={player.gold.toLocaleString()} color="[#FFD700]" icon="gold" />
                            <StatRow label="Gold (In Bank)" value={player.goldInBank.toLocaleString()} color="neon-green" icon="bank" />
                            <StatRow label="Total Stolen" value={player.goldStolen.toLocaleString()} color="yellow-400" icon="diamond" />
                            <StatRow label="Given to Poor" value={player.goldGivenToPoor.toLocaleString()} color="neon-blue" icon="heart" />
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="bg-black border-2 border-[#00FF88] p-6">
                        <h3 className="text-xl font-bold text-[#00FF88] text-glow-green mb-4 flex items-center gap-2">
                            📈 PROGRESS
                        </h3>
                        <div className="space-y-3">
                            <StatRow label="Heists Completed" value={player.heistsCompleted} color="neon-green" icon="achievement" />
                            <StatRow label="Enemies Defeated" value={player.enemiesDefeated} color="red-400" icon="combat" />
                            <StatRow label="PvP Wins" value={player.pvpWins} color="purple-400" icon="trophy" />
                            <StatRow label="PvP Losses" value={player.pvpLosses} color="gray-400" icon="skull" />
                            <StatRow label="Crime Lord Defeats" value={player.crimeLordDefeats} color="[#FFD700]" icon="crown" />
                            <StatRow label="Deaths" value={player.deathCount} color="red-600" icon="skull" />
                        </div>
                    </div>
                </div>

                {/* Equipment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Weapon */}
                    <div className="bg-black border-2 border-[#FFD700] p-6">
                        <h3 className="text-xl font-bold text-[#FFD700] text-glow-gold mb-4 flex items-center gap-2">
                            🗡️ WEAPON
                        </h3>
                        {player.weapon ? (
                            <div>
                                <div className="text-lg font-bold text-neon-green mb-1">{player.weapon.name}</div>
                                <div className="text-sm text-gray-400 mb-2">{player.weapon.description}</div>
                                <div className="flex gap-4 text-sm">
                                    <span className="text-red-400">+{player.weapon.attackBonus} Attack</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-[#FFD700]">{player.weapon.price} gold</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-400 italic">No weapon equipped</div>
                        )}
                    </div>

                    {/* Armor */}
                    <div className="bg-black border-2 border-[#00FF88] p-6">
                        <h3 className="text-xl font-bold text-[#00FF88] text-glow-green mb-4 flex items-center gap-2">
                            🛡️ ARMOR
                        </h3>
                        {player.armor ? (
                            <div>
                                <div className="text-lg font-bold text-neon-green mb-1">{player.armor.name}</div>
                                <div className="text-sm text-gray-400 mb-2">{player.armor.description}</div>
                                <div className="flex gap-4 text-sm">
                                    <span className="text-blue-400">+{player.armor.defenseBonus} Defense</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-[#FFD700]">{player.armor.price} gold</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-400 italic">No armor equipped</div>
                        )}
                    </div>
                </div>

                {/* Game State */}
                <div className="bg-black border-2 border-[#00FF88] p-6 mb-6">
                    <h3 className="text-xl font-bold text-[#00FF88] text-glow-green mb-4 flex items-center gap-2">
                        🎲 GAME STATE
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#00FF88]">{player.turnsRemaining}</div>
                            <div className="text-xs text-[#FFD700]">Turns Left</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#00FF88]">{player.maxTurns}</div>
                            <div className="text-xs text-[#FFD700]">Max Turns/Day</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#FFD700]">{player.location.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                            <div className="text-xs text-[#00FF88]">Current Location</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#FFD700]">
                                {player.hasFoughtCrimeLord ? 'Yes' : 'No'}
                            </div>
                            <div className="text-xs text-[#00FF88]">Fought Crime Lord</div>
                        </div>
                    </div>
                </div>

                {/* Wallet Info */}
                <div className="bg-black border-2 border-[#00FF88]/50 p-4">
                    <div className="text-xs text-[#FFD700] mb-1">WALLET ADDRESS:</div>
                    <div className="text-sm text-[#00FF88] font-mono break-all">{player.walletAddress}</div>
                </div>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

// Helper Component for Stats
const StatRow: React.FC<{ label: string; value: string | number; color: string; icon?: string }> = ({
    label, value, color, icon
}) => {
    // Map color strings to actual Tailwind classes
    const colorClasses: Record<string, string> = {
        '[#FFD700]': 'text-[#FFD700]',
        'red-400': 'text-red-400',
        'blue-400': 'text-blue-400',
        'pink-400': 'text-pink-400',
        'neon-green': 'text-neon-green',
        'neon-blue': 'text-neon-blue',
        'yellow-400': 'text-yellow-400',
        'gray-400': 'text-gray-400',
        'purple-400': 'text-purple-400',
        'red-600': 'text-red-600',
    };

    // Map icon names to emojis
    const iconEmojis: Record<string, string> = {
        'level': '🎯',
        'heart': '❤️',
        'exp': '✨',
        'attack': '⚔️',
        'armor': '🛡️',
        'star': '⭐',
        'gold': '💰',
        'bank': '🏦',
        'diamond': '💎',
        'achievement': '🏆',
        'combat': '⚔️',
        'trophy': '🏆',
        'skull': '💀',
        'crown': '👑',
    };

    return (
        <div className="flex justify-between items-center">
            <span className="text-gray-300 flex items-center gap-1">
                {icon && iconEmojis[icon] && <span>{iconEmojis[icon]}</span>}
                {label}:
            </span>
            <span className={`${colorClasses[color] || 'text-gray-300'} font-bold`}>{value}</span>
        </div>
    );
};

export default CharacterSheet;
