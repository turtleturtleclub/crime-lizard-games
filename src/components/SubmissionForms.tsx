import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletContext } from '../providers/WalletContext';
import { toast } from 'react-toastify';

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

const SubmissionForms: React.FC = () => {
    const { account } = useContext(WalletContext);
    const [activeTab, setActiveTab] = useState<'bug' | 'feature'>('bug');
    const [showForm, setShowForm] = useState(false);
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

    // Load user's submissions on mount and tab change
    useEffect(() => {
        if (account) {
            loadSubmissions();
        }
    }, [account, activeTab]);

    // Handle clipboard paste for screenshots
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            // Only handle paste when showing form and on bug tab
            if (!showForm || activeTab !== 'bug') return;

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
    }, [showForm, activeTab, bugForm]);

    const loadSubmissions = async () => {
        if (!account) return;

        try {
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            const endpoint = activeTab === 'bug' ? 'bug-bounty' : 'feature';
            const response = await fetch(`${serverUrl}/api/submissions/${endpoint}/user/${account}`);
            const data = await response.json();

            if (response.ok) {
                setSubmissions(data.submissions || []);
            }
        } catch (error) {
            console.error('Error loading submissions:', error);
        }
    };

    const handleBugSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account) {
            toast.error('Please connect your wallet first');
            return;
        }

        if (!bugForm.title.trim() || !bugForm.description.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            // Create FormData for file upload
            const formData = new FormData();
            formData.append('walletAddress', account);
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
                toast.success('Bug report submitted successfully! 🐛');
                setBugForm({ title: '', description: '', severity: 'medium', steps: '', screenshots: [] });
                setShowForm(false);
                loadSubmissions();
            } else {
                toast.error(data.error || 'Failed to submit bug report');
            }
        } catch (error) {
            console.error('Error submitting bug:', error);
            toast.error('Failed to submit bug report');
        } finally {
            setLoading(false);
        }
    };

    const handleFeatureSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account) {
            toast.error('Please connect your wallet first');
            return;
        }

        if (!featureForm.title.trim() || !featureForm.description.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const serverUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3003'
                : window.location.origin;

            const response = await fetch(`${serverUrl}/api/submissions/feature/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: account,
                    ...featureForm
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Feature request submitted successfully! 💡');
                setFeatureForm({ title: '', description: '', category: 'general' });
                setShowForm(false);
                loadSubmissions();
            } else {
                toast.error(data.error || 'Failed to submit feature request');
            }
        } catch (error) {
            console.error('Error submitting feature:', error);
            toast.error('Failed to submit feature request');
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

    if (!account) {
        return (
            <div className="bg-black border-2 border-[#FFD700] p-8 text-center">
                <p className="text-[#FFD700] text-lg font-bold">
                    🔐 Please connect your wallet to submit bug bounties or feature requests
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Tab Selector */}
            <div className="flex gap-4">
                <motion.button
                    onClick={() => { setActiveTab('bug'); setShowForm(false); }}
                    className={`flex-1 py-4 px-6 border-2 font-bold transition-all ${
                        activeTab === 'bug'
                            ? 'bg-black border-[#FFD700] text-[#FFD700]'
                            : 'bg-black border-gray-700 text-gray-400 hover:border-[#FFD700]/50 hover:text-[#FFD700]/70'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    🐛 Bug Bounties
                </motion.button>
                <motion.button
                    onClick={() => { setActiveTab('feature'); setShowForm(false); }}
                    className={`flex-1 py-4 px-6 border-2 font-bold transition-all ${
                        activeTab === 'feature'
                            ? 'bg-black border-[#FFD700] text-[#FFD700]'
                            : 'bg-black border-gray-700 text-gray-400 hover:border-[#FFD700]/50 hover:text-[#FFD700]/70'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    💡 Feature Requests
                </motion.button>
            </div>

            {/* Submit Button */}
            <motion.button
                onClick={() => setShowForm(!showForm)}
                className="w-full py-4 px-6 bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black font-bold transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {showForm ? '❌ Cancel' : `✨ Submit ${activeTab === 'bug' ? 'Bug Report' : 'Feature Request'}`}
            </motion.button>

            {/* Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={activeTab === 'bug' ? handleBugSubmit : handleFeatureSubmit} className="bg-black border-2 border-[#FFD700] p-6 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-[#FFD700] font-bold mb-2">
                                    Title <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={activeTab === 'bug' ? bugForm.title : featureForm.title}
                                    onChange={(e) => activeTab === 'bug'
                                        ? setBugForm({ ...bugForm, title: e.target.value })
                                        : setFeatureForm({ ...featureForm, title: e.target.value })
                                    }
                                    maxLength={200}
                                    className="w-full bg-black border-2 border-gray-700 px-4 py-3 text-gray-300 placeholder-gray-600 focus:border-[#FFD700] focus:outline-none"
                                    placeholder={`Brief ${activeTab === 'bug' ? 'bug' : 'feature'} title...`}
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[#FFD700] font-bold mb-2">
                                    Description <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={activeTab === 'bug' ? bugForm.description : featureForm.description}
                                    onChange={(e) => activeTab === 'bug'
                                        ? setBugForm({ ...bugForm, description: e.target.value })
                                        : setFeatureForm({ ...featureForm, description: e.target.value })
                                    }
                                    maxLength={5000}
                                    rows={6}
                                    className="w-full bg-black border-2 border-gray-700 px-4 py-3 text-gray-300 placeholder-gray-600 focus:border-[#FFD700] focus:outline-none resize-none"
                                    placeholder={activeTab === 'bug' ? 'Describe the bug in detail...' : 'Describe your feature idea...'}
                                    required
                                />
                            </div>

                            {/* Bug-specific fields */}
                            {activeTab === 'bug' && (
                                <>
                                    <div>
                                        <label className="block text-[#FFD700] font-bold mb-2">
                                            Severity
                                        </label>
                                        <select
                                            value={bugForm.severity}
                                            onChange={(e) => setBugForm({ ...bugForm, severity: e.target.value })}
                                            className="w-full bg-black border-2 border-gray-700 px-4 py-3 text-gray-300 focus:border-[#FFD700] focus:outline-none"
                                        >
                                            <option value="low" className="bg-black text-gray-300">Low - Minor issue</option>
                                            <option value="medium" className="bg-black text-gray-300">Medium - Affects gameplay</option>
                                            <option value="high" className="bg-black text-gray-300">High - Major issue</option>
                                            <option value="critical" className="bg-black text-gray-300">Critical - Game breaking</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[#FFD700] font-bold mb-2">
                                            Steps to Reproduce (Optional)
                                        </label>
                                        <textarea
                                            value={bugForm.steps}
                                            onChange={(e) => setBugForm({ ...bugForm, steps: e.target.value })}
                                            maxLength={2000}
                                            rows={4}
                                            className="w-full bg-black border-2 border-gray-700 px-4 py-3 text-gray-300 placeholder-gray-600 focus:border-[#FFD700] focus:outline-none resize-none"
                                            placeholder="1. Go to...\n2. Click on...\n3. See error..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[#FFD700] font-bold mb-2">
                                            Screenshots (Optional)
                                        </label>
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
                                            className="w-full bg-black border-2 border-gray-700 px-4 py-3 text-gray-300 focus:border-[#FFD700] focus:outline-none file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-[#FFD700] file:text-black file:font-bold file:cursor-pointer hover:file:bg-[#EEC900]"
                                        />
                                        {bugForm.screenshots.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {bugForm.screenshots.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-black border border-gray-700 px-3 py-2">
                                                        <span className="text-gray-300 text-sm truncate">{file.name}</span>
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
                            {activeTab === 'feature' && (
                                <div>
                                    <label className="block text-[#FFD700] font-bold mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={featureForm.category}
                                        onChange={(e) => setFeatureForm({ ...featureForm, category: e.target.value })}
                                        className="w-full bg-black border-2 border-gray-700 px-4 py-3 text-gray-300 focus:border-[#FFD700] focus:outline-none"
                                    >
                                        <option value="general" className="bg-black text-gray-300">General</option>
                                        <option value="gameplay" className="bg-black text-gray-300">Gameplay</option>
                                        <option value="ui" className="bg-black text-gray-300">User Interface</option>
                                        <option value="social" className="bg-black text-gray-300">Social Features</option>
                                        <option value="economy" className="bg-black text-gray-300">Game Economy</option>
                                    </select>
                                </div>
                            )}

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-6 bg-[#FFD700] text-black hover:bg-[#EEC900] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={!loading ? { scale: 1.02 } : {}}
                                whileTap={!loading ? { scale: 0.98 } : {}}
                            >
                                {loading ? '⏳ Submitting...' : `🚀 Submit ${activeTab === 'bug' ? 'Bug Report' : 'Feature Request'}`}
                            </motion.button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* User's Submissions */}
            <div className="bg-black border-2 border-[#FFD700] p-6">
                <h3 className="text-2xl font-bold text-[#FFD700] mb-4">
                    📋 Your {activeTab === 'bug' ? 'Bug Reports' : 'Feature Requests'}
                </h3>

                {submissions.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-4xl mb-4">{activeTab === 'bug' ? '🐛' : '💡'}</p>
                        <p className="text-[#FFD700] text-lg font-bold">
                            No {activeTab === 'bug' ? 'bug reports' : 'feature requests'} yet!
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            Be the first to help improve the game and earn XP rewards!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {submissions.map((submission) => (
                            <motion.div
                                key={submission._id}
                                className="bg-black border-2 border-gray-700 p-4 hover:border-[#FFD700] transition-all cursor-pointer"
                                onClick={() => setExpandedSubmission(
                                    expandedSubmission === submission._id ? null : submission._id
                                )}
                                whileHover={{ scale: 1.01 }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="text-[#FFD700] font-bold text-lg">{submission.title}</h4>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {new Date(submission.submittedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {submission.xpAwarded > 0 && (
                                            <div className="bg-[#FFD700] text-black px-3 py-1 font-bold text-sm">
                                                ⭐ +{submission.xpAwarded} XP
                                            </div>
                                        )}
                                        <div className={`px-3 py-1 border-2 font-bold text-sm ${getStatusColor(submission.status)}`}>
                                            {getStatusIcon(submission.status)} {submission.status.toUpperCase()}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {expandedSubmission === submission._id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4 pt-4 border-t border-gray-700"
                                        >
                                            <p className="text-gray-300 whitespace-pre-wrap mb-4">{submission.description}</p>

                                            {/* Screenshots */}
                                            {submission.screenshots && submission.screenshots.length > 0 && (
                                                <div className="mb-4">
                                                    <p className="text-[#FFD700] font-bold mb-2">📸 Screenshots:</p>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                        {submission.screenshots.map((screenshot, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={screenshot}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="border-2 border-gray-700 hover:border-[#FFD700] transition-all"
                                                            >
                                                                <img
                                                                    src={screenshot}
                                                                    alt={`Screenshot ${idx + 1}`}
                                                                    className="w-full h-32 object-cover"
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {submission.adminReply && (
                                                <div className="bg-[#FFD700]/10 border-2 border-[#FFD700]/30 p-4 mt-4">
                                                    <p className="text-[#FFD700] font-bold mb-2">👑 Admin Reply:</p>
                                                    <p className="text-gray-300 whitespace-pre-wrap">{submission.adminReply}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubmissionForms;
