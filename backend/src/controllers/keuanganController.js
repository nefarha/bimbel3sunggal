import { query, queryOne } from '../config/query.js';

const handleError = (res, error) => {
  console.error('❌ KeuanganController error:', error);
  res.status(500).json({ success: false, message: error.message });
};

export const getRekapKeuangan = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    const targetMonth = bulan ? parseInt(bulan, 10) : new Date().getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun, 10) : new Date().getFullYear();

    const pendapatanRow = await queryOne(
      `SELECT COALESCE(SUM(jumlah), 0) AS total
       FROM pembayaran
       WHERE MONTH(tanggal_bayar) = ? AND YEAR(tanggal_bayar) = ? AND status = 'Verified'`,
      [targetMonth, targetYear]
    );
    const totalPendapatan = Number(pendapatanRow?.total || 0);

    const periodeStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01 00:00:00`;
    const pengeluaranRow = await queryOne(
      `SELECT COALESCE(SUM(total_gaji), 0) AS total
       FROM gaji_tutor
       WHERE periode = ?`,
      [periodeStart]
    );
    const totalPengeluaran = Number(pengeluaranRow?.total || 0);

    const labaBersih = totalPendapatan - totalPengeluaran;

    res.json({
      success: true,
      data: {
        total_pendapatan: totalPendapatan,
        total_pengeluaran: totalPengeluaran,
        laba_bersih: labaBersih,
        periode: { bulan: targetMonth, tahun: targetYear },
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getTahunanKeuangan = async (req, res) => {
  try {
    const { tahun } = req.query;
    const targetYear = tahun ? parseInt(tahun, 10) : new Date().getFullYear();

    const months = [];
    for (let m = 1; m <= 12; m++) {
      const periodeStart = `${targetYear}-${String(m).padStart(2, '0')}-01 00:00:00`;

      const [pendapatanRow, pengeluaranRow] = await Promise.all([
        queryOne(
          `SELECT COALESCE(SUM(jumlah), 0) AS total
           FROM pembayaran
           WHERE MONTH(tanggal_bayar) = ? AND YEAR(tanggal_bayar) = ? AND status = 'Verified'`,
          [m, targetYear]
        ),
        queryOne(
          `SELECT COALESCE(SUM(total_gaji), 0) AS total
           FROM gaji_tutor
           WHERE periode = ?`,
          [periodeStart]
        ),
      ]);

      months.push({
        bulan: m,
        pendapatan: Number(pendapatanRow?.total || 0),
        pengeluaran: Number(pengeluaranRow?.total || 0),
      });
    }

    res.json({ success: true, data: months, tahun: targetYear });
  } catch (error) {
    handleError(res, error);
  }
};
