// Quest Notification System
// Displays toast notifications for quest events with epic visuals

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuests } from '../contexts/QuestContext';
import type { QuestNotification } from '../types/quest.types';
import '../styles/QuestNotifications.css';

interface QuestNotificationProps {
    maxVisible?: number;
}

const QuestNotifications: React.FC<QuestNotificationProps> = ({ maxVisible = 3 }) => {
    const { notifications, markNotificationRead } = useQuests();
    const [visibleNotifications, setVisibleNotifications] = useState<QuestNotification[]>([]);

    useEffect(() => {
        // Show only unread notifications, limited to maxVisible
        const unread = notifications.filter(n => !n.read).slice(0, maxVisible);
        setVisibleNotifications(unread);
    }, [notifications, maxVisible]);

    const handleDismiss = (notificationId: string) => {
        markNotificationRead(notificationId);
    };

    const getNotificationIcon = (type: QuestNotification['type']) => {
        const icons = {
            new_quest: '📜',
            objective_complete: '✅',
            quest_complete: '🎉',
            quest_failed: '❌',
            quest_expired: '⏰'
        };
        return icons[type] || '📜';
    };

    const getNotificationColor = (type: QuestNotification['type']) => {
        const colors = {
            new_quest: 'blue',
            objective_complete: 'green',
            quest_complete: 'gold',
            quest_failed: 'red',
            quest_expired: 'gray'
        };
        return colors[type] || 'blue';
    };

    return (
        <div className="quest-notifications-container">
            <AnimatePresence mode="popLayout">
                {visibleNotifications.map((notification, index) => (
                    <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 300, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 300, scale: 0.8 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                            delay: index * 0.1
                        }}
                        className={`quest-notification quest-notification-${getNotificationColor(notification.type)}`}
                        style={{ top: `${20 + index * 110}px` }}
                    >
                        {/* Icon */}
                        <div className="quest-notification-icon">
                            {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="quest-notification-content">
                            <div className="quest-notification-title">
                                {notification.questTitle}
                            </div>
                            <div className="quest-notification-message">
                                {notification.message}
                            </div>

                            {/* Rewards Display */}
                            {notification.rewards && (
                                <div className="quest-notification-rewards">
                                    {notification.rewards.gold && (
                                        <span className="reward-item">💰 {notification.rewards.gold}</span>
                                    )}
                                    {notification.rewards.experience && (
                                        <span className="reward-item">⭐ {notification.rewards.experience} XP</span>
                                    )}
                                    {notification.rewards.reputation && (
                                        <span className="reward-item">📈 {notification.rewards.reputation} Rep</span>
                                    )}
                                    {notification.rewards.nftReward && (
                                        <span className="reward-item nft-reward">
                                            🖼️ {notification.rewards.nftReward.name}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Close Button */}
                        <button
                            className="quest-notification-close"
                            onClick={() => handleDismiss(notification.id)}
                            aria-label="Dismiss notification"
                        >
                            ✕
                        </button>

                        {/* Progress Bar */}
                        <motion.div
                            className="quest-notification-progress"
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: 5, ease: "linear" }}
                            onAnimationComplete={() => handleDismiss(notification.id)}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default QuestNotifications;
