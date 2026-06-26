import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdChevronRight, MdSchool, MdCalendarToday, MdRefresh } from 'react-icons/md';
import api from '../../../services/api';
import styles from './jadwal_mengajar.module.css';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

const getDayName = (date) => {
  const names = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return names[date.getDay()];
};

const formatISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const JadwalMengajar = () => {
  const navigate = useNavigate();
  const [jadwalList, setJadwalList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(formatISODate(today));

  const selectedDayName = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return getDayName(new Date(y, m - 1, d));
  }, [selectedDate]);

  const isToday = selectedDate === formatISODate(today);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          setError('User tidak ditemukan');
          return;
        }

        const user = JSON.parse(storedUser);
        const tutorRes = await api.get(`/guru/by-user/${user.id}`);
        const tutor = tutorRes.data?.data;
        if (!tutor) {
          setError('Data tutor tidak ditemukan');
          return;
        }

        const jadwalRes = await api.get(`/jadwal/tutor/${tutor.id_tutor}`);
        setJadwalList(jadwalRes.data?.data || []);
      } catch (err) {
        console.error('Gagal memuat jadwal:', err);
        setError(err.response?.data?.message || 'Gagal memuat data jadwal');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const jadwalHariIni = useMemo(() => {
    return jadwalList.filter((j) => {
      const days = Array.isArray(j.hari) ? j.hari : [j.hari];
      return days.includes(selectedDayName);
    });
  }, [jadwalList, selectedDayName]);

  const formatJam = (jam) => {
    if (!jam) return '-';
    const parts = jam.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  const handleAbsensi = (jadwal) => {
    navigate(`/tutor/absensi-siswa/${jadwal.id_jadwal}`, {
      state: {
        id_kelas: jadwal.id_kelas,
        nama_kelas: jadwal.nama_kelas,
        nama_mapel: jadwal.nama_mapel,
        hari: jadwal.hari,
        jam: jadwal.jam,
        jam_selesai: jadwal.jam_selesai,
      },
    });
  };

  const handleToday = () => {
    setSelectedDate(formatISODate(today));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Jadwal Mengajar</h1>
        </div>
        <div className={styles.loadingState}>Memuat data jadwal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Jadwal Mengajar</h1>
        </div>
        <div className={styles.errorState}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>Jadwal Mengajar</h1>
        <p className={styles.pageSubtitle}>Daftar jadwal mengajar Anda</p>
      </div>

      {/* ─── Filter Bar ─── */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="datePicker">
            Pilih Tanggal
          </label>
          <div className={styles.dateInputWrap}>
            <MdCalendarToday className={styles.calendarIcon} />
            <input
              id="datePicker"
              type="date"
              className={styles.dateInput}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {!isToday && (
          <button className={styles.todayBtn} onClick={handleToday}>
            <MdRefresh className={styles.todayIcon} />
            Hari Ini
          </button>
        )}

        <div className={styles.dayInfo}>
          <span className={styles.dayBadge}>{selectedDayName}</span>
          {isToday && <span className={styles.todayLabel}>Hari ini</span>}
        </div>
      </div>

      {/* ─── Content ─── */}
      {jadwalHariIni.length === 0 ? (
        <div className={styles.emptyState}>
          <MdSchool className={styles.emptyIcon} />
          <p>
            {isToday
              ? 'Tidak ada jadwal mengajar hari ini.'
              : `Tidak ada jadwal mengajar pada hari ${selectedDayName}, ${selectedDate}.`}
          </p>
        </div>
      ) : (
        <div className={styles.daySection}>
          <div className={styles.dayHeader}>
            <span className={styles.dayBadgeLarge}>{selectedDayName}</span>
            <span className={styles.dayCount}>{jadwalHariIni.length} kelas</span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mapel</th>
                  <th>Kelas</th>
                  <th>Jam</th>
                  <th className={styles.colAksi}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {jadwalHariIni.map((jadwal) => (
                  <tr key={jadwal.id_jadwal}>
                    <td>
                      <span className={styles.mapelBadge}>
                        {jadwal.nama_mapel || '-'}
                      </span>
                    </td>
                    <td>{jadwal.nama_kelas || '-'}</td>
                    <td className={styles.jamCell}>
                      {formatJam(jadwal.jam)}
                      {jadwal.jam_selesai ? ` - ${formatJam(jadwal.jam_selesai)}` : ''}
                    </td>
                    <td className={styles.colAksi}>
                      <button
                        className={styles.aksiBtn}
                        onClick={() => handleAbsensi(jadwal)}
                        title="Absensi Siswa"
                      >
                        <span>Absensi</span>
                        <MdChevronRight />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JadwalMengajar;
