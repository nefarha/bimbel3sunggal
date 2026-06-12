-- ============================================================
--  Database: grand3sunggal
--  Versi    : 2.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS grand3sunggal
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE grand3sunggal;

-- ------------------------------------------------------------
-- 1. USERS
--    Akun login untuk semua peran (admin, tutor, siswa, pemilik)
-- ------------------------------------------------------------
CREATE TABLE users (
    id_user   INT          AUTO_INCREMENT PRIMARY KEY,
    username  VARCHAR(50)  NOT NULL UNIQUE,
    password  VARCHAR(255) NOT NULL,          -- hash bcrypt / argon2, bukan plain text
    role      ENUM('admin','tutor','siswa','pemilik') NOT NULL
);

-- ------------------------------------------------------------
-- 2. SISWA
-- ------------------------------------------------------------
CREATE TABLE siswa (
    id_siswa        INT          AUTO_INCREMENT PRIMARY KEY,
    id_user         INT          NOT NULL,
    nama            VARCHAR(50)  NOT NULL,
    tempat_lahir    VARCHAR(50),
    tanggal_lahir   DATE,
    jenis_kelamin   VARCHAR(10),
    kelas           VARCHAR(20),
    jenis_kelas     VARCHAR(50),              -- bisa multi-nilai: 'Bimbel SMP, English Course'
    asal_sekolah    VARCHAR(50),
    alamat          TEXT,
    tanggal_masuk   DATE,
    nama_ortu       VARCHAR(50),
    pekerjaan_ortu  VARCHAR(50),
    no_hp_ortu      VARCHAR(15),
    pendidikan_ortu VARCHAR(20),
    spp             BIGINT       DEFAULT 0,   -- nominal bisa > 2 juta, pakai BIGINT
    status          ENUM('Aktif','Nonaktif') DEFAULT 'Aktif',
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 3. TUTOR
-- ------------------------------------------------------------
CREATE TABLE tutor (
    id_tutor           INT          AUTO_INCREMENT PRIMARY KEY,
    id_user            INT          NOT NULL,
    nama_tutor         VARCHAR(50)  NOT NULL,
    tempat_lahir       VARCHAR(50),
    tanggal_lahir      DATE,
    jenis_kelamin      CHAR(1),               -- 'L' | 'P'
    alamat             TEXT,
    pendidikan         VARCHAR(50),
    no_hp              VARCHAR(15),
    tanggal_bergabung  DATE,
    status             ENUM('Aktif','Nonaktif') DEFAULT 'Aktif',
    FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 4. KELAS
-- ------------------------------------------------------------
CREATE TABLE kelas (
    id_kelas    INT          AUTO_INCREMENT PRIMARY KEY,
    nama_kelas  VARCHAR(50)  NOT NULL,
    jenjang     VARCHAR(20),                  -- 'SD' | 'SMP' | 'SMA' | 'Calistung' | 'Mafia'
    id_tutor    INT,                          
    FOREIGN KEY (id_tutor) REFERENCES tutor(id_tutor) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- 5. KELAS_SISWA  (relasi many-to-many siswa ↔ kelas)
-- ------------------------------------------------------------
CREATE TABLE kelas_siswa (
    id_kelas_siswa  INT  AUTO_INCREMENT PRIMARY KEY,
    id_siswa        INT  NOT NULL,
    id_kelas        INT  NOT NULL,
    FOREIGN KEY (id_siswa) REFERENCES siswa(id_siswa)   ON DELETE CASCADE,
    FOREIGN KEY (id_kelas) REFERENCES kelas(id_kelas)   ON DELETE CASCADE,
    UNIQUE KEY uq_kelas_siswa (id_siswa, id_kelas)      -- cegah duplikasi
);

-- ------------------------------------------------------------
-- 6. JADWAL
-- ------------------------------------------------------------
CREATE TABLE jadwal (
    id_jadwal   INT          AUTO_INCREMENT PRIMARY KEY,
    id_kelas    INT          NOT NULL,
    id_tutor    INT          NOT NULL,
    hari        ENUM('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu') NOT NULL,
    jam         TIME         NOT NULL,
    FOREIGN KEY (id_kelas)  REFERENCES kelas(id_kelas)  ON DELETE CASCADE,
    FOREIGN KEY (id_tutor)  REFERENCES tutor(id_tutor)  ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 7. PEMBAYARAN
-- ------------------------------------------------------------
CREATE TABLE pembayaran (
    id_pembayaran      INT          AUTO_INCREMENT PRIMARY KEY,
    id_siswa           INT          NOT NULL,
    bulan              VARCHAR(20),           -- ex: 'Januari 2026'
    tanggal_bayar      DATE         NOT NULL,
    jenis_pembayaran   VARCHAR(20),           -- 'SPP' | 'Modul' | 'Buku'
    jumlah             BIGINT       DEFAULT 0,
    metode_pembayaran  ENUM('Tunai','Transfer'),           -- 'Tunai' | 'Transfer'
    diskon             BIGINT       DEFAULT 0,
    status             ENUM('Pending','Verified','Rejected') DEFAULT 'Pending',  -- 'Pending' | 'Verified' | 'Rejected'
    tanggal_verifikasi DATE,
    catatan            TEXT,
    FOREIGN KEY (id_siswa) REFERENCES siswa(id_siswa) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 8. ABSENSI_SISWA
-- ------------------------------------------------------------
CREATE TABLE absensi_siswa (
    id_absensi          INT          AUTO_INCREMENT PRIMARY KEY,
    id_siswa            INT          NOT NULL,
    id_jadwal           INT          NOT NULL,
    tanggal             DATE         NOT NULL,
    pertemuan          INT          DEFAULT 1,
    status              ENUM('Hadir','Tidak Hadir','Sakit','Izin') NOT NULL,  -- 'Hadir' | 'Tidak Hadir' | 'Sakit' | 'Izin'
    topik_pembelajaran  TEXT,
    is_confirmed        TINYINT(1)   DEFAULT 0,  -- 0 = belum dikonfirmasi, 1 = sudah
    confirmed_at        DATE,
    confirmed_by        INT,
    FOREIGN KEY (id_siswa)  REFERENCES siswa(id_siswa)   ON DELETE CASCADE,
    FOREIGN KEY (id_jadwal) REFERENCES jadwal(id_jadwal) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 9. ABSENSI_TUTOR
-- ------------------------------------------------------------
CREATE TABLE absensi_tutor (
    id_absensi_tutor  INT          AUTO_INCREMENT PRIMARY KEY,  
    id_tutor          INT          NOT NULL,
    tanggal           DATE         NOT NULL,
    status            ENUM('Hadir','Absen') NOT NULL,   -- 'Hadir' | 'Absen'
    FOREIGN KEY (id_tutor) REFERENCES tutor(id_tutor) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 10. GAJI_TUTOR
--     total_pemasukan = 40% SPP seluruh siswa yang diajar
--     potongan        = 5% per hari absen
--     bonus           = infal (15.000/pertemuan) + kelas Inggris (12.500/pertemuan)
-- ------------------------------------------------------------
CREATE TABLE gaji_tutor (
    id_gaji           INT          AUTO_INCREMENT PRIMARY KEY,
    id_tutor          INT          NOT NULL,
    periode           VARCHAR(20)  NOT NULL,   
    total_pemasukan   BIGINT       DEFAULT 0,  
    potongan          BIGINT       DEFAULT 0,
    bonus             BIGINT       DEFAULT 0,
    total_gaji        BIGINT       DEFAULT 0,
    FOREIGN KEY (id_tutor) REFERENCES tutor(id_tutor) ON DELETE CASCADE  
);
