import React from 'react';
import { Languages, CheckCircle2, Sparkles, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { SupportedLanguage } from '@/locales';
import { Button } from '@/components/ui/button';

interface LanguageOption {
  code: SupportedLanguage;
  nativeTitle: string;
  englishTitle: string;
  badge: string;
  description: string;
  sample: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'en',
    nativeTitle: 'English',
    englishTitle: 'English',
    badge: 'EN',
    description: 'Complete platform in English with Indian mandi terms',
    sample: 'Direct Farm-to-Consumer Market with 0% Middleman Commission',
  },
  {
    code: 'hi',
    nativeTitle: 'हिन्दी',
    englishTitle: 'Hindi',
    badge: 'HI',
    description: 'पूरी वेबसाइट, इनपुट फॉर्म और आवाज़ पहचान हिन्दी में',
    sample: 'सीधे खेत से खरीद • 0% बिचौलिया कमीशन • उचित पारदर्शी मूल्य',
  },
  {
    code: 'te',
    nativeTitle: 'తెలుగు',
    englishTitle: 'Telugu',
    badge: 'TE',
    description: 'మొత్తం వెబ్‌సైట్, ఇన్‌పుట్‌లు మరియు వాయిస్ శోధన పూర్తిగా తెలుగులో',
    sample: 'రైతుల పొలం గేట్ వద్ద ప్రత్యక్ష కొనుగోలు • 0% దళారీ కమిషన్',
  },
];

export const LanguageSelectModal: React.FC = () => {
  const { language, setLanguage, isLanguageModalOpen, closeLanguageModal, t } = useLanguage();

  if (!isLanguageModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl shadow-emerald-950/50"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={closeLanguageModal}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close language selector"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 mb-1">
            <Languages className="h-6 w-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>{t.languageModal.title}</span>
            <Sparkles className="h-5 w-5 text-amber-400" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            {t.languageModal.subtitle}
          </p>
        </div>

        {/* 3 Interactive Language Cards */}
        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 my-6">
          {LANGUAGE_OPTIONS.map((opt) => {
            const isSelected = language === opt.code;
            return (
              <div
                key={opt.code}
                onClick={() => setLanguage(opt.code)}
                className={`group relative cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all duration-200 flex items-center justify-between ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-500/15 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/60'
                    : 'border-slate-800 bg-slate-900/60 hover:border-emerald-500/50 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold text-sm tracking-wider ${
                      isSelected
                        ? 'bg-emerald-500 text-white shadow'
                        : 'bg-slate-800 text-slate-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-300'
                    }`}
                  >
                    {opt.badge}
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white tracking-wide">
                        {opt.nativeTitle}
                      </span>
                      {opt.nativeTitle !== opt.englishTitle && (
                        <span className="text-xs text-slate-400">({opt.englishTitle})</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1">{opt.description}</p>
                    <p className="text-[11px] text-emerald-400/90 font-medium italic">
                      "{opt.sample}"
                    </p>
                  </div>
                </div>

                <div className="ml-3 shrink-0">
                  {isSelected ? (
                    <div className="flex items-center gap-1 text-emerald-400 font-semibold text-xs bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/40">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Active</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-slate-700 group-hover:border-emerald-500 group-hover:text-emerald-300"
                    >
                      Select
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-[11px] text-slate-400">
            {t.languageModal.changeAnytime}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectModal;
