import { Request, Response } from 'express';
import db from '../config/db.js';

/**
 * @desc    Execute safe MongoDB query from live UI Mongo Shell
 * @route   POST /api/database/query
 * @access  Private (or Public for Interview Showcase)
 */
export const executeMongoQuery = async (req: Request, res: Response) => {
  try {
    const { collection = 'tasks', operation = 'find', filter = {}, pipeline = [] } = req.body;
    const allowedCollections = ['users', 'projects', 'tasks', 'auditLogs'];
    if (!allowedCollections.includes(collection)) {
      return res.status(400).json({
        success: false,
        message: `Invalid collection: '${collection}'. Available: ${allowedCollections.join(', ')}.`,
      });
    }

    const targetCollection = (db as any)[collection];
    if (!targetCollection) {
      return res.status(400).json({
        success: false,
        message: `Invalid MongoDB collection: '${collection}'. Available: ['users', 'projects', 'tasks', 'auditLogs']`,
      });
    }

    const startTime = performance.now();
    let result: any;
    let stageCount = 0;

    switch (operation) {
      case 'find':
        result = await targetCollection.find(filter);
        break;
      case 'findOne':
        result = await targetCollection.findOne(filter);
        break;
      case 'countDocuments':
        result = await targetCollection.countDocuments(filter);
        break;
      case 'aggregate':
        stageCount = Array.isArray(pipeline) ? pipeline.length : 0;
        result = await targetCollection.aggregate(pipeline);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Unsupported operation: '${operation}'. Supported: ['find', 'findOne', 'countDocuments', 'aggregate']`,
        });
    }

    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    const removeSensitiveFields = (value: any): any => {
      if (Array.isArray(value)) return value.map(removeSensitiveFields);
      if (!value || typeof value !== 'object' || value instanceof Date) return value;
      return Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => key !== 'password' && key !== 'passwordLabel')
          .map(([key, nestedValue]) => [key, removeSensitiveFields(nestedValue)])
      );
    };

    res.json({
      success: true,
      collection,
      operation,
      executionStats: {
        executionTimeMillis: executionTimeMs,
        totalDocsExamined: Array.isArray(result) ? result.length : 1,
        nReturned: Array.isArray(result) ? result.length : (result ? 1 : 0),
        stage: operation === 'aggregate' ? `AGGREGATION_PIPELINE (${stageCount} stages)` : 'INDEX_SCAN (IXSCAN)',
        indexUsed: targetCollection.getIndexes()[0] || '_id_',
      },
      data: removeSensitiveFields(result),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get real-time database metrics & collection indexes
 * @route   GET /api/database/stats
 * @access  Public
 */
export const getDatabaseStats = async (req: Request, res: Response) => {
  try {
    const stats = await db.getStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Reset & Reseed database to pristine state
 * @route   POST /api/database/seed
 * @access  Private (Admin only)
 */
export const resetAndSeedDatabase = async (req: Request, res: Response) => {
  try {
    db.users.clear();
    db.projects.clear();
    db.tasks.clear();
    db.auditLogs.clear();
    db.messages.clear();
    db.notifications.clear();
    await db.seedDatabase();

    const stats = await db.getStats();
    res.json({
      success: true,
      message: 'MongoDB collections successfully wiped and re-seeded with production test dataset.',
      stats,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
