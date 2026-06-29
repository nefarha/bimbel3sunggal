import { Router } from 'express';
import {
  getAllLibur,
  getLiburByMonth,
  createLibur,
  updateLibur,
  deleteLibur,
} from '../controllers/liburController.js';

const router = Router();

router.get('/', getAllLibur);
router.get('/month', getLiburByMonth);
router.post('/', createLibur);
router.put('/:id', updateLibur);
router.delete('/:id', deleteLibur);

export default router;
