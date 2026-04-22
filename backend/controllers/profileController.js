import personalizationService from '../services/personalizationService.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

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
