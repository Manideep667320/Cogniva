import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { Upload } from '../models/Upload.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import chunkingService from '../services/chunkingService.js'
import embeddingService from '../services/embeddingService.js'
import vectorService from '../services/vectorService.js'
import skillService from '../services/skillService.js'
import GeminiService from '../services/GeminiService.js'
import axios from 'axios'

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
// DELETE /api/upload/:id — Delete an upload and its vector collection
export const deleteUpload = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userDb._id

  const upload = await Upload.findOne({ _id: id, user_id: userId })

  if (!upload) {
    return res.status(404).json({
      success: false,
      message: 'Upload not found',
    })
  }

  // Delete vector collection if it exists
  if (upload.embedding_collection) {
    try {
      await vectorService.deleteCollection(upload.embedding_collection)
    } catch (error) {
      console.error(`Failed to delete collection ${upload.embedding_collection}:`, error.message)
    }
  }

  await upload.deleteOne()

  res.json({
    success: true,
    message: 'Resource deleted successfully',
  })
})

// Helper to fetch URL HTML and strip tags
async function fetchUrlText(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10s timeout
    });
    
    const html = response.data;
    if (typeof html !== 'string') {
      return '';
    }
    
    // Strip script and style tags
    let cleanText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleanText = cleanText.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    // Strip other HTML tags
    cleanText = cleanText.replace(/<[^>]+>/g, ' ');
    // Normalize whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    return cleanText.slice(0, 10000); // Send first 10k chars to Gemini
  } catch (error) {
    console.error(`Failed to fetch URL ${url}:`, error.message);
    return '';
  }
}

// Background URL processing
async function processUrlUpload(uploadId, url) {
  let upload = await Upload.findById(uploadId)
  if (!upload) return

  try {
    upload.status = 'extracting'
    await upload.save()

    const rawText = await fetchUrlText(url)
    
    // Prompt Gemini to generate a high-quality study transcript/notes
    const prompt = `You are an AI research assistant. A teacher has uploaded a URL resource (e.g. YouTube video, recorded lecture, or article link) to their course Knowledge Base.
We need to generate a highly detailed, comprehensive study guide / lecture notes / transcript summary that the AI Tutor can use to teach students and construct a skill tree.

RESOURCE DETAILS:
- Title: ${upload.original_name}
- URL: ${url}
- Extracted Web Page Snippet: ${rawText || 'No direct text could be extracted. Please generate comprehensive study guide notes based on the Title alone.'}

INSTRUCTIONS:
1. Generate an exhaustive, detailed study guide / lecture notes (at least 500-1000 words).
2. Organize it into clear sections:
   - Lecture Overview
   - Key Concept Elaborations
   - Step-by-Step Details or Lecture Flow
   - Key Takeaways & Definitions
3. Make sure the content is highly educational and acts as a complete knowledge base document for this topic. Do not write short summaries. Write deep, rich academic text.
`
    const geminiRes = await GeminiService.generateResponse(prompt)
    const text = geminiRes.response

    if (!text || text.trim().length < 50) {
      throw new Error('Failed to generate learning content from URL.')
    }

    upload.text_content = text
    upload.status = 'chunking'
    await upload.save()

    // Chunk the text
    const chunks = chunkingService.chunkByParagraphs(text, 1500)

    if (chunks.length === 0) {
      throw new Error('No text chunks could be generated')
    }

    upload.chunk_count = chunks.length
    upload.status = 'embedding'
    await upload.save()

    // Generate embeddings
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

    // Generate skill tree
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

    console.log(`✅ URL processing complete: ${upload.original_name}`)
  } catch (error) {
    console.error(`❌ URL processing failed for ${uploadId}:`, error.message)
    upload.status = 'error'
    upload.error_message = error.message
    await upload.save()
  }
}

// POST /api/upload/url — Add a resource from a URL (YouTube, Loom, Webpage)
export const uploadUrl = asyncHandler(async (req, res) => {
  const { url, original_name } = req.body
  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL is required.',
    })
  }

  const userId = req.userDb._id
  const name = original_name?.trim() || 'Resource Link'

  // Create upload record
  const upload = await Upload.create({
    user_id: userId,
    filename: `url_${uuidv4()}`,
    original_name: name,
    file_size: 0,
    mime_type: 'text/html',
    url: url,
    status: 'uploaded',
  })

  // Return immediately, process in background
  res.status(201).json({
    success: true,
    message: 'URL registered successfully. Processing will begin shortly.',
    data: {
      id: upload._id,
      original_name: upload.original_name,
      file_size: upload.file_size,
      status: upload.status,
    },
  })

  // Start async processing
  processUrlUpload(upload._id, url).catch(err => {
    console.error('Background URL processing error:', err.message)
  })
})
