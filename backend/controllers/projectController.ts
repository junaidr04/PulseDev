import { Request, Response } from 'express';
import db, { generateObjectId } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

/**
 * @desc    Get all projects with task counts and lead details
 * @route   GET /api/projects
 * @access  Private
 */
export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await db.projects.find();
    const users = await db.users.find();
    const tasks = await db.tasks.find();

    const userMap = new Map(users.map((u) => [u._id, u]));

    const enriched = projects.map((p) => {
      const projectTasks = tasks.filter((t) => t.projectId === p._id);
      const completedCount = projectTasks.filter((t) => t.column === 'completed').length;
      const progress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;
      const lead = userMap.get(p.leadId);

      return {
        ...p,
        totalTasks: projectTasks.length,
        completedTasks: completedCount,
        progress,
        lead: lead ? { name: lead.name, avatar: lead.avatar, title: lead.title } : null,
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      projects: enriched,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create new project
 * @route   POST /api/projects
 * @access  Private (Admin or Lead only)
 */
export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to create new initiatives.',
      });
    }

    const { title, key, description, category, tags = [] } = req.body;

    if (!title || !key || !description) {
      return res.status(400).json({ success: false, message: 'Title, key, and description are required.' });
    }

    const upperKey = key.toUpperCase().trim();
    const existingKey = await db.projects.findOne({ key: upperKey });
    if (existingKey) {
      return res.status(400).json({ success: false, message: `Project key '${upperKey}' already exists.` });
    }

    const project = await db.projects.create({
      title,
      key: upperKey,
      description,
      leadId: req.user ? req.user._id : '66a1bf9823e4d5c6b7a89001',
      category: category || 'Fullstack Platform',
      status: 'active',
      progress: 0,
      tags: Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim()),
    });

    await db.auditLogs.create({
      action: 'PROJECT_CREATE',
      entityType: 'Project',
      entityId: project._id,
      performedBy: req.user?._id || 'system',
      performedByName: req.user?.name || 'System',
      details: `Created enterprise project: ${project.title} (${project.key})`,
      ipAddress: req.ip || '127.0.0.1',
    });

    await db.notifications.create({
      title: `New Initiative: ${project.key}`,
      message: `${req.user?.name || 'Lead Architect'} launched project "${project.title}".`,
      type: 'project',
      read: false,
      actorName: req.user?.name || 'Lead Architect',
      actorAvatar: req.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80',
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      project,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get project tasks with assignee populated
 * @route   GET /api/projects/:id/tasks
 * @access  Private
 */
export const getProjectTasks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await db.projects.findById(id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const tasks = await db.tasks.find({ projectId: id });
    const users = await db.users.find();
    const userMap = new Map(users.map((u) => [u._id, u]));

    const populated = tasks.map((t) => {
      const assignee = userMap.get(t.assigneeId);
      const reporter = userMap.get(t.reporterId);
      return {
        ...t,
        assignee: assignee ? { _id: assignee._id, name: assignee.name, avatar: assignee.avatar, role: assignee.role } : null,
        reporter: reporter ? { _id: reporter._id, name: reporter.name, avatar: reporter.avatar } : null,
      };
    });

    res.json({
      success: true,
      project,
      tasks: populated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create task
 * @route   POST /api/tasks
 * @access  Private
 */
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { projectId, title, description, column = 'backlog', priority = 'medium', assigneeId, estimateHours = 4, tags = [] } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ success: false, message: 'ProjectId and title are required.' });
    }

    const verifiedAssigneeId = assigneeId || req.user._id;

    const task = await db.tasks.create({
      projectId,
      title,
      description: description || '',
      column: req.user.role === 'admin' ? column : 'backlog',
      priority,
      assigneeId: verifiedAssigneeId,
      reporterId: req.user._id,
      estimateHours: Number(estimateHours) || 4,
      tags: Array.isArray(tags) ? tags : [],
      comments: [],
    });

    await db.auditLogs.create({
      action: 'TASK_CREATE',
      entityType: 'Task',
      entityId: task._id,
      performedBy: req.user?._id || 'system',
      performedByName: req.user?.name || 'System',
      details: `Created task '${task.title}' in column '${task.column}'`,
      ipAddress: req.ip || '127.0.0.1',
    });

    await db.notifications.create({
      title: 'New Sprint Task Logged',
      message: `${req.user?.name || 'Engineer'} added "${task.title}" (${task.priority.toUpperCase()}).`,
      type: 'task',
      read: false,
      actorName: req.user?.name || 'Engineer',
      actorAvatar: req.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80',
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update task (column, priority, assignee, etc.)
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = await db.tasks.findById(id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const userRole = req.user?.role || 'developer';
    const userId = req.user?._id || '';
    const isAdmin = userRole === 'admin';

    if (userRole === 'qa' && task.column === 'in_review' && req.body.column === 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Use the Reject action and provide a reason to return this issue to its owner.',
      });
    }

    // Non-admin users can control their own assigned tasks (or QA verifying in_review tasks)
    if (!isAdmin) {
      const isOwner = task.assigneeId === userId;
      const isQaReviewing = userRole === 'qa' && task.column === 'in_review';

      if (!isOwner && !isQaReviewing) {
        const assigneeUser = await db.users.findById(task.assigneeId);
        return res.status(403).json({
          success: false,
          message: `Access Restricted: This task is assigned to ${assigneeUser?.name || 'another member'}. Only the assigned owner or Admin can control this task.`,
        });
      }

      if ((userRole === 'developer' || userRole === 'lead') && req.body.column === 'completed') {
        return res.status(403).json({
          success: false,
          message: 'Role Restriction: Only QA Lead, Product Manager, or Admin can mark tasks as Done.',
        });
      }
    }

    const safeUpdates: Record<string, any> = {};
    if (typeof req.body.title === 'string') safeUpdates.title = req.body.title;
    if (typeof req.body.description === 'string') safeUpdates.description = req.body.description;
    if (typeof req.body.column === 'string') safeUpdates.column = req.body.column;
    if (typeof req.body.priority === 'string') safeUpdates.priority = req.body.priority;
    if (typeof req.body.estimateHours === 'number') safeUpdates.estimateHours = req.body.estimateHours;
    if (Array.isArray(req.body.tags)) safeUpdates.tags = req.body.tags;
    if (
      userRole === 'qa' &&
      task.column === 'in_review' &&
      req.body.column === 'completed' &&
      task.rejectionActive
    ) {
      safeUpdates.rejectionActive = false;
    }
    if ((isAdmin || userRole === 'lead') && typeof req.body.assigneeId === 'string') {
      safeUpdates.assigneeId = req.body.assigneeId;
    }

    const updated = await db.tasks.findByIdAndUpdate(id, safeUpdates, { new: true });

    if (req.body.column && req.body.column !== task.column) {
      await db.notifications.create({
        title: `Task Moved to ${req.body.column.replace('_', ' ').toUpperCase()}`,
        message: `${req.user?.name || 'Engineer'} moved "${task.title}" to ${req.body.column.replace('_', ' ')}.`,
        type: 'task',
        read: false,
        actorName: req.user?.name || 'Engineer',
        actorAvatar: req.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80',
      });

      await db.auditLogs.create({
        action: 'TASK_MOVE',
        entityType: 'Task',
        entityId: task._id,
        performedBy: req.user?._id || 'system',
        performedByName: req.user?.name || 'System',
        details: `Moved '${task.title}' from ${task.column} to ${req.body.column}`,
        ipAddress: req.ip || '127.0.0.1',
      });
    }

    res.json({
      success: true,
      message: 'Task updated successfully.',
      task: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Reject a task with a required reason and notify its owner and admins
 * @route   POST /api/tasks/:id/reject
 * @access  Private (QA review)
 */
export const rejectTask = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'qa') {
      return res.status(403).json({ success: false, message: 'Only QA can reject an issue.' });
    }

    const { id } = req.params;
    const task = await db.tasks.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    if (task.column !== 'in_review') {
      return res.status(400).json({ success: false, message: 'Only issues in QA review can be rejected.' });
    }

    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Enter a reason before rejecting this issue.' });
    }
    if (reason.length > 500) {
      return res.status(400).json({ success: false, message: 'The rejection reason must be 500 characters or fewer.' });
    }

    const validCategories = ['Functional bug', 'Regression', 'Performance', 'Other'] as const;
    const category = req.body.category;
    if (category !== undefined && category !== '' && !validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Choose a valid rejection category.' });
    }

    const rejectedAt = new Date();
    const rejection = {
      id: generateObjectId(),
      rejectedById: req.user._id,
      rejectedByName: req.user.name,
      rejectedAt,
      reason,
      ...(category ? { category } : {}),
    };
    const comment = {
      id: generateObjectId(),
      userId: req.user._id,
      userName: req.user.name,
      userAvatar: req.user.avatar,
      text: `Rejected this issue: ${reason}${category ? ` (Category: ${category})` : ''}`,
      createdAt: rejectedAt,
    };
    const updated = await db.tasks.findByIdAndUpdate(
      id,
      {
        column: 'in_progress',
        rejectionActive: true,
        rejectionHistory: [...(task.rejectionHistory || []), rejection],
        comments: [...(task.comments || []), comment],
      },
      { new: true }
    );

    const admins = await db.users.find({ role: 'admin' });
    const recipientIds = new Set([task.assigneeId, ...admins.map((admin) => admin._id)]);
    const recipientAvatar =
      req.user.avatar ||
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=64&h=64&q=80';

    for (const recipientId of recipientIds) {
      if (!recipientId) continue;
      await db.notifications.create({
        recipientId,
        title: `Issue rejected: ${task.title}`,
        message: `${req.user.name} rejected "${task.title}". Reason: ${reason}${category ? ` (${category})` : ''}`,
        type: 'task',
        read: false,
        actorName: req.user.name,
        actorAvatar: recipientAvatar,
        link: `/tasks/${task._id}`,
      });
    }

    await db.auditLogs.create({
      action: 'TASK_REJECT',
      entityType: 'Task',
      entityId: task._id,
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: `Rejected '${task.title}': ${reason}${category ? ` (${category})` : ''}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      message: 'Issue rejected and returned to its owner.',
      task: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Approve a task after QA review and notify its owner and admins
 * @route   POST /api/tasks/:id/approve
 * @access  Private (QA review)
 */
export const approveTask = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'qa') {
      return res.status(403).json({ success: false, message: 'Only QA can approve an issue.' });
    }

    const { id } = req.params;
    const task = await db.tasks.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    if (task.column !== 'in_review') {
      return res.status(400).json({ success: false, message: 'Only issues in QA review can be approved.' });
    }

    const updated = await db.tasks.findByIdAndUpdate(
      id,
      { column: 'completed', ...(task.rejectionActive ? { rejectionActive: false } : {}) },
      { new: true }
    );
    const admins = await db.users.find({ role: 'admin' });
    const recipientIds = new Set([task.assigneeId, ...admins.map((admin) => admin._id)]);
    const actorAvatar =
      req.user.avatar ||
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=64&h=64&q=80';

    for (const recipientId of recipientIds) {
      if (!recipientId) continue;
      await db.notifications.create({
        recipientId,
        title: `Issue approved: ${task.title}`,
        message: `${req.user.name} approved "${task.title}" in QA.`,
        type: 'task',
        read: false,
        actorName: req.user.name,
        actorAvatar,
        link: `/tasks/${task._id}`,
      });
    }

    await db.auditLogs.create({
      action: 'TASK_QA_APPROVE',
      entityType: 'Task',
      entityId: task._id,
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: `Approved '${task.title}' in QA`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({ success: true, message: 'Issue approved and marked as done.', task: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role || 'developer';
    if (userRole !== 'admin' && userRole !== 'lead') {
      return res.status(403).json({
        success: false,
        message: 'RBAC Denied: Only Principal Architect (Admin) or Staff Lead can delete tasks.',
      });
    }

    const { id } = req.params;
    const deleted = await db.tasks.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    await db.auditLogs.create({
      action: 'TASK_DELETE',
      entityType: 'Task',
      entityId: id,
      performedBy: req.user?._id || 'system',
      performedByName: req.user?.name || 'System',
      details: `Deleted task '${deleted.title}'`,
      ipAddress: req.ip || '127.0.0.1',
    });

    await db.notifications.create({
      title: 'Issue Removed',
      message: `${req.user?.name || 'Admin'} deleted issue "${deleted.title}".`,
      type: 'task',
      read: false,
      actorName: req.user?.name || 'Admin',
      actorAvatar:
        req.user?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80',
    });

    res.json({
      success: true,
      message: 'Task removed from database.',
      id,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Add comment to task
 * @route   POST /api/tasks/:id/comments
 * @access  Private
 */
export const addTaskComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text cannot be empty.' });
    }

    const task = await db.tasks.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const comment = {
      id: generateObjectId(),
      userId: req.user?._id || '66a1bf9823e4d5c6b7a89001',
      userName: req.user?.name || 'Alex Chen',
      userAvatar: req.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      text: text.trim(),
      createdAt: new Date(),
    };

    const comments = [...(task.comments || []), comment];
    const updated = await db.tasks.findByIdAndUpdate(id, { comments }, { new: true });

    await db.notifications.create({
      title: `New Comment on "${task.title}"`,
      message: `${req.user?.name || 'Teammate'}: "${text.trim()}"`,
      type: 'task',
      read: false,
      actorName: req.user?.name || 'Teammate',
      actorAvatar:
        req.user?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80',
    });

    res.status(201).json({
      success: true,
      comment,
      task: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Aggregated analytics via MongoDB Aggregation Pipeline simulator
 * @route   GET /api/projects/analytics
 * @access  Private
 */
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    // 1. Group tasks by column status
    const columnStats = await db.tasks.aggregate([
      {
        $group: {
          _id: '$column',
          count: { $sum: 1 },
          totalHours: { $sum: '$estimateHours' },
        },
      },
    ]);

    // 2. Group tasks by priority
    const priorityStats = await db.tasks.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    const allTasks = await db.tasks.find();
    const completedTasks = allTasks.filter((t) => t.column === 'completed').length;
    const velocityRate = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

    res.json({
      success: true,
      aggregationQuery: [
        { $match: { isArchived: false } },
        { $group: { _id: '$column', count: { $sum: 1 }, totalHours: { $sum: '$estimateHours' } } },
        { $sort: { count: -1 } },
      ],
      totalTasks: allTasks.length,
      completedTasks,
      velocityRate,
      columnDistribution: columnStats,
      priorityDistribution: priorityStats,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
