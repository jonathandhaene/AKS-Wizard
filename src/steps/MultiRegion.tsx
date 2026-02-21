import { WizardLayout } from '../components/WizardLayout';
import { InfoBox } from '../components/InfoBox';
import { Tooltip } from '../components/Tooltip';
import { useWizard } from '../contexts/WizardContext';

const AZURE_REGIONS = [
  { value: 'eastus', label: 'East US' },
  { value: 'eastus2', label: 'East US 2' },
  { value: 'westus', label: 'West US' },
  { value: 'westus2', label: 'West US 2' },
  { value: 'westus3', label: 'West US 3' },
  { value: 'centralus', label: 'Central US' },
  { value: 'northeurope', label: 'North Europe' },
  { value: 'westeurope', label: 'West Europe' },
  { value: 'uksouth', label: 'UK South' },
  { value: 'ukwest', label: 'UK West' },
  { value: 'francecentral', label: 'France Central' },
  { value: 'germanywestcentral', label: 'Germany West Central' },
  { value: 'swedencentral', label: 'Sweden Central' },
  { value: 'eastasia', label: 'East Asia' },
  { value: 'southeastasia', label: 'Southeast Asia' },
  { value: 'japaneast', label: 'Japan East' },
  { value: 'japanwest', label: 'Japan West' },
  { value: 'australiaeast', label: 'Australia East' },
  { value: 'australiasoutheast', label: 'Australia Southeast' },
  { value: 'brazilsouth', label: 'Brazil South' },
  { value: 'canadacentral', label: 'Canada Central' },
  { value: 'canadaeast', label: 'Canada East' },
  { value: 'southafricanorth', label: 'South Africa North' },
  { value: 'uaenorth', label: 'UAE North' },
];

export function MultiRegion() {
  const { config, updateConfig } = useWizard();
  const { multiRegion } = config;

  const update = (partial: Partial<typeof multiRegion>) =>
    updateConfig({ multiRegion: { ...multiRegion, ...partial } });

  const availableSecondaryRegions = AZURE_REGIONS.filter((r) => r.value !== config.region);

  const toggleSecondaryRegion = (regionValue: string) => {
    const current = multiRegion.secondaryRegions;
    const updated = current.includes(regionValue)
      ? current.filter((r) => r !== regionValue)
      : [...current, regionValue];
    update({ secondaryRegions: updated });
  };

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2">Multi-Region &amp; High Availability</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Deploy AKS clusters across multiple Azure regions and configure Azure Front Door for
        global traffic management with zero-downtime failover.
      </p>

      <InfoBox variant="info" title="Always-On Architecture">
        A multi-region setup with Azure Front Door ensures high availability by routing traffic
        to the nearest healthy region. If one region fails, Front Door automatically redirects
        requests to the next available endpoint within seconds.
      </InfoBox>

      {/* Enable Multi-Region */}
      <div className="card mb-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🌍</span>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Enable Multi-Region Deployment
                </span>
                <Tooltip content="Deploy identical AKS clusters in multiple Azure regions for geographic redundancy and lower latency for global users.">
                  <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                </Tooltip>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Generates IaC templates for active-active or active-passive multi-region AKS
              </p>
            </div>
          </div>
          <button
            onClick={() => update({ enableMultiRegion: !multiRegion.enableMultiRegion })}
            className="relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0"
            style={{ background: multiRegion.enableMultiRegion ? 'var(--success)' : 'var(--border)' }}
          >
            <span
              className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
              style={{ transform: multiRegion.enableMultiRegion ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </button>
        </div>
      </div>

      {multiRegion.enableMultiRegion && (
        <>
          {/* Secondary Regions */}
          <div className="card mb-4">
            <div className="section-title">Secondary Regions</div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Select one or more secondary regions. Your primary region is{' '}
              <strong>{config.region}</strong>. Each selected region will get a dedicated AKS
              cluster in the generated templates.
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {availableSecondaryRegions.map((region) => {
                const selected = multiRegion.secondaryRegions.includes(region.value);
                return (
                  <button
                    key={region.value}
                    onClick={() => toggleSecondaryRegion(region.value)}
                    className="flex items-center gap-2 p-2 rounded text-left text-sm transition-all"
                    style={{
                      background: selected ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: selected ? 'var(--accent-text)' : 'var(--text-primary)',
                      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <span>{selected ? '✅' : '⬜'}</span>
                    <span>{region.label}</span>
                  </button>
                );
              })}
            </div>
            {multiRegion.secondaryRegions.length === 0 && (
              <p className="text-xs mt-2" style={{ color: 'var(--warning)' }}>
                ⚠️ Select at least one secondary region to enable failover.
              </p>
            )}
          </div>

          {/* Azure Front Door */}
          <div className="card mb-4">
            <div className="section-title">Azure Front Door</div>

            <div
              className="flex items-center justify-between py-3 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">🚪</span>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Enable Azure Front Door
                    </span>
                    <Tooltip content="Azure Front Door is a global CDN and load balancer that distributes traffic across regions with intelligent routing, SSL termination, and DDoS protection.">
                      <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                    </Tooltip>
                  </div>
                </div>
              </div>
              <button
                onClick={() => update({ enableFrontDoor: !multiRegion.enableFrontDoor })}
                className="relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0"
                style={{ background: multiRegion.enableFrontDoor ? 'var(--success)' : 'var(--border)' }}
              >
                <span
                  className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
                  style={{ transform: multiRegion.enableFrontDoor ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>

            {multiRegion.enableFrontDoor && (
              <>
                {/* SKU */}
                <div className="py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <label className="field-label">
                    Front Door SKU{' '}
                    <Tooltip content="Standard includes CDN, routing, and SSL. Premium adds WAF managed rules and private link origins — required for advanced security scenarios.">
                      <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                    </Tooltip>
                  </label>
                  <div className="flex gap-3 mt-1">
                    {(
                      [
                        {
                          value: 'Standard_AzureFrontDoor',
                          label: '⭐ Standard',
                          desc: 'CDN, global routing, SSL termination',
                        },
                        {
                          value: 'Premium_AzureFrontDoor',
                          label: '💎 Premium',
                          desc: 'Standard + WAF managed rules + Private Link',
                        },
                      ] as const
                    ).map((sku) => (
                      <button
                        key={sku.value}
                        onClick={() => update({ frontDoorSkuName: sku.value })}
                        className="flex-1 flex flex-col items-start p-3 rounded text-left text-sm transition-all"
                        style={{
                          background:
                            multiRegion.frontDoorSkuName === sku.value
                              ? 'var(--accent)'
                              : 'var(--bg-secondary)',
                          color:
                            multiRegion.frontDoorSkuName === sku.value
                              ? 'var(--accent-text)'
                              : 'var(--text-primary)',
                          border: `2px solid ${multiRegion.frontDoorSkuName === sku.value ? 'var(--accent)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius)',
                        }}
                      >
                        <span className="font-semibold">{sku.label}</span>
                        <span
                          className="text-xs mt-0.5"
                          style={{
                            color:
                              multiRegion.frontDoorSkuName === sku.value
                                ? 'var(--accent-text)'
                                : 'var(--text-secondary)',
                            opacity: 0.85,
                          }}
                        >
                          {sku.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* WAF */}
                <div
                  className="flex items-center justify-between py-3 border-b"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Enable Web Application Firewall (WAF)
                    </span>
                    <Tooltip content="WAF protects your application from common web exploits (OWASP Top 10) and bots. Requires Premium SKU for managed rule sets.">
                      <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                    </Tooltip>
                  </div>
                  <button
                    onClick={() => update({ enableWaf: !multiRegion.enableWaf })}
                    className="relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0"
                    style={{ background: multiRegion.enableWaf ? 'var(--success)' : 'var(--border)' }}
                  >
                    <span
                      className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
                      style={{ transform: multiRegion.enableWaf ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>

                {/* Health Probes */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Enable Health Probes
                    </span>
                    <Tooltip content="Health probes continuously monitor backend origins. If an origin becomes unhealthy, Front Door automatically fails over to the next available origin.">
                      <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                    </Tooltip>
                  </div>
                  <button
                    onClick={() => update({ enableHealthProbes: !multiRegion.enableHealthProbes })}
                    className="relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0"
                    style={{ background: multiRegion.enableHealthProbes ? 'var(--success)' : 'var(--border)' }}
                  >
                    <span
                      className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
                      style={{ transform: multiRegion.enableHealthProbes ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>

                {multiRegion.enableWaf && multiRegion.frontDoorSkuName === 'Standard_AzureFrontDoor' && (
                  <InfoBox variant="warning" title="Premium SKU recommended for WAF">
                    WAF managed rule sets (DRS/OWASP) require the <strong>Premium</strong> SKU.
                    With Standard, only custom rules are available. Switch to Premium for full
                    protection.
                  </InfoBox>
                )}
              </>
            )}
          </div>

          <InfoBox variant="tip" title="Zero-Downtime Failover">
            With Azure Front Door health probes enabled, failover happens automatically in under
            30 seconds. Pair this with{' '}
            <strong>geo-redundant storage</strong> and{' '}
            <strong>Azure Database for PostgreSQL Flexible Server</strong> with read replicas for
            a fully resilient multi-region architecture.
          </InfoBox>

          {/* Azure API Management */}
          <div className="card mb-4">
            <div className="section-title">Azure API Management (APIM)</div>

            <div
              className="flex items-center justify-between py-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">🔀</span>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Enable Azure API Management
                    </span>
                    <Tooltip content="Azure API Management acts as a managed API gateway in front of your AKS services — providing rate limiting, authentication, API versioning, and a developer portal.">
                      <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                    </Tooltip>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Provision an APIM gateway to manage, secure, and observe APIs exposed by AKS
                  </p>
                </div>
              </div>
              <button
                onClick={() => update({ enableApim: !multiRegion.enableApim })}
                className="relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0"
                style={{ background: multiRegion.enableApim ? 'var(--success)' : 'var(--border)' }}
              >
                <span
                  className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
                  style={{ transform: multiRegion.enableApim ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>

            {multiRegion.enableApim && (
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <label className="field-label">
                  APIM SKU{' '}
                  <Tooltip content="Developer: no SLA, ideal for dev/test. Basic/Standard: SLA-backed, suitable for production APIs. Premium: multi-region VNET integration — required for private AKS backends.">
                    <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                  </Tooltip>
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(
                    [
                      { value: 'Developer', label: '🧪 Developer', desc: 'No SLA · dev/test only' },
                      { value: 'Basic', label: '📦 Basic', desc: 'SLA · low-traffic production' },
                      { value: 'Standard', label: '⭐ Standard', desc: 'SLA · higher throughput' },
                      { value: 'Premium', label: '💎 Premium', desc: 'Multi-region · VNET · Private AKS' },
                    ] as const
                  ).map((sku) => (
                    <button
                      key={sku.value}
                      onClick={() => update({ apimSkuName: sku.value })}
                      className="flex flex-col items-start p-3 rounded text-left text-sm transition-all"
                      style={{
                        background:
                          multiRegion.apimSkuName === sku.value
                            ? 'var(--accent)'
                            : 'var(--bg-secondary)',
                        color:
                          multiRegion.apimSkuName === sku.value
                            ? 'var(--accent-text)'
                            : 'var(--text-primary)',
                        border: `2px solid ${multiRegion.apimSkuName === sku.value ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)',
                      }}
                    >
                      <span className="font-semibold">{sku.label}</span>
                      <span
                        className="text-xs mt-0.5"
                        style={{
                          color:
                            multiRegion.apimSkuName === sku.value
                              ? 'var(--accent-text)'
                              : 'var(--text-secondary)',
                          opacity: 0.85,
                        }}
                      >
                        {sku.desc}
                      </span>
                    </button>
                  ))}
                </div>
                {multiRegion.apimSkuName === 'Developer' && (
                  <InfoBox variant="warning" title="Developer SKU has no SLA">
                    The Developer SKU is not suitable for production workloads. Upgrade to{' '}
                    <strong>Basic</strong>, <strong>Standard</strong>, or <strong>Premium</strong>{' '}
                    for an SLA-backed gateway.
                  </InfoBox>
                )}
                <div className="mt-3">
                  <label className="field-label">
                    Publisher Email{' '}
                    <Tooltip content="The contact email address for the APIM publisher. Used for administrative notifications and shown in the developer portal.">
                      <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                    </Tooltip>
                  </label>
                  <input
                    className="field-input"
                    type="email"
                    placeholder="admin@contoso.com"
                    value={multiRegion.apimPublisherEmail}
                    onChange={(e) => update({ apimPublisherEmail: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!multiRegion.enableMultiRegion && (
        <InfoBox variant="tip" title="Single-Region Deployment">
          You are configuring a single-region AKS cluster in <strong>{config.region}</strong>.
          Enable Multi-Region above to add Azure Front Door and secondary region clusters for
          high availability and global reach.
        </InfoBox>
      )}
    </WizardLayout>
  );
}
