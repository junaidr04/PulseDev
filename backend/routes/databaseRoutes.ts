import { Router } from 'express';
import {
  executeMongoQuery,
  getDatabaseStats,
  resetAndSeedDatabase,
} from '../controllers/databaseController.js';

const router = Router();

router.post('/query', executeMongoQuery);
router.get('/stats', getDatabaseStats);
router.post('/seed', resetAndSeedDatabase);

export default router;
