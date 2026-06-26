import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getAllAbsensiSiswa,
  getAbsensiSiswaById,
  createAbsensiSiswa,
  updateAbsensiSiswa,
  bulkUpsertAbsensiSiswa,
  confirmAbsensiSiswa,
  confirmByKelas,
  confirmAllToday,
  deleteAbsensiSiswa,
  getMyAbsensiRecap,
  getSiswaRecap,
} from '../controllers/absensiSiswaController.js';

const router = Router();

router.post('/bulk', bulkUpsertAbsensiSiswa);
router.patch('/confirm-all-today', confirmAllToday);
router.patch('/confirm-class/:id_kelas', confirmByKelas);
router.get('/recap/me', authMiddleware, getMyAbsensiRecap);
router.get('/recap', getSiswaRecap);

router.get('/', getAllAbsensiSiswa);
router.get('/:id', getAbsensiSiswaById);
router.post('/', createAbsensiSiswa);
router.put('/:id', updateAbsensiSiswa);
router.patch('/:id/confirm', confirmAbsensiSiswa);
router.delete('/:id', deleteAbsensiSiswa);

export default router;
