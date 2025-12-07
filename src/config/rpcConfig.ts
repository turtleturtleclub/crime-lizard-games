/**
 * RPC Provider Initialization
 *
 * Initializes the centralized RPC provider service with private RPC support.
 * The private RPC URL is kept secure via environment variables.
 */

import { initializeRpcProvider } from '../services/RpcProvider';
import { NETWORKS, getCurrentChainId } from './contracts';

/**
 * Initialize the RPC provider service at app startup
 *
 * This should be called once when the app starts, before any blockchain reads.
 */
export function setupRpcProvider() {
  const chainId = getCurrentChainId();
  const networkConfig = NETWORKS[chainId];

  if (!networkConfig) {
    console.error(`❌ No network configuration found for chain ID: ${chainId}`);
    return;
  }

  // Get private RPC URL from environment variable
  // This keeps your private RPC endpoint secure and not exposed in the code
  const privateRpcUrl = import.meta.env.VITE_PRIVATE_RPC_URL;

  // Initialize with private RPC (if provided) and public fallbacks
  const rpcProvider = initializeRpcProvider({
    privateRpcUrl,
    publicRpcUrls: networkConfig.rpcUrls,
    cacheTTL: 10000, // 10 seconds cache for blockchain data
    requestTimeout: 10000, // 10 seconds timeout for RPC requests
  });

  if (import.meta.env.VITE_DEBUG_MODE === 'true') {
    rpcProvider.getStats();
}

  return rpcProvider;
}

/**
 * Check if private RPC is configured
 */
export function hasPrivateRpc(): boolean {
  return Boolean(import.meta.env.VITE_PRIVATE_RPC_URL);
}
