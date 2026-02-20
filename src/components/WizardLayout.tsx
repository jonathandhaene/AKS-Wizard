import React from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ProgressBar } from './ProgressBar';
import { useWizard } from '../contexts/WizardContext';
import { STEPS } from '../types/wizard';

interface WizardLayoutProps {
  children: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  hideNext?: boolean;
  hideBack?: boolean;
  nextDisabled?: boolean;
}

export function WizardLayout({
  children,
  onNext,
  onBack,
  nextLabel = 'Next →',
  backLabel = '← Back',
  hideNext = false,
  hideBack = false,
  nextDisabled = false,
}: WizardLayoutProps) {
  const { currentStepIndex, goNext, goBack } = useWizard();

  const handleNext = onNext ?? goNext;
  const handleBack = onBack ?? goBack;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Header */}
      <header
        className="px-6 py-3 flex items-center justify-between sticky top-0 z-40"
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-text)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">☸️</span>
          <div>
            <div className="font-bold text-lg leading-tight">AKS Configuration Wizard</div>
            <div className="text-xs opacity-75">Azure Kubernetes Service</div>
          </div>
        </div>
        <ThemeSwitcher />
      </header>

      {/* Progress */}
      <div
        className="px-4 py-3 border-b"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <ProgressBar />
      </div>

      {/* Step label */}
      <div
        className="px-6 py-2 text-sm font-medium"
        style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}
      >
        Step {currentStepIndex + 1} of {STEPS.length} — {STEPS[currentStepIndex].label}
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-6 mx-auto w-full max-w-3xl">{children}</main>

      {/* Footer nav */}
      <footer
        className="sticky bottom-0 px-6 py-4 flex justify-between items-center border-t"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
        }}
      >
        {!hideBack ? (
          <button onClick={handleBack} disabled={currentStepIndex === 0} className="btn-secondary">
            {backLabel}
          </button>
        ) : (
          <div />
        )}
        {!hideNext && (
          <button onClick={handleNext} disabled={nextDisabled} className="btn-primary">
            {nextLabel}
          </button>
        )}
      </footer>
    </div>
  );
}
