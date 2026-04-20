// Role-based access control middleware
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userDb) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    if (!allowedRoles.includes(req.userDb.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      })
    }

    next()
  }
}

export const requireStudent = requireRole(['student'])
export const requireFaculty = requireRole(['faculty'])
export const requireStudentOrFaculty = requireRole(['student', 'faculty'])

export default requireRole
