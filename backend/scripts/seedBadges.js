import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Badge } from '../models/Badge.js'

dotenv.config()

const badges = [
  {
    name: 'First Steps',
    description: 'Earned 100 XP',
    icon: '🏃',
    tier: 'bronze',
    criteria: { type: 'xp', threshold: 100 }
  },
  {
    name: 'Rising Star',
    description: 'Earned 500 XP',
    icon: '⭐',
    tier: 'silver',
    criteria: { type: 'xp', threshold: 500 }
  },
  {
    name: 'Scholar',
    description: 'Earned 2000 XP',
    icon: '🎓',
    tier: 'gold',
    criteria: { type: 'xp', threshold: 2000 }
  },
  {
    name: 'Consistent Learner',
    description: '3 Day Streak',
    icon: '🔥',
    tier: 'bronze',
    criteria: { type: 'streak', threshold: 3 }
  },
  {
    name: 'Unstoppable',
    description: '7 Day Streak',
    icon: '⚡',
    tier: 'silver',
    criteria: { type: 'streak', threshold: 7 }
  },
  {
    name: 'Sharpshooter',
    description: 'Answered 50 questions correctly',
    icon: '🎯',
    tier: 'silver',
    criteria: { type: 'perfect_score', threshold: 50 }
  }
]

async function seedBadges() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cogniva'
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    for (const badge of badges) {
      await Badge.updateOne({ name: badge.name }, { $set: badge }, { upsert: true })
    }

    console.log('Badges seeded successfully')
  } catch (error) {
    console.error('Error seeding badges:', error)
  } finally {
    mongoose.disconnect()
  }
}

seedBadges()
