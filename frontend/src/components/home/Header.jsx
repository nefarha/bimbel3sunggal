import { Link, useLocation } from 'react-router-dom';
import logogrand from '../../assets/logogrand.png';
import styles from './Header.module.css';

function Header() {
  const location = useLocation();

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <img src={logogrand} alt="Grand 3 Sunggal" className={styles.logoImg} />
        <span>Grand 3<br/>Sunggal</span>
      </div>
      <nav className={styles.nav}>
        <Link to="/" className={location.pathname === '/' ? styles.active : ''}>Beranda</Link>
        <Link to="/profile" className={location.pathname === '/profile' ? styles.active : ''}>Profile Bimbel</Link>
        <Link to="/tutor_public" className={location.pathname === '/tutor_public' ? styles.active : ''}>Tutor</Link>
        <Link to="/berita" className={location.pathname === '/berita' ? styles.active : ''}>Berita</Link>
      </nav>
      <Link to="/login" className={styles.loginBtn}>Login</Link>
    </header>
  );
}

export default Header;
