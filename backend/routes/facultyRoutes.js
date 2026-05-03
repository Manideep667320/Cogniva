import express from 'express'
import { getStudentInsights } from '../controllers/facultyController.js'
import verifyToken from '../middlewares/auth.js'
import { requireFaculty } from '../middlewares/rbac.js'

const router = express.Router()

// All routes require authentication and faculty role
router.use(verifyToken)
router.use(requireFaculty)

// GET /api/faculty/insights — Student performance analytics
router.get('/insights', getStudentInsights)

export default router
