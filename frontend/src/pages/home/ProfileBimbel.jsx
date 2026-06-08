import React from 'react';
import styles from './ProfileBimbel.module.css';

function ProfileBimbel() {
  return (
    <div className={styles.container}>
      {/* Tentang Bimbel Section */}
      <section className={styles.aboutSection}>
        <div className={styles.textContent}>
          <h1 className={styles.title}>Tentang Bimbel</h1>
          <p className={styles.paragraph}>
            Grand Tiga Sunggal adalah lembaga bimbingan belajar yang berdedikasi untuk memberikan standar pendidikan tertinggi bagi siswa di kawasan Medan. Kami memahami bahwa setiap anak memiliki potensi unik yang memerlukan pendekatan belajar yang tepat untuk berkembang secara optimal.
          </p>
          <p className={styles.paragraph}>
            Didirikan dengan visi untuk menjembatani kesenjangan antara kurikulum sekolah dan kebutuhan akademik individual, kami telah membantu ribuan siswa meraih prestasi gemilang. Fokus kami tidak hanya pada hasil akhir, tetapi juga pada pembentukan pola pikir kritis dan kemandirian dalam proses belajar.
          </p>
          <p className={styles.paragraph}>
            Lingkungan belajar yang kondusif, didukung oleh fasilitas modern dan tim pengajar yang berpengalaman, menjadikan proses transfer ilmu menjadi lebih efektif dan menyenangkan bagi setiap jenjang pendidikan yang kami layani.
          </p>
        </div>
        <div className={styles.imageContent}>
          <div className={styles.imagePlaceholder}></div>
        </div>
      </section>

      {/* Visi Misi Section */}
      <section className={styles.visionMissionSection}>
        <div className={styles.textContent}>
          <div className={styles.sectionHeader}>
            <span className={styles.decorativeLine}></span>
            <h2 className={styles.subtitle}>Bimbel untuk Masa Depan Anak</h2>
          </div>
          
          <div className={styles.visionBlock}>
            <h3 className={styles.blockTitle}>
              <span className={styles.icon}>👁️</span> Visi
            </h3>
            <p className={styles.paragraph}>
              Menjadi mitra pendidikan terpercaya yang mendorong prestasi dan kemandirian belajar siswa melalui inovasi pedagogis yang berkelanjutan.
            </p>
          </div>

          <div className={styles.missionBlock}>
            <h3 className={styles.blockTitle}>
              <span className={styles.icon}>🚩</span> Misi
            </h3>
            <ul className={styles.missionList}>
              <li>
                <span className={styles.checkIcon}>✓</span>
                Memberikan layanan bimbingan belajar berkualitas tinggi dengan standar kurikulum terkini.
              </li>
              <li>
                <span className={styles.checkIcon}>✓</span>
                Menyediakan tutor profesional yang tidak hanya kompeten secara akademik tetapi juga berdedikasi dalam mendidik karakter.
              </li>
              <li>
                <span className={styles.checkIcon}>✓</span>
                Mengembangkan sistem pembelajaran yang adaptif dan berbasis teknologi untuk memudahkan aksesibilitas materi.
              </li>
              <li>
                <span className={styles.checkIcon}>✓</span>
                Menumbuhkan semangat belajar yang intrinsik dan rasa percaya diri siswa menghadapi tantangan akademik.
              </li>
              <li>
                <span className={styles.checkIcon}>✓</span>
                Menciptakan ekosistem belajar yang mendukung kolaborasi antara siswa, guru, dan orang tua.
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.imageContent}>
          <div className={styles.imagePlaceholderAlt}></div>
        </div>
      </section>

      {/* Fasilitas Section */}
      <section className={styles.facilitiesSection}>
        <div className={styles.facilityImages}>
           <div className={styles.imagePlaceholderSmall1}></div>
           <div className={styles.imagePlaceholderSmall2}></div>
        </div>
        <div className={styles.facilityContent}>
          <h2 className={styles.title}>Fasilitas Bimbel</h2>
          <div className={styles.facilitiesGrid}>
            <div className={styles.facilityCard}>
              <span className={styles.facilityIcon}>❄️</span>
              <span>Ruang Kelas Full AC & Ergonomis</span>
            </div>
            <div className={styles.facilityCard}>
              <span className={styles.facilityIcon}>📶</span>
              <span>WiFi Kecepatan Tinggi Seluruh Area</span>
            </div>
            <div className={styles.facilityCard}>
              <span className={styles.facilityIcon}>💻</span>
              <span>Laboratorium Komputer Modern</span>
            </div>
            <div className={styles.facilityCard}>
              <span className={styles.facilityIcon}>📚</span>
              <span>Perpustakaan & Koleksi Modul Lengkap</span>
            </div>
            <div className={styles.facilityCard}>
              <span className={styles.facilityIcon}>☕</span>
              <span>Student Lounge & Area Relaksasi</span>
            </div>
            <div className={styles.facilityCard}>
              <span className={styles.facilityIcon}>🛡️</span>
              <span>Sistem Keamanan CCTV 24 Jam</span>
            </div>
          </div>
          <p className={styles.paragraphSmall}>
            Kami terus berupaya memperbarui sarana dan prasarana kami untuk memastikan pengalaman belajar yang optimal dan sesuai dengan perkembangan teknologi pendidikan global.
          </p>
        </div>
      </section>
    </div>
  );
}

export default ProfileBimbel;
