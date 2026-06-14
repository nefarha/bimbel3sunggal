import { Router } from 'express';
import {
  getAllJadwal,
  getJadwalByTutor,
  getJadwalBySiswa,
  getJadwalById,
  createJadwal,
  updateJadwal,
  deleteJadwal,
} from '../controllers/jadwalController.js';

const router = Router();

router.get('/', getAllJadwal);
router.get('/tutor/:id_tutor', getJadwalByTutor);
router.get('/siswa/:id_siswa', getJadwalBySiswa);
router.get('/:id', getJadwalById);
router.post('/', createJadwal);
router.put('/:id', updateJadwal);
router.delete('/:id', deleteJadwal);

export default router;
