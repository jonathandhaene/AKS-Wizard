import { useState } from 'react';
import { WizardLayout } from '../components/WizardLayout';
import { useWizard } from '../contexts/WizardContext';
import { generateTerraform } from '../utils/terraformGenerator';
import { generateBicep } from '../utils/bicepGenerator';

type Tab = 'terraform' | 'bicep';

export function Templates() {
  const { config } = useWizard();
  const [tab, setTab] = useState<Tab>('terraform');
  const [copied, setCopied] = useState<Tab | null>(null);

  const terraform = generateTerraform(config);
  const bicep = generateBicep(config);

  const currentCode = tab === 'terraform' ? terraform : bicep;
  const filename = tab === 'terraform' ? 'main.tf' : 'main.bicep';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentCode);
    setCopied(tab);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2">Generated Templates</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Your AKS configuration has been converted into Infrastructure-as-Code templates.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['terraform', 'bicep'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 font-semibold text-sm rounded-t transition-all"
            style={{
              background: tab === t ? 'var(--accent)' : 'var(--bg-secondary)',
              color: tab === t ? 'var(--accent-text)' : 'var(--text-secondary)',
              border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius) var(--radius) 0 0',
              borderBottom: tab === t ? 'none' : undefined,
            }}
          >
            {t === 'terraform' ? '🔷 Terraform (HCL)' : '💠 Bicep'}
          </button>
        ))}
      </div>

      {/* Code block */}
      <div
        className="relative rounded overflow-hidden"
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          background: 'var(--bg-secondary)',
        }}
      >
        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
        >
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            {filename}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="text-xs px-3 py-1 rounded"
              style={{
                background: copied === tab ? 'var(--success)' : 'var(--accent)',
                color: 'var(--accent-text)',
                borderRadius: 'var(--radius)',
              }}
            >
              {copied === tab ? '✅ Copied!' : '📋 Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="text-xs px-3 py-1 rounded"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
            >
              ⬇️ Download
            </button>
          </div>
        </div>

        {/* Code */}
        <pre
          className="p-4 overflow-auto text-xs leading-relaxed"
          style={{
            color: 'var(--text-primary)',
            maxHeight: '420px',
            whiteSpace: 'pre',
          }}
        >
          <code>{currentCode}</code>
        </pre>
      </div>

      <div
        className="mt-4 p-3 rounded text-sm"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--text-secondary)',
        }}
      >
        💡 <strong>Tip:</strong> Review the generated templates before deploying. You can further
        customize them for your specific environment.
      </div>
    </WizardLayout>
  );
}
