// Quest Blockchain Integration
// Handles minting NFT rewards, storing quest completion proofs on-chain, and GameFi features

import { ethers } from 'ethers';
import type { QuestRewards } from '../types/quest.types';
import type { PlayerCharacter } from '../types/legend.types';

// ============================================================================
// QUEST NFT REWARD TYPES
// ============================================================================

export interface QuestNFTMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
        trait_type: string;
        value: string | number;
    }>;
    external_url?: string;
    animation_url?: string;
}

export interface QuestCompletionProof {
    questId: string;
    playerAddress: string;
    tokenId: number;
    completedAt: number;  // Unix timestamp
    signature: string;
    metadata: {
        questTitle: string;
        difficulty: string;
        timeSpent: number;  // Seconds
        teamSize?: number;
    };
}

// ============================================================================
// QUEST REWARD CONTRACT INTERFACE
// ============================================================================

// ABI for Quest Reward NFT Contract
const QUEST_REWARD_ABI = [
    // Mint quest achievement NFT
    'function mintQuestReward(address to, uint256 questId, uint8 rarity, string memory metadataURI) external returns (uint256)',

    // Mint fractional achievement token (fNFT)
    'function mintAchievementToken(address to, uint256 achievementId, uint256 amount) external',

    // Store quest completion proof on-chain
    'function recordQuestCompletion(uint256 tokenId, bytes32 questId, uint256 timestamp, bytes memory signature) external',

    // Check if player has completed a quest (on-chain verification)
    'function hasCompletedQuest(uint256 tokenId, bytes32 questId) external view returns (bool)',

    // Get player's quest statistics
    'function getPlayerQuestStats(uint256 tokenId) external view returns (uint256 totalCompleted, uint256 totalRewardsEarned)',

    // Claim accumulated quest rewards
    'function claimQuestRewards(uint256 tokenId) external returns (uint256)',

    // Events
    'event QuestCompleted(uint256 indexed tokenId, bytes32 indexed questId, uint256 timestamp)',
    'event QuestRewardMinted(address indexed player, uint256 indexed rewardTokenId, uint8 rarity)',
    'event AchievementUnlocked(uint256 indexed tokenId, uint256 indexed achievementId)'
];

// ============================================================================
// QUEST BLOCKCHAIN MANAGER
// ============================================================================

export class QuestBlockchainManager {
    private signer?: ethers.Signer;
    private rewardContract?: ethers.Contract;

    constructor(
        _provider: ethers.Provider,
        contractAddress: string,
        signer?: ethers.Signer
    ) {
        this.signer = signer;

        if (signer) {
            this.rewardContract = new ethers.Contract(
                contractAddress,
                QUEST_REWARD_ABI,
                signer
            );
        }
    }

    // ========================================================================
    // QUEST COMPLETION PROOF
    // ========================================================================

    /**
     * Generate quest completion proof for on-chain verification
     */
    async generateCompletionProof(
        player: PlayerCharacter,
        questId: string,
        questData: {
            title: string;
            difficulty: string;
            timeSpent: number;
            teamSize?: number;
        }
    ): Promise<QuestCompletionProof> {
        if (!this.signer) throw new Error('Signer required to generate proof');

        const completedAt = Math.floor(Date.now() / 1000);

        // Create message to sign
        const message = ethers.solidityPackedKeccak256(
            ['address', 'uint256', 'bytes32', 'uint256'],
            [
                player.walletAddress,
                player.tokenId,
                ethers.id(questId),
                completedAt
            ]
        );

        // Sign the message
        const signature = await this.signer.signMessage(ethers.getBytes(message));

        return {
            questId,
            playerAddress: player.walletAddress,
            tokenId: player.tokenId,
            completedAt,
            signature,
            metadata: {
                questTitle: questData.title,
                difficulty: questData.difficulty,
                timeSpent: questData.timeSpent,
                teamSize: questData.teamSize
            }
        };
    }

    /**
     * Record quest completion on-chain
     */
    async recordQuestCompletion(
        proof: QuestCompletionProof
    ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
        if (!this.rewardContract) {
            return { success: false, error: 'Contract not initialized' };
        }

        try {
            const questIdHash = ethers.id(proof.questId);

            const tx = await this.rewardContract.recordQuestCompletion(
                proof.tokenId,
                questIdHash,
                proof.completedAt,
                proof.signature
            );

            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error: any) {
            console.error('Failed to record quest completion:', error);
            return {
                success: false,
                error: error.message || 'Transaction failed'
            };
        }
    }

    /**
     * Verify quest completion on-chain
     */
    async verifyQuestCompletion(
        tokenId: number,
        questId: string
    ): Promise<boolean> {
        if (!this.rewardContract) return false;

        try {
            const questIdHash = ethers.id(questId);
            return await this.rewardContract.hasCompletedQuest(tokenId, questIdHash);
        } catch (error) {
            console.error('Failed to verify quest completion:', error);
            return false;
        }
    }

    // ========================================================================
    // NFT REWARD MINTING
    // ========================================================================

    /**
     * Upload NFT metadata to IPFS (or your storage solution)
     */
    private async uploadMetadata(_metadata: QuestNFTMetadata): Promise<string> {
        // TODO: Implement IPFS upload or use your preferred storage
        // For now, return a placeholder
// Example: Upload to IPFS via Pinata/Web3.Storage/NFT.Storage
        // const cid = await uploadToIPFS(metadata);
        // return `ipfs://${cid}`;

        return `ipfs://QmPlaceholder/${Date.now()}`;
    }

    /**
     * Generate NFT metadata for quest reward
     */
    private generateNFTMetadata(
        questReward: NonNullable<QuestRewards['nftReward']>,
        player: PlayerCharacter,
        questId: string
    ): QuestNFTMetadata {
        const rarityColors: Record<string, string> = {
            common: '#9CA3AF',
            uncommon: '#00FF88',
            rare: '#3B82F6',
            epic: '#A855F7',
            legendary: '#F59E0B'
        };

        return {
            name: questReward.name,
            description: questReward.description,
            image: this.getRewardImageURL(questReward.type, questReward.rarity),
            attributes: [
                { trait_type: 'Type', value: questReward.type },
                { trait_type: 'Rarity', value: questReward.rarity },
                { trait_type: 'Quest ID', value: questId },
                { trait_type: 'Player', value: player.name },
                { trait_type: 'Token ID', value: player.tokenId },
                { trait_type: 'Earned At', value: new Date().toISOString() },
                { trait_type: 'Rarity Color', value: rarityColors[questReward.rarity] }
            ],
            external_url: `https://yourapp.com/quests/${questId}`
        };
    }

    /**
     * Get image URL for reward NFT (placeholder - implement based on your setup)
     */
    private getRewardImageURL(type: string, rarity: string): string {
        // TODO: Implement proper image generation/retrieval
        // Could use AI image generation, pre-made assets, or dynamic SVG
        return `/assets/quest-rewards/${type}-${rarity}.png`;
    }

    /**
     * Mint NFT reward for quest completion
     */
    async mintQuestReward(
        player: PlayerCharacter,
        questId: string,
        reward: NonNullable<QuestRewards['nftReward']>
    ): Promise<{
        success: boolean;
        tokenId?: number;
        transactionHash?: string;
        metadataURI?: string;
        error?: string;
    }> {
        if (!this.rewardContract || !this.signer) {
            return { success: false, error: 'Contract or signer not initialized' };
        }

        try {
            // Generate metadata
            const metadata = this.generateNFTMetadata(reward, player, questId);

            // Upload metadata
            const metadataURI = await this.uploadMetadata(metadata);

            // Convert rarity to uint8
            const rarityMap: Record<string, number> = {
                common: 0,
                uncommon: 1,
                rare: 2,
                epic: 3,
                legendary: 4
            };
            const rarityValue = rarityMap[reward.rarity];

            // Mint NFT
            const tx = await this.rewardContract.mintQuestReward(
                player.walletAddress,
                ethers.id(questId),
                rarityValue,
                metadataURI
            );

            const receipt = await tx.wait();

            // Extract token ID from event
            const mintEvent = receipt.logs?.find(
                (log: any) => log.fragment?.name === 'QuestRewardMinted'
            );
            const tokenId = mintEvent?.args?.rewardTokenId ? Number(mintEvent.args.rewardTokenId) : undefined;

            return {
                success: true,
                tokenId,
                transactionHash: receipt.transactionHash,
                metadataURI
            };
        } catch (error: any) {
            console.error('Failed to mint quest reward:', error);
            return {
                success: false,
                error: error.message || 'Minting failed'
            };
        }
    }

    // ========================================================================
    // ACHIEVEMENT TOKENS (fNFTs)
    // ========================================================================

    /**
     * Mint fractional achievement tokens
     * These are ERC-1155 tokens that represent quest milestones
     */
    async mintAchievementToken(
        player: PlayerCharacter,
        achievementId: number,
        amount: number = 1
    ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
        if (!this.rewardContract) {
            return { success: false, error: 'Contract not initialized' };
        }

        try {
            const tx = await this.rewardContract.mintAchievementToken(
                player.walletAddress,
                achievementId,
                amount
            );

            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.transactionHash
            };
        } catch (error: any) {
            console.error('Failed to mint achievement token:', error);
            return {
                success: false,
                error: error.message || 'Minting failed'
            };
        }
    }

    // ========================================================================
    // QUEST REWARDS CLAIMING
    // ========================================================================

    /**
     * Claim accumulated quest rewards (e.g., BNB/token rewards)
     */
    async claimQuestRewards(
        tokenId: number
    ): Promise<{ success: boolean; amount?: string; transactionHash?: string; error?: string }> {
        if (!this.rewardContract) {
            return { success: false, error: 'Contract not initialized' };
        }

        try {
            const tx = await this.rewardContract.claimQuestRewards(tokenId);
            const receipt = await tx.wait();

            // Extract claimed amount from event or return value
            // This depends on your contract implementation
            const amount = '0';  // TODO: Extract from event

            return {
                success: true,
                amount,
                transactionHash: receipt.transactionHash
            };
        } catch (error: any) {
            console.error('Failed to claim quest rewards:', error);
            return {
                success: false,
                error: error.message || 'Claim failed'
            };
        }
    }

    // ========================================================================
    // QUEST STATISTICS
    // ========================================================================

    /**
     * Get player's on-chain quest statistics
     */
    async getPlayerQuestStats(
        tokenId: number
    ): Promise<{
        totalCompleted: number;
        totalRewardsEarned: string;
    } | null> {
        if (!this.rewardContract) return null;

        try {
            const stats = await this.rewardContract.getPlayerQuestStats(tokenId);
            return {
                totalCompleted: Number(stats.totalCompleted),
                totalRewardsEarned: ethers.formatEther(stats.totalRewardsEarned)
            };
        } catch (error) {
            console.error('Failed to get quest stats:', error);
            return null;
        }
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Initialize quest blockchain manager from wallet
 */
export async function initQuestBlockchain(
    provider: ethers.Provider,
    contractAddress: string,
    signer?: ethers.Signer
): Promise<QuestBlockchainManager> {
    return new QuestBlockchainManager(provider, contractAddress, signer);
}

/**
 * Process quest rewards including NFT minting
 */
export async function processQuestRewards(
    blockchainManager: QuestBlockchainManager,
    player: PlayerCharacter,
    questId: string,
    rewards: QuestRewards,
    questData: {
        title: string;
        difficulty: string;
        timeSpent: number;
    }
): Promise<{
    nftMinted?: { tokenId: number; transactionHash: string };
    completionRecorded?: { transactionHash: string };
    errors: string[];
}> {
    const errors: string[] = [];
    let nftMinted: { tokenId: number; transactionHash: string } | undefined;
    let completionRecorded: { transactionHash: string } | undefined;

    try {
        // 1. Record quest completion on-chain
        const proof = await blockchainManager.generateCompletionProof(
            player,
            questId,
            questData
        );

        const recordResult = await blockchainManager.recordQuestCompletion(proof);

        if (recordResult.success && recordResult.transactionHash) {
            completionRecorded = { transactionHash: recordResult.transactionHash };
        } else {
            errors.push(recordResult.error || 'Failed to record completion');
        }

        // 2. Mint NFT reward if specified
        if (rewards.nftReward) {
            const mintResult = await blockchainManager.mintQuestReward(
                player,
                questId,
                rewards.nftReward
            );

            if (mintResult.success && mintResult.tokenId && mintResult.transactionHash) {
                nftMinted = {
                    tokenId: mintResult.tokenId,
                    transactionHash: mintResult.transactionHash
                };
            } else {
                errors.push(mintResult.error || 'Failed to mint NFT reward');
            }
        }
    } catch (error: any) {
        errors.push(error.message || 'Blockchain processing failed');
    }

    return {
        nftMinted,
        completionRecorded,
        errors
    };
}

export default QuestBlockchainManager;
