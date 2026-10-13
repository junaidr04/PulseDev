import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import db from '../config/db.js';

function resolveJwtSecret(): string {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (configuredSecret) return configuredSecret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured before starting PulseDev in production.');
  }

  const secretPath = path.resolve(process.cwd(), 'backend', 'data', '.jwt-secret');
  fs.mkdirSync(path.dirname(secretPath), { recursive: true });

  try {
    const savedSecret = fs.readFileSync(secretPath, 'utf-8').trim();
    if (savedSecret) return savedSecret;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  try {
    fs.writeFileSync(secretPath, randomBytes(64).toString('hex'), {
      encoding: 'utf-8',
      flag: 'wx',
      mode: 0o600,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }

  const savedSecret = fs.readFileSync(secretPath, 'utf-8').trim();
  if (!savedSecret) throw new Error('The local JWT secret file is empty.');
  return savedSecret;
}

export const JWT_SECRET = resolveJwtSecret();

// Server-side revoked token registry to invalidate sessions immediately upon logout
export const revokedTokens = new Set<string>();

export type Permission =
  | 'profile.read'
  | 'profile.update.self'
  | 'team.read'
  | 'team.manage'
  | 'users.manage'
  | 'users.impersonate'
  | 'audit.read'
  | 'projects.manage'
  | 'tasks.read'
  | 'tasks.write'
  | 'tasks.delete';

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  guest: [
    'profile.read',
    'profile.update.self',
    'team.read',
    'projects.manage',
    'tasks.read',
    'tasks.write',
  ],
  developer: [
    'profile.read',
    'profile.update.self',
    'team.read',
    'projects.manage',
    'tasks.read',
    'tasks.write',
  ],
  qa: [
    'profile.read',
    'profile.update.self',
    'team.read',
    'projects.manage',
    'tasks.read',
    'tasks.write',
  ],
  lead: [
    'profile.read',
    'profile.update.self',
    'team.read',
    'team.manage',
    'projects.manage',
    'tasks.read',
    'tasks.write',
    'tasks.delete',
  ],
  admin: [
    'profile.read',
    'profile.update.self',
    'team.read',
    'team.manage',
    'users.manage',
    'users.impersonate',
    'audit.read',
    'projects.manage',
    'tasks.read',
    'tasks.write',
    'tasks.delete',
  ],
};

export const getPermissionsForRole = (role: string): Permission[] => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.guest;
};

export interface AuthRequest extends Request {
  user?: any;
  token?: string;
  impersonatedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

/**
 * Protect Middleware (Authentication: "Who is this user?")
 * Determines authenticated user strictly from the verified JWT Bearer token or HttpOnly cookie.
 * Never trusts userId, role, or email sent in request body/query/headers.
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (req.headers.cookie) {
    const match = req.headers.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('pulsedev_jwt='));
    if (match) {
      token = decodeURIComponent(match.split('=')[1]);
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No valid Bearer token or session cookie provided.',
      code: 'AUTH_TOKEN_MISSING',
    });
  }

  if (revokedTokens.has(token)) {
    return res.status(401).json({
      success: false,
      message: 'Session has been logged out and invalidated. Please sign in again.',
      code: 'TOKEN_REVOKED',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
      impersonatedBy?: { id: string; name: string; email: string; role: string };
      iat: number;
      exp: number;
    };

    // Always load authenticated user from database using the verified token's subject ID
    const user = await db.users.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists in database.',
        code: 'USER_NOT_FOUND',
      });
    }

    const { password, ...sanitizedUser } = user;
    const permissions = getPermissionsForRole(sanitizedUser.role);

    req.user = {
      ...sanitizedUser,
      permissions,
      impersonatedBy: decoded.impersonatedBy || null,
    };
    req.token = token;
    req.impersonatedBy = decoded.impersonatedBy || null;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your authentication token has expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt,
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token verification failed. Invalid cryptographic signature.',
      code: 'TOKEN_INVALID',
    });
  }
};

/**
 * Authorize (RBAC Role Check) Middleware (Authorization: "What is this user allowed to do?")
 * Restricts access to specific server-verified user roles.
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to role evaluation.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `403 Forbidden: User role '${req.user.role}' is not permitted to access this resource. Required role: [${roles.join(', ')}].`,
        code: 'RBAC_FORBIDDEN',
      });
    }

    next();
  };
};

/**
 * Granular Permission Middleware
 * Validates that the authenticated user's server-derived role grants all required permissions.
 */
export const requirePermission = (...requiredPermissions: Permission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to permission evaluation.',
      });
    }

    const userPermissions: Permission[] = getPermissionsForRole(req.user.role);
    const missing = requiredPermissions.filter((p) => !userPermissions.includes(p));

    if (missing.length > 0) {
      return res.status(403).json({
        success: false,
        message: `403 Forbidden: Missing required permission(s): [${missing.join(', ')}].`,
        code: 'PERMISSION_DENIED',
      });
    }

    next();
  };
};

/**
 * Raw Code snippet for Interview Architecture Inspector
 */
export const rawAuthMiddlewareCode = `
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Bearer token missing.',
    });
  }

  try {
    // 1. Verify token signature with JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Always derive identity from verified token ID in database
    const currentUser = await User.findById(decoded.id).select('-password');
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    // 3. Grant access: attach verified user to req object
    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token validation failed.',
      error: err.message,
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: \`User role '\${req.user.role}' is unauthorized for this endpoint.\`,
      });
    }
    next();
  };
};
`;
