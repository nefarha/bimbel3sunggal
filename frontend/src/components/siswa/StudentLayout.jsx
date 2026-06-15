import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import {
  MdPerson,
  MdCalendarMonth,
  MdPayments,
  MdDashboard,
  MdHowToReg,
  MdSchool,
  MdLogout,
} from 'react-icons/md';
import styles from './StudentLayout.module.css';
import logogrand from '../../assets/logogrand.png';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: MdDashboard, to: '/siswa/dashboard' },
  { label: 'Profile', icon: MdPerson, to: '/siswa/profile' },
  { label: 'Jadwal Les', icon: MdCalendarMonth, to: '/siswa/jadwal' },
  { label: 'Absensi', icon: MdHowToReg, to: '/siswa/rekap-absensi' },
  { label: 'Pembayaran', icon: MdPayments, to: '/siswa/pembayaran' },
];

function StudentLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const getPageTitle = () => {
    if (location.pathname.includes('dashboard')) return 'Dashboard';
    if (location.pathname.includes('profile')) return 'Profile';
    if (location.pathname.includes('jadwal')) return 'Jadwal Les';
    if (location.pathname.includes('rekap-absensi')) return 'Rekap Absensi';
    if (location.pathname.includes('pembayaran')) return 'Pembayaran';
    return 'Siswa';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.appShell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            <img src={logogrand} alt="GT Sunggal" className={styles.brandLogoImg} />
          </div>
          <div>
            <h2 className={styles.brandTitle}>GT Sunggal</h2>
            <p className={styles.brandSubtitle}>Management System</p>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
              >
                <Icon className={styles.navIcon} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            type="button"
            className={`${styles.navItem} ${styles.navItemLogout}`}
            onClick={handleLogout}
          >
            <MdLogout className={styles.navIcon} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main wrapper */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.topBar}>
          <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
          <div className={styles.userBlock}>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.nama || 'Siswa'}</p>
              <p className={styles.userRole}>Siswa</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className={styles.content}>{children}</section>
      </main>
    </div>
  );
}

export default StudentLayout;
