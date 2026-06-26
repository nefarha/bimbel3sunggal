import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MdSearch,
  MdCheckCircle,
  MdRefresh,
  MdInfo,
  MdWarning,
} from 'react-icons/md';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './pembayaran_siswa.module.css';

const JENIS_PEMBAYARAN_OPTIONS = [
  { value: 'SPP', label: 'SPP Bulanan' },
  { value: 'Modul', label: 'Modul / Buku' },
];

const METODE_PEMBAYARAN_OPTIONS = [
  { value: 'Tunai', label: 'Tunai' },
  { value: 'Transfer', label: 'Transfer' },
];

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

const buildKuitansiId = (id) => {
  if (!id) return '—';
  const year = new Date().getFullYear();
  return `KWT/${year}/${String(id).padStart(3, '0')}`;
};

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const buildBulanTagihan = (date = new Date()) => {
  return `${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
};

const formatISODate = (date) => {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const INITIAL_FORM = {
  search: '',
  selectedSiswa: null,
  namaLengkap: '',
  kelas: '',
  jenisPembayaran: '',
  metodePembayaran: 'Tunai',
  jumlahDibayar: '',
  keterangan: '',
};

const PembayaranSiswa = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [tunggakan, setTunggakan] = useState({
    loading: false,
    months: [], // [{ bulan, tanggal_bayar, year, monthIdx }, ...]
    error: null,
  });
  const [paymentMode, setPaymentMode] = useState('all'); // 'all' | 'single'
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(null);
  const [toast, setToast] = useState(null); // { title, message } | null
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const keyword = form.search.trim();
    if (!keyword) {
      setSearchResults([]);
      setShowDropdown(false);
      setSearchError(null);
      return;
    }
    if (form.selectedSiswa && form.selectedSiswa.nama === keyword) {

      return;
    }

    setSearching(true);
    setSearchError(null);
    const timer = setTimeout(async () => {
      try {
        const response = await api.get('/siswa');
        const all = response.data?.data || [];
        const filtered = all.filter((s) =>
          String(s.nama || '').toLowerCase().includes(keyword.toLowerCase())
        );
        setSearchResults(filtered.slice(0, 8));
        setShowDropdown(true);
        if (filtered.length === 0) {
          setSearchError('Siswa tidak ditemukan');
        }
      } catch (err) {
        console.error('Search siswa error:', err);
        setSearchError('Gagal mencari data siswa');
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [form.search, form.selectedSiswa]);

  useEffect(() => {
    const siswa = form.selectedSiswa;
    if (!siswa || form.jenisPembayaran !== 'SPP') {
      setTunggakan({ loading: false, months: [], error: null });
      setSelectedPeriodIdx(null);
      return;
    }

    let cancelled = false;
    setTunggakan({ loading: true, months: [], error: null });

    (async () => {
      try {
        const response = await api.get(`/pembayaran/tunggakan/${siswa.id_siswa}`);
        if (cancelled) return;
        const data = response.data?.data;
        const months = Array.isArray(data?.tunggakan_months) ? data.tunggakan_months : [];
        setTunggakan({ loading: false, months, error: null });
        setSelectedPeriodIdx((prev) =>
          prev !== null && prev < months.length ? prev : months.length > 0 ? 0 : null
        );
      } catch (err) {
        if (cancelled) return;
        console.error('Fetch tunggakan error:', err);
        const apiMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Gagal memuat data tunggakan siswa.';
        setTunggakan({ loading: false, months: [], error: apiMessage });
        setSelectedPeriodIdx(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.selectedSiswa, form.jenisPembayaran]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      search: value,

      selectedSiswa: prev.selectedSiswa && prev.selectedSiswa.nama === value
        ? prev.selectedSiswa
        : null,
      namaLengkap: '',
      kelas: '',
    }));
  };

  const handleSelectSiswa = (siswa) => {
    setForm((prev) => ({
      ...prev,
      search: siswa.nama,
      selectedSiswa: siswa,
      namaLengkap: siswa.nama,
      kelas: siswa.kelas || '',
    }));
    setShowDropdown(false);
    setSearchError(null);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name === 'jumlahDibayar') {
      setForm((prev) => ({ ...prev, [name]: formatNumericInput(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const totalTagihan = useMemo(() => {
    if (!form.selectedSiswa) return 0;
    if (form.jenisPembayaran === 'SPP') {
      return Number(form.selectedSiswa.spp) || 0;
    }
    if (form.jenisPembayaran === 'Modul') {
      return 0; // Nominal modul/buku ditentukan manual via jumlahDibayar
    }
    return 0;
  }, [form.selectedSiswa, form.jenisPembayaran]);

  const jumlahNumeric = parseNumericInput(form.jumlahDibayar);
  const kembalian = Math.max(jumlahNumeric - totalTagihan, 0);
  const kurangBayar = totalTagihan > 0 && jumlahNumeric > 0
    ? Math.max(totalTagihan - jumlahNumeric, 0)
    : 0;

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setSubmitError(null);
    setSubmitResult(null);
    setSearchError(null);
    setSearchResults([]);
    setShowDropdown(false);
    setTunggakan({ loading: false, months: [], error: null });
    setPaymentMode('all');
    setSelectedPeriodIdx(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);

    if (!form.selectedSiswa) {
      setSubmitError('Pilih siswa terlebih dahulu dari hasil pencarian.');
      return;
    }
    if (!form.jenisPembayaran) {
      setSubmitError('Pilih jenis pembayaran.');
      return;
    }
    if (!form.metodePembayaran) {
      setSubmitError('Pilih metode pembayaran.');
      return;
    }

    const isTunggakanFlow =
      form.jenisPembayaran === 'SPP' && tunggakan.months.length > 1;
    const today = new Date();
    const tanggalVerifikasi = formatISODate(today);

    setSubmitting(true);

    try {
      if (isTunggakanFlow) {
        const spp = Number(form.selectedSiswa.spp) || 0;
        let periodsToPay = [];

        if (paymentMode === 'all') {
          periodsToPay = tunggakan.months;
        } else {
          if (
            selectedPeriodIdx === null ||
            selectedPeriodIdx < 0 ||
            selectedPeriodIdx >= tunggakan.months.length
          ) {
            setSubmitting(false);
            setSubmitError('Pilih periode tunggakan yang ingin dibayar.');
            return;
          }
          if (selectedPeriodIdx > 0) {
            setSubmitting(false);
            setSubmitError(
              `Pembayaran harus berurutan. Silakan bayar tunggakan bulan ${tunggakan.months[0].bulan} terlebih dahulu.`
            );
            return;
          }
          periodsToPay = [tunggakan.months[selectedPeriodIdx]];
        }

        if (periodsToPay.length === 0) {
          setSubmitting(false);
          setSubmitError('Tidak ada tunggakan untuk dibayar.');
          return;
        }

        const createdIds = [];
        for (const p of periodsToPay) {
          const payload = {
            id_siswa: form.selectedSiswa.id_siswa,
            bulan: p.bulan,
            tanggal_bayar: formatISODate(today),
            jenis_pembayaran: 'SPP',
            jumlah: spp,
            metode_pembayaran: form.metodePembayaran,
            diskon: 0,
            status: 'Verified',
            tanggal_verifikasi: p.tanggal_bayar,
            catatan: `Pembayaran tunggakan (${paymentMode === 'all' ? 'bulk' : '1 periode'})${form.keterangan ? ' — ' + form.keterangan : ''}`,
          };

          const res = await api.post('/pembayaran', payload);
          const created = res.data?.data;
          if (created?.id_pembayaran) createdIds.push(created.id_pembayaran);
        }

        const firstId = createdIds[0];
        setSubmitResult({
          siswa: form.selectedSiswa,
          kuitansiId: buildKuitansiId(firstId),
          jumlahKuitansi: createdIds.length,
          jenis: 'SPP',
          metode: form.metodePembayaran,
          jumlah: spp * periodsToPay.length,
          kembalian: 0,
          total: spp * periodsToPay.length,
          isTunggakan: true,
          periodeCount: periodsToPay.length,
        });
        setToast({
          title: 'Pembayaran Berhasil Disimpan',
          message: `Tunggakan SPP atas nama ${form.selectedSiswa.nama} (${periodsToPay.length} periode) telah berhasil dicatat dan diverifikasi.`,
        });
        handleReset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (jumlahNumeric <= 0) {
        setSubmitError('Jumlah uang dibayar harus lebih dari 0.');
        setSubmitting(false);
        return;
      }

      const payload = {
        id_siswa: form.selectedSiswa.id_siswa,
        bulan: buildBulanTagihan(today),
        tanggal_bayar: formatISODate(today),
        jenis_pembayaran: form.jenisPembayaran,
        jumlah: jumlahNumeric,
        metode_pembayaran: form.metodePembayaran,
        diskon: 0,
        status: 'Verified',
        tanggal_verifikasi: tanggalVerifikasi,
        catatan: form.keterangan.trim() || null,
      };

      const response = await api.post('/pembayaran', payload);
      const created = response.data?.data;
      setSubmitResult({
        siswa: form.selectedSiswa,
        kuitansiId: buildKuitansiId(created?.id_pembayaran),
        jenis: form.jenisPembayaran,
        metode: form.metodePembayaran,
        jumlah: jumlahNumeric,
        kembalian,
        total: totalTagihan,
      });
      setToast({
        title: 'Pembayaran Berhasil Disimpan',
        message: `Pembayaran ${form.jenisPembayaran} atas nama ${form.selectedSiswa.nama} telah berhasil dicatat dan diverifikasi.`,
      });
      handleReset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Submit pembayaran error:', err);
      const apiMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Gagal menyimpan data pembayaran.';
      setSubmitError(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      {}
      <div className={styles.pageHeader}>
        <h2 className={styles.formTitle}>PEMBAYARAN SISWA</h2>
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
                  <h3 className={styles.successTitle}>Pembayaran Tersimpan</h3>
                  <p className={styles.successSubtitle}>
                    Pembayaran atas nama <strong>{submitResult.siswa.nama}</strong> berhasil
                    dicatat dengan nomor kuitansi <strong>{submitResult.kuitansiId}</strong>
                    {submitResult.isTunggakan && submitResult.periodeCount > 1
                      ? ` (${submitResult.periodeCount} kuitansi)`
                      : ''}
                    . Transaksi langsung berstatus <em>Terverifikasi</em>.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.successClose}
                  onClick={() => setSubmitResult(null)}
                  aria-label="Tutup"
                >
                  ×
                </button>
              </div>
              <button
                type="button"
                className={styles.btnRegisterAnother}
                onClick={() => setSubmitResult(null)}
              >
                <MdRefresh />
                Buat Pembayaran Lainnya
              </button>
            </section>
          )}

          {}
          {toast && (
            <div
              className={styles.toastOverlay}
              role="dialog"
              aria-modal="true"
              aria-labelledby="toast-title"
              onClick={() => setToast(null)}
            >
              <div
                className={styles.toastDialog}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.toastIcon}>
                  <MdCheckCircle />
                </div>
                <h3 id="toast-title" className={styles.toastTitle}>
                  {toast.title}
                </h3>
                <p className={styles.toastMessage}>{toast.message}</p>
                <div className={styles.toastActions}>
                  <button
                    type="button"
                    className={styles.toastButton}
                    onClick={() => setToast(null)}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          <form className={styles.formGrid} onSubmit={handleSubmit}>
            {}
            <div className={styles.formColumn}>
              <section className={styles.card}>
                <header className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <MdInfo className={styles.cardTitleIcon} />
                    Informasi Pembayaran
                  </h3>
                </header>

                <div className={styles.cardBody}>
                  {}
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="search">
                      Cari Nama Siswa
                    </label>
                    <div className={styles.searchWrap} ref={searchRef}>
                      <MdSearch className={styles.searchIcon} />
                      <input
                        id="search"
                        name="search"
                        type="text"
                        className={styles.input}
                        placeholder="Ketik nama (misal: Regan-1)"
                        value={form.search}
                        onChange={handleSearchChange}
                        onFocus={() => {
                          if (searchResults.length > 0) setShowDropdown(true);
                        }}
                        autoComplete="off"
                      />
                      {showDropdown && (searchResults.length > 0 || searching || searchError) && (
                        <ul className={styles.dropdown} ref={dropdownRef}>
                          {searching && (
                            <li className={styles.dropdownHint}>Mencari…</li>
                          )}
                          {!searching && searchError && searchResults.length === 0 && (
                            <li className={styles.dropdownHint}>{searchError}</li>
                          )}
                          {!searching && searchResults.map((siswa) => (
                            <li
                              key={siswa.id_siswa}
                              className={styles.dropdownItem}
                              onClick={() => handleSelectSiswa(siswa)}
                            >
                              <span className={styles.dropdownName}>{siswa.nama}</span>
                              <span className={styles.dropdownMeta}>
                                {siswa.kelas || '—'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {}
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
                        placeholder="Otomatis terisi"
                        value={form.namaLengkap}
                        readOnly
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="kelas">
                        Kelas
                      </label>
                      <input
                        id="kelas"
                        name="kelas"
                        type="text"
                        className={styles.input}
                        placeholder="Otomatis terisi"
                        value={form.kelas}
                        readOnly
                      />
                    </div>
                  </div>

                  {}
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="jenisPembayaran">
                        Jenis Pembayaran
                      </label>
                      <select
                        id="jenisPembayaran"
                        name="jenisPembayaran"
                        className={styles.input}
                        value={form.jenisPembayaran}
                        onChange={handleInputChange}
                      >
                        <option value="">Pilih jenis…</option>
                        {JENIS_PEMBAYARAN_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="metodePembayaran">
                        Metode Pembayaran
                      </label>
                      <select
                        id="metodePembayaran"
                        name="metodePembayaran"
                        className={styles.input}
                        value={form.metodePembayaran}
                        onChange={handleInputChange}
                      >
                        {METODE_PEMBAYARAN_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {}
                  {form.jenisPembayaran === 'SPP' && form.selectedSiswa && (
                    <>
                      {tunggakan.loading && (
                        <div className={styles.tunggakanHint}>
                          Memeriksa tunggakan siswa…
                        </div>
                      )}

                      {tunggakan.error && (
                        <div className={styles.tunggakanHint}>
                          {tunggakan.error}
                        </div>
                      )}

                      {!tunggakan.loading && !tunggakan.error && tunggakan.months.length > 1 && (
                        <>
                          <div className={styles.tunggakanAlert} role="alert">
                            <div className={styles.tunggakanAlertIcon}>
                              <MdWarning />
                            </div>
                            <div className={styles.tunggakanAlertBody}>
                              <strong className={styles.tunggakanAlertTitle}>
                                Tunggakan {tunggakan.months.length} Bulan
                              </strong>
                              <span className={styles.tunggakanAlertText}>
                                Siswa ini memiliki tunggakan lebih dari 1 bulan dan
                                harus dibayar terlebih dahulu sebelum transaksi baru.
                              </span>
                            </div>
                          </div>

                          <div className={styles.fieldRow}>
                            <div className={styles.field}>
                              <label className={styles.label} htmlFor="paymentMode">
                                Mode Pembayaran Tunggakan
                              </label>
                              <select
                                id="paymentMode"
                                name="paymentMode"
                                className={styles.input}
                                value={paymentMode}
                                onChange={(e) => setPaymentMode(e.target.value)}
                              >
                                <option value="all">
                                  Bayar semua ({tunggakan.months.length} bulan)
                                </option>
                                <option value="single">
                                  Bayar satu per satu
                                </option>
                              </select>
                            </div>

                            {paymentMode === 'single' && (
                              <div className={styles.field}>
                                <label className={styles.label} htmlFor="selectedPeriod">
                                  Pilih Periode
                                </label>
                                <select
                                  id="selectedPeriod"
                                  name="selectedPeriod"
                                  className={styles.input}
                                  value={
                                    selectedPeriodIdx !== null
                                      ? String(selectedPeriodIdx)
                                      : ''
                                  }
                                  onChange={(e) =>
                                    setSelectedPeriodIdx(
                                      e.target.value === ''
                                        ? null
                                        : parseInt(e.target.value, 10)
                                    )
                                  }
                                >
                                  {tunggakan.months.map((m, idx) => (
                                    <option
                                      key={`${m.year}-${m.monthIdx}`}
                                      value={idx}
                                      disabled={idx > 0}
                                    >
                                      {m.bulan} {idx > 0 ? '(Harus bayar bulan sebelumnya dulu)' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {!tunggakan.loading && !tunggakan.error && tunggakan.months.length > 0 && tunggakan.months.length <= 1 && (
                        <div className={styles.tunggakanHint}>
                          Tunggakan saat ini: {tunggakan.months.length} bulan
                          ({tunggakan.months.map((m) => m.bulan).join(', ')}).
                          Pembayaran tetap dapat dilakukan untuk periode berjalan.
                        </div>
                      )}

                      {!tunggakan.loading && !tunggakan.error && tunggakan.months.length === 0 && (
                        <div className={styles.tunggakanHint}>
                          Tidak ada tunggakan. Siswa sudah membayar semua tagihan SPP
                          (atau tanggal masuk belum diinput).
                        </div>
                      )}
                    </>
                  )}

                  {}
                  {!(form.jenisPembayaran === 'SPP' && tunggakan.months.length > 1) && (
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="jumlahDibayar">
                        Jumlah Uang Dibayar (Rp)
                      </label>
                      <input
                        id="jumlahDibayar"
                        name="jumlahDibayar"
                        type="text"
                        inputMode="numeric"
                        className={styles.input}
                        placeholder="Masukkan jumlah uang…"
                        value={form.jumlahDibayar}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}

                  {}
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="keterangan">
                      Keterangan (opsional)
                    </label>
                    <textarea
                      id="keterangan"
                      name="keterangan"
                      className={styles.textarea}
                      placeholder="cth: Pembayaran SPP bulan Juli, Pembayaran Modul Matematika, dll."
                      value={form.keterangan}
                      onChange={handleInputChange}
                      rows={3}
                      maxLength={500}
                    />
                  </div>

                  {}
                  <div className={styles.actionRow}>
                    <button
                      type="submit"
                      className={styles.btnPrimary}
                      disabled={submitting}
                    >
                      {submitting
                        ? 'Menyimpan…'
                        : form.jenisPembayaran === 'SPP' && tunggakan.months.length > 1
                        ? paymentMode === 'all'
                          ? `Bayar Semua Tunggakan (${tunggakan.months.length})`
                          : 'Bayar Periode Terpilih'
                        : 'Simpan Transaksi'}
                    </button>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={handleReset}
                      disabled={submitting}
                    >
                      <MdRefresh className={styles.btnIcon} />
                      Reset
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {}
            <aside className={styles.summaryColumn}>
              <section className={`${styles.card} ${styles.summaryCard}`}>
                <header className={styles.summaryHeader}>
                  <h3 className={styles.summaryTitle}>RINGKASAN</h3>
                </header>

                <div className={styles.summaryBody}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>No. Kuitansi:</span>
                    <span className={styles.summaryValue}>
                      {submitResult?.kuitansiId || '—'}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Status:</span>
                    <span
                      className={`${styles.summaryValue} ${
                        submitResult ? styles.statusVerified : styles.summaryMuted
                      }`}
                    >
                      {submitResult ? 'Terverifikasi' : 'Belum Disimpan'}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Siswa:</span>
                    <span
                      className={`${styles.summaryValue} ${
                        form.namaLengkap ? '' : styles.summaryMuted
                      }`}
                    >
                      {form.namaLengkap || '-'}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Jenis:</span>
                    <span
                      className={`${styles.summaryValue} ${
                        form.jenisPembayaran ? '' : styles.summaryMuted
                      }`}
                    >
                      {form.jenisPembayaran === 'SPP'
                        ? 'SPP Bulanan'
                        : form.jenisPembayaran === 'Modul'
                        ? 'Modul / Buku'
                        : '-'}
                    </span>
                  </div>

                  {form.jenisPembayaran === 'SPP' && tunggakan.months.length > 1 && (
                    <>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Tunggakan:</span>
                        <span className={`${styles.summaryValue} ${styles.summaryDanger}`}>
                          {tunggakan.months.length} Bulan
                        </span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Mode Bayar:</span>
                        <span className={styles.summaryValue}>
                          {paymentMode === 'all'
                            ? `Bayar Semua (${tunggakan.months.length})`
                            : 'Bayar 1 Periode'}
                        </span>
                      </div>
                      {paymentMode === 'single' && selectedPeriodIdx !== null && tunggakan.months[selectedPeriodIdx] && (
                        <div className={styles.summaryRow}>
                          <span className={styles.summaryLabel}>Periode:</span>
                          <span className={styles.summaryValue}>
                            {tunggakan.months[selectedPeriodIdx].bulan}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {!(form.jenisPembayaran === 'SPP' && tunggakan.months.length > 1) && (
                    <>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Uang Bayar:</span>
                        <span
                          className={`${styles.summaryValue} ${
                            jumlahNumeric > 0 ? '' : styles.summaryMuted
                          }`}
                        >
                          {formatRupiah(jumlahNumeric)}
                        </span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Kembalian:</span>
                        <span
                          className={`${styles.summaryValue} ${
                            kembalian > 0 ? styles.summaryAccent : styles.summaryMuted
                          }`}
                        >
                          {formatRupiah(kembalian)}
                        </span>
                      </div>

                      {kurangBayar > 0 && (
                        <div className={styles.summaryRow}>
                          <span className={styles.summaryLabel}>Kurang:</span>
                          <span className={`${styles.summaryValue} ${styles.summaryDanger}`}>
                            {formatRupiah(kurangBayar)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <div className={styles.summaryTotalWrap}>
                    <p className={styles.summaryTotalLabel}>
                      {form.jenisPembayaran === 'SPP' && tunggakan.months.length > 1
                        ? paymentMode === 'all'
                          ? `Total Tagihan (${tunggakan.months.length} × SPP):`
                          : 'Total Tagihan (1 × SPP):'
                        : 'Total Tagihan:'}
                    </p>
                    <p className={styles.summaryTotalValue}>
                      {formatRupiah(
                        form.jenisPembayaran === 'SPP' && tunggakan.months.length > 1
                          ? (Number(form.selectedSiswa?.spp) || 0) *
                            (paymentMode === 'all' ? tunggakan.months.length : 1)
                          : totalTagihan
                      )}
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </form>
    </AdminLayout>
  );
};

export default PembayaranSiswa;
