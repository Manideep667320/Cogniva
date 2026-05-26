import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import StudyPlan from '../models/StudyPlan.js';
import ReviewState from '../models/ReviewState.js';
import SkillTree from '../models/SkillTree.js';
import { runScheduleTask } from '../agents/scheduleAgent.js';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route   GET /api/plan/schedule
 * @desc    Get the user's study plan for the current week
 */
router.get('/schedule', verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const plans = await StudyPlan.find({
      userId: req.userId,
      date: { $gte: today, $lt: nextWeek }
    }).sort({ date: 1 });

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/plan/generate
 * @desc    Generate a new 7-day study plan using the Schedule Agent
 */
router.post('/generate', verifyToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    // 1. Fetch Weaknesses (same logic as analytics to get topics)
    const weaknessClusters = await ReviewState.aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: 'flashcards',
          localField: 'flashcardId',
          foreignField: '_id',
          as: 'flashcard'
        }
      },
      { $unwind: '$flashcard' },
      {
        $project: {
          front: '$flashcard.front',
          weaknessScore: {
            $add: [
              { $multiply: ['$total_incorrect', 5.0] },
              { $multiply: ['$forgetting_frequency', 3.0] }
            ]
          }
        }
      },
      { $sort: { weaknessScore: -1 } },
      { $limit: 5 }
    ]);
    const weaknesses = weaknessClusters.map(w => w.front);

    // 2. Fetch pending skills
    const pendingSkillsRaw = await SkillTree.find({ 
      user_id: userId, 
      status: { $in: ['not_started', 'in_progress'] } 
    }).limit(3);
    const pendingSkills = pendingSkillsRaw.map(s => s.skill_name);

    // 3. Run Agent
    const scheduleData = await runScheduleTask(
      weaknesses.length ? weaknesses : ['General review'],
      pendingSkills.length ? pendingSkills : ['Explore new courses']
    );

    // 4. Delete existing plans for the next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    await StudyPlan.deleteMany({
      userId: req.userId,
      date: { $gte: today, $lt: nextWeek }
    });

    // 5. Save new plans
    const newPlans = [];
    for (const dayPlan of scheduleData) {
      const planDate = new Date(today);
      planDate.setDate(planDate.getDate() + dayPlan.dayOffset);
      
      const plan = new StudyPlan({
        userId: req.userId,
        date: planDate,
        tasks: dayPlan.tasks.map(t => ({
          title: t.title,
          topic: t.topic,
          type: t.type,
          durationMinutes: t.durationMinutes || 30,
          completed: false
        }))
      });
      newPlans.push(plan);
    }
    await StudyPlan.insertMany(newPlans);

    res.json({ success: true, data: newPlans });
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to generate schedule' });
  }
});

/**
 * @route   PUT /api/plan/task/:planId/:taskId
 * @desc    Toggle task completion status
 */
router.put('/task/:planId/:taskId', verifyToken, async (req, res) => {
  try {
    const { planId, taskId } = req.params;
    const { completed } = req.body;

    const plan = await StudyPlan.findOne({ _id: planId, userId: req.userId });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const task = plan.tasks.id(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.completed = completed;
    await plan.save();

    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
});

export default router;
