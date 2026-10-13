import { Router } from 'express';
import {
  getProjects,
  createProject,
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
  getAnalytics,
} from '../controllers/projectController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Project routes
router.get('/analytics', getAnalytics);
router.get('/', getProjects);
router.post('/', protect, createProject);
router.get('/:id/tasks', getProjectTasks);

// Task routes (mounted also under /api/tasks)
router.post('/tasks', protect, createTask);
router.put('/tasks/:id', protect, updateTask);
router.delete('/tasks/:id', protect, deleteTask);
router.post('/tasks/:id/comments', protect, addTaskComment);

export default router;
