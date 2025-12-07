import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletContext } from '../providers/WalletContext';
import { toast } from 'react-toastify';

interface TestnetSetupProps {
    id?: string;
}

const TestnetSetup: React.FC<TestnetSetupProps> = ({ id = 'testnet-setup' }) => {
    const { account, currentChainId } = useContext(WalletContext);
    const [showFaucetGuide, setShowFaucetGuide] = useState(false);

    const addBSCTestnet = async () => {
        try {
            if (!window.ethereum) {
                toast.error('Please install MetaMask or another Web3 wallet!');
                return;
            }

            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x61', // 97 in decimal
                    chainName: 'BNB Smart Chain Testnet',
                    nativeCurrency: {
                        name: 'tBNB',
                        symbol: 'tBNB',
                        decimals: 18
                    },
                    rpcUrls: [
                        'https://bsc-testnet-rpc.publicnode.com',
                        'https://bnb-testnet.api.onfinality.io/public',
                        'https://bsc-testnet.public.blastapi.io',
                        'https://bsc-testnet.therpc.io'
                    ],
                    blockExplorerUrls: ['https://testnet.bscscan.com']
                }]
            });

            toast.success('BSC Testnet added successfully! 🎉');
        } catch (error: any) {
            console.error('Error adding network:', error);
            if (error.code === 4001) {
                toast.error('Network addition cancelled');
            } else {
                toast.error('Failed to add network: ' + error.message);
            }
        }
    };

    const switchToBSCTestnet = async () => {
        try {
            if (!window.ethereum) {
                toast.error('Please install MetaMask or another Web3 wallet!');
                return;
            }

            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x61' }], // 97 in decimal
            });

            toast.success('Switched to BSC Testnet! 🎉');
        } catch (error: any) {
            // If network doesn't exist, add it
            if (error.code === 4902) {
                await addBSCTestnet();
            } else if (error.code === 4001) {
                toast.error('Network switch cancelled');
            } else {
                toast.error('Failed to switch network: ' + error.message);
            }
        }
    };

    const isOnMainnet = currentChainId === 56;

    return (
        <div id={id} className="space-y-4 md:space-y-6 scroll-mt-20">
            {/* Network Status Card */}
            <div className={`border-2 p-4 md:p-6 ${isOnMainnet
                    ? 'bg-black border-[#00FF88]'
                    : 'bg-black border-yellow-500'
                }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h3 className="text-xl md:text-2xl font-bold text-[#FFD700] font-bbs">
                        🔗 Network Setup
                    </h3>
                    {isOnMainnet ? (
                        <span className="bg-[#00FF88] text-black px-3 py-1.5 md:px-4 md:py-2 font-bold text-xs md:text-sm flex items-center gap-2 w-fit">
                            ✅ Connected to Testnet
                        </span>
                    ) : (
                        <span className="bg-yellow-500 text-black px-3 py-1.5 md:px-4 md:py-2 font-bold text-xs md:text-sm flex items-center gap-2 w-fit">
                            ⚠️ Wrong Network
                        </span>
                    )}
                </div>

                <p className="text-gray-400 mb-4 text-sm md:text-base font-bbs">
                    {isOnMainnet
                        ? 'You\'re all set! Your wallet is connected to BSC Testnet.'
                        : 'Please switch to BSC Testnet to participate in the tournament.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                    <motion.button
                        onClick={addBSCTestnet}
                        className="bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black px-4 py-3 md:px-6 md:py-4 font-bold transition-all flex items-center justify-center gap-2 text-sm md:text-base font-bbs"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="text-lg md:text-xl">➕</span>
                        <span>Add BSC Testnet</span>
                    </motion.button>

                    <motion.button
                        onClick={switchToBSCTestnet}
                        className="bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black px-4 py-3 md:px-6 md:py-4 font-bold transition-all flex items-center justify-center gap-2 text-sm md:text-base font-bbs"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="text-lg md:text-xl">🔄</span>
                        <span>Switch to Testnet</span>
                    </motion.button>
                </div>
            </div>

            {/* Network Details */}
            <div className="bg-black border-2 border-gray-700 p-4 md:p-6">
                <h4 className="text-lg md:text-xl font-bold text-[#FFD700] mb-3 md:mb-4 font-bbs">📋 Network Details</h4>
                <div className="space-y-2 md:space-y-3 text-gray-300 text-xs md:text-sm font-bbs">
                    <div className="grid grid-cols-[auto_1fr] gap-2 md:gap-3">
                        <span className="text-gray-400">Network Name:</span>
                        <span className="font-mono break-words">BNB Smart Chain Testnet</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] gap-2 md:gap-3">
                        <span className="text-gray-400">Chain ID:</span>
                        <span className="font-mono">97</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] gap-2 md:gap-3">
                        <span className="text-gray-400">Currency:</span>
                        <span className="font-mono">tBNB</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] gap-2 md:gap-3">
                        <span className="text-gray-400">RPC URL:</span>
                        <span className="font-mono text-[10px] md:text-xs break-all">https://data-seed-prebsc-1-s1.bnbchain.org:8545</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] gap-2 md:gap-3">
                        <span className="text-gray-400">Block Explorer:</span>
                        <a
                            href="https://testnet.bscscan.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[#FFD700] hover:text-yellow-400 underline break-all"
                        >
                            testnet.bscscan.com
                        </a>
                    </div>
                </div>
            </div>

            {/* Faucet Instructions */}
            <div className="bg-black border-2 border-[#FFD700] p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h4 className="text-lg md:text-xl font-bold text-[#FFD700] font-bbs">💰 Get Free Testnet BNB</h4>
                    <motion.button
                        onClick={() => setShowFaucetGuide(!showFaucetGuide)}
                        className="bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black px-3 py-1.5 md:px-4 md:py-2 font-bold transition-all text-xs md:text-sm w-fit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {showFaucetGuide ? '▼ Hide Guide' : '▶ Show Guide'}
                    </motion.button>
                </div>

                <p className="text-gray-400 mb-4 text-sm md:text-base font-bbs">
                    You need testnet BNB (tBNB) to play games and mint NFT characters. Get 0.3 tBNB every 24 hours from the official faucet!
                </p>

                <AnimatePresence>
                    {showFaucetGuide && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 overflow-hidden"
                        >
                            {/* Step 1 - Official BNB Chain Faucet */}
                            <div className="bg-[#FFD700]/10 border-2 border-[#FFD700] p-3 md:p-4">
                                <div className="flex items-start gap-2 md:gap-3">
                                    <span className="bg-[#FFD700] text-black w-6 h-6 md:w-8 md:h-8 flex items-center justify-center font-bold flex-shrink-0 text-sm md:text-base font-bbs">1</span>
                                    <div className="flex-1">
                                        <h5 className="font-bold text-[#FFD700] mb-2 text-sm md:text-base font-bbs">✨ Visit Official BNB Chain Faucet (Recommended)</h5>
                                        <p className="text-gray-400 text-xs md:text-sm mb-3 font-bbs">
                                            The easiest way! Go to the official faucet, complete CAPTCHA, enter your wallet address, and get <strong className="text-[#FFD700]">0.3 tBNB</strong> instantly!
                                        </p>
                                        <a
                                            href="https://www.bnbchain.org/en/testnet-faucet"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black px-3 py-1.5 md:px-4 md:py-2 font-bold transition-all text-xs md:text-sm font-bbs"
                                        >
                                            <span>💰</span>
                                            <span>Get 0.3 tBNB</span>
                                            <span>↗</span>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="bg-black/20 border-2 border-gray-700 p-3 md:p-4">
                                <div className="flex items-start gap-2 md:gap-3">
                                    <span className="bg-[#FFD700] text-black w-6 h-6 md:w-8 md:h-8 flex items-center justify-center font-bold flex-shrink-0 text-sm md:text-base font-bbs">2</span>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-[#FFD700] mb-2 text-sm md:text-base font-bbs">Your Wallet Address</h5>
                                        <p className="text-gray-400 text-xs md:text-sm mb-3 font-bbs">
                                            Copy your address to paste into the faucet.
                                        </p>
                                        {account ? (
                                            <div className="bg-black border border-gray-700 p-2 md:p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                                                <code className="text-green-400 font-mono text-xs md:text-sm break-all flex-1">{account}</code>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(account);
                                                        toast.success('Address copied!');
                                                    }}
                                                    className="bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black px-3 py-1.5 font-bold text-xs md:text-sm whitespace-nowrap w-fit font-bbs transition-all"
                                                >
                                                    📋 Copy
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-yellow-400 text-xs md:text-sm font-bbs">Connect your wallet first!</p>
                                        )}
                                    </div>
                                </div>
                            </div>


                            {/* Pro Tips */}
                            <div className="bg-[#00AA55]/20 border-2 border-[#00FF88]/50 p-3 md:p-4">
                                <h5 className="font-bold text-green-400 mb-2 flex items-center gap-2 text-sm md:text-base font-bbs">
                                    <span>✨</span>
                                    <span>Pro Tips</span>
                                </h5>
                                <ul className="text-gray-300 text-xs md:text-sm space-y-1.5 md:space-y-2 font-bbs">
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#FFD700] flex-shrink-0">•</span>
                                        <span>Official faucet gives <strong className="text-[#FFD700]">0.3 tBNB</strong> once per 24 hours</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#FFD700] flex-shrink-0">•</span>
                                        <span>Can't request if your balance is already above 1 tBNB</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#FFD700] flex-shrink-0">•</span>
                                        <span>Testnet BNB has no real value - it's only for testing!</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#FFD700] flex-shrink-0">•</span>
                                        <span>0.3 tBNB is enough for hundreds of games and transactions</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#FFD700] flex-shrink-0">•</span>
                                        <span>Optional: BNB Chain Discord <code className="bg-black px-1 text-green-400">#faucet</code> channel for help</span>
                                    </li>
                                </ul>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Quick Action Buttons */}
                {!showFaucetGuide && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 mt-4">
                        <a
                            href="https://www.bnbchain.org/en/testnet-faucet"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black px-4 py-2.5 md:px-6 md:py-3 font-bold transition-all text-center text-sm md:text-base font-bbs"
                        >
                            💰 Get Testnet BNB →
                        </a>
                        <a
                            href="https://testnet.bscscan.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black px-4 py-2.5 md:px-6 md:py-3 font-bold transition-all text-center text-sm md:text-base font-bbs"
                        >
                            🔍 View on BSCScan →
                        </a>
                    </div>
                )}
            </div>

            {/* Quick Start Checklist */}
            <div className="bg-black border-2 border-[#00FF88] p-4 md:p-6">
                <h4 className="text-lg md:text-xl font-bold text-[#FFD700] mb-3 md:mb-4 font-bbs">✅ Quick Start Checklist</h4>
                <div className="space-y-2 md:space-y-3">
                    <div className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 ${account ? 'bg-[#00AA55]/20 border border-[#00FF88]/50' : 'bg-black/50 border border-gray-600'
                        }`}>
                        <span className="text-xl md:text-2xl flex-shrink-0">{account ? '✅' : '⬜'}</span>
                        <span className={`text-xs md:text-base font-bbs ${account ? 'text-green-400' : 'text-gray-400'}`}>
                            Connect Web3 Wallet
                        </span>
                    </div>
                    <div className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 ${isOnMainnet ? 'bg-[#00AA55]/20 border border-[#00FF88]/50' : 'bg-black/50 border border-gray-600'
                        }`}>
                        <span className="text-xl md:text-2xl flex-shrink-0">{isOnMainnet ? '✅' : '⬜'}</span>
                        <span className={`text-xs md:text-base font-bbs ${isOnMainnet ? 'text-green-400' : 'text-gray-400'}`}>
                            Switch to BSC Testnet (Chain ID: 97)
                        </span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-black/50 border border-gray-600">
                        <span className="text-xl md:text-2xl flex-shrink-0">⬜</span>
                        <span className="text-gray-400 text-xs md:text-base font-bbs">
                            Get Testnet BNB from Faucet
                        </span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-black/50 border border-gray-600">
                        <span className="text-xl md:text-2xl flex-shrink-0">⬜</span>
                        <span className="text-gray-400 text-xs md:text-base font-bbs">
                            Start Playing & Earning XP!
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestnetSetup;
