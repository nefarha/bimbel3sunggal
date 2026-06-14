import { Router } from 'express';
import {
  getAllKelas,
  getKelasById,
  createKelas,
  updateKelas,
  deleteKelas,
  getJenjangOptions,
} from '../controllers/kelasController.js';

const router = Router();

router.get('/', getAllKelas);
router.get('/jenjang', getJenjangOptions);
router.get('/:id', getKelasById);
router.post('/', createKelas);
router.put('/:id', updateKelas);
router.delete('/:id', deleteKelas);

export default router;
