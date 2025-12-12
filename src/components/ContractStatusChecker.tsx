import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import { WalletContext } from '../providers/WalletContext';
import { GOLD_CONTRACT_ABI } from '../goldV7Abi';
import { CHARACTER_CONTRACT_ABI } from '../characterAbi';
import { SLOTS_V11_ABI } from '../slotsV11Abi';
import { getContractAddress } from '../config/contracts';
import { getRpcProvider } from '../services/RpcProvider';

interface ContractStatus {
    address: string;
    name: string;
    status: 'connected' | 'error' | 'checking';
    error?: string;
    details?: any;
}

interface ContractLinkage {
    name: string;
    expected: string;
    actual: string;
    status: 'correct' | 'incorrect' | 'checking';
}

interface AuthorizationStatus {
    server: string;
    goldContract: 'authorized' | 'unauthorized' | 'checking' | 'error';
    legendContract: 'authorized' | 'unauthorized' | 'checking' | 'error';
}

const ContractStatusChecker: React.FC = () => {
    const { currentChainId } = useContext(WalletContext);

    // Get contract addresses from centralized config
    const SLOTS_ADDRESS = getContractAddress(currentChainId || 56, 'slots') || '';
    const CHARACTER_ADDRESS = getContractAddress(currentChainId || 56, 'character') || '';
    const GOLD_ADDRESS = getContractAddress(currentChainId || 56, 'gold') || '';

    const [contractStatuses, setContractStatuses] = useState<ContractStatus[]>([
        { address: SLOTS_ADDRESS, name: 'CrimeLizardSlots', status: 'checking' },
        { address: CHARACTER_ADDRESS, name: 'CrimeLizardLegend (NFT)', status: 'checking' },
        { address: GOLD_ADDRESS, name: 'CrimeLizardGold', status: 'checking' },
    ]);

    const [linkages, setLinkages] = useState<ContractLinkage[]>([]);
    const [authorizations, setAuthorizations] = useState<AuthorizationStatus[]>([]);
    const [gameServerAddress, setGameServerAddress] = useState<string>('');
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        if (currentChainId === 56) {
            checkAllContracts();
        }
    }, [currentChainId]);

    const checkAllContracts = async () => {
        setChecking(true);
        await Promise.all([
            checkContractConnection(),
            checkContractLinkages(),
        ]);
        setChecking(false);
    };

    const checkContractConnection = async () => {
        const rpcProvider = getRpcProvider();
        const newStatuses: ContractStatus[] = [];

        // Check Slots Contract using private RPC
        try {
            const [jackpot, owner] = await rpcProvider.batchReadContracts([
                { contractAddress: SLOTS_ADDRESS, abi: SLOTS_V11_ABI, method: 'jackpot' },
                { contractAddress: SLOTS_ADDRESS, abi: SLOTS_V11_ABI, method: 'owner' }
            ]);
            newStatuses.push({
                address: SLOTS_ADDRESS,
                name: 'CrimeLizardSlots',
                status: 'connected',
                details: {
                    jackpot: jackpot.toString(),
                    owner: owner
                }
            });
        } catch (error) {
            newStatuses.push({
                address: SLOTS_ADDRESS,
                name: 'CrimeLizardSlots',
                status: 'error',
                error: (error as Error).message
            });
        }

        // Check Character Contract using private RPC
        try {
            const [totalSupply, owner] = await rpcProvider.batchReadContracts([
                { contractAddress: CHARACTER_ADDRESS, abi: CHARACTER_CONTRACT_ABI, method: 'totalSupply' },
                { contractAddress: CHARACTER_ADDRESS, abi: CHARACTER_CONTRACT_ABI, method: 'owner' }
            ]);
            newStatuses.push({
                address: CHARACTER_ADDRESS,
                name: 'CrimeLizardLegend (NFT)',
                status: 'connected',
                details: {
                    totalSupply: totalSupply.toString(),
                    owner: owner
                }
            });
        } catch (error) {
            newStatuses.push({
                address: CHARACTER_ADDRESS,
                name: 'CrimeLizardLegend (NFT)',
                status: 'error',
                error: (error as Error).message
            });
        }

        // Check Gold Contract using private RPC
        try {
            const [goldRate, treasury] = await rpcProvider.batchReadContracts([
                { contractAddress: GOLD_ADDRESS, abi: GOLD_CONTRACT_ABI, method: 'goldRate' },
                { contractAddress: GOLD_ADDRESS, abi: GOLD_CONTRACT_ABI, method: 'treasury' }
            ]);
            newStatuses.push({
                address: GOLD_ADDRESS,
                name: 'CrimeLizardGold',
                status: 'connected',
                details: {
                    goldRate: goldRate.toString(),
                    treasury: treasury
                }
            });
        } catch (error) {
            newStatuses.push({
                address: GOLD_ADDRESS,
                name: 'CrimeLizardGold',
                status: 'error',
                error: (error as Error).message
            });
        }

        setContractStatuses(newStatuses);
    };

    const checkContractLinkages = async () => {
        const rpcProvider = getRpcProvider();
        const newLinkages: ContractLinkage[] = [];

        try {
            // Check all contract linkages using private RPC
            const [slotsCharacterNFT, slotsGoldContract, goldCharacterNFT] = await rpcProvider.batchReadContracts([
                { contractAddress: SLOTS_ADDRESS, abi: SLOTS_V11_ABI, method: 'characterNFT' },
                { contractAddress: SLOTS_ADDRESS, abi: SLOTS_V11_ABI, method: 'goldContract' },
                { contractAddress: GOLD_ADDRESS, abi: GOLD_CONTRACT_ABI, method: 'characterNFT' }
            ]);

            // Check Slots -> Character NFT link
            newLinkages.push({
                name: 'Slots → Character NFT',
                expected: CHARACTER_ADDRESS.toLowerCase(),
                actual: slotsCharacterNFT.toLowerCase(),
                status: slotsCharacterNFT.toLowerCase() === CHARACTER_ADDRESS.toLowerCase() ? 'correct' : 'incorrect'
            });

            // Check Slots -> Gold Contract link
            newLinkages.push({
                name: 'Slots → Gold Contract',
                expected: GOLD_ADDRESS.toLowerCase(),
                actual: slotsGoldContract.toLowerCase(),
                status: slotsGoldContract.toLowerCase() === GOLD_ADDRESS.toLowerCase() ? 'correct' : 'incorrect'
            });

            // Check Gold -> Character NFT link
            newLinkages.push({
                name: 'Gold → Character NFT',
                expected: CHARACTER_ADDRESS.toLowerCase(),
                actual: goldCharacterNFT.toLowerCase(),
                status: goldCharacterNFT.toLowerCase() === CHARACTER_ADDRESS.toLowerCase() ? 'correct' : 'incorrect'
            });

        } catch (error) {
            console.error('Error checking linkages:', error);
        }

        setLinkages(newLinkages);
    };

    const checkGameServerAuthorization = async () => {
        if (!gameServerAddress) return;

        const rpcProvider = getRpcProvider();
        const newAuths: AuthorizationStatus[] = [];

        try {
            const address = ethers.getAddress(gameServerAddress);

            // Check Gold Contract authorization using private RPC
            let goldAuthorized: 'authorized' | 'unauthorized' | 'error' = 'unauthorized';
            try {
                const isAuthorized = await rpcProvider.readContract(
                    GOLD_ADDRESS,
                    GOLD_CONTRACT_ABI,
                    'gameServers',
                    [address]
                );
                goldAuthorized = isAuthorized ? 'authorized' : 'unauthorized';
            } catch (error) {
                goldAuthorized = 'error';
            }

            // Check Legend Contract authorization using private RPC
            let legendAuthorized: 'authorized' | 'unauthorized' | 'error' = 'error';
            try {
                const isAuthorizedChar = await rpcProvider.readContract(
                    CHARACTER_ADDRESS,
                    CHARACTER_CONTRACT_ABI,
                    'gameServers',
                    [address]
                );
                legendAuthorized = isAuthorizedChar ? 'authorized' : 'unauthorized';
            } catch (error) {
                legendAuthorized = 'error';
            }

            newAuths.push({
                server: address,
                goldContract: goldAuthorized,
                legendContract: legendAuthorized
            });

            setAuthorizations(newAuths);
        } catch (error) {
            console.error('Error checking authorization:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected':
            case 'correct':
            case 'authorized':
                return 'text-green-400 border-[#00FF88]';
            case 'error':
            case 'incorrect':
            case 'unauthorized':
                return 'text-red-400 border-red-500';
            case 'checking':
                return 'text-yellow-400 border-yellow-500';
            default:
                return 'text-gray-400 border-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'connected':
            case 'correct':
            case 'authorized':
                return '✅';
            case 'error':
            case 'incorrect':
            case 'unauthorized':
                return '❌';
            case 'checking':
                return '⏳';
            default:
                return '❓';
        }
    };

    return (
        <div className="space-y-6">
            {/* Contract Status Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-900/50 to-indigo-800/50 p-6 rounded-xl border border-blue-500/30 backdrop-blur-sm"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
                        📋 Contract Status Overview
                    </h2>
                    <button
                        onClick={checkAllContracts}
                        disabled={checking}
                        className="bg-blue-600 px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {checking ? '🔄 Checking...' : '🔄 Refresh'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {contractStatuses.map((contract, index) => (
                        <motion.div
                            key={contract.address}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`bg-black/50 p-4 rounded-lg border-2 ${getStatusColor(contract.status)}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-white text-lg">{contract.name}</h3>
                                <span className="text-2xl">{getStatusIcon(contract.status)}</span>
                            </div>
                            <p className="text-xs font-mono text-gray-400 mb-2 break-all">
                                {contract.address}
                            </p>
                            {contract.status === 'connected' && contract.details && (
                                <div className="text-xs text-gray-300 space-y-1 mt-2">
                                    {Object.entries(contract.details).map(([key, value]) => (
                                        <div key={key}>
                                            <span className="text-gray-400">{key}:</span>{' '}
                                            <span className="font-mono">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {contract.error && (
                                <p className="text-xs text-red-300 mt-2">{contract.error}</p>
                            )}
                            <a
                                href={`https://testnet.bscscan.com/address/${contract.address}#code`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
                            >
                                View on BSCScan →
                            </a>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Contract Linkages */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-purple-900/50 to-pink-800/50 p-6 rounded-xl border border-purple-500/30 backdrop-blur-sm"
            >
                <h2 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-2">
                    🔗 Contract Linkages
                </h2>

                {linkages.length === 0 ? (
                    <p className="text-gray-400">Checking contract linkages...</p>
                ) : (
                    <div className="space-y-3">
                        {linkages.map((link, index) => (
                            <motion.div
                                key={link.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`bg-black/50 p-4 rounded-lg border-2 ${getStatusColor(link.status)}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-white">{link.name}</h3>
                                    <span className="text-2xl">{getStatusIcon(link.status)}</span>
                                </div>
                                <div className="text-xs font-mono space-y-1">
                                    <div>
                                        <span className="text-gray-400">Expected:</span>{' '}
                                        <span className="text-green-400">{link.expected}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Actual:</span>{' '}
                                        <span className={link.status === 'correct' ? 'text-green-400' : 'text-red-400'}>
                                            {link.actual}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Game Server Authorization Checker */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-emerald-900/50 to-teal-800/50 p-6 rounded-xl border border-emerald-500/30 backdrop-blur-sm"
            >
                <h2 className="text-2xl font-bold text-emerald-400 mb-6 flex items-center gap-2">
                    🔐 Game Server Authorization Checker
                </h2>

                <div className="bg-black/50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-400 mb-3">
                        Check if a wallet/contract address is authorized as a game server
                    </p>
                    <div className="flex items-center space-x-4">
                        <input
                            type="text"
                            value={gameServerAddress}
                            onChange={e => setGameServerAddress(e.target.value)}
                            className="bg-gray-700 px-4 py-2 rounded text-white border border-emerald-500/30 flex-1 font-mono text-sm"
                            placeholder="Enter wallet/contract address (0x...)"
                        />
                        <button
                            onClick={checkGameServerAuthorization}
                            className="bg-emerald-600 px-4 py-2 rounded font-bold hover:bg-emerald-700"
                            disabled={!gameServerAddress}
                        >
                            🔍 Check Authorization
                        </button>
                    </div>
                </div>

                {authorizations.length > 0 && (
                    <div className="space-y-3">
                        {authorizations.map((auth, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-black/50 p-4 rounded-lg"
                            >
                                <p className="text-xs font-mono text-gray-400 mb-3">{auth.server}</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-3 rounded border-2 ${getStatusColor(auth.goldContract)}`}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-white">Gold Contract</span>
                                            <span className="text-xl">{getStatusIcon(auth.goldContract)}</span>
                                        </div>
                                        <p className="text-xs mt-1 capitalize">{auth.goldContract}</p>
                                    </div>
                                    <div className={`p-3 rounded border-2 ${getStatusColor(auth.legendContract)}`}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-white">Legend Contract</span>
                                            <span className="text-xl">{getStatusIcon(auth.legendContract)}</span>
                                        </div>
                                        <p className="text-xs mt-1 capitalize">{auth.legendContract}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Quick Setup Guide */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-gray-900/50 to-slate-800/50 p-6 rounded-xl border border-gray-500/30 backdrop-blur-sm"
            >
                <h2 className="text-2xl font-bold text-gray-300 mb-4">📚 Quick Setup Checklist</h2>
                <div className="space-y-2 text-sm">
                    {[
                        { text: 'All contracts deployed and verified', done: contractStatuses.every(c => c.status === 'connected') },
                        { text: 'Contracts correctly linked', done: linkages.every(l => l.status === 'correct') },
                        { text: 'Game server authorized on Gold contract', done: authorizations.length > 0 && authorizations[0]?.goldContract === 'authorized' },
                        { text: 'Game server authorized on Legend contract', done: authorizations.length > 0 && authorizations[0]?.legendContract === 'authorized' },
                    ].map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <span className="text-lg">{item.done ? '✅' : '⬜'}</span>
                            <span className={item.done ? 'text-green-400' : 'text-gray-400'}>{item.text}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default ContractStatusChecker;

