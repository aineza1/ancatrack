import type { Patient } from '../types'
import type { AlertResult } from '../types'

export const PATIENTS: Patient[] = [
  {
    id: 1, name: 'Mwiza Angel', dob: '1996-03-12',
    edd: '14-03-2026', ga: 32, parity: 'G2P1',
    insurance: 'Mutuelle', assignedDoctor: 'Dr. Mwiza',
    risk: 'high',
    visits: [
      { date: '12-02-2026', ga: 20, sbp: 118, dbp: 78, proteinuria: 'None', weight: 62 },
      { date: '19-03-2026', ga: 24, sbp: 124, dbp: 82, proteinuria: 'None', weight: 64 },
      { date: '30-04-2026', ga: 28, sbp: 134, dbp: 90, proteinuria: 'Trace', weight: 66 },
      { date: '11-06-2026', ga: 32, sbp: 148, dbp: 96, proteinuria: '1+', weight: 68 },
    ]
  },
  {
    id: 2, name: 'Kanziga Claudine', dob: '1999-07-20',
    edd: '14-09-2026', ga: 28, parity: 'G1P0',
    insurance: 'Mutuelle', assignedDoctor: 'Dr. Uwase',
    risk: 'medium',
    visits: [
      { date: '14-03-2026', ga: 16, sbp: 112, dbp: 72, proteinuria: 'None', weight: 58 },
      { date: '14-04-2026', ga: 22, sbp: 122, dbp: 80, proteinuria: 'None', weight: 60 },
      { date: '30-05-2026', ga: 26, sbp: 136, dbp: 86, proteinuria: 'None', weight: 62 },
      { date: '11-06-2026', ga: 28, sbp: 142, dbp: 90, proteinuria: 'None', weight: 63 },
    ]
  },
  {
    id: 3, name: 'Byiringiro Jeannette', dob: '2001-11-05',
    edd: '14-10-2026', ga: 24, parity: 'G1P0',
    insurance: 'None', assignedDoctor: 'Dr. Jean',
    risk: 'normal',
    visits: [
      { date: '14-04-2026', ga: 16, sbp: 110, dbp: 70, proteinuria: 'None', weight: 55 },
      { date: '14-05-2026', ga: 21, sbp: 114, dbp: 72, proteinuria: 'None', weight: 57 },
      { date: '14-06-2026', ga: 24, sbp: 118, dbp: 74, proteinuria: 'None', weight: 59 },
    ]
  },
  {
    id: 4, name: 'Munezero Grace', dob: '1994-02-18',
    edd: '14-11-2026', ga: 18, parity: 'G3P2',
    insurance: 'Mutuelle', assignedDoctor: 'Dr. Gatsinga',
    risk: 'normal',
    visits: [
      { date: '14-05-2026', ga: 14, sbp: 108, dbp: 68, proteinuria: 'None', weight: 63 },
      { date: '14-06-2026', ga: 18, sbp: 110, dbp: 70, proteinuria: 'None', weight: 65 },
    ]
  },
  {
    id: 5, name: 'Ngabire Nadia', dob: '1997-09-30',
    edd: '14-08-2026', ga: 30, parity: 'G2P1',
    insurance: 'Mutuelle', assignedDoctor: 'Dr. Uwase',
    risk: 'medium',
    visits: [
      { date: '14-02-2026', ga: 18, sbp: 116, dbp: 76, proteinuria: 'None', weight: 60 },
      { date: '14-03-2026', ga: 22, sbp: 124, dbp: 80, proteinuria: 'None', weight: 62 },
      { date: '30-05-2026', ga: 26, sbp: 130, dbp: 84, proteinuria: 'None', weight: 64 },
      { date: '05-06-2026', ga: 30, sbp: 136, dbp: 88, proteinuria: 'Trace', weight: 65 },
    ]
  }
]
