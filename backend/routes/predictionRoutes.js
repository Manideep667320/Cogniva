import express from 'express'
import { verifyToken, checkRole } from '../middlewares/auth.js'
import { getMyRisk, getClassRisk } from '../controllers/predictionController.js'

const router = express.Router()

router.get('/risk', verifyToken, getMyRisk)
router.get('/class/:courseId', verifyToken, checkRole(['faculty']), getClassRisk)

export default router
