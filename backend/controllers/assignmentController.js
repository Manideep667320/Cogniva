import mongoose from 'mongoose'
import { Assignment } from '../models/Assignment.js'
import { Course } from '../models/Course.js'
import evaluatorService from '../services/evaluatorService.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

// POST /api/assignment/submit
export const submitAssignment = asyncHandler(async (req, res) => {
  const { course_id, title, question_text, student_answer } = req.body
  const userId = req.userDb._id

  if (!course_id || !title || !question_text || !student_answer) {
    return res.status(400).json({ success: false, message: 'Missing required fields' })
  }

  const assignment = await Assignment.create({
    user_id: userId,
    course_id,
    title,
    question_text,
    student_answer,
    status: 'pending'
  })

  res.status(201).json({
    success: true,
    message: 'Assignment submitted successfully',
    data: assignment
  })
})

// POST /api/assignment/evaluate/:id
export const evaluateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userDb._id

  const assignment = await Assignment.findOne({ _id: id, user_id: userId })
  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' })
  }

  // Get course context if needed
  const course = await Course.findById(assignment.course_id)
  const context = course ? `${course.title}: ${course.description}\n\n${course.content}` : ''

  // Run evaluation
  const evaluation = await evaluatorService.evaluateAssignment(
    assignment.question_text,
    assignment.student_answer,
    context
  )

  // Update assignment with results
  assignment.ai_evaluation = {
    score: evaluation.score || 0,
    feedback: evaluation.feedback || 'No feedback provided.',
    strengths: evaluation.strengths || [],
    weaknesses: evaluation.weaknesses || [],
    suggestions: evaluation.suggestions || []
  }
  assignment.status = 'evaluated'
  assignment.updated_at = Date.now()

  await assignment.save()

  res.json({
    success: true,
    message: 'Assignment evaluated',
    data: assignment
  })
})

// GET /api/assignment/history
export const getStudentHistory = asyncHandler(async (req, res) => {
  const userId = req.userDb._id
  const assignments = await Assignment.find({ user_id: userId })
    .populate('course_id', 'title')
    .sort({ created_at: -1 })

  res.json({
    success: true,
    data: assignments
  })
})

// GET /api/assignment/faculty/:courseId
export const getFacultySubmissions = asyncHandler(async (req, res) => {
  const { courseId } = req.params
  const userId = req.userDb._id

  // Verify faculty owns this course
  const course = await Course.findById(courseId)
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' })
  }
  
  if (course.faculty_id.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized for this course' })
  }

  const submissions = await Assignment.find({ course_id: courseId })
    .populate('user_id', 'full_name email avatar_url')
    .sort({ created_at: -1 })

  res.json({
    success: true,
    data: submissions
  })
})

// PUT /api/assignment/:id/override
export const overrideScore = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { score } = req.body
  const userId = req.userDb._id

  if (typeof score !== 'number') {
    return res.status(400).json({ success: false, message: 'Valid score is required' })
  }

  const assignment = await Assignment.findById(id).populate('course_id')
  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' })
  }

  if (assignment.course_id.faculty_id.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' })
  }

  assignment.faculty_override_score = score
  assignment.status = 'reviewed'
  assignment.updated_at = Date.now()

  await assignment.save()

  res.json({
    success: true,
    message: 'Score overridden',
    data: assignment
  })
})
