import express from 'express'
import {
  listSkillTrees,
  getSkillTree,
  deleteSkillTree,
  getSkillTreeMastery,
} from '../controllers/skillController.js'
import verifyToken from '../middlewares/auth.js'

const router = express.Router()

// All routes require authentication
router.use(verifyToken)

// GET /api/skill-tree — List all skill trees
router.get('/', listSkillTrees)

// GET /api/skill-tree/:id — Get specific skill tree
router.get('/:id', getSkillTree)

// GET /api/skill-tree/:id/mastery — Get mastery details
router.get('/:id/mastery', getSkillTreeMastery)

// DELETE /api/skill-tree/:id — Delete skill tree
router.delete('/:id', deleteSkillTree)

export default router
