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
` : ''}${cfg.multiRegion.enableMultiRegion && cfg.multiRegion.enableFrontDoor ? generateFrontDoorBicep(cfg) : ''}${cfg.multiRegion.enableMultiRegion && cfg.multiRegion.enableApim ? generateApimBicep(cfg) : ''}${cfg.hubSpoke.enableHubSpoke ? generateHubSpokeBicep(cfg) : ''}`;

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

function generateHubSpokeBicep(cfg: import('../types/wizard').WizardConfig): string {
  const hs = cfg.hubSpoke;
  const clusterBase = cfg.clusterName || 'aks';

  // Carve a subnet by offsetting the last two octets of the base IP.
  // offset is added to the 4th octet (with carry into the 3rd).
  function carveSubnet(baseCidr: string, offset: number, prefixLen: number): string {
    const [ip] = baseCidr.split('/');
    const parts = ip.split('.').map(Number);
    parts[3] += offset;
    if (parts[3] >= 256) { parts[2] += Math.floor(parts[3] / 256); parts[3] %= 256; }
    return `${parts.join('.')}/${prefixLen}`;
  }

  // AzureFirewallSubnet requires /26 minimum; AzureBastionSubnet requires /26 minimum;
  // GatewaySubnet requires /27 minimum.
  // We carve them at offset 0 (/26), offset 64 (/26), and offset 128 (/27) respectively.
  const fwSubnetCidr = carveSubnet(hs.hubVnetCidr, 0, 26);
  const bastionSubnetCidr = carveSubnet(hs.hubVnetCidr, 64, 26);
  const gatewaySubnetCidr = carveSubnet(hs.hubVnetCidr, 128, 27);

  const hubVnetBlock = hs.hubMode === 'new'
    ? `
// ─── Hub VNet ─────────────────────────────────────────────────────────────────
resource hubVnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: '${clusterBase}-hub-vnet'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: ['${hs.hubVnetCidr}']
    }
    subnets: [${hs.enableAzureFirewall ? `
      {
        name: 'AzureFirewallSubnet'
        properties: {
          addressPrefix: '${fwSubnetCidr}'
        }
      }` : ''}${hs.enableBastion ? `
      {
        name: 'AzureBastionSubnet'
        properties: {
          addressPrefix: '${bastionSubnetCidr}'
        }
      }` : ''}${hs.enableVpnGateway ? `
      {
        name: 'GatewaySubnet'
        properties: {
          addressPrefix: '${gatewaySubnetCidr}'
        }
      }` : ''}
    ]
  }
  tags: {
    Environment: 'Production'
    ManagedBy: 'AKS-Wizard'
    Role: 'Hub'
  }
}
`
    : `// Hub VNet is an existing resource — reference it by resource ID
var hubVnetId = '${hs.existingHubVnetId}'
`;

  const firewallBlock = hs.hubMode === 'new' && hs.enableAzureFirewall
    ? `
// ─── Azure Firewall ───────────────────────────────────────────────────────────
resource firewallPublicIp 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: '${clusterBase}-fw-pip'
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
  }
  tags: {
    ManagedBy: 'AKS-Wizard'
  }
}

resource firewall 'Microsoft.Network/azureFirewalls@2023-05-01' = {
  name: '${clusterBase}-hub-fw'
  location: location
  properties: {
    sku: {
      name: 'AZFW_VNet'
      tier: 'Premium'
    }
    ipConfigurations: [
      {
        name: 'ipconfig'
        properties: {
          subnet: {
            id: resourceId('Microsoft.Network/virtualNetworks/subnets', hubVnet.name, 'AzureFirewallSubnet')
          }
          publicIPAddress: {
            id: firewallPublicIp.id
          }
        }
      }
    ]
  }
  tags: {
    ManagedBy: 'AKS-Wizard'
  }
}

output firewallPrivateIp string = firewall.properties.ipConfigurations[0].properties.privateIPAddress
`
    : '';

  const bastionBlock = hs.hubMode === 'new' && hs.enableBastion
    ? `
// ─── Azure Bastion ────────────────────────────────────────────────────────────
resource bastionPublicIp 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: '${clusterBase}-bastion-pip'
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
  }
  tags: {
    ManagedBy: 'AKS-Wizard'
  }
}

resource bastion 'Microsoft.Network/bastionHosts@2023-05-01' = {
  name: '${clusterBase}-hub-bastion'
  location: location
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig'
        properties: {
          subnet: {
            id: resourceId('Microsoft.Network/virtualNetworks/subnets', hubVnet.name, 'AzureBastionSubnet')
          }
          publicIPAddress: {
            id: bastionPublicIp.id
          }
        }
      }
    ]
  }
  tags: {
    ManagedBy: 'AKS-Wizard'
  }
}
`
    : '';

  const udrBlock = hs.enableAzureFirewall && hs.enableEgressViaFirewall
    ? `
// ─── UDR: Route AKS egress through Azure Firewall ────────────────────────────
resource aksRouteTable 'Microsoft.Network/routeTables@2023-05-01' = {
  name: '${clusterBase}-spoke-udr'
  location: location
  properties: {
    routes: [
      {
        name: 'route-to-firewall'
        properties: {
          addressPrefix: '0.0.0.0/0'
          nextHopType: 'VirtualAppliance'
          nextHopIpAddress: ${hs.hubMode === 'new' ? 'firewall.properties.ipConfigurations[0].properties.privateIPAddress' : "'<firewall-private-ip>'"}
        }
      }
    ]
    disableBgpRoutePropagation: true
  }
  tags: {
    ManagedBy: 'AKS-Wizard'
  }
}
`
    : '';

  const vpnGatewayBlock = hs.hubMode === 'new' && hs.enableVpnGateway
    ? `
// ─── VPN Gateway ──────────────────────────────────────────────────────────────
resource vpnGatewayPublicIp 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: '${clusterBase}-vpngw-pip'
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
  }
  tags: {
    ManagedBy: 'AKS-Wizard'
  }
}

resource vpnGateway 'Microsoft.Network/virtualNetworkGateways@2023-05-01' = {
  name: '${clusterBase}-hub-vpngw'
  location: location
  properties: {
    gatewayType: 'Vpn'
    vpnType: 'RouteBased'
    sku: {
      name: 'VpnGw1'
      tier: 'VpnGw1'
    }
    ipConfigurations: [
      {
        name: 'ipconfig'
        properties: {
          subnet: {
            id: resourceId('Microsoft.Network/virtualNetworks/subnets', hubVnet.name, 'GatewaySubnet')
          }
          publicIPAddress: {
            id: vpnGatewayPublicIp.id
          }
        }
      }
    ]
  }
  tags: {
    ManagedBy: 'AKS-Wizard'
  }
}
`
    : '';

  const privateDnsBlock = hs.enablePrivateCluster
    ? `
// ─── Private DNS Zone (for private AKS API server) ───────────────────────────
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.${cfg.region}.azmk8s.io'
  location: 'global'
  tags: {
    ManagedBy: 'AKS-Wizard'
  }
}

resource privateDnsZoneHubLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: 'hub-vnet-link'
  location: 'global'
  properties: {
    virtualNetwork: {
      id: ${hs.hubMode === 'new' ? 'hubVnet.id' : 'hubVnetId'}
    }
    registrationEnabled: false
  }
}

resource privateDnsZoneSpokeLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: 'spoke-vnet-link'
  location: 'global'
  properties: {
    virtualNetwork: {
      id: spokeVnet.id
    }
    registrationEnabled: false
  }
}
`
    : '';

  const hubVnetRef = hs.hubMode === 'new' ? 'hubVnet.id' : 'hubVnetId';

  return `
// ═══════════════════════════════════════════════════════════════════════════════
// Hub-Spoke Networking
// ═══════════════════════════════════════════════════════════════════════════════
${hubVnetBlock}
// ─── Spoke VNet ───────────────────────────────────────────────────────────────
resource spokeVnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: '${clusterBase}-spoke-vnet'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: ['${hs.spokeVnetCidr}']
    }
    subnets: [
      {
        name: 'aks-subnet'
        properties: {
          addressPrefix: '${hs.aksSubnetCidr}'${hs.enableAzureFirewall && hs.enableEgressViaFirewall ? `
          routeTable: {
            id: aksRouteTable.id
          }` : ''}
        }
      }
    ]
  }
  tags: {
    Environment: 'Production'
    ManagedBy: 'AKS-Wizard'
    Role: 'Spoke'
  }
}

// ─── VNet Peerings ────────────────────────────────────────────────────────────
resource hubToSpokePeering 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2023-05-01' = {
  name: '${hs.hubMode === 'new' ? `\${hubVnet.name}/hub-to-spoke` : 'hub-to-spoke'}'
  properties: {
    remoteVirtualNetwork: {
      id: spokeVnet.id
    }
    allowVirtualNetworkAccess: true
    allowForwardedTraffic: true
    allowGatewayTransit: ${hs.enableVpnGateway ? 'true' : 'false'}
  }
}

resource spokeToHubPeering 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2023-05-01' = {
  name: '\${spokeVnet.name}/spoke-to-hub'
  properties: {
    remoteVirtualNetwork: {
      id: ${hubVnetRef}
    }
    allowVirtualNetworkAccess: true
    allowForwardedTraffic: true
    useRemoteGateways: ${hs.enableVpnGateway ? 'true' : 'false'}
  }
}
${udrBlock}${firewallBlock}${bastionBlock}${vpnGatewayBlock}${privateDnsBlock}
output spokeVnetId string = spokeVnet.id
output aksSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', spokeVnet.name, 'aks-subnet')
`;
}
