import diagnosticService from './diagnosticService.js'
import plannerService from './plannerService.js'
import evaluatorService from './evaluatorService.js'
import personalizationService from './personalizationService.js'
import OllamaService from './OllamaService.js'
import skillService from './skillService.js'
import embeddingService from './embeddingService.js'
import vectorService from './vectorService.js'
import { SkillTree } from '../models/SkillTree.js'
import { Upload } from '../models/Upload.js'

/**
 * Agent Orchestrator Service
 * Coordinates the full Diagnose → Plan → Teach → Evaluate → Update loop.
 * Each step is timed and logged for debuggability.
 */
class AgentService {
  /**
   * Run the full agent loop for a learning session
   * @param {string} userId
   * @param {string} skillTreeId
   * @param {string} [skillId] - Optional specific skill to focus on
   * @returns {Object} Complete agent loop result
   */
  async runLoop(userId, skillTreeId, skillId = null) {
    console.log('\n🤖 ═══════════════════════════════════')
    console.log('🤖 [AgentService] Starting agent loop')
    console.log('🤖 ═══════════════════════════════════')

    const timings = {}
    const startTotal = Date.now()

    // ─── Step 1: Diagnose ───────────────────────────
    let diagnosis
    const t1 = Date.now()
    try {
      diagnosis = await diagnosticService.diagnose(userId, skillTreeId)
      timings.diagnose = Date.now() - t1
    } catch (error) {
      console.error('❌ [AgentService] Diagnosis failed:', error.message)
      throw new Error(`Diagnostic agent failed: ${error.message}`)
    }

    // ─── Step 2: Get Learning Profile ────────────────
    const t2 = Date.now()
    const learningProfile = await personalizationService.getProfile(userId)
    timings.profile = Date.now() - t2

    // ─── Step 3: Plan ───────────────────────────────
    const t3 = Date.now()
    let plan
    try {
      // If a specific skill was requested, override focus
      if (skillId) {
        const targetSkill = this._findSkillInDiagnosis(diagnosis, skillId)
        if (targetSkill) {
          diagnosis.focusAreas = [targetSkill, ...diagnosis.focusAreas.filter(f => f.skill_id !== skillId)]
        }
      }
      plan = plannerService.plan(diagnosis, learningProfile)
      timings.plan = Date.now() - t3
    } catch (error) {
      console.error('❌ [AgentService] Planning failed:', error.message)
      throw new Error(`Planner agent failed: ${error.message}`)
    }

    if (!plan.selectedSkill) {
      return {
        status: 'complete',
        message: 'All skills are at a strong mastery level! Consider uploading new material.',
        diagnosis: diagnosis.stats,
        learningProfile,
        timings,
      }
    }

    // ─── Step 4: Teach (Generate Explanation) ────────
    const t4 = Date.now()
    let explanation
    try {
      explanation = await this._generateExplanation(
        userId,
        skillTreeId,
        plan.selectedSkill,
        plan.difficulty,
        plan.approachType
      )
      timings.teach = Date.now() - t4
    } catch (error) {
      console.error('❌ [AgentService] Teaching failed:', error.message)
      explanation = `Let me explain "${plan.selectedSkill.skill_name}". This is an important concept that we should explore step by step.`
      timings.teach = Date.now() - t4
    }

    // ─── Step 5: Generate Question ──────────────────
    const t5 = Date.now()
    let question
    try {
      question = await this._generateAdaptiveQuestion(
        userId,
        skillTreeId,
        plan.selectedSkill,
        plan.difficulty
      )
      timings.question = Date.now() - t5
    } catch (error) {
      console.error('❌ [AgentService] Question generation failed:', error.message)
      question = {
        question: `Explain the key concepts of "${plan.selectedSkill.skill_name}" in your own words.`,
        hint: 'Think about the main ideas and how they connect.',
        difficulty: plan.difficulty,
      }
      timings.question = Date.now() - t5
    }

    timings.total = Date.now() - startTotal

    console.log(`\n🤖 [AgentService] Loop complete in ${timings.total}ms`)
    console.log(`   Diagnose: ${timings.diagnose}ms, Profile: ${timings.profile}ms`)
    console.log(`   Plan: ${timings.plan}ms, Teach: ${timings.teach}ms, Question: ${timings.question}ms`)

    return {
      status: 'ready',
      diagnosis: {
        stats: diagnosis.stats,
        focusAreas: diagnosis.focusAreas,
        overallLevel: diagnosis.overallLevel,
      },
      plan: {
        selectedSkill: {
          skill_id: plan.selectedSkill.skill_id,
          skill_name: plan.selectedSkill.skill_name,
          mastery_score: plan.selectedSkill.mastery_score,
        },
        difficulty: plan.difficulty,
        approachType: plan.approachType,
        reasoning: plan.reasoning,
        sessionPlan: plan.sessionPlan,
      },
      explanation,
      question: {
        ...question,
        difficulty: plan.difficulty,
      },
      learningProfile: {
        learning_speed: learningProfile.learning_speed,
        difficulty_level: learningProfile.difficulty_level,
        engagement_score: learningProfile.engagement_score,
        correct_rate: Math.round((learningProfile.correct_rate || 0) * 100),
      },
      timings,
    }
  }

  /**
   * Evaluate an answer through the agent system
   */
  async evaluateAndUpdate(userId, skillTreeId, skillId, question, answer, responseTimeMs) {
    console.log('🤖 [AgentService] Evaluating answer via agent system...')

    // Get profile & context
    const [learningProfile, context] = await Promise.all([
      personalizationService.getProfile(userId),
      this._getContext(userId, skillTreeId, question),
    ])

    // Find skill name
    const skillTree = await SkillTree.findById(skillTreeId)
    const node = skillTree?.nodes.find(n => n.id === skillId)
    const skillName = node?.name || skillId

    // Run evaluator agent
    const evalResult = await evaluatorService.evaluate({
      question,
      answer,
      context,
      learningProfile,
      difficulty: learningProfile.difficulty_level || 'medium',
      skillName,
    })

    // Update mastery (using existing skillService)
    const isCorrect = evalResult.evaluation.is_correct || evalResult.evaluation.score >= 70
    const mistakeData = !isCorrect ? {
      question,
      user_answer: answer,
      expected_concept: (evalResult.evaluation.missing_concepts || []).join(', '),
      mistake_type: evalResult.evaluation.mistake_type || 'incomplete',
      feedback: evalResult.evaluation.feedback || '',
    } : null

    const mastery = await skillService.updateMastery(userId, skillTreeId, skillId, isCorrect, mistakeData)

    // Update learning profile
    const updatedProfile = await personalizationService.updateProfile(userId, {
      isCorrect,
      responseTimeMs: responseTimeMs || evalResult.metadata.evaluation_time_ms,
      mistakeType: evalResult.evaluation.mistake_type,
      concept: skillName,
      evaluatorUpdates: evalResult.profile_updates,
    })

    return {
      evaluation: evalResult.evaluation,
      reasoning_gaps: evalResult.reasoning_gaps,
      mastery: {
        skill_id: mastery.skill_id,
        skill_name: mastery.skill_name,
        mastery_score: mastery.mastery_score,
        interactions: mastery.interactions,
      },
      profile: {
        learning_speed: updatedProfile.learning_speed,
        difficulty_level: updatedProfile.difficulty_level,
        engagement_score: updatedProfile.engagement_score,
      },
    }
  }

  /**
   * Generate a difficulty-adapted explanation
   */
  async _generateExplanation(userId, skillTreeId, skill, difficulty, approachType) {
    const context = await this._getContext(userId, skillTreeId, skill.skill_name)

    const difficultyPrompt = {
      easy: 'Use simple language, analogies, and step-by-step breakdowns. Assume the student is a beginner.',
      medium: 'Give a clear, structured explanation with examples. Balance depth and clarity.',
      hard: 'Provide an in-depth explanation with technical details, edge cases, and advanced connections.',
    }

    const approachPrompt = {
      conceptual: 'Focus on the theory, definitions, and "why" behind the concept.',
      practical: 'Focus on practical applications, real-world examples, and hands-on exercises.',
    }

    const prompt = `You are an expert AI tutor. Explain "${skill.skill_name}" to a student.

${skill.description ? `TOPIC DESCRIPTION: ${skill.description}` : ''}

TEACHING APPROACH: ${approachPrompt[approachType] || approachPrompt.conceptual}
DIFFICULTY LEVEL: ${difficulty.toUpperCase()} — ${difficultyPrompt[difficulty] || difficultyPrompt.medium}

${context ? `REFERENCE MATERIAL:\n${context}` : ''}

INSTRUCTIONS:
- Provide a clear, engaging explanation
- Use the specified difficulty level and approach
- Include relevant examples
- End with 1-2 key takeaways

EXPLANATION:`

    const result = await OllamaService.generateResponse(prompt)
    return result.response
  }

  /**
   * Generate a question adapted to difficulty level
   */
  async _generateAdaptiveQuestion(userId, skillTreeId, skill, difficulty) {
    const context = await this._getContext(userId, skillTreeId, skill.skill_name)

    const difficultyGuide = {
      easy: 'Ask a simple, straightforward question that tests basic recall and understanding.',
      medium: 'Ask a question that requires applying the concept to a scenario.',
      hard: 'Ask a challenging question that requires deep analysis, synthesis, or problem-solving.',
    }

    const prompt = `You are an expert educator. Generate a practice question about "${skill.skill_name}".

${context ? `MATERIAL:\n${context.substring(0, 2000)}` : ''}

DIFFICULTY: ${difficulty.toUpperCase()} — ${difficultyGuide[difficulty] || difficultyGuide.medium}

Generate a question that tests understanding (not just memorization). Return ONLY valid JSON:
{
  "question": "The question text",
  "hint": "A subtle hint that guides without giving the answer",
  "difficulty": "${difficulty}",
  "expected_concepts": ["concept1", "concept2"]
}

Return ONLY the JSON:`

    try {
      const result = await OllamaService.generateResponse(prompt)
      const text = result.response

      try {
        return JSON.parse(text)
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) return JSON.parse(jsonMatch[0])
      }
    } catch (err) {
      console.warn('⚠️ Question generation failed, using fallback:', err.message)
    }

    return {
      question: `Explain the key concepts of "${skill.skill_name}" in your own words.`,
      hint: 'Think about the main ideas and how they connect.',
      difficulty,
      expected_concepts: [skill.skill_name],
    }
  }

  /**
   * Get RAG context for a skill/query
   */
  async _getContext(userId, skillTreeId, query) {
    try {
      const skillTree = await SkillTree.findById(skillTreeId)
      if (!skillTree) return ''

      const isChromaAvailable = await vectorService.isAvailable()

      if (isChromaAvailable && skillTree.embedding_collection) {
        const queryEmbedding = await embeddingService.generateEmbedding(query)
        const results = await vectorService.queryRelevant(
          skillTree.embedding_collection,
          queryEmbedding,
          3
        )
        if (results.length > 0) {
          return results.map(r => r.content).join('\n\n')
        }
      }

      // Fallback to upload text
      const upload = await Upload.findOne({
        skill_tree_id: skillTreeId,
        user_id: userId,
        status: 'completed',
      })
      return upload?.text_content?.substring(0, 3000) || ''
    } catch {
      return ''
    }
  }

  /**
   * Find a skill in diagnosis data structures
   */
  _findSkillInDiagnosis(diagnosis, skillId) {
    const allSkills = [
      ...diagnosis.weakSkills,
      ...diagnosis.moderateSkills,
      ...diagnosis.strongSkills,
      ...diagnosis.notStarted,
    ]
    return allSkills.find(s => s.skill_id === skillId) || null
  }
}

export default new AgentService()
