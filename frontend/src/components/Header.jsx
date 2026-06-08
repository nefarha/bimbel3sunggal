import { Link, useLocation } from 'react-router-dom';
import styles from './Header.module.css';

function Header() {
  const location = useLocation();

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>👑</span>
        <span>Grand 3<br/>Sunggal</span>
      </div>
      <nav className={styles.nav}>
        <Link to="/" className={location.pathname === '/' ? styles.active : ''}>Beranda</Link>
        <Link to="/profile" className={location.pathname === '/profile' ? styles.active : ''}>Profile Bimbel</Link>
        <Link to="/tutor" className={location.pathname === '/tutor' ? styles.active : ''}>Tutor</Link>
        <Link to="/berita" className={location.pathname === '/berita' ? styles.active : ''}>Berita</Link>
      </nav>
      <button className={styles.loginBtn}>Login</button>
    </header>
  );
}

export default Header;
