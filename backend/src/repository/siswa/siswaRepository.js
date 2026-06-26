import { query, queryOne } from '../../config/query.js';

const TABLE = 'siswa';

const COLUMNS = [
  'id_siswa', 'id_user', 'nis', 'nama', 'tempat_lahir', 'tanggal_lahir',
  'jenis_kelamin', 'kelas', 'mapel', 'asal_sekolah', 'alamat',
  'tanggal_masuk', 'nama_ortu', 'pekerjaan_ortu', 'no_hp_ortu',
  'pendidikan_ortu', 'spp', 'status',
];

export class SiswaRepository {
  async findAll(options = {}) {
    const filters = options.where || {};
    const whereKeys = Object.keys(filters);
    const whereSql = whereKeys.length
      ? 'WHERE ' + whereKeys.map((k) => `\`${k}\` = ?`).join(' AND ')
      : '';
    const params = whereKeys.map((k) => filters[k]);

    return await query(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` ${whereSql} ORDER BY id_siswa DESC`,
      params
    );
  }

  async findById(id) {
    return await queryOne(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` WHERE id_siswa = ? LIMIT 1`,
      [id]
    );
  }

  async create(data) {
    const payload = { ...data };

    if (!payload.id_siswa) {
      const maxRow = await queryOne(
        `SELECT COALESCE(MAX(id_siswa), 0) + 1 AS next_id FROM \`${TABLE}\``
      );
      payload.id_siswa = maxRow?.next_id || 1;
    }
    const cols = Object.keys(payload);
    const placeholders = cols.map(() => '?').join(', ');
    const params = cols.map((c) => payload[c]);
    const result = await query(
      `INSERT INTO \`${TABLE}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${placeholders})`,
      params
    );
    return await this.findById(result.insertId || payload.id_siswa);
  }

  async update(id, data) {
    const cols = Object.keys(data);
    if (cols.length === 0) return await this.findById(id);
    const setSql = cols.map((c) => `\`${c}\` = ?`).join(', ');
    const params = [...cols.map((c) => data[c]), id];
    await query(`UPDATE \`${TABLE}\` SET ${setSql} WHERE id_siswa = ?`, params);
    return await this.findById(id);
  }

  async findByUserId(idUser) {
    return await queryOne(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` WHERE id_user = ? LIMIT 1`,
      [idUser]
    );
  }

  async findByKelas(id_kelas) {
    return await query(
      `SELECT s.id_siswa, s.nama, s.nama_ortu, s.no_hp_ortu, s.status
       FROM \`${TABLE}\` s
       INNER JOIN \`kelas_siswa\` ks ON ks.id_siswa = s.id_siswa
       WHERE ks.id_kelas = ?
       ORDER BY s.nama ASC`,
      [id_kelas]
    );
  }

  async delete(id) {
    await query(`DELETE FROM \`${TABLE}\` WHERE id_siswa = ?`, [id]);
    return { id_siswa: id };
  }
}
