export interface Visit {
  date: string
  ga: number
  sbp: number
  dbp: number
  proteinuria: string
  weight: number
}

export interface Patient {
  id: number
  name: string
  dob: string
  edd: string
  ga: number
  parity: string
  insurance: string
  assignedDoctor: string
  risk: 'high' | 'medium' | 'normal'
  visits: Visit[]
}

export interface AlertFlag {
  type: string
  detail: string
}

export interface AlertResult {
  severity: 'high' | 'medium'
  flags: AlertFlag[]
  patient: Patient
}
