import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { WalletContext } from '../providers/WalletContext';
import { GOLD_CONTRACT_ABI } from '../goldV7Abi';
import { CHARACTER_CONTRACT_ABI } from '../characterAbi';
import { getContractAddress } from '../config/contracts';

interface ContractManagementProps {
    isOwner: boolean;
}

const ContractManagement: React.FC<ContractManagementProps> = ({ isOwner }) => {
    const { provider, signer, currentChainId } = useContext(WalletContext);

    // Contract states
    const [goldContract, setGoldContract] = useState<ethers.Contract | null>(null);
    const [characterContract, setCharacterContract] = useState<ethers.Contract | null>(null);

    // Gold contract state
    const [goldRate, setGoldRate] = useState('1000');
    const [currentGoldRate, setCurrentGoldRate] = useState('0');
    const [treasuryFee, setTreasuryFee] = useState('50');
    const [currentTreasuryFee, setCurrentTreasuryFee] = useState('0');
    const [treasuryAddress, setTreasuryAddress] = useState('');

    // Authorization state (Gold Contract)
    const [gameServerAddress, setGameServerAddress] = useState('');
    const [gameServerName, setGameServerName] = useState('');
    const [removeGameServerAddress, setRemoveGameServerAddress] = useState('');

    // Authorization state (Character Contract)
    const [charGameServerAddress, setCharGameServerAddress] = useState('');
    const [charGameServerName, setCharGameServerName] = useState('');
    const [charRemoveGameServerAddress, setCharRemoveGameServerAddress] = useState('');

    // User gold management
    const [userCharacterIdForGold, setUserCharacterIdForGold] = useState('');
    const [goldAmountToAdd, setGoldAmountToAdd] = useState('');
    const [goldAmountToRemove, setGoldAmountToRemove] = useState('');
    const [userGoldBalance, setUserGoldBalance] = useState('0');

    // Character query
    const [queryCharacterId, setQueryCharacterId] = useState('');
    const [characterData, setCharacterData] = useState<any>(null);

    useEffect(() => {
        if (provider && currentChainId && isOwner) {
            initializeContracts();
        }
    }, [provider, currentChainId, isOwner]);

    const initializeContracts = async () => {
        try {
            // IMPORTANT: Always use mainnet (56) for contract management
            const targetChainId = currentChainId || 56;

            // Gold Contract - use centralized config
            const goldAddr = getContractAddress(targetChainId, 'gold');
            if (goldAddr && goldAddr !== '0x0000000000000000000000000000000000000000') {
                const gold = new ethers.Contract(goldAddr, GOLD_CONTRACT_ABI, provider);
                setGoldContract(gold);
                // Load gold contract data
                const rate = await gold.goldRate();
                const fee = await gold.treasuryFee();
                const treasury = await gold.treasury();
                setCurrentGoldRate(rate.toString());
                setCurrentTreasuryFee(fee.toString());
                setTreasuryAddress(treasury);
            }

            // Character Contract - use centralized config
            const charAddr = getContractAddress(targetChainId, 'character');
            if (charAddr && charAddr !== '0x0000000000000000000000000000000000000000') {
                const char = new ethers.Contract(charAddr, CHARACTER_CONTRACT_ABI, provider);
                setCharacterContract(char);
}
} catch (error) {
            console.error('Failed to initialize contracts:', error);
            toast.error('Failed to initialize contracts');
        }
    };

    // Gold Contract Functions
    const handleSetGoldRate = async () => {
        if (!goldContract || !signer) return;
        try {
            const contractWithSigner = goldContract.connect(signer);
            const tx = await contractWithSigner.getFunction('setGoldRate')(goldRate);
            await tx.wait();
            toast.success(`Gold rate updated to ${goldRate}`);
            setCurrentGoldRate(goldRate);
        } catch (error) {
            console.error('Set gold rate error:', error);
            toast.error(`Failed to set gold rate: ${(error as Error).message}`);
        }
    };

    const handleSetTreasuryFee = async () => {
        if (!goldContract || !signer) return;
        try {
            const contractWithSigner = goldContract.connect(signer);
            const tx = await contractWithSigner.getFunction('setTreasuryFee')(treasuryFee);
            await tx.wait();
            toast.success(`Treasury fee updated to ${treasuryFee}/1000`);
            setCurrentTreasuryFee(treasuryFee);
        } catch (error) {
            console.error('Set treasury fee error:', error);
            toast.error(`Failed to set treasury fee: ${(error as Error).message}`);
        }
    };

    const handleSetTreasury = async () => {
        if (!goldContract || !signer) return;
        try {
            const contractWithSigner = goldContract.connect(signer);
            const tx = await contractWithSigner.getFunction('setTreasury')(treasuryAddress);
            await tx.wait();
            toast.success(`Treasury address updated`);
        } catch (error) {
            console.error('Set treasury error:', error);
            toast.error(`Failed to set treasury: ${(error as Error).message}`);
        }
    };

    const handleAddGameServer = async () => {
        if (!goldContract || !signer) return;
        try {
            const contractWithSigner = goldContract.connect(signer);
            const tx = await contractWithSigner.getFunction('addGameServer')(gameServerAddress, gameServerName);
            await tx.wait();
            toast.success(`Game server ${gameServerName} authorized`);
            setGameServerAddress('');
            setGameServerName('');
        } catch (error) {
            console.error('Add game server error:', error);
            toast.error(`Failed to add game server: ${(error as Error).message}`);
        }
    };

    const handleRemoveGameServer = async () => {
        if (!goldContract || !signer) return;
        try {
            const contractWithSigner = goldContract.connect(signer);
            const tx = await contractWithSigner.getFunction('removeGameServer')(removeGameServerAddress);
            await tx.wait();
            toast.success(`Game server removed`);
            setRemoveGameServerAddress('');
        } catch (error) {
            console.error('Remove game server error:', error);
            toast.error(`Failed to remove game server: ${(error as Error).message}`);
        }
    };

    const handleAddGold = async () => {
        if (!goldContract || !signer) return;
        try {
            const contractWithSigner = goldContract.connect(signer);
            const tx = await contractWithSigner.getFunction('adminAddGold')(userCharacterIdForGold, goldAmountToAdd);
            await tx.wait();
            toast.success(`Added ${goldAmountToAdd} gold to character #${userCharacterIdForGold}`);
            setGoldAmountToAdd('');
            await queryGoldBalance();
        } catch (error) {
            console.error('Add gold error:', error);
            toast.error(`Failed to add gold: ${(error as Error).message}`);
        }
    };

    const handleRemoveGold = async () => {
        if (!goldContract || !signer) return;
        try {
            const contractWithSigner = goldContract.connect(signer);
            const tx = await contractWithSigner.getFunction('adminRemoveGold')(userCharacterIdForGold, goldAmountToRemove);
            await tx.wait();
            toast.success(`Removed ${goldAmountToRemove} gold from character #${userCharacterIdForGold}`);
            setGoldAmountToRemove('');
            await queryGoldBalance();
        } catch (error) {
            console.error('Remove gold error:', error);
            toast.error(`Failed to remove gold: ${(error as Error).message}`);
        }
    };

    const queryGoldBalance = async () => {
        if (!goldContract || !userCharacterIdForGold) return;
        try {
            const balance = await goldContract.getGoldBalance(userCharacterIdForGold);
            setUserGoldBalance(balance.toString());
        } catch (error) {
            console.error('Query gold balance error:', error);
            toast.error('Failed to query gold balance');
        }
    };

    const handleQueryCharacter = async () => {
        if (!characterContract || !goldContract || !queryCharacterId) return;
        try {
            // Get character data from Character contract
            const charData = await characterContract.getCharacter(queryCharacterId);

            // Get game state from Character contract
            const gameState = await characterContract.getGameState(queryCharacterId);

            // Get gold balance from Gold contract
            const goldBal = await goldContract.getGoldBalance(queryCharacterId);

            // Try to get tokenURI (metadata) if available
            let tokenURI = '';
            let metadata: any = null;
            try {
                tokenURI = await characterContract.tokenURI(queryCharacterId);

                // Fetch actual metadata from URI
                if (tokenURI && tokenURI !== 'Not set') {
                    try {
                        // Handle IPFS URIs
                        let fetchUrl = tokenURI;
                        if (tokenURI.startsWith('ipfs://')) {
                            // Use public IPFS gateway
                            fetchUrl = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
                        }

                        const response = await fetch(fetchUrl);
                        if (response.ok) {
                            metadata = await response.json();
}
                    } catch (metadataError) {
                        console.warn('Failed to fetch metadata:', metadataError);
                    }
                }
            } catch (e) {
                tokenURI = 'Not set';
            }

            // Extract metadata attributes if available
            let imageUrl = metadata?.image || '';
            if (imageUrl.startsWith('ipfs://')) {
                imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }

            const findAttribute = (traitType: string) => {
                if (!metadata?.attributes) return null;
                const attr = metadata.attributes.find((a: any) =>
                    a.trait_type?.toLowerCase() === traitType.toLowerCase()
                );
                return attr?.value || null;
            };

            setCharacterData({
                // Basic character info (on-chain)
                archetype: charData.archetype.toString(),
                name: charData.name,
                mintPrice: ethers.formatEther(charData.mintPrice),
                createdAt: new Date(Number(charData.createdAt) * 1000).toLocaleString(),

                // Game state (on-chain)
                level: gameState.level.toString(),
                experience: gameState.experience.toString(),
                health: `${gameState.health.toString()}/${gameState.maxHealth.toString()}`,
                strength: gameState.strength.toString(),
                defense: gameState.defense.toString(),
                agility: gameState.agility.toString(),
                intelligence: gameState.intelligence.toString(),
                luck: gameState.luck.toString(),
                location: gameState.currentLocation,
                goldStolen: gameState.totalGoldStolen.toString(),
                questsCompleted: gameState.questsCompleted.toString(),
                enemiesDefeated: gameState.enemiesDefeated.toString(),
                isAlive: gameState.isAlive ? 'Yes' : 'No',

                // Gold balance
                goldBalance: goldBal.toString(),

                // Metadata (off-chain)
                tokenURI: tokenURI,
                imageUrl: imageUrl,
                metadataName: metadata?.name || null,
                description: metadata?.description || null,
                twitterUsername: findAttribute('twitter') || findAttribute('x') || 'Not set',
                telegramUsername: findAttribute('telegram') || 'Not set',

                // Flag to show if metadata was loaded
                metadataLoaded: !!metadata
            });
        } catch (error) {
            console.error('Query character error:', error);
            toast.error('Failed to query character');
            setCharacterData(null);
        }
    };

    // Character contract game server functions
    const handleAddCharacterGameServer = async () => {
        if (!characterContract || !signer) return;
        try {
            const contractWithSigner = characterContract.connect(signer);
            const tx = await contractWithSigner.getFunction('addGameServer')(charGameServerAddress, charGameServerName);
            await tx.wait();
            toast.success(`Game server ${charGameServerName} authorized on Character contract`);
            setCharGameServerAddress('');
            setCharGameServerName('');
        } catch (error) {
            console.error('Add character game server error:', error);
            toast.error(`Failed to add game server: ${(error as Error).message}`);
        }
    };

    const handleRemoveCharacterGameServer = async () => {
        if (!characterContract || !signer) return;
        try {
            const contractWithSigner = characterContract.connect(signer);
            const tx = await contractWithSigner.getFunction('removeGameServer')(charRemoveGameServerAddress);
            await tx.wait();
            toast.success(`Game server removed from Character contract`);
            setCharRemoveGameServerAddress('');
        } catch (error) {
            console.error('Remove character game server error:', error);
            toast.error(`Failed to remove game server: ${(error as Error).message}`);
        }
    };

    const handlePauseGoldContract = async () => {
        if (!goldContract || !signer) return;
        try {
            const contractWithSigner = goldContract.connect(signer);
            const tx = await contractWithSigner.getFunction('pause')();
            await tx.wait();
            toast.success('Gold contract paused');
        } catch (error) {
            console.error('Pause error:', error);
            toast.error(`Failed to pause: ${(error as Error).message}`);
        }
    };

    const handleUnpauseGoldContract = async () => {
        if (!goldContract || !signer) return;
        try {
            const contractWithSigner = goldContract.connect(signer);
            const tx = await contractWithSigner.getFunction('unpause')();
            await tx.wait();
            toast.success('Gold contract unpaused');
        } catch (error) {
            console.error('Unpause error:', error);
            toast.error(`Failed to unpause: ${(error as Error).message}`);
        }
    };

    if (!isOwner) return null;

    return (
        <div className="space-y-6">
            {/* Gold Contract Management */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-yellow-900/50 to-amber-800/50 p-6 rounded-xl border border-yellow-500/30 backdrop-blur-sm"
            >
                <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
                    💰 Gold Contract Management
                </h2>

                {/* Gold Rate */}
                <div className="bg-black/50 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-bold text-yellow-300 mb-3">Gold Exchange Rate</h3>
                    <p className="text-sm text-gray-400 mb-2">Current: {currentGoldRate} gold per 1 BNB</p>
                    <p className="text-xs text-gray-500 mb-2">Example: If rate is 100000, then 0.01 BNB = 1000 gold, 0.05 BNB = 5000 gold</p>
                    <div className="flex items-center space-x-4">
                        <input
                            type="number"
                            value={goldRate}
                            onChange={e => setGoldRate(e.target.value)}
                            className="bg-gray-700 px-4 py-2 rounded text-white border border-yellow-500/30 w-48"
                            placeholder="Gold per BNB"
                        />
                        <button
                            onClick={handleSetGoldRate}
                            className="bg-yellow-600 px-4 py-2 rounded font-bold hover:bg-yellow-700"
                        >
                            Update Rate
                        </button>
                    </div>
                </div>

                {/* Treasury Fee */}
                <div className="bg-black/50 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-bold text-yellow-300 mb-3">Treasury Fee</h3>
                    <p className="text-sm text-gray-400 mb-2">Current: {currentTreasuryFee}/1000 ({(parseInt(currentTreasuryFee) / 10).toFixed(1)}%)</p>
                    <div className="flex items-center space-x-4">
                        <input
                            type="number"
                            value={treasuryFee}
                            onChange={e => setTreasuryFee(e.target.value)}
                            className="bg-gray-700 px-4 py-2 rounded text-white border border-yellow-500/30 w-48"
                            placeholder="Fee (max 100)"
                            max="100"
                        />
                        <button
                            onClick={handleSetTreasuryFee}
                            className="bg-yellow-600 px-4 py-2 rounded font-bold hover:bg-yellow-700"
                        >
                            Update Fee
                        </button>
                    </div>
                </div>

                {/* Treasury Address */}
                <div className="bg-black/50 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-bold text-yellow-300 mb-3">Treasury Address</h3>
                    <div className="flex items-center space-x-4">
                        <input
                            type="text"
                            value={treasuryAddress}
                            onChange={e => setTreasuryAddress(e.target.value)}
                            className="bg-gray-700 px-4 py-2 rounded text-white border border-yellow-500/30 flex-1 font-mono text-sm"
                            placeholder="0x..."
                        />
                        <button
                            onClick={handleSetTreasury}
                            className="bg-yellow-600 px-4 py-2 rounded font-bold hover:bg-yellow-700"
                        >
                            Update
                        </button>
                    </div>
                </div>

                {/* Pause/Unpause */}
                <div className="flex gap-4">
                    <button
                        onClick={handlePauseGoldContract}
                        className="bg-red-600 px-4 py-2 rounded font-bold hover:bg-red-700"
                    >
                        ⏸️ Pause Contract
                    </button>
                    <button
                        onClick={handleUnpauseGoldContract}
                        className="bg-[#00DD77] px-4 py-2 rounded font-bold hover:bg-[#00BB66]"
                    >
                        ▶️ Unpause Contract
                    </button>
                </div>
            </motion.div>

            {/* Game Server Authorization */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-purple-900/50 to-indigo-800/50 p-6 rounded-xl border border-purple-500/30 backdrop-blur-sm"
            >
                <h2 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-2">
                    🔐 Game Server Authorization
                </h2>

                {/* Add Game Server */}
                <div className="bg-black/50 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-bold text-purple-300 mb-3">Add Authorized Game Server</h3>
                    <p className="text-sm text-gray-400 mb-3">
                        Authorize contracts/servers to manage gold (e.g., Slots contract, backend server)
                    </p>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={gameServerAddress}
                            onChange={e => setGameServerAddress(e.target.value)}
                            className="bg-gray-700 px-4 py-2 rounded text-white border border-purple-500/30 w-full font-mono text-sm"
                            placeholder="Server address (0x...)"
                        />
                        <input
                            type="text"
                            value={gameServerName}
                            onChange={e => setGameServerName(e.target.value)}
                            className="bg-gray-700 px-4 py-2 rounded text-white border border-purple-500/30 w-full"
                            placeholder="Server name (e.g., 'Slots Game Contract')"
                        />
                        <button
                            onClick={handleAddGameServer}
                            className="bg-purple-600 px-4 py-2 rounded font-bold hover:bg-purple-700 w-full"
                            disabled={!gameServerAddress || !gameServerName}
                        >
                            ➕ Authorize Server
                        </button>
                    </div>
                </div>

                {/* Remove Game Server */}
                <div className="bg-black/50 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-purple-300 mb-3">Remove Authorized Server</h3>
                    <div className="flex items-center space-x-4">
                        <input
                            type="text"
                            value={removeGameServerAddress}
                            onChange={e => setRemoveGameServerAddress(e.target.value)}
                            className="bg-gray-700 px-4 py-2 rounded text-white border border-purple-500/30 flex-1 font-mono text-sm"
                            placeholder="Server address (0x...)"
                        />
                        <button
                            onClick={handleRemoveGameServer}
                            className="bg-red-600 px-4 py-2 rounded font-bold hover:bg-red-700"
                            disabled={!removeGameServerAddress}
                        >
                            ➖ Remove
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Character Contract Authorization */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-r from-indigo-900/50 to-purple-800/50 p-6 rounded-xl border border-indigo-500/30 backdrop-blur-sm"
            >
                <h2 className="text-2xl font-bold text-indigo-400 mb-6 flex items-center gap-2">
                    🦎 Character Contract Authorization
                </h2>

                {/* Add Game Server - Character Contract */}
                <div className="bg-black/50 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-bold text-indigo-300 mb-3">Authorize Server for Character Updates</h3>
                    <p className="text-sm text-gray-400 mb-3">
                        Authorize servers to update character stats, metadata URIs, and game state
                    </p>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={charGameServerAddress}
                            onChange={e => setCharGameServerAddress(e.target.value)}
                            className="bg-gray-700 px-4 py-2 rounded text-white border border-indigo-500/30 w-full font-mono text-sm"
                            placeholder="Server address (0x...)"
                        />
                        <input
                            type="text"
                            value={charGameServerName}
                            onChange={e => setCharGameServerName(e.target.value)}
                            className="bg-gray-700 px-4 py-2 rounded text-white border border-indigo-500/30 w-full"
                            placeholder="Server name (e.g., 'Legend Game Server')"
                        />
                        <button
                            onClick={handleAddCharacterGameServer}
                            className="bg-indigo-600 px-4 py-2 rounded font-bold hover:bg-indigo-700 w-full"
                            disabled={!charGameServerAddress || !charGameServerName}
                        >
                            ➕ Authorize on Character Contract
                        </button>
                    </div>
                </div>

                {/* Remove Game Server - Character Contract */}
                <div className="bg-black/50 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-indigo-300 mb-3">Remove Authorized Server</h3>
                    <div className="flex items-center space-x-4">
                        <input
                            type="text"
                            value={charRemoveGameServerAddress}
                            onChange={e => setCharRemoveGameServerAddress(e.target.value)}
                            className="bg-gray-700 px-4 py-2 rounded text-white border border-indigo-500/30 flex-1 font-mono text-sm"
                            placeholder="Server address (0x...)"
                        />
                        <button
                            onClick={handleRemoveCharacterGameServer}
                            className="bg-red-600 px-4 py-2 rounded font-bold hover:bg-red-700"
                            disabled={!charRemoveGameServerAddress}
                        >
                            ➖ Remove
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* User Gold Management */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-green-900/50 to-emerald-800/50 p-6 rounded-xl border border-[#00FF88]/30 backdrop-blur-sm"
            >
                <h2 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-2">
                    👤 User Gold Management
                </h2>

                {/* Character ID Input */}
                <div className="bg-black/50 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-bold text-green-300 mb-3">Select Character</h3>
                    <div className="flex items-center space-x-4">
                        <input
                            type="number"
                            value={userCharacterIdForGold}
                            onChange={e => setUserCharacterIdForGold(e.target.value)}
                            className="bg-gray-700 px-4 py-2 rounded text-white border border-[#00FF88]/30 w-48"
                            placeholder="Character Token ID"
                        />
                        <button
                            onClick={queryGoldBalance}
                            className="bg-blue-600 px-4 py-2 rounded font-bold hover:bg-blue-700"
                        >
                            🔍 Check Balance
                        </button>
                        {userGoldBalance !== '0' && (
                            <span className="text-green-400 font-bold">
                                Balance: {userGoldBalance} gold
                            </span>
                        )}
                    </div>
                </div>

                {/* Add Gold */}
                <div className="bg-black/50 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-bold text-green-300 mb-3">Add Gold</h3>
                    <div className="flex items-center space-x-4">
                        <input
                            type="number"
                            value={goldAmountToAdd}
                            onChange={e => setGoldAmountToAdd(e.target.value)}
                            className="bg-gray-700 px-4 py-2 rounded text-white border border-[#00FF88]/30 w-48"
                            placeholder="Amount to add"
                        />
                        <button
                            onClick={handleAddGold}
                            className="bg-[#00DD77] px-4 py-2 rounded font-bold hover:bg-[#00BB66]"
                            disabled={!userCharacterIdForGold || !goldAmountToAdd}
                        >
                            ➕ Add Gold
                        </button>
                    </div>
                </div>

                {/* Remove Gold */}
                <div className="bg-black/50 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-green-300 mb-3">Remove Gold</h3>
                    <div className="flex items-center space-x-4">
                        <input
                            type="number"
                            value={goldAmountToRemove}
                            onChange={e => setGoldAmountToRemove(e.target.value)}
                            className="bg-gray-700 px-4 py-2 rounded text-white border border-[#00FF88]/30 w-48"
                            placeholder="Amount to remove"
                        />
                        <button
                            onClick={handleRemoveGold}
                            className="bg-red-600 px-4 py-2 rounded font-bold hover:bg-red-700"
                            disabled={!userCharacterIdForGold || !goldAmountToRemove}
                        >
                            ➖ Remove Gold
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Character Information Query */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-blue-900/50 to-cyan-800/50 p-6 rounded-xl border border-blue-500/30 backdrop-blur-sm"
            >
                <h2 className="text-2xl font-bold text-blue-400 mb-6 flex items-center gap-2">
                    🦎 Character Information
                </h2>

                <div className="bg-black/50 p-4 rounded-lg mb-4">
                    <div className="flex items-center space-x-4 mb-4">
                        <input
                            type="number"
                            value={queryCharacterId}
                            onChange={e => setQueryCharacterId(e.target.value)}
                            className="bg-gray-700 px-4 py-2 rounded text-white border border-blue-500/30 w-48"
                            placeholder="Character Token ID"
                        />
                        <button
                            onClick={handleQueryCharacter}
                            className="bg-blue-600 px-4 py-2 rounded font-bold hover:bg-blue-700"
                        >
                            🔍 Query Character
                        </button>
                    </div>

                    {characterData && (
                        <div className="bg-gray-700/50 p-4 rounded space-y-4 text-sm">
                            {/* Character Image */}
                            {characterData.imageUrl && (
                                <div className="flex justify-center mb-4">
                                    <img
                                        src={characterData.imageUrl}
                                        alt={characterData.name}
                                        className="w-32 h-32 rounded-lg border-2 border-blue-500 object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}

                            {/* Basic Info */}
                            <div>
                                <h4 className="text-blue-300 font-bold mb-2 text-base">📋 Basic Info</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-gray-400">Archetype:</span>
                                    <span className="text-white font-bold">{characterData.archetype}</span>

                                    <span className="text-gray-400">Name:</span>
                                    <span className="text-white font-bold">{characterData.name}</span>

                                    {characterData.description && (
                                        <>
                                            <span className="text-gray-400">Description:</span>
                                            <span className="text-white text-xs">{characterData.description}</span>
                                        </>
                                    )}

                                    <span className="text-gray-400">Mint Price:</span>
                                    <span className="text-white font-bold">{characterData.mintPrice} BNB</span>

                                    <span className="text-gray-400">Created:</span>
                                    <span className="text-white">{characterData.createdAt}</span>

                                    <span className="text-gray-400">Gold Balance:</span>
                                    <span className="text-[#FFD700] font-bold">{characterData.goldBalance} 💰</span>
                                </div>
                            </div>

                            {/* Social Links */}
                            {characterData.metadataLoaded && (
                                <div>
                                    <h4 className="text-cyan-300 font-bold mb-2 text-base">🔗 Social Links</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <span className="text-gray-400">Twitter/X:</span>
                                        <span className="text-white">
                                            {characterData.twitterUsername !== 'Not set' ? (
                                                <a
                                                    href={`https://twitter.com/${characterData.twitterUsername.replace('@', '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 underline"
                                                >
                                                    {characterData.twitterUsername}
                                                </a>
                                            ) : (
                                                <span className="text-gray-500">{characterData.twitterUsername}</span>
                                            )}
                                        </span>

                                        <span className="text-gray-400">Telegram:</span>
                                        <span className="text-white">
                                            {characterData.telegramUsername !== 'Not set' ? (
                                                <a
                                                    href={`https://t.me/${characterData.telegramUsername.replace('@', '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 underline"
                                                >
                                                    {characterData.telegramUsername}
                                                </a>
                                            ) : (
                                                <span className="text-gray-500">{characterData.telegramUsername}</span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Game Stats */}
                            <div>
                                <h4 className="text-emerald-300 font-bold mb-2 text-base">⚔️ Game Stats</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-gray-400">Level:</span>
                                    <span className="text-emerald-400 font-bold">{characterData.level}</span>

                                    <span className="text-gray-400">Experience:</span>
                                    <span className="text-white">{characterData.experience} XP</span>

                                    <span className="text-gray-400">Health:</span>
                                    <span className="text-red-400 font-bold">{characterData.health} ❤️</span>

                                    <span className="text-gray-400">Location:</span>
                                    <span className="text-white">{characterData.location}</span>

                                    <span className="text-gray-400">Status:</span>
                                    <span className={characterData.isAlive === 'Yes' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                        {characterData.isAlive === 'Yes' ? '✅ Alive' : '💀 Dead'}
                                    </span>
                                </div>
                            </div>

                            {/* Character Attributes */}
                            <div>
                                <h4 className="text-yellow-300 font-bold mb-2 text-base">💪 Attributes</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-gray-400">Strength:</span>
                                    <span className="text-red-300 font-bold">{characterData.strength}</span>

                                    <span className="text-gray-400">Defense:</span>
                                    <span className="text-blue-300 font-bold">{characterData.defense}</span>

                                    <span className="text-gray-400">Agility:</span>
                                    <span className="text-green-300 font-bold">{characterData.agility}</span>

                                    <span className="text-gray-400">Intelligence:</span>
                                    <span className="text-purple-300 font-bold">{characterData.intelligence}</span>

                                    <span className="text-gray-400">Luck:</span>
                                    <span className="text-yellow-300 font-bold">{characterData.luck}</span>
                                </div>
                            </div>

                            {/* Achievements */}
                            <div>
                                <h4 className="text-pink-300 font-bold mb-2 text-base">🏆 Achievements</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-gray-400">Gold Stolen:</span>
                                    <span className="text-[#FFD700] font-bold">{characterData.goldStolen} 💰</span>

                                    <span className="text-gray-400">Quests Completed:</span>
                                    <span className="text-white font-bold">{characterData.questsCompleted}</span>

                                    <span className="text-gray-400">Enemies Defeated:</span>
                                    <span className="text-white font-bold">{characterData.enemiesDefeated}</span>
                                </div>
                            </div>

                            {/* Metadata URI */}
                            <div>
                                <h4 className="text-purple-300 font-bold mb-2 text-base">📦 Metadata</h4>
                                <div className="space-y-2">
                                    <div>
                                        <div className="text-gray-400 text-xs mb-1">Token URI:</div>
                                        <div className="bg-black p-2 rounded text-xs font-mono text-cyan-400 break-all">
                                            {characterData.tokenURI}
                                        </div>
                                    </div>

                                    {characterData.metadataLoaded ? (
                                        <div className="text-xs text-green-400 flex items-center gap-1">
                                            ✅ Metadata loaded successfully
                                        </div>
                                    ) : characterData.tokenURI !== 'Not set' ? (
                                        <div className="text-xs text-yellow-400 flex items-center gap-1">
                                            ⚠️ Metadata URI set but failed to load (check URL/CORS)
                                        </div>
                                    ) : (
                                        <div className="text-xs text-orange-400 flex items-center gap-1">
                                            ⚠️ No metadata URI set - use updateTokenMetadataURI() to add image/socials
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ContractManagement;
