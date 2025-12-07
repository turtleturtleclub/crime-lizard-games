// Gecko Graves - Quest Giver NPC
// The mysterious quest giver who introduces players to the criminal underworld

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useQuests } from '../../contexts/QuestContext';
import { useCharacter } from '../../contexts/CharacterContext';
import { useModalClose } from '../../hooks/useModalClose';
import '../../styles/ShadyPete.css';

interface GeckoGravesProps {
    onClose: () => void;
}

export const GeckoGraves: React.FC<GeckoGravesProps> = ({ onClose }) => {
    useModalClose(onClose);

    const { availableQuests, activeQuests, startQuest, loading } = useQuests();
    const { selectedCharacter } = useCharacter();
    const [dialogue, setDialogue] = useState<string>('');
    const [showQuestChoice, setShowQuestChoice] = useState(false);
    const [currentQuest, setCurrentQuest] = useState<any>(null);

    useEffect(() => {
        // Determine what Gecko Graves should say based on player state
        const hasActiveQuests = activeQuests.length > 0;
        const hasAvailableQuests = availableQuests.length > 0;
        const tutorialQuest = availableQuests.find(q => q.id === 'quest_first_score');
        const hasCompletedTutorial = !tutorialQuest && activeQuests.every(q => q.questId !== 'quest_first_score');

        if (!selectedCharacter) {
            setDialogue("You need a character first, lizard. Come back when you're ready.");
        } else if (tutorialQuest && !hasActiveQuests) {
            // First time meeting - offer tutorial quest
            setDialogue(
                "*A shadowy figure emerges from the darkness*\n\n" +
                "Well, well... fresh meat in the Town Square, eh?\n\n" +
                "Name's Gecko Graves. I run the... *operations* around here. " +
                "You look like you got potential, kid. Or maybe you're just stupid enough to survive.\n\n" +
                "Listen up. This ain't no fairy tale kingdom. Out there in the Dark Forest, " +
                "there's things that'll kill ya faster than you can say 'rug pull'.\n\n" +
                "But if you can handle yourself... well, there's gold to be made. Lots of it.\n\n" +
                "*leans in closer*\n\n" +
                "Interested in making your first score?"
            );
            setCurrentQuest(tutorialQuest);
            setShowQuestChoice(true);
        } else if (hasActiveQuests) {
            // Player has active quests
            setDialogue(
                "*nods approvingly*\n\n" +
                `You got ${activeQuests.length} job${activeQuests.length > 1 ? 's' : ''} pending, lizard. ` +
                "Don't come crying to me if you bite off more than you can chew.\n\n" +
                "Finish what you started, then we'll talk about more work.\n\n" +
                "*gestures dismissively*\n\n" +
                "Now scram. I got other business."
            );
            setShowQuestChoice(false);
        } else if (hasAvailableQuests && hasCompletedTutorial) {
            // Returning player with available quests
            const storyQuests = availableQuests.filter(q => q.type === 'story');
            const sideQuests = availableQuests.filter(q => q.type === 'side');
            const heists = availableQuests.filter(q => q.type === 'heist');

            setDialogue(
                "*lights a cigarette*\n\n" +
                "Back for more, eh? Good. The world needs more ambitious lizards.\n\n" +
                `I got ${availableQuests.length} job${availableQuests.length > 1 ? 's' : ''} that might interest someone of your... talents.\n\n` +
                (storyQuests.length > 0 ? `📖 ${storyQuests.length} story job${storyQuests.length > 1 ? 's' : ''} - the big leagues\n` : '') +
                (sideQuests.length > 0 ? `🗺️ ${sideQuests.length} side gig${sideQuests.length > 1 ? 's' : ''} - easy money\n` : '') +
                (heists.length > 0 ? `💰 ${heists.length} heist${heists.length > 1 ? 's' : ''} - the real deal\n\n` : '\n') +
                "Check the Quest Board if you're interested. But don't waste my time if you ain't serious.\n\n" +
                "*blows smoke*"
            );
            setShowQuestChoice(false);
        } else {
            // No quests available
            setDialogue(
                "*shrugs*\n\n" +
                "Nothing for you right now, kid. Business is slow.\n\n" +
                "Come back later. Or go make some noise in the Forest - " +
                "sometimes opportunities find you when you're looking for trouble.\n\n" +
                "*waves you away*"
            );
            setShowQuestChoice(false);
        }
    }, [availableQuests, activeQuests, selectedCharacter]);

    const handleAcceptQuest = async () => {
        if (!currentQuest) return;
const result = await startQuest(currentQuest.id);

        if (result.success) {
            setDialogue(
                "*grins wickedly*\n\n" +
                "Smart choice, lizard. I like you already.\n\n" +
                "Head to the Dark Forest. Kill three of whatever's out there - wolves, bandits, " +
                "tax collectors, I don't care. Just make it bloody.\n\n" +
                "Come back when it's done, and we'll talk about bigger scores.\n\n" +
                "*tosses you a rusty blade*\n\n" +
                "Don't die out there. Dead lizards can't pay their debts.\n\n" +
                "TYPE 'FOREST' OR '1' TO HEAD OUT!"
            );
            setShowQuestChoice(false);
            setCurrentQuest(null);

            // Auto-close after showing success message for dramatic effect
            setTimeout(() => {
                onClose();
            }, 8000);
        } else {
            setDialogue(
                "*scowls*\n\n" +
                `Sorry kid, can't give you this job. ${result.message}\n\n` +
                "Come back when you're ready."
            );
            setShowQuestChoice(false);
        }
    };

    const handleDeclineQuest = () => {
        setDialogue(
            "*narrows eyes*\n\n" +
            "Scared already? Figures.\n\n" +
            "Fine. Run along. But don't expect me to hold your hand when you come crawling back.\n\n" +
            "The Quest Board is over there if you change your mind. Can't say I didn't offer.\n\n" +
            "*turns away*"
        );
        setShowQuestChoice(false);
        setCurrentQuest(null);

        // Auto-close after showing decline message
        setTimeout(() => {
            onClose();
        }, 5000);
    };

    const modalContent = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="shady-pete-overlay"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                transition={{ type: 'spring', damping: 15 }}
                className="shady-pete-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="shady-pete-header">
                    <div className="shady-pete-title">
                        <span className="shady-pete-icon">🦎</span>
                        <h2>Gecko Graves</h2>
                        <span className="shady-pete-subtitle">Quest Broker</span>
                    </div>
                    <button onClick={onClose} className="shady-pete-close">✕</button>
                </div>

                {/* Character Portrait */}
                <div className="shady-pete-portrait">
                    <div className="portrait-frame">
                        <div className="portrait-image">
                            <img
                                src="/assets/gecko-graves.png"
                                alt="Gecko Graves - Quest Broker"
                                className="gecko-graves-portrait"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: '8px',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Dialogue Box */}
                <div className="shady-pete-dialogue">
                    <div className="dialogue-box">
                        <pre className="dialogue-text">{dialogue}</pre>
                    </div>
                </div>

                {/* Quest Choice Buttons */}
                <AnimatePresence>
                    {showQuestChoice && currentQuest && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="quest-choice-buttons"
                        >
                            <motion.button
                                onClick={handleAcceptQuest}
                                className="quest-accept-btn"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={loading}
                            >
                                <span className="btn-icon">⚔️</span>
                                <span className="btn-text">ACCEPT QUEST</span>
                                <span className="btn-subtext">{currentQuest.title}</span>
                            </motion.button>

                            <motion.button
                                onClick={handleDeclineQuest}
                                className="quest-decline-btn"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="btn-icon">🚪</span>
                                <span className="btn-text">MAYBE LATER</span>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Buttons */}
                {!showQuestChoice && (
                    <div className="shady-pete-actions">
                        <motion.button
                            onClick={onClose}
                            className="pete-action-btn"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span>👋 Leave</span>
                        </motion.button>

                        {availableQuests.length > 0 && (
                            <motion.button
                                onClick={() => {
                                    onClose();
                                    // Quest board will open from parent component
                                }}
                                className="pete-action-btn quest-board-btn"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span>📜 Quest Board</span>
                            </motion.button>
                        )}
                    </div>
                )}

                {/* Flavor Text Footer */}
                <div className="shady-pete-footer">
                    <p className="footer-text">
                        "The only thing more dangerous than owing me money... is missing out on making it."
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default GeckoGraves;
export { GeckoGraves as ShadyPete }; // Backward compatibility alias
