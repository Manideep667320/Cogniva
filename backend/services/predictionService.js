import { LearningProfile } from '../models/LearningProfile.js'
import { Mastery } from '../models/Mastery.js'

class PredictionService {
  /**
   * Calculate heuristic risk score for a student
   * @param {string} userId
   * @returns {Object} Risk assessment
   */
  async calculateStudentRisk(userId) {
    const profile = await LearningProfile.findOne({ user_id: userId })
    if (!profile) {
      return {
        risk_level: 'unknown',
        score: 0,
        contributing_factors: ['No learning profile found'],
        recommended_actions: []
      }
    }

    const masteries = await Mastery.find({ user_id: userId })
    
    // 1. Weakness Density: % of skills below 40% mastery
    let weaknessDensity = 0
    if (masteries.length > 0) {
      const weakSkills = masteries.filter(m => m.mastery_score < 40 && m.interactions > 0).length
      weaknessDensity = weakSkills / masteries.length
    }

    // 2. Engagement Decay: days since last interaction
    const lastActivity = profile.streak?.last_activity_date 
      ? new Date(profile.streak.last_activity_date) 
      : new Date(0)
    const daysSinceLastActive = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    
    // 3. Streak Health
    const currentStreak = profile.streak?.current || 0
    
    // 4. Correct Rate Trend
    const correctRate = profile.correct_rate || 0

    // Heuristic Weights
    let riskScore = 0
    const factors = []
    const recommendations = []

    // Factor 1: Weakness Density (max 40 points)
    if (weaknessDensity > 0.5) {
      riskScore += 40
      factors.push('High concentration of weak skills')
      recommendations.push('Focus on fundamental reviews before learning new topics')
    } else if (weaknessDensity > 0.2) {
      riskScore += 20
      factors.push('Several weak skills identified')
      recommendations.push('Schedule targeted review sessions')
    }

    // Factor 2: Engagement Decay (max 30 points)
    if (daysSinceLastActive > 7) {
      riskScore += 30
      factors.push(`No activity for ${daysSinceLastActive} days`)
      recommendations.push('Re-engage with a short, easy study session')
    } else if (daysSinceLastActive > 3) {
      riskScore += 15
      factors.push('Activity dropping recently')
      recommendations.push('Try to maintain a daily study habit')
    }

    // Factor 3: Correct Rate (max 20 points)
    if (correctRate < 0.4 && profile.total_interactions > 10) {
      riskScore += 20
      factors.push('Consistently low correct answer rate')
      recommendations.push('Review foundational concepts or adjust difficulty')
    } else if (correctRate < 0.6 && profile.total_interactions > 10) {
      riskScore += 10
      factors.push('Struggling with some questions')
    }

    // Factor 4: Streak Health (Bonus: reduces risk by up to 10 points)
    if (currentStreak > 7) {
      riskScore = Math.max(0, riskScore - 10)
      factors.push('Strong consistent study streak')
    }

    // Classify Risk Level
    let riskLevel = 'low'
    if (riskScore >= 60) riskLevel = 'high'
    else if (riskScore >= 30) riskLevel = 'medium'

    if (riskLevel === 'low' && factors.length === 0) {
      factors.push('Consistent performance and engagement')
      recommendations.push('Keep up the good work!')
    }

    return {
      risk_level: riskLevel,
      score: riskScore, // 0-100 where higher is worse
      predicted_mastery_30d: this._estimateFutureMastery(profile, masteries, riskScore),
      contributing_factors: factors,
      recommended_actions: recommendations
    }
  }

  _estimateFutureMastery(profile, masteries, riskScore) {
    if (masteries.length === 0) return 0
    const avgMastery = masteries.reduce((acc, m) => acc + m.mastery_score, 0) / masteries.length
    
    // Simple linear projection based on risk
    // High risk -> mastery drops or stays stagnant
    // Low risk -> mastery grows
    let projected = avgMastery
    if (riskScore < 30) projected += 15 // Good trajectory
    else if (riskScore < 60) projected += 5 // Moderate trajectory
    else projected -= 10 // Poor trajectory

    return Math.max(0, Math.min(100, Math.round(projected)))
  }
}

export default new PredictionService()
