import { query, queryOne } from '../config/query.js';
import { LiburRepository } from '../repository/libur/liburRepository.js';

const liburRepository = new LiburRepository();
const handleError = (res, error) => {
  console.error('❌ GajiController error:', error);
  res.status(500).json({ success: false, message: error.message });
};

// ─── Helper: ambil setting dari app_settings ────────────────
const getSetting = async (key, defaultValue) => {
  const row = await queryOne(
    `SELECT setting_value FROM app_settings WHERE setting_key = ?`,
    [key]
  );
  return row ? row.setting_value : defaultValue;
};

// ─── Helper: hitung jumlah hari kerja (Senin-Jumat) dalam sebulan ─
const countWorkingDays = (year, month) => {
  const numDays = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= numDays; day++) {
    const dow = new Date(year, month - 1, day).getDay(); // 0=Sun, 6=Sat
    if (dow >= 1 && dow <= 5) count++; // Senin-Jumat
  }
  return count;
};

// ─── Helper: hitung total infal untuk tutor dalam periode ────
const getTotalInfal = async (idTutor, month, year) => {
  const result = await queryOne(
    `SELECT COUNT(*) AS jumlah, COALESCE(SUM(nominal), 0) AS total
     FROM infal_tutor
     WHERE id_tutor_pengganti = ?
       AND MONTH(tanggal) = ? AND YEAR(tanggal) = ?`,
    [idTutor, month, year]
  );
  return {
    jumlah: Number(result?.jumlah || 0),
    total: Number(result?.total || 0),
  };
};

// ─── Helper: hitung komponen gaji untuk tutor ────────────────
const hitungGaji = async (idTutor, targetMonth, targetYear, useSavedIfExists = false) => {
  // 1. Cari kelas & siswa
  const kelasList = await query(
    `SELECT id_kelas, nama_kelas FROM kelas WHERE id_tutor = ?`,
    [idTutor]
  );
  const kelasIds = kelasList.map((k) => k.id_kelas);

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

  // 2. Dapatkan persentase dari settings
  const persenStr = await getSetting('persentase_gaji_tutor', '40');
  const persentase = parseInt(persenStr, 10) || 40;
  const komisiDasar = Math.round(totalSPP * (persentase / 100));

  // 3. Dapatkan hari kerja per bulan dari settings
  const hkStr = await getSetting('hari_kerja_per_bulan', '20');
  const hariKerjaStandar = parseInt(hkStr, 10) || 20;

  // 4. Hitung hari kerja aktual (Senin-Jumat) dalam bulan ini
  const hariKerjaAktual = countWorkingDays(targetYear, targetMonth);

  // 5. Ambil libur dates
  const liburRecords = await liburRepository.findByMonth(targetYear, targetMonth);
  const liburDates = new Set(liburRecords.map(libur => new Date(libur.tanggal).toDateString()));

  // 6. Ambil absensi tutor — hanya hari kerja (Senin-Jumat) yang diperhitungkan
  const attendanceRecords = await query(
    `SELECT tanggal, status
     FROM absensi_tutor
     WHERE id_tutor = ?
       AND MONTH(tanggal) = ? AND YEAR(tanggal) = ?
     ORDER BY tanggal ASC`,
    [idTutor, targetMonth, targetYear]
  );

  let hadirCount = 0;
  let tidakMasukCount = 0; // Semua status selain 'Hadir' di hari kerja
  let absenHariKerja = [];

  // Buat map attendance untuk mudah diakses
  const attendanceMap = new Map();
  attendanceRecords.forEach((rec) => {
    const dateStr = new Date(rec.tanggal).toDateString();
    attendanceMap.set(dateStr, rec.status);
  });

  // Iterasi semua hari kerja di bulan ini
  const numDays = new Date(targetYear, targetMonth, 0).getDate();
  for (let d = 1; d <= numDays; d++) {
    const dateObj = new Date(targetYear, targetMonth - 1, d);
    const dow = dateObj.getDay(); // 0=Minggu, 6=Sabtu
    const isWeekend = dow === 0 || dow === 6;
    if (isWeekend) continue;

    const dateStr = dateObj.toDateString();
    const isLibur = liburDates.has(dateStr);
    const status = attendanceMap.get(dateStr);

    absenHariKerja.push({
      tanggal: dateObj,
      status: status || (isLibur ? 'Libur' : null),
      hari: dow,
    });

    if (status === 'Hadir' || isLibur) {
      hadirCount++;
    } else if (status === 'Sakit' || status === 'Izin' || status === 'Absen') {
      tidakMasukCount++;
    } else {
      // Tidak ada data absensi dan bukan libur = tidak masuk
      tidakMasukCount++;
    }
  }

  // 6. Cek apakah sudah ada record gaji tersimpan
  const periodeStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01 00:00:00`;
  const gajiRecord = await queryOne(
    `SELECT * FROM gaji_tutor WHERE id_tutor = ? AND periode = ? LIMIT 1`,
    [idTutor, periodeStart]
  );

  // 7. Hitung potongan — (komisiDasar ÷ 20) × jumlah hari tidak masuk
  let potongan = 0;
  if (tidakMasukCount > 0) {
    potongan = Math.round((komisiDasar / hariKerjaStandar) * tidakMasukCount);
  }

  // 8. Bonus dibaca dari bonus_tutor (manual assignment oleh owner)
  let bonus = 0;
  const bonusRow = await queryOne(
    `SELECT nominal FROM bonus_tutor WHERE id_tutor = ? AND bulan = ? AND tahun = ?`,
    [idTutor, targetMonth, targetYear]
  );
  if (bonusRow) {
    bonus = Number(bonusRow.nominal) || 0;
  }

  // 9. Hitung infal
  const infal = await getTotalInfal(idTutor, targetMonth, targetYear);

  // 10. Jika ada record tersimpan dan useSavedIfExists=true, pakai nilai tersimpan
  if (useSavedIfExists && gajiRecord) {
    bonus = Number(gajiRecord.bonus);
    potongan = Number(gajiRecord.potongan);
  }

  // 11. Gaji akhir
  const totalInfal = infal.total;
  const penyesuaian = bonus - potongan + totalInfal;
  const grandTotal = komisiDasar + penyesuaian;

  return {
    siswaList,
    totalSPP,
    komisiDasar,
    hadirCount,
    tidakMasukCount,
    hariKerjaAktual,
    hariKerjaStandar,
    bonus,
    potongan,
    infal,
    totalInfal,
    penyesuaian,
    grandTotal,
    is_confirmed: !!gajiRecord,
    status_gaji: gajiRecord ? gajiRecord.status_gaji : null,
    gajiRecordId: gajiRecord ? gajiRecord.id_gaji : null,
  };
};

// ─── GET /api/gaji/perhitungan — untuk tutor sendiri ───────
export const getPerhitunganGaji = async (req, res) => {
  try {
    const userId = req.userId;
    const { bulan, tahun } = req.query;

    const targetMonth = bulan ? parseInt(bulan, 10) : new Date().getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun, 10) : new Date().getFullYear();

    const tutor = await queryOne(
      `SELECT id_tutor, nama_tutor FROM tutor WHERE id_user = ? LIMIT 1`,
      [userId]
    );

    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Data tutor tidak ditemukan' });
    }

    const result = await hitungGaji(tutor.id_tutor, targetMonth, targetYear, true);

    res.json({
      success: true,
      data: {
        tutor: {
          id_tutor: tutor.id_tutor,
          nama_tutor: tutor.nama_tutor,
        },
        periode: {
          bulan: targetMonth,
          tahun: targetYear,
          hari_kerja_aktual: result.hariKerjaAktual,
          hari_kerja_standar: result.hariKerjaStandar,
        },
        siswa: result.siswaList.map((s) => ({
          id_siswa: s.id_siswa,
          nama: s.nama,
          tanggal_masuk: s.tanggal_masuk,
          spp: Number(s.spp || 0),
        })),
        total_spp: result.totalSPP,
        komisi_dasar: result.komisiDasar,
        absensi: {
          hadir: result.hadirCount,
          tidak_masuk: result.tidakMasukCount,
        },
        bonus: result.bonus,
        potongan: result.potongan,
        infal: {
          jumlah: result.infal.jumlah,
          total: result.totalInfal,
        },
        penyesuaian: result.penyesuaian,
        grand_total: result.grandTotal,
        status_gaji: result.status_gaji,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// ─── GET /api/gaji/perhitungan/:id_tutor — untuk owner ─────
export const getPerhitunganGajiByIdTutor = async (req, res) => {
  try {
    const { id_tutor } = req.params;
    const { bulan, tahun } = req.query;

    const targetMonth = bulan ? parseInt(bulan, 10) : new Date().getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun, 10) : new Date().getFullYear();

    const tutor = await queryOne(
      `SELECT id_tutor, nama_tutor FROM tutor WHERE id_tutor = ? LIMIT 1`,
      [id_tutor]
    );

    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Data tutor tidak ditemukan' });
    }

    const result = await hitungGaji(id_tutor, targetMonth, targetYear, true);

    res.json({
      success: true,
      data: {
        tutor: { id_tutor, nama_tutor: tutor.nama_tutor },
        periode: {
          bulan: targetMonth,
          tahun: targetYear,
          hari_kerja_aktual: result.hariKerjaAktual,
          hari_kerja_standar: result.hariKerjaStandar,
        },
        siswa: result.siswaList.map((s) => ({
          id_siswa: s.id_siswa,
          nama: s.nama,
          tanggal_masuk: s.tanggal_masuk,
          spp: Number(s.spp || 0),
        })),
        total_spp: result.totalSPP,
        komisi_dasar: result.komisiDasar,
        absensi: {
          hadir: result.hadirCount,
          tidak_masuk: result.tidakMasukCount,
        },
        bonus: result.bonus,
        potongan: result.potongan,
        infal: {
          jumlah: result.infal.jumlah,
          total: result.totalInfal,
        },
        penyesuaian: result.penyesuaian,
        grand_total: result.grandTotal,
        is_confirmed: result.is_confirmed,
        status_gaji: result.status_gaji,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// ─── GET /api/gaji/all — daftar semua tutor untuk owner ────
export const getAllGaji = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    const targetMonth = bulan ? parseInt(bulan, 10) : new Date().getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun, 10) : new Date().getFullYear();

    const tutors = await query(
      `SELECT id_tutor, nama_tutor FROM tutor WHERE status = 'Aktif' ORDER BY nama_tutor ASC`
    );

    const periodeStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01 00:00:00`;
    const gajiRecords = await query(
      `SELECT * FROM gaji_tutor WHERE periode = ?`,
      [periodeStart]
    );
    const gajiMap = new Map();
    gajiRecords.forEach((g) => gajiMap.set(g.id_tutor, g));

    const result = await Promise.all(
      tutors.map(async (tutor) => {
        const data = await hitungGaji(tutor.id_tutor, targetMonth, targetYear, true);
        const existing = gajiMap.get(tutor.id_tutor);

        return {
          id_tutor: tutor.id_tutor,
          nama_tutor: tutor.nama_tutor,
          hadir: data.hadirCount,
          tidak_masuk: data.tidakMasukCount,
          total_spp: data.totalSPP,
          honor: data.komisiDasar,
          bonus: existing ? Number(existing.bonus) : data.bonus,
          potongan: existing ? Number(existing.potongan) : data.potongan,
          total_infal: data.totalInfal,   // selalu fresh dari tabel infal_tutor
          total_gaji: data.grandTotal,     // selalu fresh (bonus/potongan dari saved + infal terbaru)
          is_confirmed: !!existing,
          status_gaji: existing ? existing.status_gaji : null,
        };
      })
    );

    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
};

// ─── POST /api/gaji/send — simpan/konfirmasi gaji ─────────
export const sendGaji = async (req, res) => {
  try {
    const {
      id_tutor,
      bulan,
      tahun,
      bonus,
      potongan,
      total_infal,
      total_pemasukan,
      total_gaji,
    } = req.body;

    if (!id_tutor || !bulan || !tahun) {
      return res.status(400).json({
        success: false,
        message: 'id_tutor, bulan, tahun wajib diisi',
      });
    }

    const targetMonth = parseInt(bulan, 10);
    const targetYear = parseInt(tahun, 10);
    const periodeStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01 00:00:00`;

    const bonusVal = Math.round(Number(bonus || 0));
    const potonganVal = Math.round(Number(potongan || 0));
    const infalVal = Math.round(Number(total_infal || 0));
    const pemasukanVal = Math.round(Number(total_pemasukan || 0));
    const gajiVal = Math.round(Number(total_gaji || 0));

    const existing = await queryOne(
      `SELECT id_gaji FROM gaji_tutor WHERE id_tutor = ? AND periode = ? LIMIT 1`,
      [id_tutor, periodeStr]
    );

    if (existing) {
      await query(
        `UPDATE gaji_tutor
         SET total_pemasukan = ?, potongan = ?, bonus = ?, total_infal = ?,
             total_gaji = ?, status_gaji = 'Dikonfirmasi'
         WHERE id_gaji = ?`,
        [pemasukanVal, potonganVal, bonusVal, infalVal, gajiVal, existing.id_gaji]
      );
    } else {
      await query(
        `INSERT INTO gaji_tutor (id_tutor, periode, total_pemasukan, potongan, bonus, total_infal, total_gaji, status_gaji)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Dikonfirmasi')`,
        [id_tutor, periodeStr, pemasukanVal, potonganVal, bonusVal, infalVal, gajiVal]
      );
    }

    res.json({ success: true, message: 'Data gaji berhasil dikonfirmasi' });
  } catch (error) {
    handleError(res, error);
  }
};

// ─── POST /api/gaji/bonus — simpan bonus assignment (owner) ───
export const saveBonusAssignment = async (req, res) => {
  try {
    const { assignments, bulan, tahun } = req.body;

    if (!bulan || !tahun || !Array.isArray(assignments)) {
      return res.status(400).json({
        success: false,
        message: 'assignments (array), bulan, dan tahun wajib diisi',
      });
    }

    // Upsert per tutor — tidak hapus semua data
    for (const a of assignments) {
      if (!a.id_tutor) continue;
      const nominal = Math.max(0, Number(a.nominal) || 0);

      if (nominal > 0) {
        // Insert atau update jika sudah ada
        await query(
          `INSERT INTO bonus_tutor (id_tutor, bulan, tahun, nominal) VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE nominal = VALUES(nominal)`,
          [a.id_tutor, bulan, tahun, nominal]
        );
      } else {
        // nominal 0 = hapus bonus tutor ini
        await query(
          `DELETE FROM bonus_tutor WHERE id_tutor = ? AND bulan = ? AND tahun = ?`,
          [a.id_tutor, bulan, tahun]
        );
      }
    }

    res.json({ success: true, message: 'Bonus berhasil disimpan' });
  } catch (error) {
    handleError(res, error);
  }
};

// ─── GET /api/gaji/bonus — ambil bonus assignments per periode ───
export const getBonusAssignments = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    const today = new Date();
    const targetMonth = bulan ? parseInt(bulan, 10) : today.getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun, 10) : today.getFullYear();

    const rows = await query(
      `SELECT b.id_bonus, b.id_tutor, b.nominal, t.nama_tutor
       FROM bonus_tutor b
       LEFT JOIN tutor t ON t.id_tutor = b.id_tutor
       WHERE b.bulan = ? AND b.tahun = ?`,
      [targetMonth, targetYear]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    handleError(res, error);
  }
};
