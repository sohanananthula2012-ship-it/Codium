import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const expected = process.env.PASS_PHRASE;
  if (!expected) {
    return res.status(500).json({ error: "PASS_PHRASE is not configured on the server" });
  }

  const { passphrase } = req.body ?? {};
  if (typeof passphrase !== "string" || !passphrase) {
    return res.status(400).json({ error: "passphrase is required" });
  }

  if (passphrase !== expected) {
    return res.status(401).json({ ok: false, error: "That's not it." });
  }

  return res.status(200).json({ ok: true });
}
