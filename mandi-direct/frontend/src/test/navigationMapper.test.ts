import { describe, it, expect, beforeEach, vi } from 'vitest';
import { voiceGuidanceService } from '../services/voice/VoiceGuidanceService';
import {
  NAVIGATION_ACTIONS,
  LOGIN_STEPS,
  getActionDefinition,
} from '../services/navigationMapper/NavigationActionRegistry';
import { resolveIntent } from '../services/aiNavigation/intentResolver';

describe('VoiceGuidanceService', () => {
  const localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(localStorageMock)) {
      delete localStorageMock[key];
    }
    // Mock global localStorage
    (globalThis as any).localStorage = {
      getItem: (key: string) => localStorageMock[key] ?? null,
      setItem: (key: string, val: string) => {
        localStorageMock[key] = val;
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => {
        for (const key of Object.keys(localStorageMock)) {
          delete localStorageMock[key];
        }
      },
    };
    vi.restoreAllMocks();
  });

  it('should initialize with voice enabled by default', () => {
    expect(voiceGuidanceService.isVoiceEnabled()).toBe(true);
  });

  it('should persist voice toggle in localStorage', () => {
    voiceGuidanceService.setVoiceEnabled(false);
    expect(voiceGuidanceService.isVoiceEnabled()).toBe(false);
    expect(localStorage.getItem('mandi_voice_enabled')).toBe('false');

    const toggled = voiceGuidanceService.toggleVoice();
    expect(toggled).toBe(true);
    expect(voiceGuidanceService.isVoiceEnabled()).toBe(true);
    expect(localStorage.getItem('mandi_voice_enabled')).toBe('true');
  });

  it('should detect voice missing in headless environment for Telugu and Hindi', () => {
    const isMissingTe = voiceGuidanceService.isVoiceMissing('te');
    const isMissingEn = voiceGuidanceService.isVoiceMissing('en');
    expect(typeof isMissingTe).toBe('boolean');
    // English is considered present by default
    expect(isMissingEn).toBe(false);
  });

  it('should not throw on stop() or speak() in headless environment', () => {
    expect(() => voiceGuidanceService.stop()).not.toThrow();
    const result = voiceGuidanceService.speak('నమస్కారం', 'te');
    expect(result).toBeDefined();
  });
});

describe('NavigationActionRegistry', () => {
  it('should define core navigation actions', () => {
    const actionKeys = Object.keys(NAVIGATION_ACTIONS);
    expect(actionKeys.length).toBeGreaterThanOrEqual(6);
    expect(actionKeys).toContain('upload_crop');
    expect(actionKeys).toContain('farmer_orders');
    expect(actionKeys).toContain('farmer_earnings');
    expect(actionKeys).toContain('market_prices');
    expect(actionKeys).toContain('farmer_profile');
    expect(actionKeys).toContain('notifications');
  });

  it('should define physical guided login steps', () => {
    expect(LOGIN_STEPS.length).toBe(3);
    expect(LOGIN_STEPS[0].targetId).toBe('login-username');
    expect(LOGIN_STEPS[1].targetId).toBe('login-password');
    expect(LOGIN_STEPS[2].targetId).toBe('login-submit');

    // Instructions must be localized in EN, HI, TE
    for (const step of LOGIN_STEPS) {
      expect(step.instruction.en).toBeDefined();
      expect(step.instruction.hi).toBeDefined();
      expect(step.instruction.te).toBeDefined();
      expect(step.spokenPrompt.en).toBeDefined();
      expect(step.spokenPrompt.hi).toBeDefined();
      expect(step.spokenPrompt.te).toBeDefined();
    }
  });

  it('should retrieve definition via getActionDefinition', () => {
    const def = getActionDefinition('upload_crop');
    expect(def).not.toBeNull();
    expect(def?.actionId).toBe('upload_crop');
    expect(def?.requiresAuth).toBe(true);

    const nonExistent = getActionDefinition('non_existent');
    expect(nonExistent).toBeNull();
  });

  it('should have valid arrow placements and action step types for upload_crop', () => {
    const uploadAction = NAVIGATION_ACTIONS.upload_crop;
    expect(uploadAction).toBeDefined();
    expect(uploadAction.steps.length).toBeGreaterThanOrEqual(8);

    const validPositions = ['top', 'bottom', 'left', 'right'];
    const validActions = ['input', 'click', 'change', 'file'];

    for (const step of uploadAction.steps) {
      expect(step.targetId).toBeDefined();
      expect(validActions).toContain(step.actionType);
      expect(validPositions).toContain(step.arrowPosition);
      expect(step.instruction.en).toBeDefined();
      expect(step.instruction.hi).toBeDefined();
      expect(step.instruction.te).toBeDefined();
      expect(step.spokenPrompt.en).toBeDefined();
      expect(step.spokenPrompt.hi).toBeDefined();
      expect(step.spokenPrompt.te).toBeDefined();
    }

    // Verify step sequence includes all required upload stages
    const stepTargetIds = uploadAction.steps.map(s => s.targetId);
    expect(stepTargetIds).toContain('upload-crop');
    expect(stepTargetIds).toContain('upload-crop-photo');
    expect(stepTargetIds).toContain('upload-crop-location');
    expect(stepTargetIds).toContain('upload-crop-category');
    expect(stepTargetIds).toContain('upload-crop-name');
    expect(stepTargetIds).toContain('upload-crop-price');
    expect(stepTargetIds).toContain('upload-crop-quantity');
    expect(stepTargetIds).toContain('upload-crop-harvest-date');
    expect(stepTargetIds).toContain('upload-crop-submit');
  });

  it('should match natural language queries for Navigation Mapper intents in EN, HI, and TE', () => {
    // English query
    const matchEn = resolveIntent('how do I upload a crop to sell?');
    expect(matchEn).toBeDefined();
    expect(matchEn?.actionId).toBe('upload_crop');

    // Hindi query
    const matchHi = resolveIntent('फसल कैसे बेचें');
    expect(matchHi).toBeDefined();
    expect(matchHi?.actionId).toBe('upload_crop');

    // Telugu query
    const matchTe = resolveIntent('పంటను అమ్మాలి');
    expect(matchTe).toBeDefined();
    expect(matchTe?.actionId).toBe('upload_crop');

    // Market prices query
    const matchPrices = resolveIntent('mandi bhav check');
    expect(matchPrices).toBeDefined();
    expect(matchPrices?.actionId).toBe('market_prices');

    // Earnings query
    const matchEarnings = resolveIntent('check my earnings and payouts');
    expect(matchEarnings).toBeDefined();
    expect(['earnings', 'farmer_earnings']).toContain(matchEarnings?.actionId);
    expect(getActionDefinition(matchEarnings!.actionId)).not.toBeNull();
  });
});
