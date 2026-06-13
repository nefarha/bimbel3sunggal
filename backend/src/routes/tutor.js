import { Router } from 'express';
import {
  getAllTutor,
  getTutorById,
  createTutor,
  updateTutor,
  deleteTutor,
} from '../controllers/tutorController.js';

const router = Router();

router.get('/', getAllTutor);
router.get('/:id', getTutorById);
router.post('/', createTutor);
router.put('/:id', updateTutor);
router.delete('/:id', deleteTutor);

export default router;
