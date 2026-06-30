import { IPatient, IVisit } from '../models/Patient'
import type { IAlertFlag , AlertSeverity } from '../models/Alert'

const WHO_DBP_DELTA     = 15
const WHO_SBP_THRESHOLD = 140
const WHO_DBP_THRESHOLD = 90

export interface AlertEngineResult {
  flags: IAlertFlag[]
  severity: 'high' | 'medium' | 'low'
}

export function evaluatePatient(patient: IPatient): AlertEngineResult | null {
  const visits = patient.visits
  if (!visits || visits.length < 2) return null

  const baseline: IVisit = visits[0]
  const latest: IVisit   = visits[visits.length - 1]
  const delta            = latest.dbp - baseline.dbp
  const flags: IAlertFlag[] = []

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
    flags,
    severity: flags.some(f => f.type === 'COMBINED_RISK') ? 'high' : 'medium'
  }
}
