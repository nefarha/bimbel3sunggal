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
  kelas: '',
  status: 'Aktif',
  spp: '',
  mapel: [],
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
      kelas: siswa.kelas || '',
      status: siswa.status || 'Aktif',
      spp: formatNumericInput(siswa.spp ?? 0),
      mapel: parseMapelIds(siswa.mapel),
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
        status: editForm.status,
        spp: parseNumericInput(editForm.spp),
        mapel: JSON.stringify(editForm.mapel),
        id_kelas: editSelectedKelas,
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

  return (
    <AdminLayout>
      {}
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
    </AdminLayout>
  );
};

export default ManajemenSiswa;
