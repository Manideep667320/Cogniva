import { LearningProfile } from '../models/LearningProfile.js'
import { profileCache } from './cacheService.js'

/**
 * Personalization Service
 * Manages learning profiles and adapts the system to individual learners.
 * Analyzes response time, correctness, and mistake patterns to update profiles.
 */
class PersonalizationService {
  /**
   * Get or create a learning profile for a user
   */
  async getProfile(userId) {
    const cacheKey = `profile:${userId}`
    const cached = profileCache.get(cacheKey)
    if (cached) return cached

    let profile = await LearningProfile.findOne({ user_id: userId })

    if (!profile) {
      profile = await LearningProfile.create({ user_id: userId })
      console.log(`👤 [PersonalizationService] Created new learning profile for user ${userId}`)
    }

    const profileObj = profile.toObject()
    profileCache.set(cacheKey, profileObj, 120000) // 2 min TTL

    return profileObj
  }

  /**
   * Update learning profile after an interaction
   * @param {string} userId
   * @param {Object} interactionData - { isCorrect, responseTimeMs, mistakeType, concept, evaluatorUpdates }
   */
  async updateProfile(userId, interactionData) {
    const {
      isCorrect,
      responseTimeMs,
      mistakeType,
      concept,
      evaluatorUpdates = {},
    } = interactionData

    let profile = await LearningProfile.findOne({ user_id: userId })

    if (!profile) {
      profile = await LearningProfile.create({ user_id: userId })
    }

    // --- Update interaction counts ---
    profile.total_interactions += 1
    if (isCorrect) {
      profile.total_correct += 1
    }

    // --- Update correct rate (rolling) ---
    profile.correct_rate = profile.total_interactions > 0
      ? profile.total_correct / profile.total_interactions
      : 0

    // --- Update average response time (exponential moving average) ---
    if (responseTimeMs && responseTimeMs > 0) {
      const alpha = 0.3 // smoothing factor
      profile.avg_response_time_ms = profile.avg_response_time_ms > 0
        ? Math.round(alpha * responseTimeMs + (1 - alpha) * profile.avg_response_time_ms)
        : responseTimeMs
    }

    // --- Update learning speed ---
    profile.learning_speed = this._computeLearningSpeed(profile)

    // --- Update difficulty level ---
    profile.difficulty_level = this._computeDifficultyLevel(profile, evaluatorUpdates)

    // --- Update mistake patterns ---
    if (!isCorrect && concept) {
      this._updateMistakePatterns(profile, concept, mistakeType)
    }

    // --- Update engagement score ---
    const engagementDelta = evaluatorUpdates.engagement_delta || (isCorrect ? 2 : -1)
    profile.engagement_score = Math.max(0, Math.min(100, profile.engagement_score + engagementDelta))

    // --- Update streak ---
    this._updateStreak(profile)

    // --- Infer preferred style ---
    profile.preferred_style = this._inferPreferredStyle(profile)

    await profile.save()

    // Invalidate cache
    profileCache.delete(`profile:${userId}`)

    console.log(`📊 [PersonalizationService] Profile updated: speed=${profile.learning_speed}, difficulty=${profile.difficulty_level}, engagement=${profile.engagement_score}`)

    return profile.toObject()
  }

  /**
   * Compute learning speed based on response time and accuracy
   */
  _computeLearningSpeed(profile) {
    const avgTime = profile.avg_response_time_ms
    const correctRate = profile.correct_rate

    // Fast: quick responses + high accuracy
    if (avgTime < 15000 && correctRate > 0.7) return 'fast'

    // Slow: long responses OR low accuracy
    if (avgTime > 45000 || correctRate < 0.35) return 'slow'

    return 'medium'
  }

  /**
   * Compute adaptive difficulty level
   */
  _computeDifficultyLevel(profile, evaluatorUpdates) {
    const recommendation = evaluatorUpdates.recommended_difficulty

    if (recommendation === 'increase') {
      const levels = ['easy', 'medium', 'hard']
      const currentIdx = levels.indexOf(profile.difficulty_level)
      if (currentIdx < levels.length - 1 && currentIdx >= 0) {
        return levels[currentIdx + 1]
      }
      // If currently adaptive with high correct rate, move to hard
      if (profile.correct_rate > 0.8) return 'hard'
      return 'medium'
    }

    if (recommendation === 'decrease') {
      const levels = ['easy', 'medium', 'hard']
      const currentIdx = levels.indexOf(profile.difficulty_level)
      if (currentIdx > 0) {
        return levels[currentIdx - 1]
      }
      return 'easy'
    }

    // Auto-adapt if currently set to adaptive
    if (profile.difficulty_level === 'adaptive') {
      if (profile.correct_rate > 0.75 && profile.learning_speed === 'fast') return 'hard'
      if (profile.correct_rate < 0.4 || profile.learning_speed === 'slow') return 'easy'
      return 'medium'
    }

    return profile.difficulty_level
  }

  /**
   * Update mistake patterns in the profile
   */
  _updateMistakePatterns(profile, concept, mistakeType) {
    const existing = profile.mistake_patterns.find(p => p.concept === concept)

    if (existing) {
      existing.frequency += 1
      existing.last_seen = new Date()
    } else {
      profile.mistake_patterns.push({
        concept,
        frequency: 1,
        last_seen: new Date(),
      })
    }

    // Keep only top 20 patterns, sorted by frequency
    if (profile.mistake_patterns.length > 20) {
      profile.mistake_patterns.sort((a, b) => b.frequency - a.frequency)
      profile.mistake_patterns = profile.mistake_patterns.slice(0, 20)
    }

    // Mark as modified for Mongoose
    profile.markModified('mistake_patterns')
  }

  /**
   * Update daily streak
   */
  _updateStreak(profile) {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const lastDate = profile.streak?.last_activity_date

    if (lastDate === today) {
      // Already active today, no change
      return
    }

    if (lastDate === yesterday) {
      // Consecutive day
      profile.streak.current += 1
    } else {
      // Streak broken or first day
      profile.streak.current = 1
    }

    profile.streak.last_activity_date = today
    profile.streak.longest = Math.max(profile.streak.longest, profile.streak.current)
    profile.markModified('streak')
  }

  /**
   * Infer preferred learning style from interaction patterns
   * If the student asks many "why" / "how does" questions → conceptual
   * If the student has high practical engagement → practical
   * For now, keep it simple: low mastery → conceptual, high mastery → practical
   */
  _inferPreferredStyle(profile) {
    // Students who are still building fundamentals benefit from conceptual
    if (profile.correct_rate < 0.5) return 'conceptual'
    // Students doing well can handle practical application
    if (profile.correct_rate > 0.7 && profile.total_interactions > 10) return 'practical'
    return profile.preferred_style || 'conceptual'
  }

  /**
   * Get a summary of the learning profile for display
   */
  async getProfileSummary(userId) {
    const profile = await this.getProfile(userId)

    return {
      learning_speed: profile.learning_speed,
      preferred_style: profile.preferred_style,
      difficulty_level: profile.difficulty_level,
      engagement_score: profile.engagement_score,
      correct_rate: Math.round((profile.correct_rate || 0) * 100),
      total_interactions: profile.total_interactions,
      streak: profile.streak,
      top_weaknesses: (profile.mistake_patterns || [])
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5)
        .map(p => ({ concept: p.concept, frequency: p.frequency })),
    }
  }
}

export default new PersonalizationService()
