import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_NAME = process.env.DB_NAME || process.env.DB_DATABASE || 'grand3sunggal';
const SCHEMA_PATH = path.join(__dirname, '..', '..', 'schema_bimbeltigasunggal.sql');

const baseConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

const TABLES_IN_DROP_ORDER = [
  'gaji_tutor',
  'absensi_tutor',
  'absensi_siswa',
  'pembayaran',
  'jadwal',
  'kelas_siswa',
  'kelas',
  'tutor',
  'siswa',
  'users',
];

async function main() {
  console.log(`[reset] target database: ${DB_NAME}`);

  // 1) Drop existing tables (in correct order, ignore failures)
  const conn = await mysql.createConnection({
    ...baseConfig,
    database: DB_NAME,
  });
  try {
    console.log('[reset] dropping existing tables (if any)...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of TABLES_IN_DROP_ORDER) {
      try {
        await conn.query(`DROP TABLE IF EXISTS \`${t}\``);
        console.log(`  - dropped ${t}`);
      } catch (e) {
        console.warn(`  ! could not drop ${t}: ${e.message}`);
      }
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    await conn.end();
  }

  // 2) Re-apply schema
  console.log('[reset] re-applying schema...');
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const conn2 = await mysql.createConnection({ ...baseConfig });
  try {
    await conn2.query(sql);
    console.log('[reset] schema applied successfully.');
  } finally {
    await conn2.end();
  }

  console.log('[reset] done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
