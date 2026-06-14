import React, { useEffect, useState, useCallback } from 'react';
import {
  MdPictureAsPdf,
  MdCheckCircle,
  MdPending,
} from 'react-icons/md';
import api from '../../../services/api';
import styles from './gaji.module.css';

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

const formatRupiah = (nominal) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nominal);
};

const Gaji = () => {
  const today = new Date();
  const [bulan, setBulan] = useState(today.getMonth() + 1);
  const [tahun, setTahun] = useState(today.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get(`/gaji/perhitungan?bulan=${bulan}&tahun=${tahun}`);
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        setError('Gagal memuat data gaji');
      }
    } catch (err) {
      console.error('Gagal memuat data gaji:', err);
      setError(err.response?.data?.message || 'Gagal memuat data gaji');
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCetakPDF = () => {
    window.print();
  };

  const bulanLabel = MONTHS.find((m) => m.value === bulan)?.label || '';
  const periodeLabel = `${bulanLabel} ${tahun}`;

  return (
    <div className={styles.container}>
      {/* ─── Filter ──────────────────────────────────────── */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Bulan</label>
          <select
            className={styles.filterSelect}
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
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
        <button className={styles.pdfBtn} onClick={handleCetakPDF}>
          <MdPictureAsPdf />
          <span>Cetak PDF</span>
        </button>
      </div>

      {/* ─── Loading ─────────────────────────────────────── */}
      {loading && (
        <div className={styles.loadingState}>Memuat data gaji...</div>
      )}

      {/* ─── Error ───────────────────────────────────────── */}
      {error && !loading && (
        <div className={styles.errorAlert}>{error}</div>
      )}

      {/* ─── Content ─────────────────────────────────────── */}
      {!loading && !error && data && (
        <>
          {/* ─── Title Section ───────────────────────────── */}
          <div className={styles.titleSection}>
            <div className={styles.titleLeft}>
              <h1 className={styles.pageTitle}>Detail Perhitungan Gaji</h1>
              <p className={styles.tutorName}>{data.tutor.nama_tutor}</p>
            </div>
            <div className={styles.titleRight}>
              <span className={styles.periodeText}>{periodeLabel}</span>
            </div>
          </div>

          {/* ─── Table: Rincian SPP MASUK ────────────────── */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>Rincian SPP MASUK</h2>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Siswa</th>
                    <th>Tanggal Masuk</th>
                    <th className={styles.colNominal}>Nominal SPP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.siswa.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={styles.emptyCell}>
                        Tidak ada data siswa
                      </td>
                    </tr>
                  ) : (
                    data.siswa.map((siswa, idx) => (
                      <tr key={siswa.id_siswa}>
                        <td className={styles.colNo}>{idx + 1}</td>
                        <td>{siswa.nama}</td>
                        <td>
                          {siswa.tanggal_masuk
                            ? new Date(siswa.tanggal_masuk).toLocaleDateString(
                                'id-ID',
                                { day: 'numeric', month: 'long', year: 'numeric' }
                              )
                            : '-'}
                        </td>
                        <td className={styles.colNominal}>
                          {formatRupiah(siswa.spp)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className={styles.footLabel}>
                      Total SPP (A)
                    </td>
                    <td className={styles.footNominal}>
                      {formatRupiah(data.total_spp)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ─── Cards Row ───────────────────────────────── */}
          <div className={styles.cardsRow}>
            {/* Card 1: Komisi Dasar */}
            <div className={styles.card}>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>Komisi Dasar (B)</h3>
                <p className={styles.cardSubtext}>
                  40% dari Total SPP (A)
                </p>
                <div className={styles.cardNominal}>
                  {formatRupiah(data.komisi_dasar)}
                </div>
              </div>
            </div>

            {/* Card 2: Penyesuaian Gaji */}
            <div className={styles.card}>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>Penyesuaian Gaji (C)</h3>

                <div className={styles.adjustmentList}>
                  <div className={styles.adjustmentRow}>
                    <span className={styles.adjustmentLabel}>
                      Penambahan (Kerajinan)
                      <span className={styles.adjustmentDetail}>
                        ({data.absensi.hadir}× Rp 15.000)
                      </span>
                    </span>
                    <span className={styles.adjustmentGreen}>
                      +{formatRupiah(data.bonus)}
                    </span>
                  </div>
                  <div className={styles.adjustmentRow}>
                    <span className={styles.adjustmentLabel}>
                      Pengurangan (N× Off / Absen)
                      <span className={styles.adjustmentDetail}>
                        ({data.absensi.absen}× 5% dari A)
                      </span>
                    </span>
                    <span className={styles.adjustmentRed}>
                      -{formatRupiah(data.potongan)}
                    </span>
                  </div>
                </div>

                <div className={styles.selisihRow}>
                  <span className={styles.selisihLabel}>
                    Total Selisih (C)
                  </span>
                  <span
                    className={`${styles.selisihNominal} ${
                      data.penyesuaian >= 0
                        ? styles.selisihPositive
                        : styles.selisihNegative
                    }`}
                  >
                    {data.penyesuaian >= 0 ? '+' : '-'}
                    {formatRupiah(Math.abs(data.penyesuaian))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Grand Total Card ────────────────────────── */}
          <div className={styles.grandTotalCard}>
            <div className={styles.grandTotalBody}>
              <div className={styles.grandTotalLeft}>
                <h3 className={styles.grandTotalTitle}>
                  GRAND TOTAL PENDAPATAN GURU ( B + C )
                </h3>
                <div className={styles.grandTotalNominal}>
                  {formatRupiah(data.grand_total)}
                </div>
                <div className={styles.verificationStatus}>
                  {data.is_confirmed ? (
                    <>
                      <MdCheckCircle className={styles.verifiedIcon} />
                      <span>Telah Diverifikasi Sistem</span>
                    </>
                  ) : (
                    <>
                      <MdPending className={styles.pendingIcon} />
                      <span>Belum Diverifikasi Sistem</span>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.grandTotalRight}>
                <div className={styles.periodSummary}>
                  <span className={styles.periodSummaryLabel}>Periode</span>
                  <span className={styles.periodSummaryValue}>{periodeLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Gaji;
