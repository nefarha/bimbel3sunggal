-- ============================================================
-- Migration 011: Add NIS (nomor induk siswa) to siswa table
-- ============================================================

ALTER TABLE siswa
  ADD COLUMN nis VARCHAR(30) NULL UNIQUE AFTER id_user;
