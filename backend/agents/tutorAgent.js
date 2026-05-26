import { Agent } from './llmConfig.js';
import { getGeminiModel } from './llmConfig.js';

export const createTutorAgent = () => {
  return new Agent({
    name: "Tutor Agent",
    role: "Expert Academic Explainer",
    persona: `You are an expert AI tutor. Your goal is to explain academic concepts clearly and engagingly.
    You adapt your language based on the provided difficulty level and approach type (e.g., conceptual vs practical).
    You always break down complex topics into digestible steps.`,
    env: getGeminiModel()
  });
};

export const runTutorTask = async (skillName, description, difficulty, approachType, context) => {
  const tutorAgent = createTutorAgent();

  const difficultyPrompt = {
    easy: 'Use simple language, analogies, and step-by-step breakdowns. Assume the student is a beginner.',
    medium: 'Give a clear, structured explanation with examples. Balance depth and clarity.',
    hard: 'Provide an in-depth explanation with technical details, edge cases, and advanced connections.',
  };

  const approachPrompt = {
    conceptual: 'Focus on the theory, definitions, and "why" behind the concept.',
    practical: 'Focus on practical applications, real-world examples, and hands-on exercises.',
  };

  const instructions = `Explain "${skillName}" to a student.
    ${description ? `TOPIC DESCRIPTION: ${description}` : ''}
    TEACHING APPROACH: ${approachPrompt[approachType] || approachPrompt.conceptual}
    DIFFICULTY LEVEL: ${difficulty.toUpperCase()} — ${difficultyPrompt[difficulty] || difficultyPrompt.medium}
    ${context ? `REFERENCE MATERIAL:\n${context}` : ''}
    
    INSTRUCTIONS:
    - Provide a clear, engaging explanation
    - Include relevant examples
    - End with 1-2 key takeaways`;

  const result = await tutorAgent.run(instructions);
  return result.response || result;
};
