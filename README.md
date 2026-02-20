# AKS-Wizard

> **⚠️ Educational Disclaimer**: This repository is provided for educational and learning purposes only. All content, including examples and documentation, should be validated and tailored for your own production environment before use.

A browser-based wizard that guides you step-by-step through configuring an Azure Kubernetes Service (AKS) cluster, then generates deployment-ready templates (Bicep, Terraform, Helm values, GitHub Actions workflows) and a PowerShell deployment script.

## Documentation

📖 **[User Manual](docs/MANUAL.md)** — step-by-step guide to every screen in the wizard, including explanations of all configuration options, their impact, and official Azure references.

## Features

- **Step-by-step configuration** – Cluster basics, node pools, networking, security, monitoring, and add-ons
- **Template generation** – Bicep, Terraform, Helm values, and GitHub Actions workflows generated from your choices
- **PowerShell deployment script** – The Deploy step generates a ready-to-run `deploy-aks.ps1` script (no browser-based deployment)
- **Multiple themes** – Classic, Win95, Cyberpunk, Nature, Dark, High Contrast, Microsoft Fluent, and **Paleontology** (default)
- **GitHub Actions integration** – Export a complete CI/CD pipeline workflow

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

## Deploy to Azure – PowerShell Script

The **Deploy** step no longer uses a browser-based simulated deployment. Instead it generates a `deploy-aks.ps1` PowerShell script based on your wizard configuration that you can copy or download and run locally.

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
  types/        – TypeScript types
  utils/        – Template generators (Bicep, Terraform, PowerShell, …)
scripts/
  deploy-aks.ps1 – Standalone PowerShell deployment script template
```

## License

MIT