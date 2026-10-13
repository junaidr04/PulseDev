import { Router } from 'express';
import {
  aiDeepAudit,
  aiGenerateSprint,
  aiInterviewQA,
} from '../controllers/aiController.js';

const router = Router();

router.post('/audit', aiDeepAudit);
router.post('/generate-sprint', aiGenerateSprint);
router.post('/interview-qa', aiInterviewQA);

export default router;
