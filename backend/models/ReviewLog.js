import mongoose from 'mongoose';

const reviewLogSchema = new mongoose.Schema({
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
  rating: {
    type: Number, // 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
    required: true
  },
  responseTimeMs: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  }
}, { timestamps: true }); // timestamps adds createdAt, which serves as our review timestamp

// Index for efficient timeseries querying
reviewLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('ReviewLog', reviewLogSchema);
