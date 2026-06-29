import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { useLibur } from '../../../hooks/useLibur';
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
  const liburMap = useLibur(tahun, bulan);

  const renderDayCell = useCallback((cell, ci) => {
    if (cell === null) {
      return <div key={ci} className={`${styles.dayCircle} ${styles.dayEmpty}`} />;
    }
    const isWeekend = ci === 0 || ci === 6;
    const isLibur = liburMap[cell.day] && liburMap[cell.day].length > 0;
    let cls, symbol;

    if (isLibur) {
      cls = styles.dayLibur;
      symbol = '★';
    } else if (cell.status === 'hadir') {
      cls = styles.dayHadir;
      symbol = '✓';
    } else if (cell.status === 'alpha' || cell.status === 'absen') {
      cls = styles.dayAlpha;
      symbol = '✗';
    } else if (cell.status === 'sakit') {
      cls = styles.daySakit;
      symbol = 'S';
    } else if (cell.status === 'izin') {
      cls = styles.dayIzin;
      symbol = 'I';
    } else if (isWeekend) {
      cls = styles.dayCircleWeekend;
      symbol = cell.day;
    } else {
      cls = styles.dayNoData;
      symbol = cell.day;
    }
    const liburText = isLibur ? ` (${liburMap[cell.day].join(', ')})` : '';
    return (
      <div key={ci} className={`${styles.dayCircle} ${cls}`} title={`${cell.day}/${bulan}/${tahun}${liburText}`}>
        {symbol}
      </div>
    );
  }, [styles, liburMap, bulan, tahun]);

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

  const dayRows = data?.days
    ? (() => {
        const numDays = new Date(tahun, bulan, 0).getDate();
        const dayMap = {};
        data.days.forEach((d) => { dayMap[d.day] = d.status; });

        const weeks = [];
        let week = [];
        for (let d = 1; d <= numDays; d++) {
          const dow = new Date(tahun, bulan - 1, d).getDay();
          if (d === 1) {
            // Fill leading empty slots
            for (let i = 0; i < dow; i++) week.push(null);
          }
          const status = dayMap[d];
          week.push({ day: d, status: status || null });
          if (dow === 6 || d === numDays) {
            // Fill remaining slots of last week
            while (week.length < 7) week.push(null);
            weeks.push(week);
            week = [];
          }
        }
        return weeks;
      })()
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
                <div className={styles.legendItem}>
                  <div className={`${styles.colorBox} ${styles.colorBoxLibur}`} />
                  <span>Hari Libur</span>
                </div>
              </div>
            </div>

            <div className={styles.calendarCard}>
              <div className={styles.monthLabel}>
                {selectedMonthLabel} {tahun}
              </div>
              <div className={styles.calendarGridWrapper}>
                <div className={styles.miniCalendar}>
                  <div className={styles.calendarRow}>
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                      <div key={d} className={styles.dayHeader}>{d}</div>
                    ))}
                  </div>
                  {dayRows.map((week, wi) => (
                    <div key={wi} className={styles.calendarRow}>
                      {week.map((cell, ci) => renderDayCell(cell, ci))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Table Card */}
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
