import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { WalletContext } from '../providers/WalletContext';

const NetworkStatus: React.FC = () => {
    const { networkStatus, connectionError, isConnecting, checkNetworkHealth } = useContext(WalletContext);

    const getStatusColor = () => {
        switch (networkStatus) {
            case 'online': return 'text-green-400';
            case 'slow': return 'text-yellow-400';
            case 'offline': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusIcon = () => {
        switch (networkStatus) {
            case 'online': return '🟢';
            case 'slow': return '🟡';
            case 'offline': return '🔴';
            default: return '⚪';
        }
    };

    if (!connectionError && networkStatus === 'online' && !isConnecting) {
        return null; // Don't show anything when everything is fine
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 max-w-sm"
        >
            <div className="bg-black/95 backdrop-blur-sm border border-gray-600 rounded-lg p-4 shadow-xl">
                <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getStatusIcon()}</span>
                    <span className={`font-bold text-sm ${getStatusColor()}`}>
                        {isConnecting ? 'Connecting...' : networkStatus.toUpperCase()}
                    </span>
                    {networkStatus !== 'online' && !isConnecting && (
                        <button
                            onClick={checkNetworkHealth}
                            className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white ml-2"
                        >
                            Retry
                        </button>
                    )}
                </div>

                {connectionError && (
                    <div className="text-sm text-red-300 bg-red-900/30 p-2 rounded border border-red-700/50">
                        {connectionError}
                    </div>
                )}

                {networkStatus === 'slow' && (
                    <div className="text-sm text-yellow-300 bg-yellow-900/30 p-2 rounded border border-yellow-700/50">
                        Network response is slow. Transactions may take longer than usual.
                    </div>
                )}

                {isConnecting && (
                    <div className="text-sm text-blue-300 bg-blue-900/30 p-2 rounded border border-blue-700/50">
                        Establishing connection to BNB Smart Chain...
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default NetworkStatus;
