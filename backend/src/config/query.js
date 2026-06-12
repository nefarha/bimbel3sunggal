import pool from './database.js';

/**
 * Convert BigInt → Number when safe, otherwise keep as string.
 * Strips Buffer/Date wrappers that mysql2 may return.
 */
const normalizeValue = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') {
    if (value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER) {
      return Number(value);
    }
    return value.toString();
  }
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8');
  }
  return value;
};

const normalizeRow = (row) => {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = normalizeValue(value);
  }
  return out;
};

/**
 * Execute a parameterized query and return normalized rows.
 */
export const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return Array.isArray(rows) ? rows.map(normalizeRow) : rows;
};

/**
 * Execute a query and return the first row (or null).
 */
export const queryOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows[0] || null;
};

/**
 * Execute a query and return a single scalar value (first column of first row).
 */
export const queryScalar = async (sql, params = []) => {
  const row = await queryOne(sql, params);
  if (!row) return null;
  const keys = Object.keys(row);
  return keys.length > 0 ? row[keys[0]] : null;
};

/**
 * Build WHERE clause fragments from a plain object of column → value pairs.
 * Returns { sql, params } where sql is a string like "col1 = ? AND col2 = ?"
 * Empty input returns { sql: '', params: [] }.
 */
export const buildWhere = (filters = {}) => {
  const keys = Object.keys(filters).filter((k) => filters[k] !== undefined && filters[k] !== null);
  if (keys.length === 0) return { sql: '', params: [] };
  const sql = keys.map((k) => `\`${k}\` = ?`).join(' AND ');
  const params = keys.map((k) => filters[k]);
  return { sql, params };
};

export default {
  query,
  queryOne,
  queryScalar,
  buildWhere,
};
