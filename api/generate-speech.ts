import { GoogleGenAI, Modality } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * POST /api/generate-speech
 * Body: { text: string, voiceName?: string }
 * Returns: { data: string } where data is base64 audio string
 *
 * Uses server-only env var: GENAI_API_KEY
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, voiceName } = req.body ?? {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing or invalid ''text'' in request body" });
  }

  const apiKey = process.env.GENAI_API_KEY;
  if (!apiKey) {
    console.error("GENAI_API_KEY not set");
    return res.status(500).json({ error: "Server misconfiguration: GENAI_API_KEY not set" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName ?? "Kore" },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      return res.status(502).json({ error: "Failed to generate audio" });
    }

    return res.status(200).json({ data: audioData });
  } catch (err: any) {
    console.error("generate-speech error:", err);
    return res.status(500).json({ error: err?.message || "Unknown error from Gemini" });
  }
}

