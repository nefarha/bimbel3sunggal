import { SiswaRepository } from '../repository/siswa/siswaRepository.js';
import { KelasSiswaRepository } from '../repository/kelasSiswa/kelasSiswaRepository.js';

const siswaRepository = new SiswaRepository();
const kelasSiswaRepository = new KelasSiswaRepository();

const handleError = (res, error, defaultStatus = 500) => {
  console.error('❌ SiswaController error:', error);
  res.status(defaultStatus).json({ success: false, message: error.message });
};

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

export const getSiswaByUserId = async (req, res) => {
  try {
    const siswa = await siswaRepository.findByUserId(parseInt(req.params.id_user, 10));
    if (!siswa) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }
    res.json({ success: true, data: siswa });
  } catch (error) {
    handleError(res, error);
  }
};

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


    delete payload.id_kelas;

    if (payload.mapel && Array.isArray(payload.mapel)) {
      payload.mapel = JSON.stringify(payload.mapel);
    }

    const siswa = await siswaRepository.create(payload);

    if (req.body.id_kelas && Array.isArray(req.body.id_kelas) && req.body.id_kelas.length > 0) {
      for (const idKelas of req.body.id_kelas) {
        try {
          await kelasSiswaRepository.create({
            id_siswa: siswa.id_siswa,
            id_kelas: Number(idKelas),
          });
        } catch (err) {
          if (err.code !== 'ER_DUP_ENTRY' && err.errno !== 1062) {
            console.error('Enrollment error:', err);
          }
        }
      }
    }

    res.status(201).json({ success: true, message: 'Siswa berhasil ditambahkan', data: siswa });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateSiswa = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.spp !== undefined) data.spp = Number(data.spp);

    const idKelasArray = data.id_kelas;
    delete data.id_kelas;

    const siswa = await siswaRepository.update(parseInt(req.params.id, 10), data);

    if (idKelasArray && Array.isArray(idKelasArray)) {
      await kelasSiswaRepository.deleteBySiswaId(siswa.id_siswa);
      for (const idKelas of idKelasArray) {
        try {
          await kelasSiswaRepository.create({
            id_siswa: siswa.id_siswa,
            id_kelas: Number(idKelas),
          });
        } catch (err) {
          if (err.code !== 'ER_DUP_ENTRY' && err.errno !== 1062) {
            console.error('Enrollment sync error:', err);
          }
        }
      }
    }

    res.json({ success: true, message: 'Siswa berhasil diperbarui', data: siswa });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
      return res.status(400).json({ success: false, message: 'id_user tidak valid' });
    }
    handleError(res, error);
  }
};

export const getSiswaByKelas = async (req, res) => {
  try {
    const siswa = await siswaRepository.findByKelas(parseInt(req.params.id_kelas, 10));
    res.json({ success: true, data: siswa });
  } catch (error) {
    handleError(res, error);
  }
};

export const getSiswaKelas = async (req, res) => {
  try {
    const enrollments = await kelasSiswaRepository.findBySiswaId(parseInt(req.params.id, 10));
    res.json({ success: true, data: enrollments });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteSiswa = async (req, res) => {
  try {
    await siswaRepository.delete(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Siswa berhasil dihapus' });
  } catch (error) {
    handleError(res, error);
  }
};
