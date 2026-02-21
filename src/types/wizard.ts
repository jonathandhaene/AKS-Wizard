// ─── Wizard Configuration Types ───────────────────────────────────────────────

export type WorkloadType = 'general' | 'memory-intensive' | 'compute-intensive' | 'gpu-heavy' | 'io-intensive';

export type IngressController = 'none' | 'nginx' | 'appgw' | 'traefik';
export type PodSecurityAdmissionLevel = 'privileged' | 'baseline' | 'restricted';
export type StorageClassType = 'default' | 'azurefile' | 'azuredisk' | 'premium-ssd';
export type DeploymentStrategy = 'rolling' | 'blue-green' | 'canary';

export type DnsPolicy = 'ClusterFirst' | 'ClusterFirstWithHostNet' | 'Default' | 'None';
export type AffinityType = 'none' | 'required' | 'preferred';
export type PodAntiAffinityScope = 'none' | 'preferred' | 'required';

export interface PodConfig {
  // Resource requests & limits
  cpuRequest: string;
  cpuLimit: string;
  memoryRequest: string;
  memoryLimit: string;

  // Node affinity
  nodeAffinity: AffinityType;
  nodeSelectorKey: string;
  nodeSelectorValue: string;

  // Pod anti-affinity (spread across nodes/zones)
  podAntiAffinity: PodAntiAffinityScope;
  topologyKey: string;

  // Networking
  hostNetwork: boolean;
  dnsPolicy: DnsPolicy;
}

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
  ingressController: IngressController;
  enableServiceMesh: boolean;

  // Security
  enableRbac: boolean;
  enableAzureAd: boolean;
  azureAdTenantId: string;
  enablePodIdentity: boolean;
  networkPolicy: 'None' | 'azure' | 'calico';
  autoUpgradeChannel: AutoUpgradeChannel;
  enableImageScanning: boolean;
  podSecurityAdmission: PodSecurityAdmissionLevel;

  // Monitoring
  enableContainerInsights: boolean;
  logAnalyticsWorkspaceId: string;
  enablePrometheus: boolean;
  enableAzureMonitor: boolean;
  enableAlerts: boolean;
  enableDiagnosticSettings: boolean;

  // Storage
  enablePersistentVolumes: boolean;
  storageClass: StorageClassType;
  enableStorageBackup: boolean;

  // Deployment
  deploymentStrategy: DeploymentStrategy;

  // Workload Requirements
  workloadConfig: WorkloadConfig;

  // Pods
  podConfig: PodConfig;

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
  ingressController: 'none',
  enableServiceMesh: false,

  enableRbac: true,
  enableAzureAd: false,
  azureAdTenantId: '',
  enablePodIdentity: false,
  networkPolicy: 'None',
  autoUpgradeChannel: 'patch',
  enableImageScanning: false,
  podSecurityAdmission: 'baseline',

  enableContainerInsights: true,
  logAnalyticsWorkspaceId: '',
  enablePrometheus: false,
  enableAzureMonitor: false,
  enableAlerts: false,
  enableDiagnosticSettings: false,

  enablePersistentVolumes: false,
  storageClass: 'default',
  enableStorageBackup: false,

  deploymentStrategy: 'rolling',

  workloadConfig: {
    workloadType: 'general',
    trafficLevel: 'medium',
    enableHpa: false,
    enableVpa: false,
    targetCpuUtilization: 70,
    targetMemoryUtilization: 80,
    enableMonitoringIntegration: false,
  },

  podConfig: {
    cpuRequest: '100m',
    cpuLimit: '500m',
    memoryRequest: '128Mi',
    memoryLimit: '512Mi',
    nodeAffinity: 'none',
    nodeSelectorKey: '',
    nodeSelectorValue: '',
    podAntiAffinity: 'none',
    topologyKey: 'kubernetes.io/hostname',
    hostNetwork: false,
    dnsPolicy: 'ClusterFirst',
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
  { id: 'pods', label: 'Pods' },
  { id: 'networking', label: 'Networking' },
  { id: 'security', label: 'Security' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'addons', label: 'Add-ons' },
  { id: 'storage', label: 'Storage' },
  { id: 'review', label: 'Review' },
  { id: 'templates', label: 'Templates' },
  { id: 'deploy', label: 'Deploy' },
  { id: 'github', label: 'GitHub' },
] as const;

export type StepId = (typeof STEPS)[number]['id'];
