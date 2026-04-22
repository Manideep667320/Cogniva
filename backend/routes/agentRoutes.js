import express from 'express'
import {
  runAgentLoop,
  agentEvaluate,
  runDiagnosis,
  getAgentStatus,
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

export default router
