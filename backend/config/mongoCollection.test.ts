import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AuditLogModel,
  MessageModel,
  NotificationModel,
  ProjectModel,
  TaskModel,
  UserModel,
} from './models.js';
import { MongoCollection } from './mongoCollection.js';

test('workspace Mongoose schemas validate representative documents', async () => {
  await Promise.all([
    new UserModel({
      _id: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed-password',
      role: 'developer',
    }).validate(),
    new ProjectModel({ _id: 'test-project', title: 'Test project', key: 'TEST' }).validate(),
    new TaskModel({ _id: 'test-task', projectId: 'test-project', title: 'Test task' }).validate(),
    new AuditLogModel({ _id: 'test-audit', action: 'TEST' }).validate(),
    new MessageModel({ _id: 'test-message' }).validate(),
    new NotificationModel({ _id: 'test-notification' }).validate(),
  ]);
});

test('database inspector rejects write-capable or executable queries', async () => {
  const collection = new MongoCollection('users', UserModel);

  await assert.rejects(collection.find({ $where: 'return true' }), /Unsupported database filter operator/);
  await assert.rejects(collection.aggregate([{ $out: 'users' }]), /Unsupported aggregation stage/);
});
