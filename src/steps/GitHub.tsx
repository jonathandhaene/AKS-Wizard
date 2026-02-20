import { useState } from 'react';
import { WizardLayout } from '../components/WizardLayout';
import { useWizard } from '../contexts/WizardContext';
import { generateTerraform } from '../utils/terraformGenerator';
import { generateBicep } from '../utils/bicepGenerator';
import { saveFilesToGitHub } from '../utils/githubApi';

export function GitHub() {
  const { config } = useWizard();
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [folderPath, setFolderPath] = useState('aks-configs/');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; urls?: string[]; error?: string } | null>(null);

  const files = [
    { name: 'main.tf', content: generateTerraform(config) },
    { name: 'main.bicep', content: generateBicep(config) },
  ];

  const canSave = token.trim() && owner.trim() && repo.trim() && branch.trim() && folderPath.trim();

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    try {
      const res = await saveFilesToGitHub({ token, owner, repo, branch, folderPath, files });
      setResult(res);
    } catch (e) {
      setResult({ success: false, error: String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <WizardLayout hideNext nextLabel="Finish" hideBack={false}>
      <h2 className="text-2xl font-bold mb-2">Save to GitHub</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        Save your generated templates directly to a GitHub repository using the GitHub REST API.
      </p>

      {/* Files to save */}
      <div className="card mb-5">
        <div className="section-title">Files to Save</div>
        {files.map((f) => (
          <div key={f.name} className="flex items-center gap-2 py-1.5">
            <span>📄</span>
            <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
              {folderPath}{f.name}
            </span>
          </div>
        ))}
      </div>

      {/* GitHub settings */}
      <div className="card mb-5">
        <div className="section-title">GitHub Settings</div>
        <div className="space-y-4">
          <div>
            <label className="field-label">Personal Access Token</label>
            <input
              className="field-input"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Needs <code>repo</code> scope. Create one at{' '}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                github.com/settings/tokens
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Owner</label>
              <input
                className="field-input"
                placeholder="your-username"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Repository</label>
              <input
                className="field-input"
                placeholder="my-infra"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Branch</label>
              <input
                className="field-input"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Folder Path</label>
              <input
                className="field-input"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="btn-primary"
        >
          {saving ? '⏳ Saving...' : '💾 Save to GitHub'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className="mt-4 p-4 rounded text-sm"
          style={{
            background: result.success
              ? 'color-mix(in srgb, var(--success) 10%, transparent)'
              : 'color-mix(in srgb, var(--error) 10%, transparent)',
            border: `1px solid ${result.success ? 'var(--success)' : 'var(--error)'}`,
            borderRadius: 'var(--radius)',
          }}
        >
          {result.success ? (
            <div>
              <div className="font-semibold mb-2" style={{ color: 'var(--success)' }}>
                ✅ Files saved successfully!
              </div>
              {result.urls?.map((url) => (
                <div key={url}>
                  <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                    🔗 {url}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--error)' }}>
              ❌ Error: {result.error}
            </div>
          )}
        </div>
      )}

      {/* Congratulations */}
      <div
        className="mt-8 p-6 rounded text-center"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <div className="text-4xl mb-3">🎉</div>
        <div className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
          Congratulations!
        </div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          You've completed the AKS Configuration Wizard. Your cluster configuration is ready to go!
        </div>
      </div>
    </WizardLayout>
  );
}
