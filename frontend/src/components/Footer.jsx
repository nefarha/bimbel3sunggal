import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <div className={styles.footerLogo}>
            <span className={styles.footerLogoIcon}>🎓</span>
            <span>Grand 3 Sunggal</span>
          </div>
          <p className={styles.brandDesc}>
            Membangun generasi cerdas dan berkarakter<br/>
            melalui pendidikan bimbingan belajar berkualitas<br/>
            di Kota Medan.
          </p>

          <div className={styles.contactBlock}>
            <div className={styles.contactLabel}>
              <span className={styles.contactIcon}>📍</span> ALAMAT KANTOR
            </div>
            <div className={styles.contactText}>Jl. Sunggal No. 88, Sunggal, Kec. Medan Sunggal, Kota Medan, Sumatera Utara</div>
          </div>

          <div className={styles.contactBlock}>
            <div className={styles.contactLabel}>
              <span className={styles.contactIcon}>📞</span> HUBUNGI KAMI
            </div>
            <div className={styles.contactText}>
              0821-2345-6789 (Telp)<br/>
              0891-8765-4321 (WhatsApp)
            </div>
          </div>

          <div className={styles.contactBlock}>
            <div className={styles.contactLabel}>
              <span className={styles.contactIcon}>✉️</span> EMAIL
            </div>
            <div className={styles.contactText}>grandtigasunggal@gmail.com</div>
          </div>
        </div>

        <div className={styles.footerSection}>
          <h4>Link Cepat</h4>
          <div className={styles.links}>
            <Link to="/tentang">Tentang Kami</Link>
            <Link to="/program">Program Belajar</Link>
            <Link to="/jadwal">Jadwal Kelas</Link>
            <Link to="/tutor">Informasi Tutor</Link>
            <Link to="/galeri">Galeri Kegiatan</Link>
          </div>
        </div>

        <div className={styles.footerSection}>
          <h4>Dukungan</h4>
          <div className={styles.links}>
            <Link to="/faq">Pusat Bantuan (FAQ)</Link>
            <Link to="/privasi">Kebijakan Privasi</Link>
            <Link to="/syarat">Syarat & Ketentuan</Link>
            <Link to="/konfirmasi">Konfirmasi Pembayaran</Link>
          </div>
          <h4 style={{marginTop: '2rem'}}>IKUTI KAMI</h4>
          <div className={styles.socialIcons}>
            <a href="#" className={styles.socialIcon}>IG</a>
            <a href="#" className={styles.socialIcon}>FB</a>
            <a href="#" className={styles.socialIcon}>YT</a>
          </div>
        </div>
      </div>
      
      <div className={styles.footerBottom}>
        <div>© 2024 Grand 3 Sunggal. All rights reserved.</div>
        <div className={styles.footerBottomLinks}>
          <Link to="/legal">Legal</Link>
          <Link to="/sitemap">Sitemap</Link>
          <Link to="/accessibility">Accessibility</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
