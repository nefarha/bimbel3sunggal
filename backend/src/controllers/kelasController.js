import { KelasRepository } from '../repository/kelas/kelasRepository.js';

const kelasRepository = new KelasRepository();

const handleError = (res, error) => {
  console.error('❌ KelasController error:', error);
  res.status(500).json({ success: false, message: error.message });
};

// GET /api/kelas
export const getAllKelas = async (req, res) => {
  try {
    const kelas = await kelasRepository.findAll();
    res.json({ success: true, data: kelas });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/kelas/:id
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

// POST /api/kelas
export const createKelas = async (req, res) => {
  try {
    const { nama_kelas } = req.body;
    if (!nama_kelas) {
      return res.status(400).json({ success: false, message: 'nama_kelas wajib diisi' });
    }
    const kelas = await kelasRepository.create(req.body);
    res.status(201).json({ success: true, message: 'Kelas berhasil ditambahkan', data: kelas });
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /api/kelas/:id
export const updateKelas = async (req, res) => {
  try {
    const kelas = await kelasRepository.update(parseInt(req.params.id, 10), req.body);
    res.json({ success: true, message: 'Kelas berhasil diperbarui', data: kelas });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });
    }
    handleError(res, error);
  }
};

// DELETE /api/kelas/:id
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
