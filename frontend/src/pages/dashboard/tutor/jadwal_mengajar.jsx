import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdChevronRight, MdSchool } from 'react-icons/md';
import api from '../../../services/api';
import styles from './jadwal_mengajar.module.css';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const JadwalMengajar = () => {
  const navigate = useNavigate();
  const [groupedJadwal, setGroupedJadwal] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        // Dapatkan data tutor dari id_user
        const tutorRes = await api.get(`/guru/by-user/${user.id}`);
        const tutor = tutorRes.data?.data;
        if (!tutor) {
          setError('Data tutor tidak ditemukan');
          return;
        }

        // Dapatkan jadwal berdasarkan id_tutor
        const jadwalRes = await api.get(`/jadwal/tutor/${tutor.id_tutor}`);
        const jadwalList = jadwalRes.data?.data || [];

        // Kelompokkan berdasarkan hari
        const grouped = {};
        DAYS.forEach((day) => {
          const items = jadwalList.filter((j) => j.hari === day);
          if (items.length > 0) {
            grouped[day] = items;
          }
        });
        setGroupedJadwal(grouped);
      } catch (err) {
        console.error('Gagal memuat jadwal:', err);
        setError(err.response?.data?.message || 'Gagal memuat data jadwal');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatJam = (jam) => {
    if (!jam) return '-';
    // jam format from DB is HH:mm:ss
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
      },
    });
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

  const hasData = Object.keys(groupedJadwal).length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>Jadwal Mengajar</h1>
        <p className={styles.pageSubtitle}>Daftar jadwal mengajar Anda</p>
      </div>

      {!hasData ? (
        <div className={styles.emptyState}>
          <MdSchool className={styles.emptyIcon} />
          <p>Belum ada jadwal mengajar</p>
        </div>
      ) : (
        <div className={styles.scheduleContainer}>
          {DAYS.map(
            (day) =>
              groupedJadwal[day] && (
                <div key={day} className={styles.daySection}>
                  <div className={styles.dayHeader}>
                    <span className={styles.dayBadge}>{day}</span>
                    <span className={styles.dayCount}>
                      {groupedJadwal[day].length} kelas
                    </span>
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
                        {groupedJadwal[day].map((jadwal) => (
                          <tr key={jadwal.id_jadwal}>
                            <td>
                              <span className={styles.mapelBadge}>
                                {jadwal.nama_mapel || '-'}
                              </span>
                            </td>
                            <td>{jadwal.nama_kelas || '-'}</td>
                            <td className={styles.jamCell}>
                              {formatJam(jadwal.jam)}
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
              )
          )}
        </div>
      )}
    </div>
  );
};

export default JadwalMengajar;
