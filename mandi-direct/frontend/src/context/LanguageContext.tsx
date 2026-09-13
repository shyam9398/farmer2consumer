import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, translations, TranslationType } from '../locales';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationType;
  isLanguageModalOpen: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'mandi_language';
const CHOSEN_KEY = 'mandi_language_chosen';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'hi' || saved === 'te') {
        return saved;
      }
    } catch {
      // ignore storage access errors
    }
    return 'en';
  });

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(() => {
    try {
      // If user hasn't explicitly chosen their language yet, show the modal on start
      return localStorage.getItem(CHOSEN_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      localStorage.setItem(CHOSEN_KEY, 'true');
    } catch {
      // ignore
    }
    setIsLanguageModalOpen(false);
  };

  const openLanguageModal = () => setIsLanguageModalOpen(true);
  const closeLanguageModal = () => setIsLanguageModalOpen(false);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language] || translations.en,
    isLanguageModalOpen,
    openLanguageModal,
    closeLanguageModal,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
