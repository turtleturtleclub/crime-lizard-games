/**
 * StakingPanel.tsx
 * Component for staking CLZD tokens to earn gold and XP bonuses
 */

import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { WalletContext } from '../../providers/WalletContext';
import { getContractAddress } from '../../config/contracts';
import { GOLD_CONTRACT_ABI } from '../../goldAbi';
import { CLZD_ABI } from '../../clzdAbi';
import { useModalClose } from '../../hooks/useModalClose';

interface StakingPanelProps {
    isOpen: boolean;
    onClose: () => void;
    tokenId: number;
}

interface StakingTier {
    threshold: string;
    goldBonus: number;
    xpBonus: number;
}

interface StakingInfo {
    stakedAmount: string;
    startTime: number;
    currentTier: StakingTier | null;
    nextTier: StakingTier | null;
    goldBonus: number;
    xpBonus: number;
}

const StakingPanel: React.FC<StakingPanelProps> = ({ isOpen, onClose, tokenId }) => {
    const { account, signer, provider, currentChainId } = useContext(WalletContext);

    const [clzdBalance, setClzdBalance] = useState<string>('0');
    const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
    const [stakingTiers, setStakingTiers] = useState<StakingTier[]>([]);
    const [stakeAmount, setStakeAmount] = useState<string>('');
    const [unstakeAmount, setUnstakeAmount] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [staking, setStaking] = useState(false);
    const [unstaking, setUnstaking] = useState(false);
    const [approving, setApproving] = useState(false);
    const [needsApproval, setNeedsApproval] = useState(false);

    // Use the modal close hook for ESC key and back button (args: onClose, isOpen)
    useModalClose(onClose, isOpen);

    // Load staking data
    useEffect(() => {
        if (isOpen && account && provider && tokenId) {
            loadStakingData();
        }
    }, [isOpen, account, provider, tokenId]);

    const loadStakingData = async () => {
        if (!provider || !account) return;

        setLoading(true);
        try {
            const goldContractAddress = getContractAddress(currentChainId || 56, 'gold');
            const clzdTokenAddress = getContractAddress(currentChainId || 56, 'clzdToken');

            if (!goldContractAddress || !clzdTokenAddress) {
                toast.error('Contract addresses not configured');
                return;
            }

            const goldContract = new ethers.Contract(goldContractAddress, GOLD_CONTRACT_ABI, provider);
            const clzdContract = new ethers.Contract(clzdTokenAddress, CLZD_ABI, provider);

            // Get CLZD balance
            const balance = await clzdContract.balanceOf(account);
            setClzdBalance(ethers.formatEther(balance));

            // Check allowance
            const allowance = await clzdContract.allowance(account, goldContractAddress);
            setNeedsApproval(allowance < ethers.parseEther('1000000000')); // Check if less than 1B

            // Get staking info
            const [staked, startTime, goldBonus, xpBonus] = await goldContract.getStakingInfo(tokenId);

            // Get staking tiers
            const tiersResult = await goldContract.getStakingTiers();
            const tiers: StakingTier[] = [];
            for (let i = 0; i < tiersResult[0].length; i++) {
                tiers.push({
                    threshold: ethers.formatEther(tiersResult[0][i]),
                    goldBonus: Number(tiersResult[1][i]),
                    xpBonus: Number(tiersResult[2][i])
                });
            }
            setStakingTiers(tiers);

            // Find current and next tier
            const stakedNum = parseFloat(ethers.formatEther(staked));
            let currentTier: StakingTier | null = null;
            let nextTier: StakingTier | null = null;

            for (let i = 0; i < tiers.length; i++) {
                if (stakedNum >= parseFloat(tiers[i].threshold)) {
                    currentTier = tiers[i];
                    nextTier = tiers[i + 1] || null;
                } else if (!currentTier) {
                    nextTier = tiers[i];
                    break;
                }
            }

            setStakingInfo({
                stakedAmount: ethers.formatEther(staked),
                startTime: Number(startTime),
                currentTier,
                nextTier,
                goldBonus: Number(goldBonus),
                xpBonus: Number(xpBonus)
            });
        } catch (error) {
            console.error('Error loading staking data:', error);
            toast.error('Failed to load staking data');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!signer) return;

        setApproving(true);
        try {
            const goldContractAddress = getContractAddress(currentChainId || 56, 'gold');
            const clzdTokenAddress = getContractAddress(currentChainId || 56, 'clzdToken');

            if (!goldContractAddress || !clzdTokenAddress) {
                toast.error('Contract addresses not configured');
                return;
            }

            const clzdContract = new ethers.Contract(clzdTokenAddress, CLZD_ABI, signer);

            // Approve max uint256
            const tx = await clzdContract.approve(
                goldContractAddress,
                ethers.MaxUint256
            );

            toast.info('Approval transaction submitted...');
            await tx.wait();

            setNeedsApproval(false);
            toast.success('CLZD approved for staking!');
        } catch (error: any) {
            console.error('Approval error:', error);
            toast.error(`Approval failed: ${error.reason || error.message}`);
        } finally {
            setApproving(false);
        }
    };

    const handleStake = async () => {
        if (!signer || !stakeAmount || parseFloat(stakeAmount) <= 0) return;

        setStaking(true);
        try {
            const goldContractAddress = getContractAddress(currentChainId || 56, 'gold');
            if (!goldContractAddress) {
                toast.error('Gold contract address not configured');
                return;
            }

            const goldContract = new ethers.Contract(goldContractAddress, GOLD_CONTRACT_ABI, signer);
            const amountWei = ethers.parseEther(stakeAmount);

            const tx = await goldContract.stakeCLZD(tokenId, amountWei);
            toast.info('Staking transaction submitted...');
            await tx.wait();

            toast.success(`Staked ${parseFloat(stakeAmount).toLocaleString()} CLZD!`);
            setStakeAmount('');
            loadStakingData();
        } catch (error: any) {
            console.error('Staking error:', error);
            toast.error(`Staking failed: ${error.reason || error.message}`);
        } finally {
            setStaking(false);
        }
    };

    const handleUnstake = async () => {
        if (!signer || !unstakeAmount || parseFloat(unstakeAmount) <= 0) return;

        setUnstaking(true);
        try {
            const goldContractAddress = getContractAddress(currentChainId || 56, 'gold');
            if (!goldContractAddress) {
                toast.error('Gold contract address not configured');
                return;
            }

            const goldContract = new ethers.Contract(goldContractAddress, GOLD_CONTRACT_ABI, signer);
            const amountWei = ethers.parseEther(unstakeAmount);

            const tx = await goldContract.unstakeCLZD(tokenId, amountWei);
            toast.info('Unstaking transaction submitted...');
            await tx.wait();

            toast.success(`Unstaked ${parseFloat(unstakeAmount).toLocaleString()} CLZD!`);
            setUnstakeAmount('');
            loadStakingData();
        } catch (error: any) {
            console.error('Unstaking error:', error);
            toast.error(`Unstaking failed: ${error.reason || error.message}`);
        } finally {
            setUnstaking(false);
        }
    };

    const formatNumber = (num: string | number) => {
        return parseFloat(num.toString()).toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    const getStakeDuration = () => {
        if (!stakingInfo || stakingInfo.startTime === 0) return 'Not staking';
        const now = Math.floor(Date.now() / 1000);
        const duration = now - stakingInfo.startTime;
        const days = Math.floor(duration / 86400);
        const hours = Math.floor((duration % 86400) / 3600);
        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h`;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-purple-500/50"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-purple-500/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-purple-400">CLZD Staking</h2>
                                <p className="text-gray-400 text-sm mt-1">Stake CLZD to earn gold and XP bonuses</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                &times;
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                            <p className="text-gray-400">Loading staking info...</p>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Current Staking Status */}
                            <div className="bg-black/50 rounded-xl p-6 border border-purple-500/30">
                                <h3 className="text-lg font-bold text-white mb-4">Your Staking Status</h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div className="bg-purple-900/30 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 mb-1">CLZD Balance</p>
                                        <p className="text-lg font-bold text-purple-400">{formatNumber(clzdBalance)}</p>
                                    </div>
                                    <div className="bg-purple-900/30 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 mb-1">Staked</p>
                                        <p className="text-lg font-bold text-green-400">{formatNumber(stakingInfo?.stakedAmount || '0')}</p>
                                    </div>
                                    <div className="bg-purple-900/30 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 mb-1">Gold Bonus</p>
                                        <p className="text-lg font-bold text-yellow-400">+{stakingInfo?.goldBonus || 0}%</p>
                                    </div>
                                    <div className="bg-purple-900/30 rounded-lg p-3">
                                        <p className="text-xs text-gray-400 mb-1">XP Bonus</p>
                                        <p className="text-lg font-bold text-blue-400">+{stakingInfo?.xpBonus || 0}%</p>
                                    </div>
                                </div>

                                {stakingInfo?.currentTier && (
                                    <div className="mt-4 text-center">
                                        <span className="bg-purple-600 px-3 py-1 rounded-full text-sm font-bold">
                                            Current Tier: {formatNumber(stakingInfo.currentTier.threshold)} CLZD
                                        </span>
                                        <p className="text-xs text-gray-500 mt-2">Staking for: {getStakeDuration()}</p>
                                    </div>
                                )}

                                {stakingInfo?.nextTier && (
                                    <div className="mt-4 text-center">
                                        <p className="text-sm text-gray-400">
                                            Next tier at {formatNumber(stakingInfo.nextTier.threshold)} CLZD
                                            (+{stakingInfo.nextTier.goldBonus}% gold, +{stakingInfo.nextTier.xpBonus}% XP)
                                        </p>
                                        {stakingInfo.stakedAmount && parseFloat(stakingInfo.stakedAmount) > 0 && (
                                            <p className="text-xs text-purple-400 mt-1">
                                                Need {formatNumber(parseFloat(stakingInfo.nextTier.threshold) - parseFloat(stakingInfo.stakedAmount))} more CLZD
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Staking Tiers */}
                            <div className="bg-black/50 rounded-xl p-6 border border-purple-500/30">
                                <h3 className="text-lg font-bold text-white mb-4">Staking Tiers</h3>

                                <div className="space-y-2">
                                    {stakingTiers.map((tier, idx) => {
                                        const isActive = stakingInfo && parseFloat(stakingInfo.stakedAmount) >= parseFloat(tier.threshold);
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                                                    isActive
                                                        ? 'bg-purple-600/30 border border-purple-500'
                                                        : 'bg-gray-800/50 border border-gray-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-2xl ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                                                        {isActive ? '✅' : '🔒'}
                                                    </span>
                                                    <span className={`font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                                                        {formatNumber(tier.threshold)} CLZD
                                                    </span>
                                                </div>
                                                <div className="flex gap-4 text-sm">
                                                    <span className={isActive ? 'text-yellow-400' : 'text-gray-500'}>
                                                        +{tier.goldBonus}% Gold
                                                    </span>
                                                    <span className={isActive ? 'text-blue-400' : 'text-gray-500'}>
                                                        +{tier.xpBonus}% XP
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Stake/Unstake Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Stake */}
                                <div className="bg-green-900/20 rounded-xl p-4 border border-green-500/30">
                                    <h4 className="text-lg font-bold text-green-400 mb-3">Stake CLZD</h4>

                                    {needsApproval ? (
                                        <motion.button
                                            onClick={handleApprove}
                                            disabled={approving}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {approving ? 'Approving...' : 'Approve CLZD'}
                                        </motion.button>
                                    ) : (
                                        <>
                                            <div className="flex gap-2 mb-3">
                                                <input
                                                    type="number"
                                                    value={stakeAmount}
                                                    onChange={(e) => setStakeAmount(e.target.value)}
                                                    placeholder="Amount to stake"
                                                    className="flex-1 bg-black/50 px-3 py-2 rounded-lg text-white border border-green-500/30"
                                                />
                                                <button
                                                    onClick={() => setStakeAmount(clzdBalance)}
                                                    className="bg-green-600/30 hover:bg-green-600/50 px-3 py-2 rounded-lg text-green-400 text-sm font-bold"
                                                >
                                                    MAX
                                                </button>
                                            </div>
                                            <motion.button
                                                onClick={handleStake}
                                                disabled={staking || !stakeAmount || parseFloat(stakeAmount) <= 0}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                {staking ? 'Staking...' : 'Stake CLZD'}
                                            </motion.button>
                                        </>
                                    )}
                                </div>

                                {/* Unstake */}
                                <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/30">
                                    <h4 className="text-lg font-bold text-red-400 mb-3">Unstake CLZD</h4>

                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="number"
                                            value={unstakeAmount}
                                            onChange={(e) => setUnstakeAmount(e.target.value)}
                                            placeholder="Amount to unstake"
                                            className="flex-1 bg-black/50 px-3 py-2 rounded-lg text-white border border-red-500/30"
                                        />
                                        <button
                                            onClick={() => setUnstakeAmount(stakingInfo?.stakedAmount || '0')}
                                            className="bg-red-600/30 hover:bg-red-600/50 px-3 py-2 rounded-lg text-red-400 text-sm font-bold"
                                        >
                                            MAX
                                        </button>
                                    </div>
                                    <motion.button
                                        onClick={handleUnstake}
                                        disabled={unstaking || !unstakeAmount || parseFloat(unstakeAmount) <= 0 || parseFloat(unstakeAmount) > parseFloat(stakingInfo?.stakedAmount || '0')}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {unstaking ? 'Unstaking...' : 'Unstake CLZD'}
                                    </motion.button>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/30">
                                <h4 className="text-lg font-bold text-blue-400 mb-2">How Staking Works</h4>
                                <ul className="text-sm text-gray-300 space-y-1">
                                    <li>- Stake CLZD to your character to earn bonuses</li>
                                    <li>- Gold bonus applies to all gold purchases</li>
                                    <li>- XP bonus applies to combat and quest rewards</li>
                                    <li>- Bonuses are based on the amount staked</li>
                                    <li>- You can unstake at any time with no penalty</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default StakingPanel;
