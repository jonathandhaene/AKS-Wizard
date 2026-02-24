import { WizardLayout } from '../components/WizardLayout';
import { InfoBox } from '../components/InfoBox';
import { Tooltip } from '../components/Tooltip';
import { useWizard } from '../contexts/WizardContext';
import type { IngressController } from '../types/wizard';

const INGRESS_OPTIONS: { value: IngressController; label: string; desc: string }[] = [
  { value: 'none', label: '🚫 None', desc: 'No managed ingress. Configure manually.' },
  {
    value: 'nginx',
    label: '🔷 NGINX ⚠️ Deprecated',
    desc: 'Community ingress-nginx controller. Retiring March 2026 — consider Gateway API or the F5/NGINX Inc. Ingress Controller instead.',
  },
  {
    value: 'appgw',
    label: '🌐 Application Gateway',
    desc: 'Azure-native Layer 7 load balancer with WAF support (AGIC).',
  },
  {
    value: 'traefik',
    label: '🔶 Traefik',
    desc: "Cloud-native ingress with automatic service discovery and Let's Encrypt support.",
  },
];

export function Networking() {
  const { config, updateConfig } = useWizard();

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2">Networking</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Configure how pods and services communicate within and outside your cluster.
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
            <Tooltip content="⚠️ Deprecated: This property was removed from the AKS networking profile in API version 2022-08-01+ and from the Terraform azurerm provider in v4.0. It is retained here for reference only and is not included in generated templates.">
              <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </label>
          <input
            className="field-input"
            value={config.dockerBridgeCidr}
            onChange={(e) => updateConfig({ dockerBridgeCidr: e.target.value })}
            disabled
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--warning)' }}>
            ⚠️ Deprecated and removed from AKS networking profile. Not included in generated templates. See{' '}
            <a
              href="https://learn.microsoft.com/azure/aks/concepts-network"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              AKS networking concepts
            </a>
            .
          </p>
        </div>

        {/* Load Balancer SKU */}
        <div>
          <label className="field-label">
            Load Balancer SKU{' '}
            <Tooltip content="Standard SKU offers availability zones, diagnostics, and up to 1000 backend pool members. Basic SKU was retired on September 30, 2025 and is no longer available for new deployments.">
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
                {sku === 'Standard' ? '⭐ Standard (Recommended)' : '🔹 Basic (Retired)'}
              </button>
            ))}
          </div>
          {config.loadBalancerSku === 'Basic' && (
            <p className="mt-2 text-xs" style={{ color: 'var(--error)' }}>
              ⛔ Azure Basic Load Balancer was <strong>retired on September 30, 2025</strong> and is no longer available for new deployments. Use <strong>Standard</strong> SKU instead. See{' '}
              <a
                href="https://learn.microsoft.com/azure/load-balancer/load-balancer-basic-upgrade-guidance"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                retirement guidance
              </a>
              .
            </p>
          )}
        </div>

        {/* Ingress Controller */}
        <div>
          <label className="field-label">
            Ingress Controller{' '}
            <Tooltip content="An ingress controller manages external HTTP/HTTPS access to services. Choose a controller that fits your routing, TLS, and WAF requirements.">
              <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {INGRESS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateConfig({ ingressController: opt.value })}
                className="flex flex-col items-start p-3 rounded text-left transition-all"
                style={{
                  background:
                    config.ingressController === opt.value
                      ? 'var(--accent)'
                      : 'var(--bg-secondary)',
                  color:
                    config.ingressController === opt.value
                      ? 'var(--accent-text)'
                      : 'var(--text-primary)',
                  border: `2px solid ${config.ingressController === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                }}
              >
                <span className="font-semibold text-sm">{opt.label}</span>
                <span
                  className="text-xs mt-0.5"
                  style={{
                    color:
                      config.ingressController === opt.value
                        ? 'var(--accent-text)'
                        : 'var(--text-secondary)',
                    opacity: 0.85,
                  }}
                >
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
          {config.ingressController === 'nginx' && (
            <InfoBox variant="warning" title="ingress-nginx is retiring in March 2026">
              The community-maintained <strong>ingress-nginx</strong> controller is being retired
              as of March 2026 and will no longer receive security updates. Consider migrating to:
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>
                  <strong>Kubernetes Gateway API</strong> — the official successor to Ingress (
                  <a
                    href="https://gateway-api.sigs.k8s.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent)' }}
                  >
                    gateway-api.sigs.k8s.io
                  </a>
                  )
                </li>
                <li>
                  <strong>NGINX Ingress Controller by F5/NGINX Inc.</strong> — vendor-supported
                  alternative (
                  <a
                    href="https://docs.nginx.com/nginx-ingress-controller/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent)' }}
                  >
                    docs.nginx.com
                  </a>
                  )
                </li>
              </ul>
              <p className="mt-1">
                See the{' '}
                <a
                  href="https://kubernetes.io/blog/2025/01/23/ingress-nginx-gateway-api-migration/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent)' }}
                >
                  official Kubernetes end-of-life announcement
                </a>{' '}
                for details.
              </p>
            </InfoBox>
          )}
          {config.ingressController === 'appgw' && config.networkPlugin !== 'azure' && (
            <p className="mt-2 text-xs" style={{ color: 'var(--warning)' }}>
              ⚠️ Application Gateway Ingress Controller (AGIC) works best with Azure CNI.
            </p>
          )}
        </div>

        {/* Service Mesh */}
        <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Enable Service Mesh (Istio)
            </span>
            <Tooltip content="A service mesh provides mTLS, observability, and fine-grained traffic management between services. AKS supports Istio as a managed add-on. Note: Open Service Mesh (OSM) was retired as a managed AKS add-on in November 2023.">
              <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </div>
          <button
            onClick={() => updateConfig({ enableServiceMesh: !config.enableServiceMesh })}
            className="relative inline-flex h-6 w-11 rounded-full transition-colors"
            style={{ background: config.enableServiceMesh ? 'var(--success)' : 'var(--border)' }}
          >
            <span
              className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
              style={{ transform: config.enableServiceMesh ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </button>
        </div>
      </div>
    </WizardLayout>
  );
}
