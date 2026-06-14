import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getRekapKeuangan,
  getTahunanKeuangan,
} from '../controllers/keuanganController.js';

const router = Router();

// GET /api/keuangan/rekap?bulan=1&tahun=2026
router.get('/rekap', authMiddleware, getRekapKeuangan);

// GET /api/keuangan/tahunan?tahun=2026
router.get('/tahunan', authMiddleware, getTahunanKeuangan);

export default router;
