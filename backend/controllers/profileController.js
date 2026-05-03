import personalizationService from '../services/personalizationService.js'
import { User } from '../models/User.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

// ... (previous functions)

/**
 * PUT /api/profile/account
 * Update user account info (name, bio, avatar)
 */
export const updateAccount = asyncHandler(async (req, res) => {
  const userId = req.userDb._id
  const { full_name, bio, avatar_url } = req.body

  const user = await User.findById(userId)
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  if (full_name) user.full_name = full_name
  if (bio !== undefined) user.bio = bio
  if (avatar_url !== undefined) user.avatar_url = avatar_url

  await user.save()

  res.json({
    success: true,
    message: 'Account updated successfully',
    data: {
      full_name: user.full_name,
      bio: user.bio,
      avatar_url: user.avatar_url,
      email: user.email,
      role: user.role
    }
  })
})

/**
 * GET /api/profile
 * Get the learning profile for the authenticated user
 */
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.userDb._id

  const summary = await personalizationService.getProfileSummary(userId)

  res.json({
    success: true,
    message: 'Learning profile retrieved',
    data: summary,
  })
})

/**
 * GET /api/profile/full
 * Get the full learning profile document
 */
export const getFullProfile = asyncHandler(async (req, res) => {
  const userId = req.userDb._id

  const profile = await personalizationService.getProfile(userId)

  res.json({
    success: true,
    message: 'Full learning profile retrieved',
    data: profile,
  })
})

/**
 * POST /api/profile/update
 * Force profile recalculation / manual update
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.userDb._id
  const { preferred_style, difficulty_level } = req.body

  // Allow manual overrides for style and difficulty
  const profile = await personalizationService.getProfile(userId)

  if (preferred_style && ['conceptual', 'practical'].includes(preferred_style)) {
    profile.preferred_style = preferred_style
  }

  if (difficulty_level && ['easy', 'medium', 'hard', 'adaptive'].includes(difficulty_level)) {
    profile.difficulty_level = difficulty_level
  }

  // Re-save via personalization service (will update with latest data)
  const updated = await personalizationService.updateProfile(userId, {
    isCorrect: null, // No interaction data, just preferences update
    responseTimeMs: null,
  })

  res.json({
    success: true,
    message: 'Learning profile updated',
    data: await personalizationService.getProfileSummary(userId),
  })
})
