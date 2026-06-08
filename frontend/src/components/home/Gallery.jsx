import React from 'react';
import styles from '../../pages/Home.module.css';

function Gallery() {
  return (
    <section className={styles.gallery}>
      <h2 className={styles.sectionTitle} style={{ marginBottom: '2rem' }}>Galeri Kegiatan</h2>
      <div className={styles.galleryGrid}>
        <div className={styles.galleryItem}>1</div>
        <div className={styles.galleryItem}>2</div>
        <div className={styles.galleryItem}>3</div>
        <div className={styles.galleryItem}>4</div>
      </div>
    </section>
  );
}

export default Gallery;
