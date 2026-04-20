import express from 'express'
import {
  getHistory,
  getChatById,
  deleteChat,
  clearAllChats,
  getStats,
} from '../controllers/chatController.js'
import verifyToken from '../middlewares/auth.js'

const router = express.Router()

// All routes require authentication
router.use(verifyToken)

// GET /api/chat/history - Get user's chat history
router.get('/history', getHistory)

// GET /api/chat/stats - Get chat statistics
router.get('/stats', getStats)

// GET /api/chat/:id - Get specific chat
router.get('/:id', getChatById)

// DELETE /api/chat/:id - Delete specific chat
router.delete('/:id', deleteChat)

// DELETE /api/chat/clear-all - Clear all chats
router.delete('/', clearAllChats)

export default router
