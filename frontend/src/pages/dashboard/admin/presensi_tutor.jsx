import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MdCalendarMonth,
  MdCheckCircle,
  MdRefresh,
  MdSave,
  MdInfo,
} from 'react-icons/md';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './presensi_tutor.module.css';

const parseMapelIds = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
};

const getMapelName = (id, options) => {
  const found = options.find((m) => m.id_mapel === id);
  return found ? found.nama_mapel : null;
};

const formatTanggalPanjang = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const PresensiTutor = () => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    hari: '',
    tanggal: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mapelOptions, setMapelOptions] = useState([]);

  const fetchPresensiTutor = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/absensi-tutor/today');
      const data = Array.isArray(response.data?.data) ? response.data.data : [];

      setRows(
        data.map((item) => ({
          ...item,
          status: item.status || '',
        }))
      );
      setMeta(response.data?.meta || { hari: '', tanggal: '' });
    } catch (err) {
      console.error('Fetch presensi tutor error:', err);
      setRows([]);
      setError('Gagal memuat data presensi tutor hari ini.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMapelOptions = useCallback(async () => {
    try {
      const response = await api.get('/mapel');
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setMapelOptions(data);
    } catch (err) {
      console.error('Fetch mapel error:', err);
      setMapelOptions([]);
    }
  }, []);

  useEffect(() => {
    fetchPresensiTutor();
    fetchMapelOptions();
  }, [fetchPresensiTutor, fetchMapelOptions]);

  const tanggalLabel = useMemo(() => formatTanggalPanjang(meta.tanggal), [meta.tanggal]);

  const isWeekend = useMemo(() => {
    return meta.hari === 'Sabtu' || meta.hari === 'Minggu';
  }, [meta.hari]);

  const handleStatusChange = (idTutor, status) => {
    if (isWeekend) return;
    setRows((prev) =>
      prev.map((item) => (
        item.id_tutor === idTutor
          ? { ...item, status }
          : item
      ))
    );
  };

  const handleSubmit = async () => {
    if (isWeekend) return;
    setError(null);
    setSuccess(null);

    if (rows.length === 0) {
      setError('Belum ada tutor untuk hari ini.');
      return;
    }

    const belumDipilih = rows.find((item) => !item.status);
    if (belumDipilih) {
      setError(`Status kehadiran untuk ${belumDipilih.nama_tutor} belum dipilih.`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        tanggal: meta.tanggal,
        absensi: rows.map((item) => ({
          id_tutor: item.id_tutor,
          status: item.status,
        })),
      };

      const response = await api.post('/absensi-tutor/bulk', payload);
      setSuccess(response.data?.message || 'Presensi tutor berhasil disimpan.');
      await fetchPresensiTutor();
    } catch (err) {
      console.error('Save presensi tutor error:', err);
      setError(err.response?.data?.message || 'Gagal menyimpan presensi tutor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      {error && (
        <div className={styles.alertError} role="alert">
          <span>{error}</span>
          <button
            type="button"
            className={styles.alertClose}
            onClick={() => setError(null)}
            aria-label="Tutup pesan error"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className={styles.successCard} role="status">
          <div className={styles.successHeader}>
            <span className={styles.successIcon}>
              <MdCheckCircle />
            </span>
            <div>
              <p className={styles.successTitle}>Presensi berhasil disimpan</p>
              <p className={styles.successSubtitle}>{success}</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.successClose}
            onClick={() => setSuccess(null)}
            aria-label="Tutup notifikasi sukses"
          >
            ×
          </button>
        </div>
      )}

      {isWeekend && (
        <div className={styles.alertInfo} role="status">
          <MdInfo />
          <span>Hari ini adalah hari {meta.hari} (Libur). Tidak ada presensi tutor untuk hari libur.</span>
        </div>
      )}

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <h2 className={styles.pageTitle}>Presensi Tutor</h2>
          <p className={styles.pageSubtitle}>
            Verifikasi kehadiran pengajar hari ini.
          </p>
        </div>

        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.btnRefresh}
            onClick={fetchPresensiTutor}
            disabled={loading}
          >
            <MdRefresh className={loading ? styles.spin : ''} />
            <span>Refresh</span>
          </button>

          <div className={styles.dateBadge}>
            <MdCalendarMonth />
            <span>{tanggalLabel}</span>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.columnNo}>No</th>
                <th>Nama Tutor</th>
                <th>Mata Pelajaran</th>
                <th>Status Kehadiran</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    Memuat data presensi tutor...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    Belum ada data tutor.
                  </td>
                </tr>
              ) : (
                rows.map((item, index) => (
                  <tr key={item.id_tutor}>
                    <td className={styles.numberCell}>{index + 1}</td>
                    <td>
                      <p className={styles.tutorName}>{item.nama_tutor}</p>
                    </td>
                    <td>
                      <span className={styles.classBadge}>
                        {(() => {
                          const ids = parseMapelIds(item.mapel);
                          const names = ids.map((id) => getMapelName(id, mapelOptions)).filter(Boolean);
                          return names.length > 0 ? names.join(', ') : item.mapel || '—';
                        })()}
                      </span>
                    </td>
                    <td>
                      <div className={styles.radioGroup} role="radiogroup" aria-label={`Status ${item.nama_tutor}`}>
                        <label className={`${styles.radioOption} ${isWeekend ? styles.disabledOption : ''}`}>
                          <input
                            type="radio"
                            name={`status-${item.id_tutor}`}
                            value="Hadir"
                            checked={!isWeekend && item.status === 'Hadir'}
                            onChange={() => handleStatusChange(item.id_tutor, 'Hadir')}
                            disabled={isWeekend}
                          />
                          <span className={styles.radioDot} />
                          <span className={styles.radioText}>Hadir</span>
                        </label>

                        <label className={`${styles.radioOption} ${isWeekend ? styles.disabledOption : ''}`}>
                          <input
                            type="radio"
                            name={`status-${item.id_tutor}`}
                            value="Absen"
                            checked={!isWeekend && item.status === 'Absen'}
                            onChange={() => handleStatusChange(item.id_tutor, 'Absen')}
                            disabled={isWeekend}
                          />
                          <span className={styles.radioDot} />
                          <span className={styles.radioText}>Absen</span>
                        </label>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.footerAction}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={saving || loading || rows.length === 0 || isWeekend}
          >
            <MdSave />
            <span>{saving ? 'Menyimpan...' : 'Simpan Presensi Hari Ini'}</span>
          </button>
        </div>
      </section>
    </AdminLayout>
  );
};

export default PresensiTutor;
