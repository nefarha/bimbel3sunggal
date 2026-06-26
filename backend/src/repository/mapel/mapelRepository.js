import { query, queryOne } from '../../config/query.js';

const TABLE = 'mapel';
const COLUMNS = ['id_mapel', 'nama_mapel'];

export class MapelRepository {
  async findAll() {
    return await query(
      `SELECT ${COLUMNS.map((column) => `\`${column}\``).join(', ')}
       FROM \`${TABLE}\`
       ORDER BY nama_mapel ASC`
    );
  }

  async findById(id) {
    return await queryOne(
      `SELECT ${COLUMNS.map((column) => `\`${column}\``).join(', ')}
       FROM \`${TABLE}\`
       WHERE id_mapel = ?
       LIMIT 1`,
      [id]
    );
  }

  async create(data) {
    const payload = { ...data };
    if (!payload.id_mapel) {
      const maxRow = await queryOne(
        `SELECT COALESCE(MAX(id_mapel), 0) + 1 AS next_id FROM \`${TABLE}\``
      );
      payload.id_mapel = maxRow?.next_id || 1;
    }
    const cols = Object.keys(payload);
    const placeholders = cols.map(() => '?').join(', ');
    const params = cols.map((c) => payload[c]);
    await query(
      `INSERT INTO \`${TABLE}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${placeholders})`,
      params
    );
    return await this.findById(payload.id_mapel);
  }

  async update(id, data) {
    const cols = Object.keys(data);
    if (cols.length === 0) return await this.findById(id);
    const setSql = cols.map((c) => `\`${c}\` = ?`).join(', ');
    const params = [...cols.map((c) => data[c]), id];
    await query(`UPDATE \`${TABLE}\` SET ${setSql} WHERE id_mapel = ?`, params);
    return await this.findById(id);
  }

  async delete(id) {
    await query(`DELETE FROM \`${TABLE}\` WHERE id_mapel = ?`, [id]);
    return { id_mapel: id };
  }
}
