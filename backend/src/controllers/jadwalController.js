import { JadwalRepository } from '../repository/jadwal/jadwalRepository.js';

const jadwalRepository = new JadwalRepository();

const handleError = (res, error) => {
  console.error('❌ JadwalController error:', error);
  res.status(500).json({ success: false, message: error.message });
};

// GET /api/jadwal
export const getAllJadwal = async (req, res) => {
  try {
    const { hari, id_kelas, id_tutor } = req.query;
    const filters = {};
    if (hari) filters.hari = hari;
    if (id_kelas) filters.id_kelas = parseInt(id_kelas, 10);
    if (id_tutor) filters.id_tutor = parseInt(id_tutor, 10);

    const jadwal = await jadwalRepository.findAll({ where: filters });
    res.json({ success: true, data: jadwal });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/jadwal/:id
export const getJadwalById = async (req, res) => {
  try {
    const jadwal = await jadwalRepository.findById(parseInt(req.params.id, 10));
    if (!jadwal) {
      return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    }
    res.json({ success: true, data: jadwal });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /api/jadwal
export const createJadwal = async (req, res) => {
  try {
    const { id_kelas, id_tutor, hari, jam } = req.body;
    if (!id_kelas || !id_tutor || !hari || !jam) {
      return res.status(400).json({ success: false, message: 'id_kelas, id_tutor, hari, jam wajib diisi' });
    }
    const jadwal = await jadwalRepository.create(req.body);
    res.status(201).json({ success: true, message: 'Jadwal berhasil ditambahkan', data: jadwal });
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /api/jadwal/:id
export const updateJadwal = async (req, res) => {
  try {
    const jadwal = await jadwalRepository.update(parseInt(req.params.id, 10), req.body);
    res.json({ success: true, message: 'Jadwal berhasil diperbarui', data: jadwal });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    }
    handleError(res, error);
  }
};

// DELETE /api/jadwal/:id
export const deleteJadwal = async (req, res) => {
  try {
    await jadwalRepository.delete(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Jadwal berhasil dihapus' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    }
    handleError(res, error);
  }
};
