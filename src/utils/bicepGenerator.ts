import type { WizardConfig } from '../types/wizard';

export function generateBicep(cfg: WizardConfig): string {
  const dnsPrefix = cfg.dnsPrefix || cfg.clusterName || 'my-aks';

  const agentPoolAutoScale = cfg.systemNodePool.enableAutoScaling
    ? `
      enableAutoScaling: true
      minCount: ${cfg.systemNodePool.minNodes}
      maxCount: ${cfg.systemNodePool.maxNodes}`
    : `
      enableAutoScaling: false
      count: ${cfg.systemNodePool.nodeCount}`;

  const networkPolicyLine = cfg.networkPolicy !== 'None'
    ? `\n      networkPolicy: '${cfg.networkPolicy}'`
    : '';

  const containerInsightsAddon = cfg.enableContainerInsights
    ? `
      omsagent: {
        enabled: true
        config: {
          logAnalyticsWorkspaceResourceID: ${cfg.logAnalyticsWorkspaceId ? `'${cfg.logAnalyticsWorkspaceId}'` : 'logAnalyticsWorkspace.id'}
        }
      }`
    : '';

  const httpRoutingAddon = cfg.enableHttpApplicationRouting
    ? `
      httpApplicationRouting: {
        enabled: true
      }`
    : '';

  const azurePolicyAddon = cfg.enableAzurePolicy
    ? `
      azurepolicy: {
        enabled: true
      }`
    : '';

  const addonsBlock =
    cfg.enableContainerInsights || cfg.enableHttpApplicationRouting || cfg.enableAzurePolicy
      ? `
    addonProfiles: {${containerInsightsAddon}${httpRoutingAddon}${azurePolicyAddon}
    }`
      : '';

  const aadProfile = cfg.enableAzureAd && cfg.azureAdTenantId
    ? `
    aadProfile: {
      managed: true
      tenantID: tenantId
      enableAzureRBAC: true
    }`
    : '';

  const autoUpgrade = cfg.enableAutoUpgrade
    ? `
    autoUpgradeProfile: {
      upgradeChannel: 'stable'
    }`
    : '';

  const workspaceResource = cfg.enableContainerInsights && !cfg.logAnalyticsWorkspaceId
    ? `
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${cfg.clusterName}-law'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}
`
    : '';

  const tenantIdParam = cfg.enableAzureAd
    ? `\n@description('Azure AD tenant ID')\nparam tenantId string = '${cfg.azureAdTenantId}'`
    : '';

  return `@description('The name of the AKS cluster')
param clusterName string = '${cfg.clusterName}'

@description('The Azure region for deployment')
param location string = '${cfg.region}'

@description('DNS prefix for the cluster')
param dnsPrefix string = '${dnsPrefix}'

@description('Kubernetes version')
param kubernetesVersion string = '${cfg.kubernetesVersion}'

@description('VM size for system node pool')
param systemNodeVmSize string = '${cfg.systemNodePool.vmSize}'${tenantIdParam}
${workspaceResource}
resource aksCluster 'Microsoft.ContainerService/managedClusters@2023-01-01' = {
  name: clusterName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    kubernetesVersion: kubernetesVersion
    dnsPrefix: dnsPrefix
    enableRBAC: ${cfg.enableRbac}${autoUpgrade}${aadProfile}
    agentPoolProfiles: [
      {
        name: '${cfg.systemNodePool.name}'
        mode: 'System'
        vmSize: systemNodeVmSize${agentPoolAutoScale}
        osType: 'Linux'
        type: 'VirtualMachineScaleSets'
      }${cfg.userNodePools
        .map(
          (pool) => `
      {
        name: '${pool.name}'
        mode: 'User'
        vmSize: '${pool.vmSize}'${
    pool.enableAutoScaling
      ? `
        enableAutoScaling: true
        minCount: ${pool.minNodes}
        maxCount: ${pool.maxNodes}`
      : `
        enableAutoScaling: false
        count: ${pool.nodeCount}`
  }
        osType: 'Linux'
        type: 'VirtualMachineScaleSets'
      }`,
        )
        .join('')}
    ]
    networkProfile: {
      networkPlugin: '${cfg.networkPlugin}'
      loadBalancerSku: '${cfg.loadBalancerSku.toLowerCase()}'
      serviceCidr: '${cfg.serviceCidr}'
      dockerBridgeCidr: '${cfg.dockerBridgeCidr}'${networkPolicyLine}
    }${addonsBlock}
  }
  tags: {
    Environment: 'Production'
    ManagedBy: 'AKS-Wizard'
  }
}

output clusterName string = aksCluster.name
output controlPlaneFQDN string = aksCluster.properties.fqdn
`;
}
