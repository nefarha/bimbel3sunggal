import { query, queryOne } from '../../config/query.js';

const TABLE = 'kelas';

const SELECT_COLUMNS = [
  'k.id_kelas',
  'k.nama_kelas',
  'k.id_mapel',
  'm.nama_mapel',
  'k.id_tutor',
  't.nama_tutor',
  '(SELECT COUNT(*) FROM `kelas_siswa` ks WHERE ks.id_kelas = k.id_kelas) AS jumlah_siswa',
];

const FILTER_COLUMN_MAP = {
  id_kelas: 'k.id_kelas',
  id_mapel: 'k.id_mapel',
  id_tutor: 'k.id_tutor',
  nama_kelas: 'k.nama_kelas',
};

export class KelasRepository {
  async findAll(options = {}) {
    const filters = options.where || {};
    const whereKeys = Object.keys(filters).filter((key) => FILTER_COLUMN_MAP[key]);
    const whereSql = whereKeys.length
      ? 'WHERE ' + whereKeys.map((key) => `${FILTER_COLUMN_MAP[key]} = ?`).join(' AND ')
      : '';
    const params = whereKeys.map((k) => filters[k]);

    return await query(
      `SELECT ${SELECT_COLUMNS.join(', ')}
       FROM \`${TABLE}\` k
       LEFT JOIN \`mapel\` m ON m.id_mapel = k.id_mapel
       LEFT JOIN \`tutor\` t ON t.id_tutor = k.id_tutor
       ${whereSql}
       ORDER BY k.id_kelas DESC`,
      params
    );
  }

  async findById(id) {
    return await queryOne(
      `SELECT ${SELECT_COLUMNS.join(', ')}
       FROM \`${TABLE}\` k
       LEFT JOIN \`mapel\` m ON m.id_mapel = k.id_mapel
       LEFT JOIN \`tutor\` t ON t.id_tutor = k.id_tutor
       WHERE k.id_kelas = ?
       LIMIT 1`,
      [id]
    );
  }

  async create(data) {
    const payload = { ...data };
    if (!payload.id_kelas) {
      const maxRow = await queryOne(
        `SELECT COALESCE(MAX(id_kelas), 0) + 1 AS next_id FROM \`${TABLE}\``
      );
      payload.id_kelas = maxRow?.next_id || 1;
    }
    const cols = Object.keys(payload);
    const placeholders = cols.map(() => '?').join(', ');
    const params = cols.map((c) => payload[c]);
    const result = await query(
      `INSERT INTO \`${TABLE}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${placeholders})`,
      params
    );
    return await this.findById(result.insertId || payload.id_kelas);
  }

  async update(id, data) {
    const cols = Object.keys(data);
    if (cols.length === 0) return await this.findById(id);
    const setSql = cols.map((c) => `\`${c}\` = ?`).join(', ');
    const params = [...cols.map((c) => data[c]), id];
    await query(`UPDATE \`${TABLE}\` SET ${setSql} WHERE id_kelas = ?`, params);
    return await this.findById(id);
  }

  async delete(id) {
    await query(`DELETE FROM \`${TABLE}\` WHERE id_kelas = ?`, [id]);
    return { id_kelas: id };
  }
}
