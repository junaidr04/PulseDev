import { Request, Response } from 'express';
import db from '../config/db.js';
import { DatabaseQueryValidationError } from '../config/mongoCollection.js';

const queryCollections = {
  users: db.users,
  projects: db.projects,
  tasks: db.tasks,
  auditLogs: db.auditLogs,
};

function isQueryCollection(value: string): value is keyof typeof queryCollections {
  return Object.hasOwn(queryCollections, value);
}

/**
 * @desc    Execute a supported read-only query against MongoDB collections
 * @route   POST /api/database/query
 * @access  Private (Admin only)
 */
export const executeMongoQuery = async (req: Request, res: Response) => {
  try {
    const { collection = 'tasks', operation = 'find', filter = {}, pipeline = [] } = req.body;
    if (typeof collection !== 'string' || !isQueryCollection(collection)) {
      return res.status(400).json({
        success: false,
        message: `Invalid collection: '${collection}'. Available: ${Object.keys(queryCollections).join(', ')}.`,
      });
    }

    const targetCollection = queryCollections[collection];
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
        if (!Array.isArray(pipeline)) {
          return res.status(400).json({ success: false, message: 'Aggregation pipeline must be an array.' });
        }
        stageCount = pipeline.length;
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
        mode: 'MONGODB',
        pipelineStages: operation === 'aggregate' ? stageCount : undefined,
        nReturned: Array.isArray(result) ? result.length : typeof result === 'number' ? result : (result ? 1 : 0),
      },
      data: removeSensitiveFields(result),
    });
  } catch (error: any) {
    if (error instanceof DatabaseQueryValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get real-time database metrics & collection indexes
 * @route   GET /api/database/stats
 * @access  Private (Admin only)
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
    await Promise.all([
      db.users.clear(),
      db.projects.clear(),
      db.tasks.clear(),
      db.auditLogs.clear(),
      db.messages.clear(),
      db.notifications.clear(),
    ]);
    await db.seedDatabase();

    const stats = await db.getStats();
    res.json({
      success: true,
      message: 'Workspace data was reset and reseeded.',
      stats,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
