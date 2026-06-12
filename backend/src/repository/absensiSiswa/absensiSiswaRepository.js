import { query, queryOne } from '../../config/query.js';

const TABLE = 'absensi_siswa';

const COLUMNS = [
  'id_absensi', 'id_siswa', 'id_jadwal', 'tanggal', 'pertemuan',
  'status', 'topik_pembelajaran', 'is_confirmed', 'confirmed_at', 'confirmed_by',
];

/**
 * Bangun WHERE clause + params untuk filter absensi.
 * Mendukung filter tanggal sebagai { gte, lte } (Date object) atau exact string/Date.
 */
const buildAbsensiWhere = (filters = {}) => {
  const conditions = [];
  const params = [];

  if (filters.tanggal !== undefined) {
    if (filters.tanggal && typeof filters.tanggal === 'object' && ('gte' in filters.tanggal || 'lte' in filters.tanggal)) {
      if (filters.tanggal.gte !== undefined) {
        conditions.push('`tanggal` >= ?');
        params.push(filters.tanggal.gte);
      }
      if (filters.tanggal.lte !== undefined) {
        conditions.push('`tanggal` <= ?');
        params.push(filters.tanggal.lte);
      }
    } else {
      conditions.push('`tanggal` = ?');
      params.push(filters.tanggal);
    }
  }
  if (filters.id_siswa !== undefined) {
    conditions.push('`id_siswa` = ?');
    params.push(filters.id_siswa);
  }
  if (filters.id_jadwal !== undefined) {
    conditions.push('`id_jadwal` = ?');
    params.push(filters.id_jadwal);
  }
  if (filters.is_confirmed !== undefined) {
    conditions.push('`is_confirmed` = ?');
    params.push(filters.is_confirmed ? 1 : 0);
  }
  if (filters.status !== undefined) {
    conditions.push('`status` = ?');
    params.push(filters.status);
  }

  return {
    sql: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '',
    params,
  };
};

const toDate = (value) => {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  return new Date(value);
};

export class AbsensiSiswaRepository {
  async findAll(options = {}) {
    const { sql: whereSql, params } = buildAbsensiWhere(options.where || {});
    return await query(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` ${whereSql} ORDER BY id_absensi DESC`,
      params
    );
  }

  async findById(id) {
    return await queryOne(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` WHERE id_absensi = ? LIMIT 1`,
      [id]
    );
  }

  async create(data) {
    const payload = { ...data };
    if (payload.tanggal) payload.tanggal = toDate(payload.tanggal);
    if (payload.confirmed_at) payload.confirmed_at = toDate(payload.confirmed_at);
    if (payload.is_confirmed === undefined) payload.is_confirmed = false;
    if (!payload.id_absensi) {
      const maxRow = await queryOne(
        `SELECT COALESCE(MAX(id_absensi), 0) + 1 AS next_id FROM \`${TABLE}\``
      );
      payload.id_absensi = maxRow?.next_id || 1;
    }
    const cols = Object.keys(payload);
    const placeholders = cols.map(() => '?').join(', ');
    const params = cols.map((c) => payload[c]);
    const result = await query(
      `INSERT INTO \`${TABLE}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${placeholders})`,
      params
    );
    return await this.findById(result.insertId || payload.id_absensi);
  }

  async update(id, data) {
    const payload = { ...data };
    if (payload.tanggal) payload.tanggal = toDate(payload.tanggal);
    if (payload.confirmed_at) payload.confirmed_at = toDate(payload.confirmed_at);

    const cols = Object.keys(payload);
    if (cols.length === 0) return await this.findById(id);
    const setSql = cols.map((c) => `\`${c}\` = ?`).join(', ');
    const params = [...cols.map((c) => payload[c]), id];
    await query(`UPDATE \`${TABLE}\` SET ${setSql} WHERE id_absensi = ?`, params);
    return await this.findById(id);
  }

  async delete(id) {
    await query(`DELETE FROM \`${TABLE}\` WHERE id_absensi = ?`, [id]);
    return { id_absensi: id };
  }
}
