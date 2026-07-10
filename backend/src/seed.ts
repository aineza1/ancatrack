import 'dotenv/config'
import mongoose from 'mongoose'
import User from './models/User'
import Patient from './models/Patient'
import Alert from './models/Alert'
import { evaluatePatient } from './utils/alertEngine'

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!)
  await Promise.all([User.deleteMany({}), Patient.deleteMany({}), Alert.deleteMany({})])
  console.log('Cleared DB')

  const [dr1, dr2, dr3, nurse] = await User.create([
    { name: 'Dr. Uwase Aline',   email: 'a.uwase@bugesera.rw',    password: 'password123', role: 'doctor' },
    { name: 'Dr. Habimana Eric', email: 'e.habimana@bugesera.rw',  password: 'password123', role: 'doctor' },
    { name: 'Dr. Jean Bosco',    email: 'j.bosco@bugesera.rw',     password: 'password123', role: 'doctor' },
    { name: 'Nurse Mutesi Joy',  email: 'j.mutesi@bugesera.rw',    password: 'password123', role: 'nurse'  },
    { name: 'Admin User',        email: 'admin@bugesera.rw',       password: 'password123', role: 'admin'  },
  ])

  const patientsData = [
    {
      name: 'Mwiza Angel',
      dob: new Date('1996-03-12'),
      edd: new Date('2026-03-14'),
      parity: 'G2P1',
      insurance: 'Mutuelle',
      phone: '+250791848342',
      assignedDoctor: dr1._id,
      visits: [
        { date: new Date('2026-02-12'), ga: 20, sbp: 118, dbp: 78,  proteinuria: 'None',  weight: 62, recordedBy: nurse._id, recordedAt: new Date('2026-02-12') },
        { date: new Date('2026-03-19'), ga: 24, sbp: 124, dbp: 82,  proteinuria: 'None',  weight: 64, recordedBy: nurse._id, recordedAt: new Date('2026-03-19') },
        { date: new Date('2026-04-30'), ga: 28, sbp: 134, dbp: 90,  proteinuria: 'Trace', weight: 66, recordedBy: nurse._id, recordedAt: new Date('2026-04-30') },
        { date: new Date('2026-06-11'), ga: 32, sbp: 148, dbp: 96,  proteinuria: '1+',    weight: 68, recordedBy: nurse._id, recordedAt: new Date('2026-06-11') },
      ],
    },
    {
      name: 'Kanziga Claudine',
      dob: new Date('1999-07-20'),
      edd: new Date('2026-09-14'),
      parity: 'G1P0',
      insurance: 'Mutuelle',
      phone: '+250785253367',
      assignedDoctor: dr1._id,
      visits: [
        { date: new Date('2026-03-14'), ga: 16, sbp: 112, dbp: 72, proteinuria: 'None', weight: 58, recordedBy: nurse._id, recordedAt: new Date('2026-03-14') },
        { date: new Date('2026-04-14'), ga: 22, sbp: 122, dbp: 80, proteinuria: 'None', weight: 60, recordedBy: nurse._id, recordedAt: new Date('2026-04-14') },
        { date: new Date('2026-05-30'), ga: 26, sbp: 136, dbp: 86, proteinuria: 'None', weight: 62, recordedBy: nurse._id, recordedAt: new Date('2026-05-30') },
        { date: new Date('2026-06-11'), ga: 28, sbp: 142, dbp: 90, proteinuria: 'None', weight: 63, recordedBy: nurse._id, recordedAt: new Date('2026-06-11') },
      ],
    },
    {
      name: 'Byiringiro Jeannette',
      dob: new Date('2001-11-05'),
      edd: new Date('2026-10-14'),
      parity: 'G1P0',
      insurance: 'None',
      phone: '0788345678',
      assignedDoctor: dr2._id,
      visits: [
        { date: new Date('2026-04-14'), ga: 16, sbp: 110, dbp: 70, proteinuria: 'None', weight: 55, recordedBy: nurse._id, recordedAt: new Date('2026-04-14') },
        { date: new Date('2026-05-14'), ga: 21, sbp: 114, dbp: 72, proteinuria: 'None', weight: 57, recordedBy: nurse._id, recordedAt: new Date('2026-05-14') },
        { date: new Date('2026-06-14'), ga: 24, sbp: 118, dbp: 74, proteinuria: 'None', weight: 59, recordedBy: nurse._id, recordedAt: new Date('2026-06-14') },
      ],
    },
    {
      name: 'Munezero Grace',
      dob: new Date('1994-02-18'),
      edd: new Date('2026-11-14'),
      parity: 'G3P2',
      insurance: 'Mutuelle',
      phone: '0788456789',
      assignedDoctor: dr3._id,
      visits: [
        { date: new Date('2026-05-14'), ga: 14, sbp: 108, dbp: 68, proteinuria: 'None', weight: 63, recordedBy: nurse._id, recordedAt: new Date('2026-05-14') },
        { date: new Date('2026-06-14'), ga: 18, sbp: 110, dbp: 70, proteinuria: 'None', weight: 65, recordedBy: nurse._id, recordedAt: new Date('2026-06-14') },
      ],
    },
    {
      name: 'Ngabire Nadia',
      dob: new Date('1997-09-30'),
      edd: new Date('2026-08-14'),
      parity: 'G2P1',
      insurance: 'Mutuelle',
      phone: '+250780282575',
      assignedDoctor: dr1._id,
      visits: [
        { date: new Date('2026-02-14'), ga: 18, sbp: 116, dbp: 76, proteinuria: 'None',  weight: 60, recordedBy: nurse._id, recordedAt: new Date('2026-02-14') },
        { date: new Date('2026-03-14'), ga: 22, sbp: 124, dbp: 80, proteinuria: 'None',  weight: 62, recordedBy: nurse._id, recordedAt: new Date('2026-03-14') },
        { date: new Date('2026-05-14'), ga: 26, sbp: 130, dbp: 84, proteinuria: 'None',  weight: 64, recordedBy: nurse._id, recordedAt: new Date('2026-05-14') },
        { date: new Date('2026-06-14'), ga: 30, sbp: 136, dbp: 88, proteinuria: 'Trace', weight: 65, recordedBy: nurse._id, recordedAt: new Date('2026-06-14') },
      ],
    },
  ]

  for (const data of patientsData) {
    const patient = await Patient.create({
      name:           data.name,
      dob:            data.dob,
      edd:            data.edd,
      parity:         data.parity,
      insurance:      data.insurance,
      phone:          data.phone || '',
      assignedDoctor: data.assignedDoctor,
      registeredBy:   nurse._id,
      visits:         data.visits,
    })

    const result = evaluatePatient(patient)
    if (result) {
      const latest = patient.visits[patient.visits.length - 1]
      await Alert.create({
        patient:  patient._id,
        visit:    latest._id,
        flags:    result.flags,
        severity: result.severity,
        status:   'active',
      })
      console.log(`   ALERT: ${patient.name} (${result.severity})`)
    }
    console.log(`  ✓ ${patient.name}`)
      const bcryptjs = await import('bcryptjs')
      const patients = await Patient.find({ name: { $in: ['Mwiza Angel', 'Kanziga Claudine', 'Ngabire Nadia'] } })
      for (const p of patients) {
        p.pin = await bcryptjs.default.hash('1234', 12)
        await p.save()
}
  }

  console.log('\n Seed complete!')

  await mongoose.disconnect()
}

seed().catch((e) => {
  console.error(' Seed failed:', e)
  process.exit(1)
})
