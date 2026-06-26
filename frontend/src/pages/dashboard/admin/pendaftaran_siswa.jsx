import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  MdPerson,
  MdPeople,
  MdToday,
  MdCheckCircle,
  MdContentCopy,
  MdChat,
  MdRefresh,
} from 'react-icons/md';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './pendaftaran_siswa.module.css';

const TINGKATAN_KELAS = [
  'Kelas I',
  'Kelas II',
  'Kelas III',
  'Kelas IV',
  'Kelas V',
  'Kelas VI',
  'Kelas VII',
  'Kelas VIII',
  'Kelas IX',
  'Kelas X',
  'Kelas XI',
  'Kelas XII',
];

const JENJANG_OPTIONS = [
  'SD',
  'SMP',
  'SMA/SMK',
  'D3',
  'S1',
  'S2',
  'S3',
];

const HARI_INDONESIA = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const formatTanggalLengkap = (date) => {
  const hari = HARI_INDONESIA[date.getDay()];
  const tanggal = date.getDate();
  const bulan = BULAN_INDONESIA[date.getMonth()];
  const tahun = date.getFullYear();
  return `${hari}, ${tanggal} ${bulan} ${tahun}`;
};

const formatRupiah = (value) => {
  const num = Number(value) || 0;
  return `Rp ${num.toLocaleString('en-US')}`;
};

const formatNumericInput = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = String(value).replace(/\D/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseNumericInput = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  return Number(String(value).replace(/\./g, '')) || 0;
};

const BIAYA_PENDAFTARAN = 150000;

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

const buildWhatsAppMessage = ({ nama, username, password }) => {
  const lines = [
    `Halo ${nama},`,
    '',
    'Selamat! Pendaftaran Anda di GT Sunggal telah berhasil.',
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
  const phoneDigits = normalizePhone(phone);
  if (!phoneDigits) return null;
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
};

const INITIAL_FORM = {
  nis: '',
  namaLengkap: '',
  tempatLahir: '',
  tanggalLahir: '',
  jenisKelamin: '',
  kelas: '',
  asalSekolah: '',
  tanggalMasuk: '',
  alamatLengkap: '',
  jenisProgram: [],
  namaWali: '',
  pekerjaanWali: '',
  noTelpWali: '',
  jenjangPendidikan: '',
};

const PendaftaranSiswa = () => {
  const [formData, setFormData] = useState(INITIAL_FORM);

  const [biaya, setBiaya] = useState({
    sppBulanan: '',
    modulBuku: '',
    diskonPromo: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null); // { siswa, credentials, whatsappLink, message }
  const [copiedField, setCopiedField] = useState(null);
  const [mapelOptions, setMapelOptions] = useState([]);
  const [kelasOptions, setKelasOptions] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState([]);

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

  const fetchKelasOptions = useCallback(async () => {
    try {
      const response = await api.get('/kelas');
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setKelasOptions(data);
    } catch (err) {
      console.error('Fetch kelas error:', err);
      setKelasOptions([]);
    }
  }, []);

  useEffect(() => {
    fetchMapelOptions();
    fetchKelasOptions();
  }, [fetchMapelOptions, fetchKelasOptions]);

  const filteredKelas = useMemo(() => {
    if (formData.jenisProgram.length === 0) return [];
    return kelasOptions.filter((k) => formData.jenisProgram.includes(k.id_mapel));
  }, [kelasOptions, formData.jenisProgram]);

  const totalTagihan = useMemo(() => {
    const spp = parseNumericInput(biaya.sppBulanan);
    const modul = parseNumericInput(biaya.modulBuku);
    const diskon = parseNumericInput(biaya.diskonPromo);
    return BIAYA_PENDAFTARAN + spp + modul - diskon;
  }, [biaya]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProgramToggle = (idMapel) => {
    setFormData((prev) => {
      const exists = prev.jenisProgram.includes(idMapel);
      return {
        ...prev,
        jenisProgram: exists
          ? prev.jenisProgram.filter((item) => item !== idMapel)
          : [...prev.jenisProgram, idMapel],
      };
    });

    setSelectedKelas([]);
  };

  const handleKelasToggle = (idKelas) => {
    setSelectedKelas((prev) => {
      const exists = prev.includes(idKelas);
      return exists
        ? prev.filter((item) => item !== idKelas)
        : [...prev, idKelas];
    });
  };

  const handleBiayaChange = (event) => {
    const { name, value } = event.target;

    const digitsOnly = value.replace(/\D/g, '');
    setBiaya((prev) => ({ ...prev, [name]: formatNumericInput(digitsOnly) }));
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setBiaya({ sppBulanan: '', modulBuku: '', diskonPromo: '' });
    setSubmitError(null);
    setSubmitResult(null);
    setCopiedField(null);
    setSelectedKelas([]);
  };

  const handleCloseResult = () => {
    setSubmitResult(null);
    setSubmitError(null);
    handleReset();
  };

  const handleCopy = async (text, field) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  };

  const buildBulanTagihan = (date) => {
    const bulan = BULAN_INDONESIA[date.getMonth()];
    return `${bulan} ${date.getFullYear()}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.namaLengkap.trim()) {
      setSubmitError('Nama lengkap siswa wajib diisi.');
      return;
    }
    if (!formData.kelas) {
      setSubmitError('Kelas wajib dipilih.');
      return;
    }
    if (!normalizePhone(formData.noTelpWali)) {
      setSubmitError('No. Telp / WhatsApp wali wajib diisi untuk pengiriman kredensial.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitResult(null);

    const tanggalMasukDate = formData.tanggalMasuk
      ? new Date(formData.tanggalMasuk)
      : new Date();
    const today = new Date();

    const baseUsername = buildUsername(formData.namaLengkap);
    const password = generatePassword(10);
    const sppNumeric = parseNumericInput(biaya.sppBulanan);
    const modulNumeric = parseNumericInput(biaya.modulBuku);
    const diskonNumeric = parseNumericInput(biaya.diskonPromo);
    const totalTagihanLocal = BIAYA_PENDAFTARAN + sppNumeric + modulNumeric - diskonNumeric;

    try {
      let userResponse;
      try {
        userResponse = await api.post('/auth/register', {
          username: baseUsername,
          password,
          role: 'siswa',
        });
      } catch (err) {
        if (err.response?.status === 409) {
          const usernameRetry = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
          userResponse = await api.post('/auth/register', {
            username: usernameRetry,
            password,
            role: 'siswa',
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

      const siswaPayload = {
        id_user: idUser,
        nis: formData.nis || null,
        nama: formData.namaLengkap.trim(),
        tempat_lahir: formData.tempatLahir || null,
        tanggal_lahir: formData.tanggalLahir || null,
        jenis_kelamin: formData.jenisKelamin || null,
        kelas: formData.kelas,
        mapel: formData.jenisProgram, // array of mapel IDs
        id_kelas: selectedKelas,      // array of kelas IDs — backend akan insert ke kelas_siswa
        asal_sekolah: formData.asalSekolah || null,
        alamat: formData.alamatLengkap || null,
        tanggal_masuk: formData.tanggalMasuk || null,
        nama_ortu: formData.namaWali || null,
        pekerjaan_ortu: formData.pekerjaanWali || null,
        no_hp_ortu: formData.noTelpWali || null,
        pendidikan_ortu: formData.jenjangPendidikan || null,
        spp: sppNumeric,
        status: 'Aktif',
      };

      const siswaResponse = await api.post('/siswa', siswaPayload);
      const siswa = siswaResponse.data?.data;
      const idSiswa = siswa?.id_siswa;

      if (!idSiswa) {
        throw new Error('Gagal mendapatkan id_siswa dari server.');
      }

      const pembayaranPayload = {
        id_siswa: idSiswa,
        bulan: buildBulanTagihan(today),
        tanggal_bayar: today.toISOString().slice(0, 10),
        jenis_pembayaran: 'Pendaftaran',
        jumlah: totalTagihanLocal,
        metode_pembayaran: 'Tunai',
        diskon: diskonNumeric,
        status: 'Verified',
        tanggal_verifikasi: today.toISOString(),
        catatan: modulNumeric > 0
          ? `Termasuk Modul & Buku: Rp ${modulNumeric.toLocaleString('en-US')}`
          : null,
      };
      await api.post('/pembayaran', pembayaranPayload);

      const message = buildWhatsAppMessage({
        nama: formData.namaLengkap,
        username: finalUsername,
        password,
      });
      const whatsappLink = buildWhatsAppLink(formData.noTelpWali, message);

      setSubmitResult({
        siswa,
        credentials: { username: finalUsername, password },
        whatsappLink,
        message,
      });

      setFormData(INITIAL_FORM);
      setBiaya({ sppBulanan: '', modulBuku: '', diskonPromo: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Submit pendaftaran error:', err);
      const apiMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Gagal menyimpan data pendaftaran.';
      setSubmitError(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date();

  return (
    <AdminLayout>
      {}
      {}
      <div className={styles.pageHeader}>
        <h2 className={styles.formTitle}>FORMULIR PENDAFTARAN SISWA</h2>
        <div className={styles.dateBadge}>
          <MdToday className={styles.dateIcon} />
          <span>{formatTanggalLengkap(today)}</span>
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
                  <h3 className={styles.successTitle}>Pendaftaran Berhasil</h3>
                  <p className={styles.successSubtitle}>
                    Data siswa <strong>{submitResult.siswa?.nama}</strong> telah tersimpan.
                    Akun siswa sudah dibuat dan siap digunakan.
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

              <p className={styles.successNote}>
                Segera catat atau kirim kredensial ini ke siswa. Siswa dapat mengubah
                password setelah login pertama kali.
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

              <button
                type="button"
                className={styles.btnRegisterAnother}
                onClick={handleCloseResult}
              >
                <MdRefresh />
                Daftarkan Siswa Lainnya
              </button>
            </section>
          )}

          <form className={styles.formGrid} onSubmit={handleSubmit}>
            {}
            <div className={styles.formColumn}>
              {}
              <section className={styles.card}>
                <header className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <MdPerson className={styles.cardTitleIcon} />
                    Data Siswa
                  </h3>
                </header>

                <div className={styles.cardBody}>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="namaLengkap">
                        Nama Lengkap
                      </label>
                      <input
                        id="namaLengkap"
                        name="namaLengkap"
                        type="text"
                        className={styles.input}
                        placeholder="Masukkan nama lengkap siswa"
                        value={formData.namaLengkap}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="nis">
                        NIS (Nomor Induk Siswa)
                      </label>
                      <input
                        id="nis"
                        name="nis"
                        type="text"
                        className={styles.input}
                        placeholder="cth: 1234567890"
                        value={formData.nis}
                        onChange={handleInputChange}
                        maxLength={30}
                      />
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="tempatLahir">
                        Tempat &amp; Tanggal Lahir
                      </label>
                      <div className={styles.inlineGroup}>
                        <input
                          id="tempatLahir"
                          name="tempatLahir"
                          type="text"
                          className={styles.input}
                          placeholder="Tempat"
                          value={formData.tempatLahir}
                          onChange={handleInputChange}
                        />
                        <input
                          name="tanggalLahir"
                          type="date"
                          className={styles.input}
                          value={formData.tanggalLahir}
                          onChange={handleInputChange}
                          aria-label="Tanggal Lahir"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Jenis Kelamin</label>
                      <div className={styles.radioGroup}>
                        <label className={styles.radioOption}>
                          <input
                            type="radio"
                            name="jenisKelamin"
                            value="Laki-laki"
                            checked={formData.jenisKelamin === 'Laki-laki'}
                            onChange={handleInputChange}
                          />
                          <span>Laki-laki</span>
                        </label>
                        <label className={styles.radioOption}>
                          <input
                            type="radio"
                            name="jenisKelamin"
                            value="Perempuan"
                            checked={formData.jenisKelamin === 'Perempuan'}
                            onChange={handleInputChange}
                          />
                          <span>Perempuan</span>
                        </label>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="kelas">
                        Kelas
                      </label>
                      <select
                        id="kelas"
                        name="kelas"
                        className={styles.input}
                        value={formData.kelas}
                        onChange={handleInputChange}
                      >
                        <option value="">Pilih Kelas</option>
                        {TINGKATAN_KELAS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="asalSekolah">
                        Asal Sekolah
                      </label>
                      <input
                        id="asalSekolah"
                        name="asalSekolah"
                        type="text"
                        className={styles.input}
                        placeholder="Nama sekolah sebelumnya"
                        value={formData.asalSekolah}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="tanggalMasuk">
                        Tanggal Masuk
                      </label>
                      <input
                        id="tanggalMasuk"
                        name="tanggalMasuk"
                        type="date"
                        className={styles.input}
                        value={formData.tanggalMasuk}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="alamatLengkap">
                      Alamat Lengkap
                    </label>
                    <textarea
                      id="alamatLengkap"
                      name="alamatLengkap"
                      className={styles.textarea}
                      rows={3}
                      placeholder="Masukkan alamat lengkap rumah"
                      value={formData.alamatLengkap}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Jenis Program / Mapel</label>
                    <div className={styles.checkboxGroup}>
                      {mapelOptions.length === 0 ? (
                        <span className={styles.muted}>Memuat data mapel…</span>
                      ) : (
                        mapelOptions.map((opt) => (
                          <label key={opt.id_mapel} className={styles.checkboxOption}>
                            <input
                              type="checkbox"
                              checked={formData.jenisProgram.includes(opt.id_mapel)}
                              onChange={() => handleProgramToggle(opt.id_mapel)}
                            />
                            <span>{opt.nama_mapel}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Pilih Kelas</label>
                    {formData.jenisProgram.length === 0 ? (
                      <span className={styles.muted}>
                        Pilih program terlebih dahulu untuk melihat kelas yang tersedia
                      </span>
                    ) : filteredKelas.length === 0 ? (
                      <span className={styles.muted}>
                        Tidak ada kelas tersedia untuk program yang dipilih
                      </span>
                    ) : (
                      <div className={styles.checkboxGroup}>
                        {filteredKelas.map((kelas) => (
                          <label key={kelas.id_kelas} className={styles.checkboxOption}>
                            <input
                              type="checkbox"
                              checked={selectedKelas.includes(kelas.id_kelas)}
                              onChange={() => handleKelasToggle(kelas.id_kelas)}
                            />
                            <span>{kelas.nama_kelas} ({kelas.nama_tutor || '—'})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {}
              <section className={styles.card}>
                <header className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <MdPeople className={styles.cardTitleIcon} />
                    Data Orang Tua / Wali
                  </h3>
                </header>

                <div className={styles.cardBody}>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="namaWali">
                        Nama Orang Tua / Wali
                      </label>
                      <input
                        id="namaWali"
                        name="namaWali"
                        type="text"
                        className={styles.input}
                        placeholder="Nama ayah/ibu/wali"
                        value={formData.namaWali}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="pekerjaanWali">
                        Pekerjaan
                      </label>
                      <input
                        id="pekerjaanWali"
                        name="pekerjaanWali"
                        type="text"
                        className={styles.input}
                        placeholder="Contoh: PNS, Karyawan Swasta"
                        value={formData.pekerjaanWali}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="noTelpWali">
                        No. Telp / WhatsApp
                      </label>
                      <input
                        id="noTelpWali"
                        name="noTelpWali"
                        type="tel"
                        className={styles.input}
                        placeholder="+62 812-xxxx-xxxx"
                        value={formData.noTelpWali}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="jenjangPendidikan">
                        Jenjang Pendidikan Terakhir
                      </label>
                      <select
                        id="jenjangPendidikan"
                        name="jenjangPendidikan"
                        className={styles.input}
                        value={formData.jenjangPendidikan}
                        onChange={handleInputChange}
                      >
                        <option value="">Pilih Pendidikan</option>
                        {JENJANG_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnReset}
                  onClick={handleReset}
                >
                  Reset Formulir
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan…' : 'Simpan Data Siswa'}
                </button>
              </div>
            </div>

            {}
            <aside className={styles.summaryColumn}>
              <section className={styles.summaryCard}>
                <header className={styles.summaryHeader}>
                  <h3 className={styles.summaryTitle}>Ringkasan Biaya Awal</h3>
                </header>

                <div className={styles.summaryBody}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Pendaftaran</span>
                    <span className={styles.summaryFixed}>
                      {formatRupiah(BIAYA_PENDAFTARAN)}
                    </span>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.summaryRow}>
                    <label className={styles.summaryLabel} htmlFor="sppBulanan">
                      SPP Bulanan
                    </label>
                    <div className={styles.numericInputWrap}>
                      <span className={styles.currencyPrefix}>Rp</span>
                      <input
                        id="sppBulanan"
                        name="sppBulanan"
                        type="text"
                        inputMode="numeric"
                        className={styles.numericInput}
                        value={biaya.sppBulanan}
                        onChange={handleBiayaChange}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className={styles.summaryRow}>
                    <label className={styles.summaryLabel} htmlFor="modulBuku">
                      Modul &amp; Buku
                      <span className={styles.summaryHint}> (Opsional)</span>
                    </label>
                    <div className={styles.numericInputWrap}>
                      <span className={styles.currencyPrefix}>Rp</span>
                      <input
                        id="modulBuku"
                        name="modulBuku"
                        type="text"
                        inputMode="numeric"
                        className={styles.numericInput}
                        value={biaya.modulBuku}
                        onChange={handleBiayaChange}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className={styles.summaryRow}>
                    <label
                      className={`${styles.summaryLabel} ${styles.summaryLabelDanger}`}
                      htmlFor="diskonPromo"
                    >
                      Diskon Promo
                      <span className={styles.summaryHint}> (Potongan)</span>
                    </label>
                    <div className={styles.numericInputWrap}>
                      <span
                        className={`${styles.currencyPrefix} ${styles.currencyPrefixDanger}`}
                      >
                        - Rp
                      </span>
                      <input
                        id="diskonPromo"
                        name="diskonPromo"
                        type="text"
                        inputMode="numeric"
                        className={`${styles.numericInput} ${styles.numericInputDanger}`}
                        value={biaya.diskonPromo}
                        onChange={handleBiayaChange}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.totalBox}>
                  <p className={styles.totalLabel}>TOTAL TAGIHAN</p>
                  <p className={styles.totalValue}>
                    <span className={styles.totalCurrency}>Rp</span>
                    {totalTagihan.toLocaleString('en-US')}
                  </p>
                </div>
              </section>
            </aside>
          </form>
    </AdminLayout>
  );
};

export default PendaftaranSiswa;
