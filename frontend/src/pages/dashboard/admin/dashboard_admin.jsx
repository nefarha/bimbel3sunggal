import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import {
  MdDashboard,
  MdPersonAdd,
  MdPayments,
  MdSchool,
  MdCalendarMonth,
  MdHowToReg,
  MdAssessment,
  MdLogout,
  MdGroup,
  MdClass,
  MdEventBusy,
  MdAccountBalanceWallet,
  MdVisibility,
  MdCheckCircle,
  MdCancel,
  MdChevronLeft,
  MdChevronRight,
  MdRefresh,
} from 'react-icons/md';
import api from '../../../services/api';
import styles from './dashboard_admin.module.css';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: MdDashboard, to: '/admin/dashboard' },
  { label: 'Pendaftaran Siswa', icon: MdPersonAdd, to: '/admin/pendaftaran' },
  { label: 'Pembayaran Siswa', icon: MdPayments, to: '/admin/pembayaran' },
  { label: 'Sistem Manajemen Guru', icon: MdSchool, to: '/admin/guru' },
  { label: 'Jadwal', icon: MdCalendarMonth, to: '/admin/jadwal' },
  { label: 'Rekap Absensi', icon: MdHowToReg, to: '/admin/absensi' },
  { label: 'Laporan', icon: MdAssessment, to: '/admin/laporan' },
];

const STAT_META = [
  {
    key: 'totalSiswaAktif',
    label: 'Total Siswa Aktif',
    icon: MdGroup,
    iconClass: 'iconPrimary',
    borderAccent: null,
  },
  {
    key: 'totalKelasHariIni',
    label: 'Kelas Hari Ini',
    icon: MdClass,
    iconClass: 'iconSecondary',
    borderAccent: null,
  },
  {
    key: 'absensiBelumDikonfirmasi',
    label: 'Absensi Belum Dikonfirmasi',
    icon: MdEventBusy,
    iconClass: 'iconDanger',
    borderAccent: 'borderError',
  },
  {
    key: 'transaksiMenungguVerifikasi',
    label: 'Transaksi Menunggu Verifikasi',
    icon: MdAccountBalanceWallet,
    iconClass: 'iconTertiary',
    borderAccent: 'borderSecondary',
  },
];

const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  return Number(value).toLocaleString('en-US');
};

const formatDisplayId = (value) => {
  if (value === null || value === undefined) return '0';
  return String(value).padStart(2, '0');
};

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalSiswaAktif: 0,
    totalKelasHariIni: 0,
    absensiBelumDikonfirmasi: 0,
    transaksiMenungguVerifikasi: 0,
  });
  const [absensiHariIni, setAbsensiHariIni] = useState([]);
  const [transaksiPending, setTransaksiPending] = useState([]);
  const [piutang, setPiutang] = useState([]);
  const [piutangMeta, setPiutangMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState({
    stats: true,
    absensi: true,
    transaksi: true,
    piutang: true,
  });
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // ─── Auth guard ─────────────────────────────────────────────
  // Session & role checks are handled by <ProtectedRoute> in App.jsx,
  // so by the time this component mounts the user is guaranteed to be
  // an authenticated admin. We just hydrate the user profile here.
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

  // ─── Data fetchers ──────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoading((prev) => ({ ...prev, stats: true }));
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data.stats);
        setAbsensiHariIni(res.data.data.absensiHariIni || []);
        setTransaksiPending(res.data.data.transaksiPending || []);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
      setError('Gagal memuat statistik dashboard');
    } finally {
      // /stats mengembalikan absensiHariIni & transaksiPending,
      // jadi kedua flag loading juga harus di-reset di sini
      setLoading((prev) => ({
        ...prev,
        stats: false,
        absensi: false,
        transaksi: false,
      }));
    }
  }, []);

  const fetchAbsensiHariIni = useCallback(async () => {
    setLoading((prev) => ({ ...prev, absensi: true }));
    try {
      const res = await api.get('/dashboard/absensi-hari-ini');
      if (res.data.success) {
        setAbsensiHariIni(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch absensi hari ini error:', err);
    } finally {
      setLoading((prev) => ({ ...prev, absensi: false }));
    }
  }, []);

  const fetchTransaksiPending = useCallback(async () => {
    setLoading((prev) => ({ ...prev, transaksi: true }));
    try {
      const res = await api.get('/dashboard/transaksi-pending');
      if (res.data.success) {
        setTransaksiPending(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch transaksi pending error:', err);
    } finally {
      setLoading((prev) => ({ ...prev, transaksi: false }));
    }
  }, []);

  const fetchPiutang = useCallback(async (page = 1) => {
    setLoading((prev) => ({ ...prev, piutang: true }));
    try {
      const res = await api.get('/dashboard/piutang', { params: { page, limit: 10 } });
      if (res.data.success) {
        setPiutang(res.data.data || []);
        setPiutangMeta(res.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Fetch piutang error:', err);
    } finally {
      setLoading((prev) => ({ ...prev, piutang: false }));
    }
  }, []);

  const loadAll = useCallback(() => {
    fetchStats();
    fetchPiutang(piutangMeta.page);
  }, [fetchStats, fetchPiutang, piutangMeta.page]);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user, loadAll]);

  // ─── CRUD Actions ───────────────────────────────────────────
  const handleConfirmAbsensi = async (idKelas) => {
    setActionLoading((prev) => ({ ...prev, [`absensi-${idKelas}`]: true }));
    try {
      await api.patch(`/absensi-siswa/confirm-class/${idKelas}`);
      await fetchAbsensiHariIni();
      await fetchStats();
    } catch (err) {
      console.error('Confirm absensi error:', err);
      setError('Gagal mengonfirmasi absensi');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`absensi-${idKelas}`]: false }));
    }
  };

  const handleConfirmAllAbsensi = async () => {
    if (!window.confirm('Konfirmasi semua absensi hari ini?')) return;
    setActionLoading((prev) => ({ ...prev, 'absensi-all': true }));
    try {
      await api.patch('/absensi-siswa/confirm-all-today');
      await loadAll();
    } catch (err) {
      console.error('Confirm all absensi error:', err);
      setError('Gagal mengonfirmasi semua absensi');
    } finally {
      setActionLoading((prev) => ({ ...prev, 'absensi-all': false }));
    }
  };

  const handleVerifyTransaksi = async (id, status) => {
    setActionLoading((prev) => ({ ...prev, [`trx-${id}`]: true }));
    try {
      await api.patch(`/pembayaran/${id}/verify`, { status });
      await fetchTransaksiPending();
      await fetchStats();
    } catch (err) {
      console.error('Verify transaksi error:', err);
      setError(`Gagal ${status === 'Verified' ? 'memverifikasi' : 'menolak'} transaksi`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`trx-${id}`]: false }));
    }
  };

  const handleVerifyAllTransaksi = async () => {
    if (!window.confirm('Verifikasi semua transaksi pending?')) return;
    setActionLoading((prev) => ({ ...prev, 'trx-all': true }));
    try {
      await api.patch('/pembayaran/bulk-verify', { status: 'Verified' });
      await loadAll();
    } catch (err) {
      console.error('Verify all transaksi error:', err);
      setError('Gagal memverifikasi semua transaksi');
    } finally {
      setActionLoading((prev) => ({ ...prev, 'trx-all': false }));
    }
  };

  const handleKirimTagihan = (row) => {
    const phone = (row.whatsapp || '').replace(/\D/g, '');
    const message = encodeURIComponent(
      `Halo ${row.nama}, ini adalah pengingat pembayaran SPP untuk bulan ${row.bulan} sebesar ${row.nominal}. Mohon segera dilakukan pembayaran. Terima kasih.`
    );
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    } else {
      alert('Nomor WhatsApp tidak valid');
    }
  };

  // ─── Handlers ───────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > piutangMeta.totalPages) return;
    fetchPiutang(newPage);
  };

  return (
    <div className={styles.appShell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            <MdSchool style={{ fontVariationSettings: "'FILL' 1" }} />
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
                <Icon className={styles.navIcon} data-icon={item.label.toLowerCase()} />
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
          <h1 className={styles.pageTitle}>Administrator</h1>
          <div className={styles.userBlock}>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.username || 'Admin Utama'}</p>
              <p className={styles.userRole}>Super User</p>
            </div>
            <div className={styles.avatar} aria-label="User profile" />
          </div>
        </header>

        {/* Content */}
        <section className={styles.content}>
          {error && (
            <div className={styles.alertError} role="alert">
              {error}
              <button
                type="button"
                className={styles.alertClose}
                onClick={() => setError(null)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          {/* Top action bar */}
          <div className={styles.actionBar}>
            <button
              type="button"
              className={styles.btnRefresh}
              onClick={loadAll}
              disabled={loading.stats}
            >
              <MdRefresh className={loading.stats ? styles.spin : ''} />
              <span>Refresh Data</span>
            </button>
          </div>

          {/* Stats row */}
          <div className={styles.statsGrid}>
            {STAT_META.map((stat) => {
              const Icon = stat.icon;
              const value = stats[stat.key];
              return (
                <div
                  key={stat.key}
                  className={`${styles.statCard} ${stat.borderAccent ? styles[stat.borderAccent] : ''}`}
                >
                  <div className={styles.statHeader}>
                    <span className={`${styles.statIconWrap} ${styles[stat.iconClass]}`}>
                      <Icon />
                    </span>
                  </div>
                  <p className={styles.statLabel}>{stat.label}</p>
                  <h3
                    className={`${styles.statValue} ${
                      stat.key === 'absensiBelumDikonfirmasi' ? styles.statValueDanger : ''
                    } ${stat.key === 'transaksiMenungguVerifikasi' ? styles.statValueTertiary : ''}`}
                  >
                    {loading.stats ? '…' : formatNumber(value)}
                  </h3>
                </div>
              );
            })}
          </div>

          {/* Two-column tables */}
          <div className={styles.twoColGrid}>
            {/* Attendance today */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Absensi Hari ini</h2>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleConfirmAllAbsensi}
                  disabled={actionLoading['absensi-all'] || absensiHariIni.length === 0}
                >
                  {actionLoading['absensi-all'] ? 'Memproses…' : 'Konfirmasi Semua'}
                </button>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Kelas</th>
                      <th>Tutor</th>
                      <th>Hadir</th>
                      <th>Absen</th>
                      <th className={styles.thRight}>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.absensi ? (
                      <tr>
                        <td colSpan={5} className={styles.emptyCell}>Memuat data…</td>
                      </tr>
                    ) : absensiHariIni.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={styles.emptyCell}>
                          Belum ada data absensi hari ini
                        </td>
                      </tr>
                    ) : (
                      absensiHariIni.map((row) => (
                        <tr key={row.id_kelas}>
                          <td className={styles.tdBold}>{row.nama_kelas}</td>
                          <td>{row.nama_tutor}</td>
                          <td>
                            <span className={`${styles.pill} ${styles.pillSuccess}`}>
                              {formatDisplayId(row.hadir)}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.pill} ${styles.pillDanger}`}>
                              {row.absen}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionGroup}>
                              <button
                                type="button"
                                className={styles.btnSuccess}
                                onClick={() => handleConfirmAbsensi(row.id_kelas)}
                                disabled={actionLoading[`absensi-${row.id_kelas}`]}
                              >
                                Konfirmasi
                              </button>
                              <button type="button" className={styles.btnDanger}>
                                Koreksi
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending transactions */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Transaksi Menunggu Verifikasi</h2>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={handleVerifyAllTransaksi}
                  disabled={actionLoading['trx-all'] || transaksiPending.length === 0}
                >
                  {actionLoading['trx-all'] ? 'Memproses…' : 'Verifikasi Semua'}
                </button>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Siswa</th>
                      <th>Jumlah</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.transaksi ? (
                      <tr>
                        <td colSpan={5} className={styles.emptyCell}>Memuat data…</td>
                      </tr>
                    ) : transaksiPending.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={styles.emptyCell}>
                          Tidak ada transaksi menunggu verifikasi
                        </td>
                      </tr>
                    ) : (
                      transaksiPending.map((row) => (
                        <tr key={row.id_pembayaran}>
                          <td>{row.tanggal}</td>
                          <td className={styles.tdBold}>{row.nama}</td>
                          <td>{row.jumlah}</td>
                          <td>
                            <span className={`${styles.pill} ${styles.pillPending}`}>
                              {row.status}
                            </span>
                          </td>
                          <td>
                            <div className={styles.iconGroup}>
                              <MdVisibility
                                className={`${styles.iconBtn} ${styles.iconPrimary}`}
                                title="Lihat Detail"
                                onClick={() => navigate(`/admin/pembayaran/${row.id_pembayaran}`)}
                              />
                              <MdCheckCircle
                                className={`${styles.iconBtn} ${styles.iconSuccess}`}
                                title="Setujui"
                                onClick={() => handleVerifyTransaksi(row.id_pembayaran, 'Verified')}
                              />
                              <MdCancel
                                className={`${styles.iconBtn} ${styles.iconDanger}`}
                                title="Tolak"
                                onClick={() => handleVerifyTransaksi(row.id_pembayaran, 'Rejected')}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Receivables */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                Monitoring Piutang &amp; Tagihan Siswa (Jatuh Tempo)
              </h2>
            </div>
            <div className={styles.tableWrap}>
              <table className={`${styles.table} ${styles.tableReceivables}`}>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Siswa</th>
                    <th>Bulan Tagihan</th>
                    <th>Nominal</th>
                    <th>Keterlambatan</th>
                    <th>No Whatsapp</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading.piutang ? (
                    <tr>
                      <td colSpan={7} className={styles.emptyCell}>Memuat data…</td>
                    </tr>
                  ) : piutang.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.emptyCell}>
                        Tidak ada piutang / tagihan jatuh tempo
                      </td>
                    </tr>
                  ) : (
                    piutang.map((row, idx) => (
                      <tr key={row.id}>
                        <td>{(piutangMeta.page - 1) * piutangMeta.limit + idx + 1}</td>
                        <td className={styles.tdBold}>{row.nama}</td>
                        <td>{row.bulan}</td>
                        <td>{row.nominal}</td>
                        <td className={styles.tdDangerUnderline}>{row.keterlambatan}</td>
                        <td>
                          <input
                            type="text"
                            defaultValue={row.whatsapp}
                            className={styles.whatsappInput}
                            aria-label={`Nomor WhatsApp ${row.nama}`}
                            readOnly
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.btnCta}
                            onClick={() => handleKirimTagihan(row)}
                          >
                            Kirim Tagihan
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className={styles.tableFooter}>
              <p className={styles.tableFooterText}>
                Menampilkan {piutang.length} dari {piutangMeta.total} data tagihan
              </p>
              <div className={styles.pager}>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  aria-label="Previous"
                  onClick={() => handlePageChange(piutangMeta.page - 1)}
                  disabled={piutangMeta.page <= 1}
                >
                  <MdChevronLeft />
                </button>
                <span className={styles.pagerPage}>
                  Halaman {piutangMeta.page} / {piutangMeta.totalPages}
                </span>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  aria-label="Next"
                  onClick={() => handlePageChange(piutangMeta.page + 1)}
                  disabled={piutangMeta.page >= piutangMeta.totalPages}
                >
                  <MdChevronRight />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerLeft}>
            <p className={styles.footerTitle}>Grand Tiga Sunggal</p>
            <p className={styles.footerCopy}>
              © 2024 Grand Tiga Sunggal. All rights reserved.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <Link to="/contact" className={styles.footerLink}>
              Contact Us
            </Link>
            <Link to="/privacy" className={styles.footerLink}>
              Privacy Policy
            </Link>
            <Link to="/terms" className={styles.footerLink}>
              Terms of Service
            </Link>
            <Link to="/faq" className={styles.footerLink}>
              FAQ
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default DashboardAdmin;
