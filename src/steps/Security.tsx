import { WizardLayout } from '../components/WizardLayout';
import { InfoBox } from '../components/InfoBox';
import { Tooltip } from '../components/Tooltip';
import { useWizard } from '../contexts/WizardContext';

function Toggle({
  enabled,
  onToggle,
  label,
  tooltip,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  tooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
        {tooltip && (
          <Tooltip content={tooltip}>
            <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>
              ⓘ
            </span>
          </Tooltip>
        )}
      </div>
      <button
        onClick={onToggle}
        className="relative inline-flex h-6 w-11 rounded-full transition-colors"
        style={{ background: enabled ? 'var(--success)' : 'var(--border)' }}
      >
        <span
          className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
          style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );
}

export function Security() {
  const { config, updateConfig } = useWizard();

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2">Security &amp; Identity</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Configure authentication, authorization, and network security policies.
      </p>

      <InfoBox variant="warning" title="Security Best Practices">
        RBAC and Azure AD integration are highly recommended for production clusters. They ensure
        only authorized users and services can access your cluster.
      </InfoBox>

      <div className="card">
        <Toggle
          enabled={config.enableRbac}
          onToggle={() => updateConfig({ enableRbac: !config.enableRbac })}
          label="Enable RBAC"
          tooltip="Role-Based Access Control restricts who can do what in your cluster. Strongly recommended."
        />

        <Toggle
          enabled={config.enableAzureAd}
          onToggle={() => updateConfig({ enableAzureAd: !config.enableAzureAd })}
          label="Azure AD Integration"
          tooltip="Integrate with Azure Active Directory for enterprise SSO and group-based access control."
        />

        {config.enableAzureAd && (
          <div className="py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <label className="field-label">
              Azure AD Tenant ID{' '}
              <Tooltip content="Your Azure AD tenant GUID. Find it in Azure Active Directory → Overview.">
                <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                  ⓘ
                </span>
              </Tooltip>
            </label>
            <input
              className="field-input"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={config.azureAdTenantId}
              onChange={(e) => updateConfig({ azureAdTenantId: e.target.value })}
            />
          </div>
        )}

        <Toggle
          enabled={config.enablePodIdentity}
          onToggle={() => updateConfig({ enablePodIdentity: !config.enablePodIdentity })}
          label="Enable Pod Identity"
          tooltip="Allows pods to use Azure Managed Identities to access Azure resources without storing credentials."
        />

        <Toggle
          enabled={config.enableAutoUpgrade}
          onToggle={() => updateConfig({ enableAutoUpgrade: !config.enableAutoUpgrade })}
          label="Enable Cluster Auto-Upgrade"
          tooltip="Automatically upgrades your cluster to the latest supported Kubernetes version."
        />
      </div>

      <div className="mt-5">
        <label className="field-label">
          Network Policy{' '}
          <Tooltip content="Controls how pods communicate with each other. Azure and Calico both support L4 network policies.">
            <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
              ⓘ
            </span>
          </Tooltip>
        </label>
        <div className="flex gap-3 flex-wrap">
          {(['None', 'azure', 'calico'] as const).map((policy) => (
            <button
              key={policy}
              onClick={() => updateConfig({ networkPolicy: policy })}
              className="flex-1 py-2 px-4 rounded font-medium text-sm min-w-[100px]"
              style={{
                background: config.networkPolicy === policy ? 'var(--accent)' : 'var(--bg-secondary)',
                color: config.networkPolicy === policy ? 'var(--accent-text)' : 'var(--text-primary)',
                border: `2px solid ${config.networkPolicy === policy ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
              }}
            >
              {policy === 'None' ? '🚫 None' : policy === 'azure' ? '🔷 Azure' : '🐱 Calico'}
            </button>
          ))}
        </div>
      </div>
    </WizardLayout>
  );
}
