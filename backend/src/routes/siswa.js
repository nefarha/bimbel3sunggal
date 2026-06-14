import { Router } from 'express';
import {
  getAllSiswa,
  getSiswaByKelas,
  getSiswaById,
  getSiswaByUserId,
  getSiswaKelas,
  createSiswa,
  updateSiswa,
  deleteSiswa,
} from '../controllers/siswaController.js';

const router = Router();

router.get('/', getAllSiswa);
router.get('/kelas/:id_kelas', getSiswaByKelas);
router.get('/by-user/:id_user', getSiswaByUserId);
router.get('/:id/kelas', getSiswaKelas);
router.get('/:id', getSiswaById);
router.post('/', createSiswa);
router.put('/:id', updateSiswa);
router.delete('/:id', deleteSiswa);

export default router;
