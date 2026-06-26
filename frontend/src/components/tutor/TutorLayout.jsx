import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import {
  MdSchool,
  MdDashboard,
  MdPerson,
  MdCalendarMonth,
  MdHowToReg,
  MdAttachMoney,
  MdLogout,
  MdSwapHoriz,
} from 'react-icons/md';
import styles from './TutorLayout.module.css';
import logogrand from '../../assets/logogrand.png';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: MdDashboard, to: '/tutor/dashboard' },
  { label: 'Profile', icon: MdPerson, to: '/tutor/profile' },
  { label: 'Jadwal Mengajar', icon: MdCalendarMonth, to: '/tutor/jadwal-mengajar' },
  { label: 'Kehadiran', icon: MdHowToReg, to: '/tutor/kehadiran' },
  { label: 'Gaji', icon: MdAttachMoney, to: '/tutor/gaji' },
  { label: 'Infal', icon: MdSwapHoriz, to: '/tutor/infal' },
];

function TutorLayout({ children }) {
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
    if (location.pathname.includes('jadwal-mengajar')) return 'Jadwal Mengajar';
    if (location.pathname.includes('kehadiran')) return 'Kehadiran';
    if (location.pathname.includes('gaji')) return 'Gaji';
    if (location.pathname.includes('infal')) return 'Infal';
    return 'Tutor';
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
              <p className={styles.userName}>{user?.nama || 'Tutor'}</p>
              <p className={styles.userRole}>Tutor</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className={styles.content}>{children}</section>
      </main>
    </div>
  );
}

export default TutorLayout;
