import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Daytona } from "@daytona/sdk";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.DAYTONA_API_KEY) {
    return res.status(500).json({ error: "DAYTONA_API_KEY is not configured on the server" });
  }

  const { sandboxId, port } = req.body ?? {};
  if (!sandboxId || !port) {
    return res.status(400).json({ error: "sandboxId and port are required" });
  }

  try {
    const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY });
    const sandbox = await daytona.get(sandboxId);
    const preview = await sandbox.getSignedPreviewUrl(Number(port), 3600);
    return res.status(200).json({ url: preview.url });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to create preview link" });
  }
}
