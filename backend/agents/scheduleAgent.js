import { Agent } from './llmConfig.js';
import { getGeminiModel } from './llmConfig.js';

export const createScheduleAgent = () => {
  return new Agent({
    name: "Schedule Agent",
    role: "Autonomous Elite Study Scheduler",
    persona: `You are an elite academic planner for the student. Your job is to generate a comprehensive 7-day study schedule.
    You will be provided with the student's top weaknesses (based on their spaced repetition metrics) and their pending skill tree goals.
    Your objective is to allocate study tasks over the next 7 days, prioritizing weak areas early in the week and balancing 'new_concept', 'review', 'reading', and 'quiz' tasks so they don't burn out.`,
    env: getGeminiModel()
  });
};

/**
 * Generate a 7-day study plan.
 * @param {Array} weaknesses - Array of weak topics (e.g. ['DBMS Normalization', 'React Hooks'])
 * @param {Array} pendingSkills - Array of incomplete skills
 * @returns {Array} - Array of exactly 7 objects, each containing an array of tasks.
 */
export const runScheduleTask = async (weaknesses, pendingSkills) => {
  const scheduleAgent = createScheduleAgent();

  const instructions = `Generate a 7-day study schedule starting from Day 1 to Day 7.
      Student's Weaknesses: ${JSON.stringify(weaknesses)}
      Pending Goals: ${JSON.stringify(pendingSkills)}
      
      Requirements:
      1. Distribute tasks across 7 days.
      2. Limit total study time per day to 1-2 hours (60-120 mins).
      3. Task types must be one of: "review", "new_concept", "quiz", "reading".
      
      Return ONLY a JSON array of 7 objects. Example format:
      [
        {
          "dayOffset": 0,
          "tasks": [
            { "title": "Review DBMS Normalization", "topic": "DBMS Normalization", "type": "review", "durationMinutes": 30 },
            { "title": "Read chapter on B-Trees", "topic": "B-Trees", "type": "reading", "durationMinutes": 45 }
          ]
        },
        ... up to dayOffset 6
      ]`;

  const result = await scheduleAgent.run(instructions);
  const text = typeof result === 'string' ? result : (result.response || JSON.stringify(result));
  
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse schedule output:", text);
    throw new Error("Schedule agent returned invalid JSON");
  }
};
