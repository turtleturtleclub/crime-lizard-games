/**
 * ═══════════════════════════════════════════════════════════
 * CRIME LIZARD - CONTRACT CONFIGURATION (BSC MAINNET ONLY)
 * ═══════════════════════════════════════════════════════════
 */

import { DICE_CONTRACT_ADDRESS } from '../diceV5Abi';
import { SLOTS_CONTRACT_ADDRESS } from '../slotsV9Abi';
import { GOLD_CONTRACT_ADDRESS } from '../goldAbi';
import { CHARACTER_CONTRACT_ADDRESS } from '../characterAbi';
import { CLZD_TOKEN_ADDRESS } from '../clzdAbi';

// Prediction contract address (deployed Dec 2025)
export const PREDICTION_CONTRACT_ADDRESS = {
    mainnet: import.meta.env.VITE_PREDICTION_CONTRACT_ADDRESS || '0x472F1f89c6226a5682DEe4b9948D3200acC50aEe',
};

export interface NetworkConfig {
    chainId: number;
    name: string;
    rpcUrls: string[];
    wsRpcUrls?: string[];
    blockExplorer: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    contracts: {
        character: string;
        gold: string;
        slots: string;
        dice: string;
        clzdToken: string;
        prediction: string;
    };
}

// BSC Mainnet is the only supported network
export const CHAIN_ID = 56;

export const getCurrentChainId = (): number => {
    return CHAIN_ID;
};

// Network configuration - BSC Mainnet only
export const NETWORKS: Record<number, NetworkConfig> = {
    // BSC Mainnet
    56: {
        chainId: 56,
        name: 'BSC Mainnet',
        rpcUrls: [
            import.meta.env.VITE_BSC_MAINNET_RPC || 'https://bsc-dataseed1.binance.org',
            'https://bsc-dataseed2.binance.org',
            'https://bsc-dataseed3.binance.org',
        ],
        wsRpcUrls: [
            import.meta.env.VITE_BSC_MAINNET_WS || 'wss://bsc.publicnode.com',
        ],
        blockExplorer: 'https://bscscan.com',
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18,
        },
        contracts: {
            character: CHARACTER_CONTRACT_ADDRESS.mainnet,
            gold: GOLD_CONTRACT_ADDRESS.mainnet,
            slots: SLOTS_CONTRACT_ADDRESS.mainnet,
            dice: DICE_CONTRACT_ADDRESS.mainnet,
            clzdToken: CLZD_TOKEN_ADDRESS.mainnet,
            prediction: PREDICTION_CONTRACT_ADDRESS.mainnet,
        },
    },
};

/**
 * Get network configuration for a specific chain ID
 */
export const getNetworkConfig = (chainId: number): NetworkConfig | undefined => {
    return NETWORKS[chainId];
};

/**
 * Get contract address for a specific contract type
 */
export const getContractAddress = (
    chainId: number,
    contract: 'character' | 'gold' | 'slots' | 'dice' | 'clzdToken'
): string | undefined => {
    const network = NETWORKS[chainId];
    return network?.contracts[contract];
};

/**
 * Check if a contract is properly configured (not zero address)
 */
export const isContractConfigured = (
    chainId: number,
    contract: 'character' | 'gold' | 'slots' | 'dice' | 'clzdToken'
): boolean => {
    const address = getContractAddress(chainId, contract);
    return Boolean(
        address &&
        address !== '0x0000000000000000000000000000000000000000' &&
        address.length === 42 &&
        address.startsWith('0x')
    );
};

/**
 * Get current network configuration (always BSC Mainnet)
 */
export const getCurrentNetwork = (): NetworkConfig | undefined => {
    return getNetworkConfig(CHAIN_ID);
};

// Active contract addresses - mainnet only
export const ACTIVE_CONTRACTS = {
    DICE: DICE_CONTRACT_ADDRESS.mainnet,
    SLOTS: SLOTS_CONTRACT_ADDRESS.mainnet,
    GOLD: GOLD_CONTRACT_ADDRESS.mainnet,
    CHARACTER: CHARACTER_CONTRACT_ADDRESS.mainnet,
    CLZD_TOKEN: CLZD_TOKEN_ADDRESS.mainnet,
} as const;
