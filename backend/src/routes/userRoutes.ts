import { Router, Response } from 'express'
import { protect, restrictTo, AuthRequest } from '../middleware/authMiddleware'
import User from '../models/User'

const router = Router()

router.use(protect)

router.get('/doctors', async (_req, res: Response): Promise<void> => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true })
      .select('name email')
      .sort({ name: 1 })
    res.json({ doctors })
  } catch {
    res.status(500).json({ message: 'Failed to fetch doctors' })
  }
})

router.use(restrictTo('admin'))

router.get('/', async (_req, res: Response): Promise<void> => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 })
    res.json({ users })
  } catch {
    res.status(500).json({ message: 'Failed to fetch users' })
  }
})

router.post('/', async (req, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, facility } = req.body
    if (!name || !email || !password || !role) {
      res.status(400).json({ message: 'name, email, password, and role are required' })
      return
    }
    const existing = await User.findOne({ email })
    if (existing) {
      res.status(400).json({ message: 'A user with this email already exists' })
      return
    }
    const user = await User.create({ name, email, password, role, facility })
    res.status(201).json({ user })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create user'
    res.status(400).json({ message: msg })
  }
})

router.patch('/:id/toggle', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) { res.status(404).json({ message: 'User not found' }); return }
    user.isActive = !user.isActive
    await user.save()
    res.json({ user })
  } catch {
    res.status(500).json({ message: 'Failed to update user' })
  }
})

export default router
