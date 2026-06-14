import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getPerhitunganGaji,
  getPerhitunganGajiByIdTutor,
  getAllGaji,
  sendGaji,
} from '../controllers/gajiController.js';

const router = Router();

// GET /api/gaji/perhitungan?bulan=1&tahun=2026
router.get('/perhitungan', authMiddleware, getPerhitunganGaji);

// GET /api/gaji/perhitungan/:id_tutor?bulan=1&tahun=2026 — owner: preview specific tutor
router.get('/perhitungan/:id_tutor', authMiddleware, getPerhitunganGajiByIdTutor);

// GET /api/gaji/all?bulan=1&tahun=2026 — owner: all tutors salary
router.get('/all', authMiddleware, getAllGaji);

// POST /api/gaji/send — owner: insert/update gaji_tutor
router.post('/send', authMiddleware, sendGaji);

export default router;
