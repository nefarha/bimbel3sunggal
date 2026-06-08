import React from 'react';
import styles from './Berita.module.css';

// SVG Icons
const CalendarIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const UserIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const DocumentIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    <path d="M9 14h6"></path>
    <path d="M9 10h6"></path>
    <path d="M9 18h6"></path>
  </svg>
);

const CheckCircleIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const ClockIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const SearchIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

function Berita() {
  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        
        {/* Kolom Kiri: Konten Utama */}
        <div className={styles.mainContent}>
          <div className={styles.articleCard}>
            
            <div className={styles.articleMeta}>
              <span className={styles.metaItem}>
                <CalendarIcon /> 21 Februari 2026
              </span>
              <span className={styles.metaDivider}>|</span>
              <span className={styles.metaItem}>
                <UserIcon /> Oleh: Admin
              </span>
            </div>

            <h1 className={styles.articleTitle}>
              Pendaftaran Kursus Baru Telah Dibuka
            </h1>

            <img 
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              alt="Suasana Kelas" 
              className={styles.articleImage}
            />

            <div className={styles.articleBody}>
              <p>
                Kami dengan bangga mengumumkan bahwa pendaftaran untuk periode akademik baru di Grand Tiga Sunggal kini resmi dibuka. Sebagai pusat bimbingan belajar yang berkomitmen pada kualitas pendidikan, kami menghadirkan berbagai program unggulan yang dirancang untuk membantu siswa mencapai potensi akademik maksimal mereka.
              </p>
              <p>
                Program kursus kami mencakup bimbingan intensif untuk mata pelajaran utama, persiapan ujian nasional, hingga program khusus pengembangan logika dan kreativitas. Dengan didukung oleh tutor berpengalaman dan kurikulum yang up-to-date, kami memastikan setiap siswa mendapatkan perhatian personal yang mereka butuhkan.
              </p>
            </div>

            <div className={`${styles.infoBox} ${styles.infoBoxGold}`}>
              <h3 className={styles.infoTitle}>
                <DocumentIcon /> Persyaratan Pendaftaran
              </h3>
              <ul className={styles.infoList}>
                <li><CheckCircleIcon /> Foto Copy Raport Semester Terakhir (Min. 2 semester)</li>
                <li><CheckCircleIcon /> Pas Foto berwarna ukuran 3x4 (2 Lembar)</li>
                <li><CheckCircleIcon /> Mengisi formulir pendaftaran di kantor pusat atau via website</li>
                <li><CheckCircleIcon /> Melampirkan fotokopi kartu identitas orang tua/wali</li>
              </ul>
            </div>

            <div className={`${styles.infoBox} ${styles.infoBoxBlue}`}>
              <h3 className={styles.infoTitle}>
                <CalendarIcon size={20} /> Jadwal Pendaftaran
              </h3>
              <ul className={styles.infoList}>
                <li><ClockIcon /> <strong>Gelombang 1:</strong> 21 Feb - 15 Mar 2026 (Diskon 10% Early Bird)</li>
                <li><ClockIcon /> <strong>Gelombang 2:</strong> 16 Mar - 10 Apr 2026</li>
                <li><ClockIcon /> <strong>Placement Test:</strong> 15 April 2026</li>
              </ul>
            </div>

          </div>
        </div>

        {/* Kolom Kanan: Sidebar */}
        <aside className={styles.sidebar}>
          
          {/* Widget Pencarian */}
          <div className={styles.widget}>
            <div className={styles.searchContainer}>
              <div className={styles.searchBox}>
                <SearchIcon />
                <input type="text" placeholder="Cari Berita..." />
              </div>
              <button className={styles.searchBtn}>Cari</button>
            </div>
          </div>

          {/* Widget Berita Terbaru */}
          <div className={styles.widget}>
            <h3 className={styles.widgetTitle}>Berita Terbaru</h3>
            <div className={styles.recentNewsList}>
              <div className={styles.recentNewsItem}>
                <a href="#" className={styles.recentNewsTitle}>Pemenang Olimpiade Matematika Tingkat Kota 2026</a>
                <span className={styles.recentNewsDate}>15 FEB 2026</span>
              </div>
              <div className={styles.recentNewsItem}>
                <a href="#" className={styles.recentNewsTitle}>Workshop Teknik Belajar Efektif Bersama Dr. Andi</a>
                <span className={styles.recentNewsDate}>10 FEB 2026</span>
              </div>
              <div className={styles.recentNewsItem}>
                <a href="#" className={styles.recentNewsTitle}>Update Fasilitas Perpustakaan Digital Baru</a>
                <span className={styles.recentNewsDate}>05 FEB 2026</span>
              </div>
              <div className={styles.recentNewsItem}>
                <a href="#" className={styles.recentNewsTitle}>Penerimaan Tutor Fisika dan Kimia</a>
                <span className={styles.recentNewsDate}>01 FEB 2026</span>
              </div>
              <div className={styles.recentNewsItem}>
                <a href="#" className={styles.recentNewsTitle}>Jadwal Libur Semester Genap 2026</a>
                <span className={styles.recentNewsDate}>28 JAN 2026</span>
              </div>
            </div>
          </div>

          {/* Widget Kategori */}
          <div className={styles.widget}>
            <h3 className={styles.widgetTitle}>Kategori</h3>
            <div className={styles.tagCloud}>
              <span className={styles.tag}>Akademik</span>
              <span className={styles.tag}>Kegiatan</span>
              <span className={`${styles.tag} ${styles.tagActive}`}>Pengumuman</span>
              <span className={styles.tag}>Tips Belajar</span>
              <span className={styles.tag}>Prestasi</span>
            </div>
          </div>

          {/* Widget Call to Action */}
          <div className={`${styles.widget} ${styles.ctaWidget}`}>
            <h3 className={styles.ctaTitle}>Ingin Bergabung?</h3>
            <p className={styles.ctaText}>Dapatkan konsultasi gratis untuk memilih program yang tepat bagi putra-putri Anda.</p>
            <button className={styles.ctaBtn}>Hubungi Kami</button>
          </div>

        </aside>

      </div>
    </div>
  );
}

export default Berita;