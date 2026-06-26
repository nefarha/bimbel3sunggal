import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  MdDashboard,
  MdPersonAdd,
  MdPayments,
  MdSchool,
  MdGroup,
  MdCalendarMonth,
  MdHowToReg,
  MdAssessment,
  MdAccessTime,
  MdClass,
  MdLogout,
  MdSwapHoriz,
  MdBook,
  MdPeople,
  MdReceipt,
  MdAttachMoney,
} from 'react-icons/md';
import styles from './AdminLayout.module.css';
import logogrand from '../../assets/logogrand.png';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: MdDashboard, to: '/admin/dashboard' },
  { label: 'Pendaftaran Siswa', icon: MdPersonAdd, to: '/admin/pendaftaran' },
  { label: 'Pembayaran Siswa', icon: MdPayments, to: '/admin/pembayaran' },
  { label: 'Semua Pembayaran', icon: MdReceipt, to: '/admin/semua-pembayaran' },
  { label: 'Manajemen Siswa', icon: MdGroup, to: '/admin/manajemen_siswa' },
  { label: 'Daftar Kelas', icon: MdClass, to: '/admin/kelas' },
  { label: 'Jadwal', icon: MdCalendarMonth, to: '/admin/jadwal' },
  { label: 'Mata Pelajaran', icon: MdBook, to: '/admin/mapel' },
  { label: 'Manajemen Tutor', icon: MdSchool, to: '/admin/guru' },
  { label: 'Presensi Tutor', icon: MdAccessTime, to: '/admin/presensi_guru' },
  { label: 'Rekap Absensi', icon: MdHowToReg, to: '/admin/absensi' },
  { label: 'Rekap Absensi Siswa', icon: MdPeople, to: '/admin/rekap-absensi-siswa' },
  { label: 'Infal Tutor', icon: MdSwapHoriz, to: '/admin/infal-tutor' },
  { label: 'Tagihan Siswa', icon: MdAttachMoney, to: '/admin/tagihan' },
];

function AdminLayout({ children }) {
  const navigate = useNavigate();
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

      {}
      <main className={styles.main}>
        {}
        <header className={styles.topBar}>
          <h1 className={styles.pageTitle}>Administrator</h1>
          <div className={styles.userBlock}>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.username || 'Admin Utama'}</p>
              <p className={styles.userRole}>Super User</p>
            </div>
            {}
          </div>
        </header>

        {}
        <section className={styles.content}>{children}</section>
      </main>
    </div>
  );
}

export default AdminLayout;
