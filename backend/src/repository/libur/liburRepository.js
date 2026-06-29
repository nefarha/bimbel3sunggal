import { query, queryOne } from '../../config/query.js';

const TABLE = 'libur';
const COLUMNS = ['id_libur', 'tanggal', 'keterangan'];
const COLUMNS_SQL = COLUMNS.map((c) => `\`${c}\``).join(', ');

export class LiburRepository {
  async findByMonth(tahun, bulan) {
    return await query(
      `SELECT ${COLUMNS_SQL}
       FROM \`${TABLE}\`
       WHERE YEAR(tanggal) = ? AND MONTH(tanggal) = ?
       ORDER BY tanggal ASC`,
      [tahun, bulan]
    );
  }

  async findAll() {
    return await query(
      `SELECT ${COLUMNS_SQL}
       FROM \`${TABLE}\`
       ORDER BY tanggal DESC`
    );
  }

  async findById(id) {
    return await queryOne(
      `SELECT ${COLUMNS_SQL}
       FROM \`${TABLE}\`
       WHERE id_libur = ?
       LIMIT 1`,
      [id]
    );
  }

  async create(data) {
    const payload = { ...data };
    if (!payload.id_libur) {
      const maxRow = await queryOne(
        `SELECT COALESCE(MAX(id_libur), 0) + 1 AS next_id FROM \`${TABLE}\``
      );
      payload.id_libur = maxRow?.next_id || 1;
    }
    const cols = Object.keys(payload);
    const placeholders = cols.map(() => '?').join(', ');
    const params = cols.map((c) => payload[c]);
    await query(
      `INSERT INTO \`${TABLE}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${placeholders})`,
      params
    );
    return await this.findById(payload.id_libur);
  }

  async update(id, data) {
    const cols = Object.keys(data);
    if (cols.length === 0) return await this.findById(id);
    const setSql = cols.map((c) => `\`${c}\` = ?`).join(', ');
    const params = [...cols.map((c) => data[c]), id];
    await query(`UPDATE \`${TABLE}\` SET ${setSql} WHERE id_libur = ?`, params);
    return await this.findById(id);
  }

  async delete(id) {
    await query(`DELETE FROM \`${TABLE}\` WHERE id_libur = ?`, [id]);
    return { id_libur: id };
  }
}
