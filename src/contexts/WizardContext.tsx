import React, { createContext, useContext, useState, useCallback } from 'react';
import type { WizardConfig, StepId } from '../types/wizard';
import { defaultConfig, STEPS } from '../types/wizard';

interface WizardContextValue {
  config: WizardConfig;
  updateConfig: (partial: Partial<WizardConfig>) => void;
  currentStepIndex: number;
  currentStepId: StepId;
  goNext: () => void;
  goBack: () => void;
  goToStep: (index: number) => void;
  totalSteps: number;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<WizardConfig>(defaultConfig);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const updateConfig = useCallback((partial: Partial<WizardConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const goNext = useCallback(() => {
    setCurrentStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goToStep = useCallback((index: number) => {
    setCurrentStepIndex(Math.max(0, Math.min(index, STEPS.length - 1)));
  }, []);

  return (
    <WizardContext.Provider
      value={{
        config,
        updateConfig,
        currentStepIndex,
        currentStepId: STEPS[currentStepIndex].id,
        goNext,
        goBack,
        goToStep,
        totalSteps: STEPS.length,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
}
