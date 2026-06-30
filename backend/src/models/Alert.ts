import mongoose, { Document, Schema, Types } from 'mongoose'

export type AlertType = 'BP_TRAJECTORY_RISE' | 'SBP_HIGH' | 'DBP_HIGH' | 'COMBINED_RISK'
export type AlertSeverity = 'low' | 'high' | 'medium'
export type AlertStatus = 'active' | 'acknowledged' | 'escalated'

export interface IAlertFlag {
  type: AlertType
  detail: string
}

export interface IAlert extends Document {
  patient: Types.ObjectId
  visit: Types.ObjectId
  flags: IAlertFlag[]
  severity: AlertSeverity
  status: AlertStatus
  acknowledgedBy?: Types.ObjectId
  acknowledgedAt?: Date
  escalatedTo?: string
  escalatedAt?: Date
  createdAt: Date
}

const AlertSchema = new Schema<IAlert>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    visit: { type: Schema.Types.ObjectId, required: true },
    flags: [{ type: { type: String, required: true }, detail: { type: String, required: true } }],
    severity: { type: String, enum: ['low', 'high', 'medium'], required: true },
    status: { type: String, enum: ['active', 'acknowledged', 'escalated'], default: 'active' },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: { type: Date },
    escalatedTo: { type: String },
    escalatedAt: { type: Date },
  },
  { timestamps: true }
)

AlertSchema.index({ patient: 1, status: 1 })
AlertSchema.index({ status: 1, createdAt: -1 })

export default mongoose.model<IAlert>('Alert', AlertSchema)
