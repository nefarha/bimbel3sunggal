import React, { useEffect, useState, useCallback } from 'react';
import { MdClose, MdCheckCircle } from 'react-icons/md';
import api from '../../../services/api';
import styles from './kelola_gaji.module.css';

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
  if (nominal === null || nominal === undefined) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nominal);
};

const KelolaGaji = () => {
  const today = new Date();
  const [bulan, setBulan] = useState(today.getMonth() + 1);
  const [tahun, setTahun] = useState(today.getFullYear());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [editState, setEditState] = useState({});

  const [modal, setModal] = useState({ open: false, mode: 'preview' });
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editBonus, setEditBonus] = useState(0);
  const [editPotongan, setEditPotongan] = useState(0);

  // Bonus toggle state
  const [bonusToggle, setBonusToggle] = useState({});
  const [bonusNominalSetting, setBonusNominalSetting] = useState(65000);
  const [sendingAll, setSendingAll] = useState(false);
  const [confirmKirimSemua, setConfirmKirimSemua] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [gajiRes, bonusRes, settingRes] = await Promise.all([
        api.get(`/gaji/all?bulan=${bulan}&tahun=${tahun}`),
        api.get(`/gaji/bonus?bulan=${bulan}&tahun=${tahun}`).catch(() => ({ data: { data: [] } })),
        api.get('/settings').catch(() => ({ data: { data: {} } })),
      ]);

      if (gajiRes.data?.success) {
        setData(gajiRes.data.data);
      } else {
        setError('Gagal memuat data gaji');
      }

      // Load existing bonus assignments
      const existingBonus = bonusRes.data?.data || [];
      const toggleMap = {};
      existingBonus.forEach((b) => {
        toggleMap[b.id_tutor] = true;
      });
      setBonusToggle(toggleMap);

      // Load bonus nominal from settings
      const settings = settingRes.data?.data || {};
      if (settings.bonus_kehadiran_nominal?.value) {
        setBonusNominalSetting(Number(settings.bonus_kehadiran_nominal.value));
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

  const handlePreview = async (idTutor) => {
    try {
      setPreviewLoading(true);
      setModal({ open: true, mode: 'preview' });
      const res = await api.get(`/gaji/perhitungan/${idTutor}?bulan=${bulan}&tahun=${tahun}`);
      if (res.data?.success) {
        setPreviewData(res.data.data);
      }
    } catch (err) {
      console.error('Gagal memuat preview:', err);
      setError(err.response?.data?.message || 'Gagal memuat preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleEdit = async (idTutor) => {
    try {
      setPreviewLoading(true);
      const res = await api.get(`/gaji/perhitungan/${idTutor}?bulan=${bulan}&tahun=${tahun}`);
      if (res.data?.success) {
        const d = res.data.data;
        setPreviewData(d);
        setEditBonus(d.bonus);
        setEditPotongan(d.potongan);
        setModal({ open: true, mode: 'edit' });
      }
    } catch (err) {
      console.error('Gagal memuat data edit:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleKirim = async (idTutor, bonus, potongan, totalInfal, totalSpp, honor, totalNeto) => {
    try {
      setError(null);
      const totalGaji = totalNeto || (honor + (bonus || 0) - (potongan || 0) + (totalInfal || 0));

      // Simpan bonus assignment dulu (kirim 0 jika toggle off untuk hapus)
      const isBonusActive = bonusToggle[idTutor] === true;
      await api.post('/gaji/bonus', {
        assignments: [{ id_tutor: idTutor, nominal: isBonusActive ? bonusNominalSetting : 0 }],
        bulan,
        tahun,
      });

      // Kirim gaji
      const body = {
        id_tutor: idTutor,
        bulan,
        tahun,
        bonus: isBonusActive ? bonusNominalSetting : 0,
        potongan: potongan || 0,
        total_infal: totalInfal || 0,
        total_pemasukan: totalSpp,
        total_gaji: totalGaji,
      };
      const res = await api.post('/gaji/send', body);
      if (res.data?.success) {
        setToast({
          title: 'Berhasil',
          message: `Data gaji tutor berhasil dikirim`,
        });
        setEditState((prev) => ({ ...prev, [idTutor]: undefined }));
        fetchData();
      }
    } catch (err) {
      console.error('Gagal mengirim data gaji:', err);
      setError(err.response?.data?.message || 'Gagal mengirim data gaji');
    }
  };

  const handleKirimSemua = () => {
    setConfirmKirimSemua(true);
  };

  const execKirimSemua = async () => {
    setConfirmKirimSemua(false);
    try {
      setSendingAll(true);
      setError(null);

      for (const row of data) {
        const isBonusActive = bonusToggle[row.id_tutor] === true;
        const derivedBonus = isBonusActive ? bonusNominalSetting : 0;
        const totalNeto = row.honor + derivedBonus - (row.potongan || 0) + (row.total_infal || 0);

        await api.post('/gaji/bonus', {
          assignments: [{ id_tutor: row.id_tutor, nominal: isBonusActive ? bonusNominalSetting : 0 }],
          bulan,
          tahun,
        });

        await api.post('/gaji/send', {
          id_tutor: row.id_tutor,
          bulan,
          tahun,
          bonus: derivedBonus,
          potongan: row.potongan || 0,
          total_infal: row.total_infal || 0,
          total_pemasukan: row.total_spp,
          total_gaji: totalNeto,
        });
      }

      setToast({
        title: 'Berhasil',
        message: `Gaji semua tutor untuk ${MONTHS.find(m => m.value === bulan)?.label} ${tahun} berhasil dikirim.`,
      });
      fetchData();
    } catch (err) {
      console.error('Gagal mengirim gaji semua:', err);
      setError(err.response?.data?.message || 'Gagal mengirim gaji semua tutor');
    } finally {
      setSendingAll(false);
    }
  };

  const handleBonusToggle = (idTutor) => {
    setBonusToggle((prev) => ({
      ...prev,
      [idTutor]: !prev[idTutor],
    }));
  };

  const handleSaveEdit = () => {
    if (!previewData) return;
    const idTutor = previewData.tutor.id_tutor;
    const totalInfalVal = previewData.infal?.total || 0;
    const totalGaji = previewData.komisi_dasar + editBonus - editPotongan + totalInfalVal;
    handleKirim(idTutor, editBonus, editPotongan, totalInfalVal, previewData.total_spp, previewData.komisi_dasar, totalGaji);
    setModal({ open: false, mode: 'preview' });
    setPreviewData(null);
  };

  const closeModal = () => {
    setModal({ open: false, mode: 'preview' });
    setPreviewData(null);
  };

  const toggleInlineEdit = (idTutor, currentBonus, currentPotongan) => {
    if (editState[idTutor]) {
      setEditState((prev) => ({ ...prev, [idTutor]: undefined }));
    } else {
      setEditState((prev) => ({
        ...prev,
        [idTutor]: { bonus: currentBonus || 0, potongan: currentPotongan || 0 },
      }));
    }
  };

  const updateInlineEdit = (idTutor, field, value) => {
    setEditState((prev) => ({
      ...prev,
      [idTutor]: { ...prev[idTutor], [field]: Number(value) || 0 },
    }));
  };

  return (
    <div className={styles.container}>
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

      {}
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
        <button
          className={styles.sendAllBtn}
          onClick={handleKirimSemua}
          disabled={sendingAll || data.length === 0}
          style={{ marginLeft: 'auto' }}
        >
          {sendingAll ? 'Mengirim...' : `Kirim Semua (${data.length})`}
        </button>
      </div>

      {}
      {loading && <div className={styles.loadingState}>Memuat data gaji...</div>}

      {}
      {error && !loading && (
        <div className={styles.errorAlert}>{error}</div>
      )}

      {}
      {!loading && !error && (
        <div className={styles.tableSection}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama Tutor</th>
                  <th className={styles.colCenter}>Hadir</th>
                  <th className={styles.colCenter}>Tdk Masuk</th>
                  <th className={styles.colNominal}>Honor (40%)</th>
                  <th className={styles.colCenter}>Bonus</th>
                  <th className={styles.colNominal}>Potongan</th>
                  <th className={styles.colNominal}>Infal</th>
                  <th className={styles.colNominal}>Total Neto</th>
                  <th className={styles.colCenter}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={styles.emptyCell}>
                      Tidak ada data tutor
                    </td>
                  </tr>
                ) : (
                  data.map((row) => {
                    const isEditing = !!editState[row.id_tutor];
                    const editVals = editState[row.id_tutor];
                    const isBonusActive = bonusToggle[row.id_tutor] === true;
                    const derivedBonus = isBonusActive ? bonusNominalSetting : 0;
                    const bonusVal = isEditing ? editVals.bonus : derivedBonus;
                    const potonganVal = isEditing ? editVals.potongan : row.potongan;
                    const totalNeto = row.honor + (bonusVal || 0) - (potonganVal || 0) + (row.total_infal || 0);

                    return (
                      <tr key={row.id_tutor}>
                        <td>
                          <strong>{row.nama_tutor}</strong>
                        </td>
                        <td className={styles.colCenter}>{row.hadir}</td>
                        <td className={styles.colCenter}>
                          {row.tidak_masuk > 0 ? (
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>{row.tidak_masuk}</span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>0</span>
                          )}
                        </td>
                        <td className={styles.colNominal}>
                          {formatRupiah(row.honor)}
                        </td>
                        <td className={styles.colCenter}>
                          <input
                            type="checkbox"
                            className={styles.bonusCheckbox}
                            checked={!!bonusToggle[row.id_tutor]}
                            onChange={() => handleBonusToggle(row.id_tutor)}
                          />
                        </td>
                        <td className={styles.colNominal}>
                          {isEditing ? (
                            <input
                              className={styles.editInput}
                              type="number"
                              value={editVals.potongan}
                              onChange={(e) =>
                                updateInlineEdit(row.id_tutor, 'potongan', e.target.value)
                              }
                            />
                          ) : row.potongan !== null ? (
                            formatRupiah(row.potongan)
                          ) : (
                            <span className={styles.dashText}>-</span>
                          )}
                        </td>
                        <td className={styles.colNominal} style={{ color: '#7c3aed' }}>
                          {row.total_infal > 0 ? (
                            <>
                              {formatRupiah(row.total_infal)}
                              <span style={{ display: 'block', fontSize: '0.688rem', color: '#a78bfa' }}>
                                (termasuk infal)
                              </span>
                            </>
                          ) : (
                            <span className={styles.dashText}>-</span>
                          )}
                        </td>
                        <td className={styles.colNominal}>
                          <strong>{formatRupiah(totalNeto)}</strong>
                        </td>
                        <td className={styles.colCenter}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button
                              className={`${styles.actionBtn} ${styles.previewBtn}`}
                              onClick={() => handlePreview(row.id_tutor)}
                            >
                              Preview
                            </button>
                            {isEditing ? (
                              <button
                                className={`${styles.actionBtn} ${styles.sendBtn}`}
                                onClick={() => {
                                  const neto = row.honor + editVals.bonus - editVals.potongan + (row.total_infal || 0);
                                  handleKirim(
                                    row.id_tutor,
                                    editVals.bonus,
                                    editVals.potongan,
                                    row.total_infal || 0,
                                    row.total_spp,
                                    row.honor,
                                    neto
                                  );
                                  toggleInlineEdit(row.id_tutor);
                                }}
                              >
                                Simpan
                              </button>
                            ) : (
                              <button
                                className={`${styles.actionBtn} ${styles.editBtn}`}
                                onClick={() =>
                                  toggleInlineEdit(row.id_tutor, bonusVal, row.potongan)
                                }
                              >
                                Edit
                              </button>
                            )}
                            {!isEditing && (
                              <button
                                className={`${styles.actionBtn} ${styles.sendBtn}`}
                                onClick={() =>
                                  handleKirim(
                                    row.id_tutor,
                                    bonusVal,
                                    row.potongan || 0,
                                    row.total_infal || 0,
                                    row.total_spp,
                                    row.honor,
                                    row.total_gaji || (row.honor + bonusVal - (row.potongan || 0) + (row.total_infal || 0))
                                  )
                                }
                              >
                                Kirim
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {}
      {modal.open && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modal.mode === 'edit' ? 'Edit Bonus & Potongan' : 'Preview Perhitungan Gaji'}
              </h3>
              <button className={styles.modalClose} onClick={closeModal}>
                <MdClose />
              </button>
            </div>

            <div className={styles.modalBody}>
              {previewLoading ? (
                <div className={styles.loadingState}>Memuat data...</div>
              ) : previewData ? (
                <>
                  <div className={styles.previewTitleSection}>
                    <div>
                      <h4 className={styles.previewTutorName}>
                        {previewData.tutor.nama_tutor}
                      </h4>
                    </div>
                    <span className={styles.previewPeriode}>
                      {MONTHS.find((m) => m.value === previewData.periode.bulan)?.label}{' '}
                      {previewData.periode.tahun}
                    </span>
                  </div>

                  <div>
                    <table className={styles.previewMiniTable}>
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Nama Siswa</th>
                          <th>Tanggal Masuk</th>
                          <th style={{ textAlign: 'right' }}>SPP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.siswa.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>
                              Tidak ada siswa
                            </td>
                          </tr>
                        ) : (
                          previewData.siswa.map((s, i) => (
                            <tr key={s.id_siswa}>
                              <td>{i + 1}</td>
                              <td>{s.nama}</td>
                              <td>
                                {s.tanggal_masuk
                                  ? new Date(s.tanggal_masuk).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                    })
                                  : '-'}
                              </td>
                              <td style={{ textAlign: 'right' }}>{formatRupiah(s.spp)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'right' }}>
                            Total SPP (A)
                          </td>
                          <td style={{ textAlign: 'right' }}>{formatRupiah(previewData.total_spp)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className={styles.previewCards}>
                    <div className={styles.previewCard}>
                      <h5 className={styles.previewCardTitle}>Komisi Dasar (B)</h5>
                      <span className={styles.previewCardSubtext} style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        40% dari Total SPP
                      </span>
                      <span className={styles.previewCardNominal}>
                        {formatRupiah(previewData.komisi_dasar)}
                      </span>
                    </div>
                    <div className={styles.previewCard}>
                      <h5 className={styles.previewCardTitle}>Penyesuaian (C)</h5>
                      <div style={{ fontSize: '0.813rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ color: '#16a34a' }}>
                          +{formatRupiah(previewData.bonus)}
                        </span>
                        <span style={{ color: '#dc2626' }}>
                          -{formatRupiah(previewData.potongan)}
                        </span>
                        <span style={{ color: '#8b5cf6' }}>
                          +{formatRupiah(previewData.infal?.total || 0)} ({previewData.infal?.jumlah || 0}x Infal)
                        </span>
                      </div>
                      <span
                        className={styles.previewCardNominal}
                        style={{
                          color:
                            previewData.penyesuaian >= 0 ? '#16a34a' : '#dc2626',
                          fontSize: '1rem',
                        }}
                      >
                        {previewData.penyesuaian >= 0 ? '+' : '-'}
                        {formatRupiah(Math.abs(previewData.penyesuaian))}
                      </span>
                    </div>
                  </div>

                  <div className={styles.previewGrandTotal}>
                    <span className={styles.previewGrandLabel}>
                      GRAND TOTAL (B + C)
                    </span>
                    <span className={styles.previewGrandNominal}>
                      {formatRupiah(previewData.grand_total)}
                    </span>
                  </div>

                  {modal.mode === 'edit' && (
                    <>
                      <div className={styles.previewEditRow}>
                        <div className={styles.previewEditField}>
                          <label>Bonus</label>
                          <input
                            type="number"
                            value={editBonus}
                            onChange={(e) => setEditBonus(Number(e.target.value) || 0)}
                          />
                        </div>
                        <div className={styles.previewEditField}>
                          <label>Potongan</label>
                          <input
                            type="number"
                            value={editPotongan}
                            onChange={(e) => setEditPotongan(Number(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <div className={styles.previewActions}>
                        <button className={styles.btnSecondary} onClick={closeModal}>
                          Batal
                        </button>
                        <button className={styles.btnPrimary} onClick={handleSaveEdit}>
                          Simpan & Kirim
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {}
      {confirmKirimSemua && (
        <div
          className={styles.modalOverlay}
          onClick={() => setConfirmKirimSemua(false)}
        >
          <div
            className={styles.confirmDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.confirmIcon}>
              <MdCheckCircle />
            </div>
            <h3 className={styles.confirmTitle}>Kirim Gaji Semua Tutor</h3>
            <p className={styles.confirmMessage}>
              Apakah Anda yakin ingin mengirim gaji semua tutor untuk{' '}
              <strong>{MONTHS.find(m => m.value === bulan)?.label} {tahun}</strong>?
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setConfirmKirimSemua(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={execKirimSemua}
              >
                Ya, Kirim Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaGaji;