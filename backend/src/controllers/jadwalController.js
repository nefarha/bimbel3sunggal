import { JadwalRepository } from '../repository/jadwal/jadwalRepository.js';

const jadwalRepository = new JadwalRepository();

const handleError = (res, error) => {
  console.error('❌ JadwalController error:', error);
  res.status(500).json({ success: false, message: error.message });
};

export const getAllJadwal = async (req, res) => {
  try {
    const { hari, id_kelas, id_tutor, id_mapel } = req.query;
    const filters = {};
    if (hari) filters.hari = hari;
    if (id_kelas) filters.id_kelas = parseInt(id_kelas, 10);
    if (id_tutor) filters.id_tutor = parseInt(id_tutor, 10);
    if (id_mapel) filters.id_mapel = parseInt(id_mapel, 10);

    const jadwal = await jadwalRepository.findAll({ where: filters });
    res.json({ success: true, data: jadwal });
  } catch (error) {
    handleError(res, error);
  }
};

export const getJadwalBySiswa = async (req, res) => {
  try {
    const jadwal = await jadwalRepository.findBySiswa(parseInt(req.params.id_siswa, 10));
    res.json({ success: true, data: jadwal });
  } catch (error) {
    handleError(res, error);
  }
};

export const getJadwalByTutor = async (req, res) => {
  try {
    const jadwal = await jadwalRepository.findByTutor(parseInt(req.params.id_tutor, 10));
    res.json({ success: true, data: jadwal });
  } catch (error) {
    handleError(res, error);
  }
};

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

export const createJadwal = async (req, res) => {
  try {
    const { id_kelas, id_tutor, id_mapel, hari, jam, jam_selesai } = req.body;
    if (!id_kelas || !id_tutor || !id_mapel || !hari || !jam) {
      return res.status(400).json({ success: false, message: 'id_kelas, id_tutor, id_mapel, hari, jam wajib diisi' });
    }

    // Validasi: jam_selesai harus setelah jam mulai
    if (jam_selesai) {
      if (jam_selesai <= jam) {
        return res.status(400).json({
          success: false,
          message: 'Jam selesai harus lebih besar dari jam mulai',
        });
      }
    }

    const hariArray = typeof hari === 'string' ? (() => { try { return JSON.parse(hari); } catch { return [hari]; } })() : hari;
    if (!Array.isArray(hariArray) || hariArray.length === 0) {
      return res.status(400).json({ success: false, message: 'Hari harus berupa array yang valid' });
    }

    // Cek konflik jadwal (tutor & kelas)
    const conflicts = await jadwalRepository.findConflicts({
      id_tutor: parseInt(id_tutor, 10),
      id_kelas: parseInt(id_kelas, 10),
      hari: hariArray,
      jam,
      jam_selesai: jam_selesai || null,
    });

    if (conflicts.length > 0) {
      const tutorConflicts = conflicts.filter(c => c.id_tutor === parseInt(id_tutor, 10));
      const kelasConflicts = conflicts.filter(c => c.id_kelas === parseInt(id_kelas, 10));
      const messages = [];
      if (tutorConflicts.length > 0) {
        const days = tutorConflicts.map(c => Array.isArray(c.hari) ? c.hari.join(', ') : c.hari).join(', ');
        messages.push(`Tutor "${tutorConflicts[0].nama_tutor}" sudah memiliki jadwal pada ${days} jam ${tutorConflicts[0].jam} - ${tutorConflicts[0].jam_selesai || 'selesai'}`);
      }
      if (kelasConflicts.length > 0) {
        const days = kelasConflicts.map(c => Array.isArray(c.hari) ? c.hari.join(', ') : c.hari).join(', ');
        messages.push(`Kelas "${kelasConflicts[0].nama_kelas}" sudah memiliki jadwal pada ${days} jam ${kelasConflicts[0].jam} - ${kelasConflicts[0].jam_selesai || 'selesai'}`);
      }
      return res.status(409).json({
        success: false,
        message: 'Jadwal bentrok: ' + messages.join('; '),
        conflicts,
      });
    }

    const payload = {
      ...req.body,
      id_kelas: parseInt(id_kelas, 10),
      id_tutor: parseInt(id_tutor, 10),
      id_mapel: parseInt(id_mapel, 10),
      jam_selesai: jam_selesai || null,
    };
    const jadwal = await jadwalRepository.create(payload);
    res.status(201).json({ success: true, message: 'Jadwal berhasil ditambahkan', data: jadwal });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateJadwal = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.id_kelas) payload.id_kelas = parseInt(payload.id_kelas, 10);
    if (payload.id_tutor) payload.id_tutor = parseInt(payload.id_tutor, 10);
    if (payload.id_mapel) payload.id_mapel = parseInt(payload.id_mapel, 10);

    // Validasi jam_selesai
    if (payload.jam_selesai) {
      const jamMulai = payload.jam || (await getJamMulai(req.params.id));
      if (payload.jam_selesai <= jamMulai) {
        return res.status(400).json({
          success: false,
          message: 'Jam selesai harus lebih besar dari jam mulai',
        });
      }
    }

    // Cek konflik jadwal (tutor & kelas) — kecuali jadwal yang sedang diedit
    if (payload.hari || payload.jam || payload.id_tutor || payload.id_kelas) {
      const existing = await jadwalRepository.findById(parseInt(req.params.id, 10));
      const hariArray = payload.hari
        ? (typeof payload.hari === 'string' ? (() => { try { return JSON.parse(payload.hari); } catch { return [payload.hari]; } })() : payload.hari)
        : existing?.hari || [];
      const id_tutor = payload.id_tutor || existing?.id_tutor;
      const id_kelas = payload.id_kelas || existing?.id_kelas;
      const jam = payload.jam || existing?.jam;
      const jam_selesai = payload.jam_selesai !== undefined ? payload.jam_selesai : (existing?.jam_selesai || null);

      if (Array.isArray(hariArray) && hariArray.length > 0 && id_tutor && id_kelas) {
        const conflicts = await jadwalRepository.findConflicts({
          id_tutor,
          id_kelas,
          hari: hariArray,
          jam,
          jam_selesai: jam_selesai || null,
          excludeId: parseInt(req.params.id, 10),
        });

        if (conflicts.length > 0) {
          const tutorConflicts = conflicts.filter(c => c.id_tutor === id_tutor);
          const kelasConflicts = conflicts.filter(c => c.id_kelas === id_kelas);
          const messages = [];
          if (tutorConflicts.length > 0) {
            const days = tutorConflicts.map(c => Array.isArray(c.hari) ? c.hari.join(', ') : c.hari).join(', ');
            messages.push(`Tutor "${tutorConflicts[0].nama_tutor}" sudah memiliki jadwal pada ${days} jam ${tutorConflicts[0].jam} - ${tutorConflicts[0].jam_selesai || 'selesai'}`);
          }
          if (kelasConflicts.length > 0) {
            const days = kelasConflicts.map(c => Array.isArray(c.hari) ? c.hari.join(', ') : c.hari).join(', ');
            messages.push(`Kelas "${kelasConflicts[0].nama_kelas}" sudah memiliki jadwal pada ${days} jam ${kelasConflicts[0].jam} - ${kelasConflicts[0].jam_selesai || 'selesai'}`);
          }
          return res.status(409).json({
            success: false,
            message: 'Jadwal bentrok: ' + messages.join('; '),
            conflicts,
          });
        }
      }
    }

    const jadwal = await jadwalRepository.update(parseInt(req.params.id, 10), payload);
    res.json({ success: true, message: 'Jadwal berhasil diperbarui', data: jadwal });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    }
    handleError(res, error);
  }
};

// Helper untuk ambil jam mulai saat edit
async function getJamMulai(id_jadwal) {
  try {
    const { queryOne } = await import('../config/query.js');
    const row = await queryOne('SELECT jam FROM jadwal WHERE id_jadwal = ?', [parseInt(id_jadwal, 10)]);
    return row?.jam || null;
  } catch {
    return null;
  }
}

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
