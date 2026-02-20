# AKS-Wizard

> **⚠️ Educational Disclaimer**: This repository is provided for educational and learning purposes only. All content, including examples and documentation, should be validated and tailored for your own production environment before use.

A browser-based wizard that guides you step-by-step through configuring an Azure Kubernetes Service (AKS) cluster, then generates deployment-ready templates (Bicep, Terraform, GitHub Actions CI/CD workflows) and a PowerShell deployment script.

## Documentation

📖 **[User Manual](docs/MANUAL.md)** — step-by-step guide to every screen in the wizard, including explanations of all configuration options, their impact, and official Azure references.

## Features

- **Team Readiness Assessment** – Answer six questions to get an AKS mode recommendation (Standard vs Automatic) before configuring a single setting
- **AKS Automatic & Standard** – Choose between fully managed (Automatic) and full-control (Standard) cluster modes
- **Step-by-step configuration** – Cluster basics, node pools, workloads, pods, networking, security, monitoring, and add-ons
- **AKS Pods management** – Configure resource requests/limits, node affinity rules, pod anti-affinity, and pod networking options
- **Auto-upgrade channel selector** – Configure `none`, `patch`, `stable`, `rapid`, or `node-image` upgrade strategies
- **Azure Container Registry integration** – Attach an ACR to your cluster with a single toggle; role assignment generated automatically
- **Template generation** – Bicep, Terraform, and GitHub Actions CI/CD workflows generated from your choices
- **GitHub Actions workflow** – Uses `azure/k8s-bake@v3` to render Helm charts and `azure/k8s-deploy@v5` to deploy; includes an AKS upgrade-check job
- **PowerShell deployment script** – The Deploy step generates a ready-to-run `deploy-aks.ps1` script (no browser-based deployment)
- **Multiple themes** – Classic, Win95, Cyberpunk, Nature, Dark, High Contrast, Microsoft Fluent, and **Paleontology** (default)

## AKS Pods

The **Pods** step lets you define default pod-level configuration that is reflected in the generated Kubernetes resource templates.

### Resource Requests & Limits

| Field | Description | Example |
|-------|-------------|---------|
| CPU Request | Minimum CPU guaranteed per container | `100m` (0.1 cores) |
| CPU Limit | Maximum CPU a container may use; throttled when exceeded | `500m` |
| Memory Request | Minimum memory guaranteed per container | `128Mi` |
| Memory Limit | Maximum memory; container is OOMKilled if exceeded | `512Mi` |

Setting requests equal to limits gives your pod a **Guaranteed** QoS class, which is preferred for latency-sensitive workloads.

### Affinity Rules

**Node Affinity** controls which nodes a pod can be scheduled on based on node labels:

| Mode | Behaviour |
|------|-----------|
| None | No constraints; scheduler places pods freely |
| Preferred | Favour matching nodes but fall back to others if unavailable |
| Required | Only schedule on nodes that match the label selector |

**Pod Anti-Affinity** spreads replicas to improve fault tolerance:

| Mode | Behaviour |
|------|-----------|
| None | No spreading constraints |
| Preferred | Spread across the selected topology key when possible |
| Required | Enforce spreading; pod stays pending if constraint cannot be met |

Use `kubernetes.io/hostname` to spread across nodes or `topology.kubernetes.io/zone` to spread across availability zones.

### Pod Networking Options

| Option | Default | Notes |
|--------|---------|-------|
| Host Network | Disabled | Exposes the pod on the node's network namespace. Avoid unless required (e.g. DaemonSets). |
| DNS Policy | `ClusterFirst` | Use `ClusterFirstWithHostNet` when Host Network is enabled. |

## AKS Automatic vs Standard

| | AKS Automatic | AKS Standard |
|---|---|---|
| **Best for** | App-focused teams, fast onboarding | Platform teams, advanced workloads |
| **Node management** | Fully managed by Azure | Full control |
| **Upgrades** | Automatic | Configurable channel |
| **Networking** | Simplified (Azure CNI Overlay) | Fully customizable |
| **Custom node pools** | Limited | Full support |

Use the **Readiness Assessment** step in the wizard to get a personalised recommendation. You can always override the recommendation on the Basics step.

## Upgrade Channels

AKS supports fine-grained control over how and when your cluster is upgraded:

| Channel | Behaviour |
|---------|-----------|
| `none` | No automatic upgrades; you apply them manually |
| `patch` | Automatically upgrades to the latest patch within your minor version *(recommended for production)* |
| `stable` | Upgrades to the latest stable minor version, lagging the newest release by one minor version |
| `rapid` | Upgrades to the newest generally available release as soon as it is available |
| `node-image` | Only upgrades node OS images; Kubernetes version unchanged |

## Deploy to Azure – PowerShell Script

The **Deploy** step generates a `deploy-aks.ps1` PowerShell script based on your wizard configuration that you can copy or download and run locally.

### Prerequisites

- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) v2.40+
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- PowerShell 7+ (or Windows PowerShell 5.1)

### Running the generated script

```powershell
# 1. Login to Azure
az login

# 2. Run the generated script
.\deploy-aks.ps1 -SubscriptionId '<your-subscription-id>'
```

A standalone template script is also available at [`scripts/deploy-aks.ps1`](scripts/deploy-aks.ps1).

## Multi-Environment & Multi-Cloud Guidance

### Multi-environment (dev / staging / prod)

- Generate separate configurations for each environment using the wizard and store them in environment-specific branches or folders (e.g. `infra/dev/`, `infra/prod/`).
- Use the GitHub Actions workflow's `environment:` key to require manual approval before deploying to production.
- Override only the fields that differ between environments (VM size, node counts, upgrade channel) and keep networking and security settings consistent via shared Bicep modules or Terraform workspaces.
- Consider **AKS Automatic** for dev/test environments to reduce operational overhead while using **AKS Standard** for production.

### Multi-cloud / hybrid

- The generated Terraform templates use the `azurerm` provider. For multi-cloud deployments, combine with `google` or `aws` providers in a single Terraform root module.
- Use [Azure Arc-enabled Kubernetes](https://learn.microsoft.com/azure/azure-arc/kubernetes/overview) to manage clusters in other clouds or on-premises through the same Azure control plane.

## Maturity Assessment

The wizard includes a six-question **Team Readiness Assessment** that evaluates:

1. Availability of dedicated platform / infrastructure engineers
2. Ability to apply Kubernetes upgrades within 30 days
3. Need for advanced networking customisation
4. Existence of a GitOps or CI/CD pipeline for infrastructure
5. Need for custom OS configurations or GPU nodes
6. Multi-environment deployment requirements

Based on the answers, the wizard recommends **AKS Automatic** (lower operational burden) or **AKS Standard** (full control). Teams can always override the recommendation.

### Operational readiness checklist

Before going to production with AKS Standard, confirm your team can:

- [ ] Monitor cluster upgrade notifications in [Azure Advisor](https://portal.azure.com/#view/Microsoft_Azure_Expert/AdvisorMenuBlade)
- [ ] Apply a minor-version upgrade to a non-production cluster within 48 hours of release
- [ ] Review and remediate `kubectl get events` and Azure Monitor alerts on a daily basis
- [ ] Perform a rolling node pool upgrade with zero downtime using PodDisruptionBudgets
- [ ] Rotate secrets stored in Azure Key Vault and consumed via the Secrets Store CSI Driver
- [ ] Reproduce the full cluster from the generated IaC templates in a clean subscription

## FAQ

### Which Kubernetes version should I use?

Use the latest supported minor version (currently `1.31.x`) unless you have a specific compatibility requirement. AKS supports the three most recent minor versions; clusters on older versions will stop receiving security patches.

### How do I migrate from AKS Standard to AKS Automatic?

AKS Automatic is a different cluster SKU and cannot be converted in-place. The recommended migration path is:

1. Re-run the AKS Wizard, select **AKS Automatic**, and generate new IaC templates.
2. Deploy the new cluster in a separate resource group.
3. Migrate workloads incrementally using blue/green traffic splitting at the Azure Front Door or Application Gateway level.
4. Decommission the old cluster once all workloads are validated.

### How do I handle automatic upgrades safely?

- Set `autoUpgradeChannel` to `patch` on production clusters — this applies only security patches without changing the Kubernetes minor version.
- Use [Planned Maintenance Windows](https://learn.microsoft.com/azure/aks/planned-maintenance) to restrict upgrades to low-traffic periods.
- Test upgrades on a staging cluster first; the generated GitHub Actions workflow includes a job that prints available upgrades on every push to `main`.

### How do I connect my Azure Container Registry?

Enable the **Azure Container Registry Integration** toggle on the Add-ons step and enter your registry name. The generated Bicep and Terraform templates will include an `AcrPull` role assignment for the cluster's managed identity, and the PowerShell script will run `az aks update --attach-acr`.

### How do I use the generated GitHub Actions workflow?

1. Download `deploy-aks.yml` from the **Templates → GitHub Actions** tab.
2. Place it at `.github/workflows/deploy-aks.yml` in your application repository.
3. Add the `AZURE_CREDENTIALS` secret (JSON from `az ad sp create-for-rbac --sdk-auth`) to *Settings → Secrets and variables → Actions*.
4. Create a `charts/app` Helm chart in your repository; the workflow uses `azure/k8s-bake@v3` to render it before deploying.
5. If ACR integration is enabled, also add `ACR_USERNAME` and `ACR_PASSWORD` secrets.

### What is the difference between add-ons and extensions?

AKS **add-ons** (Container Insights, Azure Policy, Key Vault Provider, HTTP Application Routing, KEDA, Dapr) are officially supported and managed by Microsoft. **Extensions** are cluster extensions installed via the Azure CLI or portal and are typically community-supported or preview features.

## Themes

The wizard ships with eight built-in themes selectable from the top-right corner:

| Theme | Description |
|-------|-------------|
| 🔵 Classic | Clean light blue |
| 🪟 Win95 | Retro Windows 95 grey |
| 🌆 Cyberpunk | Neon dark |
| 🌿 Nature | Soft greens |
| 🌙 Dark | Catppuccin-inspired dark |
| ⬛ High Contrast | WCAG AA high-contrast |
| 🪟 Fluent | Microsoft Fluent Design |
| 🦕 Paleontology | Earthy sandy tones *(default)* |

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
  components/   – Shared UI components (WizardLayout, ThemeSwitcher, …)
  contexts/     – React contexts (WizardContext, ThemeContext)
  steps/        – One component per wizard step
    MaturityAssessment.tsx  – Team readiness questionnaire
    Pods.tsx                – Pod resource limits, affinity rules, and networking
  types/        – TypeScript types (WizardConfig, AksMode, AutoUpgradeChannel, …)
  utils/        – Template generators (Bicep, Terraform, PowerShell, GitHub Actions workflow)
    githubWorkflowGenerator.ts  – GitHub Actions CI/CD pipeline with k8s-bake and ACR
scripts/
  deploy-aks.ps1 – Standalone PowerShell deployment script template
```

## License

MIT