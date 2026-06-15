import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import {
  MdSchool,
  MdDashboard,
  MdAttachMoney,
  MdAssessment,
  MdLogout,
  MdSettings,
} from 'react-icons/md';
import styles from './OwnerLayout.module.css';
import logogrand from '../../assets/logogrand.png';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: MdDashboard, to: '/owner/dashboard' },
  { label: 'Kelola Gaji', icon: MdAttachMoney, to: '/owner/kelola-gaji' },
  { label: 'Laporan Keuangan', icon: MdAssessment, to: '/owner/laporan-keuangan' },
  { label: 'Pengaturan', icon: MdSettings, to: '/owner/pengaturan' },
];

function OwnerLayout({ children }) {
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const getPageTitle = () => {
    if (location.pathname.includes('dashboard')) return 'Dashboard';
    if (location.pathname.includes('kelola-gaji')) return 'Kelola Gaji';
    if (location.pathname.includes('laporan-keuangan')) return 'Laporan Keuangan';
    if (location.pathname.includes('pengaturan')) return 'Pengaturan';
    return 'Owner';
  };

  return (
    <div className={styles.appShell}>
      {}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            <img src={logogrand} alt="GT Sunggal" className={styles.brandLogoImg} />
          </div>
          <div>
            <h2 className={styles.brandTitle}>GT Sunggal</h2>
            <p className={styles.brandSubtitle}>Owner Panel</p>
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

      {}
      <main className={styles.main}>
        {}
        <header className={styles.topBar}>
          <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
          <div className={styles.userBlock}>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.username || 'Pemilik'}</p>
              <p className={styles.userRole}>Pemilik</p>
            </div>
          </div>
        </header>

        {}
        <section className={styles.content}>{children}</section>
      </main>
    </div>
  );
}

export default OwnerLayout;
