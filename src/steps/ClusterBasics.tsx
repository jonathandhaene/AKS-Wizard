import { WizardLayout } from '../components/WizardLayout';
import { InfoBox } from '../components/InfoBox';
import { Tooltip } from '../components/Tooltip';
import { useWizard } from '../contexts/WizardContext';

const REGIONS = [
  { value: 'eastus', label: 'East US' },
  { value: 'eastus2', label: 'East US 2' },
  { value: 'westus2', label: 'West US 2' },
  { value: 'westus3', label: 'West US 3' },
  { value: 'centralus', label: 'Central US' },
  { value: 'northeurope', label: 'North Europe' },
  { value: 'westeurope', label: 'West Europe' },
  { value: 'uksouth', label: 'UK South' },
  { value: 'southeastasia', label: 'Southeast Asia' },
  { value: 'australiaeast', label: 'Australia East' },
  { value: 'japaneast', label: 'Japan East' },
  { value: 'brazilsouth', label: 'Brazil South' },
];

const K8S_VERSIONS = ['1.31.x', '1.30.x', '1.29.x'];

export function ClusterBasics() {
  const { config, updateConfig } = useWizard();

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Cluster Basics
      </h2>
      <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Let's start with the fundamental details of your AKS cluster.
      </p>

      <InfoBox variant="info" title="What is AKS?">
        Azure Kubernetes Service (AKS) is a managed container orchestration service. Azure handles
        the control plane — you only manage the worker nodes. Choose{' '}
        <strong>AKS Automatic</strong> for a fully managed experience or{' '}
        <strong>AKS Standard</strong> for complete control over cluster configuration.
      </InfoBox>

      <div className="space-y-5">
        {/* AKS Mode */}
        <div>
          <label className="field-label">
            AKS Mode{' '}
            <Tooltip content="AKS Automatic manages upgrades, node provisioning, and security configurations automatically. AKS Standard gives your platform team full control.">
              <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </label>
          <div className="flex gap-3 flex-wrap">
            {(['Standard', 'Automatic'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => updateConfig({ aksMode: mode })}
                className="flex-1 py-2 px-4 rounded font-medium text-sm min-w-[140px]"
                style={{
                  background: config.aksMode === mode ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: config.aksMode === mode ? 'var(--accent-text)' : 'var(--text-primary)',
                  border: `2px solid ${config.aksMode === mode ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                }}
              >
                {mode === 'Automatic' ? '🤖 AKS Automatic' : '🔧 AKS Standard'}
              </button>
            ))}
          </div>
          {config.aksMode === 'Automatic' && (
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              AKS Automatic: Azure manages node pools, upgrades, and security hardening. Best for
              teams focused on application delivery.
            </p>
          )}
        </div>
        {/* Subscription ID */}
        <div>
          <label className="field-label">
            Azure Subscription ID{' '}
            <Tooltip content="Your Azure subscription GUID. Find it under Subscriptions in the Azure portal.">
              <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </label>
          <input
            className="field-input"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={config.subscriptionId}
            onChange={(e) => updateConfig({ subscriptionId: e.target.value })}
          />
        </div>

        {/* Resource Group */}
        <div>
          <label className="field-label">
            Resource Group Name{' '}
            <Tooltip content="A logical container for your Azure resources. Use a new or existing group.">
              <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </label>
          <input
            className="field-input"
            placeholder="my-aks-rg"
            value={config.resourceGroupName}
            onChange={(e) => updateConfig({ resourceGroupName: e.target.value })}
          />
        </div>

        {/* Cluster Name */}
        <div>
          <label className="field-label">
            Cluster Name{' '}
            <Tooltip content="A unique name for your AKS cluster. Must be 1-63 characters, alphanumeric and hyphens only.">
              <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </label>
          <input
            className="field-input"
            placeholder="my-aks-cluster"
            value={config.clusterName}
            onChange={(e) => updateConfig({ clusterName: e.target.value })}
          />
        </div>

        {/* Region */}
        <div>
          <label className="field-label">
            Azure Region{' '}
            <Tooltip content="Choose a region close to your users for lower latency. Some features may not be available in all regions.">
              <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </label>
          <select
            className="field-input"
            value={config.region}
            onChange={(e) => updateConfig({ region: e.target.value })}
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* K8s Version */}
        <div>
          <label className="field-label">
            Kubernetes Version{' '}
            <Tooltip content="AKS supports the latest 3 minor versions. Using a recent stable version is recommended for security and features.">
              <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </label>
          <select
            className="field-input"
            value={config.kubernetesVersion}
            onChange={(e) => updateConfig({ kubernetesVersion: e.target.value })}
          >
            {K8S_VERSIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
    </WizardLayout>
  );
}
