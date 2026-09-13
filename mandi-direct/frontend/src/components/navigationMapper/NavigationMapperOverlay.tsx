import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigationMapper } from '../../context/NavigationMapperContext';
import { useLanguage } from '../../context/LanguageContext';
import { GuidedArrow } from './GuidedArrow';
import { Volume2, VolumeX, RotateCcw, X, AlertTriangle } from 'lucide-react';

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const NavigationMapperOverlay: React.FC = () => {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    voiceEnabled,
    isVoiceMissing,
    advanceStep,
    cancelGuide,
    toggleVoice,
    speakCurrentInstruction,
  } = useNavigationMapper();

  const { language, t } = useLanguage();
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [targetFound, setTargetFound] = useState(true);
  const targetElementRef = useRef<HTMLElement | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);

  // Clear validation errors when step changes
  useEffect(() => {
    setValidationError(null);
  }, [currentStepIndex]);

  // Update target bounding box
  const updateTargetPosition = useCallback(() => {
    if (!currentStep) {
      setTargetRect(null);
      return;
    }

    const selector = `[data-tour-id="${currentStep.targetId}"]`;
    const element = document.querySelector(selector) as HTMLElement | null;

    if (element) {
      targetElementRef.current = element;
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
      setTargetFound(true);

      // Smoothly scroll into view if offscreen
      if (rect.top < 80 || rect.bottom > window.innerHeight - 80) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
      setTargetFound(false);
    }
  }, [currentStep]);

  // Position polling and window event listeners
  useEffect(() => {
    if (!isActive || !currentStep) return;

    updateTargetPosition();
    const interval = setInterval(updateTargetPosition, 400);

    const handleScrollOrResize = () => updateTargetPosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isActive, currentStep, updateTargetPosition]);

  // Validate step before advancing
  const validateAndAdvance = useCallback(() => {
    if (!currentStep) return;

    // 1. Photo step validation
    if (currentStep.targetId === 'upload-crop-photo') {
      const fileInput = document.getElementById('crop-photo-input') as HTMLInputElement | null;
      const hasFiles = Boolean(fileInput && fileInput.files && fileInput.files.length > 0);
      const hasPreviews = Boolean(document.querySelector('[data-tour-id="upload-crop-photo"] img'));
      if (!hasFiles && !hasPreviews) {
        setValidationError(
          language === 'hi'
            ? 'कृपया पहले अपनी फसल की फोटो अपलोड करें।'
            : language === 'te'
            ? 'దయచేసి ముందుగా మీ పంట ఫోటోను అప్‌లోడ్ చేయండి.'
            : 'Please upload a crop photo first.'
        );
        return;
      }
    }

    // 2. Category validation
    if (currentStep.targetId === 'upload-crop-category') {
      const catEl = document.querySelector('[data-tour-id="upload-crop-category"] select') as HTMLSelectElement | null;
      if (!catEl || !catEl.value.trim()) {
        setValidationError(
          language === 'hi'
            ? 'कृपया फसल की श्रेणी चुनें।'
            : language === 'te'
            ? 'దయచేసి పంట వర్గాన్ని ఎంచుకోండి.'
            : 'Please select a crop category.'
        );
        return;
      }
    }

    // 3. Name validation
    if (currentStep.targetId === 'upload-crop-name') {
      const nameEl = (document.getElementById('product_name') || document.querySelector('[data-tour-id="upload-crop-name"] input')) as HTMLInputElement | null;
      if (!nameEl || !nameEl.value.trim()) {
        setValidationError(
          language === 'hi'
            ? 'कृपया फसल का नाम दर्ज करें।'
            : language === 'te'
            ? 'దయచేసి పంట పేరు నమోదు చేయండి.'
            : 'Please enter the crop name.'
        );
        return;
      }
    }

    // 4. Price validation
    if (currentStep.targetId === 'upload-crop-price') {
      const priceEl = (document.getElementById('expected_price') || document.querySelector('[data-tour-id="upload-crop-price"] input')) as HTMLInputElement | null;
      if (!priceEl || !priceEl.value || parseFloat(priceEl.value) <= 0) {
        setValidationError(
          language === 'hi'
            ? 'कृपया मान्य विक्रय मूल्य दर्ज करें।'
            : language === 'te'
            ? 'దయచేసి సరైన విక్రయ ధరను నమోదు చేయండి.'
            : 'Please enter a valid price.'
        );
        return;
      }
    }

    // 5. Quantity validation
    if (currentStep.targetId === 'upload-crop-quantity') {
      const qtyEl = (document.getElementById('total_quantity') || document.querySelector('[data-tour-id="upload-crop-quantity"] input')) as HTMLInputElement | null;
      if (!qtyEl || !qtyEl.value || parseFloat(qtyEl.value) <= 0) {
        setValidationError(
          language === 'hi'
            ? 'कृपया मान्य मात्रा दर्ज करें।'
            : language === 'te'
            ? 'దయచేసి సరైన పరిమాణాన్ని నమోదు చేయండి.'
            : 'Please enter a valid quantity.'
        );
        return;
      }
    }

    // 6. Harvest date validation
    if (currentStep.targetId === 'upload-crop-harvest-date') {
      const dateEl = (document.getElementById('harvest_date') || document.querySelector('[data-tour-id="upload-crop-harvest-date"] input')) as HTMLInputElement | null;
      if (!dateEl || !dateEl.value) {
        setValidationError(
          language === 'hi'
            ? 'कृपया कटाई की तारीख चुनें।'
            : language === 'te'
            ? 'దయచేసి పంట కోత తేదీని ఎంచుకోండి.'
            : 'Please select the harvest date.'
        );
        return;
      }
    }

    // Generic intermediate field validation
    if (currentStep.actionType === 'input') {
      const selector = `[data-tour-id="${currentStep.targetId}"]`;
      const el = document.querySelector(selector);
      const inp = (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' ? el : el?.querySelector('input, textarea')) as HTMLInputElement | null;
      if (inp && !inp.value.trim()) {
        setValidationError(
          language === 'hi'
            ? 'कृपया आगे बढ़ने से पहले यह फ़ील्ड भरें।'
            : language === 'te'
            ? 'దయచేసి కొనసాగడానికి ముందు ఈ ఫీల్డ్‌ను పూర్తి చేయండి.'
            : 'Please complete this field before proceeding.'
        );
        return;
      }
    }

    setValidationError(null);
    advanceStep();
  }, [currentStep, language, advanceStep]);

  // Real user-action detection
  useEffect(() => {
    if (!isActive || !currentStep) return;

    const selector = `[data-tour-id="${currentStep.targetId}"]`;
    const element = document.querySelector(selector) as HTMLElement | null;
    if (!element) return;

    if (currentStep.actionType === 'input') {
      const inputEl = (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA'
        ? element
        : element.querySelector('input, textarea')) as HTMLInputElement | HTMLTextAreaElement | null;

      if (inputEl) {
        const handleKeyDown = (e: any) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            validateAndAdvance();
          }
        };

        inputEl.addEventListener('keydown', handleKeyDown);
        return () => {
          inputEl.removeEventListener('keydown', handleKeyDown);
        };
      }
    } else if (currentStep.actionType === 'click') {
      const handleClick = () => {
        // Allow the application's click event to fire, then advance guide
        setTimeout(() => {
          advanceStep();
        }, 150);
      };

      element.addEventListener('click', handleClick);
      return () => {
        element.removeEventListener('click', handleClick);
      };
    } else if (currentStep.actionType === 'file') {
      const fileInput = (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'file'
        ? element
        : element.querySelector('input[type="file"]')) as HTMLInputElement | null;

      if (fileInput) {
        const handleFileChange = () => {
          if (fileInput.files && fileInput.files.length > 0) {
            setValidationError(null);
            setTimeout(() => {
              advanceStep();
            }, 500);
          }
        };

        fileInput.addEventListener('change', handleFileChange);
        return () => {
          fileInput.removeEventListener('change', handleFileChange);
        };
      }
    }
  }, [isActive, currentStep, advanceStep, validateAndAdvance]);

  if (!isActive || !currentStep) return null;

  const isFinalStep = currentStep.targetId === 'upload-crop-submit' || currentStepIndex === totalSteps - 1;
  const instructionText = currentStep.instruction[language] || currentStep.instruction.en;

  // Calculate card coordinates so it doesn't overlap the highlighted input
  let cardTop = 20;
  let cardLeft = 20;
  if (targetRect) {
    if (currentStep.arrowPosition === 'bottom') {
      // Element is below the arrow; put card above the arrow or below element
      cardTop = Math.max(16, targetRect.top - 160);
      cardLeft = Math.min(window.innerWidth - 360, Math.max(16, targetRect.left));
    } else {
      // Put card above element or below
      cardTop = Math.min(window.innerHeight - 200, targetRect.top + targetRect.height + 70);
      cardLeft = Math.min(window.innerWidth - 360, Math.max(16, targetRect.left));
    }
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none transition-opacity duration-200">
      {/* Target Element Spotlight Frame & Glowing Outline */}
      {targetRect && (
        <div
          className="fixed rounded-xl pointer-events-none transition-all duration-200"
          style={{
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            border: '3px solid #10b981',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55), 0 0 20px rgba(16, 185, 129, 0.7)',
            zIndex: 49,
          }}
        />
      )}

      {/* Dynamic Animated Pointing Arrow */}
      {targetRect && (
        <GuidedArrow targetRect={targetRect} position={currentStep.arrowPosition} />
      )}

      {/* Compact Guidance Card */}
      <div
        className="pointer-events-auto fixed z-50 max-w-xs sm:max-w-sm w-full mx-3 bg-slate-950/95 text-white rounded-2xl shadow-2xl border-2 border-emerald-500 p-4 backdrop-blur-md animate-in fade-in zoom-in-95"
        style={{
          top: `${cardTop}px`,
          left: `${cardLeft}px`,
        }}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {t.guidedTour.step} {currentStepIndex + 1} {t.guidedTour.of} {totalSteps}
          </span>
          <div className="flex items-center gap-1">
            {/* Replay Speech */}
            <button
              type="button"
              onClick={speakCurrentInstruction}
              title="Repeat instruction voice"
              aria-label="Repeat voice guidance"
              className="p-1 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            {/* Toggle Voice */}
            <button
              type="button"
              onClick={toggleVoice}
              title={voiceEnabled ? 'Voice Guidance ON' : 'Voice Guidance OFF'}
              aria-label={voiceEnabled ? 'Mute voice' : 'Unmute voice'}
              className={`p-1 rounded-lg transition-colors ${
                voiceEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500'
              }`}
            >
              {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>
            {/* Close / Skip */}
            <button
              type="button"
              onClick={cancelGuide}
              title="Close guide"
              aria-label="Close guide"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Missing Voice Warning Banner if applicable */}
        {isVoiceMissing && language === 'te' && (
          <div className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] flex items-start gap-1.5 leading-tight">
            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
            <span>Telugu voice is not available on this browser/device. You can continue using visual guidance.</span>
          </div>
        )}

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mb-2 p-2 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center gap-1.5 animate-shake">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Missing Element Notice */}
        {!targetFound && (
          <div className="mb-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px]">
            Searching for element on page...
          </div>
        )}

        {/* Instruction Message */}
        <p className="text-sm font-semibold text-white leading-relaxed mb-3">
          {instructionText}
        </p>

        {/* Navigation Action Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-800 gap-2">
          <button
            type="button"
            onClick={cancelGuide}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-1"
          >
            Exit Guide
          </button>

          <div className="flex items-center gap-2">
            {!isFinalStep ? (
              <button
                type="button"
                onClick={validateAndAdvance}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md hover:shadow-emerald-500/20 flex items-center gap-1"
              >
                <span>{language === 'hi' ? 'अगला' : language === 'te' ? 'తదుపరి' : 'Next'}</span>
                <span>&rarr;</span>
              </button>
            ) : (
              <span className="text-[11px] text-emerald-400 font-bold animate-pulse">
                {language === 'hi' ? 'बटन पर क्लिक करें' : language === 'te' ? 'బటన్ పై క్లిక్ చేయండి' : 'Click the button below'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
