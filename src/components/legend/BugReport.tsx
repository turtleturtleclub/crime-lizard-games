import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { PlayerCharacter } from '../../types/legend.types';
import { toast } from 'react-toastify';
import { useModalClose } from '../../hooks/useModalClose';

interface BugReportProps {
    player: PlayerCharacter;
    onClose: () => void;
    setGameMessage: (message: string) => void;
}

interface Submission {
    _id: string;
    type: 'bug' | 'feature';
    title: string;
    description: string;
    severity?: string;
    category?: string;
    status: string;
    xpAwarded: number;
    adminReply: string;
    submittedAt: string;
    screenshots?: string[];
}

const BugReport: React.FC<BugReportProps> = ({ player, onClose, setGameMessage }) => {
    // Handle ESC key, mobile back button, and keyboard dismissal
    useModalClose(onClose);

    const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
    const [reportType, setReportType] = useState<'bug' | 'feature'>('bug');
    const [loading, setLoading] = useState(false);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

    // Bug form state
    const [bugForm, setBugForm] = useState({
        title: '',
        description: '',
        severity: 'medium',
        steps: '',
        screenshots: [] as File[]
    });

    // Feature form state
    const [featureForm, setFeatureForm] = useState({
        title: '',
        description: '',
        category: 'general'
    });

    // Load user's submissions
    useEffect(() => {
        if (activeTab === 'history') {
            loadSubmissions();
        }
    }, [activeTab, reportType]);

    // Handle clipboard paste for screenshots
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            // Only handle paste when on submit tab and bug report type
            if (activeTab !== 'submit' || reportType !== 'bug') return;

            const items = e.clipboardData?.items;
            if (!items) return;

            const imageFiles: File[] = [];

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    if (file) {
                        imageFiles.push(file);
                    }
                }
            }

            if (imageFiles.length > 0) {
                e.preventDefault();

                const currentScreenshots = bugForm.screenshots;
                const newTotal = currentScreenshots.length + imageFiles.length;

                if (newTotal > 5) {
                    toast.error(`Maximum 5 screenshots allowed. Can only add ${5 - currentScreenshots.length} more.`);
                    const filesToAdd = imageFiles.slice(0, 5 - currentScreenshots.length);
                    setBugForm({ ...bugForm, screenshots: [...currentScreenshots, ...filesToAdd] });
                } else {
                    setBugForm({ ...bugForm, screenshots: [...currentScreenshots, ...imageFiles] });
                    toast.success(`${imageFiles.length} image(s) pasted from clipboard!`);
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, [activeTab, reportType, bugForm, setBugForm]);

    const loadSubmissions = async () => {
        try {
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            const endpoint = reportType === 'bug' ? 'bug-bounty' : 'feature';
            const response = await fetch(`${serverUrl}/api/submissions/${endpoint}/user/${player.walletAddress}`);
            const data = await response.json();

            if (response.ok) {
                setSubmissions(data.submissions || []);
            }
        } catch (error) {
            console.error('Error loading submissions:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const form = reportType === 'bug' ? bugForm : featureForm;

        if (!form.title.trim() || !form.description.trim()) {
            setGameMessage('❌ Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            if (reportType === 'bug') {
                // Create FormData for file upload
                const formData = new FormData();
                formData.append('walletAddress', player.walletAddress);
                formData.append('title', bugForm.title);
                formData.append('description', bugForm.description);
                formData.append('severity', bugForm.severity);
                formData.append('steps', bugForm.steps);

                // Add screenshots
                bugForm.screenshots.forEach((file) => {
                    formData.append('screenshots', file);
                });

                const response = await fetch(`${serverUrl}/api/submissions/bug-bounty/submit`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    setGameMessage('🐛 Bug report submitted successfully!');
                    setBugForm({ title: '', description: '', severity: 'medium', steps: '', screenshots: [] });
                    setActiveTab('history');
                } else {
                    setGameMessage(`❌ ${data.error || 'Failed to submit bug report'}`);
                }
            } else {
                const response = await fetch(`${serverUrl}/api/submissions/feature/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        walletAddress: player.walletAddress,
                        ...featureForm
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    setGameMessage('💡 Feature request submitted successfully!');
                    setFeatureForm({ title: '', description: '', category: 'general' });
                    setActiveTab('history');
                } else {
                    setGameMessage(`❌ ${data.error || 'Failed to submit feature request'}`);
                }
            }
        } catch (error) {
            console.error('Error submitting:', error);
            setGameMessage('❌ Failed to submit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-yellow-400 border-yellow-500';
            case 'reviewing': return 'text-blue-400 border-blue-500';
            case 'approved': return 'text-green-400 border-[#00FF88]';
            case 'completed': return 'text-[#FFD700] border-[#FFD700]';
            case 'rejected': return 'text-red-400 border-red-500';
            default: return 'text-gray-400 border-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'reviewing': return '👀';
            case 'approved': return '✅';
            case 'completed': return '🎉';
            case 'rejected': return '❌';
            default: return '📋';
        }
    };

    const modalContent = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-0 md:p-4 overscroll-none z-modal"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border-2 border-[#00FF88] p-4 md:p-6 max-w-2xl w-full h-auto max-h-[100dvh] md:max-h-[90dvh] overflow-y-auto overflow-x-hidden font-bbs pb-safe-bottom"
                style={{ touchAction: 'pan-y' }}
            >
                {/* Header */}
                <div className="text-[#00FF88] text-center mb-4 text-glow-green">
                    <div className="text-2xl font-bold">🐛 BUG REPORT TERMINAL 🐛</div>
                </div>
                <div className="text-center mb-4 text-gray-400 text-sm">
                    Help improve the game! Earn XP for valuable reports.
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab('submit')}
                        className={`flex-1 py-2 px-4 font-bold border-2 transition-all ${
                            activeTab === 'submit'
                                ? 'bg-[#00AA55] border-[#00FF88] text-[#00FF88]'
                                : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                    >
                        📝 Submit
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 px-4 font-bold border-2 transition-all ${
                            activeTab === 'history'
                                ? 'bg-[#00AA55] border-[#00FF88] text-[#00FF88]'
                                : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                    >
                        📋 History
                    </button>
                </div>

                {/* Submit Tab */}
                {activeTab === 'submit' && (
                    <>
                        {/* Type Selector */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setReportType('bug')}
                                className={`flex-1 py-2 px-4 font-bold border-2 transition-all ${
                                    reportType === 'bug'
                                        ? 'bg-red-900 border-red-500 text-red-500'
                                        : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                                }`}
                            >
                                🐛 Bug
                            </button>
                            <button
                                onClick={() => setReportType('feature')}
                                className={`flex-1 py-2 px-4 font-bold border-2 transition-all ${
                                    reportType === 'feature'
                                        ? 'bg-purple-900 border-purple-500 text-purple-500'
                                        : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                                }`}
                            >
                                💡 Feature
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-[#00FF88] font-bold mb-2">
                                    Title <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={reportType === 'bug' ? bugForm.title : featureForm.title}
                                    onChange={(e) => reportType === 'bug'
                                        ? setBugForm({ ...bugForm, title: e.target.value })
                                        : setFeatureForm({ ...featureForm, title: e.target.value })
                                    }
                                    maxLength={200}
                                    className="w-full bg-black border-2 border-gray-600 px-3 py-2 text-[#00FF88] placeholder-gray-600 focus:border-[#00FF88] focus:outline-none"
                                    placeholder={`Brief ${reportType} title...`}
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[#00FF88] font-bold mb-2">
                                    Description <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={reportType === 'bug' ? bugForm.description : featureForm.description}
                                    onChange={(e) => reportType === 'bug'
                                        ? setBugForm({ ...bugForm, description: e.target.value })
                                        : setFeatureForm({ ...featureForm, description: e.target.value })
                                    }
                                    maxLength={5000}
                                    rows={6}
                                    className="w-full bg-black border-2 border-gray-600 px-3 py-2 text-[#00FF88] placeholder-gray-600 focus:border-[#00FF88] focus:outline-none resize-none"
                                    placeholder={reportType === 'bug' ? 'Describe the bug in detail...' : 'Describe your feature idea...'}
                                    required
                                />
                            </div>

                            {/* Bug-specific fields */}
                            {reportType === 'bug' && (
                                <>
                                    <div>
                                        <label className="block text-[#00FF88] font-bold mb-2">Severity</label>
                                        <select
                                            value={bugForm.severity}
                                            onChange={(e) => setBugForm({ ...bugForm, severity: e.target.value })}
                                            className="w-full bg-black border-2 border-gray-600 px-3 py-2 text-[#00FF88] focus:border-[#00FF88] focus:outline-none"
                                        >
                                            <option value="low">Low - Minor issue</option>
                                            <option value="medium">Medium - Affects gameplay</option>
                                            <option value="high">High - Major issue</option>
                                            <option value="critical">Critical - Game breaking</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[#00FF88] font-bold mb-2">Steps to Reproduce</label>
                                        <textarea
                                            value={bugForm.steps}
                                            onChange={(e) => setBugForm({ ...bugForm, steps: e.target.value })}
                                            maxLength={2000}
                                            rows={4}
                                            className="w-full bg-black border-2 border-gray-600 px-3 py-2 text-[#00FF88] placeholder-gray-600 focus:border-[#00FF88] focus:outline-none resize-none"
                                            placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[#00FF88] font-bold mb-2">Screenshots</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                if (files.length + bugForm.screenshots.length > 5) {
                                                    toast.error('Maximum 5 screenshots allowed');
                                                    return;
                                                }
                                                setBugForm({ ...bugForm, screenshots: [...bugForm.screenshots, ...files] });
                                            }}
                                            className="w-full bg-black border-2 border-gray-600 px-3 py-2 text-[#00FF88] focus:border-[#00FF88] focus:outline-none file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-[#00FF88] file:text-black file:font-bold file:cursor-pointer hover:file:bg-[#00AA55]"
                                        />
                                        {bugForm.screenshots.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {bugForm.screenshots.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-black border border-gray-600 px-3 py-2">
                                                        <span className="text-[#00FF88] text-sm truncate">{file.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newScreenshots = [...bugForm.screenshots];
                                                                newScreenshots.splice(index, 1);
                                                                setBugForm({ ...bugForm, screenshots: newScreenshots });
                                                            }}
                                                            className="text-red-400 hover:text-red-300 font-bold"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-500 mt-1">Max 5 screenshots, 5MB each • 📋 You can also paste images from clipboard!</p>
                                    </div>
                                </>
                            )}

                            {/* Feature-specific fields */}
                            {reportType === 'feature' && (
                                <div>
                                    <label className="block text-[#00FF88] font-bold mb-2">Category</label>
                                    <select
                                        value={featureForm.category}
                                        onChange={(e) => setFeatureForm({ ...featureForm, category: e.target.value })}
                                        className="w-full bg-black border-2 border-gray-600 px-3 py-2 text-[#00FF88] focus:border-[#00FF88] focus:outline-none"
                                    >
                                        <option value="general">General</option>
                                        <option value="gameplay">Gameplay</option>
                                        <option value="ui">User Interface</option>
                                        <option value="social">Social Features</option>
                                        <option value="economy">Game Economy</option>
                                    </select>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-4 py-3 bg-[#00AA55] border-2 border-[#00FF88] text-[#00FF88] font-bold hover:bg-[#00BB66] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '⏳ Submitting...' : `🚀 Submit ${reportType === 'bug' ? 'Bug Report' : 'Feature Request'}`}
                            </button>
                        </form>
                    </>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <>
                        {/* Type Selector */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setReportType('bug')}
                                className={`flex-1 py-2 px-4 font-bold border-2 transition-all ${
                                    reportType === 'bug'
                                        ? 'bg-red-900 border-red-500 text-red-500'
                                        : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                                }`}
                            >
                                🐛 Bugs
                            </button>
                            <button
                                onClick={() => setReportType('feature')}
                                className={`flex-1 py-2 px-4 font-bold border-2 transition-all ${
                                    reportType === 'feature'
                                        ? 'bg-purple-900 border-purple-500 text-purple-500'
                                        : 'bg-black border-gray-600 text-gray-400 hover:border-gray-500'
                                }`}
                            >
                                💡 Features
                            </button>
                        </div>

                        {/* Submissions List */}
                        {submissions.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-4xl mb-4">{reportType === 'bug' ? '🐛' : '💡'}</p>
                                <p className="text-[#00FF88] text-lg font-bold">
                                    No {reportType === 'bug' ? 'bug reports' : 'feature requests'} yet!
                                </p>
                                <p className="text-gray-400 text-sm mt-2">
                                    Be the first to help improve the game and earn XP rewards!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                                {submissions.map((submission) => (
                                    <div
                                        key={submission._id}
                                        className="bg-black border-2 border-gray-600 p-3 hover:border-[#00FF88] transition-all cursor-pointer"
                                        onClick={() => setExpandedSubmission(
                                            expandedSubmission === submission._id ? null : submission._id
                                        )}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="text-[#00FF88] font-bold">{submission.title}</h4>
                                                <p className="text-gray-400 text-xs mt-1">
                                                    {new Date(submission.submittedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {submission.xpAwarded > 0 && (
                                                    <div className="bg-[#FFD700] text-black px-2 py-1 font-bold text-xs">
                                                        ⭐ +{submission.xpAwarded} XP
                                                    </div>
                                                )}
                                                <div className={`px-2 py-1 border font-bold text-xs ${getStatusColor(submission.status)}`}>
                                                    {getStatusIcon(submission.status)} {submission.status.toUpperCase()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedSubmission === submission._id && (
                                            <div className="mt-3 pt-3 border-t border-gray-600">
                                                <p className="text-[#00FF88] text-sm whitespace-pre-wrap mb-3">{submission.description}</p>

                                                {/* Screenshots */}
                                                {submission.screenshots && submission.screenshots.length > 0 && (
                                                    <div className="mb-3">
                                                        <p className="text-[#00FF88] font-bold text-sm mb-2">📸 Screenshots:</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {submission.screenshots.map((screenshot, idx) => (
                                                                <a
                                                                    key={idx}
                                                                    href={screenshot}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="border-2 border-gray-600 hover:border-[#00FF88] transition-all"
                                                                >
                                                                    <img
                                                                        src={screenshot}
                                                                        alt={`Screenshot ${idx + 1}`}
                                                                        className="w-full h-24 object-cover"
                                                                    />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {submission.adminReply && (
                                                    <div className="bg-[#00FF88]/10 border border-[#00FF88]/30 p-3">
                                                        <p className="text-[#00FF88] font-bold text-sm mb-1">👑 Admin Reply:</p>
                                                        <p className="text-[#00FF88] text-sm whitespace-pre-wrap">{submission.adminReply}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Close */}
                <button
                    onClick={onClose}
                    className="w-full mt-4 px-4 py-3 bg-black border-2 border-gray-600 text-gray-400 hover:bg-black font-bold"
                >
                    [ESC] Close
                </button>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default BugReport;
