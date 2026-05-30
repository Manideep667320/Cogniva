import express from 'express'
import { verifyToken } from '../middlewares/auth.js'
import { createRoom, getRoom, uploadRoomPdf } from '../controllers/roomController.js'
import { generateRoomFlashcards } from '../controllers/flashcardGeneratorController.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `room_${uuidv4()}${ext}`)
  },
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Only PDF files are allowed.'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
})

router.post('/', verifyToken, createRoom)
router.get('/:roomCode', verifyToken, getRoom)
router.post('/:roomCode/upload-pdf', verifyToken, upload.single('file'), uploadRoomPdf)
router.post('/:roomCode/generate-flashcards', verifyToken, generateRoomFlashcards)

export default router
