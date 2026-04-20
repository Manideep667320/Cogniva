import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    faculty_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    faculty_name: {
      type: String,
      default: 'Instructor',
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    duration_hours: {
      type: Number,
      default: 4,
    },
    tags: [
      {
        type: String,
      },
    ],
    is_published: {
      type: Boolean,
      default: false,
      index: true,
    },
    enrollment_count: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    thumbnail_url: {
      type: String,
      default: null,
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
  { collection: 'courses' }
)

// Compound index for efficient queries
courseSchema.index({ faculty_id: 1, created_at: -1 })
courseSchema.index({ is_published: 1, created_at: -1 })

export const Course = mongoose.model('Course', courseSchema)
