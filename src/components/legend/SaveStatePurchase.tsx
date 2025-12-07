import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { PlayerCharacter, GameSaveState } from '../../types/legend.types';
import { GAME_CONSTANTS } from '../../data/gameData';
import { useModalClose } from '../../hooks/useModalClose';

interface SaveStatePurchaseProps {
    player: PlayerCharacter;
    updatePlayer: (updates: Partial<PlayerCharacter>) => void;
    onClose: () => void;
    setGameMessage: (message: string) => void;
}

const SaveStatePurchase: React.FC<SaveStatePurchaseProps> = ({
    player,
    updatePlayer,
    onClose,
    setGameMessage
}) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose);

    const [saveName, setSaveName] = useState('');
    const [selectedSaveSlot, setSelectedSaveSlot] = useState<GameSaveState | null>(null);

    // Initialize saveStates if not exists
    const saveStates = player.saveStates || [];

    // Filter out expired saves
    const validSaveStates = saveStates.filter(save =>
        new Date(save.expiresAt) > new Date()
    );

    const canAfford = player.gold >= GAME_CONSTANTS.SAVE_STATE_COST;
    const hasAvailableSlot = validSaveStates.length < GAME_CONSTANTS.SAVE_STATE_MAX_SLOTS;

    const createSave = () => {
        if (!canAfford) {
            setGameMessage('Not enough gold to create a save state!');
            return;
        }

        if (!hasAvailableSlot) {
            setGameMessage(`You can only have ${GAME_CONSTANTS.SAVE_STATE_MAX_SLOTS} save slots!`);
            return;
        }

        if (!saveName.trim()) {
            setGameMessage('Please enter a name for your save!');
            return;
        }

        // Create the save state
        const newSave: GameSaveState = {
            id: `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: saveName.trim(),
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + (GAME_CONSTANTS.SAVE_STATE_DURATION * 24 * 60 * 60 * 1000)),
            playerData: {
                level: player.level,
                experience: player.experience,
                health: player.health,
                maxHealth: player.maxHealth,
                gold: player.gold,
                strength: player.strength,
                defense: player.defense,
                charm: player.charm,
                weapon: player.weapon,
                armor: player.armor,
                enemiesDefeated: player.enemiesDefeated,
                heistsCompleted: player.heistsCompleted,
                goldStolen: player.goldStolen,
                goldGivenToPoor: player.goldGivenToPoor,
                hasFoughtCrimeLord: player.hasFoughtCrimeLord,
                hasDefeatedCrimeLord: player.hasDefeatedCrimeLord,
                crimeLordDefeats: player.crimeLordDefeats
            },
            costPaid: GAME_CONSTANTS.SAVE_STATE_COST,
            description: `Saved at level ${player.level} with ${player.gold} gold`
        };

        const updatedSaveStates = [...validSaveStates, newSave];

        updatePlayer({
            gold: player.gold - GAME_CONSTANTS.SAVE_STATE_COST,
            saveStates: updatedSaveStates
        });

        setGameMessage(`💾 Game saved as "${saveName}"! Expires in ${GAME_CONSTANTS.SAVE_STATE_DURATION} days.`);
        setSaveName('');
    };

    const loadSave = (save: GameSaveState) => {
        // Restore player data from save
        const restoredData = {
            ...player,
            ...save.playerData,
            // Don't restore turns or location
            turnsRemaining: player.turnsRemaining,
            location: player.location,
            // Update timestamps
            updatedAt: new Date()
        };

        updatePlayer(restoredData);
        setGameMessage(`🎮 Loaded save "${save.name}"! Welcome back, Crime Lizard!`);
        onClose();
    };

    const deleteSave = (saveId: string) => {
        const updatedSaveStates = validSaveStates.filter(save => save.id !== saveId);
        updatePlayer({ saveStates: updatedSaveStates });
        setGameMessage('Save state deleted.');
        setSelectedSaveSlot(null);
    };

    const modalContent = (

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 overscroll-none"
            style={{ zIndex: 9999 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border-2 border-[#00FF88] p-4 md:p-8 max-w-2xl w-full h-full md:h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto font-bbs custom-scrollbar pb-safe-bottom"
            >
                <div className="text-center mb-4 md:mb-6">
                    <div className="text-4xl md:text-6xl mb-2 md:mb-4">💾</div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#00FF88] text-glow-green mb-1 md:mb-2">SAVE STATE MANAGER</h2>
                    <p className="text-gray-400 text-sm md:text-base">[Preserve your progress for the future]</p>
                </div>

                {/* Create New Save */}
                <div className="bg-black border-2 border-[#00FF88] p-3 md:p-4 mb-4 md:mb-6">
                    <h3 className="font-bold text-[#00FF88] text-glow-green mb-2 md:mb-3 text-base md:text-lg">💾 CREATE NEW SAVE</h3>
                    <div className="flex flex-col md:flex-row gap-2 mb-3">
                        <input
                            type="text"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            placeholder="Enter save name..."
                            maxLength={30}
                            className="flex-1 px-3 py-2 bg-black text-[#00FF88] border-2 border-gray-600 focus:border-[#00FF88] outline-none font-bbs text-sm md:text-base"
                        />
                        <button
                            onClick={createSave}
                            disabled={!canAfford || !hasAvailableSlot || !saveName.trim()}
                            className="px-3 md:px-4 py-2 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] font-bold hover:bg-[#00BB66] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm md:text-base"
                        >
                            SAVE ({GAME_CONSTANTS.SAVE_STATE_COST}💰)
                        </button>
                    </div>

                    {!canAfford && (
                        <div className="text-red-500 text-glow-red text-xs md:text-sm mb-2 border border-red-500 p-2 bg-red-900/20">
                            ⚠ Need {GAME_CONSTANTS.SAVE_STATE_COST} gold to save!
                        </div>
                    )}

                    {!hasAvailableSlot && (
                        <div className="text-red-500 text-glow-red text-xs md:text-sm mb-2 border border-red-500 p-2 bg-red-900/20">
                            ⚠ Max {GAME_CONSTANTS.SAVE_STATE_MAX_SLOTS} save slots reached!
                        </div>
                    )}
                </div>

                {/* Existing Saves */}
                <div className="bg-black border-2 border-[#00FF88] p-3 md:p-4 mb-4 md:mb-6">
                    <h3 className="font-bold text-[#00FF88] text-glow-green mb-2 md:mb-3 text-base md:text-lg">📁 YOUR SAVE STATES ({validSaveStates.length}/{GAME_CONSTANTS.SAVE_STATE_MAX_SLOTS})</h3>

                    {validSaveStates.length === 0 ? (
                        <p className="text-gray-400 text-center py-4 text-sm md:text-base">[No save states yet. Create your first save above!]</p>
                    ) : (
                        <div className="space-y-2 md:space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar">
                            {validSaveStates.map((save) => {
                                const daysLeft = Math.ceil((new Date(save.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                                return (
                                    <div key={save.id} className="bg-black border border-[#00FF88] p-2 md:p-3">
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2 gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-yellow-500 text-glow-gold truncate text-sm md:text-base">{save.name}</h4>
                                                <p className="text-xs text-gray-400 truncate">{save.description}</p>
                                                <p className="text-xs text-gray-500">
                                                    Created: {new Date(save.createdAt).toLocaleDateString()} |
                                                    Expires: {daysLeft} days
                                                </p>
                                            </div>
                                            <div className="text-left md:text-right flex md:flex-col gap-2 md:gap-0">
                                                <div className="text-xs md:text-sm text-[#00FF88]">Lvl {save.playerData.level}</div>
                                                <div className="text-xs text-yellow-500">{save.playerData.gold}💰</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => loadSave(save)}
                                                className="flex-1 px-2 md:px-3 py-2 bg-blue-900 border-2 border-blue-500 text-blue-500 hover:bg-blue-800 transition-all text-xs md:text-sm font-bold"
                                            >
                                                LOAD
                                            </button>
                                            <button
                                                onClick={() => setSelectedSaveSlot(save)}
                                                className="px-2 md:px-3 py-2 bg-red-900 border-2 border-red-500 text-red-500 hover:bg-red-800 transition-all text-xs md:text-sm font-bold"
                                            >
                                                DELETE
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Delete Confirmation */}
                {selectedSaveSlot && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="fixed inset-0 bg-black/90 flex items-center justify-center z-60 p-4"
                        onClick={() => setSelectedSaveSlot(null)}
                    >
                        <motion.div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-black border-2 border-red-500 p-4 md:p-6 max-w-md w-full font-bbs"
                        >
                            <h3 className="text-lg md:text-xl font-bold text-red-500 text-glow-red mb-3 md:mb-4">⚠ DELETE SAVE STATE?</h3>
                            <p className="text-gray-300 mb-4 md:mb-6 text-sm md:text-base">
                                Are you sure you want to delete "{selectedSaveSlot.name}"? This cannot be undone!
                            </p>
                            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                                <button
                                    onClick={() => deleteSave(selectedSaveSlot.id)}
                                    className="flex-1 px-3 md:px-4 py-2 bg-red-900 border-2 border-red-500 text-red-500 hover:bg-red-800 transition-all font-bold text-sm md:text-base"
                                >
                                    DELETE FOREVER
                                </button>
                                <button
                                    onClick={() => setSelectedSaveSlot(null)}
                                    className="flex-1 px-3 md:px-4 py-2 bg-black border-2 border-gray-600 text-gray-400 hover:bg-black transition-all font-bold text-sm md:text-base"
                                >
                                    CANCEL
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Info */}
                <div className="bg-blue-900/30 border-2 border-blue-500 p-2 md:p-3 mb-4 md:mb-6 text-xs md:text-sm text-blue-400">
                    💡 <strong className="text-blue-300">SAVE STATES:</strong> Preserve your progress! Saves expire after {GAME_CONSTANTS.SAVE_STATE_DURATION} days.
                    Loading a save restores your stats but keeps current turns and location.
                </div>

                <div className="text-center text-xs md:text-sm text-gray-400 mb-4 md:mb-6">
                    Your Gold: <span className="text-yellow-500 text-glow-gold font-bold">{player.gold}</span>
                </div>

                {/* Close */}
                <button
                    onClick={onClose}
                    className="w-full px-3 md:px-4 py-2 md:py-3 bg-black border-2 border-gray-600 text-gray-400 font-bold hover:bg-black hover:border-[#00FF88] hover:text-[#00FF88] transition-all text-sm md:text-base"
                >
                    [LEAVE SAVE MANAGER]
                </button>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default SaveStatePurchase;
