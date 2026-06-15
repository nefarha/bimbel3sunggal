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

const formatJam = (jam) => {
  if (!jam) return '-';
  return jam.slice(0, 5);
};

const Jadwal = () => {
  const [jadwalList, setJadwalList] = useState([]);
  const [allJadwal, setAllJadwal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayName, setTodayName] = useState('');
  const [tab, setTab] = useState('hari-ini'); // 'hari-ini' | 'semua'

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
        const all = jadwalRes.data?.data || [];

        const todayIdx = new Date().getDay();
        const todayStr = DAY_MAP[todayIdx];
        setTodayName(todayStr);

        const todayJadwal = all
          .filter((j) => j.hari === todayStr)
          .sort((a, b) => (a.jam > b.jam ? 1 : -1));

        setAllJadwal(all);
        setJadwalList(todayJadwal);
      } catch (err) {
        console.error('Gagal memuat jadwal:', err);
        setError('Gagal memuat data jadwal');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const switchToToday = () => {
    setTab('hari-ini');
    const todayStr = DAY_MAP[new Date().getDay()];
    const filtered = allJadwal
      .filter((j) => j.hari === todayStr)
      .sort((a, b) => (a.jam > b.jam ? 1 : -1));
    setJadwalList(filtered);
  };

  const switchToAll = () => {
    setTab('semua');
    const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const sorted = [...allJadwal].sort(
      (a, b) => dayOrder.indexOf(a.hari) - dayOrder.indexOf(b.hari) || (a.jam > b.jam ? 1 : -1)
    );
    setJadwalList(sorted);
  };

  if (loading) {
    return <div className={styles.container}>Memuat jadwal...</div>;
  }

  if (error) {
    return <div className={styles.container}>{error}</div>;
  }

  if (allJadwal.length === 0) {
    return <div className={styles.container}>Belum ada jadwal.</div>;
  }

  return (
    <div className={styles.container}>
      {}
      <div className={styles.headerRow}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'hari-ini' ? styles.tabActive : ''}`}
            onClick={switchToToday}
          >
            <MdToday /> Hari Ini ({todayName})
          </button>
          <button
            className={`${styles.tab} ${tab === 'semua' ? styles.tabActive : ''}`}
            onClick={switchToAll}
          >
            <MdSchool /> Semua Jadwal
          </button>
        </div>
        <span className={styles.countBadge}>{jadwalList.length} jadwal</span>
      </div>

      {}
      <div className={styles.cardGrid}>
        {jadwalList.map((jadwal) => (
          <div key={jadwal.id_jadwal} className={styles.card}>
            {}
            <div className={styles.cardTopRow}>
              <span className={styles.clockGroup}>
                <MdAccessTime className={styles.clockIcon} />
                {formatJam(jadwal.jam)}
                {jadwal.jam_selesai ? ` - ${formatJam(jadwal.jam_selesai)}` : ''}
              </span>
            </div>

            {}
            <div className={styles.cardHeader}>
              <MdSchool className={styles.cardHeaderIcon} />
              <span className={styles.cardMapel}>{jadwal.nama_mapel || '-'}</span>
            </div>

            {}
            <div className={styles.cardBody}>
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
    </div>
  );
};

export default Jadwal;
