import mongoose from 'mongoose';

const studyTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['review', 'new_concept', 'quiz', 'reading'],
    required: true,
  },
  durationMinutes: {
    type: Number,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  topic: {
    type: String,
  }
});

const studyPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  tasks: [studyTaskSchema],
}, { timestamps: true });

// Ensure we only have one plan per user per day
studyPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);

export default StudyPlan;
