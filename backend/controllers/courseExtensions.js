import mongoose from 'mongoose'
import { Course } from '../models/Course.js'
import { Enrollment } from '../models/Enrollment.js'
import { runCourseArchitect } from '../agents/courseArchitectAgent.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

// POST /api/course/generate
export const generateCourse = asyncHandler(async (req, res) => {
  const { prompt } = req.body
  if (!prompt) {
    return res.status(400).json({ success: false, message: 'Prompt is required' })
  }

  const courseData = await runCourseArchitect(prompt)
  
  res.json({
    success: true,
    message: 'Course generated successfully',
    data: courseData,
  })
})

// POST /api/course/:id/enroll
export const enrollCourse = asyncHandler(async (req, res) => {
  const courseId = req.params.id
  const userId = req.userDb._id

  const course = await Course.findById(courseId)
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' })
  }

  // Check if already enrolled
  const existing = await Enrollment.findOne({ user_id: userId, course_id: courseId })
  if (existing) {
    return res.status(400).json({ success: false, message: 'Already enrolled' })
  }

  const enrollment = await Enrollment.create({
    user_id: userId,
    course_id: courseId,
  })

  // Increment course enrollment count
  course.enrollment_count += 1
  await course.save()

  res.status(201).json({
    success: true,
    message: 'Enrolled successfully',
    data: enrollment,
  })
})

// GET /api/course/enrolled
export const getEnrolledCourses = asyncHandler(async (req, res) => {
  const userId = req.userDb._id

  const enrollments = await Enrollment.find({ user_id: userId })
    .populate('course_id')
    .sort({ last_accessed: -1 })

  // Format to match expected Course array in frontend
  const courses = enrollments
    .filter(e => e.course_id !== null)
    .map(e => ({
      ...e.course_id.toObject(),
      progress: e.progress,
      enrolled_at: e.created_at,
    }))

  res.json({
    success: true,
    data: courses,
  })
})

// GET /api/course/:id/status
export const getEnrollmentStatus = asyncHandler(async (req, res) => {
  const courseId = req.params.id
  const userId = req.userDb._id

  const enrollment = await Enrollment.findOne({ user_id: userId, course_id: courseId })
  
  res.json({
    success: true,
    is_enrolled: !!enrollment,
    progress: enrollment ? enrollment.progress : 0
  })
})
