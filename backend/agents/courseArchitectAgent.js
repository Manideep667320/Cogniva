import { Agent } from './llmConfig.js';
import { getGeminiModel } from './llmConfig.js';

export const createCourseArchitectAgent = () => {
  return new Agent({
    name: "Course Architect Agent",
    role: "Expert Instructional Designer",
    persona: `You are an elite instructional designer and professor. Your job is to take a brief topic or prompt from a faculty member and expand it into a fully structured course syllabus.
    You must output exactly valid JSON. The JSON should contain a title, a short description, tags, level (Beginner/Intermediate/Advanced), duration_hours, and detailed markdown content (the syllabus/modules).`,
    env: getGeminiModel()
  });
};

/**
 * Generate a course outline from a prompt.
 * @param {string} prompt - The faculty's request (e.g. "Create a beginner python course")
 * @returns {Object} - Structured course data
 */
export const runCourseArchitect = async (prompt) => {
  const agent = createCourseArchitectAgent();

  const instructions = `Generate a comprehensive course structure based on this request: "${prompt}".
      
      Return ONLY a JSON object in this exact format:
      {
        "title": "String (catchy course title)",
        "description": "String (1-2 sentence overview)",
        "level": "Beginner" | "Intermediate" | "Advanced",
        "duration_hours": Number,
        "tags": ["tag1", "tag2", "tag3"],
        "content": "String (Detailed markdown syllabus with Modules, Lessons, and Learning Objectives. Use ## for Modules and ### for Lessons)"
      }
      
      Do not include markdown code blocks like \`\`\`json. Just output the raw JSON object.`;

  try {
    const result = await agent.run(instructions);
    const rawOutput = typeof result === 'string' ? result : (result.response || JSON.stringify(result));
    
    // Clean up potential markdown formatting
    const cleanedOutput = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedOutput);
  } catch (error) {
    console.error("Failed to generate course:", error);
    throw new Error("Course Architect agent failed to generate a valid course");
  }
};
