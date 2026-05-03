import { Mastery } from '../models/Mastery.js'
import { User } from '../models/User.js'
import { Course } from '../models/Course.js'
import { asyncHandler } from '../middlewares/errorHandler.js'
import mongoose from 'mongoose'

// GET /api/faculty/insights — Get student performance insights for faculty
export const getStudentInsights = asyncHandler(async (req, res) => {
  const facultyId = req.userDb._id

  // 1. Get all courses by this faculty to filter students
  const courses = await Course.find({ faculty_id: facultyId }).select('_id')
  const courseIds = courses.map(c => c._id)

  // 2. Get top performing students (highest avg mastery)
  const topStudents = await Mastery.aggregate([
    {
      $group: {
        _id: '$user_id',
        avg_mastery: { $avg: '$mastery_score' },
        total_interactions: { $sum: '$interactions' },
        correct_rate: { 
          $cond: [
            { $eq: ['$interactions', 0] }, 
            0, 
            { $divide: ['$correct_answers', '$interactions'] } 
          ] 
        }
      }
    },
    { $sort: { avg_mastery: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        avg_mastery: 1,
        total_interactions: 1,
        name: '$user.full_name',
        email: '$user.email',
        avatar_url: '$user.avatar_url'
      }
    }
  ])

  // 3. Get struggling students (lowest avg mastery, high interaction)
  const strugglingStudents = await Mastery.aggregate([
    {
      $group: {
        _id: '$user_id',
        avg_mastery: { $avg: '$mastery_score' },
        total_interactions: { $sum: '$interactions' }
      }
    },
    { $match: { avg_mastery: { $lt: 50 }, total_interactions: { $gt: 5 } } },
    { $sort: { avg_mastery: 1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        avg_mastery: 1,
        total_interactions: 1,
        name: '$user.full_name',
        email: '$user.email'
      }
    }
  ])

  // 4. Most difficult skills (lowest avg mastery across all students)
  const difficultSkills = await Mastery.aggregate([
    {
      $group: {
        _id: '$skill_id',
        skill_name: { $first: '$skill_name' },
        avg_mastery: { $avg: '$mastery_score' },
        total_attempts: { $sum: '$interactions' }
      }
    },
    { $match: { total_attempts: { $gt: 0 } } },
    { $sort: { avg_mastery: 1 } },
    { $limit: 5 }
  ])

  res.json({
    success: true,
    data: {
      top_students: topStudents,
      struggling_students: strugglingStudents,
      difficult_skills: difficultSkills
    }
  })
})
