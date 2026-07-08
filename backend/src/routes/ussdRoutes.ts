import { Router, Request, Response } from 'express'
import Patient from '../models/Patient'
import bcrypt from 'bcryptjs'

const router = Router()

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { sessionId, phoneNumber, text } = req.body

  const input  = (text || '').trim()
  const parts  = input.split('*').filter(Boolean)
  const level  = parts.length

  res.set('Content-Type', 'text/plain')

  try {

    if (input === '') {
      res.send(
        `CON Welcome to AncaTrack\nBugesera District Hospital\n\n1. Check my BP reading\n2. My next visit date\n3. Contact my doctor\n\nEnter your name to continue`
      )
      return
    }

    if (level === 1) {
      const name = parts[0]
      const patient = await Patient.findOne({
        name:     { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        isActive: true
      })

      if (!patient) {
        res.send(`END Name not found in our system.\nPlease visit Nyamata District Hospital to register.`)
        return
      }

      res.send(`CON Hello ${patient.name.split(' ')[0]}!\nEnter your PIN to continue:`)
      return
    }

    if (level === 2) {
      const name = parts[0]
      const pin  = parts[1]

      const patient = await Patient.findOne({
        name:     { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        isActive: true
      })
      .select('+pin')
      .populate('assignedDoctor', 'name')

      if (!patient || !patient.pin) {
        res.send(`END Authentication failed.\nPlease visit the hospital to set up your PIN.`)
        return
      }

      const pinMatch = await bcrypt.compare(pin, patient.pin)
      if (!pinMatch) {
        res.send(`END Incorrect PIN.\nPlease try again or ask your nurse to reset it.`)
        return
      }

      res.send(`CON Verified! Choose an option:\n1. My last BP reading\n2. My next visit date\n3. Contact my doctor`)
      return
    }

    if (level === 3) {
      const name   = parts[0]
      const pin    = parts[1]
      const choice = parts[2]

      const patient = await Patient.findOne({
        name:     { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        isActive: true
      })
      .select('+pin')
      .populate('assignedDoctor', 'name')

      if (!patient || !patient.pin) {
        res.send(`END Session expired. Please dial again.`)
        return
      }

      const pinMatch = await bcrypt.compare(pin, patient.pin)
      if (!pinMatch) {
        res.send(`END Session expired. Please dial again.`)
        return
      }

      const visits = patient.visits || []

      if (choice === '1') {

        if (visits.length === 0) {
          res.send(`END No visits recorded yet.\nPlease visit the hospital for your first ANC check.`)
          return
        }

        const latest  = visits[visits.length - 1]
        const date    = new Date(latest.date).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric'
        })
        const isHigh  = latest.sbp >= 140 || latest.dbp >= 90
        const status  = isHigh ? 'NEEDS ATTENTION' : 'Normal'

        res.send(
          `END Your last BP reading:\n` +
          `${latest.sbp}/${latest.dbp} mmHg\n` +
          `Date: ${date}\n` +
          `Weeks pregnant: ${latest.ga}w\n` +
          `Status: ${status}\n\n` +
          `${isHigh
            ? 'Please contact your doctor urgently.'
            : 'Keep attending your scheduled visits.'
          }`
        )
        return
      }

      if (choice === '2') {

        if (visits.length === 0) {
          res.send(`END No visits recorded yet.\nPlease visit the hospital for your first ANC check.`)
          return
        }

        const latest    = visits[visits.length - 1]
        const nextDate  = new Date(
          new Date(latest.date).getTime() + 28 * 24 * 60 * 60 * 1000
        ).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'long', year: 'numeric'
        })

        res.send(
          `END Your next visit is estimated:\n${nextDate}\n\n` +
          `Based on the 4-week ANC schedule.\n` +
          `Come earlier if you feel unwell.`
        )
        return
      }

      if (choice === '3') {
       
        const doctor = patient.assignedDoctor as any
        res.send(
          `END Your doctor:\n${doctor?.name || 'Contact hospital'}\n\n` +
          `Bugesera District Hospital\n` +
          `For emergencies:\n+250 788 000 000`
        )
        return
      }

      res.send(`END Invalid option.\nPlease dial *384*480# to start again.`)
      return
    }

    res.send(`END Invalid input.\nPlease dial *384*480# to start again.`)

  } catch (err) {
    console.error('USSD error:', err)
    res.send(`END Service temporarily unavailable.\nPlease try again later.`)
  }
})

export default router
