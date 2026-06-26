-- ============================================================
-- Migration 010: Add NIK (nomor induk kependudukan) to tutor
-- ============================================================

ALTER TABLE tutor
  ADD COLUMN nik VARCHAR(20) NULL UNIQUE AFTER id_user;

-- Isi NIK dummy untuk data existing (optional — hanya jika ada data)
-- UPDATE tutor SET nik = CONCAT('NIK-', id_tutor) WHERE nik IS NULL;
