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

  /**
   * Process a lecture URL (YouTube, Loom, direct video/audio URL)
   */
  async processLectureUrl(url, title, userId) {
    console.log(`Starting processing for lecture URL: ${url}`);

    // If it's a direct media link and AssemblyAI is configured, try AssemblyAI first
    const isDirectMedia = url.match(/\.(mp3|mp4|wav|m4a|ogg|aac)($|\?)/i);
    if (isDirectMedia && this.client) {
      try {
        const params = {
          audio: url,
          speaker_labels: true,
          auto_chapters: true
        };
        const transcript = await this.client.transcripts.transcribe(params);
        if (transcript.status !== 'error') {
          console.log(`AssemblyAI transcribing URL success. Found ${transcript.chapters?.length || 0} chapters.`);
          if (transcript.chapters && transcript.chapters.length > 0) {
            for (const chapter of transcript.chapters) {
              const memoryContent = `Lecture Segment [${chapter.headline}]:\n${chapter.summary}\n\nTranscript Snippet:\n${chapter.text}`;
              const metadata = {
                source: "AssemblyAI_Lecture_Capture",
                start: chapter.start,
                end: chapter.end,
                gist: chapter.gist,
                url: url
              };
              const memory = await memoryService.storeMemory(userId, 'lecture', memoryContent, metadata);
              generateFlashcardsFromText(chapter.summary + "\n" + chapter.text, userId, memory._id).catch(err => console.error("Flashcard generation error:", err));
            }
          } else {
            const memoryContent = `Lecture Transcript:\n${transcript.text}`;
            const memory = await memoryService.storeMemory(userId, 'lecture', memoryContent, { source: "AssemblyAI_Lecture_Capture", url: url });
            generateFlashcardsFromText(transcript.text, userId, memory._id).catch(err => console.error("Flashcard generation error:", err));
          }
          return;
        }
      } catch (err) {
        console.warn(`AssemblyAI URL transcription failed, falling back to Gemini text extraction:`, err.message);
      }
    }

    // Fallback/YouTube handler: Scrape title/metadata and use Gemini to generate a mock lecture transcription + chapters
    try {
      // Import dynamic dependencies
      const { default: axios } = await import('axios');
      const { default: GeminiService } = await import('./GeminiService.js');

      let rawText = '';
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124'
          },
          timeout: 8000
        });
        const html = response.data;
        if (typeof html === 'string') {
          rawText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .slice(0, 8000);
        }
      } catch (e) {
        console.warn(`Could not scrape webpage for lecture URL: ${url}`, e.message);
      }

      // Prompt Gemini to synthesize a high-quality study transcript and divide it into chapters
      const prompt = `You are an AI learning assistant. A professor has submitted a recorded lecture link or YouTube video URL.
We need to generate a highly detailed, comprehensive study guide / chapter-by-chapter transcript segment summaries of this lecture so it can be added to the student's Semantic Memory.

LECTURE INFO:
- Title: ${title}
- URL: ${url}
- Scraped Webpage Text: ${rawText || 'No direct webpage content could be retrieved. Synthesize the transcript and chapters based on the Title.'}

INSTRUCTIONS:
1. Divide the lecture into 2 to 4 distinct key topic chapters.
2. For each chapter, write a clear JSON object with:
   - "headline": The title of this topic segment.
   - "summary": A detailed summary of this topic segment.
   - "text": A simulated detailed transcript of this segment.
3. Respond ONLY with a valid JSON array of these chapters. For example:
[
  {
    "headline": "Introduction to...",
    "summary": "...",
    "text": "..."
  }
]
`;
      const response = await GeminiService.generateResponse(prompt);
      let chapters = [];
      try {
        // Clean JSON formatting if Gemini outputs markdown code blocks
        let cleanResponse = response.response.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.substring(7, cleanResponse.length - 3).trim();
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.substring(3, cleanResponse.length - 3).trim();
        }
        chapters = JSON.parse(cleanResponse);
      } catch (jsonErr) {
        console.error("Failed to parse Gemini chapter JSON:", jsonErr, response.response);
        // Single segment fallback
        chapters = [{
          headline: title,
          summary: response.response.slice(0, 1000),
          text: response.response
        }];
      }

      for (const chapter of chapters) {
        const memoryContent = `Lecture Segment [${chapter.headline}]:\n${chapter.summary}\n\nTranscript Snippet:\n${chapter.text}`;
        const metadata = {
          source: "AssemblyAI_Lecture_Capture",
          gist: chapter.headline,
          url: url
        };
        const memory = await memoryService.storeMemory(userId, 'lecture', memoryContent, metadata);
        // Generate flashcards from this chapter
        generateFlashcardsFromText(chapter.summary + "\n" + chapter.text, userId, memory._id).catch(err => console.error("Flashcard generation error:", err));
      }
    } catch (geminiErr) {
      console.error("Gemini fallback lecture processing failed:", geminiErr);
    }
  }
}

export default new LectureService();
