import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { PlayerCharacter, GameLocation } from '../../types/legend.types';
import { LOCATION_DESCRIPTIONS } from '../../data/gameData';
import { useLanguage } from '../../contexts/LanguageContext';
import { Modal } from '../shared/Modal';
import TerminalInput from './TerminalInput';
import Healer from './Healer';
import GoblinHoard from './GoblinHoard';
import PoorDistrict from './PoorDistrict';
import GoldShop from './GoldShop';
import BossQueue, { type BossRaid } from './BossQueue';
import SaveStatePurchase from './SaveStatePurchase';
import Inn from './Inn';
import Brothel from './Brothel';
import PlayerList from './PlayerList';
import PVPCombat from './PVPCombat';
import DailyNews from './DailyNews';
import Casino from './Casino_V3';
import DiceGame from '../DiceGame_V3';
import { PredictionGame } from '../predictions';
import QuestLog from './QuestLog';
import ShadyPete from './ShadyPete';
import BugReport from './BugReport';
import type { PVPTarget } from '../../types/legend.types';

interface TerminalTownSquareProps {
    player: PlayerCharacter;
    updatePlayer: (updates: Partial<PlayerCharacter>) => void;
    setGameMessage: (message: string) => void;
    ai?: ReturnType<typeof import('../../services/LegendAI').useLegendAI>;
    onBossBattleStart?: (raid: BossRaid) => void;
    onShowCharProfile?: () => void;
    saveAndChangeLocation?: (newLocation: PlayerCharacter['location']) => Promise<void>;
    // Support for 2D map integration - open specific modal on mount
    initialModal?: string | null;
    // Callback when modal closes - used to return to 2D map
    onModalClose?: () => void;
}

const TerminalTownSquare: React.FC<TerminalTownSquareProps> = ({
    player,
    updatePlayer,
    setGameMessage,
    ai,
    onBossBattleStart,
    onShowCharProfile,
    saveAndChangeLocation,
    initialModal,
    onModalClose
}) => {
    const { language, t } = useLanguage();
    const [selectedLocation, setSelectedLocation] = useState<GameLocation | null>(null);
    const [shopTab, setShopTab] = useState<'bank' | 'goods' | 'inventory' | 'weapons' | 'armor'>('bank');
    const [showGoldShop, setShowGoldShop] = useState(false);
    const [showBossQueue, setShowBossQueue] = useState(false);
    const [showSaveState, setShowSaveState] = useState(false);
    const [showPlayerList, setShowPlayerList] = useState(false);
    const [showLocationList, setShowLocationList] = useState(false);
    const [showDailyNews, setShowDailyNews] = useState(false);
    const [showDiceGame, setShowDiceGame] = useState(false);
    const [showPredictions, setShowPredictions] = useState(false);
    const [showQuestBoard, setShowQuestBoard] = useState(false);
    const [showShadyPete, setShowShadyPete] = useState(false);
    const [showBugReport, setShowBugReport] = useState(false);
    const [pvpTarget, setPvpTarget] = useState<PVPTarget | null>(null);
    const hasShownInitialListRef = React.useRef(false);
    const isInitializedRef = React.useRef(false);
    const [outputLog, setOutputLog] = useState<string[]>([
        t.legend.town.welcome,
        t.legend.town.typeHelp
    ]);
    const outputLogRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll terminal output to bottom (terminal style - newest at bottom)
    useEffect(() => {
        if (outputLogRef.current) {
            outputLogRef.current.scrollTop = outputLogRef.current.scrollHeight;
        }
    }, [outputLog]);

    // Create close handler that returns to 2D map if we came from there
    const handleModalClose = React.useCallback(() => {
        setSelectedLocation(null);
        setShowPlayerList(false);
        setShowBossQueue(false);
        setShowDailyNews(false);
        setShowQuestBoard(false);
        setShowDiceGame(false);
        setShowLocationList(false);
        // If we came from 2D map, return to it
        if (onModalClose) {
            onModalClose();
        }
    }, [onModalClose]);

    // Handle initial modal from 2D map integration
    useEffect(() => {
        if (initialModal) {
            // Open the specified modal based on location ID
            switch (initialModal) {
                case 'bank':
                    setSelectedLocation('bank');
                    break;
                case 'weapons_shop':
                    setSelectedLocation('bank');
                    setShopTab('weapons');
                    break;
                case 'armor_shop':
                    setSelectedLocation('bank');
                    setShopTab('armor');
                    break;
                case 'healer':
                    setSelectedLocation('healer');
                    break;
                case 'inn':
                    setSelectedLocation('inn');
                    break;
                case 'brothel':
                    setSelectedLocation('brothel');
                    break;
                case 'player_list':
                    setShowPlayerList(true);
                    break;
                case 'boss_queue':
                    setShowBossQueue(true);
                    break;
                case 'daily_news':
                    setShowDailyNews(true);
                    break;
                case 'arena': // Quest board uses arena location
                    setShowQuestBoard(true);
                    break;
                case 'poor_district':
                    setSelectedLocation('poor_district');
                    break;
                case 'casino':
                    setSelectedLocation('casino');
                    break;
                case 'dice':
                    setShowDiceGame(true);
                    break;
                case 'predictions':
                case 'predict':
                case 'bet':
                    setShowPredictions(true);
                    break;
                default:
                    // Unknown location, show location list
                    setShowLocationList(true);
            }
        }
    }, [initialModal]);

    // Show location list on initial load and when returning from combat
    // Use a ref to track the previous location to avoid re-renders from state updates
    const prevLocationRef = React.useRef<string | null>(null);

    useEffect(() => {
        // Skip entirely if already initialized and showing the list
        if (isInitializedRef.current && hasShownInitialListRef.current) {
            // Only check for combat return after initialization
            if (player.location === 'town') {
                const wasCombatLocation = prevLocationRef.current &&
                    ['forest', 'castle', 'crime_lord_lair'].includes(prevLocationRef.current);
                if (wasCombatLocation) {
                    setShowLocationList(true);
                }
            }
            prevLocationRef.current = player.location;
            return;
        }

        // Initial load - only show once with a delay to let everything settle
        if (player.location === 'town' && !hasShownInitialListRef.current) {
            // Use a longer delay and mark as initialized immediately to prevent re-triggers
            hasShownInitialListRef.current = true;
            const timer = setTimeout(() => {
                // Double-check we haven't opened something else in the meantime
                if (!selectedLocation && !showPlayerList && !showBossQueue && !showDailyNews) {
                    setShowLocationList(true);
                }
                isInitializedRef.current = true;
            }, 500);
            return () => clearTimeout(timer);
        }

        // Update the ref (doesn't cause re-render)
        prevLocationRef.current = player.location;
    }, [player.location, selectedLocation, showPlayerList, showBossQueue, showDailyNews]);

    // Auto-show Shady Pete on first town visit (for tutorial quest)
    useEffect(() => {
        if (player.location === 'town') {
            const hasMetPete = sessionStorage.getItem(`legend-met-gecko-${player.tokenId}`);
            if (!hasMetPete && player.level === 1) {
                // Show Gecko Graves after a short delay for dramatic effect
                const timer = setTimeout(() => {
                    addOutput('═══════════════════════════════════════════════════');
                    addOutput('🦎 A shadowy gecko emerges from the darkness...');
                    addOutput('   TYPE "GECKO" or "GRAVES" to talk to Gecko Graves');
                    addOutput('═══════════════════════════════════════════════════');
                    sessionStorage.setItem(`legend-met-gecko-${player.tokenId}`, 'true');
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
        return undefined;
    }, [player.location, player.tokenId, player.level]);

    // AI tips and events in town
    useEffect(() => {
        if (!ai) {
            return undefined;
        }

        const showAITips = async () => {
            // Show AI tips on first town visit
            const hasSeenTips = sessionStorage.getItem('legend-ai-tips-shown');
            if (!hasSeenTips) {
                const tips = await ai.getTips();
                if (tips && tips.length > 0) {
                    addOutput('═══════════════════════════════════════════════════');
                    addOutput(t.legend.town.aiTipsHeader);
                    tips.forEach(tip => addOutput(`  • ${tip}`));
                    addOutput('═══════════════════════════════════════════════════');
                    sessionStorage.setItem('legend-ai-tips-shown', 'true');
                }
            }
        };

        // Call async function without awaiting
        showAITips();
        // Explicitly return undefined to satisfy React
        return undefined;
    }, [ai]);

    // Multilingual command mapping - supports both English and Mandarin
    const getCommandAction = (cmd: string): (() => void) | undefined => {
        const lowerCmd = cmd.toLowerCase().trim();

        // Help commands (English & Mandarin)
        if (['help', 'h', '?', '帮助', '幫助'].includes(lowerCmd)) return () => showHelp();

        // List commands (English & Mandarin)
        if (['list', 'l', 'ls', '列表', '列出', '地点', '地點'].includes(lowerCmd)) return () => showLocations();

        // Stats commands (English & Mandarin)
        if (['stats', 's', '属性', '屬性', '状态', '狀態'].includes(lowerCmd)) return () => showStats();

        // Clear commands (English & Mandarin)
        if (['clear', 'cls', '清除', '清屏'].includes(lowerCmd)) return () => setOutputLog([]);

        // Location commands (English & Mandarin)
        if (['forest', 'f', '森林'].includes(lowerCmd) || lowerCmd === '1') return () => {
            if (saveAndChangeLocation) {
                saveAndChangeLocation('forest');
            } else {
                updatePlayer({ location: 'forest' });
            }
        };
        if (['players', 'list', 'pvp', '玩家', '列表'].includes(lowerCmd) || lowerCmd === '2') return () => setShowPlayerList(true);
        // Redirect weapons and armor to The Scaly Satchel with appropriate tab
        if (['weapons', 'weapon', '武器', '武器店'].includes(lowerCmd) || lowerCmd === '3') return () => {
            setShopTab('weapons');
            setSelectedLocation('bank');
        };
        if (['armor', 'armour', '护甲', '護甲', '护甲店', '護甲店'].includes(lowerCmd) || lowerCmd === '4') return () => {
            setShopTab('armor');
            setSelectedLocation('bank');
        };
        if (['healer', 'heal', '治疗', '治療', '治疗师', '治療師', '医生', '醫生'].includes(lowerCmd) || lowerCmd === '5') return () => setSelectedLocation('healer');
        if (['bank', 'shop', 'satchel', 'goblin', 'buy', '银行', '銀行', '商店', '购买', '購買'].includes(lowerCmd) || lowerCmd === '6') return () => {
            setShopTab('bank');
            setSelectedLocation('bank');
        };
        if (['inn', '旅馆', '旅館'].includes(lowerCmd) || lowerCmd === '7') return () => setSelectedLocation('inn');
        if (['news', '新闻', '新聞'].includes(lowerCmd) || lowerCmd === '8') return () => setShowDailyNews(true);
        if (['boss', '首领', '首領', '队列', '隊列'].includes(lowerCmd) || lowerCmd === '9') return () => setShowBossQueue(true);
        if (['brothel', 'violet', '青楼', '青樓'].includes(lowerCmd) || lowerCmd === '10') return () => setSelectedLocation('brothel');
        if (['casino', 'slots', 'gamble', '赌场', '賭場', '老虎机', '老虎機', '🎰'].includes(lowerCmd) || lowerCmd === '11') return () => setSelectedLocation('casino');
        if (['dice', 'dicegame', '骰子', '🎲'].includes(lowerCmd) || lowerCmd === '12') return () => setShowDiceGame(true);
        if (['predictions', 'predict', 'prediction', 'bet', 'market', '🔮'].includes(lowerCmd) || lowerCmd === 'p') return () => setShowPredictions(true);
        if (['quest', 'quests', 'questboard', '任务', '任務', '📜'].includes(lowerCmd) || lowerCmd === '13') return () => setShowQuestBoard(true);
        if (['bug', 'bugreport', 'report', 'feature', '错误', '錯誤', '报告', '報告', '🐛'].includes(lowerCmd) || lowerCmd === '14') return () => setShowBugReport(true);
        if (['gecko', 'graves', 'geckograves', 'pete', 'shadypete', 'shady', 'npc', '皮特', '🎩', '🦎'].includes(lowerCmd)) return () => setShowShadyPete(true);
        if (['rekt', 'rektdistrict', 'sonic', 'donate', '帮助', '捐赠', '💀'].includes(lowerCmd) || lowerCmd === '15') return () => setSelectedLocation('poor_district');
        if (['rich', '富人区', '富人區'].includes(lowerCmd) || lowerCmd === '16') return () => handleRichDistrict();
        if (['crimelord', '犯罪头目', '犯罪頭目', '头目', '頭目'].includes(lowerCmd) || lowerCmd === '17') return () => handleCrimeLordLair();

        // Other commands (English & Mandarin)
        if (['gold', 'buygold', 'bnb', '金币', '金幣'].includes(lowerCmd)) return () => setShowGoldShop(true);
        if (['save', '保存', '存档', '存檔'].includes(lowerCmd)) return () => setShowSaveState(true);
        if (['inventory', 'inv', 'i', 'profile', 'equip', '背包', '装备', '裝備'].includes(lowerCmd)) return () => onShowCharProfile?.();

        return undefined;
    };

    const addOutput = (text: string) => {
        setOutputLog(prev => [...prev, text]);
    };

    const handleCommand = (cmd: string) => {
        const command = cmd.trim();

        // Echo the command
        addOutput(`> ${command}`);

        // Execute command using multilingual mapping
        const action = getCommandAction(command);
        if (action) {
            action();
        } else {
            addOutput(t.legend.town.unknownCommand);
        }
    };

    const showHelp = () => {
        // Use existing translation keys for multilingual support
        addOutput('═══════════════════════════════════════════════════');
        addOutput(t.legend.town.commands);
        addOutput('═══════════════════════════════════════════════════');
        addOutput(`  HELP (H, ?)     - ${t.legend.commands.help}`);
        addOutput(`  LIST (L, LS)    - ${t.legend.commands.list}`);
        addOutput(`  STATS (S)       - ${t.legend.commands.stats}`);
        addOutput(`  CLEAR (CLS)     - ${t.legend.commands.clear}`);
        addOutput(`  GECKO (GRAVES) 🦎 - ${language === 'zh' ? '找壁虎接任务' : 'Talk to Gecko Graves for quests'}`);
        addOutput(`  GOLD (BUY)      - ${t.legend.commands.gold}`);
        addOutput(`  SAVE            - ${t.legend.commands.save}`);
        addOutput(`  INVENTORY (I)   - ${language === 'zh' ? '打开背包和装备界面' : 'Open inventory & equipment'}`);
        addOutput(`  HEAL            - ${language === 'zh' ? '打开治疗师' : 'Open healer'}`);
        addOutput('');
        addOutput(language === 'zh' ? '地点 (使用名称或编号):' : 'LOCATIONS (use name or number):');
        addOutput(`  1. ${t.legend.locations.hideout.toUpperCase().padEnd(12)} - ${t.legend.locationDescriptions.hideout}`);
        addOutput(`  2. ${language === 'zh' ? '玩家' : 'PLAYERS'}     - ${language === 'zh' ? '查看并攻击其他玩家 (PVP)' : 'View & attack other players (PVP)'}`);
        addOutput(`  3. ${language === 'zh' ? '武器商店' : 'WEAPONS'}    - ${language === 'zh' ? '鳞片袋子 - 武器标签' : 'Scaly Satchel - Weapons tab'}`);
        addOutput(`  4. ${language === 'zh' ? '护甲商店' : 'ARMOR'}      - ${language === 'zh' ? '鳞片袋子 - 护甲标签' : 'Scaly Satchel - Armor tab'}`);
        addOutput(`  5. ${t.legend.locations.healer.toUpperCase().padEnd(12)} - ${t.legend.locationDescriptions.healer}`);
        addOutput(`  6. ${(language === 'zh' ? '商店' : 'SHOP').padEnd(12)} - ${language === 'zh' ? '鳞片袋子 - 银行、武器、护甲等' : 'Scaly Satchel - Bank, Weapons, Armor & more'}`);
        addOutput(`  7. ${t.legend.locations.inn.toUpperCase().padEnd(12)} - ${t.legend.locationDescriptions.inn}`);
        addOutput(`  8. ${language === 'zh' ? '新闻' : 'NEWS'}      - ${language === 'zh' ? '查看每日新闻' : 'View daily news'}`);
        addOutput(`  9. ${t.legend.locations.bossQueue.toUpperCase().padEnd(12)} - ${t.legend.locationDescriptions.bossQueue}`);
        addOutput(`  10. ${t.legend.locations.brothel.toUpperCase().padEnd(11)} - ${t.legend.locationDescriptions.brothel}`);
        addOutput(`  11. ${language === 'zh' ? '赌场' : 'CASINO'}     - ${language === 'zh' ? '试试老虎机运气，赢取金币' : 'Try your luck at slots for gold'}`);
        addOutput(`  12. ${language === 'zh' ? '骰子' : 'DICE'}      - ${language === 'zh' ? '掷骰子游戏' : 'Dice game'}`);
        addOutput(`  13. ${language === 'zh' ? '任务' : 'QUESTS'}    - ${language === 'zh' ? '查看并接受可用任务' : 'View and accept available quests'}`);
        addOutput(`  14. ${language === 'zh' ? '错误报告' : 'BUG'}      - ${language === 'zh' ? '报告错误或建议功能 (赚取XP!)' : 'Report bugs or suggest features (Earn XP!)'}`);
        addOutput(`  15. ${language === 'zh' ? '破产区' : 'REKT'}      - ${t.legend.locationDescriptions.poorDistrict}`);
        addOutput(`  16. ${t.legend.locations.castle.toUpperCase().padEnd(11)} - ${t.legend.locationDescriptions.castle} [Lv 5+]`);
        addOutput(`  17. ${t.legend.locations.crimeLordLair.toUpperCase().padEnd(10)} - ${t.legend.locationDescriptions.crimeLordLair} [Lv 10+]`);
        addOutput('');
        addOutput('═══════════════════════════════════════════════════');
        addOutput(language === 'zh' ? '⚠️ 重要提示：' : '⚠️ IMPORTANT:');
        addOutput(language === 'zh' ?
            '• 登出前在旅馆或青楼睡觉以防止被偷袭！' :
            '• Sleep at INN/BROTHEL before logout to prevent ganking!'
        );
        addOutput(language === 'zh' ?
            '• 将金币存入银行以保护它们' :
            '• Visit the Scaly Satchel (bank) to protect gold & buy goods'
        );
        addOutput(language === 'zh' ?
            '• 使用 LIST 命令查看所有地点详情' :
            '• Use LIST command to see all locations with details'
        );
        addOutput('═══════════════════════════════════════════════════');
        addOutput(t.legend.town.tipTypeCommand);
        addOutput('');
    };

    const showLocations = () => {
        setShowLocationList(true);
    };

    const showStats = () => {
        addOutput('═══════════════════════════════════════════════════');
        addOutput(`CHARACTER: ${player.name}`);
        addOutput(`LEVEL: ${player.level} | XP: ${player.experience}/${player.experienceToNextLevel}`);
        addOutput('═══════════════════════════════════════════════════');
        addOutput(`Health: ${player.health}/${player.maxHealth}`);
        addOutput(`Gold: ${player.gold.toLocaleString()} | Banked: ${player.goldInBank?.toLocaleString() || 0}`);
        addOutput(`Turns: ${player.turnsRemaining}/${player.maxTurns}`);
        addOutput('');
        addOutput(`STR: ${player.strength} | DEF: ${player.defense} | CHM: ${player.charm}`);
        addOutput('');
        addOutput(`Heists: ${player.heistsCompleted} | Stolen: ${player.goldStolen.toLocaleString()}g`);
        addOutput(`Donated: ${player.goldGivenToPoor.toLocaleString()}g`);
        addOutput('═══════════════════════════════════════════════════');
    };

    const handleRichDistrict = async () => {
        if (player.level < 5) {
            addOutput(`${t.legend.messages.locked} ${t.legend.messages.requiresLevel} 5+`);
        } else {
            if (saveAndChangeLocation) {
                await saveAndChangeLocation('castle');
            } else {
                updatePlayer({ location: 'castle' });
            }
        }
    };

    const handleCrimeLordLair = async () => {
        if (player.level < 10) {
            addOutput(`${t.legend.messages.locked} ${t.legend.messages.requiresLevel} 10+`);
        } else {
            if (saveAndChangeLocation) {
                await saveAndChangeLocation('crime_lord_lair');
            } else {
                updatePlayer({ location: 'crime_lord_lair' });
            }
        }
    };

    const LocationListModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
        const locations = [
            { num: 1, id: 'forest', key: 'forest', locked: false },
            { num: 2, id: 'player_list', key: 'playerList', locked: false },
            { num: 3, id: 'weapons_shop', key: 'weaponsShop', locked: false, isSubLocation: true, parentId: 'bank', emoji: '⚔️' },
            { num: 4, id: 'armor_shop', key: 'armorShop', locked: false, isSubLocation: true, parentId: 'bank', emoji: '🛡️' },
            { num: 5, id: 'healer', key: 'healer', locked: false },
            { num: 6, id: 'bank', key: 'bank', locked: false, emoji: '💰' },
            { num: 7, id: 'inn', key: 'inn', locked: false },
            { num: 8, id: 'daily_news', key: 'dailyNews', locked: false },
            { num: 9, id: 'boss_queue', key: 'bossQueue', locked: false },
            { num: 10, id: 'brothel', key: 'brothel', locked: false },
            { num: 11, id: 'casino', key: 'casino', locked: false },
            { num: 12, id: 'dice_game', key: 'diceGame', locked: false, emoji: '🎲' },
            { num: 13, id: 'predictions', key: 'predictions', locked: false, emoji: '🔮' },
            { num: 14, id: 'quest_board', key: 'questBoard', locked: false, emoji: '📜' },
            { num: 15, id: 'bug_report', key: 'bugReport', locked: false, emoji: '🐛' },
            { num: 16, id: 'poor_district', key: 'poorDistrict', locked: false, emoji: '💀' },
            { num: 17, id: 'castle', key: 'castle', locked: player.level < 5 },
            { num: 18, id: 'crime_lord_lair', key: 'crimeLordLair', locked: player.level < 10 }
        ];

        // Handle ESC key to close modal
        useEffect(() => {
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    onClose();
                }
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }, [onClose]);

        // Handle mobile back button
        const historyPushedRef = React.useRef(false);

        useEffect(() => {
            // Only push state once per modal instance
            if (!historyPushedRef.current) {
                // Push a dummy state to enable back button detection
                window.history.pushState({ modal: 'location-list' }, '');
                historyPushedRef.current = true;
            }

            const handlePopState = (event: PopStateEvent) => {
                // Only close if the popstate was triggered by back button (not by our cleanup)
                if (event.state?.modal !== 'location-list') {
                    onClose();
                }
            };

            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('popstate', handlePopState);
                // Clean up the history entry if modal is still in history
                // Use replaceState to avoid triggering popstate event
                if (window.history.state?.modal === 'location-list') {
                    window.history.replaceState(null, '', window.location.href);
                }
                historyPushedRef.current = false;
            };
        }, [onClose]);

        const handleLocationClick = async (loc: any) => {
            if (loc.locked) {
                addOutput(`${t.legend.messages.locked} ${t.legend.messages.requiresLevel} ${loc.num === 14 ? '5' : '10'}+`);
                return;
            }

            onClose();

            // Handle different location types
            if (loc.id === 'forest') {
                if (saveAndChangeLocation) {
                    await saveAndChangeLocation('forest');
                } else {
                    updatePlayer({ location: 'forest' });
                }
            } else if (loc.id === 'player_list') {
                setShowPlayerList(true);
            } else if (loc.id === 'weapons_shop') {
                // Open The Scaly Satchel with weapons tab
                setShopTab('weapons');
                setSelectedLocation('bank');
            } else if (loc.id === 'armor_shop') {
                // Open The Scaly Satchel with armor tab
                setShopTab('armor');
                setSelectedLocation('bank');
            } else if (loc.id === 'boss_queue') {
                setShowBossQueue(true);
            } else if (loc.id === 'daily_news') {
                setShowDailyNews(true);
            } else if (loc.id === 'dice_game') {
                setShowDiceGame(true);
            } else if (loc.id === 'quest_board') {
                setShowQuestBoard(true);
            } else if (loc.id === 'bug_report') {
                setShowBugReport(true);
            } else if (loc.id === 'poor_district') {
                setSelectedLocation('poor_district');
            } else if (loc.id === 'castle') {
                handleRichDistrict();
            } else if (loc.id === 'crime_lord_lair') {
                handleCrimeLordLair();
            } else if (loc.id === 'predictions') {
                setShowPredictions(true);
            } else {
                setSelectedLocation(loc.id as GameLocation);
            }
        };

        return (
            <Modal
                isOpen={true}
                onClose={onClose}
                closeOnBackdropClick={true}
                closeOnEscape={true}
                className="bg-black border-2 border-[#00FF88] p-4 md:p-6 max-w-5xl w-full max-h-[90dvh] overflow-hidden overflow-x-hidden font-bbs"
            >
                {/* Header */}
                <div className="text-[#00FF88] text-center mb-4 text-glow-green text-xl font-bold">
                    🏛️  {language === 'zh' ? '可用地点' : 'AVAILABLE LOCATIONS'} 🏛️
                </div>

                {/* Scrollable Location List */}
                <div className="overflow-y-auto max-h-[60vh] bg-black border-2 border-[#00FF88] p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {locations.map((loc) => {
                            const locData = LOCATION_DESCRIPTIONS[loc.id];
                            // Special handling for bank/shop and sub-locations
                            let locationName = loc.id === 'bank'
                                ? (language === 'zh' ? '商店' : 'Scaly Satchel')
                                : t.legend.locations[loc.key as keyof typeof t.legend.locations];
                            let locationDesc = loc.id === 'bank'
                                ? (language === 'zh' ? '鳞片袋子 - 银行、武器、护甲和更多' : 'Bank, Weapons, Armor, Turns & more')
                                : t.legend.locationDescriptions[loc.key as keyof typeof t.legend.locationDescriptions];

                            // Override for weapons and armor shops
                            if (loc.id === 'weapons_shop') {
                                locationName = (language === 'zh' ? '武器商店' : 'Weapons Shop');
                                locationDesc = (language === 'zh' ? '在鳞片袋子中 - 购买武器' : 'Inside Scaly Satchel - Buy weapons');
                            } else if (loc.id === 'armor_shop') {
                                locationName = (language === 'zh' ? '护甲商店' : 'Armor Shop');
                                locationDesc = (language === 'zh' ? '在鳞片袋子中 - 购买护甲' : 'Inside Scaly Satchel - Buy armor');
                            } else if (loc.id === 'bug_report') {
                                locationName = (language === 'zh' ? '错误报告' : 'Bug Report');
                                locationDesc = (language === 'zh' ? '报告错误或建议功能 - 赚取XP奖励!' : 'Report bugs or suggest features - Earn XP rewards!');
                            }

                            return (
                                <button
                                    key={loc.id}
                                    onClick={() => handleLocationClick(loc)}
                                    disabled={loc.locked}
                                    className={`text-left p-4 border-2 transition-all ${
                                        loc.locked
                                            ? 'border-gray-600 bg-black/30 opacity-50 cursor-not-allowed'
                                            : 'border-[#00FF88] bg-black hover:bg-[#00AA55]/30 hover:border-green-400 cursor-pointer'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`text-3xl ${loc.locked ? 'grayscale opacity-50' : ''}`}>
                                            {loc.emoji || locData?.emoji || '📍'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`font-bold ${loc.locked ? 'text-gray-500' : 'text-[#00FF88]'}`}>
                                                    {loc.num}. {locationName}
                                                </span>
                                                {loc.locked && (
                                                    <span className="text-red-500 text-xs">🔒 {language === 'zh' ? '已锁定' : 'Locked'}</span>
                                                )}
                                            </div>
                                            <p className={`text-sm ${loc.locked ? 'text-gray-600' : 'text-gray-400'}`}>
                                                {locationDesc}
                                            </p>
                                            {loc.locked && (
                                                <p className="text-xs text-red-400 mt-1">
                                                    {language === 'zh' ? '需要等级' : 'Requires Level'} {loc.num === 13 ? '5' : '10'}+
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Help Section */}
                <div className="bg-black border border-[#00FF88] p-4 mb-4 text-sm space-y-2">
                    <div className="text-[#00FF88] font-bold mb-2">⚡ {language === 'zh' ? '快速命令：' : 'QUICK COMMANDS:'}</div>
                    <div className="grid grid-cols-2 gap-2 text-gray-400">
                        <div><span className="text-[#00FF88]">HELP</span> - {language === 'zh' ? '显示所有命令' : 'Show all commands'}</div>
                        <div><span className="text-[#00FF88]">STATS</span> - {language === 'zh' ? '查看角色属性' : 'View character stats'}</div>
                        <div><span className="text-[#00FF88]">LIST</span> - {language === 'zh' ? '显示此菜单' : 'Show this menu'}</div>
                        <div><span className="text-[#00FF88]">CLEAR</span> - {language === 'zh' ? '清除终端' : 'Clear terminal'}</div>
                        <div><span className="text-[#00FF88]">GOLD</span> - {language === 'zh' ? '用BNB购买金币' : 'Buy gold with BNB'}</div>
                        <div><span className="text-[#00FF88]">INVENTORY</span> - {language === 'zh' ? '打开装备' : 'Open equipment'}</div>
                    </div>
                    <div className="text-[#00FF88] mt-3 pt-2 border-t border-[#00FF88]/30">
                        💡 <span className="text-gray-400">{language === 'zh' ? '点击上面的地点，或在终端中输入编号/名称' : 'Click a location above, or type the number/name in the terminal'}</span>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-black border-2 border-[#00FF88] text-[#00FF88] hover:bg-[#00AA55]/30 font-bold"
                >
                    [ESC] {language === 'zh' ? '关闭' : 'Close'}
                </button>
            </Modal>
        );
    };

    return (
        <div className="max-w-6xl mx-auto p-2 md:p-4">
            {/* Terminal Container */}
            <div className="bg-black border-2 border-[#00FF88] font-bbs">
                {/* Terminal Output - Scrollable content area */}
                <div
                    ref={outputLogRef}
                    className="p-3 md:p-4 overflow-y-auto text-base md:text-lg scroll-smooth h-[30vh] md:h-[35vh] combat-log-scrollbar"
                >
                    {outputLog.map((line, i) => (
                        <div key={i} className="text-[#00FF88]">
                            {line}
                        </div>
                    ))}
                    {outputLog.length === 0 && (
                        <div className="text-gray-600">{t.legend.town.terminalCleared}</div>
                    )}
                </div>

                {/* Terminal Input - Inside terminal at bottom */}
                <div className="border-t-2 border-[#00FF88] p-2 md:p-4 bg-black">
                    <TerminalInput
                        onCommand={handleCommand}
                        prompt={language === 'zh' ? '城镇>' : 'TOWN>'}
                    />
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {selectedLocation === 'healer' && (
                    <Healer player={player} updatePlayer={updatePlayer} onClose={initialModal ? handleModalClose : () => setSelectedLocation(null)} setGameMessage={setGameMessage} />
                )}
                {selectedLocation === 'bank' && (
                    <GoblinHoard
                        player={player}
                        updatePlayer={updatePlayer}
                        onClose={initialModal ? handleModalClose : () => setSelectedLocation(null)}
                        setGameMessage={setGameMessage}
                        defaultTab={shopTab}
                    />
                )}
                {selectedLocation === 'inn' && (
                    <Inn player={player} updatePlayer={updatePlayer} onClose={initialModal ? handleModalClose : () => setSelectedLocation(null)} setGameMessage={setGameMessage} />
                )}
                {selectedLocation === 'brothel' && (
                    <Brothel player={player} updatePlayer={updatePlayer} onClose={initialModal ? handleModalClose : () => setSelectedLocation(null)} setGameMessage={setGameMessage} />
                )}
                {selectedLocation === 'casino' && (
                    <Casino player={player} updatePlayer={updatePlayer} onClose={initialModal ? handleModalClose : () => setSelectedLocation(null)} setGameMessage={setGameMessage} />
                )}
                {selectedLocation === 'poor_district' && (
                    <PoorDistrict player={player} updatePlayer={updatePlayer} onClose={initialModal ? handleModalClose : () => setSelectedLocation(null)} setGameMessage={setGameMessage} />
                )}
                {showGoldShop && (
                    <GoldShop
                        onClose={() => setShowGoldShop(false)}
                        onPurchase={async (gold, turns, serverPlayer) => {
                            // 🔐 FIX: Use server's authoritative player state instead of calling sync-gold
                            // This prevents race condition where sync-gold would overwrite pending combat gold
                            if (serverPlayer) {
                                // Server returned authoritative state - use it directly
                                updatePlayer({
                                    gold: serverPlayer.gold,
                                    goldInBank: serverPlayer.goldInBank,
                                    turnsRemaining: serverPlayer.turnsRemaining,
                                    maxTurns: serverPlayer.maxTurns
                                });
                            } else {
                                // Fallback if server didn't return player state (shouldn't happen)
                                updatePlayer({
                                    gold: player.gold + gold,
                                    turnsRemaining: player.turnsRemaining + turns,
                                    maxTurns: player.maxTurns + turns
                                });
                            }
                            setGameMessage(`✅ You received ${gold.toLocaleString()} gold and ${turns} turns!`);
                        }}
                        tokenId={player.tokenId}
                    />
                )}
                {showBossQueue && (
                    <BossQueue
                        player={player}
                        onClose={initialModal ? handleModalClose : () => setShowBossQueue(false)}
                        onBattleStart={(raid) => {
                            setShowBossQueue(false);
                            setGameMessage(t.legend.town.joiningBattleAgainst.replace('{boss}', raid.bossName));
                            if (onBossBattleStart) {
                                onBossBattleStart(raid);
                            }
                        }}
                    />
                )}
                {showSaveState && (
                    <SaveStatePurchase
                        player={player}
                        updatePlayer={updatePlayer}
                        onClose={() => setShowSaveState(false)}
                        setGameMessage={setGameMessage}
                    />
                )}
                {showLocationList && (
                    <LocationListModal onClose={() => setShowLocationList(false)} />
                )}
                {showPlayerList && (
                    <PlayerList
                        player={player}
                        onClose={initialModal ? handleModalClose : () => setShowPlayerList(false)}
                        onAttack={(target) => {
                            setShowPlayerList(false);
                            setPvpTarget(target);
                        }}
                    />
                )}
                {pvpTarget && (
                    <PVPCombat
                        player={player}
                        target={pvpTarget}
                        onComplete={(victory, goldChange) => {
                            setPvpTarget(null);
                            updatePlayer({
                                gold: player.gold + goldChange,
                                turnsRemaining: player.turnsRemaining - 1,
                                pvpWins: victory ? player.pvpWins + 1 : player.pvpWins,
                                pvpLosses: victory ? player.pvpLosses : player.pvpLosses + 1
                            });
                            setGameMessage(
                                victory
                                    ? `⚔️ Victory! You stole ${goldChange} gold from ${pvpTarget.name}!`
                                    : `💀 Defeat! You lost ${Math.abs(goldChange)} gold to ${pvpTarget.name}!`
                            );
                        }}
                        onCancel={() => setPvpTarget(null)}
                    />
                )}
                {showDailyNews && (
                    <DailyNews
                        player={player}
                        onClose={initialModal ? handleModalClose : () => setShowDailyNews(false)}
                    />
                )}
                {showDiceGame && (
                    <DiceGame onClose={initialModal ? handleModalClose : () => setShowDiceGame(false)} />
                )}
                {showPredictions && (
                    <PredictionGame onClose={initialModal ? handleModalClose : () => setShowPredictions(false)} />
                )}
                {showQuestBoard && (
                    <QuestLog
                        onClose={initialModal ? handleModalClose : () => setShowQuestBoard(false)}
                    />
                )}
                {showShadyPete && (
                    <ShadyPete
                        onClose={() => setShowShadyPete(false)}
                    />
                )}
                {showBugReport && (
                    <BugReport
                        player={player}
                        onClose={() => setShowBugReport(false)}
                        setGameMessage={setGameMessage}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default TerminalTownSquare;
