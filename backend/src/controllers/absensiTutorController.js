import { query, queryOne } from '../config/query.js';
import { LiburRepository } from '../repository/libur/liburRepository.js';

const liburRepository = new LiburRepository();
const HARI_MAP_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const VALID_STATUS = ['Hadir', 'Absen', 'Sakit', 'Izin'];

const pad = (value) => String(value).padStart(2, '0');

const formatDateOnly = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatJam = (value) => String(value || '').slice(0, 5) || '-';

const formatPenempatanLabel = (namaKelas, namaMapel) => {
  if (namaMapel && namaKelas && namaMapel !== namaKelas) {
    return `${namaMapel} - ${namaKelas}`;
  }
  return namaKelas || namaMapel || '-';
};

const handleError = (res, error) => {
  console.error('AbsensiTutorController error:', error);
  res.status(500).json({ success: false, message: error.message });
};

export const getTutorAttendanceToday = async (req, res) => {
  try {
    const tanggalParam = req.query.tanggal;
    const tanggalDate = tanggalParam ? new Date(tanggalParam + 'T00:00:00') : new Date();
    const todayName = HARI_MAP_ID[tanggalDate.getDay()];
    const todayDate = formatDateOnly(tanggalDate);

    const rows = await query(
      `SELECT DISTINCT
         t.id_tutor,
         t.nama_tutor,
         t.mapel,
         att.status AS status_kehadiran
       FROM tutor t
       INNER JOIN jadwal j
         ON j.id_tutor = t.id_tutor
        AND JSON_CONTAINS(j.hari, ?)
       LEFT JOIN absensi_tutor att
         ON att.id_tutor = t.id_tutor
        AND att.tanggal = ?
       WHERE t.status = 'Aktif'
       ORDER BY t.nama_tutor ASC`,
      [JSON.stringify(todayName), todayDate]
    );

    const data = rows.map((row) => ({
      id_tutor: row.id_tutor,
      nama_tutor: row.nama_tutor,
      mapel: row.mapel || '-',
      status: row.status_kehadiran || null,
    }));

    res.json({
      success: true,
      data,
      meta: {
        hari: todayName,
        tanggal: todayDate,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const saveTutorAttendanceBulk = async (req, res) => {
  try {
    const targetDate = req.body?.tanggal ? formatDateOnly(req.body.tanggal) : formatDateOnly(new Date());
    const absensi = Array.isArray(req.body?.absensi) ? req.body.absensi : [];

    if (absensi.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Data absensi tutor wajib diisi.',
      });
    }

    for (const item of absensi) {
      const idTutor = Number(item?.id_tutor);
      const status = String(item?.status || '').trim();

      if (!idTutor || !VALID_STATUS.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Setiap data absensi harus memiliki id_tutor dan status yang valid.',
        });
      }

      const existing = await queryOne(
        `SELECT id_absensi_tutor
         FROM absensi_tutor
         WHERE id_tutor = ?
           AND tanggal = ?
         LIMIT 1`,
        [idTutor, targetDate]
      );

      if (existing) {
        await query(
          `UPDATE absensi_tutor
           SET status = ?
           WHERE id_absensi_tutor = ?`,
          [status, existing.id_absensi_tutor]
        );
      } else {
        await query(
          `INSERT INTO absensi_tutor (id_tutor, tanggal, status)
           VALUES (?, ?, ?)`,
          [idTutor, targetDate, status]
        );
      }
    }

    res.json({
      success: true,
      message: `Presensi tutor tanggal ${targetDate} berhasil disimpan.`,
      data: {
        saved: absensi.length,
        tanggal: targetDate,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getTutorAttendanceRecap = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    const today = new Date();
    const targetMonth = bulan ? parseInt(bulan, 10) : today.getMonth() + 1; // 1-12
    const targetYear = tahun ? parseInt(tahun, 10) : today.getFullYear();

    const tutors = await query(
      `SELECT
         t.id_tutor,
         t.nama_tutor,
         t.mapel,
         GROUP_CONCAT(DISTINCT k.nama_kelas ORDER BY k.nama_kelas SEPARATOR ', ') AS kelas_list
       FROM tutor t
       LEFT JOIN kelas k ON k.id_tutor = t.id_tutor
       WHERE t.status = 'Aktif'
       GROUP BY t.id_tutor, t.nama_tutor, t.mapel
       ORDER BY t.nama_tutor ASC`
    );

    const attendanceRecords = await query(
      `SELECT id_tutor, DAY(tanggal) AS hari, status
       FROM absensi_tutor
       WHERE MONTH(tanggal) = ? AND YEAR(tanggal) = ?`,
      [targetMonth, targetYear]
    );

    const liburRecords = await liburRepository.findByMonth(targetYear, targetMonth);
    const liburDays = new Set(liburRecords.map(libur => new Date(libur.tanggal).getDate()));

    const attendanceMap = {};
    attendanceRecords.forEach((rec) => {
      if (!attendanceMap[rec.id_tutor]) {
        attendanceMap[rec.id_tutor] = {};
      }
      attendanceMap[rec.id_tutor][rec.hari] = rec.status;
    });

    const numDays = new Date(targetYear, targetMonth, 0).getDate();

    const data = tutors.map((tutor) => {
      const tutorAttendance = attendanceMap[tutor.id_tutor] || {};
      const days = [];
      let hadirCount = 0;
      let alphaCount = 0;

      for (let d = 1; d <= numDays; d++) {
        const dateObj = new Date(targetYear, targetMonth - 1, d);
        const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isLibur = liburDays.has(d) && !isWeekend;

        const status = tutorAttendance[d] || null;

        let displayStatus = 'alpha'; // default for weekdays with no data
        if (status === 'Hadir') {
          displayStatus = 'hadir';
          hadirCount++;
        } else if (status === 'Absen') {
          displayStatus = 'alpha';
          alphaCount++;
        } else if (isWeekend) {
          displayStatus = 'weekend';
        } else {
          displayStatus = 'alpha';
          alphaCount++;
        }
        
        // Hitung libur sebagai hadir, tapi jangan ubah displayStatus
        if (isLibur) {
          hadirCount++;
          alphaCount--; // Kurangi alpha karena libur tidak dianggap alpha
        }

        days.push({
          day: d,
          status: displayStatus,
        });
      }

      return {
        id_tutor: tutor.id_tutor,
        nama_tutor: tutor.nama_tutor,
        kelas_list: tutor.kelas_list || tutor.mapel || '-',
        hadir: hadirCount,
        alpha: alphaCount,
        days,
      };
    });

    res.json({
      success: true,
      data,
      meta: {
        bulan: targetMonth,
        tahun: targetYear,
        jumlah_hari: numDays,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getMyAttendanceRecap = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    const today = new Date();
    const targetMonth = bulan ? parseInt(bulan, 10) : today.getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun, 10) : today.getFullYear();

    const tutorRow = await queryOne(
      `SELECT id_tutor, nama_tutor FROM tutor WHERE id_user = ? LIMIT 1`,
      [req.userId]
    );

    if (!tutorRow) {
      return res.status(404).json({ success: false, message: 'Data tutor tidak ditemukan.' });
    }

    const idTutor = tutorRow.id_tutor;
    const namaTutor = tutorRow.nama_tutor;

    const attendanceRecords = await query(
      `SELECT DAY(tanggal) AS hari, status
       FROM absensi_tutor
       WHERE id_tutor = ? AND MONTH(tanggal) = ? AND YEAR(tanggal) = ?`,
      [idTutor, targetMonth, targetYear]
    );

    const liburRecords = await liburRepository.findByMonth(targetYear, targetMonth);
    const liburDays = new Set(liburRecords.map(libur => new Date(libur.tanggal).getDate()));

    const attendanceMap = {};
    attendanceRecords.forEach((rec) => {
      attendanceMap[rec.hari] = rec.status;
    });

    const numDays = new Date(targetYear, targetMonth, 0).getDate();

    const days = [];
    let hadirCount = 0;
    let sakitCount = 0;
    let izinCount = 0;
    let absenCount = 0;
    const hadirDates = [];
    const sakitDates = [];
    const izinDates = [];
    const absenDates = [];

    for (let d = 1; d <= numDays; d++) {
      const dateObj = new Date(targetYear, targetMonth - 1, d);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isLibur = liburDays.has(d) && !isWeekend;
      const status = attendanceMap[d] || null;

      let displayStatus = 'no-data';
      if (status === 'Hadir') {
        displayStatus = 'hadir';
        hadirCount++;
        hadirDates.push(d);
      } else if (status === 'Sakit') {
        displayStatus = 'sakit';
        sakitCount++;
        sakitDates.push(d);
      } else if (status === 'Izin') {
        displayStatus = 'izin';
        izinCount++;
        izinDates.push(d);
      } else if (status === 'Absen') {
        displayStatus = 'absen';
        absenCount++;
        absenDates.push(d);
      } else if (isWeekend) {
        displayStatus = 'weekend';
      }
      
      // Hitung libur sebagai hadir, tapi jangan ubah displayStatus
      if (isLibur) {
        hadirCount++;
        hadirDates.push(d);
      }

      days.push({ day: d, status: displayStatus });
    }

    const totalEffectiveDays = days.filter((d) => d.status !== 'weekend').length;
    const totalTidakHadir = sakitCount + izinCount + absenCount;
    const persentase = totalEffectiveDays > 0
      ? Math.round((hadirCount / totalEffectiveDays) * 100)
      : 0;

    const categories = [];
    if (hadirCount > 0) {
      categories.push({
        kategori: 'Hadir',
        jumlah: hadirCount,
        warna: 'hijau',
        keterangan: 'Sesuai jadwal',
      });
    }
    if (sakitCount > 0) {
      categories.push({
        kategori: 'Sakit',
        jumlah: sakitCount,
        warna: 'merah',
        keterangan: `Tgl ${sakitDates.join(', ')}`,
      });
    }
    if (izinCount > 0) {
      categories.push({
        kategori: 'Izin',
        jumlah: izinCount,
        warna: 'merah',
        keterangan: `Tgl ${izinDates.join(', ')}`,
      });
    }
    if (absenCount > 0) {
      categories.push({
        kategori: 'Absen',
        jumlah: absenCount,
        warna: 'merah',
        keterangan: `Tgl ${absenDates.join(', ')}`,
      });
    }

    res.json({
      success: true,
      data: {
        id_tutor: idTutor,
        nama_tutor: namaTutor,
        hadir: hadirCount,
        sakit: sakitCount,
        izin: izinCount,
        absen: absenCount,
        total_tidak_hadir: totalTidakHadir,
        persentase,
        days,
        categories,
      },
      meta: {
        bulan: targetMonth,
        tahun: targetYear,
        jumlah_hari: numDays,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};
