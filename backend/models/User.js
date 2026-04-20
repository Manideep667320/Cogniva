import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    full_name: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['student', 'faculty'],
      default: 'student',
    },
    avatar_url: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: '',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    last_login: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'users' }
)

// Update timestamp on save
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now()
  next()
})

export const User = mongoose.model('User', userSchema)
