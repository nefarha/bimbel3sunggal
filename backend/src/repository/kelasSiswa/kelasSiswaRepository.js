import { query, queryOne } from '../../config/query.js';

const TABLE = 'kelas_siswa';

const COLUMNS = ['id_kelas_siswa', 'id_siswa', 'id_kelas'];

export class KelasSiswaRepository {
  async findAll() {
    return await query(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` ORDER BY id_kelas_siswa DESC`
    );
  }

  async findById(id) {
    return await queryOne(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` WHERE id_kelas_siswa = ? LIMIT 1`,
      [id]
    );
  }

  async findBySiswaId(idSiswa) {
    return await query(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` WHERE id_siswa = ?`,
      [idSiswa]
    );
  }

  async deleteBySiswaId(idSiswa) {
    await query(`DELETE FROM \`${TABLE}\` WHERE id_siswa = ?`, [idSiswa]);
    return { id_siswa: idSiswa };
  }

  async create(data) {
    const payload = { ...data };
    if (!payload.id_kelas_siswa) {
      const maxRow = await queryOne(
        `SELECT COALESCE(MAX(id_kelas_siswa), 0) + 1 AS next_id FROM \`${TABLE}\``
      );
      payload.id_kelas_siswa = maxRow?.next_id || 1;
    }
    const cols = Object.keys(payload);
    const placeholders = cols.map(() => '?').join(', ');
    const params = cols.map((c) => payload[c]);
    const result = await query(
      `INSERT INTO \`${TABLE}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${placeholders})`,
      params
    );
    return await this.findById(result.insertId || payload.id_kelas_siswa);
  }

  async update(id, data) {
    const cols = Object.keys(data);
    if (cols.length === 0) return await this.findById(id);
    const setSql = cols.map((c) => `\`${c}\` = ?`).join(', ');
    const params = [...cols.map((c) => data[c]), id];
    await query(`UPDATE \`${TABLE}\` SET ${setSql} WHERE id_kelas_siswa = ?`, params);
    return await this.findById(id);
  }

  async delete(id) {
    await query(`DELETE FROM \`${TABLE}\` WHERE id_kelas_siswa = ?`, [id]);
    return { id_kelas_siswa: id };
  }
}
