import { describe, it, expect } from 'vitest';
import { resolveIntent, getAllAvailableIntents } from '../services/aiNavigation/intentResolver';

describe('AI Guided Navigation Intent Resolver', () => {
  it('should list all predefined intents', () => {
    const intents = getAllAvailableIntents();
    expect(intents.length).toBeGreaterThanOrEqual(5);
    const actionIds = intents.map((i) => i.actionId);
    expect(actionIds).toContain('upload_crop');
    expect(actionIds).toContain('market_prices');
    expect(actionIds).toContain('farmer_orders');
    expect(actionIds).toContain('earnings');
    expect(actionIds).toContain('profile');
  });

  it('should resolve English queries accurately', () => {
    const res1 = resolveIntent('I want to upload crop');
    expect(res1).not.toBeNull();
    expect(res1?.actionId).toBe('upload_crop');
    expect(res1?.targetRoute).toBe('/farmer/produce/new');

    const res2 = resolveIntent('check market prices');
    expect(res2).not.toBeNull();
    expect(res2?.actionId).toBe('market_prices');
    expect(res2?.targetRoute).toBe('/farmer/market-prices');

    const res3 = resolveIntent('view my earnings');
    expect(res3).not.toBeNull();
    expect(res3?.actionId).toBe('earnings');
    expect(res3?.targetRoute).toBe('/farmer/earnings');
  });

  it('should resolve Hindi queries accurately', () => {
    const res1 = resolveIntent('fasal bechna hai');
    expect(res1).not.toBeNull();
    expect(res1?.actionId).toBe('upload_crop');

    const res2 = resolveIntent('mandi bhav dekhna hai');
    expect(res2).not.toBeNull();
    expect(res2?.actionId).toBe('market_prices');

    const res3 = resolveIntent('meri kamai kitni hui');
    expect(res3).not.toBeNull();
    expect(res3?.actionId).toBe('earnings');
  });

  it('should resolve Telugu queries accurately', () => {
    const res1 = resolveIntent('panta ammadam');
    expect(res1).not.toBeNull();
    expect(res1?.actionId).toBe('upload_crop');

    const res2 = resolveIntent('market dharalu');
    expect(res2).not.toBeNull();
    expect(res2?.actionId).toBe('market_prices');

    const res3 = resolveIntent('naa aadaayam');
    expect(res3).not.toBeNull();
    expect(res3?.actionId).toBe('earnings');
  });

  it('should return null for unmatched gibberish', () => {
    const res = resolveIntent('xyz123randomqwerty');
    expect(res).toBeNull();
  });
});
