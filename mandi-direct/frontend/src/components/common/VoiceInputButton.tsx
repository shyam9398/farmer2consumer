import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useLanguage } from '../../context/LanguageContext';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  promptLabel?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onResult,
  promptLabel,
  className = '',
  size = 'md',
}) => {
  const { t } = useLanguage();
  const { isListening, isSupported, error, startListening, stopListening } = useVoiceInput({
    onResult,
    promptLabel,
  });

  if (!isSupported) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isListening) {
      stopListening();
    } else {
      startListening(promptLabel);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-2.5 text-base',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        title={isListening ? t.voice.listening : t.voice.clickToSpeak}
        aria-label={isListening ? t.voice.listening : t.voice.clickToSpeak}
        className={`rounded-full transition-all flex items-center justify-center ${
          isListening
            ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200'
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
        } ${sizeClasses[size]} ${className}`}
      >
        {isListening ? (
          <MicOff className={iconSizes[size]} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </button>

      {error && (
        <span className="absolute -bottom-6 left-0 text-[10px] text-red-600 whitespace-nowrap bg-white px-1 shadow rounded border border-red-200 z-10">
          {error}
        </span>
      )}
    </div>
  );
};
