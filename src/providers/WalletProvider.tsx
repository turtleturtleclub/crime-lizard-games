import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { WalletContext } from './WalletContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getContractAddress } from '../config/contracts';

// BSC Mainnet is the only supported network
type NetworkId = 56;

interface NetworkConfig {
    name: string;
    rpcUrls: string[];
    wssUrls: string[];
    blockExplorerUrls: string[];
    nativeCurrency: { name: string; symbol: string; decimals: number };
    contractAddress: string;
    diceContractAddress: string;
    goldContractAddress: string;
    legendContractAddress: string;
}

interface EthereumError {
    code?: number;
    message?: string;
}

// BSC Mainnet configuration only
export const NETWORKS: Record<number, NetworkConfig> = {
    56: {
        name: 'BNB Smart Chain',
        rpcUrls: [
            import.meta.env.VITE_BSC_MAINNET_RPC || 'https://bsc-dataseed1.binance.org/',
            'https://bsc-dataseed2.binance.org/',
            'https://bsc-dataseed3.binance.org/'
        ],
        wssUrls: [
            import.meta.env.VITE_BSC_MAINNET_WSS || 'wss://bsc-ws-node.nariox.org:443'
        ],
        blockExplorerUrls: ['https://bscscan.com'],
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        contractAddress: getContractAddress(56, 'slots') || '0x0000000000000000000000000000000000000000',
        diceContractAddress: getContractAddress(56, 'dice') || '0x0000000000000000000000000000000000000000',
        goldContractAddress: getContractAddress(56, 'gold') || '0x0000000000000000000000000000000000000000',
        legendContractAddress: getContractAddress(56, 'character') || '0x0000000000000000000000000000000000000000',
    },
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    const { t } = useLanguage();
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [currentChainId, setCurrentChainId] = useState<NetworkId | null>(56); // Default to BNB mainnet
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'slow'>('online');
    const [retryCount, setRetryCount] = useState(0);

    // Ref to prevent multiple simultaneous connection attempts
    const isConnectingRef = React.useRef(false);
    const hasAutoConnectedRef = React.useRef(false);

    // Network monitoring
    const checkNetworkHealth = useCallback(async () => {
        if (!provider) return;

        try {
            const startTime = Date.now();
            await provider.getBlockNumber();
            const responseTime = Date.now() - startTime;

            if (responseTime > 5000) {
                setNetworkStatus('slow');
            } else {
                setNetworkStatus('online');
            }
            setConnectionError(null);
        } catch (error) {
            console.error('Network health check failed:', error);
            setNetworkStatus('offline');
            setConnectionError(t.wallet.networkConnectionLost);
        }
    }, [provider, t]);

    // Enhanced error handling
    const getErrorMessage = useCallback((error: unknown): string => {
        const ethError = error as EthereumError;

        if (ethError.code) {
            switch (ethError.code) {
                case 4001:
                    return t.wallet.transactionCancelled;
                case 4902:
                    return t.wallet.networkNotAdded;
                case -32002:
                    return t.wallet.requestPending;
                case -32603:
                    return t.wallet.internalError;
                default:
                    return ethError.message || t.wallet.walletError;
            }
        }

        if (ethError.message) {
            if (ethError.message.includes('insufficient funds')) {
                return t.wallet.insufficientFundsWallet;
            }
            if (ethError.message.includes('gas')) {
                return t.wallet.gasEstimationFailed;
            }
            if (ethError.message.includes('nonce')) {
                return t.wallet.nonceError;
            }
        }

        return t.wallet.unexpectedError;
    }, [t]);

    const handleNetworkError = useCallback(async (error: unknown, operation: string) => {
        const errorMessage = getErrorMessage(error);
        console.error(`${operation} failed:`, error);

        setConnectionError(errorMessage);
        toast.error(`${t.wallet.operationFailed.replace('{operation}', operation)}: ${errorMessage}`);

        // Auto-retry for network issues (max 3 retries)
        if (retryCount < 3 && (errorMessage.includes('network') || errorMessage.includes('connection'))) {
            setRetryCount(prev => prev + 1);
            toast.info(`${t.wallet.autoRetrying.replace('{operation}', operation).replace('{count}', String(retryCount + 1))}`);

            setTimeout(() => {
                // This would trigger a retry depending on the operation
                checkNetworkHealth();
            }, 3000);
        }
    }, [retryCount, getErrorMessage, checkNetworkHealth, t]);

    const addBSCMainnet = useCallback(async () => {
        if (!window.ethereum) return;

        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x38',
                    chainName: 'BNB Smart Chain Mainnet',
                    nativeCurrency: {
                        name: 'BNB',
                        symbol: 'BNB',
                        decimals: 18
                    },
                    rpcUrls: [import.meta.env.VITE_BSC_MAINNET_RPC || 'https://bsc-dataseed1.binance.org/'],
                    blockExplorerUrls: ['https://bscscan.com']
                }]
            });
            toast.success(`${t.wallet.mainnetAdded}`);
            setConnectionError(null);
        } catch (error: unknown) {
            await handleNetworkError(error, 'Add BSC Mainnet');
        }
    }, [handleNetworkError, t]);

    const switchToBSCMainnet = useCallback(async () => {
        if (!window.ethereum) {
            toast.error(`${t.wallet.noWalletDetected}`);
            return;
        }

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }],
            });
            toast.success(`${t.wallet.switchedToMainnet}`);
        } catch (error: unknown) {
            const ethError = error as EthereumError;
            if (ethError.code === 4902 || ethError.message?.includes('Unrecognized chain ID')) {
                await addBSCMainnet();
            } else if (ethError.code === 4001) {
                toast.warn(`${t.wallet.networkSwitchCancelled}`);
            } else {
                toast.error(`${t.wallet.failedToSwitch}: ${ethError.message || t.wallet.unknownError}`);
            }
        }
    }, [addBSCMainnet, t]);

    const connectWallet = useCallback(async (isAutoConnect = false) => {
        // Prevent multiple simultaneous connection attempts
        if (isConnectingRef.current) {
            return;
        }

        if (!window.ethereum) {
            toast.error(`${t.wallet.noWalletDetected}`);
            return;
        }

        isConnectingRef.current = true;
        setIsConnecting(true);
        setConnectionError(null);

        try {
            const prov = new ethers.BrowserProvider(window.ethereum);
            setProvider(prov);

            // Test network connectivity
            await checkNetworkHealth();

            const accounts = await prov.send('eth_requestAccounts', []);
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                const sig = await prov.getSigner();
                setSigner(sig);

                // Store wallet connected state for auto-reconnect
                localStorage.setItem('walletConnected', 'true');
            }

            const net = await prov.getNetwork();
            const chainId = Number(net.chainId);

            // Only BSC Mainnet (56) is supported
            if (chainId === 56) {
                setCurrentChainId(56);
                if (!isAutoConnect) {
                    toast.success('Connected to BNB Smart Chain!');
                }
                setRetryCount(0);
            } else {
                // Wrong network - prompt to switch to mainnet
                setCurrentChainId(56); // Default to mainnet
                toast.warning('Please switch to BNB Smart Chain (Mainnet).');
                setTimeout(() => {
                    switchToBSCMainnet();
                }, 1500);
            }
        } catch (error) {
            // Don't show errors for auto-connect attempts (silent fail)
            if (!isAutoConnect) {
                await handleNetworkError(error, 'Wallet connection');
            } else {
                // Clear stored state if auto-connect fails
                localStorage.removeItem('walletConnected');
            }
        } finally {
            setIsConnecting(false);
            isConnectingRef.current = false;
        }
    }, [switchToBSCMainnet, checkNetworkHealth, handleNetworkError, t]);

    // Disconnect wallet function
    const disconnectWallet = useCallback(() => {
        setProvider(null);
        setSigner(null);
        setAccount(null);
        setCurrentChainId(null);
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('selectedCharacterId');
        toast.info('Wallet disconnected');
    }, []);

    // Auto-connect on page load if previously connected (runs once)
    useEffect(() => {
        // Only run once using ref
        if (hasAutoConnectedRef.current) {
            return;
        }

        const wasConnected = localStorage.getItem('walletConnected');
        const manuallyDisconnected = sessionStorage.getItem('crimeLizardWalletDisconnected');

        // Only auto-connect if previously connected AND user didn't manually disconnect
        if (wasConnected === 'true' && !manuallyDisconnected && window.ethereum && !account) {
            hasAutoConnectedRef.current = true;
            connectWallet(true); // Silent auto-connect
        }
    }, [connectWallet, account]);

    // Set up wallet event listeners once on mount
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = async (accounts: string[]) => {
            if (accounts.length === 0) {
                // User disconnected wallet from MetaMask
                setProvider(null);
                setSigner(null);
                setAccount(null);
                setCurrentChainId(null);
                localStorage.removeItem('walletConnected');
                localStorage.removeItem('selectedCharacterId');
                toast.info('Wallet disconnected');
            } else {
                // Account changed - refresh state
                setAccount(accounts[0] || null);
            }
        };

        const handleChainChanged = (chainId: string) => {
            const newChainId = Number(chainId);
            setCurrentChainId(newChainId === 56 ? 56 : null);
            // Reload page on chain change to ensure clean state (standard practice)
            window.location.reload();
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []); // Empty deps - only run once on mount

    useEffect(() => {
        if (provider) {
            provider.getNetwork().then(net => {
                // Only set chainId if on mainnet, otherwise keep default
                const chainId = Number(net.chainId);
                if (chainId === 56) {
                    setCurrentChainId(56);
                }
            });
        }
    }, [provider]);

    // Network health monitoring
    useEffect(() => {
        if (provider && account) {
            // Initial health check
            checkNetworkHealth();

            // Set up periodic health checks (every 30 seconds)
            const healthCheckInterval = setInterval(() => {
                checkNetworkHealth();
            }, 30000);

            return () => clearInterval(healthCheckInterval);
        }
    }, [provider, account, checkNetworkHealth]);

    return (
        <WalletContext.Provider value={{
            provider,
            signer,
            account,
            currentChainId,
            isConnecting,
            connectionError,
            networkStatus,
            connectWallet,
            disconnectWallet,
            switchToBSCMainnet,
            addBSCMainnet,
            checkNetworkHealth
        }}>
            {children}
        </WalletContext.Provider>
    );
};