// Heist Team Formation UI
// Multiplayer quest team building interface

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuests } from '../contexts/QuestContext';
import type { EnhancedQuest, HeistTeam, ArchetypeRole } from '../types/quest.types';
import '../styles/HeistTeamUI.css';

interface HeistTeamUIProps {
    quest: EnhancedQuest;
    onClose: () => void;
    onStart: (team: HeistTeam) => void;
}

const HeistTeamUI: React.FC<HeistTeamUIProps> = ({ quest, onClose, onStart }) => {
    const { createHeistTeam, inviteToHeist, heistInvites } = useQuests();
    const [currentTeam, setCurrentTeam] = useState<HeistTeam | null>(null);
    const [searchAddress, setSearchAddress] = useState('');
    const [searchTokenId, setSearchTokenId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const teamRequirements = quest.requirements.team;
    if (!teamRequirements) return null;

    useEffect(() => {
        // Create team when component mounts
        initializeTeam();
    }, []);

    const initializeTeam = async () => {
        setLoading(true);
        try {
            const team = await createHeistTeam(quest.id);
            if (team) {
                setCurrentTeam(team);
            } else {
                setError('Failed to create heist team');
            }
        } catch (err) {
            setError('Error creating team');
        } finally {
            setLoading(false);
        }
    };

    const handleInvitePlayer = async () => {
        if (!currentTeam || !searchAddress || !searchTokenId) return;

        setLoading(true);
        setError(null);

        try {
            const success = await inviteToHeist(currentTeam.teamId, {
                walletAddress: searchAddress,
                tokenId: parseInt(searchTokenId)
            });

            if (success) {
                setSearchAddress('');
                setSearchTokenId('');
                alert('Player invited successfully!');
            } else {
                setError('Failed to send invite');
            }
        } catch (err) {
            setError('Error sending invite');
        } finally {
            setLoading(false);
        }
    };

    const handleStartHeist = () => {
        if (!currentTeam) return;

        if (!currentTeam.hasRequiredRoles) {
            setError(`Missing required roles: ${currentTeam.missingRoles?.join(', ')}`);
            return;
        }

        if (currentTeam.members.length < teamRequirements.minPlayers) {
            setError(`Need at least ${teamRequirements.minPlayers} players`);
            return;
        }

        onStart(currentTeam);
    };

    const getRoleIcon = (role?: ArchetypeRole): string => {
        if (!role) return '❓';
        const icons: Record<ArchetypeRole, string> = {
            damage: '⚔️',
            tank: '🛡️',
            support: '💚',
            utility: '🔧',
            balanced: '⚖️'
        };
        return icons[role] || '❓';
    };

    const getRoleColor = (role?: ArchetypeRole): string => {
        if (!role) return '#6b7280';
        const colors: Record<ArchetypeRole, string> = {
            damage: '#ef4444',
            tank: '#3b82f6',
            support: '#10b981',
            utility: '#a855f7',
            balanced: '#f59e0b'
        };
        return colors[role] || '#6b7280';
    };

    if (loading && !currentTeam) {
        return (
            <div className="heist-team-overlay">
                <div className="heist-team-container">
                    <div className="loading-message">
                        <div className="spinner"></div>
                        <p>Creating heist team...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="heist-team-overlay">
            <motion.div
                className="heist-team-container"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
            >
                {/* Header */}
                <div className="heist-team-header">
                    <div>
                        <h2>🎭 Assemble Your Crew</h2>
                        <p className="quest-title">{quest.title}</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {/* Team Requirements */}
                <div className="team-requirements">
                    <h3>Requirements</h3>
                    <div className="requirements-grid">
                        <div className="requirement">
                            <span className="label">Players:</span>
                            <span className="value">
                                {currentTeam?.members.length || 0} / {teamRequirements.minPlayers}-{teamRequirements.maxPlayers}
                            </span>
                        </div>
                        {teamRequirements.requiredRoles && (
                            <div className="requirement">
                                <span className="label">Required Roles:</span>
                                <div className="roles-list">
                                    {teamRequirements.requiredRoles.map(role => (
                                        <span
                                            key={role}
                                            className="role-badge"
                                            style={{ borderColor: getRoleColor(role) }}
                                        >
                                            {getRoleIcon(role)} {role}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Current Team */}
                <div className="current-team">
                    <h3>Your Crew</h3>
                    <div className="team-members">
                        {currentTeam?.members.map((member, index) => (
                            <motion.div
                                key={`${member.walletAddress}-${member.tokenId}`}
                                className={`team-member ${member.walletAddress === currentTeam.leader.walletAddress ? 'leader' : ''}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="member-info">
                                    <div className="member-name">
                                        {member.name}
                                        {member.walletAddress === currentTeam.leader.walletAddress && (
                                            <span className="leader-badge">👑 Leader</span>
                                        )}
                                    </div>
                                    <div className="member-details">
                                        <span>Level {member.level}</span>
                                        <span
                                            className="role-badge"
                                            style={{ borderColor: getRoleColor(member.role) }}
                                        >
                                            {getRoleIcon(member.role)} {member.role}
                                        </span>
                                    </div>
                                </div>
                                <div className="member-archetype">
                                    #{member.tokenId}
                                </div>
                            </motion.div>
                        ))}

                        {/* Empty Slots */}
                        {Array.from({
                            length: teamRequirements.maxPlayers - (currentTeam?.members.length || 0)
                        }).map((_, index) => (
                            <div key={`empty-${index}`} className="team-member empty">
                                <div className="empty-slot">
                                    <span className="empty-icon">👤</span>
                                    <span className="empty-text">Empty Slot</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Invite Player */}
                <div className="invite-section">
                    <h3>Invite Player</h3>
                    <div className="invite-form">
                        <input
                            type="text"
                            placeholder="Wallet Address (0x...)"
                            value={searchAddress}
                            onChange={(e) => setSearchAddress(e.target.value)}
                            className="invite-input"
                        />
                        <input
                            type="number"
                            placeholder="Token ID"
                            value={searchTokenId}
                            onChange={(e) => setSearchTokenId(e.target.value)}
                            className="invite-input short"
                        />
                        <button
                            className="invite-btn"
                            onClick={handleInvitePlayer}
                            disabled={!searchAddress || !searchTokenId || loading}
                        >
                            {loading ? '...' : '📧 Send Invite'}
                        </button>
                    </div>
                </div>

                {/* Pending Invites */}
                {heistInvites && heistInvites.length > 0 && (
                    <div className="pending-invites">
                        <h3>Pending Invites ({heistInvites.length})</h3>
                        <div className="invites-list">
                            {heistInvites.map(invite => (
                                <div key={invite.inviteId} className="invite-item">
                                    <span>Invited #{invite.invitedPlayer.tokenId}</span>
                                    <span className="invite-status">⏳ Pending</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="error-message"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            ⚠️ {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="heist-actions">
                    <button className="cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="start-heist-btn"
                        onClick={handleStartHeist}
                        disabled={
                            !currentTeam ||
                            !currentTeam.hasRequiredRoles ||
                            currentTeam.members.length < teamRequirements.minPlayers
                        }
                    >
                        🎯 Start Heist
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default HeistTeamUI;
