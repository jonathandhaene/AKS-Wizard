// ─── Wizard Configuration Types ───────────────────────────────────────────────

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

export interface WizardConfig {
  // Cluster Basics
  subscriptionId: string;
  resourceGroupName: string;
  clusterName: string;
  region: string;
  kubernetesVersion: string;

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
  enableAutoUpgrade: boolean;

  // Monitoring
  enableContainerInsights: boolean;
  logAnalyticsWorkspaceId: string;
  enablePrometheus: boolean;
  enableAzureMonitor: boolean;

  // Add-ons
  enableHttpApplicationRouting: boolean;
  enableAzurePolicy: boolean;
  enableKeyVaultProvider: boolean;
  enableKeda: boolean;
  enableDapr: boolean;
}

export const defaultConfig: WizardConfig = {
  subscriptionId: '',
  resourceGroupName: '',
  clusterName: '',
  region: 'eastus',
  kubernetesVersion: '1.29.x',

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
  enableAutoUpgrade: false,

  enableContainerInsights: true,
  logAnalyticsWorkspaceId: '',
  enablePrometheus: false,
  enableAzureMonitor: false,

  enableHttpApplicationRouting: false,
  enableAzurePolicy: false,
  enableKeyVaultProvider: false,
  enableKeda: false,
  enableDapr: false,
};

export const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'basics', label: 'Basics' },
  { id: 'nodes', label: 'Node Pools' },
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
