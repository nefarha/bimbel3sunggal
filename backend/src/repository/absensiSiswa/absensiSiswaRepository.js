import { query, queryOne } from '../../config/query.js';

const TABLE = 'absensi_siswa';

const COLUMNS = [
  'id_absensi', 'id_siswa', 'id_jadwal', 'tanggal', 'pertemuan',
  'status', 'id_mapel', 'is_confirmed', 'confirmed_at', 'confirmed_by',
];


const buildAbsensiWhere = (filters = {}) => {
  const conditions = [];
  const params = [];

  if (filters.tanggal !== undefined) {
    if (filters.tanggal && typeof filters.tanggal === 'object' && ('gte' in filters.tanggal || 'lte' in filters.tanggal)) {
      if (filters.tanggal.gte !== undefined) {
        conditions.push('a.`tanggal` >= ?');
        params.push(filters.tanggal.gte);
      }
      if (filters.tanggal.lte !== undefined) {
        conditions.push('a.`tanggal` <= ?');
        params.push(filters.tanggal.lte);
      }
    } else {
      conditions.push('a.`tanggal` = ?');
      params.push(filters.tanggal);
    }
  }
  if (filters.id_siswa !== undefined) {
    conditions.push('a.`id_siswa` = ?');
    params.push(filters.id_siswa);
  }
  if (filters.id_jadwal !== undefined) {
    conditions.push('a.`id_jadwal` = ?');
    params.push(filters.id_jadwal);
  }
  if (filters.is_confirmed !== undefined) {
    conditions.push('a.`is_confirmed` = ?');
    params.push(filters.is_confirmed ? 1 : 0);
  }
  if (filters.status !== undefined) {
    conditions.push('a.`status` = ?');
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
      `SELECT
         a.id_absensi,
         a.id_siswa,
         a.id_jadwal,
         a.tanggal,
         a.pertemuan,
         a.status,
         a.id_mapel,
         a.is_confirmed,
         a.confirmed_at,
         a.confirmed_by,
         s.nama AS nama_siswa,
         m.nama_mapel,
         k.nama_kelas
       FROM \`${TABLE}\` a
       INNER JOIN \`siswa\` s ON s.id_siswa = a.id_siswa
       INNER JOIN \`jadwal\` j ON j.id_jadwal = a.id_jadwal
       INNER JOIN \`kelas\` k ON k.id_kelas = j.id_kelas
       LEFT JOIN \`mapel\` m ON m.id_mapel = a.id_mapel
       ${whereSql}
       ORDER BY a.id_absensi DESC`,
      params
    );
  }

  async findById(id) {
    return await queryOne(
      `SELECT
         a.id_absensi,
         a.id_siswa,
         a.id_jadwal,
         a.tanggal,
         a.pertemuan,
         a.status,
         a.id_mapel,
         a.is_confirmed,
         a.confirmed_at,
         a.confirmed_by,
         s.nama AS nama_siswa,
         m.nama_mapel,
         k.nama_kelas
       FROM \`${TABLE}\` a
       INNER JOIN \`siswa\` s ON s.id_siswa = a.id_siswa
       INNER JOIN \`jadwal\` j ON j.id_jadwal = a.id_jadwal
       INNER JOIN \`kelas\` k ON k.id_kelas = j.id_kelas
       LEFT JOIN \`mapel\` m ON m.id_mapel = a.id_mapel
       WHERE a.id_absensi = ?
       LIMIT 1`,
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

  async bulkUpsert(items) {
    const results = [];
    for (const item of items) {
      const existing = await queryOne(
        `SELECT id_absensi FROM \`${TABLE}\` WHERE id_siswa = ? AND id_jadwal = ? AND tanggal = ? LIMIT 1`,
        [item.id_siswa, item.id_jadwal, item.tanggal]
      );
      if (existing) {
        const updated = await this.update(existing.id_absensi, { status: item.status, id_mapel: item.id_mapel });
        results.push(updated);
      } else {
        const created = await this.create(item);
        results.push(created);
      }
    }
    return results;
  }
}
