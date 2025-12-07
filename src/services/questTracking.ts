/**
 * Quest Tracking Service
 *
 * Centralized service for tracking quest progress across the game.
 * Automatically calls the backend /api/quests/progress endpoint.
 */

export interface QuestTrackingParams {
    walletAddress: string;
    tokenId: number;
    questId?: string; // Optional - will track all matching quests if not provided
    objectiveId?: string; // Optional - will track all matching objectives if not provided
    amount?: number;
}

/**
 * Track exploration/location visit objectives
 */
export async function trackExploration(params: QuestTrackingParams & { location: string }) {
    try {
const response = await fetch('/api/quests/track-exploration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: params.walletAddress.toLowerCase(),
                tokenId: params.tokenId,
                location: params.location,
                questId: params.questId,
                objectiveId: params.objectiveId
            })
        });

        if (response.ok) {
            const result = await response.json();
return result;
        } else {
            console.warn('⚠️ Failed to track exploration:', await response.text());
        }
    } catch (error) {
        console.error('❌ Error tracking exploration:', error);
    }
}

/**
 * Track NPC conversation objectives
 */
export async function trackConversation(params: QuestTrackingParams & { npcId: string }) {
    try {
const response = await fetch('/api/quests/track-conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: params.walletAddress.toLowerCase(),
                tokenId: params.tokenId,
                npcId: params.npcId,
                questId: params.questId,
                objectiveId: params.objectiveId
            })
        });

        if (response.ok) {
            const result = await response.json();
return result;
        } else {
            console.warn('⚠️ Failed to track conversation:', await response.text());
        }
    } catch (error) {
        console.error('❌ Error tracking conversation:', error);
    }
}

/**
 * Track item delivery objectives
 */
export async function trackDelivery(params: QuestTrackingParams & { itemId: string; targetNpc?: string }) {
    try {
const response = await fetch('/api/quests/track-delivery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: params.walletAddress.toLowerCase(),
                tokenId: params.tokenId,
                itemId: params.itemId,
                targetNpc: params.targetNpc,
                questId: params.questId,
                objectiveId: params.objectiveId
            })
        });

        if (response.ok) {
            const result = await response.json();
return result;
        } else {
            console.warn('⚠️ Failed to track delivery:', await response.text());
        }
    } catch (error) {
        console.error('❌ Error tracking delivery:', error);
    }
}

/**
 * Track stealth/skill check objectives
 */
export async function trackSkillCheck(params: QuestTrackingParams & {
    checkType: 'stealth' | 'skill_check';
    success: boolean;
    stat?: string;
}) {
    try {

        const response = await fetch('/api/quests/track-skill-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: params.walletAddress.toLowerCase(),
                tokenId: params.tokenId,
                checkType: params.checkType,
                success: params.success,
                stat: params.stat,
                questId: params.questId,
                objectiveId: params.objectiveId
            })
        });

        if (response.ok) {
            const result = await response.json();
return result;
        } else {
            console.warn('⚠️ Failed to track skill check:', await response.text());
        }
    } catch (error) {
        console.error('❌ Error tracking skill check:', error);
    }
}

/**
 * Track survival objectives (turn-based)
 */
export async function trackSurvival(params: QuestTrackingParams & { turnsCompleted: number }) {
    try {
const response = await fetch('/api/quests/track-survival', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: params.walletAddress.toLowerCase(),
                tokenId: params.tokenId,
                turnsCompleted: params.turnsCompleted,
                questId: params.questId,
                objectiveId: params.objectiveId
            })
        });

        if (response.ok) {
            const result = await response.json();
return result;
        } else {
            console.warn('⚠️ Failed to track survival:', await response.text());
        }
    } catch (error) {
        console.error('❌ Error tracking survival:', error);
    }
}

/**
 * Track boss defeat (both single and multiplayer)
 */
export async function trackBossDefeat(params: QuestTrackingParams & {
    bossId: string;
    isMultiplayer?: boolean;
}) {
    try {

        const response = await fetch('/api/quests/track-combat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: params.walletAddress.toLowerCase(),
                tokenId: params.tokenId,
                enemyType: params.bossId,
                kills: 1,
                isMultiplayer: params.isMultiplayer || false
            })
        });

        if (response.ok) {
            const result = await response.json();
return result;
        } else {
            console.warn('⚠️ Failed to track boss defeat:', await response.text());
        }
    } catch (error) {
        console.error('❌ Error tracking boss defeat:', error);
    }
}
