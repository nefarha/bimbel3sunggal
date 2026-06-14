import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getPerhitunganGaji } from '../controllers/gajiController.js';

const router = Router();

// GET /api/gaji/perhitungan?bulan=1&tahun=2026
router.get('/perhitungan', authMiddleware, getPerhitunganGaji);

export default router;
