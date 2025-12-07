# Crime Lizard Games

The first AI-powered play-to-earn RPG built exclusively on **BNB Smart Chain (BSC)** featuring AI-customized NFT characters, on-chain casino games, prediction markets, and daily crypto news.

![BNB Chain](https://img.shields.io/badge/BNB%20Chain-F0B90B?style=for-the-badge&logo=binance&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)

## Technology Stack

- **Blockchain**: BNB Smart Chain (BSC Mainnet)
- **Smart Contracts**: Solidity ^0.8.20
- **Frontend**: React 18 + TypeScript + ethers.js v6
- **Development**: Hardhat, OpenZeppelin Contracts
- **Storage**: IPFS via Pinata for NFT metadata

## Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| **BNB Smart Chain Mainnet** | 56 | **Live** |
| BNB Smart Chain Testnet | 97 | Development |

> **Note**: This dApp is built exclusively for BNB Smart Chain. All smart contracts are deployed and verified on BSC Mainnet.

## Contract Addresses

All contracts are deployed and verified on **BNB Smart Chain Mainnet (Chain ID: 56)**:

| Contract | Address | BSCScan |
|----------|---------|---------|
| Character NFT | `0x1d6F35Ba896005beB35e7776E408A3fAf42B92D0` | [View](https://bscscan.com/address/0x1d6F35Ba896005beB35e7776E408A3fAf42B92D0) |
| Gold Token | `0x70C90e46C97086bE5c788618cE7Ad67f22EA6a3E` | [View](https://bscscan.com/address/0x70C90e46C97086bE5c788618cE7Ad67f22EA6a3E) |
| Dice Game | `0x71eddE644B160CB95aB89e53d8F758c1E548a505` | [View](https://bscscan.com/address/0x71eddE644B160CB95aB89e53d8F758c1E548a505) |
| Slots Game | `0xDA408551780187263f584115985F96AAAA96721F` | [View](https://bscscan.com/address/0xDA408551780187263f584115985F96AAAA96721F) |
| Predictions | `0x472F1f89c6226a5682DEe4b9948D3200acC50aEe` | [View](https://bscscan.com/address/0x472F1f89c6226a5682DEe4b9948D3200acC50aEe) |

## Features

- **AI-Customized NFT Characters**: Mint unique lizards with fully customizable AI-generated artwork - describe your character and watch it come to life on BSC
- **On-Chain Casino Games**: Dice and slots with transparent game logic, all transactions verified on BNB Chain
- **Prediction Markets**: Bet Gold on live crypto prices, token launches, and market events
- **Daily Crypto News**: In-game AI-curated news feed for BNB Chain and market updates
- **Legend RPG Mode**: Explore towns, visit shops, fight enemies, complete quests
- **In-Game Gold Economy**: Earn, spend, and trade Gold tokens across all game modes
- **AI Game Master**: Dynamic AI-powered narration for immersive gameplay
- **Real-time Multiplayer**: Live chat, global leaderboards, and social features
- **Gas-Efficient Design**: Optimized for low-cost transactions on BNB Smart Chain

## Overview

Crime Lizard Games is a fully on-chain gaming ecosystem deployed on BNB Smart Chain where players:
1. Mint unique NFT characters with AI-generated artwork
2. Explore an immersive RPG world with shops, combat, and quests
3. Play casino games (dice, slots) with on-chain game logic
4. Bet on prediction markets for crypto price movements
5. Stay updated with daily AI-curated crypto news

All game state is stored on-chain on BSC for complete transparency.

## Getting Started

### Prerequisites

- Node.js 18+
- MetaMask or compatible Web3 wallet
- BNB for gas fees (BSC Mainnet)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/crime-lizard-games.git
cd crime-lizard-games

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

See `.env.example` for BSC configuration:

```env
# BNB Smart Chain Configuration
CHAIN_ID=56
VITE_CHAIN_ID=56

# BSC Mainnet RPC
VITE_BSC_MAINNET_RPC=https://bsc-dataseed1.binance.org
VITE_BSC_MAINNET_WS=wss://bsc.publicnode.com

# Contract Addresses (BSC Mainnet)
VITE_CHARACTER_MAINNET=0x1d6F35Ba896005beB35e7776E408A3fAf42B92D0
VITE_GOLD_MAINNET=0x70C90e46C97086bE5c788618cE7Ad67f22EA6a3E
# ... see .env.example for full list
```

### Build for Production

```bash
npm run build
```

## Project Structure

```
crime-lizard-games/
├── src/
│   ├── components/      # React components
│   │   ├── legend/      # RPG game components (shops, combat, quests)
│   │   └── predictions/ # Prediction market components
│   ├── config/          # BSC network and contract configuration
│   ├── contexts/        # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── providers/       # Wallet & Web3 providers
│   ├── services/        # Frontend services (AI, RPC, metadata)
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── public/              # Static assets and game art
├── hardhat.config.js    # Hardhat config for BSC deployment
└── .env.example         # BSC environment configuration
```

## Gameplay

### 1. Mint a Character
Connect your wallet to BSC Mainnet and mint a unique Crime Lizard NFT:
- Describe your character for custom AI-generated artwork
- Randomized base stats (HP, ATK, DEF, Luck)
- Starting Gold balance
- Choose class: Knight, Rogue, or Mage

### 2. Play Casino Games
- **Dice**: Bet Gold, choose your target, roll for multipliers up to 6x
- **Slots**: Spin for jackpots, free spins, and bonus rounds

### 3. Prediction Markets
- Bet Gold on live crypto price movements
- Predict token launches and market events
- Win big on correct predictions

### 4. Daily News
- AI-curated crypto news feed updated daily
- Stay informed on BNB Chain ecosystem updates

### 5. Explore Legend Mode
- Visit the **Armory** and **Weapons Shop** to gear up
- Rest at the **Inn** to restore HP
- Visit the **Healer** when injured
- Fight **Goblins** in the combat arena
- Complete **Quests** for Gold and XP rewards

### 6. Compete & Trade
- Climb the **Leaderboards** for top player status
- Chat with other players in **real-time**
- Trade and tip Gold to other players

## Security

- Smart contracts built with OpenZeppelin security standards
- All game state stored on BNB Chain for transparency
- No private keys or sensitive data stored client-side
- Regular security reviews and testing

## Links

- **Website**: [crimelizard.com](https://crimelizard.com)
- **Twitter**: [@CrimeLizardBNB](https://x.com/CrimeLizardBNB)
- **Telegram**: [t.me/CrimeLizard](https://t.me/CrimeLizard)

## BNB Chain Integration

This project is built exclusively for BNB Smart Chain:

- All 5 smart contracts deployed on BSC Mainnet (Chain ID: 56)
- Uses BSC-native RPC endpoints (`bsc-dataseed1.binance.org`)
- Optimized gas usage for BSC transaction costs
- Native BNB used for gas fees
- BSCScan integration for transaction verification

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with scales and code on BNB Chain
