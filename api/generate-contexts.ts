import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * POST /api/generate-contexts
 * Body: { query: string }
 * Returns: { data: SentenceContext[] } on success
 *
 * Uses server-only env var: GENAI_API_KEY
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body ?? {};
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing or invalid ''query'' in request body" });
  }

  const apiKey = process.env.GENAI_API_KEY;
  if (!apiKey) {
    console.error("GENAI_API_KEY not set");
    return res.status(500).json({ error: "Server misconfiguration: GENAI_API_KEY not set" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are an expert English pronunciation coach for Chinese speakers.
      The user wants to practice the word or phrase: "${query}".
      
      Generate 3 distinct sentences containing this word/phrase in different contexts:
      1. Daily Life / Casual (Casual tone)
      2. Business / Professional (Serious/Confident tone)
      3. Academic / Formal (Calm/informative tone)
      
      For each sentence, provide a natural Chinese translation and specify the tone (e.g., Cheerful, Serious, Calm).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              english: { type: Type.STRING },
              chinese: { type: Type.STRING },
              contextType: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
              tone: { type: Type.STRING }
            },
            required: ["id", "english", "chinese", "contextType", "difficulty", "tone"]
          }
        }
      }
    });

    const json = response.text;
    if (!json) {
      return res.status(502).json({ error: "No data returned from Gemini" });
    }

    const data = JSON.parse(json);
    return res.status(200).json({ data });
  } catch (err: any) {
    console.error("generate-contexts error:", err);
    return res.status(500).json({ error: err?.message || "Unknown error from Gemini" });
  }
}

