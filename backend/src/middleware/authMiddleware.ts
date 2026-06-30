import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User, { IUser, UserRole } from '../models/User'

export interface AuthRequest extends Request {
  user?: IUser
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Not authenticated' })
      return
    }

    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }

    const user = await User.findById(decoded.id).select('-password')
    if (!user || !user.isActive) {
      res.status(401).json({ message: 'User not found or inactive' })
      return
    }

    req.user = user
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export const restrictTo = (...roles: UserRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'You do not have permission for this action' })
      return
    }
    next()
  }
