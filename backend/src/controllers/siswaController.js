import { SiswaRepository } from '../repository/siswa/siswaRepository.js';

const siswaRepository = new SiswaRepository();

const handleError = (res, error, defaultStatus = 500) => {
  console.error('❌ SiswaController error:', error);
  res.status(defaultStatus).json({ success: false, message: error.message });
};

// GET /api/siswa
export const getAllSiswa = async (req, res) => {
  try {
    const { status } = req.query;
    const filters = {};
    if (status) filters.status = status;

    const siswa = await siswaRepository.findAll({ where: filters });
    res.json({ success: true, data: siswa });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/siswa/:id
export const getSiswaById = async (req, res) => {
  try {
    const siswa = await siswaRepository.findById(parseInt(req.params.id, 10));
    if (!siswa) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }
    res.json({ success: true, data: siswa });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /api/siswa
export const createSiswa = async (req, res) => {
  try {
    const { id_user, nama } = req.body;
    if (!id_user || !nama) {
      return res.status(400).json({ success: false, message: 'id_user dan nama wajib diisi' });
    }
    const payload = {
      ...req.body,
      spp: req.body.spp !== undefined ? Number(req.body.spp) : 0,
      status: req.body.status || 'Aktif',
    };
    const siswa = await siswaRepository.create(payload);
    res.status(201).json({ success: true, message: 'Siswa berhasil ditambahkan', data: siswa });
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /api/siswa/:id
export const updateSiswa = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.spp !== undefined) data.spp = Number(data.spp);

    const siswa = await siswaRepository.update(parseInt(req.params.id, 10), data);
    res.json({ success: true, message: 'Siswa berhasil diperbarui', data: siswa });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
      return res.status(400).json({ success: false, message: 'id_user tidak valid' });
    }
    handleError(res, error);
  }
};

// GET /api/siswa/kelas/:id_kelas
export const getSiswaByKelas = async (req, res) => {
  try {
    const siswa = await siswaRepository.findByKelas(parseInt(req.params.id_kelas, 10));
    res.json({ success: true, data: siswa });
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /api/siswa/:id
export const deleteSiswa = async (req, res) => {
  try {
    await siswaRepository.delete(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Siswa berhasil dihapus' });
  } catch (error) {
    handleError(res, error);
  }
};
