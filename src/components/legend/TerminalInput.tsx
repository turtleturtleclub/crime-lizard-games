import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface TerminalInputProps {
    onCommand: (command: string) => void;
    availableCommands?: string[];
    prompt?: string;
}

const TerminalInput: React.FC<TerminalInputProps> = ({
    onCommand,
    availableCommands = [],
    prompt = '>'
}) => {
    const { language } = useLanguage();
    const [input, setInput] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Auto-focus input
        inputRef.current?.focus();
    }, []);

    const handleInputChange = (value: string) => {
        setInput(value);

        // Update suggestions based on input
        if (value.length > 0 && availableCommands.length > 0) {
            const matches = availableCommands.filter(cmd =>
                cmd.toLowerCase().startsWith(value.toLowerCase())
            );
            setSuggestions(matches.slice(0, 5));
        } else {
            setSuggestions([]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            setCommandHistory([...commandHistory, input]);
            setHistoryIndex(-1);
            onCommand(input.trim().toLowerCase());
            setInput('');
            setSuggestions([]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Arrow up - previous command
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = historyIndex < commandHistory.length - 1
                    ? historyIndex + 1
                    : historyIndex;
                setHistoryIndex(newIndex);
                setInput(commandHistory[commandHistory.length - 1 - newIndex]);
            }
        }
        // Arrow down - next command
        else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[commandHistory.length - 1 - newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInput('');
            }
        }
        // Tab - autocomplete
        else if (e.key === 'Tab') {
            e.preventDefault();
            if (suggestions.length > 0) {
                setInput(suggestions[0]);
                setSuggestions([]);
            }
        }
    };

    return (
        <div className="w-full">
            {/* Suggestions */}
            {suggestions.length > 0 && (
                <div className="mb-2 text-sm font-bbs text-gray-500">
                    <div className="border border-gray-700 bg-black p-2">
                        {suggestions.map((suggestion, i) => (
                            <div
                                key={i}
                                className="cursor-pointer hover:text-[#00FF88] hover:bg-[#00AA55]/20 px-1"
                                onClick={() => {
                                    setInput(suggestion);
                                    setSuggestions([]);
                                    inputRef.current?.focus();
                                }}
                            >
                                {suggestion}
                            </div>
                        ))}
                        <div className="text-xs text-gray-600 mt-1 px-1">
                            {language === 'zh' ? '按 TAB 自动完成' : 'Press TAB to autocomplete'}
                        </div>
                    </div>
                </div>
            )}

            {/* Command Input */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <span className="text-[#00FF88] font-bbs text-xl text-glow-green">
                    {prompt}
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-black text-[#00FF88] font-bbs text-xl border-none outline-none caret-green-500"
                    placeholder={language === 'zh' ? "输入命令（或'帮助'）..." : "Type command (or 'help')..."}
                    autoComplete="off"
                    spellCheck="false"
                />
            </form>

            {/* Help hint */}
            <div className="text-xs font-bbs text-gray-600 mt-1">
                {language === 'zh'
                    ? "输入'帮助'查看命令 | ↑↓ 查看历史 | TAB 自动完成"
                    : "Type 'help' for commands | ↑↓ for history | TAB for autocomplete"
                }
            </div>
        </div>
    );
};

export default TerminalInput;
