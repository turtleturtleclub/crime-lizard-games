/**
 * IPFS Metadata Generator for Crime Lizard Character NFTs
 * 
 * Generates dynamic NFT metadata that updates based on:
 * - Character stats (from Legend contract)
 * - Gold balance (from Gold contract)
 * - Game progression
 * - Player achievements
 */

export interface CharacterMetadata {
    name: string;
    description: string;
    image: string;
    external_url: string;
    attributes: MetadataAttribute[];
    properties: {
        archetype: string;
        archetypeId: number;
        level: number;
        goldBalance: string;
        gameState: {
            health: number;
            maxHealth: number;
            mana: number;
            maxMana: number;
            location: string;
            isAlive: boolean;
        };
        stats: {
            strength: number;
            defense: number;
            agility: number;
            intelligence: number;
            luck: number;
        };
        achievements: {
            totalGoldStolen: number;
            questsCompleted: number;
            enemiesDefeated: number;
        };
        timestamps: {
            createdAt: number;
            lastUpdated: number;
        };
    };
}

export interface MetadataAttribute {
    trait_type: string;
    value: string | number;
    display_type?: 'number' | 'boost_number' | 'boost_percentage' | 'date';
    max_value?: number;
}

export const ARCHETYPE_DATA = {
    0: {
        name: 'The Blacksmith',
        description: 'A skilled tradesman who knows weapons and armor better than anyone. Gets discounts and can repair gear.',
        emoji: '🔨',
        role: 'Balanced',
        rarity: 'Common'
    },
    1: {
        name: 'The Rogue',
        description: 'A stealthy criminal who excels at sneaking and stealing. High agility and lockpicking skills.',
        emoji: '🗡️',
        role: 'Damage',
        rarity: 'Common'
    },
    2: {
        name: 'The Knight',
        description: 'A noble warrior with high defense and combat skills. Protects others and leads by example.',
        emoji: '🛡️',
        role: 'Tank',
        rarity: 'Common'
    },
    3: {
        name: 'The Mage',
        description: 'A mystical spellcaster who uses magic to support allies and debuff enemies.',
        emoji: '🔮',
        role: 'Support',
        rarity: 'Common'
    },
    4: {
        name: 'The Robin Hood',
        description: 'A charismatic leader who steals from the rich and gives to the poor. High charm and leadership.',
        emoji: '🏹',
        role: 'Support',
        rarity: 'Uncommon'
    },
    5: {
        name: 'The Prince',
        description: 'A royal heir with natural leadership abilities and diplomatic skills. Commands respect and loyalty.',
        emoji: '👑',
        role: 'Balanced',
        rarity: 'Rare'
    },
    6: {
        name: 'The Necromancer',
        description: 'A dark mage who commands the undead and drains life from enemies. Powerful but dangerous.',
        emoji: '💀',
        role: 'Damage',
        rarity: 'Epic'
    },
    7: {
        name: 'The Paladin',
        description: 'A holy warrior who combines combat prowess with divine magic. Protects the innocent.',
        emoji: '⚔️',
        role: 'Tank',
        rarity: 'Epic'
    },
    8: {
        name: 'The Crime Lord',
        description: 'The ultimate criminal mastermind with connections, resources, and unmatched power.',
        emoji: '🎩',
        role: 'Balanced',
        rarity: 'Legendary'
    },
    9: {
        name: 'The Dragon Tamer',
        description: 'A legendary beast master who can summon and control dragons. The most powerful of all.',
        emoji: '🐉',
        role: 'Damage',
        rarity: 'Legendary'
    }
} as const;

/**
 * Generate complete NFT metadata for a character
 */
export function generateCharacterMetadata(
    tokenId: number,
    archetypeId: number,
    characterName: string,
    goldBalance: bigint,
    gameState: any,
    imageIPFSHash: string,
    baseURL: string = 'https://crimelizard.tech'
): CharacterMetadata {
    const archetype = ARCHETYPE_DATA[archetypeId as keyof typeof ARCHETYPE_DATA] || ARCHETYPE_DATA[0];

    // Calculate power score
    const powerScore = (
        (gameState.level || 1) * 10 +
        (gameState.strength || 5) +
        (gameState.defense || 5) +
        (gameState.agility || 5) +
        (gameState.intelligence || 5) +
        (gameState.luck || 5)
    );

    const metadata: CharacterMetadata = {
        name: `${characterName} #${tokenId}`,
        description: `${archetype.emoji} ${archetype.name} - ${archetype.description}\n\n` +
            `Level ${gameState.level || 1} ${archetype.rarity} character in the Legend of the Crime Lizard RPG. ` +
            `Currently at ${gameState.currentLocation || 'Town Square'}. ` +
            `${gameState.isAlive ? 'Ready for adventure! 🗡️' : 'Awaiting respawn... 💀'}`,

        image: `https://gateway.pinata.cloud/ipfs/${imageIPFSHash}`,
        external_url: `${baseURL}/legend?character=${tokenId}`,

        attributes: [
            // Core Identity
            {
                trait_type: 'Archetype',
                value: archetype.name
            },
            {
                trait_type: 'Rarity',
                value: archetype.rarity
            },
            {
                trait_type: 'Role',
                value: archetype.role
            },

            // Progression
            {
                trait_type: 'Level',
                value: gameState.level || 1,
                display_type: 'number'
            },
            {
                trait_type: 'Experience',
                value: gameState.experience || 0,
                display_type: 'number'
            },
            {
                trait_type: 'Power Score',
                value: powerScore,
                display_type: 'number'
            },

            // Resources
            {
                trait_type: 'Gold Balance',
                value: Number(goldBalance),
                display_type: 'number'
            },
            {
                trait_type: 'Health',
                value: gameState.health || 50,
                display_type: 'boost_number',
                max_value: gameState.maxHealth || 50
            },
            {
                trait_type: 'Mana',
                value: gameState.mana || 50,
                display_type: 'boost_number',
                max_value: gameState.maxMana || 50
            },

            // Combat Stats
            {
                trait_type: 'Strength',
                value: gameState.strength || 5,
                display_type: 'number'
            },
            {
                trait_type: 'Defense',
                value: gameState.defense || 5,
                display_type: 'number'
            },
            {
                trait_type: 'Agility',
                value: gameState.agility || 5,
                display_type: 'number'
            },
            {
                trait_type: 'Intelligence',
                value: gameState.intelligence || 5,
                display_type: 'number'
            },
            {
                trait_type: 'Luck',
                value: gameState.luck || 5,
                display_type: 'number'
            },

            // Achievements
            {
                trait_type: 'Total Gold Stolen',
                value: gameState.totalGoldStolen || 0,
                display_type: 'number'
            },
            {
                trait_type: 'Quests Completed',
                value: gameState.questsCompleted || 0,
                display_type: 'number'
            },
            {
                trait_type: 'Enemies Defeated',
                value: gameState.enemiesDefeated || 0,
                display_type: 'number'
            },

            // Status
            {
                trait_type: 'Location',
                value: gameState.currentLocation || 'Town Square'
            },
            {
                trait_type: 'Status',
                value: gameState.isAlive ? 'Alive' : 'Dead'
            },
            {
                trait_type: 'Created',
                value: gameState.createdAt || Math.floor(Date.now() / 1000),
                display_type: 'date'
            }
        ],

        properties: {
            archetype: archetype.name,
            archetypeId: archetypeId,
            level: gameState.level || 1,
            goldBalance: goldBalance.toString(),
            gameState: {
                health: gameState.health || 50,
                maxHealth: gameState.maxHealth || 50,
                mana: gameState.mana || 50,
                maxMana: gameState.maxMana || 50,
                location: gameState.currentLocation || 'Town Square',
                isAlive: gameState.isAlive !== false
            },
            stats: {
                strength: gameState.strength || 5,
                defense: gameState.defense || 5,
                agility: gameState.agility || 5,
                intelligence: gameState.intelligence || 5,
                luck: gameState.luck || 5
            },
            achievements: {
                totalGoldStolen: gameState.totalGoldStolen || 0,
                questsCompleted: gameState.questsCompleted || 0,
                enemiesDefeated: gameState.enemiesDefeated || 0
            },
            timestamps: {
                createdAt: gameState.createdAt || Math.floor(Date.now() / 1000),
                lastUpdated: Math.floor(Date.now() / 1000)
            }
        }
    };

    return metadata;
}

/**
 * Get image IPFS hash for archetype
 * Returns default character.jpg hash or archetype-specific hash
 */
export function getArchetypeImageHash(archetypeId: number, characterImageHashes?: Map<number, string>): string {
    // Check if archetype has custom image
    if (characterImageHashes && characterImageHashes.has(archetypeId)) {
        return characterImageHashes.get(archetypeId)!;
    }

    // Default image hashes per archetype (to be uploaded)
    const defaultHashes: { [key: number]: string } = {
        0: 'QmBlacksmith', // Blacksmith - TODO: Upload actual image
        1: 'QmRogue',      // Rogue
        2: 'QmKnight',     // Knight
        3: 'QmMage',       // Mage
        4: 'QmRobinHood',  // Robin Hood
        5: 'QmPrince',     // Prince
        6: 'QmNecromancer', // Necromancer
        7: 'QmPaladin',    // Paladin
        8: 'QmCrimeLord',  // Crime Lord
        9: 'QmDragonTamer' // Dragon Tamer
    };

    // Return archetype-specific hash or fallback to character.jpg
    return defaultHashes[archetypeId] || 'QmDefaultCharacter'; // Will be replaced with actual character.jpg hash
}

/**
 * Upload image to IPFS via Pinata
 */
export async function uploadImageToIPFS(
    imageBuffer: Buffer,
    fileName: string,
    tokenId: number,
    pinataJWT: string
): Promise<string> {
    const FormData = (await import('form-data')).default;
    const axios = (await import('axios')).default;

    const formData = new FormData();
    formData.append('file', imageBuffer, fileName);

    const metadata = JSON.stringify({
        name: `character-${tokenId}-${fileName}`,
        keyvalues: {
            tokenId: tokenId.toString(),
            type: 'character-image',
            archetype: 'custom'
        }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
        cidVersion: 1
    });
    formData.append('pinataOptions', options);

    const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${pinataJWT}`
            }
        }
    );

    return response.data.IpfsHash;
}

/**
 * Upload metadata JSON to IPFS via Pinata
 */
export async function uploadMetadataToIPFS(
    metadata: CharacterMetadata,
    tokenId: number,
    pinataJWT: string
): Promise<string> {
    const axios = (await import('axios')).default;

    const data = JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
            name: `character-${tokenId}-metadata.json`,
            keyvalues: {
                tokenId: tokenId.toString(),
                characterName: metadata.name,
                level: metadata.properties.level.toString(),
                goldBalance: metadata.properties.goldBalance
            }
        },
        pinataOptions: {
            cidVersion: 1
        }
    });

    const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        data,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pinataJWT}`
            }
        }
    );

    return response.data.IpfsHash;
}

