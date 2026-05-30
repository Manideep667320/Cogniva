import express from 'express'
import { verifyToken } from '../middlewares/auth.js'
import {
  getLeaderboard,
  getMyRank,
  getBadges,
  getMyBadges
} from '../controllers/leaderboardController.js'

const router = express.Router()

router.get('/', verifyToken, getLeaderboard)
router.get('/me', verifyToken, getMyRank)
router.get('/badges', verifyToken, getBadges)
router.get('/badges/me', verifyToken, getMyBadges)

export default router
