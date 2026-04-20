import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    req.userId = decoded.userId
    req.user = decoded

    // Get user from database
    const user = await User.findById(decoded.userId)

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      })
    }

    req.userDb = user
    next()
  } catch (error) {
    console.error('Token verification error:', error.message)
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    })
  }
}

export default verifyToken
