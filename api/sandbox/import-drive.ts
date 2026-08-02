import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Daytona } from "@daytona/sdk";

function extractDriveId(url: string): string | null {
  const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const m = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return m ? decodeURIComponent(m[1]) : null;
}

async function downloadDriveFile(fileId: string): Promise<{ buffer: Buffer; filename: string }> {
  let url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  let response = await fetch(url);
  let contentType = response.headers.get("content-type") || "";

  if (contentType.includes("text/html")) {
    // Large files get a "can't scan for viruses" interstitial instead of the
    // file itself — pull the confirm token out of it and refetch.
    const html = await response.text();
    const confirmMatch = html.match(/confirm=([0-9A-Za-z_-]+)/);
    const uuidMatch = html.match(/uuid=([0-9A-Za-z_-]+)/);
    if (!confirmMatch) {
      throw new Error(
        "Couldn't download that link directly — make sure it's a single-file share link (not a folder) with link sharing turned on."
      );
    }
    url = `https://drive.google.com/uc?export=download&confirm=${confirmMatch[1]}&id=${fileId}`;
    if (uuidMatch) url += `&uuid=${uuidMatch[1]}`;
    response = await fetch(url);
    contentType = response.headers.get("content-type") || "";
  }

  if (!response.ok) throw new Error(`Google Drive returned HTTP ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  const filename = filenameFromDisposition(response.headers.get("content-disposition")) || `drive-${fileId}`;
  return { buffer, filename };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.DAYTONA_API_KEY) {
    return res.status(500).json({ error: "DAYTONA_API_KEY is not configured on the server" });
  }

  const { sandboxId, repoDir, driveUrl } = req.body ?? {};
  if (!sandboxId || !repoDir || !driveUrl) {
    return res.status(400).json({ error: "sandboxId, repoDir, and driveUrl are required" });
  }

  const fileId = extractDriveId(driveUrl);
  if (!fileId) {
    return res.status(400).json({ error: "Couldn't find a file ID in that Google Drive link" });
  }

  try {
    const { buffer, filename } = await downloadDriveFile(fileId);

    const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY });
    const sandbox = await daytona.get(sandboxId);
    await sandbox.fs.uploadFile(buffer, `${repoDir}/${filename}`);

    return res.status(200).json({ filename, path: filename, contentBase64: buffer.toString("base64") });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to import from Google Drive" });
  }
}
