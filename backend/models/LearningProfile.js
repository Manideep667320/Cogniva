import mongoose from 'mongoose'

const mistakePatternSchema = new mongoose.Schema({
  concept: {
    type: String,
    required: true,
  },
  frequency: {
    type: Number,
    default: 1,
  },
  last_seen: {
    type: Date,
    default: Date.now,
  },
}, { _id: false })

const streakSchema = new mongoose.Schema({
  current: {
    type: Number,
    default: 0,
  },
  longest: {
    type: Number,
    default: 0,
  },
  last_activity_date: {
    type: String, // YYYY-MM-DD
    default: null,
  },
}, { _id: false })

const learningProfileSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    learning_speed: {
      type: String,
      enum: ['slow', 'medium', 'fast'],
      default: 'medium',
    },
    preferred_style: {
      type: String,
      enum: ['conceptual', 'practical'],
      default: 'conceptual',
    },
    difficulty_level: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'adaptive'],
      default: 'adaptive',
    },
    mistake_patterns: [mistakePatternSchema],
    engagement_score: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    avg_response_time_ms: {
      type: Number,
      default: 0,
    },
    total_interactions: {
      type: Number,
      default: 0,
    },
    correct_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    total_correct: {
      type: Number,
      default: 0,
    },
    streak: {
      type: streakSchema,
      default: () => ({}),
    },
    last_updated: {
      type: Date,
      default: Date.now,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'learning_profiles' }
)

learningProfileSchema.pre('save', function (next) {
  this.last_updated = Date.now()
  next()
})

export const LearningProfile = mongoose.model('LearningProfile', learningProfileSchema)
