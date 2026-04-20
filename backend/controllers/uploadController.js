import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { Upload } from '../models/Upload.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import chunkingService from '../services/chunkingService.js'
import embeddingService from '../services/embeddingService.js'
import vectorService from '../services/vectorService.js'
import skillService from '../services/skillService.js'

/**
 * Process uploaded file: extract text → chunk → embed → generate skill tree
 * This runs asynchronously after the initial upload response.
 */
async function processUpload(uploadId) {
  let upload = await Upload.findById(uploadId)
  if (!upload) return

  try {
    // Step 1: Extract text
    upload.status = 'extracting'
    await upload.save()

    const filePath = path.join(process.cwd(), 'uploads', upload.filename)
    const buffer = fs.readFileSync(filePath)
    const text = await chunkingService.extractTextFromFile(buffer, upload.mime_type)

    if (!text || text.trim().length < 50) {
      throw new Error('Extracted text is too short. Please upload a file with more content.')
    }

    upload.text_content = text
    upload.status = 'chunking'
    await upload.save()

    // Step 2: Chunk the text
    const chunks = chunkingService.chunkByParagraphs(text, 1500)

    if (chunks.length === 0) {
      throw new Error('No text chunks could be generated')
    }

    upload.chunk_count = chunks.length
    upload.status = 'embedding'
    await upload.save()

    // Step 3: Generate embeddings
    const collectionName = `upload_${upload._id.toString()}`
    upload.embedding_collection = collectionName

    const isChromaAvailable = await vectorService.isAvailable()

    if (isChromaAvailable) {
      const embeddings = await embeddingService.generateEmbeddings(chunks)
      const ids = chunks.map((_, i) => `chunk_${i}_${uuidv4().slice(0, 8)}`)
      const metadatas = chunks.map((_, i) => ({
        chunk_index: i,
        source: upload.original_name,
        upload_id: upload._id.toString(),
      }))

      await vectorService.addDocuments(collectionName, chunks, embeddings, metadatas, ids)
    } else {
      console.warn('⚠️ ChromaDB not available, skipping embedding storage')
    }

    // Step 4: Generate skill tree
    upload.status = 'generating_tree'
    await upload.save()

    const skillTree = await skillService.generateSkillTree(
      text,
      upload.user_id,
      upload.original_name,
      collectionName
    )

    upload.skill_tree_id = skillTree._id
    upload.status = 'completed'
    await upload.save()

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath)
    } catch {
      // ignore cleanup errors
    }

    console.log(`✅ Upload processing complete: ${upload.original_name}`)
  } catch (error) {
    console.error(`❌ Upload processing failed for ${uploadId}:`, error.message)
    upload.status = 'error'
    upload.error_message = error.message
    await upload.save()
  }
}

// POST /api/upload — Upload and process a file
export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded. Please select a PDF or text file.',
    })
  }

  const userId = req.userDb._id
  const file = req.file

  // Validate file type
  const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown']
  if (!allowedTypes.includes(file.mimetype)) {
    // Clean up uploaded file
    fs.unlinkSync(file.path)
    return res.status(400).json({
      success: false,
      message: 'Unsupported file type. Please upload a PDF or text file.',
    })
  }

  // Create upload record
  const upload = await Upload.create({
    user_id: userId,
    filename: file.filename,
    original_name: file.originalname,
    file_size: file.size,
    mime_type: file.mimetype,
    status: 'uploaded',
  })

  // Return immediately, process in background
  res.status(201).json({
    success: true,
    message: 'File uploaded successfully. Processing will begin shortly.',
    data: {
      id: upload._id,
      original_name: upload.original_name,
      file_size: upload.file_size,
      status: upload.status,
    },
  })

  // Start async processing (don't await)
  processUpload(upload._id).catch(err => {
    console.error('Background processing error:', err.message)
  })
})

// GET /api/upload — List user's uploads
export const listUploads = asyncHandler(async (req, res) => {
  const userId = req.userDb._id

  const uploads = await Upload.find({ user_id: userId })
    .select('-text_content')
    .sort({ created_at: -1 })
    .limit(50)

  res.json({
    success: true,
    message: 'Uploads retrieved',
    data: uploads,
  })
})

// GET /api/upload/:id — Get upload status
export const getUploadStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userDb._id

  const upload = await Upload.findOne({ _id: id, user_id: userId })
    .select('-text_content')

  if (!upload) {
    return res.status(404).json({
      success: false,
      message: 'Upload not found',
    })
  }

  res.json({
    success: true,
    message: 'Upload status retrieved',
    data: upload,
  })
})
