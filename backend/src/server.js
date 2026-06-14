import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { testConnection } from './config/database.js'

import healthRoutes from './routes/health.js'
import authRoutes from './routes/auth.js'
import siswaRoutes from './routes/siswa.js'
import tutorRoutes from './routes/tutor.js'
import mapelRoutes from './routes/mapel.js'
import kelasRoutes from './routes/kelas.js'
import jadwalRoutes from './routes/jadwal.js'
import absensiSiswaRoutes from './routes/absensiSiswa.js'
import absensiTutorRoutes from './routes/absensiTutor.js'
import pembayaranRoutes from './routes/pembayaran.js'
import dashboardRoutes from './routes/dashboard.js'
import gajiRoutes from './routes/gaji.js'
import keuanganRoutes from './routes/keuangan.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://yourdomain.com'
    : 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/siswa', siswaRoutes)
app.use('/api/guru', tutorRoutes)
app.use('/api/mapel', mapelRoutes)
app.use('/api/kelas', kelasRoutes)
app.use('/api/jadwal', jadwalRoutes)
app.use('/api/absensi-siswa', absensiSiswaRoutes)
app.use('/api/absensi-tutor', absensiTutorRoutes)
app.use('/api/pembayaran', pembayaranRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/gaji', gajiRoutes)
app.use('/api/keuangan', keuanganRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  })
})

const startServer = async () => {
  await testConnection()
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

startServer()
