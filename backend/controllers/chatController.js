import { Chat } from '../models/Chat.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

// GET /api/chat/history
export const getHistory = asyncHandler(async (req, res) => {
  const userId = req.userDb._id
  const { limit = 20, skip = 0, conversation_id } = req.query

  let query = { user_id: userId }
  if (conversation_id) {
    query.conversation_id = conversation_id
  }

  const chats = await Chat.find(query)
    .sort({ created_at: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))

  const total = await Chat.countDocuments(query)

  res.json({
    success: true,
    message: 'Chat history retrieved',
    data: chats,
    pagination: {
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      hasMore: total > parseInt(skip) + parseInt(limit),
    },
  })
})

// GET /api/chat/:id
export const getChatById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userDb._id

  const chat = await Chat.findOne({ _id: id, user_id: userId })

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found',
    })
  }

  res.json({
    success: true,
    message: 'Chat retrieved',
    data: chat,
  })
})

// DELETE /api/chat/:id
export const deleteChat = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userDb._id

  const chat = await Chat.findOneAndDelete({ _id: id, user_id: userId })

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found',
    })
  }

  res.json({
    success: true,
    message: 'Chat deleted successfully',
    data: chat,
  })
})

// DELETE /api/chat/clear-all
export const clearAllChats = asyncHandler(async (req, res) => {
  const userId = req.userDb._id

  const result = await Chat.deleteMany({ user_id: userId })

  res.json({
    success: true,
    message: 'All chats cleared',
    data: {
      deleted_count: result.deletedCount,
    },
  })
})

// GET /api/chat/stats
export const getStats = asyncHandler(async (req, res) => {
  const userId = req.userDb._id

  const totalChats = await Chat.countDocuments({ user_id: userId })
  const recentChats = await Chat.find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(5)

  const stats = {
    total_conversations: totalChats,
    recent_chats: recentChats,
  }

  res.json({
    success: true,
    message: 'Chat statistics retrieved',
    data: stats,
  })
})
