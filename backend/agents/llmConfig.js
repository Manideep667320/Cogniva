import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export class Agent {
  constructor(config) {
    this.name = config.name || 'AI Agent';
    this.role = config.role || 'Assistant';
    this.persona = config.persona || 'You are a helpful assistant.';
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = 'gemini-flash-lite-latest';
  }

  async run(instructions, retries = 2) {
    const prompt = `Role: ${this.role}\nPersona: ${this.persona}\n\nTask: ${instructions}`;
    
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }]
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        const text = response.data.candidates[0].content.parts[0].text;
        return { response: text };
      } catch (err) {
        if (err.response?.status === 429 && i < retries) {
          // Try to extract the requested wait time, default to 16 seconds if not found
          let waitSeconds = 16;
          const msg = err.response?.data?.error?.message || "";
          const match = msg.match(/Please retry in ([\d\.]+)s/);
          if (match && match[1]) {
            waitSeconds = Math.ceil(parseFloat(match[1])) + 1; // Add 1s buffer
          }
          
          console.warn(`[Agent ${this.name}] Rate limited (429). Retrying in ${waitSeconds} seconds...`);
          await new Promise(res => setTimeout(res, waitSeconds * 1000));
          continue;
        }
        console.error(`[Agent ${this.name}] Error:`, err?.response?.data || err.message);
        throw new Error(`Agent ${this.name} failed to generate content: ${err.message}`);
      }
    }
  }
}

export const getGeminiModel = () => null; // Dummy to avoid breaking existing code
