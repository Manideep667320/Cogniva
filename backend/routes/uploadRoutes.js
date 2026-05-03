import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { uploadFile, listUploads, getUploadStatus, deleteUpload } from '../controllers/uploadController.js'
import verifyToken from '../middlewares/auth.js'

const router = express.Router()

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Unsupported file type. Only PDF and text files are allowed.'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
})

// All routes require authentication
router.use(verifyToken)

// POST /api/upload — Upload a file
router.post('/', upload.single('file'), uploadFile)

// GET /api/upload — List user's uploads
router.get('/', listUploads)

// GET /api/upload/:id — Get upload status
router.get('/:id', getUploadStatus)

// DELETE /api/upload/:id — Delete an upload
router.delete('/:id', deleteUpload)

export default router
