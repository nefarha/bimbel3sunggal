import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  MdSearch,
  MdEdit,
  MdRefresh,
  MdGroup,
  MdCheckCircle,
  MdClose,
  MdSave,
  MdFilterList,
} from 'react-icons/md';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './manajemen_siswa.module.css';

// Opsi jenis_kelas (sama dengan yang dipakai di Pendaftaran Siswa)
const JENIS_KELAS_OPTIONS = [
  'Calistung',
  'Bimbel SD',
  'Bimbel SMP',
  'Bimbel SMA',
  'English Course',
  'Mafia',
];

const STATUS_OPTIONS = [
  { value: 'Aktif', label: 'Aktif' },
  { value: 'Nonaktif', label: 'Nonaktif' },
];

const formatRupiah = (value) => {
  const num = Number(value) || 0;
  return `Rp ${num.toLocaleString('en-US')}`;
};

const formatNumericInput = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = String(value).replace(/\D/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseNumericInput = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  return Number(String(value).replace(/\./g, '')) || 0;
};

const formatTanggalID = (value) => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const splitJenisKelas = (value) => {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const initialEditForm = {
  id_siswa: null,
  nama: '',
  kelas: '',
  status: 'Aktif',
  spp: '',
  jenis_kelas: [],
};

const ManajemenSiswa = () => {
  const [siswaList, setSiswaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jenisKelasFilter, setJenisKelasFilter] = useState('all');

  // Modal edit state
  const [editingSiswa, setEditingSiswa] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editError, setEditError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchSiswa = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/siswa');
      const data = response.data?.data || [];
      setSiswaList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch siswa error:', err);
      const apiMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Gagal memuat data siswa.';
      setError(apiMessage);
      setSiswaList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSiswa();
  }, [fetchSiswa]);

  // Daftar jenis_kelas unik yang muncul di data (untuk opsi filter dinamis)
  const availableJenisKelas = useMemo(() => {
    const set = new Set();
    siswaList.forEach((s) => {
      splitJenisKelas(s.jenis_kelas).forEach((jk) => set.add(jk));
    });
    // Tambahkan opsi default agar filter tetap berguna walaupun data kosong
    JENIS_KELAS_OPTIONS.forEach((opt) => set.add(opt));
    return Array.from(set);
  }, [siswaList]);

  // Hasil filter + search
  const filteredSiswa = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return siswaList.filter((s) => {
      // Filter status
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;

      // Filter jenis_kelas
      if (jenisKelasFilter !== 'all') {
        const list = splitJenisKelas(s.jenis_kelas);
        if (!list.includes(jenisKelasFilter)) return false;
      }

      // Search nama
      if (keyword && !String(s.nama || '').toLowerCase().includes(keyword)) {
        return false;
      }
      return true;
    });
  }, [siswaList, search, statusFilter, jenisKelasFilter]);

  // Statistik ringkas
  const stats = useMemo(() => {
    const total = filteredSiswa.length;
    const aktif = filteredSiswa.filter((s) => s.status === 'Aktif').length;
    const nonaktif = total - aktif;
    return { total, aktif, nonaktif };
  }, [filteredSiswa]);

  // ─── Edit handlers ──────────────────────────────────────────
  const openEditModal = (siswa) => {
    setEditingSiswa(siswa);
    setEditForm({
      id_siswa: siswa.id_siswa,
      nama: siswa.nama || '',
      kelas: siswa.kelas || '',
      status: siswa.status || 'Aktif',
      spp: formatNumericInput(siswa.spp ?? 0),
      jenis_kelas: splitJenisKelas(siswa.jenis_kelas),
    });
    setEditError(null);
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditingSiswa(null);
    setEditForm(initialEditForm);
    setEditError(null);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    if (name === 'spp') {
      setEditForm((prev) => ({ ...prev, spp: formatNumericInput(value) }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleJenisKelas = (value) => {
    setEditForm((prev) => {
      const exists = prev.jenis_kelas.includes(value);
      return {
        ...prev,
        jenis_kelas: exists
          ? prev.jenis_kelas.filter((v) => v !== value)
          : [...prev.jenis_kelas, value],
      };
    });
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    if (!editingSiswa) return;

    if (editForm.jenis_kelas.length === 0) {
      setEditError('Pilih minimal satu jenis kelas.');
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      const payload = {
        status: editForm.status,
        spp: parseNumericInput(editForm.spp),
        jenis_kelas: editForm.jenis_kelas.join(', '),
      };
      const response = await api.put(`/siswa/${editingSiswa.id_siswa}`, payload);
      const updated = response.data?.data;

      // Update state list secara lokal
      setSiswaList((prev) =>
        prev.map((s) => (s.id_siswa === editingSiswa.id_siswa ? { ...s, ...(updated || payload) } : s))
      );

      setToast({
        title: 'Data Siswa Diperbarui',
        message: `Data siswa atas nama ${editingSiswa.nama} berhasil disimpan.`,
      });
      closeEditModal();
    } catch (err) {
      console.error('Update siswa error:', err);
      const apiMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Gagal memperbarui data siswa.';
      setEditError(apiMessage);
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setJenisKelasFilter('all');
  };

  return (
    <AdminLayout>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>MANAJEMEN SISWA</h2>
        <button
          type="button"
          className={styles.btnRefresh}
          onClick={fetchSiswa}
          disabled={loading}
        >
          <MdRefresh className={styles.btnIcon} />
          {loading ? 'Memuat…' : 'Refresh Data'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className={styles.alertError} role="alert">
          <span>{error}</span>
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

      {/* Toast */}
      {toast && (
        <div
          className={styles.toastOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="toast-title"
          onClick={() => setToast(null)}
        >
          <div
            className={styles.toastDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.toastIcon}>
              <MdCheckCircle />
            </div>
            <h3 id="toast-title" className={styles.toastTitle}>
              {toast.title}
            </h3>
            <p className={styles.toastMessage}>{toast.message}</p>
            <div className={styles.toastActions}>
              <button
                type="button"
                className={styles.toastButton}
                onClick={() => setToast(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconPrimary}`}>
            <MdGroup />
          </div>
          <div className={styles.statBody}>
            <p className={styles.statLabel}>Total Siswa (Terfilter)</p>
            <p className={styles.statValue}>{stats.total}</p>
          </div>
        </article>
        <article className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconSuccess}`}>
            <MdCheckCircle />
          </div>
          <div className={styles.statBody}>
            <p className={styles.statLabel}>Aktif</p>
            <p className={styles.statValue}>{stats.aktif}</p>
          </div>
        </article>
        <article className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconMuted}`}>
            <MdClose />
          </div>
          <div className={styles.statBody}>
            <p className={styles.statLabel}>Nonaktif</p>
            <p className={styles.statValue}>{stats.nonaktif}</p>
          </div>
        </article>
      </section>

      {/* Filter / search bar */}
      <section className={styles.filterBar}>
        <div className={styles.filterField}>
          <MdSearch className={styles.filterIcon} />
          <input
            type="text"
            className={styles.filterInput}
            placeholder="Cari nama siswa…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="statusFilter">
            Status
          </label>
          <select
            id="statusFilter"
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua Status</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="jenisKelasFilter">
            Jenis Kelas
          </label>
          <select
            id="jenisKelasFilter"
            className={styles.filterSelect}
            value={jenisKelasFilter}
            onChange={(e) => setJenisKelasFilter(e.target.value)}
          >
            <option value="all">Semua Jenis Kelas</option>
            {availableJenisKelas.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {(search || statusFilter !== 'all' || jenisKelasFilter !== 'all') && (
          <button
            type="button"
            className={styles.btnReset}
            onClick={resetFilters}
          >
            <MdFilterList className={styles.btnIcon} />
            Reset Filter
          </button>
        )}
      </section>

      {/* Tabel siswa */}
      <section className={styles.tableCard}>
        <header className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>
            <MdGroup className={styles.tableTitleIcon} />
            Daftar Siswa
          </h3>
          <span className={styles.tableCount}>
            Menampilkan {filteredSiswa.length} dari {siswaList.length} siswa
          </span>
        </header>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '24%' }}>Nama</th>
                <th style={{ width: '12%' }}>Kelas</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '14%' }}>Tanggal Masuk</th>
                <th style={{ width: '20%' }}>Jenis Kelas</th>
                <th style={{ width: '12%' }}>SPP</th>
                <th style={{ width: '8%', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className={styles.tableEmpty}>
                    Memuat data siswa…
                  </td>
                </tr>
              )}

              {!loading && filteredSiswa.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.tableEmpty}>
                    {siswaList.length === 0
                      ? 'Belum ada data siswa.'
                      : 'Tidak ada siswa yang cocok dengan filter / pencarian.'}
                  </td>
                </tr>
              )}

              {!loading &&
                filteredSiswa.map((siswa) => {
                  const jenisKelasList = splitJenisKelas(siswa.jenis_kelas);
                  const statusClass =
                    siswa.status === 'Aktif'
                      ? styles.badgeSuccess
                      : styles.badgeMuted;
                  return (
                    <tr key={siswa.id_siswa}>
                      <td>
                        <div className={styles.studentCell}>
                          <div className={styles.studentAvatar}>
                            {(siswa.nama || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.studentName}>
                            <span className={styles.studentNameText}>
                              {siswa.nama || '—'}
                            </span>
                            <span className={styles.studentId}>
                              ID: {siswa.id_siswa}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{siswa.kelas || '—'}</td>
                      <td>
                        <span className={`${styles.badge} ${statusClass}`}>
                          {siswa.status || '—'}
                        </span>
                      </td>
                      <td>{formatTanggalID(siswa.tanggal_masuk)}</td>
                      <td>
                        {jenisKelasList.length === 0 ? (
                          <span className={styles.muted}>—</span>
                        ) : (
                          <div className={styles.chipGroup}>
                            {jenisKelasList.map((jk) => (
                              <span key={jk} className={styles.chip}>
                                {jk}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className={styles.numericCell}>
                        {formatRupiah(siswa.spp)}
                      </td>
                      <td className={styles.actionCell}>
                        <button
                          type="button"
                          className={styles.btnAction}
                          onClick={() => openEditModal(siswa)}
                          title="Edit siswa"
                        >
                          <MdEdit className={styles.btnIcon} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal edit */}
      {editingSiswa && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-title"
          onClick={closeEditModal}
        >
          <div
            className={styles.modalDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.modalHeader}>
              <div>
                <h3 id="edit-title" className={styles.modalTitle}>
                  <MdEdit className={styles.modalTitleIcon} />
                  Edit Data Siswa
                </h3>
                <p className={styles.modalSubtitle}>
                  {editingSiswa.nama} ·{' '}
                  <span className={styles.muted}>{editingSiswa.kelas || 'Tanpa kelas'}</span>
                </p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={closeEditModal}
                aria-label="Tutup"
                disabled={saving}
              >
                ×
              </button>
            </header>

            {editError && (
              <div className={styles.modalAlert} role="alert">
                {editError}
              </div>
            )}

            <form className={styles.modalBody} onSubmit={handleSaveEdit}>
              {/* Status */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="edit-status">
                  Status Siswa
                </label>
                <select
                  id="edit-status"
                  name="status"
                  className={styles.input}
                  value={editForm.status}
                  onChange={handleEditChange}
                  disabled={saving}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* SPP */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="edit-spp">
                  Nominal SPP (Rp)
                </label>
                <input
                  id="edit-spp"
                  name="spp"
                  type="text"
                  inputMode="numeric"
                  className={styles.input}
                  placeholder="0"
                  value={editForm.spp}
                  onChange={handleEditChange}
                  disabled={saving}
                />
                <p className={styles.fieldHint}>
                  Nominal akan tersimpan sebagai:{' '}
                  <strong>{formatRupiah(parseNumericInput(editForm.spp))}</strong>
                </p>
              </div>

              {/* Jenis kelas (multi-select chip) */}
              <div className={styles.field}>
                <label className={styles.label}>Jenis Kelas</label>
                <div className={styles.chipSelectGroup}>
                  {JENIS_KELAS_OPTIONS.map((opt) => {
                    const selected = editForm.jenis_kelas.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        className={`${styles.chipSelect} ${
                          selected ? styles.chipSelectActive : ''
                        }`}
                        onClick={() => !saving && toggleJenisKelas(opt)}
                        disabled={saving}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <p className={styles.fieldHint}>
                  Pilih satu atau lebih jenis kelas. Tersimpan sebagai daftar
                  dipisah koma.
                </p>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  <MdClose className={styles.btnIcon} />
                  Batal
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={saving}
                >
                  <MdSave className={styles.btnIcon} />
                  {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManajemenSiswa;
