import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { SupportedLanguage, languageNames } from '../../locales';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { language, setLanguage, openLanguageModal } = useLanguage();

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={openLanguageModal}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/60 bg-secondary/40 text-slate-200 text-xs font-semibold hover:border-emerald-500 hover:bg-emerald-500/10 transition-colors shadow-sm"
        title="Change Platform Language / भाषा बदलें / భాషను మార్చండి"
      >
        <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>{languageNames[language]?.nativeName || 'English'}</span>
      </button>

      {/* Select fallback for accessibility */}
      <select
        id="language-select"
        aria-label="Select Language"
        value={language}
        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
        className="sr-only"
      >
        {(Object.keys(languageNames) as SupportedLanguage[]).map((langKey) => (
          <option key={langKey} value={langKey}>
            {variant === 'compact'
              ? languageNames[langKey].nativeName
              : `${languageNames[langKey].nativeName} (${languageNames[langKey].name})`}
          </option>
        ))}
      </select>
    </div>
  );
};
