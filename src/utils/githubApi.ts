// GitHub REST API v3 utilities using fetch()

export interface GitHubFile {
  name: string;
  content: string;
}

export interface GitHubSaveOptions {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  folderPath: string;
  files: GitHubFile[];
}

export interface GitHubSaveResult {
  success: boolean;
  urls: string[];
  error?: string;
}

async function getFileSha(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<string | undefined> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } },
  );
  if (res.status === 404) return undefined;
  if (!res.ok) return undefined;
  const data = (await res.json()) as { sha?: string };
  return data.sha;
}

export async function saveFilesToGitHub(opts: GitHubSaveOptions): Promise<GitHubSaveResult> {
  const { token, owner, repo, branch, folderPath, files } = opts;
  const normalizedFolder = folderPath.replace(/\/$/, '');
  const urls: string[] = [];

  for (const file of files) {
    const path = `${normalizedFolder}/${file.name}`;
    const sha = await getFileSha(token, owner, repo, path, branch);
    const body: Record<string, unknown> = {
      message: `chore: add AKS config ${file.name} via AKS Wizard`,
      content: btoa(unescape(encodeURIComponent(file.content))),
      branch,
    };
    if (sha) body.sha = sha;

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = (await res.json()) as { message?: string };
      return { success: false, urls, error: err.message ?? `HTTP ${res.status}` };
    }

    const data = (await res.json()) as { content?: { html_url?: string } };
    if (data.content?.html_url) urls.push(data.content.html_url);
  }

  return { success: true, urls };
}
