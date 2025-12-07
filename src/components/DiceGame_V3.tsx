/**
 * CRIME LIZARD DICE - Roll the dice and win big!
 */

import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../providers/WalletContext';
import { useCharacter } from '../contexts/CharacterContext';
import { useGameFAI } from './GameAI';
import { ethers } from 'ethers';
import { Howl } from 'howler';
import { getNetworkConfig } from '../config/contracts';
import { DICE_V5_ABI } from '../diceV5Abi';
const DICE_ABI = DICE_V5_ABI;
import '../App.css';

// Dice Contract Type
type CrimeLizardDice = ethers.BaseContract & {
    // Character management
    selectCharacter(tokenId: bigint): Promise<ethers.TransactionResponse>;
    getActiveCharacter(player: string): Promise<bigint>;

    // Game functions
    roll(betAmount: bigint, userRandomNumber: string, overrides?: ethers.Overrides): Promise<ethers.TransactionResponse>;
    getPlayerStats(address: string): Promise<any>;
    getDiceName(total: bigint): Promise<string>;
    getPayoutForTotal(total: bigint): Promise<bigint>;
    jackpot(): Promise<bigint>;

    // Events
    on(event: string, listener: (...args: any[]) => void): ethers.BaseContract;
    off(event: string, listener: (...args: any[]) => void): ethers.BaseContract;
};

interface DiceGameState {
    betAmount: string;
    dice1: number;
    dice2: number;
    total: number;
    multiplier: number;
    winAmount: number;
    isRolling: boolean;
    lastResults: Array<{ total: number; won: boolean; amount: number; name: string; timestamp: number }>;
    banterMessage: string;
    banterType: 'idle' | 'rolling' | 'win' | 'loss' | 'bigwin' | 'jackpot';
    sessionStats: {
        rolls: number;
        wins: number;
        losses: number;
        totalWagered: number;
        totalWon: number;
    };
    jackpotAmount: string;
}

// Dice payout multipliers (from V5 contract - ~92% RTP, every roll pays!)
// Categories: JACKPOT (3x), WIN (1.5x), BREAK EVEN (1x), SMALL LOSS (0.5-0.8x)
const PAYTABLE_FULL = [
    { total: 2, multiplier: 3.0, name: 'Snake Eyes', emoji: '🐍', color: 'from-yellow-400 to-yellow-600', probability: '2.78%', tier: 'jackpot' },
    { total: 3, multiplier: 1.5, name: 'Ace Deuce', emoji: '🎯', color: 'from-green-500 to-green-700', probability: '5.56%', tier: 'win' },
    { total: 4, multiplier: 1.0, name: 'Easy Four', emoji: '🎲', color: 'from-blue-500 to-blue-700', probability: '8.33%', tier: 'even' },
    { total: 5, multiplier: 0.8, name: 'Fever Five', emoji: '📉', color: 'from-gray-500 to-gray-700', probability: '11.11%', tier: 'loss' },
    { total: 6, multiplier: 0.6, name: 'Sixer', emoji: '📉', color: 'from-gray-500 to-gray-700', probability: '13.89%', tier: 'loss' },
    { total: 7, multiplier: 0.5, name: 'Lucky Seven', emoji: '💸', color: 'from-red-500 to-red-700', probability: '16.67%', tier: 'loss' },
    { total: 8, multiplier: 0.6, name: 'Easy Eight', emoji: '📉', color: 'from-gray-500 to-gray-700', probability: '13.89%', tier: 'loss' },
    { total: 9, multiplier: 0.8, name: 'Nina', emoji: '📉', color: 'from-gray-500 to-gray-700', probability: '11.11%', tier: 'loss' },
    { total: 10, multiplier: 1.0, name: 'Big Dick', emoji: '🎲', color: 'from-blue-500 to-blue-700', probability: '8.33%', tier: 'even' },
    { total: 11, multiplier: 1.5, name: 'Yo-leven', emoji: '🎊', color: 'from-green-500 to-green-700', probability: '5.56%', tier: 'win' },
    { total: 12, multiplier: 3.0, name: 'Boxcars', emoji: '🚂', color: 'from-yellow-400 to-yellow-600', probability: '2.78%', tier: 'jackpot' }
];


// Fun banter messages for engagement
const FUNNY_BANTER = {
    idle: [
        "🦎 Roll those bones, lizard! What're you waiting for?",
        "🎲 The dice are getting bored... and slightly judgemental.",
        "💰 Your gold is looking mighty lonely in that wallet...",
        "🎯 Fortune favors the bold! (And sometimes the foolish.)",
        "⚡ These dice have seen things. They're ready for more chaos.",
        "🌟 Legend says the next roll could be THE ONE. (Legend is a compulsive liar.)",
        "🎪 Step right up! Win gold with style!",
        "🦎 Even lizards gotta gamble sometimes. It's in the bylaws."
    ],
    rolling: [
        "🎲 Here we gooooo!",
        "⚡ Rolling the dice...",
        "🌪️ Tumbling through destiny!",
        "✨ May the odds be ever in your... ah who am I kidding",
        "🎯 *nervous lizard noises*",
        "🔮 Calculating randomness...",
        "💫 Physics doing its physics thing!"
    ],
    smallWin: [
        "🎉 Nice! You came out ahead!",
        "💰 Cha-ching! Actual profit!",
        "🦎 The lizard approves of this outcome!",
        "⭐ Look at you, winning and stuff!",
        "🎊 That's a real win! Keep it going!",
        "💵 Profit in the pocket!",
        "🌟 You're on a roll! Literally!"
    ],
    breakEven: [
        "🎲 Break even! Could be worse!",
        "😎 Neither won nor lost. The Zen roll.",
        "🔄 Your gold is safe... for now.",
        "⚖️ Perfectly balanced, as all things should be.",
        "🦎 The lizard neither approves nor disapproves."
    ],
    bigWin: [
        "🔥 HOLY LIZARDS! SNAKE EYES OR BOXCARS!",
        "💎 *jazz hands* 3X MULTIPLIER!",
        "🚀 TO THE MOON! RARE ROLL PAYS BIG!",
        "⚡ SOMEBODY CALL THE FIRE DEPARTMENT! 🔥",
        "🎰 BIG WIN ENERGY! The dice are blessed!",
        "👑 YOU MAGNIFICENT GAMBLING GECKO!",
        "💰 *confetti cannon noises* KA-CHING!",
        "🦎 The Crime Lizard sheds a proud tear!"
    ],
    jackpot: [
        "💎💎💎 JACKPOT! JACKPOT! JACKPOT! 💎💎💎",
        "🚨 HOLY MOTHER OF LIZARDS! JACKPOT! 🚨",
        "🎰 THE DICE GODS HAVE BLESSED YOU! 🎰",
        "💰 RETIRE NOW! YOU'VE PEAKED! 💰",
        "👑 LEGENDARY ROLL! FRAME THIS MOMENT! 👑"
    ],
    smallLoss: [
        "📉 Slight loss, but you got something back!",
        "🎲 Not a winner, but not a total wipeout either.",
        "💸 Lost a bit, but could've been worse!",
        "🦎 The dice giveth a little back...",
        "😅 Small drain on the wallet. Roll again!",
        "🎯 Partial refund! Glass half full!"
    ],
    loss: [
        "😬 Ooof. Lucky Seven strikes again!",
        "🎲 The most common roll... the smallest payout.",
        "💸 Half your bet gone. Classic seven.",
        "🦎 Even lizards hate rolling sevens.",
        "😅 That's the house edge at work!",
        "🎯 Seven - the gambler's curse!",
        "🌧️ Most likely outcome, least favorite result.",
        "💀 Don't worry, sevens can't last forever!",
        "🎪 The house thanks you for your contribution.",
        "😔 *plays tiny violin for the seven*"
    ]
};

// Sound effects
const sounds = {
    roll: new Howl({ src: ['/assets/spin.mp3'], volume: 0.3 }),
    win: new Howl({ src: ['/assets/win.mp3'], volume: 0.4 }),
    bigWin: new Howl({ src: ['/assets/jackpot.mp3'], volume: 0.5 }),
    jackpot: new Howl({ src: ['/assets/jackpot.mp3'], volume: 0.6 }),
    loss: new Howl({ src: ['/assets/near-miss.mp3'], volume: 0.2 }),
};

const DiceFace: React.FC<{ value: number }> = ({ value }) => {
    const dotPositions = [
        [], // 0
        [[2, 2]], // 1 - center
        [[1, 1], [3, 3]], // 2 - opposite corners
        [[1, 1], [2, 2], [3, 3]], // 3 - diagonal
        [[1, 1], [1, 3], [3, 1], [3, 3]], // 4 - four corners
        [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]], // 5 - four corners + center
        [[1, 1], [2, 1], [3, 1], [1, 3], [2, 3], [3, 3]], // 6 - two columns
    ][value] || [];

    return (
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0 p-2">
            {dotPositions.map(([row, col], index) => (
                <div
                    key={index}
                    style={{
                        gridRowStart: row,
                        gridColumnStart: col
                    }}
                    className="flex items-center justify-center"
                >
                    <div className="w-6 h-6 bg-black rounded-full" />
                </div>
            ))}
        </div>
    );
};

interface DiceGameProps {
    onClose?: () => void; // Optional callback when closing from parent (e.g., TerminalTownSquare)
}

const DiceGame: React.FC<DiceGameProps> = ({ onClose }) => {
const navigate = useNavigate();
    const isNavigatingRef = useRef(false);
    const { account, connectWallet, provider, currentChainId } = useContext(WalletContext);
    const { selectedCharacter, refreshGoldBalance } = useCharacter();
    const { notifyGameEvent } = useGameFAI();

    // Database gold balance (source of truth)
    const [databaseGold, setDatabaseGold] = useState<number>(0);

    // Blockchain state
    const [contract, setContract] = useState<CrimeLizardDice | null>(null);
    const [isProcessingTx, setIsProcessingTx] = useState(false);
    const processedSequenceNumbers = useRef<Set<string>>(new Set());

    // Track selected character to prevent duplicate selections
    const diceSelectedCharacterRef = useRef<string | null>(null);

    // Store bet amount in ref to avoid re-creating processRollResult
    const betAmountRef = useRef<string>('10');

    // Store notifyGameEvent in ref to avoid infinite loops
    const notifyGameEventRef = useRef(notifyGameEvent);
    useEffect(() => {
        notifyGameEventRef.current = notifyGameEvent;
    }, [notifyGameEvent]);

    // Store refreshGoldBalance in ref to avoid re-creating callbacks
    const refreshGoldBalanceRef = useRef(refreshGoldBalance);
    useEffect(() => {
        refreshGoldBalanceRef.current = refreshGoldBalance;
    }, [refreshGoldBalance]);

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
            console.error('❌ Dice: Failed to fetch database gold:', error);
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

                return data;
            } else {
                console.error('❌ Dice: Failed to update database gold:', await response.text());
            }
        } catch (error) {
            console.error('❌ Dice: Failed to update database gold:', error);
        }
    }, [account, selectedCharacter]);

    // Game state
    const [gameState, setGameState] = useState<DiceGameState>({
        betAmount: '10',
        dice1: 1,
        dice2: 1,
        total: 2,
        multiplier: 0,
        winAmount: 0,
        isRolling: false,
        lastResults: [],
        banterMessage: FUNNY_BANTER.idle[0],
        banterType: 'idle',
        sessionStats: {
            rolls: 0,
            wins: 0,
            losses: 0,
            totalWagered: 0,
            totalWon: 0
        },
        jackpotAmount: '0'
    });

    // Handle ESC key to navigate back or call onClose callback
    const handleClose = useCallback(() => {
        if (gameState.isRolling || isProcessingTx) {
            return; // Don't allow closing while rolling or processing
        }
isNavigatingRef.current = true;

        // If onClose prop is provided (opened from TerminalTownSquare), use it
        // Otherwise navigate to home route (opened via /dice route)
        if (onClose) {
            onClose();
        } else {
            navigate('/');
        }
    }, [onClose, navigate, gameState.isRolling, isProcessingTx]);

    // Handle ESC key press
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                handleClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [handleClose]);

    // Initialize dice contract
    useEffect(() => {
        let wsProvider: ethers.WebSocketProvider | null = null;

        const initContract = async () => {
            if (!provider || !currentChainId) return;

            const networkConfig = getNetworkConfig(currentChainId);
            if (!networkConfig) {
                console.error('❌ Dice: Unsupported network:', currentChainId);
                return;
            }

            const contractAddress = networkConfig.contracts.dice;
            if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
                console.error('❌ Dice: Contract not deployed on this network');
                return;
            }

            try {
                // Create HTTP contract for transactions
                const cont = new ethers.Contract(contractAddress, DICE_ABI, provider) as unknown as CrimeLizardDice;
                setContract(cont);

                // Query jackpot (with retry logic for network issues)
                try {
                    const jp = await cont.jackpot();
                    setGameState(prev => ({ ...prev, jackpotAmount: jp.toString() }));
                } catch (error: any) {
                    // Silently fail for initial query - contract may still be syncing
                    if (!error.message?.includes('missing revert data')) {
                        console.error('Failed to query jackpot:', error);
                    }
                }
// Set up WebSocket for real-time events
                if (networkConfig.wsRpcUrls && networkConfig.wsRpcUrls.length > 0 && networkConfig.wsRpcUrls[0]) {
                    try {
                        wsProvider = new ethers.WebSocketProvider(networkConfig.wsRpcUrls[0]);
                        await wsProvider.getBlockNumber();
                        const wsContract = new ethers.Contract(contractAddress, DICE_ABI, wsProvider) as unknown as CrimeLizardDice;
                        setContract(wsContract);
} catch (wsError) {
                        console.warn('⚠️ Dice: WebSocket failed, using HTTP fallback:', wsError);
                    }
                }
            } catch (error) {
                console.error('❌ Dice: Failed to initialize contract:', error);
            }
        };

        initContract();

        return () => {
            if (wsProvider) {
                wsProvider.destroy();
            }
        };
    }, [provider, currentChainId]);

    // Check if character is already selected on contract (read-only, no wallet popup)
    useEffect(() => {
        if (!contract || !selectedCharacter || !account) {
            return;
        }

        const checkCharacterSelection = async () => {
            try {
                const activeChar = await contract.getActiveCharacter(account);
                if (activeChar.toString() === selectedCharacter.tokenId.toString()) {
                    // Already selected on contract
                    diceSelectedCharacterRef.current = selectedCharacter.tokenId.toString();
                }
            } catch (error) {
                console.error('❌ Dice: Failed to check character selection:', error);
            }
        };

        checkCharacterSelection();
    }, [contract, selectedCharacter?.tokenId, account]);

    // Function to select character on contract (called on demand, not automatically)
    const selectCharacterOnContract = useCallback(async (): Promise<boolean> => {
        if (!contract || !selectedCharacter || !account || !provider) {
            return false;
        }

        const characterIdString = selectedCharacter.tokenId.toString();

        // Already selected
        if (diceSelectedCharacterRef.current === characterIdString) {
            return true;
        }

        try {
            // Check if character is already selected on contract
            const activeChar = await contract.getActiveCharacter(account);

            if (activeChar.toString() === characterIdString) {
                diceSelectedCharacterRef.current = characterIdString;
                return true;
            }

            // Need to select - this will trigger wallet popup
            toast.info(`Selecting ${selectedCharacter.name} for Dice...`, { autoClose: 3000 });

            const signer = await provider.getSigner();
            const contractWithSigner = contract.connect(signer) as CrimeLizardDice;

            const tx = await contractWithSigner.selectCharacter(selectedCharacter.tokenId);
            await tx.wait();
            diceSelectedCharacterRef.current = characterIdString;

            toast.success(`${selectedCharacter.name} selected for Dice!`, { autoClose: 2000 });
            return true;
        } catch (error: any) {
            console.error('❌ Dice: Failed to select character:', error);
            if (error.code !== 'ACTION_REJECTED') {
                toast.error(`Failed to select character: ${error.message || 'Unknown error'}`, { autoClose: 5000 });
            }
            return false;
        }
    }, [contract, selectedCharacter, account, provider]);

    // Fetch database gold when character changes
    useEffect(() => {
        fetchDatabaseGold();
    }, [fetchDatabaseGold, selectedCharacter?.tokenId]);

    // Change idle banter periodically
    useEffect(() => {
        const interval = setInterval(() => {
            if (gameState.banterType === 'idle' && !gameState.isRolling) {
                const randomBanter = FUNNY_BANTER.idle[Math.floor(Math.random() * FUNNY_BANTER.idle.length)];
                setGameState(prev => ({ ...prev, banterMessage: randomBanter }));
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [gameState.banterType, gameState.isRolling]);

    const getRandomBanter = (type: keyof typeof FUNNY_BANTER) => {
        const banters = FUNNY_BANTER[type];
        return banters[Math.floor(Math.random() * banters.length)];
    };

    const calculatePayout = (total: number, betAmount: number): { multiplier: number; winAmount: number; name: string } => {
        const result = PAYTABLE_FULL.find(p => p.total === total);
        if (result && result.multiplier > 0) {
            return {
                multiplier: result.multiplier,
                winAmount: betAmount * result.multiplier,
                name: result.name
            };
        }
        return { multiplier: 0, winAmount: 0, name: result?.name || 'Loss' };
    };

    /**
     * Roll dice with on-chain randomness
     */
    const rollDice = useCallback(async () => {
        if (gameState.isRolling || isProcessingTx) {
            return;
        }

        if (!account) {
            connectWallet();
            toast.error('Please connect your wallet first!');
            return;
        }

        if (!selectedCharacter) {
            toast.error('Please select a character first!');
            return;
        }

        if (!contract || !provider) {
            toast.error('Dice contract not initialized. Please refresh the page.');
            return;
        }

        // Verify user is on mainnet before any roll
        if (currentChainId !== 56) {
            toast.error('Please switch to BNB Mainnet to play!');
            return;
        }

        // Ensure character is selected on the Dice contract (will prompt wallet if needed)
        const characterSelected = await selectCharacterOnContract();
        if (!characterSelected) {
            return;
        }

        const betAmountNum = parseFloat(betAmountRef.current);
        if (betAmountNum <= 0) {
            toast.error('Bet amount must be greater than 0!');
            return;
        }

        if (betAmountNum > databaseGold) {
            toast.error('Insufficient gold balance!');
            return;
        }

        try {
            setIsProcessingTx(true);
            setGameState(prev => ({
                ...prev,
                isRolling: true,
                banterMessage: getRandomBanter('rolling'),
                banterType: 'rolling'
            }));

            // Get signer
            const signer = await provider.getSigner();
            const contractWithSigner = contract.connect(signer) as CrimeLizardDice;

            // Generate user randomness
            const userRandomNumber = ethers.hexlify(ethers.randomBytes(32));
            const betAmountGold = BigInt(betAmountNum);


            // Notify AI (convert BigInt to string for JSON serialization)
            notifyGameEventRef.current({
                type: 'bet',
                game: 'slots', // Using 'slots' as proxy since dice isn't in type
                player: account,
                amount: betAmountRef.current,
                details: { characterId: selectedCharacter.tokenId.toString(), actualGame: 'dice' }
            });

            // Play roll sound
            sounds.roll.play();

            // Start dice animation (optimistic UI)
            const animationDuration = 1500;
            const frameRate = 100;
            const frames = animationDuration / frameRate;
            let currentFrame = 0;

            const animationInterval = setInterval(() => {
                setGameState(prev => ({
                    ...prev,
                    dice1: Math.floor(Math.random() * 6) + 1,
                    dice2: Math.floor(Math.random() * 6) + 1
                }));
                currentFrame++;

                if (currentFrame >= frames) {
                    clearInterval(animationInterval);
                }
            }, frameRate);

            toast.info('🎲 Rolling dice...', { autoClose: 2000 });

            // Send blockchain transaction
            const tx = await contractWithSigner.roll(betAmountGold, userRandomNumber, { gasLimit: 1000000 });
            toast.info('⏳ Processing transaction...', { autoClose: 2000 });

            const receipt = await tx.wait();
setIsProcessingTx(false);

            // V4: Instant randomness - parse RollResult event from receipt logs!
            if (receipt && receipt.logs) {

                let foundEvent = false;
                for (const log of receipt.logs) {
                    try {
                        const parsedLog = contract.interface.parseLog({
                            topics: [...log.topics],
                            data: log.data
                        });

                        if (parsedLog && parsedLog.name === 'RollResult') {
                            foundEvent = true;
                            const args = parsedLog.args;
                            const sequenceNumber = args.sequenceNumber?.toString();

                            // Check if already processed
                            if (sequenceNumber && processedSequenceNumbers.current.has(sequenceNumber)) {
continue;
                            }

                            if (sequenceNumber) {
                                processedSequenceNumbers.current.add(sequenceNumber);
                            }


                            // Stop animation
                            clearInterval(animationInterval);

                            processRollResult(args);
                            break;
                        }
                    } catch (parseError) {
                        // Not a RollResult event, continue
                        continue;
                    }
                }

                if (!foundEvent) {
                    console.warn('⚠️ Dice V4: No RollResult event found in receipt');
                    clearInterval(animationInterval);
                    toast.warning('Result not found. Refreshing balance...', { autoClose: 3000 });
                    setGameState(prev => ({ ...prev, isRolling: false, banterType: 'idle', banterMessage: getRandomBanter('idle') }));
                    refreshGoldBalanceRef.current();
                }
            } else {
                console.error('❌ Dice V4: No receipt or logs available');
                clearInterval(animationInterval);
                toast.error('Transaction confirmed but result unclear. Check your balance.');
                setGameState(prev => ({ ...prev, isRolling: false, banterType: 'idle', banterMessage: getRandomBanter('idle') }));
                refreshGoldBalanceRef.current();
            }

        } catch (error: any) {
            console.error('❌ Dice: Roll error:', error);
            setGameState(prev => ({ ...prev, isRolling: false, banterType: 'idle' }));
            setIsProcessingTx(false);

            if (error.code === 'ACTION_REJECTED') {
                toast.error('Transaction cancelled');
            } else if (error.message?.includes('insufficient funds')) {
                toast.error('Insufficient BNB for gas fees. Please add BNB to your wallet.');
            } else if (error.message?.includes('execution reverted')) {
                // Provide more helpful error message for common contract reverts
                const possibleReasons = [
                    '• You may need more BNB for gas fees',
                    '• Character might not be selected on contract',
                    '• Contract might be paused or under maintenance',
                    '• Minimum bet requirement not met'
                ];
                toast.error(
                    <div>
                        <div>Transaction failed. Possible reasons:</div>
                        {possibleReasons.map((reason, i) => <div key={i} style={{ fontSize: '0.85em' }}>{reason}</div>)}
                    </div>,
                    { autoClose: 8000 }
                );
                console.error('💡 Debug info:', {
                    betAmount: betAmountRef.current,
                    databaseGold,
                    characterId: selectedCharacter?.tokenId.toString(),
                    contractAddress: contract.target
                });
            } else {
                toast.error('Roll failed: ' + (error.reason || error.message || 'Unknown error'));
            }
        }
    }, [gameState.isRolling, isProcessingTx, account, selectedCharacter, contract, provider, databaseGold, connectWallet, selectCharacterOnContract, currentChainId]);

    /**
     * Process roll result from contract event
     */
    const processRollResult = useCallback((args: any) => {
        const dice1 = Number(args.dice1);
        const dice2 = Number(args.dice2);
        const total = Number(args.total);
        const payout = Number(args.payout);
        const jackpotWon = Number(args.jackpotWon);

        // Update dice display
        setGameState(prev => ({
            ...prev,
            dice1,
            dice2,
            total,
            isRolling: false
        }));

        const betAmountNum = parseFloat(betAmountRef.current);
        const { multiplier, name } = calculatePayout(total, betAmountNum);
        const finalPayout = payout + jackpotWon;
        const isJackpot = jackpotWon > 0;

        // Get tier from paytable for proper categorization
        const rollTier = PAYTABLE_FULL.find(p => p.total === total)?.tier || 'loss';

        // Determine outcome type based on tier
        const isExcitingWin = rollTier === 'jackpot'; // 3x multiplier (2 or 12)
        const isWin = rollTier === 'win'; // 1.5x multiplier (3 or 11)
        const isBreakEven = rollTier === 'even'; // 1.0x (4 or 10)
        const isSmallLoss = rollTier === 'loss' && multiplier >= 0.6; // 0.6-0.8x (5, 6, 8, 9)
        // Big loss is when multiplier < 0.6 (rolling a 7 = 0.5x)

        // Calculate gold change (win - bet)
        const goldChange = finalPayout - betAmountNum;
        const actuallyProfited = goldChange > 0;

        // Update database gold immediately (database-first, background sync to blockchain)
        if (goldChange !== 0) {
            updateDatabaseGold(
                goldChange,
                `Dice ${goldChange > 0 ? 'win' : 'loss'}: ${name} (${total})`
            ).catch(err => {
                console.error('❌ Failed to update gold:', err);
            });
        }

        // Determine banter type based on tier
        let banterType: 'idle' | 'rolling' | 'win' | 'loss' | 'bigwin' | 'jackpot' = 'loss';
        let banterKey: keyof typeof FUNNY_BANTER = 'loss';

        if (isJackpot) {
            banterType = 'jackpot';
            banterKey = 'jackpot';
        } else if (isExcitingWin) {
            banterType = 'bigwin';
            banterKey = 'bigWin';
        } else if (isWin) {
            banterType = 'win';
            banterKey = 'smallWin';
        } else if (isBreakEven) {
            banterType = 'win';
            banterKey = 'breakEven';
        } else if (isSmallLoss) {
            banterType = 'loss';
            banterKey = 'smallLoss';
        } else {
            banterType = 'loss';
            banterKey = 'loss';
        }

        // Update game state
        setGameState(prev => ({
            ...prev,
            multiplier,
            winAmount: finalPayout,
            banterMessage: getRandomBanter(banterKey),
            banterType,
            lastResults: [
                { total, won: actuallyProfited, amount: goldChange, name, timestamp: Date.now() },
                ...prev.lastResults.slice(0, 9)
            ],
            sessionStats: {
                rolls: prev.sessionStats.rolls + 1,
                wins: prev.sessionStats.wins + (actuallyProfited ? 1 : 0),
                losses: prev.sessionStats.losses + (actuallyProfited ? 0 : 1),
                totalWagered: prev.sessionStats.totalWagered + betAmountNum,
                totalWon: prev.sessionStats.totalWon + finalPayout
            }
        }));

        // Play sounds and show toasts based on tier
        if (isJackpot) {
            sounds.jackpot.play();
            toast.success(`💎 JACKPOT! ${name}! Won ${finalPayout.toLocaleString()} gold!`, { autoClose: 5000 });

            notifyGameEventRef.current({
                type: 'jackpot',
                game: 'slots',
                player: account!,
                amount: finalPayout.toString(),
                details: { total, multiplier, name, actualGame: 'dice' }
            });
        } else if (isExcitingWin) {
            sounds.bigWin.play();
            toast.success(`🔥 ${name}! 3x WIN! +${finalPayout.toLocaleString()} gold!`, { autoClose: 4000 });

            notifyGameEventRef.current({
                type: 'win',
                game: 'slots',
                player: account!,
                amount: finalPayout.toString(),
                details: { total, multiplier, name, actualGame: 'dice', tier: 'jackpot' }
            });
        } else if (isWin) {
            sounds.win.play();
            toast.success(`🎉 ${name}! 1.5x WIN! +${goldChange.toFixed(0)} gold profit!`, { autoClose: 3000 });

            notifyGameEventRef.current({
                type: 'win',
                game: 'slots',
                player: account!,
                amount: finalPayout.toString(),
                details: { total, multiplier, name, actualGame: 'dice', tier: 'win' }
            });
        } else if (isBreakEven) {
            sounds.win.play();
            toast.info(`🎲 ${name}! Break even - gold returned!`, { autoClose: 2500 });
        } else if (isSmallLoss) {
            sounds.loss.play();
            toast.info(`📉 ${name} (${multiplier}x) - Got ${finalPayout.toFixed(0)} back`, { autoClose: 2000 });
        } else {
            sounds.loss.play();
            toast.warning(`💸 ${name}! Only half back. The seven strikes!`, { autoClose: 2500 });
        }

        // Return to idle after delay
        setTimeout(() => {
            setGameState(prev => ({
                ...prev,
                banterType: 'idle',
                banterMessage: getRandomBanter('idle')
            }));
        }, 5000);
    }, [account, updateDatabaseGold]);

    // Listen for RollResult events
    useEffect(() => {
        if (!contract || !account) return;
const handleRollResult = (
            playerAddr: string,
            sequenceNumber: bigint,
            _characterId: bigint,
            dice1: bigint,
            dice2: bigint,
            total: bigint,
            payout: bigint,
            jackpotWon: bigint,
            _timestamp: bigint
        ) => {

            if (playerAddr.toLowerCase() !== account.toLowerCase()) {
                return;
            }

            const seqNum = sequenceNumber.toString();
            if (processedSequenceNumbers.current.has(seqNum)) {
return;
            }

            processedSequenceNumbers.current.add(seqNum);

            processRollResult({
                dice1,
                dice2,
                total,
                payout,
                jackpotWon
            });
        };

        contract.on('RollResult', handleRollResult);

        return () => {
            contract.off('RollResult', handleRollResult);
        };
    }, [contract, account, processRollResult]);

    const quickBet = (multiplier: number) => {
        const currentBet = parseFloat(gameState.betAmount);
        const newBet = (currentBet * multiplier).toFixed(0);
        betAmountRef.current = newBet;
        setGameState(prev => ({
            ...prev,
            betAmount: newBet
        }));
    };

    // Skip rendering JSX if we're navigating away (after all hooks have been called)
    if (isNavigatingRef.current) {
        return null;
    }

    if (!account) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-modal"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    className="text-center p-8 border-2 border-[#FFD700] bg-black font-bbs"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="text-4xl mb-4 text-[#FFD700] text-glow-gold">🎲 Crime Lizard Dice 🎲</h2>
                    <p className="text-xl mb-6 text-white">Connect your wallet to start rolling!</p>
                    <button
                        onClick={() => connectWallet()}
                        className="px-8 py-4 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] font-bold hover:bg-[#00BB66] transition-all"
                    >
                        Connect Wallet
                    </button>
                    <button
                        onClick={handleClose}
                        className="ml-4 px-8 py-4 bg-black border-2 border-gray-700 text-gray-400 hover:border-[#00FF88] hover:text-[#00FF88] font-bold transition-all"
                    >
                        Close
                    </button>
                </motion.div>
            </motion.div>
        );
    }

    if (!selectedCharacter) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-modal"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    className="text-center p-8 border-2 border-[#FFD700] bg-black font-bbs"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="text-4xl mb-4 text-[#FFD700] text-glow-gold">🎲 Crime Lizard Dice 🎲</h2>
                    <p className="text-xl mb-6 text-white">Please select a character to play!</p>
                    <p className="text-gray-400 mb-6">Use the character selector in the header above</p>
                    <button
                        onClick={handleClose}
                        className="px-8 py-4 bg-black border-2 border-gray-700 text-gray-400 hover:border-[#00FF88] hover:text-[#00FF88] font-bold transition-all"
                    >
                        Close
                    </button>
                </motion.div>
            </motion.div>
        );
    }

    const netProfit = gameState.sessionStats.totalWon - gameState.sessionStats.totalWagered;
    const winRate = gameState.sessionStats.rolls > 0
        ? ((gameState.sessionStats.wins / gameState.sessionStats.rolls) * 100).toFixed(1)
        : '0.0';

    const modalContent = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-0 md:p-4 overscroll-none"
            style={{ zIndex: 9999 }}
            onClick={(e) => {
                // Only close if clicking the backdrop (not the content)
                if (e.target === e.currentTarget && !gameState.isRolling && !isProcessingTx) {
                    handleClose();
                }
            }}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-black text-white w-full max-w-7xl h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto overflow-x-hidden border-2 border-[#FFD700] pb-safe-bottom font-bbs"
                style={{
                    touchAction: 'manipulation'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Content Container */}
                <div className="px-3 md:px-4 py-4 md:py-8 pb-4">

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-4 md:mb-8"
                >
                    <h1 className="text-3xl md:text-6xl font-bold mb-1 md:mb-2 text-glow-gold">
                        🎲 CRIME LIZARD DICE 🎲
                    </h1>
                    <p className="text-gray-400 text-sm md:text-lg">Roll the bones, win big or lose it all</p>
                    <p className="text-xs text-gray-400 mt-1 md:mt-2 hidden md:block">
                        On-chain randomness • <strong className="text-yellow-400">~92% RTP</strong> • Every roll pays something!
                    </p>
                </motion.div>

                {/* Jackpot Display */}
                {parseInt(gameState.jackpotAmount) > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-4 md:mb-6 p-3 md:p-4 bg-black border-2 border-[#FFD700]"
                    >
                        <div className="text-center">
                            <div className="text-xs md:text-sm text-[#FFD700] mb-1">💎 PROGRESSIVE JACKPOT 💎</div>
                            <div className="text-2xl md:text-4xl font-bold text-[#FFD700] text-glow-gold">
                                {parseInt(gameState.jackpotAmount).toLocaleString()} GOLD
                            </div>
                            <div className="text-[10px] md:text-xs text-gray-400 mt-1">1 in 10,000 chance to win!</div>
                        </div>
                    </motion.div>
                )}

                {/* Banter Display */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={gameState.banterMessage}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`text-center mb-4 md:mb-6 p-3 md:p-4 border ${gameState.banterType === 'jackpot' ? 'border-[#FFD700] bg-black animate-pulse' :
                            gameState.banterType === 'bigwin' ? 'border-[#FFD700] bg-black' :
                                gameState.banterType === 'win' ? 'border-[#00FF88] bg-black' :
                                    gameState.banterType === 'loss' ? 'border-gray-700 bg-black' :
                                        gameState.banterType === 'rolling' ? 'border-blue-500 bg-black' :
                                            'border-gray-700 bg-black'
                            }`}
                    >
                        <p className="text-base md:text-xl">{gameState.banterMessage}</p>
                    </motion.div>
                </AnimatePresence>

                {/* Main Game Area */}
                <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-8">
                    {/* Left: Dice Display */}
                    <div className="lg:col-span-1">
                        <div className="border-2 border-[#00FF88] p-4 md:p-6 bg-black">
                            <h3 className="text-xl md:text-2xl text-center mb-3 md:mb-4 text-[#00FF88] text-glow-green">The Dice</h3>
                            <div className="flex justify-center gap-4 mb-6">
                                <motion.div
                                    animate={{
                                        rotateX: gameState.isRolling ? 360 : 0,
                                        rotateY: gameState.isRolling ? 360 : 0,
                                    }}
                                    transition={{
                                        duration: gameState.isRolling ? 0.1 : 0,
                                        repeat: gameState.isRolling ? Infinity : 0
                                    }}
                                    className="w-24 h-24 bg-white rounded-lg flex items-center justify-center shadow-lg border-4 border-gray-300"
                                >
                                    <DiceFace value={gameState.dice1} />
                                </motion.div>
                                <motion.div
                                    animate={{
                                        rotateX: gameState.isRolling ? -360 : 0,
                                        rotateY: gameState.isRolling ? -360 : 0,
                                    }}
                                    transition={{
                                        duration: gameState.isRolling ? 0.1 : 0,
                                        repeat: gameState.isRolling ? Infinity : 0
                                    }}
                                    className="w-24 h-24 bg-white rounded-lg flex items-center justify-center shadow-lg border-4 border-gray-300"
                                >
                                    <DiceFace value={gameState.dice2} />
                                </motion.div>
                            </div>

                            {!gameState.isRolling && gameState.multiplier > 0 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-center mb-4"
                                >
                                    <div className="text-4xl font-bold text-yellow-400 mb-2">
                                        {PAYTABLE_FULL.find(p => p.total === gameState.total)?.emoji} {PAYTABLE_FULL.find(p => p.total === gameState.total)?.name}
                                    </div>
                                    <div className="text-2xl text-green-400">
                                        {gameState.multiplier}x Multiplier!
                                    </div>
                                    <div className="text-3xl text-yellow-300 font-bold mt-2">
                                        +{gameState.winAmount.toLocaleString()} GOLD
                                    </div>
                                </motion.div>
                            )}

                            <div className="text-center">
                                <div className="text-5xl font-bold text-white mb-2">
                                    Total: {gameState.total}
                                </div>
                            </div>
                        </div>

                        {/* Session Stats */}
                        <div className="border-2 border-[#00FF88] p-4 bg-black mt-4">
                            <h3 className="text-xl text-[#00FF88] mb-3">Session Stats</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Rolls:</span>
                                    <span className="text-white">{gameState.sessionStats.rolls}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Wins:</span>
                                    <span className="text-[#00FF88]">{gameState.sessionStats.wins}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Win Rate:</span>
                                    <span className="text-[#FFD700]">{winRate}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Net Profit:</span>
                                    <span className={netProfit >= 0 ? 'text-[#00FF88]' : 'text-red-400'}>
                                        {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(0)} GOLD
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center: Betting Controls */}
                    <div className="lg:col-span-1">
                        <div className="border-2 border-[#FFD700] p-6 bg-black">
                            <h3 className="text-2xl text-center mb-4 text-[#FFD700] text-glow-gold">Place Your Bet</h3>

                            <div className="mb-4">
                                <label className="block text-sm text-gray-400 mb-2">Gold Balance</label>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-2xl font-bold text-[#FFD700]">
                                        💰 {databaseGold.toLocaleString()}
                                    </div>
                                    <button
                                        onClick={() => {
                                            // Navigate to rewards page for gold purchases
                                            window.location.href = '/rewards';
                                        }}
                                        className="px-4 py-2 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00BB66] font-bold text-sm transition-all"
                                    >
                                        💰 BUY GOLD
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm text-gray-400 mb-2">Bet Amount</label>
                                <input
                                    type="number"
                                    value={gameState.betAmount}
                                    onChange={(e) => {
                                        betAmountRef.current = e.target.value;
                                        setGameState(prev => ({ ...prev, betAmount: e.target.value }));
                                    }}
                                    disabled={gameState.isRolling || isProcessingTx}
                                    className="w-full px-4 py-3 bg-black border-2 border-[#00FF88] text-[#00FF88] text-xl focus:border-[#FFD700] focus:outline-none font-bold"
                                    min="0"
                                    step="1"
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-2 mb-6">
                                <button
                                    onClick={() => quickBet(0.5)}
                                    disabled={gameState.isRolling || isProcessingTx}
                                    className="px-3 py-2 bg-black border border-gray-700 hover:border-[#00FF88] text-sm disabled:opacity-50 text-white"
                                >
                                    1/2
                                </button>
                                <button
                                    onClick={() => quickBet(2)}
                                    disabled={gameState.isRolling || isProcessingTx}
                                    className="px-3 py-2 bg-black border border-gray-700 hover:border-[#00FF88] text-sm disabled:opacity-50 text-white"
                                >
                                    2x
                                </button>
                                <button
                                    onClick={() => {
                                        const maxBet = databaseGold.toString();
                                        betAmountRef.current = maxBet;
                                        setGameState(prev => ({ ...prev, betAmount: maxBet }));
                                    }}
                                    disabled={gameState.isRolling || isProcessingTx}
                                    className="px-3 py-2 bg-black border border-gray-700 hover:border-[#FFD700] text-sm disabled:opacity-50 text-white"
                                >
                                    MAX
                                </button>
                                <button
                                    onClick={() => {
                                        betAmountRef.current = '10';
                                        setGameState(prev => ({ ...prev, betAmount: '10' }));
                                    }}
                                    disabled={gameState.isRolling || isProcessingTx}
                                    className="px-3 py-2 bg-black border border-gray-700 hover:border-[#FFD700] text-sm disabled:opacity-50 text-white"
                                >
                                    RESET
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!gameState.isRolling && !isProcessingTx) {
                                        rollDice();
                                    }
                                }}
                                className={`w-full py-4 font-bold text-2xl transition-all select-none ${gameState.isRolling || isProcessingTx
                                    ? 'bg-black border-2 border-gray-700 text-gray-500'
                                    : 'bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00BB66] active:bg-[#00CC77]'
                                    }`}
                                style={{
                                    touchAction: 'manipulation',
                                    WebkitTapHighlightColor: 'rgba(0,255,136,0.3)',
                                    WebkitUserSelect: 'none',
                                    userSelect: 'none',
                                    cursor: (gameState.isRolling || isProcessingTx) ? 'not-allowed' : 'pointer',
                                    position: 'relative',
                                    zIndex: 10
                                }}
                            >
                                {isProcessingTx ? '⏳ PROCESSING...' : gameState.isRolling ? '🎲 ROLLING...' : '🎲 ROLL DICE'}
                            </button>

                            <div className="mt-4 p-3 bg-black border border-gray-700 text-sm text-gray-400">
                                <p>💡 <strong>Tip:</strong> Every roll pays! Chase 2 or 12 for 3x, avoid 7 (most common, only 0.5x)!</p>
                                <p className="text-xs text-[#FFD700] mt-2">~92% RTP - Play for the big wins!</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Paytable */}
                    <div className="lg:col-span-1">
                        <div className="border-2 border-[#FFD700] bg-black p-4 md:p-6">
                            <h3 className="text-xl md:text-2xl text-center mb-3 md:mb-4 text-[#FFD700] text-glow-gold">All Payouts</h3>
                            <div className="space-y-2 max-h-[500px] md:max-h-[500px] overflow-y-auto">
                                {PAYTABLE_FULL.map((entry) => (
                                    <div
                                        key={entry.total}
                                        className={`p-3 border bg-black/50 ${
                                            entry.tier === 'jackpot' ? 'border-[#FFD700]' :
                                            entry.tier === 'win' ? 'border-[#00FF88]' :
                                            entry.tier === 'even' ? 'border-blue-500' :
                                            'border-gray-700'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-base md:text-lg font-bold text-white">
                                                    {entry.emoji} {entry.name}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Roll: {entry.total} • {entry.probability}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-xl md:text-2xl font-bold ${
                                                    entry.tier === 'jackpot' ? 'text-[#FFD700]' :
                                                    entry.tier === 'win' ? 'text-[#00FF88]' :
                                                    entry.tier === 'even' ? 'text-blue-400' :
                                                    'text-gray-400'
                                                }`}>
                                                    {entry.multiplier}x
                                                </div>
                                                <div className={`text-xs ${
                                                    entry.tier === 'jackpot' ? 'text-[#FFD700]' :
                                                    entry.tier === 'win' ? 'text-[#00FF88]' :
                                                    entry.tier === 'even' ? 'text-blue-400' :
                                                    'text-gray-500'
                                                }`}>
                                                    {entry.tier === 'jackpot' ? 'BIG WIN!' :
                                                     entry.tier === 'win' ? 'PROFIT' :
                                                     entry.tier === 'even' ? 'EVEN' :
                                                     'partial'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Results */}
                {gameState.lastResults.length > 0 && (
                    <div className="border-2 border-gray-700 p-6 bg-black">
                        <h3 className="text-2xl mb-4 text-white">Recent Rolls</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
                            {gameState.lastResults.map((result, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={`p-3 text-center border ${result.won ? 'border-[#00FF88] bg-black' : 'border-gray-700 bg-black'
                                        }`}
                                >
                                    <div className="text-2xl font-bold text-white">{result.total}</div>
                                    <div className={`text-sm ${result.won ? 'text-[#00FF88]' : 'text-red-400'}`}>
                                        {result.won ? '+' : ''}{result.amount.toFixed(0)}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">{result.name}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    disabled={gameState.isRolling || isProcessingTx}
                    className="w-full px-4 py-3 bg-black border-2 border-gray-700 text-gray-400 hover:border-[#00FF88] hover:text-[#00FF88] font-bold disabled:opacity-50 disabled:cursor-not-allowed mt-8 transition-all"
                >
                    {(gameState.isRolling || isProcessingTx) ? 'Wait for roll to finish...' : '[ESC] Leave Dice Game'}
                </button>
                </div>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default DiceGame;