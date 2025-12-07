/**
 * Character Metadata Service
 *
 * This service acts as the authorized game server that:
 * - Updates character game state on-chain
 * - Generates and uploads metadata to IPFS via Pinata
 * - Updates NFT token URIs
 * - Manages gold balances via the Gold contract
 */

import { ethers } from 'ethers';
import { PinataService } from './PinataService';

interface GameStateUpdate {
  tokenId: number;
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
  isAlive: boolean;
}

export class CharacterMetadataService {
  // @ts-expect-error - Provider stored for future use but not currently accessed directly
  private _provider: ethers.Provider; // Prefixed with _ as it's assigned but not read
  private signer: ethers.Signer;
  private legendContract: ethers.Contract;
  private goldContract: ethers.Contract;
  private pinataService: PinataService;
  private imageIPFSHashes: Map<number, string>; // archetype -> IPFS hash

  constructor(
    provider: ethers.Provider,
    privateKey: string,
    legendContractAddress: string,
    goldContractAddress: string,
    legendAbi: any[],
    goldAbi: any[],
    pinataApiKey: string,
    pinataApiSecret: string,
    pinataJWT: string
  ) {
    this._provider = provider;
    this.signer = new ethers.Wallet(privateKey, provider);
    this.legendContract = new ethers.Contract(
      legendContractAddress,
      legendAbi,
      this.signer
    );
    this.goldContract = new ethers.Contract(
      goldContractAddress,
      goldAbi,
      this.signer
    );
    this.pinataService = new PinataService(pinataApiKey, pinataApiSecret, pinataJWT);
    this.imageIPFSHashes = new Map();

    // Initialize default archetype images
    this._initializeArchetypeImages();
  }

  /**
   * Initialize default IPFS hashes for archetype images
   * These should be pre-uploaded to Pinata
   */
  private _initializeArchetypeImages() {
    // TODO: Upload archetype images to Pinata and update these hashes
    // For now, using placeholder structure
    this.imageIPFSHashes.set(0, 'QmBlacksmith...'); // The Blacksmith
    this.imageIPFSHashes.set(1, 'QmRogue...'); // The Rogue
    this.imageIPFSHashes.set(2, 'QmKnight...'); // The Knight
    this.imageIPFSHashes.set(3, 'QmMage...'); // The Mage
    this.imageIPFSHashes.set(4, 'QmRobinHood...'); // The Robin Hood
    this.imageIPFSHashes.set(5, 'QmPrince...'); // The Prince
    this.imageIPFSHashes.set(6, 'QmNecromancer...'); // The Necromancer
    this.imageIPFSHashes.set(7, 'QmPaladin...'); // The Paladin
    this.imageIPFSHashes.set(8, 'QmCrimeLord...'); // The Crime Lord
    this.imageIPFSHashes.set(9, 'QmDragonTamer...'); // The Dragon Tamer
  }

  /**
   * Set custom image IPFS hash for a specific archetype
   */
  setArchetypeImage(archetype: number, ipfsHash: string) {
    this.imageIPFSHashes.set(archetype, ipfsHash);
  }

  /**
   * Update character game state and metadata
   */
  async updateCharacter(update: GameStateUpdate): Promise<string> {
    try {
// 1. Get character data from contract
      const character = await this.legendContract.getCharacter(update.tokenId);

      // 2. Get archetype-specific image
      const imageIPFSHash = this.imageIPFSHashes.get(character.archetype) || 'QmDefault...';

      // 3. Generate and upload metadata to IPFS
const metadataHash = await this.pinataService.updateCharacterMetadata(
        update.tokenId,
        {
          archetype: character.archetype,
          name: character.name,
          mintPrice: character.mintPrice.toString(),
          createdAt: Number(character.createdAt),
          exists: character.exists
        },
        {
          level: update.level,
          experience: update.experience,
          health: update.health,
          maxHealth: update.maxHealth,
          mana: update.mana,
          maxMana: update.maxMana,
          strength: update.strength,
          defense: update.defense,
          agility: update.agility,
          intelligence: update.intelligence,
          luck: update.luck,
          currentLocation: update.currentLocation,
          totalGoldStolen: update.totalGoldStolen,
          questsCompleted: update.questsCompleted,
          enemiesDefeated: update.enemiesDefeated,
          lastUpdated: Math.floor(Date.now() / 1000),
          isAlive: update.isAlive
        },
        imageIPFSHash
      );
// 4. Update game state on-chain
const gameStateTx = await this.legendContract.updateGameState(
        update.tokenId,
        {
          level: update.level,
          experience: update.experience,
          health: update.health,
          maxHealth: update.maxHealth,
          mana: update.mana,
          maxMana: update.maxMana,
          strength: update.strength,
          defense: update.defense,
          agility: update.agility,
          intelligence: update.intelligence,
          luck: update.luck,
          currentLocation: update.currentLocation,
          totalGoldStolen: update.totalGoldStolen,
          questsCompleted: update.questsCompleted,
          enemiesDefeated: update.enemiesDefeated,
          lastUpdated: Math.floor(Date.now() / 1000),
          isAlive: update.isAlive
        }
      );
      await gameStateTx.wait();
// 5. Update token URI on-chain
const uriTx = await this.legendContract.updateTokenMetadataURI(
        update.tokenId,
        `ipfs://${metadataHash}`
      );
      await uriTx.wait();
return metadataHash;
    } catch (error) {
      console.error(`Error updating character #${update.tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Update only character stats (more gas-efficient)
   */
  async updateCharacterStats(
    tokenId: number,
    strength: number,
    defense: number,
    agility: number,
    intelligence: number,
    luck: number
  ): Promise<void> {
    try {
      const tx = await this.legendContract.updateCharacterStats(
        tokenId,
        strength,
        defense,
        agility,
        intelligence,
        luck
      );
      await tx.wait();
} catch (error) {
      console.error(`Error updating stats for character #${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Update character health and alive status
   */
  async updateCharacterHealth(
    tokenId: number,
    health: number,
    isAlive: boolean
  ): Promise<void> {
    try {
      const tx = await this.legendContract.updateCharacterHealth(
        tokenId,
        health,
        isAlive
      );
      await tx.wait();
} catch (error) {
      console.error(`Error updating health for character #${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Update character progress (level, XP, etc.)
   */
  async updateCharacterProgress(
    tokenId: number,
    level: number,
    experience: number,
    totalGoldStolen: number,
    questsCompleted: number,
    enemiesDefeated: number
  ): Promise<void> {
    try {
      const tx = await this.legendContract.updateCharacterProgress(
        tokenId,
        level,
        experience,
        totalGoldStolen,
        questsCompleted,
        enemiesDefeated
      );
      await tx.wait();
} catch (error) {
      console.error(`Error updating progress for character #${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Update character location
   */
  async updateCharacterLocation(
    tokenId: number,
    location: string
  ): Promise<void> {
    try {
      const tx = await this.legendContract.updateCharacterLocation(
        tokenId,
        location
      );
      await tx.wait();
} catch (error) {
      console.error(`Error updating location for character #${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Award gold to character
   */
  async awardGold(
    tokenId: number,
    amount: number,
    reason: string
  ): Promise<void> {
    try {
      const tx = await this.goldContract.gameAddGold(tokenId, amount, reason);
      await tx.wait();
} catch (error) {
      console.error(`Error awarding gold to character #${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Spend character gold
   */
  async spendGold(
    tokenId: number,
    amount: number,
    reason: string
  ): Promise<void> {
    try {
      const tx = await this.goldContract.gameSpendGold(tokenId, amount, reason);
      await tx.wait();
} catch (error) {
      console.error(`Error spending gold for character #${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get current game state from contract
   */
  async getGameState(tokenId: number): Promise<any> {
    try {
      return await this.legendContract.getGameState(tokenId);
    } catch (error) {
      console.error(`Error getting game state for character #${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get character gold balance
   */
  async getGoldBalance(tokenId: number): Promise<bigint> {
    try {
      return await this.goldContract.getGoldBalance(tokenId);
    } catch (error) {
      console.error(`Error getting gold balance for character #${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Batch update multiple characters (for efficiency)
   */
  async batchUpdateCharacters(updates: GameStateUpdate[]): Promise<void> {
for (const update of updates) {
      try {
        await this.updateCharacter(update);
      } catch (error) {
        console.error(`Error in batch update for character #${update.tokenId}:`, error);
        // Continue with other updates
      }
    }
}

  /**
   * Initialize metadata for newly minted character
   */
  async initializeNewCharacter(tokenId: number): Promise<string> {
    try {
// Get character and game state from contract
      const [character, gameState] = await this.legendContract.getCharacterWithGameState(tokenId);

      // Get archetype image
      const imageIPFSHash = this.imageIPFSHashes.get(character.archetype) || 'QmDefault...';

      // Upload initial metadata
      const metadataHash = await this.pinataService.updateCharacterMetadata(
        tokenId,
        {
          archetype: character.archetype,
          name: character.name,
          mintPrice: character.mintPrice.toString(),
          createdAt: Number(character.createdAt),
          exists: character.exists
        },
        {
          level: Number(gameState.level),
          experience: Number(gameState.experience),
          health: Number(gameState.health),
          maxHealth: Number(gameState.maxHealth),
          mana: Number(gameState.mana),
          maxMana: Number(gameState.maxMana),
          strength: gameState.strength,
          defense: gameState.defense,
          agility: gameState.agility,
          intelligence: gameState.intelligence,
          luck: gameState.luck,
          currentLocation: gameState.currentLocation,
          totalGoldStolen: Number(gameState.totalGoldStolen),
          questsCompleted: Number(gameState.questsCompleted),
          enemiesDefeated: Number(gameState.enemiesDefeated),
          lastUpdated: Number(gameState.lastUpdated),
          isAlive: gameState.isAlive
        },
        imageIPFSHash
      );

      // Set initial token URI
      const tx = await this.legendContract.updateTokenMetadataURI(
        tokenId,
        `ipfs://${metadataHash}`
      );
      await tx.wait();
return metadataHash;
    } catch (error) {
      console.error(`Error initializing new character #${tokenId}:`, error);
      throw error;
    }
  }
}

// Example usage:
/*
const service = new CharacterMetadataService(
  provider,
  process.env.GAME_SERVER_PRIVATE_KEY!,
  legendContractAddress,
  goldContractAddress,
  legendAbi,
  goldAbi,
  process.env.PINATA_API_KEY!,
  process.env.PINATA_API_SECRET!,
  process.env.PINATA_JWT!
);

// When player levels up:
await service.updateCharacter({
  tokenId: 1,
  level: 5,
  experience: 1250,
  health: 180,
  maxHealth: 180,
  // ... other fields
});

// When player earns gold:
await service.awardGold(1, 100, "Defeated goblin");

// When player completes quest:
await service.updateCharacterProgress(
  1,
  5, // level
  1250, // xp
  500, // total gold stolen
  3, // quests completed
  15 // enemies defeated
);
*/
