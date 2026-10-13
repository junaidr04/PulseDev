import { Router } from 'express';
import { getMessages, createMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', protect, getMessages);
router.post('/', protect, createMessage);

export default router;
