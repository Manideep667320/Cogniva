import { Course } from '../models/Course.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

// POST /api/course
export const createCourse = asyncHandler(async (req, res) => {
  const { title, description, content, level, duration_hours, tags } = req.body
  const facultyId = req.userDb._id
  const facultyName = req.userDb.full_name

  // Validate required fields
  if (!title || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Title is required',
    })
  }

  if (!description || description.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Description is required',
    })
  }

  const course = await Course.create({
    title: title.trim(),
    description: description.trim(),
    content: content?.trim() || '',
    faculty_id: facultyId,
    faculty_name: facultyName,
    level: level || 'Beginner',
    duration_hours: duration_hours || 4,
    tags: tags || [],
    is_published: false,
  })

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    data: course,
  })
})

// GET /api/courses
export const getCourses = asyncHandler(async (req, res) => {
  const { limit = 20, skip = 0, published = true, faculty_id } = req.query

  let query = {}
  if (published === 'true') {
    query.is_published = true
  }
  if (faculty_id) {
    query.faculty_id = faculty_id
  }

  const courses = await Course.find(query)
    .sort({ created_at: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))

  const total = await Course.countDocuments(query)

  res.json({
    success: true,
    message: 'Courses retrieved',
    data: courses,
    pagination: {
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      hasMore: total > parseInt(skip) + parseInt(limit),
    },
  })
})

// GET /api/course/:id
export const getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const course = await Course.findById(id).populate('faculty_id', ['full_name', 'email'])

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    })
  }

  // Only allow viewing if published or user is faculty owner
  if (!course.is_published && course.faculty_id._id.toString() !== req.userDb._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    })
  }

  res.json({
    success: true,
    message: 'Course retrieved',
    data: course,
  })
})

// PUT /api/course/:id
export const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { title, description, content, level, duration_hours, tags, is_published } = req.body
  const userId = req.userDb._id

  const course = await Course.findById(id)

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    })
  }

  // Check ownership
  if (course.faculty_id.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own courses',
    })
  }

  // Update fields
  if (title) course.title = title.trim()
  if (description) course.description = description.trim()
  if (content) course.content = content.trim()
  if (level) course.level = level
  if (duration_hours) course.duration_hours = duration_hours
  if (tags) course.tags = tags
  if (typeof is_published !== 'undefined') course.is_published = is_published

  course.updated_at = Date.now()
  await course.save()

  res.json({
    success: true,
    message: 'Course updated successfully',
    data: course,
  })
})

// DELETE /api/course/:id
export const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userDb._id

  const course = await Course.findById(id)

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    })
  }

  // Check ownership
  if (course.faculty_id.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own courses',
    })
  }

  await Course.findByIdAndDelete(id)

  res.json({
    success: true,
    message: 'Course deleted successfully',
    data: { deleted_id: id },
  })
})

// GET /api/course/faculty/:faculty_id
export const getFacultyCourses = asyncHandler(async (req, res) => {
  const { faculty_id } = req.params
  const { limit = 20, skip = 0 } = req.query

  const courses = await Course.find({ faculty_id })
    .sort({ created_at: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))

  const total = await Course.countDocuments({ faculty_id })

  res.json({
    success: true,
    message: 'Faculty courses retrieved',
    data: courses,
    pagination: {
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      hasMore: total > parseInt(skip) + parseInt(limit),
    },
  })
})
