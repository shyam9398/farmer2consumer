import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface VoiceInputOptions {
  onResult?: (text: string) => void;
  promptLabel?: string;
  autoStop?: boolean;
}

export const useVoiceInput = (options: VoiceInputOptions = {}) => {
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Map active language to speech recognition tag
  const getSpeechLang = useCallback(() => {
    switch (language) {
      case 'hi':
        return 'hi-IN';
      case 'te':
        return 'te-IN';
      case 'en':
      default:
        return 'en-IN';
    }
  }, [language]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  // Text-to-Speech helper for speaking instructions / labels
  const speakText = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!('speechSynthesis' in window)) {
        if (onEnd) onEnd();
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getSpeechLang();
        utterance.rate = 0.95;
        if (onEnd) {
          utterance.onend = () => onEnd();
          utterance.onerror = () => onEnd();
        }
        window.speechSynthesis.speak(utterance);
      } catch {
        if (onEnd) onEnd();
      }
    },
    [getSpeechLang]
  );

  const startRecognitionInternal = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(t.voice.unsupported);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = getSpeechLang();
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const result = event.results?.[0]?.[0]?.transcript || '';
        setTranscript(result);
        if (options.onResult) {
          options.onResult(result);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError(t.voice.denied);
        } else if (event.error !== 'no-speech') {
          setError(event.error || t.common.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setError(err?.message || t.common.error);
    }
  }, [getSpeechLang, options, t]);

  const startListening = useCallback(
    (promptText?: string) => {
      setError(null);
      const textToSpeak = promptText || options.promptLabel;

      if (textToSpeak && 'speechSynthesis' in window) {
        speakText(textToSpeak, () => {
          startRecognitionInternal();
        });
      } else {
        startRecognitionInternal();
      }
    },
    [options.promptLabel, speakText, startRecognitionInternal]
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    speakText,
  };
};
