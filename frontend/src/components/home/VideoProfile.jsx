import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../../pages/Home.module.css';

function VideoProfile() {
  return (
    <section className={styles.videoSection}>
      <div className={styles.flexBetween}>
        <h2 className={styles.sectionTitle}>Mengenal Lebih Dekat</h2>
        <Link to="/tentang" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Selengkapnya →</Link>
      </div>
      <div className={styles.videoContainer}>
        <div className={styles.playBtn}>▶</div>
        <div className={styles.videoText}>Tonton Video Profil Kami</div>
        <div className={styles.videoDuration}>Durasi: 2:45 menit</div>
      </div>
    </section>
  );
}

export default VideoProfile;
