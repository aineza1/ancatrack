import type { Patient, AlertResult } from '../types'

const WHO_DBP_DELTA     = 15
const WHO_SBP_THRESHOLD = 140
const WHO_DBP_THRESHOLD = 90

export function evaluatePatient(patient: Patient): AlertResult | null {
  const { visits } = patient
  if (!visits || visits.length < 2) return null

  const baseline = visits[0]
  const latest   = visits[visits.length - 1]
  const delta    = latest.dbp - baseline.dbp
  const flags    = []

  if (delta >= WHO_DBP_DELTA) {
    flags.push({
      type: 'BP_TRAJECTORY_RISE',
      detail: `DBP rose ${delta} mmHg from baseline (${baseline.dbp} → ${latest.dbp} mmHg)`
    })
  }
  if (latest.sbp >= WHO_SBP_THRESHOLD) {
    flags.push({
      type: 'SBP_HIGH',
      detail: `SBP ${latest.sbp} mmHg ≥ WHO threshold of ${WHO_SBP_THRESHOLD} mmHg`
    })
  }
  if (latest.dbp >= WHO_DBP_THRESHOLD) {
    flags.push({
      type: 'DBP_HIGH',
      detail: `DBP ${latest.dbp} mmHg ≥ WHO threshold of ${WHO_DBP_THRESHOLD} mmHg`
    })
  }

  const hasProteinuria = !['None', 'none', ''].includes(latest.proteinuria || '')
  const hasHighBP = flags.some(f =>
    ['SBP_HIGH', 'DBP_HIGH', 'BP_TRAJECTORY_RISE'].includes(f.type)
  )

  if (hasHighBP && hasProteinuria) {
    flags.push({
      type: 'COMBINED_RISK',
      detail: `High BP + proteinuria ${latest.proteinuria} — meets pre-eclampsia diagnostic criteria`
    })
  }

  if (flags.length === 0) return null

  return {
    severity: flags.some(f => f.type === 'COMBINED_RISK') ? 'high' : 'medium',
    flags,
    patient
  }
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}
