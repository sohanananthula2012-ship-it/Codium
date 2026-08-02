export interface SandboxHandle {
  sandboxId: string;
  wsUrl: string;
  repoDir: string;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request to ${url} failed (${res.status})`);
  return data as T;
}

export const DaytonaClient = {
  create(owner: string, name: string, branch: string, githubToken: string) {
    return post<SandboxHandle>("/api/sandbox/create", { owner, name, branch, githubToken });
  },
  write(sandboxId: string, repoDir: string, path: string, content: string, encoding: "utf8" | "base64" = "utf8") {
    return post<{ ok: true }>("/api/sandbox/write", { sandboxId, repoDir, path, content, encoding });
  },
  exec(sandboxId: string, command: string, cwd?: string) {
    return post<{ exitCode: number; output: string }>("/api/sandbox/exec", { sandboxId, command, cwd });
  },
  previewPort(sandboxId: string, port: number) {
    return post<{ url: string }>("/api/sandbox/preview-port", { sandboxId, port });
  },
  importFromDrive(sandboxId: string, repoDir: string, driveUrl: string) {
    return post<{ filename: string; path: string; contentBase64: string }>(
      "/api/sandbox/import-drive",
      { sandboxId, repoDir, driveUrl }
    );
  },
};
