-- ============================================================
-- Migration 004: Change siswa.mapel to TEXT for JSON array of IDs
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Ubah kolom mapel dari VARCHAR(255) menjadi TEXT
-- agar bisa menyimpan JSON array of IDs seperti "[1,2,3]"
ALTER TABLE siswa MODIFY COLUMN mapel TEXT NULL;

SET FOREIGN_KEY_CHECKS = 1;
