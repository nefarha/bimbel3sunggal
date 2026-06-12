import { Router } from 'express';
import {
  getAllAbsensiSiswa,
  getAbsensiSiswaById,
  createAbsensiSiswa,
  updateAbsensiSiswa,
  confirmAbsensiSiswa,
  confirmByKelas,
  confirmAllToday,
  deleteAbsensiSiswa,
} from '../controllers/absensiSiswaController.js';

const router = Router();

// ─── Static routes (lebih spesifik) HARUS didaftarkan sebelum dynamic ───
router.patch('/confirm-all-today', confirmAllToday);
router.patch('/confirm-class/:id_kelas', confirmByKelas);

// ─── Resource routes ──────────────────────────────────────────
router.get('/', getAllAbsensiSiswa);
router.get('/:id', getAbsensiSiswaById);
router.post('/', createAbsensiSiswa);
router.put('/:id', updateAbsensiSiswa);
router.patch('/:id/confirm', confirmAbsensiSiswa);
router.delete('/:id', deleteAbsensiSiswa);

export default router;
