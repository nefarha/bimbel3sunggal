import React, { useEffect, useState, useCallback } from 'react';
import { MdChevronLeft, MdChevronRight, MdRefresh } from 'react-icons/md';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './tagihan_siswa.module.css';

const TagihanSiswa = () => {
  const [piutang, setPiutang] = useState([]);
  const [piutangMeta, setPiutangMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPiutang = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/piutang', { params: { page, limit: 10 } });
      if (res.data.success) {
        setPiutang(res.data.data || []);
        setPiutangMeta(res.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Fetch piutang error:', err);
      setError('Gagal memuat data tagihan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPiutang();
  }, [fetchPiutang]);

  const handleKirimTagihan = (row) => {
    const phone = (row.whatsapp || '').replace(/\D/g, '');
    const message = encodeURIComponent(
      `Halo ${row.nama}, ini adalah pengingat pembayaran SPP. ` +
      `Tunggakan Anda saat ini: ${row.tunggakan || '1 Bulan'} ` +
      `dengan bulan tertunggak mulai ${row.bulan}. ` +
      `Mohon segera dilakukan pembayaran. Terima kasih.`
    );
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    } else {
      alert('Nomor WhatsApp tidak valid');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > piutangMeta.totalPages) return;
    fetchPiutang(newPage);
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Tagihan Siswa</h1>
            <p className={styles.pageSubtitle}>Monitoring piutang &amp; tagihan SPP siswa yang jatuh tempo</p>
          </div>
          <button
            type="button"
            className={styles.btnRefresh}
            onClick={() => fetchPiutang(piutangMeta.page)}
            disabled={loading}
          >
            <MdRefresh className={styles.btnIcon} />
            {loading ? 'Memuat…' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className={styles.alertError} role="alert">
            <span>{error}</span>
            <button type="button" className={styles.alertClose} onClick={() => setError(null)} aria-label="Tutup">×</button>
          </div>
        )}

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              Monitoring Piutang &amp; Tagihan Siswa (Jatuh Tempo)
            </h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${styles.tableReceivables}`}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Siswa</th>
                  <th>Bulan Terlama</th>
                  <th>Tunggakan</th>
                  <th>Nominal</th>
                  <th>No Whatsapp</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>Memuat data…</td>
                  </tr>
                ) : piutang.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      Tidak ada piutang / tagihan jatuh tempo
                    </td>
                  </tr>
                ) : (
                  piutang.map((row, idx) => (
                    <tr key={row.id}>
                      <td>{(piutangMeta.page - 1) * piutangMeta.limit + idx + 1}</td>
                      <td className={styles.tdBold}>{row.nama}</td>
                      <td>{row.bulan}</td>
                      <td>
                        <span className={`${styles.pill} ${styles.pillPending}`}>
                          {row.tunggakan}
                        </span>
                      </td>
                      <td>{row.nominal}</td>
                      <td>
                        <input
                          type="text"
                          defaultValue={row.whatsapp}
                          className={styles.whatsappInput}
                          aria-label={`Nomor WhatsApp ${row.nama}`}
                          readOnly
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.btnCta}
                          onClick={() => handleKirimTagihan(row)}
                        >
                          Kirim Tagihan
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {piutangMeta.total > 0 && (
            <div className={styles.tableFooter}>
              <p className={styles.tableFooterText}>
                Menampilkan {piutang.length} dari {piutangMeta.total} data tagihan
              </p>
              <div className={styles.pager}>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  aria-label="Previous"
                  onClick={() => handlePageChange(piutangMeta.page - 1)}
                  disabled={piutangMeta.page <= 1}
                >
                  <MdChevronLeft />
                </button>
                <span className={styles.pagerPage}>
                  Halaman {piutangMeta.page} / {piutangMeta.totalPages}
                </span>
                <button
                  type="button"
                  className={styles.pagerBtn}
                  aria-label="Next"
                  onClick={() => handlePageChange(piutangMeta.page + 1)}
                  disabled={piutangMeta.page >= piutangMeta.totalPages}
                >
                  <MdChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default TagihanSiswa;
