import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import {
  JWT_SECRET,
  AuthRequest,
  revokedTokens,
  getPermissionsForRole,
} from '../middleware/authMiddleware.js';

export interface ImpersonationClaim {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Generate JWT Helper
export const generateToken = (
  id: string,
  email: string,
  role: string,
  impersonatedBy?: ImpersonationClaim | null,
  expiresIn: string = '7d'
): string => {
  const payload: Record<string, any> = { id, email, role };
  if (impersonatedBy) {
    payload.impersonatedBy = impersonatedBy;
  }
  return jwt.sign(payload, JWT_SECRET, {
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
    const {
      name,
      email,
      password,
      department = 'Engineering',
      title = 'Software Engineer',
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Name, email, and password are required fields.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const existing = await db.users.findOne({ email: email.toLowerCase() });
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
      email: email.toLowerCase(),
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
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during user registration.',
    });
  }
};

/**
 * @desc    Authenticate user & issue signed JWT token + HttpOnly cookie
 * @route   POST /api/users/login
 * @access  Public
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    let user = await db.users.findOne({ email: email.toLowerCase() });
    if (
      !user &&
      (email.toLowerCase() === 'jordan.blake@pulsedev.io' ||
        email.toLowerCase() === 'interview.demo@pulsedev.io')
    ) {
      user = await db.users.findOne({ role: 'guest' });
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found with specified email.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password for this account. Please check your password or use "Forgot password?" to reset it.',
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
        impersonatedBy: null,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during user login.',
    });
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
    const sorted = [...users].sort((a, b) => {
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
    res.status(500).json({ success: false, message: error.message });
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

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your current password and new password.',
      });
    }

    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const userDoc = await db.users.findById(req.user._id);
    if (!userDoc) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, userDoc.password);

    if (!isCurrentValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect. If you forgot it, use the Reset Password option.',
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
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change password.',
    });
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
    res.status(500).json({ success: false, message: error.message });
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
      impersonatedBy: req.impersonatedBy || null,
    },
  });
};

/**
 * @desc    Get all team members (read-only directory info)
 * @route   GET /api/users & GET /api/team-members
 * @access  Private (team.read)
 */
export const getUsers = async (req: AuthRequest, res: Response) => {
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
    res.status(500).json({ success: false, message: error.message });
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

    // Never allow role, email, _id, or password mutation through profile update
    const allowedUpdates: Record<string, any> = {};
    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      allowedUpdates.name = req.body.name.trim();
    }
    if (typeof req.body.title === 'string' && req.body.title.trim()) {
      allowedUpdates.title = req.body.title.trim();
    }
    if (typeof req.body.department === 'string' && req.body.department.trim()) {
      allowedUpdates.department = req.body.department.trim();
    }
    if (
      typeof req.body.status === 'string' &&
      ['online', 'away', 'busy', 'offline'].includes(req.body.status)
    ) {
      allowedUpdates.status = req.body.status;
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
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Admin-only: Create a new team member
 * @route   POST /api/users
 * @access  Private (Admin / users.manage)
 */
export const adminCreateUser = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      email,
      password = 'password123',
      role = 'developer',
      title = 'Software Engineer',
      department = 'Engineering',
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required to create a user.',
      });
    }

    const existing = await db.users.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const created = await db.users.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role as any,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      title,
      department,
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
    res.status(500).json({ success: false, message: error.message });
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
    const { role } = req.body;
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Admin-only: Start temporary, audited user impersonation session
 * @route   POST /api/users/:id/impersonate
 * @access  Private (Admin / users.impersonate)
 */
export const impersonateUser = async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const { confirmed, reason = 'Administrative support & permission verification' } = req.body;

    if (!confirmed) {
      return res.status(400).json({
        success: false,
        message: 'Explicit confirmation (confirmed: true) is required before starting impersonation.',
      });
    }

    if (targetUserId === req.user._id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot impersonate your own account.',
      });
    }

    const targetUser = await db.users.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user to impersonate was not found.',
      });
    }

    const impersonatedBy: ImpersonationClaim = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    };

    // Issue temporary 30-minute impersonation token
    const impersonationToken = generateToken(
      targetUser._id,
      targetUser.email,
      targetUser.role,
      impersonatedBy,
      '30m'
    );
    setSessionCookie(res, impersonationToken, 30 * 60 * 1000);

    await db.auditLogs.create({
      action: 'ADMIN_IMPERSONATE_START',
      entityType: 'Auth',
      entityId: targetUser._id,
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: `Admin ${req.user.name} (${req.user.email}) started impersonating ${targetUser.name} (${targetUser.email}). Reason: ${reason}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    const { password: _, ...safeTarget } = targetUser;

    res.json({
      success: true,
      message: `Now viewing application as ${safeTarget.name} (Temporary Admin Impersonation).`,
      token: impersonationToken,
      user: {
        ...safeTarget,
        permissions: getPermissionsForRole(safeTarget.role),
        impersonatedBy,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Exit active admin impersonation session and restore original admin account
 * @route   POST /api/users/exit-impersonation
 * @access  Private
 */
export const exitImpersonation = async (req: AuthRequest, res: Response) => {
  try {
    const impersonator = req.impersonatedBy || req.user?.impersonatedBy;
    if (!impersonator || !impersonator.id) {
      return res.status(400).json({
        success: false,
        message: 'No active impersonation session found on current token.',
      });
    }

    const adminUser = await db.users.findById(impersonator.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Original administrator account could not be verified.',
      });
    }

    if (req.token) {
      revokedTokens.add(req.token);
    }

    const restoredToken = generateToken(adminUser._id, adminUser.email, adminUser.role);
    setSessionCookie(res, restoredToken);

    await db.auditLogs.create({
      action: 'ADMIN_IMPERSONATE_END',
      entityType: 'Auth',
      entityId: req.user._id,
      performedBy: adminUser._id,
      performedByName: adminUser.name,
      details: `Admin ${adminUser.name} exited impersonation of ${req.user.name}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    const { password: _, ...safeAdmin } = adminUser;

    res.json({
      success: true,
      message: `Exited impersonation. Restored session as ${safeAdmin.name}.`,
      token: restoredToken,
      user: {
        ...safeAdmin,
        permissions: getPermissionsForRole(safeAdmin.role),
        impersonatedBy: null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
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

      const validDate = log.createdAt || log.timestamp || new Date().toISOString();

      return {
        ...log,
        userId: log.performedBy || matchedUser?._id || '1',
        userName: log.userName || log.performedByName || matchedUser?.name || 'Alex Chen',
        userEmail: log.userEmail || matchedUser?.email || 'alex.chen@pulsedev.io',
        userRole: log.userRole || matchedUser?.role || 'admin',
        userAvatar:
          log.userAvatar ||
          matchedUser?.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80',
        userDepartment: matchedUser?.department || 'Engineering',
        details: log.details || 'Authenticated session via JWT',
        ipAddress: log.ipAddress || '127.0.0.1',
        userAgent: log.userAgent || 'Chrome 134 / macOS Workspace Client',
        timestamp: validDate,
        createdAt: validDate,
      };
    });

    res.json({
      success: true,
      count: enrichedLogs.length,
      logs: enrichedLogs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Inspect and decode JWT token with technical breakdown
 * @route   POST /api/users/token-inspect
 * @access  Private
 */
export const inspectToken = async (req: Request, res: Response) => {
  const token = req.body.token || req.headers.authorization?.replace('Bearer ', '');

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
      token,
      structure: {
        header,
        payload,
        signature: parts[2].substring(0, 16) + '...[REDACTED_HMAC_SHA256]',
        issuedAt: new Date(payload.iat * 1000).toISOString(),
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        isExpired: Date.now() >= payload.exp * 1000,
        isValidSignature: isValid,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Failed to decode token: ' + error.message });
  }
};
