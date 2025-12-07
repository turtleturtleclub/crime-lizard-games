import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { Howl } from 'howler';
import { WalletContext } from '../providers/WalletContext';
import { shouldRespondToMessage, isBotMentioned, detectScam } from '../utils/aiTriggerDetection';

interface Message {
    channel: string;
    message: string;
    username: string;
    type: 'message' | 'win' | 'announcement' | 'emote' | 'ai' | 'freespins' | 'system';
    timestamp: string;
    amount?: string;
    userId?: string;
    adminId?: string;
}

interface UserCount {
    channel: string;
    count: number;
}

const ModernChat: React.FC<{ soundEnabled: boolean; soundSystemReady: boolean }> = ({ soundEnabled, soundSystemReady }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [currentTab, setCurrentTab] = useState<'local' | 'world' | 'ai' | 'announcements'>('local');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [username, setUsername] = useState('');
    const [userCounts, setUserCounts] = useState<Record<string, number>>({});
    const [isConnected, setIsConnected] = useState(false);
    const location = useLocation();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const { account } = useContext(WalletContext);

    // Sound effects
    const messageSound = useRef<Howl | null>(null);
    const winSound = useRef<Howl | null>(null);
    const announcementSound = useRef<Howl | null>(null);

    // Initialize sounds
    useEffect(() => {
        messageSound.current = new Howl({ src: ['/assets/chatping.ogg'], volume: 0.3 });
        winSound.current = new Howl({ src: ['/assets/win.mp3'], volume: 0.3 });
        announcementSound.current = new Howl({ src: ['/assets/jackpot.mp3'], volume: 0.4 });
    }, []);

    // Detect local channel from route
    const getLocalChannel = () => {
        if (location.pathname === '/slots') return 'slots';
        if (location.pathname === '/roulette') return 'roulette';
        if (location.pathname === '/legend') return 'legend';
        return 'lair';
    };

    const localChannel = getLocalChannel();

    // Get display name and emoji for local channel
    const getLocalChannelDisplay = () => {
        if (location.pathname === '/slots') return { name: 'Slots', emoji: '🎰' };
        if (location.pathname === '/roulette') return { name: 'Roulette', emoji: '🎯' };
        if (location.pathname === '/legend') return { name: 'Legend', emoji: '🦎' };
        return { name: 'Lair', emoji: '🦎' };
    };

    const localChannelDisplay = getLocalChannelDisplay();

    // Get username from unified profile (synced from /api/profile)
    useEffect(() => {
        if (account) {
            // First try the main profile endpoint which syncs to users.nickname
            fetch(`/api/profile/${account}`)
                .then(response => response.json())
                .then(profile => {
                    if (profile && profile.username) {
                        setUsername(profile.username);
                        if (socketRef.current && socketRef.current.connected) {
                            socketRef.current.emit('updateProfile', {
                                userId: account,
                                nickname: profile.username
                            });
                        }
                    } else {
                        // Fallback to player endpoint (for backwards compatibility)
                        fetch(`/api/player/${account}`)
                            .then(res => res.json())
                            .then(playerData => {
                                const displayName = playerData?.nickname || `Lizard${account.slice(-4)}`;
                                setUsername(displayName);
                            })
                            .catch(_error => {
                                const walletUsername = `Lizard${account.slice(-4)}`;
                                setUsername(walletUsername);
                            });
                    }
                })
                .catch(_error => {
                    const walletUsername = `Lizard${account.slice(-4)}`;
                    setUsername(walletUsername);
                });
        } else {
            const stored = localStorage.getItem('chatUsername');
            setUsername(stored || `Lizard${Math.floor(Math.random() * 1000)}`);
        }
    }, [account]);

    // Connect to socket
    useEffect(() => {
        // Use current domain for socket connection, fallback to localhost for development
        const serverUrl = import.meta.env.DEV
            ? 'http://localhost:3003'
            : window.location.origin;
socketRef.current = io(serverUrl, {
            transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10,
            timeout: 20000,
            upgrade: true,
            rememberUpgrade: true
        });

        socketRef.current.on('connect', () => {
setIsConnected(true);
            socketRef.current?.emit('joinChannel', {
                channel: localChannel,
                username,
                userId: account || 'anonymous'
            });
            socketRef.current?.emit('joinChannel', {
                channel: 'world',
                username,
                userId: account || 'anonymous'
            });
        });

        socketRef.current.on('disconnect', (_reason) => {
setIsConnected(false);
        });

        socketRef.current.on('connect_error', (_error) => {
setIsConnected(false);
        });

        socketRef.current.on('reconnect', (_attemptNumber) => {
setIsConnected(true);
            // Rejoin the current channel
            socketRef.current?.emit('joinChannel', {
                channel: localChannel,
                username,
                userId: account || 'anonymous'
            });
        });

        socketRef.current.on('reconnect_attempt', () => {
});

        socketRef.current.on('reconnect_error', (_error) => {
setIsConnected(false);
        });

        socketRef.current.on('reconnect_failed', () => {
setIsConnected(false);
            // Try to reconnect manually after a longer delay
            setTimeout(() => {
                if (socketRef.current && !socketRef.current.connected) {
socketRef.current.connect();
                }
            }, 10000);
        });

        // Handle loading persisted messages
        socketRef.current.on('loadMessages', (loadedMessages: Message[]) => {
            setMessages(prev => {
                const existingTimestamps = new Set(prev.map(m => m.timestamp));
                const newMessages = loadedMessages.filter(m => !existingTimestamps.has(m.timestamp));
                return [...prev, ...newMessages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            });
            setTimeout(() => scrollToBottom(), 50);
        });

        // Handle incoming messages
        socketRef.current.on('newMessage', (msg: Message) => {
            setMessages(prev => [...prev, msg]);

            // Play appropriate sound
            if (soundEnabled && soundSystemReady) {
                if (msg.type === 'win' && winSound.current) {
                    winSound.current.play();
                } else if (msg.type === 'announcement' && announcementSound.current) {
                    announcementSound.current.play();
                } else if (msg.type === 'message' && messageSound.current) {
                    messageSound.current.play();
                }
            }
            scrollToBottom();
        });

        // Handle user count updates
        socketRef.current.on('userCount', (data: UserCount) => {
            setUserCounts(prev => ({ ...prev, [data.channel]: data.count }));
        });

        // Handle chat cleared by admin
        socketRef.current.on('chatCleared', () => {
setMessages([]);
            if (soundEnabled && soundSystemReady && announcementSound.current) {
                announcementSound.current.play();
            }
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [localChannel, username, account, soundEnabled, soundSystemReady]);

    // Reconnect when channel changes
    useEffect(() => {
        if (socketRef.current && username) {
            socketRef.current.emit('joinChannel', {
                channel: localChannel,
                username,
                userId: account || 'anonymous'
            });
        }
    }, [localChannel, username, account]);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentTab, localChannel]);

    useEffect(() => {
        if (isExpanded) {
            setTimeout(() => scrollToBottom(), 100);
        }
    }, [isExpanded]);

    useEffect(() => {
        setCurrentTab('local');
    }, [location.pathname]);

    useEffect(() => {
        if (isExpanded) {
            setTimeout(() => scrollToBottom(), 50);
        }
    }, [currentTab]);

    const sendMessage = () => {
        if (input.trim() && socketRef.current && isConnected) {
            const messageText = input.trim();

            // Handle AI tab differently
            if (currentTab === 'ai') {
                // First, display the user's message in the AI chat
                const userMessage: Message = {
                    channel: 'ai',
                    message: messageText,
                    username,
                    type: 'message',
                    timestamp: new Date().toISOString(),
                    userId: account || 'anonymous'
                };
                setMessages(prev => [...prev, userMessage]);

                // Then send to AI handler
                socketRef.current.emit('aiMessage', {
                    message: messageText,
                    channel: localChannel,
                    context: { username, userId: account, channel: localChannel }
                });
                setInput('');
                scrollToBottom();
                return;
            }

            const channel = currentTab === 'local' ? localChannel : currentTab === 'world' ? 'world' : null;

            if (channel) {
                // Check for slash commands
                if (messageText.startsWith('/')) {
                    const [command, ...args] = messageText.slice(1).split(' ');
                    const param = args.join(' ');

                    switch (command.toLowerCase()) {
                        case 'wave':
                            socketRef.current.emit('sendEmote', {
                                channel,
                                emote: '👋 *waves*',
                                username,
                                userId: account || 'anonymous'
                            });
                            break;
                        case 'channel':
                        case 'c':
                            if (param) {
                                if (param.toLowerCase() === 'world' || param.toLowerCase() === 'lizard land') {
                                    setCurrentTab('world');
                                } else if (param.toLowerCase() === 'local' || param.toLowerCase() === localChannelDisplay.name.toLowerCase()) {
                                    setCurrentTab('local');
                                } else if (param.toLowerCase() === 'ai' || param.toLowerCase() === 'lizard ai') {
                                    setCurrentTab('ai');
                                } else if (param.toLowerCase() === 'announcements' || param.toLowerCase() === 'announce') {
                                    setCurrentTab('announcements');
                                }
                            }
                            break;
                        default:
                            socketRef.current.emit('sendMessage', {
                                channel,
                                message: messageText,
                                username,
                                type: 'message',
                                userId: account || 'anonymous'
                            });
                    }
                } else {
                    // Run scam detection first
                    const scamCheck = detectScam(messageText);

                    // If high confidence scam, warn and don't send
                    if (scamCheck.isScam && scamCheck.confidence === 'high') {
                        const warningMessage: Message = {
                            channel: 'world',
                            message: `⚠️ Your message was blocked for safety: ${scamCheck.reason}. Never share private keys or click suspicious links!`,
                            username: '🛡️ Security',
                            type: 'system',
                            timestamp: new Date().toISOString(),
                            userId: 'security-bot'
                        };
                        setMessages(prev => [...prev, warningMessage]);
                        setInput('');
                        return;
                    }

                    // Check if AI should respond (mentions or trigger keywords)
                    const mentioned = isBotMentioned(messageText);
                    const shouldRespond = shouldRespondToMessage(messageText, mentioned);

                    // Send message to server - it will be broadcast back to all clients including us
                    socketRef.current.emit('sendMessage', {
                        channel,
                        message: messageText,
                        username,
                        type: 'message',
                        userId: account || 'anonymous'
                    });

                    // If AI should respond, send to AI handler
                    if (shouldRespond && currentTab !== 'announcements') {
                        setTimeout(() => {
                            socketRef.current?.emit('aiMessage', {
                                message: messageText.replace(/@ai|@lizard ai|@lizardai|@crimelizard/gi, '').trim(),
                                channel,
                                context: { username, userId: account, channel }
                            });
                        }, 500);
                    }
                }
                setInput('');
                scrollToBottom();
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const getMessageColor = (type: Message['type']) => {
        switch (type) {
            case 'message':
                return 'text-text-primary';
            case 'win':
                return 'text-[#FFD700] font-semibold drop-shadow-sm';
            case 'announcement':
                return 'text-accent-gold font-bold drop-shadow-sm';
            case 'emote':
                return 'text-soft-green italic font-medium';
            case 'ai':
                return 'text-soft-blue font-medium drop-shadow-sm';
            case 'freespins':
                return 'text-neon-blue font-semibold drop-shadow-sm';
            case 'system':
                return 'text-text-muted text-sm';
            default:
                return 'text-text-primary';
        }
    };

    const getChannelIcon = (tabKey: string) => {
        switch (tabKey) {
            case 'local':
                return localChannelDisplay.emoji;
            case 'world':
                return '✈️';
            case 'ai':
                return '🤖';
            case 'announcements':
                return '📢';
            default:
                return '💬';
        }
    };

    const getChannelName = (tabKey: string) => {
        switch (tabKey) {
            case 'local':
                return localChannelDisplay.name;
            case 'world':
                return 'Telegram';
            case 'ai':
                return 'AI';
            case 'announcements':
                return 'News';
            default:
                return 'Chat';
        }
    };

    // Filter messages for current tab
    const filteredMessages = messages
        .filter(msg => {
            if (currentTab === 'local') return msg.channel === localChannel;
            if (currentTab === 'world') return msg.channel === 'world';
            if (currentTab === 'ai') return msg.type === 'ai';
            if (currentTab === 'announcements') return msg.type === 'announcement';
            return false;
        })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (!isExpanded) {
        return (
            <motion.button
                onClick={() => setIsExpanded(true)}
                className="fixed bottom-[calc(4rem+2px)] right-4 md:bottom-[calc(4rem+2px)] md:right-6 z-chat bg-black border-2 border-[#FFD700]/60 rounded-full p-3 shadow-lg shadow-primary-gold/20 hover:shadow-xl hover:shadow-primary-gold/40 transition-all hover:scale-105"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                title="Open GameFAI Chat"
            >
                <span className="text-xl">💬</span>
            </motion.button>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0, scale: 0.9 }}
                animate={{
                    y: 0,
                    opacity: 1,
                    scale: 1
                }}
                exit={{ y: 100, opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`fixed bg-black/95 border-2 border-[#FFD700]/60 rounded-xl shadow-2xl shadow-primary-gold/20 overflow-hidden flex flex-col ${isMaximized
                    ? 'inset-2 md:inset-8 z-chat h-[calc(100vh-1rem)] md:h-[calc(100vh-4rem)]'
                    : 'bottom-16 right-2 left-2 md:bottom-8 md:right-4 md:left-auto md:w-[32rem] h-80 z-chat'
                    }`}
            >
                {/* Terminal-Style Header with Tabs */}
                <div className="flex items-center bg-black/80 border-b-2 border-[#00FF88]/50">
                    <div className="flex flex-1">
                        {['local', 'world', 'ai', 'announcements'].map((tab) => (
                            <motion.button
                                key={tab}
                                onClick={() => setCurrentTab(tab as any)}
                                className={`flex-1 flex items-center justify-center space-x-1 md:space-x-2 py-3 px-1 md:px-2 text-sm font-bbs transition-all duration-300 ${currentTab === tab
                                    ? 'bg-[#00AA55]/30 text-[#FFD700] border-b-2 border-[#FFD700] shadow-lg shadow-primary-gold/20'
                                    : 'text-[#00FF88] hover:text-[#FFD700] hover:bg-[#00AA55]/20'
                                    }`}
                                whileHover={{ scale: currentTab !== tab ? 1.02 : 1 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="text-base md:text-base">{getChannelIcon(tab)}</span>
                                <span className="hidden md:inline">{getChannelName(tab)}</span>
                            </motion.button>
                        ))}
                    </div>

                    <div className="flex items-center space-x-1 px-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 shadow-sm shadow-green-400' : 'bg-red-400'} animate-pulse`}></div>
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="text-[#FFD700] hover:text-green-400 hover:bg-[#00AA55]/30 p-2 rounded font-bold text-sm transition-all duration-200 font-bbs"
                            title={isMaximized ? "Restore to Mini Window" : "Maximize to Full Screen"}
                        >
                            {isMaximized ? '⬜' : '⬛'}
                        </button>
                        <button
                            onClick={() => {
                                setIsExpanded(false);
                                setIsMaximized(false);
                            }}
                            className="text-[#FFD700] hover:text-green-400 hover:bg-[#00AA55]/30 p-2 rounded font-bold text-sm transition-all duration-200 font-bbs"
                            title="Minimize to Chat Bubble"
                        >
                            ▼
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                {(
                    <div
                        ref={messagesContainerRef}
                        className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/60 font-bbs"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(0, 255, 0, 0.5) rgba(0, 0, 0, 0.3)',
                        }}
                    >
                        {filteredMessages.length === 0 ? (
                            <div className="text-center text-[#00FF88] py-8">
                                <div className="text-4xl mb-2">
                                    {currentTab === 'announcements' ? '📢' : '💬'}
                                </div>
                                <p className="text-sm text-[#FFD700]">
                                    {currentTab === 'announcements'
                                        ? 'No announcements yet'
                                        : `No messages in ${getChannelName(currentTab)} yet`}
                                </p>
                                <p className="text-xs text-[#00DD77] mt-1">
                                    Be the first to start the conversation!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredMessages.map((msg, i) => (
                                    <motion.div
                                        key={`${msg.timestamp}-${i}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`${getMessageColor(msg.type)} break-words text-sm leading-relaxed`}
                                    >
                                        <div className="flex items-start space-x-2">
                                            <span className="text-xs text-[#00DD77] font-mono min-w-[50px] text-right">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            <div className="flex-1">
                                                <span className="text-[#FFD700] font-medium text-xs text-glow-gold">
                                                    {msg.username}
                                                </span>
                                                {msg.username.startsWith('📱') && (
                                                    <span className="text-blue-400 text-xs ml-1" title="From Telegram">
                                                        📱
                                                    </span>
                                                )}
                                                <span className="text-[#00DD77] mx-1">:</span>
                                                {msg.type === 'win' ? (
                                                    <span className="text-[#FFD700] font-semibold text-glow-gold">
                                                        {msg.message}
                                                        {msg.amount && (
                                                            <span className="text-green-400 font-bold ml-1 text-glow-green">
                                                                {msg.amount}
                                                            </span>
                                                        )}
                                                    </span>
                                                ) : msg.type === 'announcement' ? (
                                                    <div className="bg-red-900/30 border-2 border-red-500/50 rounded p-2 mt-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <span className="text-red-400 font-bold text-xs text-glow-red">📢 ANNOUNCEMENT</span>
                                                        </div>
                                                        <span className="text-red-300">{msg.message}</span>
                                                    </div>
                                                ) : msg.type === 'ai' ? (
                                                    <div className="bg-[#00AA55]/30 border-2 border-[#00FF88]/50 rounded p-2 mt-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <span className="text-green-400 font-bold text-xs text-glow-green">🤖 LIZARD AI</span>
                                                        </div>
                                                        <span className="text-green-300">{msg.message}</span>
                                                    </div>
                                                ) : msg.type === 'emote' ? (
                                                    <span className="text-green-400 italic text-glow-green">{msg.message}</span>
                                                ) : (
                                                    <span className="text-green-300">{msg.message}</span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Terminal-Style Input Area */}
                {(
                    <div className="bg-black/80 border-t-2 border-[#00FF88]/50 p-3">
                        <div className="flex space-x-2">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={`Message ${getChannelName(currentTab)}... (/wave, /c world, @AI for help)`}
                                className="flex-1 bg-black/60 border-2 border-[#00FF88]/50 rounded px-3 py-2 text-green-400 placeholder-green-700 focus:outline-none focus:border-[#FFD700]/70 focus:shadow-sm focus:shadow-primary-gold/20 text-sm transition-all duration-300 font-bbs"
                                maxLength={200}
                                disabled={!isConnected}
                            />
                            <motion.button
                                onClick={sendMessage}
                                disabled={!input.trim() || !isConnected}
                                className={`px-4 py-2 rounded font-semibold text-sm transition-all duration-300 font-bbs ${input.trim() && isConnected
                                    ? 'bg-[#00AA55]/60 text-[#FFD700] border-2 border-[#FFD700]/60 hover:bg-[#00AA55]/80 hover:shadow-md hover:shadow-primary-gold/30'
                                    : 'bg-black/40 text-[#00BB66] cursor-not-allowed border-2 border-[#00AA55]/50'
                                    }`}
                                whileHover={input.trim() && isConnected ? { scale: 1.02 } : {}}
                                whileTap={input.trim() && isConnected ? { scale: 0.98 } : {}}
                                title={!isConnected ? 'Connecting...' : 'Send message'}
                            >
                                {isConnected ? 'SEND' : '⋯'}
                            </motion.button>
                        </div>

                        {/* Terminal Status Bar with Username Display */}
                        <div className="flex justify-between items-center mt-2 text-xs text-[#00DD77] font-bbs">
                            <div className="flex items-center space-x-2 md:space-x-4 flex-wrap">
                                <span className="flex items-center space-x-1">
                                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 shadow-sm shadow-green-400' : 'bg-red-400'} animate-pulse`}></div>
                                    <span className={isConnected ? 'text-green-400' : 'text-red-400'}>{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                                </span>
                                {username && (
                                    <span className="flex items-center space-x-1 text-[#FFD700] bg-black/40 px-2 py-1 border border-[#FFD700]/50 rounded">
                                        <span>👤</span>
                                        <span className="font-bold text-glow-gold">{username}</span>
                                    </span>
                                )}
                                {userCounts[currentTab === 'local' ? localChannel : currentTab] && (
                                    <span className="text-[#FFD700]">
                                        [{userCounts[currentTab === 'local' ? localChannel : currentTab]}] USERS
                                    </span>
                                )}
                                {currentTab === 'world' && (
                                    <span className="flex items-center space-x-1 text-[#00FF88]" title="Messages also sent to Telegram">
                                        📱 TG
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={input.length > 180 ? 'text-yellow-500' : 'text-[#00DD77]'}>{input.length}/200</span>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default ModernChat;
