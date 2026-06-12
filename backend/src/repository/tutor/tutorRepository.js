import { query, queryOne } from '../../config/query.js';

const TABLE = 'tutor';

const COLUMNS = [
  'id_tutor', 'id_user', 'nama_tutor', 'tempat_lahir', 'tanggal_lahir',
  'jenis_kelamin', 'alamat', 'pendidikan', 'no_hp',
  'tanggal_bergabung', 'status',
];

export class TutorRepository {
  async findAll() {
    return await query(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` ORDER BY id_tutor DESC`
    );
  }

  async findById(id) {
    return await queryOne(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` WHERE id_tutor = ? LIMIT 1`,
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
