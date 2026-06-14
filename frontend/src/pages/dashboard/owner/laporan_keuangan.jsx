import React, { useEffect, useState, useCallback } from 'react';
import api from '../../../services/api';
import styles from './laporan_keuangan.module.css';

const MONTHS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Agu' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Okt' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Des' },
];

const MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const formatRupiah = (nominal) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nominal);
};

const LaporanKeuangan = () => {
  const today = new Date();
  const [bulan, setBulan] = useState(today.getMonth() + 1);
  const [tahun, setTahun] = useState(today.getFullYear());
  const [rekapData, setRekapData] = useState(null);
  const [tahunanData, setTahunanData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [rekapRes, tahunanRes] = await Promise.all([
        api.get(`/keuangan/rekap?bulan=${bulan}&tahun=${tahun}`),
        api.get(`/keuangan/tahunan?tahun=${tahun}`),
      ]);

      if (rekapRes.data?.success) {
        setRekapData(rekapRes.data.data);
      }
      if (tahunanRes.data?.success) {
        setTahunanData(tahunanRes.data.data);
      }
    } catch (err) {
      console.error('Gagal memuat data keuangan:', err);
      setError(err.response?.data?.message || 'Gagal memuat data keuangan');
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxChartValue = Math.max(
    ...tahunanData.map((d) => Math.max(d.pendapatan, d.pengeluaran)),
    1
  );

  const bulanLabel = MONTHS_FULL[bulan - 1];

  return (
    <div className={styles.container}>
      {}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Bulan</label>
          <select
            className={styles.filterSelect}
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
          >
            {MONTHS_FULL.map((label, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Tahun</label>
          <select
            className={styles.filterSelect}
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
          >
            {Array.from({ length: 10 }, (_, i) => {
              const y = today.getFullYear() - 5 + i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {}
      {loading && <div className={styles.loadingState}>Memuat data keuangan...</div>}

      {}
      {error && !loading && (
        <div className={styles.errorAlert}>{error}</div>
      )}

      {}
      {!loading && !error && rekapData && (
        <>
          {}
          <div className={styles.cardsRow}>
            <div className={styles.summaryCard}>
              <span className={styles.cardLabel}>Total Pendapatan</span>
              <span className={`${styles.cardNominal} ${styles.cardPendapatan}`}>
                {formatRupiah(rekapData.total_pendapatan)}
              </span>
              <span className={styles.cardSubtext}>
                Periode {bulanLabel} {tahun}
              </span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.cardLabel}>Total Pengeluaran</span>
              <span className={`${styles.cardNominal} ${styles.cardPengeluaran}`}>
                {formatRupiah(rekapData.total_pengeluaran)}
              </span>
              <span className={styles.cardSubtext}>
                Gaji tutor periode {bulanLabel} {tahun}
              </span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.cardLabel}>Laba Bersih</span>
              <span className={`${styles.cardNominal} ${styles.cardLaba}`}>
                {rekapData.laba_bersih >= 0
                  ? formatRupiah(rekapData.laba_bersih)
                  : `-${formatRupiah(Math.abs(rekapData.laba_bersih))}`}
              </span>
              <span className={styles.cardSubtext}>
                Pendapatan - Pengeluaran
              </span>
            </div>
          </div>

          {}
          <div className={styles.chartSection}>
            <h3 className={styles.chartTitle}>
              Grafik Tahunan {tahun}
            </h3>
            <div className={styles.chartWrapper}>
              {tahunanData.map((item) => {
                const pctPendapatan = (item.pendapatan / maxChartValue) * 100;
                const pctPengeluaran = (item.pengeluaran / maxChartValue) * 100;

                return (
                  <div key={item.bulan} className={styles.barGroup}>
                    <div className={styles.barPair}>
                      <div
                        className={`${styles.bar} ${styles.barGreen}`}
                        style={{ height: `${Math.max(pctPendapatan, 2)}%` }}
                      >
                        <span className={styles.barTooltip}>
                          Pendapatan: {formatRupiah(item.pendapatan)}
                        </span>
                      </div>
                      <div
                        className={`${styles.bar} ${styles.barRed}`}
                        style={{ height: `${Math.max(pctPengeluaran, 2)}%` }}
                      >
                        <span className={styles.barTooltip}>
                          Pengeluaran: {formatRupiah(item.pengeluaran)}
                        </span>
                      </div>
                    </div>
                    <span className={styles.barLabel}>
                      {MONTHS.find((m) => m.value === item.bulan)?.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className={styles.chartLegend}>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.legendGreen}`} />
                Pendapatan
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.legendRed}`} />
                Pengeluaran
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LaporanKeuangan;
