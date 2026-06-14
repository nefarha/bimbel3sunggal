import { query, queryOne } from '../../config/query.js';

const TABLE = 'tutor';

const COLUMNS = [
  'id_tutor', 'id_user', 'nama_tutor', 'tempat_lahir', 'tanggal_lahir',
  'jenis_kelamin', 'alamat', 'pendidikan', 'no_hp',
  'tanggal_bergabung', 'status', 'mapel',
];

export class TutorRepository {
  async findAll(options = {}) {
    const filters = options.where || {};
    const conditions = [];
    const params = [];

    if (filters.status) {
      conditions.push('t.status = ?');
      params.push(filters.status);
    }

    if (filters.search) {
      conditions.push('t.nama_tutor LIKE ?');
      params.push(`%${filters.search}%`);
    }

    if (filters.id_mapel) {
      conditions.push('FIND_IN_SET(?, REPLACE(REPLACE(REPLACE(t.mapel, \'[\', \'\'), \']\', \'\'), \' \', \'\'))');
      params.push(filters.id_mapel);
    }

    if (filters.jenjang) {
      conditions.push('t.id_tutor IN (SELECT id_tutor FROM kelas WHERE nama_kelas = ?)');
      params.push(filters.jenjang);
    }

    const whereSql = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    return await query(
      `SELECT
         t.id_tutor,
         t.id_user,
         u.username,
         t.nama_tutor,
         t.tempat_lahir,
         t.tanggal_lahir,
         t.jenis_kelamin,
         t.alamat,
         t.pendidikan,
         t.no_hp,
         t.tanggal_bergabung,
         t.status,
         COALESCE(
           GROUP_CONCAT(DISTINCT m.nama_mapel ORDER BY m.nama_mapel ASC SEPARATOR ', '),
           t.mapel
         ) AS mapel,
         t.nama_tutor AS nama,
         COALESCE(u.username, CONCAT('TUTOR-', t.id_tutor)) AS nip,
         COALESCE(
           GROUP_CONCAT(
             DISTINCT j.hari
             ORDER BY FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')
             SEPARATOR ', '
           ),
           ''
         ) AS jadwal
       FROM \`${TABLE}\` t
       LEFT JOIN \`users\` u ON u.id_user = t.id_user
       LEFT JOIN \`jadwal\` j ON j.id_tutor = t.id_tutor
       LEFT JOIN \`mapel\` m ON FIND_IN_SET(m.id_mapel, REPLACE(REPLACE(REPLACE(t.mapel, '[', ''), ']', ''), ' ', ''))
       ${whereSql}
       GROUP BY
         t.id_tutor,
         t.id_user,
         u.username,
         t.nama_tutor,
         t.tempat_lahir,
         t.tanggal_lahir,
         t.jenis_kelamin,
         t.alamat,
         t.pendidikan,
         t.no_hp,
         t.tanggal_bergabung,
         t.status,
         t.mapel
       ORDER BY t.id_tutor DESC`,
      params
    );
  }

  async findById(id) {
    return await queryOne(
      `SELECT
         t.id_tutor,
         t.id_user,
         u.username,
         t.nama_tutor,
         t.tempat_lahir,
         t.tanggal_lahir,
         t.jenis_kelamin,
         t.alamat,
         t.pendidikan,
         t.no_hp,
         t.tanggal_bergabung,
         t.status,
         COALESCE(
           GROUP_CONCAT(DISTINCT m.nama_mapel ORDER BY m.nama_mapel ASC SEPARATOR ', '),
           t.mapel
         ) AS mapel,
         t.nama_tutor AS nama,
         COALESCE(u.username, CONCAT('TUTOR-', t.id_tutor)) AS nip,
         COALESCE(
           GROUP_CONCAT(
             DISTINCT j.hari
             ORDER BY FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')
             SEPARATOR ', '
           ),
           ''
         ) AS jadwal
       FROM \`${TABLE}\` t
       LEFT JOIN \`users\` u ON u.id_user = t.id_user
       LEFT JOIN \`jadwal\` j ON j.id_tutor = t.id_tutor
       LEFT JOIN \`mapel\` m ON FIND_IN_SET(m.id_mapel, REPLACE(REPLACE(REPLACE(t.mapel, '[', ''), ']', ''), ' ', ''))
       WHERE t.id_tutor = ?
       GROUP BY
         t.id_tutor,
         t.id_user,
         u.username,
         t.nama_tutor,
         t.tempat_lahir,
         t.tanggal_lahir,
         t.jenis_kelamin,
         t.alamat,
         t.pendidikan,
         t.no_hp,
         t.tanggal_bergabung,
         t.status,
         t.mapel
       LIMIT 1`,
      [id]
    );
  }

  async findByUserId(idUser) {
    return await queryOne(
      `SELECT
         t.id_tutor,
         t.id_user,
         u.username,
         t.nama_tutor,
         t.tempat_lahir,
         t.tanggal_lahir,
         t.jenis_kelamin,
         t.alamat,
         t.pendidikan,
         t.no_hp,
         t.tanggal_bergabung,
         t.status,
         COALESCE(
           GROUP_CONCAT(DISTINCT m.nama_mapel ORDER BY m.nama_mapel ASC SEPARATOR ', '),
           t.mapel
         ) AS mapel,
         t.nama_tutor AS nama,
         COALESCE(u.username, CONCAT('TUTOR-', t.id_tutor)) AS nip,
         COALESCE(
           GROUP_CONCAT(
             DISTINCT j.hari
             ORDER BY FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')
             SEPARATOR ', '
           ),
           ''
         ) AS jadwal
       FROM \`${TABLE}\` t
       LEFT JOIN \`users\` u ON u.id_user = t.id_user
       LEFT JOIN \`jadwal\` j ON j.id_tutor = t.id_tutor
       LEFT JOIN \`mapel\` m ON FIND_IN_SET(m.id_mapel, REPLACE(REPLACE(REPLACE(t.mapel, '[', ''), ']', ''), ' ', ''))
       WHERE t.id_user = ?
       GROUP BY
         t.id_tutor,
         t.id_user,
         u.username,
         t.nama_tutor,
         t.tempat_lahir,
         t.tanggal_lahir,
         t.jenis_kelamin,
         t.alamat,
         t.pendidikan,
         t.no_hp,
         t.tanggal_bergabung,
         t.status,
         t.mapel
       LIMIT 1`,
      [idUser]
    );
  }

  async create(data) {
    const payload = { ...data };
    if (!payload.id_tutor) {
      const maxRow = await queryOne(
        `SELECT COALESCE(MAX(id_tutor), 0) + 1 AS next_id FROM \`${TABLE}\``
      );
      payload.id_tutor = maxRow?.next_id || 1;
    }
    const cols = Object.keys(payload);
    const placeholders = cols.map(() => '?').join(', ');
    const params = cols.map((c) => payload[c]);
    const result = await query(
      `INSERT INTO \`${TABLE}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${placeholders})`,
      params
    );
    return await this.findById(result.insertId || payload.id_tutor);
  }

  async update(id, data) {
    const cols = Object.keys(data);
    if (cols.length === 0) return await this.findById(id);
    const setSql = cols.map((c) => `\`${c}\` = ?`).join(', ');
    const params = [...cols.map((c) => data[c]), id];
    await query(`UPDATE \`${TABLE}\` SET ${setSql} WHERE id_tutor = ?`, params);
    return await this.findById(id);
  }

  async delete(id) {
    await query(`DELETE FROM \`${TABLE}\` WHERE id_tutor = ?`, [id]);
    return { id_tutor: id };
  }
}
