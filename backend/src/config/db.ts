import mongoose from 'mongoose'

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGODB_URI!)
    console.log(`MongoDB connected: ${mongoose.connection.host}`)
  } catch (err) {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  }
}
