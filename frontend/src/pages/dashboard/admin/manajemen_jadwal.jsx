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
} from 'react-icons/md';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './manajemen_jadwal.module.css';

const daysOfWeek = [
  { value: 'all', label: 'Semua Hari' },
  { value: 'Senin', label: 'Senin' },
  { value: 'Selasa', label: 'Selasa' },
  { value: 'Rabu', label: 'Rabu' },
  { value: 'Kamis', label: 'Kamis' },
  { value: 'Jumat', label: 'Jumat' },
  { value: 'Sabtu', label: 'Sabtu' },
  { value: 'Minggu', label: 'Minggu' },
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
  hari: '',
  jam: '',
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
      filtered = filtered.filter((schedule) => schedule.hari === dayFilter);
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
    setEditError(null);
  };

  const handleEditClick = (schedule) => {
    const [jam = '', menit = ''] = (schedule.jam || '').split(':');
    setEditingSchedule(schedule);
    setEditForm({
      id_jadwal: schedule.id_jadwal,
      hari: schedule.hari,
      jam: schedule.jam,
      id_kelas: schedule.id_kelas,
      nama_kelas: schedule.nama_kelas,
      id_mapel: schedule.id_mapel,
      nama_mapel: schedule.nama_mapel,
      id_tutor: schedule.id_tutor,
      nama_tutor: schedule.nama_tutor,
    });
    setEditJam(jam);
    setEditMenit(menit);
    setEditError(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
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

    if (!editForm.hari) {
      setEditError('Hari harus diisi.');
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
      hari: editForm.hari,
      jam: `${editJam}:${editMenit}`,
      id_kelas,
      id_mapel,
      id_tutor,
    };
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

  return (
    <AdminLayout>
      <div className={styles.manajemenJadwal}>
        <div className={styles.header}>
          <h1>Manajemen Jadwal</h1>
          <button className={styles.addButton} onClick={handleAddClick}>
            <MdAdd /> Tambah Jadwal
          </button>
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
                    <th>Jam</th>
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
                        <td>{schedule.hari}</td>
                        <td>{schedule.jam}</td>
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
                      <td colSpan="7">Tidak ada jadwal yang ditemukan.</td>
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
                  <label htmlFor="hari">Hari:</label>
                  <select
                    id="hari"
                    name="hari"
                    value={editForm.hari}
                    onChange={handleFormChange}
                    className={styles.input}
                    required
                  >
                    <option value="">Pilih Hari</option>
                    {daysOfWeek.slice(1).map((day) => ( // Exclude 'Semua Hari'
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
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
