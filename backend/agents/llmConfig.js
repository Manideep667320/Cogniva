import { GoogleModels } from 'lyzr-adk';
import dotenv from 'dotenv';
dotenv.config();

// Create a single instance of the Gemini model to be shared across all agents
export const getGeminiModel = () => {
  return new GoogleModels({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-1.5-pro'
  });
};
