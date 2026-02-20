import { useState } from 'react';
import { WizardLayout } from '../components/WizardLayout';
import { InfoBox } from '../components/InfoBox';
import { useWizard } from '../contexts/WizardContext';
import type { AksMode } from '../types/wizard';

interface Question {
  id: string;
  text: string;
  hint: string;
  weight: number; // positive = favours Standard, negative = favours Automatic
}

const QUESTIONS: Question[] = [
  {
    id: 'dedicated_platform',
    text: 'Does your team include dedicated platform / infrastructure engineers responsible for Kubernetes operations?',
    hint: 'Platform engineers own cluster upgrades, node pool sizing, and networking configurations.',
    weight: 2,
  },
  {
    id: 'upgrade_cadence',
    text: 'Can your team commit to reviewing and applying Kubernetes upgrades within 30 days of release?',
    hint: 'AKS drops support for Kubernetes versions older than three minor releases.',
    weight: 2,
  },
  {
    id: 'custom_networking',
    text: 'Do you require advanced networking customisation (custom CNI, BYO VNET, UDR, or private cluster)?',
    hint: 'AKS Automatic constrains certain networking options to accelerate onboarding.',
    weight: 3,
  },
  {
    id: 'gitops_cicd',
    text: 'Does your team already operate a GitOps or CI/CD pipeline for infrastructure changes?',
    hint: 'Mature CI/CD pipelines are required to safely manage Standard AKS cluster lifecycle.',
    weight: 2,
  },
  {
    id: 'node_customisation',
    text: 'Do your workloads require custom OS configurations, GPU nodes, or specialised node pool settings?',
    hint: 'AKS Automatic manages node pools on your behalf, limiting low-level node customisation.',
    weight: 3,
  },
  {
    id: 'multi_env',
    text: 'Are you deploying across multiple environments (dev, staging, prod) with environment-specific configurations?',
    hint: 'Multi-environment setups benefit from IaC-driven Standard AKS to keep configs consistent.',
    weight: 1,
  },
];

type Answer = 'yes' | 'no' | null;

function scoresToMode(answers: Record<string, Answer>): AksMode {
  let score = 0;
  for (const q of QUESTIONS) {
    if (answers[q.id] === 'yes') score += q.weight;
  }
  // Score >= 5 means the team leans towards Standard AKS
  return score >= 5 ? 'Standard' : 'Automatic';
}

export function MaturityAssessment() {
  const { updateConfig, goNext } = useWizard();
  const [answers, setAnswers] = useState<Record<string, Answer>>(
    Object.fromEntries(QUESTIONS.map((q) => [q.id, null])),
  );
  const [submitted, setSubmitted] = useState(false);

  const answered = Object.values(answers).filter((a) => a !== null).length;
  const allAnswered = answered === QUESTIONS.length;
  const recommendation = allAnswered ? scoresToMode(answers) : null;

  const handleAnswer = (id: string, value: Answer) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setSubmitted(false);
  };

  const handleNext = () => {
    setSubmitted(true);
    const mode = scoresToMode(answers);
    updateConfig({ aksMode: mode });
    goNext();
  };

  return (
    <WizardLayout onNext={allAnswered ? handleNext : undefined} nextDisabled={!allAnswered}>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Team Readiness Assessment
      </h2>
      <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Answer these questions to help the wizard recommend the right AKS mode for your team:
        <strong> AKS Automatic</strong> (fully managed, accelerated onboarding) or
        <strong> AKS Standard</strong> (full control, recommended for platform teams).
      </p>

      <InfoBox variant="info" title="AKS Automatic vs Standard">
        <strong>AKS Automatic</strong> reduces operational overhead by managing node provisioning,
        upgrades, and security configurations automatically — ideal for teams new to Kubernetes or
        focused on application delivery rather than platform operations.{' '}
        <strong>AKS Standard</strong> gives your platform team full control over every cluster
        parameter and is required for advanced networking, custom node pools, or strict compliance.
      </InfoBox>

      <div className="space-y-4 mt-4">
        {QUESTIONS.map((q, i) => (
          <div
            key={q.id}
            className="card"
            style={{
              border: `1px solid ${answers[q.id] !== null ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              {i + 1}. {q.text}
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              {q.hint}
            </p>
            <div className="flex gap-3">
              {(['yes', 'no'] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => handleAnswer(q.id, val)}
                  className="px-5 py-1.5 rounded text-sm font-semibold"
                  style={{
                    background: answers[q.id] === val ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: answers[q.id] === val ? 'var(--accent-text)' : 'var(--text-primary)',
                    border: `2px solid ${answers[q.id] === val ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                  }}
                >
                  {val === 'yes' ? '✅ Yes' : '❌ No'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="mt-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        {answered} / {QUESTIONS.length} questions answered
      </div>

      {/* Live recommendation */}
      {recommendation && (
        <div
          className="mt-4 p-4 rounded text-center"
          style={{
            background:
              recommendation === 'Automatic'
                ? 'color-mix(in srgb, var(--info) 12%, transparent)'
                : 'color-mix(in srgb, var(--accent) 12%, transparent)',
            border: `1px solid ${recommendation === 'Automatic' ? 'var(--info)' : 'var(--accent)'}`,
            borderRadius: 'var(--radius)',
          }}
        >
          <div className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {recommendation === 'Automatic' ? '🤖' : '🔧'} Recommended:{' '}
            AKS {recommendation}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {recommendation === 'Automatic'
              ? "Your team will benefit from AKS Automatic's managed operations — fewer Kubernetes administration tasks so you can focus on application delivery."
              : "Your team has the maturity to leverage AKS Standard's full control over cluster configuration, networking, and lifecycle management."}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            You can override this recommendation on the <strong>Basics</strong> step.
          </div>
        </div>
      )}

      {submitted && !allAnswered && (
        <div
          className="mt-3 p-2 rounded text-sm text-center"
          style={{
            background: 'color-mix(in srgb, var(--error) 10%, transparent)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--radius)',
            color: 'var(--error)',
          }}
        >
          Please answer all questions before continuing.
        </div>
      )}
    </WizardLayout>
  );
}
