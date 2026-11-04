import { Router } from 'express';
import {
  aiDeepAudit,
  aiGenerateSprint,
  aiInterviewQA,
} from '../controllers/aiController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect, requirePermission('tasks.read'));
router.post('/audit', aiDeepAudit);
router.post('/generate-sprint', aiGenerateSprint);
router.post('/interview-qa', aiInterviewQA);

export default router;
