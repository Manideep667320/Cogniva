import { asyncHandler } from '../middlewares/errorHandler.js'
import predictionService from '../services/predictionService.js'
import { Course } from '../models/Course.js'
import { User } from '../models/User.js'
import { Enrollment } from '../models/Enrollment.js'

// GET /api/prediction/risk
export const getMyRisk = asyncHandler(async (req, res) => {
  const userId = req.userDb._id
  const riskAssessment = await predictionService.calculateStudentRisk(userId)
  
  res.json({
    success: true,
    data: riskAssessment
  })
})

// GET /api/prediction/class/:courseId
export const getClassRisk = asyncHandler(async (req, res) => {
  const { courseId } = req.params
  const facultyId = req.userDb._id

  // Verify course ownership
  const course = await Course.findById(courseId)
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' })
  }
  if (course.faculty_id.toString() !== facultyId.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized for this course' })
  }

  // Get enrolled students
  const enrollments = await Enrollment.find({ course_id: courseId }).populate('user_id', 'full_name email avatar_url')
  
  const studentRisks = await Promise.all(enrollments.map(async (enrollment) => {
    const risk = await predictionService.calculateStudentRisk(enrollment.user_id._id)
    return {
      student: enrollment.user_id,
      risk_assessment: risk
    }
  }))

  // Sort by risk score descending (highest risk first)
  studentRisks.sort((a, b) => b.risk_assessment.score - a.risk_assessment.score)

  // Aggregate summary
  const summary = {
    total_students: studentRisks.length,
    high_risk: studentRisks.filter(s => s.risk_assessment.risk_level === 'high').length,
    medium_risk: studentRisks.filter(s => s.risk_assessment.risk_level === 'medium').length,
    low_risk: studentRisks.filter(s => s.risk_assessment.risk_level === 'low').length,
  }

  res.json({
    success: true,
    data: {
      summary,
      students: studentRisks
    }
  })
})
