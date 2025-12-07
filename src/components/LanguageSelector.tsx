import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../types/i18n.types';

const LanguageSelector: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    const languages: { code: Language; name: string; flag: string }[] = [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'zh', name: '中文', flag: '🇨🇳' },
    ];

    return (
        <div className="fixed top-4 right-4 z-system">
            <div className="bg-black border-2 border-[#00FF88] rounded-lg overflow-hidden font-bbs shadow-lg shadow-green-500/50">
                <label className="text-xs text-[#00FF88] px-2 pt-1 block">Language / 语言</label>
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="bg-black text-[#00FF88] px-4 pb-2 text-lg cursor-pointer outline-none appearance-none pr-8 w-full border-t border-[#00AA55]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2300FF88' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                    }}
                >
                    {languages.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-black text-[#00FF88]">
                            {lang.flag} {lang.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default LanguageSelector;
