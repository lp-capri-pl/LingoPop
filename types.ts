export interface SentenceContext {
  id: string;
  english: string;
  chinese: string;
  contextType: string; // e.g., "Daily Life", "Business", "Academic"
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tone: string; // e.g., "Cheerful", "Serious", "Calm", "Enthusiastic"
}

export interface PronunciationFeedback {
  score: number; // 0-100
  accuracy: string; // "Excellent", "Good", "Needs Improvement"
  phonemeIssues: string[]; // Specific sounds missed
  advice: string; // Constructive feedback in Chinese
  highlightedWordIndices: number[]; // Indices of words in the sentence that were mispronounced
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING_CONTEXT = 'GENERATING_CONTEXT',
  READY_TO_PRACTICE = 'READY_TO_PRACTICE',
  ERROR = 'ERROR'
}

export interface AudioState {
  isPlaying: boolean;
  currentSentenceId: string | null;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}