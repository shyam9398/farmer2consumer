import React, { useState } from 'react';
import { Search, Mic, MicOff, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface VoiceSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const VoiceSearchInput: React.FC<VoiceSearchInputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  id = 'voice-search-input',
}) => {
  const { language, t } = useLanguage();
  const [activeSpeechText, setActiveSpeechText] = useState<string | null>(null);

  const { isListening, isSupported, startListening, stopListening } = useVoiceInput({
    onResult: (text: string) => {
      if (text) {
        onChange(text);
        setActiveSpeechText(text);
        setTimeout(() => setActiveSpeechText(null), 3000);
      }
    },
  });

  const getLanguageLabel = () => {
    switch (language) {
      case 'te':
        return 'తెలుగు (Telugu)';
      case 'hi':
        return 'हिन्दी (Hindi)';
      case 'en':
      default:
        return 'English';
    }
  };

  const getListeningMessage = () => {
    switch (language) {
      case 'te':
        return t.voice.speakingInTelugu || 'తెలుగులో వింటున్నాము... దయచేసి మాట్లాడండి.';
      case 'hi':
        return t.voice.speakingInHindi || 'हिन्दी में सुन रहे हैं... कृपया बोलें।';
      case 'en':
      default:
        return t.voice.speakingInEnglish || 'Listening in English... Speak your query.';
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative flex items-center w-full">
        {/* Search Icon */}
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

        {/* Text Input */}
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || t.marketplace.searchPlaceholder}
          className="w-full h-11 pl-10 pr-24 rounded-xl bg-secondary/30 border border-border/60 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Voice Input Microphone Button */}
        <button
          type="button"
          onClick={handleMicClick}
          disabled={!isSupported}
          title={
            !isSupported
              ? "Speech recognition not supported in your browser"
              : `${t.marketplace.voiceSearchTooltip} (${getLanguageLabel()})`
          }
          className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-lg transition-all ${
            !isSupported
              ? 'opacity-40 cursor-not-allowed text-slate-500'
              : isListening
              ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400 shadow-lg shadow-rose-600/50'
              : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
          }`}
        >
          {isListening ? (
            <MicOff className="h-4 w-4 animate-spin" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Floating Status Indicator when Voice Input is active */}
      {isListening && (
        <div className="absolute left-0 right-0 top-full mt-2 z-30 p-2.5 rounded-xl border border-rose-500/40 bg-slate-900/95 shadow-xl flex items-center justify-between text-xs text-rose-300 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="font-semibold">{getListeningMessage()}</span>
          </div>
          <span className="font-mono text-[10px] bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40 text-rose-200">
            {getLanguageLabel()}
          </span>
        </div>
      )}

      {/* Temporary toast confirming voice converted to text */}
      {activeSpeechText && !isListening && (
        <div className="absolute left-0 right-0 top-full mt-2 z-30 p-2 rounded-xl border border-emerald-500/40 bg-slate-900/95 shadow-xl flex items-center gap-2 text-xs text-emerald-300">
          <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
            {getLanguageLabel()}
          </span>
          <span className="truncate italic">"{activeSpeechText}"</span>
        </div>
      )}
    </div>
  );
};

export default VoiceSearchInput;
