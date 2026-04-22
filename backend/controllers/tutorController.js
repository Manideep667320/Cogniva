import { Chat } from '../models/Chat.js'
import { SkillTree } from '../models/SkillTree.js'
import { Upload } from '../models/Upload.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import OllamaService from '../services/OllamaService.js'
import embeddingService from '../services/embeddingService.js'
import vectorService from '../services/vectorService.js'
import skillService from '../services/skillService.js'

// POST /api/tutor/chat — RAG-enhanced AI tutoring
export const sendMessage = asyncHandler(async (req, res) => {
  const { message, conversation_id, skill_id, skill_tree_id } = req.body
  const userId = req.userDb._id

  // Validate input
  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message cannot be empty',
    })
  }

  // Fetch conversation history for context
  let conversationHistory = []
  if (conversation_id) {
    const chats = await Chat.find({ conversation_id, user_id: userId })
      .sort({ created_at: 1 })
      .limit(10)

    conversationHistory = chats.map((chat) => [
      { role: 'user', content: chat.message },
      { role: 'assistant', content: chat.response },
    ])
    conversationHistory = conversationHistory.flat()
  }

  let aiResult
  let retrievedContext = []

  // If skill_tree_id is provided, use RAG
  if (skill_tree_id) {
    try {
      const skillTree = await SkillTree.findOne({
        _id: skill_tree_id,
        user_id: userId,
      })

      if (skillTree && skillTree.embedding_collection) {
        const isChromaAvailable = await vectorService.isAvailable()

        if (isChromaAvailable) {
          // Generate embedding for the query
          const queryEmbedding = await embeddingService.generateEmbedding(message)

          // Retrieve relevant chunks
          retrievedContext = await vectorService.queryRelevant(
            skillTree.embedding_collection,
            queryEmbedding,
            5
          )
        }
      }

      // If we couldn't get vector context, try using stored text from upload
      if (retrievedContext.length === 0) {
        const upload = await Upload.findOne({
          skill_tree_id: skill_tree_id,
          user_id: userId,
          status: 'completed',
        })

        if (upload && upload.text_content) {
          retrievedContext = [{
            content: upload.text_content.substring(0, 3000),
            metadata: { source: 'upload_fallback' },
          }]
        }
      }
    } catch (error) {
      console.warn('⚠️ RAG context retrieval failed:', error.message)
    }
  }

  // Generate response with or without context
  if (retrievedContext.length > 0) {
    aiResult = await OllamaService.generateWithContext(
      message,
      retrievedContext,
      conversationHistory
    )
  } else {
    aiResult = await OllamaService.generateResponse(message, conversationHistory)
  }

  // Save to database
  const chat = await Chat.create({
    user_id: userId,
    message: message.trim(),
    response: aiResult.response,
    model: aiResult.model,
    tokens_used: aiResult.tokens_used,
    conversation_id: conversation_id || null,
  })

  res.status(201).json({
    success: true,
    message: 'Message processed successfully',
    data: {
      id: chat._id,
      user_id: chat.user_id,
      message: chat.message,
      response: chat.response,
      model: chat.model,
      created_at: chat.created_at,
      context_used: retrievedContext.length > 0,
      context_count: retrievedContext.length,
    },
  })
})

// POST /api/tutor/answer — Evaluate student answer + update mastery
export const evaluateAnswer = asyncHandler(async (req, res) => {
  const { skill_tree_id, skill_id, question, answer } = req.body
  const userId = req.userDb._id

  if (!question || !answer) {
    return res.status(400).json({
      success: false,
      message: 'Question and answer are required',
    })
  }

  if (!skill_tree_id || !skill_id) {
    return res.status(400).json({
      success: false,
      message: 'skill_tree_id and skill_id are required',
    })
  }

  // Get context for evaluation
  let context = ''
  try {
    const isChromaAvailable = await vectorService.isAvailable()

    if (isChromaAvailable) {
      const skillTree = await SkillTree.findById(skill_tree_id)
      if (skillTree && skillTree.embedding_collection) {
        const queryEmbedding = await embeddingService.generateEmbedding(question)
        const results = await vectorService.queryRelevant(
          skillTree.embedding_collection,
          queryEmbedding,
          3
        )
        context = results.map(r => r.content).join('\n\n')
      }
    }

    // Fallback to upload text
    if (!context) {
      const upload = await Upload.findOne({
        skill_tree_id: skill_tree_id,
        user_id: userId,
        status: 'completed',
      })
      if (upload && upload.text_content) {
        context = upload.text_content.substring(0, 2000)
      }
    }
  } catch (error) {
    console.warn('⚠️ Context retrieval for evaluation failed:', error.message)
  }

  // Evaluate the answer using LLM
  const evaluation = await OllamaService.evaluateAnswer(question, answer, context)

  // Update mastery
  const isCorrect = evaluation.is_correct || evaluation.score >= 70
  const mistakeData = !isCorrect ? {
    question,
    user_answer: answer,
    expected_concept: (evaluation.missing_concepts || []).join(', '),
    mistake_type: evaluation.mistake_type || 'incomplete',
    feedback: evaluation.feedback || '',
  } : null

  const mastery = await skillService.updateMastery(
    userId,
    skill_tree_id,
    skill_id,
    isCorrect,
    mistakeData
  )

  res.json({
    success: true,
    message: 'Answer evaluated',
    data: {
      evaluation: {
        is_correct: isCorrect,
        score: evaluation.score || (isCorrect ? 85 : 30),
        feedback: evaluation.feedback || 'No feedback available',
        missing_concepts: evaluation.missing_concepts || [],
        mistake_type: evaluation.mistake_type || null,
        follow_up_question: evaluation.follow_up_question || null,
      },
      mastery: {
        skill_id: mastery.skill_id,
        skill_name: mastery.skill_name,
        mastery_score: mastery.mastery_score,
        interactions: mastery.interactions,
      },
    },
  })
})

// POST /api/tutor/question — Generate a practice question for a skill
export const generateQuestion = asyncHandler(async (req, res) => {
  const { skill_tree_id, skill_id } = req.body
  const userId = req.userDb._id

  if (!skill_tree_id || !skill_id) {
    return res.status(400).json({
      success: false,
      message: 'skill_tree_id and skill_id are required',
    })
  }

  const skillTree = await SkillTree.findOne({
    _id: skill_tree_id,
    user_id: userId,
  })

  if (!skillTree) {
    return res.status(404).json({
      success: false,
      message: 'Skill tree not found',
    })
  }

  const node = skillTree.nodes.find(n => n.id === skill_id)
  if (!node) {
    return res.status(404).json({
      success: false,
      message: 'Skill not found in tree',
    })
  }

  // Get context
  let context = ''
  try {
    const isChromaAvailable = await vectorService.isAvailable()

    if (isChromaAvailable && skillTree.embedding_collection) {
      const queryEmbedding = await embeddingService.generateEmbedding(node.name)
      const results = await vectorService.queryRelevant(
        skillTree.embedding_collection,
        queryEmbedding,
        3
      )
      context = results.map(r => r.content).join('\n\n')
    }

    if (!context) {
      const upload = await Upload.findOne({
        skill_tree_id: skill_tree_id,
        user_id: userId,
        status: 'completed',
      })
      if (upload && upload.text_content) {
        context = upload.text_content.substring(0, 2000)
      }
    }
  } catch (error) {
    console.warn('⚠️ Context retrieval for question gen failed:', error.message)
  }

  const questionData = await OllamaService.generateQuestion(node.name, context)

  res.json({
    success: true,
    message: 'Question generated',
    data: {
      skill_id: node.id,
      skill_name: node.name,
      ...questionData,
    },
  })
})

// GET /api/tutor/history
export const getChatHistory = asyncHandler(async (req, res) => {
  const userId = req.userDb._id
  const { limit = 20, skip = 0 } = req.query

  const chats = await Chat.find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))

  const total = await Chat.countDocuments({ user_id: userId })

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

// GET /api/tutor/health
export const checkHealth = asyncHandler(async (req, res) => {
  const isHealthy = await OllamaService.isHealthy()

  if (!isHealthy) {
    return res.status(503).json({
      success: false,
      message: 'Ollama service is not available',
    })
  }

  const models = await OllamaService.getAvailableModels()
  const chromaAvailable = await vectorService.isAvailable()

  res.json({
    success: true,
    message: 'AI Tutor service is healthy',
    data: {
      ollama_status: 'connected',
      chroma_status: chromaAvailable ? 'connected' : 'unavailable',
      available_models: models.length > 0 ? models.map((m) => m.name) : [],
      current_model: process.env.OLLAMA_MODEL || 'phi',
    },
  })
})

// GET /api/recommendations — Adaptive learning recommendations
export const getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.userDb._id
  const { skill_tree_id } = req.query

  if (!skill_tree_id) {
    // Get recommendations for the most recent skill tree
    const latestTree = await SkillTree.findOne({
      user_id: userId,
      status: 'ready',
    }).sort({ created_at: -1 })

    if (!latestTree) {
      return res.json({
        success: true,
        message: 'No skill trees found. Upload notes to get started!',
        data: null,
      })
    }

    const recommendations = await skillService.getRecommendations(userId, latestTree._id)
    return res.json({
      success: true,
      message: 'Recommendations retrieved',
      data: recommendations,
    })
  }

  const recommendations = await skillService.getRecommendations(userId, skill_tree_id)

  res.json({
    success: true,
    message: 'Recommendations retrieved',
    data: recommendations,
  })
})

// POST /api/tutor/stream — SSE streaming AI response
export const streamMessage = asyncHandler(async (req, res) => {
  const { message, skill_id, skill_tree_id } = req.body
  const userId = req.userDb._id

  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message cannot be empty',
    })
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  // Retrieve RAG context if skill tree provided
  let retrievedContext = []
  if (skill_tree_id) {
    try {
      const skillTree = await SkillTree.findOne({ _id: skill_tree_id, user_id: userId })
      if (skillTree && skillTree.embedding_collection) {
        const isChromaAvailable = await vectorService.isAvailable()
        if (isChromaAvailable) {
          const queryEmbedding = await embeddingService.generateEmbedding(message)
          retrievedContext = await vectorService.queryRelevant(
            skillTree.embedding_collection,
            queryEmbedding,
            3
          )
        }
      }
      if (retrievedContext.length === 0) {
        const upload = await Upload.findOne({
          skill_tree_id, user_id: userId, status: 'completed',
        })
        if (upload && upload.text_content) {
          retrievedContext = [{ content: upload.text_content.substring(0, 3000) }]
        }
      }
    } catch (error) {
      console.warn('⚠️ RAG context for stream failed:', error.message)
    }
  }

  // Stream the response
  const onChunk = (text) => {
    res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`)
  }

  try {
    let result
    if (retrievedContext.length > 0) {
      result = await OllamaService.generateWithContextStreaming(
        message, retrievedContext, onChunk
      )
    } else {
      result = await OllamaService.generateStreamingResponse(message, onChunk)
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({ type: 'done', model: result.model, tokens_used: result.tokens_used })}\n\n`)

    // Save to chat history
    await Chat.create({
      user_id: userId,
      message: message.trim(),
      response: result.response,
      model: result.model,
      tokens_used: result.tokens_used,
      conversation_id: null,
    })
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`)
  }

  res.end()
})

