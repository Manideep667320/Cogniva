import express from 'express'
import {
  getProfile,
  getFullProfile,
  updateProfile,
} from '../controllers/profileController.js'
import verifyToken from '../middlewares/auth.js'

const router = express.Router()

// All routes require authentication
router.use(verifyToken)

// GET /api/profile - Get learning profile summary
router.get('/', getProfile)

// GET /api/profile/full - Get full learning profile
router.get('/full', getFullProfile)

// POST /api/profile/update - Update learning profile
router.post('/update', updateProfile)

export default router
