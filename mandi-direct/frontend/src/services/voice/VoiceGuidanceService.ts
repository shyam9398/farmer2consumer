import { SupportedLanguage } from '../../locales';

export interface VoiceSpeakResult {
  spoken: boolean;
  voiceFound: boolean;
  voiceName?: string;
  errorMessage?: string;
}

class VoiceGuidanceService {
  private voices: SpeechSynthesisVoice[] = [];
  private voiceEnabled = true;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      // Voices are loaded asynchronously in Chrome/Edge/Firefox
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoices();
      };
      try {
        const saved = localStorage.getItem('mandi_voice_enabled');
        if (saved !== null) {
          this.voiceEnabled = saved === 'true';
        }
      } catch {
        this.voiceEnabled = true;
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
    try {
      localStorage.setItem('mandi_voice_enabled', String(enabled));
    } catch {
      // ignore
    }
    if (!enabled) {
      this.stop();
    }
  }

  public toggleVoice(): boolean {
    const next = !this.voiceEnabled;
    this.setVoiceEnabled(next);
    return next;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.voices.length && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
    return this.voices;
  }

  public findBestVoice(lang: SupportedLanguage): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    if (!voices.length) return null;

    let targetCode = 'en-IN';
    if (lang === 'hi') targetCode = 'hi-IN';
    if (lang === 'te') targetCode = 'te-IN';

    // 1. Exact match (e.g. te-IN or hi-IN)
    let matched = voices.find(v => v.lang.toLowerCase() === targetCode.toLowerCase());
    if (matched) return matched;

    // 2. Starts with lang code (e.g. 'te' or 'hi' or 'en')
    const langPrefix = lang === 'te' ? 'te' : lang === 'hi' ? 'hi' : 'en';
    matched = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
    if (matched) return matched;

    // 3. Check voice name containing Telugu / Hindi
    if (lang === 'te') {
      matched = voices.find(v => v.name.toLowerCase().includes('telugu'));
      if (matched) return matched;
    }
    if (lang === 'hi') {
      matched = voices.find(v => v.name.toLowerCase().includes('hindi'));
      if (matched) return matched;
    }

    // 4. Fallback for Indian English or default English
    matched = voices.find(v => v.lang.toLowerCase().includes('en-in'));
    if (matched) return matched;

    matched = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    return matched || voices[0] || null;
  }

  public isVoiceMissing(lang: SupportedLanguage): boolean {
    if (lang === 'en') return false;
    const voices = this.getAvailableVoices();
    if (!voices.length) return false; // Voices may not be loaded yet
    const langPrefix = lang === 'te' ? 'te' : 'hi';
    const langName = lang === 'te' ? 'telugu' : 'hindi';
    return !voices.some(v => 
      v.lang.toLowerCase().startsWith(langPrefix) || 
      v.name.toLowerCase().includes(langName)
    );
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public speak(
    text: string,
    lang: SupportedLanguage,
    onEnd?: () => void
  ): VoiceSpeakResult {
    if (!this.isSupported()) {
      return { spoken: false, voiceFound: false, errorMessage: 'Speech synthesis not supported in this browser' };
    }

    if (!this.voiceEnabled) {
      return { spoken: false, voiceFound: false, errorMessage: 'Voice guidance is muted by user' };
    }

    try {
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      const matchedVoice = this.findBestVoice(lang);

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      } else {
        utterance.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
      }

      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
      return {
        spoken: true,
        voiceFound: !!matchedVoice,
        voiceName: matchedVoice?.name,
      };
    } catch (err: any) {
      if (onEnd) onEnd();
      return { spoken: false, voiceFound: false, errorMessage: err?.message };
    }
  }
}

export const voiceGuidanceService = new VoiceGuidanceService();
