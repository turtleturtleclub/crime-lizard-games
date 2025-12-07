import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { WalletContext } from '../../providers/WalletContext';
import CharacterCarousel from './CharacterCarousel';

interface CharacterNFT {
    tokenId: number;
    archetype: number;
    createdAt: number;
    metadata: {
        name: string;
        level: number;
        goldStolen: number;
        image: string;
    };
    status?: {
        health: number;
        maxHealth: number;
        isAlive: boolean;
        location: string;
        sleptSafely: boolean;
        isOnline: boolean;
        lastSeen: Date | null;
    };
}

interface CharacterSelectProps {
    onCharacterSelected: (tokenId: number) => void;
    onCreateNew: () => void;
}

const CharacterSelect: React.FC<CharacterSelectProps> = ({ onCharacterSelected, onCreateNew }) => {
    const { account, provider } = useContext(WalletContext);
    const [characters, setCharacters] = useState<CharacterNFT[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (account && provider) {
            fetchCharacters();
        }
    }, [account, provider]);

    const fetchCharacters = async () => {
        try {
            setLoading(true);

            // Fetch owned character NFTs from blockchain
            const response = await fetch(`/api/legend/characters/${account}`);
            if (response.ok) {
                const data = await response.json();
                const fetchedCharacters = data.characters || [];

                // Only show characters that are actually owned (verified on-chain)
                // Filter out null, undefined, or invalid characters
                const validCharacters = fetchedCharacters.filter((char: CharacterNFT | null) => {
                    if (!char || char === null) return false;
                    if (!char.tokenId || char.tokenId === 0) return false;
                    if (!char.metadata || !char.metadata.name) return false;
                    return true;
                });

                setCharacters(validCharacters);
            } else {
                console.error('Failed to fetch characters:', response.statusText);
                setCharacters([]);
            }

        } catch (err) {
            console.error('Error fetching characters:', err);
            // On error, show empty array - don't add test characters
            setCharacters([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="text-6xl"
                >
                    🦎
                </motion.div>
            </div>
        );
    }

    return (
        <CharacterCarousel
            characters={characters}
            onCharacterSelected={onCharacterSelected}
            onCreateNew={onCreateNew}
        />
    );
};

export default CharacterSelect;
