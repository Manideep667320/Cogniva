import { SkillTree } from '../models/SkillTree.js'
import { Mastery } from '../models/Mastery.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import vectorService from '../services/vectorService.js'

// GET /api/skill-tree — List all skill trees for user
export const listSkillTrees = asyncHandler(async (req, res) => {
  const userId = req.userDb._id

  const skillTrees = await SkillTree.find({ user_id: userId })
    .sort({ created_at: -1 })

  // Attach mastery summary for each tree
  const treesWithMastery = await Promise.all(
    skillTrees.map(async (tree) => {
      const masteryRecords = await Mastery.find({
        user_id: userId,
        skill_tree_id: tree._id,
      })

      const totalMastery = masteryRecords.reduce((sum, m) => sum + m.mastery_score, 0)
      const avgMastery = masteryRecords.length > 0
        ? Math.round(totalMastery / masteryRecords.length)
        : 0

      return {
        ...tree.toObject(),
        overall_mastery: avgMastery,
        total_interactions: masteryRecords.reduce((sum, m) => sum + m.interactions, 0),
      }
    })
  )

  res.json({
    success: true,
    message: 'Skill trees retrieved',
    data: treesWithMastery,
  })
})

// GET /api/skill-tree/:id — Get specific skill tree with mastery data
export const getSkillTree = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userDb._id

  const skillTree = await SkillTree.findOne({ _id: id, user_id: userId })

  if (!skillTree) {
    return res.status(404).json({
      success: false,
      message: 'Skill tree not found',
    })
  }

  // Get mastery records for all nodes
  const masteryRecords = await Mastery.find({
    user_id: userId,
    skill_tree_id: skillTree._id,
  })

  const masteryMap = {}
  masteryRecords.forEach(m => {
    masteryMap[m.skill_id] = {
      mastery_score: m.mastery_score,
      interactions: m.interactions,
      correct_answers: m.correct_answers,
      last_interaction: m.last_interaction,
      mistakes_count: m.mistakes.length,
    }
  })

  // Enrich nodes with mastery data
  const enrichedNodes = skillTree.nodes.map(node => ({
    ...node.toObject ? node.toObject() : node,
    mastery_data: masteryMap[node.id] || {
      mastery_score: 0,
      interactions: 0,
      correct_answers: 0,
      last_interaction: null,
      mistakes_count: 0,
    },
  }))

  const totalMastery = masteryRecords.reduce((sum, m) => sum + m.mastery_score, 0)
  const avgMastery = masteryRecords.length > 0
    ? Math.round(totalMastery / masteryRecords.length)
    : 0

  res.json({
    success: true,
    message: 'Skill tree retrieved',
    data: {
      ...skillTree.toObject(),
      nodes: enrichedNodes,
      overall_mastery: avgMastery,
      total_interactions: masteryRecords.reduce((sum, m) => sum + m.interactions, 0),
    },
  })
})

// DELETE /api/skill-tree/:id — Delete skill tree and associated data
export const deleteSkillTree = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userDb._id

  const skillTree = await SkillTree.findOneAndDelete({ _id: id, user_id: userId })

  if (!skillTree) {
    return res.status(404).json({
      success: false,
      message: 'Skill tree not found',
    })
  }

  // Clean up associated data
  await Mastery.deleteMany({ skill_tree_id: id })

  // Clean up ChromaDB collection
  if (skillTree.embedding_collection) {
    await vectorService.deleteCollection(skillTree.embedding_collection)
  }

  res.json({
    success: true,
    message: 'Skill tree deleted successfully',
    data: { id },
  })
})

// GET /api/skill-tree/:id/mastery — Get detailed mastery for a skill tree
export const getSkillTreeMastery = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userDb._id

  const masteryRecords = await Mastery.find({
    user_id: userId,
    skill_tree_id: id,
  }).sort({ mastery_score: 1 })

  const weakSkills = masteryRecords.filter(m => m.mastery_score < 50)
  const strongSkills = masteryRecords.filter(m => m.mastery_score >= 80)

  res.json({
    success: true,
    message: 'Mastery data retrieved',
    data: {
      records: masteryRecords,
      summary: {
        total_skills: masteryRecords.length,
        weak_skills: weakSkills.length,
        strong_skills: strongSkills.length,
        average_mastery: masteryRecords.length > 0
          ? Math.round(
              masteryRecords.reduce((sum, m) => sum + m.mastery_score, 0) / masteryRecords.length
            )
          : 0,
      },
    },
  })
})
