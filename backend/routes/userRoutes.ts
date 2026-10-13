import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getLoginPersonas,
  changePassword,
  logoutUser,
  getUserProfile,
  getUsers,
  getTeamMemberProfile,
  updateUserProfile,
  adminCreateUser,
  updateUserRole,
  deleteUser,
  impersonateUser,
  exitImpersonation,
  getAuditLogs,
  inspectToken,
} from '../controllers/userController.js';
import { protect, authorize, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

// Public authentication & password recovery endpoints
router.get('/personas', getLoginPersonas);
router.post('/register', registerUser);
router.post('/login', loginUser);

// Authenticated session, password change & token endpoints
router.post('/change-password', protect, changePassword);
router.post('/logout', protect, logoutUser);
router.post('/token-inspect', protect, inspectToken);
router.get('/profile', protect, requirePermission('profile.read'), getUserProfile);
router.post('/exit-impersonation', protect, exitImpersonation);

// Team directory (read-only for standard users)
router.get('/', protect, requirePermission('team.read'), getUsers);

// Admin-only security & audit logs
router.get('/audit-logs', protect, authorize('admin'), requirePermission('audit.read'), getAuditLogs);

// Self-profile update with strict IDOR/BOLA protection
router.patch('/:id/profile', protect, requirePermission('profile.update.self'), updateUserProfile);

// Read-only single team member profile
router.get('/:id', protect, requirePermission('team.read'), getTeamMemberProfile);

// Admin-only user management & audited impersonation endpoints
router.post('/', protect, authorize('admin'), requirePermission('users.manage'), adminCreateUser);
router.patch('/:id/role', protect, authorize('admin'), requirePermission('users.manage'), updateUserRole);
router.delete('/:id', protect, authorize('admin'), requirePermission('users.manage'), deleteUser);
router.post(
  '/:id/impersonate',
  protect,
  authorize('admin'),
  requirePermission('users.impersonate'),
  impersonateUser
);

export default router;
