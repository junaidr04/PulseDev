import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import type { ClientSession, Model } from 'mongoose';
import {
  AuditLogModel,
  MessageModel,
  NotificationModel,
  ProjectModel,
  TaskModel,
  UserModel,
} from '../config/models.js';

type JsonDocument = Record<string, unknown> & { _id: string };
type ImportSource = {
  name: string;
  documents: JsonDocument[];
  init(): Promise<unknown>;
  count(): Promise<number>;
  insert(documents: JsonDocument[], session: ClientSession): Promise<unknown>;
};

function createSource<T>(name: string, model: Model<T>): ImportSource {
  return {
    name,
    documents: [],
    init: () => model.init(),
    count: () => model.countDocuments().exec(),
    insert: (documents, session) => model.insertMany(documents, { session, ordered: true }),
  };
}

async function readCollectionFile(collectionName: string): Promise<JsonDocument[]> {
  const filePath = path.resolve(process.cwd(), 'backend', 'data', `${collectionName}.json`);
  let contents: string;

  try {
    contents = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }

  const parsed: unknown = JSON.parse(contents);
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected ${filePath} to contain a JSON array.`);
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`Invalid document at ${filePath}[${index}].`);
    }
    const document = entry as Record<string, unknown>;
    if (typeof document._id !== 'string' || !document._id) {
      throw new Error(`Document at ${filePath}[${index}] is missing a string _id.`);
    }
    delete document.passwordLabel;
    return document as JsonDocument;
  });
}

async function migrateJsonCollections(): Promise<void> {
  const mongoUri = process.env.MONGO_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGO_URI is required. Add your MongoDB Atlas connection string to the root .env file.');
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  const sources = [
    createSource('users', UserModel),
    createSource('projects', ProjectModel),
    createSource('tasks', TaskModel),
    createSource('auditLogs', AuditLogModel),
    createSource('messages', MessageModel),
    createSource('notifications', NotificationModel),
  ];
  for (const source of sources) {
    source.documents = await readCollectionFile(source.name);
  }

  const totalDocuments = sources.reduce((total, source) => total + source.documents.length, 0);
  if (totalDocuments === 0) {
    throw new Error('No JSON workspace data was found in backend/data/. Nothing was imported.');
  }

  const existingCounts = await Promise.all(sources.map((source) => source.count()));
  const populatedCollections = sources
    .filter((_, index) => existingCounts[index] > 0)
    .map(({ name }) => name);
  if (populatedCollections.length > 0) {
    throw new Error(
      `Migration stopped to protect existing MongoDB data. These collections are not empty: ${populatedCollections.join(', ')}.`
    );
  }

  await Promise.all(sources.map((source) => source.init()));
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const source of sources) {
        if (source.documents.length > 0) {
          await source.insert(source.documents, session);
        }
      }
    });
  } finally {
    await session.endSession();
  }

  console.info(`Imported ${totalDocuments} documents into MongoDB:`);
  for (const source of sources) {
    console.info(`- ${source.name}: ${source.documents.length}`);
  }
  console.info('The original JSON files were left unchanged.');
}

migrateJsonCollections()
  .catch((error: unknown) => {
    console.error('[JSON to MongoDB migration failed]', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
