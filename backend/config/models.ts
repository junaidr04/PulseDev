import mongoose, { Schema } from 'mongoose';
import type { Model } from 'mongoose';
import type {
  AuditLogDoc,
  MessageDoc,
  NotificationDoc,
  ProjectDoc,
  TaskDoc,
  UserDoc,
} from './db.js';

const commonFields = {
  _id: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};

function createSchema(fields: Record<string, unknown>, collection: string): Schema {
  return new Schema(
    { ...commonFields, ...fields },
    {
      collection,
      strict: false,
      timestamps: true,
      versionKey: false,
    }
  );
}

function getModel<T>(name: string, collection: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T> | undefined) ??
    mongoose.model<T>(name, schema, collection);
}

const userSchema = createSchema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'lead', 'developer', 'qa', 'guest'] },
  avatar: String,
  title: String,
  department: String,
  status: { type: String, enum: ['online', 'away', 'busy', 'offline'] },
}, 'users');
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });

const projectSchema = createSchema({
  title: { type: String, required: true },
  key: { type: String, required: true },
  description: String,
  leadId: String,
  category: String,
  status: String,
  progress: Number,
  tags: [String],
}, 'projects');
projectSchema.index({ key: 1 }, { unique: true });
projectSchema.index({ status: 1, leadId: 1 });

const taskSchema = createSchema({
  projectId: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  column: String,
  priority: String,
  assigneeId: String,
  reporterId: String,
  estimateHours: Number,
  tags: [String],
  comments: [Schema.Types.Mixed],
  rejectionHistory: [Schema.Types.Mixed],
  rejectionActive: Boolean,
}, 'tasks');
taskSchema.index({ projectId: 1, column: 1, priority: 1 });
taskSchema.index({ assigneeId: 1 });

const auditLogSchema = createSchema({
  action: { type: String, required: true },
  entityType: String,
  entityId: String,
  performedBy: String,
  performedByName: String,
  details: String,
  ipAddress: String,
}, 'auditLogs');
auditLogSchema.index({ entityType: 1, performedBy: 1, createdAt: -1 });

const messageSchema = createSchema({
  userId: String,
  userName: String,
  userAvatar: String,
  userRole: String,
  text: String,
  channel: String,
  isAiResponse: Boolean,
  attachments: [Schema.Types.Mixed],
  replyTo: Schema.Types.Mixed,
}, 'messages');
messageSchema.index({ channel: 1, createdAt: 1 });

const notificationSchema = createSchema({
  recipientId: String,
  recipientRole: String,
  title: String,
  message: String,
  type: String,
  read: Boolean,
  readBy: [String],
  link: String,
  actorName: String,
  actorAvatar: String,
}, 'notifications');
notificationSchema.index({ recipientId: 1, recipientRole: 1, createdAt: -1 });

export const UserModel = getModel<UserDoc>('User', 'users', userSchema);
export const ProjectModel = getModel<ProjectDoc>('Project', 'projects', projectSchema);
export const TaskModel = getModel<TaskDoc>('Task', 'tasks', taskSchema);
export const AuditLogModel = getModel<AuditLogDoc>('AuditLog', 'auditLogs', auditLogSchema);
export const MessageModel = getModel<MessageDoc>('Message', 'messages', messageSchema);
export const NotificationModel = getModel<NotificationDoc>('Notification', 'notifications', notificationSchema);

export const collectionModels = {
  users: UserModel,
  projects: ProjectModel,
  tasks: TaskModel,
  auditLogs: AuditLogModel,
  messages: MessageModel,
  notifications: NotificationModel,
};
