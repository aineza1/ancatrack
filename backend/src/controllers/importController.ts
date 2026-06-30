import { Response } from 'express'
import * as XLSX from 'xlsx'
import { AuthRequest } from '../middleware/authMiddleware'
import Patient from '../models/Patient'
import Alert from '../models/Alert'
import { evaluatePatient } from '../utils/alertEngine'

export const importVisits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' })
      return
    }

    const workbook  = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true })
    const sheetName = workbook.SheetNames[0]
    const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])

    if (rows.length === 0) {
      res.status(400).json({ message: 'File is empty or has no data rows' })
      return
    }

    const results: {
      row: number
      patientName: string
      status: 'imported' | 'skipped'
      action?: 'visit_added' | 'patient_created'
      alert?: string
      reason?: string
    }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      const required = ['patientName','dob','edd','parity','visitDate','ga','sbp','dbp','weight']
      const missing  = required.filter(f => !row[f] && row[f] !== 0)

      if (missing.length > 0) {
        results.push({
          row: rowNum,
          patientName: row.patientName || 'Unknown',
          status: 'skipped',
          reason: `Missing fields: ${missing.join(', ')}`
        })
        continue
      }

      const ga     = Number(row.ga)
      const sbp    = Number(row.sbp)
      const dbp    = Number(row.dbp)
      const weight = Number(row.weight)

      if (isNaN(ga) || isNaN(sbp) || isNaN(dbp) || isNaN(weight)) {
        results.push({
          row: rowNum,
          patientName: row.patientName,
          status: 'skipped',
          reason: 'ga, sbp, dbp, and weight must be numbers'
        })
        continue
      }

      if (ga < 4 || ga > 44) {
        results.push({ row: rowNum, patientName: row.patientName, status: 'skipped', reason: 'GA must be between 4 and 44 weeks' })
        continue
      }

      const validProteinuria = ['None', 'Trace', '1+', '2+', '3+']
      const proteinuria = row.proteinuria || 'None'
      if (!validProteinuria.includes(proteinuria)) {
        results.push({ row: rowNum, patientName: row.patientName, status: 'skipped', reason: `Proteinuria must be one of: ${validProteinuria.join(', ')}` })
        continue
      }

      const parseDateVal = (val: any): Date => {
        if (val instanceof Date) return val
        if (typeof val === 'number') return XLSX.SSF.parse_date_code(val) as unknown as Date
        return new Date(val)
      }

      const dob       = parseDateVal(row.dob)
      const edd       = parseDateVal(row.edd)
      const visitDate = parseDateVal(row.visitDate)

      if (isNaN(dob.getTime()) || isNaN(edd.getTime()) || isNaN(visitDate.getTime())) {
        results.push({ row: rowNum, patientName: row.patientName, status: 'skipped', reason: 'Invalid date format. Use YYYY-MM-DD' })
        continue
      }

      const dobStart = new Date(dob); dobStart.setHours(0,0,0,0)
      const dobEnd   = new Date(dob); dobEnd.setHours(23,59,59,999)

      let patient = await Patient.findOne({
        name: { $regex: new RegExp(`^${row.patientName.trim()}$`, 'i') },
        dob:  { $gte: dobStart, $lte: dobEnd },
        isActive: true
      })

      let action: 'visit_added' | 'patient_created' = 'visit_added'

      if (!patient) {

        let assignedDoctor = req.user!._id
        if (req.user!.role !== 'doctor') {
          const { default: User } = await import('../models/User')
          const doctor = await User.findOne({ role: 'doctor', isActive: true })
          if (doctor) assignedDoctor = doctor._id
        }

        patient = await Patient.create({
          name:           row.patientName.trim(),
          dob,
          edd,
          parity:         row.parity || 'G1P0',
          insurance:      row.insurance || 'None',
          phone:          row.phone || undefined,
          assignedDoctor,
          registeredBy:   req.user!._id,
          visits:         [],
        })
        action = 'patient_created'
      }

      patient.visits.push({
        date:        visitDate,
        ga,
        sbp,
        dbp,
        proteinuria,
        weight,
        notes:       row.notes || undefined,
        recordedBy:  req.user!._id,
        recordedAt:  new Date(),
      })

      await patient.save()

      const engineResult = evaluatePatient(patient)
      let alertLabel: string | undefined

      if (engineResult) {
        const latestVisit = patient.visits[patient.visits.length - 1]
        await Alert.create({
          patient:  patient._id,
          visit:    latestVisit._id,
          flags:    engineResult.flags,
          severity: engineResult.severity,
          status:   'active',
        })
        alertLabel = engineResult.severity === 'high' ? 'HIGH RISK alert generated' : 'Medium risk alert generated'
      }

      results.push({
        row: rowNum,
        patientName: row.patientName,
        status: 'imported',
        action,
        alert: alertLabel,
      })
    }

    const imported = results.filter(r => r.status === 'imported').length
    const skipped  = results.filter(r => r.status === 'skipped').length

    res.status(200).json({
      message: `Import complete: ${imported} visit${imported !== 1 ? 's' : ''} imported, ${skipped} row${skipped !== 1 ? 's' : ''} skipped`,
      imported,
      skipped,
      results,
    })

  } catch (err) {
    console.error('Import error:', err)
    const msg = err instanceof Error ? err.message : 'Import failed'
    res.status(500).json({ message: msg })
  }
}
