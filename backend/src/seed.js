import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const HARI_MAP_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'grand3sunggal',
  waitForConnections: true,
  connectionLimit: 5,
});

const toMySQLDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toMySQLDateTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/**
 * Upsert helper: insert jika belum ada berdasarkan kolom unik, kalau ada skip.
 * Mengembalikan insertId jika baris baru, atau null jika sudah ada.
 */
const upsert = async (conn, sql, params) => {
  const [result] = await conn.execute(sql, params);
  return result.insertId ?? null;
};

const findUserId = async (conn, username) => {
  const [rows] = await conn.execute(
    'SELECT id_user FROM users WHERE username = ? LIMIT 1',
    [username]
  );
  return rows[0]?.id_user || null;
};

const findSiswaId = async (conn, idUser) => {
  const [rows] = await conn.execute(
    'SELECT id_siswa FROM siswa WHERE id_user = ? LIMIT 1',
    [idUser]
  );
  return rows[0]?.id_siswa || null;
};

const findTutorId = async (conn, idUser) => {
  const [rows] = await conn.execute(
    'SELECT id_tutor FROM tutor WHERE id_user = ? LIMIT 1',
    [idUser]
  );
  return rows[0]?.id_tutor || null;
};

const findKelasId = async (conn, namaKelas) => {
  const [rows] = await conn.execute(
    'SELECT id_kelas FROM kelas WHERE nama_kelas = ? LIMIT 1',
    [namaKelas]
  );
  return rows[0]?.id_kelas || null;
};

const nextId = async (conn, table, pk) => {
  const [rows] = await conn.execute(
    `SELECT COALESCE(MAX(\`${pk}\`), 0) + 1 AS next_id FROM \`${table}\``
  );
  return Number(rows[0]?.next_id) || 1;
};

async function main() {
  console.log('Start seeding...');

  // ─── Users ──────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const tutorPassword = await bcrypt.hash('tutor123', 10);
  const siswaPassword = await bcrypt.hash('siswa123', 10);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // admin
    let adminId = await findUserId(conn, 'admin');
    if (!adminId) {
      adminId = await nextId(conn, 'users', 'id_user');
      await conn.execute(
        'INSERT INTO users (id_user, username, password, role) VALUES (?, ?, ?, ?)',
        [adminId, 'admin', adminPassword, 'admin']
      );
      console.log(`✔ admin user (id: ${adminId})`);
    } else {
      console.log(`✔ admin user (id: ${adminId}, exists)`);
    }

    // owner
    let ownerId = await findUserId(conn, 'owner');
    if (!ownerId) {
      ownerId = await nextId(conn, 'users', 'id_user');
      await conn.execute(
        'INSERT INTO users (id_user, username, password, role) VALUES (?, ?, ?, ?)',
        [ownerId, 'owner', ownerPassword, 'pemilik']
      );
      console.log(`✔ owner user (id: ${ownerId})`);
    } else {
      console.log(`✔ owner user (id: ${ownerId}, exists)`);
    }

    // ─── Tutors ────────────────────────────────────────────────
    const tutors = [];
    const tutorData = [
      { username: 'budi.setiawan', nama: 'Budi Setiawan', jenis_kelamin: 'L', no_hp: '081234567001' },
      { username: 'ani.wijaya', nama: 'Ani Wijaya', jenis_kelamin: 'P', no_hp: '081234567002' },
      { username: 'candra.putra', nama: 'Candra Putra', jenis_kelamin: 'L', no_hp: '081234567003' },
      { username: 'dewi.lestari', nama: 'Dewi Lestari', jenis_kelamin: 'P', no_hp: '081234567004' },
    ];

    for (const t of tutorData) {
      let userId = await findUserId(conn, t.username);
      if (!userId) {
        userId = await nextId(conn, 'users', 'id_user');
        await conn.execute(
          'INSERT INTO users (id_user, username, password, role) VALUES (?, ?, ?, ?)',
          [userId, t.username, tutorPassword, 'tutor']
        );
      }
      let tutorId = await findTutorId(conn, userId);
      if (!tutorId) {
        tutorId = await nextId(conn, 'tutor', 'id_tutor');
        await conn.execute(
          `INSERT INTO tutor (id_tutor, id_user, nama_tutor, jenis_kelamin, no_hp, tanggal_bergabung, status)
           VALUES (?, ?, ?, ?, ?, ?, 'Aktif')`,
          [tutorId, userId, t.nama, t.jenis_kelamin, t.no_hp, toMySQLDate('2024-01-15')]
        );
      }
      tutors.push({ id_tutor: tutorId, ...t });
    }
    console.log(`✔ ${tutors.length} tutors`);

    // ─── Siswa ─────────────────────────────────────────────────
    const siswa = [];
    const siswaData = [
      { username: 'rizky.pratama', nama: 'Rizky Pratama', spp: 550000, no_hp_ortu: '081234500001' },
      { username: 'siti.aminah', nama: 'Siti Aminah', spp: 300000, no_hp_ortu: '081234500002' },
      { username: 'andi.saputra', nama: 'Andi Saputra', spp: 450000, no_hp_ortu: '081234500003' },
      { username: 'aisyah.putri', nama: 'Aisyah Putri', spp: 400000, no_hp_ortu: '081234500004' },
      { username: 'budi.santoso', nama: 'Budi Santoso', spp: 500000, no_hp_ortu: '081234500005' },
      { username: 'citra.dewi', nama: 'Citra Dewi', spp: 350000, no_hp_ortu: '081234500006' },
      { username: 'dimas.ari', nama: 'Dimas Ari', spp: 450000, no_hp_ortu: '081234500007' },
      { username: 'eka.putri', nama: 'Eka Putri', spp: 500000, no_hp_ortu: '081234500008' },
      { username: 'fajar.nugraha', nama: 'Fajar Nugraha', spp: 400000, no_hp_ortu: '081234500009' },
      { username: 'gita.lestari', nama: 'Gita Lestari', spp: 350000, no_hp_ortu: '081234500010' },
      { username: 'hendra.wijaya', nama: 'Hendra Wijaya', spp: 450000, no_hp_ortu: '081234500011' },
      { username: 'intan.permata', nama: 'Intan Permata', spp: 500000, no_hp_ortu: '081234500012' },
    ];

    for (const s of siswaData) {
      let userId = await findUserId(conn, s.username);
      if (!userId) {
        userId = await nextId(conn, 'users', 'id_user');
        await conn.execute(
          'INSERT INTO users (id_user, username, password, role) VALUES (?, ?, ?, ?)',
          [userId, s.username, siswaPassword, 'siswa']
        );
      }
      let siswaId = await findSiswaId(conn, userId);
      if (!siswaId) {
        siswaId = await nextId(conn, 'siswa', 'id_siswa');
        await conn.execute(
          `INSERT INTO siswa (id_siswa, id_user, nama, spp, no_hp_ortu, tanggal_masuk, status)
           VALUES (?, ?, ?, ?, ?, ?, 'Aktif')`,
          [siswaId, userId, s.nama, s.spp, s.no_hp_ortu, toMySQLDate('2024-08-01')]
        );
      }
      siswa.push({ id_siswa: siswaId, ...s });
    }
    console.log(`✔ ${siswa.length} siswa`);

    // ─── Kelas ─────────────────────────────────────────────────
    const kelas = [];
    const kelasData = [
      { nama_kelas: 'Matematika A1', jenjang: 'SMA', id_tutor: tutors[0].id_tutor },
      { nama_kelas: 'Bahasa Inggris B2', jenjang: 'SMA', id_tutor: tutors[1].id_tutor },
      { nama_kelas: 'Fisika C1', jenjang: 'SMA', id_tutor: tutors[2].id_tutor },
      { nama_kelas: 'Bahasa Indonesia D1', jenjang: 'SMP', id_tutor: tutors[3].id_tutor },
    ];

    for (const k of kelasData) {
      let kelasId = await findKelasId(conn, k.nama_kelas);
      if (!kelasId) {
        kelasId = await nextId(conn, 'kelas', 'id_kelas');
        await conn.execute(
          'INSERT INTO kelas (id_kelas, nama_kelas, jenjang, id_tutor) VALUES (?, ?, ?, ?)',
          [kelasId, k.nama_kelas, k.jenjang, k.id_tutor]
        );
      } else {
        await conn.execute(
          'UPDATE kelas SET jenjang = ?, id_tutor = ? WHERE id_kelas = ?',
          [k.jenjang, k.id_tutor, kelasId]
        );
      }
      kelas.push({ id_kelas: kelasId, ...k });
    }
    console.log(`✔ ${kelas.length} kelas`);

    // ─── Jadwal ────────────────────────────────────────────────
    const today = new Date();
    const todayName = HARI_MAP_ID[today.getDay()];

    // Bersihkan jadwal lama supaya "Kelas Hari Ini" selalu tersedia
    await conn.execute('DELETE FROM jadwal');

    const jadwalData = [
      { id_kelas: kelas[0].id_kelas, id_tutor: tutors[0].id_tutor, hari: todayName, jam: '16:00:00' },
      { id_kelas: kelas[1].id_kelas, id_tutor: tutors[1].id_tutor, hari: todayName, jam: '17:00:00' },
      { id_kelas: kelas[2].id_kelas, id_tutor: tutors[2].id_tutor, hari: todayName, jam: '18:00:00' },
      { id_kelas: kelas[0].id_kelas, id_tutor: tutors[0].id_tutor, hari: 'Senin',  jam: '16:00:00' },
      { id_kelas: kelas[1].id_kelas, id_tutor: tutors[1].id_tutor, hari: 'Selasa', jam: '17:00:00' },
      { id_kelas: kelas[2].id_kelas, id_tutor: tutors[2].id_tutor, hari: 'Rabu',   jam: '18:00:00' },
      { id_kelas: kelas[3].id_kelas, id_tutor: tutors[3].id_tutor, hari: 'Kamis',  jam: '19:00:00' },
    ];

    for (const j of jadwalData) {
      const idJadwal = await nextId(conn, 'jadwal', 'id_jadwal');
      await conn.execute(
        'INSERT INTO jadwal (id_jadwal, id_kelas, id_tutor, hari, jam) VALUES (?, ?, ?, ?, ?)',
        [idJadwal, j.id_kelas, j.id_tutor, j.hari, j.jam]
      );
    }
    console.log(`✔ jadwal seeded (hari ini: ${todayName})`);

    // ─── KelasSiswa (enrollment) ───────────────────────────────
    let enrollments = 0;
    for (const s of siswa) {
      for (const k of kelas) {
        const [exists] = await conn.execute(
          'SELECT id_kelas_siswa FROM kelas_siswa WHERE id_siswa = ? AND id_kelas = ? LIMIT 1',
          [s.id_siswa, k.id_kelas]
        );
        if (exists.length === 0) {
          const idKs = await nextId(conn, 'kelas_siswa', 'id_kelas_siswa');
          await conn.execute(
            'INSERT INTO kelas_siswa (id_kelas_siswa, id_siswa, id_kelas) VALUES (?, ?, ?)',
            [idKs, s.id_siswa, k.id_kelas]
          );
          enrollments++;
        }
      }
    }
    console.log(`✔ ${enrollments} enrollments baru`);

    // ─── Absensi Siswa hari ini ───────────────────────────────
    const todayStr = toMySQLDate(today);

    // Hapus absensi hari ini
    await conn.execute('DELETE FROM absensi_siswa WHERE tanggal = ?', [todayStr]);

    const [jadwalHariIniRows] = await conn.execute(
      'SELECT id_jadwal, id_kelas FROM jadwal WHERE hari = ?',
      [todayName]
    );

    const statusAbsensi = ['Hadir', 'Hadir', 'Hadir', 'Tidak Hadir', 'Sakit', 'Izin'];
    let absensiCount = 0;
    for (const j of jadwalHariIniRows) {
      const [enrolled] = await conn.execute(
        'SELECT id_siswa FROM kelas_siswa WHERE id_kelas = ?',
        [j.id_kelas]
      );
      for (const ks of enrolled) {
        const status = statusAbsensi[Math.floor(Math.random() * statusAbsensi.length)];
        const idAbs = await nextId(conn, 'absensi_siswa', 'id_absensi');
        await conn.execute(
          `INSERT INTO absensi_siswa
            (id_absensi, id_siswa, id_jadwal, tanggal, pertemuan, status, is_confirmed)
           VALUES (?, ?, ?, ?, 1, ?, 0)`,
          [idAbs, ks.id_siswa, j.id_jadwal, todayStr, status]
        );
        absensiCount++;
      }
    }
    console.log(`✔ ${absensiCount} absensi siswa hari ini (semua belum dikonfirmasi)`);

    // ─── Pembayaran ───────────────────────────────────────────
    await conn.execute('DELETE FROM pembayaran');

    const currentMonth = `${MONTHS_ID[today.getMonth()]} ${today.getFullYear()}`;
    const todayDateTime = toMySQLDateTime(today);

    // 8 siswa pertama → Pending
    for (let i = 0; i < Math.min(8, siswa.length); i++) {
      const s = siswa[i];
      const idBayar = await nextId(conn, 'pembayaran', 'id_pembayaran');
      const tanggalBayar = toMySQLDateTime(
        new Date(today.getTime() - Math.floor(Math.random() * 5) * 86400000)
      );
      const metode = Math.random() > 0.5 ? 'Transfer' : 'Tunai';
      await conn.execute(
        `INSERT INTO pembayaran
          (id_pembayaran, id_siswa, bulan, tanggal_bayar, jenis_pembayaran, jumlah, metode_pembayaran, diskon, status)
         VALUES (?, ?, ?, ?, 'SPP', ?, ?, 0, 'Pending')`,
        [idBayar, s.id_siswa, currentMonth, tanggalBayar, s.spp, metode]
      );
    }

    // 4 siswa berikutnya → Verified
    for (let i = 8; i < Math.min(12, siswa.length); i++) {
      const s = siswa[i];
      const idBayar = await nextId(conn, 'pembayaran', 'id_pembayaran');
      const tanggalBayar = toMySQLDateTime(
        new Date(today.getTime() - Math.floor(Math.random() * 5) * 86400000)
      );
      await conn.execute(
        `INSERT INTO pembayaran
          (id_pembayaran, id_siswa, bulan, tanggal_bayar, jenis_pembayaran, jumlah, metode_pembayaran, diskon, status, tanggal_verifikasi)
         VALUES (?, ?, ?, ?, 'SPP', ?, 'Transfer', 0, 'Verified', ?)`,
        [idBayar, s.id_siswa, currentMonth, tanggalBayar, s.spp, todayDateTime]
      );
    }
    console.log(`✔ 8 pembayaran Pending, 4 pembayaran Verified`);

    await conn.commit();
    console.log('Seeding finished.');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
