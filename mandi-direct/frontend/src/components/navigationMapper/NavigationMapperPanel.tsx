import React, { useState } from 'react';
import { Compass, X, Mic, Send, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigationMapper } from '../../context/NavigationMapperContext';
import { resolveIntent } from '../../services/aiNavigation/intentResolver';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { NAVIGATION_ACTIONS } from '../../services/navigationMapper/NavigationActionRegistry';

interface NavigationMapperPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NavigationMapperPanel: React.FC<NavigationMapperPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { language } = useLanguage();
  const { startNavigation } = useNavigationMapper();
  const [query, setQuery] = useState('');

  const handleSelectAction = (actionId: string) => {
    onClose();
    setQuery('');
    startNavigation(actionId);
  };

  const handleVoiceResult = (text: string) => {
    setQuery(text);
    const resolved = resolveIntent(text);
    if (resolved) {
      handleSelectAction(resolved.actionId);
    }
  };

  const { isListening, isSupported, startListening, stopListening } = useVoiceInput({
    onResult: handleVoiceResult,
  });

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const resolved = resolveIntent(query);
    if (resolved) {
      handleSelectAction(resolved.actionId);
    } else {
      // Default to upload crop if query mentions upload/crop
      handleSelectAction('upload_crop');
    }
  };

  if (!isOpen) return null;

  const predefinedQuestions = [
    {
      id: 'upload_crop',
      icon: '🌱',
      label: NAVIGATION_ACTIONS.upload_crop.title[language] || NAVIGATION_ACTIONS.upload_crop.title.en,
    },
    {
      id: 'farmer_orders',
      icon: '🛒',
      label: NAVIGATION_ACTIONS.farmer_orders.title[language] || NAVIGATION_ACTIONS.farmer_orders.title.en,
    },
    {
      id: 'farmer_earnings',
      icon: '💰',
      label: NAVIGATION_ACTIONS.farmer_earnings.title[language] || NAVIGATION_ACTIONS.farmer_earnings.title.en,
    },
    {
      id: 'market_prices',
      icon: '📈',
      label: NAVIGATION_ACTIONS.market_prices.title[language] || NAVIGATION_ACTIONS.market_prices.title.en,
    },
    {
      id: 'farmer_profile',
      icon: '👤',
      label: NAVIGATION_ACTIONS.farmer_profile.title[language] || NAVIGATION_ACTIONS.farmer_profile.title.en,
    },
    {
      id: 'notifications',
      icon: '🔔',
      label: NAVIGATION_ACTIONS.notifications.title[language] || NAVIGATION_ACTIONS.notifications.title.en,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-emerald-500/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Compass className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-1.5">
                🧭 Navigation Mapper
              </h3>
              <p className="text-xs text-emerald-100">
                {language === 'hi'
                  ? 'आप किस काम में सहायता चाहते हैं?'
                  : language === 'te'
                  ? 'మీరు దేనిలో సహాయం కోరుకుంటున్నారు?'
                  : 'What do you want help with?'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Navigation Mapper"
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Query & Voice Input */}
          <form onSubmit={handleTextSubmit} className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'पूछें: फसल कैसे अपलोड करूं? या माइक दबाएं...'
                  : language === 'te'
                  ? 'అడగండి: పంటను ఎలా అప్లోడ్ చేయాలి? లేదా మైక్ నొక్కండి...'
                  : 'Ask: How do I upload a crop? or speak...'
              }
              className="w-full pl-3 pr-20 py-2.5 text-xs sm:text-sm bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400"
              autoFocus
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              {isSupported && (
                <button
                  type="button"
                  onClick={() => (isListening ? stopListening() : startListening())}
                  aria-label="Start voice guidance"
                  className={`p-1.5 rounded-lg transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                  }`}
                  title={isListening ? 'Listening...' : 'Speak your question'}
                >
                  <Mic className="h-4 w-4" />
                </button>
              )}
              {query.trim() && (
                <button
                  type="submit"
                  className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  title="Submit query"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>

          {isListening && (
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              <span>Listening to your voice...</span>
            </div>
          )}

          {/* Basic Predefined Questions */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              {language === 'hi' ? 'सीधा मार्गदर्शन चुनें' : language === 'te' ? 'మార్గదర్శకత్వం ఎంచుకోండి' : 'Choose a guided workflow'}
            </p>

            <div className="space-y-2">
              {predefinedQuestions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleSelectAction(q.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500 hover:bg-emerald-950/20 text-left transition-all group"
                >
                  <span className="text-xl">{q.icon}</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-emerald-300">
                    {q.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
