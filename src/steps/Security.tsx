import { WizardLayout } from '../components/WizardLayout';
import { InfoBox } from '../components/InfoBox';
import { Tooltip } from '../components/Tooltip';
import { useWizard } from '../contexts/WizardContext';
import type { PodSecurityAdmissionLevel } from '../types/wizard';

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

const PSA_LEVELS: { value: PodSecurityAdmissionLevel; label: string; desc: string; color: string }[] = [
  {
    value: 'privileged',
    label: '🔓 Privileged',
    desc: 'No restrictions — allows all pod capabilities. Use only for trusted system namespaces.',
    color: 'var(--error)',
  },
  {
    value: 'baseline',
    label: '🔒 Baseline',
    desc: 'Minimally restrictive policy. Prevents known privilege escalations. Recommended default.',
    color: 'var(--warning)',
  },
  {
    value: 'restricted',
    label: '🛡️ Restricted',
    desc: 'Heavily restricted. Enforces current pod hardening best practices. Best for production.',
    color: 'var(--success)',
  },
];

export function Security() {
  const { config, updateConfig } = useWizard();

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2">Security &amp; Identity</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Configure authentication, authorization, image scanning, and pod security policies.
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
          enabled={config.enableImageScanning}
          onToggle={() => updateConfig({ enableImageScanning: !config.enableImageScanning })}
          label="Enable Container Image Scanning"
          tooltip="Integrate Microsoft Defender for Containers to scan images for vulnerabilities in Azure Container Registry and at runtime."
        />
      </div>

      {/* Pod Security Admission */}
      <div className="mt-5">
        <label className="field-label">
          Pod Security Admission Level{' '}
          <Tooltip content="Kubernetes Pod Security Admission enforces security standards at the namespace level. Applied via labels on namespaces.">
            <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
              ⓘ
            </span>
          </Tooltip>
        </label>
        <div className="grid grid-cols-1 gap-2">
          {PSA_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => updateConfig({ podSecurityAdmission: level.value })}
              className="flex items-start gap-3 p-3 rounded text-left transition-all"
              style={{
                background:
                  config.podSecurityAdmission === level.value
                    ? 'var(--accent)'
                    : 'var(--bg-secondary)',
                color:
                  config.podSecurityAdmission === level.value
                    ? 'var(--accent-text)'
                    : 'var(--text-primary)',
                border: `2px solid ${config.podSecurityAdmission === level.value ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
              }}
            >
              <div>
                <div className="font-semibold text-sm">{level.label}</div>
                <div
                  className="text-xs mt-0.5"
                  style={{
                    color:
                      config.podSecurityAdmission === level.value
                        ? 'var(--accent-text)'
                        : 'var(--text-secondary)',
                    opacity: 0.85,
                  }}
                >
                  {level.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Auto-Upgrade Channel */}
      <div className="mt-5">
        <label className="field-label">
          Auto-Upgrade Channel{' '}
          <Tooltip content="Controls how AKS automatically upgrades your cluster. 'patch' upgrades to the latest patch version, 'stable' upgrades to the latest stable minor version, 'rapid' upgrades to the latest GA release, 'node-image' only upgrades node OS images.">
            <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
              ⓘ
            </span>
          </Tooltip>
        </label>
        <div className="flex gap-2 flex-wrap">
          {([
            { value: 'none', label: '🚫 None', desc: 'Manual upgrades only' },
            { value: 'patch', label: '🔒 Patch', desc: 'Auto patch versions (recommended)' },
            { value: 'stable', label: '✅ Stable', desc: 'Latest stable minor version' },
            { value: 'rapid', label: '⚡ Rapid', desc: 'Latest GA release' },
            { value: 'node-image', label: '🖼️ Node Image', desc: 'Node OS images only' },
          ] as const).map((ch) => (
            <button
              key={ch.value}
              onClick={() => updateConfig({ autoUpgradeChannel: ch.value })}
              title={ch.desc}
              className="flex-1 py-2 px-3 rounded font-medium text-sm min-w-[100px]"
              style={{
                background:
                  config.autoUpgradeChannel === ch.value
                    ? 'var(--accent)'
                    : 'var(--bg-secondary)',
                color:
                  config.autoUpgradeChannel === ch.value
                    ? 'var(--accent-text)'
                    : 'var(--text-primary)',
                border: `2px solid ${config.autoUpgradeChannel === ch.value ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
              }}
            >
              {ch.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          {config.autoUpgradeChannel === 'none' &&
            'No automatic upgrades. You must manually trigger upgrades — ensure you stay within AKS supported version window.'}
          {config.autoUpgradeChannel === 'patch' &&
            'Recommended for production: automatically applies the latest patch of your current minor version.'}
          {config.autoUpgradeChannel === 'stable' &&
            'Upgrades to the latest stable minor release, which lags the newest release by one minor version.'}
          {config.autoUpgradeChannel === 'rapid' &&
            'Upgrades to the newest generally available release as soon as available.'}
          {config.autoUpgradeChannel === 'node-image' &&
            'Only upgrades node OS images (security patches) without changing the Kubernetes version.'}
        </p>
      </div>

      {/* Upgrade Guidance */}
      <InfoBox variant="tip" title="Safe Upgrade Path Guidance">
        <ul className="list-disc list-inside space-y-1">
          <li>Always upgrade one minor version at a time (e.g., 1.28 → 1.29 → 1.30).</li>
          <li>
            Review{' '}
            <strong>deprecated API removals</strong> in each release using the Kubernetes deprecation
            guide before upgrading.
          </li>
          <li>
            Use <strong>Planned Maintenance</strong> windows in AKS to control when upgrades occur.
          </li>
          <li>
            Test upgrades in a <strong>staging cluster</strong> before applying to production.
          </li>
          <li>
            Enable <strong>node surge</strong> during upgrades to minimize workload disruption.
          </li>
        </ul>
      </InfoBox>

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
