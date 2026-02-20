import { WizardLayout } from '../components/WizardLayout';
import { InfoBox } from '../components/InfoBox';
import { Tooltip } from '../components/Tooltip';
import { useWizard } from '../contexts/WizardContext';

export function Networking() {
  const { config, updateConfig } = useWizard();

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2">Networking</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Configure how pods and services communicate within your cluster.
      </p>

      <InfoBox variant="info" title="Network Plugin">
        <strong>Azure CNI</strong> assigns VNet IPs to pods — better for enterprise environments
        needing pod-level network policies. <strong>Kubenet</strong> uses NAT and is simpler but
        limited.
      </InfoBox>

      <div className="space-y-5">
        {/* Network Plugin */}
        <div>
          <label className="field-label">Network Plugin</label>
          <div className="flex gap-3">
            {(['azure', 'kubenet'] as const).map((plugin) => (
              <button
                key={plugin}
                onClick={() => updateConfig({ networkPlugin: plugin })}
                className="flex-1 py-3 px-4 rounded font-semibold text-sm transition-all"
                style={{
                  background:
                    config.networkPlugin === plugin ? 'var(--accent)' : 'var(--bg-secondary)',
                  color:
                    config.networkPlugin === plugin ? 'var(--accent-text)' : 'var(--text-primary)',
                  border: `2px solid ${config.networkPlugin === plugin ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                }}
              >
                {plugin === 'azure' ? '🔷 Azure CNI' : '🔶 Kubenet'}
              </button>
            ))}
          </div>
        </div>

        {/* DNS Prefix */}
        <div>
          <label className="field-label">
            DNS Prefix{' '}
            <Tooltip content="Unique DNS prefix for the cluster's API server. Used to form the FQDN.">
              <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </label>
          <input
            className="field-input"
            placeholder={config.clusterName || 'my-aks'}
            value={config.dnsPrefix}
            onChange={(e) => updateConfig({ dnsPrefix: e.target.value })}
          />
        </div>

        {/* Service CIDR */}
        <div>
          <label className="field-label">
            Service CIDR{' '}
            <Tooltip content="IP range used for Kubernetes service IPs. Must not overlap with subnet or pod ranges.">
              <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </label>
          <input
            className="field-input"
            value={config.serviceCidr}
            onChange={(e) => updateConfig({ serviceCidr: e.target.value })}
          />
        </div>

        {/* Docker Bridge CIDR */}
        <div>
          <label className="field-label">
            Docker Bridge CIDR{' '}
            <Tooltip content="IP range for the Docker bridge network on nodes. Used for container-to-container communication.">
              <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </label>
          <input
            className="field-input"
            value={config.dockerBridgeCidr}
            onChange={(e) => updateConfig({ dockerBridgeCidr: e.target.value })}
          />
        </div>

        {/* Load Balancer SKU */}
        <div>
          <label className="field-label">
            Load Balancer SKU{' '}
            <Tooltip content="Standard SKU offers availability zones, diagnostics, and 1000 backend pool members. Basic is limited and not recommended for production.">
              <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </label>
          <div className="flex gap-3">
            {(['Standard', 'Basic'] as const).map((sku) => (
              <button
                key={sku}
                onClick={() => updateConfig({ loadBalancerSku: sku })}
                className="flex-1 py-3 px-4 rounded font-semibold text-sm"
                style={{
                  background:
                    config.loadBalancerSku === sku ? 'var(--accent)' : 'var(--bg-secondary)',
                  color:
                    config.loadBalancerSku === sku ? 'var(--accent-text)' : 'var(--text-primary)',
                  border: `2px solid ${config.loadBalancerSku === sku ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                }}
              >
                {sku === 'Standard' ? '⭐ Standard (Recommended)' : '🔹 Basic'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </WizardLayout>
  );
}
