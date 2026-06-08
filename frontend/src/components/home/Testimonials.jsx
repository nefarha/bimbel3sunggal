import React from 'react';
import styles from '../../pages/Home.module.css';

function Testimonials() {
  return (
    <section className={styles.testimonials}>
      <div className={styles.flexBetween}>
        <div>
          <h2 className={styles.sectionTitle}>Apa Kata Orang Tua & Siswa?</h2>
          <p className={styles.sectionSubtitle}>Kisah sukses mereka bermula di Grand 3 Sunggal</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' }}>&lt;</button>
          <button style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' }}>&gt;</button>
        </div>
      </div>

      <div className={styles.testimonialGrid}>
        <div className={styles.testiCard}>
          <div className={styles.stars}>★★★★★</div>
          <p className={styles.quote}>"Sejak anak saya mengikuti bimbingan belajar di sini, nilainya meningkat cukup signifikan. Cara mengajarnya mudah dipahami dan Tutornya sangat sabar membimbing siswa."</p>
          <div className={styles.author}>
            <div className={styles.authorBadge} style={{ backgroundColor: '#dbeafe', color: '#1e3a8a' }}>RW</div>
            <div className={styles.authorInfo}>
              <h5>Ibu Rina Wijaya</h5>
              <p>Orang Tua Siswa Kelas IX</p>
            </div>
          </div>
        </div>

        <div className={styles.testiCard}>
          <div className={styles.stars}>★★★★★</div>
          <p className={styles.quote}>"Suasana belajarnya asik banget, tutornya ga kaku dan seru diajak diskusi. PR sesulit apapun jadi kerasa gampang kalau dikerjain bareng di sini."</p>
          <div className={styles.author}>
            <div className={styles.authorBadge} style={{ backgroundColor: '#dcfce7', color: '#14532d' }}>AD</div>
            <div className={styles.authorInfo}>
              <h5>Aditya Pratama</h5>
              <p>Siswa SMA 1 Medan</p>
            </div>
          </div>
        </div>

        <div className={styles.testiCard}>
          <div className={styles.stars}>★★★★★</div>
          <p className={styles.quote}>"Fasilitas ruangannya nyaman dan ber-AC. Sangat mendukung fokus belajar anak-anak di sore hari setelah pulang sekolah."</p>
          <div className={styles.author}>
            <div className={styles.authorBadge} style={{ backgroundColor: '#ffedd5', color: '#9a3412' }}>BS</div>
            <div className={styles.authorInfo}>
              <h5>Bapak Santoso</h5>
              <p>Wali Siswa Kelas 6 SD</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
