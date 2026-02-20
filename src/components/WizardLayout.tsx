import React, { useState } from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ProgressBar } from './ProgressBar';
import { ArchitectureDiagram } from './ArchitectureDiagram';
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
  const { currentStepIndex, goNext, goBack, config } = useWizard();
  const [showDiagram, setShowDiagram] = useState(false);

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDiagram((v) => !v)}
            title="Toggle architecture preview"
            style={{
              background: showDiagram ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
              color: 'var(--accent-text)',
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 'var(--radius)',
              padding: '0.3rem 0.8rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'background 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span>🗺</span>
            {showDiagram ? 'Hide Preview' : 'Architecture Preview'}
          </button>
          <ThemeSwitcher />
        </div>
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

      {/* Content + optional diagram panel */}
      <main className="flex-1 flex min-h-0">
        <div className="flex-1 px-4 py-6 mx-auto w-full max-w-3xl">{children}</div>

        {/* Architecture preview panel (slides in from right) */}
        <aside
          aria-label="Architecture preview"
          style={{
            width: showDiagram ? '380px' : '0',
            minWidth: showDiagram ? '380px' : '0',
            overflow: 'hidden',
            transition: 'width 0.3s ease, min-width 0.3s ease',
            background: 'var(--bg-secondary)',
            borderLeft: showDiagram ? '1px solid var(--border)' : 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {showDiagram && (
            <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  marginBottom: '0.75rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>🗺</span> Architecture Preview
              </div>
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '0.5rem',
                }}
              >
                <ArchitectureDiagram config={config} />
              </div>
              <p
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.5rem',
                  lineHeight: 1.4,
                }}
              >
                This diagram reflects your current configuration and updates in real-time as you
                complete each step. Use the ← Back button to revisit and modify any setting.
              </p>
            </div>
          )}
        </aside>
      </main>

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
