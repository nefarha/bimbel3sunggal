import { query, queryOne } from '../../config/query.js';

const TABLE = 'gaji_tutor';

const COLUMNS = [
  'id_gaji', 'id_tutor', 'periode',
  'total_pemasukan', 'potongan', 'bonus', 'total_gaji',
];

export class GajiTutorRepository {
  async findAll() {
    return await query(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` ORDER BY id_gaji DESC`
    );
  }

  async findById(id) {
    return await queryOne(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` WHERE id_gaji = ? LIMIT 1`,
      [id]
    );
  }

  async create(data) {
    const payload = { ...data };
    if (!payload.id_gaji) {
      const maxRow = await queryOne(
        `SELECT COALESCE(MAX(id_gaji), 0) + 1 AS next_id FROM \`${TABLE}\``
      );
      payload.id_gaji = maxRow?.next_id || 1;
    }
    const cols = Object.keys(payload);
    const placeholders = cols.map(() => '?').join(', ');
    const params = cols.map((c) => payload[c]);
    const result = await query(
      `INSERT INTO \`${TABLE}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${placeholders})`,
      params
    );
    return await this.findById(result.insertId || payload.id_gaji);
  }

  async update(id, data) {
    const cols = Object.keys(data);
    if (cols.length === 0) return await this.findById(id);
    const setSql = cols.map((c) => `\`${c}\` = ?`).join(', ');
    const params = [...cols.map((c) => data[c]), id];
    await query(`UPDATE \`${TABLE}\` SET ${setSql} WHERE id_gaji = ?`, params);
    return await this.findById(id);
  }

  async delete(id) {
    await query(`DELETE FROM \`${TABLE}\` WHERE id_gaji = ?`, [id]);
    return { id_gaji: id };
  }
}
