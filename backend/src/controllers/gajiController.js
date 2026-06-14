import { query, queryOne } from '../config/query.js';

const handleError = (res, error) => {
  console.error('❌ GajiController error:', error);
  res.status(500).json({ success: false, message: error.message });
};

const BONUS_PER_HADIR = 15000;
const PERSEN_POTONGAN_PER_ABSEN = 0.05;

// GET /api/gaji/perhitungan
// Query: bulan (1-12), tahun
export const getPerhitunganGaji = async (req, res) => {
  try {
    const userId = req.userId;
    const { bulan, tahun } = req.query;

    const targetMonth = bulan ? parseInt(bulan, 10) : new Date().getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun, 10) : new Date().getFullYear();

    // Get tutor info by authenticated user
    const tutor = await queryOne(
      `SELECT id_tutor, nama_tutor FROM tutor WHERE id_user = ? LIMIT 1`,
      [userId]
    );

    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Data tutor tidak ditemukan' });
    }

    const idTutor = tutor.id_tutor;

    // Get all classes for this tutor
    const kelasList = await query(
      `SELECT id_kelas, nama_kelas FROM kelas WHERE id_tutor = ?`,
      [idTutor]
    );

    const kelasIds = kelasList.map((k) => k.id_kelas);

    // Get students in these classes with SPP and tanggal_masuk
    let siswaList = [];
    let totalSPP = 0;

    if (kelasIds.length > 0) {
      const placeholders = kelasIds.map(() => '?').join(',');

      siswaList = await query(
        `SELECT DISTINCT s.id_siswa, s.nama, s.tanggal_masuk, s.spp
         FROM siswa s
         INNER JOIN kelas_siswa ks ON ks.id_siswa = s.id_siswa
         WHERE ks.id_kelas IN (${placeholders})
           AND s.status = 'Aktif'
         ORDER BY s.nama ASC`,
        kelasIds
      );

      totalSPP = siswaList.reduce((sum, s) => sum + Number(s.spp || 0), 0);
    }

    // Komisi dasar (B) = 40% dari total SPP
    const komisiDasar = Math.round(totalSPP * 0.4);

    // Get tutor attendance for selected month/year
    const attendanceRecords = await query(
      `SELECT DAY(tanggal) AS hari, status
       FROM absensi_tutor
       WHERE id_tutor = ? AND MONTH(tanggal) = ? AND YEAR(tanggal) = ?`,
      [idTutor, targetMonth, targetYear]
    );

    let hadirCount = 0;
    let absenCount = 0;
    let sakitCount = 0;
    let izinCount = 0;

    attendanceRecords.forEach((rec) => {
      if (rec.status === 'Hadir') hadirCount++;
      else if (rec.status === 'Absen') absenCount++;
      else if (rec.status === 'Sakit') sakitCount++;
      else if (rec.status === 'Izin') izinCount++;
    });

    // Bonus/kerajinan: Rp 15.000 per hadir
    const bonus = hadirCount * BONUS_PER_HADIR;

    // Potongan: 5% dari komisi dasar per absen
    const potongan = Math.round(komisiDasar * PERSEN_POTONGAN_PER_ABSEN * absenCount);

    // Penyesuaian (C) = bonus - potongan
    const penyesuaian = bonus - potongan;

    // Grand total = B + C
    const grandTotal = komisiDasar + penyesuaian;

    // Count jumlah hari dalam bulan target
    const numDays = new Date(targetYear, targetMonth, 0).getDate();

    res.json({
      success: true,
      data: {
        tutor: {
          id_tutor: idTutor,
          nama_tutor: tutor.nama_tutor,
        },
        periode: {
          bulan: targetMonth,
          tahun: targetYear,
          jumlah_hari: numDays,
        },
        siswa: siswaList.map((s) => ({
          id_siswa: s.id_siswa,
          nama: s.nama,
          tanggal_masuk: s.tanggal_masuk,
          spp: Number(s.spp || 0),
        })),
        total_spp: totalSPP,
        komisi_dasar: komisiDasar,
        absensi: {
          hadir: hadirCount,
          absen: absenCount,
          sakit: sakitCount,
          izin: izinCount,
        },
        bonus,
        potongan,
        penyesuaian,
        grand_total: grandTotal,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};
