import { Agent } from 'lyzr-adk';
import memoryService from '../services/memoryService.js';
import { getGeminiModel } from './llmConfig.js';

export const createMemoryAgent = () => {
  return new Agent({
    name: "Memory Agent",
    role: "Semantic Knowledge Retriever",
    persona: `You are the Memory Agent. You retrieve and synthesize relevant semantic memory from the student's past interactions, lectures, and weaknesses to provide deep context to the other agents.`,
    env: getGeminiModel()
  });
};

export const fetchMemoryContext = async (userId, query, type = null) => {
    // In a full Lyzr setup, this function would be provided as a "Tool" to the other agents.
    // For now, we directly wrap the memoryService.
    const results = await memoryService.semanticSearch(userId, query, type);
    return results.map(r => r.content).join('\n');
};
