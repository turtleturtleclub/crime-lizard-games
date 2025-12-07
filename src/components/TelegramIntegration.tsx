// Telegram Integration Component for Legend Game
// Provides UI for managing Telegram bot integration

import React, { useState, useEffect } from 'react';
import { useTelegram } from '../services/TelegramService';

interface TelegramIntegrationProps {
    onClose: () => void;
}

const TelegramIntegration: React.FC<TelegramIntegrationProps> = ({ onClose }) => {
    const [chatId, setChatId] = useState('');
    const [botInfo, setBotInfo] = useState<any>(null);
    const [testMessage, setTestMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    const telegram = useTelegram();

    useEffect(() => {
        loadBotInfo();
    }, []);

    const loadBotInfo = async () => {
        setIsLoading(true);
        try {
            const info = await telegram.getBotInfo();
            setBotInfo(info);
        } catch (error) {
            console.error('Error loading bot info:', error);
            setMessage('Failed to load bot information');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendTestMessage = async () => {
        if (!testMessage.trim()) {
            setMessage('Please enter a test message');
            setMessageType('error');
            return;
        }

        setIsLoading(true);
        try {
            const success = await telegram.sendMessage(testMessage);
            if (success) {
                setMessage('Test message sent successfully!');
                setMessageType('success');
                setTestMessage('');
            } else {
                setMessage('Failed to send test message');
                setMessageType('error');
            }
        } catch (error) {
            console.error('Error sending test message:', error);
            setMessage('Failed to send test message');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendGameUpdate = async () => {
        const gameUpdate = {
            type: 'character_minted' as const,
            player: {
                name: 'Test Player',
                address: '0x1234567890abcdef',
                level: 5
            },
            details: {
                archetype: 'The Prince',
                tokenId: 12345
            },
            timestamp: Date.now()
        };

        setIsLoading(true);
        try {
            await telegram.sendGameUpdate(gameUpdate);
            setMessage('Game update sent successfully!');
            setMessageType('success');
        } catch (error) {
            console.error('Error sending game update:', error);
            setMessage('Failed to send game update');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendLeaderboard = async () => {
        const leaderboard = [
            { name: 'Player 1', level: 10, goldStolen: 5000 },
            { name: 'Player 2', level: 8, goldStolen: 3500 },
            { name: 'Player 3', level: 7, goldStolen: 2800 }
        ];

        setIsLoading(true);
        try {
            await telegram.sendLeaderboard(leaderboard);
            setMessage('Leaderboard sent successfully!');
            setMessageType('success');
        } catch (error) {
            console.error('Error sending leaderboard:', error);
            setMessage('Failed to send leaderboard');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendDailyMessage = async () => {
        const dailyMessage = 'Welcome to another day in the Legend of the Crime Lizard! New adventures await!';

        setIsLoading(true);
        try {
            await telegram.sendDailyMessage(dailyMessage);
            setMessage('Daily message sent successfully!');
            setMessageType('success');
        } catch (error) {
            console.error('Error sending daily message:', error);
            setMessage('Failed to send daily message');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal">
            <div className="bg-black rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90dvh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#FFD700] font-retro">
                        🤖 Telegram Bot Integration
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Bot Info */}
                {botInfo && (
                    <div className="bg-black rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-bold text-white mb-2">Bot Information</h3>
                        <div className="space-y-2 text-sm">
                            <div><span className="text-gray-400">Name:</span> {botInfo.first_name}</div>
                            <div><span className="text-gray-400">Username:</span> @{botInfo.username}</div>
                            <div><span className="text-gray-400">ID:</span> {botInfo.id}</div>
                            <div><span className="text-gray-400">Status:</span>
                                <span className="text-green-400 ml-2">✅ Connected</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat ID Configuration */}
                <div className="bg-black rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-bold text-white mb-2">Chat Configuration</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                Telegram Chat ID (Group ID)
                            </label>
                            <input
                                type="text"
                                value={chatId}
                                onChange={(e) => setChatId(e.target.value)}
                                placeholder="Enter your Telegram group chat ID"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-[#FFD700] focus:outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Get your chat ID by adding @userinfobot to your group
                            </p>
                        </div>
                    </div>
                </div>

                {/* Test Functions */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Test Functions</h3>

                    {/* Test Message */}
                    <div className="bg-black rounded-lg p-4">
                        <h4 className="text-md font-bold text-white mb-2">Send Test Message</h4>
                        <div className="space-y-3">
                            <textarea
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                placeholder="Enter your test message..."
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-[#FFD700] focus:outline-none"
                                rows={3}
                            />
                            <button
                                onClick={handleSendTestMessage}
                                disabled={isLoading || !testMessage.trim()}
                                className="bg-[#FFD700] text-gray-900 px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Sending...' : 'Send Test Message'}
                            </button>
                        </div>
                    </div>

                    {/* Game Update */}
                    <div className="bg-black rounded-lg p-4">
                        <h4 className="text-md font-bold text-white mb-2">Send Game Update</h4>
                        <p className="text-sm text-gray-400 mb-3">
                            Test sending a character minted notification
                        </p>
                        <button
                            onClick={handleSendGameUpdate}
                            disabled={isLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Sending...' : 'Send Game Update'}
                        </button>
                    </div>

                    {/* Leaderboard */}
                    <div className="bg-black rounded-lg p-4">
                        <h4 className="text-md font-bold text-white mb-2">Send Leaderboard</h4>
                        <p className="text-sm text-gray-400 mb-3">
                            Test sending a weekly leaderboard update
                        </p>
                        <button
                            onClick={handleSendLeaderboard}
                            disabled={isLoading}
                            className="bg-[#00DD77] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#00BB66] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Sending...' : 'Send Leaderboard'}
                        </button>
                    </div>

                    {/* Daily Message */}
                    <div className="bg-black rounded-lg p-4">
                        <h4 className="text-md font-bold text-white mb-2">Send Daily Message</h4>
                        <p className="text-sm text-gray-400 mb-3">
                            Test sending a daily sysop message
                        </p>
                        <button
                            onClick={handleSendDailyMessage}
                            disabled={isLoading}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Sending...' : 'Send Daily Message'}
                        </button>
                    </div>
                </div>

                {/* Status Message */}
                {message && (
                    <div className={`mt-4 p-3 rounded-lg ${messageType === 'success'
                            ? 'bg-[#00FF88]/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-6 bg-black rounded-lg p-4">
                    <h3 className="text-lg font-bold text-white mb-2">Setup Instructions</h3>
                    <div className="text-sm text-gray-300 space-y-2">
                        <p>1. Add your bot to your Telegram group</p>
                        <p>2. Get the group chat ID using @userinfobot</p>
                        <p>3. Set the chat ID in your .env file: TELEGRAM_CHAT_ID=your_chat_id</p>
                        <p>4. Restart the server to apply changes</p>
                        <p>5. Test the integration using the buttons above</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TelegramIntegration;
