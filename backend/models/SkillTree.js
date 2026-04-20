import mongoose from 'mongoose'

const skillNodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  prerequisites: [{
    type: String,
  }],
  mastery: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  level: {
    type: Number,
    default: 0,
  },
}, { _id: false })

const skillTreeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    source_file: {
      type: String,
      default: '',
    },
    nodes: [skillNodeSchema],
    embedding_collection: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'error'],
      default: 'processing',
    },
    error_message: {
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
  { collection: 'skill_trees' }
)

skillTreeSchema.index({ user_id: 1, created_at: -1 })

skillTreeSchema.pre('save', function (next) {
  this.updated_at = Date.now()
  next()
})

export const SkillTree = mongoose.model('SkillTree', skillTreeSchema)
