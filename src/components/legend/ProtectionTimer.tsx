import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GAME_CONSTANTS } from '../../data/gameData';

interface ProtectionTimerProps {
    lastSeen?: Date;
    isOnline?: boolean;
    isDead?: boolean;
    lastSafeSleep?: Date;
    sleepLocation?: 'inn' | 'brothel' | null;
}

const ProtectionTimer: React.FC<ProtectionTimerProps> = ({
    isOnline,
    isDead,
    lastSafeSleep,
    sleepLocation
}) => {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isProtected, setIsProtected] = useState(false);

    // Get protection duration based on sleep location
    const getProtectionDuration = () => {
        if (sleepLocation === 'brothel') {
            return GAME_CONSTANTS.BROTHEL_PROTECTION_DURATION; // 12 hours
        } else if (sleepLocation === 'inn') {
            return GAME_CONSTANTS.INN_PROTECTION_DURATION; // 8 hours
        }
        return 5 * 60 * 1000; // Fallback: 5 minutes (legacy)
    };

    useEffect(() => {
        if (!lastSafeSleep || isDead) {
            setIsProtected(false);
            return;
        }

        const checkProtection = () => {
            const protectionDuration = getProtectionDuration();
            const now = Date.now();
            const sleepTime = new Date(lastSafeSleep).getTime();
            const timeSinceSleep = now - sleepTime;
            const remaining = protectionDuration - timeSinceSleep;

            if (remaining > 0) {
                setIsProtected(true);
                setTimeRemaining(remaining);
            } else {
                setIsProtected(false);
                setTimeRemaining(0);
            }
        };

        checkProtection();
        const interval = setInterval(checkProtection, 1000);

        return () => clearInterval(interval);
    }, [lastSafeSleep, isOnline, isDead, sleepLocation]);

    if (!isProtected || isDead) return null;

    // Format time remaining
    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);

    // Format display based on duration
    const formatTimeDisplay = () => {
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Get protection source text
    const getProtectionSource = () => {
        if (isOnline) {
            return "You cannot be attacked while online";
        }
        if (sleepLocation === 'brothel') {
            return "Premium protection from Violet's";
        }
        if (sleepLocation === 'inn') {
            return "Protected by The Inn";
        }
        return "Grace period - safe from attacks";
    };

    // Get border color based on sleep location
    const getBorderColor = () => {
        if (sleepLocation === 'brothel') {
            return 'border-pink-500';
        }
        return 'border-[#00FF88]';
    };

    const getGlowColor = () => {
        if (sleepLocation === 'brothel') {
            return [
                '0 0 10px rgba(236, 72, 153, 0.3)',
                '0 0 20px rgba(236, 72, 153, 0.6)',
                '0 0 10px rgba(236, 72, 153, 0.3)',
            ];
        }
        return [
            '0 0 10px rgba(34, 197, 94, 0.3)',
            '0 0 20px rgba(34, 197, 94, 0.6)',
            '0 0 10px rgba(34, 197, 94, 0.3)',
        ];
    };

    const getTextColor = () => {
        if (sleepLocation === 'brothel') {
            return 'text-pink-400';
        }
        return 'text-green-400';
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-20 md:top-4 right-2 md:right-4 z-40 max-w-[200px] md:max-w-none"
            >
                <motion.div
                    animate={{
                        boxShadow: getGlowColor(),
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    className={`bg-gradient-to-br ${sleepLocation === 'brothel' ? 'from-pink-900 to-purple-900' : 'from-green-900 to-emerald-900'} border-2 ${getBorderColor()} rounded-lg p-2 md:p-4 shadow-xl`}
                >
                    <div className="flex items-center space-x-2 md:space-x-3">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, -10, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                            className="text-2xl md:text-3xl"
                        >
                            {sleepLocation === 'brothel' ? '💋' : '🛡️'}
                        </motion.div>
                        <div>
                            <h3 className={`${getTextColor()} font-bold text-xs md:text-sm`}>
                                {sleepLocation === 'brothel' ? 'PREMIUM PROTECTION' : 'PVP PROTECTION'}
                            </h3>
                            {isOnline ? (
                                <p className={`${sleepLocation === 'brothel' ? 'text-pink-300' : 'text-green-300'} text-xs`}>Active</p>
                            ) : (
                                <p className="text-white font-mono text-sm md:text-lg">
                                    {formatTimeDisplay()}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="mt-1 md:mt-2 text-xs text-gray-300 hidden md:block">
                        {getProtectionSource()}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProtectionTimer;
