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

const K8S_VERSIONS = ['1.29.x', '1.28.x', '1.27.x'];

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
        the control plane — you only manage the worker nodes.
      </InfoBox>

      <div className="space-y-5">
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
