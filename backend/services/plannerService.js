/**
 * Planner Agent Service
 * Selects the next topic and adjusts difficulty level based on
 * diagnosis results and learning profile data.
 * Deterministic logic — no LLM calls.
 */
class PlannerService {
  /**
   * Create a learning plan based on diagnosis and profile
   * @param {Object} diagnosis - from DiagnosticService
   * @param {Object} learningProfile - from LearningProfile model
   * @returns {{ selectedSkill, difficulty, approachType, reasoning, sessionPlan }}
   */
  plan(diagnosis, learningProfile) {
    console.log('📋 [PlannerAgent] Creating learning plan...')

    const selectedSkill = this._selectNextSkill(diagnosis)
    const difficulty = this._adjustDifficulty(diagnosis, learningProfile, selectedSkill)
    const approachType = this._determineApproach(learningProfile, selectedSkill)
    const reasoning = this._generateReasoning(selectedSkill, difficulty, approachType, diagnosis)
    const sessionPlan = this._buildSessionPlan(selectedSkill, difficulty, approachType)

    const plan = {
      selectedSkill,
      difficulty,
      approachType,
      reasoning,
      sessionPlan,
    }

    console.log(`✅ [PlannerAgent] Plan: skill="${selectedSkill?.skill_name}", difficulty="${difficulty}", approach="${approachType}"`)

    return plan
  }

  /**
   * Select the best next skill to study
   * Priority: critical focus areas → high priority → medium → low
   */
  _selectNextSkill(diagnosis) {
    const { focusAreas, weakSkills, notStarted, moderateSkills } = diagnosis

    // Use focus areas if available (already prioritized)
    if (focusAreas && focusAreas.length > 0) {
      return focusAreas[0]
    }

    // Fallback: weakest skill first
    if (weakSkills.length > 0) {
      return weakSkills.sort((a, b) => a.mastery_score - b.mastery_score)[0]
    }

    // Then not-started skills (lowest level first)
    if (notStarted.length > 0) {
      return notStarted.sort((a, b) => a.level - b.level)[0]
    }

    // Then moderate skills closest to mastery
    if (moderateSkills.length > 0) {
      return moderateSkills.sort((a, b) => b.mastery_score - a.mastery_score)[0]
    }

    return null
  }

  /**
   * Adjust difficulty based on adaptation rules:
   * - Repeated mistakes → simplify (easy)
   * - Fast correct answers → increase (hard)
   * - Moderate performance → maintain (medium)
   */
  _adjustDifficulty(diagnosis, learningProfile, selectedSkill) {
    if (!selectedSkill) return 'medium'

    const profile = learningProfile || {}
    const currentDifficulty = profile.difficulty_level || 'adaptive'

    // Check for repeated mistakes on this skill
    const mistakesOnSkill = diagnosis.mistakePatterns?.filter(
      p => p.concept === selectedSkill.skill_name
    ) || []
    const hasRepeatedMistakes = mistakesOnSkill.some(p => p.frequency >= 3)

    // Check learning speed
    const speed = profile.learning_speed || 'medium'
    const correctRate = profile.correct_rate || 0

    // Adaptation rules
    if (hasRepeatedMistakes || (selectedSkill.mastery_score < 20 && selectedSkill.interactions > 3)) {
      return 'easy'
    }

    if (speed === 'fast' && correctRate > 0.8 && selectedSkill.mastery_score > 60) {
      return 'hard'
    }

    if (speed === 'slow' || correctRate < 0.4) {
      return 'easy'
    }

    if (correctRate >= 0.6 && selectedSkill.mastery_score >= 40) {
      return 'medium'
    }

    return currentDifficulty === 'adaptive' ? 'medium' : currentDifficulty
  }

  /**
   * Determine teaching approach based on learning style
   */
  _determineApproach(learningProfile, selectedSkill) {
    const style = learningProfile?.preferred_style || 'conceptual'

    if (!selectedSkill) return style

    // If skill is brand new, always start conceptual
    if (selectedSkill.interactions === 0) {
      return 'conceptual'
    }

    // If student has high mastery but is still practicing, use practical
    if (selectedSkill.mastery_score >= 60) {
      return 'practical'
    }

    // If many mistakes, go back to conceptual
    if (selectedSkill.mistakes_count > 3 && selectedSkill.mastery_score < 50) {
      return 'conceptual'
    }

    return style
  }

  /**
   * Generate human-readable reasoning for the plan
   */
  _generateReasoning(selectedSkill, difficulty, approachType, diagnosis) {
    if (!selectedSkill) {
      return 'All skills are at a good mastery level. Consider reviewing or exploring new material.'
    }

    const parts = []

    if (selectedSkill.priority === 'critical') {
      parts.push(`"${selectedSkill.skill_name}" is a critical prerequisite for other skills and needs immediate attention.`)
    } else if (selectedSkill.mastery_score < 30) {
      parts.push(`"${selectedSkill.skill_name}" has low mastery (${selectedSkill.mastery_score}%) and needs focused practice.`)
    } else if (selectedSkill.interactions === 0) {
      parts.push(`"${selectedSkill.skill_name}" hasn't been started yet and prerequisites are met.`)
    } else {
      parts.push(`"${selectedSkill.skill_name}" is at ${selectedSkill.mastery_score}% mastery and can be improved.`)
    }

    if (difficulty === 'easy') {
      parts.push('Difficulty set to EASY to build confidence and reinforce fundamentals.')
    } else if (difficulty === 'hard') {
      parts.push('Difficulty set to HARD to challenge and deepen understanding.')
    }

    if (approachType === 'practical') {
      parts.push('Using a practical approach with examples and exercises.')
    } else {
      parts.push('Using a conceptual approach to build solid theoretical understanding.')
    }

    return parts.join(' ')
  }

  /**
   * Build a structured session plan
   */
  _buildSessionPlan(selectedSkill, difficulty, approachType) {
    if (!selectedSkill) {
      return { steps: ['Review completed topics', 'Explore advanced concepts'] }
    }

    const steps = []

    if (approachType === 'conceptual') {
      steps.push(`Review core concepts of "${selectedSkill.skill_name}"`)
      if (difficulty === 'easy') {
        steps.push('Start with simplified explanations and analogies')
      } else {
        steps.push('Study detailed theoretical foundations')
      }
      steps.push('Answer a practice question to test understanding')
    } else {
      steps.push(`Apply "${selectedSkill.skill_name}" with hands-on examples`)
      if (difficulty === 'hard') {
        steps.push('Work through a challenging problem scenario')
      } else {
        steps.push('Practice with guided exercises')
      }
      steps.push('Solve a practice problem to demonstrate mastery')
    }

    steps.push('Review feedback and update mastery')

    return {
      steps,
      estimated_time_min: difficulty === 'easy' ? 5 : difficulty === 'hard' ? 15 : 10,
    }
  }
}

export default new PlannerService()
