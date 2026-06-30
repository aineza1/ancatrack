import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IVisit {
  _id?: Types.ObjectId
  date: Date
  ga: number
  sbp: number
  dbp: number
  proteinuria: string
  weight: number
  notes?: string
  recordedBy: Types.ObjectId
  recordedAt: Date
}

export interface IPatient extends Document {
  name: string
  dob: Date
  edd: Date
  parity: string
  insurance: string
  phone?: string
  assignedDoctor: Types.ObjectId
  registeredBy: Types.ObjectId
  isActive: boolean
  visits: IVisit[]
  createdAt: Date
  updatedAt: Date
}

const VisitSchema = new Schema<IVisit>({
  date:        { type: Date, required: true },
  ga:          { type: Number, required: true, min: 4, max: 44 },
  sbp:         { type: Number, required: true, min: 60, max: 250 },
  dbp:         { type: Number, required: true, min: 40, max: 150 },
  proteinuria: { type: String, enum: ['None', 'Trace', '1+', '2+', '3+'], default: 'None' },
  weight:      { type: Number, required: true, min: 30, max: 200 },
  notes:       { type: String, trim: true },
  recordedBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recordedAt:  { type: Date, default: Date.now },
})

const PatientSchema = new Schema<IPatient>(
  {
    name:           { type: String, required: true, trim: true },
    dob:            { type: Date, required: true },
    edd:            { type: Date, required: true },
    parity:         { type: String, required: true },
    insurance:      { type: String, default: 'None' },
    phone:          { type: String },
    assignedDoctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    registeredBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive:       { type: Boolean, default: true },
    visits:         { type: [VisitSchema], default: [] },
  },
  { timestamps: true }
)

PatientSchema.index({ assignedDoctor: 1, isActive: 1 })

export default mongoose.model<IPatient>('Patient', PatientSchema)
