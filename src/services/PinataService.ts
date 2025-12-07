/**
 * Pinata IPFS Service for Crime Lizard NFT Metadata Management
 *
 * This service handles:
 * - Uploading character metadata to IPFS via Pinata
 * - Generating dynamic metadata based on game state
 * - Updating NFT metadata URIs on-chain
 */

import axios from 'axios';

interface CharacterMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: MetadataAttribute[];
  properties?: {
    archetype: string;
    level: number;
    experience: number;
    health: number;
    maxHealth: number;
    mana: number;
    maxMana: number;
    stats: {
      strength: number;
      defense: number;
      agility: number;
      intelligence: number;
      luck: number;
    };
    gameProgress: {
      currentLocation: string;
      totalGoldStolen: number;
      questsCompleted: number;
      enemiesDefeated: number;
    };
    isAlive: boolean;
    createdAt: number;
    lastUpdated: number;
  };
}

interface MetadataAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
  max_value?: number;
}

interface GameState {
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  strength: number;
  defense: number;
  agility: number;
  intelligence: number;
  luck: number;
  currentLocation: string;
  totalGoldStolen: number;
  questsCompleted: number;
  enemiesDefeated: number;
  lastUpdated: number;
  isAlive: boolean;
}

interface Character {
  archetype: number;
  name: string;
  mintPrice: string;
  createdAt: number;
  exists: boolean;
}

export class PinataService {
  // @ts-expect-error - API key stored for future use but currently using JWT for auth
  private _apiKey: string; // Prefixed with _ as it's assigned but not read (using JWT instead)
  // @ts-expect-error - API secret stored for future use but currently using JWT for auth
  private _apiSecret: string; // Prefixed with _ as it's assigned but not read (using JWT instead)
  private jwt: string;
  private gatewayUrl: string;

  constructor(apiKey: string, apiSecret: string, jwt: string) {
    this._apiKey = apiKey;
    this._apiSecret = apiSecret;
    this.jwt = jwt;
    this.gatewayUrl = 'https://gateway.pinata.cloud/ipfs/';
  }

  /**
   * Generate character metadata JSON from game state
   */
  generateMetadata(
    tokenId: number,
    character: Character,
    gameState: GameState,
    imageIPFSHash: string
  ): CharacterMetadata {
    const archetypeNames = [
      'The Blacksmith',
      'The Rogue',
      'The Knight',
      'The Mage',
      'The Robin Hood',
      'The Prince',
      'The Necromancer',
      'The Paladin',
      'The Crime Lord',
      'The Dragon Tamer'
    ];

    const archetypeDescriptions = [
      'A skilled tradesman who knows weapons and armor better than anyone.',
      'A stealthy criminal who excels at sneaking and stealing.',
      'A noble warrior with high defense and combat skills.',
      'A mystical spellcaster who uses magic to support allies.',
      'A charismatic leader who steals from the rich.',
      'A royal heir with natural leadership abilities.',
      'A dark mage who commands the undead.',
      'A holy warrior who combines combat prowess with divine magic.',
      'The ultimate criminal mastermind.',
      'A legendary beast master who can summon dragons.'
    ];

    const archetypeName = archetypeNames[character.archetype] || 'Unknown';
    const archetypeDesc = archetypeDescriptions[character.archetype] || '';

    // Calculate total power score
    const powerScore =
      gameState.level * 10 +
      gameState.strength +
      gameState.defense +
      gameState.agility +
      gameState.intelligence +
      gameState.luck;

    const metadata: CharacterMetadata = {
      name: `${character.name} #${tokenId}`,
      description: `${archetypeName} - ${archetypeDesc}\n\nLevel ${gameState.level} character in the Legend of the Crime Lizard RPG. Current location: ${gameState.currentLocation}. ${gameState.isAlive ? 'Ready for adventure!' : 'Awaiting respawn...'}`,
      image: `${this.gatewayUrl}${imageIPFSHash}`,
      external_url: `https://crimelizard.tech/character/${tokenId}`,
      attributes: [
        {
          trait_type: 'Archetype',
          value: archetypeName
        },
        {
          trait_type: 'Level',
          value: gameState.level,
          display_type: 'number'
        },
        {
          trait_type: 'Experience',
          value: gameState.experience,
          display_type: 'number'
        },
        {
          trait_type: 'Health',
          value: gameState.health,
          display_type: 'boost_number',
          max_value: gameState.maxHealth
        },
        {
          trait_type: 'Mana',
          value: gameState.mana,
          display_type: 'boost_number',
          max_value: gameState.maxMana
        },
        {
          trait_type: 'Strength',
          value: gameState.strength,
          display_type: 'number'
        },
        {
          trait_type: 'Defense',
          value: gameState.defense,
          display_type: 'number'
        },
        {
          trait_type: 'Agility',
          value: gameState.agility,
          display_type: 'number'
        },
        {
          trait_type: 'Intelligence',
          value: gameState.intelligence,
          display_type: 'number'
        },
        {
          trait_type: 'Luck',
          value: gameState.luck,
          display_type: 'number'
        },
        {
          trait_type: 'Power Score',
          value: powerScore,
          display_type: 'number'
        },
        {
          trait_type: 'Location',
          value: gameState.currentLocation
        },
        {
          trait_type: 'Total Gold Stolen',
          value: gameState.totalGoldStolen,
          display_type: 'number'
        },
        {
          trait_type: 'Quests Completed',
          value: gameState.questsCompleted,
          display_type: 'number'
        },
        {
          trait_type: 'Enemies Defeated',
          value: gameState.enemiesDefeated,
          display_type: 'number'
        },
        {
          trait_type: 'Status',
          value: gameState.isAlive ? 'Alive' : 'Dead'
        }
      ],
      properties: {
        archetype: archetypeName,
        level: gameState.level,
        experience: gameState.experience,
        health: gameState.health,
        maxHealth: gameState.maxHealth,
        mana: gameState.mana,
        maxMana: gameState.maxMana,
        stats: {
          strength: gameState.strength,
          defense: gameState.defense,
          agility: gameState.agility,
          intelligence: gameState.intelligence,
          luck: gameState.luck
        },
        gameProgress: {
          currentLocation: gameState.currentLocation,
          totalGoldStolen: gameState.totalGoldStolen,
          questsCompleted: gameState.questsCompleted,
          enemiesDefeated: gameState.enemiesDefeated
        },
        isAlive: gameState.isAlive,
        createdAt: character.createdAt,
        lastUpdated: gameState.lastUpdated
      }
    };

    return metadata;
  }

  /**
   * Upload JSON metadata to IPFS via Pinata
   */
  async uploadMetadata(
    metadata: CharacterMetadata,
    tokenId: number
  ): Promise<string> {
    try {
      const data = JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `character-${tokenId}-metadata.json`,
          keyvalues: {
            tokenId: tokenId.toString(),
            characterName: metadata.name,
            level: metadata.properties?.level.toString() || '1'
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
            'Authorization': `Bearer ${this.jwt}`
          }
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading metadata to Pinata:', error);
      throw error;
    }
  }

  /**
   * Upload image file to IPFS via Pinata
   */
  async uploadImage(
    imageBlob: Blob,
    fileName: string,
    tokenId: number
  ): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, fileName);

      const metadata = JSON.stringify({
        name: fileName,
        keyvalues: {
          tokenId: tokenId.toString(),
          type: 'character-image'
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
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${this.jwt}`
          }
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading image to Pinata:', error);
      throw error;
    }
  }

  /**
   * Update character NFT metadata
   * 1. Generate new metadata from game state
   * 2. Upload to IPFS via Pinata
   * 3. Return IPFS hash for on-chain update
   */
  async updateCharacterMetadata(
    tokenId: number,
    character: Character,
    gameState: GameState,
    imageIPFSHash: string
  ): Promise<string> {
    const metadata = this.generateMetadata(tokenId, character, gameState, imageIPFSHash);
    const ipfsHash = await this.uploadMetadata(metadata, tokenId);
    return ipfsHash;
  }

  /**
   * Batch update multiple character metadata
   */
  async batchUpdateMetadata(
    updates: Array<{
      tokenId: number;
      character: Character;
      gameState: GameState;
      imageIPFSHash: string;
    }>
  ): Promise<Map<number, string>> {
    const results = new Map<number, string>();

    for (const update of updates) {
      try {
        const ipfsHash = await this.updateCharacterMetadata(
          update.tokenId,
          update.character,
          update.gameState,
          update.imageIPFSHash
        );
        results.set(update.tokenId, ipfsHash);
      } catch (error) {
        console.error(`Error updating metadata for token ${update.tokenId}:`, error);
      }
    }

    return results;
  }

  /**
   * Get metadata from IPFS hash
   */
  async getMetadata(ipfsHash: string): Promise<CharacterMetadata> {
    try {
      const response = await axios.get(`${this.gatewayUrl}${ipfsHash}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching metadata from IPFS:', error);
      throw error;
    }
  }

  /**
   * Unpin old metadata to save storage (optional)
   */
  async unpinMetadata(ipfsHash: string): Promise<void> {
    try {
      await axios.delete(
        `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
        {
          headers: {
            'Authorization': `Bearer ${this.jwt}`
          }
        }
      );
    } catch (error) {
      console.error('Error unpinning metadata:', error);
      // Don't throw - unpinning is optional cleanup
    }
  }

  /**
   * List all pinned files for this account
   */
  async listPinnedFiles(tokenId?: number): Promise<any[]> {
    try {
      const params: any = {
        status: 'pinned',
        pageLimit: 100
      };

      if (tokenId) {
        params.metadata = {
          keyvalues: {
            tokenId: {
              value: tokenId.toString(),
              op: 'eq'
            }
          }
        };
      }

      const response = await axios.get(
        'https://api.pinata.cloud/data/pinList',
        {
          headers: {
            'Authorization': `Bearer ${this.jwt}`
          },
          params
        }
      );

      return response.data.rows;
    } catch (error) {
      console.error('Error listing pinned files:', error);
      throw error;
    }
  }
}

// Example usage:
/*
const pinata = new PinataService(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_API_SECRET!,
  process.env.PINATA_JWT!
);

// When a character levels up:
const ipfsHash = await pinata.updateCharacterMetadata(
  tokenId,
  character,
  gameState,
  imageIPFSHash
);

// Then update on-chain:
await characterContract.updateTokenMetadataURI(
  tokenId,
  `ipfs://${ipfsHash}`
);
*/
