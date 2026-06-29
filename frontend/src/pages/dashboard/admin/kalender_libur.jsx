import React, { useState, useEffect, useCallback } from 'react';
import {
  MdChevronLeft,
  MdChevronRight,
  MdAdd,
  MdClose,
  MdDelete,
  MdEdit,
  MdEventBusy,
} from 'react-icons/md';
import api from '../../../services/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './kalender_libur.module.css';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const KalenderLibur = () => {
  const today = new Date();
  const [tahun, setTahun] = useState(today.getFullYear());
  const [bulan, setBulan] = useState(today.getMonth() + 1);
  const [liburMap, setLiburMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [liburList, setLiburList] = useState([]);
  const [editingLibur, setEditingLibur] = useState(null);
  const [inputKeterangan, setInputKeterangan] = useState('');

  const fetchLibur = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/libur/month', { params: { tahun, bulan } });
      const list = res.data?.data || [];
      // Group by tanggal
      const map = {};
      list.forEach((item) => {
        const tgl = item.tanggal.split('T')[0];
        if (!map[tgl]) map[tgl] = [];
        map[tgl].push(item);
      });
      setLiburMap(map);
    } catch (err) {
      console.error('Fetch libur error:', err);
    } finally {
      setLoading(false);
    }
  }, [tahun, bulan]);

  useEffect(() => {
    fetchLibur();
  }, [fetchLibur]);

  const prevMonth = () => {
    if (bulan === 1) { setBulan(12); setTahun((y) => y - 1); }
    else setBulan((b) => b - 1);
  };

  const nextMonth = () => {
    if (bulan === 12) { setBulan(1); setTahun((y) => y + 1); }
    else setBulan((b) => b + 1);
  };

  const numDays = new Date(tahun, bulan, 0).getDate();
  const firstDay = new Date(tahun, bulan - 1, 1).getDay();

  const weeks = [];
  let week = [];
  for (let i = 0; i < firstDay; i++) week.push(null);
  for (let d = 1; d <= numDays; d++) {
    const dow = new Date(tahun, bulan - 1, d).getDay();
    week.push(d);
    if (dow === 6 || d === numDays) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
      week = [];
    }
  }

  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (d) => `${tahun}-${pad(bulan)}-${pad(d)}`;

  const openAddModal = (day) => {
    setSelectedDate(dateKey(day));
    setLiburList(liburMap[dateKey(day)] || []);
    setEditingLibur(null);
    setInputKeterangan('');
    setModalOpen(true);
  };

  const handleAddLibur = async () => {
    if (!inputKeterangan.trim()) return;
    try {
      await api.post('/libur', { tanggal: selectedDate, keterangan: inputKeterangan.trim() });
      setInputKeterangan('');
      await fetchLibur();
      setLiburList(liburMap[selectedDate] || []);
      // Refresh liburList locally
      const res = await api.get('/libur/month', { params: { tahun, bulan } });
      const list = res.data?.data || [];
      const newMap = {};
      list.forEach((item) => {
        const tgl = item.tanggal.split('T')[0];
        if (!newMap[tgl]) newMap[tgl] = [];
        newMap[tgl].push(item);
      });
      setLiburMap(newMap);
      setLiburList(newMap[selectedDate] || []);
    } catch (err) {
      console.error('Add libur error:', err);
    }
  };

  const handleDeleteLibur = async (id) => {
    if (!window.confirm('Hapus data libur ini?')) return;
    try {
      await api.delete(`/libur/${id}`);
      await fetchLibur();
      setLiburList(liburList.filter((l) => l.id_libur !== id));
    } catch (err) {
      console.error('Delete libur error:', err);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedDate(null);
    setLiburList([]);
    setEditingLibur(null);
    setInputKeterangan('');
  };

  const formatDate = (tgl) => {
    const d = new Date(tgl + 'T00:00:00');
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Kalender Libur</h1>
            <p className={styles.pageSubtitle}>Atur hari libur dan tanggal merah</p>
          </div>
        </div>

        {/* Calendar Nav */}
        <div className={styles.calNav}>
          <button className={styles.navBtn} onClick={prevMonth}>
            <MdChevronLeft />
          </button>
          <span className={styles.navTitle}>{MONTHS[bulan - 1]} {tahun}</span>
          <button className={styles.navBtn} onClick={nextMonth}>
            <MdChevronRight />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className={styles.calendarCard}>
          <div className={styles.calendarGrid}>
            <div className={styles.calRow}>
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                <div key={d} className={styles.calDayHeader}>{d}</div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className={styles.calRow}>
                {week.map((day, ci) => {
                  if (day === null) return <div key={ci} className={styles.calDayEmpty} />;
                  const key = dateKey(day);
                  const liburs = liburMap[key] || [];
                  const isWeekend = ci === 0 || ci === 6;
                  return (
                    <div
                      key={ci}
                      className={`${styles.calDay} ${isWeekend ? styles.calDayWeekend : ''} ${liburs.length > 0 ? styles.calDayLibur : ''}`}
                    >
                      <div className={styles.calDayTop}>
                        <span className={styles.calDayNum}>{day}</span>
                        <button
                          className={styles.calDayAddBtn}
                          onClick={() => openAddModal(day)}
                          title="Tambah libur"
                        >
                          <MdAdd />
                        </button>
                      </div>
                      <div className={styles.calDayLiburs}>
                        {liburs.slice(0, 2).map((l) => (
                          <div key={l.id_libur} className={styles.liburItem}>
                            <MdEventBusy className={styles.liburIcon} />
                            <span className={styles.liburText}>{l.keterangan || 'Libur'}</span>
                          </div>
                        ))}
                        {liburs.length > 2 && (
                          <div className={styles.liburMore}>+{liburs.length - 2} lainnya</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className={styles.overlay} onClick={closeModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={closeModal}><MdClose /></button>
              <h2 className={styles.modalTitle}>
                <MdEventBusy className={styles.modalTitleIcon} />
                Libur — {selectedDate ? formatDate(selectedDate) : ''}
              </h2>

              {/* Existing liburs */}
              <div className={styles.liburListSection}>
                {liburList.length === 0 ? (
                  <p className={styles.emptyText}>Belum ada catatan libur untuk tanggal ini</p>
                ) : (
                  <div className={styles.liburList}>
                    {liburList.map((l) => (
                      <div key={l.id_libur} className={styles.liburRow}>
                        <MdEventBusy className={styles.liburRowIcon} />
                        <span className={styles.liburRowText}>{l.keterangan || 'Libur'}</span>
                        <button
                          className={styles.liburRowDel}
                          onClick={() => handleDeleteLibur(l.id_libur)}
                          title="Hapus"
                        >
                          <MdDelete />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add new */}
              <div className={styles.addSection}>
                <label className={styles.addLabel}>Tambah Catatan Libur</label>
                <div className={styles.addRow}>
                  <input
                    type="text"
                    className={styles.addInput}
                    placeholder="cth: Libur Nasional / Cuti Bersama"
                    value={inputKeterangan}
                    onChange={(e) => setInputKeterangan(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddLibur(); }}
                  />
                  <button className={styles.addBtn} onClick={handleAddLibur} disabled={!inputKeterangan.trim()}>
                    <MdAdd /> Tambah
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default KalenderLibur;
