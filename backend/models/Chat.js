import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      default: 'phi',
    },
    tokens_used: {
      type: Number,
      default: 0,
    },
    conversation_id: {
      type: String,
      default: null,
      index: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { collection: 'chat_messages' }
)

// Compound index for efficient queries
chatSchema.index({ user_id: 1, created_at: -1 })

export const Chat = mongoose.model('Chat', chatSchema)
