import mongoose from 'mongoose';
import type { Model, PipelineStage } from 'mongoose';
import type { BaseDocument } from './db.js';

const fieldOperators = new Set([
  '$eq',
  '$gt',
  '$gte',
  '$in',
  '$lt',
  '$lte',
  '$ne',
  '$nin',
  '$options',
  '$regex',
]);
const logicalOperators = new Set(['$and', '$or']);
const aggregateStages = new Set(['$group', '$limit', '$match', '$sort']);
const aggregateOperators = new Set(['$avg', '$push', '$sum']);

export class DatabaseQueryValidationError extends Error {}

function validateFilter(filter: Record<string, unknown>): void {
  if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
    throw new DatabaseQueryValidationError('Database filter must be an object.');
  }

  for (const [key, value] of Object.entries(filter)) {
    if (key.startsWith('$')) {
      if (!logicalOperators.has(key) || !Array.isArray(value)) {
        throw new DatabaseQueryValidationError(`Unsupported database filter operator: ${key}`);
      }
      for (const clause of value) {
        if (!clause || typeof clause !== 'object' || Array.isArray(clause)) {
          throw new DatabaseQueryValidationError(`Invalid ${key} database filter clause.`);
        }
        validateFilter(clause as Record<string, unknown>);
      }
      continue;
    }

    if (!value || typeof value !== 'object' || Array.isArray(value) || value instanceof Date) {
      continue;
    }
    for (const operator of Object.keys(value)) {
      if (operator.startsWith('$') && !fieldOperators.has(operator)) {
        throw new DatabaseQueryValidationError(`Unsupported database field operator: ${operator}`);
      }
    }
  }
}

function validatePipeline(pipeline: Array<Record<string, unknown>>): void {
  for (const stage of pipeline) {
    if (!stage || typeof stage !== 'object' || Array.isArray(stage)) {
      throw new DatabaseQueryValidationError('Each aggregation stage must be an object.');
    }
    const [stageName, stageValue] = Object.entries(stage)[0] || [];
    if (Object.keys(stage).length !== 1 || !stageName || !aggregateStages.has(stageName)) {
      throw new DatabaseQueryValidationError('Unsupported aggregation stage. Allowed stages: $match, $group, $sort, $limit.');
    }

    if (stageName === '$match') {
      if (!stageValue || typeof stageValue !== 'object' || Array.isArray(stageValue)) {
        throw new DatabaseQueryValidationError('The $match aggregation stage must be an object.');
      }
      validateFilter(stageValue as Record<string, unknown>);
    } else if (stageName === '$group') {
      if (!stageValue || typeof stageValue !== 'object' || Array.isArray(stageValue)) {
        throw new DatabaseQueryValidationError('The $group aggregation stage must be an object.');
      }
      for (const [field, expression] of Object.entries(stageValue)) {
        if (field === '_id') continue;
        if (!expression || typeof expression !== 'object' || Array.isArray(expression)) {
          throw new DatabaseQueryValidationError(`Invalid aggregation expression for '${field}'.`);
        }
        const [operator] = Object.keys(expression);
        if (Object.keys(expression).length !== 1 || !aggregateOperators.has(operator)) {
          throw new DatabaseQueryValidationError(`Unsupported aggregation operator for '${field}'.`);
        }
      }
    } else if (stageName === '$limit' && (!Number.isInteger(stageValue) || Number(stageValue) < 0)) {
      throw new DatabaseQueryValidationError('The $limit aggregation value must be a non-negative integer.');
    }
  }
}

export class MongoCollection<T extends BaseDocument> {
  constructor(
    public readonly name: string,
    private readonly model: Model<T>
  ) {}

  async find(filter: Record<string, unknown> = {}): Promise<T[]> {
    validateFilter(filter);
    return this.model.find(filter).sort({ createdAt: -1 }).lean<T[]>().exec();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).lean<T>().exec();
  }

  async findOne(filter: Record<string, unknown>): Promise<T | null> {
    validateFilter(filter);
    return this.model.findOne(filter).sort({ createdAt: -1 }).lean<T>().exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const document = await this.model.create({
      ...data,
      _id: data._id || new mongoose.Types.ObjectId().toHexString(),
    });
    return document.toObject() as T;
  }

  async findByIdAndUpdate(
    id: string,
    update: Partial<T>,
    options: { new?: boolean } = { new: true }
  ): Promise<T | null> {
    const updateFields = { ...update };
    Reflect.deleteProperty(updateFields, '_id');
    const updated = await this.model.findByIdAndUpdate(id, { $set: updateFields }, {
      new: options.new ?? true,
      runValidators: true,
    }).exec();
    return updated ? updated.toObject() as T : null;
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).lean<T>().exec();
  }

  async removeFieldFromAll(field: keyof T): Promise<void> {
    await this.model.collection.updateMany({}, { $unset: { [String(field)]: 1 } });
  }

  async countDocuments(filter: Record<string, unknown> = {}): Promise<number> {
    validateFilter(filter);
    return this.model.collection.countDocuments(filter);
  }

  async aggregate(pipeline: Array<Record<string, unknown>>): Promise<unknown[]> {
    validatePipeline(pipeline);
    return this.model.aggregate(pipeline as unknown as PipelineStage[]).exec();
  }

  async getIndexes(): Promise<string[]> {
    const indexes = await this.model.collection.indexes();
    return indexes.map((index) => Object.keys(index.key).join('_'));
  }

  async clear(): Promise<void> {
    await this.model.deleteMany({}).exec();
  }
}
