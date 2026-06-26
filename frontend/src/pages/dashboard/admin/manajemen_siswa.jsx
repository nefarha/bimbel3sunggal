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
  MdVisibility,
  MdPerson,
  MdSchool,
  MdCalendarToday,
  MdPhone,
  MdAttachMoney,
  MdBook,
  MdClass,
  MdFileDownload,
} from 'react-icons/md';
import { exportToExcel } from '../../../utils/exportExcel';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './manajemen_siswa.module.css';

const STATUS_OPTIONS = [
  { value: 'Aktif', label: 'Aktif' },
  { value: 'Nonaktif', label: 'Nonaktif' },
];

const TINGKATAN_KELAS = [
  'Kelas I',
  'Kelas II',
  'Kelas III',
  'Kelas IV',
  'Kelas V',
  'Kelas VI',
  'Kelas VII',
  'Kelas VIII',
  'Kelas IX',
  'Kelas X',
  'Kelas XI',
  'Kelas XII',
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

const parseMapelIds = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
};

const getMapelName = (id, options) => {
  const found = options.find((m) => m.id_mapel === id);
  return found ? found.nama_mapel : null;
};

const initialEditForm = {
  id_siswa: null,
  nama: '',
  nis: '',
  kelas: '',
  status: 'Aktif',
  spp: '',
  mapel: [],
  no_hp_ortu: '',
};

const ManajemenSiswa = () => {
  const [siswaList, setSiswaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mapelFilter, setMapelFilter] = useState('all');
  const [mapelOptions, setMapelOptions] = useState([]);

  const [editingSiswa, setEditingSiswa] = useState(null);
  const [previewSiswa, setPreviewSiswa] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editSelectedKelas, setEditSelectedKelas] = useState([]);
  const [editError, setEditError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [kelasOptions, setKelasOptions] = useState([]);

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

  const fetchMapelOptions = useCallback(async () => {
    try {
      const response = await api.get('/mapel');
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setMapelOptions(data);
    } catch (err) {
      console.error('Fetch mapel error:', err);
      setMapelOptions([]);
    }
  }, []);

  const fetchKelasOptions = useCallback(async () => {
    try {
      const response = await api.get('/kelas');
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setKelasOptions(data);
    } catch (err) {
      console.error('Fetch kelas error:', err);
      setKelasOptions([]);
    }
  }, []);

  useEffect(() => {
    fetchSiswa();
    fetchMapelOptions();
    fetchKelasOptions();
  }, [fetchSiswa, fetchMapelOptions, fetchKelasOptions]);

  const availableMapel = useMemo(() => {
    const set = new Set();
    siswaList.forEach((s) => {
      const ids = parseMapelIds(s.mapel);
      ids.forEach((id) => {
        const name = getMapelName(id, mapelOptions);
        if (name) set.add(name);
      });
    });
    mapelOptions.forEach((item) => {
      if (item?.nama_mapel) set.add(item.nama_mapel);
    });
    return Array.from(set);
  }, [siswaList, mapelOptions]);

  const filteredSiswa = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return siswaList.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;

      if (mapelFilter !== 'all') {
        const ids = parseMapelIds(s.mapel);
        const names = ids.map((id) => getMapelName(id, mapelOptions)).filter(Boolean);
        if (!names.includes(mapelFilter)) return false;
      }

      if (keyword && !String(s.nama || '').toLowerCase().includes(keyword)) {
        return false;
      }
      return true;
    });
  }, [siswaList, search, statusFilter, mapelFilter, mapelOptions]);

  const stats = useMemo(() => {
    const total = filteredSiswa.length;
    const aktif = filteredSiswa.filter((s) => s.status === 'Aktif').length;
    const nonaktif = total - aktif;
    return { total, aktif, nonaktif };
  }, [filteredSiswa]);

  const filteredKelasForEdit = useMemo(() => {
    if (editForm.mapel.length === 0) return [];
    return kelasOptions.filter((k) => editForm.mapel.includes(k.id_mapel));
  }, [kelasOptions, editForm.mapel]);

  const openEditModal = (siswa) => {
    setEditingSiswa(siswa);
    setEditForm({
      id_siswa: siswa.id_siswa,
      nama: siswa.nama || '',
      nis: siswa.nis || '',
      kelas: siswa.kelas || '',
      status: siswa.status || 'Aktif',
      spp: formatNumericInput(siswa.spp ?? 0),
      mapel: parseMapelIds(siswa.mapel),
      no_hp: siswa.no_hp || '',
    });
    setEditSelectedKelas([]);
    setEditError(null);

    api
      .get(`/siswa/${siswa.id_siswa}/kelas`)
      .then((res) => {
        const enrollments = Array.isArray(res.data?.data) ? res.data.data : [];
        setEditSelectedKelas(enrollments.map((e) => e.id_kelas));
      })
      .catch((err) => {
        console.error('Fetch siswa kelas error:', err);
      });
  };

  const openPreviewModal = (siswa) => {
    setPreviewSiswa(siswa);
  };

  const closePreviewModal = () => {
    setPreviewSiswa(null);
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditingSiswa(null);
    setEditForm(initialEditForm);
    setEditSelectedKelas([]);
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

  const toggleMapel = (value) => {
    setEditForm((prev) => {
      const exists = prev.mapel.includes(value);
      return {
        ...prev,
        mapel: exists
          ? prev.mapel.filter((v) => v !== value)
          : [...prev.mapel, value],
      };
    });

    setEditSelectedKelas([]);
  };

  const handleKelasToggle = (idKelas) => {
    setEditSelectedKelas((prev) => {
      const exists = prev.includes(idKelas);
      return exists
        ? prev.filter((k) => k !== idKelas)
        : [...prev, idKelas];
    });
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    if (!editingSiswa) return;

    if (editForm.mapel.length === 0) {
      setEditError('Pilih minimal satu mapel.');
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      const payload = {
        nis: editForm.nis || null,
        status: editForm.status,
        spp: parseNumericInput(editForm.spp),
        mapel: JSON.stringify(editForm.mapel),
        id_kelas: editSelectedKelas,
        kelas: editForm.kelas,
        no_hp_ortu: editForm.no_hp_ortu,
      };
      const response = await api.put(`/siswa/${editingSiswa.id_siswa}`, payload);
      const updated = response.data?.data;

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
    setMapelFilter('all');
  };

  const handleExport = () => {
    const columns = [
      { header: 'No', key: 'no' },
      { header: 'NIS', key: 'nis' },
      { header: 'Nama', key: 'nama' },
      { header: 'Kelas', key: 'kelas' },
      { header: 'Asal Sekolah', key: 'asal_sekolah' },
      { header: 'Status', key: 'status' },
      { header: 'No. HP', key: 'no_hp' },
      { header: 'SPP', key: 'spp' },
      { header: 'Tanggal Masuk', key: 'tanggal_masuk' },
    ];
    const rows = filteredSiswa.map((s, i) => ({
      no: i + 1,
      nis: s.nis || '',
      nama: s.nama || '',
      kelas: s.kelas || '',
      asal_sekolah: s.asal_sekolah || '',
      status: s.status || '',
      no_hp: s.no_hp || '',
      spp: s.spp || 0,
      tanggal_masuk: s.tanggal_masuk ? new Date(s.tanggal_masuk).toLocaleDateString('id-ID') : '',
    }));
    exportToExcel(rows, columns, 'Manajemen_Siswa');
  };

  return (
    <AdminLayout>
      {}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>MANAJEMEN SISWA</h2>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnRefresh}
            onClick={fetchSiswa}
            disabled={loading}
          >
            <MdRefresh className={styles.btnIcon} />
            {loading ? 'Memuat…' : 'Refresh Data'}
          </button>
          <button
            type="button"
            className={styles.btnExport}
            onClick={handleExport}
          >
            <MdFileDownload className={styles.btnIcon} />
            Export Excel
          </button>
        </div>
      </div>

      {}
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

      {}
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

      {}
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

      {}
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
          <label className={styles.filterLabel} htmlFor="mapelFilter">
            Mata Pelajaran
          </label>
          <select
            id="mapelFilter"
            className={styles.filterSelect}
            value={mapelFilter}
            onChange={(e) => setMapelFilter(e.target.value)}
          >
            <option value="all">Semua Mapel</option>
            {availableMapel.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {(search || statusFilter !== 'all' || mapelFilter !== 'all') && (
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

      {}
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
                <th style={{ width: '20%' }}>Mata Pelajaran</th>
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
                  const mapelIds = parseMapelIds(siswa.mapel);
                  const mapelNames = mapelIds.map((id) => getMapelName(id, mapelOptions)).filter(Boolean);
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
                        {mapelNames.length === 0 ? (
                          <span className={styles.muted}>—</span>
                        ) : (
                          <div className={styles.chipGroup}>
                            {mapelNames.map((name) => (
                              <span key={name} className={styles.chip}>
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className={styles.numericCell}>
                        {formatRupiah(siswa.spp)}
                      </td>
                      <td className={styles.actionCell}>
                        <div className={styles.actionGroup}>
                          <button
                            type="button"
                            className={styles.btnAction}
                            onClick={() => openPreviewModal(siswa)}
                            title="Lihat detail siswa"
                          >
                            <MdVisibility className={styles.btnIcon} />
                            Preview
                          </button>
                          <button
                            type="button"
                            className={styles.btnAction}
                            onClick={() => openEditModal(siswa)}
                            title="Edit siswa"
                          >
                            <MdEdit className={styles.btnIcon} />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {}
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
              {}
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

              {/* NIS */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="edit-nis">
                  NIS (Nomor Induk Siswa)
                </label>
                <input
                  id="edit-nis"
                  name="nis"
                  type="text"
                  className={styles.input}
                  placeholder="Contoh: 1234567890"
                  value={editForm.nis}
                  onChange={handleEditChange}
                  disabled={saving}
                />
              </div>

              {}
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="edit-kelas">
                    Kelas (Bangku Sekolah)
                  </label>
                  <select
                    id="edit-kelas"
                    name="kelas"
                    className={styles.input}
                    value={editForm.kelas}
                    onChange={handleEditChange}
                    disabled={saving}
                  >
                    <option value="">Pilih Kelas</option>
                    {TINGKATAN_KELAS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="edit-no-hp">
                    No. HP Orang Tua
                  </label>
                  <input
                    id="edit-no-hp"
                    name="no_hp"
                    type="text"
                    className={styles.input}
                    placeholder="Contoh: 081234500001"
                    value={editForm.no_hp}
                    onChange={handleEditChange}
                    disabled={saving}
                  />
                </div>
              </div>

              {}
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

              {}
              <div className={styles.field}>
                <label className={styles.label}>Mata Pelajaran</label>
                <div className={styles.chipSelectGroup}>
                  {mapelOptions.map((opt) => {
                    const selected = editForm.mapel.includes(opt.id_mapel);
                    return (
                      <button
                        key={opt.id_mapel}
                        type="button"
                        className={`${styles.chipSelect} ${
                          selected ? styles.chipSelectActive : ''
                        }`}
                        onClick={() => !saving && toggleMapel(opt.id_mapel)}
                        disabled={saving}
                      >
                        {opt.nama_mapel}
                      </button>
                    );
                  })}
                </div>
                <p className={styles.fieldHint}>
                  Chip berwarna biru menandakan mapel yang sudah dimiliki siswa.
                </p>
              </div>

              {}
              <div className={styles.field}>
                <label className={styles.label}>Pilih Kelas</label>
                {editForm.mapel.length === 0 ? (
                  <span className={styles.fieldHint}>
                    Pilih mata pelajaran terlebih dahulu untuk melihat kelas yang tersedia
                  </span>
                ) : filteredKelasForEdit.length === 0 ? (
                  <span className={styles.fieldHint}>
                    Tidak ada kelas tersedia untuk mapel yang dipilih
                  </span>
                ) : (
                  <div className={styles.chipSelectGroup}>
                    {filteredKelasForEdit.map((kelas) => {
                      const selected = editSelectedKelas.includes(kelas.id_kelas);
                      return (
                        <button
                          key={kelas.id_kelas}
                          type="button"
                          className={`${styles.chipSelect} ${
                            selected ? styles.chipSelectActive : ''
                          }`}
                          onClick={() => !saving && handleKelasToggle(kelas.id_kelas)}
                          disabled={saving}
                        >
                          {kelas.nama_kelas} ({kelas.nama_tutor || '—'})
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className={styles.fieldHint}>
                  Chip berwarna biru menandakan kelas yang sudah dipilih.
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

      {/* ─── Preview Modal ──────────────── */}
      {previewSiswa && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-title"
          onClick={closePreviewModal}
        >
          <div
            className={styles.previewDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.modalHeader}>
              <div>
                <h3 id="preview-title" className={styles.modalTitle}>
                  <MdVisibility className={styles.modalTitleIcon} />
                  Detail Siswa
                </h3>
                <p className={styles.modalSubtitle}>
                  Informasi lengkap data siswa
                </p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={closePreviewModal}
                aria-label="Tutup"
              >
                ×
              </button>
            </header>

            <div className={styles.previewBody}>
              {/* Data Siswa */}
              <div className={styles.previewSection}>
                <h4 className={styles.previewSectionTitle}>
                  <MdPerson style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Data Siswa
                </h4>
                <div className={styles.previewGrid}>
                  <div className={styles.previewFieldFull}>
                    <span className={styles.previewLabel}>Nama Lengkap</span>
                    <span className={styles.previewValue}>{previewSiswa.nama || '—'}</span>
                  </div>
                  <div className={styles.previewField}>
                    <span className={styles.previewLabel}>NIS</span>
                    <span className={styles.previewValue}>{previewSiswa.nis || '—'}</span>
                  </div>
                  <div className={styles.previewField}>
                    <span className={styles.previewLabel}>Status</span>
                    <span className={`${styles.previewBadge} ${previewSiswa.status === 'Aktif' ? styles.previewBadgeAktif : styles.previewBadgeNonaktif}`}>
                      {previewSiswa.status || '—'}
                    </span>
                  </div>
                  <div className={styles.previewField}>
                    <span className={styles.previewLabel}>Kelas (Sekolah)</span>
                    <span className={styles.previewValue}>{previewSiswa.kelas || '—'}</span>
                  </div>
                  <div className={styles.previewField}>
                    <span className={styles.previewLabel}>Tanggal Masuk</span>
                    <span className={styles.previewValue}>{formatTanggalID(previewSiswa.tanggal_masuk)}</span>
                  </div>
                  <div className={styles.previewField}>
                    <span className={styles.previewLabel}>Asal Sekolah</span>
                    <span className={styles.previewValue}>{previewSiswa.asal_sekolah || '—'}</span>
                  </div>
                  <div className={styles.previewFieldFull}>
                    <span className={styles.previewLabel}>Alamat</span>
                    <span className={styles.previewValue}>{previewSiswa.alamat || '—'}</span>
                  </div>
                  <div className={styles.previewFieldFull}>
                    <span className={styles.previewLabel}>Mata Pelajaran</span>
                    <div>
                      {(() => {
                        const ids = parseMapelIds(previewSiswa.mapel);
                        const names = ids.map((id) => getMapelName(id, mapelOptions)).filter(Boolean);
                        return names.length > 0
                          ? names.map((name) => (
                              <span key={name} className={styles.previewChip}>{name}</span>
                            ))
                          : <span className={styles.previewValue}>—</span>;
                      })()}
                    </div>
                  </div>
                  <div className={styles.previewField}>
                    <span className={styles.previewLabel}>SPP Bulanan</span>
                    <span className={styles.previewValue}>{formatRupiah(previewSiswa.spp)}</span>
                  </div>
                  <div className={styles.previewField}>
                    <span className={styles.previewLabel}>ID Siswa</span>
                    <span className={styles.previewValue}>#{previewSiswa.id_siswa}</span>
                  </div>
                </div>
              </div>

              {/* Data Orang Tua / Wali */}
              <div className={styles.previewSection}>
                <h4 className={styles.previewSectionTitle}>
                  <MdPhone style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Data Orang Tua / Wali
                </h4>
                <div className={styles.previewGrid}>
                  <div className={styles.previewField}>
                    <span className={styles.previewLabel}>Nama Wali</span>
                    <span className={styles.previewValue}>{previewSiswa.nama_ortu || '—'}</span>
                  </div>
                  <div className={styles.previewField}>
                    <span className={styles.previewLabel}>Pekerjaan</span>
                    <span className={styles.previewValue}>{previewSiswa.pekerjaan_ortu || '—'}</span>
                  </div>
                  <div className={styles.previewField}>
                    <span className={styles.previewLabel}>No. HP</span>
                    <span className={styles.previewValue}>{previewSiswa.no_hp_ortu || '—'}</span>
                  </div>
                  <div className={styles.previewField}>
                    <span className={styles.previewLabel}>Pendidikan</span>
                    <span className={styles.previewValue}>{previewSiswa.pendidikan_ortu || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalActions} style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={closePreviewModal}
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

export default ManajemenSiswa;
