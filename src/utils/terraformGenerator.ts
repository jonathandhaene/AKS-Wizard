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

  const autoUpgradeBlock = cfg.enableAutoUpgrade
    ? `
  automatic_channel_upgrade = "stable"`
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
output "kube_config" {
  value     = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive = true
}

output "cluster_endpoint" {
  value = azurerm_kubernetes_cluster.aks.kube_config[0].host
}
`;
}
