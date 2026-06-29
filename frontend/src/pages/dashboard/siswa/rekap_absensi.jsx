import React, { useEffect, useState, useCallback } from 'react';
import { MdHowToReg } from 'react-icons/md';
import api from '../../../services/api';
import { useLibur } from '../../../hooks/useLibur';
import styles from './rekap_absensi.module.css';

const MONTHS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
  { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
];

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const formatJam = (jam) => {
  if (!jam) return '-';
  return jam.slice(0, 5);
};

const STATUS_LABELS = {
  hadir: 'Hadir',
  alpha: 'Alpha',
  sakit: 'Sakit',
  izin: 'Izin',
};
const STATUS_BADGE = {
  hadir: styles.badgeHadir,
  alpha: styles.badgeAlpha,
  sakit: styles.badgeSakit,
  izin: styles.badgeIzin,
};

const RekapAbsensi = () => {
  const today = new Date();
  const [bulan, setBulan] = useState(today.getMonth() + 1);
  const [tahun, setTahun] = useState(today.getFullYear());
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJadwal, setSelectedJadwal] = useState(null);
  const liburMap = useLibur(tahun, bulan);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/absensi-siswa/recap/me?bulan=${bulan}&tahun=${tahun}`);
      if (res.data?.success) {
        setData(res.data.data);
        setMeta(res.data.meta);
        // Pilih jadwal pertama jika belum ada yang dipilih
        if (res.data.data.length > 0 && !selectedJadwal) {
          setSelectedJadwal(res.data.data[0].id_jadwal);
        }
      } else {
        setError('Gagal memuat data absensi');
      }
    } catch (err) {
      console.error('Gagal memuat rekap absensi:', err);
      setError(err.response?.data?.message || 'Gagal memuat data absensi');
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeJadwal = data.find((j) => j.id_jadwal === selectedJadwal) || data[0];

  // Global stats
  const totalHadir = data.reduce((s, j) => s + j.hadir, 0);
  const totalAlpha = data.reduce((s, j) => s + j.alpha, 0);
  const totalPertemuan = data.reduce((s, j) => s + j.total_pertemuan, 0);
  const persenGlobal = totalPertemuan > 0 ? Math.round((totalHadir / totalPertemuan) * 100) : 0;

  // Table rows (days of active jadwal)
  const tableDays = activeJadwal?.days || [];
  const numDays = new Date(tahun, bulan, 0).getDate();

  return (
    <div className={styles.container}>
      {/* Header & Filter */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.pageTitle}>Rekap Absensi</h1>
          <p className={styles.pageSubtitle}>
            {meta ? `${meta.nama_siswa} — per Jadwal` : 'Siswa'}
          </p>
        </div>
        <div className={styles.filterSection}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Bulan</label>
            <select className={styles.select} value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Tahun</label>
            <select className={styles.select} value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
              {Array.from({ length: 10 }, (_, i) => {
                const y = today.getFullYear() - 5 + i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      {loading && <div className={styles.loadingState}><MdHowToReg /> Memuat data absensi...</div>}
      {error && !loading && <div className={styles.errorState}>{error}</div>}

      {!loading && !error && data.length === 0 && (
        <div className={styles.emptyState}>Belum ada data absensi untuk periode ini.</div>
      )}

      {!loading && !error && data.length > 0 && (
        <>
          {/* Global Stats */}
          <div className={styles.globalStatsRow}>
            <div className={`${styles.statCard} ${styles.statHadir}`}>
              <span className={styles.statValue}>{totalHadir}</span>
              <span className={styles.statLabel}>Total Hadir</span>
            </div>
            <div className={`${styles.statCard} ${styles.statAlpha}`}>
              <span className={styles.statValue}>{totalAlpha}</span>
              <span className={styles.statLabel}>Total Alpha</span>
            </div>
            <div className={`${styles.statCard} ${styles.statPct}`}>
              <span className={styles.statValue}>{persenGlobal}%</span>
              <span className={styles.statLabel}>Kehadiran</span>
            </div>
          </div>

          {/* Per-Jadwal Cards */}
          <div className={styles.jadwalCards}>
            {data.map((jadwal) => {
              const pct = jadwal.persentase;
              const isActive = jadwal.id_jadwal === selectedJadwal;

              return (
                <div
                  key={jadwal.id_jadwal}
                  className={styles.jadwalCard}
                  onClick={() => setSelectedJadwal(jadwal.id_jadwal)}
                  style={{ cursor: 'pointer', borderColor: isActive ? '#00236f' : '#e2e8f0' }}
                >
                  <div className={styles.jadwalCardHeader}>
                    <div className={styles.jadwalInfo}>
                      <span className={styles.jadwalMapel}>{jadwal.nama_mapel || '-'}</span>
                      <span className={styles.jadwalBadgeHari}>{Array.isArray(jadwal.hari) ? jadwal.hari.join(', ') : jadwal.hari}</span>
                      <span className={styles.jadwalJam}>
                        {formatJam(jadwal.jam)}{jadwal.jam_selesai ? ` - ${formatJam(jadwal.jam_selesai)}` : ''} ({MONTHS.find(m => m.value === bulan)?.label} {tahun})
                      </span>
                    </div>
                    <span
                      className={`${styles.jadwalPersentase} ${
                        pct >= 80 ? styles.pctGood : pct >= 50 ? styles.pctWarn : styles.pctBad
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>

                  <div className={styles.jadwalCardBody}>
                    {/* Mini Stats */}
                    <div className={styles.miniStatsRow}>
                      <span className={`${styles.miniStat} ${styles.miniStatGreen}`}>
                        ✓ Hadir {jadwal.hadir}
                      </span>
                      {jadwal.alpha > 0 && (
                        <span className={`${styles.miniStat} ${styles.miniStatRed}`}>
                          ✗ Alpha {jadwal.alpha}
                        </span>
                      )}
                      {jadwal.sakit > 0 && (
                        <span className={`${styles.miniStat} ${styles.miniStatYellow}`}>
                          S Sakit {jadwal.sakit}
                        </span>
                      )}
                      {jadwal.izin > 0 && (
                        <span className={`${styles.miniStat} ${styles.miniStatBlue}`}>
                          I Izin {jadwal.izin}
                        </span>
                      )}
                    </div>

                    {/* Mini Calendar */}
                    <div className={styles.calendarWrapper}>
                      <div className={styles.miniCalendar}>
                        <div className={styles.calendarRow}>
                          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                            <div key={d} className={styles.dayCircle} style={{
                              fontSize: '.625rem', fontWeight: 600, color: '#94a3b8',
                              background: 'none', border: 'none', width: 36, height: 24
                            }}>
                              {d}
                            </div>
                          ))}
                        </div>
                        {/* Group days into weeks */}
                        {(() => {
                          const weeks = [];
                          const dayNameToDow = { Minggu: 0, Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6 };
                          const hariArr = Array.isArray(jadwal.hari) ? jadwal.hari : [jadwal.hari];
                          const dayIndexes = hariArr.map((h) => dayNameToDow[h]).filter((i) => i >= 0);
                          const dayIndex = dayIndexes[0] ?? 0;
                          const dayMap = {};
                          jadwal.days.forEach((d) => { dayMap[d.day] = d.status; });

                          let week = new Array(7).fill(null);
                          // Week 1: offset based on day of week for 1st
                          const firstDay = new Date(tahun, bulan - 1, 1).getDay();
                          for (let d = 1; d <= numDays; d++) {
                            const dow = new Date(tahun, bulan - 1, d).getDay();
                            // Only fill this jadwal's day
                            // We want to show the day in the correct column
                            if (d === 1 || dow === 0) {
                              if (d > 1) { weeks.push(week); week = new Array(7).fill(null); }
                              // Fill leading nulls
                              for (let i = 0; i < dow; i++) week[i] = null;
                            }
                            const status = dayMap[d] || null;
                            week[dow] = { day: d, status: status || 'nodata' };
                            if (d === numDays) weeks.push(week);
                          }
                          return weeks.map((w, wi) => (
                            <div key={wi} className={styles.calendarRow}>
                              {w.map((cell, ci) => {
                                if (cell === null) {
                                  return <div key={ci} className={`${styles.dayCircle} ${styles.dayEmpty}`} />;
                                }
                                const s = cell.status;
                                const isLibur = liburMap[cell.day] && liburMap[cell.day].length > 0;
                                let cls = styles.dayNoData;
                                let symbol = '-';
                                if (isLibur) {
                                  cls = styles.dayCircleLibur;
                                  symbol = '★';
                                } else if (s === 'hadir') { cls = styles.dayHadir; symbol = '✓'; }
                                else if (s === 'alpha') { cls = styles.dayAlpha; symbol = '✗'; }
                                else if (s === 'sakit') { cls = styles.daySakit; symbol = 'S'; }
                                else if (s === 'izin') { cls = styles.dayIzin; symbol = 'I'; }
                                const liburText = isLibur ? ` (${liburMap[cell.day].join(', ')})` : '';
                                return (
                                  <div key={ci} className={`${styles.dayCircle} ${cls}`} title={`${cell.day}/${bulan}/${tahun}${liburText}`}>
                                    {symbol}
                                  </div>
                                );
                              })}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail Table for selected jadwal */}
          {activeJadwal && (
            <div className={styles.tableCard}>
              <h3 className={styles.tableTitle}>
                Detail — {activeJadwal.nama_mapel || '-'} ({Array.isArray(activeJadwal.hari) ? activeJadwal.hari.join(', ') : activeJadwal.hari})
              </h3>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th className={styles.colCenter}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableDays.length === 0 ? (
                      <tr><td colSpan={2} className={styles.emptyCell}>Tidak ada data</td></tr>
                    ) : (
                      tableDays.map((d) => {
                        const date = new Date(tahun, bulan - 1, d.day);
                        const dateStr = date.toLocaleDateString('id-ID', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        });
                        return (
                          <tr key={d.day}>
                            <td>{dateStr}</td>
                            <td className={styles.colCenter}>
                              <span className={`${styles.badge} ${STATUS_BADGE[d.status] || ''}`}>
                                {STATUS_LABELS[d.status] || '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RekapAbsensi;
