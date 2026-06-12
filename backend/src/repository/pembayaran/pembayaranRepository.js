import { query, queryOne } from '../../config/query.js';

const TABLE = 'pembayaran';

const COLUMNS = [
  'id_pembayaran', 'id_siswa', 'bulan', 'tanggal_bayar', 'jenis_pembayaran',
  'jumlah', 'metode_pembayaran', 'diskon',
  'status', 'tanggal_verifikasi', 'catatan',
];

const toDate = (value) => {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  return new Date(value);
};

export class PembayaranRepository {
  async findAll(options = {}) {
    const filters = options.where || {};
    const whereKeys = Object.keys(filters);
    const whereSql = whereKeys.length
      ? 'WHERE ' + whereKeys.map((k) => `\`${k}\` = ?`).join(' AND ')
      : '';
    const params = whereKeys.map((k) => filters[k]);

    return await query(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` ${whereSql} ORDER BY id_pembayaran DESC`,
      params
    );
  }

  async findById(id) {
    return await queryOne(
      `SELECT ${COLUMNS.map((c) => `\`${c}\``).join(', ')} FROM \`${TABLE}\` WHERE id_pembayaran = ? LIMIT 1`,
      [id]
    );
  }

  async create(data) {
    const payload = { ...data };
    if (payload.tanggal_bayar) payload.tanggal_bayar = toDate(payload.tanggal_bayar);
    if (payload.tanggal_verifikasi) payload.tanggal_verifikasi = toDate(payload.tanggal_verifikasi);
    if (payload.status === undefined) payload.status = 'Pending';
    if (!payload.id_pembayaran) {
      const maxRow = await queryOne(
        `SELECT COALESCE(MAX(id_pembayaran), 0) + 1 AS next_id FROM \`${TABLE}\``
      );
      payload.id_pembayaran = maxRow?.next_id || 1;
    }
    const cols = Object.keys(payload);
    const placeholders = cols.map(() => '?').join(', ');
    const params = cols.map((c) => payload[c]);
    const result = await query(
      `INSERT INTO \`${TABLE}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${placeholders})`,
      params
    );
    return await this.findById(result.insertId || payload.id_pembayaran);
  }

  async update(id, data) {
    const payload = { ...data };
    if (payload.tanggal_bayar) payload.tanggal_bayar = toDate(payload.tanggal_bayar);
    if (payload.tanggal_verifikasi) payload.tanggal_verifikasi = toDate(payload.tanggal_verifikasi);

    const cols = Object.keys(payload);
    if (cols.length === 0) return await this.findById(id);
    const setSql = cols.map((c) => `\`${c}\` = ?`).join(', ');
    const params = [...cols.map((c) => payload[c]), id];
    await query(`UPDATE \`${TABLE}\` SET ${setSql} WHERE id_pembayaran = ?`, params);
    return await this.findById(id);
  }

  async delete(id) {
    await query(`DELETE FROM \`${TABLE}\` WHERE id_pembayaran = ?`, [id]);
    return { id_pembayaran: id };
  }
}
