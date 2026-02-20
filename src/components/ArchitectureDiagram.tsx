import type { WizardConfig, NodePool } from '../types/wizard';

// ── Azure brand colours ─────────────────────────────────────────────────────
const C = {
  subscription: { bg: '#EBF3FB', border: '#0078D4', text: '#0078D4' },
  rg:           { bg: '#F5F5F5', border: '#8A8886', text: '#323130' },
  vnet:         { bg: '#EAF1FB', border: '#1F6AFF', text: '#1F6AFF' },
  aks:          { bg: '#ECF0FD', border: '#326CE5', text: '#326CE5' },
  systemPool:   { bg: '#E6F4EA', border: '#107C10', text: '#107C10' },
  userPool:     { bg: '#FFF9E6', border: '#B07D00', text: '#5C4000' },
  lb:           { bg: '#E1F3FB', border: '#00B4D8', text: '#006B8F' },
  monitor:      { bg: '#F3E9FE', border: '#7B4097', text: '#7B4097' },
  acr:          { bg: '#FEE9E8', border: '#D13438', text: '#B12020' },
  keyVault:     { bg: '#FFF8E5', border: '#C19B00', text: '#8A6E00' },
  aad:          { bg: '#EBF3FB', border: '#0078D4', text: '#005FA2' },
  addon:        { bg: '#F5EEFF', border: '#7719AA', text: '#7719AA' },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Azure Kubernetes Service icon (simplified wheel) */
function AksIcon({ x, y, size = 12 }: { x: number; y: number; size?: number }) {
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;
  // 7 spokes at 360/7-degree intervals
  const spokes = Array.from({ length: 7 }, (_, i) => {
    const angle = (i * 360) / 7 - 90;
    const rad = (angle * Math.PI) / 180;
    return {
      x2: cx + r * 0.9 * Math.cos(rad),
      y2: cy + r * 0.9 * Math.sin(rad),
    };
  });
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={C.aks.bg} stroke={C.aks.border} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={r * 0.3} fill={C.aks.border} />
      {spokes.map((s, i) => (
        <line key={i} x1={cx} y1={cy} x2={s.x2} y2={s.y2} stroke={C.aks.border} strokeWidth={1} />
      ))}
    </g>
  );
}

/** Generic icon rendered as a solid coloured square with a letter */
function ServiceIcon({
  x, y, letter, color, size = 14,
}: {
  x: number; y: number; letter: string;
  color: { bg: string; border: string; text: string };
  size?: number;
}) {
  return (
    <g>
      <rect x={x} y={y} width={size} height={size} fill={color.border} rx={2} />
      <text
        x={x + size / 2} y={y + size * 0.78}
        fontSize={size * 0.65} fill="#fff"
        fontWeight="700" textAnchor="middle" fontFamily="system-ui"
      >
        {letter}
      </text>
    </g>
  );
}

/** Dashed connector between two points (cubic bezier) */
function Connector({
  x1, y1, x2, y2, color = '#999',
}: {
  x1: number; y1: number; x2: number; y2: number; color?: string;
}) {
  const mx = (x1 + x2) / 2;
  return (
    <path
      d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
      fill="none" stroke={color} strokeWidth={1}
      strokeDasharray="4,2" opacity={0.55}
    />
  );
}

/** Single node-pool box */
function NodePoolBox({
  pool, x, y, width,
}: {
  pool: NodePool; x: number; y: number; width: number;
}) {
  const isSystem = pool.mode === 'System';
  const color = isSystem ? C.systemPool : C.userPool;
  const scaling = pool.enableAutoScaling
    ? `${pool.minNodes}–${pool.maxNodes} (auto)`
    : `${pool.nodeCount} nodes`;
  return (
    <g>
      <rect x={x} y={y} width={width} height={50} fill={color.bg} stroke={color.border} strokeWidth={1.5} rx={3} />
      <ServiceIcon x={x + 4} y={y + 4} letter={isSystem ? 'S' : 'U'} color={color} size={13} />
      <text x={x + 21} y={y + 14} fontSize={9} fontWeight="700" fill={color.text} fontFamily="system-ui">
        {pool.name}
      </text>
      <text x={x + 6} y={y + 27} fontSize={8} fill={color.text} opacity={0.85} fontFamily="system-ui">
        {pool.vmSize}
      </text>
      <text x={x + 6} y={y + 38} fontSize={8} fill={color.text} opacity={0.85} fontFamily="system-ui">
        {scaling}
      </text>
      {isSystem && (
        <text x={x + 6} y={y + 48} fontSize={7} fill={color.text} opacity={0.6} fontFamily="system-ui">
          System
        </text>
      )}
    </g>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function ArchitectureDiagram({ config }: { config: WizardConfig }) {
  // ── Feature flags ──────────────────────────────────────────────────────────
  const hasMonitoring =
    config.enableContainerInsights || config.enablePrometheus || config.enableAzureMonitor;
  const hasAcr = config.enableAcrIntegration;
  const hasKeyVault = config.enableKeyVaultProvider;
  const hasAad = config.enableAzureAd || config.enablePodIdentity;
  const addons = [
    config.enableKeda && 'KEDA',
    config.enableDapr && 'Dapr',
    config.enableAzurePolicy && 'Policy',
    config.enableHttpApplicationRouting && 'HTTP Routing',
    config.enableKeyVaultProvider && 'Key Vault CSI',
  ].filter(Boolean) as string[];
  const hasAddons = addons.length > 0;

  const extServices: Array<{
    label: string;
    sub: string;
    color: typeof C.monitor;
    icon: string;
  }> = [];
  if (hasMonitoring) {
    const parts = [
      config.enableContainerInsights && 'Insights',
      config.enablePrometheus && 'Prometheus',
      config.enableAzureMonitor && 'Monitor',
    ].filter(Boolean);
    extServices.push({ label: 'Azure Monitor', sub: parts.join(' · '), color: C.monitor, icon: 'M' });
  }
  if (hasAcr) {
    extServices.push({
      label: 'Container Registry',
      sub: config.containerRegistryName || 'ACR',
      color: C.acr, icon: 'R',
    });
  }
  if (hasKeyVault) {
    extServices.push({ label: 'Key Vault', sub: 'Secrets / Certs', color: C.keyVault, icon: 'K' });
  }
  if (hasAad) {
    extServices.push({ label: 'Microsoft Entra ID', sub: 'RBAC / Pod Identity', color: C.aad, icon: 'A' });
  }

  // ── Layout constants ───────────────────────────────────────────────────────
  const W = 500;
  const POOL_W = 115;       // width of each node-pool box
  const POOL_H = 50;
  const POOL_GAP = 6;
  const visibleUserPools = config.userNodePools.slice(0, 2);
  const extraPools = config.userNodePools.length - visibleUserPools.length;

  const allPools: NodePool[] = [config.systemNodePool, ...visibleUserPools];

  const hasExt = extServices.length > 0;
  const EXT_W = hasExt ? 140 : 0;
  const EXT_GAP = hasExt ? 8 : 0;
  const LEFT_W = W - EXT_W - EXT_GAP; // width of left (VNet) column

  // heights
  const ADDON_H = hasAddons ? 26 : 0;
  const AKS_H = 22 + POOL_H + ADDON_H + 10;  // inner cluster box
  const VN_H = 24 + AKS_H + 8 + 30 + 10;     // vnet: label + aks + gap + lb + padding
  const RG_H = 24 + VN_H + 12;
  const TOTAL_H = 22 + RG_H + 12;

  // Y anchor points
  const SUB_Y = 4;
  const RG_Y = SUB_Y + 20;
  const VN_Y = RG_Y + 22;
  const AKS_Y = VN_Y + 22;
  const POOLS_Y = AKS_Y + 22;
  const ADDONS_Y = POOLS_Y + POOL_H + 6;
  const LB_Y = POOLS_Y + POOL_H + ADDON_H + 12;

  // External services — aligned to VN_Y
  const EXT_X = LEFT_W + EXT_GAP + 4;
  const EXT_SVC_H = 36;
  const EXT_SVC_GAP = 8;

  return (
    <svg
      viewBox={`0 0 ${W} ${TOTAL_H}`}
      width="100%"
      style={{ display: 'block' }}
      aria-label="AKS Architecture Diagram"
    >
      {/* ── Azure Subscription ─────────────────────────────────────────── */}
      <rect
        x={2} y={SUB_Y} width={W - 4} height={TOTAL_H - SUB_Y - 4}
        fill={C.subscription.bg} stroke={C.subscription.border}
        strokeWidth={1.5} rx={4} opacity={0.4}
      />
      <ServiceIcon x={6} y={SUB_Y + 3} letter="S" color={C.subscription} size={14} />
      <text x={24} y={SUB_Y + 14} fontSize={9} fontWeight="700" fill={C.subscription.text} fontFamily="system-ui">
        Azure Subscription
      </text>

      {/* ── Resource Group ─────────────────────────────────────────────── */}
      <rect
        x={6} y={RG_Y} width={W - 12} height={RG_H}
        fill="none" stroke={C.rg.border} strokeWidth={1.5}
        strokeDasharray="6,3" rx={3}
      />
      <text x={12} y={RG_Y + 14} fontSize={9} fontWeight="700" fill={C.rg.text} fontFamily="system-ui">
        📁 {config.resourceGroupName ? config.resourceGroupName : 'Resource Group'}
        {config.region ? `  ·  ${config.region}` : ''}
      </text>

      {/* ── Virtual Network ────────────────────────────────────────────── */}
      <rect
        x={10} y={VN_Y} width={LEFT_W - 4} height={VN_H}
        fill={C.vnet.bg} stroke={C.vnet.border} strokeWidth={1.5} rx={3} opacity={0.6}
      />
      <text x={16} y={VN_Y + 13} fontSize={9} fontWeight="700" fill={C.vnet.text} fontFamily="system-ui">
        🌐 Virtual Network  ·  {config.networkPlugin === 'azure' ? 'Azure CNI' : 'Kubenet'}
        {config.serviceCidr ? `  ·  ${config.serviceCidr}` : ''}
      </text>

      {/* ── AKS Cluster ────────────────────────────────────────────────── */}
      <rect
        x={14} y={AKS_Y} width={LEFT_W - 12} height={AKS_H}
        fill={C.aks.bg} stroke={C.aks.border} strokeWidth={2} rx={3}
      />
      {/* AKS icon */}
      <AksIcon x={18} y={AKS_Y + 4} size={13} />
      <text x={35} y={AKS_Y + 14} fontSize={9} fontWeight="700" fill={C.aks.text} fontFamily="system-ui">
        {config.clusterName ? config.clusterName : 'AKS Cluster'}
        {`  ·  k8s ${config.kubernetesVersion}  ·  ${config.aksMode}`}
      </text>

      {/* ── Node Pools ─────────────────────────────────────────────────── */}
      {allPools.map((pool, i) => (
        <NodePoolBox
          key={pool.name}
          pool={pool}
          x={18 + i * (POOL_W + POOL_GAP)}
          y={POOLS_Y}
          width={POOL_W}
        />
      ))}
      {extraPools > 0 && (
        <text
          x={18 + allPools.length * (POOL_W + POOL_GAP)}
          y={POOLS_Y + 28}
          fontSize={8} fill={C.aks.text} fontFamily="system-ui"
        >
          +{extraPools} more
        </text>
      )}

      {/* ── Add-ons row ────────────────────────────────────────────────── */}
      {hasAddons && (
        <g>
          <text x={20} y={ADDONS_Y + 12} fontSize={8} fill={C.addon.text} fontFamily="system-ui" fontWeight="700">
            Add-ons:
          </text>
          {addons.map((name, i) => (
            <g key={name}>
              <rect
                x={65 + i * 72} y={ADDONS_Y} width={66} height={16}
                fill={C.addon.bg} stroke={C.addon.border} strokeWidth={1} rx={8}
              />
              <text
                x={98 + i * 72} y={ADDONS_Y + 11}
                fontSize={7.5} fill={C.addon.text} textAnchor="middle" fontFamily="system-ui"
              >
                {name}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* ── Load Balancer ──────────────────────────────────────────────── */}
      <rect
        x={14} y={LB_Y} width={LEFT_W - 12} height={26}
        fill={C.lb.bg} stroke={C.lb.border} strokeWidth={1.5} rx={3}
      />
      <text x={20} y={LB_Y + 16} fontSize={9} fontWeight="700" fill={C.lb.text} fontFamily="system-ui">
        ⚖ Load Balancer ({config.loadBalancerSku})
        {config.networkPolicy !== 'None' ? `  ·  ${config.networkPolicy} policy` : ''}
        {config.enableRbac ? '  ·  RBAC' : ''}
      </text>

      {/* ── External Services (right column) ──────────────────────────── */}
      {extServices.map((svc, i) => {
        const sy = VN_Y + i * (EXT_SVC_H + EXT_SVC_GAP);
        const midAksY = AKS_Y + AKS_H / 2;
        return (
          <g key={svc.label}>
            {/* Connector from VNet right edge to service */}
            <Connector
              x1={LEFT_W - 4}
              y1={midAksY}
              x2={EXT_X}
              y2={sy + EXT_SVC_H / 2}
              color={svc.color.border}
            />
            <rect
              x={EXT_X} y={sy} width={EXT_W} height={EXT_SVC_H}
              fill={svc.color.bg} stroke={svc.color.border} strokeWidth={1.5} rx={3}
            />
            <ServiceIcon x={EXT_X + 4} y={sy + (EXT_SVC_H - 13) / 2} letter={svc.icon} color={svc.color} size={13} />
            <text x={EXT_X + 21} y={sy + 13} fontSize={9} fontWeight="700" fill={svc.color.text} fontFamily="system-ui">
              {svc.label}
            </text>
            <text x={EXT_X + 21} y={sy + 23} fontSize={8} fill={svc.color.text} opacity={0.8} fontFamily="system-ui">
              {svc.sub}
            </text>
          </g>
        );
      })}

      {/* ── Legend ────────────────────────────────────────────────────── */}
      <text
        x={W / 2} y={TOTAL_H - 3}
        fontSize={7.5} fill="#999" textAnchor="middle" fontFamily="system-ui"
      >
        Updates live as you configure each step
      </text>
    </svg>
  );
}
