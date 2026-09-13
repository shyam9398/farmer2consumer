import { en, TranslationType } from './en';
import { hi } from './hi';
import { te } from './te';

export type SupportedLanguage = 'en' | 'hi' | 'te';

export const translations: Record<SupportedLanguage, TranslationType> = {
  en,
  hi,
  te,
};

export const languageNames: Record<SupportedLanguage, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी' },
  te: { name: 'Telugu', nativeName: 'తెలుగు' },
};

export { en, hi, te };
export type { TranslationType };
