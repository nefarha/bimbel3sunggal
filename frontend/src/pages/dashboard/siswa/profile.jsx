import React, { useEffect, useState } from 'react';
import {
  MdPerson,
  MdLock,
  MdClose,
  MdVisibility,
  MdVisibilityOff,
  MdCheckCircle,
  MdError,
} from 'react-icons/md';
import api from '../../../services/api';
import styles from './profile.module.css';

const JENIS_KELAMIN_MAP = {
  L: 'Laki-laki',
  P: 'Perempuan',
};

const Profile = () => {
  const [siswa, setSiswa] = useState(null);
  const [mapelMap, setMapelMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const getMapelNames = (mapelField) => {
    if (!mapelField || !mapelField.trim()) return '—';
    try {
      const ids = JSON.parse(mapelField);
      if (!Array.isArray(ids)) return mapelField;
      return ids.map((id) => mapelMap[id] || `Mapel #${id}`).join(', ');
    } catch {
      return mapelField;
    }
  };

  useEffect(() => {
    const fetchSiswa = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          setError('User tidak ditemukan');
          setLoading(false);
          return;
        }
        const user = JSON.parse(storedUser);

        // Fetch mapel mapping
        const mapelRes = await api.get('/mapel').catch(() => ({ data: { data: [] } }));
        const mapelData = mapelRes.data?.data || [];
        const mapelMapObj = {};
        mapelData.forEach((m) => { mapelMapObj[m.id_mapel] = m.nama_mapel; });
        setMapelMap(mapelMapObj);

        const response = await api.get(`/siswa/by-user/${user.id}`);
        setSiswa(response.data?.data || null);
      } catch (err) {
        console.error('Fetch siswa error:', err);
        setError(err.response?.data?.message || 'Gagal memuat data profil');
      } finally {
        setLoading(false);
      }
    };
    fetchSiswa();
  }, []);

  const openSheet = () => {
    setSheetOpen(true);
    setPasswordBaru('');
    setKonfirmasiPassword('');
    setShowPassword(false);
    setShowKonfirmasi(false);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const closeSheet = () => {
    setSheetOpen(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!passwordBaru || !konfirmasiPassword) {
      setSubmitError('Semua field wajib diisi');
      return;
    }
    if (passwordBaru.length < 6) {
      setSubmitError('Password baru minimal 6 karakter');
      return;
    }
    if (passwordBaru !== konfirmasiPassword) {
      setSubmitError('Password baru dan konfirmasi password tidak cocok');
      return;
    }

    setSubmitting(true);
    try {
      await api.put('/auth/change-password', {
        passwordBaru,
        konfirmasiPassword,
      });
      setSubmitSuccess('Password berhasil diubah');
      setTimeout(() => {
        closeSheet();
      }, 1500);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Memuat data profil...</div>
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

  if (!siswa) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>Data siswa tidak ditemukan</div>
      </div>
    );
  }

  const formatTanggal = (tanggal) => {
    if (!tanggal) return '—';
    const d = new Date(tanggal);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatRupiah = (value) => {
    const num = Number(value) || 0;
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  return (
    <div className={styles.container}>
      {}
      <div className={styles.header}>
        <div className={styles.avatarWrapper}>
          <MdPerson className={styles.avatarIcon} />
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerName}>{siswa.nama}</h1>
          <p className={styles.headerRole}>Siswa</p>
          {siswa.kelas && <p className={styles.headerNip}>Kelas: {siswa.kelas}</p>}
        </div>
      </div>

      {}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Informasi Pribadi</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Nama Lengkap</span>
            <span className={styles.infoValue}>{siswa.nama || '—'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Username</span>
            <span className={styles.infoValue}>{siswa.username || '—'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Tempat Lahir</span>
            <span className={styles.infoValue}>{siswa.tempat_lahir || '—'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Tanggal Lahir</span>
            <span className={styles.infoValue}>{formatTanggal(siswa.tanggal_lahir)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Jenis Kelamin</span>
            <span className={styles.infoValue}>{JENIS_KELAMIN_MAP[siswa.jenis_kelamin] || '—'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Kelas</span>
            <span className={styles.infoValue}>{siswa.kelas || '—'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Asal Sekolah</span>
            <span className={styles.infoValue}>{siswa.asal_sekolah || '—'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Mata Pelajaran</span>
            <span className={styles.infoValue}>{getMapelNames(siswa.mapel)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>SPP</span>
            <span className={styles.infoValue}>{formatRupiah(siswa.spp)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Status</span>
            <span className={`${styles.infoValue} ${siswa.status === 'Aktif' ? styles.statusAktif : styles.statusNonaktif}`}>
              {siswa.status || '—'}
            </span>
          </div>
          <div className={styles.infoItemFull}>
            <span className={styles.infoLabel}>Nama Orang Tua</span>
            <span className={styles.infoValue}>{siswa.nama_ortu || '—'}</span>
          </div>
          <div className={styles.infoItemFull}>
            <span className={styles.infoLabel}>Alamat</span>
            <span className={styles.infoValue}>{siswa.alamat || '—'}</span>
          </div>
          <div className={styles.infoItemFull}>
            <span className={styles.infoLabel}>Tanggal Masuk</span>
            <span className={styles.infoValue}>{formatTanggal(siswa.tanggal_masuk)}</span>
          </div>
        </div>
      </div>

      {}
      <div className={styles.actions}>
        <button type="button" className={styles.btnChangePassword} onClick={openSheet}>
          <MdLock className={styles.btnIcon} />
          Ubah Password
        </button>
      </div>

      {}
      {sheetOpen && (
        <div className={styles.overlay} onClick={closeSheet}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <h2 className={styles.sheetTitle}>Ubah Password</h2>
              <button type="button" className={styles.sheetClose} onClick={closeSheet}>
                <MdClose />
              </button>
            </div>

            <form className={styles.sheetBody} onSubmit={handleChangePassword}>
              {submitSuccess && (
                <div className={styles.alertSuccess}>
                  <MdCheckCircle className={styles.alertIcon} />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {submitError && (
                <div className={styles.alertError}>
                  <MdError className={styles.alertIcon} />
                  <span>{submitError}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="passwordBaru" className={styles.formLabel}>
                  Password Baru
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="passwordBaru"
                    type={showPassword ? 'text' : 'password'}
                    className={styles.formInput}
                    placeholder="Masukkan password baru"
                    value={passwordBaru}
                    onChange={(e) => setPasswordBaru(e.target.value)}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="konfirmasiPassword" className={styles.formLabel}>
                  Konfirmasi Password Baru
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="konfirmasiPassword"
                    type={showKonfirmasi ? 'text' : 'password'}
                    className={styles.formInput}
                    placeholder="Masukkan ulang password baru"
                    value={konfirmasiPassword}
                    onChange={(e) => setKonfirmasiPassword(e.target.value)}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowKonfirmasi(!showKonfirmasi)}
                    tabIndex={-1}
                  >
                    {showKonfirmasi ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>

              <div className={styles.sheetActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={closeSheet}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
