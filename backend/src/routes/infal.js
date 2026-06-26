import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getAllInfal,
  getInfalByTutor,
  getTotalInfalByTutor,
  getAvailableTutors,
  createInfal,
  createOwnerBonus,
  updateInfal,
  deleteInfal,
  getInfalMe,
} from '../controllers/infalController.js';

const router = Router();

router.get('/', authMiddleware, getAllInfal);
router.get('/me', authMiddleware, getInfalMe);
router.get('/tutor/:id_tutor', authMiddleware, getInfalByTutor);
router.get('/total/:id_tutor', authMiddleware, getTotalInfalByTutor);
router.get('/available-tutors', authMiddleware, getAvailableTutors);
router.post('/', authMiddleware, createInfal);
router.post('/owner-bonus', authMiddleware, createOwnerBonus);
router.put('/:id', authMiddleware, updateInfal);
router.delete('/:id', authMiddleware, deleteInfal);

export default router;
