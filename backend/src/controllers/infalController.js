import { query, queryOne } from '../config/query.js';

const handleError = (res, error) => {
  console.error('❌ InfalController error:', error);
  res.status(500).json({ success: false, message: error.message });
};

// GET /api/infal?bulan=&tahun=
export const getAllInfal = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    const targetMonth = bulan ? parseInt(bulan, 10) : new Date().getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun, 10) : new Date().getFullYear();

    const rows = await query(
      `SELECT 
         i.id_infal,
         i.id_tutor_pengganti,
         tp.nama_tutor AS nama_tutor_pengganti,
         i.id_tutor_absen,
         ta.nama_tutor AS nama_tutor_absen,
         i.id_kelas,
         k.nama_kelas,
         i.id_jadwal,
         i.tanggal,
         i.nominal,
         i.keterangan
       FROM infal_tutor i
       INNER JOIN tutor tp ON tp.id_tutor = i.id_tutor_pengganti
       INNER JOIN tutor ta ON ta.id_tutor = i.id_tutor_absen
       INNER JOIN kelas k ON k.id_kelas = i.id_kelas
       WHERE MONTH(i.tanggal) = ? AND YEAR(i.tanggal) = ?
       ORDER BY i.tanggal DESC, i.id_infal DESC`,
      [targetMonth, targetYear]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/infal/tutor/:id_tutor?bulan=&tahun=
export const getInfalByTutor = async (req, res) => {
  try {
    const { id_tutor } = req.params;
    const { bulan, tahun } = req.query;
    const targetMonth = bulan ? parseInt(bulan, 10) : new Date().getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun, 10) : new Date().getFullYear();

    const rows = await query(
      `SELECT 
         i.id_infal,
         i.id_tutor_pengganti,
         tp.nama_tutor AS nama_tutor_pengganti,
         i.id_tutor_absen,
         ta.nama_tutor AS nama_tutor_absen,
         i.id_kelas,
         k.nama_kelas,
         i.tanggal,
         i.nominal,
         i.keterangan
       FROM infal_tutor i
       INNER JOIN tutor tp ON tp.id_tutor = i.id_tutor_pengganti
       INNER JOIN tutor ta ON ta.id_tutor = i.id_tutor_absen
       INNER JOIN kelas k ON k.id_kelas = i.id_kelas
       WHERE i.id_tutor_pengganti = ?
         AND MONTH(i.tanggal) = ? AND YEAR(i.tanggal) = ?
       ORDER BY i.tanggal DESC`,
      [id_tutor, targetMonth, targetYear]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/infal/total/:id_tutor?bulan=&tahun=
export const getTotalInfalByTutor = async (req, res) => {
  try {
    const { id_tutor } = req.params;
    const { bulan, tahun } = req.query;
    const targetMonth = bulan ? parseInt(bulan, 10) : new Date().getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun, 10) : new Date().getFullYear();

    const result = await queryOne(
      `SELECT COUNT(*) AS jumlah_infal, COALESCE(SUM(nominal), 0) AS total_nominal
       FROM infal_tutor
       WHERE id_tutor_pengganti = ?
         AND MONTH(tanggal) = ? AND YEAR(tanggal) = ?`,
      [id_tutor, targetMonth, targetYear]
    );

    res.json({
      success: true,
      data: {
        jumlah_infal: Number(result?.jumlah_infal || 0),
        total_nominal: Number(result?.total_nominal || 0),
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/infal/available-tutors?tanggal=&id_kelas=
export const getAvailableTutors = async (req, res) => {
  try {
    const { tanggal, id_kelas } = req.query;

    if (!tanggal || !id_kelas) {
      return res.status(400).json({
        success: false,
        message: 'Parameter tanggal dan id_kelas wajib diisi',
      });
    }

    // Cari tutor yang memiliki kelas yang sama (mapel sama) dan aktif
    // Serta tidak sedang absen di tanggal tersebut
    const rows = await query(
      `SELECT DISTINCT t.id_tutor, t.nama_tutor
       FROM tutor t
       WHERE t.status = 'Aktif'
         AND t.id_tutor NOT IN (
           SELECT at.id_tutor FROM absensi_tutor at
           WHERE at.tanggal = ? AND at.status = 'Absen'
         )
       ORDER BY t.nama_tutor ASC`,
      [tanggal]
    );

    // filter out jadwal kelas yang sama (cek apakah tutor ini punya jadwal di jam yang sama)
    // tapi untuk kesederhanaan, kembalikan semua tutor aktif yang hadir

    res.json({ success: true, data: rows });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /api/infal
export const createInfal = async (req, res) => {
  try {
    const { id_tutor_pengganti, id_tutor_absen, id_kelas, id_jadwal, tanggal, nominal, keterangan } = req.body;

    if (!id_tutor_pengganti || !id_tutor_absen || !id_kelas || !tanggal) {
      return res.status(400).json({
        success: false,
        message: 'id_tutor_pengganti, id_tutor_absen, id_kelas, dan tanggal wajib diisi',
      });
    }

    // Dapatkan nominal dari app_settings jika tidak disediakan
    let nominalFinal = nominal ? parseInt(nominal, 10) : null;
    if (!nominalFinal) {
      const setting = await queryOne(
        `SELECT setting_value FROM app_settings WHERE setting_key = 'infal_nominal'`
      );
      nominalFinal = setting ? parseInt(setting.setting_value, 10) : 15000;
    }

    const result = await query(
      `INSERT INTO infal_tutor (id_tutor_pengganti, id_tutor_absen, id_kelas, id_jadwal, tanggal, nominal, keterangan)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_tutor_pengganti,
        id_tutor_absen,
        id_kelas,
        id_jadwal || null,
        tanggal,
        nominalFinal,
        keterangan || null,
      ]
    );

    const newId = result.insertId;

    const saved = await queryOne(
      `SELECT 
         i.id_infal,
         i.id_tutor_pengganti,
         tp.nama_tutor AS nama_tutor_pengganti,
         i.id_tutor_absen,
         ta.nama_tutor AS nama_tutor_absen,
         i.id_kelas,
         k.nama_kelas,
         i.tanggal,
         i.nominal,
         i.keterangan
       FROM infal_tutor i
       INNER JOIN tutor tp ON tp.id_tutor = i.id_tutor_pengganti
       INNER JOIN tutor ta ON ta.id_tutor = i.id_tutor_absen
       INNER JOIN kelas k ON k.id_kelas = i.id_kelas
       WHERE i.id_infal = ?`,
      [newId]
    );

    res.status(201).json({ success: true, message: 'Data infal berhasil disimpan', data: saved });
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /api/infal/:id
export const updateInfal = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_tutor_pengganti, id_tutor_absen, id_kelas, id_jadwal, tanggal, nominal, keterangan } = req.body;

    const existing = await queryOne(`SELECT id_infal FROM infal_tutor WHERE id_infal = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data infal tidak ditemukan' });
    }

    const updates = {};
    if (id_tutor_pengganti) updates.id_tutor_pengganti = id_tutor_pengganti;
    if (id_tutor_absen) updates.id_tutor_absen = id_tutor_absen;
    if (id_kelas) updates.id_kelas = id_kelas;
    if (id_jadwal !== undefined) updates.id_jadwal = id_jadwal || null;
    if (tanggal) updates.tanggal = tanggal;
    if (nominal !== undefined) updates.nominal = nominal;
    if (keterangan !== undefined) updates.keterangan = keterangan || null;

    if (Object.keys(updates).length > 0) {
      const setSql = Object.keys(updates).map((k) => `\`${k}\` = ?`).join(', ');
      const params = [...Object.values(updates), id];
      await query(`UPDATE infal_tutor SET ${setSql} WHERE id_infal = ?`, params);
    }

    const updated = await queryOne(
      `SELECT 
         i.id_infal,
         i.id_tutor_pengganti,
         tp.nama_tutor AS nama_tutor_pengganti,
         i.id_tutor_absen,
         ta.nama_tutor AS nama_tutor_absen,
         i.id_kelas,
         k.nama_kelas,
         i.tanggal,
         i.nominal,
         i.keterangan
       FROM infal_tutor i
       INNER JOIN tutor tp ON tp.id_tutor = i.id_tutor_pengganti
       INNER JOIN tutor ta ON ta.id_tutor = i.id_tutor_absen
       INNER JOIN kelas k ON k.id_kelas = i.id_kelas
       WHERE i.id_infal = ?`,
      [id]
    );

    res.json({ success: true, message: 'Data infal berhasil diperbarui', data: updated });
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /api/infal/:id
export const deleteInfal = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await queryOne(`SELECT id_infal FROM infal_tutor WHERE id_infal = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data infal tidak ditemukan' });
    }

    await query(`DELETE FROM infal_tutor WHERE id_infal = ?`, [id]);

    res.json({ success: true, message: 'Data infal berhasil dihapus' });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /api/infal/owner-bonus — simplified infal untuk owner
// Owner hanya perlu memasukkan id_tutor, nominal, tanggal (opsional)
export const createOwnerBonus = async (req, res) => {
  try {
    const { id_tutor, nominal, bulan, tahun, keterangan } = req.body;

    if (!id_tutor || !nominal || nominal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'id_tutor dan nominal wajib diisi dengan nilai yang valid',
      });
    }

    const targetMonth = bulan ? parseInt(bulan, 10) : new Date().getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun, 10) : new Date().getFullYear();
    // Set tanggal ke hari terakhir bulan tersebut
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const tanggal = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const nominalVal = Math.round(Number(nominal));

    // Simpan sebagai infal — id_tutor_absen diisi sama dengan pengganti (bonus murni)
    const result = await query(
      `INSERT INTO infal_tutor (id_tutor_pengganti, id_tutor_absen, id_kelas, tanggal, nominal, keterangan)
       VALUES (?, ?, (SELECT MIN(id_kelas) FROM kelas WHERE id_tutor = ?), ?, ?, ?)`,
      [id_tutor, id_tutor, id_tutor, tanggal, nominalVal, keterangan || `Bonus infal ${targetMonth}/${targetYear}`]
    );

    const newId = result.insertId;

    // Update tabel gaji_tutor untuk periode tersebut
    const periodeStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01 00:00:00`;
    const existingGaji = await queryOne(
      `SELECT id_gaji, total_infal, total_gaji, total_pemasukan, bonus, potongan FROM gaji_tutor WHERE id_tutor = ? AND periode = ?`,
      [id_tutor, periodeStr]
    );

    if (existingGaji) {
      const newTotalInfal = Number(existingGaji.total_infal || 0) + nominalVal;
      const newTotalGaji = Number(existingGaji.total_pemasukan || 0) + Number(existingGaji.bonus || 0) - Number(existingGaji.potongan || 0) + newTotalInfal;
      await query(
        `UPDATE gaji_tutor SET total_infal = ?, total_gaji = ? WHERE id_gaji = ?`,
        [newTotalInfal, newTotalGaji, existingGaji.id_gaji]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Bonus infal berhasil diberikan',
      data: { id_infal: newId, nominal: nominalVal },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// ─── GET /api/infal/me — tutor lihat data infal sendiri ───
export const getInfalMe = async (req, res) => {
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

    // Ambil data infal (jadwal di mana tutor ini menjadi pengganti)
    const rows = await query(
      `SELECT 
         i.id_infal,
         i.id_tutor_pengganti,
         tp.nama_tutor AS nama_tutor_pengganti,
         i.id_tutor_absen,
         ta.nama_tutor AS nama_tutor_absen,
         i.id_kelas,
         k.nama_kelas,
         i.tanggal,
         DATE_FORMAT(i.tanggal, '%d/%m/%Y') AS tanggal_formatted,
         i.nominal,
         i.keterangan
       FROM infal_tutor i
       INNER JOIN tutor tp ON tp.id_tutor = i.id_tutor_pengganti
       INNER JOIN tutor ta ON ta.id_tutor = i.id_tutor_absen
       INNER JOIN kelas k ON k.id_kelas = i.id_kelas
       WHERE i.id_tutor_pengganti = ?
         AND MONTH(i.tanggal) = ? AND YEAR(i.tanggal) = ?
       ORDER BY i.tanggal DESC, i.id_infal DESC`,
      [tutor.id_tutor, targetMonth, targetYear]
    );

    // Hitung total nominal
    const totalResult = await queryOne(
      `SELECT COUNT(*) AS jumlah_infal, COALESCE(SUM(nominal), 0) AS total_nominal
       FROM infal_tutor
       WHERE id_tutor_pengganti = ?
         AND MONTH(tanggal) = ? AND YEAR(tanggal) = ?`,
      [tutor.id_tutor, targetMonth, targetYear]
    );

    res.json({
      success: true,
      data: {
        list: rows,
        ringkasan: {
          jumlah_infal: Number(totalResult?.jumlah_infal || 0),
          total_nominal: Number(totalResult?.total_nominal || 0),
        },
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};
