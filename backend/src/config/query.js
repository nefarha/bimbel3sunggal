import pool from './database.js';


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


export const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return Array.isArray(rows) ? rows.map(normalizeRow) : rows;
};


export const queryOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows[0] || null;
};


export const queryScalar = async (sql, params = []) => {
  const row = await queryOne(sql, params);
  if (!row) return null;
  const keys = Object.keys(row);
  return keys.length > 0 ? row[keys[0]] : null;
};


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
