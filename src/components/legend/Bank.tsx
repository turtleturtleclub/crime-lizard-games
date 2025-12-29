import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { PlayerCharacter } from '../../types/legend.types';
import { useLanguage } from '../../contexts/LanguageContext';
import { GAME_CONSTANTS } from '../../data/gameData';
import { useModalClose } from '../../hooks/useModalClose';

interface BankProps {
    player: PlayerCharacter;
    updatePlayer: (updates: Partial<PlayerCharacter>) => void;
    onClose: () => void;
    setGameMessage: (message: string) => void;
}

const Bank: React.FC<BankProps> = ({ player, updatePlayer, onClose, setGameMessage }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose);

    const { t } = useLanguage();
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [loanAmount, setLoanAmount] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [activeTab, setActiveTab] = useState<'banking' | 'loans'>('banking');

    // Sync database TO blockchain when bank opens
    React.useEffect(() => {
        const syncToBlockchain = async () => {
            try {
const response = await fetch('/api/legend/sync-to-blockchain', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        walletAddress: player.walletAddress,
                        tokenId: Number(player.tokenId)
                    })
                });

                if (response.ok) {
} else {
                    console.warn('⚠️ Failed to sync to blockchain:', await response.text());
                }
            } catch (error) {
                console.error('❌ Error syncing to blockchain:', error);
            }
        };

        syncToBlockchain();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const deposit = async () => {
        const amount = parseInt(depositAmount);

        if (isNaN(amount) || amount <= 0) {
            setGameMessage(t.legend.shops.invalidAmount);
            return;
        }

        if (amount > player.gold) {
            setGameMessage(t.legend.shops.notEnoughGoldToDeposit);
            return;
        }

        try {
            const requestBody = {
                walletAddress: player.walletAddress,
                tokenId: Number(player.tokenId), // Ensure tokenId is a number
                amount: Number(amount) // Ensure amount is a number
            };
const response = await fetch('/api/legend/bank/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Update local state with new balances from backend response
                updatePlayer({
                    gold: data.gold,
                    goldInBank: data.goldInBank
                });
                setGameMessage(t.legend.shops.depositSuccess.replace('{amount}', amount.toString()));
                setDepositAmount('');
            } else {
                setGameMessage(`❌ ${data.error || 'Failed to deposit'}`);
            }
        } catch (error) {
            console.error('Deposit error:', error);
            setGameMessage('❌ Error depositing gold. Please try again.');
        }
    };

    const withdraw = async () => {
        const amount = parseInt(withdrawAmount);

        if (isNaN(amount) || amount <= 0) {
            setGameMessage(t.legend.shops.invalidAmount);
            return;
        }

        if (amount > player.goldInBank) {
            setGameMessage(t.legend.shops.notEnoughGoldInBank);
            return;
        }

        try {
            const requestBody = {
                walletAddress: player.walletAddress,
                tokenId: Number(player.tokenId), // Ensure tokenId is a number
                amount: Number(amount) // Ensure amount is a number
            };
const response = await fetch('/api/legend/bank/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Update local state with new balances from backend response
                updatePlayer({
                    gold: data.gold,
                    goldInBank: data.goldInBank
                });
                setGameMessage(t.legend.shops.withdrawSuccess.replace('{amount}', amount.toString()));
                setWithdrawAmount('');
            } else {
                setGameMessage(`❌ ${data.error || 'Failed to withdraw'}`);
            }
        } catch (error) {
            console.error('Withdraw error:', error);
            setGameMessage('❌ Error withdrawing gold. Please try again.');
        }
    };

    const takeLoan = async () => {
        const amount = parseInt(loanAmount);

        if (isNaN(amount) || amount < GAME_CONSTANTS.LOAN_MIN_AMOUNT) {
            setGameMessage(`❌ Minimum loan amount is ${GAME_CONSTANTS.LOAN_MIN_AMOUNT} gold.`);
            return;
        }

        if (amount > GAME_CONSTANTS.LOAN_MAX_AMOUNT) {
            setGameMessage(`❌ Maximum loan amount is ${GAME_CONSTANTS.LOAN_MAX_AMOUNT} gold.`);
            return;
        }

        if (player.activeLoan) {
            setGameMessage('❌ You already have an active loan. Pay it off first!');
            return;
        }

        try {
            const response = await fetch('/api/legend/bank/loan/take', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    amount
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                updatePlayer({
                    gold: player.gold + amount,
                    activeLoan: data.loan
                });
                setGameMessage(`💰 Loan approved! ${amount} gold added to your hand. Pay back ${data.loan.amountOwed.toFixed(0)} gold by ${new Date(data.loan.dueDate).toLocaleDateString()}.`);
                setLoanAmount('');
            } else {
                setGameMessage(`❌ ${data.error || 'Failed to take loan'}`);
            }
        } catch (error) {
            console.error('Loan error:', error);
            setGameMessage('❌ Error taking loan. Please try again.');
        }
    };

    const payLoan = async () => {
        const amount = parseInt(paymentAmount);

        if (!player.activeLoan) {
            setGameMessage('❌ You don\'t have an active loan.');
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            setGameMessage(t.legend.shops.invalidAmount);
            return;
        }

        if (amount > player.gold) {
            setGameMessage('❌ Not enough gold on hand to make this payment!');
            return;
        }

        try {
            const response = await fetch('/api/legend/bank/loan/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: player.walletAddress,
                    tokenId: player.tokenId,
                    amount
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                updatePlayer({
                    gold: player.gold - amount,
                    activeLoan: data.loanPaidOff ? undefined : data.loan
                });
                if (data.loanPaidOff) {
                    setGameMessage('🎉 Loan paid off completely! Your credit is restored.');
                } else {
                    setGameMessage(`💸 Payment of ${amount} gold accepted. Remaining balance: ${data.loan.amountOwed.toFixed(0)} gold.`);
                }
                setPaymentAmount('');
            } else {
                setGameMessage(`❌ ${data.error || 'Failed to make payment'}`);
            }
        } catch (error) {
            console.error('Payment error:', error);
            setGameMessage('❌ Error making payment. Please try again.');
        }
    };

    const modalContent = (

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-0 md:p-4 overscroll-none z-modal"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border-2 border-[#00FF88] p-4 md:p-6 max-w-2xl w-full h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto overflow-x-hidden font-bbs pb-safe-bottom"
                style={{ touchAction: 'pan-y' }}
            >
                {/* Header */}
                <div className="text-[#00FF88] text-center mb-4 text-glow-green">
                    <div className="text-2xl font-bold">🏦  {t.legend.shops.bankTitle.toUpperCase()} 🏦</div>
                </div>
                <div className="text-center mb-4 text-gray-400 text-sm">
                    {t.legend.shops.bankSubtitle}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab('banking')}
                        className={`flex-1 py-2 px-2 md:px-4 font-bold border-2 transition-all text-xs md:text-base ${
                            activeTab === 'banking'
                                ? 'bg-[#00AA55] border-[#00FF88] text-[#00FF88]'
                                : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                    >
                        💰 Banking
                    </button>
                    <button
                        onClick={() => setActiveTab('loans')}
                        className={`flex-1 py-2 px-2 md:px-4 font-bold border-2 transition-all text-xs md:text-base ${
                            activeTab === 'loans'
                                ? 'bg-red-900 border-red-500 text-red-500'
                                : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                    >
                        📜 Loans
                        {player.activeLoan && <span className="ml-1 text-yellow-500">⚠️</span>}
                    </button>
                </div>

                {/* Balances */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-black border border-yellow-500 p-4 text-center">
                        <div className="text-yellow-500 text-2xl font-bold">{player.gold.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">{t.legend.shops.goldOnHand}</div>
                    </div>
                    <div className="bg-black border border-[#00FF88] p-4 text-center">
                        <div className="text-[#00FF88] text-2xl font-bold">{player.goldInBank.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">{t.legend.shops.goldInBank}</div>
                    </div>
                </div>

                {/* Banking Tab */}
                {activeTab === 'banking' && (
                    <>
                        {/* Deposit */}
                        <div className="bg-black border border-[#00FF88] p-4 mb-3">
                            <h3 className="font-bold text-[#00FF88] mb-3">{t.legend.shops.depositGold}</h3>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    placeholder={t.legend.shops.amount}
                                    className="flex-1 px-3 py-2 bg-black text-white border border-[#00FF88] focus:border-green-400 outline-none"
                                />
                                <button
                                    onClick={() => setDepositAmount(player.gold.toString())}
                                    className="px-3 py-2 bg-black border border-[#00FF88] text-[#00FF88] hover:bg-gray-700 text-sm"
                                >
                                    {t.legend.shops.all}
                                </button>
                            </div>
                            <button
                                onClick={deposit}
                                disabled={!depositAmount || parseInt(depositAmount) <= 0 || parseInt(depositAmount) > player.gold}
                                className="w-full mt-3 px-4 py-3 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] font-bold hover:bg-[#00BB66] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t.legend.shops.deposit}
                            </button>
                        </div>

                        {/* Withdraw */}
                        <div className="bg-black border border-cyan-500 p-4 mb-4">
                            <h3 className="font-bold text-cyan-500 mb-3">{t.legend.shops.withdrawGold}</h3>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder={t.legend.shops.amount}
                                    className="flex-1 px-3 py-2 bg-black text-white border border-cyan-500 focus:border-cyan-400 outline-none"
                                />
                                <button
                                    onClick={() => setWithdrawAmount(player.goldInBank.toString())}
                                    className="px-3 py-2 bg-black border border-cyan-500 text-cyan-500 hover:bg-gray-700 text-sm"
                                >
                                    {t.legend.shops.all}
                                </button>
                            </div>
                            <button
                                onClick={withdraw}
                                disabled={!withdrawAmount || parseInt(withdrawAmount) <= 0 || parseInt(withdrawAmount) > player.goldInBank}
                                className="w-full mt-3 px-4 py-3 bg-cyan-900 border-2 border-cyan-500 text-cyan-500 font-bold hover:bg-cyan-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t.legend.shops.withdraw}
                            </button>
                        </div>

                        {/* Interest Info */}
                        <div className="bg-black border border-[#00FF88] p-3 mb-4 text-sm text-green-400">
                            📈 Earn {GAME_CONSTANTS.BANK_DAILY_INTEREST_RATE * 100}% daily interest on deposits!
                        </div>

                        {/* Info */}
                        <div className="bg-black border border-yellow-500 p-3 mb-4 text-sm text-yellow-500">
                            💡 {t.legend.shops.bankTip}
                        </div>
                    </>
                )}

                {/* Loans Tab */}
                {activeTab === 'loans' && (
                    <>
                        {/* Active Loan Status */}
                        {player.activeLoan && (
                            <div className={`bg-black border-2 p-4 mb-4 ${
                                player.activeLoan.daysOverdue > 0 ? 'border-red-500' : 'border-yellow-500'
                            }`}>
                                <h3 className="font-bold text-red-500 mb-3 flex items-center gap-2">
                                    ⚠️ Active Loan
                                    {player.activeLoan.daysOverdue > 0 && <span className="text-red-400 text-xs">(OVERDUE!)</span>}
                                </h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <div className="text-gray-400">Original Amount:</div>
                                        <div className="text-white font-bold">{player.activeLoan.amount} gold</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400">Amount Owed:</div>
                                        <div className="text-red-400 font-bold">{player.activeLoan.amountOwed.toFixed(0)} gold</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400">Due Date:</div>
                                        <div className="text-white">{new Date(player.activeLoan.takenAt).toLocaleDateString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400">Days Overdue:</div>
                                        <div className={player.activeLoan.daysOverdue > 0 ? 'text-red-500 font-bold' : 'text-[#00FF88]'}>
                                            {player.activeLoan.daysOverdue || 0}
                                        </div>
                                    </div>
                                </div>
                                {player.activeLoan.xpPenaltyAccrued > 0 && (
                                    <div className="mt-3 p-2 bg-red-900/30 border border-red-500 text-red-400 text-xs">
                                        💀 XP Penalty: -{player.activeLoan.xpPenaltyAccrued} XP (grinding daily!)
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Take Loan */}
                        {!player.activeLoan && (
                            <div className="bg-black border border-red-500 p-4 mb-4">
                                <h3 className="font-bold text-red-500 mb-3">💰 Take a Loan</h3>
                                <div className="text-xs text-gray-400 mb-3">
                                    <div>• Min: {GAME_CONSTANTS.LOAN_MIN_AMOUNT} gold | Max: {GAME_CONSTANTS.LOAN_MAX_AMOUNT} gold</div>
                                    <div>• {GAME_CONSTANTS.LOAN_INTEREST_RATE * 100}% daily interest</div>
                                    <div>• {GAME_CONSTANTS.LOAN_MAX_DURATION_DAYS} day repayment period</div>
                                    <div className="text-red-400 mt-1">⚠️ Default = {GAME_CONSTANTS.LOAN_DEFAULT_PENALTY_XP} XP lost per day!</div>
                                </div>
                                <input
                                    type="number"
                                    value={loanAmount}
                                    onChange={(e) => setLoanAmount(e.target.value)}
                                    placeholder="Loan amount"
                                    className="w-full px-3 py-2 mb-3 bg-black text-white border border-red-500 focus:border-red-400 outline-none"
                                />
                                <button
                                    onClick={takeLoan}
                                    disabled={!loanAmount || parseInt(loanAmount) < GAME_CONSTANTS.LOAN_MIN_AMOUNT || parseInt(loanAmount) > GAME_CONSTANTS.LOAN_MAX_AMOUNT}
                                    className="w-full px-4 py-3 bg-red-900 border-2 border-red-500 text-red-500 font-bold hover:bg-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    📜 Take Loan
                                </button>
                            </div>
                        )}

                        {/* Pay Loan */}
                        {player.activeLoan && (
                            <div className="bg-black border border-[#00FF88] p-4 mb-4">
                                <h3 className="font-bold text-[#00FF88] mb-3">💸 Make Payment</h3>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder="Payment amount"
                                        className="flex-1 px-3 py-2 bg-black text-white border border-[#00FF88] focus:border-green-400 outline-none"
                                    />
                                    <button
                                        onClick={() => setPaymentAmount(Math.min(player.gold, player.activeLoan?.amountOwed || 0).toString())}
                                        className="px-3 py-2 bg-black border border-[#00FF88] text-[#00FF88] hover:bg-gray-700 text-sm"
                                    >
                                        Max
                                    </button>
                                </div>
                                <button
                                    onClick={payLoan}
                                    disabled={!paymentAmount || parseInt(paymentAmount) <= 0 || parseInt(paymentAmount) > player.gold}
                                    className="w-full px-4 py-3 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] font-bold hover:bg-[#00BB66] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    💸 Make Payment
                                </button>
                            </div>
                        )}

                        {/* Loan Warning */}
                        <div className="bg-black border border-red-500 p-3 mb-4 text-sm text-red-400">
                            ⚠️ <strong>Warning:</strong> Defaulting on loans will grind your XP daily. After {GAME_CONSTANTS.LOAN_DEFAULT_PENALTY_LEVEL_THRESHOLD} XP debt, you'll start losing levels!
                        </div>
                    </>
                )}

                {/* Close */}
                <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-black border-2 border-gray-600 text-gray-400 hover:bg-black font-bold"
                >
                    [ESC] {t.legend.shops.leave}
                </button>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default Bank;
