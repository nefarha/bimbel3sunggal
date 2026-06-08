import React from 'react';
import styles from '../../pages/Home.module.css';

function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <div className={styles.heroBadge}>#1 Bimbel Terbaik di Sunggal</div>
        <h1 className={styles.title}>
          Belajar Lebih Mudah,<br />Prestasi Lebih <span>Tinggi</span>
        </h1>
        <p className={styles.heroDesc}>
          Wujudkan cita-citamu bersama pengajar profesional dan kurikulum yang menyenangkan.
        </p>
        <div className={styles.heroButtons}>
          <button className={styles.btnPrimary}>Mulai Belajar</button>
        </div>
      </div>
      <div className={styles.heroImage}>
        <div className={styles.heroImagePlaceholder}></div>
      </div>
    </section>
  );
}

export default Hero;
