import { Response } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import Alert from '../models/Alert'

export const getAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const alerts = await Alert.find({ status: 'active' })
      .populate({
        path: 'patient',
        select: 'name dob parity visits assignedDoctor',
        ...(req.user?.role === 'doctor'
          ? { match: { assignedDoctor: req.user._id } }
          : {}),
      })
      .sort({ createdAt: -1 })

    const filtered = req.user?.role === 'doctor'
      ? alerts.filter(a => a.patient !== null)
      : alerts

    res.json({ alerts: filtered })
  } catch {
    res.status(500).json({ message: 'Failed to fetch alerts' })
  }
}

export const acknowledgeAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const alert = await Alert.findById(req.params.id)
    if (!alert) {
      res.status(404).json({ message: 'Alert not found' })
      return
    }
    if (alert.status !== 'active') {
      res.status(400).json({ message: `Alert is already ${alert.status}` })
      return
    }

    alert.status         = 'acknowledged'
    alert.acknowledgedBy = req.user!._id
    alert.acknowledgedAt = new Date()
    await alert.save()

    res.json({ alert })
  } catch {
    res.status(500).json({ message: 'Failed to acknowledge alert' })
  }
}

export const escalateAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { escalatedTo } = req.body
    if (!escalatedTo) {
      res.status(400).json({ message: 'escalatedTo is required' })
      return
    }

    const alert = await Alert.findById(req.params.id)
    if (!alert) {
      res.status(404).json({ message: 'Alert not found' })
      return
    }

    alert.status      = 'escalated'
    alert.escalatedTo = escalatedTo
    alert.escalatedAt = new Date()
    await alert.save()

    res.json({ alert })
  } catch {
    res.status(500).json({ message: 'Failed to escalate alert' })
  }
}
