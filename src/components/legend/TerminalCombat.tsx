import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { PlayerCharacter, Enemy, Accessory, InventoryItem } from '../../types/legend.types';
import { ENEMIES, ACCESSORIES, scaleEnemyToPlayerLevel, calculateTurnCost, calculateEnemyCritical, calculateDeathPenalties } from '../../data/gameData';
import TerminalInput from './TerminalInput';
import ItemPickupModal from './ItemPickupModal';
import BattleHeader from './BattleHeader';
import GoblinHoard from './GoblinHoard';
import { useLanguage } from '../../contexts/LanguageContext';
import { useEnemyAI } from '../../services/EnemyAI';
import { useQuests } from '../../contexts/QuestContext';
import { useModalClose } from '../../hooks/useModalClose';
import '../../styles/CombatModal.css';

interface TerminalCombatProps {
    player: PlayerCharacter;
    updatePlayer: (updates: Partial<PlayerCharacter>) => void;
    setGameMessage: (message: string) => void;
    ai?: ReturnType<typeof import('../../services/LegendAI').useLegendAI>;
    saveAndChangeLocation?: (newLocation: PlayerCharacter['location']) => Promise<void>;
}

const TerminalCombat: React.FC<TerminalCombatProps> = ({ player, updatePlayer, setGameMessage, ai, saveAndChangeLocation }) => {
    const { language, t } = useLanguage();
    const { generateAppearanceMessage, generateDeathMessage, generateUniqueEnemy } = useEnemyAI();
    const { activeQuests, refreshQuests } = useQuests();
    const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
    const [combatLog, setCombatLog] = useState<string[]>([]);
    const [enemyHealth, setEnemyHealth] = useState(0);
    const [isStunned, setIsStunned] = useState(false); // Player stunned state
    const [enemyStunned, setEnemyStunned] = useState(false); // Enemy stunned state
    const [pendingItem, setPendingItem] = useState<Accessory | null>(null); // Item waiting to be picked up
    const [showShop, setShowShop] = useState(false); // Show shop when out of turns
    const [isAttacking, setIsAttacking] = useState(false); // Prevent rapid-fire attacks
    const combatLogRef = useRef<HTMLDivElement>(null);

    // Handle ESC key and mobile back button to trigger flee
    const handleModalClose = () => {
        setCombatLog(prev => [
            ...prev,
            t.legend.combat.fled,
            '',
            language === 'zh' ? '返回城镇...' : 'Returning to town...'
        ]);
        setTimeout(async () => {
            if (saveAndChangeLocation) {
                await saveAndChangeLocation('town');
            } else {
                updatePlayer({ location: 'town' });
            }
        }, 1000);
    };

    useModalClose(handleModalClose);

    useEffect(() => {
        generateEnemy();
    }, []);

    // Auto-scroll combat log to bottom (terminal style - newest at bottom)
    useEffect(() => {
        if (combatLogRef.current) {
            combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
        }
    }, [combatLog]);

    // AI random events during combat
    useEffect(() => {
        if (!ai) {
            return undefined;
        }

        const checkRandomEvent = async () => {
            // 10% chance for random event each combat
            if (Math.random() < 0.1) {
                const event = await ai.requestEvent(player.location);
                if (event && event.outcome) {
                    addLog(`✨ ${event.description}`);
                    if (event.outcome.goldChange) {
                        updatePlayer({ gold: player.gold + event.outcome.goldChange });
                        addLog(`💰 ${event.outcome.goldChange > 0 ? '+' : ''}${event.outcome.goldChange} gold!`);
                    }
                    if (event.outcome.experienceChange) {
                        updatePlayer({ experience: player.experience + event.outcome.experienceChange });
                        addLog(`⭐ +${event.outcome.experienceChange} XP!`);
                    }
                    if (event.outcome.healthChange) {
                        const newHealth = Math.max(0, Math.min(player.maxHealth, player.health + event.outcome.healthChange));
                        updatePlayer({ health: newHealth });
                        addLog(`${event.outcome.healthChange > 0 ? '❤️ +' : '💔 '}${event.outcome.healthChange} HP!`);
                    }
                    if (event.outcome.message) {
                        setGameMessage(event.outcome.message);
                    }
                }
            }
        };

        // Call async function without awaiting
        checkRandomEvent();
        // Explicitly return undefined to satisfy React
        return undefined;
    }, [currentEnemy]);

    const generateEnemy = async () => {
        const enemyKeys = Object.keys(ENEMIES);

        // Check for rare crypto legend spawns (they have spawnChance property)
        // Only ONE legend can spawn per check - pick a random legend to check
        const cryptoLegends = Object.keys(ENEMIES).filter(key => ENEMIES[key].spawnChance !== undefined);

        if (cryptoLegends.length > 0 && player.level >= 10) {
            // Randomly pick ONE legend to check this encounter
            const randomLegendKey = cryptoLegends[Math.floor(Math.random() * cryptoLegends.length)];
            const legend = ENEMIES[randomLegendKey];

            // Roll for that specific legend's spawn chance
            if (Math.random() < (legend.spawnChance || 0)) {
                const enemy = { ...legend };
                setCurrentEnemy(enemy);
                setEnemyHealth(enemy.maxHealth);
                addLog(`🔶  ${t.legend.combatMessages.rareEncounter}`);

                const legendName = t.legend.enemies[enemy.id]?.name || enemy.name;

                // Generate AI message for rare spawn
                try {
                    const aiMessage = await generateAppearanceMessage({
                        id: enemy.id,
                        name: legendName,
                        description: enemy.description,
                        rarity: 'legendary'
                    }, {
                        level: player.level,
                        name: player.name
                    }, language);
                    addLog(`🔶 ${aiMessage}`);
                } catch (error) {
                    // Fallback to regular message
                    const legendDesc = t.legend.enemies[enemy.id]?.description || enemy.description;
                    addLog(`🔶 ${legendName} appears!`);
                    addLog(`${legendDesc}`);
                }

                addLog(t.legend.combat.typeAttackHelp);
                addLog(``);

                // Send rare spawn notification to Telegram
                try {
                    fetch('/api/telegram/game-update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'rare_spawn',
                            enemyName: legendName,
                            player: player.name || `${player.walletAddress?.slice(0, 6)}...`,
                            level: player.level,
                            message: `${legendName} has appeared! 🌟`
                        })
                    });
                } catch (e) {
                    console.error('Failed to send Telegram notification:', e);
                }

                return;
            }
        }

        // Try to generate AI-powered unique enemy (80% chance)
        let enemy: Enemy | null = null;
        const useAI = Math.random() < 0.8; // 80% chance for AI enemy

        if (useAI) {
            try {
                enemy = await generateUniqueEnemy(player.level, language);
            } catch (error) {
                console.error('Failed to generate AI enemy, using static:', error);
            }
        }

        // Fallback to static enemies if AI generation fails or 20% of the time for variety
        if (!enemy) {
            const levelAppropriate = enemyKeys.filter(key => {
                const staticEnemy = ENEMIES[key];
                // Exclude special spawns and bosses from normal rotation
                if (staticEnemy.spawnChance !== undefined || staticEnemy.rarity === 'boss') return false;
                return staticEnemy.level >= player.level - 2 && staticEnemy.level <= player.level + 2;
            });

            const enemyKey = levelAppropriate.length > 0
                ? levelAppropriate[Math.floor(Math.random() * levelAppropriate.length)]
                : enemyKeys[Math.floor(Math.random() * enemyKeys.length)];

            enemy = { ...ENEMIES[enemyKey] };
        }

        // Apply enemy scaling based on player level
        enemy = scaleEnemyToPlayerLevel(enemy, player.level);

        setCurrentEnemy(enemy);
        setEnemyHealth(enemy.maxHealth);
        setIsStunned(false);
        setEnemyStunned(false);

        // Show enemy rarity indicator
        const rarityIcon = {
            'common': '⚪',
            'uncommon': '🟢',
            'rare': '🔵',
            'epic': '🟣',
            'legendary': '🟡',
            'boss': '🔴'
        }[enemy.rarity] || '⚪';

        addLog(`${rarityIcon}  ${t.legend.combat.combatEncounter}`);
        addLog(``); // Add empty line for spacing

        // Use translated enemy name and description
        const enemyName = t.legend.enemies[enemy.id]?.name || enemy.name;

        // Generate AI message for enemy appearance
        try {
            const aiMessage = await generateAppearanceMessage({
                id: enemy.id,
                name: enemyName,
                description: enemy.description,
                rarity: enemy.rarity
            }, {
                level: player.level,
                name: player.name
            }, language);
            addLog(aiMessage);
        } catch (error) {
            // Fallback to regular message
            const enemyDesc = t.legend.enemies[enemy.id]?.description || enemy.description;
            addLog(t.legend.combat.youEncounter.replace('{enemy}', enemyName));
            addLog(`${enemyDesc}`);
        }

        // Show special ability if it exists
        if (enemy.specialAbility) {
            addLog(``);
            addLog(`⚠️  ${t.legend.combatMessages.specialAbility.replace('{ability}', enemy.specialAbility.name)}`);
            addLog(`   ${enemy.specialAbility.description}`);
        }

        addLog(``);
        addLog(t.legend.combat.typeAttackHelp);
        addLog(``);
    };

    const addLog = (text: string) => {
        setCombatLog(prev => [...prev, text]);
    };

    const returnToTown = async () => {
        // Save player data before returning to town
        if (saveAndChangeLocation) {
            await saveAndChangeLocation('town');
        } else {
            // Fallback if prop not provided
            updatePlayer({ location: 'town' });
        }
    };

    const attack = async () => {
        if (!currentEnemy) return;

        // Rate limiting - prevent rapid-fire attacks
        if (isAttacking) {
            addLog(`⏳ ${t.legend.combat.pleaseWaitAttack}`);
            return;
        }

        if (player.turnsRemaining <= 0) {
            addLog(`⚠️ ${t.legend.combat.noTurnsRemaining}`);
            addLog('');
            addLog(`💰 ${t.legend.combat.needMoreTurns}`);
            setShowShop(true); // Open shop when out of turns
            return;
        }

        // Check if player is stunned
        if (isStunned) {
            addLog(`💫 ${t.legend.combat.youAreStunned}`);
            setIsStunned(false); // Stun only lasts 1 turn
            // Enemy still gets to attack
            enemyCounterAttack();
            return;
        }

        setIsAttacking(true);

        // Calculate player base damage
        let baseDamage = player.strength + (player.weapon?.attackBonus || 0);

        // Apply armor penetration if weapon has it
        let effectiveDefense = currentEnemy.defense;
        if (player.weapon?.advantages?.armorPenetration) {
            effectiveDefense = Math.max(0, effectiveDefense - player.weapon.advantages.armorPenetration);
            addLog(t.legend.combatMessages.armorPenetration.replace('{amount}', player.weapon.advantages.armorPenetration.toString()));
        }

        let playerDamage = Math.max(1, baseDamage - effectiveDefense);

        // Check for CRITICAL HIT
        let isCritical = false;
        const critChance = (player.weapon?.advantages?.criticalChance || 0) + (player.charm || 0);
        if (Math.random() * 100 < critChance) {
            isCritical = true;
            playerDamage *= 2;
            addLog(t.legend.combatMessages.criticalHit);
        }

        // Apply weapon lifesteal
        if (player.weapon?.advantages?.healingOnHit) {
            const healAmount = player.weapon.advantages.healingOnHit;
            const newHealth = Math.min(player.maxHealth, player.health + healAmount);
            updatePlayer({ health: newHealth });
            addLog(t.legend.combatMessages.lifesteal.replace('{amount}', healAmount.toString()));
        }

        const newEnemyHealth = Math.max(0, enemyHealth - playerDamage);
        setEnemyHealth(newEnemyHealth);

        addLog(`>>> ${isCritical ? '💥 ' : ''}${t.legend.combat.strikeFor.replace('{damage}', playerDamage.toString())}`);

        // BNB Chain Golem: Gas Fee Shield - reflects 10% of damage back to attacker
        if (currentEnemy.id === 'bnb_chain_golem') {
            const reflectDamage = Math.ceil(playerDamage * 0.1);
            const newPlayerHP = Math.max(0, player.health - reflectDamage);
            updatePlayer({ health: newPlayerHP });
            addLog(t.legend.combatMessages.gasFeeReflect?.replace('{damage}', reflectDamage.toString()) || `⚡ Gas Fee Shield reflects ${reflectDamage} damage back to you!`);

            if (newPlayerHP <= 0) {
                addLog(``);
                addLog(`💀 ${t.legend.combat.youDefeated}!`);
                const penalties = calculateDeathPenalties(player);
                updatePlayer({
                    health: Math.floor(player.maxHealth * 0.25),
                    gold: Math.max(0, player.gold - penalties.goldLost),
                    experience: Math.max(0, player.experience - penalties.xpLost),
                    location: 'town',
                    deathCount: (player.deathCount || 0) + 1
                });
                setTimeout(async () => {
                    if (saveAndChangeLocation) {
                        await saveAndChangeLocation('town');
                    } else {
                        updatePlayer({ location: 'town' });
                    }
                }, 2000);
                setIsAttacking(false);
                return;
            }
        }

        // Check if enemy defeated
        if (newEnemyHealth <= 0) {
            await handleEnemyDefeated();
            setIsAttacking(false);
            return;
        }

        // CZ Special: SAFU Protocol - Escapes at 10% HP
        if (currentEnemy.id === 'cz_the_wanderer' && newEnemyHealth <= currentEnemy.maxHealth * 0.1) {
            addLog(``);
            addLog(`🔶 ${t.legend.combatMessages.czEscapes}`);
            addLog(t.legend.combatMessages.czQuote);

            // CZ always drops 777 gold and his items
            const goldEarned = 777;
            const expEarned = currentEnemy.experienceReward;

            addLog(``);
            addLog(`💰 ${t.legend.combatMessages.received} ${goldEarned} gold!`);
            addLog(`✨ ${t.legend.combatMessages.received} ${expEarned} XP!`);

            // Drop SAFU items
            await handleItemDrop(currentEnemy, true); // Force drop

            // Calculate turn cost for this enemy
            const czTurnCost = calculateTurnCost(currentEnemy);

            updatePlayer({
                gold: player.gold + goldEarned,
                experience: player.experience + expEarned,
                turnsRemaining: Math.max(0, player.turnsRemaining - czTurnCost),
                enemiesDefeated: player.enemiesDefeated + 1
            });

            setTimeout(() => {
                generateEnemy();
                setIsAttacking(false);
            }, 2000);
            return;
        }

        // Enemy counter-attacks
        await enemyCounterAttack();
        setIsAttacking(false);
    };

    const enemyCounterAttack = async () => {
        if (!currentEnemy || enemyHealth <= 0) return;

        // Check if enemy is stunned
        if (enemyStunned) {
            addLog(`💫 ${currentEnemy.name} is stunned! Cannot attack.`);
            setEnemyStunned(false);
            return;
        }

        // Enemy base damage
        let enemyBaseDamage = currentEnemy.strength;
        let effectivePlayerDefense = player.defense + (player.armor?.defenseBonus || 0);

        // Check for enemy special ability triggers
        if (currentEnemy.specialAbility && Math.random() * 100 < (currentEnemy.specialAbility.chance || 0)) {
            await handleEnemySpecialAbility();
        }

        // Calculate final damage
        let enemyDamage = Math.max(1, enemyBaseDamage - effectivePlayerDefense);

        // Check for enemy critical hit
        const { isCrit, multiplier } = calculateEnemyCritical(currentEnemy);
        if (isCrit) {
            enemyDamage = Math.floor(enemyDamage * multiplier);
            addLog(`💥 ${t.legend.combatMessages.criticalHit || 'CRITICAL HIT!'}`);
        }

        // Check for dodge
        const dodgeChance = player.armor?.advantages?.dodgeChance || 0;
        if (Math.random() * 100 < dodgeChance) {
            addLog(t.legend.combatMessages.dodged);
            return;
        }

        const newPlayerHealth = Math.max(0, player.health - enemyDamage);

        // Apply thorns damage if armor has it
        if (player.armor?.advantages?.thorns) {
            const thornsDamage = player.armor.advantages.thorns;
            const newEnemyHP = Math.max(0, enemyHealth - thornsDamage);
            setEnemyHealth(newEnemyHP);
            const enemyName = t.legend.enemies[currentEnemy.id]?.name || currentEnemy.name;
            addLog(t.legend.combatMessages.thorns.replace('{enemy}', enemyName).replace('{damage}', thornsDamage.toString()));
        }

        addLog(`<<< ${t.legend.combat.strikesBackFor.replace('{enemy}', currentEnemy.name).replace('{damage}', enemyDamage.toString())}`);

        if (newPlayerHealth <= 0) {
            addLog(``);
            addLog(`💀 ${t.legend.combat.youDefeated}!`);
            addLog(``);

            // Calculate death penalties
            const penalties = calculateDeathPenalties(player);

            addLog(`💀 YOU HAVE DIED!`);
            addLog(``);
            addLog(`⚠️  DEATH PENALTIES:`);
            addLog(`   💰 Lost ${penalties.goldLost} gold (25%)`);
            addLog(`   ✨ Lost ${penalties.xpLost} XP (10% of level progress)`);
            addLog(`   ⏱️  Lost ${penalties.turnsLost} turns`);
            addLog(``);
            addLog(`🏥 Respawning in town with ${penalties.respawnHP} HP...`);

            // Update death stats first
            updatePlayer({
                health: penalties.respawnHP,
                gold: Math.max(0, player.gold - penalties.goldLost),
                experience: Math.max(0, player.experience - penalties.xpLost),
                turnsRemaining: Math.max(0, player.turnsRemaining - penalties.turnsLost),
                deathCount: (player.deathCount || 0) + 1
            });

            // Save and return to town after short delay
            setTimeout(async () => {
                if (saveAndChangeLocation) {
                    await saveAndChangeLocation('town');
                } else {
                    updatePlayer({ location: 'town' });
                }
            }, 2000);
            return;
        }

        const newTurnsRemaining = player.turnsRemaining - 1;

        updatePlayer({
            health: newPlayerHealth,
            turnsRemaining: newTurnsRemaining
        });

        // Auto-flee if out of turns
        if (newTurnsRemaining <= 0) {
            addLog('');
            addLog(`⚠️ ${t.legend.combat.noTurnsRemaining}`);
            addLog(language === 'zh' ? '自动返回城镇...' : 'Automatically returning to town...');
            setTimeout(() => returnToTown(), 2000);
        }
    };

    const handleEnemySpecialAbility = async () => {
        if (!currentEnemy?.specialAbility) return;

        const ability = currentEnemy.specialAbility;
        const enemyName = t.legend.enemies[currentEnemy.id]?.name || currentEnemy.name;

        addLog(``);
        addLog(t.legend.combatMessages.abilityUsed.replace('{enemy}', enemyName).replace('{ability}', ability.name));

        // Handle different ability types
        switch (currentEnemy.id) {
            case 'forest_goblin':
                // Gold Snatch - steal 5 gold
                const stolen = Math.min(5, player.gold);
                if (stolen > 0) {
                    updatePlayer({ gold: player.gold - stolen });
                    addLog(t.legend.combatMessages.goldLost.replace('{amount}', stolen.toString()));
                }
                break;

            case 'corrupted_wolf':
                // Pack Hunter - attack twice
                addLog(t.legend.combatMessages.packAttack);
                // This is handled in the main attack logic
                break;

            case 'dark_forest_troll':
                // Regeneration
                const healAmount = 5;
                const newHP = Math.min(currentEnemy.maxHealth, enemyHealth + healAmount);
                setEnemyHealth(newHP);
                addLog(t.legend.combatMessages.regenerates.replace('{enemy}', enemyName).replace('{amount}', healAmount.toString()));
                break;

            case 'shadow_assassin':
                // Backstab - already handled via damage multiplier
                addLog(t.legend.combatMessages.backstabAttack);
                break;

            case 'corrupted_ent':
                // Root Entangle - stun player
                setIsStunned(true);
                addLog(t.legend.combatMessages.entangled);
                break;

            case 'crypto_witch':
                // Curse of FOMO - reduce defense (handled in damage calc)
                addLog(t.legend.combatMessages.cursedFomo);
                break;

            case 'ogre_whale':
                // Diamond Hands - bonus defense when low HP
                if (enemyHealth < currentEnemy.maxHealth * 0.5) {
                    addLog(t.legend.combatMessages.diamondHandsActive);
                }
                break;

            case 'giant_sewer_rat':
                // Disease Bite - reduce max HP by 5 for this battle
                const diseaseReduction = 5;
                const newMaxHP = Math.max(10, player.maxHealth - diseaseReduction);
                const newHealth = Math.min(player.health, newMaxHP);
                updatePlayer({ maxHealth: newMaxHP, health: newHealth });
                addLog(t.legend.combatMessages.diseaseBite?.replace('{amount}', diseaseReduction.toString()) || `🦠 Disease Bite! Your max HP reduced by ${diseaseReduction}!`);
                break;

            case 'dark_elf_noble':
                // Shadow Magic - blind player (reduce accuracy)
                // This adds a miss chance that will be checked in next attack
                addLog(t.legend.combatMessages.shadowBlind || '👁️ Shadow Magic blinds you! Accuracy reduced!');
                break;

            case 'treasure_drake':
                // Fire Breath - 1.5x damage
                const fireBreathDamage = Math.floor(currentEnemy.strength * 1.5);
                const fireHealth = Math.max(0, player.health - fireBreathDamage);
                updatePlayer({ health: fireHealth });
                addLog(t.legend.combatMessages.fireBreath?.replace('{enemy}', enemyName).replace('{damage}', fireBreathDamage.toString()) || `🔥 Fire Breath! ${enemyName} deals ${fireBreathDamage} fire damage!`);
                break;

            case 'shadow_wyrm':
                // Shadow Flame - 2x damage + drain 10 HP
                const shadowFlameDamage = currentEnemy.strength * 2;
                const drainAmount = 10;
                const shadowHealth = Math.max(0, player.health - shadowFlameDamage);
                const wyrmnewHP = Math.min(currentEnemy.maxHealth, enemyHealth + drainAmount);
                updatePlayer({ health: shadowHealth });
                setEnemyHealth(wyrmnewHP);
                addLog(t.legend.combatMessages.shadowFlame?.replace('{enemy}', enemyName).replace('{damage}', shadowFlameDamage.toString()) || `🖤 Shadow Flame! ${enemyName} deals ${shadowFlameDamage} dark damage!`);
                addLog(t.legend.combatMessages.lifeDrained?.replace('{amount}', drainAmount.toString()) || `💀 ${drainAmount} HP drained!`);
                break;

            case 'fallen_knight':
                // Shield Bash - stun player
                setIsStunned(true);
                addLog(t.legend.combatMessages.shieldBash || '🛡️ Shield Bash! You are stunned!');
                break;

            case 'corrupted_mage':
                // Void Bolt - 1.5x damage and ignore 10 defense
                const voidBoltDamage = Math.floor(currentEnemy.strength * 1.5);
                const voidHealth = Math.max(0, player.health - voidBoltDamage);
                updatePlayer({ health: voidHealth });
                addLog(t.legend.combatMessages.voidBolt?.replace('{damage}', voidBoltDamage.toString()) || `🌀 Void Bolt pierces your defenses for ${voidBoltDamage} damage!`);
                break;

            case 'master_assassin':
                // Critical Strike - triple damage
                const tripleStrikeDamage = currentEnemy.strength * 3;
                const assassinHealth = Math.max(0, player.health - tripleStrikeDamage);
                updatePlayer({ health: assassinHealth });
                addLog(t.legend.combatMessages.criticalStrike || '⚔️ Critical Strike! Triple damage!');
                break;

            case 'blood_demon':
                // Life Drain - steal 50 HP
                const lifeDrainHP = Math.min(50, player.health);
                const drainedHealth = Math.max(0, player.health - lifeDrainHP);
                const demonNewHP = Math.min(currentEnemy.maxHealth, enemyHealth + lifeDrainHP);
                updatePlayer({ health: drainedHealth });
                setEnemyHealth(demonNewHP);
                addLog(t.legend.combatMessages.lifeDrain?.replace('{enemy}', enemyName).replace('{amount}', lifeDrainHP.toString()) || `🩸 Life Drain! ${enemyName} steals ${lifeDrainHP} HP!`);
                break;

            case 'ancient_dragon':
                // Ancient Fire - 2x damage with burning effect
                const ancientFireDamage = currentEnemy.strength * 2;
                const ancientFireHealth = Math.max(0, player.health - ancientFireDamage);
                updatePlayer({ health: ancientFireHealth });
                addLog(t.legend.combatMessages.ancientFire?.replace('{damage}', ancientFireDamage.toString()) || `🐉 Ancient Fire scorches you for ${ancientFireDamage} damage!`);
                break;

            case 'demon_lord':
                // Hellfire - massive fire damage
                const hellfireDamage = Math.floor(currentEnemy.strength * 2.5);
                const hellfireHealth = Math.max(0, player.health - hellfireDamage);
                updatePlayer({ health: hellfireHealth });
                addLog(t.legend.combatMessages.hellfire?.replace('{damage}', hellfireDamage.toString()) || `👹 Hellfire engulfs you for ${hellfireDamage} damage!`);
                break;

            case 'celestial_guardian':
                // Divine Smite - holy damage ignores armor
                const smiteDamage = currentEnemy.strength * 2;
                const smiteHealth = Math.max(0, player.health - smiteDamage);
                updatePlayer({ health: smiteHealth });
                addLog(t.legend.combatMessages.divineSmite?.replace('{damage}', smiteDamage.toString()) || `⚡ Divine Smite ignores your armor for ${smiteDamage} holy damage!`);
                break;

            case 'void_walker':
                // Void Tear - void damage and temporarily reduce max HP
                const voidTearReduction = 20;
                const voidTearMaxHP = Math.max(10, player.maxHealth - voidTearReduction);
                const voidTearHealth = Math.min(player.health, voidTearMaxHP);
                updatePlayer({ maxHealth: voidTearMaxHP, health: voidTearHealth });
                addLog(t.legend.combatMessages.voidTear || '🕳️ Void Tear! Your max HP temporarily reduced!');
                break;

            case 'titan':
                // Earthquake Strike - high damage + stun
                const earthquakeDamage = Math.floor(currentEnemy.strength * 1.5);
                const earthquakeHealth = Math.max(0, player.health - earthquakeDamage);
                updatePlayer({ health: earthquakeHealth });
                setIsStunned(true);
                addLog(t.legend.combatMessages.earthquakeStrike || '💥 Earthquake Strike shakes the ground!');
                break;

            default:
                addLog(`   ${ability.description}`);
        }
    };

    const handleEnemyDefeated = async () => {
        if (!currentEnemy) return;

        const goldEarned = Math.floor(
            Math.random() * (currentEnemy.goldMax - currentEnemy.goldMin + 1) + currentEnemy.goldMin
        );
        const expEarned = currentEnemy.experienceReward;

        addLog(``);

        // Generate AI death message
        try {
            const aiDeathMessage = await generateDeathMessage({
                id: currentEnemy.id,
                name: currentEnemy.name,
                description: currentEnemy.description,
                rarity: currentEnemy.rarity
            }, {
                level: player.level,
                name: player.name
            }, language);
            addLog(`💀 ${aiDeathMessage}`);
        } catch (error) {
            // Fallback to regular message
            addLog(`💀 ${t.legend.combat.enemyDefeated.replace('{enemy}', currentEnemy.name)}`);
        }

        addLog(`💰 ${t.legend.combat.goldEarned} ${goldEarned}`);
        addLog(`✨ ${t.legend.combat.expGained} ${expEarned}`);

        // Check for item drops
        await handleItemDrop(currentEnemy);

        // Update player stats
        const newGold = player.gold + goldEarned;
        let newExp = player.experience + expEarned;  // Changed to let for level up calculation
        const newHeists = player.heistsCompleted + 1;
        const newGoldStolen = player.goldStolen + goldEarned;
        // Calculate turn cost based on enemy level/type
        const turnCost = calculateTurnCost(currentEnemy);
        const newTurns = Math.max(0, player.turnsRemaining - turnCost);
        const newEnemiesDefeated = player.enemiesDefeated + 1;

        // Check for level up (handle multiple level ups if needed)
        let levelUp = false;
        let newLevel = player.level;
        let expToNext = player.experienceToNextLevel;
        let statUpdates: any = {};

        while (newExp >= expToNext) {
            // Subtract the XP needed for this level
            newExp = newExp - expToNext;

            // Level up
            newLevel = newLevel + 1;
            expToNext = Math.floor(expToNext * 1.5);
            levelUp = true;

            addLog(``);
            addLog(`🎉 ★ ${t.legend.combat.levelUp}! ★`);
            addLog(t.legend.combat.youAreNowLevel.replace('{level}', newLevel.toString()));
            addLog(t.legend.combat.levelUpBonus);

            // Add stat bonuses for each level
            const healthBonus = (statUpdates.maxHealth || player.maxHealth) + 10;
            statUpdates = {
                maxHealth: healthBonus,
                health: healthBonus,
                strength: (statUpdates.strength || player.strength) + 2,
                defense: (statUpdates.defense || player.defense) + 2,
                charm: (statUpdates.charm || player.charm) + 1  // BALANCED: +1 charm per level (not +2!)
            };
        }

        updatePlayer({
            gold: newGold,
            experience: newExp,
            level: newLevel,
            experienceToNextLevel: expToNext,
            heistsCompleted: newHeists,
            goldStolen: newGoldStolen,
            turnsRemaining: newTurns,
            enemiesDefeated: newEnemiesDefeated,
            ...statUpdates
        });

        // 🎮 Track Quest Progress - Check all active quests for kill objectives
        if (activeQuests && activeQuests.length > 0) {
            try {
// Call backend to update quest progress for this kill
                const response = await fetch('/api/quests/track-combat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        walletAddress: player.walletAddress,
                        tokenId: player.tokenId,
                        enemyId: currentEnemy.id,
                        location: player.location,
                        goldEarned: goldEarned
                    })
                });

                const result = await response.json();
// Refresh quest data to update UI
                if (result.updates && result.updates.length > 0) {
await refreshQuests();
                }

                // Note: Quest notifications will automatically appear via QuestContext
            } catch (error) {
                console.error('❌ Failed to track quest progress:', error);
            }
        } else {
}

        // Save to backend
        saveProgress({
            walletAddress: player.walletAddress,
            goldEarned,
            expEarned,
            enemyDefeated: currentEnemy.name,
            levelUp
        });

        setTimeout(() => {
            generateEnemy();
        }, 2000);
    };

    const handleItemDrop = async (enemy: Enemy, forceDrop: boolean = false) => {
        if (!enemy.itemDrops || enemy.itemDrops.length === 0) return;

        // Calculate drop chance based on rarity (REBALANCED - Much harder to get rare items!)
        // Rare enemies with rare items should drop 1-5% of the time depending on charm
        const dropChances = {
            'common': 0.05,      // 5% base
            'uncommon': 0.04,    // 4% base
            'rare': 0.01,        // 1% base (was 12%!)
            'epic': 0.02,        // 2% base (was 20%!)
            'legendary': 0.03,   // 3% base (was 35%!)
            'boss': 0.50         // 50% base (was 75%)
        };

        const baseDropChance = forceDrop ? 1.0 : (dropChances[enemy.rarity] || 0.01);

        // 🍀 CHARM BONUS: Increases drop chance by up to +4% (so 1% → 5% for rare items)
        // Formula: +0.08% per charm point (max +4% at 50 charm)
        // This makes charm VERY valuable for rare item farming
        const charmBonus = Math.min((player.charm || 0) * 0.0008, 0.04);
        const dropChance = Math.min(baseDropChance + charmBonus, 1.0);

        // FIXED: Only drop ONE item per enemy (pick randomly from drop table)
        // This prevents multiple items from dropping in a single kill
        if (Math.random() < dropChance) {
            const randomItemId = enemy.itemDrops[Math.floor(Math.random() * enemy.itemDrops.length)];
            const item = ACCESSORIES[randomItemId];

            if (item) {
                // Use translated item name and description if available
                const itemName = t.legend.items[randomItemId]?.name || item.name;
                const itemDesc = t.legend.items[randomItemId]?.description || item.description;

                addLog(``);
                addLog(`✨ ${item.emoji || '🎁'} ITEM DROP: ${itemName}!`);
                addLog(`   ${itemDesc}`);
                addLog(`   ${t.legend.combatMessages.rarity.replace('{rarity}', item.rarity.toUpperCase())}`);

                // Show modal for item pickup
                setPendingItem(item);
            }
        }
    };

    const handleKeepItem = useCallback(() => {
        if (!pendingItem) return;

        const currentInventory = player.inventory || [];
        const maxSlots = player.maxInventorySlots || 5;

        // Check if inventory is full
        if (currentInventory.length >= maxSlots) {
            addLog(`❌ Inventory is full! Cannot add ${pendingItem.name}.`);
            return;
        }

        const newInventoryItem: InventoryItem = {
            id: pendingItem.id,
            itemType: 'accessory',
            quantity: 1,
            rarity: pendingItem.rarity,
            itemData: pendingItem,
            equipped: false,
            acquiredAt: new Date()
        };

        updatePlayer({
            inventory: [...currentInventory, newInventoryItem]
        });

        addLog(`✅ ${pendingItem.name} added to inventory!`);

        // 📢 Telegram notification for rare/epic/legendary item drops
        // CRITICAL FIX: Add deduplication key to prevent React StrictMode double-notifications
        if (['rare', 'epic', 'legendary'].includes(pendingItem.rarity)) {
            try {
                // Create unique dedup key based on player, item, and timestamp
                const dedupKey = `${player.walletAddress}_${player.tokenId}_${pendingItem.id}_${Date.now()}`;

                fetch('/api/legend/notify-rare-item', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        walletAddress: player.walletAddress,
                        tokenId: player.tokenId,
                        characterName: player.name,
                        itemName: pendingItem.name,
                        itemEmoji: pendingItem.emoji || '🎁',
                        itemRarity: pendingItem.rarity,
                        itemDescription: pendingItem.description,
                        dedupKey // Add dedup key
                    })
                }).catch(err => console.warn('Failed to send rare item notification:', err));
            } catch (err) {
                console.warn('Failed to send rare item notification:', err);
            }
        }

        setPendingItem(null);
    }, [pendingItem, player, updatePlayer, addLog]);

    const handleDiscardItem = () => {
        if (!pendingItem) return;
        addLog(`❌ You left the ${pendingItem.name} behind.`);
        setPendingItem(null);
    };

    const handleReplaceItem = (index: number) => {
        if (!pendingItem) return;

        const currentInventory = [...(player.inventory || [])];
        const replacedItem = currentInventory[index];

        // Create new inventory item
        const newInventoryItem: InventoryItem = {
            id: pendingItem.id,
            itemType: 'accessory',
            quantity: 1,
            rarity: pendingItem.rarity,
            itemData: pendingItem,
            equipped: false,
            acquiredAt: new Date()
        };

        // If replaced item was equipped, unequip it first
        if (replacedItem.equipped) {
            if (replacedItem.itemType === 'weapon') {
                updatePlayer({ weapon: null });
            } else if (replacedItem.itemType === 'armor') {
                updatePlayer({ armor: null });
            }
        }

        // Replace the item
        currentInventory[index] = newInventoryItem;

        updatePlayer({
            inventory: currentInventory
        });

        addLog(`♻️ Replaced ${replacedItem.itemData?.name || 'item'} with ${pendingItem.name}!`);
        setPendingItem(null);
    };

    const flee = async () => {
        addLog(t.legend.combat.fled);
        addLog('');
        addLog(language === 'zh' ? '返回城镇...' : 'Returning to town...');

        // Log current gold before fleeing for debugging

        setTimeout(() => returnToTown(), 1000);
    };

    const showHelp = () => {
        addLog(t.legend.combat.combatCommands);
        addLog(`  ATTACK or A - ${t.legend.combat.strikeEnemy}`);
        addLog(`  RUN or R or FLEE or F - ${t.legend.combat.fleeToTown}`);
        addLog(`  STATS or S  - ${t.legend.combat.viewCombatStats}`);
        addLog(`  HELP or H   - ${t.legend.combat.showThisHelp}`);
        addLog('');
        addLog(language === 'zh' ? '⚔️ 战斗机制：' : '⚔️ COMBAT MECHANICS:');
        addLog(language === 'zh' ?
            '  • 你的伤害 = 力量 + 武器加成 - 敌人防御' :
            '  • Your damage = STR + Weapon Bonus - Enemy DEF'
        );
        addLog(language === 'zh' ?
            '  • 敌人伤害 = 敌人力量 - (你的防御 + 护甲)' :
            '  • Enemy damage = Enemy STR - (Your DEF + Armor)'
        );
        addLog(language === 'zh' ?
            '  • 每次攻击消耗1回合' :
            '  • Each attack costs 1 turn'
        );
        addLog(language === 'zh' ?
            '  • 失败 = 损失10%金币，以30%生命值返回城镇' :
            '  • Defeat = Lose 10% gold, sent to town at 30% HP'
        );
        addLog(language === 'zh' ?
            '  • 胜利 = 获得金币和经验，继续狩猎' :
            '  • Victory = Earn gold & XP, continue hunting'
        );
    };

    const showStats = () => {
        addLog(`YOU: ${player.name} [Lvl ${player.level}]`);
        addLog(`HP: ${player.health}/${player.maxHealth} | STR: ${player.strength} | DEF: ${player.defense}`);
        if (currentEnemy) {
            addLog(``);
            addLog(`ENEMY: ${currentEnemy.name} [Lvl ${currentEnemy.level}]`);
            addLog(`HP: ${enemyHealth}/${currentEnemy.maxHealth} | STR: ${currentEnemy.strength} | DEF: ${currentEnemy.defense}`);
        }
    };

    const saveProgress = async (data: any) => {
        try {
            const response = await fetch('/api/legend/combat/result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    tokenId: player.tokenId // Add tokenId for blockchain sync
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                if (response.status === 429) {
                    // Rate limit - combat too fast
                    console.warn('⚠️ Combat cooldown active - results will be saved shortly');
                    addLog('⏳ Combat processing... Please wait a moment before your next battle.');
                } else if (response.status === 400) {
                    console.error('❌ Invalid combat data:', errorData);
                    addLog('⚠️ Error saving combat result. Progress may not be saved.');
                } else {
                    console.error(`❌ Combat save failed (${response.status}):`, errorData);
                }
            } else {
}
        } catch (error) {
            console.error('❌ Failed to save combat result:', error);
            // Don't show error to user - combat still works locally
        }
    };

    const handleCommand = (cmd: string) => {
        const command = cmd.toLowerCase().trim();
        addLog(`> ${command}`);

        // Multilingual command support with single-letter shortcuts
        if (['attack', 'a', '1', '攻击', '攻擊', 'gongji'].includes(command)) {
            attack();
        } else if (['run', 'flee', 'r', 'f', '2', '逃跑', '逃', 'taopao'].includes(command)) {
            flee();
        } else if (['stats', 's', '属性', '屬性', '状态', '狀態', 'shuxing'].includes(command)) {
            showStats();
        } else if (['help', 'h', '?', '帮助', '幫助', 'bangzhu'].includes(command)) {
            showHelp();
        } else {
            addLog(t.legend.combat.unknownCommand.replace('{command}', command));
        }
    };

    if (!currentEnemy) return null;

    const combatContent = (
        <>
            {/* Goblin Shop Modal - Opens when out of turns */}
            {showShop && (
                <GoblinHoard
                    player={player}
                    updatePlayer={updatePlayer}
                    onClose={() => setShowShop(false)}
                    setGameMessage={setGameMessage}
                    defaultTab="goods"
                />
            )}

            {/* Combat Modal Overlay */}
            <div className="combat-modal-overlay">
                <div className="combat-modal-container">
                    {/* Header */}
                    <div className="combat-modal-header">
                        <h2>⚔️ {language === 'zh' ? '战斗' : 'COMBAT'}</h2>
                        <button
                            onClick={flee}
                            className="combat-close-btn"
                            title={language === 'zh' ? '逃跑' : 'Flee'}
                        >
                            {language === 'zh' ? '逃跑' : 'FLEE'}
                        </button>
                    </div>

                    {/* Battle Stats Header */}
                    <div className="combat-battle-stats">
                        <BattleHeader
                            player={player}
                            enemy={currentEnemy}
                            enemyHealth={enemyHealth}
                        />
                    </div>

                    {/* Combat Log */}
                    <div className="combat-log-content">
                        <div
                            ref={combatLogRef}
                            className="combat-log-scroll"
                        >
                            {combatLog.map((line, i) => (
                                <div
                                    key={i}
                                    className={
                                        line.includes('>>>') ? 'text-green-400 font-bold' :
                                            line.includes('<<<') ? 'text-red-400 font-bold' :
                                                line.includes('💀') ? 'text-yellow-500 font-bold' :
                                                    line.includes('⚠️') ? 'text-orange-500' :
                                                        line.includes('🎉') || line.includes('✨') ? 'text-blue-400' :
                                                            line.includes('💰') ? 'text-yellow-400' :
                                                                line.includes('🔶') ? 'text-orange-400 font-bold' :
                                                                    'text-[#00FF88]'
                                    }
                                >
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Terminal Input */}
                    <div className="combat-input-area">
                        <TerminalInput
                            onCommand={handleCommand}
                            prompt={language === 'zh' ? '战斗>' : 'COMBAT>'}
                        />
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <>
            {createPortal(combatContent, document.body)}
            {/* Render ItemPickupModal separately so it appears above combat modal */}
            {pendingItem && createPortal(
                <ItemPickupModal
                    newItem={pendingItem}
                    currentInventory={player.inventory || []}
                    maxSlots={player.maxInventorySlots}
                    onKeepNew={handleKeepItem}
                    onDiscardNew={handleDiscardItem}
                    onReplaceOld={handleReplaceItem}
                />,
                document.body
            )}
        </>
    );
};

export default TerminalCombat;
