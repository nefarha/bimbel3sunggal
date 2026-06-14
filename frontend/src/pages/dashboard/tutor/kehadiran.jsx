import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import styles from './kehadiran.module.css';

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

const Kehadiran = () => {
  const today = new Date();
  const [bulan, setBulan] = useState(today.getMonth() + 1);
  const [tahun, setTahun] = useState(today.getFullYear());
  const [data, setData] = useState(null);
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
      const response = await api.get('/absensi-tutor/recap/me', {
        params: { bulan, tahun },
      });
      if (response.data?.success) {
        setData(response.data.data);
      } else {
        setError('Gagal memuat data kehadiran.');
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

  const getCircleClass = (status) => {
    switch (status) {
      case 'hadir':
        return styles.dayCircleHadir;
      case 'sakit':
      case 'izin':
      case 'absen':
        return styles.dayCircleAlpha;
      case 'weekend':
        return styles.dayCircleWeekend;
      default:
        return styles.dayCircleNoData;
    }
  };

  const dayRows = data?.days
    ? [
        data.days.slice(0, 13),
        data.days.slice(13, 26),
        data.days.slice(26),
      ]
    : [];

  return (
    <div className={styles.container}>
        {}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>Kehadiran Saya</h1>
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

        {}
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Memuat data kehadiran...</span>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <span>{error}</span>
          </div>
        ) : !data ? (
          <div className={styles.emptyState}>
            <span>Tidak ada data kehadiran ditemukan.</span>
          </div>
        ) : (
          <>
            {}
            <div className={styles.cardsRow}>
              <div className={`${styles.infoCard} ${styles.cardHadir}`}>
                <span className={styles.cardValue}>{data.hadir}</span>
                <span className={styles.cardLabel}>Hadir</span>
              </div>
              <div className={`${styles.infoCard} ${styles.cardTidakHadir}`}>
                <span className={styles.cardValue}>{data.total_tidak_hadir}</span>
                <span className={styles.cardLabel}>Tidak Hadir</span>
              </div>
              <div className={`${styles.infoCard} ${styles.cardPersentase}`}>
                <span className={styles.cardValue}>{data.persentase}%</span>
                <span className={styles.cardLabel}>Kehadiran</span>
              </div>
            </div>

            {}
            <div className={styles.legendCard}>
              <span className={styles.legendLabel}>Keterangan:</span>
              <div className={styles.legendItems}>
                <div className={styles.legendItem}>
                  <div className={`${styles.colorBox} ${styles.colorBoxHadir}`} />
                  <span>Hadir</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.colorBox} ${styles.colorBoxAlpha}`} />
                  <span>Tidak Hadir</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.colorBox} ${styles.colorBoxWeekend}`} />
                  <span>Weekend (Sabtu & Minggu)</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.colorBox} ${styles.colorBoxNoData}`} />
                  <span>Belum Ada Data</span>
                </div>
              </div>
            </div>

            {}
            <div className={styles.calendarCard}>
              <div className={styles.monthLabel}>
                {selectedMonthLabel} {tahun}
              </div>
              <div className={styles.calendarGridWrapper}>
                <div className={styles.calendarGrid}>
                  {dayRows.map((row, rowIdx) => (
                    <div key={rowIdx} className={styles.calendarRow}>
                      {row.map((day) => {
                        const circleClass = `${styles.dayCircle} ${getCircleClass(day.status)}`;
                        return (
                          <div key={day.day} className={circleClass} title={`Tanggal ${day.day}`}>
                            {day.day}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {}
            <div className={styles.tableCard}>
              <h3 className={styles.tableTitle}>Rekap Kehadiran</h3>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Kategori Kehadiran</th>
                      <th>Jumlah</th>
                      <th>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categories.length > 0 ? (
                      data.categories.map((cat, idx) => (
                        <tr key={idx}>
                          <td>
                            <span
                              className={
                                cat.warna === 'merah'
                                  ? styles.categoryRed
                                  : styles.categoryGreen
                              }
                            >
                              {cat.kategori}
                            </span>
                          </td>
                          <td>
                            <span
                              className={
                                cat.kategori === 'Hadir'
                                  ? styles.jumlahHadir
                                  : styles.jumlahTidakHadir
                              }
                            >
                              {cat.jumlah} hari
                            </span>
                          </td>
                          <td className={styles.keteranganCell}>{cat.keterangan}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className={styles.emptyTable}>
                          Belum ada data kehadiran.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
  );
};

export default Kehadiran;
