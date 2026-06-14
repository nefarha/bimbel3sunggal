import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './rekap_absensi.module.css';

const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

const RekapAbsensi = () => {
  const today = new Date();
  const [bulan, setBulan] = useState(today.getMonth() + 1);
  const [tahun, setTahun] = useState(today.getFullYear());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const years = [];
  const currentYear = today.getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    years.push(y);
  }

  const fetchRecap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/absensi-tutor/recap`, {
        params: { bulan, tahun },
      });
      if (response.data?.success) {
        setData(response.data.data || []);
      } else {
        setError('Gagal memuat data rekap absensi.');
      }
    } catch (err) {
      console.error('Fetch recap error:', err);
      setError('Terjadi kesalahan saat mengambil data.');
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun]);

  useEffect(() => {
    fetchRecap();
  }, [bulan, tahun]);

  const selectedMonthLabel = MONTHS.find((m) => m.value === Number(bulan))?.label || '';

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>Rekap Absensi Tutor</h1>
            <p className={styles.pageSubtitle}>Monitoring kehadiran tutor bulanan</p>
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Bulan</label>
              <select
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                className={styles.select}
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Tahun</label>
              <select
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                className={styles.select}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Legend Card */}
        <div className={styles.legendCard}>
          <span className={styles.legendLabel}>Keterangan:</span>
          <div className={styles.legendItems}>
            <div className={styles.legendItem}>
              <div className={`${styles.colorBox} ${styles.colorBoxHadir}`} />
              <span>Hadir</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.colorBox} ${styles.colorBoxAlpha}`} />
              <span>Alpha</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.colorBox} ${styles.colorBoxWeekend}`} />
              <span>Weekend (Sabtu & Minggu)</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Memuat data rekap absensi...</span>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <span>{error}</span>
          </div>
        ) : data.length === 0 ? (
          <div className={styles.emptyState}>
            <span>Tidak ada data tutor aktif ditemukan.</span>
          </div>
        ) : (
          data.map((tutor) => (
            <div key={tutor.id_tutor} className={styles.tutorCard}>
              <div className={styles.tutorHeader}>
                <div className={styles.tutorInfo}>
                  <h3 className={styles.tutorName}>{tutor.nama_tutor}</h3>
                  <p className={styles.tutorClass}>{tutor.kelas_list}</p>
                </div>

                <div className={styles.summaryBoxes}>
                  <div className={`${styles.summaryBox} ${styles.summaryBoxHadir}`}>
                    <span className={styles.summaryValue}>{tutor.hadir}</span>
                    <span className={styles.summaryLabel}>HADIR</span>
                  </div>
                  <div className={`${styles.summaryBox} ${styles.summaryBoxAlpha}`}>
                    <span className={styles.summaryValue}>{tutor.alpha}</span>
                    <span className={styles.summaryLabel}>ALPHA</span>
                  </div>
                </div>
              </div>

              <div className={styles.monthLabel}>
                {selectedMonthLabel} {tahun}
              </div>

              <div className={styles.calendarGrid}>
                {tutor.days.map((day) => {
                  let circleClass = styles.dayCircle;
                  if (day.status === 'hadir') {
                    circleClass += ` ${styles.dayCircleHadir}`;
                  } else if (day.status === 'alpha') {
                    circleClass += ` ${styles.dayCircleAlpha}`;
                  } else if (day.status === 'weekend') {
                    circleClass += ` ${styles.dayCircleWeekend}`;
                  }

                  return (
                    <div key={day.day} className={circleClass} title={`Tanggal ${day.day}`}>
                      {day.day}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default RekapAbsensi;
