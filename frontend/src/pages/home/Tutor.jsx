import React from 'react';
import styles from './Beranda.module.css';

function Tutor() {
  return (
    <div className={styles.container} style={{ padding: '8rem 5%', textAlign: 'center', minHeight: '60vh' }}>
      <h1>Tutor List</h1>
      <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>
        Halaman daftar tutor akan segera hadir.
      </p>
    </div>
  );
}

export default Tutor;
