import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getRekapKeuangan,
  getTahunanKeuangan,
} from '../controllers/keuanganController.js';

const router = Router();

router.get('/rekap', authMiddleware, getRekapKeuangan);

router.get('/tahunan', authMiddleware, getTahunanKeuangan);

export default router;
