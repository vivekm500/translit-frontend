// pages/api/transliterate.ts
import type { NextApiRequest, NextApiResponse } from "next";

type TransliterateResponse = {
  input: string;
  detected_script: string;
  transliterated_user: string;
  transliterated_english: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TransliterateResponse | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/transliterate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data: TransliterateResponse = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: "Transliteration failed" });
  }
}
