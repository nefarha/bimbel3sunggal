import React, { useEffect, useState, useCallback } from 'react';
import {
  MdSearch,
  MdAdd,
  MdRefresh,
  MdSchool,
  MdCheckCircle,
  MdClose,
  MdSave,
} from 'react-icons/md';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './daftar_kelas.module.css';

const DaftarKelas = () => {
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nama_kelas: '', id_mapel: '', id_tutor: '' });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [mapelOptions, setMapelOptions] = useState([]);
  const [tutorOptions, setTutorOptions] = useState([]);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchKelas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/kelas');
      const data = response.data?.data || [];
      setKelasList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch kelas error:', err);
      setError(err.response?.data?.message || err.message || 'Gagal memuat data kelas.');
      setKelasList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOptions = useCallback(async () => {
    try {
      const [mapelRes, tutorRes] = await Promise.all([
        api.get('/mapel'),
        api.get('/guru'),
      ]);
      const mapelData = Array.isArray(mapelRes.data?.data) ? mapelRes.data.data : [];
      const tutorData = Array.isArray(tutorRes.data?.data) ? tutorRes.data.data : [];
      setMapelOptions(mapelData);

      setTutorOptions(tutorData.filter((t) => t.status === 'Aktif'));
    } catch (err) {
      console.error('Fetch options error:', err);
    }
  }, []);

  useEffect(() => {
    fetchKelas();
    fetchOptions();
  }, [fetchKelas, fetchOptions]);

  const filteredKelas = kelasList.filter((k) => {
    if (!search.trim()) return true;
    const keyword = search.trim().toLowerCase();
    return (
      (k.nama_kelas || '').toLowerCase().includes(keyword) ||
      (k.nama_tutor || '').toLowerCase().includes(keyword) ||
      (k.nama_mapel || '').toLowerCase().includes(keyword)
    );
  });

  const totalKelas = kelasList.length;
  const totalSiswa = kelasList.reduce((sum, k) => sum + Number(k.jumlah_siswa || 0), 0);

  const openModal = () => {
    setFormData({ nama_kelas: '', id_mapel: '', id_tutor: '' });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setFormError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nama_kelas.trim()) {
      setFormError('Nama kelas wajib diisi.');
      return;
    }
    if (!formData.id_mapel) {
      setFormError('Mata pelajaran wajib dipilih.');
      return;
    }
    if (!formData.id_tutor) {
      setFormError('Tutor wajib dipilih.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        nama_kelas: formData.nama_kelas.trim(),
        id_mapel: Number(formData.id_mapel),
        id_tutor: Number(formData.id_tutor),
      };
      await api.post('/kelas', payload);
      setToast({
        title: 'Kelas Berhasil Ditambahkan',
        message: `Kelas "${payload.nama_kelas}" berhasil ditambahkan.`,
      });
      closeModal();
      fetchKelas();
    } catch (err) {
      console.error('Create kelas error:', err);
      setFormError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Gagal menambahkan kelas.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      {}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>DAFTAR KELAS</h2>
        <button
          type="button"
          className={styles.btnRefresh}
          onClick={fetchKelas}
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
            <MdSchool />
          </div>
          <div className={styles.statBody}>
            <p className={styles.statLabel}>Total Kelas</p>
            <p className={styles.statValue}>{totalKelas}</p>
          </div>
        </article>
        <article className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconSuccess}`}>
            <MdSchool />
          </div>
          <div className={styles.statBody}>
            <p className={styles.statLabel}>Total Siswa</p>
            <p className={styles.statValue}>{totalSiswa}</p>
          </div>
        </article>
      </section>

      {}
      <section className={styles.actionBar}>
        <button type="button" className={styles.btnPrimary} onClick={openModal}>
          <MdAdd className={styles.btnIcon} />
          Tambah Kelas
        </button>

        <div className={styles.searchField}>
          <MdSearch className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Cari kelas, tutor, atau mapel…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {}
      <section className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '8%' }}>No</th>
                <th style={{ width: '28%' }}>Nama Kelas</th>
                <th style={{ width: '22%' }}>Tutor</th>
                <th style={{ width: '22%' }}>Mata Pelajaran</th>
                <th style={{ width: '10%', textAlign: 'center' }}>Jumlah Siswa</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className={styles.tableEmpty}>
                    Memuat data kelas…
                  </td>
                </tr>
              )}

              {!loading && filteredKelas.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.tableEmpty}>
                    {kelasList.length === 0
                      ? 'Belum ada data kelas.'
                      : 'Tidak ada kelas yang cocok dengan pencarian.'}
                  </td>
                </tr>
              )}

              {!loading &&
                filteredKelas.map((kelas, index) => (
                  <tr key={kelas.id_kelas}>
                    <td>{index + 1}</td>
                    <td className={styles.tutorCell}>{kelas.nama_kelas || '—'}</td>
                    <td className={styles.tutorCell}>{kelas.nama_tutor || '—'}</td>
                    <td className={styles.mapelCell}>{kelas.nama_mapel || '—'}</td>
                    <td className={styles.numericCell}>{kelas.jumlah_siswa || 0}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {}
      {showModal && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tambah-title"
          onClick={closeModal}
        >
          <div
            className={styles.modalDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.modalHeader}>
              <div>
                <h3 id="tambah-title" className={styles.modalTitle}>
                  <MdAdd className={styles.modalTitleIcon} />
                  Tambah Kelas
                </h3>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={closeModal}
                aria-label="Tutup"
                disabled={saving}
              >
                ×
              </button>
            </header>

            {formError && (
              <div className={styles.modalAlert} role="alert">
                {formError}
              </div>
            )}

            <form className={styles.modalBody} onSubmit={handleSubmit}>
              {}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="nama_kelas">
                  Nama Kelas
                </label>
                <input
                  id="nama_kelas"
                  name="nama_kelas"
                  type="text"
                  className={styles.input}
                  placeholder="Contoh: Kelas A"
                  value={formData.nama_kelas}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              {}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="id_mapel">
                  Mata Pelajaran
                </label>
                <select
                  id="id_mapel"
                  name="id_mapel"
                  className={styles.input}
                  value={formData.id_mapel}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">Pilih mapel</option>
                  {mapelOptions.map((m) => (
                    <option key={m.id_mapel} value={m.id_mapel}>
                      {m.nama_mapel}
                    </option>
                  ))}
                </select>
              </div>

              {}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="id_tutor">
                  Tutor
                </label>
                <select
                  id="id_tutor"
                  name="id_tutor"
                  className={styles.input}
                  value={formData.id_tutor}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">Pilih tutor</option>
                  {tutorOptions.map((t) => (
                    <option key={t.id_tutor} value={t.id_tutor}>
                      {t.nama_tutor || t.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={closeModal}
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
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default DaftarKelas;
