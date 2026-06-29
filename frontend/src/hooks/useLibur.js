import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Custom hook to fetch libur (holiday) data for a given month/year.
 * Returns an object where key = day number (int), value = keterangan (string).
 */
export const useLibur = (tahun, bulan) => {
  const [liburMap, setLiburMap] = useState({});

  useEffect(() => {
    if (!tahun || !bulan) {
      setLiburMap({});
      return;
    }
    let cancelled = false;
    api
      .get('/libur/month', { params: { tahun, bulan } })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data || [];
        const map = {};
        data.forEach((item) => {
          const day = parseInt(item.tanggal.split('-')[2], 10);
          if (!map[day]) map[day] = [];
          map[day].push(item.keterangan || 'Libur');
        });
        setLiburMap(map);
      })
      .catch(() => {
        if (!cancelled) setLiburMap({});
      });
    return () => {
      cancelled = true;
    };
  }, [tahun, bulan]);

  return liburMap;
};

/**
 * Check if a specific date (YYYY-MM-DD) is a libur day by fetching all libur for that month.
 * Returns the libur entries or empty array.
 */
export const useLiburDate = (dateStr) => {
  const [liburList, setLiburList] = useState([]);

  useEffect(() => {
    if (!dateStr) {
      setLiburList([]);
      return;
    }
    const d = dateStr.split('-');
    const tahun = parseInt(d[0], 10);
    const bulan = parseInt(d[1], 10);
    let cancelled = false;
    api
      .get('/libur/month', { params: { tahun, bulan } })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data || [];
        const matched = data.filter((item) => {
          const itemDate = item.tanggal.split('T')[0];
          return itemDate === dateStr;
        });
        setLiburList(matched);
      })
      .catch(() => {
        if (!cancelled) setLiburList([]);
      });
    return () => {
      cancelled = true;
    };
  }, [dateStr]);

  return liburList;
};
