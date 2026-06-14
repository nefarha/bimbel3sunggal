import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Beranda from './pages/home/Beranda'
import ProfileBimbel from './pages/home/ProfileBimbel'
import Tutor from './pages/home/Tutor'
import Berita from './pages/home/Berita'
import Login from './pages/login/Login'
import DashboardAdmin from './pages/dashboard/admin/dashboard_admin'
import PendaftaranSiswa from './pages/dashboard/admin/pendaftaran_siswa'
import PembayaranSiswa from './pages/dashboard/admin/pembayaran_siswa'
import ManajemenSiswa from './pages/dashboard/admin/manajemen_siswa'
import ManajemenTutor from './pages/dashboard/admin/manajemen_tutor'
import TambahTutor from './pages/dashboard/admin/tambah_tutor'
import PresensiTutor from './pages/dashboard/admin/presensi_tutor'
import ManajemenJadwal from './pages/dashboard/admin/manajemen_jadwal'
import RekapAbsensi from './pages/dashboard/admin/rekap_absensi'
import TutorLayout from './components/tutor/TutorLayout'
import JadwalMengajar from './pages/dashboard/tutor/jadwal_mengajar'
import Kehadiran from './pages/dashboard/tutor/kehadiran'
import Gaji from './pages/dashboard/tutor/gaji'
import ProfileTutor from './pages/dashboard/tutor/profile'
import AbsensiSiswaTutor from './pages/dashboard/tutor/absensi_siswa'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Navigate to="/admin/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pendaftaran"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PendaftaranSiswa />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pembayaran"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PembayaranSiswa />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manajemen_siswa"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManajemenSiswa />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/guru"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManajemenTutor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/guru/tambah"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TambahTutor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/presensi_guru"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PresensiTutor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/jadwal"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManajemenJadwal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/absensi"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <RekapAbsensi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor"
          element={
            <ProtectedRoute allowedRoles={['tutor']}>
              <Navigate to="/tutor/jadwal-mengajar" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/profile"
          element={
            <ProtectedRoute allowedRoles={['tutor']}>
              <TutorLayout>
                <ProfileTutor />
              </TutorLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/jadwal-mengajar"
          element={
            <ProtectedRoute allowedRoles={['tutor']}>
              <TutorLayout>
                <JadwalMengajar />
              </TutorLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/kehadiran"
          element={
            <ProtectedRoute allowedRoles={['tutor']}>
              <TutorLayout>
                <Kehadiran />
              </TutorLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/gaji"
          element={
            <ProtectedRoute allowedRoles={['tutor']}>
              <TutorLayout>
                <Gaji />
              </TutorLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/absensi-siswa/:id_jadwal"
          element={
            <ProtectedRoute allowedRoles={['tutor']}>
              <TutorLayout>
                <AbsensiSiswaTutor />
              </TutorLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Beranda />} />
              <Route path="/profile" element={<ProfileBimbel />} />
              <Route path="/tutor" element={<Tutor />} />
              <Route path="/berita" element={<Berita />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
