import { useState, useEffect, useContext } from 'react';
import { WalletContext } from '../providers/WalletContext';
import { SLOTS_V11_ABI } from '../slotsV11Abi';
import { getNetworkConfig, getContractAddress } from '../config/contracts';
import { getRpcProvider } from '../services/RpcProvider';

interface ContractStats {
    totalPlayers: string;
    totalSpins: string;
    totalWagered: string;
    totalWon: string;
    jackpot: string;
    currentRTP: string;
    biggestWin: string;
    loading: boolean;
    error: string | null;
}

export const useContractStats = (): ContractStats => {
    const { currentChainId } = useContext(WalletContext);
    const [stats, setStats] = useState<ContractStats>({
        totalPlayers: '0',
        totalSpins: '0',
        totalWagered: '0',
        totalWon: '0',
        jackpot: '0',
        currentRTP: '0',
        biggestWin: '0',
        loading: true,
        error: null
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Determine which network to use
                const chainId = currentChainId || 97; // Default to testnet
                const networkConfig = getNetworkConfig(chainId);

                if (!networkConfig) {
                    throw new Error('Unsupported network');
                }

                // Get contract address from centralized config
                const contractAddress = getContractAddress(chainId, 'slots');

                if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
                    throw new Error('Contract not deployed on this network');
                }

                // Use Slots V4 ABI only
                const contractABI = SLOTS_V11_ABI;

                // Use private RPC provider for read-only operations
                // This avoids rate limiting and uses our private RPC endpoint
                const rpcProvider = getRpcProvider();

                // Batch read multiple contract stats together
                const [contractStats, jackpotAmount] = await rpcProvider.batchReadContracts([
                    {
                        contractAddress,
                        abi: contractABI,
                        method: 'stats',
                    },
                    {
                        contractAddress,
                        abi: contractABI,
                        method: 'jackpot',
                    },
                ]);

                setStats({
                    totalPlayers: contractStats.totalPlayers.toString(),
                    totalSpins: contractStats.totalSpins.toString(),
                    totalWagered: contractStats.totalAmountSpent.toString(), // Gold (plain number, not wei)
                    totalWon: contractStats.totalAmountWon.toString(), // Gold (plain number, not wei)
                    jackpot: jackpotAmount.toString(), // Gold (plain number, not wei)
                    currentRTP: contractStats.currentRTP.toString(),
                    biggestWin: contractStats.biggestSingleWin.toString(), // Gold (plain number, not wei)
                    loading: false,
                    error: null
                });
            } catch (error) {
                console.error('Error fetching contract stats:', error);
                setStats(prev => ({
                    ...prev,
                    loading: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch stats'
                }));
            }
        };

        fetchStats();

        // Refresh stats every 30 seconds
        const interval = setInterval(fetchStats, 30000);

        return () => clearInterval(interval);
    }, [currentChainId]);

    return stats;
};
