import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import verifyToken from '../middlewares/auth.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

const router = express.Router()

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId, iat: Date.now() },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRY || '1d' }
  )
}

// POST /api/auth/register - Register new user
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, full_name = '', role = 'student' } = req.body

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    })
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters',
    })
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Email already registered',
    })
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create user
  const user = await User.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    full_name: full_name || email.split('@')[0],
    role: ['student', 'faculty'].includes(role) ? role : 'student',
  })

  // Generate token
  const token = generateToken(user._id.toString())

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
    token,
  })
}))

// POST /api/auth/login - Login user
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    })
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    })
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    })
  }

  // Update last login
  user.last_login = Date.now()
  await user.save()

  // Generate token
  const token = generateToken(user._id.toString())

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar_url: user.avatar_url,
      bio: user.bio,
    },
    token,
  })
}))

// GET /api/auth/me - Get current user profile
router.get('/me', verifyToken, asyncHandler(async (req, res) => {
  const user = req.userDb

  res.json({
    success: true,
    message: 'User profile retrieved',
    data: {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar_url: user.avatar_url,
      bio: user.bio,
      created_at: user.createdAt,
    },
  })
}))

// PUT /api/auth/profile - Update user profile
router.put('/profile', verifyToken, asyncHandler(async (req, res) => {
  const { full_name, bio, avatar_url } = req.body
  const userId = req.userDb._id

  const user = await User.findByIdAndUpdate(
    userId,
    {
      ...(full_name && { full_name }),
      ...(bio && { bio }),
      ...(avatar_url && { avatar_url }),
    },
    { new: true, runValidators: true }
  )

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar_url: user.avatar_url,
      bio: user.bio,
    },
  })
}))

// POST /api/auth/logout
router.post('/logout', verifyToken, asyncHandler(async (req, res) => {
  // JWT logout is handled on the client side (token deletion)
  res.json({
    success: true,
    message: 'Logged out successfully',
  })
}))

export default router
