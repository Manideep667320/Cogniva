import { LearningProfile } from '../models/LearningProfile.js'
import { Badge, UserBadge } from '../models/Badge.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import mongoose from 'mongoose'

// GET /api/leaderboard
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query

  const leaderboard = await LearningProfile.find({ total_xp: { $gt: 0 } })
    .populate('user_id', 'full_name avatar_url')
    .sort({ total_xp: -1 })
    .limit(parseInt(limit))
    .select('user_id total_xp streak')

  const formattedLeaderboard = await Promise.all(leaderboard.map(async (entry, index) => {
    // Get their top badge
    const topBadge = await UserBadge.findOne({ user_id: entry.user_id._id })
      .populate('badge_id')
      .sort({ earned_at: -1 })

    return {
      rank: index + 1,
      user: entry.user_id,
      xp: entry.total_xp,
      streak: entry.streak?.current || 0,
      top_badge: topBadge ? topBadge.badge_id : null
    }
  }))

  res.json({
    success: true,
    data: formattedLeaderboard
  })
})

// GET /api/leaderboard/me
export const getMyRank = asyncHandler(async (req, res) => {
  const userId = req.userDb._id

  const profile = await LearningProfile.findOne({ user_id: userId })
  if (!profile) {
    return res.json({ success: true, data: { rank: 0, xp: 0 } })
  }

  // Count how many people have more XP to find rank
  const rankCount = await LearningProfile.countDocuments({ 
    total_xp: { $gt: profile.total_xp || 0 } 
  })

  res.json({
    success: true,
    data: {
      rank: rankCount + 1,
      xp: profile.total_xp || 0,
      streak: profile.streak?.current || 0
    }
  })
})

// GET /api/leaderboard/badges
export const getBadges = asyncHandler(async (req, res) => {
  const badges = await Badge.find().sort({ 'criteria.threshold': 1 })
  res.json({
    success: true,
    data: badges
  })
})

// GET /api/leaderboard/badges/me
export const getMyBadges = asyncHandler(async (req, res) => {
  const userId = req.userDb._id

  const userBadges = await UserBadge.find({ user_id: userId })
    .populate('badge_id')
    .sort({ earned_at: -1 })

  res.json({
    success: true,
    data: userBadges.map(ub => ({
      ...ub.badge_id.toObject(),
      earned_at: ub.earned_at
    }))
  })
})
