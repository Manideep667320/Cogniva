import express from 'express'
import { verifyToken, checkRole } from '../middlewares/auth.js'
import {
  submitAssignment,
  evaluateAssignment,
  getStudentHistory,
  getFacultySubmissions,
  overrideScore
} from '../controllers/assignmentController.js'

const router = express.Router()

// Student routes
router.post('/submit', verifyToken, submitAssignment)
router.post('/evaluate/:id', verifyToken, evaluateAssignment)
router.get('/history', verifyToken, getStudentHistory)

// Faculty routes
router.get('/faculty/:courseId', verifyToken, checkRole(['faculty']), getFacultySubmissions)
router.put('/:id/override', verifyToken, checkRole(['faculty']), overrideScore)

export default router
