import { ethers } from 'ethers';

/**
 * Centralized RPC Provider Service
 *
 * Uses a private RPC endpoint for all read-only blockchain operations
 * to avoid rate limiting and improve reliability.
 *
 * Falls back to public RPC if private RPC fails.
 */

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface RPCConfig {
  privateRpcUrl?: string;
  publicRpcUrls: string[];
  cacheTTL?: number; // milliseconds
  requestTimeout?: number; // milliseconds
}

class RpcProviderService {
  private static instance: RpcProviderService;
  private primaryProvider: ethers.JsonRpcProvider | null = null;
  private fallbackProviders: ethers.JsonRpcProvider[] = [];
  private cache: Map<string, CacheEntry> = new Map();
  private config: RPCConfig;
  private readonly DEFAULT_CACHE_TTL = 10000; // 10 seconds
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds

  private constructor(config: RPCConfig) {
    this.config = {
      cacheTTL: config.cacheTTL || this.DEFAULT_CACHE_TTL,
      requestTimeout: config.requestTimeout || this.DEFAULT_TIMEOUT,
      ...config,
    };

    this.initializeProviders();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: RPCConfig): RpcProviderService {
    if (!RpcProviderService.instance) {
      if (!config) {
        throw new Error('RpcProviderService must be initialized with config first');
      }
      RpcProviderService.instance = new RpcProviderService(config);
    }
    return RpcProviderService.instance;
  }

  /**
   * Initialize providers with private and public RPC endpoints
   */
  private initializeProviders(): void {
    // Initialize private RPC provider if URL is provided
    if (this.config.privateRpcUrl) {
      try {
        this.primaryProvider = new ethers.JsonRpcProvider(this.config.privateRpcUrl);
} catch (error) {
        console.warn('⚠️ Failed to initialize private RPC provider:', error);
      }
    }

    // Initialize fallback public RPC providers
    this.fallbackProviders = this.config.publicRpcUrls
      .map(url => {
        try {
          return new ethers.JsonRpcProvider(url);
        } catch (error) {
          console.warn(`⚠️ Failed to initialize fallback RPC provider (${url}):`, error);
          return null;
        }
      })
      .filter((p): p is ethers.JsonRpcProvider => p !== null);

    if (this.fallbackProviders.length === 0 && !this.primaryProvider) {
      console.error('❌ No RPC providers available!');
    }
  }

  /**
   * Get the best available provider (prefers private RPC)
   */
  getProvider(): ethers.JsonRpcProvider {
    if (this.primaryProvider) {
      return this.primaryProvider;
    }
    if (this.fallbackProviders.length > 0) {
      return this.fallbackProviders[0];
    }
    throw new Error('No RPC provider available');
  }

  /**
   * Get all providers for fallback attempts
   */
  private getAllProviders(): ethers.JsonRpcProvider[] {
    const providers: ethers.JsonRpcProvider[] = [];
    if (this.primaryProvider) providers.push(this.primaryProvider);
    providers.push(...this.fallbackProviders);
    return providers;
  }

  /**
   * Generate cache key for a contract call
   */
  private getCacheKey(contractAddress: string, method: string, args: any[]): string {
    // Custom replacer to handle BigInt serialization
    const bigIntReplacer = (_key: string, value: any) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    };

    return `${contractAddress.toLowerCase()}_${method}_${JSON.stringify(args, bigIntReplacer)}`;
  }

  /**
   * Get cached data if available and not expired
   */
  private getCached(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > (this.config.cacheTTL || this.DEFAULT_CACHE_TTL)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache entry
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(contractAddress: string, method: string, args: any[] = []): void {
    const key = this.getCacheKey(contractAddress, method, args);
    this.cache.delete(key);
  }

  /**
   * Read data from contract with automatic fallback and caching
   *
   * @param contractAddress - Contract address
   * @param abi - Contract ABI
   * @param method - Method name to call
   * @param args - Method arguments
   * @param useCache - Whether to use cache (default: true)
   * @returns Promise with the call result
   */
  async readContract(
    contractAddress: string,
    abi: readonly any[],
    method: string,
    args: any[] = [],
    useCache: boolean = true
  ): Promise<any> {
    // Check cache first
    if (useCache) {
      const cacheKey = this.getCacheKey(contractAddress, method, args);
      const cached = this.getCached(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const providers = this.getAllProviders();
    let lastError: Error | null = null;

    // Try each provider in order (private first, then fallbacks)
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const isPrivateRpc = i === 0 && this.primaryProvider !== null;

      try {
        const contract = new ethers.Contract(contractAddress, abi, provider);

        // Call with timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('RPC request timeout')),
            this.config.requestTimeout || this.DEFAULT_TIMEOUT
          )
        );

        const result = await Promise.race([
          contract[method](...args),
          timeoutPromise,
        ]);

        // Cache successful result
        if (useCache) {
          const cacheKey = this.getCacheKey(contractAddress, method, args);
          this.setCache(cacheKey, result);
        }

        // Log success only in development for debugging
        // Disabled to reduce console spam - enable if needed for debugging
        // if (isPrivateRpc && i === 0) {
        //   console.debug(`✅ [Private RPC] ${method} call succeeded`);
        // }

        return result;
      } catch (error) {
        lastError = error as Error;
        const rpcType = isPrivateRpc ? 'Private RPC' : `Fallback RPC ${i}`;
        console.warn(`⚠️ [${rpcType}] ${method} call failed:`, error);

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    throw new Error(
      `All RPC providers failed for ${method}. Last error: ${lastError?.message || 'Unknown'}`
    );
  }

  /**
   * Get block number (useful for health checks)
   */
  async getBlockNumber(): Promise<number> {
    const providers = this.getAllProviders();

    for (const provider of providers) {
      try {
        return await provider.getBlockNumber();
      } catch (error) {
        continue;
      }
    }

    throw new Error('Failed to get block number from all providers');
  }

  /**
   * Batch multiple contract reads together
   * Useful for reducing RPC calls when fetching multiple data points
   */
  async batchReadContracts(
    calls: Array<{
      contractAddress: string;
      abi: readonly any[];
      method: string;
      args?: any[];
    }>,
    useCache: boolean = true
  ): Promise<any[]> {
    const promises = calls.map(call =>
      this.readContract(
        call.contractAddress,
        call.abi,
        call.method,
        call.args || [],
        useCache
      )
    );

    return Promise.all(promises);
  }

  /**
   * Get network information
   */
  async getNetwork(): Promise<ethers.Network> {
    const provider = this.getProvider();
    return provider.getNetwork();
  }

  /**
   * Check if private RPC is configured and working
   */
  async isPrivateRpcHealthy(): Promise<boolean> {
    if (!this.primaryProvider) return false;

    try {
      await this.primaryProvider.getBlockNumber();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get provider statistics
   */
  getStats() {
    return {
      hasPrivateRpc: this.primaryProvider !== null,
      fallbackCount: this.fallbackProviders.length,
      cacheSize: this.cache.size,
      cacheTTL: this.config.cacheTTL,
    };
  }
}

export default RpcProviderService;

/**
 * Initialize the RPC provider service
 * Call this once at app startup
 */
export function initializeRpcProvider(config: RPCConfig): RpcProviderService {
  return RpcProviderService.getInstance(config);
}

/**
 * Get the initialized RPC provider instance
 */
export function getRpcProvider(): RpcProviderService {
  return RpcProviderService.getInstance();
}
