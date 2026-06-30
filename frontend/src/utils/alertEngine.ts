import type { Patient } from '../types'

const WHO_DBP_DELTA     = 15
const WHO_SBP_THRESHOLD = 140
const WHO_DBP_THRESHOLD = 90

export interface AlertFlag {
  type: string
  detail: string
}

export interface AlertResult {
  severity: 'high' | 'medium'
  flags: AlertFlag[]
  patient: Patient
}

export function evaluatePatient(patient: Patient): AlertResult | null {
  const { visits } = patient
  if (!visits || visits.length < 2) return null

  const baseline = visits[0]
  const latest   = visits[visits.length - 1]
  const delta    = latest.dbp - baseline.dbp
  const flags: AlertFlag[] = []

  if (delta >= WHO_DBP_DELTA) {
    flags.push({
      type: 'BP_TRAJECTORY_RISE',
      detail: `DBP rose ${delta} mmHg from baseline (${baseline.dbp} to ${latest.dbp} mmHg)`
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
      detail: `High BP + proteinuria ${latest.proteinuria}; meets pre-eclampsia diagnostic criteria`
    })
  }

  if (flags.length === 0) return null

  return {
    severity: flags.some(f => f.type === 'COMBINED_RISK') ? 'high' : 'medium',
    flags,
    patient
  }
}

export interface ScoreBreakdownItem {
  factor: string
  points: number
  maxPoints: number
  reason: string
}

export interface RiskScoreResult {
  score: number
  band: 'low' | 'medium' | 'high'
  breakdown: ScoreBreakdownItem[]
  dominantFactor: string
}

export function calculateRiskScore(patient: Patient): RiskScoreResult {
  const visits = patient.visits
  const breakdown: ScoreBreakdownItem[] = []
  let score = 0

  if (visits.length < 1) {
    return {
      score: 0,
      band: 'low',
      breakdown: [{ factor: 'Insufficient data', points: 0, maxPoints: 100, reason: 'No visits recorded yet' }],
      dominantFactor: 'Insufficient data'
    }
  }

  const baseline  = visits[0]
  const latest    = visits[visits.length - 1]
  const dbpDelta  = latest.dbp - baseline.dbp
  const weeksSpan = Math.max(1, latest.ga - baseline.ga)


  let bpTrajectoryPoints = 0
  if (dbpDelta >= 20) {
    bpTrajectoryPoints = 30
  } else if (dbpDelta >= 15) {
    bpTrajectoryPoints = 22
  } else if (dbpDelta >= 10) {
    bpTrajectoryPoints = 14
  } else if (dbpDelta >= 5) {
    bpTrajectoryPoints = 6
  }

  if (bpTrajectoryPoints > 0) {
    score += bpTrajectoryPoints
    breakdown.push({
      factor: 'BP trajectory',
      points: bpTrajectoryPoints,
      maxPoints: 30,
      reason: `DBP rose ${dbpDelta} mmHg from baseline (${baseline.dbp} : ${latest.dbp} mmHg)`
    })
  } else {
    breakdown.push({
      factor: 'BP trajectory',
      points: 0,
      maxPoints: 30,
      reason: `DBP stable, rose only ${dbpDelta} mmHg from baseline`
    })
  }

  let absolutePoints = 0
  if (latest.sbp >= 160 || latest.dbp >= 110) {
    absolutePoints = 25
  } else if (latest.sbp >= 140 || latest.dbp >= 90) {
    absolutePoints = 18
  } else if (latest.sbp >= 130 || latest.dbp >= 85) {
    absolutePoints = 8
  }

  if (absolutePoints > 0) {
    score += absolutePoints
    breakdown.push({
      factor: 'Absolute BP threshold',
      points: absolutePoints,
      maxPoints: 25,
      reason: `Latest reading ${latest.sbp}/${latest.dbp} mmHg: ${absolutePoints >= 25 ? 'severe hypertensive range' : absolutePoints >= 18 ? 'hypertensive range' : 'approaching threshold'}`
    })
  } else {
    breakdown.push({
      factor: 'Absolute BP threshold',
      points: 0,
      maxPoints: 25,
      reason: `Latest reading ${latest.sbp}/${latest.dbp} mmHg: within normal range`
    })
  }

  const proteinuriaPoints: Record<string, number> = {
    'None':  0,
    'Trace': 5,
    '1+':    12,
    '2+':    17,
    '3+':    20
  }
  const protPoints = proteinuriaPoints[latest.proteinuria] ?? 0
  score += protPoints
  breakdown.push({
    factor: 'Proteinuria',
    points: protPoints,
    maxPoints: 20,
    reason: protPoints === 0
      ? 'No proteinuria detected'
      : `Proteinuria ${latest.proteinuria} — ${protPoints >= 12 ? 'clinically significant, meets pre-eclampsia diagnostic criterion' : 'trace level, monitor closely'}`
  })

  let parityPoints = 0
  if (patient.parity.startsWith('G1P0')) {
    parityPoints = 10
  } else if (patient.parity.startsWith('G2')) {
    parityPoints = 4
  }
  score += parityPoints
  breakdown.push({
    factor: 'Parity',
    points: parityPoints,
    maxPoints: 10,
    reason: patient.parity.startsWith('G1P0')
      ? `First pregnancy (${patient.parity}), primigravida carries highest pre-eclampsia risk`
      : `${patient.parity} Prior pregnancies reduce but do not eliminate risk`
  })

  let velocityPoints = 0
  if (visits.length >= 2 && dbpDelta > 0) {
    const mmHgPerWeek = dbpDelta / weeksSpan
    if (mmHgPerWeek >= 2.5) {
      velocityPoints = 10
    } else if (mmHgPerWeek >= 1.5) {
      velocityPoints = 6
    } else if (mmHgPerWeek >= 0.8) {
      velocityPoints = 3
    }
    if (velocityPoints > 0) {
      score += velocityPoints
      breakdown.push({
        factor: 'Rate of BP rise',
        points: velocityPoints,
        maxPoints: 10,
        reason: `DBP rising at ${mmHgPerWeek.toFixed(1)} mmHg/week, ${velocityPoints >= 10 ? 'rapid onset' : 'moderate rate'}`
      })
    } else {
      breakdown.push({ factor: 'Rate of BP rise', points: 0, maxPoints: 10, reason: 'Gradual rise. Not a significant velocity risk' })
    }
  } else {
    breakdown.push({ factor: 'Rate of BP rise', points: 0, maxPoints: 10, reason: 'Insufficient visit history to calculate velocity' })
  }

  let agePoints = 0
  const birthYear = new Date(patient.dob).getFullYear()
  const currentYear = new Date().getFullYear()
  const age = currentYear - birthYear
  if (age < 20 || age > 35) {
    agePoints = 5
    score += agePoints
  }
  breakdown.push({
    factor: 'Maternal age',
    points: agePoints,
    maxPoints: 5,
    reason: agePoints > 0
      ? `Age ${age} (under 20 or over 35 is an established pre-eclampsia risk factor)`
      : `Age ${age} (within standard risk range)`
  })

  score = Math.min(100, Math.round(score))
  const band: 'low' | 'medium' | 'high' =
    score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low'

  const dominantFactor = breakdown
    .filter(b => b.points > 0)
    .sort((a, b) => b.points - a.points)[0]?.factor ?? 'No significant risk factors'

  return { score, band, breakdown, dominantFactor }
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}
