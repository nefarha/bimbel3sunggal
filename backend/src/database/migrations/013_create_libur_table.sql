-- ============================================================
-- Migration 013: Create table libur (holidays)
-- ============================================================

CREATE TABLE IF NOT EXISTS libur (
  id_libur    INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  tanggal     DATE            NOT NULL,
  keterangan  VARCHAR(255)    NOT NULL DEFAULT '',
  created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tanggal (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
