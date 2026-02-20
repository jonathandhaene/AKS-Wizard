import { WizardLayout } from '../components/WizardLayout';
import { InfoBox } from '../components/InfoBox';
import { Tooltip } from '../components/Tooltip';
import { useWizard } from '../contexts/WizardContext';

const ADDONS = [
  {
    key: 'enableHttpApplicationRouting' as const,
    label: 'HTTP Application Routing',
    emoji: '🌐',
    tooltip:
      'Simplifies ingress controller setup for development environments. Not recommended for production.',
    warning: true,
  },
  {
    key: 'enableAzurePolicy' as const,
    label: 'Azure Policy Add-on',
    emoji: '📋',
    tooltip:
      'Enforce organizational standards and assess compliance across your cluster using Azure Policy.',
  },
  {
    key: 'enableKeyVaultProvider' as const,
    label: 'Azure Key Vault Provider',
    emoji: '🔑',
    tooltip:
      'Secrets Store CSI Driver integration for Azure Key Vault — mount secrets as volumes in pods.',
  },
  {
    key: 'enableKeda' as const,
    label: 'KEDA (Event-Driven Autoscaling)',
    emoji: '⚡',
    tooltip:
      'Kubernetes Event-Driven Autoscaling — scale pods based on event sources like queues, topics, and databases.',
  },
  {
    key: 'enableDapr' as const,
    label: 'Dapr (Distributed Application Runtime)',
    emoji: '🔧',
    tooltip:
      'Dapr provides building blocks for microservices: pub/sub, state management, service invocation, and more.',
  },
  {
    key: 'enableAcrIntegration' as const,
    label: 'Azure Container Registry Integration',
    emoji: '📦',
    tooltip:
      'Attach an Azure Container Registry to the cluster so nodes can pull images without separate credentials. Requires a registry name below.',
  },
];

export function Addons() {
  const { config, updateConfig } = useWizard();

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2">Add-ons</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Extend your cluster with optional add-ons and integrations.
      </p>

      <InfoBox variant="tip" title="Add-ons vs Extensions">
        AKS Add-ons are officially supported by Microsoft and fully managed. Extensions are
        community-supported features. You can always enable add-ons after cluster creation.
      </InfoBox>

      <div className="card">
        {ADDONS.map((addon) => {
          const enabled = config[addon.key];
          return (
            <div
              key={addon.key}
              className="flex items-center justify-between py-3 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl mt-0.5">{addon.emoji}</span>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {addon.label}
                    </span>
                    <Tooltip content={addon.tooltip}>
                      <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>
                        ⓘ
                      </span>
                    </Tooltip>
                    {addon.warning && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background: 'var(--warning)',
                          color: '#000',
                          borderRadius: 'var(--radius)',
                        }}
                      >
                        Dev only
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => updateConfig({ [addon.key]: !enabled })}
                className="relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0"
                style={{ background: enabled ? 'var(--success)' : 'var(--border)' }}
              >
                <span
                  className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
                  style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>
          );
        })}
      </div>

      {config.enableAcrIntegration && (
        <div className="mt-4">
          <label className="field-label">
            Container Registry Name{' '}
            <Tooltip content="The name of your Azure Container Registry (without .azurecr.io). The wizard will generate the role assignment to allow the cluster to pull images.">
              <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </label>
          <input
            className="field-input"
            placeholder="myregistry"
            value={config.containerRegistryName}
            onChange={(e) => updateConfig({ containerRegistryName: e.target.value })}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            The generated templates will include an ACR pull role assignment for the cluster's
            managed identity.
          </p>
        </div>
      )}
    </WizardLayout>
  );
}
