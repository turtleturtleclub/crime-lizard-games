import React, { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { WalletContext } from '../../providers/WalletContext';
import { ethers } from 'ethers';
import { GOLD_CONTRACT_ABI } from '../../goldV7Abi';
import { CLZD_ABI, CLZD_TOKEN_ADDRESS } from '../../clzdAbi';
import { useModalClose } from '../../hooks/useModalClose';
import { getContractAddress } from '../../config/contracts';
import { useLanguage } from '../../contexts/LanguageContext';

interface GoldShopProps {
    onClose: () => void;
    onPurchase: (goldAmount: number, turnBonus: number, serverPlayer?: { gold: number; goldInBank: number; turnsRemaining: number; maxTurns: number }) => void;
    tokenId?: number;
    onBuyClzd?: () => void;
}

type PaymentMethod = 'bnb' | 'clzd';

interface BonusInfo {
    holderDiscountBnb: number;
    holderDiscountClzd: number;
    stakingGoldBonus: number;
    stakingXpBonus: number;
}

const GoldShop: React.FC<GoldShopProps> = ({ onClose, onPurchase, tokenId, onBuyClzd }) => {
    const { account, signer, provider, currentChainId } = useContext(WalletContext);
    const { t } = useLanguage();
    const [purchasing, setPurchasing] = useState(false);
    const [message, setMessage] = useState('');
    const [goldRate, setGoldRate] = useState<number>(100000);
    const [packagesWithGold, setPackagesWithGold] = useState<any[]>([]);

    // CLZD State
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bnb');
    const [clzdRateNumerator, setClzdRateNumerator] = useState<bigint>(0n);
    const [clzdRateDenominator, setClzdRateDenominator] = useState<bigint>(1n);
    const [clzdBalance, setClzdBalance] = useState<bigint>(0n);
    const [bonusInfo, setBonusInfo] = useState<BonusInfo>({
        holderDiscountBnb: 0,
        holderDiscountClzd: 0,
        stakingGoldBonus: 0,
        stakingXpBonus: 0
    });
    const [approving, setApproving] = useState(false);

    useModalClose(onClose);

    // Base packages (BNB amounts and bonuses)
    const basePackages = [
        { bnb: '0.01', bonus: 0, turns: 5, popular: false, emoji: '💰' },
        { bnb: '0.05', bonus: 10, turns: 30, popular: true, emoji: '💎' },
        { bnb: '0.1', bonus: 20, turns: 75, popular: false, emoji: '👑' },
        { bnb: '0.5', bonus: 30, turns: 500, popular: false, emoji: '🏆' }
    ];

    // Fetch gold rate and CLZD info
    useEffect(() => {
        const fetchRates = async () => {
            try {
                // Use wallet provider if available, otherwise use public RPC
                const rpcProvider = provider || new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');

                const contractAddress = getContractAddress(56, 'gold');
                if (!contractAddress) return;

                const goldContract = new ethers.Contract(contractAddress, GOLD_CONTRACT_ABI, rpcProvider);

                // Fetch BNB gold rate
                const rate = await goldContract.goldRate();
                const rateNumber = Number(rate);
                setGoldRate(rateNumber);

                // Fetch CLZD rate (V7 - uses getClzdRate() with numerator/denominator)
                try {
                    const [numerator, denominator] = await goldContract.getClzdRate();
                    // V7 formula: goldAmount = (clzdAmount * numerator) / (1e18 * denominator)
                    setClzdRateNumerator(numerator);
                    setClzdRateDenominator(denominator > 0n ? denominator : 1n);
                } catch (err) {
                    console.error('Failed to fetch CLZD rate:', err);
                    // CLZD not available
                    setClzdRateNumerator(0n);
                    setClzdRateDenominator(1n);
                }

                // Calculate packages
                const packagesWithCalc = basePackages.map(pkg => {
                    const bnbInWei = ethers.parseEther(pkg.bnb);
                    const baseGold = Number((bnbInWei * BigInt(rateNumber)) / ethers.parseEther('1'));
                    const bonusGold = Math.floor(baseGold * pkg.bonus / 100);
                    return { ...pkg, gold: baseGold + bonusGold };
                });
                setPackagesWithGold(packagesWithCalc);

            } catch (error) {
                console.error('Failed to fetch rates:', error);
                setPackagesWithGold(basePackages.map((pkg, i) => ({
                    ...pkg,
                    gold: [1000, 5500, 12000, 65000][i]
                })));
            }
        };

        fetchRates();
    }, [provider]);

    // Fetch CLZD balance and bonuses
    useEffect(() => {
        const fetchClzdInfo = async () => {
            if (!account) return;

            try {
                // Use wallet provider if available, otherwise use public RPC
                const rpcProvider = provider || new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');
                // Fetch CLZD balance
                const clzdContract = new ethers.Contract(CLZD_TOKEN_ADDRESS.mainnet, CLZD_ABI, rpcProvider);
                const balance = await clzdContract.balanceOf(account);
                setClzdBalance(balance);

                // Fetch bonuses if tokenId is set
                if (tokenId) {
                    const [discountRes, stakingRes] = await Promise.all([
                        fetch(`/api/legend/clzd/discount/${account}`),
                        fetch(`/api/legend/clzd/staking/${tokenId}`)
                    ]);

                    if (discountRes.ok) {
                        const discountData = await discountRes.json();
                        setBonusInfo(prev => ({
                            ...prev,
                            holderDiscountBnb: discountData.bnbDiscountPercent || 0,
                            holderDiscountClzd: discountData.clzdDiscountPercent || 0
                        }));
                    }

                    if (stakingRes.ok) {
                        const stakingData = await stakingRes.json();
                        setBonusInfo(prev => ({
                            ...prev,
                            stakingGoldBonus: stakingData.goldBonusPercent || 0,
                            stakingXpBonus: stakingData.xpBonusPercent || 0
                        }));
                    }
                }
            } catch (error) {
                console.error('Failed to fetch CLZD info:', error);
            }
        };

        fetchClzdInfo();
    }, [provider, account, tokenId]);

    // Calculate CLZD amount needed for a package (V4.1 formula)
    // Contract formula: goldAmount = (clzdAmount * numerator) / (1e18 * denominator)
    // Inverse: clzdAmount = (goldNeeded * 1e18 * denominator) / numerator
    const calculateClzdAmount = (pkg: typeof packagesWithGold[0]): bigint => {
        if (clzdRateNumerator === 0n) return 0n;
        const goldNeeded = BigInt(pkg.gold);
        const clzdNeeded = (goldNeeded * ethers.parseEther('1') * clzdRateDenominator) / clzdRateNumerator;
        return clzdNeeded;
    };

    // Format CLZD for display
    const formatClzd = (amount: bigint): string => {
        const formatted = parseFloat(ethers.formatEther(amount));
        if (formatted >= 1000000) return `${(formatted / 1000000).toFixed(2)}M`;
        if (formatted >= 1000) return `${(formatted / 1000).toFixed(1)}K`;
        return formatted.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    // Purchase with BNB
    const purchaseWithBnb = async (pkg: typeof packagesWithGold[0]) => {
        if (!account || !signer || tokenId === undefined || tokenId === null) {
            setMessage(t.goldShop.selectCharacterFirst);
            return;
        }

        if (currentChainId !== 56) {
            setMessage(t.goldShop.switchToMainnet);
            return;
        }

        setPurchasing(true);
        setMessage(t.goldShop.processingPurchase);

        try {
            const contractAddress = getContractAddress(56, 'gold');
            if (!contractAddress) {
                setMessage(t.goldShop.goldContractNotConfigured);
                setPurchasing(false);
                return;
            }

            const goldContract = new ethers.Contract(contractAddress, GOLD_CONTRACT_ABI, signer);
            const tx = await goldContract.purchaseGold(tokenId, {
                value: ethers.parseEther(pkg.bnb)
            });

            setMessage(t.goldShop.waitingConfirmation);
            const receipt = await tx.wait();

            // Get gold amount from event
            const goldPurchasedEvent = receipt.logs.find((log: any) => {
                try {
                    const parsed = goldContract.interface.parseLog(log);
                    return parsed?.name === 'GoldPurchased';
                } catch { return false; }
            });

            let actualGoldAmount = pkg.gold;
            if (goldPurchasedEvent) {
                const parsed = goldContract.interface.parseLog(goldPurchasedEvent);
                actualGoldAmount = Number(parsed?.args.goldAmount);
            }

            // Record in backend
            const response = await fetch('/api/legend/purchase-gold-secure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: account,
                    tokenId,
                    bnbAmount: pkg.bnb,
                    goldAmount: actualGoldAmount,
                    turnBonus: pkg.turns,
                    transactionHash: tx.hash
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const totalGoldReceived = data.goldAmount || actualGoldAmount;
                const turnsReceived = data.turnsAwarded || pkg.turns;
                setMessage(t.goldShop.successReceived.replace('{gold}', totalGoldReceived.toLocaleString()).replace('{turns}', String(turnsReceived)));
                // 🔐 FIX: Pass server's authoritative player state to prevent sync-gold overwriting pending combat gold
                onPurchase(totalGoldReceived, turnsReceived, data.player);
                setTimeout(onClose, 2000);
            } else {
                setMessage(t.goldShop.failedContactSupport + tx.hash);
            }
        } catch (error: unknown) {
            console.error('Gold purchase error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorLower = errorMessage.toLowerCase();

            // Parse specific error conditions
            if (errorLower.includes('insufficient') || errorLower.includes('exceeds balance')) {
                setMessage(t.goldShop.insufficientBnb.replace('{amount}', pkg.bnb));
            } else if (errorLower.includes('user rejected') || errorLower.includes('user denied')) {
                setMessage(t.goldShop.transactionCancelled);
            } else if (errorLower.includes('not owner') || errorLower.includes('not the owner') || errorLower.includes('ownerof')) {
                setMessage(t.goldShop.notOwner);
            } else if (errorLower.includes('paused')) {
                setMessage(t.goldShop.shopPaused);
            } else if (errorLower.includes('invalid token') || errorLower.includes('nonexistent')) {
                setMessage(t.goldShop.invalidCharacter);
            } else {
                // Show truncated error for debugging
                const shortError = errorMessage.length > 100 ? errorMessage.slice(0, 100) + '...' : errorMessage;
                setMessage(t.goldShop.transactionFailed.replace('{error}', shortError));
            }
        } finally {
            setPurchasing(false);
        }
    };

    // Purchase with CLZD
    const purchaseWithClzd = async (pkg: typeof packagesWithGold[0]) => {
        if (!account || !signer || tokenId === undefined || tokenId === null) {
            setMessage(t.goldShop.selectCharacterFirst);
            return;
        }

        if (currentChainId !== 56) {
            setMessage(t.goldShop.switchToMainnet);
            return;
        }

        if (clzdRateNumerator === 0n) {
            setMessage(t.goldShop.clzdNotAvailable);
            return;
        }

        const clzdAmount = calculateClzdAmount(pkg);
        if (clzdAmount === 0n) {
            setMessage(t.goldShop.unableCalculateClzd);
            return;
        }

        if (clzdBalance < clzdAmount) {
            setMessage(t.goldShop.insufficientClzd.replace('{amount}', formatClzd(clzdAmount)));
            return;
        }

        setPurchasing(true);

        try {
            const contractAddress = getContractAddress(56, 'gold');
            if (!contractAddress) {
                setMessage(t.goldShop.goldContractNotConfigured);
                setPurchasing(false);
                return;
            }

            const clzdContract = new ethers.Contract(CLZD_TOKEN_ADDRESS.mainnet, CLZD_ABI, signer);
            const goldContract = new ethers.Contract(contractAddress, GOLD_CONTRACT_ABI, signer);

            // Check allowance
            const allowance = await clzdContract.allowance(account, contractAddress);

            if (allowance < clzdAmount) {
                setApproving(true);
                setMessage(t.goldShop.approvingClzd);

                const approveTx = await clzdContract.approve(contractAddress, clzdAmount);
                await approveTx.wait();

                setApproving(false);
            }

            setMessage(t.goldShop.processingClzdPurchase);

            const tx = await goldContract.purchaseGoldWithCLZD(tokenId, clzdAmount);

            setMessage(t.goldShop.waitingConfirmation);
            const receipt = await tx.wait();

            // Get gold amount from event
            const goldPurchasedEvent = receipt.logs.find((log: any) => {
                try {
                    const parsed = goldContract.interface.parseLog(log);
                    return parsed?.name === 'GoldPurchasedWithCLZD';
                } catch { return false; }
            });

            let actualGoldAmount = pkg.gold;
            if (goldPurchasedEvent) {
                const parsed = goldContract.interface.parseLog(goldPurchasedEvent);
                actualGoldAmount = Number(parsed?.args.goldAmount);
            }

            // Record in backend
            const response = await fetch('/api/legend/purchase-gold-clzd-secure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: account,
                    tokenId,
                    clzdAmount: clzdAmount.toString(),
                    turnBonus: pkg.turns,
                    transactionHash: tx.hash
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessage(t.goldShop.successReceivedClzd.replace('{gold}', actualGoldAmount.toLocaleString()));
                // 🔐 FIX: Pass server's authoritative player state to prevent sync-gold overwriting pending combat gold
                onPurchase(actualGoldAmount, pkg.turns, data.player);
                setTimeout(onClose, 2000);
            } else {
                setMessage(t.goldShop.failedContactSupport + tx.hash);
            }
        } catch (error: unknown) {
            console.error('CLZD purchase error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorLower = errorMessage.toLowerCase();

            // Parse specific error conditions
            if (errorLower.includes('insufficient') || errorLower.includes('exceeds balance') || errorLower.includes('transfer amount exceeds')) {
                setMessage(t.goldShop.insufficientClzd.replace('{amount}', formatClzd(calculateClzdAmount(pkg))));
            } else if (errorLower.includes('user rejected') || errorLower.includes('user denied')) {
                setMessage(t.goldShop.transactionCancelled);
            } else if (errorLower.includes('not owner') || errorLower.includes('not the owner') || errorLower.includes('ownerof')) {
                setMessage(t.goldShop.notOwner);
            } else if (errorLower.includes('allowance') || errorLower.includes('approve')) {
                setMessage(t.goldShop.clzdApprovalFailed);
            } else if (errorLower.includes('paused')) {
                setMessage(t.goldShop.shopPaused);
            } else if (errorLower.includes('invalid token') || errorLower.includes('nonexistent')) {
                setMessage(t.goldShop.invalidCharacter);
            } else {
                // Show truncated error for debugging
                const shortError = errorMessage.length > 100 ? errorMessage.slice(0, 100) + '...' : errorMessage;
                setMessage(t.goldShop.transactionFailed.replace('{error}', shortError));
            }
        } finally {
            setPurchasing(false);
            setApproving(false);
        }
    };

    const handlePurchase = (pkg: typeof packagesWithGold[0]) => {
        if (paymentMethod === 'bnb') {
            purchaseWithBnb(pkg);
        } else {
            purchaseWithClzd(pkg);
        }
    };

    const packages = packagesWithGold;
    const hasActiveBonus = bonusInfo.holderDiscountBnb > 0 || bonusInfo.stakingGoldBonus > 0;
    const clzdAvailable = clzdRateNumerator > 0n;
    // Calculate effective CLZD rate for display (gold per 1M CLZD)
    const clzdGoldPer1M = clzdRateNumerator > 0n
        ? Number((1000000n * clzdRateNumerator) / clzdRateDenominator)
        : 0;

    const modalContent = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 overscroll-none z-modal"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border-2 border-yellow-500 p-4 md:p-6 max-w-5xl w-full max-h-[90dvh] overflow-y-auto font-bbs custom-scrollbar pb-safe-bottom"
            >
                {/* Header */}
                <div className="text-yellow-500 text-glow-gold mb-4 md:mb-6 text-center">
                    <div className="text-xl md:text-2xl font-bold">{t.goldShop.title}</div>
                    <div className="text-xs md:text-sm mt-2 text-gray-400">{t.goldShop.subtitle}</div>
                </div>

                {/* Payment Method Toggle */}
                <div className="flex justify-center gap-2 mb-4">
                    <button
                        onClick={() => setPaymentMethod('bnb')}
                        className={`px-4 py-2 border-2 font-bold text-sm transition-all ${
                            paymentMethod === 'bnb'
                                ? 'bg-yellow-900 border-yellow-500 text-yellow-500'
                                : 'bg-black border-gray-600 text-gray-400 hover:border-yellow-500'
                        }`}
                    >
                        {t.goldShop.payBnb} {clzdAvailable && t.goldShop.bestValue}
                    </button>
                    <button
                        onClick={() => setPaymentMethod('clzd')}
                        disabled={!clzdAvailable}
                        className={`px-4 py-2 border-2 font-bold text-sm transition-all ${
                            paymentMethod === 'clzd'
                                ? 'bg-purple-900 border-purple-500 text-purple-400'
                                : clzdAvailable
                                    ? 'bg-black border-gray-600 text-gray-400 hover:border-purple-500'
                                    : 'bg-black border-gray-800 text-gray-600 cursor-not-allowed'
                        }`}
                    >
                        {t.goldShop.payClzd} {!clzdAvailable && t.goldShop.comingSoon}
                    </button>
                </div>

                {/* CLZD Balance Display */}
                {paymentMethod === 'clzd' && clzdAvailable && (
                    <div className="bg-black border-2 border-purple-500 p-2 mb-3 text-center">
                        <span className="text-purple-400 text-sm">
                            {t.goldShop.yourClzdBalance} <span className="font-bold text-white">{formatClzd(clzdBalance)} CLZD</span>
                        </span>
                    </div>
                )}

                {/* Need more CLZD? - Buy CLZD button when on CLZD tab */}
                {paymentMethod === 'clzd' && onBuyClzd && (
                    <div className="bg-black border border-[#00FF88] p-2 mb-3">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[#00FF88] text-xs">Need more CLZD?</span>
                            <button
                                onClick={() => {
                                    onClose();
                                    onBuyClzd();
                                }}
                                className="px-3 py-1 bg-[#00AA55] border border-[#00FF88] text-[#00FF88] text-xs font-bold hover:bg-[#00BB66] transition-all"
                            >
                                🦎 BUY CLZD
                            </button>
                        </div>
                    </div>
                )}

                {/* Exchange Rate Display */}
                <div className="bg-black border-2 border-cyan-500 p-2 md:p-3 mb-3 md:mb-4">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-xs md:text-sm">
                        <span className="text-cyan-500 font-bold">{t.goldShop.exchangeRate}</span>
                        {paymentMethod === 'bnb' ? (
                            <span className="text-white font-bold">{t.goldShop.goldPerBnb.replace('{rate}', goldRate.toLocaleString())}</span>
                        ) : (
                            <span className="text-white font-bold">{t.goldShop.goldPerClzd.replace('{rate}', clzdGoldPer1M.toLocaleString())}</span>
                        )}
                    </div>
                </div>

                {/* Bonus Info Banner */}
                {hasActiveBonus && (
                    <div className="bg-black border-2 border-[#00FF88] p-3 mb-4">
                        <div className="text-xs text-center">
                            <span className="text-[#00FF88] font-bold">{t.goldShop.yourBonuses} </span>
                            {bonusInfo.holderDiscountBnb > 0 && (
                                <span className="text-yellow-500 mr-2">
                                    {t.goldShop.holderDiscount.replace('{percent}', String(paymentMethod === 'bnb' ? bonusInfo.holderDiscountBnb : bonusInfo.holderDiscountClzd))}
                                </span>
                            )}
                            {bonusInfo.stakingGoldBonus > 0 && (
                                <span className="text-purple-400">
                                    {t.goldShop.stakingBonus.replace('{percent}', String(bonusInfo.stakingGoldBonus))}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Info Banner */}
                <div className="bg-black border-2 border-[#00FF88] p-3 md:p-4 mb-4 md:mb-6">
                    <div className="flex items-start gap-2 md:gap-3">
                        <span className="text-xl md:text-2xl">🎁</span>
                        <div>
                            <h3 className="font-bold text-[#00FF88] mb-1 text-xs md:text-sm">{t.goldShop.bonusGoldTitle}</h3>
                            <p className="text-xs text-gray-400">
                                {paymentMethod === 'bnb' ? t.goldShop.bonusGoldDescBnb : t.goldShop.bonusGoldDescClzd}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {packages.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <div className="animate-pulse">{t.goldShop.loadingPackages}</div>
                    </div>
                )}

                {/* Packages Grid */}
                {packages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
                        {packages.map((pkg, index) => {
                            const clzdAmount = calculateClzdAmount(pkg);
                            const canAffordClzd = clzdBalance >= clzdAmount;

                            return (
                                <motion.div
                                    key={index}
                                    whileHover={{ scale: 1.02 }}
                                    className={`relative bg-black p-2 md:p-4 border-2 ${
                                        pkg.popular
                                            ? paymentMethod === 'bnb' ? 'border-yellow-500' : 'border-purple-500'
                                            : paymentMethod === 'bnb' ? 'border-yellow-500/50' : 'border-purple-500/50'
                                    } cursor-pointer hover:bg-black transition-colors`}
                                    onClick={() => !purchasing && handlePurchase(pkg)}
                                >
                                    {pkg.popular && (
                                        <div className={`absolute -top-2 md:-top-3 left-1/2 transform -translate-x-1/2 ${
                                            paymentMethod === 'bnb' ? 'bg-yellow-500' : 'bg-purple-500'
                                        } text-black px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-bold`}>
                                            {t.goldShop.popular}
                                        </div>
                                    )}

                                    <div className="text-center flex flex-col h-full">
                                        <div className="text-2xl md:text-4xl mb-1 md:mb-2">{pkg.emoji}</div>
                                        <div className={`text-lg md:text-2xl font-bold mb-0.5 md:mb-1 ${
                                            paymentMethod === 'bnb' ? 'text-yellow-500' : 'text-purple-400'
                                        }`}>
                                            {pkg.gold.toLocaleString()}
                                        </div>
                                        <div className="text-[10px] md:text-xs text-gray-400 mb-1 md:mb-2">{t.goldShop.goldCoins}</div>

                                        {pkg.bonus > 0 && (
                                            <div className="bg-[#00AA55] border border-[#00FF88] px-1 md:px-2 py-0.5 md:py-1 mb-1 md:mb-2">
                                                <span className="text-[#00FF88] font-bold text-[10px] md:text-xs">
                                                    +{pkg.bonus}% 🎁
                                                </span>
                                            </div>
                                        )}

                                        {/* Turn Bonus Display */}
                                        <div className="bg-cyan-900 border border-cyan-500 px-1 md:px-2 py-0.5 md:py-1 mb-2 md:mb-3">
                                            <span className="text-cyan-500 font-bold text-[10px] md:text-xs">
                                                +{pkg.turns} ⚔️
                                            </span>
                                        </div>

                                        {/* Price Display */}
                                        <div className={`text-base md:text-xl font-bold mb-2 md:mb-4 ${
                                            paymentMethod === 'clzd' && !canAffordClzd ? 'text-red-400' : 'text-white'
                                        }`}>
                                            {paymentMethod === 'bnb'
                                                ? `${pkg.bnb} BNB`
                                                : `${formatClzd(clzdAmount)} CLZD`
                                            }
                                        </div>

                                        <div className="flex-grow"></div>

                                        <button
                                            disabled={purchasing || (paymentMethod === 'clzd' && !canAffordClzd)}
                                            className={`w-full py-1.5 md:py-2 border-2 font-bold transition-all text-xs md:text-sm ${
                                                paymentMethod === 'bnb'
                                                    ? 'bg-yellow-900 border-yellow-500 text-yellow-500 hover:bg-yellow-800'
                                                    : canAffordClzd
                                                        ? 'bg-purple-900 border-purple-500 text-purple-400 hover:bg-purple-800'
                                                        : 'bg-gray-900 border-gray-600 text-gray-500 cursor-not-allowed'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {purchasing
                                                ? approving ? '🔓...' : '⏳...'
                                                : paymentMethod === 'clzd' && !canAffordClzd
                                                    ? t.goldShop.lowClzd
                                                    : paymentMethod === 'bnb' ? `💰 ${t.goldShop.buy}` : `🦎 ${t.goldShop.buy}`
                                            }
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Message */}
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-center p-2 md:p-3 mb-3 md:mb-4 text-xs md:text-sm border-2 ${
                            message.includes('SUCCESS') || message.includes('✅')
                                ? 'bg-[#00AA55] border-[#00FF88] text-[#00FF88] text-glow-green'
                                : message.includes('❌')
                                    ? 'bg-red-900 border-red-500 text-red-500 text-glow-red'
                                    : 'bg-cyan-900 border-cyan-500 text-cyan-500'
                        }`}
                    >
                        {message}
                    </motion.div>
                )}

                {/* Weekly Rewards Info */}
                <div className="bg-black border-2 border-purple-500 p-2 md:p-4 mb-3 md:mb-4">
                    <div className="flex items-start gap-2 md:gap-3">
                        <span className="text-xl md:text-2xl">🏆</span>
                        <div className="text-xs">
                            <h3 className="font-bold text-purple-500 mb-1 md:mb-2">{t.goldShop.weeklyRewardsTitle}</h3>
                            <p className="text-gray-400 mb-1 md:mb-2">
                                {t.goldShop.weeklyRewardsDesc}
                            </p>
                            <ul className="text-gray-500 space-y-0.5 md:space-y-1">
                                <li><span className="text-yellow-500">{t.goldShop.topGoldStealer}</span></li>
                                <li><span className="text-cyan-500">{t.goldShop.highestLevel}</span></li>
                                <li><span className="text-[#00FF88]">{t.goldShop.bothEarnPoints}</span></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer & Close */}
                <div className="text-center text-[10px] md:text-xs text-gray-500 mb-3 md:mb-4">
                    {t.goldShop.secureInstant}
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-2 md:py-3 bg-black border-2 border-gray-600 text-gray-400 hover:bg-black hover:border-[#00FF88] hover:text-[#00FF88] font-bold text-sm md:text-base transition-all"
                >
                    {t.goldShop.escClose}
                </button>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default GoldShop;
