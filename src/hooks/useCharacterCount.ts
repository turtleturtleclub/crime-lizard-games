import { useState, useEffect, useContext } from 'react';
import { WalletContext } from '../providers/WalletContext';
import { getNetworkConfig, getContractAddress } from '../config/contracts';
import { getRpcProvider } from '../services/RpcProvider';

// Minimal ABI just for totalSupply
const LEGEND_ABI = [
    "function totalSupply() external view returns (uint256)"
];

interface CharacterCount {
    totalMinted: string;
    loading: boolean;
    error: string | null;
}

export const useCharacterCount = (): CharacterCount => {
    const { currentChainId } = useContext(WalletContext);
    const [count, setCount] = useState<CharacterCount>({
        totalMinted: '0',
        loading: true,
        error: null
    });

    useEffect(() => {
        const fetchCount = async () => {
            try {
                // Determine which network to use
                const chainId = currentChainId || 97; // Default to testnet
                const networkConfig = getNetworkConfig(chainId);

                if (!networkConfig) {
                    throw new Error('Unsupported network');
                }

                // Get Character NFT contract address
                const contractAddress = getContractAddress(chainId, 'character');

                if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
                    throw new Error('Contract not deployed on this network');
                }

                // Use private RPC provider for read-only operations
                const rpcProvider = getRpcProvider();

                // Fetch total supply (total minted) using private RPC
                const totalSupply = await rpcProvider.readContract(
                    contractAddress,
                    LEGEND_ABI,
                    'totalSupply'
                );

                setCount({
                    totalMinted: totalSupply.toString(),
                    loading: false,
                    error: null
                });
            } catch (error) {
                console.error('Error fetching character count:', error);
                setCount(prev => ({
                    ...prev,
                    loading: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch count'
                }));
            }
        };

        fetchCount();

        // Refresh count every 30 seconds
        const interval = setInterval(fetchCount, 30000);

        return () => clearInterval(interval);
    }, [currentChainId]);

    return count;
};
