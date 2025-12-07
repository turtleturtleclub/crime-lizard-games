// Quest Path Choice Component
// Modal for choosing between quest branches (e.g., Robin Hood path)

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { Modal } from '../shared/Modal';

interface QuestPathChoiceProps {
    questTitle: string;
    onClose: () => void;
    onSelectPath: (pathId: 'path_a' | 'path_b') => void;
}

const QuestPathChoice: React.FC<QuestPathChoiceProps> = ({ questTitle, onClose, onSelectPath }) => {
    const { language } = useLanguage();

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            closeOnBackdropClick={false}
            closeOnEscape={true}
            className="bg-black border-2 border-[#FFD700] p-6 max-w-2xl w-full font-bbs"
        >
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-[#FFD700] mb-2">
                    {language === 'zh' ? '选择你的道路' : 'Choose Your Path'}
                </h2>
                <p className="text-gray-400 text-lg">{questTitle}</p>
            </div>

            {/* Story/Lore */}
            <div className="bg-gray-900 border border-[#FFD700] rounded-lg p-4 mb-6 text-gray-300 text-sm leading-relaxed">
                <p className="mb-3">
                    {language === 'zh'
                        ? '破产区呼唤着你。那里的蜥蜴们被Sonic区块链彻底摧毁，失去了一切。'
                        : 'The Rekt District calls. Lizards rugged by Sonic blockchain huddle in the shadows, having lost everything.'}
                </p>
                <p className="italic text-[#FFD700]">
                    {language === 'zh'
                        ? '"你会帮助我们，还是猎杀骗子？你的选择将定义你的传奇..."'
                        : '"Will you help us rebuild, or hunt the scammers? Your choice defines your legend..."'}
                </p>
            </div>

            {/* Path Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Path A: Help the Rekt */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectPath('path_a')}
                    className="bg-gradient-to-br from-green-900 to-green-700 border-2 border-green-500 rounded-lg p-6 text-left hover:border-green-400 transition-all"
                >
                    <div className="text-4xl mb-3">💀💚</div>
                    <h3 className="text-xl font-bold text-green-400 mb-2">
                        {language === 'zh' ? '路径A：帮助破产者' : 'Path A: Help the Rekt'}
                    </h3>
                    <p className="text-gray-300 text-sm mb-3">
                        {language === 'zh'
                            ? '向破产区捐赠200金币。成为被摧毁的degen们的英雄。'
                            : 'Donate 200 gold to The Rekt District. Become a hero to rugged degens.'}
                    </p>
                    <div className="text-xs text-gray-400 space-y-1">
                        <div>✅ {language === 'zh' ? '捐赠200金币到破产区' : 'Donate 200 gold to the rekt'}</div>
                        <div>📈 {language === 'zh' ? '+声望 (善良)' : '+Reputation (Good)'}</div>
                        <div>✨ {language === 'zh' ? '+魅力' : '+Charm bonus'}</div>
                    </div>
                </motion.button>

                {/* Path B: Hunt Scammers */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectPath('path_b')}
                    className="bg-gradient-to-br from-red-900 to-red-700 border-2 border-red-500 rounded-lg p-6 text-left hover:border-red-400 transition-all"
                >
                    <div className="text-4xl mb-3">⚔️🔥</div>
                    <h3 className="text-xl font-bold text-red-400 mb-2">
                        {language === 'zh' ? '路径B：追捕骗子' : 'Path B: Hunt Scammers'}
                    </h3>
                    <p className="text-gray-300 text-sm mb-3">
                        {language === 'zh'
                            ? '在PvP中击败3名犯罪玩家。通过武力执行正义。'
                            : 'Defeat 3 criminal players in PvP. Enforce justice through force.'}
                    </p>
                    <div className="text-xs text-gray-400 space-y-1">
                        <div>⚔️ {language === 'zh' ? '在PvP中击败3名玩家' : 'Defeat 3 players in PvP'}</div>
                        <div>📈 {language === 'zh' ? '+声望 (法律)' : '+Reputation (Law)'}</div>
                        <div>💪 {language === 'zh' ? '+战斗经验' : '+Combat rewards'}</div>
                    </div>
                </motion.button>
            </div>

            {/* Warning */}
            <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 text-sm text-yellow-200 text-center">
                ⚠️ {language === 'zh'
                    ? '选择后无法改变！选择你的道路，永远铭记。'
                    : 'This choice is permanent! Choose your path and live with it.'}
            </div>
        </Modal>
    );
};

export default QuestPathChoice;
