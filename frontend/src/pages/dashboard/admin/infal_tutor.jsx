import React, { useEffect, useState, useCallback } from 'react';
import { MdDelete, MdEdit, MdClose, MdFileDownload } from 'react-icons/md';
import { exportToExcel } from '../../../utils/exportExcel';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './infal_tutor.module.css';

const MONTHS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
  { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
];

const formatRupiah = (nominal) => {
  if (nominal === null || nominal === undefined) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(nominal);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const InfalTutor = () => {
  const today = new Date();
  const [bulan, setBulan] = useState(today.getMonth() + 1);
  const [tahun, setTahun] = useState(today.getFullYear());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [tutors, setTutors] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: 'add' });
  const [form, setForm] = useState({
    id_tutor_pengganti: '',
    id_tutor_absen: '',
    id_kelas: '',
    tanggal: '',
    nominal: 15000,
    keterangan: '',
  });
  const [editId, setEditId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/infal?bulan=${bulan}&tahun=${tahun}`);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data infal');
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun]);

  const fetchTutors = async () => {
    try {
      const res = await api.get('/guru?status=Aktif');
      if (res.data?.success) setTutors(res.data.data);
    } catch (err) {
      console.error('Gagal memuat data tutor:', err);
    }
  };

  const fetchKelas = async () => {
    try {
      const res = await api.get('/kelas');
      if (res.data?.success) setKelas(res.data.data);
    } catch (err) {
      console.error('Gagal memuat data kelas:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTutors();
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    const columns = [
      { header: 'No', key: 'no' },
      { header: 'Tanggal', key: 'tanggal' },
      { header: 'Tutor Pengganti', key: 'pengganti' },
      { header: 'Tutor Absen', key: 'absen' },
      { header: 'Kelas', key: 'kelas' },
      { header: 'Nominal', key: 'nominal' },
      { header: 'Keterangan', key: 'keterangan' },
    ];
    const rows = data.map((d, i) => ({
      no: i + 1,
      tanggal: d.tanggal ? new Date(d.tanggal).toLocaleDateString('id-ID') : '',
      pengganti: d.nama_tutor_pengganti || '',
      absen: d.nama_tutor_absen || '',
      kelas: d.nama_kelas || '',
      nominal: d.nominal || 0,
      keterangan: d.keterangan || '',
    }));
    exportToExcel(rows, columns, `Infal_Tutor_${bulan}_${tahun}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditId(null);
    setForm({ id_tutor_pengganti: '', id_tutor_absen: '', id_kelas: '', tanggal: today.toISOString().split('T')[0], nominal: 15000, keterangan: '' });
    setModal({ open: true, mode: 'add' });
  };

  const openEditModal = (item) => {
    setEditId(item.id_infal);
    setForm({
      id_tutor_pengganti: String(item.id_tutor_pengganti),
      id_tutor_absen: String(item.id_tutor_absen),
      id_kelas: String(item.id_kelas),
      tanggal: item.tanggal ? item.tanggal.split('T')[0] : '',
      nominal: item.nominal,
      keterangan: item.keterangan || '',
    });
    setModal({ open: true, mode: 'edit' });
  };

  const closeModal = () => {
    setModal({ open: false, mode: 'add' });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      setError(null);
      const payload = {
        ...form,
        id_tutor_pengganti: Number(form.id_tutor_pengganti),
        id_tutor_absen: Number(form.id_tutor_absen),
        id_kelas: Number(form.id_kelas),
        nominal: Number(form.nominal),
      };

      if (editId) {
        await api.put(`/infal/${editId}`, payload);
        setSuccessMsg('Data infal berhasil diperbarui');
      } else {
        await api.post('/infal', payload);
        setSuccessMsg('Data infal berhasil disimpan');
      }

      closeModal();
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data infal');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data infal ini?')) return;
    try {
      await api.delete(`/infal/${id}`);
      setSuccessMsg('Data infal berhasil dihapus');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus data infal');
    }
  };

  return (
    <AdminLayout>
    <div className={styles.container}>
      {successMsg && <div className={styles.successAlert}>{successMsg}</div>}

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Bulan</label>
          <select className={styles.filterSelect} value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
            {MONTHS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Tahun</label>
          <select className={styles.filterSelect} value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
            {Array.from({ length: 10 }, (_, i) => {
              const y = today.getFullYear() - 5 + i;
              return (<option key={y} value={y}>{y}</option>);
            })}
          </select>
        </div>
        <button className={styles.addBtn} onClick={handleExport}>
          <MdFileDownload /> Export Excel
        </button>
        <button className={styles.addBtn} onClick={openAddModal}>+ Catat Infal</button>
      </div>

      {loading && <div className={styles.loadingState}>Memuat data infal...</div>}
      {error && !loading && <div className={styles.errorAlert}>{error}</div>}

      {!loading && !error && (
        <div className={styles.tableSection}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Tutor Pengganti</th>
                  <th>Tutor Absen</th>
                  <th>Kelas</th>
                  <th className={styles.colNominal}>Nominal</th>
                  <th>Keterangan</th>
                  <th className={styles.colCenter}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={7} className={styles.emptyCell}>Belum ada data infal</td></tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id_infal}>
                      <td>{formatDate(item.tanggal)}</td>
                      <td><strong>{item.nama_tutor_pengganti}</strong></td>
                      <td>{item.nama_tutor_absen}</td>
                      <td>{item.nama_kelas}</td>
                      <td className={styles.colNominal}>{formatRupiah(item.nominal)}</td>
                      <td style={{ color: '#64748b', fontSize: '0.813rem' }}>{item.keterangan || '-'}</td>
                      <td className={styles.colCenter}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button className={styles.editBtn} onClick={() => openEditModal(item)}><MdEdit /></button>
                          <button className={styles.deleteBtn} onClick={() => handleDelete(item.id_infal)}><MdDelete /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal.open && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editId ? 'Edit Infal' : 'Catat Infal Baru'}</h3>
              <button className={styles.modalClose} onClick={closeModal}><MdClose /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label>Tanggal *</label>
                  <input type="date" name="tanggal" value={form.tanggal} onChange={handleInputChange} required />
                </div>
                <div className={styles.formField}>
                  <label>Tutor Pengganti (Yang mengisi) *</label>
                  <select name="id_tutor_pengganti" value={form.id_tutor_pengganti} onChange={handleInputChange} required>
                    <option value="">-- Pilih Tutor --</option>
                    {tutors.map((t) => (<option key={t.id_tutor} value={t.id_tutor}>{t.nama_tutor}</option>))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Tutor Absen (Yang digantikan) *</label>
                  <select name="id_tutor_absen" value={form.id_tutor_absen} onChange={handleInputChange} required>
                    <option value="">-- Pilih Tutor --</option>
                    {tutors.map((t) => (<option key={t.id_tutor} value={t.id_tutor}>{t.nama_tutor}</option>))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Kelas *</label>
                  <select name="id_kelas" value={form.id_kelas} onChange={handleInputChange} required>
                    <option value="">-- Pilih Kelas --</option>
                    {kelas.map((k) => (<option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Nominal Infal</label>
                  <input type="number" name="nominal" value={form.nominal} onChange={handleInputChange} />
                </div>
                <div className={styles.formField}>
                  <label>Keterangan</label>
                  <textarea name="keterangan" value={form.keterangan} onChange={handleInputChange} rows={2} />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={closeModal}>Batal</button>
                <button type="submit" className={styles.btnPrimary} disabled={submitLoading}>
                  {submitLoading ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Simpan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
};

export default InfalTutor;
