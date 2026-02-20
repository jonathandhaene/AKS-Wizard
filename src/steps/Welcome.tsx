import { WizardLayout } from '../components/WizardLayout';
import { useWizard } from '../contexts/WizardContext';

export function Welcome() {
  const { goNext } = useWizard();

  return (
    <WizardLayout hideBack onNext={goNext} nextLabel="Let's get started →">
      <div className="text-center py-8">
        <div className="text-7xl mb-6">☸️</div>
        <h1
          className="text-4xl font-extrabold mb-4"
          style={{ color: 'var(--accent)' }}
        >
          AKS Configuration Wizard
        </h1>
        <p className="text-xl mb-8" style={{ color: 'var(--text-secondary)' }}>
          Build your Azure Kubernetes Service cluster step-by-step
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-left">
          {[
            {
              emoji: '🎯',
              title: 'Interview-Style',
              desc: "Answer simple questions and we'll build your configuration automatically.",
            },
            {
              emoji: '📚',
              title: 'Educational',
              desc: "Every option includes explanations so you understand what you're configuring.",
            },
            {
              emoji: '⚡',
              title: 'Generate & Deploy',
              desc: 'Export Terraform or Bicep templates, or deploy directly from the browser.',
            },
          ].map((card) => (
            <div key={card.title} className="card">
              <div className="text-3xl mb-2">{card.emoji}</div>
              <div className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {card.title}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {card.desc}
              </div>
            </div>
          ))}
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-muted)',
          }}
        >
          ⏱️ Estimated time: ~15 minutes
        </div>

        <div className="mt-8">
          <button onClick={goNext} className="btn-primary text-lg px-8 py-3">
            Let's get started →
          </button>
        </div>
      </div>
    </WizardLayout>
  );
}
