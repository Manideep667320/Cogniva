import mongoose from 'mongoose'

const enrollmentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    last_accessed: {
      type: Date,
      default: Date.now,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'enrollments' }
)

// Ensure a user can only enroll in a course once
enrollmentSchema.index({ user_id: 1, course_id: 1 }, { unique: true })

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema)
