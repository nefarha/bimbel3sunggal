import { query, queryOne, queryScalar } from '../config/query.js';

const HARI_MAP_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const formatRupiah = (value) => {
  const num = typeof value === 'bigint' ? Number(value) : Number(value || 0);
  return 'Rp ' + num.toLocaleString('id-ID');
};

const formatDateShort = (date) => {
  if (!date) return '-';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS_ID[d.getMonth()].slice(0, 3);
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const toMySQLDateTime = (date) => {
  // Menghasilkan string 'YYYY-MM-DD HH:MM:SS' yang aman untuk perbandingan di MySQL
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const diffDays = (a, b) => {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
};

// GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const todayName = HARI_MAP_ID[today.getDay()];
    const dayStart = toMySQLDateTime(startOfDay(today));
    const dayEnd = toMySQLDateTime(endOfDay(today));

    // Hitung semua statistik secara paralel
    const [
      totalSiswaAktif,
      totalKelasHariIni,
      absensiBelumDikonfirmasi,
      transaksiMenungguVerifikasi,
      absensiHariIniRaw,
      transaksiPendingRaw,
    ] = await Promise.all([
      queryScalar(`SELECT COUNT(*) AS c FROM siswa WHERE status = ?`, ['Aktif']),
      queryScalar(
        `SELECT COUNT(DISTINCT id_kelas) AS c FROM jadwal WHERE hari = ?`,
        [todayName]
      ),
      queryScalar(
        `SELECT COUNT(*) AS c FROM absensi_siswa WHERE is_confirmed = 0`
      ),
      queryScalar(
        `SELECT COUNT(*) AS c FROM pembayaran WHERE status = ?`,
        ['Pending']
      ),
      query(
        `SELECT
           a.id_absensi,
           a.id_siswa,
           a.id_jadwal,
           a.tanggal,
           a.status,
           s.nama        AS nama_siswa,
           j.id_kelas,
           j.id_tutor,
           k.nama_kelas,
           t.nama_tutor
         FROM absensi_siswa a
         INNER JOIN siswa s   ON s.id_siswa = a.id_siswa
         INNER JOIN jadwal j  ON j.id_jadwal = a.id_jadwal
         INNER JOIN kelas k   ON k.id_kelas = j.id_kelas
         INNER JOIN tutor t   ON t.id_tutor = j.id_tutor
         WHERE a.tanggal BETWEEN ? AND ?
           AND a.is_confirmed = 0
         ORDER BY a.id_absensi ASC`,
        [dayStart, dayEnd]
      ),
      query(
        `SELECT
           p.id_pembayaran,
           p.id_siswa,
           p.tanggal_bayar,
           p.jumlah,
           p.status,
           s.nama AS nama_siswa
         FROM pembayaran p
         INNER JOIN siswa s ON s.id_siswa = p.id_siswa
         WHERE p.status = ?
         ORDER BY p.tanggal_bayar DESC
         LIMIT 25`,
        ['Pending']
      ),
    ]);

    // Aggregate absensi per kelas
    const kelasMap = new Map();
    for (const row of absensiHariIniRaw) {
      const key = row.id_kelas;
      if (!kelasMap.has(key)) {
        kelasMap.set(key, {
          id: key,
          id_kelas: key,
          nama_kelas: row.nama_kelas,
          nama_tutor: row.nama_tutor,
          id_tutor: row.id_tutor,
          hadir: 0,
          absen: 0,
        });
      }
      const entry = kelasMap.get(key);
      if (row.status === 'Hadir') entry.hadir += 1;
      else entry.absen += 1;
    }
    const absensiHariIni = Array.from(kelasMap.values());

    // Map transaksi pending
    const transaksiPending = transaksiPendingRaw.map((row) => ({
      id: row.id_pembayaran,
      id_pembayaran: row.id_pembayaran,
      id_siswa: row.id_siswa,
      tanggal: formatDateShort(row.tanggal_bayar),
      nama: row.nama_siswa || '-',
      jumlah: formatRupiah(row.jumlah),
      status: row.status,
    }));

    res.json({
      success: true,
      data: {
        stats: {
          totalSiswaAktif: Number(totalSiswaAktif) || 0,
          totalKelasHariIni: Number(totalKelasHariIni) || 0,
          absensiBelumDikonfirmasi: Number(absensiBelumDikonfirmasi) || 0,
          transaksiMenungguVerifikasi: Number(transaksiMenungguVerifikasi) || 0,
        },
        absensiHariIni,
        transaksiPending,
        meta: {
          hariIni: todayName,
          tanggal: today.toISOString().slice(0, 10),
        },
      },
    });
  } catch (error) {
    console.error('❌ DashboardController error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/absensi-hari-ini
export const getAbsensiHariIni = async (req, res) => {
  try {
    const today = new Date();
    const dayStart = toMySQLDateTime(startOfDay(today));
    const dayEnd = toMySQLDateTime(endOfDay(today));

    const rows = await query(
      `SELECT
         a.id_absensi,
         a.status,
         j.id_kelas,
         k.nama_kelas,
         t.nama_tutor
       FROM absensi_siswa a
       INNER JOIN jadwal j ON j.id_jadwal = a.id_jadwal
       INNER JOIN kelas k  ON k.id_kelas  = j.id_kelas
       INNER JOIN tutor t  ON t.id_tutor  = j.id_tutor
       WHERE a.tanggal BETWEEN ? AND ?
         AND a.is_confirmed = 0
       ORDER BY a.id_absensi ASC`,
      [dayStart, dayEnd]
    );

    const map = new Map();
    for (const r of rows) {
      const key = r.id_kelas;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          nama_kelas: r.nama_kelas,
          nama_tutor: r.nama_tutor,
          hadir: 0,
          absen: 0,
        });
      }
      const e = map.get(key);
      if (r.status === 'Hadir') e.hadir += 1;
      else e.absen += 1;
    }

    res.json({ success: true, data: Array.from(map.values()) });
  } catch (error) {
    console.error('❌ Dashboard absensi-hari-ini error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/transaksi-pending
export const getTransaksiPending = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);

    const rows = await query(
      `SELECT
         p.id_pembayaran,
         p.id_siswa,
         p.tanggal_bayar,
         p.jumlah,
         p.status,
         s.nama AS nama_siswa
       FROM pembayaran p
       INNER JOIN siswa s ON s.id_siswa = p.id_siswa
       WHERE p.status = ?
       ORDER BY p.tanggal_bayar DESC
       LIMIT ${limit}`,
      ['Pending']
    );

    const data = rows.map((r) => ({
      id: r.id_pembayaran,
      id_pembayaran: r.id_pembayaran,
      id_siswa: r.id_siswa,
      tanggal: formatDateShort(r.tanggal_bayar),
      nama: r.nama_siswa || '-',
      jumlah: formatRupiah(r.jumlah),
      status: r.status,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Dashboard transaksi-pending error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/piutang
// Siswa aktif yang belum memiliki pembayaran Verified untuk bulan berjalan
export const getPiutangSiswa = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const offset = (page - 1) * limit;

    const now = new Date();
    const bulanIni = `${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`;

    // Total piutang
    const totalRow = await queryOne(
      `SELECT COUNT(*) AS total
       FROM siswa s
       LEFT JOIN pembayaran p
         ON p.id_siswa = s.id_siswa
        AND p.status   = 'Verified'
        AND p.bulan    = ?
       WHERE s.status  = 'Aktif'
         AND p.id_pembayaran IS NULL`,
      [bulanIni]
    );
    const total = Number(totalRow?.total) || 0;

    // Ambil halaman data (LIMIT/OFFSET di-inline karena mysql2 prepared
    // statements tidak support numeric placeholder untuk LIMIT/OFFSET)
    const rows = await query(
      `SELECT
         s.id_siswa,
         s.nama,
         s.spp,
         s.no_hp_ortu
       FROM siswa s
       LEFT JOIN pembayaran p
         ON p.id_siswa = s.id_siswa
        AND p.status   = 'Verified'
        AND p.bulan    = ?
       WHERE s.status  = 'Aktif'
         AND p.id_pembayaran IS NULL
       ORDER BY s.nama ASC
       LIMIT ${limit} OFFSET ${offset}`,
      [bulanIni]
    );

    const keterlambatan = diffDays(now, new Date(now.getFullYear(), now.getMonth(), 10));
    const data = rows.map((s) => ({
      id: s.id_siswa,
      nama: s.nama,
      bulan: bulanIni,
      nominal: formatRupiah(s.spp),
      keterlambatan: `${keterlambatan} Hari`,
      whatsapp: s.no_hp_ortu || '-',
    }));

    res.json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('❌ Dashboard piutang error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
