import { WizardLayout } from '../components/WizardLayout';
import { useWizard } from '../contexts/WizardContext';
import { estimateMonthlyCost } from '../utils/costEstimator';

interface Check {
  label: string;
  ok: boolean;
  message?: string;
}

export function Review() {
  const { config, goNext } = useWizard();

  const checks: Check[] = [
    {
      label: 'Subscription ID',
      ok: config.subscriptionId.trim().length > 0,
      message: 'Subscription ID is required',
    },
    {
      label: 'Resource Group Name',
      ok: config.resourceGroupName.trim().length > 0,
      message: 'Resource group name is required',
    },
    {
      label: 'Cluster Name',
      ok: config.clusterName.trim().length > 0,
      message: 'Cluster name is required',
    },
    {
      label: 'Cluster name format',
      ok: /^[a-zA-Z0-9-]{1,63}$/.test(config.clusterName) || config.clusterName.trim() === '',
      message: 'Cluster name must be 1-63 alphanumeric characters and hyphens',
    },
    { label: 'RBAC enabled', ok: config.enableRbac, message: 'RBAC is strongly recommended' },
    {
      label: 'Azure AD integration',
      ok: !config.enableAzureAd || config.azureAdTenantId.trim().length > 0,
      message: 'Tenant ID is required when Azure AD is enabled',
    },
    {
      label: 'Standard Load Balancer',
      ok: config.loadBalancerSku === 'Standard',
      message: 'Basic SKU is not recommended for production',
    },
    { label: 'Container Insights', ok: config.enableContainerInsights, message: 'Monitoring is recommended' },
  ];

  const allOk = checks.every((c) => c.ok);

  const cost = estimateMonthlyCost(config);

  const Section = ({ title, items }: { title: string; items: [string, string][] }) => (
    <div className="mb-4">
      <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
        {title}
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {items.map(([key, val]) => (
          <div key={key} className="flex justify-between py-1.5 text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>{key}</span>
            <span className="font-medium ml-4 text-right" style={{ color: 'var(--text-primary)' }}>
              {val || '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <WizardLayout onNext={goNext} nextLabel="Looks good! Generate Templates →" nextDisabled={!allOk}>
      <h2 className="text-2xl font-bold mb-2">Review &amp; Validate</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Review your configuration and fix any issues before generating templates.
      </p>

      {/* Validation */}
      <div className="card mb-6">
        <div className="section-title">Validation Checks</div>
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-2 py-1.5">
            <span style={{ color: c.ok ? 'var(--success)' : 'var(--error)' }}>
              {c.ok ? '✅' : '❌'}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {c.label}
            </span>
            {!c.ok && (
              <span className="text-xs ml-auto" style={{ color: 'var(--error)' }}>
                {c.message}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Cost Estimator */}
      <div className="card mb-6">
        <div className="section-title">💰 Estimated Monthly Cost</div>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Approximate on-demand pricing (USD). Actual costs vary by region, reserved instances, and
          usage. Use the{' '}
          <a
            href="https://azure.microsoft.com/en-us/pricing/calculator/"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--accent)' }}
          >
            Azure Pricing Calculator
          </a>{' '}
          for precise estimates.
        </p>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {[
            ['System Node Pool', `~$${cost.systemPool}/mo`],
            ...(cost.userPools > 0 ? [['User Node Pool(s)', `~$${cost.userPools}/mo`] as [string, string]] : []),
            ...(cost.monitoring > 0 ? [['Monitoring', `~$${cost.monitoring}/mo`] as [string, string]] : []),
            ...(cost.addons > 0 ? [['Add-ons', `~$${cost.addons}/mo`] as [string, string]] : []),
            ...(cost.storage > 0 ? [['Storage', `~$${cost.storage}/mo`] as [string, string]] : []),
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-1.5 text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
        <div
          className="flex justify-between py-2 mt-2 text-sm font-bold border-t"
          style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
        >
          <span>Estimated Total</span>
          <span>~${cost.total}/month</span>
        </div>
      </div>

      {/* Summary */}
      <div className="card">
        <div className="section-title">Configuration Summary</div>

        <Section
          title="Cluster Basics"
          items={[
            ['Subscription ID', config.subscriptionId],
            ['Resource Group', config.resourceGroupName],
            ['Cluster Name', config.clusterName],
            ['Region', config.region],
            ['Kubernetes Version', config.kubernetesVersion],
            ['AKS Mode', config.aksMode],
          ]}
        />

        <Section
          title="System Node Pool"
          items={[
            ['VM Size', config.systemNodePool.vmSize],
            ['Node Count', config.systemNodePool.enableAutoScaling
              ? `Auto-scale ${config.systemNodePool.minNodes}–${config.systemNodePool.maxNodes}`
              : String(config.systemNodePool.nodeCount)],
          ]}
        />

        <Section
          title="Workloads"
          items={[
            ['Workload Type', config.workloadConfig.workloadType],
            ['Traffic Level', config.workloadConfig.trafficLevel],
            ['HPA', config.workloadConfig.enableHpa ? `✅ Enabled (CPU ${config.workloadConfig.targetCpuUtilization}%, Mem ${config.workloadConfig.targetMemoryUtilization}%)` : 'Disabled'],
            ['VPA', config.workloadConfig.enableVpa ? '✅ Enabled' : 'Disabled'],
            ['Monitoring Integration', config.workloadConfig.enableMonitoringIntegration ? '✅ Prometheus annotations' : 'Disabled'],
          ]}
        />

        <Section
          title="Pods"
          items={[
            ['CPU Request / Limit', `${config.podConfig.cpuRequest} / ${config.podConfig.cpuLimit}`],
            ['Memory Request / Limit', `${config.podConfig.memoryRequest} / ${config.podConfig.memoryLimit}`],
            ['Node Affinity', config.podConfig.nodeAffinity],
            ['Pod Anti-Affinity', config.podConfig.podAntiAffinity !== 'none' ? `${config.podConfig.podAntiAffinity} (${config.podConfig.topologyKey})` : 'none'],
            ['Host Network', config.podConfig.hostNetwork ? '✅ Enabled' : 'Disabled'],
            ['DNS Policy', config.podConfig.dnsPolicy],
          ]}
        />

        <Section
          title="Networking"
          items={[
            ['Network Plugin', config.networkPlugin],
            ['Load Balancer SKU', config.loadBalancerSku],
            ['Service CIDR', config.serviceCidr],
            ['Network Policy', config.networkPolicy],
            ['Ingress Controller', config.ingressController],
            ['Service Mesh', config.enableServiceMesh ? '✅ Enabled' : 'Disabled'],
          ]}
        />

        <Section
          title="Security"
          items={[
            ['RBAC', config.enableRbac ? '✅ Enabled' : '❌ Disabled'],
            ['Azure AD', config.enableAzureAd ? '✅ Enabled' : 'Disabled'],
            ['Pod Identity', config.enablePodIdentity ? '✅ Enabled' : 'Disabled'],
            ['Image Scanning', config.enableImageScanning ? '✅ Enabled' : 'Disabled'],
            ['Pod Security Admission', config.podSecurityAdmission],
            ['Auto-Upgrade Channel', config.autoUpgradeChannel],
          ]}
        />

        <Section
          title="Monitoring &amp; Add-ons"
          items={[
            ['Container Insights', config.enableContainerInsights ? '✅ Enabled' : 'Disabled'],
            ['Prometheus', config.enablePrometheus ? '✅ Enabled' : 'Disabled'],
            ['Alerts', config.enableAlerts ? '✅ Enabled' : 'Disabled'],
            ['Diagnostic Settings', config.enableDiagnosticSettings ? '✅ Enabled' : 'Disabled'],
            ['Key Vault Provider', config.enableKeyVaultProvider ? '✅ Enabled' : 'Disabled'],
            ['KEDA', config.enableKeda ? '✅ Enabled' : 'Disabled'],
            ['Dapr', config.enableDapr ? '✅ Enabled' : 'Disabled'],
            ['ACR Integration', config.enableAcrIntegration ? `✅ ${config.containerRegistryName || 'Enabled'}` : 'Disabled'],
          ]}
        />

        <Section
          title="Storage"
          items={[
            ['Persistent Volumes', config.enablePersistentVolumes ? '✅ Enabled' : 'Disabled'],
            ...(config.enablePersistentVolumes ? [['Storage Class', config.storageClass] as [string, string]] : []),
            ['Backup & DR', config.enableStorageBackup ? '✅ Enabled' : 'Disabled'],
          ]}
        />

        <Section
          title="Deployment"
          items={[['Deployment Strategy', config.deploymentStrategy]]}
        />

        <Section
          title="Multi-Region"
          items={[
            ['Multi-Region', config.multiRegion.enableMultiRegion ? '✅ Enabled' : 'Disabled'],
            ...(config.multiRegion.enableMultiRegion
              ? ([
                  ['Secondary Regions', config.multiRegion.secondaryRegions.join(', ') || '—'],
                  ['Azure Front Door', config.multiRegion.enableFrontDoor ? '✅ Enabled' : 'Disabled'],
                  ...(config.multiRegion.enableFrontDoor
                    ? ([
                        ['Front Door SKU', config.multiRegion.frontDoorSkuName],
                        ['WAF', config.multiRegion.enableWaf ? '✅ Enabled' : 'Disabled'],
                        ['Health Probes', config.multiRegion.enableHealthProbes ? '✅ Enabled' : 'Disabled'],
                      ] as [string, string][])
                    : []),
                ] as [string, string][])
              : []),
          ]}
        />
      </div>

      {!allOk && (
        <div
          className="mt-4 p-3 rounded text-sm text-center"
          style={{
            background: 'color-mix(in srgb, var(--error) 10%, transparent)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--radius)',
            color: 'var(--error)',
          }}
        >
          Please fix the validation errors above before proceeding.
        </div>
      )}
    </WizardLayout>
  );
}
