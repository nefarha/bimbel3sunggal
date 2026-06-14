import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  MdArrowBack,
  MdCheckCircle,
  MdRadioButtonUnchecked,
  MdSave,
  MdGroupAdd,
} from 'react-icons/md';
import api from '../../../services/api';
import styles from './absensi_siswa.module.css';

const STATUS_OPTIONS = ['Hadir', 'Tidak Hadir', 'Sakit', 'Izin'];

const AbsensiSiswa = () => {
  const { id_jadwal } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [jadwal, setJadwal] = useState(null);
  const [siswaList, setSiswaList] = useState([]);
  const [statusMap, setStatusMap] = useState({}); // { [id_siswa]: status }
  const [savedMap, setSavedMap] = useState({});   // snapshot dari DB terakhir
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchJadwal = useCallback(async () => {
    if (location.state) {
      setJadwal({
        id_jadwal: parseInt(id_jadwal),
        id_kelas: location.state.id_kelas,
        hari: location.state.hari,
        jam: location.state.jam,
        nama_kelas: location.state.nama_kelas,
        nama_mapel: location.state.nama_mapel,
      });
      return location.state;
    }
    const res = await api.get(`/jadwal/${id_jadwal}`);
    const data = res.data?.data;
    if (data) setJadwal(data);
    return data;
  }, [id_jadwal, location.state]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const jadwalData = await fetchJadwal();
        if (!jadwalData || !jadwalData.id_kelas) {
          setError('Data jadwal tidak ditemukan');
          return;
        }

        const siswaRes = await api.get(`/siswa/kelas/${jadwalData.id_kelas}`);
        const siswa = siswaRes.data?.data || [];
        setSiswaList(siswa);

        const today = new Date().toISOString().split('T')[0];
        const absensiRes = await api.get(
          `/absensi-siswa?id_jadwal=${id_jadwal}&tanggal=${today}`
        );
        const absensiData = absensiRes.data?.data || [];

        const fromDb = {};
        absensiData.forEach((a) => {
          fromDb[a.id_siswa] = a.status;
        });
        setStatusMap({ ...fromDb });
        setSavedMap({ ...fromDb });
        setHasChanges(false);
      } catch (err) {
        console.error('Gagal memuat data:', err);
        setError(err.response?.data?.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id_jadwal, fetchJadwal]);

  useEffect(() => {
    const keys = new Set([...Object.keys(statusMap), ...Object.keys(savedMap)]);
    let changed = false;
    for (const k of keys) {
      if ((statusMap[k] || null) !== (savedMap[k] || null)) {
        changed = true;
        break;
      }
    }
    setHasChanges(changed);
  }, [statusMap, savedMap]);

  const formatJam = (jam) => {
    if (!jam) return '-';
    const parts = jam.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  const getStatusForSiswa = (idSiswa) => statusMap[idSiswa] || null;

  const handleStatusChange = (idSiswa, statusBaru) => {
    setStatusMap((prev) => {
      if (prev[idSiswa] === statusBaru) {
        const next = { ...prev };
        delete next[idSiswa];
        return next;
      }
      return { ...prev, [idSiswa]: statusBaru };
    });
  };

  const handleSemuaHadir = () => {
    const next = {};
    siswaList.forEach((siswa) => {
      next[siswa.id_siswa] = 'Hadir';
    });
    setStatusMap(next);
  };

  const handleSave = async () => {
    const today = new Date().toISOString().split('T')[0];

    const items = Object.entries(statusMap)
      .filter(([, status]) => status)
      .map(([idSiswa, status]) => ({
        id_siswa: parseInt(idSiswa, 10),
        status,
      }));

    if (items.length === 0) {
      setError('Pilih status absensi terlebih dahulu');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const res = await api.post('/absensi-siswa/bulk', {
        id_jadwal: parseInt(id_jadwal, 10),
        tanggal: today,
        items,
      });

      if (res.data?.success) {
        setSavedMap({ ...statusMap });
        setHasChanges(false);
        setSuccess('Absensi berhasil disimpan');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Gagal menyimpan absensi:', err);
      setError(err.response?.data?.message || 'Gagal menyimpan absensi');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Memuat data...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {}
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate('/tutor/jadwal-mengajar')}
        >
          <MdArrowBack />
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.pageTitle}>Absensi Siswa</h1>
          {jadwal && (
            <p className={styles.pageSubtitle}>
              {jadwal.nama_mapel} - {jadwal.nama_kelas}
              {' · '}
              {jadwal.hari}, {formatJam(jadwal.jam)}
            </p>
          )}
        </div>
      </div>

      {}
      {error && <div className={styles.errorAlert}>{error}</div>}
      {success && <div className={styles.successAlert}>{success}</div>}

      {}
      {siswaList.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Tidak ada siswa terdaftar di kelas ini</p>
        </div>
      ) : (
        <>
          <div className={styles.toolbar}>
            <button
              className={styles.semuaHadirBtn}
              onClick={handleSemuaHadir}
              title="Tandai semua siswa sebagai Hadir"
            >
              <MdGroupAdd />
              <span>Tandai Semua Hadir</span>
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Siswa</th>
                  {STATUS_OPTIONS.map((s) => (
                    <th key={s} className={styles.colStatus}>
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {siswaList.map((siswa, idx) => {
                  const currentStatus = getStatusForSiswa(siswa.id_siswa);
                  return (
                    <tr key={siswa.id_siswa}>
                      <td className={styles.colNo}>{idx + 1}</td>
                      <td>{siswa.nama}</td>
                      {STATUS_OPTIONS.map((s) => {
                        const isActive = currentStatus === s;
                        return (
                          <td key={s} className={styles.colStatus}>
                            <button
                              className={`${styles.statusBtn} ${
                                isActive ? styles.statusActive : ''
                              } ${styles[`status${s.replace(/\s/g, '')}`] || ''}`}
                              onClick={() => handleStatusChange(siswa.id_siswa, s)}
                              title={`Tandai ${siswa.nama} sebagai ${s}`}
                            >
                              {isActive ? (
                                <MdCheckCircle />
                              ) : (
                                <MdRadioButtonUnchecked />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {}
          <div className={styles.footer}>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={submitting || !hasChanges}
            >
              <MdSave />
              <span>{submitting ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
            {hasChanges && (
              <span className={styles.dirtyHint}>Ada perubahan yang belum disimpan</span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AbsensiSiswa;
