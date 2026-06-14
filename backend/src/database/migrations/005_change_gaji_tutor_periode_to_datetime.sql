-- ============================================================
-- Migration 005: Change gaji_tutor.periode from VARCHAR to DATETIME
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Ubah kolom periode dari VARCHAR(20) menjadi DATETIME
-- Konversi data existing: format "Januari 2026" -> "2026-01-01 00:00:00"
-- (menggunakan DAY 01 sebagai default karena periode hanya menyimpan bulan+tahun)

-- Step 1: Tambah kolom baru dengan tipe DATETIME
ALTER TABLE gaji_tutor ADD COLUMN periode_baru DATETIME NULL AFTER id_tutor;

-- Step 2: Konversi data existing (format: "Bulan YYYY" -> "YYYY-MM-DD 00:00:00")
UPDATE gaji_tutor
SET periode_baru = STR_TO_DATE(
  CONCAT(
    CASE
      WHEN periode LIKE 'Januari%'   THEN '01'
      WHEN periode LIKE 'Februari%'  THEN '02'
      WHEN periode LIKE 'Maret%'     THEN '03'
      WHEN periode LIKE 'April%'     THEN '04'
      WHEN periode LIKE 'Mei%'       THEN '05'
      WHEN periode LIKE 'Juni%'      THEN '06'
      WHEN periode LIKE 'Juli%'      THEN '07'
      WHEN periode LIKE 'Agustus%'   THEN '08'
      WHEN periode LIKE 'September%' THEN '09'
      WHEN periode LIKE 'Oktober%'   THEN '10'
      WHEN periode LIKE 'November%'  THEN '11'
      WHEN periode LIKE 'Desember%'  THEN '12'
    END,
    '/01/',
    SUBSTRING_INDEX(periode, ' ', -1)
  ),
  '%m/%d/%Y'
);

-- Step 3: Hapus kolom lama dan rename kolom baru
ALTER TABLE gaji_tutor DROP COLUMN periode;
ALTER TABLE gaji_tutor CHANGE COLUMN periode_baru periode DATETIME NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;
