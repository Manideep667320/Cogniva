import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import ReviewLog from '../models/ReviewLog.js';
import ReviewState from '../models/ReviewState.js';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route   GET /api/analytics/student
 * @desc    Get aggregated analytics data for the student dashboard
 */
router.get('/student', verifyToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Weakness Clusters (Top 5 weakest active concepts)
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
      // Custom weakness score calculation projection
      {
        $project: {
          front: '$flashcard.front',
          type: '$flashcard.type',
          weaknessScore: {
            $add: [
              { $multiply: ['$total_incorrect', 5.0] },
              { $multiply: ['$forgetting_frequency', 3.0] },
              { 
                $max: [0, { $multiply: [ { $subtract: ['$avg_response_time_ms', 3000] }, 0.001 ] }] 
              }
            ]
          }
        }
      },
      { $sort: { weaknessScore: -1 } },
      { $limit: 5 }
    ]);

    // 2. Consistency Data (Daily review counts for the last 30 days)
    const consistencyDataRaw = await ReviewLog.aggregate([
      { $match: { userId, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing dates for consistency chart
    const consistencyMap = new Map(consistencyDataRaw.map(d => [d._id, d.count]));
    const consistencyData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      consistencyData.push({
        date: dateStr,
        reviews: consistencyMap.get(dateStr) || 0
      });
    }

    // 3. Focus Trends (Average response time per day, last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const focusTrendsRaw = await ReviewLog.aggregate([
      { $match: { userId, createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          avgResponseTimeMs: { $avg: "$responseTimeMs" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const focusMap = new Map(focusTrendsRaw.map(d => [d._id, d.avgResponseTimeMs]));
    const focusTrends = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      // Convert ms to seconds for easier chart reading
      const avgSec = (focusMap.get(dateStr) || 0) / 1000;
      focusTrends.push({
        date: dateStr.substring(5), // Just MM-DD for x-axis
        avgTimeSeconds: parseFloat(avgSec.toFixed(1))
      });
    }

    // 4. Learning Velocity (Total reviews & accuracy rate over time)
    const velocityDataRaw = await ReviewLog.aggregate([
      { $match: { userId, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" }
          },
          totalReviews: { $sum: 1 },
          correctReviews: { $sum: { $cond: [{ $eq: ["$isCorrect", true] }, 1, 0] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } }
    ]);

    const velocityData = velocityDataRaw.map(d => ({
      week: `W${d._id.week}`,
      total: d.totalReviews,
      accuracy: Math.round((d.correctReviews / d.totalReviews) * 100) || 0
    }));

    res.json({
      success: true,
      data: {
        weaknessClusters,
        consistencyData,
        focusTrends,
        velocityData
      }
    });

  } catch (error) {
    console.error('Error fetching student analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
