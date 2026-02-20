import { WizardLayout } from '../components/WizardLayout';
import { InfoBox } from '../components/InfoBox';
import { Tooltip } from '../components/Tooltip';
import { useWizard } from '../contexts/WizardContext';
import { getVmSkuRecommendations } from '../utils/resourceRecommendations';
import type { WorkloadType, TrafficLevel } from '../types/wizard';

const WORKLOAD_OPTIONS: { value: WorkloadType; label: string; emoji: string; desc: string }[] = [
  { value: 'general', label: 'General Purpose', emoji: '⚙️', desc: 'Web servers, APIs, microservices' },
  { value: 'memory-intensive', label: 'Memory-Intensive', emoji: '🧠', desc: 'Caches, in-memory databases, analytics' },
  { value: 'compute-intensive', label: 'Compute-Intensive', emoji: '🔢', desc: 'Batch processing, simulations, encoding' },
  { value: 'gpu-heavy', label: 'GPU-Heavy', emoji: '🎮', desc: 'ML training/inference, graphics rendering' },
  { value: 'io-intensive', label: 'I/O-Intensive', emoji: '💾', desc: 'Streaming, high-throughput data pipelines' },
];

const TRAFFIC_OPTIONS: { value: TrafficLevel; label: string; desc: string }[] = [
  { value: 'low', label: 'Low', desc: 'Occasional traffic, dev/test environments' },
  { value: 'medium', label: 'Medium', desc: 'Steady traffic with occasional spikes' },
  { value: 'high', label: 'High', desc: 'Sustained heavy load, production services' },
  { value: 'burst', label: 'Burst', desc: 'Extreme spikes, event-driven or seasonal traffic' },
];

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

export function WorkloadRequirements() {
  const { config, updateConfig } = useWizard();
  const { workloadConfig } = config;

  const update = (partial: Partial<typeof workloadConfig>) => {
    updateConfig({ workloadConfig: { ...workloadConfig, ...partial } });
  };

  const recommendations = getVmSkuRecommendations(workloadConfig.workloadType);

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2">Workload Requirements</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Tell us about your workloads so we can recommend optimized VM sizes and resource configurations.
      </p>

      <InfoBox variant="tip" title="Why does this matter?">
        Choosing the right VM family and resource requests ensures cost-effectiveness, prevents
        out-of-memory kills, and enables effective autoscaling.
      </InfoBox>

      {/* Workload Type */}
      <div className="card mb-4">
        <div className="section-title">
          Workload Type{' '}
          <Tooltip content="Select the category that best describes your primary workload. This determines VM SKU recommendations and resource profiles.">
            <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>
              ⓘ
            </span>
          </Tooltip>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {WORKLOAD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ workloadType: opt.value })}
              className="flex items-center gap-3 p-3 rounded text-left transition-all"
              style={{
                background: workloadConfig.workloadType === opt.value ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--bg-secondary)',
                border: `1px solid ${workloadConfig.workloadType === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
              }}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <div>
                <div className="font-semibold text-sm">{opt.label}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{opt.desc}</div>
              </div>
              {workloadConfig.workloadType === opt.value && (
                <span className="ml-auto text-sm" style={{ color: 'var(--accent)' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Traffic Level */}
      <div className="card mb-4">
        <div className="section-title">
          Expected Traffic Level{' '}
          <Tooltip content="Describes the typical and peak request load on your workloads. Affects initial replica count and autoscaling thresholds.">
            <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>
              ⓘ
            </span>
          </Tooltip>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TRAFFIC_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ trafficLevel: opt.value })}
              className="p-3 rounded text-left transition-all"
              style={{
                background: workloadConfig.trafficLevel === opt.value ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--bg-secondary)',
                border: `1px solid ${workloadConfig.trafficLevel === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
              }}
            >
              <div className="font-semibold text-sm">{opt.label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{opt.desc}</div>
              {workloadConfig.trafficLevel === opt.value && (
                <span className="text-xs mt-1 block" style={{ color: 'var(--accent)' }}>✓ Selected</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Autoscaling */}
      <div className="card mb-4">
        <div className="section-title">Autoscaling</div>
        <Toggle
          enabled={workloadConfig.enableHpa}
          onToggle={() => update({ enableHpa: !workloadConfig.enableHpa })}
          label="Horizontal Pod Autoscaler (HPA)"
          tooltip="Automatically scales the number of pod replicas based on CPU and memory utilization metrics."
        />
        <Toggle
          enabled={workloadConfig.enableVpa}
          onToggle={() => update({ enableVpa: !workloadConfig.enableVpa })}
          label="Vertical Pod Autoscaler (VPA)"
          tooltip="Automatically adjusts CPU and memory requests/limits for your containers based on observed usage."
        />

        {workloadConfig.enableHpa && (
          <div className="grid grid-cols-2 gap-4 pt-3">
            <div>
              <label className="field-label">
                Target CPU Utilization: {workloadConfig.targetCpuUtilization}%{' '}
                <Tooltip content="HPA scales out when average CPU utilization across pods exceeds this threshold.">
                  <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                </Tooltip>
              </label>
              <input
                type="range"
                min={30}
                max={90}
                step={5}
                value={workloadConfig.targetCpuUtilization}
                onChange={(e) => update({ targetCpuUtilization: Number(e.target.value) })}
                className="w-full"
                style={{ accentColor: 'var(--accent)' }}
              />
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>30%</span><span>90%</span>
              </div>
            </div>
            <div>
              <label className="field-label">
                Target Memory Utilization: {workloadConfig.targetMemoryUtilization}%{' '}
                <Tooltip content="HPA scales out when average memory utilization across pods exceeds this threshold.">
                  <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                </Tooltip>
              </label>
              <input
                type="range"
                min={30}
                max={90}
                step={5}
                value={workloadConfig.targetMemoryUtilization}
                onChange={(e) => update({ targetMemoryUtilization: Number(e.target.value) })}
                className="w-full"
                style={{ accentColor: 'var(--accent)' }}
              />
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>30%</span><span>90%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monitoring Integration */}
      <div className="card mb-4">
        <div className="section-title">Monitoring Integration</div>
        <Toggle
          enabled={workloadConfig.enableMonitoringIntegration}
          onToggle={() => update({ enableMonitoringIntegration: !workloadConfig.enableMonitoringIntegration })}
          label="Add Prometheus scraping annotations"
          tooltip="Includes Prometheus annotation comments in the generated resource YAML so Azure Monitor / Prometheus can discover and scrape your app metrics."
        />
        {workloadConfig.enableMonitoringIntegration && (
          <div
            className="mt-3 p-3 rounded text-xs"
            style={{
              background: 'color-mix(in srgb, var(--info) 10%, transparent)',
              border: '1px solid var(--info)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-secondary)',
            }}
          >
            💡 Prometheus annotation comments will be included in the generated <strong>Resource Config</strong> YAML
            template. Enable <strong>Azure Monitor Metrics</strong> or <strong>Managed Prometheus</strong> on the
            Monitoring step to activate metric collection on the cluster.
          </div>
        )}
      </div>

      {/* VM SKU Recommendations */}
      <div className="card">
        <div className="section-title">💡 Recommended VM SKUs for User Node Pools</div>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Based on your workload type selection. Apply these in the <strong>Node Pools</strong> step.
        </p>
        <div className="space-y-2">
          {recommendations.map((rec) => (
            <div
              key={rec.sku}
              className="flex flex-col gap-0.5 p-3 rounded"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                  {rec.sku}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{rec.description}</span>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{rec.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </WizardLayout>
  );
}
