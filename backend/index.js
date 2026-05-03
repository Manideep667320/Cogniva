import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import connectDB from './config/database.js'
import { errorHandler } from './middlewares/errorHandler.js'

// Routes
import authRoutes from './routes/authRoutes.js'
import tutorRoutes from './routes/tutorRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import courseRoutes from './routes/courseRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import skillRoutes from './routes/skillRoutes.js'
import agentRoutes from './routes/agentRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import facultyRoutes from './routes/facultyRoutes.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`)
  next()
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Cogniva Backend is running',
    timestamp: new Date().toISOString(),
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/tutor', tutorRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/course', courseRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/skill-tree', skillRoutes)
app.use('/api/agent', agentRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/faculty', facultyRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  })
})

// Global error handler
app.use(errorHandler)

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB()

    // Start listening
    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║  🚀 Cogniva Backend Started Successfully                 ║
║  📍 Running on http://localhost:${PORT}                      ║
║  🗄️  Database: MongoDB                                    ║
║  🔐 Auth: JWT + MongoDB                                   ║
║  🤖 AI: Ollama (${process.env.OLLAMA_MODEL || 'phi'} model)                                ║
║  📚 Course Management: Enabled                            ║
║  🌳 Skill Trees: Enabled                                  ║
║  📤 File Upload: Enabled (10MB limit)                      ║
║  🔍 RAG Pipeline: Enabled                                 ║
║  🤖 Agent System: Enabled (diagnose→plan→teach→evaluate)   ║
║  👤 Personalization: Enabled                               ║
║  📡 Streaming: SSE Enabled                                 ║
╚══════════════════════════════════════════════════════════╝
      `)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()

export default app
