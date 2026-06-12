import { Router } from 'express';
import {
  getDashboardStats,
  getAbsensiHariIni,
  getTransaksiPending,
  getPiutangSiswa,
} from '../controllers/dashboardController.js';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/absensi-hari-ini', getAbsensiHariIni);
router.get('/transaksi-pending', getTransaksiPending);
router.get('/piutang', getPiutangSiswa);

export default router;
