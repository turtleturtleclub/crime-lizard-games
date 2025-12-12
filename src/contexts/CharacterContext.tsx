import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../providers/WalletContext';
import { CHARACTER_CONTRACT_ABI } from '../characterAbi';
import { GOLD_CONTRACT_ABI } from '../goldV7Abi';
import { SLOTS_V11_ABI } from '../slotsV11Abi';
import { getContractAddress } from '../config/contracts';
import { toast } from 'react-toastify';
import { getRpcProvider } from '../services/RpcProvider';

interface CharacterNFT {
    tokenId: bigint;
    archetype: number;
    name: string;
    createdAt: bigint;
    goldBalance: string;
    telegramUsername?: string; // Telegram username from NFT metadata
    metadata?: any; // Full metadata object
    ipfsImageHash?: string; // IPFS hash for character image
}

interface CharacterContextType {
    selectedCharacter: CharacterNFT | null;
    userCharacters: CharacterNFT[];
    goldBalance: string;
    isLoading: boolean;
    selectCharacter: (tokenId: bigint) => Promise<void>;
    refreshGoldBalance: () => Promise<void>;
    refreshCharacters: () => Promise<void>;
    characterContract: ethers.Contract | null;
    goldContract: ethers.Contract | null;
}

const CharacterContext = createContext<CharacterContextType>({
    selectedCharacter: null,
    userCharacters: [],
    goldBalance: '0',
    isLoading: false,
    selectCharacter: async () => { },
    refreshGoldBalance: async () => { },
    refreshCharacters: async () => { },
    characterContract: null,
    goldContract: null,
});

export const useCharacter = () => {
    const context = useContext(CharacterContext);
    if (!context) {
        throw new Error('useCharacter must be used within CharacterProvider');
    }
    return context;
};

interface CharacterProviderProps {
    children: ReactNode;
}

export const CharacterProvider = ({ children }: CharacterProviderProps) => {
    const { provider, account, currentChainId, signer } = useContext(WalletContext);
    const [selectedCharacter, setSelectedCharacter] = useState<CharacterNFT | null>(null);
    const [userCharacters, setUserCharacters] = useState<CharacterNFT[]>([]);
    const [goldBalance, setGoldBalance] = useState<string>('0');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [characterContract, setCharacterContract] = useState<ethers.Contract | null>(null);
    const [goldContract, setGoldContract] = useState<ethers.Contract | null>(null);
    const [slotsContract, setSlotsContract] = useState<ethers.Contract | null>(null);

    // Track if we're already selecting to prevent duplicate transactions
    const isSelectingRef = useRef(false);
    const hasAutoSelectedRef = useRef(false);
    // Track which character has been selected on slots contract to prevent re-checking
    const slotsSelectedCharacterRef = useRef<string | null>(null);

    // Initialize contracts
    useEffect(() => {
        if (!provider || !currentChainId) {
            setCharacterContract(null);
            setGoldContract(null);
            setSlotsContract(null);
            return;
        }

        try {
            // IMPORTANT: Always use mainnet (56) for contract addresses
            // This prevents issues if currentChainId is incorrectly detected
            const targetChainId = 56; // Force mainnet

            // Initialize Character Contract (using centralized config)
            const characterAddress = getContractAddress(targetChainId, 'character');
            if (characterAddress && characterAddress !== '0x0000000000000000000000000000000000000000') {
                const charContract = new ethers.Contract(characterAddress, CHARACTER_CONTRACT_ABI, provider);
                setCharacterContract(charContract);
            }

            // Initialize Gold Contract (using centralized config)
            const goldAddress = getContractAddress(targetChainId, 'gold');
            if (goldAddress && goldAddress !== '0x0000000000000000000000000000000000000000') {
                const gContract = new ethers.Contract(goldAddress, GOLD_CONTRACT_ABI, provider);
                setGoldContract(gContract);
            } else {
                console.error('❌ Gold contract address not configured');
            }

            // Initialize Slots Contract (using centralized config)
            const slotsAddress = getContractAddress(targetChainId, 'slots');
            if (slotsAddress && slotsAddress !== '0x0000000000000000000000000000000000000000') {
                const slContract = new ethers.Contract(slotsAddress, SLOTS_V11_ABI, provider);
                setSlotsContract(slContract);
            }
        } catch (error) {
            console.error('Failed to initialize contracts:', error);
        }
    }, [provider, currentChainId]);

    // Fetch user characters
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchCharacters = useCallback(async () => {
        if (!account) {
            setUserCharacters([]);
            setSelectedCharacter(null);
            return;
        }

        setIsLoading(true);
        try {
            // IMPORTANT: Always use mainnet (56) for fetching characters
            const targetChainId = 56;
            const characterAddress = getContractAddress(targetChainId, 'character');
            const goldAddress = getContractAddress(targetChainId, 'gold');

            if (!characterAddress || !goldAddress) {
                console.error('Contract addresses not configured');
                return;
            }

            // Use private RPC for read-only operations
            const rpcProvider = getRpcProvider();
const tokenIds = await rpcProvider.readContract(
                characterAddress,
                CHARACTER_CONTRACT_ABI,
                'getCharactersByOwner',
                [account]
            );

            const characters: CharacterNFT[] = [];
            for (const tokenId of tokenIds) {
                try {
                    // Fetch character data using private RPC
                    const charData = await rpcProvider.readContract(
                        characterAddress,
                        CHARACTER_CONTRACT_ABI,
                        'getCharacter',
                        [tokenId]
                    );

                    // Fetch gold balance (V3 uses getTotalGold for bank + on-hand)

                    let goldBal: bigint;
                    try {
                        // V3: Try getTotalGold first (includes bank + on-hand) using private RPC
                        goldBal = await rpcProvider.readContract(
                            goldAddress,
                            GOLD_CONTRACT_ABI,
                            'getTotalGold',
                            [tokenId]
                        );

                    } catch (v3Error) {
                        // Fallback to V2 getGoldBalance using private RPC
                        console.warn('⚠️ getTotalGold failed, using getGoldBalance (V2)');
                        goldBal = await rpcProvider.readContract(
                            goldAddress,
                            GOLD_CONTRACT_ABI,
                            'getGoldBalance',
                            [tokenId]
                        );
                    }

                    // Fetch metadata from API (hybrid IPFS + on-chain data)
                    let telegramUsername: string | undefined;
                    let metadata: any;
                    let databaseName: string | undefined;
                    let ipfsImageHash: string | undefined;

                    try {
                        // Use our API endpoint instead of direct IPFS (faster, cached, more reliable)
                        const metadataResponse = await fetch(`/api/legend/metadata/${tokenId.toString()}`);
                        if (metadataResponse.ok) {
                            metadata = await metadataResponse.json();

                            // Extract Telegram username from attributes
                            if (metadata.attributes && Array.isArray(metadata.attributes)) {
                                const telegramAttr = metadata.attributes.find(
                                    (attr: any) => attr.trait_type === 'Telegram Username' || attr.trait_type === 'telegram'
                                );
                                if (telegramAttr && telegramAttr.value) {
                                    telegramUsername = telegramAttr.value;
                                }
                            }

                            // Also check direct property
                            if (!telegramUsername && metadata.telegram) {
                                telegramUsername = metadata.telegram;
                            }

                            // ✨ NEW: Check if database has a newer name (from name editor)
                            if (metadata.databaseName) {
                                databaseName = metadata.databaseName;
                            }

                            // ✨ Get IPFS image hash directly from metadata
                            if (metadata.ipfsImageHash) {
                                ipfsImageHash = metadata.ipfsImageHash;
                            }
                        }
                    } catch (metadataError) {
                        console.warn(`Could not fetch metadata for token ${tokenId.toString()}:`, metadataError);
                    }

                    characters.push({
                        tokenId,
                        archetype: charData.archetype,
                        name: databaseName || charData.name, // ✨ Use database name if available, otherwise blockchain name
                        createdAt: charData.createdAt,
                        goldBalance: goldBal.toString(),
                        telegramUsername,
                        metadata,
                        ipfsImageHash // ✨ Include IPFS image hash if available
                    });
                } catch (error) {
                    console.error(`Failed to fetch data for character ${tokenId.toString()}:`, error);
                }
            }

            setUserCharacters(characters);
// Auto-select first character if none selected and no saved character
            // NOTE: We DON'T call slots contract here anymore - that's handled by a separate useEffect
            const savedCharacterId = localStorage.getItem('selectedCharacterId');
            if (characters.length > 0 && !selectedCharacter && !hasAutoSelectedRef.current) {
                // Try to restore saved character first
                const savedChar = savedCharacterId
                    ? characters.find(char => char.tokenId.toString() === savedCharacterId)
                    : null;

                const charToSelect = savedChar || characters[0];
                setSelectedCharacter(charToSelect);
                setGoldBalance(charToSelect.goldBalance);
                localStorage.setItem('selectedCharacterId', charToSelect.tokenId.toString());
                hasAutoSelectedRef.current = true;
            } else if (characters.length > 0 && selectedCharacter) {
                // If we already have a selected character, update it with latest data
                const updatedChar = characters.find(char => char.tokenId === selectedCharacter.tokenId);
                if (updatedChar) {
                    setSelectedCharacter(updatedChar);
                    setGoldBalance(updatedChar.goldBalance);
                }
            }
        } catch (error) {
            console.error('Failed to fetch characters:', error);
            setUserCharacters([]);
        } finally {
            setIsLoading(false);
        }
    }, [account, currentChainId]); // Removed slotsContract and signer - not used in this function anymore

    // Refresh gold balance for selected character
    const refreshGoldBalance = useCallback(async () => {
        if (!selectedCharacter) return;

        try {
            // IMPORTANT: Always use mainnet (56)
            const goldAddress = getContractAddress(56, 'gold');
            if (!goldAddress) {
                console.error('Gold contract address not configured');
                return;
            }


            // Use private RPC for read-only operations
            const rpcProvider = getRpcProvider();

            // Try V3 getTotalGold first (includes bank + on-hand)
            let goldBal: bigint;
            try {
                goldBal = await rpcProvider.readContract(
                    goldAddress,
                    GOLD_CONTRACT_ABI,
                    'getTotalGold',
                    [selectedCharacter.tokenId]
                );
            } catch (v3Error) {
                // Fallback to V2 getGoldBalance
                console.warn('⚠️ getTotalGold failed, falling back to getGoldBalance (V2)');
                goldBal = await rpcProvider.readContract(
                    goldAddress,
                    GOLD_CONTRACT_ABI,
                    'getGoldBalance',
                    [selectedCharacter.tokenId]
                );
            }

            setGoldBalance(goldBal.toString());

            // Update character in list
            setUserCharacters(prev =>
                prev.map(char =>
                    char.tokenId === selectedCharacter.tokenId
                        ? { ...char, goldBalance: goldBal.toString() }
                        : char
                )
            );

            // Update selected character
            setSelectedCharacter(prev =>
                prev ? { ...prev, goldBalance: goldBal.toString() } : null
            );

        } catch (error) {
            console.error('❌ Failed to refresh gold balance:', error);
        }
    }, [selectedCharacter, currentChainId]);

    // Select character
    const selectCharacter = useCallback(async (tokenId: bigint) => {

        const character = userCharacters.find(char => char.tokenId === tokenId);
        if (!character) {
            console.error('❌ Character not found in userCharacters:', tokenId.toString());
            console.error('Available character IDs:', userCharacters.map(c => c.tokenId.toString()));
            return;
        }

        // Update local state immediately for responsive UI
        setSelectedCharacter(character);
        setGoldBalance(character.goldBalance);
        localStorage.setItem('selectedCharacterId', tokenId.toString());

        // NOTE: Slots contract selection is now handled by the useEffect above
        // This prevents duplicate transactions when user manually selects a character
    }, [userCharacters]);

    // Fetch characters when wallet connects
    useEffect(() => {
        if (account && currentChainId) {
            // Fetch characters - this is now safe because fetchCharacters has stable dependencies
            fetchCharacters();
        } else {
            setUserCharacters([]);
            setSelectedCharacter(null);
            setGoldBalance('0');
            hasAutoSelectedRef.current = false;
            slotsSelectedCharacterRef.current = null; // Reset slots selection tracking
        }
    }, [account, currentChainId, fetchCharacters]); // Re-added fetchCharacters - it's stable now

    // Ensure selected character is registered on slots contract when signer becomes available
    // This only runs ONCE per character selection to avoid duplicate transactions
    useEffect(() => {
        // Early exit if no character or already processed this character
        if (!selectedCharacter || !slotsContract || !signer || !currentChainId) {
            return;
        }

        const characterIdString = selectedCharacter.tokenId.toString();

        // If we've already processed this character, skip completely
        if (slotsSelectedCharacterRef.current === characterIdString) {
            return;
        }

        // If selection is in progress, skip
        if (isSelectingRef.current) {
            return;
        }

        const ensureCharacterSelection = async () => {
            isSelectingRef.current = true;

            try {
// Check if character is already selected using private RPC
                // IMPORTANT: Always use mainnet (56)
                const slotsAddress = getContractAddress(56, 'slots');
                if (!slotsAddress) {
                    console.warn('⚠️ Slots address not configured');
                    return;
                }

                const rpcProvider = getRpcProvider();
                const signerAddress = await signer.getAddress();

                // Check current selection using RPC (reliable, no wallet popup)
                let currentSelection: bigint | null = null;
                try {
                    currentSelection = await rpcProvider.readContract(
                        slotsAddress,
                        SLOTS_V11_ABI,
                        'getActiveCharacter',
                        [signerAddress]
                    );
                } catch (checkError) {
                    console.warn('⚠️ Could not check current selection via RPC:', checkError);
                    // If we can't check, don't try to change - avoids unnecessary wallet popups
                    return;
                }

                // Already selected - no action needed
                if (currentSelection !== null && currentSelection.toString() === characterIdString) {
                    slotsSelectedCharacterRef.current = characterIdString;
                    return;
                }

                // Need to select - use server endpoint to avoid MetaMask issues
                try {
                    const response = await fetch('/api/legend/select-character', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            walletAddress: signerAddress,
                            tokenId: selectedCharacter.tokenId
                        })
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        slotsSelectedCharacterRef.current = characterIdString;
                        if (!data.alreadySelected) {
                            toast.success(`${selectedCharacter.name} selected.`);
                        }
                    } else {
                        throw new Error(data.error || 'Failed to select character');
                    }
                } catch (serverError) {
                    console.warn('⚠️ Server selection failed, falling back to MetaMask:', serverError);
                    // Fallback to MetaMask if server fails
                    const slotsWithSigner = slotsContract.connect(signer);
                    const tx = await slotsWithSigner.getFunction('selectCharacter')(selectedCharacter.tokenId);
                    await tx.wait();
                    slotsSelectedCharacterRef.current = characterIdString;
                    toast.success(`${selectedCharacter.name} selected.`);
                }
            } catch (error) {
                console.error('⚠️ Failed to ensure character selection on slots contract:', error);
                // Don't show error for user cancellation
                if (error && typeof error === 'object' && 'code' in error && error.code === 'ACTION_REJECTED') {
} else {
                    toast.error('Failed to select character. Please try again.');
                }
            } finally {
                isSelectingRef.current = false;
            }
        };

        ensureCharacterSelection();
    }, [selectedCharacter?.tokenId, slotsContract, signer, currentChainId]); // Only depend on tokenId, not the whole object

    // ✅ FIX: Keep goldBalance state in sync with selectedCharacter.goldBalance
    // This ensures games always show the correct balance
    useEffect(() => {
        if (selectedCharacter?.goldBalance) {
            // Only update if the value actually changed to prevent unnecessary re-renders
            setGoldBalance(prev => {
                if (prev !== selectedCharacter.goldBalance) {
return selectedCharacter.goldBalance;
                }
                return prev;
            });
        } else if (!selectedCharacter) {
            setGoldBalance(prev => prev !== '0' ? '0' : prev);
        }
    }, [selectedCharacter?.goldBalance]); // Only depend on the goldBalance value, not the whole object

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        selectedCharacter,
        userCharacters,
        goldBalance,
        isLoading,
        selectCharacter,
        refreshGoldBalance,
        refreshCharacters: fetchCharacters,
        characterContract,
        goldContract,
    }), [selectedCharacter, userCharacters, goldBalance, isLoading, selectCharacter, refreshGoldBalance, fetchCharacters, characterContract, goldContract]);

    return (
        <CharacterContext.Provider value={contextValue}>
            {children}
        </CharacterContext.Provider>
    );
};

export default CharacterContext;
