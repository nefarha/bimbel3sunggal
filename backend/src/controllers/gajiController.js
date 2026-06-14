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
    let bonus = hadirCount * BONUS_PER_HADIR;
    // Potongan: 5% dari komisi dasar per absen
    let potongan = Math.round(komisiDasar * PERSEN_POTONGAN_PER_ABSEN * absenCount);

    // Check if there's a record in gaji_tutor for this tutor/month
    const periodeStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01 00:00:00`;
    const gajiRecord = await queryOne(
      `SELECT * FROM gaji_tutor WHERE id_tutor = ? AND periode = ? LIMIT 1`,
      [idTutor, periodeStart]
    );

    if (gajiRecord) {
      bonus = Number(gajiRecord.bonus);
      potongan = Number(gajiRecord.potongan);
    }

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

// ──────── Owner: Preview specific tutor salary ────────

// GET /api/gaji/perhitungan/:id_tutor?bulan=&tahun=
export const getPerhitunganGajiByIdTutor = async (req, res) => {
  try {
    const { id_tutor } = req.params;
    const { bulan, tahun } = req.query;

    const targetMonth = bulan ? parseInt(bulan, 10) : new Date().getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun, 10) : new Date().getFullYear();

    // Get tutor info
    const tutor = await queryOne(
      `SELECT id_tutor, nama_tutor FROM tutor WHERE id_tutor = ? LIMIT 1`,
      [id_tutor]
    );

    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Data tutor tidak ditemukan' });
    }

    // Get all classes for this tutor
    const kelasList = await query(
      `SELECT id_kelas, nama_kelas FROM kelas WHERE id_tutor = ?`,
      [id_tutor]
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

    // Get tutor attendance
    const attendanceRecords = await query(
      `SELECT DAY(tanggal) AS hari, status
       FROM absensi_tutor
       WHERE id_tutor = ? AND MONTH(tanggal) = ? AND YEAR(tanggal) = ?`,
      [id_tutor, targetMonth, targetYear]
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

    // Get existing gaji_tutor record
    const periodeStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01 00:00:00`;
    const gajiRecord = await queryOne(
      `SELECT * FROM gaji_tutor WHERE id_tutor = ? AND periode = ? LIMIT 1`,
      [id_tutor, periodeStart]
    );

    const bonus = gajiRecord ? Number(gajiRecord.bonus) : 0;
    const potongan = gajiRecord ? Number(gajiRecord.potongan) : 0;
    const penyesuaian = bonus - potongan;
    const grandTotal = komisiDasar + penyesuaian;
    const numDays = new Date(targetYear, targetMonth, 0).getDate();

    res.json({
      success: true,
      data: {
        tutor: { id_tutor, nama_tutor: tutor.nama_tutor },
        periode: { bulan: targetMonth, tahun: targetYear, jumlah_hari: numDays },
        siswa: siswaList.map((s) => ({
          id_siswa: s.id_siswa,
          nama: s.nama,
          tanggal_masuk: s.tanggal_masuk,
          spp: Number(s.spp || 0),
        })),
        total_spp: totalSPP,
        komisi_dasar: komisiDasar,
        absensi: { hadir: hadirCount, absen: absenCount, sakit: sakitCount, izin: izinCount },
        bonus,
        potongan,
        penyesuaian,
        grand_total: grandTotal,
        is_confirmed: !!gajiRecord,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// ──────── Owner: Get all tutors salary data ────────

// GET /api/gaji/all?bulan=&tahun=
export const getAllGaji = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    const targetMonth = bulan ? parseInt(bulan, 10) : new Date().getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun, 10) : new Date().getFullYear();

    // Get all active tutors
    const tutors = await query(
      `SELECT id_tutor, nama_tutor FROM tutor WHERE status = 'Aktif' ORDER BY nama_tutor ASC`
    );

    // Get all gaji_tutor records for this month
    const periodeStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01 00:00:00`;
    const gajiRecords = await query(
      `SELECT * FROM gaji_tutor WHERE periode = ?`,
      [periodeStart]
    );
    const gajiMap = new Map();
    gajiRecords.forEach((g) => gajiMap.set(g.id_tutor, g));

    const result = await Promise.all(tutors.map(async (tutor) => {
      const idTutor = tutor.id_tutor;

      // Get classes for this tutor
      const kelasList = await query(
        `SELECT id_kelas FROM kelas WHERE id_tutor = ?`,
        [idTutor]
      );
      const kelasIds = kelasList.map((k) => k.id_kelas);

      // Calculate total SPP from students
      let totalSPP = 0;
      if (kelasIds.length > 0) {
        const placeholders = kelasIds.map(() => '?').join(',');
        const sppResult = await query(
          `SELECT COALESCE(SUM(s.spp), 0) AS total
           FROM siswa s
           INNER JOIN kelas_siswa ks ON ks.id_siswa = s.id_siswa
           WHERE ks.id_kelas IN (${placeholders})
             AND s.status = 'Aktif'`,
          kelasIds
        );
        totalSPP = Number(sppResult[0]?.total || 0);
      }

      const honor = Math.round(totalSPP * 0.4);

      // Attendance count
      const attResult = await queryOne(
        `SELECT COUNT(*) AS total FROM absensi_tutor
         WHERE id_tutor = ? AND MONTH(tanggal) = ? AND YEAR(tanggal) = ? AND status = 'Hadir'`,
        [idTutor, targetMonth, targetYear]
      );
      const hadir = Number(attResult?.total || 0);

      // Existing gaji record
      const existing = gajiMap.get(idTutor);

      return {
        id_tutor: idTutor,
        nama_tutor: tutor.nama_tutor,
        hadir,
        total_spp: totalSPP,
        honor,
        bonus: existing ? Number(existing.bonus) : null,
        potongan: existing ? Number(existing.potongan) : null,
        total_gaji: existing ? Number(existing.total_gaji) : null,
        is_confirmed: !!existing,
      };
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /api/gaji/send
// Body: { id_tutor, bulan, tahun, bonus, potongan, total_pemasukan, total_gaji }
export const sendGaji = async (req, res) => {
  try {
    const { id_tutor, bulan, tahun, bonus, potongan, total_pemasukan, total_gaji } = req.body;

    if (!id_tutor || !bulan || !tahun) {
      return res.status(400).json({ success: false, message: 'id_tutor, bulan, tahun wajib diisi' });
    }

    const targetMonth = parseInt(bulan, 10);
    const targetYear = parseInt(tahun, 10);
    const periodeStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01 00:00:00`;

    const bonusVal = Math.round(Number(bonus || 0));
    const potonganVal = Math.round(Number(potongan || 0));
    const pemasukanVal = Math.round(Number(total_pemasukan || 0));
    const gajiVal = Math.round(Number(total_gaji || 0));

    // Check if record exists
    const existing = await queryOne(
      `SELECT id_gaji FROM gaji_tutor WHERE id_tutor = ? AND periode = ? LIMIT 1`,
      [id_tutor, periodeStr]
    );

    if (existing) {
      await query(
        `UPDATE gaji_tutor
         SET total_pemasukan = ?, potongan = ?, bonus = ?, total_gaji = ?
         WHERE id_gaji = ?`,
        [pemasukanVal, potonganVal, bonusVal, gajiVal, existing.id_gaji]
      );
    } else {
      await query(
        `INSERT INTO gaji_tutor (id_tutor, periode, total_pemasukan, potongan, bonus, total_gaji)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id_tutor, periodeStr, pemasukanVal, potonganVal, bonusVal, gajiVal]
      );
    }

    res.json({ success: true, message: 'Data gaji berhasil disimpan' });
  } catch (error) {
    handleError(res, error);
  }
};
