import { Router } from 'express';
import {
  getAllKelas,
  getKelasById,
  createKelas,
  updateKelas,
  deleteKelas,
} from '../controllers/kelasController.js';

const router = Router();

router.get('/', getAllKelas);
router.get('/:id', getKelasById);
router.post('/', createKelas);
router.put('/:id', updateKelas);
router.delete('/:id', deleteKelas);

export default router;
