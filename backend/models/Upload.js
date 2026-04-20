import mongoose from 'mongoose'

const uploadSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    original_name: {
      type: String,
      required: true,
    },
    file_size: {
      type: Number,
      default: 0,
    },
    mime_type: {
      type: String,
      default: 'text/plain',
    },
    text_content: {
      type: String,
      default: '',
    },
    chunk_count: {
      type: Number,
      default: 0,
    },
    embedding_collection: {
      type: String,
      default: null,
    },
    skill_tree_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillTree',
      default: null,
    },
    status: {
      type: String,
      enum: ['uploaded', 'extracting', 'chunking', 'embedding', 'generating_tree', 'completed', 'error'],
      default: 'uploaded',
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
  { collection: 'uploads' }
)

uploadSchema.index({ user_id: 1, created_at: -1 })

uploadSchema.pre('save', function (next) {
  this.updated_at = Date.now()
  next()
})

export const Upload = mongoose.model('Upload', uploadSchema)
