import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Language, Translations } from '../types/i18n.types';
import { en } from '../i18n/en';
import { zh } from '../i18n/zh';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = {
    en,
    zh,
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize from localStorage or default to English
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('crime-lizard-language');
        return (saved as Language) || 'en';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('crime-lizard-language', lang);
        // Refresh the page to apply language changes throughout the app
        window.location.reload();
    };

    const t = translations[language];

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
