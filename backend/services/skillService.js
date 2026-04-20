import { SkillTree } from '../models/SkillTree.js'
import { Mastery } from '../models/Mastery.js'
import OllamaService from './OllamaService.js'

/**
 * Skill Service
 * Handles skill tree generation from content and recommendation logic.
 */
class SkillService {
  /**
   * Generate a skill tree from extracted text content using LLM
   */
  async generateSkillTree(textContent, userId, title, embeddingCollection) {
    const prompt = `You are an expert educator. Analyze the following study material and extract a structured skill tree.

INSTRUCTIONS:
1. Identify the main topics and subtopics from the content
2. Determine prerequisite relationships between topics
3. Assign difficulty levels (0 = foundational, higher = more advanced)
4. Return ONLY valid JSON, no other text

The JSON must follow this exact format:
{
  "title": "Title describing the overall subject",
  "nodes": [
    {
      "id": "unique_id_1",
      "name": "Topic Name",
      "description": "Brief description of what this topic covers",
      "prerequisites": [],
      "level": 0
    },
    {
      "id": "unique_id_2",
      "name": "Subtopic Name",
      "description": "Brief description",
      "prerequisites": ["unique_id_1"],
      "level": 1
    }
  ]
}

Rules:
- Generate between 5-15 nodes
- Use snake_case for IDs (e.g., "linear_algebra", "matrix_operations")
- Root nodes have empty prerequisites and level 0
- Each node should have at most 2-3 prerequisites
- Ensure the prerequisite graph is a valid DAG (no cycles)

STUDY MATERIAL:
${textContent.substring(0, 4000)}

Return ONLY the JSON:`

    try {
      console.log('🌳 Generating skill tree via LLM...')

      const result = await OllamaService.generateResponse(prompt)
      const responseText = result.response

      // Parse the JSON from the response
      const skillData = this._parseSkillTreeJSON(responseText)

      if (!skillData || !skillData.nodes || skillData.nodes.length === 0) {
        throw new Error('LLM returned invalid skill tree structure')
      }

      // Create skill tree in database
      const skillTree = await SkillTree.create({
        user_id: userId,
        title: skillData.title || title || 'Untitled Skill Tree',
        source_file: title,
        nodes: skillData.nodes.map(node => ({
          id: node.id,
          name: node.name,
          description: node.description || '',
          prerequisites: node.prerequisites || [],
          mastery: 0,
          level: node.level || 0,
        })),
        embedding_collection: embeddingCollection,
        status: 'ready',
      })

      // Create initial mastery records for each node
      const masteryPromises = skillData.nodes.map(node =>
        Mastery.findOneAndUpdate(
          { user_id: userId, skill_id: node.id },
          {
            user_id: userId,
            skill_tree_id: skillTree._id,
            skill_id: node.id,
            skill_name: node.name,
            mastery_score: 0,
            interactions: 0,
            correct_answers: 0,
            mistakes: [],
          },
          { upsert: true, new: true }
        )
      )
      await Promise.all(masteryPromises)

      console.log(`✅ Skill tree created with ${skillData.nodes.length} nodes`)
      return skillTree
    } catch (error) {
      console.error('❌ Skill tree generation failed:', error.message)
      throw error
    }
  }

  /**
   * Get recommendations based on mastery levels
   */
  async getRecommendations(userId, skillTreeId) {
    const skillTree = await SkillTree.findOne({
      _id: skillTreeId,
      user_id: userId,
    })

    if (!skillTree) {
      throw new Error('Skill tree not found')
    }

    const masteryRecords = await Mastery.find({
      user_id: userId,
      skill_tree_id: skillTreeId,
    })

    const masteryMap = {}
    masteryRecords.forEach(m => {
      masteryMap[m.skill_id] = m
    })

    const recommendations = {
      repeat_basics: [],     // mastery < 50
      moderate_practice: [],  // mastery 50-80
      ready_to_advance: [],   // mastery > 80
      next_skills: [],        // unlocked but not started
    }

    for (const node of skillTree.nodes) {
      const mastery = masteryMap[node.id]
      const score = mastery?.mastery_score || 0

      // Check if prerequisites are met (mastery > 50)
      const prerequisitesMet = node.prerequisites.every(prereqId => {
        const prereqMastery = masteryMap[prereqId]
        return (prereqMastery?.mastery_score || 0) >= 50
      })

      const item = {
        skill_id: node.id,
        skill_name: node.name,
        description: node.description,
        mastery_score: score,
        interactions: mastery?.interactions || 0,
        prerequisites_met: prerequisitesMet,
        level: node.level,
      }

      if (score < 50 && (mastery?.interactions || 0) > 0) {
        recommendations.repeat_basics.push(item)
      } else if (score >= 50 && score < 80) {
        recommendations.moderate_practice.push(item)
      } else if (score >= 80) {
        recommendations.ready_to_advance.push(item)
      }

      if ((mastery?.interactions || 0) === 0 && prerequisitesMet) {
        recommendations.next_skills.push(item)
      }
    }

    // Sort next_skills by level (lower levels first)
    recommendations.next_skills.sort((a, b) => a.level - b.level)

    return {
      skill_tree_id: skillTreeId,
      skill_tree_title: skillTree.title,
      total_nodes: skillTree.nodes.length,
      overall_mastery: this._calculateOverallMastery(masteryRecords),
      recommendations,
    }
  }

  /**
   * Update mastery score after an interaction
   */
  async updateMastery(userId, skillTreeId, skillId, isCorrect, mistakeData = null) {
    let mastery = await Mastery.findOne({
      user_id: userId,
      skill_id: skillId,
    })

    if (!mastery) {
      const skillTree = await SkillTree.findById(skillTreeId)
      const node = skillTree?.nodes.find(n => n.id === skillId)

      mastery = await Mastery.create({
        user_id: userId,
        skill_tree_id: skillTreeId,
        skill_id: skillId,
        skill_name: node?.name || skillId,
        mastery_score: 0,
        interactions: 0,
        correct_answers: 0,
      })
    }

    mastery.interactions += 1
    mastery.last_interaction = new Date()

    if (isCorrect) {
      mastery.correct_answers += 1
      // Increase mastery (diminishing returns)
      const increase = Math.max(5, 20 - mastery.mastery_score * 0.15)
      mastery.mastery_score = Math.min(100, mastery.mastery_score + increase)
    } else {
      // Decrease mastery slightly
      mastery.mastery_score = Math.max(0, mastery.mastery_score - 5)

      if (mistakeData) {
        mastery.mistakes.push({
          question: mistakeData.question,
          user_answer: mistakeData.user_answer,
          expected_concept: mistakeData.expected_concept,
          mistake_type: mistakeData.mistake_type,
          feedback: mistakeData.feedback,
          timestamp: new Date(),
        })

        // Keep only last 20 mistakes
        if (mastery.mistakes.length > 20) {
          mastery.mistakes = mastery.mistakes.slice(-20)
        }
      }
    }

    await mastery.save()

    // Also update the mastery score in the skill tree node
    await SkillTree.updateOne(
      { _id: skillTreeId, 'nodes.id': skillId },
      { $set: { 'nodes.$.mastery': mastery.mastery_score } }
    )

    return mastery
  }

  /**
   * Calculate overall mastery percentage across all nodes
   */
  _calculateOverallMastery(masteryRecords) {
    if (!masteryRecords || masteryRecords.length === 0) return 0
    const total = masteryRecords.reduce((sum, m) => sum + m.mastery_score, 0)
    return Math.round(total / masteryRecords.length)
  }

  /**
   * Parse JSON from LLM response (handles markdown code blocks etc.)
   */
  _parseSkillTreeJSON(text) {
    // Try direct parse first
    try {
      return JSON.parse(text)
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1].trim())
        } catch {
          // continue to next attempt
        }
      }

      // Try to find JSON object in text
      const braceMatch = text.match(/\{[\s\S]*\}/)
      if (braceMatch) {
        try {
          return JSON.parse(braceMatch[0])
        } catch {
          // continue
        }
      }

      throw new Error('Could not parse skill tree JSON from LLM response')
    }
  }
}

export default new SkillService()
