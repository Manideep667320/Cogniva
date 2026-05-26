import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AssemblyAI } from 'assemblyai';
import { verifyToken } from '../middlewares/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    cb(null, 'voice-command-' + Date.now() + path.extname(file.originalname || '.webm'));
  }
});

const upload = multer({ storage });
const aaiClient = process.env.ASSEMBLYAI_API_KEY && process.env.ASSEMBLYAI_API_KEY !== 'your_assemblyai_api_key_here' 
  ? new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY }) 
  : null;

/**
 * @route   POST /api/voice/command
 * @desc    Receive a voice command, transcribe it, and process intent
 * @access  Private
 */
router.post('/command', verifyToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No audio file provided' });
    if (!aaiClient) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(500).json({ success: false, message: 'AssemblyAI API key not configured' });
    }

    const filePath = req.file.path;
    console.log(`Processing voice command: ${filePath}`);

    // Transcribe the voice command quickly
    const transcript = await aaiClient.transcripts.transcribe({
      audio: filePath,
      speech_models: ['universal-2']
    });

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Clean up immediately

    if (transcript.status === 'error') {
      throw new Error(transcript.error);
    }

    const commandText = transcript.text;
    console.log(`Command recognized: "${commandText}"`);

    // We now just return the raw transcript command.
    // The specific page/component handling the context (like LearningPanel) 
    // will determine how to respond to it.
    
    res.json({
      success: true,
      command: commandText,
    });
  } catch (error) {
    console.error('Error processing voice command:', error);
    res.status(500).json({ success: false, message: 'Voice command processing failed' });
  }
});

export default router;
