import { useWizard } from '../contexts/WizardContext';
import { STEPS } from '../types/wizard';

export function ProgressBar() {
  const { currentStepIndex, goToStep } = useWizard();

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="flex items-center min-w-max mx-auto px-4">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <div key={step.id} className="flex items-center">
              {/* Step circle */}
              <button
                onClick={() => idx < currentStepIndex && goToStep(idx)}
                disabled={idx > currentStepIndex}
                title={step.label}
                className="flex flex-col items-center group"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: isCompleted
                      ? 'var(--success)'
                      : isCurrent
                        ? 'var(--accent)'
                        : 'var(--bg-secondary)',
                    color: isCompleted || isCurrent ? 'var(--accent-text)' : 'var(--text-muted)',
                    border: `2px solid ${isCompleted ? 'var(--success)' : isCurrent ? 'var(--accent)' : 'var(--border)'}`,
                    cursor: idx < currentStepIndex ? 'pointer' : 'default',
                  }}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span
                  className="mt-1 text-xs whitespace-nowrap"
                  style={{
                    color: isCurrent ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: isCurrent ? 700 : 400,
                  }}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className="h-0.5 w-8 mx-1"
                  style={{
                    background: idx < currentStepIndex ? 'var(--success)' : 'var(--border)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
