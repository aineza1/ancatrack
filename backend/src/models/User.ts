import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'
import { NextFunction } from 'express'

export type UserRole = 'doctor' | 'nurse' | 'admin'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: UserRole
  facility: string
  isActive: boolean
  createdAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role:     { type: String, enum: ['doctor', 'nurse', 'admin'], required: true },
    facility: { type: String, default: 'Nyamata District Hospital' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password)
}

UserSchema.set('toJSON', {
  transform: (_doc: unknown, ret: { password?: string }) => {
    ret.password = undefined
    return ret
  }
})

export default mongoose.model<IUser>('User', UserSchema)
