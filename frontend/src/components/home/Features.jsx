import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../pages/Home.module.css';

function Features() {
  return (
    <section className={styles.features}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>🎒</div>
          <h3 className={styles.cardTitle}>Program Unggulan</h3>
        </div>
        <ul className={styles.programGrid}>
          <li>Matematika</li>
          <li>Bahasa Inggris</li>
          <li>Fisika</li>
          <li>Kimia</li>
          <li>Biologi</li>
          <li>IPS Terpadu</li>
        </ul>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader} style={{ justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className={styles.cardIcon} style={{ color: '#f97316', backgroundColor: '#fff7ed' }}>📰</div>
            <h3 className={styles.cardTitle}>Berita & Pengumuman</h3>
          </div>
          <Link to="/berita" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Lihat Semua</Link>
        </div>
        <div className={styles.newsPlaceholder}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
          <div>Info Pendaftaran Gelombang II Tahun 2024</div>
        </div>
      </div>
    </section>
  );
}

export default Features;
