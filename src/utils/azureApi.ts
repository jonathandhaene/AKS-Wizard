// Azure API utilities - stub for browser-based interactions
// In production, these would connect to an Azure Functions backend

export interface DeploymentStep {
  id: string;
  label: string;
  durationMs: number;
}

export const DEPLOYMENT_STEPS: DeploymentStep[] = [
  { id: 'validate', label: 'Validating Azure credentials...', durationMs: 1200 },
  { id: 'rg', label: 'Creating Resource Group...', durationMs: 1500 },
  { id: 'law', label: 'Provisioning Log Analytics Workspace...', durationMs: 2000 },
  { id: 'aks_init', label: 'Initiating AKS cluster deployment...', durationMs: 1000 },
  { id: 'control_plane', label: 'Provisioning control plane (this takes a few minutes)...', durationMs: 4000 },
  { id: 'node_pool', label: 'Scaling node pool...', durationMs: 3000 },
  { id: 'addons', label: 'Configuring add-ons...', durationMs: 2000 },
  { id: 'network', label: 'Applying network policies...', durationMs: 1000 },
  { id: 'rbac', label: 'Setting up RBAC and identities...', durationMs: 1500 },
  { id: 'finalize', label: 'Finalizing deployment...', durationMs: 1000 },
];

export type DeployStatus = 'idle' | 'running' | 'success' | 'failed';
