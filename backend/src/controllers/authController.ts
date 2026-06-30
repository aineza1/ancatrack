import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import { AuthRequest } from '../middleware/authMiddleware'

const signToken = (id: string): string =>
  (jwt.sign as (p: object, s: string, o: object) => string)(
    { id },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' })
      return
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid email or password' })
      return
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'Account is inactive — contact admin' })
      return
    }

    const token = signToken(user._id.toString())
    res.json({
      token,
      user: {
        id:       user._id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        facility: user.facility,
      }
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}

export const getMe = (req: AuthRequest, res: Response): void => {
  res.json({ user: req.user })
}
