import { query, queryOne } from '../../config/query.js';

const TABLE = 'jadwal';

const COLUMNS = ['id_jadwal', 'id_kelas', 'id_tutor', 'hari', 'jam'];

export class JadwalRepository {
  async findAll(options = {}) {
    const filters = options.where || {};
    const whereKeys = Object.keys(filters);
    const whereSql = whereKeys.length
      ? 'WHERE ' + whereKeys.map((k) => `\`${k}\` = ?`).join(' AND ')
      : '';
    const params = whereKeys.map((k) => filters[k]);

    return await query(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` ${whereSql} ORDER BY id_jadwal DESC`,
      params
    );
  }

  async findById(id) {
    return await queryOne(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` WHERE id_jadwal = ? LIMIT 1`,
      [id]
    );
  }

  async create(data) {
    const payload = { ...data };
    if (!payload.id_jadwal) {
      const maxRow = await queryOne(
        `SELECT COALESCE(MAX(id_jadwal), 0) + 1 AS next_id FROM \`${TABLE}\``
      );
      payload.id_jadwal = maxRow?.next_id || 1;
    }
    const cols = Object.keys(payload);
    const placeholders = cols.map(() => '?').join(', ');
    const params = cols.map((c) => payload[c]);
    const result = await query(
      `INSERT INTO \`${TABLE}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${placeholders})`,
      params
    );
    return await this.findById(result.insertId || payload.id_jadwal);
  }

  async update(id, data) {
    const cols = Object.keys(data);
    if (cols.length === 0) return await this.findById(id);
    const setSql = cols.map((c) => `\`${c}\` = ?`).join(', ');
    const params = [...cols.map((c) => data[c]), id];
    await query(`UPDATE \`${TABLE}\` SET ${setSql} WHERE id_jadwal = ?`, params);
    return await this.findById(id);
  }

  async delete(id) {
    await query(`DELETE FROM \`${TABLE}\` WHERE id_jadwal = ?`, [id]);
    return { id_jadwal: id };
  }
}
