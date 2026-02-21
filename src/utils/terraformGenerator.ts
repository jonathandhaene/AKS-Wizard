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
` : ''}${cfg.multiRegion.enableMultiRegion && cfg.multiRegion.enableFrontDoor ? generateFrontDoorTerraform(cfg) : ''}${cfg.multiRegion.enableMultiRegion && cfg.multiRegion.enableApim ? generateApimTerraform(cfg) : ''}output "kube_config" {
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
