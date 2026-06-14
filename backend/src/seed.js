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

const findMapelId = async (conn, namaMapel) => {
  const [rows] = await conn.execute(
    'SELECT id_mapel FROM mapel WHERE nama_mapel = ? LIMIT 1',
    [namaMapel]
  );
  return rows[0]?.id_mapel || null;
};

const nextId = async (conn, table, pk) => {
  const [rows] = await conn.execute(
    `SELECT COALESCE(MAX(\`${pk}\`), 0) + 1 AS next_id FROM \`${table}\``
  );
  return Number(rows[0]?.next_id) || 1;
};

async function main() {
  console.log('Start seeding...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const tutorPassword = await bcrypt.hash('tutor123', 10);
  const siswaPassword = await bcrypt.hash('siswa123', 10);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

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

    await conn.execute('DELETE FROM absensi_siswa');
    await conn.execute('DELETE FROM kelas_siswa');
    await conn.execute('DELETE FROM jadwal');
    await conn.execute('DELETE FROM kelas');
    await conn.execute('DELETE FROM mapel');

    const mapelData = [
      'SD',
      'SMP',
      'SMA',
      'Calistung',
      'MAFIA',
    ];

    const mapel = [];
    for (const namaMapel of mapelData) {
      const mapelId = await nextId(conn, 'mapel', 'id_mapel');
      await conn.execute(
        'INSERT INTO mapel (id_mapel, nama_mapel) VALUES (?, ?)',
        [mapelId, namaMapel]
      );
      mapel.push({ id_mapel: mapelId, nama_mapel: namaMapel });
    }
    console.log(`✔ ${mapel.length} mapel`);

    const mapelId = (name) => mapel.find((m) => m.nama_mapel === name)?.id_mapel;

    const tutors = [];
    const tutorData = [
      { username: 'budi.setiawan', nama: 'Budi Setiawan', jenis_kelamin: 'L', no_hp: '081234567001', mapel: ['SD', 'SMP'] },
      { username: 'ani.wijaya', nama: 'Ani Wijaya', jenis_kelamin: 'P', no_hp: '081234567002', mapel: ['SMA', 'SD'] },
      { username: 'candra.putra', nama: 'Candra Putra', jenis_kelamin: 'L', no_hp: '081234567003', mapel: ['MAFIA'] },
      { username: 'dewi.lestari', nama: 'Dewi Lestari', jenis_kelamin: 'P', no_hp: '081234567004', mapel: ['Calistung', 'SD'] },
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
        const mapelStr = JSON.stringify(t.mapel.map((name) => mapelId(name)).filter(Boolean));
        await conn.execute(
          `INSERT INTO tutor (id_tutor, id_user, nama_tutor, jenis_kelamin, no_hp, tanggal_bergabung, status, mapel)
           VALUES (?, ?, ?, ?, ?, ?, 'Aktif', ?)`,
          [tutorId, userId, t.nama, t.jenis_kelamin, t.no_hp, toMySQLDate('2024-01-15'), mapelStr]
        );
      }
      tutors.push({ id_tutor: tutorId, ...t });
    }
    console.log(`✔ ${tutors.length} tutors`);

    const siswa = [];
    const siswaData = [
      { username: 'rizky.pratama', nama: 'Rizky Pratama', spp: 550000, no_hp_ortu: '081234500001', mapel: ['SMA', 'MAFIA'] },
      { username: 'siti.aminah', nama: 'Siti Aminah', spp: 300000, no_hp_ortu: '081234500002', mapel: ['SD', 'Calistung'] },
      { username: 'andi.saputra', nama: 'Andi Saputra', spp: 450000, no_hp_ortu: '081234500003', mapel: ['SMP', 'SD'] },
      { username: 'aisyah.putri', nama: 'Aisyah Putri', spp: 400000, no_hp_ortu: '081234500004', mapel: ['SMP'] },
      { username: 'budi.santoso', nama: 'Budi Santoso', spp: 500000, no_hp_ortu: '081234500005', mapel: ['SMA'] },
      { username: 'citra.dewi', nama: 'Citra Dewi', spp: 350000, no_hp_ortu: '081234500006', mapel: ['SD'] },
      { username: 'dimas.ari', nama: 'Dimas Ari', spp: 450000, no_hp_ortu: '081234500007', mapel: ['SMP', 'MAFIA'] },
      { username: 'eka.putri', nama: 'Eka Putri', spp: 500000, no_hp_ortu: '081234500008', mapel: ['SMA', 'SD'] },
      { username: 'fajar.nugraha', nama: 'Fajar Nugraha', spp: 400000, no_hp_ortu: '081234500009', mapel: ['SMP'] },
      { username: 'gita.lestari', nama: 'Gita Lestari', spp: 350000, no_hp_ortu: '081234500010', mapel: ['SD', 'Calistung'] },
      { username: 'hendra.wijaya', nama: 'Hendra Wijaya', spp: 450000, no_hp_ortu: '081234500011', mapel: ['SMP'] },
      { username: 'intan.permata', nama: 'Intan Permata', spp: 500000, no_hp_ortu: '081234500012', mapel: ['SMA', 'MAFIA'] },
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
        const mapelStr = JSON.stringify(s.mapel.map((name) => mapelId(name)).filter(Boolean));
        await conn.execute(
          `INSERT INTO siswa (id_siswa, id_user, nama, spp, no_hp_ortu, tanggal_masuk, status, mapel)
           VALUES (?, ?, ?, ?, ?, ?, 'Aktif', ?)`,
          [siswaId, userId, s.nama, s.spp, s.no_hp_ortu, toMySQLDate('2024-08-01'), mapelStr]
        );
      }
      siswa.push({ id_siswa: siswaId, ...s });
    }
    console.log(`✔ ${siswa.length} siswa`);

    const kelas = [];
    const kelasData = [
      { nama_kelas: 'SD A1', nama_mapel: 'SD', id_tutor: tutors[0].id_tutor },
      { nama_kelas: 'SMP B1', nama_mapel: 'SMP', id_tutor: tutors[1].id_tutor },
      { nama_kelas: 'SMA C1', nama_mapel: 'SMA', id_tutor: tutors[2].id_tutor },
      { nama_kelas: 'Calistung D1', nama_mapel: 'Calistung', id_tutor: tutors[3].id_tutor },
      { nama_kelas: 'MAFIA E1', nama_mapel: 'MAFIA', id_tutor: tutors[2].id_tutor },
    ];

    for (const k of kelasData) {
      let kelasId = await findKelasId(conn, k.nama_kelas);
      const mapelId = await findMapelId(conn, k.nama_mapel);
      if (!kelasId) {
        kelasId = await nextId(conn, 'kelas', 'id_kelas');
        await conn.execute(
          'INSERT INTO kelas (id_kelas, nama_kelas, id_mapel, id_tutor) VALUES (?, ?, ?, ?)',
          [kelasId, k.nama_kelas, mapelId, k.id_tutor]
        );
      } else {
        await conn.execute(
          'UPDATE kelas SET id_mapel = ?, id_tutor = ? WHERE id_kelas = ?',
          [mapelId, k.id_tutor, kelasId]
        );
      }
      kelas.push({ id_kelas: kelasId, id_mapel: mapelId, ...k });
    }
    console.log(`✔ ${kelas.length} kelas`);

    const today = new Date();
    const todayName = HARI_MAP_ID[today.getDay()];

    await conn.execute('DELETE FROM jadwal');

    const jadwalData = [
      { id_kelas: kelas[0].id_kelas, id_tutor: tutors[0].id_tutor, id_mapel: kelas[0].id_mapel, hari: todayName, jam: '14:00:00' },
      { id_kelas: kelas[1].id_kelas, id_tutor: tutors[1].id_tutor, id_mapel: kelas[1].id_mapel, hari: todayName, jam: '15:00:00' },
      { id_kelas: kelas[2].id_kelas, id_tutor: tutors[2].id_tutor, id_mapel: kelas[2].id_mapel, hari: todayName, jam: '16:00:00' },
      { id_kelas: kelas[3].id_kelas, id_tutor: tutors[3].id_tutor, id_mapel: kelas[3].id_mapel, hari: todayName, jam: '17:00:00' },
      { id_kelas: kelas[4].id_kelas, id_tutor: tutors[2].id_tutor, id_mapel: kelas[4].id_mapel, hari: todayName, jam: '18:00:00' },
      { id_kelas: kelas[0].id_kelas, id_tutor: tutors[0].id_tutor, id_mapel: kelas[0].id_mapel, hari: 'Senin',  jam: '14:00:00' },
      { id_kelas: kelas[1].id_kelas, id_tutor: tutors[1].id_tutor, id_mapel: kelas[1].id_mapel, hari: 'Selasa', jam: '15:00:00' },
      { id_kelas: kelas[2].id_kelas, id_tutor: tutors[2].id_tutor, id_mapel: kelas[2].id_mapel, hari: 'Rabu',   jam: '16:00:00' },
      { id_kelas: kelas[3].id_kelas, id_tutor: tutors[3].id_tutor, id_mapel: kelas[3].id_mapel, hari: 'Kamis',  jam: '17:00:00' },
      { id_kelas: kelas[4].id_kelas, id_tutor: tutors[2].id_tutor, id_mapel: kelas[4].id_mapel, hari: 'Jumat',  jam: '18:00:00' },
    ];

    for (const j of jadwalData) {
      const idJadwal = await nextId(conn, 'jadwal', 'id_jadwal');
      await conn.execute(
        'INSERT INTO jadwal (id_jadwal, id_kelas, id_tutor, id_mapel, hari, jam) VALUES (?, ?, ?, ?, ?, ?)',
        [idJadwal, j.id_kelas, j.id_tutor, j.id_mapel, j.hari, j.jam]
      );
    }
    console.log(`✔ jadwal seeded (hari ini: ${todayName})`);

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

    const todayStr = toMySQLDate(today);

    await conn.execute('DELETE FROM absensi_siswa WHERE tanggal = ?', [todayStr]);

    const [jadwalHariIniRows] = await conn.execute(
      'SELECT id_jadwal, id_kelas, id_mapel FROM jadwal WHERE hari = ?',
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
            (id_absensi, id_siswa, id_jadwal, tanggal, pertemuan, status, id_mapel, is_confirmed)
           VALUES (?, ?, ?, ?, 1, ?, ?, 0)`,
          [idAbs, ks.id_siswa, j.id_jadwal, todayStr, status, j.id_mapel]
        );
        absensiCount++;
      }
    }
    console.log(`✔ ${absensiCount} absensi siswa hari ini (semua belum dikonfirmasi)`);

    await conn.execute('DELETE FROM pembayaran');

    const currentMonth = `${MONTHS_ID[today.getMonth()]} ${today.getFullYear()}`;
    const todayDateTime = toMySQLDateTime(today);

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
