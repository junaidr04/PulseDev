import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import userRoutes from './backend/routes/userRoutes.js';
import projectRoutes from './backend/routes/projectRoutes.js';
import databaseRoutes from './backend/routes/databaseRoutes.js';
import aiRoutes from './backend/routes/aiRoutes.js';
import systemRoutes from './backend/routes/systemRoutes.js';
import notificationRoutes from './backend/routes/notificationRoutes.js';
import messageRoutes from './backend/routes/messageRoutes.js';
import { notFound, errorHandler } from './backend/middleware/errorMiddleware.js';
import { createTask, updateTask, deleteTask, addTaskComment } from './backend/controllers/projectController.js';
import { getUsers } from './backend/controllers/userController.js';
import { protect, requirePermission } from './backend/middleware/authMiddleware.js';
import db from './backend/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await db.ready;
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Body Parsing Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request Telemetry & Logger
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = performance.now();
    res.on('finish', () => {
      const duration = Math.round(performance.now() - start);
      if (req.originalUrl.startsWith('/api')) {
        console.log(`[API ${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // REST API Routes
  app.use('/api/users', userRoutes);
  app.get('/api/team-members', protect, requirePermission('team.read'), getUsers);
  app.use('/api/projects', projectRoutes);
  app.use('/api/database', databaseRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/system', systemRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/messages', messageRoutes);

  // Direct Task Shortcuts under /api/tasks
  app.post('/api/tasks', protect, requirePermission('tasks.write'), createTask);
  app.put('/api/tasks/:id', protect, requirePermission('tasks.write'), updateTask);
  app.delete('/api/tasks/:id', protect, requirePermission('tasks.delete'), deleteTask);
  app.post('/api/tasks/:id/comments', protect, requirePermission('tasks.write'), addTaskComment);

  // Catch-all for undefined /api routes
  app.all('/api/*', notFound);

  // Centralized Error Handling for API routes
  app.use(errorHandler);

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 PulseDev Enterprise MERN Server Active`);
    console.log(`📡 URL: http://0.0.0.0:${PORT}`);
    console.log(`🗄️  MongoDB Engine: Mongoose ODM v8 with Connection Pooling`);
    console.log(`🔐 JWT Auth: Bearer token validation active`);
    console.log(`🤖 Gemini AI: Thinking Mode (gemini-3.1-pro-preview)`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Server Bootstrap Fatal Error]:', err);
  process.exit(1);
});
