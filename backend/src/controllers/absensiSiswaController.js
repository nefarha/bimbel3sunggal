import { AbsensiSiswaRepository } from '../repository/absensiSiswa/absensiSiswaRepository.js';
import { query, queryOne } from '../config/query.js';

const toMySQLDateTime = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const absensiSiswaRepository = new AbsensiSiswaRepository();

const handleError = (res, error) => {
  console.error('❌ AbsensiSiswaController error:', error);
  res.status(500).json({ success: false, message: error.message });
};

export const getAllAbsensiSiswa = async (req, res) => {
  try {
    const { tanggal, id_siswa, id_jadwal, is_confirmed, status } = req.query;
    const filters = {};
    if (tanggal) filters.tanggal = new Date(tanggal);
    if (id_siswa) filters.id_siswa = parseInt(id_siswa, 10);
    if (id_jadwal) filters.id_jadwal = parseInt(id_jadwal, 10);
    if (is_confirmed !== undefined) filters.is_confirmed = is_confirmed === 'true';
    if (status) filters.status = status;

    const data = await absensiSiswaRepository.findAll({ where: filters });
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
};

export const getAbsensiSiswaById = async (req, res) => {
  try {
    const data = await absensiSiswaRepository.findById(parseInt(req.params.id, 10));
    if (!data) {
      return res.status(404).json({ success: false, message: 'Absensi siswa tidak ditemukan' });
    }
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
};

export const createAbsensiSiswa = async (req, res) => {
  try {
    const { id_siswa, id_jadwal, tanggal, status, id_mapel } = req.body;
    if (!id_siswa || !id_jadwal || !tanggal || !status) {
      return res.status(400).json({ success: false, message: 'id_siswa, id_jadwal, tanggal, status wajib diisi' });
    }

    let finalMapelId = id_mapel ? parseInt(id_mapel, 10) : null;

    if (!finalMapelId) {
      const [jadwalRow] = await query(
        'SELECT id_mapel FROM jadwal WHERE id_jadwal = ? LIMIT 1',
        [parseInt(id_jadwal, 10)]
      );
      if (jadwalRow) {
        finalMapelId = jadwalRow.id_mapel;
      }
    }

    const data = await absensiSiswaRepository.create({
      ...req.body,
      id_mapel: finalMapelId,
      tanggal: new Date(tanggal),
    });
    res.status(201).json({ success: true, message: 'Absensi siswa berhasil ditambahkan', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateAbsensiSiswa = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.tanggal) data.tanggal = new Date(data.tanggal);
    if (data.confirmed_at) data.confirmed_at = new Date(data.confirmed_at);

    const updated = await absensiSiswaRepository.update(parseInt(req.params.id, 10), data);
    res.json({ success: true, message: 'Absensi siswa berhasil diperbarui', data: updated });
  } catch (error) {
    handleError(res, error);
  }
};

export const confirmAbsensiSiswa = async (req, res) => {
  try {
    const updated = await absensiSiswaRepository.update(parseInt(req.params.id, 10), {
      is_confirmed: true,
      confirmed_at: new Date(),
      confirmed_by: req.userId || null,
    });
    res.json({ success: true, message: 'Absensi berhasil dikonfirmasi', data: updated });
  } catch (error) {
    handleError(res, error);
  }
};


export const confirmByKelas = async (req, res) => {
  try {
    const idKelas = parseInt(req.params.id_kelas, 10);
    if (!idKelas) {
      return res.status(400).json({ success: false, message: 'id_kelas wajib diisi' });
    }
    const now = new Date();
    const dayStart = toMySQLDateTime(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
    const dayEnd = toMySQLDateTime(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59));

    const result = await query(
      `UPDATE absensi_siswa a
       INNER JOIN jadwal j ON j.id_jadwal = a.id_jadwal
       SET a.is_confirmed = 1,
           a.confirmed_at = ?,
           a.confirmed_by = ?
       WHERE j.id_kelas = ?
         AND a.tanggal BETWEEN ? AND ?
         AND a.is_confirmed = 0`,
      [new Date(), req.userId || null, idKelas, dayStart, dayEnd]
    );
    res.json({
      success: true,
      message: `Berhasil mengonfirmasi ${result.affectedRows || 0} absensi`,
      data: { affectedRows: result.affectedRows || 0 },
    });
  } catch (error) {
    handleError(res, error);
  }
};


export const confirmAllToday = async (req, res) => {
  try {
    const now = new Date();
    const dayStart = toMySQLDateTime(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
    const dayEnd = toMySQLDateTime(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59));

    const result = await query(
      `UPDATE absensi_siswa
       SET is_confirmed = 1,
           confirmed_at = ?,
           confirmed_by = ?
       WHERE tanggal BETWEEN ? AND ?
         AND is_confirmed = 0`,
      [new Date(), req.userId || null, dayStart, dayEnd]
    );
    res.json({
      success: true,
      message: `Berhasil mengonfirmasi ${result.affectedRows || 0} absensi`,
      data: { affectedRows: result.affectedRows || 0 },
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const bulkUpsertAbsensiSiswa = async (req, res) => {
  try {
    const { id_jadwal, tanggal, items } = req.body;
    if (!id_jadwal || !tanggal || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'id_jadwal, tanggal, dan items (array) wajib diisi' });
    }

    const jadwalRow = await queryOne('SELECT id_mapel FROM jadwal WHERE id_jadwal = ? LIMIT 1', [parseInt(id_jadwal, 10)]);
    const id_mapel = jadwalRow ? jadwalRow.id_mapel : null;

    const data = await absensiSiswaRepository.bulkUpsert(
      items.map((item) => ({
        id_siswa: parseInt(item.id_siswa, 10),
        id_jadwal: parseInt(id_jadwal, 10),
        tanggal: new Date(tanggal),
        status: item.status,
        id_mapel,
      }))
    );
    res.json({ success: true, message: 'Absensi berhasil disimpan', data });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteAbsensiSiswa = async (req, res) => {
  try {
    await absensiSiswaRepository.delete(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Absensi siswa berhasil dihapus' });
  } catch (error) {
    handleError(res, error);
  }
};

// ─── GET /absensi-siswa/recap/me — rekap absensi per jadwal untuk siswa login ───
export const getMyAbsensiRecap = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'User tidak terautentikasi' });
    }

    const { bulan, tahun } = req.query;
    const today = new Date();
    const targetMonth = bulan ? parseInt(bulan, 10) : today.getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun, 10) : today.getFullYear();

    // 1. Dapatkan data siswa dari user login
    const siswaRow = await queryOne(
      `SELECT id_siswa, nama FROM siswa WHERE id_user = ? LIMIT 1`,
      [req.userId]
    );

    if (!siswaRow) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
    }

    const idSiswa = siswaRow.id_siswa;

    // 2. Dapatkan jadwal siswa
    const jadwalList = await query(
      `SELECT DISTINCT j.id_jadwal, j.hari, j.jam, j.jam_selesai,
              k.nama_kelas, m.nama_mapel
       FROM jadwal j
       INNER JOIN kelas k ON k.id_kelas = j.id_kelas
       LEFT JOIN mapel m ON m.id_mapel = j.id_mapel
       INNER JOIN kelas_siswa ks ON ks.id_kelas = j.id_kelas
       WHERE ks.id_siswa = ?
       ORDER BY j.jam ASC`,
      [idSiswa]
    );

    // 3. Dapatkan semua absensi siswa di bulan ini
    const absensiList = await query(
      `SELECT a.id_jadwal, a.status, DAY(a.tanggal) AS hari
       FROM absensi_siswa a
       WHERE a.id_siswa = ?
         AND MONTH(a.tanggal) = ? AND YEAR(a.tanggal) = ?`,
      [idSiswa, targetMonth, targetYear]
    );

    // 4. Kelompokkan absensi per jadwal
    const absensiMap = {};
    absensiList.forEach((a) => {
      if (!absensiMap[a.id_jadwal]) {
        absensiMap[a.id_jadwal] = [];
      }
      absensiMap[a.id_jadwal].push(a);
    });

    // 5. Hitung jumlah hari dalam bulan
    const numDays = new Date(targetYear, targetMonth, 0).getDate();

    const data = jadwalList.map((jadwal) => {
      const absensiJadwal = absensiMap[jadwal.id_jadwal] || [];

      // Buat map hari -> status
      const dayMap = {};
      absensiJadwal.forEach((a) => {
        dayMap[a.hari] = a.status;
      });

      // Hitung per-jadwal
      let hadir = 0;
      let alpha = 0;
      let sakit = 0;
      let izin = 0;

      // Hari bisa berupa JSON array atau string tunggal
      let hariList = jadwal.hari;
      if (typeof hariList === 'string') {
        try { hariList = JSON.parse(hariList); } catch { hariList = [hariList]; }
      }
      if (!Array.isArray(hariList)) hariList = [hariList];

      const dayNameToDow = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5 };
      const dayIndices = hariList.map((h) => dayNameToDow[h]).filter((idx) => idx !== undefined);

      const days = [];
      for (let d = 1; d <= numDays; d++) {
        const dateObj = new Date(targetYear, targetMonth - 1, d);
        const dow = dateObj.getDay();

        // Hanya tampilkan hari yang sesuai dengan hari-hari jadwal
        if (!dayIndices.includes(dow)) continue;

        const status = dayMap[d] || null;

        let displayStatus = 'alpha';
        if (status === 'Hadir') {
          displayStatus = 'hadir';
          hadir++;
        } else if (status === 'Sakit') {
          displayStatus = 'sakit';
          sakit++;
        } else if (status === 'Izin') {
          displayStatus = 'izin';
          izin++;
        } else {
          displayStatus = 'alpha';
          alpha++;
        }

        days.push({ day: d, status: displayStatus });
      }

      const totalPertemuan = hadir + alpha + sakit + izin;
      const persentase = totalPertemuan > 0 ? Math.round((hadir / totalPertemuan) * 100) : 0;

      return {
        id_jadwal: jadwal.id_jadwal,
        hari: jadwal.hari,
        jam: jadwal.jam,
        jam_selesai: jadwal.jam_selesai,
        nama_kelas: jadwal.nama_kelas,
        nama_mapel: jadwal.nama_mapel,
        hadir,
        alpha,
        sakit,
        izin,
        total_pertemuan: totalPertemuan,
        persentase,
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
        nama_siswa: siswaRow.nama,
      },
    });
  } catch (error) {
    console.error('❌ getMyAbsensiRecap error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /absensi-siswa/recap — rekap absensi semua siswa (admin) ───
export const getSiswaRecap = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    const today = new Date();
    const targetMonth = bulan ? parseInt(bulan, 10) : today.getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun, 10) : today.getFullYear();

    // Ambil semua siswa aktif
    const siswa = await query(
      `SELECT
         s.id_siswa,
         s.nama AS nama_siswa,
         GROUP_CONCAT(DISTINCT k.nama_kelas ORDER BY k.nama_kelas SEPARATOR ', ') AS kelas_list
       FROM siswa s
       LEFT JOIN kelas_siswa ks ON ks.id_siswa = s.id_siswa
       LEFT JOIN kelas k ON k.id_kelas = ks.id_kelas
       WHERE s.status = 'Aktif'
       GROUP BY s.id_siswa, s.nama
       ORDER BY s.nama ASC`
    );

    // Ambil semua absensi siswa di bulan tersebut
    const attendanceRecords = await query(
      `SELECT id_siswa, DAY(tanggal) AS hari, status
       FROM absensi_siswa
       WHERE MONTH(tanggal) = ? AND YEAR(tanggal) = ?`,
      [targetMonth, targetYear]
    );

    // Kelompokkan per siswa per hari
    const attendanceMap = {};
    attendanceRecords.forEach((rec) => {
      if (!attendanceMap[rec.id_siswa]) {
        attendanceMap[rec.id_siswa] = {};
      }
      // Jika sudah ada catatan 'Hadir', jangan ditimpa status lain
      if (!attendanceMap[rec.id_siswa][rec.hari] || attendanceMap[rec.id_siswa][rec.hari] === 'Tidak Hadir') {
        attendanceMap[rec.id_siswa][rec.hari] = rec.status;
      }
    });

    const numDays = new Date(targetYear, targetMonth, 0).getDate();

    const data = siswa.map((s) => {
      const siswaAttendance = attendanceMap[s.id_siswa] || {};
      const days = [];
      let hadirCount = 0;
      let alphaCount = 0;

      for (let d = 1; d <= numDays; d++) {
        const dateObj = new Date(targetYear, targetMonth - 1, d);
        const dayOfWeek = dateObj.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        const status = siswaAttendance[d] || null;

        let displayStatus = 'alpha';
        if (status === 'Hadir') {
          displayStatus = 'hadir';
          hadirCount++;
        } else if (status === 'Tidak Hadir' || status === 'Absen') {
          displayStatus = 'alpha';
          alphaCount++;
        } else if (status === 'Sakit' || status === 'Izin') {
          // Sakit/Izin ikut dihitung sebagai alpha untuk baris rekap
          displayStatus = 'alpha';
          alphaCount++;
        } else if (isWeekend) {
          displayStatus = 'weekend';
        } else {
          // Hari tanpa data dianggap alpha untuk weekday
          displayStatus = 'alpha';
          alphaCount++;
        }

        days.push({
          day: d,
          status: displayStatus,
        });
      }

      return {
        id_siswa: s.id_siswa,
        nama_siswa: s.nama_siswa,
        kelas_list: s.kelas_list || '-',
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
    console.error('❌ getSiswaRecap error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
