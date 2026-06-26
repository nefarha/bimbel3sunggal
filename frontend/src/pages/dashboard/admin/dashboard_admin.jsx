import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MdGroup,
  MdClass,
  MdEventBusy,
  MdRefresh,
} from 'react-icons/md';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './dashboard_admin.module.css';

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
  const [stats, setStats] = useState({
    totalSiswaAktif: 0,
    totalKelasHariIni: 0,
    absensiBelumDikonfirmasi: 0,
  });
  const [absensiHariIni, setAbsensiHariIni] = useState([]);
  const [loading, setLoading] = useState({
    stats: true,
    absensi: true,
  });
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const fetchStats = useCallback(async () => {
    setLoading((prev) => ({ ...prev, stats: true }));
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data.stats);
        setAbsensiHariIni(res.data.data.absensiHariIni || []);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
      setError('Gagal memuat statistik dashboard');
    } finally {


      setLoading((prev) => ({
        ...prev,
        stats: false,
        absensi: false,
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

  const loadAll = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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

  return (
    <AdminLayout>
      {}
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

          {}
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

          {}
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
                    }`}
                  >
                    {loading.stats ? '…' : formatNumber(value)}
                  </h3>
                </div>
              );
            })}
          </div>

          {}
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
                            {/* <button type="button" className={styles.btnDanger}>
                              Koreksi
                            </button> */}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

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
    </AdminLayout>
  );
};

export default DashboardAdmin;
