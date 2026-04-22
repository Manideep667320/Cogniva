import express from 'express'
import {
  sendMessage,
  evaluateAnswer,
  generateQuestion,
  getChatHistory,
  checkHealth,
  getRecommendations,
  streamMessage,
} from '../controllers/tutorController.js'
import verifyToken from '../middlewares/auth.js'

const router = express.Router()

// All routes require authentication
router.use(verifyToken)

// POST /api/tutor/chat - Send message to AI Tutor (RAG-enhanced)
router.post('/chat', sendMessage)

// POST /api/tutor/answer - Evaluate student answer + update mastery
router.post('/answer', evaluateAnswer)

// POST /api/tutor/question - Generate a practice question
router.post('/question', generateQuestion)

// GET /api/tutor/history - Get chat history
router.get('/history', getChatHistory)

// GET /api/tutor/health - Check AI service health
router.get('/health', checkHealth)

// GET /api/recommendations - Get adaptive learning recommendations
router.get('/recommendations', getRecommendations)

// POST /api/tutor/stream - Stream AI response via SSE
router.post('/stream', streamMessage)

export default router
