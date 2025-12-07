import { createContext } from 'react';
import { ethers } from 'ethers';

// BSC Mainnet is the only supported network
type NetworkId = 56;

export const WalletContext = createContext({
    provider: null as ethers.BrowserProvider | null,
    signer: null as ethers.JsonRpcSigner | null,
    account: null as string | null,
    currentChainId: 56 as NetworkId | null,
    isConnecting: false,
    connectionError: null as string | null,
    networkStatus: 'online' as 'online' | 'offline' | 'slow',
    connectWallet: async (_isAutoConnect?: boolean) => { },
    disconnectWallet: () => { },
    checkNetworkHealth: async () => { },
    switchToBSCMainnet: async () => { },
    addBSCMainnet: async () => { },
});
