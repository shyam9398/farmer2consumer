import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import {
  NavigationStep,
  LOGIN_STEPS,
  NAVIGATION_ACTIONS,
  NavigationActionDefinition,
} from '../services/navigationMapper/NavigationActionRegistry';
import { voiceGuidanceService } from '../services/voice/VoiceGuidanceService';

interface NavigationMapperState {
  active: boolean;
  actionId: string | null;
  stepIndex: number;
  waitingForUserAction: boolean;
  voiceEnabled: boolean;
}

interface NavigationMapperContextType {
  isActive: boolean;
  actionId: string | null;
  currentStepIndex: number;
  totalSteps: number;
  currentStep: NavigationStep | null;
  waitingForUserAction: boolean;
  voiceEnabled: boolean;
  isVoiceMissing: boolean;
  startNavigation: (actionId: string) => void;
  advanceStep: () => void;
  prevStep: () => void;
  cancelGuide: () => void;
  toggleVoice: () => void;
  speakCurrentInstruction: () => void;
  resumeAtFirstIncompleteStep: () => void;
}

const STORAGE_KEY = 'mandi_nav_mapper_state';

const NavigationMapperContext = createContext<NavigationMapperContextType | undefined>(undefined);

export const NavigationMapperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [active, setActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.active);
      }
    } catch {
      // ignore
    }
    return false;
  });

  const [actionId, setActionId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).actionId || null;
    } catch {}
    return null;
  });

  const [stepIndex, setStepIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return Number(JSON.parse(saved).stepIndex) || 0;
    } catch {}
    return 0;
  });

  const [steps, setSteps] = useState<NavigationStep[]>([]);
  const [waitingForUserAction, setWaitingForUserAction] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => voiceGuidanceService.isVoiceEnabled());
  const [isVoiceMissing, setIsVoiceMissing] = useState(false);

  const prevStepIndexRef = useRef<number>(-1);

  // Build the effective step list considering authentication status
  const buildStepsForAction = useCallback(
    (targetActionId: string, isAuthenticated: boolean): NavigationStep[] => {
      const actionDef: NavigationActionDefinition = NAVIGATION_ACTIONS[targetActionId];
      if (!actionDef) return [];

      if (actionDef.requiresAuth && !isAuthenticated) {
        // Prepend physical guided login steps
        return [...LOGIN_STEPS, ...actionDef.steps];
      }
      return actionDef.steps;
    },
    []
  );

  // Keep steps synchronized when actionId or auth changes
  useEffect(() => {
    if (active && actionId) {
      const computedSteps = buildStepsForAction(actionId, Boolean(profile));
      setSteps(computedSteps);
    } else {
      setSteps([]);
    }
  }, [active, actionId, profile, buildStepsForAction]);

  // Persist state to localStorage
  useEffect(() => {
    if (active && actionId) {
      const stateObj: NavigationMapperState = {
        active,
        actionId,
        stepIndex,
        waitingForUserAction,
        voiceEnabled,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
      } catch {}
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, [active, actionId, stepIndex, waitingForUserAction, voiceEnabled]);

  // Handle post-login transition: if user was on login steps and just logged in, advance to dashboard
  useEffect(() => {
    if (active && profile && steps.length > 0) {
      const current = steps[stepIndex];
      if (current && current.route === '/login') {
        // User has successfully logged in! Find the first step on dashboard or upload
        const nextPostLoginIndex = steps.findIndex(
          (s, idx) => idx > stepIndex && s.route !== '/login'
        );
        if (nextPostLoginIndex !== -1) {
          setStepIndex(nextPostLoginIndex);
          const nextStep = steps[nextPostLoginIndex];
          if (location.pathname !== nextStep.route && nextStep.route !== '*') {
            navigate(nextStep.route);
          }
        }
      }
    }
  }, [active, profile, steps, stepIndex, location.pathname, navigate]);

  const currentStep = steps[stepIndex] || null;

  // Speak the instruction for the current step
  const speakCurrentInstruction = useCallback(() => {
    if (!currentStep || !voiceEnabled) return;
    const text = currentStep.spokenPrompt[language] || currentStep.spokenPrompt.en;
    const res = voiceGuidanceService.speak(text, language);
    if (!res.voiceFound && language !== 'en') {
      setIsVoiceMissing(true);
    } else {
      setIsVoiceMissing(false);
    }
  }, [currentStep, language, voiceEnabled]);

  // Trigger speech when step changes
  useEffect(() => {
    if (active && currentStep && prevStepIndexRef.current !== stepIndex) {
      prevStepIndexRef.current = stepIndex;
      speakCurrentInstruction();
    }
  }, [active, currentStep, stepIndex, speakCurrentInstruction]);

  // Helper to find first incomplete step when on /farmer/produce/new
  const findFirstIncompleteUploadStepIndex = useCallback((stepList: NavigationStep[]): number => {
    if (typeof window === 'undefined' || !window.location.pathname.includes('/farmer/produce/new')) {
      return 0;
    }

    // 1. Photo
    const fileInput = document.getElementById('crop-photo-input') as HTMLInputElement | null;
    const photoPreviews = document.querySelectorAll('[data-tour-id="upload-crop-photo"] img');
    const hasPhoto = Boolean((fileInput && fileInput.files && fileInput.files.length > 0) || (photoPreviews && photoPreviews.length > 0));
    if (!hasPhoto) {
      const idx = stepList.findIndex(s => s.targetId === 'upload-crop-photo');
      if (idx !== -1) return idx;
    }

    // 2. Category
    const catEl = document.querySelector('[data-tour-id="upload-crop-category"] select') as HTMLSelectElement | null;
    if (!catEl || !catEl.value) {
      const idx = stepList.findIndex(s => s.targetId === 'upload-crop-category');
      if (idx !== -1) return idx;
    }

    // 3. Name
    const nameEl = (document.getElementById('product_name') || document.querySelector('[data-tour-id="upload-crop-name"] input')) as HTMLInputElement | null;
    if (!nameEl || !nameEl.value.trim()) {
      const idx = stepList.findIndex(s => s.targetId === 'upload-crop-name');
      if (idx !== -1) return idx;
    }

    // 4. Price
    const priceEl = (document.getElementById('expected_price') || document.querySelector('[data-tour-id="upload-crop-price"] input')) as HTMLInputElement | null;
    if (!priceEl || !priceEl.value || parseFloat(priceEl.value) <= 0) {
      const idx = stepList.findIndex(s => s.targetId === 'upload-crop-price');
      if (idx !== -1) return idx;
    }

    // 5. Quantity
    const qtyEl = (document.getElementById('total_quantity') || document.querySelector('[data-tour-id="upload-crop-quantity"] input')) as HTMLInputElement | null;
    if (!qtyEl || !qtyEl.value || parseFloat(qtyEl.value) <= 0) {
      const idx = stepList.findIndex(s => s.targetId === 'upload-crop-quantity');
      if (idx !== -1) return idx;
    }

    // 6. Harvest date
    const dateEl = (document.getElementById('harvest_date') || document.querySelector('[data-tour-id="upload-crop-harvest-date"] input')) as HTMLInputElement | null;
    if (!dateEl || !dateEl.value) {
      const idx = stepList.findIndex(s => s.targetId === 'upload-crop-harvest-date');
      if (idx !== -1) return idx;
    }

    // 7. Submit button
    const submitIdx = stepList.findIndex(s => s.targetId === 'upload-crop-submit');
    if (submitIdx !== -1) return submitIdx;

    return 0;
  }, []);

  const resumeAtFirstIncompleteStep = useCallback(() => {
    if (!active || actionId !== 'upload_crop' || steps.length === 0) return;
    const firstIncomplete = findFirstIncompleteUploadStepIndex(steps);
    setStepIndex(firstIncomplete);
    setWaitingForUserAction(true);
  }, [active, actionId, steps, findFirstIncompleteUploadStepIndex]);

  const startNavigation = useCallback(
    (targetActionId: string) => {
      const computedSteps = buildStepsForAction(targetActionId, Boolean(profile));
      if (computedSteps.length === 0) return;

      setActionId(targetActionId);
      setSteps(computedSteps);

      // If user is already on the target form page, resume at the first incomplete step
      let initialIdx = 0;
      if (targetActionId === 'upload_crop' && location.pathname.includes('/farmer/produce/new')) {
        initialIdx = findFirstIncompleteUploadStepIndex(computedSteps);
      }

      setStepIndex(initialIdx);
      setWaitingForUserAction(true);
      setActive(true);
      prevStepIndexRef.current = -1;

      const targetStep = computedSteps[initialIdx] || computedSteps[0];
      if (targetStep.route !== '*' && location.pathname !== targetStep.route) {
        navigate(targetStep.route);
      }
    },
    [buildStepsForAction, profile, location.pathname, navigate, findFirstIncompleteUploadStepIndex]
  );

  const advanceStep = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      setWaitingForUserAction(true);

      const nextStep = steps[nextIdx];
      if (nextStep.route !== '*' && location.pathname !== nextStep.route) {
        navigate(nextStep.route);
      }
    } else {
      // Completed all steps in the guide!
      voiceGuidanceService.stop();
      setActive(false);
      setActionId(null);
      setStepIndex(0);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, [stepIndex, steps, location.pathname, navigate]);

  const prevStep = useCallback(() => {
    if (stepIndex > 0) {
      const prevIdx = stepIndex - 1;
      setStepIndex(prevIdx);
      setWaitingForUserAction(true);

      const prev = steps[prevIdx];
      if (prev.route !== '*' && location.pathname !== prev.route) {
        navigate(prev.route);
      }
    }
  }, [stepIndex, steps, location.pathname, navigate]);

  const cancelGuide = useCallback(() => {
    voiceGuidanceService.stop();
    setActive(false);
    setActionId(null);
    setStepIndex(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const toggleVoice = useCallback(() => {
    const nextState = !voiceEnabled;
    setVoiceEnabled(nextState);
    voiceGuidanceService.setVoiceEnabled(nextState);
    if (nextState && currentStep) {
      speakCurrentInstruction();
    }
  }, [voiceEnabled, currentStep, speakCurrentInstruction]);

  return (
    <NavigationMapperContext.Provider
      value={{
        isActive: active,
        actionId,
        currentStepIndex: stepIndex,
        totalSteps: steps.length,
        currentStep,
        waitingForUserAction,
        voiceEnabled,
        isVoiceMissing,
        startNavigation,
        advanceStep,
        prevStep,
        cancelGuide,
        toggleVoice,
        speakCurrentInstruction,
        resumeAtFirstIncompleteStep,
      }}
    >
      {children}
    </NavigationMapperContext.Provider>
  );
};

export const useNavigationMapper = (): NavigationMapperContextType => {
  const context = useContext(NavigationMapperContext);
  if (!context) {
    throw new Error('useNavigationMapper must be used within a NavigationMapperProvider');
  }
  return context;
};
