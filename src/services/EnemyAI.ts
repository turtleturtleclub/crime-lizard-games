/**
 * Enemy AI Message Service
 * Generates unique AI-powered messages for enemy encounters
 */

export interface EnemyMessageRequest {
    enemy: {
        id: string;
        name: string;
        description: string;
        rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'boss';
    };
    playerContext?: {
        level: number;
        name?: string;
    };
    eventType: 'appearance' | 'death';
    language?: 'en' | 'zh';
}

export interface EnemyMessageResponse {
    success: boolean;
    message: string;
}

class EnemyAIService {
    private static instance: EnemyAIService;
    private serverUrl: string;
    private cache: Map<string, { message: string; timestamp: number }>;
    private readonly CACHE_DURATION = 30 * 1000; // 30 seconds - shorter cache for more variety

    private constructor() {
        this.serverUrl = import.meta.env.DEV ? 'http://localhost:3003' : window.location.origin;
        this.cache = new Map();
    }

    static getInstance(): EnemyAIService {
        if (!EnemyAIService.instance) {
            EnemyAIService.instance = new EnemyAIService();
        }
        return EnemyAIService.instance;
    }

    /**
     * Generate AI message for enemy encounter
     * @param request Enemy message request
     * @returns AI-generated message
     */
    async generateEnemyMessage(request: EnemyMessageRequest): Promise<string> {
        // Add random seed to cache key for more variety
        const randomSeed = Math.floor(Math.random() * 1000);
        const cacheKey = `${request.enemy.id}_${request.eventType}_${randomSeed}`;

        // Check cache first (for same enemy appearance/death within 30 seconds)
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.message;
        }

        try {
            const response = await fetch(`${this.serverUrl}/api/legend/enemy-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error('Failed to generate enemy message');
            }

            const data: EnemyMessageResponse = await response.json();

            // Cache the result
            this.cache.set(cacheKey, {
                message: data.message,
                timestamp: Date.now()
            });

            return data.message;
        } catch (error) {
            console.error('Error generating enemy AI message:', error);

            // Fallback messages
            if (request.eventType === 'appearance') {
                return `${request.enemy.name} appears! ${request.enemy.description}`;
            } else {
                return `${request.enemy.name} has been defeated!`;
            }
        }
    }

    /**
     * Generate appearance message for enemy
     */
    async generateAppearanceMessage(enemy: EnemyMessageRequest['enemy'], playerContext?: EnemyMessageRequest['playerContext'], language: 'en' | 'zh' = 'en'): Promise<string> {
        return this.generateEnemyMessage({
            enemy,
            playerContext,
            eventType: 'appearance',
            language
        });
    }

    /**
     * Generate death message for enemy
     */
    async generateDeathMessage(enemy: EnemyMessageRequest['enemy'], playerContext?: EnemyMessageRequest['playerContext'], language: 'en' | 'zh' = 'en'): Promise<string> {
        return this.generateEnemyMessage({
            enemy,
            playerContext,
            eventType: 'death',
            language
        });
    }

    /**
     * Generate a completely unique enemy with AI
     * @param playerLevel - Player's current level
     * @param language - Language for generation
     * @returns AI-generated enemy object or null if failed
     */
    async generateUniqueEnemy(playerLevel: number, language: 'en' | 'zh' = 'en'): Promise<any | null> {
        try {
            const response = await fetch(`${this.serverUrl}/api/legend/generate-unique-enemy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ playerLevel, language })
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();

            if (!data.success || data.useStatic) {
                return null; // Signal to use static enemies
            }

            return data.enemy;
        } catch (error) {
            console.error('Error generating unique enemy:', error);
            return null;
        }
    }

    /**
     * Clear message cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}

export const enemyAI = EnemyAIService.getInstance();

/**
 * Hook for using Enemy AI in components
 */
export function useEnemyAI() {
    const generateAppearanceMessage = async (
        enemy: EnemyMessageRequest['enemy'],
        playerContext?: EnemyMessageRequest['playerContext'],
        language: 'en' | 'zh' = 'en'
    ) => {
        return enemyAI.generateAppearanceMessage(enemy, playerContext, language);
    };

    const generateDeathMessage = async (
        enemy: EnemyMessageRequest['enemy'],
        playerContext?: EnemyMessageRequest['playerContext'],
        language: 'en' | 'zh' = 'en'
    ) => {
        return enemyAI.generateDeathMessage(enemy, playerContext, language);
    };

    const generateUniqueEnemy = async (
        playerLevel: number,
        language: 'en' | 'zh' = 'en'
    ) => {
        return enemyAI.generateUniqueEnemy(playerLevel, language);
    };

    return {
        generateAppearanceMessage,
        generateDeathMessage,
        generateUniqueEnemy
    };
}

