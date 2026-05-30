import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')
import { asyncHandler } from '../middlewares/errorHandler.js'
import { StudyRoom } from '../models/StudyRoom.js'
import { GeminiService } from '../services/GeminiService.js'

const gemini = new GeminiService()

// POST /api/rooms/:roomCode/generate-flashcards
export const generateRoomFlashcards = asyncHandler(async (req, res) => {
  const { roomCode } = req.params

  const room = await StudyRoom.findOne({ room_code: roomCode.toUpperCase() })

  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }

  if (!room.pdf_url) {
    return res.status(400).json({ success: false, message: 'No PDF uploaded in this room to generate flashcards from' })
  }

  // Extract the filename from the URL
  // e.g. http://localhost:8000/uploads/1234-file.pdf -> 1234-file.pdf
  const filename = room.pdf_url.split('/').pop()
  
  if (!filename) {
    return res.status(400).json({ success: false, message: 'Invalid PDF URL' })
  }

  const filePath = path.join(process.cwd(), 'uploads', filename)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'PDF file not found on server' })
  }

  let pdfText = ''
  try {
    const dataBuffer = fs.readFileSync(filePath)
    const data = await pdfParse(dataBuffer)
    pdfText = data.text
  } catch (error) {
    console.error('Error reading PDF:', error)
    return res.status(500).json({ success: false, message: 'Failed to parse PDF content' })
  }

  if (!pdfText || pdfText.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Could not extract any text from the PDF' })
  }

  // Use Gemini to generate flashcards
  const prompt = `
You are an expert educator. I will provide you with the text content of a document.
Please generate 5 high-quality flashcards (questions and answers) based ONLY on the key concepts found in this document.
The output MUST be exactly a valid JSON array of objects, with no markdown formatting, no code blocks, and no extra text.
Each object must have "question" and "answer" string fields.

Document Text:
${pdfText.substring(0, 15000)} // Limiting text to avoid token limits for very large PDFs
`

  let generatedText = ''
  try {
    const response = await gemini.generateResponse(prompt)
    generatedText = response.response

    // Clean up markdown code blocks if gemini included them despite instructions
    generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim()

    const flashcards = JSON.parse(generatedText)

    if (!Array.isArray(flashcards)) {
      throw new Error('Parsed response is not an array')
    }

    // Map to expected schema format
    const formattedFlashcards = flashcards.map(fc => ({
      question: fc.question,
      answer: fc.answer,
      created_at: new Date()
    }))

    // Save to room
    room.generated_flashcards.push(...formattedFlashcards)
    await room.save()

    res.json({
      success: true,
      message: 'Flashcards generated successfully',
      data: room.generated_flashcards
    })

  } catch (error) {
    console.error('Error generating flashcards with Gemini:', error, 'Response was:', generatedText)
    return res.status(500).json({ success: false, message: 'Failed to generate flashcards from AI' })
  }
})
