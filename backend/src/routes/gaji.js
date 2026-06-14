import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getPerhitunganGaji,
  getPerhitunganGajiByIdTutor,
  getAllGaji,
  sendGaji,
} from '../controllers/gajiController.js';

const router = Router();

router.get('/perhitungan', authMiddleware, getPerhitunganGaji);

router.get('/perhitungan/:id_tutor', authMiddleware, getPerhitunganGajiByIdTutor);

router.get('/all', authMiddleware, getAllGaji);

router.post('/send', authMiddleware, sendGaji);

export default router;
