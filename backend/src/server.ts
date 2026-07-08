import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db'
import authRoutes    from './routes/authRoutes'
import patientRoutes from './routes/patientRoutes'
import alertRoutes   from './routes/alertRoutes'
import userRoutes from './routes/userRoutes'
import importRoutes from './routes/importRoutes'
import portalRoutes from './routes/patientPortalRoutes'
import ussdRoutes from './routes/ussdRoutes'

const app  = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/api/auth',     authRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/alerts',   alertRoutes)
app.use('/api/users',   userRoutes)
app.use('/api/import', importRoutes)
app.use('/api/portal', portalRoutes)
app.use('/api/ussd', ussdRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV })
})

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`AncaTrack API running on http://localhost:${PORT}`)
  })
})
