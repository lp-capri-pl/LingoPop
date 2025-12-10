import { GoogleGenAI, Type } from "@google/genai";

/**
 * POST /api/analyze-pronunciation
 * Body: { audioBase64: string, targetText: string, mimeType?: string }
 * Returns: { data: PronunciationFeedback } on success
 *
 * Uses server-only env var: GENAI_API_KEY (set in Vercel)
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { audioBase64, targetText, mimeType } = req.body ?? {};
  if (!audioBase64 || !targetText || typeof audioBase64 !== "string" || typeof targetText !== "string") {
    return res.status(400).json({ error: "Missing or invalid request body (audioBase64, targetText)" });
  }

  const apiKey = process.env.GENAI_API_KEY;
  if (!apiKey) {
    console.error("GENAI_API_KEY not set");
    return res.status(500).json({ error: "Server misconfiguration: GENAI_API_KEY not set" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Analyze the pronunciation of the audio.
      Target text: "${targetText}".
      Target Audience: Chinese English learner.

      Provide feedback in JSON format:
      - score: 0 to 100 integer.
      - accuracy: "Excellent", "Good", or "Needs Improvement".
      - phonemeIssues: list of specific sounds that were unclear (e.g. "th", "r", "v").
      - advice: Brief, helpful advice in CHINESE (Simplified) on how to improve.
      - highlightedWordIndices: array of indices (0-based) of words in the target text that were mispronounced.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType ?? "audio/webm",
              data: audioBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            accuracy: { type: Type.STRING },
            phonemeIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            advice: { type: Type.STRING },
            highlightedWordIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } },
          },
          required: ["score", "accuracy", "phonemeIssues", "advice", "highlightedWordIndices"],
        },
      },
    });

    const json = response.text;
    if (!json) {
      return res.status(502).json({ error: "No data returned from Gemini" });
    }

    const data = JSON.parse(json);
    return res.status(200).json({ data });
  } catch (err: any) {
    console.error("analyze-pronunciation error:", err);
    return res.status(500).json({ error: err?.message || "Unknown error from Gemini" });
  }
}