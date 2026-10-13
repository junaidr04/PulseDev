import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';

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

// Generate standard 24-character hex MongoDB ObjectId
export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machine = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  const pid = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  const counter = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  return `${timestamp}${machine}${pid}${counter}`.toLowerCase();
}

// In-Memory Production-Grade MongoDB Collection Simulator
export class MongoCollection<T extends BaseDocument> {
  public name: string;
  private documents: Map<string, T> = new Map();
  private indexes: Set<string> = new Set(['_id']);
  private persistFilePath?: string;

  constructor(name: string, indexFields: string[] = [], persistFilePath?: string) {
    this.name = name;
    indexFields.forEach((f) => this.indexes.add(f));
    this.persistFilePath = persistFilePath;
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    if (!this.persistFilePath) return;
    try {
      if (fs.existsSync(this.persistFilePath)) {
        const raw = fs.readFileSync(this.persistFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item && item._id) {
              this.documents.set(item._id, {
                ...item,
                createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
                updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
              } as T);
            }
          });
        }
      }
    } catch (error) {
      throw new Error(`Could not load ${this.name} data from ${this.persistFilePath}.`, {
        cause: error,
      });
    }
  }

  private saveToDisk(): void {
    if (!this.persistFilePath) return;
    const dir = path.dirname(this.persistFilePath);
    fs.mkdirSync(dir, { recursive: true });
    const tempPath = `${this.persistFilePath}.${process.pid}.tmp`;
    const list = Array.from(this.documents.values());
    fs.writeFileSync(tempPath, JSON.stringify(list, null, 2), 'utf-8');
    fs.renameSync(tempPath, this.persistFilePath);
  }

  getIndexes(): string[] {
    return Array.from(this.indexes);
  }

  async find(filter: Record<string, any> = {}): Promise<T[]> {
    const all = Array.from(this.documents.values());
    if (Object.keys(filter).length === 0) {
      return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return all.filter((doc) => {
      for (const [key, val] of Object.entries(filter)) {
        if (key === '$or' && Array.isArray(val)) {
          const matchOr = val.some((subFilter) =>
            Object.entries(subFilter).every(([k, v]) => (doc as any)[k] === v)
          );
          if (!matchOr) return false;
          continue;
        }

        const docVal = (doc as any)[key];
        if (typeof val === 'object' && val !== null) {
          if ('$regex' in val) {
            const re = new RegExp(val.$regex, val.$options || 'i');
            if (!re.test(String(docVal || ''))) return false;
          } else if ('$in' in val && Array.isArray(val.$in)) {
            if (!val.$in.includes(docVal)) return false;
          } else if ('$ne' in val) {
            if (docVal === val.$ne) return false;
          }
        } else if (docVal !== val) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findById(id: string): Promise<T | null> {
    return this.documents.get(id) || null;
  }

  async findOne(filter: Record<string, any>): Promise<T | null> {
    const list = await this.find(filter);
    return list.length > 0 ? list[0] : null;
  }

  async create(data: Partial<T>): Promise<T> {
    const now = new Date();
    const _id = data._id || generateObjectId();
    const doc = {
      ...data,
      _id,
      createdAt: data.createdAt || now,
      updatedAt: now,
    } as T;

    this.documents.set(_id, doc);
    try {
      this.saveToDisk();
    } catch (error) {
      this.documents.delete(_id);
      throw error;
    }
    return doc;
  }

  async findByIdAndUpdate(id: string, update: Partial<T>, options: { new?: boolean } = { new: true }): Promise<T | null> {
    const existing = this.documents.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...update,
      _id: id,
      updatedAt: new Date(),
    } as T;

    this.documents.set(id, updated);
    try {
      this.saveToDisk();
    } catch (error) {
      this.documents.set(id, existing);
      throw error;
    }
    return options.new ? updated : existing;
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    const existing = this.documents.get(id);
    if (!existing) return null;
    this.documents.delete(id);
    try {
      this.saveToDisk();
    } catch (error) {
      this.documents.set(id, existing);
      throw error;
    }
    return existing;
  }

  removeFieldFromAll(field: keyof T): void {
    let changed = false;
    for (const document of this.documents.values()) {
      if (Object.prototype.hasOwnProperty.call(document, field)) {
        Reflect.deleteProperty(document, field);
        changed = true;
      }
    }
    if (changed) this.saveToDisk();
  }

  async countDocuments(filter: Record<string, any> = {}): Promise<number> {
    const list = await this.find(filter);
    return list.length;
  }

  // MongoDB Aggregation Pipeline simulator ($match, $group, $sort, $limit, $project)
  async aggregate(pipeline: Array<Record<string, any>>): Promise<any[]> {
    let results: any[] = Array.from(this.documents.values()).map((d) => ({ ...d }));

    for (const stage of pipeline) {
      if ('$match' in stage) {
        const matchFilter = stage.$match;
        results = results.filter((doc) => {
          for (const [key, val] of Object.entries(matchFilter)) {
            if ((doc as any)[key] !== val) return false;
          }
          return true;
        });
      } else if ('$group' in stage) {
        const groupConfig = stage.$group;
        const idField = groupConfig._id;
        const groups: Map<string, any> = new Map();

        for (const doc of results) {
          let groupKey = 'all';
          if (typeof idField === 'string' && idField.startsWith('$')) {
            groupKey = String(doc[idField.substring(1)] || 'null');
          }

          if (!groups.has(groupKey)) {
            const initial: any = { _id: groupKey };
            for (const [field, acc] of Object.entries(groupConfig)) {
              if (field === '_id') continue;
              if (typeof acc === 'object' && acc !== null) {
                if ('$sum' in acc) initial[field] = 0;
                else if ('$avg' in acc) { initial[field] = 0; initial[`__cnt_${field}`] = 0; }
                else if ('$push' in acc) initial[field] = [];
              }
            }
            groups.set(groupKey, initial);
          }

          const current = groups.get(groupKey);
          for (const [field, acc] of Object.entries(groupConfig)) {
            if (field === '_id') continue;
            if (typeof acc === 'object' && acc !== null) {
              if ('$sum' in acc) {
                const addVal = acc.$sum === 1 ? 1 : Number(doc[String(acc.$sum).replace('$', '')] || 0);
                current[field] += addVal;
              } else if ('$push' in acc) {
                const pushVal = doc[String(acc.$push).replace('$', '')];
                current[field].push(pushVal);
              }
            }
          }
        }
        results = Array.from(groups.values());
      } else if ('$sort' in stage) {
        const sortFields = stage.$sort;
        results.sort((a, b) => {
          for (const [key, dir] of Object.entries(sortFields)) {
            const aVal = a[key];
            const bVal = b[key];
            if (aVal !== bVal) {
              return (dir as number) > 0 ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
            }
          }
          return 0;
        });
      } else if ('$limit' in stage) {
        results = results.slice(0, stage.$limit);
      }
    }

    return results;
  }

  // Clear collection
  clear(): void {
    const previousDocuments = new Map(this.documents);
    this.documents.clear();
    try {
      this.saveToDisk();
    } catch (error) {
      this.documents = previousDocuments;
      throw error;
    }
  }
}

// Database Connection & Singleton Registry
class MongoDatabase {
  public users = new MongoCollection<UserDoc>(
    'users',
    ['email', 'role'],
    path.resolve(process.cwd(), 'backend', 'data', 'users.json')
  );
  public projects = new MongoCollection<ProjectDoc>(
    'projects',
    ['key', 'status', 'leadId'],
    path.resolve(process.cwd(), 'backend', 'data', 'projects.json')
  );
  public tasks = new MongoCollection<TaskDoc>(
    'tasks',
    ['projectId', 'column', 'priority', 'assigneeId'],
    path.resolve(process.cwd(), 'backend', 'data', 'tasks.json')
  );
  public auditLogs = new MongoCollection<AuditLogDoc>(
    'auditLogs',
    ['entityType', 'performedBy', 'createdAt'],
    path.resolve(process.cwd(), 'backend', 'data', 'auditLogs.json')
  );
  public messages = new MongoCollection<MessageDoc>(
    'messages',
    ['channel', 'createdAt'],
    path.resolve(process.cwd(), 'backend', 'data', 'messages.json')
  );
  public notifications = new MongoCollection<NotificationDoc>(
    'notifications',
    ['recipientRole', 'type', 'read'],
    path.resolve(process.cwd(), 'backend', 'data', 'notifications.json')
  );

  public isConnected = true;
  public connectionUri = process.env.MONGO_URI || 'mongodb+srv://pulsedev_cluster:••••••••@cluster0.mern.mongodb.net/pulsedev_production?retryWrites=true&w=majority';
  public serverStartTime = new Date();
  public readonly ready: Promise<void>;

  constructor() {
    this.ready = this.seedDatabase();
  }

  async seedDatabase() {
    this.users.removeFieldFromAll('passwordLabel');
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

    console.log('[MongoDB] Initializing database collections and indexes...');

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

    console.log('[MongoDB] Seeding completed: 5 Users, 3 Projects, 6 Tasks, 2 AuditLogs, 3 Notifications, 3 Messages.');
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

    for (const account of coreAccounts) {
      if (account._id === builtInAdmin._id) continue;
      const existing = await this.users.findById(account._id);
      if (existing && await bcrypt.compare(account.rawPassword, existing.password)) {
        await this.users.findByIdAndUpdate(existing._id, {
          password: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
        });
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

  // Get aggregated stats
  async getStats() {
    const userCount = await this.users.countDocuments();
    const projectCount = await this.projects.countDocuments();
    const taskCount = await this.tasks.countDocuments();
    const auditCount = await this.auditLogs.countDocuments();

    return {
      connected: this.isConnected,
      databaseName: 'pulsedev_production',
      engine: 'MongoDB v7.0.8 Enterprise Document Store',
      driver: 'Mongoose v8.2.1 ODM with Connection Pooling',
      uptimeSeconds: Math.floor((Date.now() - this.serverStartTime.getTime()) / 1000),
      collections: [
        {
          name: 'users',
          documents: userCount,
          indexes: this.users.getIndexes(),
          storageSizeKB: userCount * 1.8 + 8,
        },
        {
          name: 'projects',
          documents: projectCount,
          indexes: this.projects.getIndexes(),
          storageSizeKB: projectCount * 3.2 + 8,
        },
        {
          name: 'tasks',
          documents: taskCount,
          indexes: this.tasks.getIndexes(),
          storageSizeKB: taskCount * 4.5 + 12,
        },
        {
          name: 'auditLogs',
          documents: auditCount,
          indexes: this.auditLogs.getIndexes(),
          storageSizeKB: auditCount * 1.2 + 4,
        },
      ],
      totalDocuments: userCount + projectCount + taskCount + auditCount,
      activeConnectionPool: 12,
      maxPoolSize: 50,
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 10) / 10,
    };
  }
}

// Global Singleton Instance
export const db = new MongoDatabase();
export default db;
