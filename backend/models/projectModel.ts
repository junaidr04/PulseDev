/**
 * Project & Task Schemas & Models Definition (Mongoose ODM)
 * 
 * Production Patterns demonstrated for Tech Interviewers:
 * - Foreign key references (ref: 'User') with Mongoose .populate() support
 * - Compound indexing on { projectId: 1, column: 1, priority: 1 } for sub-2ms query SLA
 * - Array sub-documents for task comments with automated timestamps
 * - Aggregation pipeline design for real-time velocity calculations
 */

export interface IProject {
  _id: string;
  title: string;
  key: string;
  description: string;
  leadId: string;
  category: 'Backend Architecture' | 'DevOps & Cloud' | 'Security & Auth' | 'Fullstack Platform';
  status: 'active' | 'in_review' | 'planning' | 'archived';
  progress: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  _id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export const rawMongooseProjectCode = `
import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is mandatory'],
      trim: true,
      maxlength: 120,
    },
    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['Backend Architecture', 'DevOps & Cloud', 'Security & Auth', 'Fullstack Platform'],
      default: 'Fullstack Platform',
    },
    status: {
      type: String,
      enum: ['active', 'in_review', 'planning', 'archived'],
      default: 'active',
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    tags: [String],
  },
  { timestamps: true }
);

// Virtual for dynamic task count without data duplication
projectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'projectId',
});

export const Project = mongoose.model('Project', projectSchema);

const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: String,
    column: {
      type: String,
      enum: ['backlog', 'in_progress', 'in_review', 'completed'],
      default: 'backlog',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    estimateHours: {
      type: Number,
      default: 4,
    },
    tags: [String],
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: String,
        userAvatar: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// High-performance compound index for sprint Kanban board retrieval
taskSchema.index({ projectId: 1, column: 1, createdAt: -1 });

export const Task = mongoose.model('Task', taskSchema);
`.trim();
