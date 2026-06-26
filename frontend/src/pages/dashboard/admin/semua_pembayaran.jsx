import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MdSearch,
  MdRefresh,
  MdPayments,
  MdCheckCircle,
  MdCancel,
  MdHourglassEmpty,
  MdVisibility,
  MdClose,
  MdFileDownload,
} from 'react-icons/md';
import { exportToExcel } from '../../../utils/exportExcel';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './semua_pembayaran.module.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Verified', label: 'Verified' },
  { value: 'Rejected', label: 'Rejected' },
];

const formatRupiah = (nominal) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nominal || 0);

const formatTanggal = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const statusBadge = (status) => {
  if (status === 'Verified') return styles.badgeVerified;
  if (status === 'Rejected') return styles.badgeRejected;
  return styles.badgePending;
};

const statusIcon = (status) => {
  if (status === 'Verified') return <MdCheckCircle />;
  if (status === 'Rejected') return <MdCancel />;
  return <MdHourglassEmpty />;
};

const SemuaPembayaran = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [detailItem, setDetailItem] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/pembayaran', { params });
      setData(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error('Gagal memuat pembayaran:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const total = data.length;
    const verified = data.filter((d) => d.status === 'Verified').length;
    const pending = data.filter((d) => d.status === 'Pending').length;
    const rejected = data.filter((d) => d.status === 'Rejected').length;
    const totalJumlah = data.reduce((sum, d) => sum + Number(d.jumlah || 0), 0);
    return { total, verified, pending, rejected, totalJumlah };
  }, [data]);

  const handleExport = () => {
    const columns = [
      { header: 'No', key: 'no' },
      { header: 'ID Pembayaran', key: 'id_pembayaran' },
      { header: 'Nama Siswa', key: 'nama_siswa' },
      { header: 'Bulan', key: 'bulan' },
      { header: 'Tanggal Bayar', key: 'tanggal_bayar' },
      { header: 'Jenis Pembayaran', key: 'jenis_pembayaran' },
      { header: 'Jumlah', key: 'jumlah' },
      { header: 'Diskon', key: 'diskon' },
      { header: 'Metode', key: 'metode' },
      { header: 'Status', key: 'status' },
      { header: 'Catatan', key: 'catatan' },
    ];
    const rows = data.map((d, i) => ({
      no: i + 1,
      id_pembayaran: `#${d.id_pembayaran}`,
      nama_siswa: d.nama_siswa || '',
      bulan: d.bulan || '',
      tanggal_bayar: d.tanggal_bayar ? new Date(d.tanggal_bayar).toLocaleDateString('id-ID') : '',
      jenis_pembayaran: d.jenis_pembayaran || '',
      jumlah: d.jumlah || 0,
      diskon: d.diskon || 0,
      metode: d.metode_pembayaran || '',
      status: d.status || '',
      catatan: d.catatan || '',
    }));
    exportToExcel(rows, columns, 'Semua_Pembayaran');
  };

  return (
    <AdminLayout>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Semua Pembayaran</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.btnRefresh}
            onClick={fetchData}
            disabled={loading}
          >
            <MdRefresh className={styles.btnIcon} />
            {loading ? 'Memuat...' : 'Refresh'}
          </button>
          <button className={styles.btnExport} onClick={handleExport}>
          <MdFileDownload className={styles.btnIcon} />
          Export Excel
        </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
            <MdPayments />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Total Transaksi</span>
            <span className={styles.statValue}>{stats.total}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <MdCheckCircle />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Verified</span>
            <span className={styles.statValue}>{stats.verified}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>
            <MdHourglassEmpty />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Pending</span>
            <span className={styles.statValue}>{stats.pending}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconRed}`}>
            <MdCancel />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Rejected</span>
            <span className={styles.statValue}>{stats.rejected}</span>
          </div>
        </div>
      </div>

      {/* Total nominal */}
      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Total Nominal:</span>
        <span className={styles.totalValue}>{formatRupiah(stats.totalJumlah)}</span>
      </div>

      {/* Filter & Search */}
      <div className={styles.controls}>
        <div className={styles.searchField}>
          <MdSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari nama siswa atau ID siswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.select}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 56, textAlign: 'center' }}>No</th>
                <th>ID</th>
                <th>Nama Siswa</th>
                <th>Bulan</th>
                <th>Tgl. Bayar</th>
                <th>Jenis</th>
                <th style={{ textAlign: 'right' }}>Jumlah</th>
                <th>Metode</th>
                <th>Status</th>
                <th style={{ textAlign: 'center', width: 100 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className={styles.tableEmpty}>
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={10} className={styles.tableEmpty}>
                    Tidak ada data pembayaran.
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.id_pembayaran}>
                    <td className={styles.centerCell}>{index + 1}</td>
                    <td className={styles.idCell}>#{item.id_pembayaran}</td>
                    <td className={styles.namaCell}>{item.nama_siswa || '—'}</td>
                    <td>{item.bulan || '—'}</td>
                    <td>{formatTanggal(item.tanggal_bayar)}</td>
                    <td>{item.jenis_pembayaran || '—'}</td>
                    <td className={styles.nominalCell}>
                      {formatRupiah(item.jumlah)}
                      {item.diskon > 0 && (
                        <span className={styles.diskonLabel}>
                          (diskon {formatRupiah(item.diskon)})
                        </span>
                      )}
                    </td>
                    <td>{item.metode_pembayaran || '—'}</td>
                    <td>
                      <span className={`${styles.badge} ${statusBadge(item.status)}`}>
                        <span className={styles.badgeIcon}>{statusIcon(item.status)}</span>
                        {item.status}
                      </span>
                    </td>
                    <td className={styles.actionCell}>
                      <button
                        type="button"
                        className={styles.btnDetail}
                        onClick={() => setDetailItem(item)}
                        title="Lihat detail pembayaran"
                      >
                        <MdVisibility />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal Detail ──────────────── */}
      {detailItem && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-title"
          onClick={() => setDetailItem(null)}
        >
          <div
            className={styles.modalDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.modalHeader}>
              <div>
                <h3 id="detail-title" className={styles.modalTitle}>
                  <MdPayments className={styles.modalTitleIcon} />
                  Detail Pembayaran #{detailItem.id_pembayaran}
                </h3>
                <p className={styles.modalSubtitle}>
                  Informasi lengkap transaksi pembayaran
                </p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setDetailItem(null)}
                aria-label="Tutup"
              >
                <MdClose />
              </button>
            </header>

            <div className={styles.modalBody}>
              {/* Ringkasan */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>Ringkasan</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailField}>
                    <span className={styles.detailLabel}>ID Pembayaran</span>
                    <span className={styles.detailValue}>#{detailItem.id_pembayaran}</span>
                  </div>
                  <div className={styles.detailField}>
                    <span className={styles.detailLabel}>Status</span>
                    <span className={`${styles.detailBadge} ${statusBadge(detailItem.status)}`}>
                      <span className={styles.badgeIcon}>{statusIcon(detailItem.status)}</span>
                      {detailItem.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Siswa */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>Data Siswa</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailFieldFull}>
                    <span className={styles.detailLabel}>Nama Siswa</span>
                    <span className={styles.detailValue}>{detailItem.nama_siswa || '—'}</span>
                  </div>
                  <div className={styles.detailField}>
                    <span className={styles.detailLabel}>ID Siswa</span>
                    <span className={styles.detailValue}>#{detailItem.id_siswa}</span>
                  </div>
                  <div className={styles.detailField}>
                    <span className={styles.detailLabel}>Periode Bulan</span>
                    <span className={styles.detailValue}>{detailItem.bulan || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Detail Pembayaran */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>Detail Pembayaran</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailField}>
                    <span className={styles.detailLabel}>Jenis Pembayaran</span>
                    <span className={styles.detailValue}>{detailItem.jenis_pembayaran || '—'}</span>
                  </div>
                  <div className={styles.detailField}>
                    <span className={styles.detailLabel}>Metode Pembayaran</span>
                    <span className={styles.detailValue}>{detailItem.metode_pembayaran || '—'}</span>
                  </div>
                  <div className={styles.detailField}>
                    <span className={styles.detailLabel}>Tanggal Bayar</span>
                    <span className={styles.detailValue}>{formatTanggal(detailItem.tanggal_bayar)}</span>
                  </div>
                  <div className={styles.detailField}>
                    <span className={styles.detailLabel}>Tanggal Verifikasi</span>
                    <span className={styles.detailValue}>{formatTanggal(detailItem.tanggal_verifikasi)}</span>
                  </div>
                  <div className={styles.detailField}>
                    <span className={styles.detailLabel}>Jumlah</span>
                    <span className={`${styles.detailValue} ${styles.detailValueBold}`}>
                      {formatRupiah(detailItem.jumlah)}
                    </span>
                  </div>
                  <div className={styles.detailField}>
                    <span className={styles.detailLabel}>Diskon</span>
                    <span className={styles.detailValue}>
                      {detailItem.diskon > 0 ? formatRupiah(detailItem.diskon) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Catatan */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>Catatan</h4>
                <div className={styles.detailCatatan}>
                  {detailItem.catatan || <span className={styles.detailEmpty}>Tidak ada catatan</span>}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => setDetailItem(null)}
              >
                <MdClose className={styles.btnIcon} />
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SemuaPembayaran;
