import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModalClose } from '../../hooks/useModalClose';

interface DailyMessage {
    title: string;
    message: string;
    tone: 'motivational' | 'warning' | 'celebration' | 'mysterious' | 'update';
    timestamp: Date;
    sysopName: string;
}

interface DailySysopMessageProps {
    onClose: () => void;
}

const DailySysopMessage: React.FC<DailySysopMessageProps> = ({ onClose }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose);

    const { t } = useLanguage();
    const [message, setMessage] = useState<DailyMessage | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if already seen today
        const lastSeen = localStorage.getItem('lastSysopMessageDate');
        const today = new Date().toDateString();

        if (lastSeen === today) {
            onClose();
            return;
        }

        // Fetch from backend or listen via socket
        fetchDailyMessage();
    }, []);

    const fetchDailyMessage = async () => {
        try {
            const response = await fetch('/api/legend/daily-message');
            if (response.ok) {
                const data = await response.json();
                setMessage(data);
            }
        } catch (error) {
            console.error('Failed to fetch daily message:', error);
            // Fallback message - use translations from context
            setMessage({
                title: t.dailyMessage.fallbackTitle,
                message: t.dailyMessage.fallbackMessage,
                tone: 'mysterious',
                timestamp: new Date(),
                sysopName: t.dailyMessage.sysopName
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        localStorage.setItem('lastSysopMessageDate', new Date().toDateString());
        onClose();
    };

    if (loading || !message) {
        return null;
    }

    const modalContent = (

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hidden md:flex fixed inset-0 bg-black items-center justify-center p-4 overscroll-none"
            style={{ zIndex: 9999 }}
            onClick={handleClose}
        >
            <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                transition={{ type: 'spring', bounce: 0.4 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border-4 border-[#00FF88] p-8 max-w-2xl w-full relative overflow-hidden font-bbs"
                style={{ boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)' }}
            >
                {/* Scanlines Effect */}
                <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-30" />

                {/* Content */}
                <div className="relative z-10">
                    {/* Header */}
                    <div className="text-center mb-6 border-b-2 border-[#00FF88] pb-4">
                        <div className="text-[#00FF88] text-xl mb-2 tracking-wider text-glow-green">
                            ╔═══════════════════════════════════╗
                        </div>
                        <h2 className="text-3xl font-bold text-[#FFD700] mb-2 tracking-wide text-glow-gold uppercase">
                            {message.title}
                        </h2>
                        <div className="text-[#00FF88] text-xl mb-2 tracking-wider text-glow-green">
                            ╚═══════════════════════════════════╝
                        </div>
                        <p className="text-sm text-[#00AA55] font-mono mt-3">
                            &gt; FROM: {message.sysopName}
                        </p>
                        <p className="text-sm text-[#00AA55] font-mono">
                            &gt; DATE: {new Date(message.timestamp).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Message Body */}
                    <div className="bg-black p-6 mb-6 border-2 border-[#00AA55]" style={{ boxShadow: 'inset 0 0 15px rgba(0, 255, 136, 0.2)' }}>
                        <pre className="text-[#00FF88] leading-relaxed whitespace-pre-wrap text-lg text-glow-green font-mono">
{message.message}
                        </pre>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center border-t-2 border-[#00FF88] pt-4">
                        <div className="text-sm text-[#00AA55] font-mono">
                            [ PRESS ANY KEY TO CONTINUE ]
                        </div>
                        <button
                            onClick={handleClose}
                            className="px-6 py-3 bg-[#00FF88] text-black font-bold uppercase tracking-wider border-2 border-[#00AA55] hover:bg-[#00AA55] hover:text-[#00FF88] transition-all retro-button"
                            style={{ boxShadow: '0 4px 0 #00AA55, 0 0 10px rgba(0, 255, 136, 0.5)' }}
                        >
                            {t.dailyMessage.beginAdventure}
                        </button>
                    </div>
                </div>

                {/* Decorative ASCII Elements */}
                <div className="absolute top-2 right-2 text-[#00FF88] opacity-30 text-2xl font-mono pointer-events-none">
                    [SYSOP]
                </div>
                <div className="absolute bottom-2 left-2 text-[#00FF88] opacity-30 text-xl font-mono pointer-events-none">
                    &gt;_
                </div>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default DailySysopMessage;
