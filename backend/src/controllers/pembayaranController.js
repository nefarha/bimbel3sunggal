import { PembayaranRepository } from '../repository/pembayaran/pembayaranRepository.js';
import { query } from '../config/query.js';

const pembayaranRepository = new PembayaranRepository();

const handleError = (res, error) => {
  console.error('❌ PembayaranController error:', error);
  res.status(500).json({ success: false, message: error.message });
};

const toNumber = (val) => (val !== undefined && val !== null ? Number(val) : 0);

// GET /api/pembayaran
export const getAllPembayaran = async (req, res) => {
  try {
    const { id_siswa, status, bulan } = req.query;
    const filters = {};
    if (id_siswa) filters.id_siswa = parseInt(id_siswa, 10);
    if (status) filters.status = status;
    if (bulan) filters.bulan = bulan;

    const data = await pembayaranRepository.findAll({ where: filters });
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/pembayaran/:id
export const getPembayaranById = async (req, res) => {
  try {
    const data = await pembayaranRepository.findById(parseInt(req.params.id, 10));
    if (!data) {
      return res.status(404).json({ success: false, message: 'Pembayaran tidak ditemukan' });
    }
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /api/pembayaran
export const createPembayaran = async (req, res) => {
  try {
    const { id_siswa, tanggal_bayar } = req.body;
    if (!id_siswa || !tanggal_bayar) {
      return res.status(400).json({ success: false, message: 'id_siswa dan tanggal_bayar wajib diisi' });
    }

    const payload = {
      ...req.body,
      tanggal_bayar: new Date(tanggal_bayar),
      jumlah: toNumber(req.body.jumlah),
      diskon: toNumber(req.body.diskon),
      status: req.body.status || 'Pending',
    };

    const data = await pembayaranRepository.create(payload);
    res.status(201).json({ success: true, message: 'Pembayaran berhasil ditambahkan', data });
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /api/pembayaran/:id
export const updatePembayaran = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.tanggal_bayar) payload.tanggal_bayar = new Date(payload.tanggal_bayar);
    if (payload.tanggal_verifikasi) payload.tanggal_verifikasi = new Date(payload.tanggal_verifikasi);
    if (payload.jumlah !== undefined) payload.jumlah = Number(payload.jumlah);
    if (payload.diskon !== undefined) payload.diskon = Number(payload.diskon);

    const data = await pembayaranRepository.update(parseInt(req.params.id, 10), payload);
    res.json({ success: true, message: 'Pembayaran berhasil diperbarui', data });
  } catch (error) {
    handleError(res, error);
  }
};

// PATCH /api/pembayaran/:id/verify
export const verifyPembayaran = async (req, res) => {
  try {
    const { status = 'Verified', catatan = null } = req.body;
    const data = await pembayaranRepository.update(parseInt(req.params.id, 10), {
      status,
      tanggal_verifikasi: new Date(),
      catatan,
    });
    res.json({ success: true, message: `Pembayaran berhasil di-${status.toLowerCase()}`, data });
  } catch (error) {
    handleError(res, error);
  }
};

// PATCH /api/pembayaran/bulk-verify
// Body: { ids?: number[], status: 'Verified' | 'Rejected', catatan?: string }
// Jika ids kosong → verifikasi semua yang berstatus 'Pending'
export const bulkVerify = async (req, res) => {
  try {
    const { ids = [], status = 'Verified', catatan = null } = req.body;

    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status harus Verified atau Rejected' });
    }

    let result;
    if (Array.isArray(ids) && ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      result = await query(
        `UPDATE pembayaran
         SET status = ?, tanggal_verifikasi = ?, catatan = ?
         WHERE id_pembayaran IN (${placeholders}) AND status = 'Pending'`,
        [status, new Date(), catatan, ...ids]
      );
    } else {
      result = await query(
        `UPDATE pembayaran
         SET status = ?, tanggal_verifikasi = ?, catatan = ?
         WHERE status = 'Pending'`,
        [status, new Date(), catatan]
      );
    }

    res.json({
      success: true,
      message: `Berhasil ${status === 'Verified' ? 'memverifikasi' : 'menolak'} ${result.affectedRows || 0} transaksi`,
      data: { affectedRows: result.affectedRows || 0 },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /api/pembayaran/:id
export const deletePembayaran = async (req, res) => {
  try {
    await pembayaranRepository.delete(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Pembayaran berhasil dihapus' });
  } catch (error) {
    handleError(res, error);
  }
};
