import { Agent } from './llmConfig.js';
import { getGeminiModel } from './llmConfig.js';

export const createPlannerAgent = () => {
  return new Agent({
    name: "Planner Agent",
    role: "Study Schedule & Learning Path Optimizer",
    persona: `You are an expert academic planner. You analyze a student's diagnostic results, their learning profile (speed, preferred style, difficulty level), and their past performance to create a personalized study session plan.
    You decide which skill they should focus on next and recommend the best approach for the Tutor Agent to take.`,
    env: getGeminiModel()
  });
};

export const runPlannerTask = async (diagnosis, learningProfile, requestedSkillId = null) => {
  const plannerAgent = createPlannerAgent();

  const instructions = `Analyze this student's learning state.
      Diagnosis: ${JSON.stringify(diagnosis)}
      Learning Profile: ${JSON.stringify(learningProfile)}
      ${requestedSkillId ? `The user specifically requested to focus on skill ID: ${requestedSkillId}. Prioritize this skill.` : ''}
      
      Determine the best skill to focus on. Decide the difficulty level (easy/medium/hard) and the teaching approach (conceptual/practical).
      Return ONLY a JSON object with this exact format:
      {
        "selectedSkill": {
          "skill_id": "string",
          "skill_name": "string",
          "mastery_score": number
        },
        "difficulty": "string",
        "approachType": "string",
        "reasoning": "string",
        "sessionPlan": "string"
      }`;

  const result = await plannerAgent.run(instructions);
  const text = typeof result === 'string' ? result : (result.response || JSON.stringify(result));
  
  // Extract JSON from output
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse planner output:", text);
    throw new Error("Planner agent returned invalid JSON");
  }
};
