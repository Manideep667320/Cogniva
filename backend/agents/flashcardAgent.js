import { Agent, Task, LinearSyncPipeline } from 'lyzr-adk';
import { getGeminiModel } from './llmConfig.js';
import Flashcard from '../models/Flashcard.js';

export const createFlashcardAgent = () => {
  return new Agent({
    name: "Flashcard Generator Agent",
    role: "Educational Content Extractor",
    persona: `You are an expert instructional designer. Your job is to read lecture transcripts and extract the most important concepts.
    You must output exactly valid JSON containing an array of flashcards.
    Each flashcard must have a "type" ("QA" or "CLOZE"), a "front" (the question or the sentence with a blank denoted by {{blank}}), and a "back" (the answer or the missing word).`,
    env: { model: getGeminiModel() }
  });
};

export const generateFlashcardsFromText = async (text, userId, sourceId = null) => {
  const agent = createFlashcardAgent();

  const generateTask = new Task({
    name: "Generate Flashcards",
    agent: agent,
    instructions: `
      Read the following lecture text and extract 3-5 key concepts into flashcards.
      Output ONLY valid JSON in this exact format:
      [
        { "type": "QA", "front": "What is X?", "back": "X is Y." },
        { "type": "CLOZE", "front": "The powerhouse of the cell is the {{mitochondria}}.", "back": "mitochondria" }
      ]
      
      Do not include markdown code blocks like \`\`\`json. Just output the raw JSON array.
      
      Lecture Text:
      ${text}
    `
  });

  const pipeline = new LinearSyncPipeline({
    name: "Flashcard Pipeline",
    completion_message: "Flashcards Generated",
    tasks: [generateTask]
  });

  try {
    const result = await pipeline.execute();
    const rawOutput = result[0].task_output;
    
    // Clean up potential markdown formatting
    const cleanedOutput = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    const cards = JSON.parse(cleanedOutput);

    // Save to DB as drafts
    const savedCards = [];
    for (const card of cards) {
      const newCard = new Flashcard({
        userId,
        sourceId,
        type: card.type,
        front: card.front,
        back: card.back,
        status: 'draft' // Always draft for Human-in-the-loop validation
      });
      await newCard.save();
      savedCards.push(newCard);
    }

    return savedCards;
  } catch (error) {
    console.error("Failed to generate flashcards:", error);
    return [];
  }
};
