import mongoose from 'mongoose'

const assignmentSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
    },
    question_text: {
      type: String,
      required: true,
    },
    student_answer: {
      type: String,
      required: true,
    },
    ai_evaluation: {
      score: { type: Number, default: 0 },
      feedback: { type: String, default: '' },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      suggestions: [{ type: String }],
    },
    faculty_override_score: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'evaluated', 'reviewed'],
      default: 'pending',
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'assignments' }
)

assignmentSchema.pre('save', function (next) {
  this.updated_at = Date.now()
  next()
})

export const Assignment = mongoose.model('Assignment', assignmentSchema)
