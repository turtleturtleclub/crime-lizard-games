// Security & Verification Types for Legend of the Crime Lizard
// Ensures only legitimate gameplay can update character stats

export interface GameAction {
    walletAddress: string;
    tokenId: number;
    actionType: 'combat' | 'purchase' | 'level_up' | 'equipment' | 'donation' | 'death';
    timestamp: number;

    // Signature from game server
    serverSignature: string;

    // Action data
    data: Record<string, unknown>;
}

export interface SignedUpdate {
    walletAddress: string;
    tokenId: number;
    updates: Partial<PlayerUpdate>;
    timestamp: number;
    nonce: number; // Prevents replay attacks
    serverSignature: string;
}

export interface PlayerUpdate {
    level?: number;
    experience?: number;
    gold?: number;
    goldInBank?: number;
    health?: number;
    strength?: number;
    defense?: number;
    charm?: number;
    // ... other updatable fields
}

export interface OnChainPurchaseRecord {
    walletAddress: string;
    tokenId: number;
    bnbAmount: string;
    goldAmount: number;
    transactionHash: string;
    blockNumber: number;
    timestamp: number;
    verified: boolean;
}

export interface VerificationChallenge {
    walletAddress: string;
    tokenId: number;
    challenge: string; // Random string to sign
    timestamp: number;
    expiresAt: number;
}

// Security measures
export interface SecurityConfig {
    // Verify ownership before ANY update
    requireOwnershipVerification: boolean;

    // All updates must be server-signed
    requireServerSignature: boolean;

    // Rate limiting
    maxActionsPerMinute: number;
    maxActionsPerHour: number;

    // Anti-cheat
    validateStatProgression: boolean; // Can't jump from level 1 to 15
    validateGoldFlow: boolean; // Gold must come from legit sources
    validateCombatResults: boolean; // Combat damage must be realistic

    // Blockchain verification
    verifyPurchasesOnChain: boolean; // Check BNB transactions are real
    verifyNFTOwnership: boolean; // Check player owns the NFT
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    requireOwnershipVerification: true,
    requireServerSignature: true,
    maxActionsPerMinute: 30,
    maxActionsPerHour: 500,
    validateStatProgression: true,
    validateGoldFlow: true,
    validateCombatResults: true,
    verifyPurchasesOnChain: true,
    verifyNFTOwnership: true
};
