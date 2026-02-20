import { useState } from 'react';
import { WizardLayout } from '../components/WizardLayout';
import { useWizard } from '../contexts/WizardContext';
import { generatePowerShell } from '../utils/powershellGenerator';

export function Deploy() {
  const { config } = useWizard();
  const [copied, setCopied] = useState(false);

  const script = generatePowerShell(config);

  const handleCopy = () => {
    navigator.clipboard.writeText(script).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deploy-aks.ps1';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2">Deploy to Azure</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        Your AKS cluster configuration has been translated into a PowerShell deployment script
        using the Azure CLI. Copy or download the script and run it in your local terminal.
      </p>

      <div
        className="p-3 mb-5 rounded text-sm"
        style={{
          background: 'color-mix(in srgb, var(--info) 10%, transparent)',
          border: '1px solid var(--info)',
          borderRadius: 'var(--radius)',
          color: 'var(--text-secondary)',
        }}
      >
        ℹ️ <strong>Prerequisites:</strong> Azure CLI and kubectl must be installed. Run{' '}
        <code style={{ color: 'var(--accent)' }}>az login</code> before executing the script, or
        use the <code style={{ color: 'var(--accent)' }}>-SubscriptionId</code> parameter to
        target a specific subscription.
      </div>

      <div
        className="p-3 mb-5 rounded text-sm"
        style={{
          background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
          border: '1px solid var(--warning)',
          borderRadius: 'var(--radius)',
          color: 'var(--text-secondary)',
        }}
      >
        ⚠️ <strong>Educational Disclaimer:</strong> This script is provided for educational and
        learning purposes only. Validate and tailor it for your own production environment before
        use.
      </div>

      {/* Script Actions */}
      <div className="flex gap-2 mb-3">
        <button onClick={handleCopy} className="btn-primary">
          {copied ? '✅ Copied!' : '📋 Copy Script'}
        </button>
        <button onClick={handleDownload} className="btn-secondary">
          ⬇️ Download deploy-aks.ps1
        </button>
      </div>

      {/* Script Preview */}
      <div
        className="rounded p-4 font-mono text-xs overflow-auto"
        style={{
          background: '#012456',
          color: '#eeedf0',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          maxHeight: '480px',
          whiteSpace: 'pre',
        }}
      >
        {script}
      </div>
    </WizardLayout>
  );
}

