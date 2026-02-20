import { WizardLayout } from '../components/WizardLayout';
import { InfoBox } from '../components/InfoBox';
import { Tooltip } from '../components/Tooltip';
import { useWizard } from '../contexts/WizardContext';
import type { AffinityType, PodAntiAffinityScope, DnsPolicy } from '../types/wizard';

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

const AFFINITY_OPTIONS: { value: AffinityType; label: string; desc: string }[] = [
  { value: 'none', label: '🚫 None', desc: 'No node affinity rules' },
  { value: 'preferred', label: '💛 Preferred', desc: 'Schedule on matching nodes when possible' },
  { value: 'required', label: '🔒 Required', desc: 'Only schedule on matching nodes' },
];

const ANTI_AFFINITY_OPTIONS: { value: PodAntiAffinityScope; label: string; desc: string }[] = [
  { value: 'none', label: '🚫 None', desc: 'No pod anti-affinity rules' },
  { value: 'preferred', label: '💛 Preferred', desc: 'Spread pods across topology when possible' },
  { value: 'required', label: '🔒 Required', desc: 'Enforce pod spread across topology' },
];

const DNS_POLICIES: { value: DnsPolicy; label: string; desc: string }[] = [
  { value: 'ClusterFirst', label: 'ClusterFirst', desc: 'Use cluster DNS, fall back to upstream (default)' },
  { value: 'ClusterFirstWithHostNet', label: 'ClusterFirstWithHostNet', desc: 'ClusterFirst when hostNetwork is enabled' },
  { value: 'Default', label: 'Default', desc: 'Inherit DNS from the node' },
  { value: 'None', label: 'None', desc: 'Provide custom dnsConfig' },
];

export function Pods() {
  const { config, updateConfig } = useWizard();
  const { podConfig } = config;

  const update = (partial: Partial<typeof podConfig>) => {
    updateConfig({ podConfig: { ...podConfig, ...partial } });
  };

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2">Pod Configuration</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Define resource requests &amp; limits, affinity rules, and networking options for your pods.
      </p>

      <InfoBox variant="tip" title="Why configure pods here?">
        Setting accurate resource requests and limits prevents OOM kills, enables effective
        scheduling, and powers HPA/VPA autoscaling. Affinity rules control pod placement across
        nodes and availability zones.
      </InfoBox>

      {/* Resource Requests & Limits */}
      <div className="card mb-4">
        <div className="section-title">
          Resource Requests &amp; Limits{' '}
          <Tooltip content="Requests are guaranteed resources; limits are the maximum a container may use. CPU is expressed in millicores (m); memory in Mi/Gi.">
            <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>
              ⓘ
            </span>
          </Tooltip>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="field-label">
              CPU Request{' '}
              <Tooltip content="Minimum CPU guaranteed to the container (e.g. 100m = 0.1 cores).">
                <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
              </Tooltip>
            </label>
            <input
              className="field-input"
              placeholder="100m"
              value={podConfig.cpuRequest}
              onChange={(e) => update({ cpuRequest: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">
              CPU Limit{' '}
              <Tooltip content="Maximum CPU the container may use (e.g. 500m = 0.5 cores). Throttled if exceeded.">
                <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
              </Tooltip>
            </label>
            <input
              className="field-input"
              placeholder="500m"
              value={podConfig.cpuLimit}
              onChange={(e) => update({ cpuLimit: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">
              Memory Request{' '}
              <Tooltip content="Minimum memory guaranteed to the container (e.g. 128Mi).">
                <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
              </Tooltip>
            </label>
            <input
              className="field-input"
              placeholder="128Mi"
              value={podConfig.memoryRequest}
              onChange={(e) => update({ memoryRequest: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">
              Memory Limit{' '}
              <Tooltip content="Maximum memory the container may use (e.g. 512Mi). OOMKilled if exceeded.">
                <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
              </Tooltip>
            </label>
            <input
              className="field-input"
              placeholder="512Mi"
              value={podConfig.memoryLimit}
              onChange={(e) => update({ memoryLimit: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Node Affinity */}
      <div className="card mb-4">
        <div className="section-title">
          Node Affinity{' '}
          <Tooltip content="Node affinity constrains which nodes a pod can be scheduled on based on node labels.">
            <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>
              ⓘ
            </span>
          </Tooltip>
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          {AFFINITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ nodeAffinity: opt.value })}
              title={opt.desc}
              className="flex-1 py-2 px-3 rounded font-medium text-sm min-w-[100px]"
              style={{
                background: podConfig.nodeAffinity === opt.value ? 'var(--accent)' : 'var(--bg-secondary)',
                color: podConfig.nodeAffinity === opt.value ? 'var(--accent-text)' : 'var(--text-primary)',
                border: `2px solid ${podConfig.nodeAffinity === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {podConfig.nodeAffinity !== 'none' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">
                Node Label Key{' '}
                <Tooltip content="The node label key to match (e.g. kubernetes.io/os or agentpool).">
                  <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
                </Tooltip>
              </label>
              <input
                className="field-input"
                placeholder="kubernetes.io/os"
                value={podConfig.nodeSelectorKey}
                onChange={(e) => update({ nodeSelectorKey: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Node Label Value</label>
              <input
                className="field-input"
                placeholder="linux"
                value={podConfig.nodeSelectorValue}
                onChange={(e) => update({ nodeSelectorValue: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pod Anti-Affinity */}
      <div className="card mb-4">
        <div className="section-title">
          Pod Anti-Affinity{' '}
          <Tooltip content="Pod anti-affinity spreads pods across nodes or availability zones to improve availability.">
            <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>
              ⓘ
            </span>
          </Tooltip>
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          {ANTI_AFFINITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ podAntiAffinity: opt.value })}
              title={opt.desc}
              className="flex-1 py-2 px-3 rounded font-medium text-sm min-w-[100px]"
              style={{
                background: podConfig.podAntiAffinity === opt.value ? 'var(--accent)' : 'var(--bg-secondary)',
                color: podConfig.podAntiAffinity === opt.value ? 'var(--accent-text)' : 'var(--text-primary)',
                border: `2px solid ${podConfig.podAntiAffinity === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {podConfig.podAntiAffinity !== 'none' && (
          <div>
            <label className="field-label">
              Topology Key{' '}
              <Tooltip content="Defines the domain for spreading. Use 'kubernetes.io/hostname' for per-node spread or 'topology.kubernetes.io/zone' for per-zone spread.">
                <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
              </Tooltip>
            </label>
            <div className="flex gap-2 flex-wrap">
              {['kubernetes.io/hostname', 'topology.kubernetes.io/zone'].map((key) => (
                <button
                  key={key}
                  onClick={() => update({ topologyKey: key })}
                  className="py-1.5 px-3 rounded text-sm"
                  style={{
                    background: podConfig.topologyKey === key ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--bg-secondary)',
                    border: `1px solid ${podConfig.topologyKey === key ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {key}
                </button>
              ))}
              <input
                className="field-input flex-1 min-w-[200px]"
                placeholder="custom topology key"
                value={podConfig.topologyKey}
                onChange={(e) => update({ topologyKey: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Networking */}
      <div className="card">
        <div className="section-title">Pod Networking</div>
        <Toggle
          enabled={podConfig.hostNetwork}
          onToggle={() => update({ hostNetwork: !podConfig.hostNetwork })}
          label="Host Network"
          tooltip="When enabled, the pod uses the node's network namespace. Rarely needed; increases security risk."
        />

        <div className="mt-4">
          <label className="field-label">
            DNS Policy{' '}
            <Tooltip content="Controls how DNS resolution is handled for pods.">
              <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>ⓘ</span>
            </Tooltip>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DNS_POLICIES.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update({ dnsPolicy: opt.value })}
                title={opt.desc}
                className="p-3 rounded text-left transition-all"
                style={{
                  background: podConfig.dnsPolicy === opt.value ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--bg-secondary)',
                  border: `1px solid ${podConfig.dnsPolicy === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-primary)',
                }}
              >
                <div className="font-semibold text-sm">{opt.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{opt.desc}</div>
                {podConfig.dnsPolicy === opt.value && (
                  <span className="text-xs mt-1 block" style={{ color: 'var(--accent)' }}>✓ Selected</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </WizardLayout>
  );
}
