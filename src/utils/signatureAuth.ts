// EIP-712 Signature Authentication for Crime Lizard Legend
// Provides secure, decentralized authentication for game actions

import { ethers } from 'ethers';

// EIP-712 Domain for Crime Lizard Legend
// Note: This should be dynamically set based on the current chain
export const getEIP712Domain = (chainId: number = 97) => ({
    name: "Crime Lizard Legend",
    version: "1",
    chainId: chainId,
    verifyingContract: import.meta.env.VITE_LEGEND_V2_ADDRESS || "0xBc8881b48726eb5666672541fFe57716b356f117"
});

// Legacy export for backward compatibility
export const EIP712_DOMAIN = getEIP712Domain(97);

// EIP-712 Types for different game actions
export const EIP712_TYPES = {
    GameAction: [
        { name: "tokenId", type: "uint256" },
        { name: "action", type: "string" },
        { name: "nonce", type: "uint256" },
        { name: "timestamp", type: "uint256" },
        { name: "data", type: "bytes" }
    ],
    GoldPurchase: [
        { name: "tokenId", type: "uint256" },
        { name: "bnbAmount", type: "uint256" },
        { name: "goldAmount", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "timestamp", type: "uint256" }
    ],
    CharacterMint: [
        { name: "archetype", type: "uint8" },
        { name: "customName", type: "string" },
        { name: "mintPrice", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "timestamp", type: "uint256" }
    ]
};

export interface GameActionData {
    tokenId: number;
    action: string;
    nonce: number;
    timestamp: number;
    data: string;
}

export interface GoldPurchaseData {
    tokenId: number;
    bnbAmount: string;
    goldAmount: string;
    nonce: number;
    timestamp: number;
}

export interface CharacterMintData {
    archetype: number;
    customName: string;
    mintPrice: string;
    nonce: number;
    timestamp: number;
}

export class SignatureAuth {
    private static instance: SignatureAuth;
    private nonceTracker: Map<string, number> = new Map();

    static getInstance(): SignatureAuth {
        if (!SignatureAuth.instance) {
            SignatureAuth.instance = new SignatureAuth();
        }
        return SignatureAuth.instance;
    }

    // Generate a unique nonce for a wallet
    generateNonce(walletAddress: string): number {
        const currentNonce = this.nonceTracker.get(walletAddress) || 0;
        const newNonce = currentNonce + 1;
        this.nonceTracker.set(walletAddress, newNonce);
        return newNonce;
    }

    // Sign a game action
    async signGameAction(
        signer: ethers.Signer,
        actionData: GameActionData
    ): Promise<string> {
        const domain = { ...EIP712_DOMAIN };
        const types = { GameAction: EIP712_TYPES.GameAction };

        const signature = await signer.signTypedData(domain, types, actionData);
        return signature;
    }

    // Sign a gold purchase
    async signGoldPurchase(
        signer: ethers.Signer,
        purchaseData: GoldPurchaseData
    ): Promise<string> {
        const domain = { ...EIP712_DOMAIN };
        const types = { GoldPurchase: EIP712_TYPES.GoldPurchase };

        const signature = await signer.signTypedData(domain, types, purchaseData);
        return signature;
    }

    // Sign a character mint
    async signCharacterMint(
        signer: ethers.Signer,
        mintData: CharacterMintData
    ): Promise<string> {
        const domain = { ...EIP712_DOMAIN };
        const types = { CharacterMint: EIP712_TYPES.CharacterMint };

        const signature = await signer.signTypedData(domain, types, mintData);
        return signature;
    }

    // Verify a signature
    async verifySignature(
        signature: string,
        data: any,
        expectedSigner: string,
        type: 'GameAction' | 'GoldPurchase' | 'CharacterMint'
    ): Promise<boolean> {
        try {
            const domain = { ...EIP712_DOMAIN };
            const types = { [type]: EIP712_TYPES[type] };

            const recoveredAddress = ethers.verifyTypedData(domain, types, data, signature);
            return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
        } catch (error) {
            console.error('Signature verification error:', error);
            return false;
        }
    }

    // Create a game action with signature
    async createSignedGameAction(
        signer: ethers.Signer,
        tokenId: number,
        action: string,
        data: string = "0x"
    ): Promise<{ actionData: GameActionData; signature: string }> {
        const walletAddress = await signer.getAddress();
        const nonce = this.generateNonce(walletAddress);
        const timestamp = Math.floor(Date.now() / 1000);

        const actionData: GameActionData = {
            tokenId,
            action,
            nonce,
            timestamp,
            data
        };

        const signature = await this.signGameAction(signer, actionData);

        return { actionData, signature };
    }

    // Create a gold purchase with signature
    async createSignedGoldPurchase(
        signer: ethers.Signer,
        tokenId: number,
        bnbAmount: string,
        goldAmount: string
    ): Promise<{ purchaseData: GoldPurchaseData; signature: string }> {
        const walletAddress = await signer.getAddress();
        const nonce = this.generateNonce(walletAddress);
        const timestamp = Math.floor(Date.now() / 1000);

        const purchaseData: GoldPurchaseData = {
            tokenId,
            bnbAmount,
            goldAmount,
            nonce,
            timestamp
        };

        const signature = await this.signGoldPurchase(signer, purchaseData);

        return { purchaseData, signature };
    }

    // Create a character mint with signature
    async createSignedCharacterMint(
        signer: ethers.Signer,
        archetype: number,
        customName: string,
        mintPrice: string
    ): Promise<{ mintData: CharacterMintData; signature: string }> {
        const walletAddress = await signer.getAddress();
        const nonce = this.generateNonce(walletAddress);
        const timestamp = Math.floor(Date.now() / 1000);

        const mintData: CharacterMintData = {
            archetype,
            customName,
            mintPrice,
            nonce,
            timestamp
        };

        const signature = await this.signCharacterMint(signer, mintData);

        return { mintData, signature };
    }

    // Check if nonce is valid (not used before)
    isNonceValid(walletAddress: string, nonce: number): boolean {
        const currentNonce = this.nonceTracker.get(walletAddress) || 0;
        return nonce <= currentNonce && nonce > 0;
    }

    // Update contract address for domain
    updateContractAddress(contractAddress: string) {
        EIP712_DOMAIN.verifyingContract = contractAddress;
    }

    // Update chain ID for domain
    updateChainId(chainId: number) {
        EIP712_DOMAIN.chainId = chainId;
    }
}

// Export singleton instance
export const signatureAuth = SignatureAuth.getInstance();
