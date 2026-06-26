import React, { useState, useEffect, useCallback } from 'react';
import { MdSwapHoriz, MdPerson, MdSchool, MdMoneyOff } from 'react-icons/md';
import api from '../../../services/api';
import styles from './infal.module.css';

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

const formatRupiah = (nominal) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nominal);

const Infal = () => {
  const today = new Date();
  const [bulan, setBulan] = useState(today.getMonth() + 1);
  const [tahun, setTahun] = useState(today.getFullYear());
  const [data, setData] = useState({ list: [], ringkasan: { jumlah_infal: 0, total_nominal: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const years = [];
  const currentYear = today.getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 1; y++) years.push(y);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/infal/me', { params: { bulan, tahun } });
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        setError('Gagal memuat data infal.');
      }
    } catch (err) {
      console.error('Fetch infal error:', err);
      setError(err.response?.data?.message || 'Terjadi kesalahan saat mengambil data.');
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { list, ringkasan } = data;
  const bulanLabel = MONTHS.find((m) => m.value === bulan)?.label || '';

  return (
    <div className={styles.container}>
      {/* Filter */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Bulan</label>
          <select
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
            className={styles.filterSelect}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Tahun</label>
          <select
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className={styles.filterSelect}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading / Error */}
      {loading ? (
        <div className={styles.loadingState}>
          <span>Memuat data infal...</span>
        </div>
      ) : error ? (
        <div className={styles.errorAlert}>{error}</div>
      ) : (
        <>
          {/* Ringkasan */}
          <div className={styles.summaryRow}>
            <div className={styles.summaryCard}>
              <div className={`${styles.summaryIcon} ${styles.summaryIconBlue}`}>
                <MdSwapHoriz />
              </div>
              <div className={styles.summaryBody}>
                <span className={styles.summaryValue}>{ringkasan.jumlah_infal}</span>
                <span className={styles.summaryLabel}>Total Infal</span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={`${styles.summaryIcon} ${styles.summaryIconGreen}`}>
                <MdMoneyOff />
              </div>
              <div className={styles.summaryBody}>
                <span className={styles.summaryValue}>{formatRupiah(ringkasan.total_nominal)}</span>
                <span className={styles.summaryLabel}>Total Bonus Infal</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className={styles.titleSection}>
            <div className={styles.titleLeft}>
              <h1 className={styles.pageTitle}>Riwayat Infal</h1>
              <p className={styles.tutorName}>Daftar kelas yang digantikan</p>
            </div>
            <span className={styles.periodeText}>
              {bulanLabel} {tahun}
            </span>
          </div>

          {/* Tabel */}
          <div className={styles.tableSection}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Tutor yang Digantikan</th>
                    <th>Kelas</th>
                    <th style={{ textAlign: 'right' }}>Nominal</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyCell}>
                        Belum ada riwayat infal bulan ini.
                      </td>
                    </tr>
                  ) : (
                    list.map((item) => (
                      <tr key={item.id_infal}>
                        <td>
                          <span className={styles.tanggalCell}>{item.tanggal_formatted}</span>
                        </td>
                        <td>
                          <div className={styles.tutorCell}>
                            <MdPerson className={styles.tutorIcon} />
                            {item.nama_tutor_absen}
                          </div>
                        </td>
                        <td>
                          <div className={styles.kelasCell}>
                            <MdSchool className={styles.kelasIcon} />
                            {item.nama_kelas}
                          </div>
                        </td>
                        <td className={styles.nominalCell}>{formatRupiah(item.nominal)}</td>
                        <td className={styles.keteranganCell}>{item.keterangan || '—'}</td>
                      </tr>
                    ))
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

export default Infal;
