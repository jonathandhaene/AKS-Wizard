import { useState, useRef, useEffect } from 'react';
import { WizardLayout } from '../components/WizardLayout';
import { useWizard } from '../contexts/WizardContext';
import { DEPLOYMENT_STEPS } from '../utils/azureApi';
import type { DeployStatus } from '../utils/azureApi';

interface Credentials {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  subscriptionId: string;
}

export function Deploy() {
  const { config } = useWizard();
  const [creds, setCreds] = useState<Credentials>({
    clientId: '',
    clientSecret: '',
    tenantId: '',
    subscriptionId: config.subscriptionId,
  });
  const [status, setStatus] = useState<DeployStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const runSimulatedDeployment = async () => {
    setStatus('running');
    setLogs([]);
    setCompletedSteps(new Set());
    addLog(`Starting deployment of cluster "${config.clusterName}" to ${config.region}...`);

    try {
      for (const step of DEPLOYMENT_STEPS) {
        addLog(step.label);
        await new Promise((res) => setTimeout(res, step.durationMs));
        setCompletedSteps((prev) => new Set([...prev, step.id]));
        addLog(`✅ Done: ${step.label}`);
      }
      addLog('');
      addLog(`🎉 Cluster "${config.clusterName}" deployed successfully!`);
      addLog(`kubectl get nodes —context ${config.clusterName}`);
      setStatus('success');
    } catch {
      addLog('❌ Deployment failed unexpectedly.');
      setStatus('failed');
    }
  };

  const canDeploy =
    creds.clientId.trim() &&
    creds.clientSecret.trim() &&
    creds.tenantId.trim() &&
    creds.subscriptionId.trim() &&
    config.clusterName.trim() &&
    status !== 'running';

  const statusColors: Record<DeployStatus, string> = {
    idle: 'var(--text-muted)',
    running: 'var(--warning)',
    success: 'var(--success)',
    failed: 'var(--error)',
  };

  const statusLabels: Record<DeployStatus, string> = {
    idle: '⚪ Idle',
    running: '🔄 Deploying...',
    success: '✅ Deployed',
    failed: '❌ Failed',
  };

  return (
    <WizardLayout>
      <h2 className="text-2xl font-bold mb-2">Deploy to Azure</h2>

      <div
        className="p-3 mb-5 rounded text-sm"
        style={{
          background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
          border: '1px solid var(--warning)',
          borderRadius: 'var(--radius)',
          color: 'var(--text-secondary)',
        }}
      >
        ⚠️ <strong>Simulation Mode:</strong> This wizard simulates a deployment with realistic
        timing and steps. In production, this would connect to an Azure deployment backend (e.g.,
        Azure Functions) with real ARM/Terraform calls.
      </div>

      <div className="card mb-5">
        <div className="section-title">Azure Service Principal Credentials</div>
        <div className="space-y-4">
          {(
            [
              ['clientId', 'Client ID (App ID)', 'Service principal application ID'],
              ['clientSecret', 'Client Secret', 'Service principal client secret'],
              ['tenantId', 'Tenant ID', 'Your Azure AD tenant ID'],
              ['subscriptionId', 'Subscription ID', 'Target Azure subscription'],
            ] as [keyof Credentials, string, string][]
          ).map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="field-label">{label}</label>
              <input
                className="field-input"
                type={key === 'clientSecret' ? 'password' : 'text'}
                placeholder={placeholder}
                value={creds[key]}
                onChange={(e) => setCreds((p) => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Status + Deploy Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Status:
          </span>
          <span className="font-bold" style={{ color: statusColors[status] }}>
            {statusLabels[status]}
          </span>
        </div>
        <button
          onClick={runSimulatedDeployment}
          disabled={!canDeploy}
          className="btn-primary"
        >
          {status === 'running' ? '⏳ Deploying...' : '🚀 Deploy'}
        </button>
      </div>

      {/* Deployment Steps */}
      {status !== 'idle' && (
        <div className="card mb-4">
          <div className="section-title">Deployment Steps</div>
          {DEPLOYMENT_STEPS.map((step) => {
            const done = completedSteps.has(step.id);
            const running = status === 'running' && !done && !completedSteps.has(DEPLOYMENT_STEPS[DEPLOYMENT_STEPS.indexOf(step) - 1]?.id ?? '');
            return (
              <div key={step.id} className="flex items-center gap-2 py-1.5">
                <span style={{ color: done ? 'var(--success)' : 'var(--text-muted)' }}>
                  {done ? '✅' : running ? '⏳' : '○'}
                </span>
                <span className="text-sm" style={{ color: done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div
          className="rounded p-4 font-mono text-xs overflow-auto"
          style={{
            background: '#0d0d0d',
            color: '#00ff41',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            maxHeight: '240px',
          }}
        >
          {logs.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}
    </WizardLayout>
  );
}
