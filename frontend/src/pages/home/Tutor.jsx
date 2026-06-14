import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './Tutor.module.css';

const SearchIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const PersonIcon = ({ size = 64, color = '#CBD5E1' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

function Tutor() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapelOptions, setMapelOptions] = useState([]);
  const [jenjangOptions, setJenjangOptions] = useState([]);

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState('');

  const fetchTutors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: 'Aktif' };
      if (search.trim()) params.search = search.trim();
      if (selectedMapel) params.id_mapel = selectedMapel;
      if (selectedJenjang) params.jenjang = selectedJenjang;

      const response = await axios.get('http://localhost:5000/api/guru', { params });
      if (response.data?.success) {
        setTutors(response.data.data);
      }
    } catch (error) {
      console.error('Gagal mengambil data tutor:', error);
    } finally {
      setLoading(false);
    }
  }, [search, selectedMapel, selectedJenjang]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  // Fetch mapel options
  useEffect(() => {
    const fetchMapel = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/mapel');
        if (response.data?.success) {
          setMapelOptions(response.data.data);
        }
      } catch (error) {
        console.error('Gagal mengambil data mapel:', error);
      }
    };
    fetchMapel();
  }, []);

  // Fetch jenjang options
  useEffect(() => {
    const fetchJenjang = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/kelas/jenjang');
        if (response.data?.success) {
          setJenjangOptions(response.data.data);
        }
      } catch (error) {
        console.error('Gagal mengambil data jenjang:', error);
      }
    };
    fetchJenjang();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tutor Kami</h1>
        <p className={styles.subtitle}>Temukan pengajar ahli untuk membimbing perjalanan akademis Anda.</p>
      </div>

      <div className={styles.filterBox}>
        <div className={`${styles.filterGroup} ${styles.searchGroup}`}>
          <label className={styles.label}>Cari Tutor</label>
          <div className={styles.inputWrapper}>
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <input
              type="text"
              className={styles.input}
              placeholder="Masukkan nama tutor..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className={`${styles.filterGroup} ${styles.selectGroup}`}>
          <label className={styles.label}>Mata Pelajaran</label>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
            >
              <option value="">Semua Mata Pelajaran</option>
              {mapelOptions.map((opt) => (
                <option key={opt.id_mapel} value={opt.id_mapel}>
                  {opt.nama_mapel}
                </option>
              ))}
            </select>
            <span className={styles.selectIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>
        </div>

        <div className={`${styles.filterGroup} ${styles.selectGroup}`}>
          <label className={styles.label}>Jenjang</label>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={selectedJenjang}
              onChange={(e) => setSelectedJenjang(e.target.value)}
            >
              <option value="">Semua Jenjang</option>
              {jenjangOptions.map((nama) => (
                <option key={nama} value={nama}>{nama}</option>
              ))}
            </select>
            <span className={styles.selectIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className={styles.tutorGrid}>
        {loading ? (
          <p>Memuat data tutor...</p>
        ) : tutors.length === 0 ? (
          <p>Belum ada tutor tersedia.</p>
        ) : tutors.map(tutor => (
          <div key={tutor.id_tutor} className={styles.tutorCard}>
            <div className={styles.tutorImageContainer}>
              <div className={styles.tutorPlaceholder}>
                <PersonIcon size={80} color="#94A3B8" />
              </div>
            </div>
            <div className={styles.tutorInfo}>
              <h3 className={styles.tutorName}>{tutor.nama_tutor}</h3>
              <p className={styles.tutorSubject}>{tutor.mapel || '-'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tutor;
        
