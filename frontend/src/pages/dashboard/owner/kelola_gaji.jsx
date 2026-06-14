import React, { useEffect, useState, useCallback } from 'react';
import { MdCheckCircle, MdClose } from 'react-icons/md';
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
  const [successMsg, setSuccessMsg] = useState('');

  const [editState, setEditState] = useState({});

  const [modal, setModal] = useState({ open: false, mode: 'preview' }); // 'preview' | 'edit'
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editBonus, setEditBonus] = useState(0);
  const [editPotongan, setEditPotongan] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/gaji/all?bulan=${bulan}&tahun=${tahun}`);
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        setError('Gagal memuat data gaji');
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

  const handleKirim = async (idTutor, bonus, potongan, totalSpp, honor, totalNeto) => {
    try {
      setError(null);
      const totalGaji = totalNeto || (honor + (bonus || 0) - (potongan || 0));
      const body = {
        id_tutor: idTutor,
        bulan,
        tahun,
        bonus: bonus || 0,
        potongan: potongan || 0,
        total_pemasukan: totalSpp,
        total_gaji: totalGaji,
      };
      const res = await api.post('/gaji/send', body);
      if (res.data?.success) {
        setSuccessMsg(`Data gaji tutor berhasil dikirim`);
        setEditState((prev) => ({ ...prev, [idTutor]: undefined }));
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Gagal mengirim data gaji:', err);
      setError(err.response?.data?.message || 'Gagal mengirim data gaji');
    }
  };

  const handleSaveEdit = () => {
    if (!previewData) return;
    const idTutor = previewData.tutor.id_tutor;
    const totalGaji = previewData.komisi_dasar + editBonus - editPotongan;
    handleKirim(idTutor, editBonus, editPotongan, previewData.total_spp, previewData.komisi_dasar, totalGaji);
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
      {successMsg && <div className={styles.successAlert}>{successMsg}</div>}

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
                  <th className={styles.colCenter}>Kehadiran</th>
                  <th className={styles.colNominal}>Honor (40%)</th>
                  <th className={styles.colNominal}>Bonus</th>
                  <th className={styles.colNominal}>Potongan</th>
                  <th className={styles.colNominal}>Total Neto</th>
                  <th className={styles.colCenter}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      Tidak ada data tutor
                    </td>
                  </tr>
                ) : (
                  data.map((row) => {
                    const isEditing = !!editState[row.id_tutor];
                    const editVals = editState[row.id_tutor];
                    const bonusVal = isEditing ? editVals.bonus : row.bonus;
                    const potonganVal = isEditing ? editVals.potongan : row.potongan;
                    const totalNeto = row.honor + (bonusVal || 0) - (potonganVal || 0);

                    return (
                      <tr key={row.id_tutor}>
                        <td>
                          <strong>{row.nama_tutor}</strong>
                        </td>
                        <td className={styles.colCenter}>{row.hadir} Hari</td>
                        <td className={styles.colNominal}>
                          {formatRupiah(row.honor)}
                        </td>
                        <td className={styles.colNominal}>
                          {isEditing ? (
                            <input
                              className={styles.editInput}
                              type="number"
                              value={editVals.bonus}
                              onChange={(e) =>
                                updateInlineEdit(row.id_tutor, 'bonus', e.target.value)
                              }
                            />
                          ) : row.bonus !== null ? (
                            formatRupiah(row.bonus)
                          ) : (
                            <span className={styles.dashText}>-</span>
                          )}
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
                        <td className={styles.colNominal}>
                          <strong>
                            {row.is_confirmed
                              ? formatRupiah(row.total_gaji)
                              : formatRupiah(totalNeto)}
                          </strong>
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
                                  const neto = row.honor + editVals.bonus - editVals.potongan;
                                  handleKirim(
                                    row.id_tutor,
                                    editVals.bonus,
                                    editVals.potongan,
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
                                  toggleInlineEdit(row.id_tutor, row.bonus, row.potongan)
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
                                    row.bonus || 0,
                                    row.potongan || 0,
                                    row.total_spp,
                                    row.honor,
                                    row.total_gaji || (row.honor + (row.bonus || 0) - (row.potongan || 0))
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
                  {}
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

                  {}
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

                  {}
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

                  {}
                  <div className={styles.previewGrandTotal}>
                    <span className={styles.previewGrandLabel}>
                      GRAND TOTAL (B + C)
                    </span>
                    <span className={styles.previewGrandNominal}>
                      {formatRupiah(previewData.grand_total)}
                    </span>
                  </div>

                  {}
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
    </div>
  );
};

export default KelolaGaji;
