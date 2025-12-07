// Quest Progress Toast Notifications
// Real-time progress updates for quest objectives

import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import '../../styles/QuestToasts.css';

interface QuestProgressData {
    questTitle: string;
    objectiveText: string;
    current: number;
    target: number;
    isComplete: boolean;
}

export const showQuestProgressToast = (data: QuestProgressData) => {
    const progressPercent = (data.current / data.target) * 100;
    const isNearComplete = progressPercent >= 75;

    toast(
        <div className="quest-progress-toast">
            <div className="toast-header">
                <span className="toast-icon">📜</span>
                <span className="toast-title">Quest Progress</span>
            </div>
            <div className="toast-quest-name">{data.questTitle}</div>
            <div className="toast-objective">{data.objectiveText}</div>
            <div className="toast-progress-bar">
                <motion.div
                    className={`progress-fill ${isNearComplete ? 'near-complete' : ''}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>
            <div className="toast-progress-text">
                {data.current}/{data.target} {data.isComplete ? '✅ Complete!' : ''}
            </div>
        </div>,
        {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            className: 'quest-toast-container'
        }
    );
};

export const showQuestStartedToast = (questTitle: string, questDescription: string) => {
    toast(
        <div className="quest-started-toast">
            <div className="toast-header">
                <motion.span
                    className="toast-icon"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                >
                    ⚔️
                </motion.span>
                <span className="toast-title">Quest Accepted!</span>
            </div>
            <div className="toast-quest-name">{questTitle}</div>
            <div className="toast-description">{questDescription}</div>
        </div>,
        {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            className: 'quest-toast-container quest-started'
        }
    );
};

export const showQuestObjectiveCompleteToast = (objectiveText: string) => {
    toast(
        <div className="quest-objective-complete-toast">
            <div className="toast-header">
                <motion.span
                    className="toast-icon"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.5 }}
                >
                    ✅
                </motion.span>
                <span className="toast-title">Objective Complete!</span>
            </div>
            <div className="toast-objective-text">{objectiveText}</div>
        </div>,
        {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            className: 'quest-toast-container objective-complete'
        }
    );
};
