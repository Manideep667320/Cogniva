import { Mastery } from '../models/Mastery.js'
import { SkillTree } from '../models/SkillTree.js'

/**
 * Diagnostic Agent Service
 * Reads mastery records and mistake patterns to identify weak concepts.
 * Pure data analysis — no LLM calls.
 */
class DiagnosticService {
  /**
   * Run diagnosis for a user on a specific skill tree
   * @returns {{ weakSkills, strongSkills, mistakePatterns, overallLevel, focusAreas, stats }}
   */
  async diagnose(userId, skillTreeId) {
    console.log('🔍 [DiagnosticAgent] Running diagnosis...')

    const [masteryRecords, skillTree] = await Promise.all([
      Mastery.find({ user_id: userId, skill_tree_id: skillTreeId }),
      SkillTree.findById(skillTreeId),
    ])

    if (!skillTree) {
      throw new Error('Skill tree not found')
    }

    const masteryMap = new Map()
    masteryRecords.forEach(m => masteryMap.set(m.skill_id, m))

    // Categorize skills
    const weakSkills = []
    const moderateSkills = []
    const strongSkills = []
    const notStarted = []

    for (const node of skillTree.nodes) {
      const mastery = masteryMap.get(node.id)
      const score = mastery?.mastery_score || 0
      const interactions = mastery?.interactions || 0

      const skillInfo = {
        skill_id: node.id,
        skill_name: node.name,
        description: node.description,
        mastery_score: score,
        interactions,
        correct_answers: mastery?.correct_answers || 0,
        mistakes_count: mastery?.mistakes?.length || 0,
        level: node.level,
        prerequisites: node.prerequisites,
      }

      if (interactions === 0) {
        notStarted.push(skillInfo)
      } else if (score < 40) {
        weakSkills.push(skillInfo)
      } else if (score < 75) {
        moderateSkills.push(skillInfo)
      } else {
        strongSkills.push(skillInfo)
      }
    }

    // Analyze mistake patterns across all mastery records
    const mistakePatterns = this._analyzeMistakePatterns(masteryRecords)

    // Determine overall level
    const overallLevel = this._determineOverallLevel(masteryRecords)

    // Identify focus areas — prioritized skills to work on next
    const focusAreas = this._identifyFocusAreas(weakSkills, moderateSkills, notStarted, skillTree.nodes, masteryMap)

    // Calculate stats
    const totalInteractions = masteryRecords.reduce((sum, m) => sum + m.interactions, 0)
    const totalCorrect = masteryRecords.reduce((sum, m) => sum + m.correct_answers, 0)
    const avgMastery = masteryRecords.length > 0
      ? Math.round(masteryRecords.reduce((sum, m) => sum + m.mastery_score, 0) / masteryRecords.length)
      : 0

    const diagnosis = {
      weakSkills,
      moderateSkills,
      strongSkills,
      notStarted,
      mistakePatterns,
      overallLevel,
      focusAreas,
      stats: {
        total_skills: skillTree.nodes.length,
        mastered: strongSkills.length,
        in_progress: weakSkills.length + moderateSkills.length,
        not_started: notStarted.length,
        avg_mastery: avgMastery,
        total_interactions: totalInteractions,
        total_correct: totalCorrect,
        accuracy_rate: totalInteractions > 0 ? Math.round((totalCorrect / totalInteractions) * 100) : 0,
      },
    }

    console.log(`✅ [DiagnosticAgent] Diagnosis complete: ${weakSkills.length} weak, ${moderateSkills.length} moderate, ${strongSkills.length} strong`)

    return diagnosis
  }

  /**
   * Analyze recurring mistake patterns across all mastery records
   */
  _analyzeMistakePatterns(masteryRecords) {
    const patternMap = new Map()

    for (const record of masteryRecords) {
      for (const mistake of (record.mistakes || [])) {
        const type = mistake.mistake_type || 'unknown'
        const concept = mistake.expected_concept || record.skill_name || 'unknown'
        const key = `${type}:${concept}`

        if (patternMap.has(key)) {
          const existing = patternMap.get(key)
          existing.frequency++
          existing.last_seen = mistake.timestamp || existing.last_seen
          existing.examples.push(mistake.question)
        } else {
          patternMap.set(key, {
            mistake_type: type,
            concept,
            frequency: 1,
            last_seen: mistake.timestamp || new Date(),
            examples: [mistake.question],
          })
        }
      }
    }

    // Sort by frequency (most common first) and return top patterns
    return Array.from(patternMap.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
      .map(p => ({
        ...p,
        examples: p.examples.slice(0, 3), // Keep only 3 example questions
      }))
  }

  /**
   * Determine overall level based on mastery distribution
   */
  _determineOverallLevel(masteryRecords) {
    if (masteryRecords.length === 0) return 'beginner'

    const avgMastery = masteryRecords.reduce((sum, m) => sum + m.mastery_score, 0) / masteryRecords.length

    if (avgMastery >= 80) return 'advanced'
    if (avgMastery >= 50) return 'intermediate'
    if (avgMastery >= 20) return 'developing'
    return 'beginner'
  }

  /**
   * Identify priority focus areas based on prerequisites and gaps
   */
  _identifyFocusAreas(weakSkills, moderateSkills, notStarted, allNodes, masteryMap) {
    const focusAreas = []

    // Priority 1: Weak skills that are prerequisites for other skills
    for (const weak of weakSkills) {
      const isDependency = allNodes.some(n =>
        n.prerequisites.includes(weak.skill_id)
      )
      if (isDependency) {
        focusAreas.push({
          ...weak,
          priority: 'critical',
          reason: 'This is a prerequisite for other skills and needs strengthening',
        })
      }
    }

    // Priority 2: Remaining weak skills
    for (const weak of weakSkills) {
      if (!focusAreas.find(f => f.skill_id === weak.skill_id)) {
        focusAreas.push({
          ...weak,
          priority: 'high',
          reason: 'Low mastery — needs more practice',
        })
      }
    }

    // Priority 3: Not-started skills whose prerequisites are met
    for (const ns of notStarted) {
      const prereqsMet = ns.prerequisites.every(prereqId => {
        const mastery = masteryMap.get(prereqId)
        return (mastery?.mastery_score || 0) >= 50
      })
      if (prereqsMet) {
        focusAreas.push({
          ...ns,
          priority: 'medium',
          reason: 'Prerequisites met — ready to start learning',
        })
      }
    }

    // Priority 4: Moderate skills close to mastery
    for (const mod of moderateSkills) {
      if (mod.mastery_score >= 65) {
        focusAreas.push({
          ...mod,
          priority: 'low',
          reason: 'Close to mastery — a few more sessions will solidify understanding',
        })
      }
    }

    return focusAreas.slice(0, 5) // Return top 5 focus areas
  }
}

export default new DiagnosticService()
