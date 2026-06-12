import { AbsensiSiswaRepository } from '../repository/absensiSiswa/absensiSiswaRepository.js';
import { query } from '../config/query.js';

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

// GET /api/absensi-siswa
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

// GET /api/absensi-siswa/:id
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

// POST /api/absensi-siswa
export const createAbsensiSiswa = async (req, res) => {
  try {
    const { id_siswa, id_jadwal, tanggal, status } = req.body;
    if (!id_siswa || !id_jadwal || !tanggal || !status) {
      return res.status(400).json({ success: false, message: 'id_siswa, id_jadwal, tanggal, status wajib diisi' });
    }
    const data = await absensiSiswaRepository.create({
      ...req.body,
      tanggal: new Date(tanggal),
    });
    res.status(201).json({ success: true, message: 'Absensi siswa berhasil ditambahkan', data });
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /api/absensi-siswa/:id
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

// PATCH /api/absensi-siswa/:id/confirm
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

// PATCH /api/absensi-siswa/confirm-class/:id_kelas
// Konfirmasi semua absensi yang BELUM dikonfirmasi untuk satu kelas pada hari ini
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

// PATCH /api/absensi-siswa/confirm-all-today
// Konfirmasi semua absensi yang BELUM dikonfirmasi hari ini
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

// DELETE /api/absensi-siswa/:id
export const deleteAbsensiSiswa = async (req, res) => {
  try {
    await absensiSiswaRepository.delete(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Absensi siswa berhasil dihapus' });
  } catch (error) {
    handleError(res, error);
  }
};
