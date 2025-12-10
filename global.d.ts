declare global {
  // Augment NodeJS.ProcessEnv so process.env.API_KEY is recognized in TS
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY?: string;
      // Add other environment variables you use here, e.g.:
      // VITE_API_KEY?: string;
    }
  }

  // Declare the optional aistudio helper exposed on window
  interface Window {
    aistudio?: {
      hasSelectedApiKey?: () => Promise<boolean>;
      openSelectKey?: () => Promise<void>;
    };
  }
}

// Ensure this file is a module to avoid global script scope merging issues
export {};
