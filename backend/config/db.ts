import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import mongoose from 'mongoose';
import { MongoCollection } from './mongoCollection.js';
import {
  AuditLogModel,
  MessageModel,
  NotificationModel,
  ProjectModel,
  TaskModel,
  UserModel,
  collectionModels,
} from './models.js';
import { DEMO_ACCOUNTS, isDemoAccountEmail } from './demoAccounts.js';

export interface BaseDocument {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface UserDoc extends BaseDocument {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'lead' | 'developer' | 'qa' | 'guest';
  avatar: string;
  title: string;
  department: string;
  status: 'online' | 'away' | 'busy' | 'offline';
}

export interface ProjectDoc extends BaseDocument {
  title: string;
  key: string;
  description: string;
  leadId: string;
  category: 'Backend Architecture' | 'DevOps & Cloud' | 'Security & Auth' | 'Fullstack Platform';
  status: 'active' | 'in_review' | 'planning' | 'archived';
  progress: number;
  tags: string[];
}

export interface TaskDoc extends BaseDocument {
  projectId: string;
  title: string;
  description: string;
  column: 'backlog' | 'in_progress' | 'in_review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId: string;
  reporterId: string;
  estimateHours: number;
  tags: string[];
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    createdAt: Date;
  }>;
  rejectionHistory?: Array<{
    id: string;
    rejectedById: string;
    rejectedByName: string;
    rejectedAt: Date;
    reason: string;
    category?: 'Functional bug' | 'Regression' | 'Performance' | 'Other';
  }>;
  rejectionActive?: boolean;
}

export interface AuditLogDoc extends BaseDocument {
  action: string;
  entityType: 'User' | 'Project' | 'Task' | 'Auth' | 'Query';
  entityId: string;
  performedBy: string;
  performedByName: string;
  details: string;
  ipAddress: string;
}

export interface ChatAttachmentDoc {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  url: string;
  size: string;
}

export interface MessageDoc extends BaseDocument {
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: string;
  text: string;
  channel: string;
  isAiResponse?: boolean;
  attachments?: ChatAttachmentDoc[];
  replyTo?: {
    messageId: string;
    userName: string;
    text: string;
  };
}

export interface NotificationDoc extends BaseDocument {
  recipientId?: string;
  recipientRole?: string;
  title: string;
  message: string;
  type: 'auth' | 'task' | 'project' | 'system';
  read: boolean;
  link?: string;
  actorName: string;
  actorAvatar: string;
}

// Generate a 24-character hexadecimal identifier.
export function generateObjectId(): string {
  return new mongoose.Types.ObjectId().toHexString();
}

// Mongoose-backed store for workspace collections.
class MongoStore {
  public users = new MongoCollection<UserDoc>('users', UserModel);
  public projects = new MongoCollection<ProjectDoc>('projects', ProjectModel);
  public tasks = new MongoCollection<TaskDoc>('tasks', TaskModel);
  public auditLogs = new MongoCollection<AuditLogDoc>('auditLogs', AuditLogModel);
  public messages = new MongoCollection<MessageDoc>('messages', MessageModel);
  public notifications = new MongoCollection<NotificationDoc>('notifications', NotificationModel);

  public serverStartTime = new Date();
  public readonly ready: Promise<void>;

  constructor() {
    this.ready = this.connectAndSeed();
  }

  private async connectAndSeed(): Promise<void> {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) {
      throw new Error('MONGO_URI is required. Add your MongoDB Atlas connection string to the root .env file.');
    }

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    await Promise.all(Object.values(collectionModels).map((model) => model.init()));
    await this.seedDatabase();
  }

  async seedDatabase() {
    await this.users.removeFieldFromAll('passwordLabel');
    const salt = await bcrypt.genSalt(10);

    const coreAccounts: Array<{
      _id: string;
      name: string;
      email: string;
      rawPassword: string;
      role: 'admin' | 'lead' | 'developer' | 'qa' | 'guest';
      avatar: string;
      title: string;
      department: string;
      status: 'online' | 'away' | 'busy' | 'offline';
    }> = [
      {
        _id: '66a1bf9823e4d5c6b7a89001',
        name: 'Alex Chen',
        email: 'alex.chen@pulsedev.io',
        rawPassword: 'Alex@Admin1',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
        title: 'Principal Architect',
        department: 'Core Architecture',
        status: 'online',
      },
      {
        _id: '66a1bf9823e4d5c6b7a89002',
        name: 'Priya Patel',
        email: 'priya.patel@pulsedev.io',
        rawPassword: 'Priya@Lead2',
        role: 'lead',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&h=256&q=80',
        title: 'Staff Backend Lead',
        department: 'Distributed Systems & APIs',
        status: 'online',
      },
      {
        _id: '66a1bf9823e4d5c6b7a89003',
        name: 'Marcus Vance',
        email: 'marcus.vance@pulsedev.io',
        rawPassword: 'Marcus@Dev3',
        role: 'developer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
        title: 'Senior Software Engineer',
        department: 'Product Engineering',
        status: 'online',
      },
      {
        _id: '66a1bf9823e4d5c6b7a89004',
        name: 'Sophia Laurent',
        email: 'sophia.laurent@pulsedev.io',
        rawPassword: 'Sophia@QA4',
        role: 'qa',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
        title: 'QA Automation Lead',
        department: 'Quality Engineering',
        status: 'online',
      },
      {
        _id: '66a1bf9823e4d5c6b7a89005',
        name: 'Jordan Blake',
        email: 'jordan.blake@pulsedev.io',
        rawPassword: 'Jordan@PM5',
        role: 'guest',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80',
        title: 'Product Manager',
        department: 'Product Strategy',
        status: 'online',
      },
    ];

    if (process.env.NODE_ENV === 'production') {
      await this.prepareProductionUsers(coreAccounts);
      return;
    }

    for (const acc of coreAccounts) {
      const existing = await this.users.findById(acc._id);
      if (!existing) {
        const hashedPassword = await bcrypt.hash(acc.rawPassword, salt);
        await this.users.create({
          _id: acc._id,
          name: acc.name,
          email: acc.email,
          password: hashedPassword,
          role: acc.role,
          avatar: acc.avatar,
          title: acc.title,
          department: acc.department,
          status: acc.status,
        });
      }
    }

    const u1 = (await this.users.findById('66a1bf9823e4d5c6b7a89001'))!;
    const u2 = (await this.users.findById('66a1bf9823e4d5c6b7a89002'))!;
    const u3 = (await this.users.findById('66a1bf9823e4d5c6b7a89003'))!;
    const u4 = (await this.users.findById('66a1bf9823e4d5c6b7a89004'))!;
    const u5 = (await this.users.findById('66a1bf9823e4d5c6b7a89005'))!;

    const projectCount = await this.projects.countDocuments();
    if (projectCount > 0) {
      // Ensure Jordan Blake also has a seeded task if not present
      const existingJordanTask = await this.tasks.findById('66c3df7801e2d3c4b5a67108');
      if (!existingJordanTask) {
        await this.tasks.create({
          _id: '66c3df7801e2d3c4b5a67108',
          projectId: '66b2cf8912e3d4c5b6a78010',
          title: 'Q4 Enterprise Checkout OKR & Merchant Conversion Roadmap',
          description: 'Align merchant conversion funnel KPIs and finalize stakeholder sign-off for one-click biometric wallet rollout.',
          column: 'in_progress',
          priority: 'high',
          assigneeId: u5._id,
          reporterId: u1._id,
          estimateHours: 6,
          tags: ['Roadmap', 'OKR', 'Product'],
          comments: [],
        });
      }
      return;
    }

    console.log('[Storage] Initializing MongoDB workspace collections...');

    // Seed High-Impact Enterprise Projects
    const p1 = await this.projects.create({
      _id: '66b2cf8912e3d4c5b6a78010',
      title: 'Global Checkout & Payment Engine v2',
      key: 'PAY',
      description: 'Next-generation checkout platform featuring localized multi-currency pricing, Apple Pay, Google Pay, and 3D Secure 2.0 biometric fraud verification.',
      leadId: u1._id,
      category: 'Backend Architecture',
      status: 'active',
      progress: 75,
      tags: ['Payments', 'Stripe', 'Checkout', 'PCI-DSS'],
    });

    const p2 = await this.projects.create({
      _id: '66b2cf8912e3d4c5b6a78020',
      title: 'Mobile Experience & Offline Sync Engine',
      key: 'MOB',
      description: 'Revamped cross-platform client experience with sub-100ms response times, hardware-backed biometric security, and optimistic offline data synchronization.',
      leadId: u2._id,
      category: 'Fullstack Platform',
      status: 'active',
      progress: 60,
      tags: ['Mobile', 'OfflineSync', 'DesignSystem', 'Performance'],
    });

    const p3 = await this.projects.create({
      _id: '66b2cf8912e3d4c5b6a78030',
      title: 'Cloud Infrastructure & Auto-Scaling Cluster',
      key: 'OPS',
      description: 'High-availability multi-region cloud deployment with automated canary releases, zero-downtime database failover, and global CDN edge routing.',
      leadId: u3._id,
      category: 'DevOps & Cloud',
      status: 'active',
      progress: 45,
      tags: ['Kubernetes', 'Cloud', 'CanaryRelease', 'HighAvailability'],
    });

    // Seed Enterprise Sprint Tasks for Project 1 (PAY)
    await this.tasks.create({
      _id: '66c3df7801e2d3c4b5a67101',
      projectId: p1._id,
      title: 'Implement 3D Secure 2.0 Biometric Verification Flow',
      description: 'Add frictionless strong customer authentication (SCA) for European card issuers with automated fallback to SMS OTP.',
      column: 'completed',
      priority: 'critical',
      assigneeId: u1._id,
      reporterId: u2._id,
      estimateHours: 8,
      tags: ['Security', 'Payments'],
      comments: [
        {
          id: generateObjectId(),
          userId: u2._id,
          userName: u2.name,
          userAvatar: u2.avatar,
          text: 'Verified test cards across Visa and Mastercard 3DS endpoints. Flow passes validation.',
          createdAt: new Date(Date.now() - 3600000 * 24 * 2),
        },
      ],
    });

    await this.tasks.create({
      _id: '66c3df7801e2d3c4b5a67102',
      projectId: p1._id,
      title: 'Apple Pay & Google Pay One-Click Wallet Integration',
      description: 'Enable native browser payment request API for desktop and mobile Safari/Chrome, targeting an 18% reduction in checkout abandonment.',
      column: 'in_review',
      priority: 'high',
      assigneeId: u2._id,
      reporterId: u1._id,
      estimateHours: 6,
      tags: ['Checkout', 'Frontend'],
      comments: [
        {
          id: generateObjectId(),
          userId: u1._id,
          userName: u1.name,
          userAvatar: u1.avatar,
          text: 'Merchant certificates validated on staging environment. Sheet transitions are under 120ms.',
          createdAt: new Date(Date.now() - 3600000 * 12),
        },
      ],
    });

    await this.tasks.create({
      _id: '66c3df7801e2d3c4b5a67103',
      projectId: p1._id,
      title: 'Payment Webhook Delivery Queue with Exponential Backoff',
      description: 'Implement idempotent webhook processing for invoice payments and subscription renewal events with automatic dead-letter queue routing.',
      column: 'in_progress',
      priority: 'high',
      assigneeId: u3._id,
      reporterId: u1._id,
      estimateHours: 10,
      tags: ['Webhooks', 'Queue'],
      comments: [],
    });

    await this.tasks.create({
      _id: '66c3df7801e2d3c4b5a67104',
      projectId: p1._id,
      title: 'Multi-Currency Dynamic Conversion & FX Hedging',
      description: 'Fetch real-time foreign exchange spot rates and support billing in 32 localized currencies with real-time tax calculation.',
      column: 'backlog',
      priority: 'medium',
      assigneeId: u4._id,
      reporterId: u2._id,
      estimateHours: 12,
      tags: ['Localization', 'Finance'],
      comments: [],
    });

    await this.tasks.create({
      _id: '66c3df7801e2d3c4b5a67108',
      projectId: p1._id,
      title: 'Q4 Enterprise Checkout OKR & Merchant Conversion Roadmap',
      description: 'Align merchant conversion funnel KPIs and finalize stakeholder sign-off for one-click biometric wallet rollout.',
      column: 'in_progress',
      priority: 'high',
      assigneeId: u5._id,
      reporterId: u1._id,
      estimateHours: 6,
      tags: ['Roadmap', 'OKR', 'Product'],
      comments: [],
    });

    // Tasks for Project 2 (MOB)
    await this.tasks.create({
      _id: '66c3df7801e2d3c4b5a67105',
      projectId: p2._id,
      title: 'Optimistic UI State Synchronization & Conflict Merge',
      description: 'Allow team members to update sprint tasks while offline, queueing state mutations and resolving clock skew on reconnect.',
      column: 'in_progress',
      priority: 'critical',
      assigneeId: u3._id,
      reporterId: u1._id,
      estimateHours: 14,
      tags: ['Offline', 'StateSync'],
      comments: [],
    });

    await this.tasks.create({
      _id: '66c3df7801e2d3c4b5a67106',
      projectId: p2._id,
      title: 'Biometric FaceID & Fingerprint Hardware Unlock',
      description: 'Integrate hardware secure enclave key generation to authenticate users without re-entering credentials on every session.',
      column: 'completed',
      priority: 'high',
      assigneeId: u2._id,
      reporterId: u3._id,
      estimateHours: 8,
      tags: ['Security', 'Biometrics'],
      comments: [],
    });

    // Tasks for Project 3 (OPS)
    await this.tasks.create({
      _id: '66c3df7801e2d3c4b5a67107',
      projectId: p3._id,
      title: 'Configure Horizontal Pod Autoscaling for 25k RPS Peak',
      description: 'Define CPU and memory utilization thresholds across Kubernetes pods with predictive pre-warming for daily traffic spikes.',
      column: 'in_progress',
      priority: 'high',
      assigneeId: u1._id,
      reporterId: u2._id,
      estimateHours: 10,
      tags: ['Kubernetes', 'SRE'],
      comments: [],
    });

    // Seed Audit Log entries
    await this.auditLogs.create({
      action: 'SERVER_BOOTSTRAP',
      entityType: 'User',
      entityId: u1._id,
      performedBy: u1._id,
      performedByName: u1.name,
      details: 'PulseDev cluster initialized with active project sprints.',
      ipAddress: '127.0.0.1',
    });

    await this.auditLogs.create({
      action: 'USER_LOGIN',
      entityType: 'Auth',
      entityId: u1._id,
      performedBy: u1._id,
      performedByName: u1.name,
      details: 'User authenticated successfully.',
      ipAddress: '10.0.4.18',
    });

    // Seed Initial Notifications
    await this.notifications.create({
      title: 'Sprint 44 Planning Active',
      message: 'Alex Chen initialized Sprint 44 for Payment Engine & Cloud Migration.',
      type: 'project',
      read: false,
      actorName: u1.name,
      actorAvatar: u1.avatar,
      createdAt: new Date(Date.now() - 3600000),
    });

    await this.notifications.create({
      title: 'Code Review Requested (PAY-103)',
      message: 'Marcus Vance submitted Task PAY-103 for QA and Architecture verification.',
      type: 'task',
      read: false,
      actorName: u3.name,
      actorAvatar: u3.avatar,
      createdAt: new Date(Date.now() - 1800000),
    });

    await this.notifications.create({
      title: 'User Login Notice',
      message: 'Alex Chen (Principal Architect) logged into Platform Engineering dashboard.',
      type: 'auth',
      read: true,
      actorName: u1.name,
      actorAvatar: u1.avatar,
      createdAt: new Date(Date.now() - 900000),
    });

    // Seed Initial Team Chat Messages (only if not already present so existing chat history is NEVER deleted)
    const existingM1 = await this.messages.findById('seed-msg-1');
    if (!existingM1) {
      await this.messages.create({
        _id: 'seed-msg-1',
        userId: u1._id,
        userName: u1.name,
        userAvatar: u1.avatar,
        userRole: u1.role,
        text: 'Good morning engineering team! Sprint 44 is live. Marcus, please prioritize the MongoDB compound indexing for PAY-103.',
        channel: 'engineering-sync',
        createdAt: new Date('2026-10-07T10:21:00.000Z'),
      });
    }

    const existingM2 = await this.messages.findById('seed-msg-2');
    if (!existingM2) {
      await this.messages.create({
        _id: 'seed-msg-2',
        userId: u3._id,
        userName: u3.name,
        userAvatar: u3.avatar,
        userRole: u3.role,
        text: 'On it, Alex! The compound index { projectId: 1, column: 1, priority: 1 } reduced query latency down to 2ms in staging.',
        channel: 'engineering-sync',
        createdAt: new Date('2026-10-07T10:51:00.000Z'),
      });
    }

    const existingM3 = await this.messages.findById('seed-msg-3');
    if (!existingM3) {
      await this.messages.create({
        _id: 'seed-msg-3',
        userId: u4._id,
        userName: u4.name,
        userAvatar: u4.avatar,
        userRole: u4.role,
        text: 'Automated Playwright & Jest test suites have passed on the PR. Ready for review.',
        channel: 'engineering-sync',
        createdAt: new Date('2026-10-07T11:21:00.000Z'),
      });
    }

    console.log('[Storage] MongoDB demo data seeding completed.');
  }

  private async prepareProductionUsers(
    coreAccounts: Array<{
      _id: string;
      name: string;
      email: string;
      rawPassword: string;
      role: UserDoc['role'];
      avatar: string;
      title: string;
      department: string;
      status: UserDoc['status'];
    }>
  ): Promise<void> {
    const bootstrapEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    const bootstrapPassword = process.env.INITIAL_ADMIN_PASSWORD;
    const bootstrapName = process.env.INITIAL_ADMIN_NAME?.trim() || 'Workspace Administrator';

    if (Boolean(bootstrapEmail) !== Boolean(bootstrapPassword)) {
      throw new Error('Set both INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD to bootstrap a production administrator.');
    }

    if (bootstrapPassword && bootstrapPassword.trim().length < 16) {
      throw new Error('INITIAL_ADMIN_PASSWORD must be at least 16 characters long.');
    }

    if (bootstrapEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bootstrapEmail)) {
      throw new Error('INITIAL_ADMIN_EMAIL must be a valid email address.');
    }
    if (bootstrapEmail && isDemoAccountEmail(bootstrapEmail)) {
      throw new Error('INITIAL_ADMIN_EMAIL cannot use a reserved demo account email.');
    }

    const demoPassword = process.env.DEMO_ACCOUNTS_PASSWORD;
    if (demoPassword !== undefined && demoPassword.length < 6) {
      throw new Error('DEMO_ACCOUNTS_PASSWORD must be at least 6 characters long.');
    }

    const builtInAdmin = coreAccounts.find((account) => account.role === 'admin');
    if (!builtInAdmin) throw new Error('Production administrator seed configuration is missing.');

    const existingBuiltInAdmin = await this.users.findById(builtInAdmin._id);
    const hasBuiltInAdminPassword =
      existingBuiltInAdmin &&
      await bcrypt.compare(builtInAdmin.rawPassword, existingBuiltInAdmin.password);

    if (hasBuiltInAdminPassword && (!bootstrapEmail || !bootstrapPassword)) {
      throw new Error(
        'A built-in administrator credential was found in production data. Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD to replace it before starting.'
      );
    }

    if (hasBuiltInAdminPassword && existingBuiltInAdmin && bootstrapEmail && bootstrapPassword) {
      const emailOwner = await this.users.findOne({ email: bootstrapEmail });
      if (emailOwner && emailOwner._id !== existingBuiltInAdmin._id) {
        throw new Error('INITIAL_ADMIN_EMAIL already belongs to another account.');
      }

      await this.users.findByIdAndUpdate(existingBuiltInAdmin._id, {
        name: bootstrapName,
        email: bootstrapEmail,
        password: await bcrypt.hash(bootstrapPassword, 12),
      });
      console.info('[Auth] Replaced a legacy built-in administrator credential.');
    }

    if (demoPassword) {
      for (const demoAccount of DEMO_ACCOUNTS) {
        const account = coreAccounts.find(
          (candidate) => candidate.email === demoAccount.email
        );
        if (!account) throw new Error('Production demo account seed configuration is missing.');

        const existing = await this.users.findOne({ email: demoAccount.email });
        if (existing?.role === 'admin') {
          throw new Error('A reserved demo account email belongs to an administrator.');
        }

        const password = await bcrypt.hash(demoPassword, 12);
        if (existing) {
          await this.users.findByIdAndUpdate(existing._id, { password });
          continue;
        }

        const idOwner = await this.users.findById(account._id);
        if (idOwner) {
          throw new Error('A seeded demo account ID belongs to another account.');
        }

        await this.users.create({
          _id: account._id,
          name: account.name,
          email: account.email,
          password,
          role: account.role,
          avatar: account.avatar,
          title: account.title,
          department: account.department,
          status: account.status,
        });
      }
    } else {
      for (const demoAccount of DEMO_ACCOUNTS) {
        const existing =
          await this.users.findOne({ email: demoAccount.email }) ||
          await this.users.findById(demoAccount._id);
        if (existing && existing.role !== 'admin') {
          await this.users.findByIdAndUpdate(existing._id, {
            password: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
          });
        }
      }
    }

    const administrator = await this.users.findOne({ role: 'admin' });
    if (administrator) return;

    if (!bootstrapEmail || !bootstrapPassword) {
      throw new Error(
        'No administrator account exists. Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD to create one before starting in production.'
      );
    }

    const emailOwner = await this.users.findOne({ email: bootstrapEmail });
    if (emailOwner) {
      throw new Error('INITIAL_ADMIN_EMAIL already belongs to a non-administrator account.');
    }

    await this.users.create({
      name: bootstrapName,
      email: bootstrapEmail,
      password: await bcrypt.hash(bootstrapPassword, 12),
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Workspace%20Administrator',
      title: 'Workspace Administrator',
      department: 'Administration',
      status: 'online',
    });
    console.info('[Auth] Created the initial production administrator account.');
  }

  connectionState(): string {
    return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  }

  async getStats() {
    const userCount = await this.users.countDocuments();
    const projectCount = await this.projects.countDocuments();
    const taskCount = await this.tasks.countDocuments();
    const auditCount = await this.auditLogs.countDocuments();
    const messageCount = await this.messages.countDocuments();
    const notificationCount = await this.notifications.countDocuments();
    const indexes = await Promise.all([
      this.users.getIndexes(),
      this.projects.getIndexes(),
      this.tasks.getIndexes(),
      this.auditLogs.getIndexes(),
      this.messages.getIndexes(),
      this.notifications.getIndexes(),
    ]);

    return {
      persistence: 'mongodb',
      database: mongoose.connection.name,
      connectionState: this.connectionState(),
      adapter: 'Mongoose',
      uptimeSeconds: Math.floor((Date.now() - this.serverStartTime.getTime()) / 1000),
      collections: [
        {
          name: 'users',
          documents: userCount,
          indexes: indexes[0],
        },
        {
          name: 'projects',
          documents: projectCount,
          indexes: indexes[1],
        },
        {
          name: 'tasks',
          documents: taskCount,
          indexes: indexes[2],
        },
        {
          name: 'auditLogs',
          documents: auditCount,
          indexes: indexes[3],
        },
        { name: 'messages', documents: messageCount, indexes: indexes[4] },
        { name: 'notifications', documents: notificationCount, indexes: indexes[5] },
      ],
      totalDocuments: userCount + projectCount + taskCount + auditCount + messageCount + notificationCount,
    };
  }
}

// Global Singleton Instance
export const db = new MongoStore();
export default db;
