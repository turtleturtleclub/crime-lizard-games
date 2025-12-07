import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'green' | 'red' | 'yellow' | 'blue';
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmColor = 'green',
    onConfirm,
    onCancel
}) => {
    const colorClasses = {
        green: {
            bg: 'bg-[#00AA55]',
            border: 'border-[#00FF88]',
            text: 'text-[#00FF88]',
            hover: 'hover:bg-[#00BB66]'
        },
        red: {
            bg: 'bg-red-900',
            border: 'border-red-500',
            text: 'text-red-500',
            hover: 'hover:bg-red-800'
        },
        yellow: {
            bg: 'bg-yellow-900',
            border: 'border-yellow-500',
            text: 'text-yellow-500',
            hover: 'hover:bg-yellow-800'
        },
        blue: {
            bg: 'bg-cyan-900',
            border: 'border-cyan-500',
            text: 'text-cyan-500',
            hover: 'hover:bg-cyan-800'
        }
    };

    const colors = colorClasses[confirmColor];

    // Handle ESC key
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onCancel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-confirmation p-4 overscroll-none"
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-black border-2 border-[#00FF88] p-6 max-w-md w-full font-bbs"
                    >
                        {/* Title */}
                        <div className="text-[#00FF88] text-center mb-4">
                            <div className="text-2xl font-bold text-glow-green">{title}</div>
                        </div>

                        {/* Message */}
                        <div className="bg-black border border-[#00FF88]/30 p-4 mb-6 text-center">
                            <p className="text-white text-lg">{message}</p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 px-4 py-3 bg-black border-2 border-gray-600 text-gray-400 hover:bg-gray-900 font-bold transition-all"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                className={`flex-1 px-4 py-3 ${colors.bg} border-2 ${colors.border} ${colors.text} ${colors.hover} font-bold transition-all`}
                            >
                                {confirmText}
                            </button>
                        </div>

                        {/* ESC hint */}
                        <div className="text-center mt-3 text-xs text-gray-500">
                            Press ESC to cancel
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;
