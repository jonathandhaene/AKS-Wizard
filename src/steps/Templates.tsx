import { useState } from 'react';
import { WizardLayout } from '../components/WizardLayout';
import { useWizard } from '../contexts/WizardContext';
import { generateTerraform } from '../utils/terraformGenerator';
import { generateBicep } from '../utils/bicepGenerator';
import { generateGitHubWorkflow } from '../utils/githubWorkflowGenerator';
import { generateResourceYaml } from '../utils/resourceRecommendations';

type Tab = 'terraform' | 'bicep' | 'github-actions' | 'resources';

export function Templates() {
  const { config } = useWizard();
  const [tab, setTab] = useState<Tab>('terraform');
  const [copied, setCopied] = useState<Tab | null>(null);

  const terraform = generateTerraform(config);
  const bicep = generateBicep(config);
  const githubActions = generateGitHubWorkflow(config);
  const resources = generateResourceYaml(config.workloadConfig);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'terraform', label: '🔷 Terraform (HCL)' },
    { id: 'bicep', label: '💠 Bicep' },
    { id: 'github-actions', label: '⚙️ GitHub Actions' },
    { id: 'resources', label: '📦 Resource Config' },
  ];

  const codeByTab: Record<Tab, string> = {
    terraform,
    bicep,
    'github-actions': githubActions,
    resources,
  };
  const filenameByTab: Record<Tab, string> = {
    terraform: 'main.tf',
    bicep: 'main.bicep',
    'github-actions': 'deploy-aks.yml',
    resources: 'resources.yaml',
  };

  const currentCode = codeByTab[tab];
  const filename = filenameByTab[tab];

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
        Your AKS configuration has been converted into Infrastructure-as-Code templates and a
        CI/CD pipeline workflow.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 font-semibold text-sm rounded-t transition-all"
            style={{
              background: tab === t.id ? 'var(--accent)' : 'var(--bg-secondary)',
              color: tab === t.id ? 'var(--accent-text)' : 'var(--text-secondary)',
              border: `1px solid ${tab === t.id ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius) var(--radius) 0 0',
              borderBottom: tab === t.id ? 'none' : undefined,
            }}
          >
            {t.label}
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

      {tab === 'github-actions' ? (
        <div
          className="mt-4 p-3 rounded text-sm"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-secondary)',
          }}
        >
          💡 <strong>Tip:</strong> Place this file at{' '}
          <code style={{ color: 'var(--accent)' }}>.github/workflows/deploy-aks.yml</code> in your
          repository. Create the required secrets (<code>AZURE_CREDENTIALS</code>
          {config.enableAcrIntegration ? ', ACR_USERNAME, ACR_PASSWORD' : ''}) under{' '}
          <em>Settings → Secrets and variables → Actions</em>. The workflow uses{' '}
          <code style={{ color: 'var(--accent)' }}>azure/k8s-bake@v3</code> to render Helm
          charts before deploying with{' '}
          <code style={{ color: 'var(--accent)' }}>azure/k8s-deploy@v5</code>.
        </div>
      ) : tab === 'resources' ? (
        <div
          className="mt-4 p-3 rounded text-sm"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-secondary)',
          }}
        >
          💡 <strong>Tip:</strong> Apply this manifest with{' '}
          <code style={{ color: 'var(--accent)' }}>kubectl apply -f resources.yaml</code> after
          your cluster is running. Replace <code>my-registry/my-app:latest</code> with your
          actual container image. Tune CPU/memory values based on observed usage from{' '}
          {config.enableContainerInsights ? 'Container Insights' : config.enablePrometheus ? 'Prometheus' : 'your monitoring stack'}.
        </div>
      ) : (
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
      )}
    </WizardLayout>
  );
}
