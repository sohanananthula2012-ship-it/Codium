const API = "https://api.github.com";

export interface Repo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  default_branch: string;
}

export interface TreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

export class GitHubAPI {
  private token: string;
  constructor(token: string) { this.token = token; }

  private async req(path: string, opts?: RequestInit) {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(opts?.headers || {}),
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async listRepos(): Promise<Repo[]> {
    return this.req("/user/repos?sort=updated&per_page=100");
  }

  async getTree(owner: string, repo: string, branch: string): Promise<TreeItem[]> {
    const data = await this.req(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
    return data.tree;
  }

  async getFile(owner: string, repo: string, path: string, branch: string): Promise<string> {
    const data = await this.req(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
    return atob(data.content.replace(/\n/g, ""));
  }

  async createOrUpdateFile(
    owner: string, repo: string, path: string, content: string, message: string, sha?: string, branch: string = "main"
  ) {
    const body: any = { message, content: btoa(content), branch };
    if (sha) body.sha = sha;
    return this.req(`/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async getFileSha(owner: string, repo: string, path: string, branch: string): Promise<string | undefined> {
    try {
      const data = await this.req(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
      return data.sha;
    } catch { return undefined; }
  }
}
