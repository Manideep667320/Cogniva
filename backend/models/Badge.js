import mongoose from 'mongoose'

const badgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    criteria: {
      type: {
        type: String,
        enum: ['xp', 'streak', 'course_completion', 'perfect_score'],
        required: true,
      },
      threshold: {
        type: Number,
        required: true,
      }
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'badges' }
)

export const Badge = mongoose.model('Badge', badgeSchema)

const userBadgeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    badge_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge',
      required: true,
    },
    earned_at: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'user_badges' }
)

userBadgeSchema.index({ user_id: 1, badge_id: 1 }, { unique: true })

export const UserBadge = mongoose.model('UserBadge', userBadgeSchema)
