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

  const autoUpgrade = cfg.autoUpgradeChannel !== 'none'
    ? `
    autoUpgradeProfile: {
      upgradeChannel: '${cfg.autoUpgradeChannel}'
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
${cfg.enableAcrIntegration && cfg.containerRegistryName ? `
// Grant AcrPull role to the cluster managed identity
resource acrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(aksCluster.id, '7f951dda-4ed3-4680-a7ca-43fe172d538d')
  scope: resourceId('Microsoft.ContainerRegistry/registries', '${cfg.containerRegistryName}')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
    principalId: aksCluster.properties.identityProfile.kubeletIdentity.objectId
    principalType: 'ServicePrincipal'
  }
}
` : ''}${cfg.multiRegion.enableMultiRegion && cfg.multiRegion.enableFrontDoor ? generateFrontDoorBicep(cfg) : ''}${cfg.multiRegion.enableMultiRegion && cfg.multiRegion.enableApim ? generateApimBicep(cfg) : ''}`;

}

function generateFrontDoorBicep(cfg: import('../types/wizard').WizardConfig): string {
  const mr = cfg.multiRegion;
  const allRegions = [cfg.region, ...mr.secondaryRegions];
  const profileName = `${cfg.clusterName || 'aks'}-afd`;
  const wafPolicyName = `${(cfg.clusterName || 'aks').replace(/-/g, '')}afdwaf`;

  const wafPolicy = mr.enableWaf
    ? `
resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2022-05-01' = {
  name: '${wafPolicyName}'
  location: 'global'
  sku: {
    name: '${mr.frontDoorSkuName}'
  }
  properties: {
    policySettings: {
      enabledState: 'Enabled'
      mode: 'Prevention'
    }
    managedRules: {
      managedRuleSets: [${mr.frontDoorSkuName === 'Premium_AzureFrontDoor' ? `
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '2.1'
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.0'
        }` : ''}
      ]
    }
  }
}
`
    : '';

  const securityPolicy = mr.enableWaf
    ? `
  resource securityPolicy 'securityPolicies' = {
    name: 'security-policy'
    properties: {
      parameters: {
        type: 'WebApplicationFirewall'
        wafPolicy: {
          id: wafPolicy.id
        }
        associations: [
          {
            domains: [
              {
                id: frontDoorProfile::defaultEndpoint.id
              }
            ]
            patternsToMatch: [
              '/*'
            ]
          }
        ]
      }
    }
  }`
    : '';

  const healthProbeSettings = mr.enableHealthProbes
    ? `
        healthProbeSettings: {
          probePath: '/healthz'
          probeRequestType: 'HEAD'
          probeProtocol: 'Https'
          probeIntervalInSeconds: 30
        }`
    : '';

  return `
// ─── Azure Front Door ─────────────────────────────────────────────────────────
${wafPolicy}
resource frontDoorProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: '${profileName}'
  location: 'global'
  sku: {
    name: '${mr.frontDoorSkuName}'
  }
  tags: {
    Environment: 'Production'
    ManagedBy: 'AKS-Wizard'
  }

  resource defaultEndpoint 'afdEndpoints' = {
    name: '${profileName}-endpoint'
    location: 'global'
    properties: {
      enabledState: 'Enabled'
    }
  }

  resource originGroup 'originGroups' = {
    name: 'aks-origin-group'
    properties: {
      loadBalancingSettings: {
        sampleSize: 4
        successfulSamplesRequired: 3
        additionalLatencyInMilliseconds: 50
      }${healthProbeSettings}
    }

    resource origins 'origins' = [for origin in [${allRegions
      .map(
        (region, idx) => `
      // TODO: Replace hostName with the actual ingress controller IP/hostname for ${region}
      {
        name: 'aks-origin-${region}'
        hostName: 'replace-with-ingress-ip-${region}.nip.io'
        priority: ${idx + 1}
        weight: ${idx === 0 ? 1000 : 500}
      }`,
      )
      .join(',')}
    ]: {
      name: origin.name
      properties: {
        hostName: origin.hostName
        httpPort: 80
        httpsPort: 443
        originHostHeader: origin.hostName
        priority: origin.priority
        weight: origin.weight
        enabledState: 'Enabled'
      }
    }]
  }

  resource defaultRoute 'routes' = {
    name: 'default-route'
    properties: {
      endpointName: defaultEndpoint.name
      originGroup: {
        id: originGroup.id
      }
      supportedProtocols: ['Http', 'Https']
      patternsToMatch: ['/*']
      forwardingProtocol: 'HttpsOnly'
      httpsRedirect: 'Enabled'
      linkToDefaultDomain: 'Enabled'
    }
  }
${securityPolicy}
}

// Secondary region AKS clusters
${mr.secondaryRegions
  .map(
    (region) => `resource aksCluster_${region.replace(/-/g, '_')} 'Microsoft.ContainerService/managedClusters@2023-01-01' = {
  name: '${cfg.clusterName || 'aks'}-${region}'
  location: '${region}'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    kubernetesVersion: kubernetesVersion
    dnsPrefix: '${cfg.dnsPrefix || cfg.clusterName || 'my-aks'}-${region}'
    enableRBAC: ${cfg.enableRbac}
    agentPoolProfiles: [
      {
        name: '${cfg.systemNodePool.name}'
        mode: 'System'
        vmSize: systemNodeVmSize
        enableAutoScaling: ${cfg.systemNodePool.enableAutoScaling}
        ${cfg.systemNodePool.enableAutoScaling ? `minCount: ${cfg.systemNodePool.minNodes}\n        maxCount: ${cfg.systemNodePool.maxNodes}` : `count: ${cfg.systemNodePool.nodeCount}`}
        osType: 'Linux'
        type: 'VirtualMachineScaleSets'
      }
    ]
    networkProfile: {
      networkPlugin: '${cfg.networkPlugin}'
      loadBalancerSku: '${cfg.loadBalancerSku.toLowerCase()}'
      serviceCidr: '${cfg.serviceCidr}'
      dockerBridgeCidr: '${cfg.dockerBridgeCidr}'
    }
  }
  tags: {
    Environment: 'Production'
    ManagedBy: 'AKS-Wizard'
    Region: '${region}'
  }
}
`,
  )
  .join('')}
output frontDoorEndpointHostname string = frontDoorProfile::defaultEndpoint.properties.hostName
${mr.secondaryRegions.map((region) => `output clusterName_${region.replace(/-/g, '_')} string = aksCluster_${region.replace(/-/g, '_')}.name`).join('\n')}
`;
}

function generateApimBicep(cfg: import('../types/wizard').WizardConfig): string {
  const mr = cfg.multiRegion;
  const apimName = `${cfg.clusterName || 'aks'}-apim`;
  const capacityMap: Record<string, number> = { Developer: 1, BasicV2: 1, StandardV2: 1, PremiumV2: 1 };
  const capacity = capacityMap[mr.apimSkuName] ?? 1;
  const publisherEmail = mr.apimPublisherEmail || 'admin@contoso.com';

  return `
// ─── Azure API Management ─────────────────────────────────────────────────────
resource apimService 'Microsoft.ApiManagement/service@2024-05-01' = {
  name: '${apimName}'
  location: location
  sku: {
    name: '${mr.apimSkuName}'
    capacity: ${capacity}
  }
  properties: {
    publisherEmail: '${publisherEmail}'
    publisherName: '${cfg.clusterName || 'AKS-Wizard'}'
  }
  tags: {
    Environment: 'Production'
    ManagedBy: 'AKS-Wizard'
  }
}

output apimGatewayUrl string = apimService.properties.gatewayUrl
output apimPortalUrl string = apimService.properties.developerPortalUrl
`;
}
