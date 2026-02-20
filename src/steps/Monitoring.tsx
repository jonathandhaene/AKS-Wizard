import { WizardLayout } from '../components/WizardLayout';
import { InfoBox } from '../components/InfoBox';
import { Tooltip } from '../components/Tooltip';
import { useWizard } from '../contexts/WizardContext';

function Toggle({
  enabled,
  onToggle,
  label,
  tooltip,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  tooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
        {tooltip && (
          <Tooltip content={tooltip}>
            <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>
              ⓘ
            </span>
          </Tooltip>
        )}
      </div>
      <button
        onClick={onToggle}
        className="relative inline-flex h-6 w-11 rounded-full transition-colors"
        style={{ background: enabled ? 'var(--success)' : 'var(--border)' }}
      >
        <span
          className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
          style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );
}

export function Monitoring() {
  const { config, updateConfig } = useWizard();

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2">Monitoring</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Set up observability for your cluster — logs, metrics, and alerts.
      </p>

      <InfoBox variant="tip" title="Why Monitor?">
        Without monitoring you're flying blind. Container Insights provides CPU, memory, and log
        visibility. Prometheus enables custom metric scraping.
      </InfoBox>

      <div className="card">
        <Toggle
          enabled={config.enableContainerInsights}
          onToggle={() =>
            updateConfig({ enableContainerInsights: !config.enableContainerInsights })
          }
          label="Enable Container Insights"
          tooltip="Azure Monitor for containers. Collects metrics, logs, and performance data from your cluster."
        />

        {config.enableContainerInsights && (
          <div className="py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <label className="field-label">
              Log Analytics Workspace ID{' '}
              <Tooltip content="The resource ID of your Log Analytics workspace. Leave blank to create a new one automatically.">
                <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                  ⓘ
                </span>
              </Tooltip>
            </label>
            <input
              className="field-input"
              placeholder="/subscriptions/.../workspaces/my-workspace"
              value={config.logAnalyticsWorkspaceId}
              onChange={(e) => updateConfig({ logAnalyticsWorkspaceId: e.target.value })}
            />
          </div>
        )}

        <Toggle
          enabled={config.enablePrometheus}
          onToggle={() => updateConfig({ enablePrometheus: !config.enablePrometheus })}
          label="Enable Managed Prometheus"
          tooltip="Azure Managed Prometheus scrapes metrics from your cluster and stores them in Azure Monitor."
        />

        <Toggle
          enabled={config.enableAzureMonitor}
          onToggle={() => updateConfig({ enableAzureMonitor: !config.enableAzureMonitor })}
          label="Enable Azure Monitor Metrics"
          tooltip="Sends cluster and node metrics to Azure Monitor for dashboards and alerts."
        />
      </div>
    </WizardLayout>
  );
}
