import { query, queryOne } from '../../config/query.js';

const TABLE = 'tutor';

const COLUMNS = [
  'id_tutor', 'id_user', 'nama_tutor', 'tempat_lahir', 'tanggal_lahir',
  'jenis_kelamin', 'alamat', 'pendidikan', 'no_hp',
  'tanggal_bergabung', 'status',
];

export class TutorRepository {
  async findAll(options = {}) {
    const filters = options.where || {};
    const whereSql = filters.status ? 'WHERE t.status = ?' : '';
    const params = filters.status ? [filters.status] : [];

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
         t.nama_tutor AS nama,
         COALESCE(u.username, CONCAT('TUTOR-', t.id_tutor)) AS nip,
         COALESCE(
           GROUP_CONCAT(DISTINCT k.nama_kelas ORDER BY k.nama_kelas SEPARATOR ', '),
           ''
         ) AS mapel,
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
       LEFT JOIN \`kelas\` k ON k.id_tutor = t.id_tutor
       LEFT JOIN \`jadwal\` j ON j.id_tutor = t.id_tutor
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
         t.status
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
         t.nama_tutor AS nama,
         COALESCE(u.username, CONCAT('TUTOR-', t.id_tutor)) AS nip,
         COALESCE(
           GROUP_CONCAT(DISTINCT k.nama_kelas ORDER BY k.nama_kelas SEPARATOR ', '),
           ''
         ) AS mapel,
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
       LEFT JOIN \`kelas\` k ON k.id_tutor = t.id_tutor
       LEFT JOIN \`jadwal\` j ON j.id_tutor = t.id_tutor
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
         t.status
       LIMIT 1`,
      [id]
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
