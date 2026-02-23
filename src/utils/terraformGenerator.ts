import type { WizardConfig } from '../types/wizard';

export function generateTerraform(cfg: WizardConfig): string {
  const dnsPrefix = cfg.dnsPrefix || cfg.clusterName || 'my-aks';

  const autoScaleArgs = cfg.systemNodePool.enableAutoScaling
    ? `
    enable_auto_scaling = true
    min_count           = ${cfg.systemNodePool.minNodes}
    max_count           = ${cfg.systemNodePool.maxNodes}`
    : `
    enable_auto_scaling = false
    node_count          = ${cfg.systemNodePool.nodeCount}`;

  const networkBlock = `
  network_profile {
    network_plugin    = "${cfg.networkPlugin}"
    load_balancer_sku = "${cfg.loadBalancerSku.toLowerCase()}"
    service_cidr      = "${cfg.serviceCidr}"
    docker_bridge_cidr = "${cfg.dockerBridgeCidr}"${cfg.networkPolicy !== 'None' ? `\n    network_policy    = "${cfg.networkPolicy}"` : ''}
  }`;

  const rbacBlock = cfg.enableRbac
    ? `
  role_based_access_control_enabled = true`
    : '';

  const aadBlock = cfg.enableAzureAd && cfg.azureAdTenantId
    ? `
  azure_active_directory_role_based_access_control {
    managed            = true
    tenant_id          = "${cfg.azureAdTenantId}"
    azure_rbac_enabled = true
  }`
    : '';

  const autoUpgradeBlock = cfg.autoUpgradeChannel !== 'none'
    ? `
  automatic_channel_upgrade = "${cfg.autoUpgradeChannel}"`
    : '';

  const omsBlock = cfg.enableContainerInsights
    ? `
  oms_agent {
    log_analytics_workspace_id = ${cfg.logAnalyticsWorkspaceId ? `"${cfg.logAnalyticsWorkspaceId}"` : 'azurerm_log_analytics_workspace.aks_law.id'}
  }`
    : '';

  const keyVaultBlock = cfg.enableKeyVaultProvider
    ? `
  key_vault_secrets_provider {
    secret_rotation_enabled = true
  }`
    : '';

  const ingressBlock = cfg.enableHttpApplicationRouting
    ? `
  http_application_routing_enabled = true`
    : '';

  const azurePolicyBlock = cfg.enableAzurePolicy
    ? `
  azure_policy_enabled = true`
    : '';

  const workspaceResource = cfg.enableContainerInsights && !cfg.logAnalyticsWorkspaceId
    ? `
resource "azurerm_log_analytics_workspace" "aks_law" {
  name                = "${cfg.clusterName}-law"
  location            = azurerm_resource_group.aks_rg.location
  resource_group_name = azurerm_resource_group.aks_rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}
`
    : '';

  const userPoolResources = cfg.userNodePools
    .map(
      (pool, idx) => `
resource "azurerm_kubernetes_cluster_node_pool" "user_${idx + 1}" {
  kubernetes_cluster_id = azurerm_kubernetes_cluster.aks.id
  name                  = "${pool.name}"
  vm_size               = "${pool.vmSize}"
  mode                  = "User"${
    pool.enableAutoScaling
      ? `
  enable_auto_scaling   = true
  min_count             = ${pool.minNodes}
  max_count             = ${pool.maxNodes}`
      : `
  enable_auto_scaling   = false
  node_count            = ${pool.nodeCount}`
  }
}
`,
    )
    .join('');

  return `terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = "${cfg.subscriptionId}"
}

resource "azurerm_resource_group" "aks_rg" {
  name     = "${cfg.resourceGroupName}"
  location = "${cfg.region}"
}
${workspaceResource}
resource "azurerm_kubernetes_cluster" "aks" {
  name                = "${cfg.clusterName}"
  location            = azurerm_resource_group.aks_rg.location
  resource_group_name = azurerm_resource_group.aks_rg.name
  dns_prefix          = "${dnsPrefix}"
  kubernetes_version  = "${cfg.kubernetesVersion}"${rbacBlock}${autoUpgradeBlock}${ingressBlock}${azurePolicyBlock}

  default_node_pool {
    name    = "${cfg.systemNodePool.name}"
    vm_size = "${cfg.systemNodePool.vmSize}"${autoScaleArgs}
  }

  identity {
    type = "SystemAssigned"
  }
${networkBlock}
${omsBlock}${keyVaultBlock}

  tags = {
    Environment = "Production"
    ManagedBy   = "AKS-Wizard"
  }
}
${aadBlock ? `\n# Azure AD RBAC\n${aadBlock.trim()}` : ''}
${userPoolResources}
${cfg.enableAcrIntegration && cfg.containerRegistryName ? `# Grant AcrPull role to the cluster's kubelet identity
resource "azurerm_role_assignment" "acr_pull" {
  principal_id                     = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = "/subscriptions/${cfg.subscriptionId}/resourceGroups/${cfg.resourceGroupName}/providers/Microsoft.ContainerRegistry/registries/${cfg.containerRegistryName}"
  skip_service_principal_aad_check = true
}
` : ''}${cfg.multiRegion.enableMultiRegion && cfg.multiRegion.enableFrontDoor ? generateFrontDoorTerraform(cfg) : ''}${cfg.multiRegion.enableMultiRegion && cfg.multiRegion.enableApim ? generateApimTerraform(cfg) : ''}${cfg.hubSpoke.enableHubSpoke ? generateHubSpokeTerraform(cfg) : ''}output "kube_config" {
  value     = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive = true
}

output "cluster_endpoint" {
  value = azurerm_kubernetes_cluster.aks.kube_config[0].host
}
`;
}

function generateFrontDoorTerraform(cfg: WizardConfig): string {
  const mr = cfg.multiRegion;
  const profileName = `${cfg.clusterName || 'aks'}-afd`;
  const allRegions = [cfg.region, ...mr.secondaryRegions];

  const wafResources = mr.enableWaf
    ? `
# Web Application Firewall Policy
resource "azurerm_cdn_frontdoor_firewall_policy" "waf" {
  name                              = "${profileName.replace(/-/g, '')}waf"
  resource_group_name               = azurerm_resource_group.aks_rg.name
  sku_name                          = "${mr.frontDoorSkuName}"
  enabled                           = true
  mode                              = "Prevention"
${
  mr.frontDoorSkuName === 'Premium_AzureFrontDoor'
    ? `
  managed_rule {
    type    = "Microsoft_DefaultRuleSet"
    version = "2.1"
    action  = "Block"
  }

  managed_rule {
    type    = "Microsoft_BotManagerRuleSet"
    version = "1.0"
    action  = "Block"
  }
`
    : ''
}}
`
    : '';

  const secondaryClusterResources = mr.secondaryRegions
    .map(
      (region) => `
# Secondary AKS cluster — ${region}
resource "azurerm_resource_group" "aks_rg_${region.replace(/-/g, '_')}" {
  name     = "${cfg.resourceGroupName}-${region}"
  location = "${region}"
}

resource "azurerm_kubernetes_cluster" "aks_${region.replace(/-/g, '_')}" {
  name                = "${cfg.clusterName || 'aks'}-${region}"
  location            = azurerm_resource_group.aks_rg_${region.replace(/-/g, '_')}.location
  resource_group_name = azurerm_resource_group.aks_rg_${region.replace(/-/g, '_')}.name
  dns_prefix          = "${cfg.dnsPrefix || cfg.clusterName || 'my-aks'}-${region}"
  kubernetes_version  = "${cfg.kubernetesVersion}"

  default_node_pool {
    name    = "${cfg.systemNodePool.name}"
    vm_size = "${cfg.systemNodePool.vmSize}"${
      cfg.systemNodePool.enableAutoScaling
        ? `
    enable_auto_scaling = true
    min_count           = ${cfg.systemNodePool.minNodes}
    max_count           = ${cfg.systemNodePool.maxNodes}`
        : `
    enable_auto_scaling = false
    node_count          = ${cfg.systemNodePool.nodeCount}`
    }
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = "Production"
    ManagedBy   = "AKS-Wizard"
    Region      = "${region}"
  }
}

output "cluster_endpoint_${region.replace(/-/g, '_')}" {
  value = azurerm_kubernetes_cluster.aks_${region.replace(/-/g, '_')}.kube_config[0].host
}
`,
    )
    .join('');

  const originsBlock = allRegions
    .map(
      (region, idx) => `
# TODO: Replace host_name and origin_host_header with the actual ingress controller IP/hostname for ${region}
resource "azurerm_cdn_frontdoor_origin" "aks_${region.replace(/-/g, '_')}" {
  name                          = "aks-origin-${region}"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.aks_origins.id
  enabled                       = true
  host_name                     = "replace-with-ingress-ip-${region}.nip.io"
  http_port                     = 80
  https_port                    = 443
  origin_host_header            = "replace-with-ingress-ip-${region}.nip.io"
  priority                      = ${idx + 1}
  weight                        = ${idx === 0 ? 1000 : 500}
}
`,
    )
    .join('');

  const healthProbeBlock = mr.enableHealthProbes
    ? `
  health_probe {
    interval_in_seconds = 30
    path                = "/healthz"
    protocol            = "Https"
    request_type        = "HEAD"
  }
`
    : '';

  const securityPolicyBlock = mr.enableWaf
    ? `
resource "azurerm_cdn_frontdoor_security_policy" "waf_policy" {
  name                     = "waf-security-policy"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.afd.id

  security_policies {
    firewall {
      cdn_frontdoor_firewall_policy_id = azurerm_cdn_frontdoor_firewall_policy.waf.id

      association {
        domain {
          cdn_frontdoor_domain_id = azurerm_cdn_frontdoor_endpoint.afd_endpoint.id
        }
        patterns_to_match = ["/*"]
      }
    }
  }
}
`
    : '';

  return `
# ─── Azure Front Door ──────────────────────────────────────────────────────────
resource "azurerm_cdn_frontdoor_profile" "afd" {
  name                = "${profileName}"
  resource_group_name = azurerm_resource_group.aks_rg.name
  sku_name            = "${mr.frontDoorSkuName}"

  tags = {
    Environment = "Production"
    ManagedBy   = "AKS-Wizard"
  }
}

resource "azurerm_cdn_frontdoor_endpoint" "afd_endpoint" {
  name                     = "${profileName}-endpoint"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.afd.id
  enabled                  = true
}

resource "azurerm_cdn_frontdoor_origin_group" "aks_origins" {
  name                     = "aks-origin-group"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.afd.id

  load_balancing {
    sample_size                        = 4
    successful_samples_required        = 3
    additional_latency_in_milliseconds = 50
  }
${healthProbeBlock}}
${originsBlock}
resource "azurerm_cdn_frontdoor_route" "default_route" {
  name                          = "default-route"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.afd_endpoint.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.aks_origins.id
  cdn_frontdoor_origin_ids      = [${allRegions.map((r) => `azurerm_cdn_frontdoor_origin.aks_${r.replace(/-/g, '_')}.id`).join(', ')}]
  enabled                       = true
  forwarding_protocol           = "HttpsOnly"
  https_redirect_enabled        = true
  patterns_to_match             = ["/*"]
  supported_protocols           = ["Http", "Https"]
  link_to_default_domain        = true
}
${wafResources}${securityPolicyBlock}
output "frontdoor_endpoint" {
  value = azurerm_cdn_frontdoor_endpoint.afd_endpoint.host_name
}
${secondaryClusterResources}
`;
}

function generateApimTerraform(cfg: WizardConfig): string {
  const mr = cfg.multiRegion;
  const apimName = `${cfg.clusterName || 'aks'}-apim`;
  const skuName = `${mr.apimSkuName}_1`;
  const publisherEmail = mr.apimPublisherEmail || 'admin@contoso.com';

  return `
# ─── Azure API Management ──────────────────────────────────────────────────────
resource "azurerm_api_management" "apim" {
  name                = "${apimName}"
  location            = azurerm_resource_group.aks_rg.location
  resource_group_name = azurerm_resource_group.aks_rg.name
  publisher_name      = "${cfg.clusterName || 'AKS-Wizard'}"
  publisher_email     = "${publisherEmail}"
  sku_name            = "${skuName}"

  tags = {
    Environment = "Production"
    ManagedBy   = "AKS-Wizard"
  }
}

output "apim_gateway_url" {
  value = azurerm_api_management.apim.gateway_url
}

output "apim_portal_url" {
  value = azurerm_api_management.apim.developer_portal_url
}
`;
}

function generateHubSpokeTerraform(cfg: WizardConfig): string {
  const hs = cfg.hubSpoke;
  const clusterBase = cfg.clusterName || 'aks';

  // Carve non-overlapping subnets by offsetting the last two octets of the base IP.
  function carveSubnet(baseCidr: string, offset: number, prefixLen: number): string {
    const [ip] = baseCidr.split('/');
    const parts = ip.split('.').map(Number);
    parts[3] += offset;
    if (parts[3] >= 256) { parts[2] += Math.floor(parts[3] / 256); parts[3] %= 256; }
    return `${parts.join('.')}/${prefixLen}`;
  }

  // AzureFirewallSubnet and AzureBastionSubnet both require /26 minimum;
  // GatewaySubnet requires /27 minimum.
  // Carve them at offset 0 (/26), offset 64 (/26), and offset 128 (/27) so they never overlap.
  const fwSubnetCidr = carveSubnet(hs.hubVnetCidr, 0, 26);
  const bastionSubnetCidr = carveSubnet(hs.hubVnetCidr, 64, 26);
  const gatewaySubnetCidr = carveSubnet(hs.hubVnetCidr, 128, 27);

  const hubVnetBlock = hs.hubMode === 'new'
    ? `
# ─── Hub VNet ──────────────────────────────────────────────────────────────────
resource "azurerm_virtual_network" "hub_vnet" {
  name                = "${clusterBase}-hub-vnet"
  location            = azurerm_resource_group.aks_rg.location
  resource_group_name = azurerm_resource_group.aks_rg.name
  address_space       = ["${hs.hubVnetCidr}"]

  tags = {
    Environment = "Production"
    ManagedBy   = "AKS-Wizard"
    Role        = "Hub"
  }
}
${hs.enableAzureFirewall ? `
resource "azurerm_subnet" "hub_firewall_subnet" {
  name                 = "AzureFirewallSubnet"
  resource_group_name  = azurerm_resource_group.aks_rg.name
  virtual_network_name = azurerm_virtual_network.hub_vnet.name
  address_prefixes     = ["${fwSubnetCidr}"]
}
` : ''}${hs.enableBastion ? `
resource "azurerm_subnet" "hub_bastion_subnet" {
  name                 = "AzureBastionSubnet"
  resource_group_name  = azurerm_resource_group.aks_rg.name
  virtual_network_name = azurerm_virtual_network.hub_vnet.name
  address_prefixes     = ["${bastionSubnetCidr}"]
}
` : ''}${hs.enableVpnGateway ? `
resource "azurerm_subnet" "hub_gateway_subnet" {
  name                 = "GatewaySubnet"
  resource_group_name  = azurerm_resource_group.aks_rg.name
  virtual_network_name = azurerm_virtual_network.hub_vnet.name
  address_prefixes     = ["${gatewaySubnetCidr}"]
}
` : ''}`
    : `# Hub VNet is pre-existing — set this local to its resource ID
locals {
  hub_vnet_id = "${hs.existingHubVnetId}"
}
`;

  const firewallBlock = hs.hubMode === 'new' && hs.enableAzureFirewall
    ? `
# ─── Azure Firewall ────────────────────────────────────────────────────────────
resource "azurerm_public_ip" "fw_pip" {
  name                = "${clusterBase}-fw-pip"
  location            = azurerm_resource_group.aks_rg.location
  resource_group_name = azurerm_resource_group.aks_rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = { ManagedBy = "AKS-Wizard" }
}

resource "azurerm_firewall" "hub_fw" {
  name                = "${clusterBase}-hub-fw"
  location            = azurerm_resource_group.aks_rg.location
  resource_group_name = azurerm_resource_group.aks_rg.name
  sku_name            = "AZFW_VNet"
  sku_tier            = "Premium"

  ip_configuration {
    name                 = "ipconfig"
    subnet_id            = azurerm_subnet.hub_firewall_subnet.id
    public_ip_address_id = azurerm_public_ip.fw_pip.id
  }

  tags = { ManagedBy = "AKS-Wizard" }
}

output "firewall_private_ip" {
  value = azurerm_firewall.hub_fw.ip_configuration[0].private_ip_address
}
`
    : '';

  const bastionBlock = hs.hubMode === 'new' && hs.enableBastion
    ? `
# ─── Azure Bastion ─────────────────────────────────────────────────────────────
resource "azurerm_public_ip" "bastion_pip" {
  name                = "${clusterBase}-bastion-pip"
  location            = azurerm_resource_group.aks_rg.location
  resource_group_name = azurerm_resource_group.aks_rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = { ManagedBy = "AKS-Wizard" }
}

resource "azurerm_bastion_host" "hub_bastion" {
  name                = "${clusterBase}-hub-bastion"
  location            = azurerm_resource_group.aks_rg.location
  resource_group_name = azurerm_resource_group.aks_rg.name

  ip_configuration {
    name                 = "ipconfig"
    subnet_id            = azurerm_subnet.hub_bastion_subnet.id
    public_ip_address_id = azurerm_public_ip.bastion_pip.id
  }

  tags = { ManagedBy = "AKS-Wizard" }
}
`
    : '';

  const udrBlock = hs.enableAzureFirewall && hs.enableEgressViaFirewall
    ? `
# ─── UDR: route AKS egress through Azure Firewall ─────────────────────────────
resource "azurerm_route_table" "aks_udr" {
  name                          = "${clusterBase}-spoke-udr"
  location                      = azurerm_resource_group.aks_rg.location
  resource_group_name           = azurerm_resource_group.aks_rg.name
  disable_bgp_route_propagation = true
  tags                          = { ManagedBy = "AKS-Wizard" }

  route {
    name                   = "route-to-firewall"
    address_prefix         = "0.0.0.0/0"
    next_hop_type          = "VirtualAppliance"
    next_hop_in_ip_address = ${hs.hubMode === 'new' ? 'azurerm_firewall.hub_fw.ip_configuration[0].private_ip_address' : '"<firewall-private-ip>"'}
  }
}

resource "azurerm_subnet_route_table_association" "aks_subnet_udr" {
  subnet_id      = azurerm_subnet.aks_subnet.id
  route_table_id = azurerm_route_table.aks_udr.id
}
`
    : '';

  const vpnGatewayBlock = hs.hubMode === 'new' && hs.enableVpnGateway
    ? `
# ─── VPN Gateway ───────────────────────────────────────────────────────────────
resource "azurerm_public_ip" "vpngw_pip" {
  name                = "${clusterBase}-vpngw-pip"
  location            = azurerm_resource_group.aks_rg.location
  resource_group_name = azurerm_resource_group.aks_rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = { ManagedBy = "AKS-Wizard" }
}

resource "azurerm_virtual_network_gateway" "hub_vpngw" {
  name                = "${clusterBase}-hub-vpngw"
  location            = azurerm_resource_group.aks_rg.location
  resource_group_name = azurerm_resource_group.aks_rg.name
  type                = "Vpn"
  vpn_type            = "RouteBased"
  sku                 = "VpnGw1"

  ip_configuration {
    name                          = "ipconfig"
    subnet_id                     = azurerm_subnet.hub_gateway_subnet.id
    public_ip_address_id          = azurerm_public_ip.vpngw_pip.id
  }

  tags = { ManagedBy = "AKS-Wizard" }
}
`
    : '';

  const privateDnsBlock = hs.enablePrivateCluster
    ? `
# ─── Private DNS Zone (for private AKS API server) ─────────────────────────────
resource "azurerm_private_dns_zone" "aks_private_dns" {
  name                = "privatelink.${cfg.region}.azmk8s.io"
  resource_group_name = azurerm_resource_group.aks_rg.name
  tags                = { ManagedBy = "AKS-Wizard" }
}

resource "azurerm_private_dns_zone_virtual_network_link" "hub_vnet_link" {
  name                  = "hub-vnet-link"
  resource_group_name   = azurerm_resource_group.aks_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.aks_private_dns.name
  virtual_network_id    = ${hs.hubMode === 'new' ? 'azurerm_virtual_network.hub_vnet.id' : 'local.hub_vnet_id'}
  registration_enabled  = false
  tags                  = { ManagedBy = "AKS-Wizard" }
}

resource "azurerm_private_dns_zone_virtual_network_link" "spoke_vnet_link" {
  name                  = "spoke-vnet-link"
  resource_group_name   = azurerm_resource_group.aks_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.aks_private_dns.name
  virtual_network_id    = azurerm_virtual_network.spoke_vnet.id
  registration_enabled  = false
  tags                  = { ManagedBy = "AKS-Wizard" }
}
`
    : '';

  const hubVnetRef = hs.hubMode === 'new'
    ? 'azurerm_virtual_network.hub_vnet.id'
    : 'local.hub_vnet_id';

  return `
# ═══════════════════════════════════════════════════════════════════════════════
# Hub-Spoke Networking
# ═══════════════════════════════════════════════════════════════════════════════
${hubVnetBlock}
# ─── Spoke VNet ────────────────────────────────────────────────────────────────
resource "azurerm_virtual_network" "spoke_vnet" {
  name                = "${clusterBase}-spoke-vnet"
  location            = azurerm_resource_group.aks_rg.location
  resource_group_name = azurerm_resource_group.aks_rg.name
  address_space       = ["${hs.spokeVnetCidr}"]

  tags = {
    Environment = "Production"
    ManagedBy   = "AKS-Wizard"
    Role        = "Spoke"
  }
}

resource "azurerm_subnet" "aks_subnet" {
  name                 = "aks-subnet"
  resource_group_name  = azurerm_resource_group.aks_rg.name
  virtual_network_name = azurerm_virtual_network.spoke_vnet.name
  address_prefixes     = ["${hs.aksSubnetCidr}"]
}

# ─── VNet Peerings ─────────────────────────────────────────────────────────────
resource "azurerm_virtual_network_peering" "hub_to_spoke" {
  name                      = "hub-to-spoke"
  resource_group_name       = azurerm_resource_group.aks_rg.name
  virtual_network_name      = ${hs.hubMode === 'new' ? 'azurerm_virtual_network.hub_vnet.name' : '"<hub-vnet-name>"'}
  remote_virtual_network_id = azurerm_virtual_network.spoke_vnet.id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  allow_gateway_transit        = ${hs.enableVpnGateway ? 'true' : 'false'}
}

resource "azurerm_virtual_network_peering" "spoke_to_hub" {
  name                      = "spoke-to-hub"
  resource_group_name       = azurerm_resource_group.aks_rg.name
  virtual_network_name      = azurerm_virtual_network.spoke_vnet.name
  remote_virtual_network_id = ${hubVnetRef}
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  use_remote_gateways          = ${hs.enableVpnGateway ? 'true' : 'false'}
}
${udrBlock}${firewallBlock}${bastionBlock}${vpnGatewayBlock}${privateDnsBlock}
output "spoke_vnet_id" {
  value = azurerm_virtual_network.spoke_vnet.id
}

output "aks_subnet_id" {
  value = azurerm_subnet.aks_subnet.id
}
`;
}
