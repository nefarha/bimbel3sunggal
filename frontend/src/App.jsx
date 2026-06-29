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
import DaftarKelas from './pages/dashboard/admin/daftar_kelas'
import RekapAbsensi from './pages/dashboard/admin/rekap_absensi'
import TutorLayout from './components/tutor/TutorLayout'
import TutorDashboard from './pages/dashboard/tutor/tutor_dashboard'
import JadwalMengajar from './pages/dashboard/tutor/jadwal_mengajar'
import Kehadiran from './pages/dashboard/tutor/kehadiran'
import Gaji from './pages/dashboard/tutor/gaji'
import ProfileTutor from './pages/dashboard/tutor/profile'
import AbsensiSiswaTutor from './pages/dashboard/tutor/absensi_siswa'
import InfalTutorPage from './pages/dashboard/tutor/infal'
import StudentLayout from './components/siswa/StudentLayout'
import SiswaDashboard from './pages/dashboard/siswa/siswa_dashboard'
import ProfileSiswa from './pages/dashboard/siswa/profile'
import JadwalSiswa from './pages/dashboard/siswa/jadwal'
import PembayaranSiswaPage from './pages/dashboard/siswa/pembayaran'
import RekapAbsensiSiswa from './pages/dashboard/siswa/rekap_absensi'
import OwnerLayout from './components/owner/OwnerLayout'
import OwnerDashboard from './pages/dashboard/owner/owner_dashboard'
import KelolaGaji from './pages/dashboard/owner/kelola_gaji'
import LaporanKeuangan from './pages/dashboard/owner/laporan_keuangan'
import Pengaturan from './pages/dashboard/owner/pengaturan'
import InfalTutor from './pages/dashboard/admin/infal_tutor'
import ManajemenMapel from './pages/dashboard/admin/manajemen_mapel'
import RekapAbsensiSiswaAdmin from './pages/dashboard/admin/rekap_absensi_siswa'
import SemuaPembayaran from './pages/dashboard/admin/semua_pembayaran'
import TagihanSiswa from './pages/dashboard/admin/tagihan_siswa'
import KalenderLibur from './pages/dashboard/admin/kalender_libur'
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
          path="/admin/semua-pembayaran"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SemuaPembayaran />
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
          path="/admin/rekap-absensi-siswa"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <RekapAbsensiSiswaAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/kelas"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DaftarKelas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/infal-tutor"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <InfalTutor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tagihan"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TagihanSiswa />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/kalender-libur"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <KalenderLibur />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mapel"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManajemenMapel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor"
          element={
            <ProtectedRoute allowedRoles={['tutor']}>
              <Navigate to="/tutor/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['tutor']}>
              <TutorLayout>
                <TutorDashboard />
              </TutorLayout>
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
        <Route
          path="/tutor/infal"
          element={
            <ProtectedRoute allowedRoles={['tutor']}>
              <TutorLayout>
                <InfalTutorPage />
              </TutorLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/siswa"
          element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <Navigate to="/siswa/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/siswa/dashboard"
          element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <StudentLayout>
                <SiswaDashboard />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/siswa/profile"
          element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <StudentLayout>
                <ProfileSiswa />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/siswa/jadwal"
          element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <StudentLayout>
                <JadwalSiswa />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/siswa/pembayaran"
          element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <StudentLayout>
                <PembayaranSiswaPage />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/siswa/rekap-absensi"
          element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <StudentLayout>
                <RekapAbsensiSiswa />
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={['pemilik']}>
              <Navigate to="/owner/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/dashboard"
          element={
            <ProtectedRoute allowedRoles={['pemilik']}>
              <OwnerLayout>
                <OwnerDashboard />
              </OwnerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/kelola-gaji"
          element={
            <ProtectedRoute allowedRoles={['pemilik']}>
              <OwnerLayout>
                <KelolaGaji />
              </OwnerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/laporan-keuangan"
          element={
            <ProtectedRoute allowedRoles={['pemilik']}>
              <OwnerLayout>
                <LaporanKeuangan />
              </OwnerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/pengaturan"
          element={
            <ProtectedRoute allowedRoles={['pemilik']}>
              <OwnerLayout>
                <Pengaturan />
              </OwnerLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Beranda />} />
              <Route path="/profile" element={<ProfileBimbel />} />
              <Route path="/tutor_public" element={<Tutor />} />
              <Route path="/berita" element={<Berita />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
