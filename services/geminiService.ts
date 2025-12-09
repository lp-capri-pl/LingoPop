import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SentenceContext, PronunciationFeedback } from "../types";

// Helper to get the AI instance. We create a new one to ensure fresh API keys if updated via UI.
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates practice sentences for a given word or phrase.
 */
export const generateContexts = async (query: string): Promise<SentenceContext[]> => {
  const ai = getAi();
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
            tone: { type: Type.STRING, description: "The emotional tone of the speaker" }
          },
          required: ["id", "english", "chinese", "contextType", "difficulty", "tone"]
        }
      }
    }
  });

  const json = response.text;
  if (!json) throw new Error("No data returned from Gemini");
  return JSON.parse(json) as SentenceContext[];
};

/**
 * Generates audio for a specific text using Gemini TTS.
 * Returns the base64 encoded raw PCM data.
 */
export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) {
    throw new Error("Failed to generate audio");
  }
  return audioData;
};

/**
 * Generates a video visualizing the sentence context using Veo.
 */
export const generateContextVideo = async (promptText: string): Promise<string> => {
  // Ensure user has selected a key for Veo
  if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // Only call openSelectKey if it exists
      if (typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
      }
    }
  }

  // Create AI instance AFTER potentially selecting key
  let ai = getAi();

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic, realistic video of a person speaking. Close up or medium shot. Context: ${promptText}. High quality, professional lighting.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video generated");

    // Fetch the video content
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) throw new Error("Failed to download video");
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error: any) {
    // Handle specific API Key error race condition
    if (error.message && error.message.includes("Requested entity was not found")) {
       if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
         await window.aistudio.openSelectKey();
         // Recursive retry once could be dangerous, so we just throw asking user to try again
         throw new Error("API Key session expired. Please try again.");
       }
    }
    throw error;
  }
};

/**
 * Analyzes user's recorded audio pronunciation against the target text.
 */
export const analyzePronunciation = async (
  audioBase64: string,
  targetText: string,
  mimeType: string = "audio/webm"
): Promise<PronunciationFeedback> => {
  const ai = getAi();
  
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
            mimeType: mimeType,
            data: audioBase64
          }
        },
        { text: prompt }
      ]
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
          highlightedWordIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } }
        },
        required: ["score", "accuracy", "phonemeIssues", "advice", "highlightedWordIndices"]
      }
    }
  });

  const json = response.text;
  if (!json) throw new Error("No feedback generated");
  return JSON.parse(json) as PronunciationFeedback;
};

