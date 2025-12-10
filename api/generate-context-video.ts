import { GoogleGenAI } from "@google/genai";

/**
 * POST /api/generate-context-video
 * Body: { promptText: string }
 * Returns: { data: string } where data is the generated video URI (string)
 *
 * Uses server-only env var: GENAI_API_KEY
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { promptText } = req.body ?? {};
  if (!promptText || typeof promptText !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'promptText' in request body" });
  }

  const apiKey = process.env.GENAI_API_KEY;
  if (!apiKey) {
    console.error("GENAI_API_KEY not set");
    return res.status(500).json({ error: "Server misconfiguration: GENAI_API_KEY not set" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    let operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt: `Cinematic, realistic video of a person speaking. Context: ${promptText}`,
      config: {
        numberOfVideos: 1,
        resolution: "720p",
        aspectRatio: "16:9",
      },
    });

    const start = Date.now();
    while (!operation.done) {
      if (Date.now() - start > 2 * 60 * 1000) {
        return res.status(202).json({ data: null, message: "Processing, try again later" });
      }
      await new Promise((r) => setTimeout(r, 3000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      return res.status(502).json({ error: "No video generated" });
    }

    return res.status(200).json({ data: downloadLink });
  } catch (err: any) {
    console.error("generate-context-video error:", err);
    return res.status(500).json({ error: err?.message || "Unknown error from Gemini" });
  }
}