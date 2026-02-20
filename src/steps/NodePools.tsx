import { useState } from 'react';
import { WizardLayout } from '../components/WizardLayout';
import { InfoBox } from '../components/InfoBox';
import { Tooltip } from '../components/Tooltip';
import { useWizard } from '../contexts/WizardContext';
import type { NodePool } from '../types/wizard';

const VM_SIZES = [
  'Standard_D2s_v3',
  'Standard_D4s_v3',
  'Standard_D8s_v3',
  'Standard_D16s_v3',
  'Standard_E4s_v3',
  'Standard_E8s_v3',
  'Standard_F4s_v2',
  'Standard_F8s_v2',
  'Standard_B2ms',
  'Standard_B4ms',
];

function NodePoolForm({
  pool,
  onChange,
  title,
}: {
  pool: NodePool;
  onChange: (p: NodePool) => void;
  title: string;
}) {
  return (
    <div className="card mb-4">
      <div className="section-title">{title}</div>
      <div className="space-y-4">
        <div>
          <label className="field-label">Pool Name</label>
          <input
            className="field-input"
            value={pool.name}
            onChange={(e) => onChange({ ...pool, name: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">
            VM Size{' '}
            <Tooltip content="The Azure VM size for nodes. Larger VMs cost more but support more pods. D-series are general-purpose.">
              <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </label>
          <select
            className="field-input"
            value={pool.vmSize}
            onChange={(e) => onChange({ ...pool, vmSize: e.target.value })}
          >
            {VM_SIZES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Auto-scaling toggle */}
        <div className="flex items-center gap-3">
          <label className="field-label mb-0">Enable Auto-scaling</label>
          <button
            onClick={() => onChange({ ...pool, enableAutoScaling: !pool.enableAutoScaling })}
            className="relative inline-flex h-6 w-11 rounded-full transition-colors"
            style={{
              background: pool.enableAutoScaling ? 'var(--success)' : 'var(--border)',
            }}
          >
            <span
              className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ml-0.5"
              style={{ transform: pool.enableAutoScaling ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </button>
          <Tooltip content="Automatically adjusts node count based on workload demand. Requires min/max node counts.">
            <span className="text-xs cursor-help" style={{ color: 'var(--info)' }}>
              ⓘ
            </span>
          </Tooltip>
        </div>

        {pool.enableAutoScaling ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Min Nodes</label>
              <input
                type="number"
                min={1}
                max={pool.maxNodes}
                className="field-input"
                value={pool.minNodes}
                onChange={(e) => onChange({ ...pool, minNodes: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="field-label">Max Nodes</label>
              <input
                type="number"
                min={pool.minNodes}
                max={100}
                className="field-input"
                value={pool.maxNodes}
                onChange={(e) => onChange({ ...pool, maxNodes: Number(e.target.value) })}
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="field-label">Node Count: {pool.nodeCount}</label>
            <input
              type="range"
              min={1}
              max={10}
              value={pool.nodeCount}
              onChange={(e) => onChange({ ...pool, nodeCount: Number(e.target.value) })}
              className="w-full"
              style={{ accentColor: 'var(--accent)' }}
            />
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>1</span>
              <span>10</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function NodePools() {
  const { config, updateConfig } = useWizard();
  const [showAddUser, setShowAddUser] = useState(false);

  const addUserPool = () => {
    const newPool: NodePool = {
      name: `userpool${config.userNodePools.length + 1}`,
      vmSize: 'Standard_D2s_v3',
      nodeCount: 2,
      enableAutoScaling: false,
      minNodes: 1,
      maxNodes: 5,
      mode: 'User',
    };
    updateConfig({ userNodePools: [...config.userNodePools, newPool] });
    setShowAddUser(false);
  };

  const removeUserPool = (idx: number) => {
    const updated = config.userNodePools.filter((_, i) => i !== idx);
    updateConfig({ userNodePools: updated });
  };

  const updateUserPool = (idx: number, pool: NodePool) => {
    const updated = [...config.userNodePools];
    updated[idx] = pool;
    updateConfig({ userNodePools: updated });
  };

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2">Node Pools</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Node pools are groups of VMs that run your workloads.
      </p>

      <InfoBox variant="info" title="System vs User Node Pools">
        <strong>System pools</strong> run critical AKS system pods (CoreDNS, metrics server).{' '}
        <strong>User pools</strong> are for your application workloads. You need at least one system
        pool.
      </InfoBox>

      <NodePoolForm
        title="System Node Pool"
        pool={config.systemNodePool}
        onChange={(p) => updateConfig({ systemNodePool: p })}
      />

      {config.userNodePools.map((pool, idx) => (
        <div key={idx} className="relative">
          <NodePoolForm
            title={`User Node Pool ${idx + 1}`}
            pool={pool}
            onChange={(p) => updateUserPool(idx, p)}
          />
          <button
            onClick={() => removeUserPool(idx)}
            className="absolute top-4 right-4 text-xs px-2 py-1 rounded"
            style={{
              background: 'var(--error)',
              color: '#fff',
              borderRadius: 'var(--radius)',
            }}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        onClick={showAddUser ? addUserPool : () => setShowAddUser(true)}
        className="btn-secondary w-full mt-2"
      >
        + Add User Node Pool
      </button>
    </WizardLayout>
  );
}
