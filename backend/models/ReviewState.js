import mongoose from 'mongoose';

const reviewStateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flashcardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flashcard',
    required: true
  },
  // --- FSRS Metrics ---
  stability: {
    type: Number,
    default: 0
  },
  difficulty: {
    type: Number,
    default: 0
  },
  elapsed_days: {
    type: Number,
    default: 0
  },
  scheduled_days: {
    type: Number,
    default: 0
  },
  retrievability: {
    type: Number,
    default: 0
  },
  state: {
    type: Number,
    default: 0 // 0=New, 1=Learning, 2=Review, 3=Relearning
  },
  due: {
    type: Date,
    default: Date.now
  },
  last_review: {
    type: Date,
    default: null
  },

  // --- Weakness Tracking Metrics ---
  total_reviews: {
    type: Number,
    default: 0
  },
  total_incorrect: {
    type: Number,
    default: 0
  },
  avg_response_time_ms: {
    type: Number,
    default: 0
  },
  forgetting_frequency: {
    type: Number,
    default: 0
  },
  consecutive_correct: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compound index to ensure one state per user per card
reviewStateSchema.index({ userId: 1, flashcardId: 1 }, { unique: true });

export default mongoose.model('ReviewState', reviewStateSchema);
