import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { sendServerError } from '../middleware/errorMiddleware.js';
import {
  JWT_SECRET,
  AuthRequest,
  revokedTokens,
  getPermissionsForRole,
} from '../middleware/authMiddleware.js';
import {
  getDemoAccountMutationMessage,
  isDemoAccountEmail,
} from '../config/demoAccounts.js';

// Generate JWT Helper
export const generateToken = (
  id: string,
  email: string,
  role: string,
  expiresIn: string = '7d'
): string => {
  return jwt.sign({ id, email, role }, JWT_SECRET, {
    expiresIn: expiresIn as any,
    issuer: 'pulsedev-mern-auth-authority',
  });
};

const setSessionCookie = (res: Response, token: string, maxAgeMs = 7 * 24 * 60 * 60 * 1000) => {
  res.cookie('pulsedev_jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeMs,
    path: '/',
  });
};

/**
 * @desc    Register a new user (Public self-registration cannot self-assign 'admin')
 * @route   POST /api/users/register
 * @access  Public
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const {
      name: rawName,
      email: rawEmail,
      password,
      department = 'Engineering',
      title = 'Software Engineer',
    } = body;

    const name = typeof rawName === 'string' ? rawName.trim() : '';
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    if (!name || !email || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Name, email, and password are required fields.',
      });
    }

    if (name.length > 80 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid name and email address.' });
    }
    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Password must be between 6 and 128 characters long.',
      });
    }

    if (isDemoAccountEmail(email)) {
      return res.status(403).json({
        success: false,
        message: 'Demo account email addresses are reserved.',
      });
    }

    const existing = await db.users.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists. Code: 11000 (Duplicate Key).',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.users.create({
      name,
      email,
      password: hashedPassword,
      role: 'developer',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      title,
      department,
      status: 'online',
    });

    const token = generateToken(newUser._id, newUser.email, newUser.role);
    setSessionCookie(res, token);

    await db.auditLogs.create({
      action: 'USER_REGISTER',
      entityType: 'User',
      entityId: newUser._id,
      performedBy: newUser._id,
      performedByName: newUser.name,
      details: `New account registered with role: ${newUser.role}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    await db.notifications.create({
      title: 'New Account Registered',
      message: `${newUser.name} registered as ${newUser.role.toUpperCase()} (${newUser.department}).`,
      type: 'auth',
      read: false,
      actorName: newUser.name,
      actorAvatar: newUser.avatar,
    });

    const { password: _, ...userSafe } = newUser;

    res.status(201).json({
      success: true,
      message: 'User registered successfully and JWT bearer token issued.',
      token,
      user: {
        ...userSafe,
        permissions: getPermissionsForRole(userSafe.role),
      },
    });
  } catch (error: any) {
    sendServerError(res, error, 'User register');
  }
};

/**
 * @desc    Authenticate user & issue signed JWT token + HttpOnly cookie
 * @route   POST /api/users/login
 * @access  Public
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password || email.length > 254 || password.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid email address and password.',
      });
    }

    const user = await db.users.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email or password is incorrect.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email or password is incorrect.',
      });
    }

    const token = generateToken(user._id, user.email, user.role);
    setSessionCookie(res, token);

    await db.auditLogs.create({
      action: 'USER_LOGIN',
      entityType: 'Auth',
      entityId: user._id,
      performedBy: user._id,
      performedByName: user.name,
      details: 'Successful JWT credentials verification.',
      ipAddress: req.ip || '127.0.0.1',
    });

    await db.notifications.create({
      title: 'User Login Notice',
      message: `${user.name} (${user.role.toUpperCase()}) authenticated from ${req.ip || '127.0.0.1'}.`,
      type: 'auth',
      read: false,
      actorName: user.name,
      actorAvatar: user.avatar,
    });

    const { password: _, ...userSafe } = user;

    res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        ...userSafe,
        permissions: getPermissionsForRole(userSafe.role),
      },
    });
  } catch (error: any) {
    sendServerError(res, error, 'User login');
  }
};

/**
 * @desc    Public endpoint: List workspace accounts for the login selector
 * @route   GET /api/users/personas
 * @access  Public
 */
export const getLoginPersonas = async (_req: Request, res: Response) => {
  try {
    const users = await db.users.find();
    // Sort so the 5 core accounts appear in canonical order first
    const coreOrder = [
      'alex.chen@pulsedev.io',
      'priya.patel@pulsedev.io',
      'marcus.vance@pulsedev.io',
      'sophia.laurent@pulsedev.io',
      'jordan.blake@pulsedev.io',
    ];
    const sorted = users.filter((user) => coreOrder.includes(user.email.toLowerCase())).sort((a, b) => {
      const idxA = coreOrder.indexOf(a.email.toLowerCase());
      const idxB = coreOrder.indexOf(b.email.toLowerCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

    const personas = sorted.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      title: u.title,
      department: u.department,
      avatar: u.avatar,
    }));

    res.json({
      success: true,
      personas,
    });
  } catch (error: any) {
    sendServerError(res, error, 'Login personas');
  }
};

/**
 * @desc    Change password for authenticated user
 * @route   POST /api/users/change-password
 * @access  Private (Bearer JWT required)
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userDoc = await db.users.findById(req.user._id);
    if (!userDoc) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }
    const demoPasswordMessage = getDemoAccountMutationMessage(userDoc, 'password');
    if (demoPasswordMessage) {
      return res.status(403).json({ success: false, message: demoPasswordMessage });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { currentPassword, newPassword } = body;
    if (typeof currentPassword !== 'string' || !currentPassword || typeof newPassword !== 'string' || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your current password and new password.',
      });
    }

    if (newPassword.trim().length < 6 || newPassword.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'New password must be between 6 and 128 characters long.',
      });
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, userDoc.password);

    if (!isCurrentValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect. Double-check it and try again.',
      });
    }

    const cleanNewPassword = String(newPassword).trim();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanNewPassword, salt);

    await db.users.findByIdAndUpdate(userDoc._id, {
      password: hashedPassword,
    });

    await db.auditLogs.create({
      action: 'PASSWORD_CHANGED',
      entityType: 'Auth',
      entityId: userDoc._id,
      performedBy: userDoc._id,
      performedByName: userDoc.name,
      details: `${userDoc.name} (${userDoc.role}) updated their account password.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    await db.notifications.create({
      title: 'Password Updated',
      message: `${userDoc.name} changed their workspace password.`,
      type: 'auth',
      read: false,
      actorName: userDoc.name,
      actorAvatar: userDoc.avatar,
    });

    res.json({
      success: true,
      message: 'Your password has been changed successfully.',
    });
  } catch (error: any) {
    sendServerError(res, error, 'Password change');
  }
};

/**
 * @desc    Log out current session & revoke JWT token server-side
 * @route   POST /api/users/logout
 * @access  Private
 */
export const logoutUser = async (req: AuthRequest, res: Response) => {
  try {
    if (req.token) {
      revokedTokens.add(req.token);
    }
    res.clearCookie('pulsedev_jwt', { path: '/' });

    if (req.user) {
      await db.auditLogs.create({
        action: 'USER_LOGOUT',
        entityType: 'Auth',
        entityId: req.user._id,
        performedBy: req.user._id,
        performedByName: req.user.name,
        details: 'User logged out; session token revoked.',
        ipAddress: req.ip || '127.0.0.1',
      });
    }

    res.json({
      success: true,
      message: 'Session invalidated and token revoked.',
    });
  } catch (error: any) {
    sendServerError(res, error, 'Session logout');
  }
};

/**
 * @desc    Get current authenticated user profile from verified token
 * @route   GET /api/users/profile
 * @access  Private (Bearer JWT required)
 */
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }
  res.json({
    success: true,
    user: {
      ...req.user,
      permissions: getPermissionsForRole(req.user.role),
    },
  });
};

/**
 * @desc    Get all team members (read-only directory info)
 * @route   GET /api/users & GET /api/team-members
 * @access  Private (team.read)
 */
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await db.users.find();
    const safeUsers = users.map(({ password, ...u }) => ({
      ...u,
      permissions: getPermissionsForRole(u.role),
    }));
    res.json({
      success: true,
      count: safeUsers.length,
      users: safeUsers,
    });
  } catch (error) {
    sendServerError(res, error, 'Team directory');
  }
};

/**
 * @desc    Get a specific team member's public directory profile (Read-Only)
 *          Never authenticates or switches the current user into this profile.
 * @route   GET /api/users/:id
 * @access  Private (team.read)
 */
export const getTeamMemberProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const member = await db.users.findById(id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member profile not found.',
      });
    }

    const { password: _, ...safeMember } = member;
    const assignedTasks = await db.tasks.find({ assigneeId: member._id });

    res.json({
      success: true,
      profile: {
        ...safeMember,
        permissions: getPermissionsForRole(safeMember.role),
        assignedTaskCount: assignedTasks.length,
        assignedTasks: assignedTasks.map((t) => ({
          _id: t._id,
          title: t.title,
          column: t.column,
          priority: t.priority,
        })),
      },
      viewedBy: req.user?._id,
    });
  } catch (error: any) {
    sendServerError(res, error, 'Team member profile');
  }
};

/**
 * @desc    Update user's own profile (Enforces IDOR/BOLA protection)
 * @route   PATCH /api/users/:id/profile
 * @access  Private (profile.update.self)
 */
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const targetId = req.params.id;
    const authenticatedUserId = req.user?._id;
    const isAdmin = req.user?.role === 'admin';

    // Strict IDOR / BOLA check: A user cannot modify another user's account by changing :id
    if (targetId !== authenticatedUserId && !isAdmin) {
      await db.auditLogs.create({
        action: 'IDOR_BLOCKED',
        entityType: 'User',
        entityId: targetId,
        performedBy: authenticatedUserId || 'unknown',
        performedByName: req.user?.name || 'Unknown',
        details: `Blocked unauthorized attempt by ${req.user?.email} to modify user ID ${targetId}`,
        ipAddress: req.ip || '127.0.0.1',
      });

      return res.status(403).json({
        success: false,
        message:
          '403 Forbidden (IDOR Protection): You are not authorized to modify another team member’s account.',
        code: 'IDOR_FORBIDDEN',
      });
    }

    const existing = await db.users.findById(targetId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (
      typeof body.email === 'string' &&
      body.email.trim().toLowerCase() !== existing.email.trim().toLowerCase()
    ) {
      const demoEmailMessage = getDemoAccountMutationMessage(existing, 'email');
      if (demoEmailMessage) {
        return res.status(403).json({ success: false, message: demoEmailMessage });
      }
    }

    // Never allow role, email, _id, or password mutation through profile update.
    const allowedUpdates: Record<string, any> = {};
    if (typeof body.name === 'string' && body.name.trim() && body.name.trim().length <= 80) {
      allowedUpdates.name = body.name.trim();
    }
    if (typeof body.title === 'string' && body.title.trim() && body.title.trim().length <= 120) {
      allowedUpdates.title = body.title.trim();
    }
    if (typeof body.department === 'string' && body.department.trim() && body.department.trim().length <= 80) {
      allowedUpdates.department = body.department.trim();
    }
    if (typeof body.status === 'string' && ['online', 'away', 'busy', 'offline'].includes(body.status)) {
      allowedUpdates.status = body.status;
    }

    const updated = await db.users.findByIdAndUpdate(targetId, allowedUpdates, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { password: _, ...safeUser } = updated;

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        ...safeUser,
        permissions: getPermissionsForRole(safeUser.role),
      },
    });
  } catch (error: any) {
    sendServerError(res, error, 'Profile update');
  }
};

/**
 * @desc    Admin-only: Create a new team member
 * @route   POST /api/users
 * @access  Private (Admin / users.manage)
 */
export const adminCreateUser = async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const {
      name: rawName,
      email: rawEmail,
      password,
      role = 'developer',
      title = 'Software Engineer',
      department = 'Engineering',
    } = body;
    const name = typeof rawName === 'string' ? rawName.trim() : '';
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    const validRoles = ['admin', 'lead', 'developer', 'qa', 'guest'];

    if (!name || !email || name.length > 80 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid name and email address.',
      });
    }
    if (isDemoAccountEmail(email)) {
      return res.status(403).json({
        success: false,
        message: 'Demo account email addresses are reserved.',
      });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Set an initial password between 8 and 128 characters.' });
    }
    if (typeof role !== 'string' || !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Choose a valid workspace role.' });
    }
    if (typeof title !== 'string' || title.trim().length > 120 || typeof department !== 'string' || department.trim().length > 80) {
      return res.status(400).json({ success: false, message: 'Title and department must be short text values.' });
    }

    const existing = await db.users.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const created = await db.users.create({
      name,
      email,
      password: hashedPassword,
      role: role as any,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      title: title.trim(),
      department: department.trim(),
      status: 'online',
    });

    await db.auditLogs.create({
      action: 'ADMIN_USER_CREATE',
      entityType: 'User',
      entityId: created._id,
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: `Admin ${req.user.name} created user ${created.name} (${created.role})`,
      ipAddress: req.ip || '127.0.0.1',
    });

    const { password: _, ...safeUser } = created;
    res.status(201).json({
      success: true,
      user: safeUser,
    });
  } catch (error: any) {
    sendServerError(res, error, 'Admin user create');
  }
};

/**
 * @desc    Admin-only: Update a user's RBAC role
 * @route   PATCH /api/users/:id/role
 * @access  Private (Admin / users.manage)
 */
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { role } = body;
    const validRoles = ['admin', 'lead', 'developer', 'qa', 'guest'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    const targetUser = await db.users.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }
    const demoRoleMessage = getDemoAccountMutationMessage(targetUser, 'role');
    if (demoRoleMessage) {
      return res.status(403).json({ success: false, message: demoRoleMessage });
    }

    const previousRole = targetUser.role;
    const updated = await db.users.findByIdAndUpdate(id, { role: role as any }, { new: true });

    await db.auditLogs.create({
      action: 'ROLE_UPDATED',
      entityType: 'User',
      entityId: id,
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: `Changed ${targetUser.name}'s role from '${previousRole}' to '${role}'`,
      ipAddress: req.ip || '127.0.0.1',
    });

    const { password: _, ...safeUser } = updated!;
    res.json({
      success: true,
      message: `Updated ${safeUser.name}'s role to ${role}.`,
      user: {
        ...safeUser,
        permissions: getPermissionsForRole(safeUser.role),
      },
    });
  } catch (error: any) {
    sendServerError(res, error, 'User role update');
  }
};

/**
 * @desc    Admin-only: Delete a user account
 * @route   DELETE /api/users/:id
 * @access  Private (Admin / users.manage)
 */
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user._id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own active administrator account.',
      });
    }

    const targetUser = await db.users.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }
    const demoDeletionMessage = getDemoAccountMutationMessage(targetUser, 'deletion');
    if (demoDeletionMessage) {
      return res.status(403).json({ success: false, message: demoDeletionMessage });
    }

    await db.users.findByIdAndDelete(id);

    await db.auditLogs.create({
      action: 'ADMIN_USER_DELETE',
      entityType: 'User',
      entityId: id,
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: `Admin ${req.user.name} deleted user ${targetUser.name} (${targetUser.email})`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      message: `User ${targetUser.name} removed.`,
      id,
    });
  } catch (error: any) {
    sendServerError(res, error, 'User delete');
  }
};

/**
 * @desc    Get user activity & security audit logs (Admin only)
 * @route   GET /api/users/audit-logs
 * @access  Private (Admin only)
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const rawLogs = await db.auditLogs.find();
    const allUsers = await db.users.find();
    const userMap = new Map(allUsers.map((u) => [u._id, u]));

    const enrichedLogs = rawLogs.map((log: any) => {
      const matchedUser =
        userMap.get(log.performedBy) ||
        allUsers.find((u) => u.name === log.performedByName);

      const eventDate = log.createdAt || log.timestamp;

      return {
        ...log,
        userId: log.performedBy || matchedUser?._id,
        userName: log.userName || log.performedByName || matchedUser?.name || 'Unknown user',
        userEmail: log.userEmail || matchedUser?.email || '',
        userRole: log.userRole || matchedUser?.role || 'unknown',
        userAvatar: log.userAvatar || matchedUser?.avatar || '',
        userDepartment: matchedUser?.department || '',
        details: log.details || '',
        ipAddress: log.ipAddress || '',
        userAgent: log.userAgent || '',
        timestamp: eventDate,
        createdAt: eventDate,
      };
    });

    res.json({
      success: true,
      count: enrichedLogs.length,
      logs: enrichedLogs,
    });
  } catch (error: any) {
    sendServerError(res, error, 'Audit log list');
  }
};

/**
 * @desc    Inspect and decode JWT token with technical breakdown
 * @route   POST /api/users/token-inspect
 * @access  Private
 */
export const inspectToken = async (req: AuthRequest, res: Response) => {
  const token = req.token;

  if (!token) {
    return res.status(400).json({ success: false, message: 'No token provided to inspect.' });
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Malformed JWT. A valid JWT must consist of three dot-separated Base64Url parts.',
      });
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    const isValid = (() => {
      try {
        jwt.verify(token, JWT_SECRET);
        return !revokedTokens.has(token);
      } catch {
        return false;
      }
    })();

    res.json({
      success: true,
      structure: {
        header,
        payload,
        signature: '[REDACTED]',
        issuedAt: new Date(payload.iat * 1000).toISOString(),
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        isExpired: Date.now() >= payload.exp * 1000,
        isValidSignature: isValid,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'The current session token could not be inspected.' });
  }
};
