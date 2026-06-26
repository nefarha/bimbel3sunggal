import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdArrowBack,
  MdSave,
  MdPerson,
  MdCheckCircle,
  MdContentCopy,
  MdChat,
  MdSchool,
} from 'react-icons/md';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './tambah_tutor.module.css';

const PENDIDIKAN_OPTIONS = [
  'SMA/SMK',
  'D3',
  'S1',
  'S2',
  'S3',
];

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.|\.$/g, '');

const buildUsername = (nama) => {
  return slugify(nama);
};

const generatePassword = (length = 10) => {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const normalizePhone = (raw) => String(raw || '').replace(/\D/g, '');





const formatPhoneForWhatsApp = (raw) => {
  const digits = normalizePhone(raw);
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('62')) return digits;
  return `62${digits}`;
};

const buildWhatsAppMessage = ({ nama, username, password }) => {
  const lines = [
    `Halo ${nama},`,
    '',
    'Selamat! Anda telah resmi terdaftar sebagai tutor di GT Sunggal.',
    'Berikut adalah kredensial login untuk mengakses sistem:',
    '',
    `Username: ${username}`,
    `Password: ${password}`,
    '',
    'Silakan login dan segera ubah password Anda setelah masuk.',
    'Terima kasih.',
  ];
  return lines.join('\n');
};

const buildWhatsAppLink = (phone, message) => {
  const phoneDigits = formatPhoneForWhatsApp(phone);
  if (!phoneDigits) return null;
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
};

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const INITIAL_FORM = {
  namaTutor: '',
  nik: '',
  tempatLahir: '',
  tanggalLahir: '',
  jenisKelamin: '',
  pendidikan: '',
  noHp: '',
  alamat: '',
  tanggalBergabung: todayIsoDate(),
  status: 'Aktif',
  mapel: [],
};

const TambahTutor = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [mapelOptions, setMapelOptions] = useState([]);

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
    fetchMapelOptions();
  }, [fetchMapelOptions]);

  const toggleMapel = (value) => {
    setFormData((prev) => {
      const exists = prev.mapel.includes(value);
      return {
        ...prev,
        mapel: exists
          ? prev.mapel.filter((v) => v !== value)
          : [...prev.mapel, value],
      };
    });
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  const [copiedField, setCopiedField] = useState(null);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.namaTutor.trim()) return 'Nama tutor wajib diisi.';
    if (!formData.jenisKelamin) return 'Jenis kelamin wajib dipilih.';
    if (!formData.tanggalBergabung) return 'Tanggal bergabung wajib diisi.';
    if (formData.tanggalLahir && formData.tanggalLahir > todayIsoDate()) {
      return 'Tanggal lahir tidak valid.';
    }
    if (!formData.noHp || !normalizePhone(formData.noHp)) {
      return 'No. HP / WhatsApp wajib diisi untuk pengiriman kredensial.';
    }
    if (!/^[0-9+\-\s()]{6,20}$/.test(formData.noHp)) {
      return 'Format nomor HP tidak valid.';
    }
    return null;
  };

  const handleCopy = async (value, field) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  const handleCloseResult = () => {
    setSubmitResult(null);
    setFormData(INITIAL_FORM);
    navigate('/admin/guru', { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);

    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);

    const baseUsername = buildUsername(formData.namaTutor);
    const password = generatePassword(10);

    try {
      let userResponse;
      try {
        userResponse = await api.post('/auth/register', {
          username: baseUsername,
          password,
          role: 'tutor',
        });
      } catch (err) {
        if (err.response?.status === 409) {
          const usernameRetry = `${baseUsername}_${Math.floor(
            1000 + Math.random() * 9000
          )}`;
          userResponse = await api.post('/auth/register', {
            username: usernameRetry,
            password,
            role: 'tutor',
          });
        } else {
          throw err;
        }
      }

      const idUser =
        userResponse.data?.user?.id ||
        userResponse.data?.user?.id_user ||
        userResponse.data?.id;

      if (!idUser) {
        throw new Error('Gagal mendapatkan id_user dari server.');
      }

      const finalUsername = `${baseUsername}${idUser}`;
      try {
        await api.put('/auth/update-username', { id_user: idUser, username: finalUsername });
      } catch (err) {
        console.error('Gagal update username:', err);
      }

      const tutorPayload = {
        id_user: idUser,
        nik: formData.nik.trim() || null,
        nama_tutor: formData.namaTutor.trim(),
        tempat_lahir: formData.tempatLahir || null,
        tanggal_lahir: formData.tanggalLahir || null,
        jenis_kelamin: formData.jenisKelamin || null,
        alamat: formData.alamat || null,
        pendidikan: formData.pendidikan || null,
        no_hp: formData.noHp || null,
        tanggal_bergabung: formData.tanggalBergabung || null,
        status: formData.status || 'Aktif',
        mapel: formData.mapel.join(', ') || null,
      };

      const tutorResponse = await api.post('/guru', tutorPayload);
      const tutor = tutorResponse.data?.data;

      if (!tutor) {
        throw new Error('Gagal mendapatkan data tutor dari server.');
      }

      const whatsappMessage = buildWhatsAppMessage({
        nama: formData.namaTutor,
        username: finalUsername,
        password,
      });
      const whatsappLink = buildWhatsAppLink(formData.noHp, whatsappMessage);

      setSubmitResult({
        tutor,
        credentials: { username: finalUsername, password },
        whatsappLink,
        message: whatsappMessage,
      });
    } catch (err) {
      console.error('Submit tambah tutor error:', err);
      const apiMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Gagal menyimpan data tutor.';
      setSubmitError(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const today = useMemo(() => new Date(), []);

  return (
    <AdminLayout>
      <div className={styles.pageHeader}>
        <button
          type="button"
          className={styles.btnBack}
          onClick={() => navigate('/admin/guru')}
          aria-label="Kembali"
        >
          <MdArrowBack /> Kembali
        </button>
      </div>

      <div className={styles.introCard}>
        <div className={styles.introIcon}>
          <MdSchool />
        </div>
        <div>
          <h2 className={styles.formTitle}>TAMBAH TUTOR BARU</h2>
          <p className={styles.formSubtitle}>
            Lengkapi formulir di bawah untuk mendaftarkan tutor baru ke
            sistem. Akun login akan dibuat otomatis menggunakan username
            berbasis nama tutor.
          </p>
        </div>
      </div>

      {submitError && (
        <div className={styles.alertError} role="alert">
          <span>{submitError}</span>
          <button
            type="button"
            className={styles.alertClose}
            onClick={() => setSubmitError(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {submitResult && (
        <section className={styles.successCard} role="status">
          <div className={styles.successHeader}>
            <div className={styles.successIcon}>
              <MdCheckCircle />
            </div>
            <div>
              <h3 className={styles.successTitle}>Tutor Berhasil Ditambahkan</h3>
              <p className={styles.successSubtitle}>
                Data tutor <strong>{submitResult.tutor?.nama_tutor}</strong> telah
                tersimpan. Akun login sudah dibuat dan siap digunakan.
              </p>
            </div>
            <button
              type="button"
              className={styles.successClose}
              onClick={handleCloseResult}
              aria-label="Tutup"
            >
              ×
            </button>
          </div>

          <div className={styles.credentialGrid}>
            <div className={styles.credentialItem}>
              <span className={styles.credentialLabel}>Username</span>
              <div className={styles.credentialValueWrap}>
                <code className={styles.credentialValue}>
                  {submitResult.credentials.username}
                </code>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() =>
                    handleCopy(submitResult.credentials.username, 'username')
                  }
                  title="Salin username"
                >
                  <MdContentCopy />
                  {copiedField === 'username' && (
                    <span className={styles.copiedHint}>Tersalin</span>
                  )}
                </button>
              </div>
            </div>
            <div className={styles.credentialItem}>
              <span className={styles.credentialLabel}>Password</span>
              <div className={styles.credentialValueWrap}>
                <code className={styles.credentialValue}>
                  {submitResult.credentials.password}
                </code>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() =>
                    handleCopy(submitResult.credentials.password, 'password')
                  }
                  title="Salin password"
                >
                  <MdContentCopy />
                  {copiedField === 'password' && (
                    <span className={styles.copiedHint}>Tersalin</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <p className={styles.credentialHint}>
            Segera catat atau salin kredensial di atas. Setelah halaman ini
            ditutup, password tidak dapat ditampilkan kembali.
          </p>

          {submitResult.whatsappLink ? (
            <a
              className={styles.btnWhatsapp}
              href={submitResult.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MdChat className={styles.btnWhatsappIcon} />
              Kirim WhatsApp
            </a>
          ) : (
            <div className={styles.btnWhatsappDisabled}>
              <MdChat className={styles.btnWhatsappIcon} />
              Kirim WhatsApp (nomor tidak valid)
            </div>
          )}
        </section>
      )}

      {!submitResult && (
        <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
          {}
          <section className={styles.section}>
            <header className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <MdPerson />
              </div>
              <div>
                <h3 className={styles.sectionTitle}>Data Pribadi</h3>
                <p className={styles.sectionHint}>
                  Informasi identitas tutor sesuai KTP / dokumen resmi.
                </p>
              </div>
            </header>

            <div className={styles.grid}>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="namaTutor">
                  Nama Lengkap <span className={styles.required}>*</span>
                </label>
                <input
                  id="namaTutor"
                  name="namaTutor"
                  type="text"
                  className={styles.input}
                  placeholder="cth: Siti Aminah, S.Pd."
                  value={formData.namaTutor}
                  onChange={handleInputChange}
                  maxLength={50}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="tempatLahir">
                  Tempat Lahir
                </label>
                <input
                  id="tempatLahir"
                  name="tempatLahir"
                  type="text"
                  className={styles.input}
                  placeholder="cth: Medan"
                  value={formData.tempatLahir}
                  onChange={handleInputChange}
                  maxLength={50}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="tanggalLahir">
                  Tanggal Lahir
                </label>
                <input
                  id="tanggalLahir"
                  name="tanggalLahir"
                  type="date"
                  className={styles.input}
                  value={formData.tanggalLahir}
                  onChange={handleInputChange}
                  max={todayIsoDate()}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="jenisKelamin">
                  Jenis Kelamin <span className={styles.required}>*</span>
                </label>
                <select
                  id="jenisKelamin"
                  name="jenisKelamin"
                  className={styles.input}
                  value={formData.jenisKelamin}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">— Pilih jenis kelamin —</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="nik">
                  NIK (Nomor Induk Kependudukan)
                </label>
                <input
                  id="nik"
                  name="nik"
                  type="text"
                  className={styles.input}
                  placeholder="cth: 1201010203040005"
                  value={formData.nik}
                  onChange={handleInputChange}
                  maxLength={20}
                />
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="alamat">
                  Alamat Lengkap
                </label>
                <textarea
                  id="alamat"
                  name="alamat"
                  className={styles.textarea}
                  rows={3}
                  placeholder="Jl., kelurahan, kecamatan, kota, provinsi"
                  value={formData.alamat}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </section>

          {}
          <section className={styles.section}>
            <header className={styles.sectionHeader}>
              <div className={styles.sectionIcon}>
                <MdSchool />
              </div>
              <div>
                <h3 className={styles.sectionTitle}>Data Kepegawaian</h3>
                <p className={styles.sectionHint}>
                  Informasi latar belakang pendidikan &amp; kontak tutor.
                </p>
              </div>
            </header>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="pendidikan">
                  Pendidikan Terakhir
                </label>
                <select
                  id="pendidikan"
                  name="pendidikan"
                  className={styles.input}
                  value={formData.pendidikan}
                  onChange={handleInputChange}
                >
                  <option value="">— Pilih pendidikan —</option>
                  {PENDIDIKAN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="noHp">
                  Nomor HP
                </label>
                <input
                  id="noHp"
                  name="noHp"
                  type="text"
                  inputMode="tel"
                  className={styles.input}
                  placeholder="cth: 081234567890"
                  value={formData.noHp}
                  onChange={handleInputChange}
                  maxLength={15}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="tanggalBergabung">
                  Tanggal Bergabung{' '}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="tanggalBergabung"
                  name="tanggalBergabung"
                  type="date"
                  className={styles.input}
                  value={formData.tanggalBergabung}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="status">
                  Status <span className={styles.required}>*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  className={styles.input}
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>Mata Pelajaran</label>
                <div className={styles.chipSelectGroup}>
                  {mapelOptions.map((opt) => {
                    const selected = formData.mapel.includes(opt.nama_mapel);
                    return (
                      <button
                        key={opt.id_mapel}
                        type="button"
                        className={`${styles.chipSelect} ${
                          selected ? styles.chipSelectActive : ''
                        }`}
                        onClick={() => toggleMapel(opt.nama_mapel)}
                      >
                        {opt.nama_mapel}
                      </button>
                    );
                  })}
                </div>
                <p className={styles.fieldHint}>
                  Pilih satu atau lebih mata pelajaran yang diampu oleh tutor.
                </p>
              </div>
            </div>
          </section>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => navigate('/admin/guru')}
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={submitting}
            >
              <MdSave className={styles.btnIcon} />
              {submitting ? 'Menyimpan…' : 'Simpan Tutor'}
            </button>
          </div>
        </form>
      )}
    </AdminLayout>
  );
};

export default TambahTutor;
