import { AssemblyAI } from 'assemblyai';
import memoryService from './memoryService.js';
import { generateFlashcardsFromText } from '../agents/flashcardAgent.js';
import dotenv from 'dotenv';
dotenv.config();

class LectureService {
  constructor() {
    // Only initialize the client if the key is provided
    this.client = process.env.ASSEMBLYAI_API_KEY && process.env.ASSEMBLYAI_API_KEY !== 'your_assemblyai_api_key_here'
      ? new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY })
      : null;
  }

  /**
   * Transcribe and segment an audio/video lecture file using AssemblyAI
   * @param {string} filePath - Local path to the uploaded file
   * @param {string} userId - ID of the user uploading the lecture
   */
  async processLectureFile(filePath, userId) {
    if (!this.client) {
      throw new Error("AssemblyAI API key is missing or invalid in .env");
    }

    console.log(`Starting transcription for file: ${filePath}`);
    
    // Transcribe with speaker labels and auto-chapters for topic segmentation
    const params = {
      audio: filePath,
      speaker_labels: true,
      auto_chapters: true
    };

    const transcript = await this.client.transcripts.transcribe(params);

    if (transcript.status === 'error') {
      throw new Error(`AssemblyAI Transcription failed: ${transcript.error}`);
    }

    console.log(`Transcription complete. Found ${transcript.chapters?.length || 0} chapters.`);

    // If chapters are found, save them as segmented semantic memories
    if (transcript.chapters && transcript.chapters.length > 0) {
      for (const chapter of transcript.chapters) {
        const memoryContent = `Lecture Segment [${chapter.headline}]:\n${chapter.summary}\n\nTranscript Snippet:\n${chapter.text}`;
        
        const metadata = {
          source: "AssemblyAI_Lecture_Capture",
          start: chapter.start,
          end: chapter.end,
          gist: chapter.gist,
        };

        // Store into Semantic Memory
        const memory = await memoryService.storeMemory(userId, 'lecture', memoryContent, metadata);

        // Generate flashcards from this chapter
        // Do this asynchronously so we don't block the loop
        generateFlashcardsFromText(chapter.summary + "\n" + chapter.text, userId, memory._id).catch(err => console.error("Flashcard generation error:", err));
      }
    } else {
      // Fallback if chapters are disabled or not detected
      const memoryContent = `Lecture Transcript:\n${transcript.text}`;
      const memory = await memoryService.storeMemory(userId, 'lecture', memoryContent, { source: "AssemblyAI_Lecture_Capture" });
      
      generateFlashcardsFromText(transcript.text, userId, memory._id).catch(err => console.error("Flashcard generation error:", err));
    }

    return transcript;
  }
}

export default new LectureService();
