import mongoose from 'mongoose'

const mistakeSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  user_answer: {
    type: String,
    required: true,
  },
  expected_concept: {
    type: String,
    default: '',
  },
  mistake_type: {
    type: String,
    enum: ['missing_concept', 'partial_understanding', 'misconception', 'incomplete'],
    default: 'incomplete',
  },
  feedback: {
    type: String,
    default: '',
  },
  response_time_ms: {
    type: Number,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: false })

const masterySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    skill_tree_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillTree',
      required: true,
      index: true,
    },
    skill_id: {
      type: String,
      required: true,
    },
    skill_name: {
      type: String,
      default: '',
    },
    mastery_score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    interactions: {
      type: Number,
      default: 0,
    },
    correct_answers: {
      type: Number,
      default: 0,
    },
    mistakes: [mistakeSchema],
    last_interaction: {
      type: Date,
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'mastery_records' }
)

masterySchema.index({ user_id: 1, skill_tree_id: 1 })
masterySchema.index({ user_id: 1, skill_id: 1 }, { unique: true })

masterySchema.pre('save', function (next) {
  this.updated_at = Date.now()
  next()
})

export const Mastery = mongoose.model('Mastery', masterySchema)
