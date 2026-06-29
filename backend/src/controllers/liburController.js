import { LiburRepository } from '../repository/libur/liburRepository.js';

const liburRepository = new LiburRepository();

const handleError = (res, error) => {
  console.error('❌ LiburController error:', error);
  res.status(500).json({ success: false, message: error.message });
};

export const getLiburByMonth = async (req, res) => {
  try {
    const { tahun, bulan } = req.query;
    if (!tahun || !bulan) {
      return res.status(400).json({ success: false, message: 'Parameter tahun dan bulan wajib diisi' });
    }
    const data = await liburRepository.findByMonth(parseInt(tahun, 10), parseInt(bulan, 10));
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
};

export const getAllLibur = async (req, res) => {
  try {
    const data = await liburRepository.findAll();
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
};

export const createLibur = async (req, res) => {
  try {
    const { tanggal, keterangan } = req.body;
    if (!tanggal) {
      return res.status(400).json({ success: false, message: 'Tanggal wajib diisi' });
    }
    const libur = await liburRepository.create({
      tanggal,
      keterangan: (keterangan || '').trim(),
    });
    res.status(201).json({ success: true, message: 'Hari libur berhasil ditambahkan', data: libur });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateLibur = async (req, res) => {
  try {
    const { keterangan } = req.body;
    const existing = await liburRepository.findById(parseInt(req.params.id, 10));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data libur tidak ditemukan' });
    }
    const payload = {};
    if (keterangan !== undefined) payload.keterangan = keterangan.trim();
    const libur = await liburRepository.update(parseInt(req.params.id, 10), payload);
    res.json({ success: true, message: 'Hari libur berhasil diperbarui', data: libur });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteLibur = async (req, res) => {
  try {
    const existing = await liburRepository.findById(parseInt(req.params.id, 10));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data libur tidak ditemukan' });
    }
    await liburRepository.delete(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Hari libur berhasil dihapus' });
  } catch (error) {
    handleError(res, error);
  }
};
