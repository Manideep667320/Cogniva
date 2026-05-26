import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sourceId: {
    type: String, // Can refer to a specific lecture chunk or topic
    default: null
  },
  type: {
    type: String,
    enum: ['QA', 'CLOZE', 'CONCEPT'],
    required: true
  },
  front: {
    type: String,
    required: true
  },
  back: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'rejected'],
    default: 'draft'
  },
  tags: [String]
}, { timestamps: true });

export default mongoose.model('Flashcard', flashcardSchema);
