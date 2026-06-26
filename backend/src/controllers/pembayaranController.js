import { PembayaranRepository } from '../repository/pembayaran/pembayaranRepository.js';
import { query } from '../config/query.js';

const pembayaranRepository = new PembayaranRepository();

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const handleError = (res, error) => {
  console.error('❌ PembayaranController error:', error);
  res.status(500).json({ success: false, message: error.message });
};

const toNumber = (val) => (val !== undefined && val !== null ? Number(val) : 0);

export const getAllPembayaran = async (req, res) => {
  try {
    const { id_siswa, status, bulan, search } = req.query;
    const conditions = [];
    const params = [];

    if (id_siswa) {
      conditions.push('p.id_siswa = ?');
      params.push(parseInt(id_siswa, 10));
    }
    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }
    if (bulan) {
      conditions.push('p.bulan = ?');
      params.push(bulan);
    }
    if (search && search.trim()) {
      conditions.push('(s.nama LIKE ? OR CAST(p.id_siswa AS CHAR) LIKE ?)');
      const like = `%${search.trim()}%`;
      params.push(like, like);
    }

    const whereSql = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const rows = await query(
      `SELECT
         p.id_pembayaran,
         p.id_siswa,
         s.nama AS nama_siswa,
         p.bulan,
         p.tanggal_bayar,
         p.jenis_pembayaran,
         p.jumlah,
         p.metode_pembayaran,
         p.diskon,
         p.status,
         p.tanggal_verifikasi,
         p.catatan
       FROM pembayaran p
       INNER JOIN siswa s ON s.id_siswa = p.id_siswa
       ${whereSql}
       ORDER BY p.tanggal_bayar DESC, p.id_pembayaran DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    handleError(res, error);
  }
};

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





export const getTunggakanSiswa = async (req, res) => {
  try {
    const id_siswa = parseInt(req.params.id_siswa, 10);
    if (!id_siswa) {
      return res.status(400).json({ success: false, message: 'id_siswa wajib diisi' });
    }

    const siswaRows = await query(
      `SELECT id_siswa, nama, spp, tanggal_masuk
       FROM siswa
       WHERE id_siswa = ?
         AND status = 'Aktif'
       LIMIT 1`,
      [id_siswa]
    );

    if (siswaRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan / tidak aktif' });
    }

    const s = siswaRows[0];
    const spp = Number(s.spp) || 0;

    if (!s.tanggal_masuk) {
      return res.json({
        success: true,
        data: {
          id_siswa: s.id_siswa,
          nama: s.nama,
          spp,
          tunggakan_count: 0,
          tunggakan_months: [],
        },
      });
    }

    const tglMasuk = s.tanggal_masuk instanceof Date
      ? new Date(
          s.tanggal_masuk.getFullYear(),
          s.tanggal_masuk.getMonth(),
          s.tanggal_masuk.getDate()
        )
      : (() => {
          const [y, m, d] = String(s.tanggal_masuk).split('-').map(Number);
          return new Date(y, m - 1, d);
        })();



    const pembayaranList = await query(
      `SELECT tanggal_verifikasi FROM pembayaran
       WHERE id_siswa = ? AND status = 'Verified'
         AND tanggal_verifikasi IS NOT NULL`,
      [id_siswa]
    );
    const paidSet = new Set();
    for (const p of pembayaranList) {
      const tv = p.tanggal_verifikasi instanceof Date
        ? p.tanggal_verifikasi
        : new Date(p.tanggal_verifikasi);
      if (Number.isNaN(tv.getTime())) continue;
      paidSet.add(`${MONTHS_ID[tv.getMonth()]} ${tv.getFullYear()}`);
    }

    const now = new Date();
    const dayOfMonth = tglMasuk.getDate();
    const tunggakanMonths = [];

    let cursor = new Date(tglMasuk.getFullYear(), tglMasuk.getMonth() + 1, 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    while (cursor.getTime() <= endMonth.getTime()) {
      const bulanStr = `${MONTHS_ID[cursor.getMonth()]} ${cursor.getFullYear()}`;
      if (!paidSet.has(bulanStr)) {

        const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
        const clampedDay = Math.min(Math.max(dayOfMonth, 1), daysInMonth);
        const periodDate = new Date(cursor.getFullYear(), cursor.getMonth(), clampedDay);
        const y = periodDate.getFullYear();
        const mm = String(periodDate.getMonth() + 1).padStart(2, '0');
        const dd = String(periodDate.getDate()).padStart(2, '0');
        tunggakanMonths.push({
          bulan: bulanStr,
          tanggal_bayar: `${y}-${mm}-${dd}`,
          year: cursor.getFullYear(),
          monthIdx: cursor.getMonth(),
        });
      }
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    res.json({
      success: true,
      data: {
        id_siswa: s.id_siswa,
        nama: s.nama,
        spp,
        tunggakan_count: tunggakanMonths.length,
        tunggakan_months: tunggakanMonths,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

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

export const deletePembayaran = async (req, res) => {
  try {
    await pembayaranRepository.delete(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Pembayaran berhasil dihapus' });
  } catch (error) {
    handleError(res, error);
  }
};
