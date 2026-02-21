import { WizardLayout } from '../components/WizardLayout';
import { InfoBox } from '../components/InfoBox';
import { Tooltip } from '../components/Tooltip';
import { useWizard } from '../contexts/WizardContext';
import type { StorageClassType } from '../types/wizard';

const STORAGE_CLASSES: { value: StorageClassType; label: string; desc: string; emoji: string }[] =
  [
    {
      value: 'default',
      label: 'Default (Standard HDD)',
      desc: 'Low-cost, suitable for dev/test workloads.',
      emoji: '💾',
    },
    {
      value: 'azuredisk',
      label: 'Azure Disk (Standard SSD)',
      desc: 'ReadWriteOnce — best for databases and stateful apps on a single node.',
      emoji: '🗄️',
    },
    {
      value: 'azurefile',
      label: 'Azure Files (SMB)',
      desc: 'ReadWriteMany — shared file storage accessible by multiple pods simultaneously.',
      emoji: '📂',
    },
    {
      value: 'premium-ssd',
      label: 'Premium SSD (ZRS)',
      desc: 'High-performance, zone-redundant storage for production databases.',
      emoji: '⚡',
    },
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
    <div
      className="flex items-center justify-between py-3 border-b"
      style={{ borderColor: 'var(--border)' }}
    >
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

export function Storage() {
  const { config, updateConfig } = useWizard();

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2">Persistent Storage</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Configure persistent volumes, storage classes, and backup strategies for stateful
        workloads.
      </p>

      <InfoBox variant="info" title="Storage in Kubernetes">
        Kubernetes Persistent Volumes (PVs) and Persistent Volume Claims (PVCs) decouple storage
        from pod lifecycle. Choose a storage class that matches your performance and availability
        requirements.
      </InfoBox>

      <div className="card mb-5">
        <Toggle
          enabled={config.enablePersistentVolumes}
          onToggle={() => updateConfig({ enablePersistentVolumes: !config.enablePersistentVolumes })}
          label="Enable Persistent Volumes"
          tooltip="Provision PersistentVolumeClaims for stateful workloads like databases and message queues."
        />

        <Toggle
          enabled={config.enableStorageBackup}
          onToggle={() => updateConfig({ enableStorageBackup: !config.enableStorageBackup })}
          label="Enable Backup &amp; Disaster Recovery"
          tooltip="Use Azure Backup for AKS to snapshot persistent volumes and restore them in a disaster recovery scenario."
        />
      </div>

      {config.enablePersistentVolumes && (
        <div className="mb-5">
          <label className="field-label mb-3 block">
            Storage Class{' '}
            <Tooltip content="The storage class determines the type of Azure storage provisioned for your PVCs. Choose based on access mode, performance, and cost requirements.">
              <span className="ml-1 text-xs cursor-help" style={{ color: 'var(--info)' }}>
                ⓘ
              </span>
            </Tooltip>
          </label>
          <div className="grid grid-cols-1 gap-3">
            {STORAGE_CLASSES.map((sc) => (
              <button
                key={sc.value}
                onClick={() => updateConfig({ storageClass: sc.value })}
                className="flex items-start gap-3 p-3 rounded text-left transition-all"
                style={{
                  background:
                    config.storageClass === sc.value ? 'var(--accent)' : 'var(--bg-secondary)',
                  color:
                    config.storageClass === sc.value ? 'var(--accent-text)' : 'var(--text-primary)',
                  border: `2px solid ${config.storageClass === sc.value ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                }}
              >
                <span className="text-2xl mt-0.5">{sc.emoji}</span>
                <div>
                  <div className="font-semibold text-sm">{sc.label}</div>
                  <div
                    className="text-xs mt-0.5"
                    style={{
                      color:
                        config.storageClass === sc.value
                          ? 'var(--accent-text)'
                          : 'var(--text-secondary)',
                      opacity: 0.85,
                    }}
                  >
                    {sc.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {config.enableStorageBackup && (
        <InfoBox variant="tip" title="Azure Backup for AKS">
          Enable Azure Backup for AKS to protect your persistent volumes. Configure a backup vault
          and schedule regular snapshots. For disaster recovery, use geo-redundant storage and test
          your restore process regularly.
        </InfoBox>
      )}

      <InfoBox variant="warning" title="Storage Best Practices">
        <ul className="list-disc list-inside space-y-1">
          <li>Always define resource requests for PVCs to avoid over-provisioning.</li>
          <li>
            Use <strong>ReadWriteOnce</strong> for databases (Azure Disk) and{' '}
            <strong>ReadWriteMany</strong> for shared file access (Azure Files).
          </li>
          <li>Enable soft-delete on your storage accounts to protect against accidental deletion.</li>
          <li>For production, use Premium SSD with zone-redundant storage (ZRS).</li>
        </ul>
      </InfoBox>
    </WizardLayout>
  );
}
