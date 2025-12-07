/**
 * HOW TO PLAY - Comprehensive Game Guide
 *
 * A complete guide for new players covering:
 * - Getting started (wallet, BNB)
 * - Character creation
 * - Game mechanics
 * - Locations & activities
 * - Earning rewards
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HowToPlayProps {
    isOpen: boolean;
    onClose: () => void;
}

type GuideSection = 'start' | 'character' | 'world' | 'combat' | 'economy' | 'rewards' | 'tips';

const HowToPlay: React.FC<HowToPlayProps> = ({ isOpen, onClose }) => {
    const [activeSection, setActiveSection] = useState<GuideSection>('start');

    const sections: { id: GuideSection; title: string; icon: string }[] = [
        { id: 'start', title: 'Getting Started', icon: '1' },
        { id: 'character', title: 'Your Character', icon: '2' },
        { id: 'world', title: 'The World', icon: '3' },
        { id: 'combat', title: 'Combat', icon: '4' },
        { id: 'economy', title: 'Gold & Banking', icon: '5' },
        { id: 'rewards', title: 'XP & Rewards', icon: '6' },
        { id: 'tips', title: 'Pro Tips', icon: '7' },
    ];

    // Handle ESC key
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-black border-2 border-[#00FF88] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-black border-b-2 border-[#00FF88] p-4 flex justify-between items-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#00FF88] font-bbs">
                            HOW TO PLAY
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-[#00FF88] hover:text-[#FFD700] text-xl font-bold font-bbs"
                        >
                            [ESC] CLOSE
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex flex-wrap border-b-2 border-[#00FF88]/30 bg-black/50">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`px-3 py-2 text-xs md:text-sm font-bbs transition-all ${
                                    activeSection === section.id
                                        ? 'bg-[#00FF88] text-black font-bold'
                                        : 'text-[#00FF88]/70 hover:text-[#00FF88] hover:bg-[#00FF88]/10'
                                }`}
                            >
                                <span className="mr-1">{section.icon}.</span>
                                {section.title}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 font-bbs">
                        {activeSection === 'start' && <GettingStartedSection />}
                        {activeSection === 'character' && <CharacterSection />}
                        {activeSection === 'world' && <WorldSection />}
                        {activeSection === 'combat' && <CombatSection />}
                        {activeSection === 'economy' && <EconomySection />}
                        {activeSection === 'rewards' && <RewardsSection />}
                        {activeSection === 'tips' && <TipsSection />}
                    </div>

                    {/* Footer Navigation */}
                    <div className="border-t-2 border-[#00FF88]/30 p-4 flex justify-between">
                        <button
                            onClick={() => {
                                const idx = sections.findIndex(s => s.id === activeSection);
                                if (idx > 0) setActiveSection(sections[idx - 1].id);
                            }}
                            disabled={activeSection === 'start'}
                            className={`px-4 py-2 font-bbs ${
                                activeSection === 'start'
                                    ? 'text-gray-600 cursor-not-allowed'
                                    : 'text-[#00FF88] hover:bg-[#00FF88]/10 border border-[#00FF88]'
                            }`}
                        >
                            &lt; PREV
                        </button>
                        <button
                            onClick={() => {
                                const idx = sections.findIndex(s => s.id === activeSection);
                                if (idx < sections.length - 1) setActiveSection(sections[idx + 1].id);
                            }}
                            disabled={activeSection === 'tips'}
                            className={`px-4 py-2 font-bbs ${
                                activeSection === 'tips'
                                    ? 'text-gray-600 cursor-not-allowed'
                                    : 'text-[#00FF88] hover:bg-[#00FF88]/10 border border-[#00FF88]'
                            }`}
                        >
                            NEXT &gt;
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Section Components
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="text-xl md:text-2xl font-bold text-[#FFD700] mb-4">{children}</h3>
);

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h4 className="text-lg font-bold text-[#00FF88] mb-2">{title}</h4>
        <div className="text-gray-300 space-y-2">{children}</div>
    </div>
);

const Step: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="flex gap-4 mb-4">
        <div className="flex-shrink-0 w-8 h-8 bg-[#FFD700] text-black flex items-center justify-center font-bold">
            {number}
        </div>
        <div>
            <div className="font-bold text-[#FFD700] mb-1">{title}</div>
            <div className="text-gray-300 text-sm">{children}</div>
        </div>
    </div>
);

const InfoBox: React.FC<{ type: 'tip' | 'warning' | 'info'; children: React.ReactNode }> = ({ type, children }) => {
    const styles = {
        tip: 'border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88]',
        warning: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
        info: 'border-blue-500 bg-blue-500/10 text-blue-400',
    };
    const icons = { tip: '💡', warning: '⚠️', info: 'ℹ️' };

    return (
        <div className={`border-2 p-3 mb-4 ${styles[type]}`}>
            <span className="mr-2">{icons[type]}</span>
            {children}
        </div>
    );
};

const GettingStartedSection: React.FC = () => (
    <div>
        <SectionTitle>Getting Started</SectionTitle>

        <InfoBox type="info">
            Crime Lizard runs on BNB Smart Chain (BSC Mainnet). You'll need a Web3 wallet and some BNB to play.
        </InfoBox>

        <SubSection title="What You Need">
            <Step number={1} title="A Web3 Wallet">
                Install Binance Web3 Wallet, MetaMask, Trust Wallet, or any EVM-compatible wallet.
                Make sure it supports BNB Smart Chain.
            </Step>

            <Step number={2} title="Some BNB for Gas">
                You'll need a small amount of BNB (around 0.005-0.01 BNB) to pay for transaction fees.
                Buy BNB on any exchange and send it to your wallet.
            </Step>

            <Step number={3} title="BNB for Minting (One-Time)">
                Creating your character NFT costs a small mint fee (around 0.005 BNB).
                This is a one-time cost - your character is yours forever!
            </Step>
        </SubSection>

        <SubSection title="Quick Start Guide">
            <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Connect your wallet using the "Connect Wallet" button</li>
                <li>Make sure you're on BNB Smart Chain (Chain ID: 56)</li>
                <li>Create your character by choosing an archetype and minting</li>
                <li>Enter the game world and start your adventure!</li>
            </ol>
        </SubSection>

        <InfoBox type="tip">
            No testnet needed! Everything runs on BNB mainnet with real value.
        </InfoBox>
    </div>
);

const CharacterSection: React.FC = () => (
    <div>
        <SectionTitle>Your Character NFT</SectionTitle>

        <InfoBox type="info">
            Your character is an NFT stored on the blockchain. All progress, gold, and stats are permanently saved!
        </InfoBox>

        <SubSection title="Creating Your Character">
            <p>Choose from 10 unique archetypes, each with different strengths:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div className="border border-[#00FF88]/30 p-3">
                    <div className="font-bold text-[#FFD700]">Blacksmith</div>
                    <div className="text-xs text-gray-400">Craftsman - Equipment discounts, can repair gear</div>
                </div>
                <div className="border border-[#00FF88]/30 p-3">
                    <div className="font-bold text-[#FFD700]">Rogue</div>
                    <div className="text-xs text-gray-400">Critical hit master - Stealth, backstab, extra gold</div>
                </div>
                <div className="border border-[#00FF88]/30 p-3">
                    <div className="font-bold text-[#FFD700]">Knight</div>
                    <div className="text-xs text-gray-400">Tank - High defense, protects party members</div>
                </div>
                <div className="border border-[#00FF88]/30 p-3">
                    <div className="font-bold text-[#FFD700]">Mage</div>
                    <div className="text-xs text-gray-400">Area damage - Powerful spells, bonus XP</div>
                </div>
                <div className="border border-[#00FF88]/30 p-3">
                    <div className="font-bold text-[#FFD700]">Robin Hood</div>
                    <div className="text-xs text-gray-400">Legendary - Bonus for helping the poor</div>
                </div>
                <div className="border border-[#00FF88]/30 p-3">
                    <div className="font-bold text-[#FFD700]">Prince</div>
                    <div className="text-xs text-gray-400">Leader - Extra gold, party buffs</div>
                </div>
                <div className="border border-[#00FF88]/30 p-3">
                    <div className="font-bold text-[#FFD700]">Necromancer</div>
                    <div className="text-xs text-gray-400">Dark magic - Life drain, raise undead</div>
                </div>
                <div className="border border-[#00FF88]/30 p-3">
                    <div className="font-bold text-[#FFD700]">Paladin</div>
                    <div className="text-xs text-gray-400">Holy warrior - Heals allies, smites evil</div>
                </div>
                <div className="border border-[#00FF88]/30 p-3">
                    <div className="font-bold text-[#FFD700]">Crime Lord</div>
                    <div className="text-xs text-gray-400">Ultimate villain - Passive gold, intimidation</div>
                </div>
                <div className="border border-[#00FF88]/30 p-3">
                    <div className="font-bold text-[#FFD700]">Dragon Tamer</div>
                    <div className="text-xs text-gray-400">Beast master - Dragon attacks, bonus boss loot</div>
                </div>
            </div>
        </SubSection>

        <SubSection title="Core Stats">
            <div className="space-y-2 text-sm">
                <div><span className="text-[#00FF88] font-bold">STR (Strength)</span> - Increases your attack damage</div>
                <div><span className="text-[#00FF88] font-bold">DEF (Defense)</span> - Reduces damage taken</div>
                <div><span className="text-[#00FF88] font-bold">CHM (Charm)</span> - Better shop prices, dialogue options</div>
                <div><span className="text-[#00FF88] font-bold">HP (Health)</span> - Your life points in combat</div>
            </div>
        </SubSection>

        <InfoBox type="tip">
            You can own multiple characters! Each one is a separate NFT you can trade on marketplaces.
        </InfoBox>
    </div>
);

const WorldSection: React.FC = () => (
    <div>
        <SectionTitle>The Game World</SectionTitle>

        <p className="text-gray-300 mb-4">
            Explore the town, visit shops, fight monsters, and build your legend. Here are the main locations:
        </p>

        <SubSection title="Town Locations">
            <div className="space-y-3">
                <div className="border-l-4 border-[#FFD700] pl-3">
                    <div className="font-bold text-[#FFD700]">The Scaly Satchel (Bank)</div>
                    <div className="text-sm text-gray-400">
                        Your one-stop shop! Bank your gold, buy weapons/armor, purchase turns, and chat with Gribnak the goblin shopkeeper.
                    </div>
                </div>

                <div className="border-l-4 border-[#00FF88] pl-3">
                    <div className="font-bold text-[#00FF88]">Dark Forest</div>
                    <div className="text-sm text-gray-400">
                        Hunt monsters to earn gold and XP. Different enemies appear based on your level.
                    </div>
                </div>

                <div className="border-l-4 border-red-500 pl-3">
                    <div className="font-bold text-red-400">Healer's Hut</div>
                    <div className="text-sm text-gray-400">
                        Restore HP when damaged. Costs gold based on how much healing you need.
                    </div>
                </div>

                <div className="border-l-4 border-blue-500 pl-3">
                    <div className="font-bold text-blue-400">The Inn</div>
                    <div className="text-sm text-gray-400">
                        Sleep here to protect yourself from night attacks (ganking). Essential for keeping your gold safe!
                    </div>
                </div>

                <div className="border-l-4 border-purple-500 pl-3">
                    <div className="font-bold text-purple-400">Violet's Brothel</div>
                    <div className="text-sm text-gray-400">
                        Premium rest with stat bonuses. Costs more but gives permanent stat boosts!
                    </div>
                </div>

                <div className="border-l-4 border-orange-500 pl-3">
                    <div className="font-bold text-orange-400">The Rekt District</div>
                    <div className="text-sm text-gray-400">
                        Donate gold to the poor to earn XP and Charm. Be a true Robin Hood!
                    </div>
                </div>

                <div className="border-l-4 border-cyan-500 pl-3">
                    <div className="font-bold text-cyan-400">Player List (PvP)</div>
                    <div className="text-sm text-gray-400">
                        Attack other players who didn't sleep at the inn. Steal their gold!
                    </div>
                </div>

                <div className="border-l-4 border-yellow-500 pl-3">
                    <div className="font-bold text-yellow-400">Casino & Dice Games</div>
                    <div className="text-sm text-gray-400">
                        Gamble your gold for a chance at big wins. Slots and dice available!
                    </div>
                </div>
            </div>
        </SubSection>

        <InfoBox type="warning">
            Always sleep at the Inn or Brothel before logging off! Otherwise you can be "ganked" and lose gold overnight.
        </InfoBox>
    </div>
);

const CombatSection: React.FC = () => (
    <div>
        <SectionTitle>Combat System</SectionTitle>

        <SubSection title="How Combat Works">
            <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Enter the Dark Forest or Streets to find enemies</li>
                <li>Each battle costs 1 turn (you get turns daily or can buy more)</li>
                <li>Choose to ATTACK or RUN (fleeing costs your turn)</li>
                <li>Damage is based on your STR vs enemy's DEF</li>
                <li>Win to earn gold and XP, lose and you respawn in town</li>
            </ol>
        </SubSection>

        <SubSection title="Battle Tips">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[#00FF88]/30 p-3">
                    <div className="font-bold text-[#00FF88] mb-1">Upgrade Weapons</div>
                    <div className="text-xs text-gray-400">Better weapons = more damage. Visit the Scaly Satchel!</div>
                </div>
                <div className="border border-[#00FF88]/30 p-3">
                    <div className="font-bold text-[#00FF88] mb-1">Buy Armor</div>
                    <div className="text-xs text-gray-400">Armor reduces damage taken. Essential for harder enemies.</div>
                </div>
                <div className="border border-[#00FF88]/30 p-3">
                    <div className="font-bold text-[#00FF88] mb-1">Watch Your HP</div>
                    <div className="text-xs text-gray-400">Heal before you die! The Healer is cheaper than losing progress.</div>
                </div>
                <div className="border border-[#00FF88]/30 p-3">
                    <div className="font-bold text-[#00FF88] mb-1">Know When to Run</div>
                    <div className="text-xs text-gray-400">If you're low HP, flee! Live to fight another day.</div>
                </div>
            </div>
        </SubSection>

        <SubSection title="PvP Combat">
            <p className="text-sm mb-2">Attack other players to steal their gold!</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                <li>Only offline players who didn't sleep at an inn are attackable</li>
                <li>You can't attack players 5+ levels below you</li>
                <li>Win = steal their gold, Lose = they take yours</li>
                <li>Costs 1 turn per attack</li>
            </ul>
        </SubSection>

        <SubSection title="Boss Raids">
            <p className="text-sm">
                Team up with other players to take down powerful bosses! Visit the Boss Queue to join a raid.
                Coordinate with your team and defeat the boss to share massive rewards.
            </p>
        </SubSection>
    </div>
);

const EconomySection: React.FC = () => (
    <div>
        <SectionTitle>Gold & Economy</SectionTitle>

        <SubSection title="Earning Gold">
            <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                    <span className="text-[#FFD700]">1.</span>
                    <div><span className="text-[#FFD700] font-bold">Combat</span> - Defeat monsters in the Dark Forest</div>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-[#FFD700]">2.</span>
                    <div><span className="text-[#FFD700] font-bold">PvP</span> - Attack and defeat other players</div>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-[#FFD700]">3.</span>
                    <div><span className="text-[#FFD700] font-bold">Quests</span> - Complete quests for gold rewards</div>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-[#FFD700]">4.</span>
                    <div><span className="text-[#FFD700] font-bold">Casino</span> - Win big at slots and dice (risky!)</div>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-[#FFD700]">5.</span>
                    <div><span className="text-[#FFD700] font-bold">Buy with BNB</span> - Purchase gold directly at the Gold Shop</div>
                </div>
            </div>
        </SubSection>

        <SubSection title="The Bank (Safe House)">
            <InfoBox type="tip">
                Gold in your bank is SAFE! If you die in combat, you only lose gold on-hand, not banked gold.
            </InfoBox>
            <p className="text-sm">
                Visit the Scaly Satchel to deposit your gold. This protects it from being lost in combat or stolen by gankers.
                Withdraw when you need to buy items or gamble.
            </p>
        </SubSection>

        <SubSection title="Spending Gold">
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                <li><span className="text-white">Weapons & Armor</span> - Upgrade your gear</li>
                <li><span className="text-white">Healing</span> - Restore HP at the Healer</li>
                <li><span className="text-white">Inn/Brothel</span> - Pay for safe rest</li>
                <li><span className="text-white">Turns</span> - Buy more combat turns</li>
                <li><span className="text-white">Donations</span> - Give to the poor for XP & Charm</li>
                <li><span className="text-white">Gambling</span> - Try your luck at the casino</li>
            </ul>
        </SubSection>

        <InfoBox type="warning">
            Loans are available but be careful! Defaulting on loans will cost you XP and eventually levels.
        </InfoBox>
    </div>
);

const RewardsSection: React.FC = () => (
    <div>
        <SectionTitle>XP & Leaderboard Rewards</SectionTitle>

        <SubSection title="How XP Works">
            <p className="text-sm mb-3">
                XP determines your rank on the leaderboard. The top players win real $CLZD token rewards!
            </p>
            <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                    <span className="text-[#00FF88]">+</span>
                    <div><span className="text-[#00FF88] font-bold">Gold Balance = XP</span> - Your total gold (on-hand + banked) counts as XP 1:1</div>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-[#00FF88]">+</span>
                    <div><span className="text-[#00FF88] font-bold">Combat XP</span> - Earn XP by defeating enemies</div>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-[#00FF88]">+</span>
                    <div><span className="text-[#00FF88] font-bold">Quest XP</span> - Complete quests for bonus XP</div>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-[#00FF88]">+</span>
                    <div><span className="text-[#00FF88] font-bold">Donation XP</span> - Help the poor, earn XP</div>
                </div>
            </div>
        </SubSection>

        <SubSection title="Leaderboard Prizes">
            <div className="border-2 border-[#FFD700] p-4 bg-[#FFD700]/10">
                <div className="text-center mb-3">
                    <div className="text-2xl font-bold text-[#FFD700]">500,000 $CLZD</div>
                    <div className="text-sm text-gray-400">Prize Pool for Top 10 Players</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center">
                        <div className="text-[#FFD700] font-bold">1st Place</div>
                        <div className="text-gray-300">150,000 $CLZD</div>
                    </div>
                    <div className="text-center">
                        <div className="text-gray-300 font-bold">2nd Place</div>
                        <div className="text-gray-300">100,000 $CLZD</div>
                    </div>
                    <div className="text-center">
                        <div className="text-orange-400 font-bold">3rd Place</div>
                        <div className="text-gray-300">75,000 $CLZD</div>
                    </div>
                    <div className="text-center">
                        <div className="text-gray-400 font-bold">4th-10th</div>
                        <div className="text-gray-300">25,000 $CLZD each</div>
                    </div>
                </div>
            </div>
        </SubSection>

        <SubSection title="Bonus XP Opportunities">
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                <li><span className="text-white">Telegram Raidar</span> - High scores earn admin-granted bonus XP</li>
                <li><span className="text-white">Bug Bounties</span> - Report bugs for XP rewards</li>
                <li><span className="text-white">Feature Requests</span> - Great ideas can earn bonus XP</li>
            </ul>
        </SubSection>
    </div>
);

const TipsSection: React.FC = () => (
    <div>
        <SectionTitle>Pro Tips for Success</SectionTitle>

        <div className="space-y-4">
            <div className="border-2 border-[#00FF88] p-4 bg-[#00FF88]/5">
                <div className="font-bold text-[#00FF88] mb-2">1. Always Bank Your Gold</div>
                <div className="text-sm text-gray-300">
                    After winning fights, deposit gold immediately. If you die or get ganked, banked gold is safe!
                </div>
            </div>

            <div className="border-2 border-[#00FF88] p-4 bg-[#00FF88]/5">
                <div className="font-bold text-[#00FF88] mb-2">2. Sleep at the Inn Every Night</div>
                <div className="text-sm text-gray-300">
                    Before logging off, always sleep at the Inn (cheap) or Brothel (bonuses). Players who don't sleep can be attacked and robbed!
                </div>
            </div>

            <div className="border-2 border-[#00FF88] p-4 bg-[#00FF88]/5">
                <div className="font-bold text-[#00FF88] mb-2">3. Upgrade Gear Before Grinding</div>
                <div className="text-sm text-gray-300">
                    Better weapons and armor make combat much easier. Invest in gear early for faster gold farming.
                </div>
            </div>

            <div className="border-2 border-[#00FF88] p-4 bg-[#00FF88]/5">
                <div className="font-bold text-[#00FF88] mb-2">4. Use Your Turns Wisely</div>
                <div className="text-sm text-gray-300">
                    You get limited turns per day. Focus on enemies you can beat efficiently. Don't waste turns on fights you can't win.
                </div>
            </div>

            <div className="border-2 border-[#00FF88] p-4 bg-[#00FF88]/5">
                <div className="font-bold text-[#00FF88] mb-2">5. Donate to the Poor for Charm</div>
                <div className="text-sm text-gray-300">
                    The Rekt District donations give XP AND permanent Charm boosts. High Charm = better shop prices!
                </div>
            </div>

            <div className="border-2 border-[#00FF88] p-4 bg-[#00FF88]/5">
                <div className="font-bold text-[#00FF88] mb-2">6. Complete Quests</div>
                <div className="text-sm text-gray-300">
                    Check the Quest Board and NPCs for quests. They give bonus gold and XP on top of regular rewards.
                </div>
            </div>

            <div className="border-2 border-[#00FF88] p-4 bg-[#00FF88]/5">
                <div className="font-bold text-[#00FF88] mb-2">7. Join Boss Raids</div>
                <div className="text-sm text-gray-300">
                    Team up with other players for boss battles. The rewards are huge and split among participants!
                </div>
            </div>
        </div>

        <div className="mt-6 text-center">
            <div className="text-2xl mb-2">Good luck, Crime Lizard!</div>
            <div className="text-[#00FF88]">May your heists be profitable and your escapes clean.</div>
        </div>
    </div>
);

export default HowToPlay;
