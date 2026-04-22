import agentService from '../services/agentService.js'
import diagnosticService from '../services/diagnosticService.js'
import personalizationService from '../services/personalizationService.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import { skillTreeCache, llmCache, profileCache } from '../services/cacheService.js'

/**
 * POST /api/agent/run
 * Run the full agent loop: Diagnose → Plan → Teach → Evaluate
 */
export const runAgentLoop = asyncHandler(async (req, res) => {
  const { skill_tree_id, skill_id } = req.body
  const userId = req.userDb._id

  if (!skill_tree_id) {
    return res.status(400).json({
      success: false,
      message: 'skill_tree_id is required',
    })
  }

  const result = await agentService.runLoop(userId, skill_tree_id, skill_id)

  res.json({
    success: true,
    message: 'Agent loop completed',
    data: result,
  })
})

/**
 * POST /api/agent/evaluate
 * Evaluate an answer through the full agent system
 */
export const agentEvaluate = asyncHandler(async (req, res) => {
  const { skill_tree_id, skill_id, question, answer, response_time_ms } = req.body
  const userId = req.userDb._id

  if (!skill_tree_id || !skill_id || !question || !answer) {
    return res.status(400).json({
      success: false,
      message: 'skill_tree_id, skill_id, question, and answer are required',
    })
  }

  const result = await agentService.evaluateAndUpdate(
    userId,
    skill_tree_id,
    skill_id,
    question,
    answer,
    response_time_ms || null
  )

  res.json({
    success: true,
    message: 'Answer evaluated by agent system',
    data: result,
  })
})

/**
 * POST /api/agent/diagnose
 * Run diagnostic agent only
 */
export const runDiagnosis = asyncHandler(async (req, res) => {
  const { skill_tree_id } = req.body
  const userId = req.userDb._id

  if (!skill_tree_id) {
    return res.status(400).json({
      success: false,
      message: 'skill_tree_id is required',
    })
  }

  const diagnosis = await diagnosticService.diagnose(userId, skill_tree_id)

  res.json({
    success: true,
    message: 'Diagnosis complete',
    data: diagnosis,
  })
})

/**
 * GET /api/agent/status
 * Agent system health check
 */
export const getAgentStatus = asyncHandler(async (req, res) => {
  const cacheStats = {
    skillTree: skillTreeCache.getStats(),
    llm: llmCache.getStats(),
    profile: profileCache.getStats(),
  }

  res.json({
    success: true,
    message: 'Agent system is operational',
    data: {
      agents: ['diagnostic', 'planner', 'tutor', 'evaluator'],
      status: 'healthy',
      cache: cacheStats,
    },
  })
})
