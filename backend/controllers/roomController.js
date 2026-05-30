import { asyncHandler } from '../middlewares/errorHandler.js'
import { StudyRoom } from '../models/StudyRoom.js'

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// POST /api/rooms
export const createRoom = asyncHandler(async (req, res) => {
  const { name, pdf_url } = req.body
  const creator_id = req.userDb._id

  if (!name) {
    return res.status(400).json({ success: false, message: 'Room name is required' })
  }

  const room = await StudyRoom.create({
    room_code: generateRoomCode(),
    name,
    creator_id,
    pdf_url: pdf_url || ''
  })

  res.status(201).json({
    success: true,
    data: room
  })
})

// GET /api/rooms/:roomCode
export const getRoom = asyncHandler(async (req, res) => {
  const { roomCode } = req.params

  const room = await StudyRoom.findOne({ room_code: roomCode.toUpperCase() })
    .populate('creator_id', 'full_name email avatar_url')

  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }

  res.json({
    success: true,
    data: room
  })
})

// POST /api/rooms/:roomCode/upload-pdf
export const uploadRoomPdf = asyncHandler(async (req, res) => {
  const { roomCode } = req.params
  const userId = req.userDb._id

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' })
  }

  const room = await StudyRoom.findOne({ room_code: roomCode.toUpperCase() })

  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }

  if (room.creator_id.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: 'Only the room creator can upload a PDF' })
  }

  // Construct the URL to the static file
  const pdfUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`

  room.pdf_url = pdfUrl
  await room.save()

  res.json({
    success: true,
    message: 'PDF uploaded successfully',
    pdf_url: pdfUrl
  })
})
