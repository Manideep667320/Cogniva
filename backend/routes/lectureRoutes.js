import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import lectureService from '../services/lectureService.js';
import { verifyToken } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

/**
 * @route   POST /api/lecture/upload
 * @desc    Upload an audio/video lecture for transcription and segmentation
 * @access  Private
 */
router.post('/upload', verifyToken, upload.single('lecture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No lecture file uploaded' });
    }

    const filePath = req.file.path;
    
    // Process the lecture asynchronously to avoid timeout
    // You could also return the result immediately if it's short, but AssemblyAI can take time.
    lectureService.processLectureFile(filePath, req.userId)
      .then(result => {
        console.log("Lecture processed successfully");
        // Optionally delete the file here
        fs.unlinkSync(filePath);
      })
      .catch(err => {
        console.error("Lecture processing failed:", err);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });

    res.status(202).json({
      success: true,
      message: 'Lecture uploaded and is being processed. It will be added to Semantic Memory once complete.'
    });
  } catch (error) {
    console.error('Error uploading lecture:', error);
    res.status(500).json({ success: false, message: 'Failed to handle lecture upload' });
  }
});

export default router;
