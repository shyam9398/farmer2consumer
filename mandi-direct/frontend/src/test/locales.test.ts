import { describe, it, expect } from 'vitest';
import { en, hi, te, translations, languageNames } from '../locales';

describe('Locales & Translation Integrity', () => {
  it('should support English, Hindi, and Telugu dictionaries', () => {
    expect(translations.en).toBeDefined();
    expect(translations.hi).toBeDefined();
    expect(translations.te).toBeDefined();
    expect(Object.keys(languageNames)).toEqual(['en', 'hi', 'te']);
  });

  it('should have matching common keys across all languages', () => {
    expect(en.common.loading).toBe('Loading...');
    expect(hi.common.loading).toBe('लोड हो रहा है...');
    expect(te.common.loading).toBe('లోడ్ అవుతోంది...');

    expect(en.farmerDashboard.greeting).toBe('Hello, Farmer 👋');
    expect(hi.farmerDashboard.greeting).toBe('नमस्ते, किसान भाई 👋');
    expect(te.farmerDashboard.greeting).toBe('నమస్కారం, రైతు సోదరా 👋');
  });

  it('should have complete marketPrices category keys in all languages', () => {
    const categories = ['all', 'grains', 'vegetables', 'fruits', 'spices', 'pulses', 'oilseeds'] as const;
    for (const cat of categories) {
      expect(en.marketPrices.categories[cat]).toBeDefined();
      expect(hi.marketPrices.categories[cat]).toBeDefined();
      expect(te.marketPrices.categories[cat]).toBeDefined();
    }
  });

  it('should define guided navigation phrases for all supported languages', () => {
    expect(en.guidedTour.helpTitle).toBe('AI Farmer Assistant');
    expect(hi.guidedTour.helpTitle).toBe('एआई किसान सहायक');
    expect(te.guidedTour.helpTitle).toBe('AI రైతు సహాయకుడు');
  });
});
