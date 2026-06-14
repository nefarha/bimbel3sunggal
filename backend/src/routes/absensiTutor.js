import { Router } from 'express';
import {
  getTutorAttendanceToday,
  saveTutorAttendanceBulk,
  getTutorAttendanceRecap,
  getMyAttendanceRecap,
} from '../controllers/absensiTutorController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/today', getTutorAttendanceToday);
router.get('/recap/me', authMiddleware, getMyAttendanceRecap);
router.get('/recap', getTutorAttendanceRecap);
router.post('/bulk', saveTutorAttendanceBulk);

export default router;
