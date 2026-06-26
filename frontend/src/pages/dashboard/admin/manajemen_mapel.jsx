import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MdSearch,
  MdAdd,
  MdEdit,
  MdDelete,
  MdRefresh,
  MdClose,
  MdSave,
  MdBook,
  MdFileDownload,
} from 'react-icons/md';
import { exportToExcel } from '../../../utils/exportExcel';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './manajemen_mapel.module.css';

const ManajemenMapel = () => {
  const [mapelList, setMapelList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMapel = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/mapel');
      setMapelList(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error('Gagal memuat mapel:', err);
      setMapelList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapel();
  }, [fetchMapel]);

  const filteredMapel = useMemo(() => {
    if (!search.trim()) return mapelList;
    const lower = search.toLowerCase();
    return mapelList.filter((m) => m.nama_mapel.toLowerCase().includes(lower));
  }, [mapelList, search]);

  const handleExport = () => {
    const columns = [
      { header: 'No', key: 'no' },
      { header: 'Nama Mata Pelajaran', key: 'nama_mapel' },
    ];
    const data = filteredMapel.map((m, i) => ({ no: i + 1, nama_mapel: m.nama_mapel }));
    exportToExcel(data, columns, 'Manajemen_Mapel');
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormName('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (mapel) => {
    setEditingId(mapel.id_mapel);
    setFormName(mapel.nama_mapel);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setFormName('');
    setFormError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const name = formName.trim();
    if (!name) {
      setFormError('Nama mapel wajib diisi.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await api.put(`/mapel/${editingId}`, { nama_mapel: name });
      } else {
        await api.post('/mapel', { nama_mapel: name });
      }
      closeModal();
      fetchMapel();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan mapel.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/mapel/${deleteTarget.id_mapel}`);
      setDeleteTarget(null);
      fetchMapel();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus mapel.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      {/* ─── Header ─────────────────────── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Manajemen Mapel</h1>
        <div className={styles.actionBar}>
          <button className={styles.btnRefresh} onClick={fetchMapel} disabled={loading}>
            <MdRefresh className={styles.btnIcon} />
            Refresh
          </button>
          <button className={styles.btnExport} onClick={handleExport}>
            <MdFileDownload className={styles.btnIcon} />
            Export Excel
          </button>
          <button className={styles.btnPrimary} onClick={openAddModal}>
            <MdAdd /> Tambah Mapel
          </button>
        </div>
      </div>

      {/* ─── Stats ──────────────────────── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconPrimary}`}>
            <MdBook />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Total Mapel</span>
            <span className={styles.statValue}>{mapelList.length}</span>
          </div>
        </div>
      </div>

      {/* ─── Search ──────────────────────── */}
      <div className={styles.searchField}>
        <MdSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Cari mata pelajaran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* ─── Table ──────────────────────── */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 64, textAlign: 'center' }}>No</th>
                <th>Nama Mata Pelajaran</th>
                <th style={{ width: 140, textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className={styles.tableEmpty}>
                    Memuat data...
                  </td>
                </tr>
              ) : filteredMapel.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.tableEmpty}>
                    {search ? 'Pencarian tidak ditemukan.' : 'Belum ada mata pelajaran.'}
                  </td>
                </tr>
              ) : (
                filteredMapel.map((mapel, index) => (
                  <tr key={mapel.id_mapel}>
                    <td className={styles.numericCell}>{index + 1}</td>
                    <td className={styles.mapelCell}>{mapel.nama_mapel}</td>
                    <td className={styles.actionCell}>
                      <div className={styles.actionGroup}>
                        <button
                          className={`${styles.actionBtn} ${styles.actionEdit}`}
                          onClick={() => openEditModal(mapel)}
                          title="Edit mapel"
                        >
                          <MdEdit />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionHapus}`}
                          onClick={() => setDeleteTarget(mapel)}
                          title="Hapus mapel"
                        >
                          <MdDelete />
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

      {/* ─── Modal Add/Edit ──────────────── */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <MdBook className={styles.modalTitleIcon} />
                {editingId ? 'Edit Mapel' : 'Tambah Mapel Baru'}
              </h2>
              <button className={styles.modalClose} onClick={closeModal} disabled={saving}>
                <MdClose />
              </button>
            </div>

            {formError && <div className={styles.modalAlert}>{formError}</div>}

            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label className={styles.label}>Nama Mata Pelajaran</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="cth: Matematika, Bahasa Inggris"
                    autoFocus
                    maxLength={100}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={closeModal}
                  disabled={saving}
                >
                  <MdClose /> Batal
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  <MdSave /> {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Confirm Delete ──────────────── */}
      {deleteTarget && (
        <div className={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <MdDelete />
            </div>
            <h3 className={styles.confirmTitle}>Hapus Mapel</h3>
            <p className={styles.confirmMessage}>
              Apakah Anda yakin ingin menghapus mapel{' '}
              <strong>{deleteTarget.nama_mapel}</strong>?<br />
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Batal
              </button>
              <button
                className={styles.btnDanger}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManajemenMapel;
