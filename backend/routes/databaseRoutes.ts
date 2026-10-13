import { Router } from 'express';
import {
  executeMongoQuery,
  getDatabaseStats,
  resetAndSeedDatabase,
} from '../controllers/databaseController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect, authorize('admin'));
router.post('/query', executeMongoQuery);
router.get('/stats', getDatabaseStats);
router.post('/seed', resetAndSeedDatabase);

export default router;
