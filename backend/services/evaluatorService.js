import OllamaService from './OllamaService.js'

/**
 * Evaluator Agent Service
 * Enhanced answer evaluation that detects reasoning gaps
 * and provides profile update recommendations.
 */
class EvaluatorService {
  /**
   * Evaluate a student's answer with personalization context
   * @param {Object} params
   * @param {string} params.question - The question asked
   * @param {string} params.answer - Student's answer
   * @param {string} params.context - RAG context material
   * @param {Object} params.learningProfile - Student's learning profile
   * @param {string} params.difficulty - Current difficulty level
   * @param {string} params.skillName - Name of the skill being tested
   * @returns {Object} evaluation result with profile update recommendations
   */
  async evaluate({ question, answer, context, learningProfile, difficulty, skillName }) {
    console.log('📝 [EvaluatorAgent] Evaluating answer...')

    const startTime = Date.now()

    // Build an enhanced evaluation prompt that considers difficulty
    const difficultyContext = this._getDifficultyGuidance(difficulty)
    const evaluation = await OllamaService.evaluateAnswer(question, answer, context)

    const responseTimeMs = Date.now() - startTime

    // Enhance evaluation with reasoning gap analysis
    const reasoningGaps = this._detectReasoningGaps(evaluation, question, answer)

    // Generate profile update recommendations
    const profileUpdates = this._computeProfileUpdates(
      evaluation,
      learningProfile,
      responseTimeMs,
      difficulty
    )

    const result = {
      evaluation: {
        is_correct: evaluation.is_correct || false,
        score: evaluation.score || 0,
        feedback: evaluation.feedback || 'No feedback available',
        missing_concepts: evaluation.missing_concepts || [],
        mistake_type: evaluation.mistake_type || null,
        expected_key_points: evaluation.expected_key_points || [],
        follow_up_question: evaluation.follow_up_question || null,
      },
      reasoning_gaps: reasoningGaps,
      profile_updates: profileUpdates,
      metadata: {
        difficulty_used: difficulty,
        evaluation_time_ms: responseTimeMs,
        skill_name: skillName,
      },
    }

    console.log(`✅ [EvaluatorAgent] Evaluation complete: score=${result.evaluation.score}, correct=${result.evaluation.is_correct}`)

    return result
  }

  /**
   * Detect specific reasoning gaps from the evaluation
   */
  _detectReasoningGaps(evaluation, question, answer) {
    const gaps = []

    if (!evaluation) return gaps

    const mistakeType = evaluation.mistake_type || ''
    const missingConcepts = evaluation.missing_concepts || []

    if (mistakeType === 'misconception') {
      gaps.push({
        type: 'misconception',
        severity: 'high',
        description: 'The answer shows a fundamental misunderstanding of the concept',
        recommendation: 'Re-learn the core concept from scratch with simplified explanations',
      })
    }

    if (mistakeType === 'partial_understanding') {
      gaps.push({
        type: 'incomplete_model',
        severity: 'medium',
        description: 'The answer shows partial understanding but misses key connections',
        recommendation: 'Focus on how this concept connects to related topics',
      })
    }

    if (missingConcepts.length > 2) {
      gaps.push({
        type: 'knowledge_gap',
        severity: 'high',
        description: `Multiple concepts are missing: ${missingConcepts.join(', ')}`,
        recommendation: 'Review prerequisite material before continuing',
      })
    }

    if (answer && answer.trim().split(/\s+/).length < 10 && !evaluation.is_correct) {
      gaps.push({
        type: 'shallow_response',
        severity: 'low',
        description: 'The answer is too brief to demonstrate understanding',
        recommendation: 'Try explaining in more detail with examples',
      })
    }

    return gaps
  }

  /**
   * Compute recommended learning profile updates based on evaluation
   */
  _computeProfileUpdates(evaluation, learningProfile, responseTimeMs, difficulty) {
    const updates = {}
    const profile = learningProfile || {}
    const isCorrect = evaluation?.is_correct || false
    const score = evaluation?.score || 0

    // --- Learning speed update ---
    const avgTime = profile.avg_response_time_ms || 30000
    // Use a weighted comparison (actual vs historical)
    if (responseTimeMs < avgTime * 0.6 && isCorrect) {
      updates.learning_speed_trend = 'faster'
    } else if (responseTimeMs > avgTime * 1.5) {
      updates.learning_speed_trend = 'slower'
    } else {
      updates.learning_speed_trend = 'stable'
    }

    // --- Difficulty adjustment recommendation ---
    const currentDifficulty = profile.difficulty_level || 'medium'
    if (isCorrect && score >= 85 && difficulty !== 'hard') {
      updates.recommended_difficulty = 'increase'
    } else if (!isCorrect && score < 30 && difficulty !== 'easy') {
      updates.recommended_difficulty = 'decrease'
    } else {
      updates.recommended_difficulty = 'maintain'
    }

    // --- Engagement score delta ---
    if (isCorrect) {
      updates.engagement_delta = Math.min(5, Math.round(score / 20))
    } else {
      updates.engagement_delta = -2
    }

    // --- Correct rate update ---
    updates.is_correct = isCorrect
    updates.response_time_ms = responseTimeMs

    return updates
  }

  /**
   * Get difficulty-specific guidance for evaluation
   */
  _getDifficultyGuidance(difficulty) {
    switch (difficulty) {
      case 'easy':
        return 'Evaluate generously — focus on whether the student grasps the basic idea.'
      case 'hard':
        return 'Evaluate strictly — expect precise terminology and deep understanding.'
      default:
        return 'Evaluate fairly — balanced expectations for detail and accuracy.'
    }
  }
}

export default new EvaluatorService()
