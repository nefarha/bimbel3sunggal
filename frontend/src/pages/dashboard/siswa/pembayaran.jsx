import React, { useEffect, useState } from 'react';
import { MdPerson } from 'react-icons/md';
import api from '../../../services/api';
import styles from './pembayaran.module.css';

const formatRupiah = (value) => {
  const num = Number(value) || 0;
  return `Rp ${num.toLocaleString('id-ID')}`;
};

const JENIS_LABEL_MAP = {
  SPP: 'SPP Bulanan',
  Modul: 'Modul / Buku',
};

const Pembayaran = () => {
  const [siswa, setSiswa] = useState(null);
  const [pembayaranList, setPembayaranList] = useState([]);
  const [tunggakan, setTunggakan] = useState({ count: 0, months: [] });
  const [mapelMap, setMapelMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tahun, setTahun] = useState(new Date().getFullYear());

  // Helper: resolve mapel IDs → names
  const getMapelNames = (mapelField) => {
    if (!mapelField || !mapelField.trim()) return '-';
    try {
      const ids = JSON.parse(mapelField);
      if (!Array.isArray(ids)) return mapelField;
      return ids.map((id) => mapelMap[id] || `Mapel #${id}`).join(', ');
    } catch {
      return mapelField;
    }
  };

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

        // Fetch mapel mapping
        const mapelRes = await api.get('/mapel').catch(() => ({ data: { data: [] } }));
        const mapelData = mapelRes.data?.data || [];
        const mapelMapObj = {};
        mapelData.forEach((m) => { mapelMapObj[m.id_mapel] = m.nama_mapel; });
        setMapelMap(mapelMapObj);

        const siswaRes = await api.get(`/siswa/by-user/${user.id}`);
        const siswaData = siswaRes.data?.data;
        if (!siswaData) {
          setError('Data siswa tidak ditemukan');
          return;
        }
        setSiswa(siswaData);

        const pembayaranRes = await api.get(`/pembayaran?id_siswa=${siswaData.id_siswa}`);
        const allPembayaran = pembayaranRes.data?.data || [];
        setPembayaranList(allPembayaran);

        try {
          const tunggakanRes = await api.get(`/pembayaran/tunggakan/${siswaData.id_siswa}`);
          const tunggakanData = tunggakanRes.data?.data;
          setTunggakan({
            count: tunggakanData?.tunggakan_count || 0,
            months: tunggakanData?.tunggakan_months || [],
          });
        } catch {
          setTunggakan({ count: 0, months: [] });
        }
      } catch (err) {
        console.error('Gagal memuat data:', err);
        setError(err.response?.data?.message || 'Gagal memuat data pembayaran');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalTagihan = Number(siswa?.spp || 0) * tunggakan.count;

  const totalDibayar = pembayaranList
    .filter((p) => p.status === 'Verified')
    .reduce((sum, p) => sum + Number(p.jumlah || 0), 0);

  const tagihanAktif = tunggakan.count;

  const filteredPembayaran = pembayaranList.filter((p) => {
    if (!p.tanggal_verifikasi) return false;
    const year = new Date(p.tanggal_verifikasi).getFullYear();
    return year === tahun;
  }).sort((a, b) => new Date(b.tanggal_verifikasi) - new Date(a.tanggal_verifikasi));

  const availableYears = [...new Set(
    pembayaranList
      .filter((p) => p.tanggal_verifikasi)
      .map((p) => new Date(p.tanggal_verifikasi).getFullYear())
  )].sort((a, b) => b - a);

  const formatTanggal = (tanggal) => {
    if (!tanggal) return '—';
    const d = new Date(tanggal);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getJenisBadgeClass = (jenis) => {
    switch (jenis) {
      case 'SPP': return styles.jenisSpp;
      case 'Modul': return styles.jenisModul;
      default: return styles.jenisOther;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Verified': return styles.statusVerified;
      case 'Pending': return styles.statusPending;
      case 'Rejected': return styles.statusRejected;
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Memuat data pembayaran...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {}
      {siswa && (
        <div className={styles.headerCard}>
          <div className={styles.avatarWrapper}>
            <MdPerson className={styles.avatarIcon} />
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.headerName}>{siswa.nama}</h1>
            <p className={styles.headerMeta}>{siswa.kelas || '-'} | {getMapelNames(siswa.mapel)}</p>
            <p className={styles.headerMeta}>SPP: {formatRupiah(siswa.spp)}/bulan</p>
          </div>
        </div>
      )}

      {}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Tagihan</span>
          <span className={`${styles.statValue} ${styles.statValueTotal}`}>
            {totalTagihan > 0 ? formatRupiah(totalTagihan) : 'Rp 0'}
          </span>
          <span className={styles.statSubtext}>
            {tunggakan.count > 0
              ? `${tunggakan.count} bulan × ${formatRupiah(Number(siswa?.spp || 0))}`
              : 'Tidak ada tunggakan'}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Dibayar</span>
          <span className={`${styles.statValue} ${styles.statValuePaid}`}>
            {formatRupiah(totalDibayar)}
          </span>
          <span className={styles.statSubtext}>Pembayaran terverifikasi</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Tagihan Aktif</span>
          <span className={`${styles.statValue} ${styles.statValueActive}`}>
            {tagihanAktif}
          </span>
          <span className={styles.statSubtext}>Bulan tunggakan</span>
        </div>
      </div>

      {}
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Riwayat Pembayaran</h2>
          {availableYears.length > 0 && (
            <select
              className={styles.yearSelect}
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Jenis Biaya</th>
                <th>Tanggal Pembayaran</th>
                <th>Nominal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPembayaran.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyTable}>
                    Belum ada data pembayaran untuk tahun {tahun}
                  </td>
                </tr>
              ) : (
                filteredPembayaran.map((p) => (
                  <tr key={p.id_pembayaran}>
                    <td>
                      <span className={`${styles.jenisBadge} ${getJenisBadgeClass(p.jenis_pembayaran)}`}>
                        {JENIS_LABEL_MAP[p.jenis_pembayaran] || p.jenis_pembayaran || '-'}
                      </span>
                    </td>
                    <td>{formatTanggal(p.tanggal_verifikasi)}</td>
                    <td className={styles.nominalCell}>{formatRupiah(p.jumlah)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(p.status)}`}>
                        {p.status === 'Verified' ? 'Lunas' : p.status === 'Pending' ? 'Pending' : 'Ditolak'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Pembayaran;
