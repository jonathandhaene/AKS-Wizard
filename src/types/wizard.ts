// ─── Wizard Configuration Types ───────────────────────────────────────────────

export type WorkloadType = 'general' | 'memory-intensive' | 'compute-intensive' | 'gpu-heavy' | 'io-intensive';
export type TrafficLevel = 'low' | 'medium' | 'high' | 'burst';

export interface WorkloadConfig {
  workloadType: WorkloadType;
  trafficLevel: TrafficLevel;
  enableHpa: boolean;
  enableVpa: boolean;
  targetCpuUtilization: number;
  targetMemoryUtilization: number;
  enableMonitoringIntegration: boolean;
}

export type Theme =
  | 'theme-classic'
  | 'theme-win95'
  | 'theme-cyberpunk'
  | 'theme-nature'
  | 'theme-dark'
  | 'theme-high-contrast'
  | 'theme-fluent'
  | 'theme-paleontology';

export interface NodePool {
  name: string;
  vmSize: string;
  nodeCount: number;
  enableAutoScaling: boolean;
  minNodes: number;
  maxNodes: number;
  mode: 'System' | 'User';
}

export type AksMode = 'Standard' | 'Automatic';
export type AutoUpgradeChannel = 'none' | 'patch' | 'stable' | 'rapid' | 'node-image';

export interface WizardConfig {
  // Cluster Basics
  subscriptionId: string;
  resourceGroupName: string;
  clusterName: string;
  region: string;
  kubernetesVersion: string;
  aksMode: AksMode;

  // Node Pools
  systemNodePool: NodePool;
  userNodePools: NodePool[];

  // Networking
  networkPlugin: 'azure' | 'kubenet';
  dnsPrefix: string;
  serviceCidr: string;
  dockerBridgeCidr: string;
  loadBalancerSku: 'Standard' | 'Basic';

  // Security
  enableRbac: boolean;
  enableAzureAd: boolean;
  azureAdTenantId: string;
  enablePodIdentity: boolean;
  networkPolicy: 'None' | 'azure' | 'calico';
  autoUpgradeChannel: AutoUpgradeChannel;

  // Monitoring
  enableContainerInsights: boolean;
  logAnalyticsWorkspaceId: string;
  enablePrometheus: boolean;
  enableAzureMonitor: boolean;

  // Workload Requirements
  workloadConfig: WorkloadConfig;

  // Add-ons
  enableHttpApplicationRouting: boolean;
  enableAzurePolicy: boolean;
  enableKeyVaultProvider: boolean;
  enableKeda: boolean;
  enableDapr: boolean;
  enableAcrIntegration: boolean;
  containerRegistryName: string;
}

export const defaultConfig: WizardConfig = {
  subscriptionId: '',
  resourceGroupName: '',
  clusterName: '',
  region: 'eastus',
  kubernetesVersion: '1.31.x',
  aksMode: 'Standard',

  systemNodePool: {
    name: 'system',
    vmSize: 'Standard_D2s_v3',
    nodeCount: 3,
    enableAutoScaling: false,
    minNodes: 1,
    maxNodes: 5,
    mode: 'System',
  },
  userNodePools: [],

  networkPlugin: 'azure',
  dnsPrefix: '',
  serviceCidr: '10.0.0.0/16',
  dockerBridgeCidr: '172.17.0.1/16',
  loadBalancerSku: 'Standard',

  enableRbac: true,
  enableAzureAd: false,
  azureAdTenantId: '',
  enablePodIdentity: false,
  networkPolicy: 'None',
  autoUpgradeChannel: 'patch',

  enableContainerInsights: true,
  logAnalyticsWorkspaceId: '',
  enablePrometheus: false,
  enableAzureMonitor: false,

  workloadConfig: {
    workloadType: 'general',
    trafficLevel: 'medium',
    enableHpa: false,
    enableVpa: false,
    targetCpuUtilization: 70,
    targetMemoryUtilization: 80,
    enableMonitoringIntegration: false,
  },

  enableHttpApplicationRouting: false,
  enableAzurePolicy: false,
  enableKeyVaultProvider: false,
  enableKeda: false,
  enableDapr: false,
  enableAcrIntegration: false,
  containerRegistryName: '',
};

export const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'maturity', label: 'Readiness' },
  { id: 'basics', label: 'Basics' },
  { id: 'nodes', label: 'Node Pools' },
  { id: 'workload', label: 'Workloads' },
  { id: 'networking', label: 'Networking' },
  { id: 'security', label: 'Security' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'addons', label: 'Add-ons' },
  { id: 'review', label: 'Review' },
  { id: 'templates', label: 'Templates' },
  { id: 'deploy', label: 'Deploy' },
  { id: 'github', label: 'GitHub' },
] as const;

export type StepId = (typeof STEPS)[number]['id'];
