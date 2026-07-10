import { Response } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import Patient from '../models/Patient'
import Alert from '../models/Alert'
import { evaluatePatient } from '../utils/alertEngine'

export const getPatients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = { isActive: true }
    if (req.user?.role === 'doctor') filter.assignedDoctor = req.user._id

    const patients = await Patient.find(filter)
      .populate('assignedDoctor', 'name email')
      .populate('registeredBy', 'name')
      .sort({ updatedAt: -1 })

    res.json({ patients })
  } catch {
    res.status(500).json({ message: 'Failed to fetch patients' })
  }
}

export const getPatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'name email')
      .populate('registeredBy', 'name')
      .populate('visits.recordedBy', 'name')

    if (!patient) {
      res.status(404).json({ message: 'Patient not found' })
      return
    }

    const alerts = await Alert.find({ patient: patient._id, status: 'active' })
      .sort({ createdAt: -1 })

    res.json({ patient, alerts })
  } catch {
    res.status(500).json({ message: 'Failed to fetch patient' })
  }
}

export const createPatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, dob, edd, parity, insurance, phone, assignedDoctor } = req.body

    if (!name || !dob || !edd || !parity || !assignedDoctor) {
      res.status(400).json({ message: 'name, dob, edd, parity, and assignedDoctor are required' })
      return
    }

    const patient = await Patient.create({
      name,
      dob: new Date(dob),
      edd: new Date(edd),
      parity,
      insurance: insurance || 'None',
      phone,
      assignedDoctor,
      registeredBy: req.user!._id,
    })

    res.status(201).json({ patient })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create patient'
    res.status(400).json({ message: msg })
  }
}

export const addVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findById(req.params.id)
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' })
      return
    }

    const { date, ga, sbp, dbp, proteinuria, weight, notes } = req.body
    if (!date || !ga || !sbp || !dbp || !weight) {
      res.status(400).json({ message: 'date, ga, sbp, dbp, and weight are required' })
      return
    }

    patient.visits.push({
      date:        new Date(date),
      ga:          Number(ga),
      sbp:         Number(sbp),
      dbp:         Number(dbp),
      proteinuria: proteinuria || 'None',
      weight:      Number(weight),
      notes,
      recordedBy:  req.user!._id,
      recordedAt:  new Date(),
    })

    await patient.save()

    const newVisit = patient.visits[patient.visits.length - 1]
    const result   = evaluatePatient(patient)

    let alert = null
    if (result) {
      alert = await Alert.create({
        patient:  patient._id,
        visit:    newVisit._id,
        flags:    result.flags,
        severity: result.severity,
        status:   'active',
      })
      if (patient.phone && (result.severity === 'high' || result.severity === 'medium')) {
        const { sendSMS, buildPatientSMS } = await import('../utils/smsService')
        await sendSMS(
          patient.phone,
          buildPatientSMS(patient.name, result.severity)
        )
      }
    }
    res.status(201).json({ visit: newVisit, alert })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to record visit'
    res.status(400).json({ message: msg })
  }
}
