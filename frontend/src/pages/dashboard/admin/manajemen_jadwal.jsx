import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  MdSearch,
  MdAdd,
  MdEdit,
  MdCancel,
  MdClose,
  MdSave,
  MdChevronLeft,
  MdChevronRight,
  MdFileDownload,
} from 'react-icons/md';
import { exportToExcel } from '../../../utils/exportExcel';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './manajemen_jadwal.module.css';

const DAY_ORDER = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5 };

const sortHari = (hari) => {
  if (!Array.isArray(hari)) return hari;
  return [...hari].sort((a, b) => (DAY_ORDER[a] || 99) - (DAY_ORDER[b] || 99));
};

const daysOfWeek = [
  { value: 'all', label: 'Semua Hari' },
  { value: 'Senin', label: 'Senin' },
  { value: 'Selasa', label: 'Selasa' },
  { value: 'Rabu', label: 'Rabu' },
  { value: 'Kamis', label: 'Kamis' },
  { value: 'Jumat', label: 'Jumat' },
];

const hourOptions = Array.from({ length: 24 }, (_, i) => {
  const val = String(i).padStart(2, '0');
  return { value: val, label: val };
});

const minuteOptions = Array.from({ length: 60 }, (_, i) => {
  const val = String(i).padStart(2, '0');
  return { value: val, label: val };
});

const createInitialForm = () => ({
    id_jadwal: null,
    hari: [],
    jam: '',
    jam_selesai: '',
    id_kelas: '',
    nama_kelas: '',
    id_mapel: '',
    nama_mapel: '',
    id_tutor: '',
    nama_tutor: '',
  });

const ManajemenJadwal = () => {
  const [scheduleList, setScheduleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [dayFilter, setDayFilter] = useState('all');
  const [classOptions, setClassOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [tutorOptions, setTutorOptions] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [viewingSchedule, setViewingSchedule] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editForm, setEditForm] = useState(createInitialForm());
  const [editJam, setEditJam] = useState('');
  const [editMenit, setEditMenit] = useState('');
  const [editJamAkhir, setEditJamAkhir] = useState('');
  const [editMenitAkhir, setEditMenitAkhir] = useState('');
  const [editError, setEditError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/jadwal');
      const data = response.data?.data || [];
      setScheduleList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setError(err);
      setScheduleList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDependencies = useCallback(async () => {
    try {
      const [classesRes, subjectsRes, tutorsRes] = await Promise.all([
        api.get('/kelas'),
        api.get('/mapel'),
        api.get('/guru'),
      ]);
      setClassOptions(classesRes.data?.data || []);
      setSubjectOptions(subjectsRes.data?.data || []);
      setTutorOptions(tutorsRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch dependencies:', err);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchDependencies();
  }, [fetchSchedules, fetchDependencies]);

  const filteredSchedules = useMemo(() => {
    let filtered = scheduleList;

    if (dayFilter !== 'all') {
      filtered = filtered.filter((schedule) => {
        const days = Array.isArray(schedule.hari) ? schedule.hari : [schedule.hari];
        return days.includes(dayFilter);
      });
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (schedule) =>
          schedule.nama_kelas.toLowerCase().includes(lowerSearch) ||
          schedule.nama_mapel.toLowerCase().includes(lowerSearch) ||
          schedule.nama_tutor.toLowerCase().includes(lowerSearch) ||
          schedule.jam.toLowerCase().includes(lowerSearch)
      );
    }
    return filtered;
  }, [scheduleList, dayFilter, search]);

  const totalPages = Math.ceil(filteredSchedules.length / pageSize);
  const currentSchedules = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSchedules.slice(startIndex, startIndex + pageSize);
  }, [filteredSchedules, currentPage, pageSize]);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddClick = () => {
    setEditingSchedule(createInitialForm());
    setEditForm(createInitialForm());
    setEditJam('');
    setEditMenit('');
    setEditJamAkhir('');
    setEditMenitAkhir('');
    setEditError(null);
  };

  const handleEditClick = (schedule) => {
    const [jam = '', menit = ''] = (schedule.jam || '').split(':');
    const [jamA = '', menitA = ''] = (schedule.jam_selesai || '').split(':');
    // Parse hari: bisa berupa JSON string, array, atau string biasa
    let hari = schedule.hari;
    if (typeof hari === 'string') {
      try { hari = JSON.parse(hari); } catch { hari = hari ? [hari] : []; }
    }
    if (!Array.isArray(hari)) hari = [hari];
    hari = sortHari(hari);
    setEditingSchedule(schedule);
    setEditForm({
      id_jadwal: schedule.id_jadwal,
      hari,
      jam: schedule.jam,
      jam_selesai: schedule.jam_selesai || '',
      id_kelas: schedule.id_kelas,
      nama_kelas: schedule.nama_kelas,
      id_mapel: schedule.id_mapel,
      nama_mapel: schedule.nama_mapel,
      id_tutor: schedule.id_tutor,
      nama_tutor: schedule.nama_tutor,
    });
    setEditJam(jam);
    setEditMenit(menit);
    setEditJamAkhir(jamA);
    setEditMenitAkhir(menitA);
    setEditError(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'hari') {
      setEditForm((prev) => {
        const hari = type === 'checkbox'
          ? (checked ? [...prev.hari, value] : prev.hari.filter((h) => h !== value))
          : value;
        return { ...prev, hari };
      });
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleClassChange = (e) => {
    const classId = e.target.value;
    const selectedClass = classOptions.find(c => c.id_kelas === parseInt(classId));
    setEditForm((prev) => ({
      ...prev,
      id_kelas: classId,
      nama_kelas: selectedClass ? selectedClass.nama_kelas : '',
    }));
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    const selectedSubject = subjectOptions.find(s => s.id_mapel === parseInt(subjectId));
    setEditForm((prev) => ({
      ...prev,
      id_mapel: subjectId,
      nama_mapel: selectedSubject ? selectedSubject.nama_mapel : '',
    }));
  };

  const handleTutorChange = (e) => {
    const tutorId = e.target.value;
    const selectedTutor = tutorOptions.find(t => t.id_tutor === parseInt(tutorId));
    setEditForm((prev) => ({
      ...prev,
      id_tutor: tutorId,
      nama_tutor: selectedTutor ? selectedTutor.nama_tutor : '',
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setEditError(null);

    if (!editForm.hari || editForm.hari.length === 0) {
      setEditError('Pilih minimal satu hari.');
      setSaving(false);
      return;
    }

    if (!editJam || !editMenit) {
      setEditError('Jam mulai harus diisi.');
      setSaving(false);
      return;
    }

    if (!editForm.id_kelas) {
      setEditError('Kelas harus dipilih.');
      setSaving(false);
      return;
    }

    if (!editForm.id_mapel) {
      setEditError('Mata pelajaran harus dipilih.');
      setSaving(false);
      return;
    }

    if (!editForm.id_tutor) {
      setEditError('Tutor harus dipilih.');
      setSaving(false);
      return;
    }

    const id_kelas = parseInt(editForm.id_kelas, 10);
    const id_mapel = parseInt(editForm.id_mapel, 10);
    const id_tutor = parseInt(editForm.id_tutor, 10);

    if (isNaN(id_kelas) || isNaN(id_mapel) || isNaN(id_tutor)) {
      setEditError('Data tidak valid. Silakan pilih ulang.');
      setSaving(false);
      return;
    }

    const payload = {
      hari: JSON.stringify(editForm.hari),
      jam: `${editJam}:${editMenit}`,
      jam_selesai: `${editJamAkhir}:${editMenitAkhir}`,
      id_kelas,
      id_mapel,
      id_tutor,
    };

    // Validasi: jam_selesai harus > jam
    if (payload.jam_selesai && payload.jam_selesai <= payload.jam) {
      setEditError('Jam selesai harus lebih besar dari jam mulai.');
      setSaving(false);
      return;
    }
    // Jika tidak diisi, kirim null
    if (!editJamAkhir || !editMenitAkhir) {
      payload.jam_selesai = null;
    }
    console.log('Sending payload:', payload);

    try {
      if (editingSchedule.id_jadwal) {
        await api.put(`/jadwal/${editingSchedule.id_jadwal}`, payload);
        setToast({ type: 'success', message: 'Jadwal berhasil diperbarui!' });
      } else {
        await api.post('/jadwal', payload);
        setToast({ type: 'success', message: 'Jadwal berhasil ditambahkan!' });
      }
      setEditingSchedule(null);
      fetchSchedules();
    } catch (err) {
      console.error('Failed to save schedule:', err);
      setEditError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan jadwal.');
      setToast({ type: 'error', message: 'Gagal menyimpan jadwal.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id_jadwal) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;

    try {
      await api.delete(`/jadwal/${id_jadwal}`);
      setToast({ type: 'success', message: 'Jadwal berhasil dihapus!' });
      fetchSchedules();
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      setToast({ type: 'error', message: 'Gagal menghapus jadwal.' });
    }
  };

  const handleExport = () => {
    const columns = [
      { header: 'No', key: 'no' },
      { header: 'Hari', key: 'hari' },
      { header: 'Jam Mulai', key: 'jam' },
      { header: 'Jam Selesai', key: 'jam_selesai' },
      { header: 'Kelas', key: 'kelas' },
      { header: 'Mata Pelajaran', key: 'mapel' },
      { header: 'Tutor', key: 'tutor' },
    ];
    const rows = filteredSchedules.map((s, i) => ({
      no: i + 1,
      hari: Array.isArray(s.hari) ? sortHari(s.hari).join(', ') : s.hari || '',
      jam: s.jam || '',
      jam_selesai: s.jam_selesai || '',
      kelas: s.nama_kelas || '',
      mapel: s.nama_mapel || '',
      tutor: s.nama_tutor || '',
    }));
    exportToExcel(rows, columns, 'Manajemen_Jadwal');
  };

  return (
    <AdminLayout>
      <div className={styles.manajemenJadwal}>
        <div className={styles.header}>
          <h1>Manajemen Jadwal</h1>
          <div className={styles.headerActions}>
            <button className={styles.addButton} onClick={handleExport}>
              <MdFileDownload /> Export Excel
            </button>
            <button className={styles.addButton} onClick={handleAddClick}>
              <MdAdd /> Tambah Jadwal
            </button>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.filterGroup}>
            <label htmlFor="dayFilter">Filter Hari:</label>
            <select
              id="dayFilter"
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className={styles.select}
            >
              {daysOfWeek.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.searchBar}>
            <MdSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Cari kelas, mapel, atau tutor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {loading ? (
          <p>Memuat jadwal...</p>
        ) : error ? (
          <p className={styles.errorMessage}>Error: {error.message}</p>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Hari</th>
                    <th>Jam Mulai</th>
                    <th>Jam Selesai</th>
                    <th>Kelas</th>
                    <th>Mata Pelajaran</th>
                    <th>Tutor</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSchedules.length > 0 ? (
                    currentSchedules.map((schedule, index) => (
                      <tr key={schedule.id_jadwal}>
                        <td>{(currentPage - 1) * pageSize + index + 1}</td>
                        <td>{Array.isArray(schedule.hari) ? sortHari(schedule.hari).join(', ') : schedule.hari}</td>
                        <td>{schedule.jam}</td>
                        <td>{schedule.jam_selesai || '-'}</td>
                        <td>{schedule.nama_kelas}</td>
                        <td>{schedule.nama_mapel}</td>
                        <td>{schedule.nama_tutor}</td>
                        <td>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleEditClick(schedule)}
                            title="Edit Jadwal"
                          >
                            <MdEdit />
                          </button>
                          <button
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            onClick={() => handleDelete(schedule.id_jadwal)}
                            title="Hapus Jadwal"
                          >
                            <MdCancel />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className={styles.emptyTableCell}>Tidak ada jadwal yang ditemukan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={styles.paginationButton}
              >
                <MdChevronLeft />
              </button>
              <span>
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={styles.paginationButton}
              >
                <MdChevronRight />
              </button>
            </div>
          </>
        )}

        {editingSchedule && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2>{editingSchedule.id_jadwal ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h2>
              {editError && <p className={styles.errorMessage}>{editError}</p>}
              <form onSubmit={handleSave}>
                <div className={styles.formGroup}>
                  <label>Hari:</label>
                  <div className={styles.checkboxGroup}>
                    {daysOfWeek.slice(1).map((day) => (
                      <label key={day.value} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="hari"
                          value={day.value}
                          checked={editForm.hari.includes(day.value)}
                          onChange={handleFormChange}
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Jam:</label>
                  <div className={styles.timeSelectGroup}>
                    <select
                      value={editJam}
                      onChange={(e) => setEditJam(e.target.value)}
                      className={styles.input}
                      required
                    >
                      <option value="">JJ</option>
                      {hourOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className={styles.timeSeparator}>:</span>
                    <select
                      value={editMenit}
                      onChange={(e) => setEditMenit(e.target.value)}
                      className={styles.input}
                      required
                    >
                      <option value="">MM</option>
                      {minuteOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Jam Selesai:</label>
                  <div className={styles.timeSelectGroup}>
                    <select
                      value={editJamAkhir}
                      onChange={(e) => setEditJamAkhir(e.target.value)}
                      className={styles.input}
                    >
                      <option value="">JJ</option>
                      {hourOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className={styles.timeSeparator}>:</span>
                    <select
                      value={editMenitAkhir}
                      onChange={(e) => setEditMenitAkhir(e.target.value)}
                      className={styles.input}
                    >
                      <option value="">MM</option>
                      {minuteOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="id_kelas">Kelas:</label>
                  <select
                    id="id_kelas"
                    name="id_kelas"
                    value={editForm.id_kelas || ''}
                    onChange={handleClassChange}
                    className={styles.input}
                    required
                  >
                    <option value="">Pilih Kelas</option>
                    {classOptions.map((kelas) => (
                      <option key={kelas.id_kelas} value={kelas.id_kelas}>
                        {kelas.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="id_mapel">Mata Pelajaran:</label>
                  <select
                    id="id_mapel"
                    name="id_mapel"
                    value={editForm.id_mapel || ''}
                    onChange={handleSubjectChange}
                    className={styles.input}
                    required
                  >
                    <option value="">Pilih Mata Pelajaran</option>
                    {subjectOptions.map((mapel) => (
                      <option key={mapel.id_mapel} value={mapel.id_mapel}>
                        {mapel.nama_mapel}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="id_tutor">Tutor:</label>
                  <select
                    id="id_tutor"
                    name="id_tutor"
                    value={editForm.id_tutor || ''}
                    onChange={handleTutorChange}
                    className={styles.input}
                    required
                  >
                    <option value="">Pilih Tutor</option>
                    {tutorOptions.map((tutor) => (
                      <option key={tutor.id_tutor} value={tutor.id_tutor}>
                        {tutor.nama_tutor}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setEditingSchedule(null)}
                    disabled={saving}
                  >
                    <MdClose /> Batal
                  </button>
                  <button type="submit" className={styles.saveButton} disabled={saving}>
                    {saving ? 'Menyimpan...' : <><MdSave /> Simpan</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toast && (
          <div className={`${styles.toast} ${styles[toast.type]}`}>
            {toast.message}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ManajemenJadwal;
