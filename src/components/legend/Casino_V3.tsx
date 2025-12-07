/**
 * CRIME LIZARD CASINO - Legend of the Crime Lizard RPG
 *
 * Spin the reels, win big, and climb the leaderboard!
 */
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerCharacter } from '../../types/legend.types';
import { Howl } from 'howler';
import { useCharacter } from '../../contexts/CharacterContext';
import { useLegendGame } from '../../contexts/LegendGameContext';
import { WalletContext } from '../../providers/WalletContext';
import { NETWORKS } from '../../providers/WalletProvider';
import { ethers } from 'ethers';
import { SLOTS_V9_ABI } from '../../slotsV9Abi';
const SLOTS_ABI = SLOTS_V9_ABI;
import { toast } from 'react-toastify';
import { useModalClose } from '../../hooks/useModalClose';

interface CasinoProps {
    player: PlayerCharacter;
    updatePlayer: (updates: Partial<PlayerCharacter>) => void;
    onClose: () => void;
    setGameMessage: (message: string) => void;
}

// Slots Contract Type
type CrimeLizardSlots = ethers.BaseContract & {
    // Character management
    selectCharacter(tokenId: bigint): Promise<ethers.TransactionResponse>;
    getActiveCharacter(player: string): Promise<bigint>;

    // Game functions
    spin(betAmount: bigint, userRandomNumber: string, overrides?: ethers.Overrides): Promise<ethers.TransactionResponse>;
    freeSpins(address: string): Promise<bigint>;
    jackpot(): Promise<bigint>;
    playerStats(player: string): Promise<any>;

    // Events
    on(event: string, listener: (...args: any[]) => void): ethers.BaseContract;
    off(event: string, listener: (...args: any[]) => void): ethers.BaseContract;
};

// Casino symbols - using same assets as main slots game
const SYMBOLS = [
    '/assets/floki.png',      // 0: Floki
    '/assets/babydoge.png',   // 1: Baby Doge
    '/assets/lizard.png',     // 2: LIZARD (Bonus) - Reordered to match V4!
    '/assets/cheems.png',     // 3: Cheems
    '/assets/simonscat.png',  // 4: Simons Cat
    '/assets/banana.png',     // 5: Banana
    '/assets/quack.png',      // 6: Quack
    '/assets/broccoli.png',   // 7: Broccoli
    '/assets/bnb.png',        // 8: BNB (Jackpot)
    '/assets/aster.png',      // 9: SCATTER
];

const SYMBOL_NAMES = [
    'Floki', 'Baby Doge', 'LIZARD', 'Cheems', 'Simons Cat',
    'Banana', 'Quack', 'Broccoli', 'BNB', 'SCATTER'
];

const SYMBOL_WEIGHTS = [8, 12, 17, 12, 14, 10, 14, 8, 3, 6];

const REELS = 5;
const ROWS = 3;

// Symbol Payouts
const PAYOUTS: { [key: number]: number[] } = {
    0: [0, 0, 3, 9, 15],      // Floki
    1: [0, 0, 3, 7, 12],      // Baby Doge
    2: [0, 0, 2, 6, 10],      // LIZARD
    3: [0, 0, 2, 5, 8],       // Cheems
    4: [0, 0, 2, 4, 6],       // Simons Cat
    5: [0, 0, 1, 3, 5],       // Banana
    6: [0, 0, 1, 3, 5],       // Quack
    7: [0, 0, 1, 2, 3],       // Broccoli
    8: [0, 0, 0, 0, 0],       // BNB - JACKPOT
    9: [0, 0, 0, 0, 0],       // SCATTER - FREE SPINS
};

// Contract's 20 PAYLINES (must match exactly for accurate highlighting!)
const PAYLINES: number[][] = [
    [0, 1, 2, 3, 4],      // 0. Top row
    [5, 6, 7, 8, 9],      // 1. Middle row
    [10, 11, 12, 13, 14], // 2. Bottom row
    [0, 6, 12, 8, 4],     // 3. Diagonal down
    [10, 6, 2, 8, 14],    // 4. Diagonal up
    [5, 1, 7, 3, 9],      // 5. V shape
    [5, 11, 7, 13, 9],    // 6. Inverted V
    [0, 1, 12, 3, 14],    // 7. Zigzag 1
    [10, 11, 2, 13, 4],   // 8. Zigzag 2
    [0, 11, 7, 3, 14],    // 9. W pattern
    [10, 1, 7, 13, 4],    // 10. M pattern
    [5, 1, 2, 3, 9],      // 11. Lightning 1
    [5, 11, 12, 13, 9],   // 12. Lightning 2
    [0, 6, 7, 8, 4],      // 13. Crown 1
    [10, 6, 7, 8, 14],    // 14. Crown 2
    [5, 6, 2, 8, 9],      // 15. Cross 1
    [5, 6, 12, 8, 9],     // 16. Cross 2
    [0, 1, 7, 13, 14],    // 17. Diamond 1
    [10, 11, 7, 3, 4],    // 18. Diamond 2
    [0, 11, 12, 3, 4]     // 19. Butterfly
];

const MIN_BET = 10;
const MAX_BET = 10000;
const BET_INCREMENTS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

// V4: Completely free (gas only)!

// Sound effects
const sounds = {
    spin: new Howl({ src: ['/assets/spin.mp3'], volume: 0.3 }),
    win: new Howl({ src: ['/assets/win.mp3'], volume: 0.4 }),
    jackpot: new Howl({ src: ['/assets/jackpot.mp3'], volume: 0.5 }),
    freeSpin: new Howl({ src: ['/assets/free-spin.mp3'], volume: 0.4 }),
};

const Casino: React.FC<CasinoProps> = ({ player, updatePlayer, onClose, setGameMessage }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose);

    // Wallet and blockchain setup
    const { account, currentChainId, provider } = useContext(WalletContext);
    const { selectedCharacter, refreshGoldBalance } = useCharacter();
    const { syncGoldFromBlockchain } = useLegendGame();

    // Database gold balance (source of truth)
    const [databaseGold, setDatabaseGold] = useState<number>(0);

    // Blockchain state
    const [contract, setContract] = useState<CrimeLizardSlots | null>(null);
    const [isProcessingTx, setIsProcessingTx] = useState(false);
    const [jackpotAmount, setJackpotAmount] = useState(0);

    // Game state
    const [reels, setReels] = useState<string[][]>([]);
    const [spinning, setSpinning] = useState(false);
    const [betAmount, setBetAmount] = useState(MIN_BET);
    const [winAmount, setWinAmount] = useState(0);
    const [lastWin, setLastWin] = useState(0);
    const [totalWon, setTotalWon] = useState(0);
    const [totalLost, setTotalLost] = useState(0);
    const [spinsCount, setSpinsCount] = useState(0);
    const [winningPositions, setWinningPositions] = useState<Set<string>>(new Set());
    const [freeSpinsCount, setFreeSpinsCount] = useState(0);  // Free spins!
    const spinAnimationRef = useRef<number | undefined>(undefined);
    const spinningRef = useRef<boolean>(false);
    const processedSequenceNumbers = useRef<Set<string>>(new Set()); // Track processed (V4 uses sequenceNumber)

    // Fetch gold balance from database (source of truth)
    const fetchDatabaseGold = useCallback(async () => {
        if (!account || !selectedCharacter) return;

        try {
            const response = await fetch(`/api/legend/player/${account}/${selectedCharacter.tokenId.toString()}`);
            if (response.ok) {
                const data = await response.json();
                const gold = data.gold || 0;
                setDatabaseGold(gold);
}
        } catch (error) {
            console.error('❌ Casino: Failed to fetch database gold:', error);
        }
    }, [account, selectedCharacter]);

    // Update gold in database after win/loss (database-first, then background blockchain sync)
    const updateDatabaseGold = useCallback(async (goldChange: number, reason: string) => {
        if (!account || !selectedCharacter) return;

        try {
            const response = await fetch('/api/legend/update-gold', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: account,
                    tokenId: Number(selectedCharacter.tokenId),
                    goldChange,
                    reason
                })
            });

            if (response.ok) {
                const data = await response.json();
// Update local display
                setDatabaseGold(data.newGold);

                // Update player context
                updatePlayer({ gold: data.newGold });

                return data;
            } else {
                console.error('❌ Casino: Failed to update database gold:', await response.text());
            }
        } catch (error) {
            console.error('❌ Casino: Failed to update database gold:', error);
        }
    }, [account, selectedCharacter, updatePlayer]);

    // Initialize slots contract with WebSocket for events
    useEffect(() => {
        let wsProvider: ethers.WebSocketProvider | null = null;

        const initContract = async () => {
            if (!provider || !currentChainId) return;

            const networkConfig = NETWORKS[currentChainId];
            if (!networkConfig) {
                console.error('❌ Casino V5: Unsupported network:', currentChainId);
                return;
            }

            const contractAddress = networkConfig.contractAddress;
            if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
                console.error('❌ Casino V5: Contract not deployed on this network');
                return;
            }

            try {
                // Create HTTP contract for transactions
                const cont = new ethers.Contract(contractAddress, SLOTS_ABI, provider) as unknown as CrimeLizardSlots;
                setContract(cont);


                // Query free spins and jackpot if account is connected
                if (account) {
                    try {
                        const fs = await cont.freeSpins(account);
                        setFreeSpinsCount(Number(fs));
                    } catch (error) {
                        console.error('Failed to query free spins:', error);
                    }
                }

                try {
                    const jp = await cont.jackpot();
                    setJackpotAmount(Number(jp));
                } catch (error) {
                    console.error('Failed to query jackpot:', error);
                }

                // Set up WebSocket provider for real-time events
                if (networkConfig.wssUrls && networkConfig.wssUrls.length > 0 && networkConfig.wssUrls[0]) {
                    try {
wsProvider = new ethers.WebSocketProvider(networkConfig.wssUrls[0]);
                        await wsProvider.getBlockNumber();
                        const wsContract = new ethers.Contract(contractAddress, SLOTS_ABI, wsProvider) as unknown as CrimeLizardSlots;
// Use WebSocket contract for events if available
                        setContract(wsContract);
                    } catch (wsError) {
                        console.warn('⚠️ Casino V5: WebSocket connection failed, using HTTP polling fallback:', wsError);
                    }
                }
            } catch (error) {
                console.error('❌ Casino V5: Failed to initialize contract:', error);
            }
        };

        initContract();

        return () => {
            if (wsProvider) {
                wsProvider.destroy();
            }
        };
    }, [provider, currentChainId, account]);

    // Auto-select character on the Slots contract when character changes
    useEffect(() => {
        const registerCharacter = async () => {
            if (!contract || !selectedCharacter || !account || !provider) return;

            try {
                // Check if character is already selected on contract
                const activeChar = await contract.getActiveCharacter(account);

                if (activeChar !== selectedCharacter.tokenId) {

                    const signer = await provider.getSigner();
                    const contractWithSigner = contract.connect(signer) as CrimeLizardSlots;

                    const tx = await contractWithSigner.selectCharacter(selectedCharacter.tokenId);
await tx.wait();
}
            } catch (error: any) {
                console.error('❌ Casino V5: Failed to select character:', error);
                // Don't show error toast - user can still try to spin and get more specific error
            }
        };

        registerCharacter();
    }, [contract, selectedCharacter, account, provider]);

    // Fetch database gold when character changes
    useEffect(() => {
        fetchDatabaseGold();
    }, [fetchDatabaseGold, selectedCharacter?.tokenId]);

    // Initialize reels with random symbols
    useEffect(() => {
        initializeReels();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const initializeReels = () => {
        const initialReels: string[][] = [];
        for (let i = 0; i < REELS; i++) {
            const reel: string[] = [];
            for (let j = 0; j < ROWS; j++) {
                const symbolIndex = getWeightedSymbol();
                reel.push(SYMBOLS[symbolIndex]);
            }
            initialReels.push(reel);
        }
        setReels(initialReels);
    };

    const getWeightedSymbol = (): number => {
        const totalWeight = SYMBOL_WEIGHTS.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < SYMBOLS.length; i++) {
            random -= SYMBOL_WEIGHTS[i];
            if (random <= 0) {
                return i;
            }
        }
        return 0;
    };

    /**
     * ✅ V4: Use EXACT winning paylines from contract event!
     * No more guessing - contract tells us which paylines won
     */
    const convertPaylinesToPositions = useCallback((
        winningPaylines: number[],
        flatReels: number[]
    ): Set<string> => {
        const positions = new Set<string>();

        winningPaylines.forEach(paylineIndex => {
            if (paylineIndex < PAYLINES.length) {
                const payline = PAYLINES[paylineIndex];
                const symbol = flatReels[payline[0]];

                // Count consecutive matching symbols
                let matchCount = 1;
                for (let i = 1; i < payline.length; i++) {
                    if (flatReels[payline[i]] === symbol) {
                        matchCount++;
                    } else {
                        break;
                    }
                }

                // Highlight the winning positions (at least 3 matches)
                if (matchCount >= 3) {
                    payline.slice(0, matchCount).forEach(pos => {
                        const col = pos % 5;
                        const row = Math.floor(pos / 5);
                        positions.add(`${col}-${row}`);
                    });
                }
            }
        });

        return positions;
    }, []);

    const refreshJackpot = useCallback(async () => {
        if (contract) {
            try {
                const jp = await contract.jackpot();
                setJackpotAmount(Number(jp));
            } catch (error) {
                console.error('Failed to refresh jackpot:', error);
            }
        }
    }, [contract]);

    const refreshPlayerStats = useCallback(async () => {
        if (contract && account) {
            try {
                const stats = await contract.playerStats(account);
                setSpinsCount(Number(stats.totalSpins || stats[0]));
            } catch (error) {
                console.error('Failed to refresh player stats:', error);
            }
        }
    }, [contract, account]);

    const refreshFreeSpins = async () => {
        if (contract && account) {
            try {
                const fs = await contract.freeSpins(account);
                setFreeSpinsCount(Number(fs));
            } catch (error) {
                console.error('Failed to refresh free spins:', error);
            }
        }
    };

    const spin = useCallback(async () => {
        if (spinning || isProcessingTx) return;

        if (!account) {
            toast.error('Please connect your wallet first!');
            return;
        }

        if (!selectedCharacter) {
            toast.error('Please select a character first!');
            return;
        }

        if (!contract || !provider) {
            toast.error('Slots contract not initialized');
            return;
        }

        // Verify user is on mainnet before any spin
        if (currentChainId !== 56) {
            toast.error('Please switch to BNB Mainnet to play!');
            return;
        }

        const isFree = freeSpinsCount > 0;

        if (!isFree && betAmount > databaseGold) {
            setGameMessage('Not enough gold to place bet!');
            toast.error('Not enough gold to place bet!');
            return;
        }

        try {
            setIsProcessingTx(true);
            setSpinning(true);
            spinningRef.current = true;
            setWinningPositions(new Set());
            setWinAmount(0);

            // Clean up old processed sequence numbers
            if (processedSequenceNumbers.current.size > 50) {
                const idsArray = Array.from(processedSequenceNumbers.current);
                processedSequenceNumbers.current = new Set(idsArray.slice(-25));
            }

            // Get signer for transaction
            const signer = await provider.getSigner();
            const contractWithSigner = contract.connect(signer) as CrimeLizardSlots;

            // Generate user randomness for V5 instant randomness
            const userRandomNumber = ethers.hexlify(ethers.randomBytes(32));

            // IMPORTANT: Always pass the bet amount, even for free spins
            // The contract validates the bet BEFORE checking free spins, then decides internally
            // whether to deduct gold based on freeSpins balance
            const betAmountGold = BigInt(betAmount);


            // Start spin animation
            sounds.spin.play();
            startSpinAnimation();

            // Estimate gas with buffer for edge cases (jackpots, bonus games, free spins)
            let gasLimit = 1000000; // Conservative default (2.5x average usage)

            try {
                // Use getFunction to properly access estimateGas on the contract method
                const gasEstimate = await contractWithSigner.getFunction('spin').estimateGas(betAmountGold, userRandomNumber);
                // Use 2x the estimate for safety, with minimum of 800k
                gasLimit = Number(gasEstimate) * 2;
                if (gasLimit < 800000) gasLimit = 800000;
            } catch (gasError) {
                console.warn('⚠️ Gas estimation failed, using conservative default:', gasLimit);
            }

            const tx = await contractWithSigner.spin(betAmountGold, userRandomNumber, { gasLimit });
// Wait for transaction confirmation
            const receipt = await tx.wait();
setIsProcessingTx(false);

            // ✅ INSTANT: Refresh gold balance, jackpot, and stats immediately after tx confirmation
await refreshGoldBalance();
            await syncGoldFromBlockchain(); // Sync to Legend player state
            refreshJackpot();
            refreshPlayerStats();

            // V4: Instant randomness - parse events from receipt logs!
            if (receipt && receipt.logs) {

                let foundSpinResult = false;
                let foundFreeSpins = false;

                for (const log of receipt.logs) {
                    try {
                        const parsedLog = contract.interface.parseLog({
                            topics: [...log.topics],
                            data: log.data
                        });

                        if (parsedLog && parsedLog.name === 'SpinResult') {
                            foundSpinResult = true;
                            const args = parsedLog.args;
                            const sequenceNumber = args.sequenceNumber?.toString();

                            // Check if already processed
                            if (sequenceNumber && processedSequenceNumbers.current.has(sequenceNumber)) {
continue;
                            }


                            // Update session stats
                            if (!isFree) {
                                setTotalLost(prev => prev + betAmount);
                            }
                            // Note: spinsCount now updated from contract via refreshPlayerStats()

                            // Update player casino stats
                            updatePlayer({
                                casinoSpins: (player.casinoSpins || 0) + 1,
                                casinoGoldLost: (player.casinoGoldLost || 0) + (isFree ? 0 : betAmount)
                            });

                            processSpinResult(args, sequenceNumber);
                        }

                        // ✅ Also parse FreeSpinsAwarded events from receipt!
                        if (parsedLog && parsedLog.name === 'FreeSpinsAwarded') {
                            foundFreeSpins = true;
                            const args = parsedLog.args;
                            const spinsAwarded = Number(args.spinsAwarded);
                            const totalFreeSpins = Number(args.totalFreeSpins);
setFreeSpinsCount(totalFreeSpins);
                            toast.success(`🎁 Awarded ${spinsAwarded} Free Spins! Total: ${totalFreeSpins}`, {
                                autoClose: 5000,
                                theme: 'dark'
                            });
                            sounds.freeSpin.play();
                        }
                    } catch (parseError) {
                        // Not a relevant event, continue
                        continue;
                    }
                }

                if (foundFreeSpins) {
}

                if (!foundSpinResult) {
                    console.warn('⚠️ Casino V5: No SpinResult event found in receipt');
                    toast.warning('Result not found. Refreshing balance...', { autoClose: 3000 });
                    setSpinning(false);
                    spinningRef.current = false;
                    stopSpinAnimation();
                    await refreshGoldBalance();
                    await syncGoldFromBlockchain();
                    refreshJackpot();
                    refreshFreeSpins();
                }
            } else {
                console.error('❌ Casino V5: No receipt or logs available');
                toast.error('Transaction confirmed but result unclear. Check your balance.');
                setSpinning(false);
                spinningRef.current = false;
                stopSpinAnimation();
                await refreshGoldBalance();
                await syncGoldFromBlockchain();
                refreshJackpot();
                refreshFreeSpins();
            }

        } catch (error: any) {
            console.error('❌ Casino V5: Spin error:', error);
            setSpinning(false);
            spinningRef.current = false;
            setIsProcessingTx(false);
            stopSpinAnimation();

            if (error.code === 'ACTION_REJECTED') {
                toast.error('Transaction cancelled');
            } else if (error.message?.includes('insufficient funds')) {
                toast.error('Insufficient BNB for gas. Please add BNB to your wallet.');
            } else if (error.message?.includes('execution reverted')) {
                // Provide more helpful error message for common contract reverts
                const possibleReasons = [
                    '• You may need more BNB for gas fees',
                    '• Character might not be selected on contract',
                    '• Contract might be paused or under maintenance'
                ];
                toast.error(
                    <div>
                        <div>Transaction failed. Possible reasons:</div>
                        {possibleReasons.map((reason, i) => <div key={i} style={{ fontSize: '0.85em' }}>{reason}</div>)}
                    </div>,
                    { autoClose: 8000 }
                );
                console.error('💡 Debug info:', {
                    betAmount,
                    databaseGold,
                    characterId: selectedCharacter?.tokenId.toString(),
                    contractAddress: contract.target
                });
            } else {
                toast.error('Spin failed: ' + (error.reason || error.message || 'Unknown error'));
            }
        }
    }, [spinning, isProcessingTx, account, selectedCharacter, contract, provider, betAmount, databaseGold, freeSpinsCount, player, updatePlayer, setGameMessage]);

    /**
     * Process spin result (shared between event listener and polling)
     */
    const processSpinResult = useCallback(async (args: any, sequenceNumber: string | undefined) => {
        if (sequenceNumber) {
            processedSequenceNumbers.current.add(sequenceNumber);
        }

        stopSpinAnimation();

        // V4: Get reels and winning paylines from event
        const reels = args.reels ? Array.from(args.reels).map(Number) : [];
        const winningPaylines = args.winningPaylines ? Array.from(args.winningPaylines).map(Number) : [];
// Convert to reel matrix (column-major)
        const reelMatrix = Array(5).fill(0).map((_, col) => [
            reels[col],
            reels[5 + col],
            reels[10 + col]
        ]);

        const reelImages = reelMatrix.map(col => col.map(idx => SYMBOLS[idx]));
        setReels(reelImages);

        const payoutAmount = parseInt(args.payout?.toString() || '0');
        const jackpotWon = parseInt(args.jackpotWon?.toString() || '0');
        setWinAmount(payoutAmount);
        setSpinning(false);
        spinningRef.current = false;

        // Calculate gold change (win - bet)
        const isFree = freeSpinsCount > 0;
        const betCost = isFree ? 0 : betAmount;
        const goldChange = payoutAmount - betCost;

        // Update database gold immediately (database-first, background sync to blockchain)
        if (goldChange !== 0) {
            await updateDatabaseGold(
                goldChange,
                `Casino ${goldChange > 0 ? 'win' : 'loss'}: ${Math.abs(goldChange)} gold`
            );
        }

        refreshJackpot();
        refreshFreeSpins();

        if (payoutAmount > 0) {
            // Use EXACT winning positions from contract!
            const winningPositions = convertPaylinesToPositions(winningPaylines, reels);
            setWinningPositions(winningPositions);

            setLastWin(payoutAmount);
            setTotalWon(prev => prev + payoutAmount);

            // Update casino stats (no XP bonus - XP is earned through gameplay/combat)
            updatePlayer({
                casinoGoldWon: (player.casinoGoldWon || 0) + payoutAmount,
                casinoBiggestWin: Math.max((player.casinoBiggestWin || 0), payoutAmount)
            });

            // Use explicit jackpotWon value
            const isJackpot = jackpotWon > 0;
            if (isJackpot) {
                sounds.jackpot.play();
                setGameMessage(`🎰 JACKPOT! Won ${payoutAmount.toLocaleString()} gold!`);
                toast.success(`🎰 JACKPOT! Won ${payoutAmount.toLocaleString()} gold!`);
            } else {
                sounds.win.play();
                setGameMessage(`Won ${payoutAmount.toLocaleString()} gold!`);
                toast.success(`Won ${payoutAmount.toLocaleString()} gold!`);
            }
        } else {
            setWinningPositions(new Set());
            setGameMessage('Better luck next time...');
            toast.info('No win this time. Spin again!', { autoClose: 2000 });
        }
    }, [convertPaylinesToPositions, player, betAmount, freeSpinsCount, refreshFreeSpins, refreshJackpot, setGameMessage, updatePlayer, updateDatabaseGold]);

    // Spin animation helpers
    const startSpinAnimation = () => {
        const animate = () => {
            setReels(prev => prev.map(reel =>
                reel.map(() => SYMBOLS[getWeightedSymbol()])
            ));
            spinAnimationRef.current = window.setTimeout(animate, 50);
        };
        animate();
    };

    const stopSpinAnimation = () => {
        if (spinAnimationRef.current) {
            clearTimeout(spinAnimationRef.current);
            spinAnimationRef.current = undefined;
        }
    };

    // Listen for V5 SpinResult events
    useEffect(() => {
        if (!contract || !account) return;
// V4 Event Signature: (player, sequenceNumber, payout, jackpotWon, reels, winningPaylines, isBonusGame, timestamp)
        const handleSpinResult = async (
            playerAddr: string,
            sequenceNumber: bigint,
            payout: bigint,
            jackpotWon: bigint,
            reels: number[],
            winningPaylines: number[],
            _isBonusGame: boolean,
            _timestamp: bigint,
            _event: any
        ) => {

            if (playerAddr.toLowerCase() !== account.toLowerCase()) {
                return;
            }

            const seqNum = sequenceNumber.toString();
            if (processedSequenceNumbers.current.has(seqNum)) {
return;
            }

            processSpinResult({
                payout,
                jackpotWon,
                reels,
                winningPaylines
            }, seqNum);
        };

        contract.on('SpinResult', handleSpinResult);

        return () => {
            contract.off('SpinResult', handleSpinResult);
        };
    }, [contract, account, processSpinResult]);

    // Listen for FreeSpinsAwarded event
    useEffect(() => {
        if (!contract || !account) return;

        const handleFreeSpinsAwarded = (
            playerAddr: string,
            spinsAwarded: bigint,
            totalFreeSpins: bigint,
            _timestamp: bigint,
            _sequenceNumber: bigint
        ) => {
            if (playerAddr.toLowerCase() === account.toLowerCase()) {
                setFreeSpinsCount(Number(totalFreeSpins));
                toast.success(`🎁 Awarded ${Number(spinsAwarded)} Free Spins! Total: ${Number(totalFreeSpins)}`);
                sounds.freeSpin.play();
            }
        };

        contract.on('FreeSpinsAwarded', handleFreeSpinsAwarded);

        return () => {
            contract.off('FreeSpinsAwarded', handleFreeSpinsAwarded);
        };
    }, [contract, account]);

    // Periodic jackpot and stats refresh (every 10 seconds) to show progressive increase
    useEffect(() => {
        if (!contract) return;

        // Initial refresh
        refreshJackpot();
        refreshPlayerStats();

        // Refresh every 10 seconds to show progressive jackpot and stats growing
        const refreshInterval = setInterval(() => {
            refreshJackpot();
            refreshPlayerStats();
        }, 10000);

        return () => {
            clearInterval(refreshInterval);
        };
    }, [contract, refreshJackpot, refreshPlayerStats]);

    useEffect(() => {
        return () => {
            stopSpinAnimation();
        };
    }, []);

    const adjustBet = (amount: number) => {
        const newBet = Math.max(MIN_BET, Math.min(MAX_BET, betAmount + amount));
        setBetAmount(newBet);
    };

    const setBetToMax = () => {
        const maxAffordable = Math.min(MAX_BET, databaseGold);
        setBetAmount(maxAffordable);
    };

    const modalContent = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 overscroll-none"
            style={{ zIndex: 9999 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border-2 border-[#FFD700] p-4 md:p-6 max-w-4xl w-full h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto overflow-x-hidden font-bbs pb-safe-bottom"
                style={{
                    touchAction: 'pan-y'
                }}
            >
                {/* Header */}
                <div className="text-center mb-4 md:mb-6">
                    <div className="text-2xl md:text-4xl font-bold text-[#FFD700] text-glow-gold mb-1 md:mb-2">
                        🎰 CRIME LIZARD SLOTS 🎰
                    </div>
                    <div className="text-xs md:text-sm text-gray-400 mb-1">
                        Spin the reels and win big! Test your luck!
                    </div>
                    <div className="text-xs text-gray-400 hidden md:block">
                        ⚡ <strong className="text-[#FFD700]">Free to Play</strong> • <strong className="text-[#00FF88]">Instant Wins</strong> • <strong className="text-[#FFD700]">Progressive Jackpot</strong>
                    </div>
                </div>

                {/* Free Spins Counter */}
                {freeSpinsCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-black border-2 border-[#FFD700]"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🎁</span>
                                <div>
                                    <div className="text-[#FFD700] font-bold">
                                        {freeSpinsCount} Free Spin{freeSpinsCount !== 1 ? 's' : ''} Available!
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Next spin is FREE (no gold required) • 2.5x Multiplier!
                                    </div>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-[#FFD700]">
                                {freeSpinsCount}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-2 md:gap-3 mb-4">
                    <div className="bg-black border border-[#FFD700] p-2 md:p-3 text-center">
                        <div className="text-[#FFD700] text-base md:text-2xl font-bold">{databaseGold.toLocaleString()}</div>
                        <div className="text-[10px] md:text-xs text-gray-400">Gold Available</div>
                    </div>
                    <div className="bg-black border border-[#00FF88] p-2 md:p-3 text-center">
                        <div className="text-[#00FF88] text-base md:text-2xl font-bold">{lastWin.toLocaleString()}</div>
                        <div className="text-[10px] md:text-xs text-gray-400">Last Win</div>
                    </div>
                    <div className="bg-black border border-gray-700 p-2 md:p-3 text-center">
                        <div className="text-white text-base md:text-2xl font-bold">{spinsCount}</div>
                        <div className="text-[10px] md:text-xs text-gray-400">Spins Today</div>
                    </div>
                    <div className="bg-black border border-[#FFD700] p-2 md:p-3 text-center">
                        <div className="text-[#FFD700] text-base md:text-2xl font-bold">{jackpotAmount.toLocaleString()}</div>
                        <div className="text-[10px] md:text-xs text-gray-400">Progressive Jackpot</div>
                    </div>
                </div>

                {/* Slot Machine */}
                <div className={`bg-black border-2 p-6 mb-4 transition-all duration-300 ${
                    freeSpinsCount > 0 ? 'border-[#FFD700] animate-pulse' :
                    winAmount > 0 ? 'border-[#00FF88]' : 'border-gray-700'
                    }`}>
                    {/* Free Spin Indicator */}
                    {freeSpinsCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-4 p-3 bg-black border border-[#FFD700]"
                        >
                            <div className="text-2xl font-bold text-[#FFD700] animate-pulse">
                                🎁 FREE SPIN MODE ACTIVE! 🎁
                            </div>
                            <div className="text-sm text-gray-400">
                                Playing with house money • {freeSpinsCount} spin{freeSpinsCount !== 1 ? 's' : ''} remaining!
                            </div>
                        </motion.div>
                    )}

                    {/* Reels Display */}
                    <div className="flex justify-center gap-1 md:gap-2 mb-4">
                        {reels.map((reel, colIndex) => (
                            <div key={colIndex} className="flex flex-col gap-1 md:gap-2">
                                {reel.map((symbol, rowIndex) => {
                                    const posKey = `${colIndex}-${rowIndex}`;
                                    const isWinning = winningPositions.has(posKey);

                                    return (
                                        <motion.div
                                            key={`${colIndex}-${rowIndex}`}
                                            animate={{
                                                scale: isWinning ? [1, 1.2, 1] : 1,
                                                rotate: spinning ? [0, 360] : 0,
                                            }}
                                            transition={{
                                                scale: { repeat: isWinning ? Infinity : 0, duration: 0.5 },
                                                rotate: { duration: 0.1, ease: 'linear' }
                                            }}
                                            className={`
                                                w-12 h-12 md:w-16 md:h-16 flex items-center justify-center
                                                ${freeSpinsCount > 0 ? 'bg-gradient-to-br from-yellow-900/40 to-orange-900/30' : 'bg-gradient-to-br from-gray-800 to-black'}
                                                border-2 md:border-3 rounded-lg p-0.5 md:p-1
                                                ${isWinning ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : freeSpinsCount > 0 ? 'border-yellow-500/60' : 'border-gray-600'}
                                                ${spinning ? 'blur-sm' : ''}
                                            `}
                                        >
                                            <img
                                                src={symbol}
                                                alt="symbol"
                                                className="w-full h-full object-contain"
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Win Display */}
                    <AnimatePresence>
                        {winAmount > 0 && !spinning && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="text-center mb-4"
                            >
                                <div className="text-3xl md:text-5xl font-bold text-yellow-400 text-glow-yellow animate-pulse">
                                    +{winAmount.toLocaleString()} GOLD
                                </div>
                                <div className="text-xs md:text-sm text-green-400">
                                    {betAmount > 0 ? `${Math.floor(winAmount / betAmount)}x multiplier!` : '🎁 FREE SPIN WIN! 🎁'}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Betting Controls */}
                <div className="bg-black/60 border-2 border-cyan-500 p-4 mb-4">
                    <div className="text-cyan-400 font-bold mb-3 text-center">
                        {freeSpinsCount > 0 ? '🎁 Free Spin Ready!' : 'Place Your Bet'}
                    </div>

                    <div className="flex items-center justify-center gap-3 mb-3">
                        {/* Hide -50/-10/+10/+50 buttons on mobile */}
                        <button
                            onClick={() => adjustBet(-50)}
                            disabled={spinning || betAmount <= MIN_BET || freeSpinsCount > 0}
                            className="hidden md:block px-4 py-2 bg-red-900 border-2 border-red-500 text-red-300 font-bold hover:bg-red-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            -50
                        </button>
                        <button
                            onClick={() => adjustBet(-10)}
                            disabled={spinning || betAmount <= MIN_BET || freeSpinsCount > 0}
                            className="hidden md:block px-4 py-2 bg-red-900 border-2 border-red-500 text-red-300 font-bold hover:bg-red-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            -10
                        </button>

                        <div className="bg-black border-3 border-yellow-500 px-6 md:px-8 py-2 md:py-3 min-w-[120px] md:min-w-[150px] text-center">
                            <div className="text-2xl md:text-3xl font-bold text-yellow-400">{betAmount}</div>
                            <div className="text-xs text-gray-400">gold</div>
                        </div>

                        <button
                            onClick={() => adjustBet(10)}
                            disabled={spinning || betAmount >= MAX_BET || freeSpinsCount > 0}
                            className="hidden md:block px-4 py-2 bg-[#00AA55] border-2 border-[#00FF88] text-green-300 font-bold hover:bg-[#00BB66] disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            +10
                        </button>
                        <button
                            onClick={() => adjustBet(50)}
                            disabled={spinning || betAmount >= MAX_BET || freeSpinsCount > 0}
                            className="hidden md:block px-4 py-2 bg-[#00AA55] border-2 border-[#00FF88] text-green-300 font-bold hover:bg-[#00BB66] disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            +50
                        </button>
                    </div>

                    <div className="flex gap-2 justify-center mb-4 flex-wrap">
                        {BET_INCREMENTS.map(amount => (
                            <button
                                key={amount}
                                onClick={() => setBetAmount(amount)}
                                disabled={spinning || amount > databaseGold || freeSpinsCount > 0}
                                className="px-3 py-1 bg-black border border-gray-700 text-white text-sm hover:border-[#00FF88] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                {amount}
                            </button>
                        ))}
                        <button
                            onClick={setBetToMax}
                            disabled={spinning || freeSpinsCount > 0}
                            className="px-3 py-1 bg-black border border-gray-700 text-white text-sm hover:border-[#FFD700] font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            MAX
                        </button>
                    </div>

                    {/* Spin Button */}
                    <button
                        onClick={spin}
                        disabled={spinning || isProcessingTx || (freeSpinsCount === 0 && (betAmount > databaseGold || betAmount < MIN_BET)) || !contract}
                        className={`w-full py-4 border-2 text-2xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${freeSpinsCount > 0
                            ? 'bg-[#00AA55] border-[#FFD700] text-[#FFD700] hover:bg-[#00BB66]'
                            : 'bg-[#00AA55] border-[#00FF88] text-[#00FF88] hover:bg-[#00BB66]'
                            }`}
                    >
                        {isProcessingTx ? '⏳ PROCESSING...' : spinning ? '🎰 SPINNING...' : freeSpinsCount > 0 ? '🎁 FREE SPIN!' : '🎰 SPIN'}
                    </button>
                </div>

                {/* Payout Table */}
                <div className="bg-black border-2 border-[#FFD700] p-3 md:p-4 mb-4">
                    <div className="text-[#FFD700] text-glow-gold font-bold mb-2 text-center text-sm md:text-base">💰 Symbol Payouts</div>
                    <div className="grid grid-cols-2 gap-1 md:gap-2 text-xs mb-3">
                        {Object.entries(PAYOUTS).filter(([idx]) => parseInt(idx) < 8).map(([symbolIndex, multipliers]) => {
                            const idx = parseInt(symbolIndex);
                            return (
                                <div key={symbolIndex} className="flex items-center justify-between bg-black/50 p-1.5 md:p-2 border border-gray-700">
                                    <div className="flex items-center gap-1 md:gap-2">
                                        <img src={SYMBOLS[idx]} alt={SYMBOL_NAMES[idx]} className="w-5 h-5 md:w-6 md:h-6 object-contain" />
                                        <span className="text-gray-300 text-[10px] md:text-xs">{SYMBOL_NAMES[idx]}</span>
                                    </div>
                                    <span className="text-gray-400 text-[10px] md:text-xs">
                                        {multipliers[2]}x / {multipliers[3]}x / {multipliers[4]}x
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="border-t border-gray-700 pt-2 space-y-1">
                        <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs">
                            <img src={SYMBOLS[8]} alt="BNB" className="w-4 h-4 md:w-5 md:h-5 object-contain flex-shrink-0" />
                            <span className="text-yellow-400">🎰 BNB: Jackpot (5+ anywhere)</span>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs">
                            <img src={SYMBOLS[9]} alt="SCATTER" className="w-4 h-4 md:w-5 md:h-5 object-contain flex-shrink-0" />
                            <span className="text-cyan-400">🎁 SCATTER: 3=10, 4=15, 5=25 FREE SPINS</span>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs">
                            <img src={SYMBOLS[2]} alt="LIZARD" className="w-4 h-4 md:w-5 md:h-5 object-contain flex-shrink-0" />
                            <span className="text-green-400">🦎 LIZARD: 3+ BONUS GAME</span>
                        </div>
                    </div>
                </div>

                {/* Session Stats */}
                <div className="bg-black border-2 border-[#00FF88] p-3 mb-4 text-sm">
                    <div className="text-center text-[#00FF88] font-bold mb-2">Session Stats</div>
                    <div className="grid grid-cols-2 gap-2 text-gray-400 mb-3">
                        <div>Won: <span className="text-[#00FF88] font-bold">{totalWon.toLocaleString()}</span></div>
                        <div>Lost: <span className="text-red-400 font-bold">{totalLost.toLocaleString()}</span></div>
                        <div>Net: <span className={`font-bold ${totalWon - totalLost >= 0 ? 'text-[#00FF88]' : 'text-red-400'}`}>
                            {(totalWon - totalLost).toLocaleString()}
                        </span></div>
                        <div>Spins: <span className="text-[#FFD700] font-bold">{spinsCount}</span></div>
                    </div>

                    {/* All-Time Stats */}
                    <div className="border-t border-gray-700 pt-2">
                        <div className="text-center text-[#FFD700] font-bold mb-2 text-xs">All-Time Casino Stats</div>
                        <div className="grid grid-cols-2 gap-2 text-gray-500 text-xs">
                            <div>Total Spins: <span className="text-purple-300">{(player.casinoSpins || 0).toLocaleString()}</span></div>
                            <div>Biggest Win: <span className="text-yellow-300">{(player.casinoBiggestWin || 0).toLocaleString()}</span></div>
                            <div>Total Won: <span className="text-green-300">{(player.casinoGoldWon || 0).toLocaleString()}</span></div>
                            <div>Total Lost: <span className="text-red-300">{(player.casinoGoldLost || 0).toLocaleString()}</span></div>
                        </div>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={spinning || isProcessingTx}
                    className="w-full px-4 py-3 bg-black border-2 border-gray-700 text-gray-400 hover:border-[#00FF88] hover:text-[#00FF88] font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {(spinning || isProcessingTx) ? 'Wait for spin to finish...' : '[ESC] Leave Casino'}
                </button>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default Casino;