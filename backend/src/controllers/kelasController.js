import { KelasRepository } from '../repository/kelas/kelasRepository.js';
import { query } from '../config/query.js';

const kelasRepository = new KelasRepository();

const handleError = (res, error) => {
  console.error('❌ KelasController error:', error);
  res.status(500).json({ success: false, message: error.message });
};

export const getAllKelas = async (req, res) => {
  try {
    const { id_tutor } = req.query;
    const filters = {};
    if (id_tutor) filters.id_tutor = parseInt(id_tutor, 10);
    const kelas = await kelasRepository.findAll({ where: filters });
    res.json({ success: true, data: kelas });
  } catch (error) {
    handleError(res, error);
  }
};

export const getJenjangOptions = async (req, res) => {
  try {
    const rows = await query(
      `SELECT DISTINCT nama_kelas FROM kelas ORDER BY nama_kelas ASC`
    );
    res.json({ success: true, data: rows.map((r) => r.nama_kelas) });
  } catch (error) {
    handleError(res, error);
  }
};

export const getKelasById = async (req, res) => {
  try {
    const kelas = await kelasRepository.findById(parseInt(req.params.id, 10));
    if (!kelas) {
      return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });
    }
    res.json({ success: true, data: kelas });
  } catch (error) {
    handleError(res, error);
  }
};

export const createKelas = async (req, res) => {
  try {
    const { nama_kelas, id_mapel } = req.body;
    if (!nama_kelas) {
      return res.status(400).json({ success: false, message: 'nama_kelas wajib diisi' });
    }
    if (!id_mapel || Number.isNaN(Number(id_mapel))) {
      return res.status(400).json({ success: false, message: 'id_mapel wajib diisi' });
    }
    const payload = {
      ...req.body,
      id_mapel: Number(id_mapel),
      id_tutor: req.body.id_tutor ? Number(req.body.id_tutor) : null,
    };
    const kelas = await kelasRepository.create(payload);
    res.status(201).json({ success: true, message: 'Kelas berhasil ditambahkan', data: kelas });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateKelas = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.id_mapel !== undefined) {
      if (!payload.id_mapel || Number.isNaN(Number(payload.id_mapel))) {
        return res.status(400).json({ success: false, message: 'id_mapel tidak valid' });
      }
      payload.id_mapel = Number(payload.id_mapel);
    }
    if (payload.id_tutor !== undefined) {
      payload.id_tutor = payload.id_tutor ? Number(payload.id_tutor) : null;
    }

    const kelas = await kelasRepository.update(parseInt(req.params.id, 10), payload);
    res.json({ success: true, message: 'Kelas berhasil diperbarui', data: kelas });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });
    }
    handleError(res, error);
  }
};

export const deleteKelas = async (req, res) => {
  try {
    await kelasRepository.delete(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Kelas berhasil dihapus' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });
    }
    handleError(res, error);
  }
};
