import mongoose from 'mongoose';

const memoryTypes = [
  'lecture',
  'revision',
  'quiz',
  'weakness',
  'productivity',
  'doubt',
  'general'
];

const semanticMemorySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    memory_type: {
      type: String,
      enum: memoryTypes,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    embedding_id: {
      type: String,
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { collection: 'semantic_memories' }
);

// Compound index for finding user-specific memory types quickly
semanticMemorySchema.index({ user_id: 1, memory_type: 1 });

export const SemanticMemory = mongoose.model('SemanticMemory', semanticMemorySchema);
