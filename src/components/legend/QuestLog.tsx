// QuestLog Component
// Displays available and active quests for the player

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuests } from '../../contexts/QuestContext';
import { useCharacter } from '../../contexts/CharacterContext';
import type { EnhancedQuest } from '../../types/quest.types';
import QuestPathChoice from './QuestPathChoice';
import { getItemDisplayName } from '../../utils/itemNames';
import { useModalClose } from '../../hooks/useModalClose';
import { useLanguage } from '../../contexts/LanguageContext';
import '../../styles/QuestLog.css';

interface QuestLogProps {
    onClose: () => void;
}

export const QuestLog: React.FC<QuestLogProps> = ({ onClose }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose);
    const { t } = useLanguage();

    const { availableQuests, activeQuests, completedQuestIds, getQuest, startQuest, updateQuestProgress, loading } = useQuests();
    const { selectedCharacter: character } = useCharacter();
const [selectedTab, setSelectedTab] = useState<'available' | 'active' | 'completed'>('available');
    const [filter, setFilter] = useState<'all' | 'story' | 'side' | 'daily' | 'heist'>('all');
    const [showPathChoice, setShowPathChoice] = useState(false);
    const [pathChoiceQuest, setPathChoiceQuest] = useState<EnhancedQuest | null>(null);

    // Debug: Watch state changes
    React.useEffect(() => {
    }, [showPathChoice, pathChoiceQuest]);

    // Filter quests based on selected filter
    const filteredQuests = availableQuests.filter(quest => {
        if (filter === 'all') return true;
        return quest.type === filter;
    });

    const handleStartQuest = async (questId: string) => {

        // Check if this is the Robin Hood quest that requires path choice
        if (questId === 'quest_robin_hood_dilemma') {
const quest = getQuest(questId);
if (quest) {
setPathChoiceQuest(quest);
                setShowPathChoice(true);
return;
            } else {
                console.error('❌ Quest not found in cache:', questId);
            }
        }
const result = await startQuest(questId);
if (!result.success) {
            // Use console.error for now - proper in-game notification system needed
            console.error('❌ Quest Start Failed:', result.message);
            // TODO: Replace with proper in-game toast notification
        }
    };

    const handlePathChoice = async (pathId: 'path_a' | 'path_b') => {
setShowPathChoice(false);

        if (!pathChoiceQuest) {
            console.error('❌ No quest set for path choice');
            return;
        }
// Start the quest first
        const result = await startQuest(pathChoiceQuest.id);
if (!result.success) {
            console.error('❌ Quest Start Failed:', result.message);
            return;
        }
// Mark the path choice objective as complete and activate the chosen path
        try {
            // Complete the path_choice objective
await updateQuestProgress(pathChoiceQuest.id, 'path_choice', 1);
// Store the path choice (this would ideally be in backend)
            sessionStorage.setItem(`quest_${pathChoiceQuest.id}_path`, pathId);
        } catch (error) {
            console.error('❌ Failed to record path choice:', error);
        }

        setPathChoiceQuest(null);
    };

    // TODO: Implement abandon quest UI
    // const handleAbandonQuest = async (questId: string) => {
    //     if (confirm('Are you sure you want to abandon this quest?')) {
    //         await abandonQuest(questId);
    //     }
    // };

    const questLogContent = (
        <>
            {/* Path Choice Modal */}
            {showPathChoice && pathChoiceQuest && (
                <QuestPathChoice
                    questTitle={pathChoiceQuest.title}
                    onClose={() => {
                        setShowPathChoice(false);
                        setPathChoiceQuest(null);
                    }}
                    onSelectPath={handlePathChoice}
                />
            )}

            <div className="quest-log-overlay">
                <div className="quest-log-container">
                {/* Header */}
                <div className="quest-log-header">
                    <h2>{t.questLog.title}</h2>
                    <button onClick={onClose} className="close-btn">✕</button>
                </div>

                {/* Tabs */}
                <div className="quest-log-tabs">
                    <button
                        className={selectedTab === 'available' ? 'active' : ''}
                        onClick={() => setSelectedTab('available')}
                    >
                        {t.questLog.available.replace('{count}', availableQuests.length.toString())}
                    </button>
                    <button
                        className={selectedTab === 'active' ? 'active' : ''}
                        onClick={() => setSelectedTab('active')}
                    >
                        {t.questLog.active.replace('{count}', activeQuests.length.toString())}
                    </button>
                    <button
                        className={selectedTab === 'completed' ? 'active' : ''}
                        onClick={() => setSelectedTab('completed')}
                    >
                        {t.questLog.completed.replace('{count}', completedQuestIds.length.toString())}
                    </button>
                </div>

                {/* Filter (for available quests) */}
                {selectedTab === 'available' && (
                    <div className="quest-log-filters">
                        <button
                            className={filter === 'all' ? 'active' : ''}
                            onClick={() => setFilter('all')}
                        >
                            {t.questLog.filterAll}
                        </button>
                        <button
                            className={filter === 'story' ? 'active' : ''}
                            onClick={() => setFilter('story')}
                        >
                            {t.questLog.filterStory}
                        </button>
                        <button
                            className={filter === 'side' ? 'active' : ''}
                            onClick={() => setFilter('side')}
                        >
                            {t.questLog.filterSide}
                        </button>
                        <button
                            className={filter === 'daily' ? 'active' : ''}
                            onClick={() => setFilter('daily')}
                        >
                            {t.questLog.filterDaily}
                        </button>
                        <button
                            className={filter === 'heist' ? 'active' : ''}
                            onClick={() => setFilter('heist')}
                        >
                            {t.questLog.filterHeist}
                        </button>
                    </div>
                )}

                {/* Quest List */}
                <div className="quest-log-content">
                    <div className="quest-list">
                        {selectedTab === 'available' && (
                            loading ? (
                                <div className="loading">{t.questLog.loading}</div>
                            ) : filteredQuests.length === 0 ? (
                                <div className="no-quests">{t.questLog.noAvailable}</div>
                            ) : (
                                filteredQuests.map(quest => (
                                    <AvailableQuestItem
                                        key={quest.id}
                                        quest={quest}
                                        onStart={() => handleStartQuest(quest.id)}
                                        canStart={!!character}
                                        t={t}
                                    />
                                ))
                            )
                        )}

                        {selectedTab === 'active' && (
                            activeQuests.length === 0 ? (
                                <div className="no-quests">{t.questLog.noActive}</div>
                            ) : (
                                activeQuests.map(aq => (
                                    <ActiveQuestItem
                                        key={aq.questId}
                                        activeQuest={aq}
                                        t={t}
                                    />
                                ))
                            )
                        )}

                        {selectedTab === 'completed' && (
                            <>
                                {completedQuestIds.length === 0 ? (
                                    <div className="no-quests">{t.questLog.noCompleted}</div>
                                ) : (
                                    <div className="quests-grid">
                                        {completedQuestIds.map(questId => {
                                            const quest = getQuest(questId);
if (!quest) {
                                                console.warn(`⚠️ Quest ${questId} not found in cache!`);
                                                return null;
                                            }

                                            return (
                                                <div key={questId} className="quest-item completed-quest">
                                                    <div className="quest-header">
                                                        <h4>✅ {quest.title}</h4>
                                                        <span className={`difficulty-badge difficulty-${quest.difficulty}`}>
                                                            {quest.difficulty}
                                                        </span>
                                                    </div>
                                                    <p className="quest-description">{quest.description}</p>
                                                    <div className="quest-rewards-preview">
                                                        <h5>{t.questLog.rewardsClaimed}</h5>
                                                        <div className="rewards-list">
                                                            {quest.rewards.gold && <span>💰 {quest.rewards.gold}g</span>}
                                                            {quest.rewards.experience && <span>⭐ {quest.rewards.experience} XP</span>}
                                                            {quest.rewards.reputation && <span>📈 {quest.rewards.reputation} rep</span>}
                                                            {quest.rewards.items && quest.rewards.items.length > 0 && (
                                                                quest.rewards.items.map((item) => (
                                                                    <span key={item}>{getItemDisplayName(item)}</span>
                                                                ))
                                                            )}
                                                            {quest.rewards.nftReward && (
                                                                <span className="nft-reward">
                                                                    🖼️ {quest.rewards.nftReward.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </>
    );

    return createPortal(questLogContent, document.body);
};

// Available Quest Item Component (Expandable)
interface AvailableQuestItemProps {
    quest: EnhancedQuest;
    onStart: () => void;
    canStart: boolean;
    t: any;
}

const AvailableQuestItem: React.FC<AvailableQuestItemProps> = ({ quest, onStart, canStart, t }) => {
    const [expanded, setExpanded] = React.useState(false);

    const difficultyColors: Record<string, string> = {
        easy: '#22c55e',
        medium: '#eab308',
        hard: '#ef4444',
        legendary: '#a855f7'
    };

    const typeIcons: Record<string, string> = {
        story: '📖',
        side: '🗺️',
        daily: '🔄',
        heist: '💰',
        achievement: '🏆'
    };

    return (
        <div className="available-quest-item">
            <div
                className="quest-header"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="quest-header-left">
                    <div className="quest-icon">{typeIcons[quest.type] || '📜'}</div>
                    <div className="quest-info">
                        <h4>{quest.title}</h4>
                        <div className="quest-meta">
                            <span className="quest-level">{t.questLog.levelRequired.replace('{level}', String(quest.requirements.minLevel || 1))}</span>
                            <span
                                className="quest-difficulty"
                                style={{ color: difficultyColors[quest.difficulty] }}
                            >
                                {quest.difficulty === 'easy' ? t.questLog.difficultyEasy :
                                 quest.difficulty === 'medium' ? t.questLog.difficultyMedium :
                                 quest.difficulty === 'hard' ? t.questLog.difficultyHard :
                                 t.questLog.difficultyLegendary}
                            </span>
                            {quest.requirements.team && (
                                <span className="quest-team">👥 {quest.requirements.team.minPlayers}-{quest.requirements.team.maxPlayers}</span>
                            )}
                        </div>
                    </div>
                </div>
                <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
            </div>

            {expanded && (
                <div className="quest-details-expanded">
                    <p className="quest-description">{quest.description}</p>

                    {quest.lore && (
                        <div className="quest-lore">
                            <em>{quest.lore}</em>
                        </div>
                    )}

                    <div className="quest-requirements">
                        <h5>{t.questLog.requirements}</h5>
                        <ul>
                            {quest.requirements.minLevel && (
                                <li>{t.questLog.levelRequired.replace('{level}', String(quest.requirements.minLevel))}</li>
                            )}
                            {quest.requirements.gold && (
                                <li>💰 {quest.requirements.gold} {t.questLog.gold} {t.questLog.entryFee}</li>
                            )}
                            {quest.requirements.team && (
                                <li>
                                    👥 {quest.requirements.team.minPlayers}-{quest.requirements.team.maxPlayers} {t.questLog.players}
                                    {quest.requirements.team.requiredRoles && (
                                        <span> ({quest.requirements.team.requiredRoles.join(', ')})</span>
                                    )}
                                </li>
                            )}
                        </ul>
                    </div>

                    <div className="quest-objectives">
                        <h5>{t.questLog.objectives}</h5>
                        <ul>
                            {quest.objectives.map((obj) => (
                                <li key={obj.id}>
                                    {obj.description} ({obj.amount})
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="quest-rewards">
                        <h5>{t.questLog.rewards}</h5>
                        <div className="rewards-list">
                            {quest.rewards.gold && <span>💰 {quest.rewards.gold}g</span>}
                            {quest.rewards.experience && <span>⭐ {quest.rewards.experience} XP</span>}
                            {quest.rewards.reputation && <span>📈 {quest.rewards.reputation} rep</span>}
                            {quest.rewards.title && <span>🎖️ "{quest.rewards.title}"</span>}
                            {quest.rewards.items && quest.rewards.items.length > 0 && (
                                quest.rewards.items.map((item) => (
                                    <span key={item}>{getItemDisplayName(item)}</span>
                                ))
                            )}
                            {quest.rewards.nftReward && (
                                <span>🖼️ {quest.rewards.nftReward.name}</span>
                            )}
                        </div>
                    </div>

                    {quest.failureConsequences && (
                        <div className="quest-failure">
                            <h5>{t.questLog.failureConsequences}</h5>
                            <ul>
                                {quest.failureConsequences.goldLoss && (
                                    <li>-{quest.failureConsequences.goldLoss} {t.questLog.gold}</li>
                                )}
                                {quest.failureConsequences.reputationLoss && (
                                    <li>-{quest.failureConsequences.reputationLoss} {t.questLog.reputation}</li>
                                )}
                                {quest.failureConsequences.jail && (
                                    <li>{t.questLog.jail} {quest.failureConsequences.jail.duration} {t.questLog.hours}</li>
                                )}
                            </ul>
                        </div>
                    )}

                    <button
                        className="start-quest-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onStart();
                        }}
                        disabled={!canStart}
                    >
                        {!canStart ? t.questLog.requirementsNotMet : t.questLog.startQuest}
                    </button>
                </div>
            )}
        </div>
    );
};

// Active Quest Item Component
interface ActiveQuestItemProps {
    activeQuest: any; // ActiveQuestState
    t: any;
}

const ActiveQuestItem: React.FC<ActiveQuestItemProps> = ({ activeQuest, t }) => {
    const { getQuest } = useQuests();
    const [expanded, setExpanded] = React.useState(false);

    const progress = activeQuest.objectives?.filter((o: any) => o.completed).length || 0;
    const total = activeQuest.objectives?.length || 0;
    const percentage = total > 0 ? (progress / total) * 100 : 0;

    // Find the full quest data from cache
    const questData = getQuest(activeQuest.questId);

    if (!questData) {
        console.warn(`⚠️ Quest data not found for ${activeQuest.questId}`);
    }

    return (
        <div className="active-quest-item">
            <div
                className="active-quest-header"
                onClick={() => setExpanded(!expanded)}
                style={{ cursor: 'pointer' }}
            >
                <div className="quest-header-content">
                    <h4>{questData?.title || activeQuest.questId}</h4>
                    <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="progress-text">{t.questLog.objectivesCompleted.replace('{progress}', String(progress)).replace('{total}', String(total))}</div>
            </div>

            {expanded && questData && (
                <div className="active-quest-details">
                    <p className="quest-description">{questData.description}</p>

                    <div className="quest-objectives-progress">
                        <h5>{t.questLog.objectivesLabel}</h5>
                        <ul>
                            {questData.objectives.map((obj) => {
                                const objectiveProgress = activeQuest.objectives?.find((o: any) => o.objectiveId === obj.id);
                                const currentAmount = objectiveProgress?.currentAmount || 0;
                                const completed = objectiveProgress?.completed || false;

                                return (
                                    <li key={obj.id} className={completed ? 'completed' : ''}>
                                        <span className="objective-status">
                                            {completed ? '✅' : '⏳'}
                                        </span>
                                        <span className="objective-text">
                                            {obj.description}
                                        </span>
                                        <span className="objective-progress">
                                            ({currentAmount}/{obj.amount})
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="quest-rewards-preview">
                        <h5>{t.questLog.rewardsLabel}</h5>
                        <div className="rewards-list">
                            {questData.rewards.gold && <span>💰 {questData.rewards.gold}g</span>}
                            {questData.rewards.experience && <span>⭐ {questData.rewards.experience} XP</span>}
                            {questData.rewards.reputation && <span>📈 {questData.rewards.reputation} rep</span>}
                            {questData.rewards.items && questData.rewards.items.length > 0 && (
                                questData.rewards.items.map((item) => (
                                    <span key={item}>{getItemDisplayName(item)}</span>
                                ))
                            )}
                        </div>
                    </div>

                    {activeQuest.expiresAt && (
                        <div className="quest-expiry">
                            ⏰ {t.questLog.expires} {new Date(activeQuest.expiresAt).toLocaleString()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuestLog;
