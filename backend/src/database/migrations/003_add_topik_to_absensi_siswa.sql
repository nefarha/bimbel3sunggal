-- ============================================================
-- Migration 003: Add "topik" field to absensi_siswa
-- ============================================================

ALTER TABLE absensi_siswa
  ADD COLUMN topik VARCHAR(255) NULL AFTER id_mapel;
