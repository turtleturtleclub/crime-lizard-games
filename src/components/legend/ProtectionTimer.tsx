import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProtectionTimerProps {
    lastSeen?: Date;
    isOnline?: boolean;
    isDead?: boolean;
}

const ProtectionTimer: React.FC<ProtectionTimerProps> = ({ lastSeen, isOnline, isDead }) => {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isProtected, setIsProtected] = useState(false);

    useEffect(() => {
        if (!lastSeen || isDead) {
            setIsProtected(false);
            return;
        }

        const checkProtection = () => {
            const GRACE_PERIOD = 5 * 60 * 1000; // 5 minutes
            const now = Date.now();
            const lastSeenTime = new Date(lastSeen).getTime();
            const timeSinceLastSeen = now - lastSeenTime;
            const remaining = GRACE_PERIOD - timeSinceLastSeen;

            if (remaining > 0 && !isOnline) {
                setIsProtected(true);
                setTimeRemaining(remaining);
            } else if (isOnline) {
                // Always protected while online
                setIsProtected(true);
                setTimeRemaining(GRACE_PERIOD);
            } else {
                setIsProtected(false);
                setTimeRemaining(0);
            }
        };

        checkProtection();
        const interval = setInterval(checkProtection, 1000);

        return () => clearInterval(interval);
    }, [lastSeen, isOnline, isDead]);

    if (!isProtected || isDead) return null;

    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);

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
                        boxShadow: [
                            '0 0 10px rgba(34, 197, 94, 0.3)',
                            '0 0 20px rgba(34, 197, 94, 0.6)',
                            '0 0 10px rgba(34, 197, 94, 0.3)',
                        ],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    className="bg-gradient-to-br from-green-900 to-emerald-900 border-2 border-[#00FF88] rounded-lg p-2 md:p-4 shadow-xl"
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
                            🛡️
                        </motion.div>
                        <div>
                            <h3 className="text-green-400 font-bold text-xs md:text-sm">PVP PROTECTION</h3>
                            {isOnline ? (
                                <p className="text-green-300 text-xs">Active</p>
                            ) : (
                                <p className="text-white font-mono text-sm md:text-lg">
                                    {minutes}:{seconds.toString().padStart(2, '0')}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="mt-1 md:mt-2 text-xs text-gray-300 hidden md:block">
                        {isOnline ? (
                            "You cannot be attacked while online"
                        ) : (
                            "Grace period - safe from attacks"
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProtectionTimer;

