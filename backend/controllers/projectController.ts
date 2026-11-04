import { Request, Response } from 'express';
import db, { generateObjectId } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { sendServerError } from '../middleware/errorMiddleware.js';

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
    sendServerError(res, error, 'Project list');
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

    if (req.user.role !== 'admin' && req.user.role !== 'lead') {
      return res.status(403).json({
        success: false,
        message: 'Only Admins and Leads can create projects.',
      });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { title, key, description, category, tags = [] } = body;

    if (
      typeof title !== 'string' || !title.trim() || title.trim().length > 120 ||
      typeof key !== 'string' || !/^[a-zA-Z][a-zA-Z0-9]{1,9}$/.test(key.trim()) ||
      typeof description !== 'string' || !description.trim() || description.trim().length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: 'Enter a project title (up to 120 characters), a 2–10 character project key, and a description (up to 2,000 characters).',
      });
    }

    if (
      !Array.isArray(tags) || tags.length > 12 ||
      tags.some((tag) => typeof tag !== 'string' || !tag.trim() || tag.trim().length > 32)
    ) {
      return res.status(400).json({ success: false, message: 'Project tags must be a list of up to 12 short labels.' });
    }

    if (category !== undefined && (typeof category !== 'string' || category.trim().length > 64)) {
      return res.status(400).json({ success: false, message: 'Project categories must be 64 characters or fewer.' });
    }

    const upperKey = key.toUpperCase().trim();
    const existingKey = await db.projects.findOne({ key: upperKey });
    if (existingKey) {
      return res.status(409).json({ success: false, message: `Project key '${upperKey}' already exists.` });
    }

    const project = await db.projects.create({
      title: title.trim(),
      key: upperKey,
      description,
      leadId: req.user ? req.user._id : '66a1bf9823e4d5c6b7a89001',
      category: category || 'Fullstack Platform',
      status: 'active',
      progress: 0,
      tags: tags.map((tag) => tag.trim()),
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
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'A project with that key already exists.' });
    }
    sendServerError(res, error, 'Project create');
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
    sendServerError(res, error, 'Project tasks');
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

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const {
      projectId,
      title,
      description,
      column = 'backlog',
      priority = 'medium',
      assigneeId,
      estimateHours = 4,
      tags = [],
      overrideQa,
    } = body;

    if (!projectId || !title) {
      return res.status(400).json({ success: false, message: 'ProjectId and title are required.' });
    }
    if (typeof projectId !== 'string' || typeof title !== 'string' || !title.trim() || title.trim().length > 120) {
      return res.status(400).json({ success: false, message: 'Enter a project and a title up to 120 characters.' });
    }
    if (typeof description !== 'undefined' && (typeof description !== 'string' || description.length > 5000)) {
      return res.status(400).json({ success: false, message: 'Issue descriptions must be 5,000 characters or fewer.' });
    }
    if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Choose a valid issue priority.' });
    }
    if (!Number.isFinite(Number(estimateHours)) || Number(estimateHours) < 0 || Number(estimateHours) > 500) {
      return res.status(400).json({ success: false, message: 'Estimate must be between 0 and 500 hours.' });
    }
    if (
      !Array.isArray(tags) || tags.length > 12 ||
      tags.some((tag) => typeof tag !== 'string' || tag.trim().length > 32)
    ) {
      return res.status(400).json({ success: false, message: 'Issue tags must be a list of up to 12 short labels.' });
    }
    const project = await db.projects.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (overrideQa !== undefined && typeof overrideQa !== 'boolean') {
      return res.status(400).json({ success: false, message: 'The QA override confirmation is invalid.' });
    }
    if (
      column === 'completed' &&
      (req.user.role !== 'admin' || overrideQa !== true)
    ) {
      return res.status(403).json({
        success: false,
        message: req.user.role === 'admin'
          ? 'This issue has no QA pass. Confirm the QA override before shipping.'
          : 'Only QA can pass an issue and move it to Done.',
      });
    }
    if (!['backlog', 'in_progress', 'in_review', 'completed'].includes(column)) {
      return res.status(400).json({ success: false, message: 'Choose a valid initial issue status.' });
    }
    if (
      req.user.role !== 'admin' &&
      column !== undefined &&
      column !== 'backlog'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only Admin can choose an initial issue status. New team issues start in Backlog.',
      });
    }
    const canAssignToTeam = req.user.role === 'admin' || req.user.role === 'lead';
    const verifiedAssigneeId = canAssignToTeam && assigneeId ? assigneeId : req.user._id;
    if (canAssignToTeam) {
      const assignee = await db.users.findById(verifiedAssigneeId);
      if (!assignee) {
        return res.status(400).json({ success: false, message: 'The selected assignee is not a team member.' });
      }
    }

    const task = await db.tasks.create({
      projectId,
      title: title.trim(),
      description: description || '',
      column: req.user.role === 'admin' ? column : 'backlog',
      priority,
      assigneeId: verifiedAssigneeId,
      reporterId: req.user._id,
      estimateHours: Number(estimateHours) || 4,
      tags: tags.map((tag: string) => tag.trim()).filter(Boolean),
      comments: [],
    });

    await db.auditLogs.create({
      action: column === 'completed' ? 'TASK_QA_OVERRIDE_SHIP' : 'TASK_CREATE',
      entityType: 'Task',
      entityId: task._id,
      performedBy: req.user?._id || 'system',
      performedByName: req.user?.name || 'System',
      details: column === 'completed'
        ? `Admin override: created '${task.title}' in Done without a QA pass.`
        : `Created task '${task.title}' in column '${task.column}'`,
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
    sendServerError(res, error, 'Task create');
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
    const updates = req.body && typeof req.body === 'object' ? req.body : {};
    const allowedFields: Record<string, string[]> = {
      admin: ['column', 'priority', 'title', 'description', 'estimateHours', 'tags', 'assigneeId', 'overrideQa'],
      lead: ['column', 'priority', 'assigneeId'],
      developer: ['column'],
      guest: ['priority', 'description', 'tags'],
      qa: [],
    };
    const roleFields = allowedFields[userRole] || [];
    const unsupportedFields = Object.keys(updates).filter((field) => !roleFields.includes(field));
    if (unsupportedFields.length > 0) {
      const message =
        userRole === 'qa'
          ? 'QA must use Pass or Reject on issues in review; other task edits are not permitted.'
          : `Your role cannot update: ${unsupportedFields.join(', ')}.`;
      return res.status(403).json({ success: false, message });
    }

    if (updates.column !== undefined) {
      const columns = ['backlog', 'in_progress', 'in_review', 'completed'];
      if (typeof updates.column !== 'string' || !columns.includes(updates.column)) {
        return res.status(400).json({ success: false, message: 'Choose a valid issue status.' });
      }
    }
    if (updates.priority !== undefined) {
      const priorities = ['low', 'medium', 'high', 'critical'];
      if (typeof updates.priority !== 'string' || !priorities.includes(updates.priority)) {
        return res.status(400).json({ success: false, message: 'Choose a valid issue priority.' });
      }
    }
    if (updates.tags !== undefined && (!Array.isArray(updates.tags) || updates.tags.some((tag: unknown) => typeof tag !== 'string'))) {
      return res.status(400).json({ success: false, message: 'Issue scope tags must be a list of text values.' });
    }
    if (updates.title !== undefined && (typeof updates.title !== 'string' || !updates.title.trim() || updates.title.trim().length > 120)) {
      return res.status(400).json({ success: false, message: 'Issue titles must be between 1 and 120 characters.' });
    }
    if (updates.description !== undefined && (typeof updates.description !== 'string' || updates.description.length > 5000)) {
      return res.status(400).json({ success: false, message: 'Issue descriptions must be 5,000 characters or fewer.' });
    }
    if (updates.tags !== undefined && (updates.tags.length > 12 || updates.tags.some((tag: string) => !tag.trim() || tag.trim().length > 32))) {
      return res.status(400).json({ success: false, message: 'Issue tags must be a list of up to 12 short labels.' });
    }
    if (updates.estimateHours !== undefined && (typeof updates.estimateHours !== 'number' || !Number.isFinite(updates.estimateHours) || updates.estimateHours < 0 || updates.estimateHours > 500)) {
      return res.status(400).json({ success: false, message: 'Estimate must be between 0 and 500 hours.' });
    }

    if (userRole === 'developer' && task.assigneeId !== userId) {
      return res.status(403).json({ success: false, message: 'Developers can only move their own assigned issues.' });
    }
    const nonDoneColumns = ['backlog', 'in_progress', 'in_review'];
    if (
      (userRole === 'lead' || userRole === 'developer') &&
      updates.column !== undefined &&
      (!nonDoneColumns.includes(task.column) || !nonDoneColumns.includes(updates.column))
    ) {
      return res.status(403).json({
        success: false,
        message: userRole === 'lead'
          ? 'Needs QA pass first. Leads can move issues through Backlog, In Progress, and In Review; QA controls returns from review.'
          : 'Developers can move their own issues through Backlog, In Progress, and In Review; QA controls returns from review.',
      });
    }
    if (
      userRole === 'developer' &&
      updates.column === 'completed'
    ) {
      return res.status(403).json({ success: false, message: 'Developers cannot ship issues. Submit them to QA for review first.' });
    }
    if (
      task.column === 'in_review' &&
      updates.column !== undefined &&
      updates.column !== 'in_review' &&
      updates.column !== 'completed' &&
      !isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only QA can reject an issue from In Review, and a rejection reason is required.',
      });
    }
    if (userRole === 'qa' && updates.column !== undefined) {
      return res.status(403).json({ success: false, message: 'Use Pass or Reject with a reason to complete QA review.' });
    }

    if (updates.assigneeId !== undefined) {
      if (typeof updates.assigneeId !== 'string' || !updates.assigneeId) {
        return res.status(400).json({ success: false, message: 'Choose a valid team member to assign this issue to.' });
      }
      const assignee = await db.users.findById(updates.assigneeId);
      if (!assignee) {
        return res.status(400).json({ success: false, message: 'The selected assignee is not a team member.' });
      }
    }

    if (updates.overrideQa !== undefined && typeof updates.overrideQa !== 'boolean') {
      return res.status(400).json({ success: false, message: 'The QA override confirmation is invalid.' });
    }
    const isShippingWithoutQaPass = updates.column === 'completed' && task.column !== 'completed';
    if (isShippingWithoutQaPass && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: userRole === 'lead'
          ? 'Needs QA pass first. Only QA can pass and ship an issue.'
          : 'Only QA can pass an issue and move it to Done.',
      });
    }
    if (isShippingWithoutQaPass && isAdmin && updates.overrideQa !== true) {
      return res.status(403).json({
        success: false,
        message: 'This issue has no QA pass. Confirm the QA override before shipping.',
      });
    }

    const safeUpdates: Record<string, any> = {};
    if (typeof updates.title === 'string') safeUpdates.title = updates.title.trim();
    if (typeof updates.description === 'string') safeUpdates.description = updates.description;
    if (typeof updates.column === 'string') safeUpdates.column = updates.column;
    if (typeof updates.priority === 'string') safeUpdates.priority = updates.priority;
    if (typeof updates.estimateHours === 'number' && Number.isFinite(updates.estimateHours)) {
      safeUpdates.estimateHours = updates.estimateHours;
    }
    if (Array.isArray(updates.tags)) safeUpdates.tags = updates.tags;
    if (isAdmin || userRole === 'lead') {
      if (typeof updates.assigneeId === 'string') safeUpdates.assigneeId = updates.assigneeId;
    }
    if (userRole === 'qa' && task.column === 'in_review' && updates.column === 'completed' && task.rejectionActive) {
      safeUpdates.rejectionActive = false;
    }
    if (Object.keys(safeUpdates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid task changes were provided.' });
    }

    const updated = await db.tasks.findByIdAndUpdate(id, safeUpdates, { new: true });

    if (updates.column && updates.column !== task.column) {
      await db.notifications.create({
        title: `Task Moved to ${updates.column.replace('_', ' ').toUpperCase()}`,
        message: `${req.user?.name || 'Engineer'} moved "${task.title}" to ${updates.column.replace('_', ' ')}.`,
        type: 'task',
        read: false,
        actorName: req.user?.name || 'Engineer',
        actorAvatar: req.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80',
      });

      await db.auditLogs.create({
        action: isShippingWithoutQaPass ? 'TASK_QA_OVERRIDE_SHIP' : 'TASK_MOVE',
        entityType: 'Task',
        entityId: task._id,
        performedBy: req.user?._id || 'system',
        performedByName: req.user?.name || 'System',
        details: isShippingWithoutQaPass
          ? `Admin override: shipped '${task.title}' from ${task.column} to completed without a QA pass.`
          : `Moved '${task.title}' from ${task.column} to ${updates.column}`,
        ipAddress: req.ip || '127.0.0.1',
      });
    }

    res.json({
      success: true,
      message: 'Task updated successfully.',
      task: updated,
    });
  } catch (error: any) {
    sendServerError(res, error, 'Task update');
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

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Enter a reason before rejecting this issue.' });
    }
    if (reason.length > 500) {
      return res.status(400).json({ success: false, message: 'The rejection reason must be 500 characters or fewer.' });
    }

    const validCategories = ['Functional bug', 'Regression', 'Performance', 'Other'] as const;
    const category = body.category;
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
    sendServerError(res, error, 'Task reject');
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
    sendServerError(res, error, 'Task approve');
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
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only an Admin can delete issues.',
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
    sendServerError(res, error, 'Task delete');
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
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { text } = body;

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text cannot be empty.' });
    }
    if (text.trim().length > 2000) {
      return res.status(400).json({ success: false, message: 'Comments must be 2,000 characters or fewer.' });
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
    sendServerError(res, error, 'Task comment');
  }
};

/**
 * @desc    Aggregated analytics via MongoDB aggregation pipelines
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
    sendServerError(res, error, 'Project analytics');
  }
};
