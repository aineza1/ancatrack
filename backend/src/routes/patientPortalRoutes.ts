import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Patient from '../models/Patient'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, pin } = req.body

    if (!name || !pin) {
      res.status(400).json({ message: 'Full name and PIN are required' })
      return
    }

    const patient = await Patient.findOne({
      name:     { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      isActive: true
    })
    .select('+pin')
    .populate('assignedDoctor', 'name')

    if (!patient) {
      res.status(401).json({ message: 'No patient found with that name' })
      return
    }

    if (!patient.pin) {
      res.status(401).json({ message: 'No PIN set for this account. Ask your nurse to set one at your next visit.' })
      return
    }

    const pinMatch = await bcrypt.compare(pin, patient.pin)
    if (!pinMatch) {
      res.status(401).json({ message: 'Incorrect PIN. Please try again or ask your nurse.' })
      return
    }

    const token = (jwt.sign as (p: object, s: string, o: object) => string)(
      { patientId: patient._id },
      process.env.JWT_SECRET!,
      { expiresIn: '60d' }
    )

    res.json({
      token,
      patient: {
        id:    patient._id,
        name:  patient.name,
        phone: patient.phone,
      }
    })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Not authenticated' })
      return
    }

    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { patientId: string }

    const patient = await Patient.findById(decoded.patientId)
      .populate('assignedDoctor', 'name')

    if (!patient || !patient.isActive) {
      res.status(404).json({ message: 'Patient not found' })
      return
    }

    res.json({ patient })
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
})

import { protect, restrictTo, AuthRequest } from '../middleware/authMiddleware'

router.patch(
  '/:id/set-pin',
  protect,
  restrictTo('nurse', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { pin } = req.body
      if (!pin || pin.length < 4) {
        res.status(400).json({ message: 'PIN must be at least 4 digits' })
        return
      }

      const hashed  = await bcrypt.hash(String(pin), 12)
      const patient = await Patient.findByIdAndUpdate(
        req.params.id,
        { pin: hashed },
        { new: true }
      )

      if (!patient) {
        res.status(404).json({ message: 'Patient not found' })
        return
      }

      res.json({ message: `PIN set successfully for ${patient.name}` })
    } catch {
      res.status(500).json({ message: 'Failed to set PIN' })
    }
  }
)

export default router
