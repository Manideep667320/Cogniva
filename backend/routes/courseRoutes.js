import express from 'express'
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getFacultyCourses,
  getFacultyStats,
} from '../controllers/courseController.js'
import verifyToken from '../middlewares/auth.js'
import { requireFaculty } from '../middlewares/rbac.js'

const router = express.Router()

// All routes require authentication
router.use(verifyToken)

// GET /api/course/stats/:faculty_id - Get faculty stats
router.get('/stats/:faculty_id', getFacultyStats)

// GET /api/course - Get all published courses
router.get('/', getCourses)

// POST /api/course - Create course (faculty only)
router.post('/', requireFaculty, createCourse)

// GET /api/course/faculty/:faculty_id - Get courses by faculty
router.get('/faculty/:faculty_id', getFacultyCourses)

// GET /api/course/:id - Get specific course
router.get('/:id', getCourseById)

// PUT /api/course/:id - Update course (faculty only)
router.put('/:id', requireFaculty, updateCourse)

// DELETE /api/course/:id - Delete course (faculty only)
router.delete('/:id', requireFaculty, deleteCourse)

export default router
