import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdSearch,
  MdAdd,
  MdVisibility,
  MdEdit,
  MdRefresh,
  MdCheckCircle,
  MdCancel,
  MdGroup,
  MdClose,
  MdSave,
  MdChevronLeft,
  MdChevronRight,
  MdFileDownload,
} from 'react-icons/md';
import { exportToExcel } from '../../../utils/exportExcel';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './manajemen_tutor.module.css';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua status' },
  { value: 'Aktif', label: 'Aktif' },
  { value: 'Nonaktif', label: 'Nonaktif' },
];

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

const formatTanggalID = (value) => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const formatJenisKelamin = (value) => {
  if (value === 'L') return 'Laki-laki';
  if (value === 'P') return 'Perempuan';
  return '—';
};

const initialEditForm = {
  id_tutor: null,
  nama_tutor: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  jenis_kelamin: '',
  status: 'Aktif',
  alamat: '',
  no_hp: '',
  mapel: [],
};

const ManajemenTutor = () => {
  const navigate = useNavigate();
  const [tutorList, setTutorList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mapelFilter, setMapelFilter] = useState('all');
  const [mapelOptions, setMapelOptions] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [viewingTutor, setViewingTutor] = useState(null);
  const [editingTutor, setEditingTutor] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editError, setEditError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchTutor = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/guru');
      const data = response.data?.data || [];
      setTutorList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch tutor error:', err);
      setTutorList([]);
      setError(null);
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

  useEffect(() => {
    fetchTutor();
    fetchMapelOptions();
  }, [fetchTutor, fetchMapelOptions]);

  const availableMapel = useMemo(() => {
    const set = new Set();
    tutorList.forEach((t) => {
      const ids = parseMapelIds(t.mapel);
      ids.forEach((id) => {
        const name = getMapelName(id, mapelOptions);
        if (name) set.add(name);
      });
    });
    mapelOptions.forEach((item) => {
      if (item?.nama_mapel) set.add(item.nama_mapel);
    });
    return Array.from(set);
  }, [mapelOptions, tutorList]);

  const filteredTutor = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return tutorList.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (mapelFilter !== 'all') {
        const ids = parseMapelIds(t.mapel);
        const names = ids.map((id) => getMapelName(id, mapelOptions)).filter(Boolean);
        if (!names.includes(mapelFilter)) return false;
      }
      if (keyword) {
        const haystack = `${t.nama || ''} ${t.nip || ''}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      return true;
    });
  }, [tutorList, search, statusFilter, mapelFilter, mapelOptions]);

  const stats = useMemo(() => {
    const total = tutorList.length;
    const aktif = tutorList.filter((t) => t.status === 'Aktif').length;
    const nonaktif = total - aktif;
    return { total, aktif, nonaktif };
  }, [tutorList]);

  const totalPages = Math.max(1, Math.ceil(filteredTutor.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const pagedTutor = filteredTutor.slice(pageStart, pageEnd);
  const rangeStart = filteredTutor.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageEnd, filteredTutor.length);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const openEditModal = (tutor) => {
    setEditingTutor(tutor);
    setEditForm({
      id_tutor: tutor.id_tutor,
      nama_tutor: tutor.nama_tutor || tutor.nama || '',
      tempat_lahir: tutor.tempat_lahir || '',
      tanggal_lahir: tutor.tanggal_lahir ? String(tutor.tanggal_lahir).slice(0, 10) : '',
      jenis_kelamin: tutor.jenis_kelamin || '',
      status: tutor.status || 'Aktif',
      alamat: tutor.alamat || '',
      no_hp: tutor.no_hp || '',
      mapel: parseMapelIds(tutor.mapel),
    });
    setEditError(null);
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
  };

  const closeDetailModal = () => {
    setViewingTutor(null);
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditingTutor(null);
    setEditForm(initialEditForm);
    setEditError(null);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    if (!editingTutor) return;

    if (!editForm.nama_tutor.trim()) {
      setEditError('Nama tutor wajib diisi.');
      return;
    }
    if (editForm.no_hp && !/^[0-9+\-\s()]{6,20}$/.test(editForm.no_hp)) {
      setEditError('Format nomor telepon tidak valid.');
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      const payload = {
        nama_tutor: editForm.nama_tutor.trim(),
        tempat_lahir: editForm.tempat_lahir || null,
        tanggal_lahir: editForm.tanggal_lahir || null,
        jenis_kelamin: editForm.jenis_kelamin || null,
        alamat: editForm.alamat || null,
        no_hp: editForm.no_hp || null,
        status: editForm.status,
        mapel: JSON.stringify(editForm.mapel),
      };
      const response = await api.put(`/guru/${editingTutor.id_tutor}`, payload);
      const updated = response.data?.data;

      setTutorList((prev) =>
        prev.map((t) =>
          t.id_tutor === editingTutor.id_tutor ? { ...t, ...(updated || payload) } : t
        )
      );

      setToast({
        title: 'Data Tutor Diperbarui',
        message: `Data tutor atas nama ${payload.nama_tutor} berhasil disimpan.`,
      });
      closeEditModal();
    } catch (err) {
      console.error('Update tutor error:', err);
      const apiMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Gagal memperbarui data tutor.';
      setEditError(apiMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleTambahTutor = () => {
    navigate('/admin/guru/tambah');
  };

  const handleLihat = (tutor) => {
    setViewingTutor(tutor);
  };

  const handleExport = () => {
    const columns = [
      { header: 'No', key: 'no' },
      { header: 'Nama', key: 'nama' },
      { header: 'No. HP', key: 'no_hp' },
      { header: 'Alamat', key: 'alamat' },
      { header: 'Mapel', key: 'mapel' },
      { header: 'Status', key: 'status' },
    ];
    const rows = filteredTutors.map((t, i) => ({
      no: i + 1,
      nama: t.nama_tutor || '',
      no_hp: t.no_hp || '',
      alamat: t.alamat || '',
      mapel: t.nama_mapel || '',
      status: t.status || '',
    }));
    exportToExcel(rows, columns, 'Manajemen_Tutor');
  };

  return (
    <AdminLayout>
      {}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>MANAJEMEN TUTOR</h2>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnRefresh}
            onClick={fetchTutor}
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
            <p className={styles.statLabel}>Total Tutor (Terfilter)</p>
            <p className={styles.statValue}>{filteredTutor.length}</p>
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
            <MdCancel />
          </div>
          <div className={styles.statBody}>
            <p className={styles.statLabel}>Nonaktif</p>
            <p className={styles.statValue}>{stats.nonaktif}</p>
          </div>
        </article>
      </section>

      {}
      <section className={styles.actionBar}>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={handleTambahTutor}
        >
          <MdAdd className={styles.btnIcon} />
          Tambah Tutor
        </button>

        <div className={styles.searchField}>
          <MdSearch className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Cari nama tutor"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className={styles.filterBar}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={mapelFilter}
            onChange={(e) => {
              setMapelFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Semua mapel</option>
            {availableMapel.map((mapel) => (
              <option key={mapel} value={mapel}>
                {mapel}
              </option>
            ))}
          </select>
        </div>
      </section>

      {}
      <section className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '6%' }}>NO</th>
                <th style={{ width: '12%' }}>NIP</th>
                <th style={{ width: '20%' }}>NAMA</th>
                <th style={{ width: '16%' }}>MAPEL</th>
                <th style={{ width: '18%' }}>JADWAL</th>
                <th style={{ width: '14%' }}>STATUS</th>
                <th style={{ width: '14%', textAlign: 'center' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className={styles.tableEmpty}>
                    Memuat data tutor…
                  </td>
                </tr>
              )}

              {!loading && filteredTutor.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.tableEmpty}>
                    {tutorList.length === 0
                      ? 'Belum ada data tutor. Data akan tersedia setelah endpoint backend siap.'
                      : 'Tidak ada tutor yang cocok dengan pencarian.'}
                  </td>
                </tr>
              )}

              {!loading &&
                pagedTutor.map((tutor, index) => {
                  const mapelIds = parseMapelIds(tutor.mapel);
                  const mapelNames = mapelIds.map((id) => getMapelName(id, mapelOptions)).filter(Boolean);
                  const jadwalText = tutor.jadwal
                    ? (Array.isArray(tutor.jadwal) ? tutor.jadwal.join(', ') : String(tutor.jadwal))
                    : '';
                  const statusClass =
                    tutor.status === 'Aktif'
                      ? styles.badgeSuccess
                      : styles.badgeMuted;
                  const no = pageStart + index + 1;
                  return (
                    <tr key={tutor.id_tutor ?? `${tutor.nip}-${index}`}>
                      <td>{no}</td>
                      <td className={styles.nipCell}>{tutor.nip || '—'}</td>
                      <td className={styles.nameCell}>{tutor.nama || '—'}</td>
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
                      <td className={styles.jadwalCell}>
                        {!jadwalText ? (
                          <span className={styles.muted}>—</span>
                        ) : (
                          jadwalText
                        )}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${statusClass}`}>
                          <span className={styles.badgeDot} />
                          {tutor.status === 'Aktif' ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionCell}>
                          <button
                            type="button"
                            className={`${styles.iconButton} ${styles.iconButtonView}`}
                            onClick={() => handleLihat(tutor)}
                            title="Lihat detail"
                            aria-label="Lihat detail"
                          >
                            <MdVisibility />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconButton} ${styles.iconButtonEdit}`}
                            onClick={() => openEditModal(tutor)}
                            title="Edit tutor"
                            aria-label="Edit tutor"
                          >
                            <MdEdit />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {}
        <div className={styles.tableFooter}>
          <span className={styles.tableCount}>
            Menampilkan {rangeStart} sampai {rangeEnd} dari {filteredTutor.length} data
          </span>

          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageNav}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label="Halaman sebelumnya"
            >
              <MdChevronLeft />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`${styles.pageNumber} ${
                  page === safePage ? styles.pageNumberActive : ''
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className={styles.pageNav}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              aria-label="Halaman berikutnya"
            >
              <MdChevronRight />
            </button>
          </div>
        </div>
      </section>

      {}
      {viewingTutor && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-title"
          onClick={closeDetailModal}
        >
          <div
            className={styles.modalDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.modalHeader}>
              <div>
                <h3 id="detail-title" className={styles.modalTitle}>
                  <MdVisibility className={styles.modalTitleIcon} />
                  Detail Tutor
                </h3>
                <p className={styles.modalSubtitle}>
                  {viewingTutor.nama || '—'} ·{' '}
                  <span className={styles.muted}>
                    NIP {viewingTutor.nip || '—'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={closeDetailModal}
                aria-label="Tutup"
              >
                ×
              </button>
            </header>

            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>ID Tutor</span>
                  <span className={styles.detailValue}>{viewingTutor.id_tutor || '—'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>ID User</span>
                  <span className={styles.detailValue}>{viewingTutor.id_user || '—'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Username / NIP</span>
                  <span className={styles.detailValue}>{viewingTutor.nip || '—'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Nama Tutor</span>
                  <span className={styles.detailValue}>{viewingTutor.nama_tutor || viewingTutor.nama || '—'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Tempat Lahir</span>
                  <span className={styles.detailValue}>{viewingTutor.tempat_lahir || '—'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Tanggal Lahir</span>
                  <span className={styles.detailValue}>{formatTanggalID(viewingTutor.tanggal_lahir)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Jenis Kelamin</span>
                  <span className={styles.detailValue}>{formatJenisKelamin(viewingTutor.jenis_kelamin)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Pendidikan</span>
                  <span className={styles.detailValue}>{viewingTutor.pendidikan || '—'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Nomor Telepon</span>
                  <span className={styles.detailValue}>{viewingTutor.no_hp || '—'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Tanggal Bergabung</span>
                  <span className={styles.detailValue}>{formatTanggalID(viewingTutor.tanggal_bergabung)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Status</span>
                  <span className={styles.detailValue}>{viewingTutor.status || '—'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Mapel / Kelas</span>
                  <span className={styles.detailValue}>
                    {(() => {
                      const ids = parseMapelIds(viewingTutor.mapel);
                      const names = ids.map((id) => getMapelName(id, mapelOptions)).filter(Boolean);
                      return names.length > 0 ? names.join(', ') : (String(viewingTutor.mapel || '—'));
                    })()}
                  </span>
                </div>
                <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                  <span className={styles.detailLabel}>Alamat</span>
                  <span className={styles.detailValue}>{viewingTutor.alamat || '—'}</span>
                </div>
                <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                  <span className={styles.detailLabel}>Jadwal</span>
                  <span className={styles.detailValue}>{viewingTutor.jadwal || '—'}</span>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={closeDetailModal}
                >
                  <MdClose className={styles.btnIcon} />
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {editingTutor && (
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
                  Edit Data Tutor
                </h3>
                <p className={styles.modalSubtitle}>
                  {editingTutor.nama_tutor || editingTutor.nama} ·{' '}
                  <span className={styles.muted}>
                    NIP {editingTutor.nip || '—'}
                  </span>
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
              <div className={styles.field}>
                <label className={styles.label} htmlFor="edit-nama-tutor">
                  Nama Tutor
                </label>
                <input
                  id="edit-nama-tutor"
                  name="nama_tutor"
                  type="text"
                  className={styles.input}
                  value={editForm.nama_tutor}
                  onChange={handleEditChange}
                  disabled={saving}
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="edit-tempat-lahir">
                    Tempat Lahir
                  </label>
                  <input
                    id="edit-tempat-lahir"
                    name="tempat_lahir"
                    type="text"
                    className={styles.input}
                    value={editForm.tempat_lahir}
                    onChange={handleEditChange}
                    disabled={saving}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="edit-tanggal-lahir">
                    Tanggal Lahir
                  </label>
                  <input
                    id="edit-tanggal-lahir"
                    name="tanggal_lahir"
                    type="date"
                    className={styles.input}
                    value={editForm.tanggal_lahir}
                    onChange={handleEditChange}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="edit-jenis-kelamin">
                    Jenis Kelamin
                  </label>
                  <select
                    id="edit-jenis-kelamin"
                    name="jenis_kelamin"
                    className={styles.input}
                    value={editForm.jenis_kelamin}
                    onChange={handleEditChange}
                    disabled={saving}
                  >
                    <option value="">Pilih jenis kelamin</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="edit-status">
                    Status Tutor
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
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="edit-no-hp">
                  Nomor Telepon
                </label>
                <input
                  id="edit-no-hp"
                  name="no_hp"
                  type="text"
                  className={styles.input}
                  value={editForm.no_hp}
                  onChange={handleEditChange}
                  disabled={saving}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="edit-alamat">
                  Alamat
                </label>
                <textarea
                  id="edit-alamat"
                  name="alamat"
                  className={styles.textarea}
                  value={editForm.alamat}
                  onChange={handleEditChange}
                  disabled={saving}
                  rows={4}
                />
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
                  Chip berwarna biru menandakan mapel yang sudah dimiliki tutor.
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

export default ManajemenTutor;
