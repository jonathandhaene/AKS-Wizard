import type { WizardConfig, NodePool } from '../types/wizard';

// Approximate monthly on-demand prices (USD) per node for common Azure VM sizes.
// These are estimates and will vary by region, reserved instance pricing, etc.
const VM_MONTHLY_PRICE: Record<string, number> = {
  Standard_D2s_v3: 70,
  Standard_D4s_v3: 140,
  Standard_D8s_v3: 280,
  Standard_D16s_v3: 560,
  Standard_E4s_v3: 175,
  Standard_E8s_v3: 350,
  Standard_F4s_v2: 120,
  Standard_F8s_v2: 240,
  Standard_B2ms: 55,
  Standard_B4ms: 110,
};

const DEFAULT_VM_PRICE = 100;

function poolCost(pool: NodePool): number {
  const pricePerNode = VM_MONTHLY_PRICE[pool.vmSize] ?? DEFAULT_VM_PRICE;
  const nodeCount = pool.enableAutoScaling
    ? Math.round((pool.minNodes + pool.maxNodes) / 2)
    : pool.nodeCount;
  return pricePerNode * nodeCount;
}

export interface CostBreakdown {
  systemPool: number;
  userPools: number;
  monitoring: number;
  addons: number;
  storage: number;
  multiRegion: number;
  total: number;
}

export function estimateMonthlyCost(cfg: WizardConfig): CostBreakdown {
  const systemPool = poolCost(cfg.systemNodePool);
  const userPools = cfg.userNodePools.reduce((sum, p) => sum + poolCost(p), 0);

  // Container Insights / Log Analytics: ~$2.76/GB ingested. Rough estimate: $30/month for a small cluster.
  const monitoring =
    (cfg.enableContainerInsights ? 30 : 0) +
    (cfg.enablePrometheus ? 20 : 0) +
    (cfg.enableAzureMonitor ? 10 : 0) +
    (cfg.enableAlerts ? 5 : 0) +
    (cfg.enableDiagnosticSettings ? 5 : 0);

  // Add-ons (KEDA, Dapr, Key Vault provider are free; Azure Policy has a small cost)
  const addons = cfg.enableAzurePolicy ? 5 : 0;

  // Storage
  const storage = cfg.enablePersistentVolumes
    ? cfg.storageClass === 'premium-ssd'
      ? 40
      : cfg.storageClass === 'azuredisk'
        ? 20
        : cfg.storageClass === 'azurefile'
          ? 15
          : 10
    : 0;

  // Multi-Region: secondary AKS clusters + Azure Front Door
  let multiRegion = 0;
  if (cfg.multiRegion.enableMultiRegion) {
    const secondaryCount = cfg.multiRegion.secondaryRegions.length;
    // Each secondary region replicates the system node pool cost
    multiRegion += secondaryCount * poolCost(cfg.systemNodePool);
    // Azure Front Door profile monthly fee (approximate)
    if (cfg.multiRegion.enableFrontDoor) {
      multiRegion +=
        cfg.multiRegion.frontDoorSkuName === 'Premium_AzureFrontDoor' ? 330 : 35;
    }
  }

  const total = systemPool + userPools + monitoring + addons + storage + multiRegion;
  return { systemPool, userPools, monitoring, addons, storage, multiRegion, total };
}
