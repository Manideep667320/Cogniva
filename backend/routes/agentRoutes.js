import express from 'express'
import {
  runAgentLoop,
  agentEvaluate,
  runDiagnosis,
  getAgentStatus,
  getSkillContent,
} from '../controllers/agentController.js'
import verifyToken from '../middlewares/auth.js'

const router = express.Router()

// All routes require authentication
router.use(verifyToken)

// POST /api/agent/run - Run full agent loop
router.post('/run', runAgentLoop)

// POST /api/agent/evaluate - Evaluate answer via agent system
router.post('/evaluate', agentEvaluate)

// POST /api/agent/diagnose - Run diagnostic agent only
router.post('/diagnose', runDiagnosis)

// GET /api/agent/status - Agent system health
router.get('/status', getAgentStatus)

// GET /api/agent/content/:skill_tree_id/:skill_id - Get skill lesson content
router.get('/content/:skill_tree_id/:skill_id', getSkillContent)

export default router
