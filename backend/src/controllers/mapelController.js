import { MapelRepository } from '../repository/mapel/mapelRepository.js';

const mapelRepository = new MapelRepository();

const handleError = (res, error) => {
  console.error('❌ MapelController error:', error);
  res.status(500).json({ success: false, message: error.message });
};

export const getAllMapel = async (req, res) => {
  try {
    const mapel = await mapelRepository.findAll();
    res.json({ success: true, data: mapel });
  } catch (error) {
    handleError(res, error);
  }
};

export const getMapelById = async (req, res) => {
  try {
    const mapel = await mapelRepository.findById(parseInt(req.params.id, 10));
    if (!mapel) {
      return res.status(404).json({ success: false, message: 'Mapel tidak ditemukan' });
    }

    res.json({ success: true, data: mapel });
  } catch (error) {
    handleError(res, error);
  }
};

export const createMapel = async (req, res) => {
  try {
    const { nama_mapel } = req.body;
    if (!nama_mapel || !nama_mapel.trim()) {
      return res.status(400).json({ success: false, message: 'Nama mapel wajib diisi' });
    }

    const mapel = await mapelRepository.create({ nama_mapel: nama_mapel.trim() });
    res.status(201).json({ success: true, message: 'Mapel berhasil ditambahkan', data: mapel });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateMapel = async (req, res) => {
  try {
    const { nama_mapel } = req.body;
    if (!nama_mapel || !nama_mapel.trim()) {
      return res.status(400).json({ success: false, message: 'Nama mapel wajib diisi' });
    }

    const existing = await mapelRepository.findById(parseInt(req.params.id, 10));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Mapel tidak ditemukan' });
    }

    const mapel = await mapelRepository.update(parseInt(req.params.id, 10), { nama_mapel: nama_mapel.trim() });
    res.json({ success: true, message: 'Mapel berhasil diperbarui', data: mapel });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteMapel = async (req, res) => {
  try {
    const existing = await mapelRepository.findById(parseInt(req.params.id, 10));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Mapel tidak ditemukan' });
    }

    await mapelRepository.delete(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Mapel berhasil dihapus' });
  } catch (error) {
    handleError(res, error);
  }
};
