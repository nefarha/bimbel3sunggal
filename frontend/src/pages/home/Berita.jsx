import React from 'react';
import styles from './Beranda.module.css';

function Berita() {
  return (
    <div className={styles.container} style={{ padding: '8rem 5%', textAlign: 'center', minHeight: '60vh' }}>
      <h1>Berita Terbaru</h1>
      <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>
        Halaman berita akan segera hadir.
      </p>
    </div>
  );
}

export default Berita;
