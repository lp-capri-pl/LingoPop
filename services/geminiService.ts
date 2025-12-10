import { SentenceContext, PronunciationFeedback } from "../types";

/**
 * Calls our serverless proxy which performs server-side Gemini calls.
 */

// generateContexts
export const generateContexts = async (query: string): Promise<SentenceContext[]> => {
  const res = await fetch("/api/generate-contexts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Server error: ${res.status} ${res.statusText} ${text}`);
  }

  const payload = await res.json();
  if (!payload || !payload.data) throw new Error("Invalid server response");
  return payload.data as SentenceContext[];
};

// analyzePronunciation
export const analyzePronunciation = async (
  audioBase64: string,
  targetText: string,
  mimeType: string = "audio/webm"
): Promise<PronunciationFeedback> => {
  const res = await fetch("/api/analyze-pronunciation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, targetText, mimeType }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Server error: ${res.status} ${res.statusText} ${text}`);
  }

  const payload = await res.json();
  if (!payload || !payload.data) throw new Error("Invalid server response");
  return payload.data as PronunciationFeedback;
};

// generateSpeech (TTS proxy)
export const generateSpeech = async (text: string, voiceName: string = "Kore"): Promise<string> => {
  const res = await fetch("/api/generate-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceName }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Server error: ${res.status} ${res.statusText} ${text}`);
  }

  const payload = await res.json();
  if (!payload || !payload.data) throw new Error("Invalid server response");
  return payload.data as string;
};

// generateContextVideo (video proxy)
export const generateContextVideo = async (promptText: string): Promise<string> => {
  const res = await fetch("/api/generate-context-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ promptText }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Server error: ${res.status} ${res.statusText} ${text}`);
  }

  const payload = await res.json();
  if (!payload || !payload.data) throw new Error("Invalid server response");
  return payload.data as string;
};

