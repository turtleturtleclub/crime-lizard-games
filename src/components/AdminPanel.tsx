import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { SLOTS_V9_ABI } from '../slotsV9Abi';
import { CHARACTER_CONTRACT_ABI } from '../characterAbi';
import { GOLD_CONTRACT_ABI } from '../goldAbi';
import { WalletContext } from '../providers/WalletContext';
import { getContractAddress } from '../config/contracts';
import TelegramIntegration from './TelegramIntegration';
import ContractManagement from './ContractManagement';
import ContractStatusChecker from './ContractStatusChecker';

const AdminPanel: React.FC = () => {
    const { account, provider, signer, currentChainId } = useContext(WalletContext);
    const [contractBalance, setContractBalance] = useState<string>('0');
    const [profits, setProfits] = useState<string>('0');
    const [showTelegramIntegration, setShowTelegramIntegration] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState<string>('0');
    const [depositAmount, setDepositAmount] = useState<string>('0');
    const [minBetAmount, setMinBetAmount] = useState<string>('0.001');
    const [currentMinBet, setCurrentMinBet] = useState<string>('0');
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'status' | 'contracts' | 'testing' | 'gas' | 'security' | 'xp-rewards' | 'submissions' | 'dev-mint' | 'clzd-settings' | 'predictions'>('status');
    const [testResults, setTestResults] = useState<any[]>([]);
    const [runningTests, setRunningTests] = useState(false);
    const [gasReport, setGasReport] = useState<any>(null);
    const [securityAudit, setSecurityAudit] = useState<any>(null);

    // XP Rewards state
    const [xpWalletAddress, setXpWalletAddress] = useState<string>('');
    const [xpAmount, setXpAmount] = useState<string>('');
    const [xpReason, setXpReason] = useState<string>('');
    const [xpUserData, setXpUserData] = useState<any>(null);
    const [loadingXpUser, setLoadingXpUser] = useState(false);

    // Submissions state
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [submissionsFilter, setSubmissionsFilter] = useState<{ type: string; status: string }>({ type: '', status: '' });
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
    const [editingSubmission, setEditingSubmission] = useState<any>(null);

    // Dev Mint state
    const [devMintAddress, setDevMintAddress] = useState<string>('');
    const [devMintArchetype, setDevMintArchetype] = useState<number>(0);
    const [devMintName, setDevMintName] = useState<string>('');
    const [devMinting, setDevMinting] = useState(false);

    // CLZD Settings state (V4.1 - numerator/denominator rate system)
    const [clzdRateNumerator, setClzdRateNumerator] = useState<string>('5');
    const [clzdRateDenominator, setClzdRateDenominator] = useState<string>('1000');
    const [clzdCurrentPrice, setClzdCurrentPrice] = useState<string>('0');
    const [clzdTreasury, setClzdTreasury] = useState<string>('');
    const [clzdLoading, setClzdLoading] = useState(false);
    const [clzdSaving, setClzdSaving] = useState(false);
    const [stakingTiers, setStakingTiers] = useState<{threshold: string, goldBonus: string, xpBonus: string}[]>([
        { threshold: '100000', goldBonus: '5', xpBonus: '5' },
        { threshold: '500000', goldBonus: '10', xpBonus: '10' },
        { threshold: '1000000', goldBonus: '15', xpBonus: '15' },
        { threshold: '5000000', goldBonus: '25', xpBonus: '25' },
    ]);
    const [discountTiers, setDiscountTiers] = useState<{threshold: string, bnbDiscount: string, clzdDiscount: string}[]>([
        { threshold: '1000000', bnbDiscount: '5', clzdDiscount: '2' },
        { threshold: '5000000', bnbDiscount: '10', clzdDiscount: '5' },
        { threshold: '10000000', bnbDiscount: '15', clzdDiscount: '8' },
        { threshold: '25000000', bnbDiscount: '25', clzdDiscount: '12' },
    ]);

    // Prediction Market state
    const [predictionMarkets, setPredictionMarkets] = useState<any[]>([]);
    const [loadingPredictions, setLoadingPredictions] = useState(false);
    const [newMarket, setNewMarket] = useState({
        question: '',
        outcomes: ['', ''],
        bettingDurationHours: 24,
        resolutionDelayHours: 1,
        marketType: 'COMMUNITY',
        featured: false,
        tags: ''
    });
    const [creatingMarket, setCreatingMarket] = useState(false);
    const [resolvingMarket, setResolvingMarket] = useState<number | null>(null);
    const [selectedWinningOutcome, setSelectedWinningOutcome] = useState<number>(0);

    // Archetype definitions
    const ARCHETYPES = [
        { id: 0, name: 'The Blacksmith', rarity: 'Common', price: '0.01 BNB' },
        { id: 1, name: 'The Rogue', rarity: 'Common', price: '0.01 BNB' },
        { id: 2, name: 'The Knight', rarity: 'Uncommon', price: '0.02 BNB' },
        { id: 3, name: 'The Mage', rarity: 'Uncommon', price: '0.02 BNB' },
        { id: 4, name: 'The Robin Hood', rarity: 'Rare', price: '0.03 BNB' },
        { id: 5, name: 'The Developer', rarity: 'Rare', price: '0.03 BNB' },
        { id: 6, name: 'The Necromancer', rarity: 'Epic', price: '0.05 BNB' },
        { id: 7, name: 'The Paladin', rarity: 'Epic', price: '0.05 BNB' },
        { id: 8, name: 'The Degen', rarity: 'Legendary', price: '0.1 BNB' },
        { id: 9, name: 'The Dragon Tamer', rarity: 'Legendary', price: '0.1 BNB' },
    ];

    // Get contract address from centralized config
    const contractAddress = getContractAddress(currentChainId || 56, 'slots') || '';

    useEffect(() => {
        if (account && provider) {
            initializeContract();
        }
    }, [account, provider]);

    const initializeContract = async () => {
        try {
            const contract = new ethers.Contract(contractAddress, SLOTS_V9_ABI, provider);
            const owner = await contract.owner();

            // Admin wallets that can access the panel
            const adminWallets = [
                '0x44bd08f4be61c77716d7acbb5f6f7bbdd6f0122c', // Main admin
                '0xda80246ca50b6ade41d03057fcc18384138e1218'  // Deployer wallet
            ];
            const isAdminWallet = adminWallets.some(w => w.toLowerCase() === account!.toLowerCase());
            setIsOwner(owner.toLowerCase() === account!.toLowerCase() || isAdminWallet);

            if (isAdminWallet) {
                const contBal = await provider!.getBalance(contractAddress);
                const jackpot = await contract.jackpot();
                const minBet = await contract.minBetSize();
                setContractBalance(ethers.formatEther(contBal));
                setProfits(ethers.formatEther(contBal - jackpot));
                setCurrentMinBet(ethers.formatEther(minBet));

                // Load initial reports
                loadGasReport();
                loadSecurityAudit();
            }
        } catch (error) {
            console.error('Failed to initialize contract:', error);
        } finally {
            setLoading(false);
        }
    };

    const runContractTests = async () => {
        if (!provider || !isOwner) return;

        setRunningTests(true);
        setTestResults([]);

        const tests = [
            { name: 'Contract Connection', test: testContractConnection },
            { name: 'Bet Limits', test: testBetLimits },
            { name: 'Balance Checks', test: testBalanceChecks },
            { name: 'Owner Functions', test: testOwnerFunctions },
            { name: 'Game Logic', test: testGameLogic },
            { name: 'Gas Efficiency', test: testGasEfficiency },
        ];

        const results = [];

        for (const test of tests) {
            try {
                const result = await test.test();
                results.push({ ...test, ...result, status: 'passed' });
                setTestResults(prev => [...prev, { ...test, ...result, status: 'passed' }]);
            } catch (error) {
                results.push({ ...test, error: (error as Error).message, status: 'failed' });
                setTestResults(prev => [...prev, { ...test, error: (error as Error).message, status: 'failed' }]);
            }
        }

        setRunningTests(false);
        toast.success('Contract tests completed!');
    };

    const testContractConnection = async () => {
        const contract = new ethers.Contract(contractAddress, SLOTS_V9_ABI, provider);
        const owner = await contract.owner();
        const minBet = await contract.minBetSize();
        const maxBet = await contract.maxBetSize();
        return { message: `Connected successfully. Owner: ${owner}, Min Bet: ${ethers.formatEther(minBet)} BNB, Max Bet: ${ethers.formatEther(maxBet)} BNB` };
    };

    const testBetLimits = async () => {
        const contract = new ethers.Contract(contractAddress, SLOTS_V9_ABI, provider);
        const minBet = await contract.minBetSize();
        const maxBet = await contract.maxBetSize();

        if (minBet > maxBet) throw new Error('Min bet cannot be greater than max bet');
        if (minBet <= 0) throw new Error('Min bet must be greater than 0');
        if (maxBet <= minBet) throw new Error('Max bet must be greater than min bet');

        return { message: `Bet limits valid: ${ethers.formatEther(minBet)} - ${ethers.formatEther(maxBet)} BNB` };
    };

    const testBalanceChecks = async () => {
        const contract = new ethers.Contract(contractAddress, SLOTS_V9_ABI, provider);
        const balance = await provider!.getBalance(contractAddress);
        const jackpot = await contract.jackpot();

        if (balance < jackpot) throw new Error('Contract balance cannot be less than jackpot');
        if (jackpot <= 0) throw new Error('Jackpot must be greater than 0');

        return { message: `Balances healthy: ${ethers.formatEther(balance)} BNB total, ${ethers.formatEther(jackpot)} BNB jackpot` };
    };

    const testOwnerFunctions = async () => {
        if (!signer) throw new Error('No signer available');

        const contract = new ethers.Contract(contractAddress, SLOTS_V9_ABI, signer);
        const owner = await contract.owner();

        if (owner.toLowerCase() !== account!.toLowerCase()) {
            throw new Error('Current account is not the contract owner');
        }

        // Test pause/unpause
        await contract.pause();
        const paused = await contract.paused();
        if (!paused) throw new Error('Contract should be paused');

        await contract.unpause();
        const unpaused = await contract.paused();
        if (unpaused) throw new Error('Contract should be unpaused');

        return { message: 'Owner functions working correctly' };
    };

    const testGameLogic = async () => {
        const contract = new ethers.Contract(contractAddress, SLOTS_V9_ABI, provider);

        // Test payout calculation with sample reels
        const testReels = [0, 0, 0, 1, 2]; // 3 of a kind
        const testBet = ethers.parseEther('0.01');
        const payout = await contract.calculatePayout(testReels, testBet);

        if (payout <= 0) throw new Error('Payout calculation should return positive value for winning reels');

        return { message: `Game logic valid: ${ethers.formatEther(payout)} BNB payout for test spin` };
    };

    const testGasEfficiency = async () => {
        if (!signer) throw new Error('No signer available');

        const contract = new ethers.Contract(contractAddress, SLOTS_V9_ABI, signer);
        const testBet = ethers.parseEther('0.001');

        // Estimate gas for a spin request
        const gasEstimate = await contract.getFunction('requestSpin').estimateGas({ value: testBet });

        if (gasEstimate > 500000) {
            throw new Error(`Gas usage too high: ${gasEstimate} gas units`);
        }

        return { message: `Gas efficiency good: ${gasEstimate} gas units for spin request` };
    };

    const loadGasReport = async () => {
        // Simulate gas report loading
        const mockGasReport = {
            deployment: { gasUsed: 2450000, cost: '0.049 BNB' },
            functions: {
                requestSpin: { gasUsed: 185000, cost: '0.0037 BNB' },
                fulfillRandomWords: { gasUsed: 125000, cost: '0.0025 BNB' },
                withdraw: { gasUsed: 45000, cost: '0.0009 BNB' }
            },
            recommendations: [
                'Enable Intermediate Representation (viaIR) for better optimization',
                'Use uint256 instead of uint8 arrays for reels',
                'Batch multiple operations in single transactions'
            ]
        };
        setGasReport(mockGasReport);
    };

    // Load submissions for admin review
    const loadSubmissions = async () => {
        if (!account || !isOwner) return;

        setLoadingSubmissions(true);
        try {
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            const params = new URLSearchParams({
                adminWallet: account,
                ...(submissionsFilter.type && { type: submissionsFilter.type }),
                ...(submissionsFilter.status && { status: submissionsFilter.status })
            });

            const response = await fetch(`${serverUrl}/api/submissions/admin/all?${params}`);
            const data = await response.json();

            if (response.ok) {
                setSubmissions(data.submissions || []);
            } else {
                toast.error(data.error || 'Failed to load submissions');
            }
        } catch (error) {
            console.error('Error loading submissions:', error);
            toast.error('Failed to load submissions');
        } finally {
            setLoadingSubmissions(false);
        }
    };

    // Update submission (status, reply, XP)
    const updateSubmission = async () => {
        if (!account || !isOwner || !editingSubmission) return;

        try {
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            const response = await fetch(`${serverUrl}/api/submissions/admin/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminWallet: account,
                    submissionId: editingSubmission._id,
                    status: editingSubmission.status,
                    adminReply: editingSubmission.adminReply,
                    xpAwarded: editingSubmission.xpAwarded
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Submission updated successfully!');
                setEditingSubmission(null);
                setSelectedSubmission(null);
                loadSubmissions();
            } else {
                toast.error(data.error || 'Failed to update submission');
            }
        } catch (error) {
            console.error('Error updating submission:', error);
            toast.error('Failed to update submission');
        }
    };

    // Delete submission
    const deleteSubmission = async (submissionId: string) => {
        if (!account || !isOwner) return;

        if (!confirm('Are you sure you want to delete this submission?')) return;

        try {
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            const response = await fetch(`${serverUrl}/api/submissions/admin/delete/${submissionId}?adminWallet=${account}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Submission deleted successfully!');
                setSelectedSubmission(null);
                setEditingSubmission(null);
                loadSubmissions();
            } else {
                toast.error(data.error || 'Failed to delete submission');
            }
        } catch (error) {
            console.error('Error deleting submission:', error);
            toast.error('Failed to delete submission');
        }
    };

    // Load submissions when tab is activated
    useEffect(() => {
        if (activeTab === 'submissions' && isOwner) {
            loadSubmissions();
        }
    }, [activeTab, submissionsFilter, isOwner]);

    const loadSecurityAudit = async () => {
        // Simulate security audit loading
        const mockAudit = {
            score: '8/10',
            issues: [
                { severity: 'Low', description: 'Missing input validation on some parameters', status: 'Fixed' },
                { severity: 'Medium', description: 'Potential gas griefing in bulk operations', status: 'Mitigated' },
                { severity: 'Low', description: 'Event emission could be optimized', status: 'Recommended' }
            ],
            recommendations: [
                'Add comprehensive input validation',
                'Implement gas limits for bulk operations',
                'Consider using multicall for batch operations',
                'Add emergency pause functionality',
                'Implement timelock for critical parameter changes'
            ]
        };
        setSecurityAudit(mockAudit);
    };

    const handleWithdraw = async () => {
        if (!signer || !isOwner) return;

        try {
const contract = new ethers.Contract(contractAddress, SLOTS_V9_ABI, signer);
            const availableForWithdraw = ethers.parseEther(contractBalance) - ethers.parseEther('0.1'); // Preserve jackpot

            if (ethers.parseEther(withdrawAmount) > availableForWithdraw) {
                return toast.error('Cannot withdraw - must preserve jackpot funds');
            }

            // Estimate gas and add buffer for withdraw operations
            let gasEstimate: bigint;
            try {
                gasEstimate = await contract.getFunction('withdraw').estimateGas(ethers.parseEther(withdrawAmount));
                gasEstimate = (gasEstimate * 120n) / 100n; // Add 20% buffer
            } catch (error) {
                console.warn('⚠️ Gas estimation failed, using fallback:', error);
                gasEstimate = BigInt(100000); // Fallback for admin functions
            }

            const tx = await contract.withdraw(ethers.parseEther(withdrawAmount), { gasLimit: gasEstimate });
            await tx.wait();
            toast.success(`Withdrawn ${withdrawAmount} BNB`);
            setWithdrawAmount('0');
            initializeContract(); // Refresh data
        } catch (error) {
            console.error('Withdraw error:', error);
            toast.error(`Withdraw failed: ${(error as Error).message}`);
        }
    };

    const handleDeposit = async () => {
        if (!signer || !isOwner) return;

        try {
const contract = new ethers.Contract(contractAddress, SLOTS_V9_ABI, signer);

            const value = ethers.parseEther(depositAmount);

            // Estimate gas and add buffer for deposit operations
            let gasEstimate: bigint;
            try {
                gasEstimate = await contract.getFunction('deposit').estimateGas({ value });
                gasEstimate = (gasEstimate * 120n) / 100n; // Add 20% buffer
            } catch (error) {
                console.warn('⚠️ Gas estimation failed, using fallback:', error);
                gasEstimate = BigInt(100000); // Fallback for admin functions
            }

            const tx = await contract.deposit({ value, gasLimit: gasEstimate });
            await tx.wait();
            toast.success(`Deposited ${depositAmount} BNB`);
            setDepositAmount('0');
            initializeContract(); // Refresh data
        } catch (error) {
            console.error('Deposit error:', error);
            toast.error(`Deposit failed: ${(error as Error).message}`);
        }
    };

    const handleSetMinBet = async () => {
        if (!signer || !isOwner) return;

        try {
const contract = new ethers.Contract(contractAddress, SLOTS_V9_ABI, signer);

            // Estimate gas and add buffer for admin operations
            let gasEstimate: bigint;
            try {
                gasEstimate = await contract.getFunction('setMinBet').estimateGas(ethers.parseEther(minBetAmount));
                gasEstimate = (gasEstimate * 120n) / 100n; // Add 20% buffer
            } catch (error) {
                console.warn('⚠️ Gas estimation failed, using fallback:', error);
                gasEstimate = BigInt(100000); // Fallback for admin functions
            }

            const tx = await contract.setMinBet(ethers.parseEther(minBetAmount), { gasLimit: gasEstimate });
            await tx.wait();
            toast.success(`✅ Minimum bet updated to ${minBetAmount} BNB`);
            initializeContract(); // Refresh data
        } catch (error) {
            console.error('SetMinBet error:', error);
            toast.error(`Failed to set minimum bet: ${(error as Error).message}`);
        }
    };

    const handleClearChat = async () => {
        if (!isOwner) return;

        // Confirmation dialog
        if (!window.confirm('Are you sure you want to clear all chat messages? This action cannot be undone.')) {
            return;
        }

        try {
// Get server URL (use current domain or fallback)
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3000'
                : window.location.origin;

            const response = await fetch(`${serverUrl}/api/admin/chat/clear`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    adminAddress: account
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`✅ ${data.message}`);
            } else {
                toast.error(`❌ ${data.error || 'Failed to clear chat'}`);
            }
        } catch (error) {
            console.error('Clear chat error:', error);
            toast.error(`Failed to clear chat: ${(error as Error).message}`);
        }
    };

    // XP Rewards functions
    const handleLoadUserXP = async () => {
        if (!xpWalletAddress) {
            toast.error('Please enter a wallet address');
            return;
        }

        setLoadingXpUser(true);
        try {
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            const response = await fetch(`${serverUrl}/api/xp-rewards/admin/user/${xpWalletAddress}?adminAddress=${account}`);
            const data = await response.json();

            if (response.ok) {
                setXpUserData(data);
                toast.success(`Loaded XP data for ${xpWalletAddress.slice(0, 6)}...${xpWalletAddress.slice(-4)}`);
            } else {
                toast.error(data.error || 'Failed to load user XP');
            }
        } catch (error) {
            console.error('Error loading user XP:', error);
            toast.error('Failed to load user XP data');
        } finally {
            setLoadingXpUser(false);
        }
    };

    const handleAddXP = async () => {
        if (!xpWalletAddress || !xpAmount || parseFloat(xpAmount) <= 0) {
            toast.error('Please enter a valid wallet address and XP amount');
            return;
        }

        if (!xpReason.trim()) {
            toast.error('Please enter a reason for adding XP');
            return;
        }

        try {
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            const response = await fetch(`${serverUrl}/api/xp-rewards/admin/add-xp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    adminAddress: account,
                    walletAddress: xpWalletAddress,
                    xpAmount: parseInt(xpAmount),
                    reason: xpReason
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`✅ Added ${xpAmount} XP to ${xpWalletAddress.slice(0, 6)}...${xpWalletAddress.slice(-4)}`);
                setXpAmount('');
                setXpReason('');
                // Reload user data
                await handleLoadUserXP();
            } else {
                toast.error(data.error || 'Failed to add XP');
            }
        } catch (error) {
            console.error('Error adding XP:', error);
            toast.error('Failed to add XP');
        }
    };

    // Dev Mint function
    const handleDevMint = async () => {
        if (!signer || !isOwner) return;

        if (!devMintAddress || !ethers.isAddress(devMintAddress)) {
            toast.error('Please enter a valid wallet address');
            return;
        }

        setDevMinting(true);
        try {
            const characterContractAddress = getContractAddress(currentChainId || 56, 'character');
            if (!characterContractAddress) {
                toast.error('Character contract address not configured');
                return;
            }

            const characterContract = new ethers.Contract(
                characterContractAddress,
                CHARACTER_CONTRACT_ABI,
                signer
            );

            // Call devMint function
            const tx = await characterContract.devMint(
                devMintAddress,
                devMintArchetype,
                devMintName || ARCHETYPES[devMintArchetype].name
            );

            toast.info('Transaction submitted, waiting for confirmation...');
            await tx.wait();

            toast.success(`Character minted to ${devMintAddress.slice(0, 6)}...${devMintAddress.slice(-4)}`);
            setDevMintAddress('');
            setDevMintName('');
        } catch (error: any) {
            console.error('Dev mint error:', error);
            if (error.reason) {
                toast.error(`Mint failed: ${error.reason}`);
            } else if (error.message?.includes('OwnableUnauthorizedAccount')) {
                toast.error('Not authorized - only contract owner can dev mint');
            } else {
                toast.error(`Mint failed: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setDevMinting(false);
        }
    };

    // CLZD Settings functions (V4.1)
    const loadClzdSettings = async () => {
        if (!provider || !isOwner) return;

        setClzdLoading(true);
        try {
            const goldContractAddress = getContractAddress(currentChainId || 56, 'gold');
            if (!goldContractAddress) {
                toast.error('Gold contract address not configured');
                return;
            }

            const goldContract = new ethers.Contract(goldContractAddress, GOLD_CONTRACT_ABI, provider);

            // Load current settings from contract (V4.1 - numerator/denominator)
            const [rateData, treasury] = await Promise.all([
                goldContract.getClzdRate().catch(() => [BigInt(5), BigInt(1000)]),
                goldContract.clzdTreasury().catch(() => '0x0000000000000000000000000000000000000000'),
            ]);

            setClzdRateNumerator(rateData[0].toString());
            setClzdRateDenominator(rateData[1].toString());
            setClzdTreasury(treasury);

            // Load current CLZD price from API
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;
            const priceRes = await fetch(`${serverUrl}/api/legend/clzd/price`);
            const priceData = await priceRes.json();
            if (priceData.success) {
                setClzdCurrentPrice(priceData.priceUsd);
            }

            toast.success('CLZD settings loaded');
        } catch (error: any) {
            console.error('Error loading CLZD settings:', error);
            toast.error('Failed to load CLZD settings');
        } finally {
            setClzdLoading(false);
        }
    };

    // V4.1: Save CLZD rate with numerator/denominator
    const saveClzdRate = async () => {
        if (!signer || !isOwner) return;

        setClzdSaving(true);
        try {
            const goldContractAddress = getContractAddress(currentChainId || 56, 'gold');
            if (!goldContractAddress) {
                toast.error('Gold contract address not configured');
                return;
            }

            const numerator = BigInt(clzdRateNumerator || '0');
            const denominator = BigInt(clzdRateDenominator || '1');

            if (denominator === 0n) {
                toast.error('Denominator cannot be zero');
                return;
            }

            const goldContract = new ethers.Contract(goldContractAddress, GOLD_CONTRACT_ABI, signer);
            const tx = await goldContract.setClzdRate(numerator, denominator);
            toast.info('Transaction submitted...');
            await tx.wait();
            const effectiveRate = Number(numerator) / Number(denominator);
            const goldPer1M = 1000000 * effectiveRate;
            toast.success(`CLZD rate set: ${numerator}/${denominator} = ${goldPer1M.toLocaleString()} gold per 1M CLZD`);
        } catch (error: any) {
            console.error('Error saving CLZD multiplier:', error);
            toast.error(`Failed to save: ${error.reason || error.message}`);
        } finally {
            setClzdSaving(false);
        }
    };

    const saveStakingTiers = async () => {
        if (!signer || !isOwner) return;

        setClzdSaving(true);
        try {
            const goldContractAddress = getContractAddress(currentChainId || 56, 'gold');
            if (!goldContractAddress) {
                toast.error('Gold contract address not configured');
                return;
            }

            const goldContract = new ethers.Contract(goldContractAddress, GOLD_CONTRACT_ABI, signer);
            const thresholds = stakingTiers.map(t => ethers.parseEther(t.threshold));
            const goldBonuses = stakingTiers.map(t => BigInt(t.goldBonus));
            const xpBonuses = stakingTiers.map(t => BigInt(t.xpBonus));

            const tx = await goldContract.setStakingTiers(thresholds, goldBonuses, xpBonuses);
            toast.info('Transaction submitted...');
            await tx.wait();
            toast.success('Staking tiers updated!');
        } catch (error: any) {
            console.error('Error saving staking tiers:', error);
            toast.error(`Failed to save: ${error.reason || error.message}`);
        } finally {
            setClzdSaving(false);
        }
    };

    // ============================================
    // PREDICTION MARKET FUNCTIONS
    // ============================================

    const loadPredictionMarkets = async () => {
        setLoadingPredictions(true);
        try {
            const response = await fetch('/api/predictions/markets?pageSize=50');
            const data = await response.json();
            setPredictionMarkets(data.markets || []);
        } catch (error) {
            console.error('Error loading prediction markets:', error);
            toast.error('Failed to load prediction markets');
        } finally {
            setLoadingPredictions(false);
        }
    };

    const createPredictionMarket = async () => {
        if (!newMarket.question || newMarket.outcomes.filter(o => o.trim()).length < 2) {
            toast.error('Please fill in the question and at least 2 outcomes');
            return;
        }

        setCreatingMarket(true);
        try {
            const response = await fetch('/api/predictions/markets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: newMarket.question,
                    outcomes: newMarket.outcomes.filter(o => o.trim()),
                    bettingDurationSeconds: newMarket.bettingDurationHours * 3600,
                    resolutionDelaySeconds: newMarket.resolutionDelayHours * 3600,
                    marketType: newMarket.marketType,
                    featured: newMarket.featured,
                    tags: newMarket.tags.split(',').map(t => t.trim()).filter(t => t),
                    walletAddress: account // Use connected wallet for authorization
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                toast.success(`Market created: ${data.market.marketId}`);
                setNewMarket({
                    question: '',
                    outcomes: ['', ''],
                    bettingDurationHours: 24,
                    resolutionDelayHours: 1,
                    marketType: 'COMMUNITY',
                    featured: false,
                    tags: ''
                });
                loadPredictionMarkets();
            } else {
                toast.error(data.error || 'Failed to create market');
            }
        } catch (error) {
            console.error('Error creating market:', error);
            toast.error('Failed to create market');
        } finally {
            setCreatingMarket(false);
        }
    };

    const resolvePredictionMarket = async (marketId: number, winningOutcome: number) => {
        setResolvingMarket(marketId);
        try {
            const response = await fetch(`/api/predictions/resolve/${marketId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    winningOutcome,
                    walletAddress: account // Use connected wallet for authorization
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                toast.success(`Market resolved! Winner: ${data.winningOutcomeName}`);
                loadPredictionMarkets();
            } else {
                toast.error(data.error || 'Failed to resolve market');
            }
        } catch (error) {
            console.error('Error resolving market:', error);
            toast.error('Failed to resolve market');
        } finally {
            setResolvingMarket(null);
        }
    };

    const cancelPredictionMarket = async (marketId: number, reason: string) => {
        try {
            const response = await fetch(`/api/predictions/cancel/${marketId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason,
                    walletAddress: account // Use connected wallet for authorization
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                toast.success(`Market cancelled. Refunded ${data.refundedBets} bets (${data.totalRefunded} gold)`);
                loadPredictionMarkets();
            } else {
                toast.error(data.error || 'Failed to cancel market');
            }
        } catch (error) {
            console.error('Error cancelling market:', error);
            toast.error('Failed to cancel market');
        }
    };

    // Load prediction markets when tab is selected
    useEffect(() => {
        if (activeTab === 'predictions' && isOwner) {
            loadPredictionMarkets();
        }
    }, [activeTab, isOwner]);

    const saveDiscountTiers = async () => {
        if (!signer || !isOwner) return;

        setClzdSaving(true);
        try {
            const goldContractAddress = getContractAddress(currentChainId || 56, 'gold');
            if (!goldContractAddress) {
                toast.error('Gold contract address not configured');
                return;
            }

            const goldContract = new ethers.Contract(goldContractAddress, GOLD_CONTRACT_ABI, signer);
            const thresholds = discountTiers.map(t => ethers.parseEther(t.threshold));
            const bnbDiscounts = discountTiers.map(t => BigInt(t.bnbDiscount));
            const clzdDiscounts = discountTiers.map(t => BigInt(t.clzdDiscount));

            const tx = await goldContract.setDiscountTiers(thresholds, bnbDiscounts, clzdDiscounts);
            toast.info('Transaction submitted...');
            await tx.wait();
            toast.success('Discount tiers updated!');
        } catch (error: any) {
            console.error('Error saving discount tiers:', error);
            toast.error(`Failed to save: ${error.reason || error.message}`);
        } finally {
            setClzdSaving(false);
        }
    };

    // Load CLZD settings when tab is activated
    useEffect(() => {
        if (activeTab === 'clzd-settings' && isOwner) {
            loadClzdSettings();
        }
    }, [activeTab, isOwner]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading Admin Panel...</div>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
                <div className="text-white text-xl">Access Denied - Admin Only</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/50 backdrop-blur-sm rounded-2xl p-8 border border-[#FFD700]/30"
                >
                    <h1 className="text-3xl font-bold text-[#FFD700] mb-8 text-center">Admin Panel</h1>

                    {/* Tab Navigation */}
                    <div className="flex justify-center mb-8">
                        <div className="flex bg-gray-700 rounded-lg p-1 overflow-x-auto">
                            {[
                                { id: 'status', label: 'Contract Status', icon: '📋' },
                                { id: 'dev-mint', label: 'Dev Mint', icon: '🎁' },
                                { id: 'xp-rewards', label: 'XP & Rewards', icon: '🏆' },
                                { id: 'submissions', label: 'Bug & Features', icon: '🐛' },
                                { id: 'overview', label: 'Overview', icon: '📊' },
                                { id: 'contracts', label: 'Contracts', icon: '⚙️' },
                                { id: 'testing', label: 'Testing', icon: '🧪' },
                                { id: 'gas', label: 'Gas Report', icon: '⛽' },
                                { id: 'security', label: 'Security', icon: '🔒' },
                                { id: 'clzd-settings', label: 'CLZD Token', icon: '🦎' },
                                { id: 'predictions', label: 'Predictions', icon: '🔮' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-[#FFD700] text-gray-900'
                                        : 'text-gray-300 hover:text-white hover:bg-gray-600'
                                        }`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Telegram Integration Button */}
                    <div className="flex justify-center mb-6">
                        <button
                            onClick={() => setShowTelegramIntegration(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2"
                        >
                            🤖 Telegram Integration
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'status' && (
                        <ContractStatusChecker />
                    )}

                    {/* Dev Mint Tab */}
                    {activeTab === 'dev-mint' && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-6 rounded-xl border border-purple-500/50">
                                <h3 className="text-2xl font-bold text-purple-400 mb-4">Free Character Mint (Owner Only)</h3>
                                <p className="text-gray-300 mb-4">
                                    Mint characters for free to any wallet address. Use for giveaways, team members, or promotional events.
                                </p>
                            </div>

                            <div className="bg-black/50 p-6 rounded-xl border border-[#FFD700]/30">
                                {/* Recipient Address */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Recipient Wallet Address</label>
                                    <input
                                        type="text"
                                        value={devMintAddress}
                                        onChange={e => setDevMintAddress(e.target.value)}
                                        placeholder="0x..."
                                        className="w-full bg-gray-700 px-4 py-3 rounded-lg text-white placeholder-gray-400 border border-gray-600 focus:border-[#FFD700] focus:outline-none"
                                    />
                                </div>

                                {/* Archetype Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Select Character Archetype</label>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {ARCHETYPES.map((archetype) => (
                                            <button
                                                key={archetype.id}
                                                onClick={() => setDevMintArchetype(archetype.id)}
                                                className={`p-3 rounded-lg border-2 transition-all ${
                                                    devMintArchetype === archetype.id
                                                        ? 'border-[#FFD700] bg-[#FFD700]/20'
                                                        : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                                                }`}
                                            >
                                                <div className="text-sm font-bold text-white truncate">{archetype.name}</div>
                                                <div className={`text-xs mt-1 ${
                                                    archetype.rarity === 'Legendary' ? 'text-yellow-400' :
                                                    archetype.rarity === 'Epic' ? 'text-purple-400' :
                                                    archetype.rarity === 'Rare' ? 'text-blue-400' :
                                                    archetype.rarity === 'Uncommon' ? 'text-green-400' :
                                                    'text-gray-400'
                                                }`}>
                                                    {archetype.rarity}
                                                </div>
                                                <div className="text-xs text-gray-500">(Normally {archetype.price})</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Name */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Custom Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={devMintName}
                                        onChange={e => setDevMintName(e.target.value)}
                                        placeholder={ARCHETYPES[devMintArchetype]?.name || 'Leave blank for default'}
                                        className="w-full bg-gray-700 px-4 py-3 rounded-lg text-white placeholder-gray-400 border border-gray-600 focus:border-[#FFD700] focus:outline-none"
                                    />
                                </div>

                                {/* Mint Button */}
                                <motion.button
                                    onClick={handleDevMint}
                                    disabled={devMinting || !devMintAddress}
                                    className="w-full bg-gradient-to-r from-[#FFD700] to-yellow-500 text-black px-6 py-4 rounded-lg font-bold text-lg hover:from-yellow-500 hover:to-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {devMinting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                            </svg>
                                            Minting...
                                        </span>
                                    ) : (
                                        `Mint ${ARCHETYPES[devMintArchetype]?.name || 'Character'} for FREE`
                                    )}
                                </motion.button>

                                <p className="text-sm text-gray-400 mt-4 text-center">
                                    This function is only available to the contract owner. Gas fees still apply.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <>
                            {/* Stats Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-teal-900/30 p-6 rounded-xl backdrop-blur-sm border border-teal-500/20">
                                    <p className="text-gray-400 text-sm font-medium mb-2">CONTRACT BALANCE</p>
                                    <p className="font-bold text-teal-400 text-2xl">{parseFloat(contractBalance).toFixed(4)} BNB</p>
                                </div>
                                <div className="bg-[#00AA55]/30 p-6 rounded-xl backdrop-blur-sm border border-[#00FF88]/20">
                                    <p className="text-gray-400 text-sm font-medium mb-2">AVAILABLE PROFITS</p>
                                    <p className="font-bold text-green-400 text-2xl">{parseFloat(profits).toFixed(4)} BNB</p>
                                </div>
                                <div className="bg-yellow-900/30 p-6 rounded-xl backdrop-blur-sm border border-yellow-500/20">
                                    <p className="text-gray-400 text-sm font-medium mb-2">MINIMUM BET</p>
                                    <p className="font-bold text-yellow-400 text-2xl">{parseFloat(currentMinBet).toFixed(4)} BNB</p>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-yellow-900/50 to-amber-800/50 p-6 rounded-xl border border-yellow-500/30 backdrop-blur-sm">
                                    <h3 className="text-xl font-bold text-yellow-400 mb-4">Set Minimum Bet</h3>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="number"
                                            min="0.001"
                                            max="10"
                                            step="0.001"
                                            value={minBetAmount}
                                            onChange={e => setMinBetAmount(e.target.value)}
                                            className="bg-black/50 px-4 py-3 rounded-lg text-white placeholder-gray-400 border border-yellow-500/30 w-48"
                                            placeholder="Minimum bet in BNB"
                                        />
                                        <motion.button
                                            onClick={handleSetMinBet}
                                            disabled={!minBetAmount || parseFloat(minBetAmount) <= 0}
                                            className="bg-yellow-600 px-6 py-3 rounded-lg font-bold hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Update Min Bet
                                        </motion.button>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2">
                                        Current: {parseFloat(currentMinBet).toFixed(4)} BNB → New: {minBetAmount} BNB
                                    </p>
                                </div>
                                <div className="bg-gradient-to-r from-green-900/50 to-emerald-800/50 p-6 rounded-xl border border-[#00FF88]/30 backdrop-blur-sm">
                                    <h3 className="text-xl font-bold text-green-400 mb-4">Deposit Funds</h3>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={depositAmount}
                                            onChange={e => setDepositAmount(e.target.value)}
                                            className="bg-black/50 px-4 py-3 rounded-lg text-white placeholder-gray-400 border border-[#00FF88]/30 w-48"
                                            placeholder="Amount in BNB"
                                        />
                                        <motion.button
                                            onClick={handleDeposit}
                                            disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                                            className="bg-[#00DD77] px-6 py-3 rounded-lg font-bold hover:bg-[#00BB66] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Deposit
                                        </motion.button>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-teal-900/50 to-cyan-800/50 p-6 rounded-xl border border-teal-500/30 backdrop-blur-sm">
                                    <h3 className="text-xl font-bold text-teal-400 mb-4">Withdraw Profits</h3>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="number"
                                            min="0"
                                            max={profits}
                                            step="0.1"
                                            value={withdrawAmount}
                                            onChange={e => setWithdrawAmount(e.target.value)}
                                            className="bg-black/50 px-4 py-3 rounded-lg text-white placeholder-gray-400 border border-teal-500/30 w-48"
                                            placeholder="Amount in BNB"
                                        />
                                        <motion.button
                                            onClick={handleWithdraw}
                                            disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(profits)}
                                            className="bg-teal-600 px-6 py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Withdraw
                                        </motion.button>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2">
                                        Maximum withdrawable: {parseFloat(profits).toFixed(4)} BNB (jackpot preserved)
                                    </p>
                                </div>

                                <div className="bg-gradient-to-r from-red-900/50 to-pink-800/50 p-6 rounded-xl border border-red-500/30 backdrop-blur-sm">
                                    <h3 className="text-xl font-bold text-red-400 mb-4">Clear Chat Messages</h3>
                                    <div className="flex items-center space-x-4">
                                        <motion.button
                                            onClick={handleClearChat}
                                            className="bg-red-600 px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            🧹 Clear All Chat Messages
                                        </motion.button>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2">
                                        ⚠️ This will permanently delete all chat messages for all users
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'contracts' && (
                        <ContractManagement isOwner={isOwner} />
                    )}

                    {activeTab === 'testing' && (
                        <div className="space-y-6">
                            <div className="bg-blue-900/30 p-6 rounded-xl backdrop-blur-sm border border-blue-500/30">
                                <h3 className="text-xl font-bold text-blue-400 mb-4">Contract Testing Suite</h3>
                                <p className="text-gray-300 mb-4">
                                    Run comprehensive tests to ensure your smart contract is functioning correctly before deployment.
                                </p>
                                <motion.button
                                    onClick={runContractTests}
                                    disabled={runningTests}
                                    className="bg-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {runningTests ? '🧪 Running Tests...' : '🧪 Run Contract Tests'}
                                </motion.button>
                            </div>

                            {testResults.length > 0 && (
                                <div className="bg-gray-700/50 p-6 rounded-xl backdrop-blur-sm border border-gray-500/30">
                                    <h4 className="text-lg font-bold text-white mb-4">Test Results</h4>
                                    <div className="space-y-3">
                                        {testResults.map((result, index) => (
                                            <div key={index} className={`p-3 rounded-lg border ${result.status === 'passed'
                                                ? 'bg-[#00AA55]/30 border-[#00FF88]/30'
                                                : 'bg-red-900/30 border-red-500/30'
                                                }`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{result.name}</span>
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${result.status === 'passed' ? 'bg-[#00DD77]' : 'bg-red-600'
                                                        }`}>
                                                        {result.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                {result.message && (
                                                    <p className="text-sm text-gray-300 mt-2">{result.message}</p>
                                                )}
                                                {result.error && (
                                                    <p className="text-sm text-red-400 mt-2">{result.error}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'gas' && gasReport && (
                        <div className="space-y-6">
                            <div className="bg-orange-900/30 p-6 rounded-xl backdrop-blur-sm border border-orange-500/30">
                                <h3 className="text-xl font-bold text-orange-400 mb-4">Gas Usage Report</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-700/50 p-4 rounded-lg">
                                        <h5 className="font-bold text-white mb-2">Deployment</h5>
                                        <p className="text-sm text-gray-300">Gas Used: {gasReport.deployment.gasUsed.toLocaleString()}</p>
                                        <p className="text-sm text-gray-300">Cost: {gasReport.deployment.cost}</p>
                                    </div>
                                    <div className="bg-gray-700/50 p-4 rounded-lg">
                                        <h5 className="font-bold text-white mb-2">Average Transaction</h5>
                                        <p className="text-sm text-gray-300">Spin Request: {gasReport.functions.requestSpin.gasUsed.toLocaleString()} gas</p>
                                        <p className="text-sm text-gray-300">Cost: {gasReport.functions.requestSpin.cost}</p>
                                    </div>
                                </div>
                                <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-500/30">
                                    <h5 className="font-bold text-yellow-400 mb-2">Optimization Recommendations</h5>
                                    <ul className="text-sm text-gray-300 space-y-1">
                                        {gasReport.recommendations.map((rec: string, index: number) => (
                                            <li key={index}>• {rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && securityAudit && (
                        <div className="space-y-6">
                            <div className="bg-red-900/30 p-6 rounded-xl backdrop-blur-sm border border-red-500/30">
                                <h3 className="text-xl font-bold text-red-400 mb-4">Security Audit Report</h3>
                                <div className="text-center mb-6">
                                    <div className="text-4xl font-bold text-white mb-2">{securityAudit.score}</div>
                                    <p className="text-gray-300">Security Score</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gray-700/50 p-4 rounded-lg">
                                        <h5 className="font-bold text-white mb-3">Known Issues</h5>
                                        {securityAudit.issues.map((issue: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-600 last:border-b-0">
                                                <div>
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${issue.severity === 'Low' ? 'bg-yellow-600' :
                                                        issue.severity === 'Medium' ? 'bg-orange-600' : 'bg-red-600'
                                                        }`}>
                                                        {issue.severity}
                                                    </span>
                                                    <span className="text-gray-300 ml-2">{issue.description}</span>
                                                </div>
                                                <span className={`text-xs font-bold ${issue.status === 'Fixed' ? 'text-green-400' :
                                                    issue.status === 'Mitigated' ? 'text-yellow-400' : 'text-red-400'
                                                    }`}>
                                                    {issue.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-[#00AA55]/30 p-4 rounded-lg border border-[#00FF88]/30">
                                        <h5 className="font-bold text-green-400 mb-3">Security Recommendations</h5>
                                        <ul className="text-sm text-gray-300 space-y-1">
                                            {securityAudit.recommendations.map((rec: string, index: number) => (
                                                <li key={index}>• {rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* XP & Rewards Management */}
                    {activeTab === 'xp-rewards' && (
                        <div className="space-y-6">
                            {/* Testnet Tournament Info */}
                            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-6 rounded-xl border border-purple-500/50">
                                <h3 className="text-2xl font-bold text-purple-400 mb-4">🏆 Testnet Tournament: 2.5M $CLZD Prize Pool</h3>
                                <div className="text-gray-300 space-y-2">
                                    <p>💰 <strong>Total Prize Pool:</strong> 2,500,000 $CLZD</p>
                                    <p>🎯 <strong>Top Prize:</strong> 1,000,000 $CLZD for #1</p>
                                    <p>📊 <strong>XP Formula:</strong> Total XP = Gold Balance + Manual XP</p>
                                    <p>🎁 <strong>Manual XP Sources:</strong> Telegram raidar scores, bug bounties, implemented features</p>
                                    <p>🏅 <strong>Top 10 Players:</strong> Receive rewards distributed among 2.5M $CLZD</p>
                                </div>
                            </div>

                            {/* Add XP to User */}
                            <div className="bg-gradient-to-r from-green-900/50 to-emerald-800/50 p-6 rounded-xl border border-[#00FF88]/30 backdrop-blur-sm">
                                <h3 className="text-xl font-bold text-green-400 mb-4">Add Manual XP to User</h3>

                                {/* Wallet Address Input */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Wallet Address</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={xpWalletAddress}
                                            onChange={e => setXpWalletAddress(e.target.value)}
                                            placeholder="0x..."
                                            className="flex-1 bg-black/50 px-4 py-3 rounded-lg text-white placeholder-gray-400 border border-[#00FF88]/30"
                                        />
                                        <motion.button
                                            onClick={handleLoadUserXP}
                                            disabled={!xpWalletAddress || loadingXpUser}
                                            className="bg-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {loadingXpUser ? '⏳ Loading...' : '🔍 Load User'}
                                        </motion.button>
                                    </div>
                                </div>

                                {/* User XP Data Display */}
                                {xpUserData && (
                                    <div className="mb-4 bg-black/50 p-4 rounded-lg border border-[#00FF88]/20">
                                        <h4 className="font-bold text-white mb-3">Current XP Data</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-400">Username</p>
                                                <p className="text-white font-bold">{xpUserData.username || 'Not set'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Gold Balance</p>
                                                <p className="text-yellow-400 font-bold">{xpUserData.goldBalance.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Manual XP</p>
                                                <p className="text-purple-400 font-bold">{xpUserData.manualXP.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Total XP</p>
                                                <p className="text-green-400 font-bold text-lg">{xpUserData.totalXP.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* XP History */}
                                        {xpUserData.xpHistory && xpUserData.xpHistory.length > 0 && (
                                            <div className="mt-4">
                                                <h5 className="font-bold text-gray-300 mb-2">XP History</h5>
                                                <div className="max-h-40 overflow-y-auto space-y-2">
                                                    {xpUserData.xpHistory.map((entry: any, idx: number) => (
                                                        <div key={idx} className="text-xs bg-gray-700/30 p-2 rounded">
                                                            <div className="flex justify-between">
                                                                <span className="text-green-400 font-bold">+{entry.amount} XP</span>
                                                                <span className="text-gray-400">{new Date(entry.timestamp).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-gray-300 mt-1">{entry.reason}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* XP Amount Input */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">XP Amount to Add</label>
                                    <input
                                        type="number"
                                        value={xpAmount}
                                        onChange={e => setXpAmount(e.target.value)}
                                        placeholder="Enter XP amount"
                                        min="0"
                                        step="100"
                                        className="w-full bg-black/50 px-4 py-3 rounded-lg text-white placeholder-gray-400 border border-[#00FF88]/30"
                                    />
                                </div>

                                {/* Reason Input */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
                                    <select
                                        value={xpReason}
                                        onChange={e => setXpReason(e.target.value)}
                                        className="w-full bg-black/50 px-4 py-3 rounded-lg text-white border border-[#00FF88]/30"
                                    >
                                        <option value="">Select reason...</option>
                                        <option value="Telegram Raidar Score">Telegram Raidar Score</option>
                                        <option value="Bug Bounty">Bug Bounty</option>
                                        <option value="Feature Implementation">Feature Implementation</option>
                                        <option value="Community Contribution">Community Contribution</option>
                                        <option value="Other">Other (Custom)</option>
                                    </select>
                                    {xpReason === 'Other' && (
                                        <input
                                            type="text"
                                            placeholder="Enter custom reason..."
                                            onChange={e => setXpReason(e.target.value)}
                                            className="w-full mt-2 bg-black/50 px-4 py-3 rounded-lg text-white placeholder-gray-400 border border-[#00FF88]/30"
                                        />
                                    )}
                                </div>

                                <motion.button
                                    onClick={handleAddXP}
                                    disabled={!xpWalletAddress || !xpAmount || parseFloat(xpAmount) <= 0 || !xpReason}
                                    className="w-full bg-[#00DD77] px-6 py-3 rounded-lg font-bold hover:bg-[#00BB66] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    ✅ Add XP
                                </motion.button>
                            </div>

                            {/* Prize Distribution Table */}
                            <div className="bg-gradient-to-r from-yellow-900/50 to-amber-800/50 p-6 rounded-xl border border-yellow-500/30 backdrop-blur-sm">
                                <h3 className="text-xl font-bold text-yellow-400 mb-4">Prize Distribution Breakdown</h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-sm">
                                    {[
                                        { rank: 1, prize: '1,000,000' },
                                        { rank: 2, prize: '500,000' },
                                        { rank: 3, prize: '300,000' },
                                        { rank: 4, prize: '200,000' },
                                        { rank: 5, prize: '150,000' },
                                        { rank: 6, prize: '125,000' },
                                        { rank: 7, prize: '100,000' },
                                        { rank: 8, prize: '75,000' },
                                        { rank: 9, prize: '35,000' },
                                        { rank: 10, prize: '15,000' }
                                    ].map((item) => (
                                        <div key={item.rank} className="bg-black/50 p-3 rounded-lg border border-yellow-500/20">
                                            <div className="text-xs text-gray-400 mb-1">#{item.rank}</div>
                                            <div className="text-yellow-400 font-bold">{item.prize}</div>
                                            <div className="text-xs text-gray-400 mt-1">$CLZD</div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-400 mt-4 text-center">
                                    Total: 2,500,000 $CLZD distributed among top 10 XP earners
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Bug Bounties & Feature Requests Management */}
                    {activeTab === 'submissions' && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-6 rounded-xl border border-purple-500/50">
                                <h3 className="text-2xl font-bold text-purple-400 mb-4">🐛 Bug Bounties & Feature Requests</h3>
                                <p className="text-gray-300">
                                    Review and manage user submissions. Award XP for valuable contributions!
                                </p>
                            </div>

                            {/* Filters */}
                            <div className="bg-black/50 p-4 rounded-xl border border-purple-500/30">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-2">Filter by Type</label>
                                        <select
                                            value={submissionsFilter.type}
                                            onChange={(e) => setSubmissionsFilter({ ...submissionsFilter, type: e.target.value })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                                        >
                                            <option value="">All Types</option>
                                            <option value="bug">🐛 Bug Reports</option>
                                            <option value="feature">💡 Feature Requests</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-2">Filter by Status</label>
                                        <select
                                            value={submissionsFilter.status}
                                            onChange={(e) => setSubmissionsFilter({ ...submissionsFilter, status: e.target.value })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="pending">⏳ Pending</option>
                                            <option value="reviewing">👀 Reviewing</option>
                                            <option value="approved">✅ Approved</option>
                                            <option value="completed">🎉 Completed</option>
                                            <option value="rejected">❌ Rejected</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            onClick={loadSubmissions}
                                            className="w-full bg-[#FFD700] hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold transition-all"
                                        >
                                            🔄 Refresh
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Submissions List */}
                            <div className="bg-black/50 p-6 rounded-xl border border-purple-500/30">
                                <h4 className="text-xl font-bold text-[#FFD700] mb-4">
                                    📋 Submissions ({submissions.length})
                                </h4>

                                {loadingSubmissions ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto mb-4"></div>
                                        <p className="text-gray-400">Loading submissions...</p>
                                    </div>
                                ) : submissions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-4xl mb-4">📭</p>
                                        <p className="text-gray-400 text-lg">No submissions found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {submissions.map((submission) => (
                                            <div
                                                key={submission._id}
                                                className={`bg-black/50 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                                                    selectedSubmission?._id === submission._id
                                                        ? 'border-[#FFD700]'
                                                        : 'border-gray-700 hover:border-purple-500'
                                                }`}
                                                onClick={() => setSelectedSubmission(
                                                    selectedSubmission?._id === submission._id ? null : submission
                                                )}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-2xl">{submission.type === 'bug' ? '🐛' : '💡'}</span>
                                                            <h5 className="text-white font-bold text-lg">{submission.title}</h5>
                                                        </div>
                                                        <p className="text-gray-400 text-sm">
                                                            From: {submission.walletAddress.slice(0, 6)}...{submission.walletAddress.slice(-4)}
                                                        </p>
                                                        <p className="text-gray-500 text-xs mt-1">
                                                            {new Date(submission.submittedAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {submission.xpAwarded > 0 && (
                                                            <span className="bg-[#FFD700] text-black px-3 py-1 rounded-full font-bold text-sm">
                                                                ⭐ {submission.xpAwarded} XP
                                                            </span>
                                                        )}
                                                        <span className={`px-3 py-1 rounded-full font-bold text-sm ${
                                                            submission.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-500' :
                                                            submission.status === 'reviewing' ? 'bg-blue-900/50 text-blue-400 border border-blue-500' :
                                                            submission.status === 'approved' ? 'bg-[#00AA55]/50 text-green-400 border border-[#00FF88]' :
                                                            submission.status === 'completed' ? 'bg-[#FFD700] text-black' :
                                                            'bg-red-900/50 text-red-400 border border-red-500'
                                                        }`}>
                                                            {submission.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Expanded View */}
                                                {selectedSubmission?._id === submission._id && (
                                                    <div className="mt-4 pt-4 border-t border-gray-700">
                                                        <p className="text-gray-300 whitespace-pre-wrap mb-4">{submission.description}</p>

                                                        {/* Screenshots */}
                                                        {submission.screenshots && submission.screenshots.length > 0 && (
                                                            <div className="mb-4">
                                                                <p className="text-[#FFD700] font-bold mb-2">📸 Screenshots:</p>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                                    {submission.screenshots.map((screenshot: string, idx: number) => (
                                                                        <a
                                                                            key={idx}
                                                                            href={screenshot}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="border-2 border-gray-700 hover:border-[#FFD700] transition-all"
                                                                        >
                                                                            <img
                                                                                src={screenshot}
                                                                                alt={`Screenshot ${idx + 1}`}
                                                                                className="w-full h-32 object-cover"
                                                                            />
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {editingSubmission?._id === submission._id ? (
                                                            <div className="space-y-4 bg-black/70 p-4 rounded-lg border border-purple-500/50">
                                                                <div>
                                                                    <label className="block text-sm text-gray-300 mb-2">Status</label>
                                                                    <select
                                                                        value={editingSubmission.status}
                                                                        onChange={(e) => setEditingSubmission({ ...editingSubmission, status: e.target.value })}
                                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                                                                    >
                                                                        <option value="pending">⏳ Pending</option>
                                                                        <option value="reviewing">👀 Reviewing</option>
                                                                        <option value="approved">✅ Approved</option>
                                                                        <option value="completed">🎉 Completed</option>
                                                                        <option value="rejected">❌ Rejected</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm text-gray-300 mb-2">Admin Reply</label>
                                                                    <textarea
                                                                        value={editingSubmission.adminReply || ''}
                                                                        onChange={(e) => setEditingSubmission({ ...editingSubmission, adminReply: e.target.value })}
                                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white resize-none"
                                                                        rows={4}
                                                                        placeholder="Reply to user..."
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm text-gray-300 mb-2">XP Award</label>
                                                                    <input
                                                                        type="number"
                                                                        value={editingSubmission.xpAwarded || 0}
                                                                        onChange={(e) => setEditingSubmission({ ...editingSubmission, xpAwarded: parseInt(e.target.value) || 0 })}
                                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                                                                        min="0"
                                                                        placeholder="XP to award..."
                                                                    />
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            updateSubmission();
                                                                        }}
                                                                        className="flex-1 bg-[#00DD77] hover:bg-[#00BB66] text-white px-4 py-2 rounded-lg font-bold transition-all"
                                                                    >
                                                                        ✅ Save Changes
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setEditingSubmission(null);
                                                                        }}
                                                                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold transition-all"
                                                                    >
                                                                        ❌ Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingSubmission(submission);
                                                                    }}
                                                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition-all"
                                                                >
                                                                    ✏️ Edit
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        deleteSubmission(submission._id);
                                                                    }}
                                                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-all"
                                                                >
                                                                    🗑️ Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CLZD Token Settings */}
                    {activeTab === 'clzd-settings' && (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 p-6 rounded-xl border border-green-500/50">
                                <h3 className="text-2xl font-bold text-green-400 mb-2">$CLZD Token Integration</h3>
                                <p className="text-gray-300">
                                    Configure CLZD payment rates, staking bonuses, and holder discounts for the gold shop.
                                </p>
                                {clzdCurrentPrice && (
                                    <p className="text-sm text-gray-400 mt-2">
                                        Current CLZD Price: <span className="text-green-400 font-bold">${parseFloat(clzdCurrentPrice).toFixed(8)}</span> (via DexScreener)
                                    </p>
                                )}
                            </div>

                            {/* Loading State */}
                            {clzdLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
                                    <p className="text-gray-400">Loading CLZD settings...</p>
                                </div>
                            ) : (
                                <>
                                    {/* CLZD Rate Configuration (V4.1) */}
                                    <div className="bg-black/50 p-6 rounded-xl border border-green-500/30">
                                        <h4 className="text-xl font-bold text-green-400 mb-4">CLZD to Gold Rate</h4>
                                        <p className="text-gray-400 text-sm mb-4">
                                            Set the exchange rate for CLZD to Gold. Formula: gold = (clzdAmount × numerator) / denominator.
                                            Current rate gives <span className="text-green-400 font-bold">{(1000000 * parseInt(clzdRateNumerator || '0') / parseInt(clzdRateDenominator || '1')).toLocaleString()} gold per 1M CLZD</span>.
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="text-sm text-gray-400 mb-1 block">Numerator</label>
                                                <input
                                                    type="number"
                                                    value={clzdRateNumerator}
                                                    onChange={(e) => setClzdRateNumerator(e.target.value)}
                                                    placeholder="5"
                                                    className="w-full bg-gray-700 px-4 py-3 rounded-lg text-white placeholder-gray-400 border border-green-500/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-400 mb-1 block">Denominator</label>
                                                <input
                                                    type="number"
                                                    value={clzdRateDenominator}
                                                    onChange={(e) => setClzdRateDenominator(e.target.value)}
                                                    placeholder="1000"
                                                    className="w-full bg-gray-700 px-4 py-3 rounded-lg text-white placeholder-gray-400 border border-green-500/30"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-gray-800 p-4 rounded-lg mb-4">
                                            <div className="text-sm text-gray-400 mb-2">Preview:</div>
                                            <div className="text-lg text-white">
                                                Rate: <span className="text-green-400 font-bold">{clzdRateNumerator}/{clzdRateDenominator}</span> = {(parseInt(clzdRateNumerator || '0') / parseInt(clzdRateDenominator || '1')).toFixed(6)} gold/CLZD
                                            </div>
                                            <div className="text-sm text-gray-400 mt-2">
                                                1M CLZD = <span className="text-green-400 font-bold">{(1000000 * parseInt(clzdRateNumerator || '0') / parseInt(clzdRateDenominator || '1')).toLocaleString()} gold</span>
                                            </div>
                                        </div>

                                        <div className="text-xs text-gray-500 mb-4">
                                            <strong>Quick Reference:</strong> To balance with BNB (0.05 BNB = 5,000 gold), set 5/1000 for ~$28 CLZD = 5,000 gold.
                                        </div>

                                        <motion.button
                                            onClick={saveClzdRate}
                                            disabled={clzdSaving}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {clzdSaving ? 'Saving...' : 'Save CLZD Rate'}
                                        </motion.button>
                                    </div>

                                    {/* Staking Tiers */}
                                    <div className="bg-black/50 p-6 rounded-xl border border-purple-500/30">
                                        <h4 className="text-xl font-bold text-purple-400 mb-4">Staking Bonus Tiers</h4>
                                        <p className="text-gray-400 text-sm mb-4">
                                            Configure gold and XP bonuses for players who stake CLZD tokens. Bonuses apply to gold purchases and gameplay.
                                        </p>

                                        <div className="space-y-3">
                                            {stakingTiers.map((tier, idx) => (
                                                <div key={idx} className="grid grid-cols-4 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1">CLZD Staked</label>
                                                        <input
                                                            type="text"
                                                            value={tier.threshold}
                                                            onChange={(e) => {
                                                                const newTiers = [...stakingTiers];
                                                                newTiers[idx].threshold = e.target.value;
                                                                setStakingTiers(newTiers);
                                                            }}
                                                            className="w-full bg-gray-700 px-3 py-2 rounded text-white text-sm border border-purple-500/30"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1">Gold Bonus %</label>
                                                        <input
                                                            type="text"
                                                            value={tier.goldBonus}
                                                            onChange={(e) => {
                                                                const newTiers = [...stakingTiers];
                                                                newTiers[idx].goldBonus = e.target.value;
                                                                setStakingTiers(newTiers);
                                                            }}
                                                            className="w-full bg-gray-700 px-3 py-2 rounded text-white text-sm border border-purple-500/30"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1">XP Bonus %</label>
                                                        <input
                                                            type="text"
                                                            value={tier.xpBonus}
                                                            onChange={(e) => {
                                                                const newTiers = [...stakingTiers];
                                                                newTiers[idx].xpBonus = e.target.value;
                                                                setStakingTiers(newTiers);
                                                            }}
                                                            className="w-full bg-gray-700 px-3 py-2 rounded text-white text-sm border border-purple-500/30"
                                                        />
                                                    </div>
                                                    <div className="flex items-end">
                                                        <button
                                                            onClick={() => {
                                                                const newTiers = stakingTiers.filter((_, i) => i !== idx);
                                                                setStakingTiers(newTiers);
                                                            }}
                                                            className="bg-red-600/50 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={() => setStakingTiers([...stakingTiers, { threshold: '', goldBonus: '', xpBonus: '' }])}
                                                className="bg-purple-600/50 hover:bg-purple-600 text-white px-4 py-2 rounded font-bold"
                                            >
                                                + Add Tier
                                            </button>
                                            <motion.button
                                                onClick={saveStakingTiers}
                                                disabled={clzdSaving}
                                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-bold transition-all disabled:opacity-50"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                {clzdSaving ? 'Saving...' : 'Save Staking Tiers'}
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Holder Discount Tiers */}
                                    <div className="bg-black/50 p-6 rounded-xl border border-blue-500/30">
                                        <h4 className="text-xl font-bold text-blue-400 mb-4">Holder Discount Tiers</h4>
                                        <p className="text-gray-400 text-sm mb-4">
                                            Configure discounts for players who hold CLZD in their wallet. BNB discount applies to BNB purchases, CLZD discount to CLZD purchases.
                                        </p>

                                        <div className="space-y-3">
                                            {discountTiers.map((tier, idx) => (
                                                <div key={idx} className="grid grid-cols-4 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1">CLZD Held</label>
                                                        <input
                                                            type="text"
                                                            value={tier.threshold}
                                                            onChange={(e) => {
                                                                const newTiers = [...discountTiers];
                                                                newTiers[idx].threshold = e.target.value;
                                                                setDiscountTiers(newTiers);
                                                            }}
                                                            className="w-full bg-gray-700 px-3 py-2 rounded text-white text-sm border border-blue-500/30"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1">BNB Discount %</label>
                                                        <input
                                                            type="text"
                                                            value={tier.bnbDiscount}
                                                            onChange={(e) => {
                                                                const newTiers = [...discountTiers];
                                                                newTiers[idx].bnbDiscount = e.target.value;
                                                                setDiscountTiers(newTiers);
                                                            }}
                                                            className="w-full bg-gray-700 px-3 py-2 rounded text-white text-sm border border-blue-500/30"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1">CLZD Discount %</label>
                                                        <input
                                                            type="text"
                                                            value={tier.clzdDiscount}
                                                            onChange={(e) => {
                                                                const newTiers = [...discountTiers];
                                                                newTiers[idx].clzdDiscount = e.target.value;
                                                                setDiscountTiers(newTiers);
                                                            }}
                                                            className="w-full bg-gray-700 px-3 py-2 rounded text-white text-sm border border-blue-500/30"
                                                        />
                                                    </div>
                                                    <div className="flex items-end">
                                                        <button
                                                            onClick={() => {
                                                                const newTiers = discountTiers.filter((_, i) => i !== idx);
                                                                setDiscountTiers(newTiers);
                                                            }}
                                                            className="bg-red-600/50 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={() => setDiscountTiers([...discountTiers, { threshold: '', bnbDiscount: '', clzdDiscount: '' }])}
                                                className="bg-blue-600/50 hover:bg-blue-600 text-white px-4 py-2 rounded font-bold"
                                            >
                                                + Add Tier
                                            </button>
                                            <motion.button
                                                onClick={saveDiscountTiers}
                                                disabled={clzdSaving}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold transition-all disabled:opacity-50"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                {clzdSaving ? 'Saving...' : 'Save Discount Tiers'}
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Treasury Info */}
                                    <div className="bg-black/50 p-6 rounded-xl border border-gray-500/30">
                                        <h4 className="text-xl font-bold text-gray-400 mb-4">CLZD Treasury</h4>
                                        <p className="text-gray-400 text-sm mb-2">
                                            All CLZD payments go to the treasury address. Configure this in the contract.
                                        </p>
                                        <div className="bg-gray-800 px-4 py-3 rounded-lg font-mono text-sm text-gray-300 break-all">
                                            {clzdTreasury || 'Not configured'}
                                        </div>
                                    </div>

                                    {/* Reload Button */}
                                    <motion.button
                                        onClick={loadClzdSettings}
                                        className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Reload Settings from Contract
                                    </motion.button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Predictions Tab */}
                    {activeTab === 'predictions' && (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 p-6 rounded-xl border border-purple-500/50">
                                <h3 className="text-2xl font-bold text-purple-400 mb-2">🔮 Prediction Market Manager</h3>
                                <p className="text-gray-300">
                                    Create and manage prediction markets. Only the contract owner can create/resolve markets.
                                </p>
                            </div>

                            {/* Create New Market */}
                            <div className="bg-black/50 p-6 rounded-xl border border-[#FFD700]/30">
                                <h4 className="text-xl font-bold text-[#FFD700] mb-4">Create New Market</h4>

                                {/* Question */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Question</label>
                                    <input
                                        type="text"
                                        value={newMarket.question}
                                        onChange={(e) => setNewMarket({ ...newMarket, question: e.target.value })}
                                        placeholder="e.g., Will BNB hit $800 by end of December?"
                                        className="w-full bg-gray-700 px-4 py-3 rounded-lg text-white border border-gray-600 focus:border-[#FFD700] outline-none"
                                    />
                                </div>

                                {/* Outcomes */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Outcomes (2-8)</label>
                                    {newMarket.outcomes.map((outcome, idx) => (
                                        <div key={idx} className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={outcome}
                                                onChange={(e) => {
                                                    const newOutcomes = [...newMarket.outcomes];
                                                    newOutcomes[idx] = e.target.value;
                                                    setNewMarket({ ...newMarket, outcomes: newOutcomes });
                                                }}
                                                placeholder={`Outcome ${idx + 1}`}
                                                className="flex-1 bg-gray-700 px-4 py-2 rounded-lg text-white border border-gray-600"
                                            />
                                            {newMarket.outcomes.length > 2 && (
                                                <button
                                                    onClick={() => {
                                                        const newOutcomes = newMarket.outcomes.filter((_, i) => i !== idx);
                                                        setNewMarket({ ...newMarket, outcomes: newOutcomes });
                                                    }}
                                                    className="px-3 py-2 bg-red-600/50 hover:bg-red-600 text-white rounded-lg"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {newMarket.outcomes.length < 8 && (
                                        <button
                                            onClick={() => setNewMarket({ ...newMarket, outcomes: [...newMarket.outcomes, ''] })}
                                            className="mt-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm"
                                        >
                                            + Add Outcome
                                        </button>
                                    )}
                                </div>

                                {/* Settings Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Betting Duration (hours)</label>
                                        <input
                                            type="number"
                                            value={newMarket.bettingDurationHours}
                                            onChange={(e) => setNewMarket({ ...newMarket, bettingDurationHours: parseInt(e.target.value) || 24 })}
                                            className="w-full bg-gray-700 px-3 py-2 rounded text-white border border-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Resolution Delay (hours)</label>
                                        <input
                                            type="number"
                                            value={newMarket.resolutionDelayHours}
                                            onChange={(e) => setNewMarket({ ...newMarket, resolutionDelayHours: parseInt(e.target.value) || 1 })}
                                            className="w-full bg-gray-700 px-3 py-2 rounded text-white border border-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Market Type</label>
                                        <select
                                            value={newMarket.marketType}
                                            onChange={(e) => setNewMarket({ ...newMarket, marketType: e.target.value })}
                                            className="w-full bg-gray-700 px-3 py-2 rounded text-white border border-gray-600"
                                        >
                                            <option value="COMMUNITY">Community</option>
                                            <option value="CRYPTO_PRICE">Crypto Price</option>
                                            <option value="IN_GAME">In-Game</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={newMarket.featured}
                                                onChange={(e) => setNewMarket({ ...newMarket, featured: e.target.checked })}
                                                className="w-5 h-5 rounded"
                                            />
                                            Featured
                                        </label>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="mb-4">
                                    <label className="block text-xs text-gray-400 mb-1">Tags (comma separated)</label>
                                    <input
                                        type="text"
                                        value={newMarket.tags}
                                        onChange={(e) => setNewMarket({ ...newMarket, tags: e.target.value })}
                                        placeholder="e.g., crypto, bnb, price"
                                        className="w-full bg-gray-700 px-3 py-2 rounded text-white border border-gray-600"
                                    />
                                </div>

                                {/* Create Button */}
                                <motion.button
                                    onClick={createPredictionMarket}
                                    disabled={creatingMarket}
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {creatingMarket ? 'Creating...' : '🔮 Create Market'}
                                </motion.button>
                            </div>

                            {/* Active Markets */}
                            <div className="bg-black/50 p-6 rounded-xl border border-green-500/30">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xl font-bold text-green-400">Active Markets</h4>
                                    <button
                                        onClick={loadPredictionMarkets}
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm"
                                    >
                                        🔄 Refresh
                                    </button>
                                </div>

                                {loadingPredictions ? (
                                    <div className="text-center py-8 text-gray-400">Loading markets...</div>
                                ) : predictionMarkets.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">No markets found. Create one above!</div>
                                ) : (
                                    <div className="space-y-4">
                                        {predictionMarkets.map((market) => (
                                            <div
                                                key={market.marketId}
                                                className={`p-4 rounded-lg border ${
                                                    market.status === 'ACTIVE' ? 'border-green-500/50 bg-green-900/20' :
                                                    market.status === 'RESOLVED' ? 'border-blue-500/50 bg-blue-900/20' :
                                                    'border-red-500/50 bg-red-900/20'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-xs text-gray-400">#{market.marketId}</span>
                                                        <h5 className="text-white font-medium">{market.question}</h5>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        market.status === 'ACTIVE' ? 'bg-green-500/30 text-green-400' :
                                                        market.status === 'RESOLVED' ? 'bg-blue-500/30 text-blue-400' :
                                                        'bg-red-500/30 text-red-400'
                                                    }`}>
                                                        {market.status}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-sm">
                                                    <div className="text-gray-400">Pool: <span className="text-[#FFD700]">{market.totalPool?.toLocaleString() || 0}</span></div>
                                                    <div className="text-gray-400">Bets: <span className="text-white">{market.totalBets || 0}</span></div>
                                                    <div className="text-gray-400">Deadline: <span className="text-white">{new Date(market.bettingDeadline).toLocaleDateString()}</span></div>
                                                    <div className="text-gray-400">Type: <span className="text-purple-400">{market.marketType}</span></div>
                                                </div>

                                                {/* Outcomes */}
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {market.outcomes?.map((outcome: string, idx: number) => (
                                                        <span
                                                            key={idx}
                                                            className={`px-2 py-1 rounded text-xs ${
                                                                market.status === 'RESOLVED' && market.winningOutcome === idx
                                                                    ? 'bg-green-500 text-white'
                                                                    : 'bg-gray-700 text-gray-300'
                                                            }`}
                                                        >
                                                            {idx + 1}. {outcome}
                                                            {market.pools?.[idx] > 0 && ` (${market.pools[idx]} gold)`}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Actions */}
                                                {market.status === 'ACTIVE' && (
                                                    <div className="flex gap-2 flex-wrap">
                                                        <select
                                                            value={selectedWinningOutcome}
                                                            onChange={(e) => setSelectedWinningOutcome(parseInt(e.target.value))}
                                                            className="bg-gray-700 px-3 py-2 rounded text-white text-sm border border-gray-600"
                                                        >
                                                            {market.outcomes?.map((outcome: string, idx: number) => (
                                                                <option key={idx} value={idx}>{idx + 1}. {outcome}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => resolvePredictionMarket(market.marketId, selectedWinningOutcome)}
                                                            disabled={resolvingMarket === market.marketId}
                                                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-bold disabled:opacity-50"
                                                        >
                                                            {resolvingMarket === market.marketId ? 'Resolving...' : '✓ Resolve'}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const reason = prompt('Reason for cancellation:');
                                                                if (reason) cancelPredictionMarket(market.marketId, reason);
                                                            }}
                                                            className="px-4 py-2 bg-red-600/50 hover:bg-red-600 text-white rounded text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}

                                                {market.status === 'RESOLVED' && (
                                                    <div className="text-sm text-green-400">
                                                        Winner: {market.outcomes?.[market.winningOutcome]}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </motion.div>
            </div>

            {/* Telegram Integration Modal */}
            {showTelegramIntegration && (
                <TelegramIntegration onClose={() => setShowTelegramIntegration(false)} />
            )}
        </div>
    );
};

export default AdminPanel;
