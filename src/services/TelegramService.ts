// Legend of the Crime Lizard - Telegram Bot Integration
// Integrates with existing xAI system for Telegram group interactions

import { io, Socket } from 'socket.io-client';
import type { PlayerCharacter } from '../types/legend.types';

interface GameUpdate {
    type: 'character_minted' | 'level_up' | 'boss_defeated' | 'heist_completed' | 'donation_made' | 'achievement_unlocked' | 'quest_started' | 'quest_completed' | 'heist_team_formed' | 'legendary_quest_completed';
    player: {
        name: string;
        address: string;
        level: number;
    };
    details: any;
    timestamp: number;
}

class TelegramService {
    private static instance: TelegramService;
    private socket: Socket | null = null;
    private serverUrl: string;
    private isConnected: boolean = false;

    private constructor() {
        this.serverUrl = import.meta.env.DEV ? 'http://localhost:3003' : window.location.origin;
        // SECURITY: Bot token is now stored ONLY on the server
        // All Telegram API calls must go through the backend
    }

    static getInstance(): TelegramService {
        if (!TelegramService.instance) {
            TelegramService.instance = new TelegramService();
        }
        return TelegramService.instance;
    }

    async initialize(chatId?: string) {
        if (this.isConnected) return;

        this.socket = io(this.serverUrl);

        this.socket.on('connect', () => {
this.isConnected = true;

            // Register with server (chatId only, bot token stays on server)
            this.socket?.emit('telegram:register', {
                chatId: chatId,
                timestamp: Date.now()
            });
        });

        this.socket.on('disconnect', () => {
this.isConnected = false;
        });

        // Listen for game updates to broadcast to Telegram
        this.socket.on('telegram:game_update', (update: GameUpdate) => {
            this.broadcastGameUpdate(update);
        });

        // Listen for AI responses to send to Telegram
        this.socket.on('telegram:ai_response', (response: any) => {
            this.sendAIMessage(response);
        });
    }

    // Send message to Telegram group via server API
    async sendMessage(text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
        try {
            // SECURITY FIX: All Telegram API calls now go through our backend
            const response = await fetch(`${this.serverUrl}/api/telegram/send-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    parseMode: parseMode
                })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Telegram send error:', error);
            return false;
        }
    }

    // Send game update to Telegram
    async broadcastGameUpdate(update: GameUpdate): Promise<void> {
        let message = '';

        switch (update.type) {
            case 'character_minted':
                message = `🦎 **NEW CHARACTER MINTED!** 🦎\n\n` +
                    `**Player:** ${update.player.name}\n` +
                    `**Level:** ${update.player.level}\n` +
                    `**Character:** ${update.details.archetype}\n` +
                    `**Token ID:** #${update.details.tokenId}\n\n` +
                    `Welcome to the Legend of the Crime Lizard! 🏆`;
                break;

            case 'level_up':
                message = `📈 **LEVEL UP!** 📈\n\n` +
                    `**Player:** ${update.player.name}\n` +
                    `**New Level:** ${update.player.level}\n` +
                    `**Achievement:** ${update.details.achievement || 'Level progression'}\n\n` +
                    `Keep climbing the ranks! 🚀`;
                break;

            case 'boss_defeated':
                message = `⚔️ **BOSS DEFEATED!** ⚔️\n\n` +
                    `**Player:** ${update.player.name}\n` +
                    `**Boss:** ${update.details.bossName}\n` +
                    `**Reward:** ${update.details.reward} gold\n` +
                    `**Level:** ${update.player.level}\n\n` +
                    `Epic victory! 🏆`;
                break;

            case 'heist_completed':
                message = `💰 **HEIST COMPLETED!** 💰\n\n` +
                    `**Player:** ${update.player.name}\n` +
                    `**Target:** ${update.details.target}\n` +
                    `**Gold Stolen:** ${update.details.goldStolen}\n` +
                    `**Success Rate:** ${update.details.successRate}%\n\n` +
                    `Another successful heist! 🎯`;
                break;

            case 'donation_made':
                message = `❤️ **DONATION MADE!** ❤️\n\n` +
                    `**Player:** ${update.player.name}\n` +
                    `**Amount:** ${update.details.amount} gold\n` +
                    `**Recipients:** ${update.details.recipients} people\n` +
                    `**Total Donated:** ${update.details.totalDonated} gold\n\n` +
                    `Giving back to the community! 🌟`;
                break;

            case 'achievement_unlocked':
                message = `🏆 **ACHIEVEMENT UNLOCKED!** 🏆\n\n` +
                    `**Player:** ${update.player.name}\n` +
                    `**Achievement:** ${update.details.achievement}\n` +
                    `**Description:** ${update.details.description}\n` +
                    `**Reward:** ${update.details.reward}\n\n` +
                    `Congratulations! 🎉`;
                break;
        }

        if (message) {
            await this.sendMessage(message);
        }
    }

    // Send AI-generated message to Telegram
    async sendAIMessage(response: any): Promise<void> {
        const message = `🤖 **Crime Lizard AI** 🤖\n\n${response.content}`;
        await this.sendMessage(message);
    }

    // Send daily sysop message to Telegram
    async sendDailyMessage(message: string): Promise<void> {
        const formattedMessage = `📢 **DAILY SYSOP MESSAGE** 📢\n\n${message}\n\n` +
            `🦎 Crime Lizard Games • ${new Date().toLocaleDateString()} 🦎`;
        await this.sendMessage(formattedMessage);
    }

    // Send leaderboard update to Telegram
    async sendLeaderboardUpdate(leaderboard: any[]): Promise<void> {
        let message = `🏆 **WEEKLY LEADERBOARD** 🏆\n\n`;

        leaderboard.slice(0, 10).forEach((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
            message += `${medal} **${index + 1}.** ${player.name}\n`;
            message += `   Level: ${player.level} | Gold: ${player.goldStolen}\n\n`;
        });

        message += `🦎 Keep climbing the ranks! 🦎`;
        await this.sendMessage(message);
    }

    // Send game statistics to Telegram
    async sendGameStats(stats: any): Promise<void> {
        const message = `📊 **GAME STATISTICS** 📊\n\n` +
            `**Total Players:** ${stats.totalPlayers}\n` +
            `**Active Today:** ${stats.activeToday}\n` +
            `**Characters Minted:** ${stats.charactersMinted}\n` +
            `**Total Gold Stolen:** ${stats.totalGoldStolen}\n` +
            `**Bosses Defeated:** ${stats.bossesDefeated}\n\n` +
            `🦎 Legend of the Crime Lizard is thriving! 🦎`;
        await this.sendMessage(message);
    }

    // Send welcome message for new players
    async sendWelcomeMessage(player: PlayerCharacter): Promise<void> {
        const message = `🎉 **WELCOME TO THE LEGEND!** 🎉\n\n` +
            `**Player:** ${player.name}\n` +
            `**Level:** ${player.level}\n\n` +
            `Welcome to the Legend of the Crime Lizard! Your journey to become the ultimate criminal mastermind begins now! 🦎\n\n` +
            `Use /help to see available commands!`;
        await this.sendMessage(message);
    }

    // Send error message to Telegram
    async sendErrorMessage(error: string): Promise<void> {
        const message = `⚠️ **SYSTEM ALERT** ⚠️\n\n${error}\n\n🦎 Crime Lizard AI is monitoring the situation! 🦎`;
        await this.sendMessage(message);
    }

    // Get bot info via server API
    async getBotInfo(): Promise<any> {
        try {
            // SECURITY FIX: Get bot info from backend instead of direct API call
            const response = await fetch(`${this.serverUrl}/api/telegram/bot-info`);
            const result = await response.json();
            return result.bot;
        } catch (error) {
            console.error('Error getting bot info:', error);
            return null;
        }
    }

    // Set webhook for receiving messages via server API
    async setWebhook(webhookUrl: string): Promise<boolean> {
        try {
            // SECURITY FIX: Set webhook through backend
            const response = await fetch(`${this.serverUrl}/api/telegram/set-webhook`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    webhookUrl: webhookUrl
                })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error setting webhook:', error);
            return false;
        }
    }

    // Disconnect from Telegram service
    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
        this.isConnected = false;
    }

    // Get connection status
    getConnectionStatus(): boolean {
        return this.isConnected;
    }
}

// React Hook for using Telegram service
export function useTelegram(chatId?: string) {
    const telegramService = TelegramService.getInstance();

    const initialize = () => {
        telegramService.initialize(chatId);
    };

    const sendMessage = async (text: string, parseMode?: 'HTML' | 'Markdown') => {
        return await telegramService.sendMessage(text, parseMode);
    };

    const sendGameUpdate = async (update: GameUpdate) => {
        return await telegramService.broadcastGameUpdate(update);
    };

    const sendDailyMessage = async (message: string) => {
        return await telegramService.sendDailyMessage(message);
    };

    const sendLeaderboard = async (leaderboard: any[]) => {
        return await telegramService.sendLeaderboardUpdate(leaderboard);
    };

    const sendStats = async (stats: any) => {
        return await telegramService.sendGameStats(stats);
    };

    const sendWelcome = async (player: PlayerCharacter) => {
        return await telegramService.sendWelcomeMessage(player);
    };

    const sendError = async (error: string) => {
        return await telegramService.sendErrorMessage(error);
    };

    const getBotInfo = async () => {
        return await telegramService.getBotInfo();
    };

    const isConnected = () => {
        return telegramService.getConnectionStatus();
    };

    // Quest Notification Methods
    const sendQuestNotification = async (questTitle: string, playerName: string, questType: 'started' | 'completed' | 'legendary') => {
        const messages = {
            started: `📜 <b>${playerName}</b> has embarked on a quest: <b>${questTitle}</b>!`,
            completed: `✅ <b>${playerName}</b> completed the quest: <b>${questTitle}</b>!`,
            legendary: `🏆 <b>LEGENDARY!</b> ${playerName} completed the epic quest: <b>${questTitle}</b>! 🎉`
        };

        await telegramService.sendMessage(messages[questType]);
    };

    const sendHeistTeamNotification = async (questTitle: string, leaderName: string, teamSize: number) => {
        const message = `🎭 <b>${leaderName}</b> is assembling a crew for: <b>${questTitle}</b>!\n👥 Team Size: ${teamSize} criminals ready!`;
        await telegramService.sendMessage(message);
    };

    return {
        initialize,
        sendMessage,
        sendGameUpdate,
        sendDailyMessage,
        sendLeaderboard,
        sendStats,
        sendWelcome,
        sendError,
        getBotInfo,
        isConnected,
        // Quest methods
        sendQuestNotification,
        sendHeistTeamNotification
    };
}

export default TelegramService;
