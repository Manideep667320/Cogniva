import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sender_name: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  is_ai: { type: Boolean, default: false }
}, { _id: false })

const flashcardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
}, { _id: true })

const studyRoomSchema = new mongoose.Schema(
  {
    room_code: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    creator_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    pdf_url: {
      type: String,
      default: '' // Can be an empty string if no PDF is uploaded initially
    },
    current_page: {
      type: Number,
      default: 1
    },
    chat_history: [messageSchema],
    generated_flashcards: [flashcardSchema],
    created_at: {
      type: Date,
      default: Date.now
    }
  },
  { collection: 'study_rooms' }
)

export const StudyRoom = mongoose.model('StudyRoom', studyRoomSchema)
