import { WizardLayout } from '../components/WizardLayout';
import { InfoBox } from '../components/InfoBox';
import { Tooltip } from '../components/Tooltip';
import { useWizard } from '../contexts/WizardContext';

export function HubSpoke() {
  const { config, updateConfig } = useWizard();
  const { hubSpoke, multiRegion } = config;

  const update = (partial: Partial<typeof hubSpoke>) =>
    updateConfig({ hubSpoke: { ...hubSpoke, ...partial } });

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2">Hub-Spoke Networking</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Deploy your AKS cluster into a dedicated spoke VNet connected to a centralised hub VNet.
        The hub provides shared services such as Azure Firewall, Bastion, and DNS.
      </p>

      <InfoBox variant="info" title="Hub-Spoke Architecture">
        A hub-spoke topology centralises network services in a hub VNet while keeping workloads
        isolated in spoke VNets connected via VNet peering. This is the recommended pattern for
        enterprise Azure landing zones.
      </InfoBox>

      {/* Enable Hub-Spoke */}
      <div className="card mb-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔗</span>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Enable Hub-Spoke Topology
                </span>
                <Tooltip content="Deploys the AKS cluster into a spoke VNet that is peered to a central hub VNet containing shared services.">
                  <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                </Tooltip>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Generates spoke VNet, peering, and optional hub resources in IaC templates
              </p>
            </div>
          </div>
          <button
            onClick={() => update({ enableHubSpoke: !hubSpoke.enableHubSpoke })}
            className="relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0"
            style={{ background: hubSpoke.enableHubSpoke ? 'var(--success)' : 'var(--border)' }}
          >
            <span
              className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
              style={{ transform: hubSpoke.enableHubSpoke ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </button>
        </div>
      </div>

      {hubSpoke.enableHubSpoke && (
        <>
          {/* Hub VNet Mode */}
          <div className="card mb-4">
            <div className="section-title">Hub VNet</div>

            <div className="mb-3">
              <label className="field-label">
                Hub VNet Mode{' '}
                <Tooltip content="Choose whether to link to an already-deployed hub VNet or let the wizard create a new one.">
                  <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                </Tooltip>
              </label>
              <div className="flex gap-3 mt-1">
                {(
                  [
                    { value: 'existing', label: '🔗 Use Existing Hub', desc: 'Peer to an existing hub VNet in your subscription' },
                    { value: 'new', label: '🆕 Create New Hub', desc: 'Provision a new hub VNet alongside the spoke' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update({ hubMode: opt.value })}
                    className="flex-1 flex flex-col items-start p-3 rounded text-left text-sm transition-all"
                    style={{
                      background: hubSpoke.hubMode === opt.value ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: hubSpoke.hubMode === opt.value ? 'var(--accent-text)' : 'var(--text-primary)',
                      border: `2px solid ${hubSpoke.hubMode === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <span className="font-semibold">{opt.label}</span>
                    <span
                      className="text-xs mt-0.5"
                      style={{
                        color: hubSpoke.hubMode === opt.value ? 'var(--accent-text)' : 'var(--text-secondary)',
                        opacity: 0.85,
                      }}
                    >
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {hubSpoke.hubMode === 'existing' ? (
              <div>
                <label className="field-label">
                  Existing Hub VNet Resource ID{' '}
                  <Tooltip content="The full Azure resource ID of the hub VNet, e.g. /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Network/virtualNetworks/{vnet}">
                    <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                  </Tooltip>
                </label>
                <input
                  className="field-input"
                  placeholder="/subscriptions/.../resourceGroups/.../providers/Microsoft.Network/virtualNetworks/hub-vnet"
                  value={hubSpoke.existingHubVnetId}
                  onChange={(e) => update({ existingHubVnetId: e.target.value })}
                />
                {hubSpoke.existingHubVnetId.trim() === '' && (
                  <p className="text-xs mt-1" style={{ color: 'var(--warning)' }}>
                    ⚠️ Enter the resource ID of your existing hub VNet.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="field-label">
                  Hub VNet Address Space{' '}
                  <Tooltip content="CIDR block for the new hub VNet. Must not overlap with the spoke or any on-premises address spaces.">
                    <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                  </Tooltip>
                </label>
                <input
                  className="field-input"
                  placeholder="10.0.0.0/16"
                  value={hubSpoke.hubVnetCidr}
                  onChange={(e) => update({ hubVnetCidr: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* Spoke VNet */}
          <div className="card mb-4">
            <div className="section-title">Spoke VNet</div>

            <div className="mb-3">
              <label className="field-label">
                Spoke VNet Address Space{' '}
                <Tooltip content="CIDR block for the AKS spoke VNet. Must not overlap with the hub or other spokes.">
                  <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                </Tooltip>
              </label>
              <input
                className="field-input"
                placeholder="10.1.0.0/16"
                value={hubSpoke.spokeVnetCidr}
                onChange={(e) => update({ spokeVnetCidr: e.target.value })}
              />
            </div>

            <div>
              <label className="field-label">
                AKS Node Subnet CIDR{' '}
                <Tooltip content="Subnet within the spoke VNet where AKS nodes will be placed. Must be a sub-range of the spoke VNet CIDR.">
                  <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                </Tooltip>
              </label>
              <input
                className="field-input"
                placeholder="10.1.0.0/22"
                value={hubSpoke.aksSubnetCidr}
                onChange={(e) => update({ aksSubnetCidr: e.target.value })}
              />
            </div>
          </div>

          {/* Hub Services */}
          <div className="card mb-4">
            <div className="section-title">Hub Services</div>

            {/* Azure Firewall */}
            <div
              className="flex items-center justify-between py-3 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">🔥</span>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {hubSpoke.hubMode === 'existing' ? 'Hub has Azure Firewall' : 'Deploy Azure Firewall in Hub'}
                    </span>
                    <Tooltip content="Azure Firewall provides centralised network security, FQDN-based filtering, and threat intelligence for all traffic leaving the hub.">
                      <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                    </Tooltip>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {hubSpoke.hubMode === 'new'
                      ? 'Provisions Azure Firewall Premium with a dedicated subnet in the hub'
                      : 'Indicates an Azure Firewall is already present in the existing hub'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => update({ enableAzureFirewall: !hubSpoke.enableAzureFirewall })}
                className="relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0"
                style={{ background: hubSpoke.enableAzureFirewall ? 'var(--success)' : 'var(--border)' }}
              >
                <span
                  className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
                  style={{ transform: hubSpoke.enableAzureFirewall ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>

            {/* Egress via Firewall */}
            {hubSpoke.enableAzureFirewall && (
              <div
                className="flex items-center justify-between py-3 border-b"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Route AKS Egress Through Firewall
                  </span>
                  <Tooltip content="Adds a User-Defined Route (UDR) on the AKS subnet so all outbound traffic is inspected by the hub firewall before leaving Azure.">
                    <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                  </Tooltip>
                </div>
                <button
                  onClick={() => update({ enableEgressViaFirewall: !hubSpoke.enableEgressViaFirewall })}
                  className="relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0"
                  style={{ background: hubSpoke.enableEgressViaFirewall ? 'var(--success)' : 'var(--border)' }}
                >
                  <span
                    className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
                    style={{ transform: hubSpoke.enableEgressViaFirewall ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            )}

            {/* Azure Bastion */}
            <div
              className="flex items-center justify-between py-3 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">🏰</span>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {hubSpoke.hubMode === 'existing' ? 'Hub has Azure Bastion' : 'Deploy Azure Bastion in Hub'}
                    </span>
                    <Tooltip content="Azure Bastion provides browser-based secure SSH/RDP access to VMs inside the VNet without exposing public IPs.">
                      <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                    </Tooltip>
                  </div>
                </div>
              </div>
              <button
                onClick={() => update({ enableBastion: !hubSpoke.enableBastion })}
                className="relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0"
                style={{ background: hubSpoke.enableBastion ? 'var(--success)' : 'var(--border)' }}
              >
                <span
                  className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
                  style={{ transform: hubSpoke.enableBastion ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>

            {/* VPN Gateway */}
            <div
              className="flex items-center justify-between py-3 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">🔌</span>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {hubSpoke.hubMode === 'existing' ? 'Hub has VPN / ExpressRoute Gateway' : 'Deploy VPN Gateway in Hub'}
                    </span>
                    <Tooltip content="A VPN or ExpressRoute Gateway in the hub provides secure hybrid connectivity between your on-premises network and the Azure hub-spoke topology. Requires a dedicated GatewaySubnet (/27 or larger) in the hub VNet.">
                      <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                    </Tooltip>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {hubSpoke.hubMode === 'new'
                      ? 'Provisions a GatewaySubnet (/27) in the hub for VPN or ExpressRoute connectivity'
                      : 'Indicates a VPN or ExpressRoute Gateway is already present in the existing hub'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => update({ enableVpnGateway: !hubSpoke.enableVpnGateway })}
                className="relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0"
                style={{ background: hubSpoke.enableVpnGateway ? 'var(--success)' : 'var(--border)' }}
              >
                <span
                  className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
                  style={{ transform: hubSpoke.enableVpnGateway ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>

            {/* Private Cluster */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">🔒</span>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Private AKS Cluster
                    </span>
                    <Tooltip content="Makes the Kubernetes API server accessible only via a private endpoint inside the VNet. Recommended when using hub-spoke with Azure Firewall.">
                      <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                    </Tooltip>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    No public API server endpoint — access via Bastion or a jump box in the hub
                  </p>
                </div>
              </div>
              <button
                onClick={() => update({ enablePrivateCluster: !hubSpoke.enablePrivateCluster })}
                className="relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0"
                style={{ background: hubSpoke.enablePrivateCluster ? 'var(--success)' : 'var(--border)' }}
              >
                <span
                  className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
                  style={{ transform: hubSpoke.enablePrivateCluster ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>
          </div>

          {hubSpoke.enablePrivateCluster && !hubSpoke.enableBastion && (
            <InfoBox variant="warning" title="Private cluster requires jump-box access">
              With a private API server and no Bastion, you will need a jump box or VPN/ExpressRoute
              connection to reach the cluster. Consider enabling Azure Bastion in the hub for secure
              browser-based access.
            </InfoBox>
          )}

          {hubSpoke.enablePrivateCluster && (
            <InfoBox variant="info" title="Private DNS Zone">
              A private cluster uses an Azure Private DNS Zone (
              <code>privatelink.{config.region}.azmk8s.io</code>) for API server name resolution.
              The wizard generates this zone and links it to both the hub and spoke VNets so that
              nodes and any jump box can resolve the private API server endpoint.
            </InfoBox>
          )}

          {hubSpoke.enableAzureFirewall && hubSpoke.enableEgressViaFirewall && (
            <InfoBox variant="tip" title="UDR + Firewall egress">
              When routing AKS egress through Azure Firewall, ensure the required AKS{' '}
              <a
                href="https://learn.microsoft.com/azure/aks/outbound-rules-control-egress"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                outbound FQDN/IP rules
              </a>{' '}
              are configured in your firewall policy, otherwise cluster operations will fail.
            </InfoBox>
          )}

          {multiRegion.enableMultiRegion && (
            <InfoBox variant="tip" title="Multi-Region + Hub-Spoke">
              You have both Hub-Spoke and Multi-Region enabled. Per Microsoft best practices, each
              regional AKS cluster should reside in its own spoke VNet peered to a regional hub.{' '}
              <a
                href="https://learn.microsoft.com/azure/architecture/reference-architectures/containers/aks/baseline-aks"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                Azure Front Door
              </a>{' '}
              (configured on the Multi-Region step) acts as the global entry point across all
              regional spokes. Each region's spoke VNet should use a non-overlapping CIDR range.
            </InfoBox>
          )}
        </>
      )}

      {!hubSpoke.enableHubSpoke && (
        <InfoBox variant="tip" title="Flat VNet Deployment">
          Hub-Spoke is disabled. The AKS cluster will be deployed without an explicit hub VNet.
          Enable the toggle above to adopt the recommended enterprise networking topology.
        </InfoBox>
      )}
    </WizardLayout>
  );
}
