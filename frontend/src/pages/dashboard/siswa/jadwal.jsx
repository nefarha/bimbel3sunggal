import React, { useEffect, useState } from 'react';
import {
  MdSchool,
  MdPerson,
  MdRoom,
  MdToday,
  MdAccessTime,
  MdLooksOne,
} from 'react-icons/md';
import api from '../../../services/api';
import styles from './jadwal.module.css';

const DAY_MAP = {
  0: 'Minggu',
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

const Jadwal = () => {
  const [jadwalList, setJadwalList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayName, setTodayName] = useState('');

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

        const siswaRes = await api.get(`/siswa/by-user/${user.id}`);
        const siswa = siswaRes.data?.data;
        if (!siswa) {
          setError('Data siswa tidak ditemukan');
          return;
        }

        const jadwalRes = await api.get(`/jadwal/siswa/${siswa.id_siswa}`);
        const allJadwal = jadwalRes.data?.data || [];

        const todayIdx = new Date().getDay();
        const todayStr = DAY_MAP[todayIdx];
        setTodayName(todayStr);

        const todayJadwal = allJadwal
          .filter((j) => j.hari === todayStr)
          .sort((a, b) => (a.jam > b.jam ? 1 : -1));

        const withSesi = todayJadwal.map((j, idx) => ({
          ...j,
          sesi: idx + 1,
        }));

        setJadwalList(withSesi);
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
    const parts = jam.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Jadwal Les</h1>
          <p className={styles.pageSubtitle}>Jadwal les hari ini</p>
        </div>
        <div className={styles.loadingState}>Memuat data jadwal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Jadwal Les</h1>
          <p className={styles.pageSubtitle}>Jadwal les hari ini</p>
        </div>
        <div className={styles.errorState}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>Jadwal Les</h1>
        <p className={styles.pageSubtitle}>Jadwal les hari ini</p>
      </div>

      {}
      <div className={styles.todayBadge}>
        <MdToday className={styles.todayBadgeIcon} />
        <span>Hari {todayName}</span>
      </div>

      {jadwalList.length === 0 ? (
        <div className={styles.noSchedule}>
          <MdSchool className={styles.noScheduleIcon} />
          <p className={styles.noScheduleText}>Tidak ada jadwal les hari ini</p>
          <p className={styles.noScheduleSubtext}>Nikmati waktu istirahat Anda!</p>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {jadwalList.map((jadwal) => (
            <div key={jadwal.id_jadwal} className={styles.scheduleCard}>
              <div className={styles.cardTop}>
                <div className={styles.cardTime}>
                  <span className={styles.cardTimeValue}>
                    {formatJam(jadwal.jam)}
                  </span>
                  <span className={styles.cardTimeLabel}>WIB</span>
                </div>
                <div className={styles.cardMapel}>
                  <h3 className={styles.cardMapelName}>
                    {jadwal.nama_mapel || '-'}
                  </h3>
                  <span className={styles.cardSesi}>
                    <MdLooksOne /> Sesi {jadwal.sesi}
                  </span>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardInfoRow}>
                  <MdAccessTime className={styles.cardInfoIcon} />
                  <span className={styles.cardInfoLabel}>Jam Mulai</span>
                  <span className={styles.cardInfoValue}>
                    {formatJam(jadwal.jam)} WIB
                  </span>
                </div>
                <div className={styles.cardInfoRow}>
                  <MdSchool className={styles.cardInfoIcon} />
                  <span className={styles.cardInfoLabel}>Mapel</span>
                  <span className={styles.cardInfoValue}>
                    {jadwal.nama_mapel || '-'}
                  </span>
                </div>
                <div className={styles.cardInfoRow}>
                  <MdLooksOne className={styles.cardInfoIcon} />
                  <span className={styles.cardInfoLabel}>Sesi</span>
                  <span className={styles.cardInfoValue}>
                    Sesi {jadwal.sesi}
                  </span>
                </div>
                <div className={styles.cardInfoRow}>
                  <MdPerson className={styles.cardInfoIcon} />
                  <span className={styles.cardInfoLabel}>Tutor</span>
                  <span className={styles.cardInfoValue}>
                    {jadwal.nama_tutor || '-'}
                  </span>
                </div>
                <div className={styles.cardInfoRow}>
                  <MdRoom className={styles.cardInfoIcon} />
                  <span className={styles.cardInfoLabel}>Ruangan</span>
                  <span className={styles.cardInfoValue}>
                    {jadwal.nama_kelas || '-'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Jadwal;
