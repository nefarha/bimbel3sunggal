import { TutorRepository } from '../repository/tutor/tutorRepository.js';

const tutorRepository = new TutorRepository();

const handleError = (res, error, defaultStatus = 500) => {
  console.error('❌ TutorController error:', error);
  res.status(defaultStatus).json({ success: false, message: error.message });
};

export const getAllTutor = async (req, res) => {
  try {
    const { status, search, id_mapel, jenjang } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (search) filters.search = search;
    if (id_mapel) filters.id_mapel = id_mapel;
    if (jenjang) filters.jenjang = jenjang;

    const tutor = await tutorRepository.findAll({ where: filters });
    res.json({ success: true, data: tutor });
  } catch (error) {
    handleError(res, error);
  }
};

export const getTutorById = async (req, res) => {
  try {
    const tutor = await tutorRepository.findById(parseInt(req.params.id, 10));
    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor tidak ditemukan' });
    }
    res.json({ success: true, data: tutor });
  } catch (error) {
    handleError(res, error);
  }
};

export const getTutorByUserId = async (req, res) => {
  try {
    const tutor = await tutorRepository.findByUserId(parseInt(req.params.id_user, 10));
    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor tidak ditemukan' });
    }
    res.json({ success: true, data: tutor });
  } catch (error) {
    handleError(res, error);
  }
};

export const createTutor = async (req, res) => {
  try {
    const { id_user, nama_tutor } = req.body;

    if (!id_user) {
      return res.status(400).json({ success: false, message: 'id_user wajib diisi' });
    }
    if (!nama_tutor || !String(nama_tutor).trim()) {
      return res.status(400).json({ success: false, message: 'nama_tutor wajib diisi' });
    }

    const validGender = ['L', 'P'];
    if (req.body.jenis_kelamin && !validGender.includes(req.body.jenis_kelamin)) {
      return res.status(400).json({
        success: false,
        message: "jenis_kelamin harus 'L' atau 'P'",
      });
    }

    const validStatus = ['Aktif', 'Nonaktif'];
    if (req.body.status && !validStatus.includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: "status harus 'Aktif' atau 'Nonaktif'",
      });
    }

    const payload = {
      id_user: Number(req.body.id_user),
      nik: req.body.nik || null,
      nama_tutor: String(nama_tutor).trim(),
      tempat_lahir: req.body.tempat_lahir || null,
      tanggal_lahir: req.body.tanggal_lahir || null,
      jenis_kelamin: req.body.jenis_kelamin || null,
      alamat: req.body.alamat || null,
      pendidikan: req.body.pendidikan || null,
      no_hp: req.body.no_hp || null,
      tanggal_bergabung: req.body.tanggal_bergabung || null,
      status: req.body.status || 'Aktif',
      mapel: req.body.mapel || null,
    };

    const tutor = await tutorRepository.create(payload);
    res.status(201).json({ success: true, message: 'Tutor berhasil ditambahkan', data: tutor });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
      return res.status(400).json({ success: false, message: 'id_user tidak valid' });
    }
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      return res.status(409).json({ success: false, message: 'Data tutor duplikat' });
    }
    handleError(res, error);
  }
};

export const updateTutor = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await tutorRepository.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Tutor tidak ditemukan' });
    }

    if (req.body.jenis_kelamin !== undefined && req.body.jenis_kelamin !== null) {
      if (!['L', 'P'].includes(req.body.jenis_kelamin)) {
        return res.status(400).json({
          success: false,
          message: "jenis_kelamin harus 'L' atau 'P'",
        });
      }
    }

    if (req.body.status !== undefined && !['Aktif', 'Nonaktif'].includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: "status harus 'Aktif' atau 'Nonaktif'",
      });
    }

    const tutor = await tutorRepository.update(id, req.body);
    res.json({ success: true, message: 'Tutor berhasil diperbarui', data: tutor });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
      return res.status(400).json({ success: false, message: 'id_user tidak valid' });
    }
    handleError(res, error);
  }
};

export const deleteTutor = async (req, res) => {
  try {
    await tutorRepository.delete(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Tutor berhasil dihapus' });
  } catch (error) {
    handleError(res, error);
  }
};
