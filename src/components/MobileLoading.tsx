import React from 'react';
import { motion } from 'framer-motion';

interface MobileLoadingProps {
    message?: string;
    showProgress?: boolean;
    progress?: number;
}

const MobileLoading: React.FC<MobileLoadingProps> = ({
    message = "Loading...",
    showProgress = false,
    progress = 0
}) => {
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4 z-modal">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black/80 backdrop-blur-sm rounded-2xl p-8 max-w-sm w-full text-center border border-[#FFD700]/30"
            >
                {/* Animated Lizard */}
                <motion.div
                    animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="text-6xl mb-6"
                >
                    🦎
                </motion.div>

                {/* Loading Text */}
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl font-bold text-white mb-4"
                >
                    {message}
                </motion.h2>

                {/* Progress Bar */}
                {showProgress && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mb-6"
                    >
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-neon-green to-neon-blue rounded-full"
                            />
                        </div>
                        <p className="text-sm text-gray-400 mt-2">{progress}%</p>
                    </motion.div>
                )}

                {/* Animated Dots */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-center space-x-1"
                >
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                            className="w-2 h-2 bg-[#FFD700] rounded-full"
                        />
                    ))}
                </motion.div>

                {/* Mobile-specific tips */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6 text-xs text-gray-400"
                >
                    <p className="mb-2">💡 Pro Tips:</p>
                    <ul className="text-left space-y-1">
                        <li>• Enable notifications for jackpot alerts</li>
                        <li>• Add BNB Testnet to your wallet first</li>
                        <li>• Keep MetaMask updated for best experience</li>
                    </ul>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default MobileLoading;
